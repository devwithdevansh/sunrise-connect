import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:lottie/lottie.dart';
import '../controllers/pending_fees_controller.dart';
import '../../../../../core/widgets/animated_button.dart';
import 'package:flutter_animate/flutter_animate.dart' hide GetNumUtils;

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — Sunrise Connect Premium Theme
// ─────────────────────────────────────────────────────────────────────────────
class _C {
  static const navy        = Color(0xFF1B3A7A);
  static const navyDark    = Color(0xFF0F2552);
  static const navyLight   = Color(0xFF2E4E9A);
  static const pageBg      = Color(0xFFF4F6FB);
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
  static const h1      = TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: _C.ink, letterSpacing: -0.2);
  static const h2      = TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: _C.ink, letterSpacing: -0.1);
  static const label   = TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: _C.ink);
  static const body    = TextStyle(fontSize: 13, fontWeight: FontWeight.w400, color: _C.inkMid, height: 1.4);
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
      child: Stack(children: [
        Scaffold(
          backgroundColor: _C.pageBg,
          body: Obx(() {
            if (c.isLoading.value && !c.hasLoadedOnce.value) return const _Shimmer();
            if (c.hasLoadedOnce.value && c.pendingFees.isEmpty) return const _EmptyState();
            return Stack(children: [_Body(c: c), _PayBar(c: c)]);
          }),
        ),
        Obx(() {
          if (c.showConfetti.value) {
            return Positioned.fill(
              child: IgnorePointer(
                child: Lottie.network(
                  'https://assets9.lottiefiles.com/packages/lf20_u4yrau.json',
                  repeat: false,
                  fit: BoxFit.cover,
                ),
              ),
            );
          }
          return const SizedBox.shrink();
        }),
      ]),
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
              _HeroSummaryCard(c: c),
              const SizedBox(height: 16),
              _OverdueBanner(c: c),
              const SizedBox(height: 16),
              _CategorySegmentedControl(c: c),
              const SizedBox(height: 16),
            ])),
          ),
          _TimelineSection(c: c),
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
      backgroundColor: _C.navyDark,
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
              : const Text('Fee Dues Timeline', key: ValueKey('t'),
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
// HERO SUMMARY CARD
// ─────────────────────────────────────────────────────────────────────────────
class _HeroSummaryCard extends StatelessWidget {
  const _HeroSummaryCard({required this.c});
  final PendingFeesController c;

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final total   = c.grandTotal;
      final paid    = c.paidTotal;
      final pending = c.totalOutstanding;
      final pct     = total > 0 ? (paid / total).clamp(0.0, 1.0) : 0.0;

      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [_C.navyDark, _C.navy, Color(0xFF2E4E9A)],
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: _C.navy.withOpacity(0.35),
              blurRadius: 18,
              offset: const Offset(0, 8),
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                  'Total Fees Due',
                  style: TextStyle(fontSize: 13, color: Colors.white70, fontWeight: FontWeight.w500),
                ),
                const Spacer(),
                if (c.isStudentRTE)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _C.teal.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: _C.tealBorder.withOpacity(0.4)),
                    ),
                    child: const Text(
                      'RTE Concession',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: _C.teal),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              _fmt(pending),
              style: const TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: Colors.white,
                letterSpacing: -0.8,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                _HeroChip(label: 'Total Dues', value: _fmt(total), icon: Icons.account_balance_wallet_rounded),
                const SizedBox(width: 10),
                _HeroChip(label: 'Paid Amount', value: _fmt(paid), icon: Icons.check_circle_rounded, isSuccess: true),
              ],
            ),
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: pct,
                minHeight: 6,
                backgroundColor: Colors.white12,
                valueColor: const AlwaysStoppedAnimation<Color>(_C.teal),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  '${(pct * 100).round()}% of total dues paid',
                  style: const TextStyle(fontSize: 11, color: Colors.white60, fontWeight: FontWeight.w500),
                ),
                const Spacer(),
                if (c.hasSelection)
                  Text(
                    'Selected: ${_fmt(c.selectedTotal)}',
                    style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w700),
                  ),
              ],
            ),
          ],
        ),
      );
    });
  }
}

class _HeroChip extends StatelessWidget {
  const _HeroChip({
    required this.label,
    required this.value,
    required this.icon,
    this.isSuccess = false,
  });

  final String label;
  final String value;
  final IconData icon;
  final bool isSuccess;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.12)),
        ),
        child: Row(
          children: [
            Icon(icon, color: isSuccess ? _C.teal : Colors.white70, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontSize: 10, color: Colors.white60, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 2),
                  Text(value, style: const TextStyle(fontSize: 13, color: Colors.white, fontWeight: FontWeight.w800)),
                ],
              ),
            ),
          ],
        ),
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
            color: _C.redBg, borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _C.redBorder),
          ),
          child: Row(children: [
            Container(width: 36, height: 36,
              decoration: BoxDecoration(color: _C.red.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.warning_amber_rounded, color: _C.red, size: 20)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${overdue.length} overdue item${overdue.length == 1 ? '' : 's'} · ${_fmt(c.overdueTotal)}',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: _C.red)),
              const SizedBox(height: 2),
              const Text('Tap to select and pay all overdue fees.',
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
// CATEGORY SEGMENTED CONTROL
// ─────────────────────────────────────────────────────────────────────────────
class _CategorySegmentedControl extends StatelessWidget {
  const _CategorySegmentedControl({required this.c});
  final PendingFeesController c;

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final selected = c.selectedCategory.value;
      final transportCount = c.transportPendingFees.length;
      final eduCount = c.educationPendingFees.length + c.termPendingFees.length;

      return Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: _C.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _C.border),
          boxShadow: const [BoxShadow(color: Color(0x06000000), blurRadius: 10, offset: Offset(0, 3))],
        ),
        child: Row(
          children: [
            Expanded(
              child: _SegButton(
                title: 'Academic Fees',
                icon: Icons.menu_book_rounded,
                badgeCount: eduCount,
                isSelected: selected == FeeFilterCategory.all || selected == FeeFilterCategory.education || selected == FeeFilterCategory.term,
                activeColor: _C.navy,
                onTap: () => c.setCategory(FeeFilterCategory.all),
              ),
            ),
            const SizedBox(width: 4),
            Expanded(
              child: _SegButton(
                title: 'Transport Dues',
                icon: Icons.directions_bus_rounded,
                badgeCount: transportCount,
                isSelected: selected == FeeFilterCategory.transport,
                activeColor: _C.teal,
                onTap: () => c.setCategory(FeeFilterCategory.transport),
              ),
            ),
          ],
        ),
      );
    });
  }
}

class _SegButton extends StatelessWidget {
  const _SegButton({
    required this.title,
    required this.icon,
    required this.badgeCount,
    required this.isSelected,
    required this.activeColor,
    required this.onTap,
  });

  final String title;
  final IconData icon;
  final int badgeCount;
  final bool isSelected;
  final Color activeColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 11),
        decoration: BoxDecoration(
          color: isSelected ? activeColor : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: isSelected ? Colors.white : _C.inkMid,
              ),
            ),
            if (badgeCount > 0) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: isSelected ? Colors.white.withOpacity(0.25) : _C.pageBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$badgeCount',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: isSelected ? Colors.white : _C.ink,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE SECTION SLIVER
// ─────────────────────────────────────────────────────────────────────────────
class _TimelineSection extends StatelessWidget {
  const _TimelineSection({required this.c});
  final PendingFeesController c;

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final category = c.selectedCategory.value;

      if (category == FeeFilterCategory.transport) {
        return _TransportTimeline(c: c);
      } else {
        return _AcademicTimeline(c: c);
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC TIMELINE (EDUCATION + TERM FEES)
// ─────────────────────────────────────────────────────────────────────────────
class _AcademicTimeline extends StatelessWidget {
  const _AcademicTimeline({required this.c});
  final PendingFeesController c;

  @override
  Widget build(BuildContext context) {
    final eduPending = c.unifiedEducationPendingFees;

    if (eduPending.isEmpty) {
      return SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          child: _Card(
            child: Column(
              children: [
                const Icon(Icons.school_rounded, color: _C.accent, size: 44),
                const SizedBox(height: 10),
                const Text('All Academic Dues Cleared!', style: _T.h1),
                const SizedBox(height: 4),
                const Text('No pending education or term fees.', style: _T.body),
              ],
            ),
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverList(
        delegate: SliverChildListDelegate([
          Container(
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: _C.accentBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _C.accent.withOpacity(0.2)),
            ),
            child: const Row(
              children: [
                Icon(Icons.info_outline_rounded, color: _C.accent, size: 16),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Please pay older months first before paying newer ones.',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _C.accent),
                  ),
                ),
              ],
            ),
          ),
          for (int i = 0; i < eduPending.length; i++) ...[
            _TimelineTile(
              fee: eduPending[i],
              c: c,
              isFirst: i == 0,
              isLast: i == eduPending.length - 1,
              themeColor: _C.accent,
            ),
          ],
        ]),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORT TIMELINE
// ─────────────────────────────────────────────────────────────────────────────
class _TransportTimeline extends StatelessWidget {
  const _TransportTimeline({required this.c});
  final PendingFeesController c;

  @override
  Widget build(BuildContext context) {
    final transportPending = c.unifiedTransportPendingFees;

    if (transportPending.isEmpty) {
      return SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          child: _Card(
            child: Column(
              children: [
                const Icon(Icons.directions_bus_rounded, color: _C.teal, size: 44),
                const SizedBox(height: 10),
                const Text('All Bus Fees Cleared!', style: _T.h1),
                const SizedBox(height: 4),
                const Text('No pending transport dues for this account.', style: _T.body),
              ],
            ),
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverList(
        delegate: SliverChildListDelegate([
          Container(
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: _C.tealBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _C.tealBorder),
            ),
            child: const Row(
              children: [
                Icon(Icons.directions_bus_rounded, color: _C.teal, size: 16),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Bus fees are separate from school fees and can be paid anytime.',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _C.teal),
                  ),
                ),
              ],
            ),
          ),
          for (int i = 0; i < transportPending.length; i++) ...[
            _TimelineTile(
              fee: transportPending[i],
              c: c,
              isFirst: i == 0,
              isLast: i == transportPending.length - 1,
              themeColor: _C.teal,
            ),
          ],
        ]),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE TILE WITH CONNECTING LINE
// ─────────────────────────────────────────────────────────────────────────────
class _TimelineTile extends StatelessWidget {
  const _TimelineTile({
    required this.fee,
    required this.c,
    required this.isFirst,
    required this.isLast,
    required this.themeColor,
  });

  final FeeItem fee;
  final PendingFeesController c;
  final bool isFirst;
  final bool isLast;
  final Color themeColor;

  IconData get _typeIcon {
    if (fee.isTransport) return Icons.directions_bus_rounded;
    if (fee.isEducation) return Icons.menu_book_rounded;
    return Icons.bookmark_rounded;
  }

  Widget _tileContent(bool isPaid, bool isOverdue, bool isSelected, Color themeColor) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: fee.isTransport
                ? _C.tealBg
                : (fee.isEducation ? _C.accentBg : _C.purpleBg),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(_typeIcon, color: themeColor, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${fee.termName} · ${fee.isTransport ? "Transport" : (fee.isEducation ? "Education" : "Term")}',
                style: _T.h2,
              ),
              const SizedBox(height: 3),
              Text(
                'Due: ${_fmtDate(fee.dueDate)}',
                style: const TextStyle(fontSize: 11, color: _C.inkMid),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              _fmt(fee.amount),
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: isPaid ? _C.teal : (isOverdue ? _C.red : _C.ink),
              ),
            ),
            const SizedBox(height: 4),
            if (isPaid)
              const _StatusPill(label: 'Paid', color: _C.teal, bg: _C.tealBg, border: _C.tealBorder)
            else if (isOverdue)
              const _StatusPill(label: 'Overdue', color: _C.red, bg: _C.redBg, border: _C.redBorder)
            else
              const _StatusPill(label: 'Pending', color: _C.amber, bg: _C.amberBg, border: _C.amberBorder),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final isPaid = fee.isPaid;
    final isOverdue = fee.isOverdue;

    return Obx(() {
      final isSelected = c.selectedIds.contains(fee.id);

      return IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Vertical Line Node
            SizedBox(
              width: 32,
              child: Column(
                children: [
                  Expanded(
                    child: Container(
                      width: 3,
                      color: isFirst
                          ? Colors.transparent
                          : (isSelected ? themeColor : _C.border),
                    ),
                  ),
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: isPaid
                          ? _C.teal
                          : (isSelected
                              ? themeColor
                              : (isOverdue ? _C.redBg : _C.white)),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isPaid
                            ? _C.teal
                            : (isSelected
                                ? themeColor
                                : (isOverdue ? _C.red : _C.borderMid)),
                        width: 2.5,
                      ),
                      boxShadow: isSelected
                          ? [BoxShadow(color: themeColor.withOpacity(0.3), blurRadius: 6, offset: const Offset(0, 2))]
                          : [],
                    ),
                    child: Center(
                      child: isPaid || isSelected
                          ? const Icon(Icons.check_rounded, color: Colors.white, size: 13)
                          : Container(
                              width: 6,
                              height: 6,
                              decoration: BoxDecoration(
                                color: isOverdue ? _C.red : _C.inkLight,
                                shape: BoxShape.circle,
                              ),
                            ),
                    ),
                  ),
                  Expanded(
                    child: Container(
                      width: 3,
                      color: isLast
                          ? Colors.transparent
                          : (isSelected ? themeColor : _C.border),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            // Card Content
            Expanded(
              child: GestureDetector(
                onTap: isPaid
                    ? null
                    : () {
                        HapticFeedback.selectionClick();
                        c.toggleFee(fee);
                      },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isSelected ? themeColor.withOpacity(0.06) : _C.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? themeColor : _C.border,
                      width: isSelected ? 1.8 : 1,
                    ),
                    boxShadow: isSelected
                        ? [BoxShadow(color: themeColor.withOpacity(0.1), blurRadius: 8, offset: const Offset(0, 3))]
                        : [const BoxShadow(color: Color(0x06000000), blurRadius: 6, offset: Offset(0, 2))],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: fee.isTransport
                              ? _C.tealBg
                              : (fee.isEducation ? _C.accentBg : _C.purpleBg),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(_typeIcon, color: themeColor, size: 18),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${fee.termName} · ${fee.isTransport ? "Transport" : (fee.isEducation ? "Education" : "Term")}',
                              style: _T.h2,
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'Due: ${_fmtDate(fee.dueDate)}',
                              style: const TextStyle(fontSize: 11, color: _C.inkMid),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            _fmt(fee.amount),
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: isPaid ? _C.teal : (isOverdue ? _C.red : _C.ink),
                            ),
                          ),
                          const SizedBox(height: 4),
                          if (isPaid)
                            const _StatusPill(label: 'Paid', color: _C.teal, bg: _C.tealBg, border: _C.tealBorder)
                          else if (isOverdue)
                            const _StatusPill(label: 'Overdue', color: _C.red, bg: _C.redBg, border: _C.redBorder)
                          else
                            const _StatusPill(label: 'Pending', color: _C.amber, bg: _C.amberBg, border: _C.amberBorder),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS PILL
// ─────────────────────────────────────────────────────────────────────────────
class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.label, required this.color, required this.bg, required this.border});
  final String label;
  final Color color, bg, border;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bg, borderRadius: BorderRadius.circular(16),
        border: Border.all(color: border),
      ),
      child: Text(label,
          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
    );
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
                      gradient: const LinearGradient(colors: [_C.navyDark, _C.navyLight]),
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
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('Pay Dues', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
                            SizedBox(width: 6),
                            Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 15),
                          ],
                        ),
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
                Text('${fees.length} fee item${fees.length == 1 ? '' : 's'} selected', style: _T.caption),
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
                  final iconData = f.isTransport ? Icons.directions_bus_rounded : (f.isTerm ? Icons.bookmark_rounded : Icons.menu_book_rounded);
                  final iconColor = isOD ? _C.red : (f.isTransport ? _C.teal : (f.isTerm ? _C.purple : _C.accent));
                  final iconBg = isOD ? _C.redBg : (f.isTransport ? _C.tealBg : (f.isTerm ? _C.purpleBg : _C.accentBg));
                  final typeLabel = f.isTransport ? 'Transport' : (f.isTerm ? f.termName : 'Education');
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 11),
                    child: Row(children: [
                      Container(width: 36, height: 36,
                        decoration: BoxDecoration(
                          color: iconBg,
                          borderRadius: BorderRadius.circular(10)),
                        child: Center(child: Icon(iconData, color: iconColor, size: 18))),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('$typeLabel · ${f.termName}', style: _T.label),
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
                Expanded(child: Text('You must pay the full amount for each fee. If you need help, please contact your school.',
                    style: TextStyle(fontSize: 11, color: _C.amber, fontWeight: FontWeight.w500, height: 1.4))),
              ]),
            ),
            const SizedBox(height: 18),
            Row(children: [
              Expanded(
                child: AnimatedTapButton(
                  onTap: () => Get.back(),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(color: _C.pageBg, borderRadius: BorderRadius.circular(13), border: Border.all(color: _C.borderMid)),
                    child: const Center(child: Text('Cancel', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: _C.inkMid)))),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(flex: 2,
                child: AnimatedTapButton(
                  onTap: () async {
                    Get.back();
                    HapticFeedback.mediumImpact();
                    await c.paySelected();
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [_C.navyDark, _C.navyLight]),
                      borderRadius: BorderRadius.circular(13),
                      boxShadow: [BoxShadow(color: _C.navy.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4))]),
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
  const _Card({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
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
          child: Column(children: [_box(160), _box(48), _box(120), _box(120), _box(120)]),
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
          const Text('All Dues Paid!', style: _T.h1),
          const SizedBox(height: 8),
          const Text('No outstanding fee dues on this account.', style: _T.body, textAlign: TextAlign.center),
          const SizedBox(height: 28),
          AnimatedTapButton(
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
