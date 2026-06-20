import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../dashboard/controllers/dashboard_controller.dart';

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
                          Text(s.name, style: AppTextStyles.h3),
                          const SizedBox(height: 2),
                          Text('Class: ${s.classLabel}', style: AppTextStyles.bodySmall),
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

              Text('Term-wise Breakdown', style: AppTextStyles.h2),
              const SizedBox(height: 12),

              ...controller.fees.map((fee) {
                final isPaid = fee.isPaid;
                final color = isPaid ? AppColors.teal : AppColors.red;
                final bg = isPaid ? AppColors.tealPale : AppColors.redPale;
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
                          Text(fee.termName, style: AppTextStyles.labelLarge),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
                            child: Text(
                              isPaid ? 'PAID' : 'PENDING',
                              style: AppTextStyles.labelSmall.copyWith(color: color),
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 24, color: AppColors.border),
                      _buildRow('Total Amount', '₹${fee.amount.toInt()}'),
                      const SizedBox(height: 8),
                      _buildRow('Paid Amount', '₹${fee.paidAmount.toInt()}', color: AppColors.teal),
                      const SizedBox(height: 8),
                      _buildRow('Remaining Amount', '₹${fee.remainingAmount.toInt()}', color: AppColors.red, bold: true),
                      const SizedBox(height: 8),
                      _buildRow('Due Date', fee.dueDate.split('T').first),
                    ],
                  ),
                );
              }),
            ],
          ),
        );
      }),
    );
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
        Text(label, style: AppTextStyles.bodyMedium),
        Text(
          value,
          style: bold
              ? AppTextStyles.labelLarge.copyWith(color: color)
              : AppTextStyles.bodyMedium.copyWith(color: color),
        ),
      ],
    );
  }
}
