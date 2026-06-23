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
import '../../fees/payment_history/controllers/payment_history_controller.dart';

class DashboardController extends GetxController {
  final StudentRepository _studentRepo = StudentRepository();
  final FeeRepository _feeRepo = FeeRepository();
  final NotificationRepository _notificationRepo = NotificationRepository();

  final isLoading = true.obs;
  final students = <StudentModel>[].obs;
  final student = Rxn<StudentModel>();
  final fees = <FeeModel>[].obs;
  final notifications = <NotificationModel>[].obs;

  final totalFees = 0.0.obs;
  final totalPaid = 0.0.obs;
  final totalPending = 0.0.obs;

  List<FeeModel> get mainFees => fees.where((f) => f.isEducation || f.isTransport || f.isTerm).toList();

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
    final studentsCacheKey = 'students_list_cache_$parentId';
    final studentTimeKey = 'student_time_$parentId';

    final cachedStudentsStr = prefs.getString(studentsCacheKey);
    final cachedStudentTime = prefs.getInt(studentTimeKey) ?? 0;
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    
    final isCacheFresh = (nowMs - cachedStudentTime) < 5 * 60 * 1000;

    if (!forceRefresh && cachedStudentsStr != null && cachedStudentsStr.isNotEmpty) {
      try {
        final decodedList = json.decode(cachedStudentsStr) as List;
        final cachedStudents = decodedList.map((s) => StudentModel.fromJson(s as Map<String, dynamic>)).toList();
        students.assignAll(cachedStudents);
        
        if (cachedStudents.isNotEmpty) {
          final activeId = prefs.getString(StorageKeys.studentId) ?? '';
          StudentModel activeStudent = cachedStudents.first;
          if (activeId.isNotEmpty) {
            final matched = cachedStudents.firstWhereOrNull((s) => s.id == activeId);
            if (matched != null) {
              activeStudent = matched;
            }
          }
          student.value = activeStudent;
          await prefs.setString(StorageKeys.studentId, activeStudent.id);

          final sId = activeStudent.id;
          final feesCacheKey = 'fees_cache_$sId';
          final cachedFeesStr = prefs.getString(feesCacheKey);
          if (cachedFeesStr != null && cachedFeesStr.isNotEmpty) {
            final decodedFees = json.decode(cachedFeesStr) as List;
            final cachedFees = decodedFees.map((item) => FeeModel.fromJson(item as Map<String, dynamic>)).toList();
            
            // Filter: keep only EDUCATION, TRANSPORT, TERM fees for aggregates
            final filteredFees = cachedFees.where((f) {
              return f.isEducation || f.isTransport || f.isTerm;
            }).toList();

            fees.assignAll(cachedFees);
            _calculateAggregates(filteredFees);
            
            final notifs = await _notificationRepo.getNotifications(filteredFees);
            notifications.assignAll(notifs);
          }
        }
        
        if (isCacheFresh) {
          isLoading.value = false;
          return;
        }
      } catch (e) {
        print('Error loading from cache: $e');
      }
    }

    isLoading.value = true;
    try {
      final studentsList = await _studentRepo.getStudentsForParent(parentId);
      students.assignAll(studentsList);
      if (studentsList.isNotEmpty) {
        await prefs.setString(studentsCacheKey, json.encode(studentsList.map((s) => s.toJson()).toList()));
        await prefs.setInt(studentTimeKey, nowMs);

        final activeId = prefs.getString(StorageKeys.studentId) ?? '';
        StudentModel activeStudent = studentsList.first;
        if (activeId.isNotEmpty) {
          final matched = studentsList.firstWhereOrNull((s) => s.id == activeId);
          if (matched != null) {
            activeStudent = matched;
          }
        }
        student.value = activeStudent;
        await prefs.setString(StorageKeys.studentId, activeStudent.id);

        final sId = activeStudent.id;
        final allFees = await _feeRepo.getFees(sId);
        
        // Filter: keep only EDUCATION, TRANSPORT, TERM fees for aggregates
        final filteredFees = allFees.where((f) {
          return f.isEducation || f.isTransport || f.isTerm;
        }).toList();

        fees.assignAll(allFees);
        
        final feesCacheKey = 'fees_cache_$sId';
        await prefs.setString(feesCacheKey, json.encode(allFees.map((f) => f.toJson()).toList()));

        _calculateAggregates(filteredFees);

        final notifs = await _notificationRepo.getNotifications(filteredFees);
        notifications.assignAll(notifs);
      }
    } catch (e) {
      print('Error loading dashboard data: $e');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> switchStudent(StudentModel selected) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(StorageKeys.studentId, selected.id);
    student.value = selected;
    
    await prefs.remove('fees_cache_${selected.id}');
    
    isLoading.value = true;
    try {
      final sId = selected.id;
      final allFees = await _feeRepo.getFees(sId);
      
      // Filter: keep only EDUCATION, TRANSPORT, TERM fees for aggregates
      final filteredFees = allFees.where((f) {
        return f.isEducation || f.isTransport || f.isTerm;
      }).toList();
      
      fees.assignAll(allFees);
      
      final feesCacheKey = 'fees_cache_$sId';
      await prefs.setString(feesCacheKey, json.encode(allFees.map((f) => f.toJson()).toList()));

      _calculateAggregates(filteredFees);
      
      final notifs = await _notificationRepo.getNotifications(filteredFees);
      notifications.assignAll(notifs);
      
      if (Get.isRegistered<PaymentHistoryController>()) {
        Get.find<PaymentHistoryController>().loadPaymentHistory(forceRefresh: true);
      }
    } catch (e) {
      print('Error switching student: $e');
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
      // Treat concession as effectively paid (for RTE students)
      paid += f.paidAmount + f.concessionAmount;
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

    if (success) {
      // ── Optimistic UI update ────────────────────────────────────────────
      // Immediately reflect the payment in the local fees list so that
      // PendingFees and FeeSummary update right away, without waiting for
      // the network refresh to complete.
      final updatedFees = fees.map((f) {
        if (f.id == fee.id) {
          return FeeModel(
            id: f.id,
            studentId: f.studentId,
            termName: f.termName,
            feeType: f.feeType,
            amount: f.amount,
            paidAmount: f.amount,       // fully paid
            concessionAmount: f.concessionAmount,
            remainingAmount: 0,          // nothing left
            dueDate: f.dueDate,
            status: 'PAID',
            academicYear: f.academicYear,
          );
        }
        return f;
      }).toList();
      fees.assignAll(updatedFees);
      _calculateAggregates(updatedFees);
      // ───────────────────────────────────────────────────────────────────

      Get.snackbar(
        'Payment Successful',
        'Your payment of ₹${fee.remainingAmount.toInt()} for ${fee.termName} has been processed.',
        snackPosition: SnackPosition.BOTTOM,
      );

      // Clear all caches so next load fetches fresh data from server
      final prefs = await SharedPreferences.getInstance();
      final sId = student.value?.id ?? '';
      final pId = prefs.getString(StorageKeys.parentId) ?? '';
      if (sId.isNotEmpty) {
        await prefs.remove('fees_cache_$sId');
        await prefs.remove('payments_cache_$sId');
        await prefs.remove('payments_time_$sId');
      }
      if (pId.isNotEmpty) {
        // Reset student cache timestamp so next loadDashboardData hits network
        await prefs.remove('student_time_$pId');
      }

      // Background refresh to sync with server truth
      refreshData();

      // If payment history screen is already open, refresh it immediately
      if (Get.isRegistered<PaymentHistoryController>()) {
        Get.find<PaymentHistoryController>().loadPaymentHistory(forceRefresh: true);
      }
    } else {
      Get.snackbar(
        'Payment Failed',
        'Unable to process payment. Please try again.',
        snackPosition: SnackPosition.BOTTOM,
      );
    }

    isLoading.value = false;
  }
}
