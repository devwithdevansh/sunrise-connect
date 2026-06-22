import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import '../controllers/pending_fees_controller.dart';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — Sunrise Connect theme
// ─────────────────────────────────────────────────────────────────────────────
class _C {
  static const navy        = Color(0xFF1B3A7A);
  static const navyLight   = Color(0xFF2E4E9A);
  static const pageBg      = Color(0xFFEEF0F7);
  static const white       = Color(0xFFFFFFFF);
  static const ink         = Color(0xFF1A1E2E);
  static const inkMid      = Color(0xFF5A6275);
  static const inkLight    = Color(0xFF9BA3B6);
  static const border      = Color(0xFFE4E8F0);
  static const borderMid   = Color(0xFFCDD3E0);
  static const accent      = Color(0xFF2563EB);
  static const accentBg    = Color(0xFFEBF2FF);
  static const teal        = Color(0xFF0FB893);
  static const tealBg      = Color(0xFFE8FAF5);
  static const tealBorder  = Color(0xFFB0EDD9);
  static const red         = Color(0xFFE53935);
  static const redBg       = Color(0xFFFFF0F0);
  static const redBorder   = Color(0xFFFFCDD2);
  static const amber       = Color(0xFFD97706);
  static const amberBg     = Color(0xFFFFF8E6);
  static const amberBorder = Color(0xFFFFE4A0);
  static const green       = Color(0xFF16A34A);
  static const greenBg     = Color(0xFFEEFAF2);
  static const purpleBg    = Color(0xFFF3EEFF);
  static const purple      = Color(0xFF7C3AED);
}

class _T {
  static const h1    = TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: _C.ink, letterSpacing: -0.2);
  static const h2    = TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: _C.ink, letterSpacing: -0.1);
  static const label = TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: _C.ink);
  static const body  = TextStyle(fontSize: 13, fontWeight: FontWeight.w400, color: _C.inkMid, height: 1.4);
  static const caption = TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: _C.inkLight, letterSpacing: 0.1);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
String _fmt(double amount) {
  final isNeg  = amount < 0;
  final digits = amount.abs().round().toString();
  String result;
  if (digits.length <= 3) {
    result = digits;
  } else {
    final last3 = digits.substring(digits.length - 3);
    var rest    = digits.substring(0, digits.length - 3);
    final parts = <String>[];
    while (rest.length > 2) {
      parts.insert(0, rest.substring(rest.length - 2));
      rest = rest.substring(0, rest.length - 2);
    }
    if (rest.isNotEmpty) parts.insert(0, rest);
    result = '${parts.join(',')},$last3';
  }
  return (isNeg ? '-₹' : '₹') + result;
}

String _fmtDate(DateTime d) {
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return '${d.day} ${m[d.month - 1]} ${d.year}';
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT VIEW
// ─────────────────────────────────────────────────────────────────────────────
class PendingFeesView extends StatelessWidget {
  const PendingFeesView({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Get.find<PendingFeesController>();
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(statusBarColor: Colors.transparent),
      child: Scaffold(
        backgroundColor: _C.pageBg,
        body: Obx(() {
          if (c.isLoading.value && !c.hasLoadedOnce.value) return const _Shimmer();
          if (c.hasLoadedOnce.value && c.pendingFees.isEmpty) return const _EmptyState();
          return Stack(children: [_Body(c: c), _PayBar(c: c)]);
        }),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BODY
// ─────────────────────────────────────────────────────────────────────────────
class _Body extends StatelessWidget {
  const _Body({required this.c});
  final PendingFeesController c;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: c.refresh,
      color: _C.navy,
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          _AppBar(c: c),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            sliver: SliverList(delegate: SliverChildListDelegate([
              _SummaryCard(c: c),
              const SizedBox(height: 16),
              _OverdueBanner(c: c),
              const SizedBox(height: 16),
              _QuickSelect(c: c),
              const SizedBox(height: 20),
            ])),
          ),
          _Sections(c: c),
          const SliverToBoxAdapter(child: SizedBox(height: 130)),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// APP BAR
// ─────────────────────────────────────────────────────────────────────────────
class _AppBar extends StatelessWidget {
  const _AppBar({required this.c});
  final PendingFeesController c;

  @override
  Widget build(BuildContext context) {
    return SliverAppBar(
      pinned: true,
      backgroundColor: _C.navy,
      elevation: 0,
      systemOverlayStyle: SystemUiOverlayStyle.light,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
        onPressed: () => Get.back(),
      ),
      title: Obx(() {
        final sel = c.selectedIds.length;
        return AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          child: sel > 0
              ? Text('$sel selected', key: const ValueKey('s'),
                  style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700))
              : const Text('Pending Fees', key: ValueKey('t'),
                  style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700)),
        );
      }),
      centerTitle: true,
      actions: [
        Obx(() => AnimatedOpacity(
          opacity: c.hasSelection ? 1 : 0,
          duration: const Duration(milliseconds: 200),
          child: TextButton(
            onPressed: c.hasSelection ? c.clearSelection : null,
            child: const Text('Clear', style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w600)),
          ),
        )),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY CARD
// ─────────────────────────────────────────────────────────────────────────────
class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.c});
  final PendingFeesController c;

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final total   = c.grandTotal;
      final paid    = c.paidTotal;
      final pending = c.totalOutstanding;
      final pct     = total > 0 ? (paid / total).clamp(0.0, 1.0) : 0.0;

      return _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Text('Fee Summary', style: _T.h1),
          const Spacer(),
          GestureDetector(
            onTap: () {},
            child: const Text('View All', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _C.accent)),
          ),
        ]),
        const SizedBox(height: 14),
        Row(children: [
          _SumChip(label: 'Total Fees', value: _fmt(total),   bg: _C.accentBg, valueColor: _C.navy),
          const SizedBox(width: 8),
          _SumChip(label: 'Paid',       value: _fmt(paid),    bg: _C.tealBg,   valueColor: _C.teal),
          const SizedBox(width: 8),
          _SumChip(label: 'Pending',    value: _fmt(pending), bg: _C.redBg,    valueColor: _C.red),
        ]),
        const SizedBox(height: 14),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: pct, minHeight: 7,
            backgroundColor: _C.border,
            valueColor: const AlwaysStoppedAnimation<Color>(_C.teal),
          ),
        ),
        const SizedBox(height: 6),
        Text('${(pct * 100).round()}% paid of total fees', style: _T.caption),
      ]));
    });
  }
}

class _SumChip extends StatelessWidget {
  const _SumChip({required this.label, required this.value, required this.bg, required this.valueColor});
  final String label, value;
  final Color bg, valueColor;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: _C.inkMid)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: valueColor, letterSpacing: -0.3)),
        ]),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERDUE BANNER
// ─────────────────────────────────────────────────────────────────────────────
class _OverdueBanner extends StatelessWidget {
  const _OverdueBanner({required this.c});
  final PendingFeesController c;

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final overdue = c.overdueFees;
      if (overdue.isEmpty) return const SizedBox.shrink();
      return GestureDetector(
        onTap: () { HapticFeedback.selectionClick(); c.selectAllOverdue(); },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: _C.redBg, borderRadius: BorderRadius.circular(14),
            border: Border.all(color: _C.redBorder),
          ),
          child: Row(children: [
            Container(width: 36, height: 36,
              decoration: BoxDecoration(color: _C.red.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.warning_amber_rounded, color: _C.red, size: 20)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${overdue.length} overdue · ${_fmt(c.overdueTotal)}',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: _C.red)),
              const SizedBox(height: 2),
              const Text('Tap to select all overdue fees',
                  style: TextStyle(fontSize: 11, color: _C.red)),
            ])),
            const Icon(Icons.chevron_right_rounded, color: _C.red, size: 20),
          ]),
        ),
      );
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK SELECT ROW
// ─────────────────────────────────────────────────────────────────────────────
class _QuickSelect extends StatelessWidget {
  const _QuickSelect({required this.c});
  final PendingFeesController c;

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        const Text('Quick Select', style: _T.h1),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(color: _C.accentBg, borderRadius: BorderRadius.circular(6)),
          child: const Text('Monthly (Jul → Jun)',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: _C.accent)),
        ),
      ]),
      const SizedBox(height: 10),
      SizedBox(
        height: 40,
        child: ListView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          children: [
            _QChip(label: 'Overdue', idx: 0, c: c, isOverdue: true,
                onTap: () { c.activeQuickSelect.value = 0; c.quickSelectMonths(0); c.selectAllOverdue(); }),
            const SizedBox(width: 8),
            _QChip(label: '1 Month',    idx: 1,  c: c, onTap: () { c.activeQuickSelect.value = 1;  c.quickSelectMonths(1);    }),
            const SizedBox(width: 8),
            _QChip(label: '2 Months',   idx: 2,  c: c, onTap: () { c.activeQuickSelect.value = 2;  c.quickSelectMonths(2);    }),
            const SizedBox(width: 8),
            _QChip(label: '3 Months',   idx: 3,  c: c, onTap: () { c.activeQuickSelect.value = 3;  c.quickSelectMonths(3);    }),
            const SizedBox(width: 8),
            _QChip(label: '6 Months',   idx: 6,  c: c, onTap: () { c.activeQuickSelect.value = 6;  c.quickSelectMonths(6);    }),
            const SizedBox(width: 8),
            _QChip(label: 'Term 1',     idx: 11, c: c, onTap: () { c.activeQuickSelect.value = 11; c.quickSelectTerm(FeePeriod.term1); }),
            const SizedBox(width: 8),
            _QChip(label: 'Term 2',     idx: 12, c: c, onTap: () { c.activeQuickSelect.value = 12; c.quickSelectTerm(FeePeriod.term2); }),
            const SizedBox(width: 8),
            _QChip(label: 'Transport',  idx: 13, c: c, onTap: () { c.activeQuickSelect.value = 13; c.quickSelectTerm(FeePeriod.transport); }),
            const SizedBox(width: 8),
            _QChip(label: 'All Monthly', idx: 99, c: c, onTap: () { c.activeQuickSelect.value = 99; c.quickSelectMonths(9999); }),
          ],
        ),
      ),
    ]);
  }
}

class _QChip extends StatelessWidget {
  const _QChip({required this.label, required this.idx, required this.c, required this.onTap, this.isOverdue = false});
  final String label;
  final int idx;
  final PendingFeesController c;
  final VoidCallback onTap;
  final bool isOverdue;

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final active     = c.activeQuickSelect.value == idx;
      final activeBg   = isOverdue ? _C.red   : _C.navy;
      final inactiveBg = isOverdue ? _C.redBg : _C.white;
      final textActive = Colors.white;
      final textIdle   = isOverdue ? _C.red   : _C.inkMid;
      final border     = isOverdue
          ? (active ? _C.red   : _C.redBorder)
          : (active ? _C.navy  : _C.borderMid);

      return GestureDetector(
        onTap: () { HapticFeedback.selectionClick(); onTap(); },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: active ? activeBg : inactiveBg,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: border, width: 1.5),
            boxShadow: active ? [BoxShadow(color: activeBg.withOpacity(0.28), blurRadius: 8, offset: const Offset(0, 3))] : [],
          ),
          child: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: active ? textActive : textIdle)),
        ),
      );
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTIONS SLIVER
// ─────────────────────────────────────────────────────────────────────────────
class _Sections extends StatelessWidget {
  const _Sections({required this.c});
  final PendingFeesController c;

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final grouped = c.groupedFees;
      const order   = [FeePeriod.term1, FeePeriod.term2, FeePeriod.transport];
      final widgets  = <Widget>[];
      for (final p in order) {
        final fees = grouped[p];
        if (fees == null || fees.isEmpty) continue;
        widgets.add(Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
          child: _SectionCard(period: p, fees: fees, c: c),
        ));
      }
      return SliverList(delegate: SliverChildListDelegate(widgets));
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION CARD
// ─────────────────────────────────────────────────────────────────────────────
class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.period, required this.fees, required this.c});
  final FeePeriod period;
  final List<FeeItem> fees;
  final PendingFeesController c;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: _C.white, borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _C.border),
        boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 12, offset: Offset(0, 4))],
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(children: [
        _SectionHeader(period: period, fees: fees, c: c),
        Obx(() {
          final expanded = c.sectionExpanded[period] ?? true;
          return AnimatedCrossFade(
            firstChild:  _SectionRows(fees: fees, c: c),
            secondChild: const SizedBox(width: double.infinity, height: 0),
            crossFadeState: expanded ? CrossFadeState.showFirst : CrossFadeState.showSecond,
            duration: const Duration(milliseconds: 280),
            sizeCurve: Curves.easeInOut,
          );
        }),
      ]),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.period, required this.fees, required this.c});
  final FeePeriod period;
  final List<FeeItem> fees;
  final PendingFeesController c;

  IconData get _icon {
    switch (period) {
      case FeePeriod.term1:     return Icons.wb_sunny_rounded;
      case FeePeriod.term2:     return Icons.ac_unit_rounded;
      case FeePeriod.transport: return Icons.directions_bus_rounded;
    }
  }

  Color get _iconColor {
    switch (period) {
      case FeePeriod.term1:     return _C.amber;
      case FeePeriod.term2:     return _C.accent;
      case FeePeriod.transport: return _C.teal;
    }
  }

  Color get _iconBg {
    switch (period) {
      case FeePeriod.term1:     return _C.amberBg;
      case FeePeriod.term2:     return _C.accentBg;
      case FeePeriod.transport: return _C.tealBg;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final expanded    = c.sectionExpanded[period] ?? true;
      final allSelected = c.isSectionFullySelected(period);
      final overdueN    = fees.where((f) => f.isOverdue).length;

      return GestureDetector(
        onTap: () => c.toggleSection(period),
        behavior: HitTestBehavior.opaque,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(border: expanded ? const Border(bottom: BorderSide(color: _C.border)) : null),
          child: Row(children: [
            Container(width: 38, height: 38,
              decoration: BoxDecoration(color: _iconBg, borderRadius: BorderRadius.circular(11)),
              child: Icon(_icon, color: _iconColor, size: 20)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(period.label, style: _T.label),
              if (overdueN > 0)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text('$overdueN overdue',
                      style: const TextStyle(fontSize: 11, color: _C.red, fontWeight: FontWeight.w500)),
                ),
            ])),
            GestureDetector(
              onTap: () { HapticFeedback.selectionClick(); c.selectAllInSection(period); },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: allSelected ? _C.navy : _C.accentBg,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(allSelected ? 'Deselect all' : 'Select all',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
                        color: allSelected ? Colors.white : _C.accent)),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: _C.pageBg, borderRadius: BorderRadius.circular(20)),
              child: Text('${fees.length}', style: _T.caption),
            ),
            const SizedBox(width: 4),
            AnimatedRotation(
              turns: expanded ? 0 : -0.25,
              duration: const Duration(milliseconds: 240),
              curve: Curves.easeInOut,
              child: const Icon(Icons.keyboard_arrow_down_rounded, color: _C.inkLight, size: 22),
            ),
          ]),
        ),
      );
    });
  }
}

class _SectionRows extends StatelessWidget {
  const _SectionRows({required this.fees, required this.c});
  final List<FeeItem> fees;
  final PendingFeesController c;

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      for (int i = 0; i < fees.length; i++) ...[
        _FeeRow(fee: fees[i], c: c),
        if (i < fees.length - 1)
          const Divider(height: 1, color: _C.border, indent: 70, endIndent: 16),
      ],
    ]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FEE ROW
// ─────────────────────────────────────────────────────────────────────────────
class _FeeRow extends StatelessWidget {
  const _FeeRow({required this.fee, required this.c});
  final FeeItem fee;
  final PendingFeesController c;

  Color get _statusColor {
    switch (fee.status) {
      case FeeStatus.overdue:  return _C.red;
      case FeeStatus.dueSoon:  return _C.amber;
      case FeeStatus.upcoming: return _C.accent;
    }
  }

  Color get _statusBg {
    switch (fee.status) {
      case FeeStatus.overdue:  return _C.redBg;
      case FeeStatus.dueSoon:  return _C.amberBg;
      case FeeStatus.upcoming: return _C.accentBg;
    }
  }

  Color get _statusBorder {
    switch (fee.status) {
      case FeeStatus.overdue:  return _C.redBorder;
      case FeeStatus.dueSoon:  return _C.amberBorder;
      case FeeStatus.upcoming: return _C.border;
    }
  }

  String get _statusLabel {
    switch (fee.status) {
      case FeeStatus.overdue:  return 'Overdue';
      case FeeStatus.dueSoon:  return 'Due Soon';
      case FeeStatus.upcoming: return 'Upcoming';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final selected = c.selectedIds.contains(fee.id);
      return GestureDetector(
        onTap: () { HapticFeedback.selectionClick(); c.toggleFee(fee); },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          color: selected ? _C.navy.withOpacity(0.05) : Colors.transparent,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
          child: Row(children: [
            // Checkbox
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutBack,
              width: 22, height: 22,
              decoration: BoxDecoration(
                color: selected ? _C.navy : Colors.transparent,
                borderRadius: BorderRadius.circular(7),
                border: Border.all(color: selected ? _C.navy : _C.borderMid, width: 2),
                boxShadow: selected
                    ? [BoxShadow(color: _C.navy.withOpacity(0.25), blurRadius: 6, offset: const Offset(0, 2))]
                    : [],
              ),
              child: selected ? const Icon(Icons.check_rounded, color: Colors.white, size: 13) : null,
            ),
            const SizedBox(width: 12),
            // Icon
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(color: _statusBg, borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.calendar_today_rounded, color: _statusColor, size: 18),
            ),
            const SizedBox(width: 12),
            // Name + date
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(fee.termName, style: _T.label),
              const SizedBox(height: 3),
              Text('Due: ${_fmtDate(fee.dueDate)}',
                  style: const TextStyle(fontSize: 12, color: _C.inkMid, fontWeight: FontWeight.w400)),
            ])),
            const SizedBox(width: 8),
            // Amount + badge
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text(_fmt(fee.amount),
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: _statusColor, letterSpacing: -0.2)),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(
                  color: _statusBg, borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: _statusBorder),
                ),
                child: Text(_statusLabel,
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: _statusColor)),
              ),
            ]),
          ]),
        ),
      );
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING PAY BAR
// ─────────────────────────────────────────────────────────────────────────────
class _PayBar extends StatelessWidget {
  const _PayBar({required this.c});
  final PendingFeesController c;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: 0, right: 0, bottom: 0,
      child: AnimatedBuilder(
        animation: c.payBarController,
        builder: (_, child) => Transform.translate(
          offset: Offset(0, c.payBarSlide.value * 130),
          child: FadeTransition(opacity: c.payBarFade, child: child),
        ),
        child: Container(
          decoration: const BoxDecoration(
            color: _C.white,
            border: Border(top: BorderSide(color: _C.border)),
            boxShadow: [BoxShadow(color: Color(0x14000000), blurRadius: 20, offset: Offset(0, -6))],
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Obx(() {
                final count = c.selectedIds.length;
                final total = c.selectedTotal;
                return GestureDetector(
                  onTap: () { HapticFeedback.mediumImpact(); _showPaySheet(context, c); },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Color(0xFF1B3A7A), Color(0xFF2E4E9A)]),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(color: _C.navy.withOpacity(0.32), blurRadius: 16, offset: const Offset(0, 6))],
                    ),
                    child: Row(children: [
                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('$count item${count == 1 ? '' : 's'} selected',
                            style: const TextStyle(fontSize: 11, color: Colors.white60, fontWeight: FontWeight.w500)),
                        const SizedBox(height: 2),
                        Text(_fmt(total),
                            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -0.3)),
                      ]),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.18),
                          borderRadius: BorderRadius.circular(11),
                          border: Border.all(color: Colors.white.withOpacity(0.2)),
                        ),
                        child: const Row(children: [
                          Text('Pay Now', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
                          SizedBox(width: 6),
                          Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 15),
                        ]),
                      ),
                    ]),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT BOTTOM SHEET
// ─────────────────────────────────────────────────────────────────────────────
void _showPaySheet(BuildContext context, PendingFeesController c) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _PaySheet(c: c),
  );
}

class _PaySheet extends StatelessWidget {
  const _PaySheet({required this.c});
  final PendingFeesController c;

  @override
  Widget build(BuildContext context) {
    final fees  = c.selectedFees;
    final total = c.selectedTotal;

    return Container(
      decoration: const BoxDecoration(
        color: _C.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(margin: const EdgeInsets.only(top: 12), width: 38, height: 4,
            decoration: BoxDecoration(color: _C.border, borderRadius: BorderRadius.circular(2))),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(width: 44, height: 44,
                decoration: BoxDecoration(color: _C.accentBg, borderRadius: BorderRadius.circular(13)),
                child: const Icon(Icons.payment_rounded, color: _C.accent, size: 22)),
              const SizedBox(width: 12),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Confirm Payment', style: _T.h2),
                Text('${fees.length} fee${fees.length == 1 ? '' : 's'} selected', style: _T.caption),
              ]),
              const Spacer(),
              GestureDetector(
                onTap: () => Get.back(),
                child: Container(width: 32, height: 32,
                  decoration: BoxDecoration(color: _C.pageBg, borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.close_rounded, size: 18, color: _C.inkMid)),
              ),
            ]),
            const SizedBox(height: 16),
            const Divider(height: 1, color: _C.border),
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 260),
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: fees.length,
                separatorBuilder: (_, __) => const Divider(height: 1, color: _C.border),
                itemBuilder: (_, i) {
                  final f    = fees[i];
                  final isOD = f.isOverdue;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 11),
                    child: Row(children: [
                      Container(width: 36, height: 36,
                        decoration: BoxDecoration(
                          color: isOD ? _C.redBg : _C.accentBg,
                          borderRadius: BorderRadius.circular(10)),
                        child: Icon(Icons.calendar_today_rounded, color: isOD ? _C.red : _C.accent, size: 16)),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(f.termName, style: _T.label),
                        Text('Due: ${_fmtDate(f.dueDate)}', style: _T.caption),
                      ])),
                      Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                        Text(_fmt(f.amount),
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: isOD ? _C.red : _C.ink)),
                        if (isOD)
                          Container(
                            margin: const EdgeInsets.only(top: 3),
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: _C.redBg, borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: _C.redBorder)),
                            child: const Text('Overdue',
                                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: _C.red)),
                          ),
                      ]),
                    ]),
                  );
                },
              ),
            ),
            const Divider(color: _C.border, height: 20),
            Row(children: [
              const Text('Total Amount', style: _T.label),
              const Spacer(),
              Text(_fmt(total),
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: _C.navy, letterSpacing: -0.3)),
            ]),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(
                color: _C.amberBg, borderRadius: BorderRadius.circular(10),
                border: Border.all(color: _C.amberBorder)),
              child: const Row(children: [
                Icon(Icons.info_outline_rounded, color: _C.amber, size: 15),
                SizedBox(width: 8),
                Expanded(child: Text('Partial payments are not accepted. Full amount only.',
                    style: TextStyle(fontSize: 11, color: _C.amber, fontWeight: FontWeight.w500, height: 1.4))),
              ]),
            ),
            const SizedBox(height: 18),
            Row(children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => Get.back(),
                  child: Container(height: 50,
                    decoration: BoxDecoration(color: _C.pageBg, borderRadius: BorderRadius.circular(13), border: Border.all(color: _C.borderMid)),
                    child: const Center(child: Text('Cancel', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: _C.inkMid)))),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(flex: 2,
                child: GestureDetector(
                  onTap: () async {
                    Get.back();
                    HapticFeedback.mediumImpact();
                    await c.paySelected();
                    Get.snackbar('✅  Payment Successful',
                        '${fees.length} fee${fees.length == 1 ? '' : 's'} · ${_fmt(total)}',
                        backgroundColor: _C.green, colorText: Colors.white,
                        snackPosition: SnackPosition.TOP,
                        margin: const EdgeInsets.all(16), borderRadius: 14,
                        duration: const Duration(seconds: 3));
                  },
                  child: Container(height: 50,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Color(0xFF1B3A7A), Color(0xFF2E4E9A)]),
                      borderRadius: BorderRadius.circular(13),
                      boxShadow: [BoxShadow(color: _C.navy.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))]),
                    child: Center(child: Text('Pay ${_fmt(total)}',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)))),
                ),
              ),
            ]),
            const SizedBox(height: 8),
          ]),
        ),
        SafeArea(top: false, child: const SizedBox(height: 4)),
      ]),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED CARD WIDGET
// ─────────────────────────────────────────────────────────────────────────────
class _Card extends StatelessWidget {
  const _Card({required this.child, this.padding});
  final Widget child;
  final EdgeInsets? padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _C.white, borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _C.border),
        boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 12, offset: Offset(0, 4))],
      ),
      child: child,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIMMER
// ─────────────────────────────────────────────────────────────────────────────
class _Shimmer extends StatefulWidget {
  const _Shimmer();
  @override State<_Shimmer> createState() => _ShimmerState();
}

class _ShimmerState extends State<_Shimmer> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double>   _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat();
    _anim = Tween<double>(begin: -1.5, end: 1.5).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  Widget _box(double h) => Container(
    height: h, margin: const EdgeInsets.only(bottom: 14),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(16),
      gradient: LinearGradient(
        begin: Alignment(_anim.value - 1, 0), end: Alignment(_anim.value + 1, 0),
        colors: const [Color(0xFFEEEFF5), Color(0xFFE2E4EE), Color(0xFFEEEFF5)],
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 70, 16, 0),
          child: Column(children: [_box(140), _box(48), _box(48), _box(200), _box(110)]),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(width: 88, height: 88,
            decoration: const BoxDecoration(color: _C.tealBg, shape: BoxShape.circle),
            child: const Icon(Icons.check_circle_outline_rounded, size: 46, color: _C.teal)),
          const SizedBox(height: 24),
          const Text('All Fees Paid! 🎉', style: _T.h1),
          const SizedBox(height: 8),
          const Text('No outstanding dues on this account.', style: _T.body, textAlign: TextAlign.center),
          const SizedBox(height: 28),
          GestureDetector(
            onTap: () => Get.back(),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
              decoration: BoxDecoration(color: _C.navy, borderRadius: BorderRadius.circular(13)),
              child: const Text('Back to Dashboard',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
            ),
          ),
        ]),
      ),
    );
  }
}
