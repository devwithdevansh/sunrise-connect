import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../../core/widgets/custom_textfield.dart';
import '../../../../core/utils/validators.dart';
import '../controllers/login_controller.dart';

class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  late final LoginController _controller;

  @override
  void initState() {
    super.initState();
    _controller = Get.find<LoginController>();
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Logo
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primaryMid.withOpacity(.15),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Image.asset('assets/images/sunrise-logo.png', fit: BoxFit.contain),
                  ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack).fadeIn(duration: 400.ms),
                  const SizedBox(height: 32),
                  Text('Parent Portal', style: AppTextStyles.displayMedium)
                      .animate().fade(delay: 100.ms).slideY(begin: 0.2, curve: Curves.easeOutQuad),
                  const SizedBox(height: 8),
                  Text(
                    'Enter your mobile number and password to log in.',
                    style: AppTextStyles.bodyMedium,
                  ).animate().fade(delay: 200.ms).slideY(begin: 0.2, curve: Curves.easeOutQuad),
                  const SizedBox(height: 32),
                  CustomTextField(
                    label: 'Mobile Number',
                    hint: '98765 43210',
                    controller: _phoneController,
                    validator: Validators.phone,
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    prefix: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text('+91', style: AppTextStyles.bodyLarge.copyWith(color: AppColors.ink)),
                    ),
                  ).animate().fade(delay: 300.ms).slideY(begin: 0.2, curve: Curves.easeOutQuad),
                  const SizedBox(height: 16),
                  CustomTextField(
                    label: 'Password',
                    hint: '••••••••',
                    controller: _passwordController,
                    obscureText: true,
                    validator: (val) {
                      if (val == null || val.isEmpty) return 'Password is required';
                      return null;
                    },
                  ).animate().fade(delay: 400.ms).slideY(begin: 0.2, curve: Curves.easeOutQuad),
                  const SizedBox(height: 32),
                  Obx(() => CustomButton(
                        label: 'Login',
                        loading: _controller.isLoading.value,
                        onTap: () {
                          if (_formKey.currentState!.validate()) {
                            _controller.login(
                              phone: _phoneController.text.trim(),
                              password: _passwordController.text,
                            );
                          }
                        },
                      ))
                      .animate().fade(delay: 500.ms).slideY(begin: 0.2, curve: Curves.easeOutQuad),
                  const SizedBox(height: 24),
                  Center(
                    child: TextButton(
                      onPressed: _controller.goToOnboarding,
                      child: Text(
                        'First time here? Set up password',
                        style: AppTextStyles.labelLarge.copyWith(color: AppColors.primaryMid),
                      ),
                    ).animate().fade(delay: 600.ms),
                  ),
                  const SizedBox(height: 16),
                  Center(
                    child: Text(
                      'By continuing, you agree to our Terms & Privacy Policy.',
                      style: AppTextStyles.bodySmall,
                      textAlign: TextAlign.center,
                    ).animate().fade(delay: 700.ms),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
