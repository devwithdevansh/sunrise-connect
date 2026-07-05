import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../controllers/receipt_details_controller.dart';

class ReceiptDetailsView extends GetView<ReceiptDetailsController> {
  const ReceiptDetailsView({super.key});

  String _fmt(double amount) {
    final digits = amount.abs().round().toString();
    if (digits.length <= 3) return '₹$digits';
    final last3 = digits.substring(digits.length - 3);
    var rest    = digits.substring(0, digits.length - 3);
    final parts = <String>[];
    while (rest.length > 2) {
      parts.insert(0, rest.substring(rest.length - 2));
      rest = rest.substring(0, rest.length - 2);
    }
    if (rest.isNotEmpty) parts.insert(0, rest);
    return '₹${parts.join(',')},$last3';
  }

  String _fmtDateTime(DateTime dt) {
    const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    final h   = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
    final min = dt.minute.toString().padLeft(2, '0');
    final ap  = dt.hour >= 12 ? 'PM' : 'AM';
    return '${dt.day} ${m[dt.month - 1]} ${dt.year}  ·  $h:$min $ap';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.navyDark,
        elevation: 0,
        title: Text('Receipts', style: AppTextStyles.h2.copyWith(color: Colors.white)),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
          onPressed: () => Get.back(),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => controller.loadReceipts(forceRefresh: true),
        color: AppColors.primaryMid,
        child: Obx(() {
          // ── Loading ──────────────────────────────────────────────────────
          if (controller.isLoading.value && controller.receiptGroups.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primaryMid));
          }

          // ── Empty ────────────────────────────────────────────────────────
          if (controller.receiptGroups.isEmpty) {
            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.of(context).size.height * 0.72,
                child: Center(
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Container(
                      width: 84, height: 84,
                      decoration: const BoxDecoration(color: AppColors.purplePale, shape: BoxShape.circle),
                      child: const Icon(Icons.receipt_long_rounded, size: 42, color: AppColors.purple),
                    ),
                    const SizedBox(height: 20),
                    Text('No Receipts Available', style: AppTextStyles.h2),
                    const SizedBox(height: 8),
                    Text('Receipts are generated after payments.', style: AppTextStyles.bodyMedium),
                    const SizedBox(height: 6),
                    Text('Pull down to refresh.', style: AppTextStyles.bodySmall),
                  ]),
                ),
              ),
            );
          }

          final groups = controller.receiptGroups;

          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            itemCount: groups.length,
            itemBuilder: (context, index) {
              final group      = groups[index];
              final isNewMonth = index == 0 || group.monthLabel != groups[index - 1].monthLabel;

              return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                if (isNewMonth) ...[
                  if (index != 0) const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.only(left: 4, bottom: 10, top: 4),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.navyDark,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(group.monthLabel,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
                    ),
                  ),
                ],
                _ReceiptGroupCard(
                  group: group,
                  fmt: _fmt,
                  fmtDateTime: _fmtDateTime,
                  onTap: () => _showReceiptModal(context, group),
                ),
                const SizedBox(height: 12),
              ]);
            },
          );
        }),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RECEIPT MODAL  — full digital receipt with line items
  // ─────────────────────────────────────────────────────────────────────────
  void _showReceiptModal(BuildContext context, ReceiptGroup group) {
    final isMulti = group.activeItems.length > 1;
    final dtStr   = _fmtDateTime(group.paidAt);

    final totalLedgerAmt = group.activeItems.fold<double>(0.0, (s, item) => s + (item.totalAmount > 0 ? item.totalAmount : item.amount + item.concessionAmount));
    final totalConcession = group.activeItems.fold<double>(0.0, (s, item) => s + item.concessionAmount);
    final totalPaid = group.totalAmount;

    Get.dialog(
      Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Colors.white,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxHeight: 620),
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                // ── Header ────────────────────────────────────────────────
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Digital Receipt', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Color(0xFF1A1E2E))),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Get.back(),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ]),
                const Divider(color: Color(0xFFE4E8F0)),
                const SizedBox(height: 12),

                // ── School info ───────────────────────────────────────────
                const Text('SUNRISE SCHOOL',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF1B3A7A), letterSpacing: 0.5),
                    textAlign: TextAlign.center),
                const SizedBox(height: 3),
                const Text('Railnagar, Rajkot, Gujarat',
                    style: TextStyle(fontSize: 11, color: Color(0xFF9BA3B6)),
                    textAlign: TextAlign.center),

                const SizedBox(height: 18),

                // ── Meta rows ─────────────────────────────────────────────
                _row('Receipt No:', group.receiptNumber.isNotEmpty ? group.receiptNumber : '—'),
                const SizedBox(height: 8),
                _row('Student Name:', group.studentName),
                const SizedBox(height: 8),
                if (isMulti && group.monthRangeSummary.isNotEmpty) ...[
                  _row('Period:', group.monthRangeSummary),
                  const SizedBox(height: 8),
                ],
                _row('Payment Date:', dtStr),
                const SizedBox(height: 8),
                _row('Payment Mode:', group.paymentMode.toUpperCase()),
                const SizedBox(height: 8),
                _row('Status:', 'PAID', valueColor: AppColors.teal),

                const SizedBox(height: 16),
                const Divider(color: Color(0xFFE4E8F0)),
                const SizedBox(height: 8),

                // ── Line items ────────────────────────────────────────────
                if (isMulti) ...[
                  const Text('Fee Breakdown',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF1A1E2E))),
                  const SizedBox(height: 10),
                  ...group.activeItems.map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(children: [
                      Container(
                        width: 28, height: 28,
                        decoration: BoxDecoration(color: AppColors.tealPale, borderRadius: BorderRadius.circular(8)),
                        child: const Icon(Icons.receipt_outlined, color: AppColors.teal, size: 14),
                      ),
                      const SizedBox(width: 10),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(item.termName.isNotEmpty ? item.termName : item.categoryLabel,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1A1E2E))),
                        Row(
                          children: [
                            if (item.termName.isNotEmpty)
                              Text(item.categoryLabel,
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF9BA3B6))),
                            if (item.concessionAmount > 0) ...[
                              if (item.termName.isNotEmpty) const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFE8FAF5),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text('Concession: -₹${item.concessionAmount.toInt()}',
                                    style: const TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF0FB893))),
                              ),
                            ],
                          ],
                        ),
                      ])),
                      Text(_fmt(item.amount),
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF1A1E2E))),
                    ]),
                  )),
                  const Divider(color: Color(0xFFE4E8F0)),
                ] else ...[
                  _row('Category:', group.categoryLabel),
                  const SizedBox(height: 8),
                  if (group.termSummary.isNotEmpty) ...[
                    _row('Term / Month:', group.termSummary),
                    const SizedBox(height: 8),
                  ],
                  if (totalConcession > 0) ...[
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text('Concession:', style: TextStyle(fontSize: 13, color: Color(0xFF5A6275))),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE8FAF5),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('ALLOWED',
                            style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0FB893))),
                      ),
                    ]),
                    const SizedBox(height: 8),
                  ],
                  const Divider(color: Color(0xFFE4E8F0)),
                ],

                // ── Concession Summary ────────────────────────────────────
                if (totalConcession > 0) ...[
                  const SizedBox(height: 8),
                  _row('Original Due:', _fmt(totalLedgerAmt)),
                  const SizedBox(height: 6),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    const Text('Concession Deducted:', style: TextStyle(fontSize: 13, color: Color(0xFF5A6275))),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8FAF5),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text('-${_fmt(totalConcession)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF0FB893))),
                    ),
                  ]),
                  const SizedBox(height: 10),
                  const Divider(color: Color(0xFFE4E8F0)),
                ],

                // ── Total Paid ────────────────────────────────────────────
                const SizedBox(height: 12),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Total Paid', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF1A1E2E))),
                  Text(_fmt(totalPaid),
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.teal, letterSpacing: -0.3)),
                ]),

                const SizedBox(height: 20),

                 // ── Download button ───────────────────────────────────────
                ElevatedButton.icon(
                  onPressed: () {
                    HapticFeedback.mediumImpact();
                    Get.back();
                    controller.downloadReceiptPdf(group);
                  },
                  icon: const Icon(Icons.download_rounded, color: Colors.white),
                  label: const Text('Download PDF', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.navyDark,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
                    elevation: 0,
                  ),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }

  Widget _row(String label, String value, {Color? valueColor}) {
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFF5A6275))),
      Flexible(child: Text(value,
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: valueColor ?? const Color(0xFF1A1E2E)),
          textAlign: TextAlign.right, overflow: TextOverflow.ellipsis)),
    ]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RECEIPT GROUP CARD
// ─────────────────────────────────────────────────────────────────────────────

class _ReceiptGroupCard extends StatelessWidget {
  const _ReceiptGroupCard({
    required this.group,
    required this.fmt,
    required this.fmtDateTime,
    required this.onTap,
  });
  final ReceiptGroup group;
  final String Function(double)   fmt;
  final String Function(DateTime) fmtDateTime;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isMulti = group.activeItems.length > 1;
    final subtitleText = isMulti ? group.categoriesSummary : group.termSummary;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: const [BoxShadow(color: Color(0x06000000), blurRadius: 10, offset: Offset(0, 3))],
        ),
        child: Row(children: [
          // Receipt icon
          Container(
            width: 46, height: 46,
            decoration: const BoxDecoration(color: AppColors.purplePale, shape: BoxShape.circle),
            child: const Icon(Icons.receipt_rounded, color: AppColors.purple, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              group.monthRangeSummary.isNotEmpty
                  ? '${group.monthRangeSummary} paid on ${group.paidAt.day}-${group.paidAt.month}-${group.paidAt.year % 100}'
                  : (isMulti
                      ? 'Multiple Fees paid on ${group.paidAt.day}-${group.paidAt.month}-${group.paidAt.year % 100}'
                      : '${group.categoryLabel} paid on ${group.paidAt.day}-${group.paidAt.month}-${group.paidAt.year % 100}'),
              style: AppTextStyles.labelLarge,
            ),
            // Term summary / Categories
            if (subtitleText.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                subtitleText,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.primaryMid,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 2),
            Text(fmtDateTime(group.paidAt), style: AppTextStyles.bodySmall),
            if (group.receiptNumber.isNotEmpty)
              Text('Receipt #${group.receiptNumber.length > 12 ? group.receiptNumber.substring(0, 12) : group.receiptNumber}',
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.inkLight)),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(fmt(group.totalAmount),
                style: AppTextStyles.h3.copyWith(color: AppColors.primaryMid)),
            const SizedBox(height: 4),
            Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.visibility_outlined, size: 11, color: AppColors.purple),
              const SizedBox(width: 3),
              Text('View', style: AppTextStyles.labelSmall.copyWith(color: AppColors.purple, fontSize: 10)),
            ]),
          ]),
        ]),
      ),
    );
  }
}
