import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';

/// A reusable section header with a title, an optional accent icon,
/// and an optional "See All" action — keeps every section visually consistent.
class SectionHeader extends StatelessWidget {
  final String title;
  final IconData? icon;
  final Color? iconColor;
  final String? actionLabel;
  final VoidCallback? onAction;

  const SectionHeader({
    super.key,
    required this.title,
    this.icon,
    this.iconColor,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            if (icon != null) ...[
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: (iconColor ?? AppColors.primaryMid).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Icon(icon, size: 16, color: iconColor ?? AppColors.primaryMid),
              ),
              const SizedBox(width: 10),
            ],
            Text(title, style: AppTextStyles.h3.copyWith(fontSize: 16)),
          ],
        ),
        if (actionLabel != null && onAction != null)
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onAction,
              borderRadius: BorderRadius.circular(10),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                child: Row(
                  children: [
                    Text(
                      actionLabel!,
                      style: AppTextStyles.labelLarge.copyWith(
                        color: AppColors.primaryMid,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(width: 2),
                    const Icon(Icons.chevron_right_rounded,
                        size: 16, color: AppColors.primaryMid),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
