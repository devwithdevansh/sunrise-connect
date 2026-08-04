import 'package:get/get.dart';
import '../../../dashboard/controllers/dashboard_controller.dart';

class FeeSummaryBinding extends Bindings {
  @override
  void dependencies() {
    if (!Get.isRegistered<DashboardController>()) {
      Get.lazyPut<DashboardController>(() => DashboardController(), fenix: true);
    }
  }
}
