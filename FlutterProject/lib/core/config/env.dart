import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

/// Central environment configuration.
///
/// This is the single source of truth for the backend base URL.
/// Do not hardcode the URL anywhere else — read it from [Env.baseUrl].
class Env {
  /// Port the backend listens on (see backend/src/config/env.js -> PORT, default 3000).
  static const int _port = 3000;

  /// Base API path (see backend/src/app.js -> const V1 = '/api/v1').
  static const String _apiPath = '/api/v1';

  /// If you're testing on a physical device on the same Wi-Fi as your
  /// backend machine, set this to that machine's LAN IP (e.g. '192.168.1.50')
  /// and the app will use it automatically on Android/iOS physical devices.
  /// Leave empty to use the emulator/simulator defaults below.
  static const String _lanOverrideIp = '';
//  final host = _resolveHost();
//     return 'http://$host:$_port$_apiPath';
  static String get baseUrl {
    return 'https://sunrise-connect-backend.onrender.com$_apiPath';
  }

  static String _resolveHost() {
    if (_lanOverrideIp.isNotEmpty) return _lanOverrideIp;
    if (kIsWeb) return 'localhost';
    try {
      // Android emulator can't reach the host machine via "localhost" —
      // 10.0.2.2 is the special alias Android emulator provides for that.
      if (Platform.isAndroid) return '10.0.2.2';
      // iOS simulator (unlike Android) can reach the host machine via localhost.
      if (Platform.isIOS) return 'localhost';
    } catch (_) {
      // Platform isn't available (e.g. running in a test harness) — fall back.
    }
    return 'localhost';
  }
}
