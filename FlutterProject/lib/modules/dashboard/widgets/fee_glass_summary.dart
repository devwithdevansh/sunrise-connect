import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/routes/app_routes.dart';
import '../../../../core/widgets/animated_button.dart';
import '../controllers/dashboard_controller.dart';

/// Frosted-glass fee summary card that sits inside the gradient header.
/// Features an animated progress bar and animated amount counters.
class FeeGlassSummary extends StatelessWidget {
  final DashboardController controller;
  const FeeGlassSummary({super.key, required this.controller});

  static const _paidColor = Color(0xFF4ADE80);
  static const _pendingColor = Color(0xFFFCA5A5);

  @override
  Widget build(BuildContext context) {
    final total = controller.totalFees.value;
    final paid = controller.totalPaid.value;
    final pending = controller.totalPending.value;
    final progress = total > 0 ? (paid / total).clamp(0.0, 1.0) : 0.0;

    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: Colors.white.withOpacity(0.22),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.account_balance_wallet_rounded,
                          color: Colors.white,
                          size: 17,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Fee Summary',
                        style: AppTextStyles.h3.copyWith(
                          color: Colors.white,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                  AnimatedTapButton(
                    onTap: () => Get.toNamed(AppRoutes.feeSummary),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.15),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Text(
                            'Details',
                            style: AppTextStyles.labelLarge.copyWith(
                              color: Colors.white,
                              fontSize: 11,
                            ),
                          ),
                          const SizedBox(width: 2),
                          const Icon(Icons.arrow_forward_rounded,
                              color: Colors.white, size: 12),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  _SummaryTile(
                    label: 'Total Fees',
                    amount: total,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 10),
                  _SummaryTile(
                    label: 'Paid',
                    amount: paid,
                    color: _paidColor,
                    icon: Icons.check_circle_rounded,
                  ),
                  const SizedBox(width: 10),
                  _SummaryTile(
                    label: 'Pending',
                    amount: pending,
                    color: _pendingColor,
                    icon: Icons.hourglass_bottom_rounded,
                  ),
                ],
              ),
              const SizedBox(height: 18),
              // Animated progress bar
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: progress),
                duration: const Duration(milliseconds: 900),
                curve: Curves.easeOutCubic,
                builder: (context, value, _) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: value,
                          backgroundColor: Colors.white.withOpacity(0.15),
                          valueColor:
                              const AlwaysStoppedAnimation<Color>(_paidColor),
                          minHeight: 8,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${(value * 100).toStringAsFixed(0)}% paid',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: Colors.white.withOpacity(0.75),
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (pending > 0)
                            Text(
                              '₹${pending.toInt()} remaining',
                              style: AppTextStyles.bodySmall.copyWith(
                                color: _pendingColor.withOpacity(0.9),
                                fontSize: 11,
                              ),
                            )
                          else
                            Text(
                              'All cleared',
                              style: AppTextStyles.bodySmall.copyWith(
                                color: _paidColor,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                        ],
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SummaryTile extends StatelessWidget {
  final String label;
  final double amount;
  final Color color;
  final IconData? icon;

  const _SummaryTile({
    required this.label,
    required this.amount,
    required this.color,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Colors.white.withOpacity(0.08),
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 11, color: color.withOpacity(0.8)),
                  const SizedBox(width: 4),
                ],
                Flexible(
                  child: Text(
                    label,
                    style: AppTextStyles.labelSmall.copyWith(
                      color: Colors.white.withOpacity(0.6),
                      fontSize: 10.5,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            // Animated amount counter
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: amount),
              duration: const Duration(milliseconds: 800),
              curve: Curves.easeOutCubic,
              builder: (context, value, _) {
                return FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    '₹${value.toInt()}',
                    style: AppTextStyles.h2.copyWith(
                      color: color,
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
