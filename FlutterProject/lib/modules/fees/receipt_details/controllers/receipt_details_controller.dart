import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:get/get.dart';
import '../../../../data/models/receipt_model.dart';
import '../../../../data/repositories/receipt_repository.dart';
import '../../../dashboard/controllers/dashboard_controller.dart';

class ReceiptDetailsController extends GetxController {
  final ReceiptRepository _receiptRepo = ReceiptRepository();
  final isLoading = true.obs;
  final receipts = <ReceiptModel>[].obs;

  @override
  void onInit() {
    super.onInit();
    loadReceipts();
  }

  Future<void> loadReceipts({bool forceRefresh = false}) async {
    final dashboardCtrl = Get.find<DashboardController>();
    final sId = dashboardCtrl.student.value?.id ?? '';
    if (sId.isEmpty) {
      isLoading.value = false;
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final cacheKey = 'receipts_cache_$sId';
    final timeKey = 'receipts_time_$sId';
    
    final cachedStr = prefs.getString(cacheKey);
    final cachedTime = prefs.getInt(timeKey) ?? 0;
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    final isCacheFresh = (nowMs - cachedTime) < 5 * 60 * 1000;

    if (!forceRefresh && cachedStr != null && cachedStr.isNotEmpty) {
      try {
        final decoded = json.decode(cachedStr) as List;
        final list = decoded.map((item) => ReceiptModel.fromJson(item as Map<String, dynamic>)).toList();
        receipts.assignAll(list);
        
        if (isCacheFresh) {
          isLoading.value = false;
          return;
        }
      } catch (e) {
        print('Error loading receipts from cache: $e');
      }
    }

    isLoading.value = true;
    try {
      final studentName = dashboardCtrl.student.value?.name ?? 'Student';
      final ledgerIds = dashboardCtrl.fees.map((f) => f.id).toList();
      final list = await _receiptRepo.getReceiptsForLedgers(ledgerIds, studentName);
      receipts.assignAll(list);
      
      // Cache receipts
      await prefs.setString(cacheKey, json.encode(list.map((r) => r.toJson()).toList()));
      await prefs.setInt(timeKey, nowMs);
    } catch (e) {
      print('Error loading receipts: $e');
    } finally {
      isLoading.value = false;
    }
  }
}
