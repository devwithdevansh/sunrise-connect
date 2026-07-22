
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/constants/storage_keys.dart';
import '../../../core/services/fcm_service.dart';
import '../../dashboard/controllers/dashboard_controller.dart';
import '../../dashboard/controllers/dashboard_controller.dart';
import '../../../services/sound_service.dart';
import 'package:flutter_animate/flutter_animate.dart';

class ProfileView extends StatelessWidget {
  const ProfileView({super.key});

  Future<void> _logout() async {
    SoundService.instance.play(AppSound.pop);
    
    // Unregister FCM token from backend to stop receiving notifications
    await FcmService.removeToken();

    final prefs = await SharedPreferences.getInstance();
    const secureStorage = FlutterSecureStorage();
    await secureStorage.delete(key: StorageKeys.accessToken);
    await secureStorage.delete(key: 'refresh_token');
    await prefs.remove(StorageKeys.parentId);
    await prefs.remove(StorageKeys.studentId);
    await prefs.remove(StorageKeys.phone);
    await prefs.setBool(StorageKeys.isLoggedIn, false);

    Get.offAllNamed(AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<DashboardController>();

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text('My Profile', style: AppTextStyles.h2),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.ink, size: 20),
          onPressed: () => Get.back(),
        ),
      ),
      body: Obx(() {
        final s = controller.student.value;
        if (s == null) {
          return const Center(child: Text('No student records found'));
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header Card
              Container(
                padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.1), width: 1),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primaryMid.withValues(alpha: 0.3),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 2),
                      ),
                      child: CircleAvatar(
                        radius: 36,
                        backgroundColor: Colors.white.withValues(alpha: 0.2),
                        child: Text(
                          s.initials,
                          style: AppTextStyles.displayMedium.copyWith(color: Colors.white, fontSize: 28),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(s.name, style: AppTextStyles.h2.copyWith(color: Colors.white)),
                    const SizedBox(height: 4),
                    Text('Student Code: ${s.studentCode}', style: AppTextStyles.bodyMedium.copyWith(color: Colors.white70)),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              Text('Academic Details', style: AppTextStyles.h2),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    _buildInfoRow('Standard', s.standard),
                    const Divider(height: 24, color: AppColors.border),
                    _buildInfoRow('Division', s.division),
                    const Divider(height: 24, color: AppColors.border),
                    _buildInfoRow('Medium', s.medium),
                    const Divider(height: 24, color: AppColors.border),
                    _buildInfoRow('Transport Route', s.transportType.isEmpty ? 'None' : s.transportType),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              Text('School Details', style: AppTextStyles.h2),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    _buildInfoRow('School Name', 'Sunrise School'),
                    const Divider(height: 24, color: AppColors.border),
                    _buildInfoRow('Branch', 'Railnagar Branch'),
                    const Divider(height: 24, color: AppColors.border),
                    _buildInfoRow('Academic Year', '2026-27'),
                  ],
                ),
              ).animate().fade(delay: 250.ms).slideY(begin: 0.2, curve: Curves.easeOutQuad),
              Text('App Settings', style: AppTextStyles.h2),
              const SizedBox(height: 12),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Material(
                  color: Colors.transparent,
                  child: StatefulBuilder(
                    builder: (context, setState) {
                      return SwitchListTile(
                        title: Text('App Sounds', style: AppTextStyles.bodyMedium),
                        value: SoundService.instance.soundEnabled,
                        activeColor: AppColors.primaryMid,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        onChanged: (val) async {
                          SoundService.instance.play(AppSound.toggle);
                          await SoundService.instance.setSoundEnabled(val);
                          setState(() {});
                        },
                      );
                    }
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Logout Button
              ElevatedButton.icon(
                onPressed: _logout,
                icon: const Icon(Icons.logout_rounded, color: Colors.white),
                label: const Text('Log Out', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.red,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTextStyles.bodyMedium),
        const SizedBox(width: 16),
        Expanded(
          child: Text(
            value,
            style: AppTextStyles.labelLarge,
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }
}
