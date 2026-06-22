import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/constants/storage_keys.dart';
import '../../../../data/repositories/fee_repository.dart';
import '../../../../data/models/fee_model.dart';
import '../../../dashboard/controllers/dashboard_controller.dart';

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS & HELPERS
// ─────────────────────────────────────────────────────────────────────────────

enum FeeStatus { overdue, dueSoon, upcoming }

/// Academic term grouping.
/// Term 1 = July – November
/// Term 2 = December – May (next calendar year)
/// Annual = admission, bag & kit, one-time fees
enum FeePeriod { term1, term2, annual, other }

extension FeePeriodX on FeePeriod {
  String get label {
    switch (this) {
      case FeePeriod.term1:   return 'Term 1  (Jul – Nov)';
      case FeePeriod.term2:   return 'Term 2  (Dec – May)';
      case FeePeriod.annual:  return 'Annual / One-Time Fees';
      case FeePeriod.other:   return 'Other Fees';
    }
  }
}

/// Month order within the academic year (July = 1, June = 12).
int _academicMonthOrder(int calendarMonth) {
  // Jul=1, Aug=2, Sep=3, Oct=4, Nov=5, Dec=6, Jan=7, Feb=8, Mar=9, Apr=10, May=11, Jun=12
  if (calendarMonth >= 7) return calendarMonth - 6;   // Jul(7)→1 … Dec(12)→6
  return calendarMonth + 6;                            // Jan(1)→7 … Jun(6)→12
}

/// Which term does a calendar-month fee belong to?
FeePeriod _termForMonth(int calendarMonth) {
  // Term 1: Jul–Nov (calendar months 7-11)
  if (calendarMonth >= 7 && calendarMonth <= 11) return FeePeriod.term1;
  // Term 2: Dec–May (calendar months 12 and 1-5)
  if (calendarMonth == 12 || calendarMonth <= 5)  return FeePeriod.term2;
  // June is end-of-year, treat as Term 2 tail
  return FeePeriod.term2;
}

/// Determine the period for a fee given its name.
/// Annual/one-time items are detected by keyword; otherwise we look at the
/// due-date month (passed separately because FeeItem carries it).
FeePeriod inferPeriod(String termName, DateTime dueDate) {
  final t = termName.toLowerCase();
  if (t.contains('admission') ||
      t.contains('annual')    ||
      t.contains('bag')       ||
      t.contains('kit')       ||
      t.contains('one-time')  ||
      t.contains('registration')) {
    return FeePeriod.annual;
  }
  if (t.contains('term') || t.contains('teerm') || t.contains('semester') || t.contains('half')) {
    // explicit "Term 1" / "Term 2" labels
    if (t.contains('1')) return FeePeriod.term1;
    if (t.contains('2')) return FeePeriod.term2;
    return FeePeriod.other;
  }
  // Month-name based (July, August, …)
  return _termForMonth(dueDate.month);
}

// ─────────────────────────────────────────────────────────────────────────────
// FEE ITEM
// ─────────────────────────────────────────────────────────────────────────────

class FeeItem {
  final String   id;
  final String   termName;
  final double   amount;
  final DateTime dueDate;
  final bool     isPaid;

  const FeeItem({
    required this.id,
    required this.termName,
    required this.amount,
    required this.dueDate,
    this.isPaid = false,
  });

  bool get isOverdue => dueDate.isBefore(DateTime.now());

  int get daysOverdueOrRemaining =>
      DateTime.now().difference(dueDate).inDays;

  String get statusLabel {
    final d = daysOverdueOrRemaining;
    if (d > 0) return 'Overdue by $d day${d == 1 ? '' : 's'}';
    if (d == 0) return 'Due today';
    return 'Due in ${-d} day${-d == 1 ? '' : 's'}';
  }

  FeeStatus get status {
    if (isOverdue) return FeeStatus.overdue;
    final d = -daysOverdueOrRemaining;
    if (d <= 30) return FeeStatus.dueSoon;
    return FeeStatus.upcoming;
  }

  FeePeriod get period => inferPeriod(termName, dueDate);

  /// Sort key: academic-year order (Jul=0 … Jun=11), then by date within month.
  int get academicSortKey => _academicMonthOrder(dueDate.month);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

class PendingFeesController extends GetxController
    with GetSingleTickerProviderStateMixin {
  final FeeRepository _feeRepo = FeeRepository();

  // ── Observable state ──────────────────────────────────────────────────────
  final RxList<FeeItem>          fees             = <FeeItem>[].obs;
  final RxSet<String>            selectedIds      = <String>{}.obs;
  final RxBool                   isLoading        = false.obs;
  final RxBool                   isRefreshing     = false.obs;
  final RxBool                   hasLoadedOnce    = false.obs;
  final RxInt                    activeQuickSelect = (-1).obs;
  final RxMap<FeePeriod, bool>   sectionExpanded  = <FeePeriod, bool>{
    FeePeriod.term1:  true,
    FeePeriod.term2:  true,
    FeePeriod.annual: true,
    FeePeriod.other:  true,
  }.obs;

  // ── Animation ─────────────────────────────────────────────────────────────
  late final AnimationController payBarController;
  late final Animation<double>   payBarSlide;
  late final Animation<double>   payBarFade;

  // ── Derived ───────────────────────────────────────────────────────────────
  List<FeeItem> get pendingFees  => fees.where((f) => !f.isPaid).toList();
  List<FeeItem> get overdueFees  => pendingFees.where((f) => f.isOverdue).toList();
  List<FeeItem> get selectedFees => pendingFees.where((f) => selectedIds.contains(f.id)).toList();

  double get selectedTotal    => selectedFees.fold(0.0, (s, f) => s + f.amount);
  double get totalOutstanding => pendingFees.fold(0.0, (s, f) => s + f.amount);
  double get overdueTotal     => overdueFees.fold(0.0, (s, f) => s + f.amount);
  double get paidTotal        => fees.where((f) => f.isPaid).fold(0.0, (s, f) => s + f.amount);
  double get grandTotal       => paidTotal + totalOutstanding;

  bool get hasSelection => selectedIds.isNotEmpty;

  /// Monthly fees sorted chronologically in academic order (Jul → Jun).
  List<FeeItem> get sortedMonthlyFees {
    final monthly = pendingFees
        .where((f) => f.period == FeePeriod.term1 || f.period == FeePeriod.term2)
        .toList()
      ..sort((a, b) {
        // Overdue items always come first so parents see them immediately
        if (a.isOverdue != b.isOverdue) return a.isOverdue ? -1 : 1;
        // Then sort by academic month (Jul=1 … Jun=12)
        final ak = a.academicSortKey, bk = b.academicSortKey;
        if (ak != bk) return ak.compareTo(bk);
        return a.dueDate.compareTo(b.dueDate);
      });
    return monthly;
  }

  /// Fees grouped by term, each group sorted in academic order.
  Map<FeePeriod, List<FeeItem>> get groupedFees {
    final map = <FeePeriod, List<FeeItem>>{};
    for (final fee in pendingFees) {
      map.putIfAbsent(fee.period, () => []).add(fee);
    }
    const termOrder = [FeePeriod.term1, FeePeriod.term2, FeePeriod.annual, FeePeriod.other];
    for (final period in termOrder) {
      final list = map[period];
      if (list == null) continue;
      list.sort((a, b) {
        if (a.isOverdue != b.isOverdue) return a.isOverdue ? -1 : 1;
        final ak = a.academicSortKey, bk = b.academicSortKey;
        if (ak != bk) return ak.compareTo(bk);
        return a.dueDate.compareTo(b.dueDate);
      });
    }
    return map;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  @override
  void onInit() {
    super.onInit();
    payBarController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 380));
    payBarSlide = Tween<double>(begin: 1.0, end: 0.0).animate(
        CurvedAnimation(parent: payBarController, curve: Curves.easeOutBack));
    payBarFade = Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(parent: payBarController, curve: Curves.easeOut));
    ever(selectedIds, (_) => _syncPayBar());
    _loadFees();
  }

  @override
  void onClose() {
    payBarController.dispose();
    super.onClose();
  }

  void _syncPayBar() {
    selectedIds.isNotEmpty
        ? payBarController.forward()
        : payBarController.reverse();
  }

  // ── Data loading ──────────────────────────────────────────────────────────
  Future<void> _loadFees() async {
    isLoading.value = true;
    try {
      final prefs     = await SharedPreferences.getInstance();
      final studentId = prefs.getString(StorageKeys.studentId) ?? '';
      if (studentId.isNotEmpty) {
        final data   = await _feeRepo.getFees(studentId);
        final mapped = data.map((f) => FeeItem(
          id:       f.id,
          termName: f.termName,
          amount:   f.isPaid ? f.amount : f.remainingAmount,
          dueDate:  DateTime.tryParse(f.dueDate) ?? DateTime.now(),
          isPaid:   f.isPaid,
        )).toList();
        fees.assignAll(mapped);
      }
    } catch (e) {
      debugPrint('Error in _loadFees: $e');
    } finally {
      isLoading.value   = false;
      hasLoadedOnce.value = true;
    }
  }

  Future<void> refresh() async {
    isRefreshing.value = true;
    try {
      final prefs     = await SharedPreferences.getInstance();
      final studentId = prefs.getString(StorageKeys.studentId) ?? '';
      if (studentId.isNotEmpty) {
        final data   = await _feeRepo.getFees(studentId);
        final mapped = data.map((f) => FeeItem(
          id:       f.id,
          termName: f.termName,
          amount:   f.isPaid ? f.amount : f.remainingAmount,
          dueDate:  DateTime.tryParse(f.dueDate) ?? DateTime.now(),
          isPaid:   f.isPaid,
        )).toList();
        fees.assignAll(mapped);
      }
    } catch (e) {
      debugPrint('Error in refresh: $e');
    } finally {
      isRefreshing.value  = false;
      hasLoadedOnce.value = true;
    }
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  void toggleFee(FeeItem fee) {
    activeQuickSelect.value = -1;
    selectedIds.contains(fee.id)
        ? selectedIds.remove(fee.id)
        : selectedIds.add(fee.id);
  }

  void selectAllInSection(FeePeriod period) {
    final list     = pendingFees.where((f) => f.period == period).toList();
    final allSel   = list.every((f) => selectedIds.contains(f.id));
    if (allSel) {
      for (final f in list) selectedIds.remove(f.id);
    } else {
      for (final f in list) selectedIds.add(f.id);
    }
    activeQuickSelect.value = -1;
  }

  bool isSectionFullySelected(FeePeriod period) {
    final list = pendingFees.where((f) => f.period == period).toList();
    return list.isNotEmpty && list.every((f) => selectedIds.contains(f.id));
  }

  /// Quick-select the first [n] monthly fees in academic order (Jul → Jun).
  /// Overdue ones are always included first because sortedMonthlyFees puts
  /// them at the top. n == 9999 means select all.
  void quickSelectMonths(int n) {
    selectedIds.clear();
    final monthly = sortedMonthlyFees;
    final count   = n == 9999 ? monthly.length : n.clamp(0, monthly.length);
    for (int i = 0; i < count; i++) {
      selectedIds.add(monthly[i].id);
    }
  }

  /// Quick-select all fees in a specific term.
  void quickSelectTerm(FeePeriod period) {
    selectedIds.clear();
    final list = pendingFees.where((f) => f.period == period).toList()
      ..sort((a, b) {
        if (a.isOverdue != b.isOverdue) return a.isOverdue ? -1 : 1;
        final ak = a.academicSortKey, bk = b.academicSortKey;
        if (ak != bk) return ak.compareTo(bk);
        return a.dueDate.compareTo(b.dueDate);
      });
    for (final f in list) selectedIds.add(f.id);
  }

  void selectAllOverdue() {
    for (final f in overdueFees) selectedIds.add(f.id);
    activeQuickSelect.value = -1;
  }

  void clearSelection() {
    selectedIds.clear();
    activeQuickSelect.value = -1;
  }

  void toggleSection(FeePeriod period) {
    sectionExpanded[period] = !(sectionExpanded[period] ?? true);
    // ignore: invalid_use_of_protected_member
    sectionExpanded.refresh();
  }

  // ── Payment ───────────────────────────────────────────────────────────────
  Future<void> paySelected() async {
    final toPayItems = pendingFees
        .where((f) => selectedIds.contains(f.id))
        .toList();
    if (toPayItems.isEmpty) return;

    isLoading.value = true;
    try {
      bool allSuccess = true;
      for (final fee in toPayItems) {
        final ok = await _feeRepo.payFee(fee.id, fee.amount, 'online');
        if (!ok) allSuccess = false;
      }

      if (allSuccess) {
        final updated = fees.map((f) => selectedIds.contains(f.id)
            ? FeeItem(
                id: f.id, termName: f.termName,
                amount: f.amount, dueDate: f.dueDate, isPaid: true)
            : f).toList();
        fees.assignAll(updated);
        selectedIds.clear();

        final prefs = await SharedPreferences.getInstance();
        final sId   = prefs.getString(StorageKeys.studentId) ?? '';
        final pId   = prefs.getString(StorageKeys.parentId)  ?? '';
        if (sId.isNotEmpty) {
          await prefs.remove('fees_cache_$sId');
          await prefs.remove('payments_cache_$sId');
          await prefs.remove('payments_time_$sId');
          await prefs.remove('receipts_cache_$sId');
          await prefs.remove('receipts_time_$sId');
        }
        if (pId.isNotEmpty) {
          await prefs.remove('student_time_$pId');
        }

        if (Get.isRegistered<DashboardController>()) {
          Get.find<DashboardController>().refreshData();
        }
      } else {
        Get.snackbar('Payment Failed ❌',
            'Unable to process one or more fees. Please try again.',
            snackPosition: SnackPosition.BOTTOM);
      }
    } catch (e) {
      debugPrint('Error in paySelected: $e');
      Get.snackbar('Payment Error ❌',
          'An error occurred. Please try again.',
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isLoading.value = false;
    }
  }
}
