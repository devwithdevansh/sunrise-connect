import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:get/get.dart';
import '../../../../data/models/receipt_model.dart';
import '../../../../data/repositories/receipt_repository.dart';
import '../../../dashboard/controllers/dashboard_controller.dart';

// ─────────────────────────────────────────────────────────────────────────────
// RECEIPT GROUP  — receipts with the same receipt number (or same txn minute)
//                  are merged into a single downloadable receipt card.
// ─────────────────────────────────────────────────────────────────────────────

class ReceiptGroup {
  final List<ReceiptModel> items;
  final String receiptNumber;
  final DateTime paidAt;

  double get totalAmount => items.fold(0.0, (s, r) => s + r.amount);

  String get termSummary => items
      .map((r) => r.termName)
      .where((t) => t.isNotEmpty)
      .toSet()
      .join(', ');

  String get categoryLabel {
    final labels = items.map((r) => r.categoryLabel).toSet();
    return labels.length == 1 ? labels.first : 'Multiple';
  }

  bool get isTransport => items.every((r) => r.isTransport);

  String get studentName => items.first.studentName;
  String get paymentMode => items.first.paymentMode;

  String get monthLabel {
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    return '${months[paidAt.month - 1]} ${paidAt.year}';
  }

  const ReceiptGroup({
    required this.items,
    required this.receiptNumber,
    required this.paidAt,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

class ReceiptDetailsController extends GetxController {
  final ReceiptRepository _receiptRepo = ReceiptRepository();

  final isLoading                 = true.obs;
  final receipts                  = <ReceiptModel>[].obs;
  final RxList<ReceiptGroup> receiptGroups = <ReceiptGroup>[].obs;

  @override
  void onInit() {
    super.onInit();
    loadReceipts();
  }

  // ── Grouping ──────────────────────────────────────────────────────────────

  List<ReceiptGroup> _groupReceipts(List<ReceiptModel> raw) {
    final sorted = List<ReceiptModel>.from(raw)
      ..sort((a, b) => b.paymentDate.compareTo(a.paymentDate));

    final Map<String, List<ReceiptModel>> buckets = {};

    for (final r in sorted) {
      final String key;
      if (r.receiptNumber.isNotEmpty) {
        // Same receipt number → one group
        key = 'rcpt:${r.receiptNumber}';
      } else {
        // Fallback: same minute
        final dt        = DateTime.tryParse(r.paymentDate) ?? DateTime.now();
        final minuteKey = '${dt.year}-${dt.month}-${dt.day}-${dt.hour}-${dt.minute}';
        key = 'min:$minuteKey';
      }
      buckets.putIfAbsent(key, () => []).add(r);
    }

    return buckets.entries.map((e) {
      final items = e.value;
      final dt    = DateTime.tryParse(items.first.paymentDate) ?? DateTime.now();
      return ReceiptGroup(
        items:         items,
        receiptNumber: items.first.receiptNumber,
        paidAt:        dt,
      );
    }).toList()
      ..sort((a, b) => b.paidAt.compareTo(a.paidAt));
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  Future<void> loadReceipts({bool forceRefresh = false}) async {
    final dashCtrl = Get.find<DashboardController>();
    final sId      = dashCtrl.student.value?.id ?? '';
    if (sId.isEmpty) { isLoading.value = false; return; }

    final prefs        = await SharedPreferences.getInstance();
    final cacheKey     = 'receipts_cache_$sId';
    final timeKey      = 'receipts_time_$sId';
    final cachedStr    = prefs.getString(cacheKey);
    final cachedTime   = prefs.getInt(timeKey) ?? 0;
    final nowMs        = DateTime.now().millisecondsSinceEpoch;
    final isCacheFresh = (nowMs - cachedTime) < 5 * 60 * 1000;

    if (!forceRefresh && cachedStr != null && cachedStr.isNotEmpty) {
      try {
        final decoded = json.decode(cachedStr) as List;
        final list    = decoded
            .map((item) => ReceiptModel.fromJson(item as Map<String, dynamic>))
            .toList();
        receipts.assignAll(list);
        receiptGroups.assignAll(_groupReceipts(list));
        if (isCacheFresh) { isLoading.value = false; return; }
      } catch (e) {
        debugPrint('Error loading receipts from cache: $e');
      }
    }

    isLoading.value = true;
    try {
      final studentName = dashCtrl.student.value?.name ?? 'Student';
      final ledgerIds   = dashCtrl.fees.map((f) => f.id).toList();
      final list        = await _receiptRepo.getReceiptsForLedgers(ledgerIds, studentName);
      receipts.assignAll(list);
      receiptGroups.assignAll(_groupReceipts(list));

      await prefs.setString(cacheKey, json.encode(list.map((r) => r.toJson()).toList()));
      await prefs.setInt(timeKey, nowMs);
    } catch (e) {
      debugPrint('Error loading receipts: $e');
    } finally {
      isLoading.value = false;
    }
  }
}
