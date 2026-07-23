import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/routes/app_routes.dart';
import '../../../../core/widgets/animated_button.dart';
import '../controllers/dashboard_controller.dart';
import 'section_header.dart';

/// 2x2 grid of quick action cards with colored accent icons,
/// live subtext counters and press animations.
class QuickActionsGrid extends StatelessWidget {
  final DashboardController controller;
  const QuickActionsGrid({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final pending = controller.totalPending.value.toInt();
      final paidCount = controller.mainFees.where((f) => f.isPaid).length;
      final unreadCount = controller.unreadNotificationCount.value;

      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(
            title: 'Quick Actions',
            icon: Icons.grid_view_rounded,
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _ActionCard(
                  icon: Icons.pending_actions_rounded,
                  label: 'Pay Fees',
                  subtext: pending > 0 ? '₹$pending due now' : 'No dues',
                  color: AppColors.amber,
                  route: AppRoutes.pendingFees,
                  highlight: pending > 0,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _ActionCard(
                  icon: Icons.receipt_rounded,
                  label: 'Receipts',
                  subtext: paidCount > 0 ? '$paidCount receipts' : 'No receipts',
                  color: AppColors.purple,
                  route: AppRoutes.receiptDetails,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _ActionCard(
                  icon: Icons.summarize_rounded,
                  label: 'Fee Status',
                  subtext: 'Track all dues',
                  color: AppColors.primaryMid,
                  route: AppRoutes.feeSummary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _ActionCard(
                  icon: Icons.notifications_active_rounded,
                  label: 'Notifications',
                  subtext: unreadCount > 0
                      ? '$unreadCount new alerts'
                      : 'All caught up',
                  color: AppColors.dawn,
                  route: AppRoutes.notifications,
                  highlight: unreadCount > 0,
                ),
              ),
            ],
          ),
        ],
      ),
    );
    });
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtext;
  final Color color;
  final String route;
  final bool highlight;

  const _ActionCard({
    required this.icon,
    required this.label,
    required this.subtext,
    required this.color,
    required this.route,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedTapButton(
      onTap: () => Get.toNamed(route),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: highlight ? color.withOpacity(0.35) : AppColors.border,
          ),
          boxShadow: [
            BoxShadow(
              color: highlight
                  ? color.withOpacity(0.08)
                  : AppColors.ink.withOpacity(0.03),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      label,
                      style: AppTextStyles.labelLarge.copyWith(fontSize: 14),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtext,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: highlight ? color : AppColors.inkLight,
                      fontSize: 11,
                      fontWeight:
                          highlight ? FontWeight.w600 : FontWeight.normal,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
