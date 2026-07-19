import 'package:flutter/material.dart';
import 'package:get/get.dart';
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
            errorBuilder: (context, error, stackTrace) {
              return const Icon(
                Icons.person_off_rounded,
                size: 80,
                color: Colors.grey,
              );
            },
          ),
          const SizedBox(height: 16),
          Text('No student records found.', style: AppTextStyles.h3),
          const SizedBox(height: 8),
          Text(
            'Please contact the school administrator.',
            style: AppTextStyles.bodyMedium,
          ),
        ],
      ),
    );
  }
}
