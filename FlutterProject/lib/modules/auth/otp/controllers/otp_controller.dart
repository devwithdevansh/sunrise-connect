import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/routes/app_routes.dart';
import '../../../../core/network/api_client.dart';

class OtpController extends GetxController {
  final phone = ''.obs;
  final isLoading = false.obs;
  final errorMsg = ''.obs;

  final List<TextEditingController> otpControllers =
      List.generate(4, (_) => TextEditingController());
  final List<FocusNode> focusNodes = List.generate(4, (_) => FocusNode());

  final phoneController = TextEditingController();
  final passwordController = TextEditingController();

  @override
  void onInit() {
    super.onInit();
    phone.value = Get.arguments?.toString() ?? '';
  }

  @override
  void onClose() {
    for (final c in otpControllers) c.dispose();
    for (final f in focusNodes) f.dispose();
    phoneController.dispose();
    passwordController.dispose();
    super.onClose();
  }

  void onOtpChanged(String val, int index) {
    if (val.isNotEmpty && index < 3) {
      focusNodes[index + 1].requestFocus();
    } else if (val.isEmpty && index > 0) {
      focusNodes[index - 1].requestFocus();
    }
    errorMsg.value = '';
  }

  String get _fullOtp => otpControllers.map((c) => c.text).join();

  Future<void> startVerification() async {
    final inputPhone = phoneController.text.trim();
    if (inputPhone.length != 10) {
      errorMsg.value = 'Please enter a valid 10-digit mobile number';
      return;
    }
    phone.value = inputPhone;
    errorMsg.value = '';
    focusNodes[0].requestFocus();
  }

  Future<void> verifyCodeAndSetup() async {
    if (_fullOtp.length != 4) {
      errorMsg.value = 'Please enter all 4 digits';
      return;
    }

    isLoading.value = true;
    errorMsg.value = '';

    try {
      final response = await ApiClient.post('/auth/parent/verify', {
        'primaryMobileNumber': phone.value,
        'lastFourDigits': _fullOtp,
      });

      if (response.statusCode == 200) {
        final body = json.decode(response.body);
        final parentId = body['data']['parentId'] as String;

        // Verify successful, prompt for password creation
        _showPasswordCreationDialog(parentId);
      } else {
        final body = json.decode(response.body);
        errorMsg.value = body['message'] ?? 'Verification failed';
      }
    } catch (e) {
      print('Verification error: $e');
      errorMsg.value = 'Network error during verification';
    } finally {
      isLoading.value = false;
    }
  }

  void _showPasswordCreationDialog(String parentId) {
    final passwordFieldController = TextEditingController();

    Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Create Password 🔑'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Enter a password for your account (minimum 8 characters):'),
            const SizedBox(height: 16),
            TextField(
              controller: passwordFieldController,
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'New Password',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final newPassword = passwordFieldController.text;
              if (newPassword.length < 8) {
                Get.snackbar('Error', 'Password must be at least 8 characters long');
                return;
              }
              Get.back(); // Close dialog
              await _setPassword(parentId, newPassword);
            },
            child: const Text('Save Password'),
          ),
        ],
      ),
    );
  }

  Future<void> _setPassword(String parentId, String newPassword) async {
    isLoading.value = true;
    try {
      final response = await ApiClient.post('/auth/parent/set-password', {
        'parentId': parentId,
        'newPassword': newPassword,
      });

      if (response.statusCode == 200) {
        Get.snackbar(
          'Onboarding Complete 🎉',
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
