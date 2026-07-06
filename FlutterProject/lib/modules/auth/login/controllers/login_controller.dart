import 'dart:convert';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../../core/constants/storage_keys.dart';
import '../../../../core/routes/app_routes.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/services/fcm_service.dart';

class LoginController extends GetxController {
  final isLoading = false.obs;

  Future<void> login({required String phone, required String password}) async {
    isLoading.value = true;

    try {
      final response = await ApiClient.post('/auth/parent/login', {
        'primaryMobileNumber': phone,
        'password': password,
      });

      if (response.statusCode == 200) {
        final body = json.decode(response.body);
        final accessToken = body['data']['accessToken'] as String;

        // Decode token to extract parentId
        final jwtData = ApiClient.decodeJwt(accessToken);
        final parentId = jwtData['id'] as String? ?? '';

        final prefs = await SharedPreferences.getInstance();
        const secureStorage = FlutterSecureStorage();
        await secureStorage.write(key: StorageKeys.accessToken, value: accessToken);
        await prefs.setString(StorageKeys.parentId, parentId);
        await prefs.setString(StorageKeys.phone, phone);
        await prefs.setBool(StorageKeys.isLoggedIn, true);
        await prefs.setBool(StorageKeys.isOnboarded, true);

        // Register FCM token now that we are logged in
        await FcmService.registerToken();

        Get.offAllNamed(AppRoutes.dashboard);
      } else {
        final body = json.decode(response.body);
        final msg = body['message'] ?? 'Invalid credentials';
        Get.snackbar(
          'Login Failed',
          msg.toString(),
          snackPosition: SnackPosition.BOTTOM,
        );
      }
    } catch (e) {
      print('Error during login: $e');
      Get.snackbar(
        'Error',
        'Could not connect to the server. Please verify the backend is running.',
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      isLoading.value = false;
    }
  }

  void goToOnboarding() {
    Get.toNamed(AppRoutes.otp); // repurpose OtpView for first-time setup
  }
}
