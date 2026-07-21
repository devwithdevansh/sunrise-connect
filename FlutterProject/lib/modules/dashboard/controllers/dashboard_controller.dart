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
import '../../fees/receipt_details/controllers/receipt_details_controller.dart';
import '../../../services/sound_service.dart';
import '../../../../core/widgets/permission_dialog.dart';
import '../../../../core/services/fcm_service.dart';

class DashboardController extends GetxController {
  final StudentRepository _studentRepo = StudentRepository();
  final FeeRepository _feeRepo = FeeRepository();
  final NotificationRepository _notificationRepo = NotificationRepository();

  final isLoading = true.obs;
  final students = <StudentModel>[].obs;
  final student = Rxn<StudentModel>();
  final fees = <FeeModel>[].obs;
  final _allNotifications = <NotificationModel>[].obs;
  final notifications = <NotificationModel>[].obs;
  final unreadNotificationCount = 0.obs;

  final totalFees = 0.0.obs;
  final totalPaid = 0.0.obs;
  final totalPending = 0.0.obs;

  List<FeeModel> get mainFees => fees.where((f) => f.isEducation || f.isTransport || f.isTerm).toList();

  @override
  void onInit() {
    super.onInit();
    _checkAuthAndLoad();
  }

  @override
  void onReady() {
    super.onReady();
    _checkPermissions();
  }

  Future<void> _checkPermissions() async {
    final prefs = await SharedPreferences.getInstance();
    final hasAsked = prefs.getBool('has_asked_fcm_permission') ?? false;
    if (!hasAsked) {
      Get.bottomSheet(
         PermissionSheet(
           onAllow: () async {
             Get.back();
             await prefs.setBool('has_asked_fcm_permission', true);
             await FcmService.requestPermissions();
           },
           onDeny: () async {
             Get.back();
             await prefs.setBool('has_asked_fcm_permission', true);
           }
         ),
         isDismissible: false,
         enableDrag: false,
         isScrollControlled: true,
      );
    }
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
    
    bool hasCache = false;

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
          }
        }
        
        hasCache = true;
      } catch (e) {
        print('Error loading from cache: $e');
      }
    }

    if (!hasCache || forceRefresh) {
      isLoading.value = true;
    }
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

        _loadNotifications();
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
      
      final notifs = await _notificationRepo.getNotifications();
      _allNotifications.assignAll(notifs);
      _updateVisibleNotifications();
      
      if (Get.isRegistered<PaymentHistoryController>()) {
        Get.find<PaymentHistoryController>().loadPaymentHistory(forceRefresh: true);
      }
      if (Get.isRegistered<ReceiptDetailsController>()) {
        Get.find<ReceiptDetailsController>().loadReceipts(forceRefresh: true);
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

  /// Fetch real notifications from the backend and update the badge count.
  Future<void> _loadNotifications() async {
    try {
      final notifs = await _notificationRepo.getNotifications();
      _allNotifications.assignAll(notifs);
      _updateVisibleNotifications();
    } catch (e) {
      print('Error loading notifications: $e');
    }
  }

  void _updateVisibleNotifications() {
    final sId = student.value?.id;
    if (sId == null) {
      notifications.assignAll(_allNotifications);
      unreadNotificationCount.value = _allNotifications.where((n) => !n.isRead).length;
    } else {
      final filtered = _allNotifications.where((n) {
        return _isForStudent(n, sId);
      }).toList();
      notifications.assignAll(filtered);
      unreadNotificationCount.value = filtered.where((n) => !n.isReadFor(sId)).length;
    }
  }

  bool _isForStudent(NotificationModel n, String studentId) {
    if (n.targetStudentIds.isEmpty) return true; // Broadcast
    return n.targetStudentIds.contains(studentId); // Targeted
  }

  bool hasUnreadNotificationsFor(String studentId) {
    return _allNotifications.any((n) {
      return _isForStudent(n, studentId) && !n.isReadFor(studentId);
    });
  }

  /// Refresh notifications only (called when tapping notification bell).
  Future<void> refreshNotifications() async {
    await _loadNotifications();
  }

  Future<void> refreshData() async {
    final prefs = await SharedPreferences.getInstance();
    final pId = prefs.getString(StorageKeys.parentId);
    if (pId != null && pId.isNotEmpty) {
      // Invalidate all caches for all students under this parent
      for (final s in students) {
        await prefs.remove('fees_cache_${s.id}');
        await prefs.remove('payments_cache_${s.id}');
        await prefs.remove('payments_time_${s.id}');
        await prefs.remove('receipts_cache_${s.id}');
        await prefs.remove('receipts_time_${s.id}');
      }
      await loadDashboardData(pId, forceRefresh: true);
      
      // Sync payment history if controller is registered
      if (Get.isRegistered<PaymentHistoryController>()) {
        Get.find<PaymentHistoryController>().loadPaymentHistory(forceRefresh: true);
      }
    }
  }

  /// Navigate to Pending Fees view to process payment via Razorpay
  Future<void> payFee(FeeModel fee) async {
    if (fee.isPaid) return;
    Get.toNamed(AppRoutes.pendingFees);
  }
}
