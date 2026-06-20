import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../data/models/fee_model.dart';
import '../../../dashboard/controllers/dashboard_controller.dart';

class PendingFeesView extends StatelessWidget {
  const PendingFeesView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<DashboardController>();

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text('Pending Fees', style: AppTextStyles.h2),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.ink, size: 20),
          onPressed: () => Get.back(),
        ),
      ),
      body: Obx(() {
        final pendingList = controller.fees.where((f) => !f.isPaid).toList();

        if (pendingList.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.check_circle_outline_rounded, size: 64, color: AppColors.teal),
                const SizedBox(height: 16),
                Text('All Fees Paid! 🎉', style: AppTextStyles.h2),
                const SizedBox(height: 8),
                Text('There are no outstanding dues on this account.', style: AppTextStyles.bodyMedium),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: pendingList.length,
          itemBuilder: (context, index) {
            final fee = pendingList[index];
            return _buildPendingFeeCard(context, fee, controller);
          },
        );
      }),
    );
  }

  Widget _buildPendingFeeCard(BuildContext context, FeeModel fee, DashboardController controller) {
    final now = DateTime.now();
    final dueDate = DateTime.tryParse(fee.dueDate) ?? now;
    final isOverdue = dueDate.isBefore(now);
    final statusColor = isOverdue ? AppColors.red : AppColors.amber;
    final statusBg = isOverdue ? AppColors.redPale : AppColors.amberPale;
    final statusLabel = isOverdue ? 'Overdue' : 'Pending';

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
                decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(8)),
                child: Text(
                  statusLabel,
                  style: AppTextStyles.labelSmall.copyWith(color: statusColor),
                ),
              ),
            ],
          ),
          const Divider(height: 24, color: AppColors.border),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Outstanding Balance', style: AppTextStyles.bodySmall),
                  const SizedBox(height: 4),
                  Text('₹${fee.remainingAmount.toInt()}', style: AppTextStyles.h2.copyWith(color: AppColors.primaryMid)),
                ],
              ),
              ElevatedButton(
                onPressed: () => _showPaymentDialog(context, fee, controller),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryMid,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                ),
                child: const Text('Pay Now'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.calendar_today_rounded, size: 14, color: AppColors.inkLight),
              const SizedBox(width: 6),
              Text(
                'Due Date: ${fee.dueDate.split('T').first}',
                style: AppTextStyles.bodySmall,
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showPaymentDialog(BuildContext context, FeeModel fee, DashboardController controller) {
    Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Confirm Payment 💳', style: AppTextStyles.h2),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Term: ${fee.termName}', style: AppTextStyles.labelLarge),
            const SizedBox(height: 8),
            Text(
              'Amount to Pay: ₹${fee.remainingAmount.toInt()}',
              style: AppTextStyles.h2.copyWith(color: AppColors.primaryMid),
            ),
            const SizedBox(height: 16),
            const Text(
              'Important Notice: Partial payments are disabled. The full outstanding amount must be paid.',
              style: TextStyle(color: AppColors.red, fontSize: 12, height: 1.4, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: Text('Cancel', style: AppTextStyles.labelLarge.copyWith(color: AppColors.ink)),
          ),
          ElevatedButton(
            onPressed: () {
              Get.back();
              controller.payFee(fee);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryMid,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Confirm & Pay', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
