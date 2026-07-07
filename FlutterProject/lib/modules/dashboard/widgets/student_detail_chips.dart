import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../controllers/dashboard_controller.dart';

/// Horizontally scrollable chips showing the active student's
/// key details: class, medium, transport, RTE and fee status.
class StudentDetailChips extends StatelessWidget {
  final DashboardController controller;
  const StudentDetailChips({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    final s = controller.student.value;
    if (s == null) return const SizedBox.shrink();

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Obx(() {
        final pending = controller.totalPending.value;
        final allPaid = pending <= 0;

        return Row(
          children: [
            _DetailChip(
              icon: Icons.school_rounded,
              label: 'Std ${s.standard} - ${s.division}',
              color: AppColors.primaryMid,
              bgColor: AppColors.primaryLight,
            ),
            const SizedBox(width: 8),
            _DetailChip(
              icon: Icons.g_translate_rounded,
              label: '${s.medium} Medium',
              color: AppColors.dawn,
              bgColor: AppColors.dawn.withOpacity(0.12),
            ),
            const SizedBox(width: 8),
            _DetailChip(
              icon: Icons.directions_bus_rounded,
              label: s.transportType != 'None'
                  ? 'Transport: ${s.transportType}'
                  : 'No Transport',
              color: s.transportType != 'None'
                  ? AppColors.teal
                  : AppColors.inkLight,
              bgColor: s.transportType != 'None'
                  ? AppColors.tealPale
                  : AppColors.border.withOpacity(0.5),
            ),
            if (s.isRTE) ...[
              const SizedBox(width: 8),
              const _DetailChip(
                icon: Icons.verified_user_rounded,
                label: 'RTE Student',
                color: Color(0xFF0FB893),
                bgColor: Color(0xFFE8FAF5),
              ),
            ],
            const SizedBox(width: 8),
            _DetailChip(
              icon: allPaid
                  ? Icons.check_circle_rounded
                  : Icons.pending_rounded,
              label: allPaid ? 'Fees: All Paid' : 'Fees: Pending',
              color: allPaid ? AppColors.teal : AppColors.red,
              bgColor: allPaid ? AppColors.tealPale : AppColors.redPale,
            ),
          ],
        );
      }),
    );
  }
}

class _DetailChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final Color bgColor;

  const _DetailChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
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
}
