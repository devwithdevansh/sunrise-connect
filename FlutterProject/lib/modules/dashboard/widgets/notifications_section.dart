import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/routes/app_routes.dart';
import '../../../../data/models/notification_model.dart';
import '../controllers/dashboard_controller.dart';
import 'section_header.dart';

/// Latest notifications preview (max 2) with a "See All" action.
class NotificationsSection extends StatelessWidget {
  final DashboardController controller;
  const NotificationsSection({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final list = controller.notifications.take(2).toList();
      if (list.isEmpty) return const SizedBox.shrink();

      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionHeader(
              title: 'Notifications',
              icon: Icons.notifications_rounded,
              iconColor: AppColors.dawn,
              actionLabel: 'See All',
              onAction: () => Get.toNamed(AppRoutes.notifications),
            ),
            const SizedBox(height: 12),
            ...list.map((n) => _NotifCard(notif: n)),
          ],
        ),
      );
    });
  }
}

class _NotifCard extends StatelessWidget {
  final NotificationModel notif;
  const _NotifCard({required this.notif});

  @override
  Widget build(BuildContext context) {
    final isSuccess = notif.type == 'SUCCESS';
    final iconColor = isSuccess ? AppColors.teal : AppColors.primaryMid;
    final iconBg = isSuccess ? AppColors.tealPale : AppColors.primaryLight;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: notif.isRead
              ? AppColors.border
              : iconColor.withOpacity(0.3),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isSuccess
                  ? Icons.check_circle_rounded
                  : Icons.notifications_active_rounded,
              color: iconColor,
              size: 19,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        notif.title,
                        style: AppTextStyles.labelLarge,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (!notif.isRead) ...[
                      const SizedBox(width: 6),
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: iconColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  notif.body,
                  style: AppTextStyles.bodySmall,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
