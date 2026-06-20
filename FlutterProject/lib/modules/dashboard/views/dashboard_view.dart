import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/routes/app_routes.dart';
import '../../../../data/models/fee_model.dart';
import '../../../../data/models/notification_model.dart';
import '../controllers/dashboard_controller.dart';

class DashboardView extends GetView<DashboardController> {
  const DashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: RefreshIndicator(
        onRefresh: controller.refreshData,
        color: AppColors.primaryMid,
        child: Obx(() {
          if (controller.isLoading.value && controller.student.value == null) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primaryMid));
          }

          if (controller.student.value == null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.school_rounded, size: 64, color: AppColors.border),
                  const SizedBox(height: 16),
                  Text('No student records found.', style: AppTextStyles.h3),
                  const SizedBox(height: 8),
                  Text('Please contact the school administrator.', style: AppTextStyles.bodyMedium),
                ],
              ),
            );
          }

          return CustomScrollView(
            slivers: [
              _buildAppBar(),
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    _buildStudentCard(),
                    const SizedBox(height: 16),
                    _buildFeeSummaryCard(),
                    const SizedBox(height: 20),
                    _buildQuickActions(),
                    const SizedBox(height: 20),
                    _buildFeesList(),
                    const SizedBox(height: 20),
                    _buildNotifications(),
                    const SizedBox(height: 24),
                  ]),
                ),
              ),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildAppBar() {
    final s = controller.student.value;
    final unread = controller.notifications.where((n) => !n.isRead).length;

    return SliverAppBar(
      expandedHeight: 0,
      floating: true,
      pinned: true,
      backgroundColor: AppColors.white,
      elevation: 0,
      scrolledUnderElevation: 1,
      shadowColor: AppColors.border,
      automaticallyImplyLeading: false,
      title: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.wb_sunny_rounded, color: Colors.white, size: 18),
          ),
          const SizedBox(width: 10),
          Text('Sunrise Connect', style: AppTextStyles.h3),
        ],
      ),
      actions: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined, color: AppColors.ink),
              onPressed: () => Get.toNamed(AppRoutes.notifications),
            ),
            if (unread > 0)
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  width: 16,
                  height: 16,
                  decoration: const BoxDecoration(
                    color: AppColors.red,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      '$unread',
                      style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ),
          ],
        ),
        GestureDetector(
          onTap: () => Get.toNamed(AppRoutes.profile),
          child: Padding(
            padding: const EdgeInsets.only(right: 16, left: 4),
            child: CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.primaryLight,
              child: Text(
                s?.initials ?? '?',
                style: AppTextStyles.labelLarge.copyWith(color: AppColors.primaryMid, fontSize: 12),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStudentCard() {
    final s = controller.student.value!;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(.2),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: Colors.white.withOpacity(.2),
            child: Text(
              s.initials,
              style: AppTextStyles.h2.copyWith(color: Colors.white),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s.name, style: AppTextStyles.h3.copyWith(color: Colors.white)),
                const SizedBox(height: 4),
                Text(s.classLabel, style: AppTextStyles.bodySmall.copyWith(color: Colors.white70)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '2026-27',
              style: AppTextStyles.labelSmall.copyWith(color: Colors.white70),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeeSummaryCard() {
    return Obx(() {
    final total = controller.totalFees.value;
    final paid = controller.totalPaid.value;
    final pending = controller.totalPending.value;
    final progress = total > 0 ? paid / total : 0.0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Fee Summary', style: AppTextStyles.h3),
              TextButton(
                onPressed: () => Get.toNamed(AppRoutes.feeSummary),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  minimumSize: Size.zero,
                ),
                child: Text('View All', style: AppTextStyles.labelLarge.copyWith(color: AppColors.primaryMid)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _SummaryTile(
                label: 'Total Fees',
                amount: total,
                color: AppColors.primaryMid,
                bg: AppColors.primaryLight,
              ),
              const SizedBox(width: 12),
              _SummaryTile(
                label: 'Paid',
                amount: paid,
                color: AppColors.teal,
                bg: AppColors.tealPale,
              ),
              const SizedBox(width: 12),
              _SummaryTile(
                label: 'Pending',
                amount: pending,
                color: AppColors.red,
                bg: AppColors.redPale,
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: AppColors.border,
              color: AppColors.teal,
              minHeight: 8,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${(progress * 100).toStringAsFixed(0)}% paid of total fees',
            style: AppTextStyles.bodySmall,
          ),
        ],
      ),
    );
    });
  }

  Widget _buildQuickActions() {
    final actions = [
      _QA(icon: Icons.pending_actions_rounded, label: 'Pending', color: AppColors.amber, route: AppRoutes.pendingFees),
      _QA(icon: Icons.history_rounded, label: 'History', color: AppColors.teal, route: AppRoutes.paymentHistory),
      _QA(icon: Icons.receipt_rounded, label: 'Receipts', color: AppColors.purple, route: AppRoutes.receiptDetails),
      _QA(icon: Icons.summarize_rounded, label: 'Summary', color: AppColors.primaryMid, route: AppRoutes.feeSummary),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Quick Actions', style: AppTextStyles.h3),
        const SizedBox(height: 12),
        Row(
          children: actions
              .map((a) => Expanded(
                    child: GestureDetector(
                      onTap: () => Get.toNamed(a.route),
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(
                          color: AppColors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: a.color.withOpacity(.12),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(a.icon, color: a.color, size: 20),
                            ),
                            const SizedBox(height: 8),
                            Text(a.label, style: AppTextStyles.labelSmall),
                          ],
                        ),
                      ),
                    ),
                  ))
              .toList(),
        ),
      ],
    );
  }

  Widget _buildFeesList() {
    return Obx(() {
    final pending = controller.fees.where((f) => !f.isPaid).take(3).toList();
    if (pending.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Upcoming Dues', style: AppTextStyles.h3),
            TextButton(
              onPressed: () => Get.toNamed(AppRoutes.pendingFees),
              style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), minimumSize: Size.zero),
              child: Text('See All', style: AppTextStyles.labelLarge.copyWith(color: AppColors.primaryMid)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...pending.map((f) => _FeeRowCard(fee: f, controller: controller)),
      ],
    );
    });
  }

  Widget _buildNotifications() {
    return Obx(() {
    final list = controller.notifications.take(2).toList();
    if (list.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Notifications', style: AppTextStyles.h3),
            TextButton(
              onPressed: () => Get.toNamed(AppRoutes.notifications),
              style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), minimumSize: Size.zero),
              child: Text('See All', style: AppTextStyles.labelLarge.copyWith(color: AppColors.primaryMid)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...list.map((n) => _NotifCard(notif: n)),
      ],
    );
    });
  }
}

class _SummaryTile extends StatelessWidget {
  final String label;
  final double amount;
  final Color color;
  final Color bg;
  const _SummaryTile({required this.label, required this.amount, required this.color, required this.bg});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: AppTextStyles.labelSmall.copyWith(color: color)),
            const SizedBox(height: 4),
            Text(
              '₹${amount.toInt()}',
              style: AppTextStyles.h3.copyWith(color: color, fontSize: 14),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
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
            : AppColors.red;
    final statusBg = fee.isPartial ? AppColors.amberPale : AppColors.redPale;
    final statusLabel = fee.isPartial
        ? 'Partial'
        : isOverdue
            ? 'Overdue'
            : 'Pending';

    return GestureDetector(
      onTap: () => _showPaymentDialog(context),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(10)),
              child: Icon(Icons.calendar_today_rounded, color: statusColor, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(fee.termName, style: AppTextStyles.labelLarge),
                  Text('Due: ${fee.dueDate.split('T').first}', style: AppTextStyles.bodySmall),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('₹${fee.remainingAmount.toInt()}', style: AppTextStyles.h3.copyWith(color: statusColor)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(6)),
                  child: Text(statusLabel, style: AppTextStyles.labelSmall.copyWith(color: statusColor)),
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
        title: Text('Pay Fees 💳', style: AppTextStyles.h2),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Term: ${fee.termName}', style: AppTextStyles.labelLarge),
            const SizedBox(height: 8),
            Text('Due Date: ${fee.dueDate.split('T').first}', style: AppTextStyles.bodyMedium),
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
            child: const Text('Pay Full Amount', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

class _NotifCard extends StatelessWidget {
  final NotificationModel notif;
  const _NotifCard({required this.notif});

  @override
  Widget build(BuildContext context) {
    final isSuccess = notif.type == 'SUCCESS';
    final cardBg = isSuccess ? AppColors.tealPale : AppColors.primaryLight;
    final iconColor = isSuccess ? AppColors.teal : AppColors.primaryMid;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            isSuccess ? Icons.check_circle_rounded : Icons.notifications_active_rounded,
            color: iconColor,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(notif.title, style: AppTextStyles.labelLarge),
                const SizedBox(height: 2),
                Text(notif.message, style: AppTextStyles.bodySmall, maxLines: 2, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QA {
  final IconData icon;
  final String label;
  final Color color;
  final String route;
  const _QA({required this.icon, required this.label, required this.color, required this.route});
}
