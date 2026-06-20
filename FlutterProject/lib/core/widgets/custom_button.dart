import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';

enum ButtonVariant { primary, sun, ghost, danger }

class CustomButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final ButtonVariant variant;
  final bool loading;
  final Widget? icon;
  final double? width;
  final double height;

  const CustomButton({
    super.key,
    required this.label,
    this.onTap,
    this.variant = ButtonVariant.primary,
    this.loading = false,
    this.icon,
    this.width,
    this.height = 54,
  });

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (variant) {
      ButtonVariant.primary => (AppColors.primaryMid, AppColors.white),
      ButtonVariant.sun     => (AppColors.sun, AppColors.ink),
      ButtonVariant.ghost   => (Colors.transparent, AppColors.primaryMid),
      ButtonVariant.danger  => (AppColors.redPale, AppColors.red),
    };

    return SizedBox(
      width: width ?? double.infinity,
      height: height,
      child: Material(
        color: bg,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: loading ? null : onTap,
          child: Container(
            decoration: variant == ButtonVariant.ghost
                ? BoxDecoration(
                    border: Border.all(color: AppColors.primaryMid, width: 1.5),
                    borderRadius: BorderRadius.circular(14),
                  )
                : null,
            alignment: Alignment.center,
            child: loading
                ? SizedBox(
                    width: 22, height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: fg,
                    ),
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (icon != null) ...[icon!, const SizedBox(width: 8)],
                      Text(label, style: AppTextStyles.button.copyWith(color: fg)),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
