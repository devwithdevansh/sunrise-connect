import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/custom_button.dart';
import '../controllers/onboarding_controller.dart';
import 'package:flutter_animate/flutter_animate.dart';

class OnboardingView extends GetView<OnboardingController> {
  const OnboardingView({super.key});

  static const _pages = [
    _OnboardPage(
      imageAsset: 'assets/images/sunrise-logo.png',
      isLogo: true,
      title: 'Welcome to\nSunrise Connect',
      subtitle: 'Your all-in-one school fee management portal.',
    ),
    _OnboardPage(
      imageAsset: 'assets/images/onboard_dashboard.png',
      isLogo: false,
      title: 'The Dashboard',
      subtitle: 'See your total outstanding balance and upcoming dues at a quick glance.',
    ),
    _OnboardPage(
      imageAsset: 'assets/images/onboard_payment.png',
      isLogo: false,
      title: 'Paying Fees',
      subtitle: 'Navigate to the Pending Fees timeline to select and securely pay your child\'s fees.',
    ),
    _OnboardPage(
      imageAsset: 'assets/images/onboard_receipt.png',
      isLogo: false,
      title: 'Digital Receipts',
      subtitle: 'Access your Payment History anytime to download official school receipts.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView.builder(
                controller: controller.pageController,
                onPageChanged: controller.onPageChanged,
                itemCount: _pages.length,
                itemBuilder: (_, i) => _pages[i],
              ),
            ),
            // Dots + CTA
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
              child: Column(
                children: [
                  Obx(() => Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          _pages.length,
                          (i) => AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            width: controller.currentPage.value == i ? 24 : 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: controller.currentPage.value == i
                                  ? AppColors.primaryMid
                                  : AppColors.border,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      )),
                  const SizedBox(height: 32),
                  Obx(() => CustomButton(
                        label: controller.currentPage.value == _pages.length - 1
                            ? 'Get Started'
                            : 'Next',
                        onTap: controller.next,
                      )),
                  if (true) ...[
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: controller.skip,
                      child: Text('Skip', style: AppTextStyles.labelLarge.copyWith(color: AppColors.inkLight)),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardPage extends StatelessWidget {
  final String title;
  final String subtitle;
  final String imageAsset;
  final bool isLogo;

  const _OnboardPage({
    required this.title,
    required this.subtitle,
    required this.imageAsset,
    required this.isLogo,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
      child: Column(
        children: [
          Expanded(
            child: Center(
              child: isLogo
                  ? Container(
                      width: 140,
                      height: 140,
                      decoration: const BoxDecoration(color: AppColors.white, shape: BoxShape.circle, boxShadow: [
                        BoxShadow(color: Color(0x0F000000), blurRadius: 20, offset: Offset(0, 10))
                      ]),
                      padding: const EdgeInsets.all(24),
                      child: Image.asset(imageAsset, fit: BoxFit.contain),
                    ).animate().scale(duration: 500.ms, curve: Curves.easeOutBack)
                  : Container(
                      clipBehavior: Clip.antiAlias,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: const [
                          BoxShadow(color: Color(0x1A000000), blurRadius: 30, offset: Offset(0, 15))
                        ],
                      ),
                      child: Image.asset(
                        imageAsset,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          color: AppColors.border,
                          child: const Center(
                            child: Text('Screenshot missing.\nPlease add image.', textAlign: TextAlign.center),
                          ),
                        ),
                      ),
                    ).animate().fade(duration: 400.ms).slideY(begin: 0.1),
            ),
          ),
          const SizedBox(height: 32),
          Text(title, style: AppTextStyles.displayMedium, textAlign: TextAlign.center)
              .animate().fade(duration: 400.ms).slideY(begin: 0.2),
          const SizedBox(height: 16),
          Text(subtitle, style: AppTextStyles.bodyLarge.copyWith(color: AppColors.inkMid), textAlign: TextAlign.center)
              .animate().fade(delay: 200.ms).slideY(begin: 0.2),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
