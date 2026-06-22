import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../controllers/payment_history_controller.dart';

class PaymentHistoryView extends GetView<PaymentHistoryController> {
  const PaymentHistoryView({super.key});

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

  String _fmtTime(DateTime dt) {
    final h   = dt.hour   > 12  ? dt.hour - 12   : (dt.hour == 0 ? 12 : dt.hour);
    final min = dt.minute.toString().padLeft(2, '0');
    final ap  = dt.hour   >= 12 ? 'PM'            : 'AM';
    return '$h:$min $ap';
  }

  String _fmtDate(DateTime dt) {
    const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${dt.day} ${m[dt.month - 1]} ${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.navyDark,
        elevation: 0,
        title: Text('Payment History', style: AppTextStyles.h2.copyWith(color: Colors.white)),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
          onPressed: () => Get.back(),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: controller.loadPaymentHistory,
        color: AppColors.primaryMid,
        child: Obx(() {
          // ── Loading ──────────────────────────────────────────────────────
          if (controller.isLoading.value && controller.paymentGroups.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primaryMid));
          }

          // ── Empty ────────────────────────────────────────────────────────
          if (controller.paymentGroups.isEmpty) {
            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.of(context).size.height * 0.72,
                child: Center(
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Container(
                      width: 84, height: 84,
                      decoration: BoxDecoration(color: AppColors.primaryLight, shape: BoxShape.circle),
                      child: const Icon(Icons.history_toggle_off_rounded, size: 42, color: AppColors.primaryMid),
                    ),
                    const SizedBox(height: 20),
                    Text('No Payment History', style: AppTextStyles.h2),
                    const SizedBox(height: 8),
                    Text('Payments you make will appear here.', style: AppTextStyles.bodyMedium),
                  ]),
                ),
              ),
            );
          }

          // ── Group list ───────────────────────────────────────────────────
          final groups = controller.paymentGroups;

          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            itemCount: groups.length,
            itemBuilder: (context, index) {
              final group = groups[index];

              // Month-year divider
              final isNewMonth = index == 0 ||
                  group.monthLabel != groups[index - 1].monthLabel;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (isNewMonth) ...[
                    if (index != 0) const SizedBox(height: 8),
                    Padding(
                      padding: const EdgeInsets.only(left: 4, bottom: 10, top: 4),
                      child: Row(children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.navyDark,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(group.monthLabel,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
                        ),
                      ]),
                    ),
                  ],
                  _GroupCard(
                    group: group,
                    fmt: _fmt,
                    fmtDate: _fmtDate,
                    fmtTime: _fmtTime,
                  ),
                  const SizedBox(height: 12),
                ],
              );
            },
          );
        }),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUP CARD  — shows a single receipt batch (1 or multiple months paid together)
// ─────────────────────────────────────────────────────────────────────────────

class _GroupCard extends StatefulWidget {
  const _GroupCard({
    required this.group,
    required this.fmt,
    required this.fmtDate,
    required this.fmtTime,
  });
  final PaymentGroup group;
  final String Function(double)   fmt;
  final String Function(DateTime) fmtDate;
  final String Function(DateTime) fmtTime;

  @override
  State<_GroupCard> createState() => _GroupCardState();
}

class _GroupCardState extends State<_GroupCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final g      = widget.group;
    final isMulti = g.items.length > 1;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: const [BoxShadow(color: Color(0x06000000), blurRadius: 10, offset: Offset(0, 3))],
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(children: [
        // ── Header row ──────────────────────────────────────────────────────
        GestureDetector(
          onTap: isMulti ? () => setState(() => _expanded = !_expanded) : null,
          child: Container(
            padding: const EdgeInsets.all(14),
            child: Row(children: [
              // Icon
              Container(
                width: 46, height: 46,
                decoration: BoxDecoration(
                  color: g.isTransport ? AppColors.amberPale : AppColors.tealPale,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  g.isTransport ? Icons.directions_bus_rounded : Icons.school_rounded,
                  color: g.isTransport ? AppColors.amber : AppColors.teal,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              // Text
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                // Title
                Text(
                  isMulti
                      ? '${g.items.length} Months Paid'
                      : '${g.categoryLabel} Fee',
                  style: AppTextStyles.labelLarge,
                ),
                // Term names summary
                if (g.termSummary.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(g.termSummary,
                      style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.primaryMid, fontWeight: FontWeight.w600),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
                const SizedBox(height: 2),
                // Date + time
                Text(
                  '${widget.fmtDate(g.paidAt)}  ·  ${widget.fmtTime(g.paidAt)}',
                  style: AppTextStyles.bodySmall,
                ),
                // Txn ID
                if (g.transactionId.isNotEmpty)
                  Text('Txn: ${g.transactionId}', style: AppTextStyles.bodySmall.copyWith(color: AppColors.inkLight)),
              ])),
              // Amount + badge
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(widget.fmt(g.totalAmount),
                    style: AppTextStyles.h3.copyWith(color: AppColors.teal)),
                const SizedBox(height: 4),
                if (isMulti)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Text('${g.items.length} items',
                          style: AppTextStyles.labelSmall.copyWith(color: AppColors.primaryMid, fontSize: 10)),
                      const SizedBox(width: 3),
                      AnimatedRotation(
                        turns: _expanded ? 0.5 : 0,
                        duration: const Duration(milliseconds: 200),
                        child: Icon(Icons.keyboard_arrow_down_rounded,
                            size: 14, color: AppColors.primaryMid),
                      ),
                    ]),
                  )
                else
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.tealPale,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text('PAID',
                        style: AppTextStyles.labelSmall.copyWith(color: AppColors.teal, fontSize: 9)),
                  ),
              ]),
            ]),
          ),
        ),

        // ── Expanded breakdown for multi-item groups ─────────────────────
        AnimatedCrossFade(
          firstChild: _BreakdownList(group: g, fmt: widget.fmt),
          secondChild: const SizedBox(width: double.infinity, height: 0),
          crossFadeState: _expanded ? CrossFadeState.showFirst : CrossFadeState.showSecond,
          duration: const Duration(milliseconds: 250),
          sizeCurve: Curves.easeInOut,
        ),
      ]),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BREAKDOWN LIST (expanded view of multi-item group)
// ─────────────────────────────────────────────────────────────────────────────

class _BreakdownList extends StatelessWidget {
  const _BreakdownList({required this.group, required this.fmt});
  final PaymentGroup group;
  final String Function(double) fmt;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border)),
        color: Color(0xFFF9FAFB),
      ),
      child: Column(children: [
        for (int i = 0; i < group.items.length; i++) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(children: [
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(
                  color: AppColors.tealPale,
                  borderRadius: BorderRadius.circular(9),
                ),
                child: const Icon(Icons.receipt_rounded, color: AppColors.teal, size: 16),
              ),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(
                  group.items[i].termName.isNotEmpty
                      ? group.items[i].termName
                      : group.items[i].categoryLabel,
                  style: AppTextStyles.labelLarge.copyWith(fontSize: 13),
                ),
                if (group.items[i].categoryLabel.isNotEmpty)
                  Text(group.items[i].categoryLabel,
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.inkLight)),
              ])),
              Text(fmt(group.items[i].amount),
                  style: AppTextStyles.labelLarge.copyWith(color: AppColors.teal, fontSize: 13)),
            ]),
          ),
          if (i < group.items.length - 1)
            const Divider(height: 1, color: AppColors.border, indent: 56, endIndent: 14),
        ],
        // Total row
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: const BoxDecoration(
            border: Border(top: BorderSide(color: AppColors.border)),
            color: AppColors.tealPale,
          ),
          child: Row(children: [
            const Icon(Icons.check_circle_rounded, color: AppColors.teal, size: 16),
            const SizedBox(width: 8),
            const Text('Total Paid', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.teal)),
            const Spacer(),
            Text(fmt(group.totalAmount),
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.teal)),
          ]),
        ),
      ]),
    );
  }
}
