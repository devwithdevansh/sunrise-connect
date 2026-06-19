import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../../core/widgets/custom_textfield.dart';
import '../controllers/otp_controller.dart';

class OtpView extends GetView<OtpController> {
  const OtpView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: AppColors.ink),
          onPressed: Get.back,
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Obx(() {
            final isPhoneEmpty = controller.phone.value.isEmpty;

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                Text('Account Setup 🔐', style: AppTextStyles.displayMedium),
                const SizedBox(height: 8),
                Text(
                  isPhoneEmpty
                      ? 'Enter your registered mobile number to set up your password.'
                      : 'For verification, please enter the last 4 digits of your mobile number (+91 ${controller.phone.value}).',
                  style: AppTextStyles.bodyMedium,
                ),
                const SizedBox(height: 32),

                if (isPhoneEmpty) ...[
                  CustomTextField(
                    label: 'Registered Mobile Number',
                    hint: '98765 43210',
                    controller: controller.phoneController,
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    prefix: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text('+91', style: AppTextStyles.bodyLarge.copyWith(color: AppColors.ink)),
                    ),
                  ),
                  const SizedBox(height: 24),
                  CustomButton(
                    label: 'Continue',
                    loading: controller.isLoading.value,
                    onTap: controller.startVerification,
                  ),
                ] else ...[
                  // 4 OTP boxes
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: List.generate(4, (i) => _OtpBox(index: i, controller: controller)),
                  ),
                  const SizedBox(height: 32),
                  if (controller.errorMsg.value.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Text(
                        controller.errorMsg.value,
                        style: AppTextStyles.bodySmall.copyWith(color: AppColors.red),
                      ),
                    ),
                  CustomButton(
                    label: 'Verify Code',
                    loading: controller.isLoading.value,
                    onTap: controller.verifyCodeAndSetup,
                  ),
                  const SizedBox(height: 24),
                  Center(
                    child: TextButton(
                      onPressed: () {
                        controller.phone.value = '';
                        for (final c in controller.otpControllers) c.clear();
                      },
                      child: Text(
                        'Change Mobile Number',
                        style: AppTextStyles.labelLarge.copyWith(color: AppColors.primaryMid),
                      ),
                    ),
                  ),
                ],
              ],
            );
          }),
        ),
      ),
    );
  }
}

class _OtpBox extends StatelessWidget {
  final int index;
  final OtpController controller;
  const _OtpBox({required this.index, required this.controller});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 50,
      height: 60,
      child: TextField(
        controller: controller.otpControllers[index],
        focusNode: controller.focusNodes[index],
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        maxLength: 1,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        style: AppTextStyles.h1,
        decoration: InputDecoration(
          counterText: '',
          filled: true,
          fillColor: AppColors.white,
          contentPadding: EdgeInsets.zero,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.border, width: 1.5),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.border, width: 1.5),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.primaryMid, width: 2),
          ),
        ),
        onChanged: (val) => controller.onOtpChanged(val, index),
      ),
    );
  }
}
