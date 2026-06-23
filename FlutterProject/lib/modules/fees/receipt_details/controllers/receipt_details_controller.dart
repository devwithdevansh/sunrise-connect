import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:get/get.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import '../../../../core/utils/pdf_download_helper.dart';
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

  List<ReceiptModel> get activeItems => items.where((item) => !item.isReversed).toList();
  bool get isPartiallyReversed => items.any((item) => item.isReversed) && items.any((item) => !item.isReversed);
  double get revisedTotal => activeItems.fold(0.0, (s, r) => s + r.amount);

  double get totalAmount => revisedTotal;

  String get termSummary => activeItems
      .map((r) => r.termName)
      .where((t) => t.isNotEmpty)
      .toSet()
      .join(', ');

  String get categoryLabel {
    final labels = activeItems.map((r) => r.categoryLabel).toSet();
    if (labels.isEmpty) return 'Reversed';
    return labels.length == 1 ? labels.first : 'Multiple';
  }

  String get categoriesSummary {
    final cats = activeItems.map((r) => r.categoryLabel).toSet().toList();
    return cats.join(' & ');
  }

  bool get isTransport => activeItems.isNotEmpty && activeItems.every((r) => r.isTransport);

  String get studentName => items.isNotEmpty ? items.first.studentName : 'Student';
  String get paymentMode => items.isNotEmpty ? items.first.paymentMode : '';

  String get monthLabel {
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    return '${months[paidAt.month - 1]} ${paidAt.year}';
  }

  String get monthRangeSummary {
    final terms = activeItems.map((item) => item.termName).where((t) => t.isNotEmpty).toSet().toList();
    if (terms.isEmpty) return '';

    final monthOrderMap = {
      'june': 1, 'july': 2, 'august': 3, 'september': 4, 'october': 5, 'november': 6,
      'december': 7, 'january': 8, 'february': 9, 'march': 10, 'april': 11, 'may': 12,
      'jun': 1, 'jul': 2, 'aug': 3, 'sep': 4, 'oct': 5, 'nov': 6,
      'dec': 7, 'jan': 8, 'feb': 9, 'mar': 10, 'apr': 11,
    };

    final parsedMonths = <Map<String, dynamic>>[];
    final nonMonths = <String>[];

    for (final term in terms) {
      final lower = term.toLowerCase().trim();
      final parts = lower.split(RegExp(r'[\s\-\,]+'));
      String? matchedKey;
      for (final part in parts) {
        if (monthOrderMap.containsKey(part)) {
          matchedKey = part;
          break;
        }
      }

      if (matchedKey != null) {
        final order = monthOrderMap[matchedKey]!;
        const shortNames = {
          1: 'Jun', 2: 'Jul', 3: 'Aug', 4: 'Sep', 5: 'Oct', 6: 'Nov',
          7: 'Dec', 8: 'Jan', 9: 'Feb', 10: 'Mar', 11: 'Apr', 12: 'May'
        };
        parsedMonths.add({
          'original': term,
          'order': order,
          'shortName': shortNames[order]!,
        });
      } else {
        nonMonths.add(term);
      }
    }

    if (parsedMonths.isNotEmpty) {
      // Remove duplicates by order to avoid multiple records of same month (e.g. June Education and June Transport)
      final uniqueOrders = <int>{};
      final uniqueParsed = <Map<String, dynamic>>[];
      for (final pm in parsedMonths) {
        final ord = pm['order'] as int;
        if (!uniqueOrders.contains(ord)) {
          uniqueOrders.add(ord);
          uniqueParsed.add(pm);
        }
      }

      uniqueParsed.sort((a, b) => (a['order'] as int).compareTo(b['order'] as int));

      final start = uniqueParsed.first['shortName'] as String;
      final end = uniqueParsed.last['shortName'] as String;
      final monthCount = uniqueParsed.length;

      final String rangeText;
      if (monthCount == 1) {
        rangeText = uniqueParsed.first['original'] as String;
      } else {
        rangeText = '$start - $end ($monthCount months)';
      }

      if (nonMonths.isEmpty) {
        return rangeText;
      } else {
        return '$rangeText, ${nonMonths.join(', ')}';
      }
    }

    return terms.join(', ');
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
        key = 'rcpt:${r.receiptNumber}';
      } else {
        key = 'id:${r.id}';
      }
      buckets.putIfAbsent(key, () => []).add(r);
    }

    return buckets.entries.map((e) {
      final items = e.value;
      final dt    = DateTime.tryParse(items.first.paymentDate) ?? DateTime.now();
      final receiptNumber = items.first.receiptNumber;

      return ReceiptGroup(
        items:         items,
        receiptNumber: receiptNumber,
        paidAt:        dt,
      );
    }).where((group) => group.activeItems.isNotEmpty).toList()
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

    if (forceRefresh) {
      await prefs.remove(cacheKey);
      await prefs.remove(timeKey);
      // Invalidate dashboard caches and sync outstanding fees in the background
      dashCtrl.refreshData();
    }

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

  Future<void> downloadReceiptPdf(ReceiptGroup group) async {
    try {
      final pdf = pw.Document();

      final totalLedgerAmt = group.activeItems.fold<double>(0.0, (s, item) => s + (item.totalAmount > 0 ? item.totalAmount : item.amount + item.concessionAmount));
      final totalConcession = group.activeItems.fold<double>(0.0, (s, item) => s + item.concessionAmount);
      final totalPaid = group.totalAmount;

      String formatPdfDateTime(DateTime dt) {
        const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        final h   = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
        final min = dt.minute.toString().padLeft(2, '0');
        final ap  = dt.hour >= 12 ? 'PM' : 'AM';
        return '${dt.day} ${m[dt.month - 1]} ${dt.year}  -  $h:$min $ap';
      }

      pdf.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a4,
          build: (pw.Context context) {
            return pw.Padding(
              padding: const pw.EdgeInsets.all(24),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text('SUNRISE CONVENT SCHOOL',
                      style: const pw.TextStyle(
                          fontSize: 20, fontWeight: pw.FontWeight.bold)),
                  pw.Text('Railnagar, Rajkot, Gujarat',
                      style: const pw.TextStyle(fontSize: 12)),
                  pw.SizedBox(height: 8),
                  pw.Divider(),
                  pw.SizedBox(height: 12),
                  pw.Text(
                      group.monthRangeSummary.isNotEmpty
                          ? 'RECEIPT FOR ${group.monthRangeSummary.toUpperCase()} PAID'
                          : 'RECEIPT DETAILS',
                      style: const pw.TextStyle(
                          fontSize: 15, fontWeight: pw.FontWeight.bold)),
                  pw.SizedBox(height: 12),
                  pw.Text('Receipt No: ${group.receiptNumber.isNotEmpty ? group.receiptNumber : '—'}'),
                  pw.Text('Student Name: ${group.studentName}'),
                  if (group.monthRangeSummary.isNotEmpty)
                    pw.Text('Period: ${group.monthRangeSummary}'),
                  pw.Text('Payment Date: ${formatPdfDateTime(group.paidAt)}'),
                  pw.Text('Payment Mode: ${group.paymentMode.toUpperCase()}'),
                  pw.SizedBox(height: 12),
                  pw.Divider(),
                  pw.SizedBox(height: 12),
                  pw.Text('Items:',
                      style: const pw.TextStyle(
                          fontSize: 14, fontWeight: pw.FontWeight.bold)),
                  pw.SizedBox(height: 6),
                  ...group.activeItems.map((item) {
                    return pw.Padding(
                      padding: const pw.EdgeInsets.only(bottom: 4),
                      child: pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text(
                              '${item.termName.isNotEmpty ? item.termName : item.categoryLabel} (${item.categoryLabel})'),
                          pw.Text('Rs. ${item.amount.toInt()}'),
                        ],
                      ),
                    );
                  }),
                  pw.SizedBox(height: 12),
                  pw.Divider(),
                  if (totalConcession > 0) ...[
                    pw.SizedBox(height: 8),
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text('Original Due:'),
                        pw.Text('Rs. ${totalLedgerAmt.toInt()}'),
                      ],
                    ),
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text('Concession Deducted:'),
                        pw.Text('-Rs. ${totalConcession.toInt()}'),
                      ],
                    ),
                    pw.SizedBox(height: 8),
                    pw.Divider(),
                  ],
                  pw.SizedBox(height: 12),
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text('Total Paid:',
                          style: const pw.TextStyle(
                              fontSize: 16, fontWeight: pw.FontWeight.bold)),
                      pw.Text('Rs. ${totalPaid.toInt()}',
                          style: const pw.TextStyle(
                              fontSize: 16, fontWeight: pw.FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
      );

      final pdfBytes = await pdf.save();
      final safeRcptNum = group.receiptNumber.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');
      final fileName = "receipt_${safeRcptNum.isNotEmpty ? safeRcptNum : group.paidAt.millisecondsSinceEpoch}.pdf";
      await saveAndOpenPdf(pdfBytes, fileName);

      Get.snackbar(
        'Receipt Downloaded',
        'Receipt saved and opened successfully.',
        snackPosition: SnackPosition.TOP,
        backgroundColor: const Color(0xFFE8FAF5),
        colorText: const Color(0xFF0FB893),
        margin: const EdgeInsets.all(16),
        borderRadius: 14,
      );
    } catch (e) {
      debugPrint('Error downloading PDF: $e');
      Get.snackbar(
        'Error',
        'Failed to download PDF receipt: $e',
        snackPosition: SnackPosition.TOP,
        backgroundColor: const Color(0xFFFFF0F0),
        colorText: const Color(0xFFDC2626),
        margin: const EdgeInsets.all(16),
        borderRadius: 14,
      );
    }
  }
}
