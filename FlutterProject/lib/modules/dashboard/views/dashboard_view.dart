import 'package:flutter/material.dart';
import 'package:get/get.dart';
<<<<<<< HEAD
import '../../../../core/theme/app_colors.dart';
import '../../fees/payment_history/views/payment_history_view.dart';
import '../../../services/sound_service.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/routes/app_routes.dart';
import '../../../../data/models/fee_model.dart';
import '../../../../data/models/notification_model.dart';
import '../../../../core/widgets/animated_button.dart';
import '../../../../core/widgets/shimmer_loader.dart';
=======
>>>>>>> 3f130de (feat: integrate new splash UI)
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lottie/lottie.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../controllers/dashboard_controller.dart';
import '../widgets/dashboard_header.dart';
import '../widgets/dashboard_shimmer.dart';
import '../widgets/student_detail_chips.dart';
import '../widgets/quick_actions_grid.dart';
import '../widgets/upcoming_dues_section.dart';
import '../widgets/notifications_section.dart';

/// Main dashboard screen.
///
/// Structure:
///   1. Gradient header (greeting, bell, avatar, children pills, fee glass card)
///   2. Student detail chips
///   3. Quick actions grid
///   4. Upcoming dues
///   5. Latest notifications
///
/// Every section is a dedicated widget for maintainability, and each one
/// animates in with a staggered fade + slide for a polished first paint.
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
            return const DashboardShimmer();
          }

          if (controller.student.value == null) {
            return _buildEmptyState();
          }

          return CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            slivers: [
              SliverToBoxAdapter(
                child: DashboardHeader(controller: controller)
                    .animate()
                    .fade(duration: 350.ms),
              ),
              SliverPadding(
                padding: const EdgeInsets.only(top: 20, bottom: 32),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    StudentDetailChips(controller: controller)
                        .animate()
                        .fade(duration: 400.ms)
                        .slideY(begin: 0.2, curve: Curves.easeOutQuad),
                    const SizedBox(height: 26),
                    QuickActionsGrid(controller: controller)
                        .animate()
                        .fade(delay: 100.ms, duration: 400.ms)
                        .slideY(begin: 0.2, curve: Curves.easeOutQuad),
                    const SizedBox(height: 26),
                    UpcomingDuesSection(controller: controller)
                        .animate()
                        .fade(delay: 200.ms, duration: 400.ms)
                        .slideY(begin: 0.2, curve: Curves.easeOutQuad),
                    const SizedBox(height: 26),
                    NotificationsSection(controller: controller)
                        .animate()
                        .fade(delay: 300.ms, duration: 400.ms)
                        .slideY(begin: 0.2, curve: Curves.easeOutQuad),
                  ]),
                ),
              ),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Lottie.network(
            'https://lottie.host/88029c73-45ef-4573-ad1f-bb7ad92671d4/p4C3O22934.json',
            width: 200,
            height: 200,
            repeat: false,
          ),
          const SizedBox(height: 16),
          Text('No student records found.', style: AppTextStyles.h3),
          const SizedBox(height: 8),
          Text(
<<<<<<< HEAD
            '${(progress * 100).toStringAsFixed(0)}% paid of total fees',
            style: AppTextStyles.bodySmall.copyWith(
              color: Colors.white.withOpacity(0.7),
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTranslucentSummaryTile({
    required String label,
    required double amount,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Colors.white.withOpacity(0.05),
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: AppTextStyles.labelSmall.copyWith(
                color: Colors.white.withOpacity(0.6),
                fontSize: 11,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 6),
            Text(
              '₹${amount.toInt()}',
              style: AppTextStyles.h2.copyWith(
                color: color,
                fontSize: 15,
                fontWeight: FontWeight.w800,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStudentDetailsPills() {
    final s = controller.student.value;
    if (s == null) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        child: Obx(() {
          final pending = controller.totalPending.value;
          final allPaid = pending <= 0;

          return Row(
            children: [
              _buildDetailChip(
                icon: Icons.school_rounded,
                label: 'Std ${s.standard} - ${s.division}',
                color: AppColors.primaryMid,
                bgColor: AppColors.primaryLight,
              ),
              const SizedBox(width: 8),
              _buildDetailChip(
                icon: Icons.g_translate_rounded,
                label: '${s.medium} Medium',
                color: AppColors.dawn,
                bgColor: AppColors.dawn.withOpacity(0.12),
              ),
              const SizedBox(width: 8),
              _buildDetailChip(
                icon: Icons.directions_bus_rounded,
                label: s.transportType != 'None'
                    ? 'Transport: ${s.transportType}'
                    : 'No Transport',
                color: s.transportType != 'None' ? AppColors.teal : AppColors.inkLight,
                bgColor: s.transportType != 'None'
                    ? AppColors.tealPale
                    : AppColors.border.withOpacity(0.5),
              ),
              if (s.isRTE) ...[
                const SizedBox(width: 8),
                _buildDetailChip(
                  icon: Icons.verified_user_rounded,
                  label: 'RTE Student',
                  color: const Color(0xFF0FB893),
                  bgColor: const Color(0xFFE8FAF5),
                ),
              ],
              const SizedBox(width: 8),
              _buildDetailChip(
                icon: allPaid ? Icons.check_circle_rounded : Icons.pending_rounded,
                label: allPaid ? 'Fees: All Paid' : 'Fees: Pending',
                color: allPaid ? AppColors.teal : AppColors.red,
                bgColor: allPaid ? AppColors.tealPale : AppColors.redPale,
              ),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildDetailChip({
    required IconData icon,
    required String label,
    required Color color,
    required Color bgColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withOpacity(0.15),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: AppTextStyles.labelLarge.copyWith(
              color: color,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionsGrid() {
    final pending = controller.totalPending.value.toInt();
    final paidCount = controller.mainFees.where((f) => f.isPaid).length;
    final unreadCount = controller.notifications.where((n) => !n.isRead).length;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Quick Actions', style: AppTextStyles.h2),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildGridActionCard(
                  icon: Icons.pending_actions_rounded,
                  label: 'Pay Fees',
                  subtext: pending > 0 ? '₹$pending due now' : 'No dues',
                  color: AppColors.amber,
                  route: AppRoutes.pendingFees,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildGridActionCard(
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
                child: _buildGridActionCard(
                  icon: Icons.summarize_rounded,
                  label: 'Fee Status',
                  subtext: 'Track all dues',
                  color: AppColors.primaryMid,
                  route: AppRoutes.feeSummary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildGridActionCard(
                  icon: Icons.notifications_active_rounded,
                  label: 'Notifications',
                  subtext: unreadCount > 0 ? '$unreadCount new alerts' : '0 new alerts',
                  color: AppColors.dawn,
                  route: AppRoutes.notifications,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGridActionCard({
    required IconData icon,
    required String label,
    required String subtext,
    required Color color,
    required String route,
  }) {
    return AnimatedTapButton(
      onTap: () => Get.toNamed(route),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.ink.withOpacity(0.03),
              blurRadius: 10,
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
                shape: BoxShape.circle,
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
                      style: AppTextStyles.labelLarge.copyWith(
                        fontSize: 14,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtext,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.inkLight,
                      fontSize: 11,
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

  Widget _buildFeesList() {
    return Obx(() {
      final pending = controller.mainFees.where((f) => !f.isPaid).take(3).toList();
      if (pending.isEmpty) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Upcoming Dues', style: AppTextStyles.h3),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8FAF5),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFB0EDD9)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_rounded, color: AppColors.teal, size: 24),
                    const SizedBox(width: 12),
                    Text(
                      'All Fees Paid',
                      style: AppTextStyles.labelLarge.copyWith(color: AppColors.teal),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Upcoming Dues', style: AppTextStyles.h3),
                TextButton(
                  onPressed: () => Get.toNamed(AppRoutes.pendingFees),
                  style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      minimumSize: Size.zero),
                  child: Text('See All',
                      style: AppTextStyles.labelLarge.copyWith(color: AppColors.primaryMid)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...pending.map((f) => _FeeRowCard(fee: f, controller: controller)),
          ],
        ),
      );
    });
  }

  Widget _buildNotifications() {
    return Obx(() {
      final list = controller.notifications.take(2).toList();
      if (list.isEmpty) return const SizedBox.shrink();
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Notifications', style: AppTextStyles.h3),
                TextButton(
                  onPressed: () => Get.toNamed(AppRoutes.notifications),
                  style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      minimumSize: Size.zero),
                  child: Text('See All',
                      style: AppTextStyles.labelLarge.copyWith(color: AppColors.primaryMid)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...list.map((n) => _NotifCard(notif: n)),
          ],
        ),
      );
    });
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
                  Text(fee.termName, style: AppTextStyles.labelLarge, maxLines: 1, overflow: TextOverflow.ellipsis),
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
        title: Text('Pay Fees', style: AppTextStyles.h2),
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
              SoundService.instance.play(AppSound.click);
              Get.back();
              controller.payFee(fee);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryMid,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Pay Full Amount', style: TextStyle(color: Colors.white)),
=======
            'Please contact the school administrator.',
            style: AppTextStyles.bodyMedium,
>>>>>>> 3f130de (feat: integrate new splash UI)
          ),
        ],
      ),
    );
  }
}
