import 'dart:convert';
import 'package:get/get.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/routes/app_routes.dart';

class CreatePasswordController extends GetxController {
  final isLoading = false.obs;
  late final String parentId;

  @override
  void onInit() {
    super.onInit();
    parentId = Get.arguments as String? ?? '';
    if (parentId.isEmpty) {
      Get.snackbar('Error', 'Missing parent ID, cannot set password.');
    }
  }

  Future<void> setPassword(String newPassword) async {
    if (newPassword.length < 8) {
      Get.snackbar('Error', 'Password must be at least 8 characters long');
      return;
    }

    isLoading.value = true;
    try {
      final response = await ApiClient.post('/auth/parent/set-password', {
        'parentId': parentId,
        'newPassword': newPassword,
      });

      if (response.statusCode == 200) {
        Get.snackbar(
          'Onboarding Complete',
          'Your password has been set. Please login now.',
          snackPosition: SnackPosition.BOTTOM,
        );
        Get.offAllNamed(AppRoutes.login);
      } else {
        final body = json.decode(response.body);
        Get.snackbar('Error', body['message'] ?? 'Failed to set password');
      }
    } catch (e) {
      print('Password setup error: $e');
      Get.snackbar('Error', 'Failed to connect for password configuration');
    } finally {
      isLoading.value = false;
    }
  }
}
