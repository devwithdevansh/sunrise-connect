import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/services.dart' show rootBundle;

/// Central environment configuration.
///
/// This is the single source of truth for the backend base URL.
/// It reads the backend URL from the `.env` asset file at startup.
class Env {
  /// Base API path (see backend/src/app.js -> const V1 = '/api/v1').
  static const String _apiPath = '/api/v1';

  // Cached base URL, defaults to local development URL
  static String _baseUrl = '';

  /// Single source of truth for the backend base URL.
  /// Do not hardcode the URL anywhere else — read it from [Env.baseUrl].
  static String get baseUrl {
    if (_baseUrl.isNotEmpty) {
      return _baseUrl;
    }
    // Fallback/Default local URL if .env is not loaded or is empty
    return 'https://linen-weasel-242678.hostingersite.com$_apiPath';
  }

  /// Initialize environment variables from the `.env` file.
  /// Call this in main.dart before runApp().
  static Future<void> init() async {
    try {
      final content = await rootBundle.loadString('.env');
      for (var line in content.split('\n')) {
        line = line.trim();
        if (line.isEmpty || line.startsWith('#')) continue;
        final parts = line.split('=');
        if (parts.length >= 2) {
          final key = parts[0].trim();
          final val = parts.sublist(1).join('=').trim();
          if (key == 'BACKEND_URL') {
            // Remove any trailing slashes from the configured URL
            var cleanUrl = val;
            if (cleanUrl.endsWith('/')) {
              cleanUrl = cleanUrl.substring(0, cleanUrl.length - 1);
            }
            _baseUrl = '$cleanUrl$_apiPath';
            print('Env: Loaded backend baseUrl as $_baseUrl');
          }
        }
      }
    } catch (e) {
      print('Env: Could not load .env file, using local default ($e)');
    }
  }

  /// Local development host resolution helper.
  /// Change/uncomment values here to configure local physical device testing.
  static String _resolveHost() {
    // TIP: If you're testing on a physical device on the same Wi-Fi as your
    // backend machine, uncomment and set this to that machine's LAN IP:
    // return '192.168.1.50';

    if (kIsWeb) return 'localhost';
    try {
      // Android emulator can't reach the host machine via "localhost" —
      // 10.0.2.2 is the special alias Android emulator provides for that.
      if (Platform.isAndroid) return '10.0.2.2';
      // iOS simulator (unlike Android) can reach the host machine via localhost.
      if (Platform.isIOS) return 'localhost';
    } catch (_) {
      // Platform isn't available (e.g. running in a test harness)
    }
    return 'localhost';
  }
}
