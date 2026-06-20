import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config/env.dart';
import '../config/staff_config.dart';

class ApiClient {
  // Single source of truth for the backend base URL — see Env.
  static String get baseUrl => Env.baseUrl;

  static String? _staffToken;
  static Future<String>? _staffTokenFuture;
  static DateTime? _lastStaffLoginTime;
  static bool _lastStaffLoginFailed = false;

  /// Helper to decode JWT token to extract claims
  static Map<String, dynamic> decodeJwt(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) {
        return {};
      }
      var payload = parts[1];
      // Pad base64url string length by padding with '='
      final rem = payload.length % 4;
      if (rem > 0) {
        payload += '=' * (4 - rem);
      }
      final resp = utf8.decode(base64Url.decode(payload));
      return json.decode(resp) as Map<String, dynamic>;
    } catch (e) {
      print('JWT Decode error: $e');
      return {};
    }
  }

  /// Get Parent token from SharedPreferences
  static Future<String?> getParentToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  /// Get Staff token under the hood.
  ///
  /// NOTE: this is a stopgap. Credentials now live in a gitignored asset
  /// (assets/config/staff_config.json) instead of source code, so they
  /// won't leak via git — but they're still compiled into the built
  /// APK/IPA and can be extracted by anyone who decompiles it. The durable
  /// fix is adding parent-scoped list endpoints on the backend
  /// (GET /students, /ledgers, /payments filtered + ownership-checked for
  /// the authenticated parent) so the client never needs staff-level auth.
  static Future<String> getStaffToken() async {
    if (_staffToken != null && _staffToken!.isNotEmpty) return _staffToken!;

    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString('staff_token');
    if (cached != null && cached.isNotEmpty) {
      final claims = decodeJwt(cached);
      final exp = claims['exp'] as int?;
      if (exp != null) {
        final expTime = DateTime.fromMillisecondsSinceEpoch(exp * 1000);
        // Add a 30s buffer to token expiration check to prevent 401s
        if (expTime.subtract(const Duration(seconds: 30)).isAfter(DateTime.now())) {
          _staffToken = cached;
          return cached;
        }
      }
    }

    if (_staffTokenFuture != null) {
      return _staffTokenFuture!;
    }

    // Throttling: if last attempt failed less than 30s ago, return cached (even if expired) or empty string to avoid spamming 429
    final now = DateTime.now();
    if (_lastStaffLoginFailed && _lastStaffLoginTime != null && now.difference(_lastStaffLoginTime!) < const Duration(seconds: 30)) {
      print('Staff login throttled to avoid 429 rate limit. Reusing cached token.');
      if (cached != null && cached.isNotEmpty) {
        _staffToken = cached;
        return cached;
      }
      return '';
    }

    _staffTokenFuture = _performStaffLogin();
    try {
      final token = await _staffTokenFuture!;
      _staffToken = token;
      if (token.isNotEmpty) {
        await prefs.setString('staff_token', token);
      }
      return token;
    } finally {
      _staffTokenFuture = null;
    }
  }

  static Future<String> _performStaffLogin() async {
    _lastStaffLoginTime = DateTime.now();
    try {
      final email = await StaffConfig.email;
      final password = await StaffConfig.password;

      if (email.isEmpty || password.isEmpty) {
        _lastStaffLoginFailed = true;
        print(
          'Staff credentials are not configured. Create '
          'assets/config/staff_config.json from the .example file.',
        );
        return '';
      }

      final response = await http.post(
        Uri.parse('$baseUrl/auth/portal/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final body = json.decode(response.body);
        _lastStaffLoginFailed = false;
        return body['data']['accessToken'] as String? ?? '';
      } else {
        _lastStaffLoginFailed = true;
        print('Staff login failed with status ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      _lastStaffLoginFailed = true;
      print('Error getting staff token: $e');
    }
    return '';
  }

  static void clearStaffToken() {
    _staffToken = null;
    SharedPreferences.getInstance().then((prefs) {
      prefs.remove('staff_token');
    });
  }

  /// Perform a GET request.
  /// If [useStaffToken] is true, uses the under-the-hood staff token to bypass role checks.
  static Future<http.Response> get(String path, {bool useStaffToken = false}) async {
    final token = useStaffToken ? await getStaffToken() : await getParentToken();
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }

    final response = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: headers,
    );

    if (useStaffToken && response.statusCode == 401) {
      clearStaffToken();
      final newToken = await getStaffToken();
      final retryHeaders = <String, String>{
        'Content-Type': 'application/json',
      };
      if (newToken.isNotEmpty) {
        retryHeaders['Authorization'] = 'Bearer $newToken';
      }
      return http.get(
        Uri.parse('$baseUrl$path'),
        headers: retryHeaders,
      );
    }

    return response;
  }

  /// Perform a POST request.
  static Future<http.Response> post(String path, Map<String, dynamic> body, {bool useStaffToken = false, Map<String, String>? extraHeaders}) async {
    final token = useStaffToken ? await getStaffToken() : await getParentToken();
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    if (extraHeaders != null) {
      headers.addAll(extraHeaders);
    }

    final response = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: headers,
      body: json.encode(body),
    );

    if (useStaffToken && response.statusCode == 401) {
      clearStaffToken();
      final newToken = await getStaffToken();
      final retryHeaders = <String, String>{
        'Content-Type': 'application/json',
      };
      if (newToken.isNotEmpty) {
        retryHeaders['Authorization'] = 'Bearer $newToken';
      }
      if (extraHeaders != null) {
        retryHeaders.addAll(extraHeaders);
      }
      return http.post(
        Uri.parse('$baseUrl$path'),
        headers: retryHeaders,
        body: json.encode(body),
      );
    }

    return response;
  }
}
