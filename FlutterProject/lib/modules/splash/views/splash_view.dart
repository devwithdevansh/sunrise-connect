import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:get/get.dart' hide GetNumUtils;
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../controllers/splash_controller.dart';

class SplashView extends GetView<SplashController> {
  const SplashView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
        child: Stack(
          children: [
            // ------- Decorative background orbs -------
            Positioned(
              top: -90,
              right: -70,
              child: _DecorOrb(size: 240, opacity: .08)
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .scale(
                    begin: const Offset(1, 1),
                    end: const Offset(1.15, 1.15),
                    duration: 4.seconds,
                    curve: Curves.easeInOut,
                  ),
            ),
            Positioned(
              bottom: -110,
              left: -80,
              child: _DecorOrb(size: 280, opacity: .06)
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .scale(
                    begin: const Offset(1.1, 1.1),
                    end: const Offset(1, 1),
                    duration: 5.seconds,
                    curve: Curves.easeInOut,
                  ),
            ),
            Positioned(
              top: 140,
              left: -40,
              child: _DecorOrb(size: 120, opacity: .05)
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .moveY(begin: 0, end: 24, duration: 3.5.seconds, curve: Curves.easeInOut),
            ),

            // ------- Main content -------
            SafeArea(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Logo with soft pulsing halo
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        // Pulsing halo ring
                        Container(
                          width: 128,
                          height: 128,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: AppColors.white.withOpacity(.18),
                              width: 1.5,
                            ),
                          ),
                        )
                            .animate(onPlay: (c) => c.repeat())
                            .scale(
                              begin: const Offset(.85, .85),
                              end: const Offset(1.15, 1.15),
                              duration: 2.seconds,
                              curve: Curves.easeOut,
                            )
                            .fadeOut(duration: 2.seconds, curve: Curves.easeOut),

                        // Soft glow behind logo
                        Container(
                          width: 110,
                          height: 110,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.sun.withOpacity(.25),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.sun.withOpacity(.35),
                                blurRadius: 48,
                                spreadRadius: 8,
                              ),
                            ],
                          ),
                        )
                            .animate(onPlay: (c) => c.repeat(reverse: true))
                            .scale(
                              begin: const Offset(.95, .95),
                              end: const Offset(1.08, 1.08),
                              duration: 2.5.seconds,
                              curve: Curves.easeInOut,
                            ),

                        // Sun logo mark
                        Container(
                          width: 92,
                          height: 92,
                          decoration: BoxDecoration(
                            color: AppColors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primaryMid.withOpacity(.4),
                                blurRadius: 36,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          padding: const EdgeInsets.all(18),
                          child: Image.asset(
                            'assets/images/sunrise-logo.png',
                            fit: BoxFit.contain,
                          ),
                        )
                            .animate()
                            .scale(duration: 700.ms, curve: Curves.elasticOut)
                            .fadeIn(duration: 400.ms),
                      ],
                    ),

                    const SizedBox(height: 32),

                    // Brand name with shimmer sweep
                    Text(
                      'Sunrise Connect',
                      style: AppTextStyles.displayMedium.copyWith(
                        color: Colors.white,
                        letterSpacing: .5,
                      ),
                    )
                        .animate(delay: 300.ms)
                        .fadeIn(duration: 500.ms)
                        .slideY(begin: .25, end: 0, curve: Curves.easeOutCubic)
                        .then(delay: 400.ms)
                        .shimmer(
                          duration: 1800.ms,
                          color: AppColors.sun.withOpacity(.6),
                        ),

                    const SizedBox(height: 12),

                    // Tagline with divider accents
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _TaglineDivider(),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            'SCHOOL · FEES · PARENTS',
                            style: AppTextStyles.labelSmall.copyWith(
                              color: Colors.white.withOpacity(.6),
                              letterSpacing: 3,
                            ),
                          ),
                        ),
                        _TaglineDivider(),
                      ],
                    )
                        .animate(delay: 550.ms)
                        .fadeIn(duration: 500.ms)
                        .slideY(begin: .3, end: 0, curve: Curves.easeOutCubic),
                  ],
                ),
              ),
            ),

            // ------- Bottom loader + footer -------
            Positioned(
              left: 0,
              right: 0,
              bottom: 48,
              child: Column(
                children: [
                  const _PulsingDotsLoader()
                      .animate(delay: 800.ms)
                      .fadeIn(duration: 400.ms),
                  const SizedBox(height: 20),
                  Text(
                    'Powered by Sunrise Public School',
                    style: AppTextStyles.labelSmall.copyWith(
                      color: Colors.white.withOpacity(.35),
                      letterSpacing: 1,
                    ),
                  ).animate(delay: 1000.ms).fadeIn(duration: 500.ms),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Soft translucent circle used as a background decoration.
class _DecorOrb extends StatelessWidget {
  final double size;
  final double opacity;

  const _DecorOrb({required this.size, required this.opacity});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.white.withOpacity(opacity),
      ),
    );
  }
}

/// Small horizontal accent line beside the tagline.
class _TaglineDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 24,
      height: 1,
      color: Colors.white.withOpacity(.3),
    );
  }
}

/// Three dots pulsing in sequence — a more branded feel than a spinner.
class _PulsingDotsLoader extends StatelessWidget {
  const _PulsingDotsLoader();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(3, (i) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 5),
          child: Container(
            width: 9,
            height: 9,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.sun.withOpacity(.85),
            ),
          )
              .animate(onPlay: (c) => c.repeat())
              .scale(
                delay: (i * 200).ms,
                begin: const Offset(.6, .6),
                end: const Offset(1, 1),
                duration: 600.ms,
                curve: Curves.easeOut,
              )
              .then()
              .scale(
                begin: const Offset(1, 1),
                end: const Offset(.6, .6),
                duration: 600.ms,
                curve: Curves.easeIn,
              ),
        );
      }),
    );
  }
}
