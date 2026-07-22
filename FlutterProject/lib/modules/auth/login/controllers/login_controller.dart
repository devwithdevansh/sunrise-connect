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
        final refreshToken = body['data']['refreshToken'] as String?; // might be missing if backend not updated but schema says it's there

        // Decode token to extract parentId
        final jwtData = ApiClient.decodeJwt(accessToken);
        final parentId = jwtData['id'] as String? ?? '';

        final prefs = await SharedPreferences.getInstance();
        const secureStorage = FlutterSecureStorage();
        await secureStorage.write(key: StorageKeys.accessToken, value: accessToken);
        if (refreshToken != null) {
          await secureStorage.write(key: 'refresh_token', value: refreshToken);
        }
        await prefs.setString(StorageKeys.parentId, parentId);
        await prefs.setString(StorageKeys.phone, phone);
        await prefs.setBool(StorageKeys.isLoggedIn, true);
        await prefs.setBool(StorageKeys.isOnboarded, true);

        // Register FCM token now that we are logged in
        await FcmService.registerToken();

        Get.offAllNamed(AppRoutes.dashboard);
      } else {
        final body = json.decode(response.body);
        final statusCode = response.statusCode;
        String friendlyMsg;
        if (statusCode == 401 || statusCode == 403) {
          friendlyMsg = 'Mobile number or password is wrong. Please check and try again.';
        } else if (statusCode == 404) {
          friendlyMsg = 'This mobile number is not registered. Please contact your school.';
        } else {
          friendlyMsg = 'Login failed. Please try again after some time.';
        }
        Get.snackbar(
          'Could Not Login',
          friendlyMsg,
          snackPosition: SnackPosition.BOTTOM,
        );
      }
    } catch (e) {
      print('Error during login: $e');
      Get.snackbar(
        'No Internet Connection',
        'Please check your internet and try again.',
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
