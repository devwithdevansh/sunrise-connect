import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../dashboard/controllers/dashboard_controller.dart';

class NotificationsView extends StatelessWidget {
  const NotificationsView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<DashboardController>();

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text('Notifications', style: AppTextStyles.h2),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.ink, size: 20),
          onPressed: () => Get.back(),
        ),
      ),
      body: Obx(() {
        if (controller.notifications.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.notifications_none_rounded, size: 64, color: AppColors.inkLight),
                const SizedBox(height: 16),
                Text('All caught up! 🎉', style: AppTextStyles.h2),
                const SizedBox(height: 8),
                Text('No new notifications for your account.', style: AppTextStyles.bodyMedium),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: controller.notifications.length,
          itemBuilder: (context, index) {
            final notif = controller.notifications[index];
            final isSuccess = notif.type == 'SUCCESS';
            final cardBg = isSuccess ? AppColors.tealPale : AppColors.primaryLight;
            final iconColor = isSuccess ? AppColors.teal : AppColors.primaryMid;
            final iconData = isSuccess ? Icons.check_circle_rounded : Icons.notifications_active_rounded;

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    iconData,
                    color: iconColor,
                    size: 22,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(notif.title, style: AppTextStyles.labelLarge),
                        const SizedBox(height: 4),
                        Text(
                          notif.message,
                          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.inkMid),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          notif.createdAt.split('T').first,
                          style: AppTextStyles.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      }),
    );
  }
}
