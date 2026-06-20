import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/storage_keys.dart';
import '../../../core/routes/app_routes.dart';

class SplashController extends GetxController {
  @override
  void onInit() {
    super.onInit();
    _navigate();
  }

  Future<void> _navigate() async {
    try {
      await Future.delayed(const Duration(seconds: 3));
      final prefs = await SharedPreferences.getInstance();
      
      final isOnboarded = prefs.getBool(StorageKeys.isOnboarded) ?? false;
      final isLoggedIn = prefs.getBool(StorageKeys.isLoggedIn) ?? false;

      if (!isOnboarded) {
        Get.offAllNamed(AppRoutes.onboarding);
      } else if (!isLoggedIn) {
        Get.offAllNamed(AppRoutes.login);
      } else {
        Get.offAllNamed(AppRoutes.dashboard);
      }
    } catch (e) {
      Get.offAllNamed(AppRoutes.login);
    }
  }
}
