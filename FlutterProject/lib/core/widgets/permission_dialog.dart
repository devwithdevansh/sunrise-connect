import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import 'custom_button.dart';

class PermissionDialog extends StatelessWidget {
  final VoidCallback onAllow;
  final VoidCallback onDeny;

  const PermissionDialog({
    super.key,
    required this.onAllow,
    required this.onDeny,
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      backgroundColor: AppColors.white,
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppColors.primaryLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.notifications_active_rounded,
                color: AppColors.primaryMid,
                size: 40,
              ),
            ).animate().scale(delay: 200.ms, duration: 400.ms, curve: Curves.easeOutBack),
            const SizedBox(height: 24),
            Text(
              'Stay Updated',
              style: AppTextStyles.h2.copyWith(color: AppColors.ink),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Allow notifications and sound so we can send you instant fee reminders and payment receipts.',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.inkLight),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            CustomButton(
              label: 'Allow Notifications',
              onTap: onAllow,
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: onDeny,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.inkLight,
                minimumSize: const Size(double.infinity, 48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                'Not Now',
                style: AppTextStyles.labelLarge.copyWith(color: AppColors.inkLight),
              ),
            ),
          ],
        ),
      ),
    ).animate().fade().scale(curve: Curves.easeOutBack, duration: 300.ms);
  }
}
