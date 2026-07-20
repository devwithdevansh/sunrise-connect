// lib/modules/notifications/views/notifications_view.dart
// Real notification inbox — fetches from backend, supports mark-as-read.

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/models/notification_model.dart';
import '../../../data/repositories/notification_repository.dart';
import '../../../core/routes/app_routes.dart';
import '../../dashboard/controllers/dashboard_controller.dart';

class NotificationsView extends StatelessWidget {
  const NotificationsView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<DashboardController>();
    final repo = NotificationRepository();

    Future<void> markAllRead() async {
      final sId = controller.student.value?.id;
      if (sId != null) {
        await repo.markAllAsRead(studentId: sId);
        for (final n in controller.notifications) {
          n.markAsReadFor(sId);
        }
      } else {
        await repo.markAllAsRead();
        for (final n in controller.notifications) {
          n.isRead = true;
        }
      }
      
      controller.unreadNotificationCount.value = 0;
      controller.notifications.refresh();
    }

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
        actions: [
          Obx(() {
            final hasUnread = controller.unreadNotificationCount.value > 0;
            if (!hasUnread) return const SizedBox.shrink();
            return TextButton(
              onPressed: markAllRead,
              child: Text(
                'Mark all read',
                style: AppTextStyles.labelLarge.copyWith(color: AppColors.primaryMid, fontSize: 12),
              ),
            );
          }),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.primaryMid,
        onRefresh: controller.refreshNotifications,
        child: Obx(() {
          if (controller.notifications.isEmpty) {
            return Center(
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: SizedBox(
                  height: MediaQuery.of(context).size.height * 0.6,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.notifications_none_rounded, size: 64, color: AppColors.inkLight),
                      const SizedBox(height: 16),
                      Text('All caught up!', style: AppTextStyles.h2),
                      const SizedBox(height: 8),
                      Text('No new notifications for your account.', style: AppTextStyles.bodyMedium),
                    ],
                  ),
                ),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            physics: const AlwaysScrollableScrollPhysics(),
            itemCount: controller.notifications.length,
            itemBuilder: (context, index) {
              final notif = controller.notifications[index];
              return _NotificationCard(
                notif: notif,
                studentId: controller.student.value?.id,
                onTap: () async {
                  final sId = controller.student.value?.id;
                  if (sId != null) {
                    if (!notif.isReadFor(sId)) {
                      await repo.markAsRead(notif.id, studentId: sId);
                      notif.markAsReadFor(sId);
                      controller.notifications.refresh();
                      controller.unreadNotificationCount.value =
                          controller.notifications.where((n) => !n.isReadFor(sId)).length;
                    }
                  } else {
                    if (!notif.isRead) {
                      await repo.markAsRead(notif.id);
                      notif.isRead = true;
                      controller.notifications.refresh();
                      controller.unreadNotificationCount.value =
                          controller.notifications.where((n) => !n.isRead).length;
                    }
                  }
                },
              );
            },
          );
        }),
      ),
    );
  }
}

class _NotificationCard extends StatefulWidget {
  final NotificationModel notif;
  final String? studentId;
  final VoidCallback onTap;
  const _NotificationCard({required this.notif, this.studentId, required this.onTap});

  @override
  State<_NotificationCard> createState() => _NotificationCardState();
}

class _NotificationCardState extends State<_NotificationCard> {
  bool _isExpanded = false;

  IconData get _icon {
    switch (widget.notif.type) {
      case 'PAYMENT_RECEIVED':
        return Icons.check_circle_rounded;
      case 'FEE_REMINDER':
        return Icons.calendar_today_rounded;
      case 'SYSTEM':
        return Icons.info_rounded;
      default:
        return Icons.campaign_rounded;
    }
  }

  Color get _iconColor {
    switch (widget.notif.type) {
      case 'PAYMENT_RECEIVED':
        return AppColors.teal;
      case 'FEE_REMINDER':
        return AppColors.amber;
      case 'SYSTEM':
        return AppColors.primaryMid;
      default:
        return AppColors.primaryMid;
    }
  }

  Color get _iconBg {
    switch (widget.notif.type) {
      case 'PAYMENT_RECEIVED':
        return AppColors.tealPale;
      case 'FEE_REMINDER':
        return AppColors.amberPale;
      default:
        return AppColors.primaryLight;
    }
  }

  String get _formattedDate {
    if (widget.notif.createdAt.isEmpty) return '';
    try {
      final dt = DateTime.parse(widget.notif.createdAt).toLocal();
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}, ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return widget.notif.createdAt.split('T').first;
    }
  }

  void _handleTap() {
    widget.onTap(); // Mark as read
    setState(() {
      _isExpanded = !_isExpanded;
    });
  }

  @override
  Widget build(BuildContext context) {
    final sId = widget.studentId;
    final isRead = sId != null ? widget.notif.isReadFor(sId) : widget.notif.isRead;

    return GestureDetector(
      onTap: _handleTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isRead ? AppColors.white : AppColors.primaryLight.withOpacity(0.4),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isRead ? AppColors.border : AppColors.primaryMid.withOpacity(0.25),
            width: isRead ? 1 : 1.5,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(color: _iconBg, shape: BoxShape.circle),
              child: Icon(_icon, color: _iconColor, size: 20),
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
                          widget.notif.title,
                          style: AppTextStyles.labelLarge.copyWith(
                            fontWeight: isRead ? FontWeight.w600 : FontWeight.w800,
                          ),
                        ),
                      ),
                      if (!isRead)
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(right: 8),
                          decoration: const BoxDecoration(
                            color: AppColors.primaryMid,
                            shape: BoxShape.circle,
                          ),
                        ),
                      AnimatedRotation(
                        turns: _isExpanded ? 0.5 : 0.0,
                        duration: const Duration(milliseconds: 200),
                        child: const Icon(
                          Icons.keyboard_arrow_down_rounded,
                          color: AppColors.inkLight,
                          size: 20,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  AnimatedSize(
                    duration: const Duration(milliseconds: 250),
                    curve: Curves.easeInOut,
                    alignment: Alignment.topCenter,
                    child: Text(
                      widget.notif.body,
                      maxLines: _isExpanded ? null : 2,
                      overflow: _isExpanded ? TextOverflow.visible : TextOverflow.ellipsis,
                      style: AppTextStyles.bodyMedium.copyWith(color: AppColors.inkMid),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _formattedDate,
                    style: AppTextStyles.bodySmall,
                  ),
                  
                  // Contextual actions when expanded
                  if (_isExpanded && widget.notif.type == 'FEE_REMINDER') ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () {
                          // Try changing dashboard tab to fee or routing to pending fees
                          // We'll route directly to pendingFees as it's safe.
                          Get.toNamed(AppRoutes.pendingFees);
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.amber,
                          side: const BorderSide(color: AppColors.amber),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                        ),
                        child: const Text('Pay Now', style: TextStyle(fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ],
                  if (_isExpanded && widget.notif.type == 'PAYMENT_RECEIVED') ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () {
                          Get.offNamed(AppRoutes.paymentHistory);
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.teal,
                          side: const BorderSide(color: AppColors.teal),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                        ),
                        child: const Text('View Receipt', style: TextStyle(fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
