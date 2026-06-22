import 'package:flutter/material.dart';

class AppColors {
  // Primary palette
  static const Color primary        = Color(0xFF1A3A5C);
  static const Color primaryMid     = Color(0xFF2557A7);
  static const Color primaryLight   = Color(0xFFE8F0FB);
  static const Color navyDark       = Color(0xFF152D63);

  // Accent
  static const Color sun            = Color(0xFFF5A623);
  static const Color sunDeep        = Color(0xFFE8891A);
  static const Color sunPale        = Color(0xFFFEF3DC);
  static const Color dawn           = Color(0xFFFF6B35);

  // Semantic
  static const Color teal           = Color(0xFF14B8A6);
  static const Color tealPale       = Color(0xFFCCFBF1);
  static const Color red            = Color(0xFFEF4444);
  static const Color redPale        = Color(0xFFFEE2E2);
  static const Color amber          = Color(0xFFF59E0B);
  static const Color amberPale      = Color(0xFFFEF3C7);
  static const Color purple         = Color(0xFF8B5CF6);
  static const Color purplePale     = Color(0xFFEDE9FE);

  // Ink
  static const Color ink            = Color(0xFF0F1D2E);
  static const Color inkMid         = Color(0xFF3B526B);
  static const Color inkLight       = Color(0xFF7A93AC);

  // Surface
  static const Color border         = Color(0xFFD8E4F0);
  static const Color bg             = Color(0xFFF0F5FB);
  static const Color white          = Color(0xFFFFFFFF);
  static const Color cardBg         = Color(0xFFFFFFFF);

  // Gradient stops
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primaryMid],
  );

  static const LinearGradient sunGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [sun, sunDeep],
  );

  static const LinearGradient tealGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [teal, Color(0xFF0D9488)],
  );
}
