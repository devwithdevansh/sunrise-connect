import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:get/get.dart';
import '../../../../data/models/payment_model.dart';
import '../../../../data/repositories/receipt_repository.dart';
import '../../../dashboard/controllers/dashboard_controller.dart';

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT GROUP  — payments made in the same transaction (same date+minute)
//                  are bundled into one "receipt group"
// ─────────────────────────────────────────────────────────────────────────────

class PaymentGroup {
  /// The individual payments that belong to this receipt batch.
  final List<PaymentModel> items;

  /// Receipt / transaction ID shared by the batch (first item's txn id).
  final String transactionId;

  /// Timestamp of the payment (truncated to the minute for grouping).
  final DateTime paidAt;

  /// Total amount of all items in this group.
  double get totalAmount => items.fold(0.0, (s, p) => s + p.amount);

  /// Comma-separated term names for display.
  String get termSummary => items
      .map((p) => p.termName)
      .where((t) => t.isNotEmpty)
      .toSet()
      .join(', ');

  /// Single label when all items share the same category, else "Mixed".
  String get categoryLabel {
    final labels = items.map((p) => p.categoryLabel).toSet();
    return labels.length == 1 ? labels.first : 'Multiple';
  }

  bool get isTransport => items.every((p) => p.isTransport);

  /// Month-year label for section headers (e.g. "June 2026").
  String get monthLabel {
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    return '${months[paidAt.month - 1]} ${paidAt.year}';
  }

  const PaymentGroup({
    required this.items,
    required this.transactionId,
    required this.paidAt,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

class PaymentHistoryController extends GetxController {
  final ReceiptRepository _receiptRepo = ReceiptRepository();

  final isLoading = true.obs;

  /// Raw payments from API.
  final payments = <PaymentModel>[].obs;

  /// Payments grouped by transaction batch (same txn id OR same minute).
  final RxList<PaymentGroup> paymentGroups = <PaymentGroup>[].obs;

  @override
  void onInit() {
    super.onInit();
    loadPaymentHistory();
  }

  // ── Grouping logic ─────────────────────────────────────────────────────────

  /// Groups [raw] payments into batches.
  /// Primary grouping key: transactionId (if non-empty and same).
  /// Fallback grouping key: same paymentDate truncated to the minute.
  /// Each group is sorted by academic month order.
  List<PaymentGroup> _groupPayments(List<PaymentModel> raw) {
    // Sort raw by date descending (newest first)
    final sorted = List<PaymentModel>.from(raw)
      ..sort((a, b) => b.paymentDate.compareTo(a.paymentDate));

    final Map<String, List<PaymentModel>> buckets = {};

    for (final p in sorted) {
      // Build a grouping key
      final String key;
      if (p.transactionId.isNotEmpty) {
        // Same transaction ID → same receipt
        key = 'txn:${p.transactionId}';
      } else {
        // No txn id → group by date truncated to the minute
        final dt = DateTime.tryParse(p.paymentDate) ?? DateTime.now();
        final minuteKey = '${dt.year}-${dt.month}-${dt.day}-${dt.hour}-${dt.minute}';
        key = 'min:$minuteKey';
      }
      buckets.putIfAbsent(key, () => []).add(p);
    }

    final groups = buckets.entries.map((e) {
      final items = e.value;
      final dt    = DateTime.tryParse(items.first.paymentDate) ?? DateTime.now();
      return PaymentGroup(
        items:         items,
        transactionId: items.first.transactionId,
        paidAt:        dt,
      );
    }).toList()
      // Sort groups: newest first
      ..sort((a, b) => b.paidAt.compareTo(a.paidAt));

    return groups;
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  Future<void> loadPaymentHistory({bool forceRefresh = false}) async {
    final dashCtrl = Get.find<DashboardController>();
    final sId      = dashCtrl.student.value?.id ?? '';
    if (sId.isEmpty) { isLoading.value = false; return; }

    final prefs        = await SharedPreferences.getInstance();
    final cacheKey     = 'payments_cache_$sId';
    final timeKey      = 'payments_time_$sId';
    final cachedStr    = prefs.getString(cacheKey);
    final cachedTime   = prefs.getInt(timeKey) ?? 0;
    final nowMs        = DateTime.now().millisecondsSinceEpoch;
    final isCacheFresh = (nowMs - cachedTime) < 5 * 60 * 1000;

    if (!forceRefresh && cachedStr != null && cachedStr.isNotEmpty) {
      try {
        final decoded = json.decode(cachedStr) as List;
        final list    = decoded
            .map((item) => PaymentModel.fromJson(item as Map<String, dynamic>))
            .toList();
        payments.assignAll(list);
        paymentGroups.assignAll(_groupPayments(list));
        if (isCacheFresh) { isLoading.value = false; return; }
      } catch (e) {
        debugPrint('Error loading payments from cache: $e');
      }
    }

    isLoading.value = true;
    try {
      final ledgerIds = dashCtrl.fees.map((f) => f.id).toList();
      final list      = await _receiptRepo.getPaymentsForLedgers(ledgerIds);
      payments.assignAll(list);
      paymentGroups.assignAll(_groupPayments(list));

      await prefs.setString(cacheKey, json.encode(list.map((p) => p.toJson()).toList()));
      await prefs.setInt(timeKey, nowMs);
    } catch (e) {
      debugPrint('Error loading payment history: $e');
    } finally {
      isLoading.value = false;
    }
  }
}
