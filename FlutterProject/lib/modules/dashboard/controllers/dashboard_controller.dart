import 'dart:convert';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/constants/storage_keys.dart';
import '../../../../core/routes/app_routes.dart';
import '../../../../data/models/student_model.dart';
import '../../../../data/models/fee_model.dart';
import '../../../../data/models/notification_model.dart';
import '../../../../data/repositories/student_repository.dart';
import '../../../../data/repositories/fee_repository.dart';
import '../../../../data/repositories/notification_repository.dart';

class DashboardController extends GetxController {
  final StudentRepository _studentRepo = StudentRepository();
  final FeeRepository _feeRepo = FeeRepository();
  final NotificationRepository _notificationRepo = NotificationRepository();

  final isLoading = true.obs;
  final student = Rxn<StudentModel>();
  final fees = <FeeModel>[].obs;
  final notifications = <NotificationModel>[].obs;

  final totalFees = 0.0.obs;
  final totalPaid = 0.0.obs;
  final totalPending = 0.0.obs;

  @override
  void onInit() {
    super.onInit();
    _checkAuthAndLoad();
  }

  Future<void> _checkAuthAndLoad() async {
    final prefs = await SharedPreferences.getInstance();
    final pId = prefs.getString(StorageKeys.parentId);
    if (pId == null || pId.isEmpty) {
      Get.offAllNamed(AppRoutes.login);
      return;
    }
    await loadDashboardData(pId);
  }

  Future<void> loadDashboardData(String parentId, {bool forceRefresh = false}) async {
    final prefs = await SharedPreferences.getInstance();
    final studentCacheKey = 'student_cache_$parentId';
    final studentTimeKey = 'student_time_$parentId';

    final cachedStudentStr = prefs.getString(studentCacheKey);
    final cachedStudentTime = prefs.getInt(studentTimeKey) ?? 0;
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    
    // Check if cache is fresh (less than 5 mins old)
    final isCacheFresh = (nowMs - cachedStudentTime) < 5 * 60 * 1000;

    if (!forceRefresh && cachedStudentStr != null && cachedStudentStr.isNotEmpty) {
      try {
        final decoded = json.decode(cachedStudentStr);
        final cachedStudent = StudentModel.fromJson(decoded);
        student.value = cachedStudent;
        await prefs.setString(StorageKeys.studentId, cachedStudent.id);
        
        final sId = cachedStudent.id;
        final feesCacheKey = 'fees_cache_$sId';
        final cachedFeesStr = prefs.getString(feesCacheKey);
        if (cachedFeesStr != null && cachedFeesStr.isNotEmpty) {
          final decodedFees = json.decode(cachedFeesStr) as List;
          final cachedFees = decodedFees.map((item) => FeeModel.fromJson(item as Map<String, dynamic>)).toList();
          fees.assignAll(cachedFees);
          _calculateAggregates(cachedFees);
          
          final notifs = await _notificationRepo.getNotifications(cachedFees);
          notifications.assignAll(notifs);
        }
        
        if (isCacheFresh) {
          isLoading.value = false;
          return; // Skip network fetch
        }
      } catch (e) {
        print('Error loading from cache: $e');
      }
    }

    isLoading.value = true;
    try {
      final studentsList = await _studentRepo.getStudentsForParent(parentId);
      if (studentsList.isNotEmpty) {
        final newStudent = studentsList.first;
        student.value = newStudent;
        await prefs.setString(StorageKeys.studentId, newStudent.id);
        
        // Cache student data
        await prefs.setString(studentCacheKey, json.encode(newStudent.toJson()));
        await prefs.setInt(studentTimeKey, nowMs);

        final sId = newStudent.id;
        final allFees = await _feeRepo.getFees(sId);
        fees.assignAll(allFees);
        
        // Cache fees data
        final feesCacheKey = 'fees_cache_$sId';
        await prefs.setString(feesCacheKey, json.encode(allFees.map((f) => f.toJson()).toList()));

        _calculateAggregates(allFees);

        // Load notifications
        final notifs = await _notificationRepo.getNotifications(allFees);
        notifications.assignAll(notifs);
      }
    } catch (e) {
      print('Error loading dashboard data: $e');
    } finally {
      isLoading.value = false;
    }
  }

  void _calculateAggregates(List<FeeModel> allFees) {
    double total = 0;
    double paid = 0;
    double pending = 0;
    for (final f in allFees) {
      total += f.amount;
      paid += f.paidAmount;
      pending += f.remainingAmount;
    }
    totalFees.value = total;
    totalPaid.value = paid;
    totalPending.value = pending;
  }

  Future<void> refreshData() async {
    final prefs = await SharedPreferences.getInstance();
    final pId = prefs.getString(StorageKeys.parentId);
    if (pId != null && pId.isNotEmpty) {
      await loadDashboardData(pId, forceRefresh: true);
    }
  }

  /// Perform fee payment
  Future<void> payFee(FeeModel fee) async {
    if (fee.isPaid) return;

    isLoading.value = true;
    final success = await _feeRepo.payFee(fee.id, fee.remainingAmount, 'online');
    isLoading.value = false;

    if (success) {
      Get.snackbar(
        'Payment Successful ✅',
        'Your payment of ₹${fee.remainingAmount.toInt()} for ${fee.termName} has been processed.',
        snackPosition: SnackPosition.BOTTOM,
      );
      await refreshData();
    } else {
      Get.snackbar(
        'Payment Failed ❌',
        'Unable to process payment. Please try again.',
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }
}
