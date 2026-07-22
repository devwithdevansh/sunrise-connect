import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../data/models/fee_model.dart';
import '../../../dashboard/controllers/dashboard_controller.dart';
import 'package:flutter_animate/flutter_animate.dart';

class FeeSummaryView extends StatelessWidget {
  const FeeSummaryView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<DashboardController>();

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text('Fee Summary', style: AppTextStyles.h2),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.ink, size: 20),
          onPressed: () => Get.back(),
        ),
      ),
      body: Obx(() {
        final s = controller.student.value;
        if (s == null) {
          return const Center(child: Text('No student records found'));
        }

        final total = controller.totalFees.value;
        final paid = controller.totalPaid.value;
        final pending = controller.totalPending.value;
        final progress = total > 0 ? paid / total : 0.0;

        // Group fees by month
        final allFees = controller.fees;
        final mainFees = allFees.where((f) => f.isEducation || f.isTransport || f.isTerm).toList();
        final otherFees = allFees.where((f) => !f.isEducation && !f.isTransport && !f.isTerm).toList();

        final term1Fees = <FeeModel>[];
        final term2Fees = <FeeModel>[];

        for (final f in mainFees) {
          if (f.isTerm) {
            if (f.termName.toLowerCase().contains('1')) {
              term1Fees.add(f);
            } else {
              term2Fees.add(f);
            }
          } else {
            final dueDate = DateTime.tryParse(f.dueDate);
            if (dueDate == null) continue;
            final month = dueDate.month;
            // Term 1: Jun–Nov (6–11), Term 2: Dec–May (12, 1–5)
            if (month >= 6 && month <= 11) {
              term1Fees.add(f);
            } else {
              term2Fees.add(f);
            }
          }
        }

        // Group by month name within each term
        final term1Months = _groupByMonth(term1Fees);
        final term2Months = _groupByMonth(term2Fees);

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Student Header Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: AppColors.primaryLight,
                      child: Text(s.initials, style: AppTextStyles.h3.copyWith(color: AppColors.primaryMid)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(s.name, style: AppTextStyles.h3),
                              if (s.isRTE) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFE8FAF5),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: const Color(0xFFB0EDD9)),
                                  ),
                                  child: Text('RTE',
                                      style: AppTextStyles.labelSmall.copyWith(
                                          color: const Color(0xFF0FB893), fontWeight: FontWeight.w700)),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text('Class: ${s.classLabel}', style: AppTextStyles.bodySmall),
                          if (s.hasTransport)
                            Text('Transport: ${s.transportType}',
                                style: AppTextStyles.bodySmall.copyWith(color: const Color(0xFF0FB893))),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Visual Progress Gauge
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    Text('Payment Progress', style: AppTextStyles.h3),
                    const SizedBox(height: 24),
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        SizedBox(
                          width: 120,
                          height: 120,
                          child: CircularProgressIndicator(
                            value: progress,
                            strokeWidth: 10,
                            backgroundColor: AppColors.border,
                            color: AppColors.teal,
                          ),
                        ),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('${(progress * 100).toStringAsFixed(0)}%', style: AppTextStyles.displayMedium.copyWith(color: AppColors.teal, fontSize: 24)),
                            Text('Paid', style: AppTextStyles.labelSmall.copyWith(color: AppColors.inkLight)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStat('Total', total, AppColors.primaryMid),
                        _buildStat('Paid', paid, AppColors.teal),
                        _buildStat('Pending', pending, AppColors.red),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Term 1 Breakdown
              if (term1Months.isNotEmpty) ...[
                _buildTermHeader('Term 1  (Jun – Nov)', Icons.assignment_rounded, const Color(0xFFD97706)),
                const SizedBox(height: 12),
                ..._buildMonthCards(term1Months),
                const SizedBox(height: 20),
              ],

              // Term 2 Breakdown
              if (term2Months.isNotEmpty) ...[
                _buildTermHeader('Term 2  (Dec – May)', Icons.assignment_rounded, const Color(0xFF2563EB)),
                const SizedBox(height: 12),
                ..._buildMonthCards(term2Months),
              ],

              // Other & Additional Fees Breakdown
              if (otherFees.isNotEmpty) ...[
                const SizedBox(height: 20),
                _buildTermHeader('Other & Additional Fees', Icons.receipt_long_rounded, AppColors.purple),
                const SizedBox(height: 12),
                _buildOtherFeesCard(otherFees),
              ],
            ].animate(interval: 50.ms).fade(duration: 400.ms).slideY(begin: 0.1, curve: Curves.easeOutQuad),
          ),
        );
      }),
    );
  }

  /// Group fees by month name, returning a map of monthName → list of fees.
  Map<String, List<FeeModel>> _groupByMonth(List<FeeModel> fees) {
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final map = <String, List<FeeModel>>{};

    for (final f in fees) {
      final dueDate = DateTime.tryParse(f.dueDate);
      if (dueDate == null) continue;
      final monthName = monthNames[dueDate.month];
      map.putIfAbsent(monthName, () => []).add(f);
    }

    // Sort by academic month order (Jun=1 → May=12)
    final sorted = Map.fromEntries(map.entries.toList()
      ..sort((a, b) {
        final aDate = DateTime.tryParse(a.value.first.dueDate);
        final bDate = DateTime.tryParse(b.value.first.dueDate);
        if (aDate == null || bDate == null) return 0;
        final aOrder = _academicOrder(aDate.month);
        final bOrder = _academicOrder(bDate.month);
        return aOrder.compareTo(bOrder);
      }));
    return sorted;
  }

  int _academicOrder(int month) {
    if (month >= 6) return month - 5;
    return month + 7;
  }

  Widget _buildTermHeader(String title, IconData icon, Color color) {
    return Row(
      children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 18),
        ),
        const SizedBox(width: 10),
        Expanded(child: Text(title, style: AppTextStyles.h2)),
      ],
    );
  }

  List<Widget> _buildMonthCards(Map<String, List<FeeModel>> monthMap) {
    return monthMap.entries.map((entry) {
      final monthName = entry.key;
      final fees = entry.value;
      final totalAmt = fees.fold<double>(0, (s, f) => s + f.amount);
      final paidAmt = fees.fold<double>(0, (s, f) => s + f.paidAmount + f.concessionAmount);
      final remainAmt = fees.fold<double>(0, (s, f) => s + f.remainingAmount);
      final allPaid = fees.every((f) => f.isPaid);

      final color = allPaid ? AppColors.teal : AppColors.red;
      final bg = allPaid ? const Color(0xFFE8FAF5) : const Color(0xFFFFF0F0);

      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(monthName, style: AppTextStyles.labelLarge)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
                  child: Text(
                    allPaid ? 'PAID' : 'PENDING',
                    style: AppTextStyles.labelSmall.copyWith(color: color),
                  ),
                ),
              ],
            ),
            const Divider(height: 20, color: AppColors.border),
            // Sub-fee breakdown
            ...fees.map((fee) {
              final iconData = fee.isTransport ? Icons.directions_bus_rounded : (fee.isTerm ? Icons.assignment_rounded : Icons.menu_book_rounded);
              final iconColor = fee.isTransport ? AppColors.teal : (fee.isTerm ? AppColors.purple : AppColors.primaryMid);
              final iconBg = fee.isTransport ? AppColors.tealPale : (fee.isTerm ? AppColors.purple.withValues(alpha: 0.12) : AppColors.primaryLight);
              final typeLabel = fee.isTransport ? 'Transport' : (fee.isTerm ? fee.termName : 'Education');
              final feeIsPaid = fee.isPaid;
              final isRTEWaived = (fee.isEducation || fee.isTerm) && fee.concessionAmount >= fee.amount && fee.concessionAmount > 0;

              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: iconBg,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(iconData, color: iconColor, size: 13),
                    ),
                    const SizedBox(width: 8),
                    Expanded(child: Text(typeLabel, style: AppTextStyles.bodyMedium)),
                    if (isRTEWaived)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        margin: const EdgeInsets.only(right: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE8FAF5),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFFB0EDD9)),
                        ),
                        child: Text('RTE',
                            style: AppTextStyles.labelSmall.copyWith(
                                color: const Color(0xFF0FB893), fontSize: 9, fontWeight: FontWeight.w700)),
                      ),
                    Text('₹${fee.amount.toInt()}',
                        style: AppTextStyles.bodyMedium.copyWith(
                            color: feeIsPaid ? AppColors.teal : AppColors.ink,
                            fontWeight: FontWeight.w600)),
                  ],
                ),
              );
            }),
            const Divider(height: 12, color: AppColors.border),
            _buildRow('Total', '₹${totalAmt.toInt()}'),
            const SizedBox(height: 4),
            _buildRow('Paid', '₹${paidAmt.toInt()}', color: AppColors.teal),
            const SizedBox(height: 4),
            _buildRow('Remaining', '₹${remainAmt.toInt()}', color: AppColors.red, bold: true),
          ],
        ),
      );
    }).toList();
  }

  Widget _buildStat(String label, double amount, Color color) {
    return Column(
      children: [
        Text(label, style: AppTextStyles.labelSmall),
        const SizedBox(height: 4),
        Text('₹${amount.toInt()}', style: AppTextStyles.h3.copyWith(color: color)),
      ],
    );
  }

  Widget _buildRow(String label, String value, {Color? color, bool bold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(child: Text(label, style: AppTextStyles.bodyMedium)),
        Text(
          value,
          style: bold
              ? AppTextStyles.labelLarge.copyWith(color: color)
              : AppTextStyles.bodyMedium.copyWith(color: color),
        ),
      ],
    );
  }

  Widget _buildOtherFeesCard(List<FeeModel> otherFees) {
    final totalAmt = otherFees.fold<double>(0, (s, f) => s + f.amount);
    final paidAmt = otherFees.fold<double>(0, (s, f) => s + f.paidAmount + f.concessionAmount);
    final remainAmt = otherFees.fold<double>(0, (s, f) => s + f.remainingAmount);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ...otherFees.map((fee) {
            final isPaid = fee.isPaid;
            final hasConcession = fee.concessionAmount > 0;
            final isLast = otherFees.last == fee;

            // Format type label
            String typeLabel = fee.feeType;
            if (fee.feeType == 'ADMISSION') {
              typeLabel = 'Admission Fee';
            } else if (fee.feeType == 'BAG_KIT') {
              typeLabel = 'Bag & Kit Fee';
            } else {
              // Format camel case/spaced
              typeLabel = fee.feeType.split('_').map((str) {
                if (str.isEmpty) return '';
                return str[0].toUpperCase() + str.substring(1).toLowerCase();
              }).join(' ');
            }

            final statusColor = isPaid ? AppColors.teal : AppColors.red;
            final statusBg = isPaid ? const Color(0xFFE8FAF5) : const Color(0xFFFFF0F0);

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: Text(typeLabel, style: AppTextStyles.labelLarge)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(8)),
                      child: Text(
                        fee.status,
                        style: AppTextStyles.labelSmall.copyWith(color: statusColor),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                if (fee.dueDate.isNotEmpty) ...[
                  Text('Due: ${fee.dueDate.split('T').first}', style: AppTextStyles.bodySmall),
                  const SizedBox(height: 8),
                ],
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: Text('Total Amount:', style: AppTextStyles.bodyMedium)),
                    Text('₹${fee.amount.toInt()}', style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
                  ],
                ),
                if (hasConcession) ...[
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: Text('Concession Deducted:', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.teal))),
                      Text('-₹${fee.concessionAmount.toInt()}', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.teal, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ],
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: Text('Paid:', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.teal))),
                    Text('₹${fee.paidAmount.toInt()}', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.teal, fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: Text('Remaining:', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.red))),
                    Text('₹${fee.remainingAmount.toInt()}', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.red, fontWeight: FontWeight.w600)),
                  ],
                ),
                if (!isLast) ...[
                  const Divider(height: 24, color: AppColors.border),
                ],
              ],
            );
          }),
          const Divider(height: 24, color: AppColors.border),
          _buildRow('Total Additional', '₹${totalAmt.toInt()}'),
          const SizedBox(height: 4),
          _buildRow('Total Paid', '₹${paidAmt.toInt()}', color: AppColors.teal),
          const SizedBox(height: 4),
          _buildRow('Total Remaining', '₹${remainAmt.toInt()}', color: AppColors.red, bold: true),
        ],
      ),
    );
  }
}
