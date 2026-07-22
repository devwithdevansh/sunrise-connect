import 'package:get/get.dart';

import '../../modules/splash/bindings/splash_binding.dart';
import '../../modules/splash/views/splash_view.dart';
import '../../modules/onboarding/bindings/onboarding_binding.dart';
import '../../modules/onboarding/views/onboarding_view.dart';
import '../../modules/auth/login/bindings/login_binding.dart';
import '../../modules/auth/login/views/login_view.dart';
import '../../modules/auth/otp/bindings/otp_binding.dart';
import '../../modules/auth/otp/views/otp_view.dart';
import '../../modules/auth/create_password/bindings/create_password_binding.dart';
import '../../modules/auth/create_password/views/create_password_view.dart';
import '../../modules/dashboard/bindings/dashboard_binding.dart';
import '../../modules/dashboard/views/dashboard_view.dart';
import '../../modules/fees/fee_summary/bindings/fee_summary_binding.dart';
import '../../modules/fees/fee_summary/views/fee_summary_view.dart';
import '../../modules/fees/pending_fees/bindings/pending_fees_binding.dart';
import '../../modules/fees/pending_fees/views/pending_fees_view.dart';
import '../../modules/fees/receipt_details/bindings/receipt_details_binding.dart';
import '../../modules/fees/receipt_details/views/receipt_details_view.dart';
import '../../modules/notifications/bindings/notifications_binding.dart';
import '../../modules/notifications/views/notifications_view.dart';
import '../../modules/profile/bindings/profile_binding.dart';
import '../../modules/profile/views/profile_view.dart';
import 'app_routes.dart';

class AppPages {
  static final pages = [
    GetPage(
      name: AppRoutes.splash,
      page: () => const SplashView(),
      binding: SplashBinding(),
    ),
    GetPage(
      name: AppRoutes.onboarding,
      page: () => const OnboardingView(),
      binding: OnboardingBinding(),
    ),
    GetPage(
      name: AppRoutes.login,
      page: () => const LoginView(),
      binding: LoginBinding(),
    ),
    GetPage(
      name: AppRoutes.otp,
      page: () => const OtpView(),
      binding: OtpBinding(),
    ),
    GetPage(
      name: AppRoutes.createPassword,
      page: () => const CreatePasswordView(),
      binding: CreatePasswordBinding(),
    ),
    GetPage(
      name: AppRoutes.dashboard,
      page: () => const DashboardView(),
      binding: DashboardBinding(),
    ),
    GetPage(
      name: AppRoutes.feeSummary,
      page: () => const FeeSummaryView(),
      binding: FeeSummaryBinding(),
    ),
    GetPage(
      name: AppRoutes.pendingFees,
      page: () => const PendingFeesView(),
      binding: PendingFeesBinding(),
    ),
    GetPage(
      name: AppRoutes.paymentHistory,
      page: () => const ReceiptDetailsView(),
      binding: ReceiptDetailsBinding(),
    ),
    GetPage(
      name: AppRoutes.receiptDetails,
      page: () => const ReceiptDetailsView(),
      binding: ReceiptDetailsBinding(),
    ),
    GetPage(
      name: AppRoutes.notifications,
      page: () => const NotificationsView(),
      binding: NotificationsBinding(),
    ),
    GetPage(
      name: AppRoutes.profile,
      page: () => const ProfileView(),
      binding: ProfileBinding(),
    ),
  ];
}
