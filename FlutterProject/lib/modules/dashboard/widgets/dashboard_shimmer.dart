import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/shimmer_loader.dart';

/// Full-screen skeleton shown while the dashboard loads for the first time.
/// Mirrors the real layout so the transition feels seamless.
class DashboardShimmer extends StatelessWidget {
  const DashboardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header shimmer
          Container(
            decoration: const BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(32),
                bottomRight: Radius.circular(32),
              ),
            ),
            padding: const EdgeInsets.fromLTRB(20, 60, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    ShimmerLoader(width: 150, height: 28, borderRadius: 6),
                    ShimmerLoader(width: 42, height: 42, borderRadius: 21),
                  ],
                ),
                const SizedBox(height: 8),
                const ShimmerLoader(width: 200, height: 16, borderRadius: 4),
                const SizedBox(height: 32),
                Row(
                  children: const [
                    ShimmerLoader(width: 110, height: 38, borderRadius: 20),
                    SizedBox(width: 10),
                    ShimmerLoader(width: 110, height: 38, borderRadius: 20),
                  ],
                ),
                const SizedBox(height: 20),
                const ShimmerLoader(
                  width: double.infinity,
                  height: 120,
                  borderRadius: 24,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Detail chips shimmer
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: const [
                Expanded(child: ShimmerLoader(width: double.infinity, height: 34, borderRadius: 12)),
                SizedBox(width: 8),
                Expanded(child: ShimmerLoader(width: double.infinity, height: 34, borderRadius: 12)),
                SizedBox(width: 8),
                Expanded(child: ShimmerLoader(width: double.infinity, height: 34, borderRadius: 12)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Quick actions shimmer
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const ShimmerLoader(width: 140, height: 24, borderRadius: 6),
                const SizedBox(height: 14),
                Row(
                  children: const [
                    Expanded(
                      child: ShimmerLoader(
                        width: double.infinity,
                        height: 76,
                        borderRadius: 20,
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: ShimmerLoader(
                        width: double.infinity,
                        height: 76,
                        borderRadius: 20,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: const [
                    Expanded(
                      child: ShimmerLoader(
                        width: double.infinity,
                        height: 76,
                        borderRadius: 20,
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: ShimmerLoader(
                        width: double.infinity,
                        height: 76,
                        borderRadius: 20,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Dues shimmer
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                ShimmerLoader(width: 140, height: 24, borderRadius: 6),
                SizedBox(height: 12),
                ShimmerCard(),
                ShimmerCard(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
