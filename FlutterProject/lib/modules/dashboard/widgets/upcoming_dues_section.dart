import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/routes/app_routes.dart';
import '../../../../core/widgets/animated_button.dart';
import '../../../../data/models/fee_model.dart';
import '../../../../services/sound_service.dart';
import '../controllers/dashboard_controller.dart';
import 'section_header.dart';

/// Upcoming dues list showing at most 3 pending fees, or a celebratory
/// "All Fees Paid" state. Each row opens the pay-full-amount dialog.
class UpcomingDuesSection extends StatelessWidget {
  final DashboardController controller;
  const UpcomingDuesSection({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final pending =
          controller.mainFees.where((f) => !f.isPaid).take(3).toList();

      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionHeader(
              title: 'Upcoming Dues',
              icon: Icons.event_note_rounded,
              iconColor: AppColors.amber,
              actionLabel: pending.isEmpty ? null : 'See All',
              onAction: pending.isEmpty
                  ? null
                  : () => Get.toNamed(AppRoutes.pendingFees),
            ),
            const SizedBox(height: 12),
            if (pending.isEmpty)
              const _AllPaidCard()
            else
              ...pending.map(
                (f) => _FeeRowCard(fee: f, controller: controller),
              ),
          ],
        ),
      );
    });
  }
}

class _AllPaidCard extends StatelessWidget {
  const _AllPaidCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 22),
      decoration: BoxDecoration(
        color: const Color(0xFFE8FAF5),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFB0EDD9)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.teal.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_circle_rounded,
              color: AppColors.teal,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'All Fees Paid',
                  style:
                      AppTextStyles.labelLarge.copyWith(color: AppColors.teal),
                ),
                const SizedBox(height: 2),
                Text(
                  'You are all caught up. Great job!',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.teal.withOpacity(0.75),
                    fontSize: 11.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FeeRowCard extends StatelessWidget {
  final FeeModel fee;
  final DashboardController controller;
  const _FeeRowCard({required this.fee, required this.controller});

  @override
  Widget build(BuildContext context) {
    final isOverdue = fee.dueDate.isNotEmpty &&
        DateTime.tryParse(fee.dueDate)?.isBefore(DateTime.now()) == true;
    final statusColor = fee.isPartial
        ? AppColors.amber
        : isOverdue
            ? AppColors.red
            : AppColors.primaryMid;
    final statusBg = fee.isPartial
        ? AppColors.amberPale
        : isOverdue
            ? AppColors.redPale
            : AppColors.primaryLight;
    final statusLabel = fee.isPartial
        ? 'Partial'
        : isOverdue
            ? 'Overdue'
            : 'Pending';

    return AnimatedTapButton(
      onTap: () {
        SoundService.instance.play(AppSound.click);
        _showPaymentDialog(context);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.ink.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: statusBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons.calendar_today_rounded,
                color: statusColor,
                size: 18,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    fee.termName,
                    style: AppTextStyles.labelLarge,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Due: ${fee.dueDate.split('T').first}',
                    style: AppTextStyles.bodySmall,
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '₹${fee.remainingAmount.toInt()}',
                  style: AppTextStyles.h3.copyWith(color: statusColor),
                ),
                const SizedBox(height: 4),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    statusLabel,
                    style:
                        AppTextStyles.labelSmall.copyWith(color: statusColor),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showPaymentDialog(BuildContext context) {
    Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Pay Fees', style: AppTextStyles.h2),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Term: ${fee.termName}', style: AppTextStyles.labelLarge),
            const SizedBox(height: 8),
            Text(
              'Due Date: ${fee.dueDate.split('T').first}',
              style: AppTextStyles.bodyMedium,
            ),
            const SizedBox(height: 16),
            Text(
              'Total Outstanding: ₹${fee.remainingAmount.toInt()}',
              style: AppTextStyles.h3.copyWith(color: AppColors.primaryMid),
            ),
            const SizedBox(height: 8),
            const Text(
              'Note: In accordance with school policies, partial payments are not allowed. You must settle this fee in full.',
              style: TextStyle(color: Colors.red, fontSize: 12, height: 1.4),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              SoundService.instance.play(AppSound.click);
              Get.back();
            },
            child: Text(
              'Cancel',
              style: AppTextStyles.labelLarge.copyWith(color: AppColors.ink),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              SoundService.instance.play(AppSound.click);
              Get.back();
              controller.payFee(fee);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryMid,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text(
              'Pay Full Amount',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}
