import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:get/get.dart';
import '../../../../data/models/payment_model.dart';
import '../../../../data/repositories/receipt_repository.dart';
import '../../../dashboard/controllers/dashboard_controller.dart';

class PaymentHistoryController extends GetxController {
  final ReceiptRepository _receiptRepo = ReceiptRepository();
  final isLoading = true.obs;
  final payments = <PaymentModel>[].obs;

  @override
  void onInit() {
    super.onInit();
    loadPaymentHistory();
  }

  Future<void> loadPaymentHistory({bool forceRefresh = false}) async {
    final dashboardCtrl = Get.find<DashboardController>();
    final sId = dashboardCtrl.student.value?.id ?? '';
    if (sId.isEmpty) {
      isLoading.value = false;
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final cacheKey = 'payments_cache_$sId';
    final timeKey = 'payments_time_$sId';
    
    final cachedStr = prefs.getString(cacheKey);
    final cachedTime = prefs.getInt(timeKey) ?? 0;
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    final isCacheFresh = (nowMs - cachedTime) < 5 * 60 * 1000;

    if (!forceRefresh && cachedStr != null && cachedStr.isNotEmpty) {
      try {
        final decoded = json.decode(cachedStr) as List;
        final list = decoded.map((item) => PaymentModel.fromJson(item as Map<String, dynamic>)).toList();
        payments.assignAll(list);
        
        if (isCacheFresh) {
          isLoading.value = false;
          return;
        }
      } catch (e) {
        print('Error loading payments from cache: $e');
      }
    }

    isLoading.value = true;
    try {
      final ledgerIds = dashboardCtrl.fees.map((f) => f.id).toList();
      final list = await _receiptRepo.getPaymentsForLedgers(ledgerIds);
      payments.assignAll(list);
      
      // Cache payments
      await prefs.setString(cacheKey, json.encode(list.map((p) => p.toJson()).toList()));
      await prefs.setInt(timeKey, nowMs);
    } catch (e) {
      print('Error loading payment history: $e');
    } finally {
      isLoading.value = false;
    }
  }
}
