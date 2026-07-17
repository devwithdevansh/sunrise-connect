import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/constants/storage_keys.dart';
import 'package:get/get.dart';
import '../../../core/routes/app_routes.dart';

import '../config/env.dart';

class ApiClient {
  // Single source of truth for the backend base URL — see Env.
  static String get baseUrl => Env.baseUrl;

  static const _secureStorage = FlutterSecureStorage();
  static const _timeout = Duration(seconds: 15);
  static bool _isRefreshing = false;

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

  /// Get Parent token from SecureStorage
  static Future<String?> getParentToken() async {
    return await _secureStorage.read(key: StorageKeys.accessToken);
  }

  static Future<bool> _refreshToken() async {
    if (_isRefreshing) return false;
    _isRefreshing = true;
    try {
      final rToken = await _secureStorage.read(key: 'refresh_token');
      if (rToken == null || rToken.isEmpty) return false;

      final response = await http.post(
        Uri.parse('$baseUrl/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'refreshToken': rToken}),
      ).timeout(_timeout);

      if (response.statusCode == 200) {
        final body = json.decode(response.body);
        final newAccess = body['data']['accessToken'] as String?;
        final newRefresh = body['data']['refreshToken'] as String?;
        if (newAccess != null) {
          await _secureStorage.write(key: StorageKeys.accessToken, value: newAccess);
        }
        if (newRefresh != null) {
          await _secureStorage.write(key: 'refresh_token', value: newRefresh);
        }
        return true;
      } else {
        // Refresh token invalid or expired. Force logout.
        await _secureStorage.delete(key: StorageKeys.accessToken);
        await _secureStorage.delete(key: 'refresh_token');
        Get.offAllNamed(AppRoutes.login);
        return false;
      }
    } catch (e) {
      return false;
    } finally {
      _isRefreshing = false;
    }
  }

  static Future<http.Response> _handleRequest(Future<http.Response> Function() requestFunc) async {
    try {
      var response = await requestFunc();
      if (response.statusCode == 401) {
        final success = await _refreshToken();
        if (success) {
          response = await requestFunc();
        }
      }
      return response;
    } catch (e) {
      // Re-throw or return a generic 500 response so callers can handle it gracefully.
      return http.Response(json.encode({'message': 'Network error: $e'}), 500);
    }
  }

  /// Perform a GET request.
  static Future<http.Response> get(String path) async {
    return _handleRequest(() async {
      final token = await getParentToken();
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }

      return await http.get(
        Uri.parse('$baseUrl$path'),
        headers: headers,
      ).timeout(_timeout);
    });
  }

  /// Perform a POST request.
  static Future<http.Response> post(String path, Map<String, dynamic> body, {Map<String, String>? extraHeaders}) async {
    return _handleRequest(() async {
      final token = await getParentToken();
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
      if (extraHeaders != null) {
        headers.addAll(extraHeaders);
      }

      return await http.post(
        Uri.parse('$baseUrl$path'),
        headers: headers,
        body: json.encode(body),
      ).timeout(_timeout);
    });
  }

  /// Perform a DELETE request with a JSON body.
  static Future<http.Response> delete(String path, Map<String, dynamic> body) async {
    return _handleRequest(() async {
      final token = await getParentToken();
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }

      final request = http.Request('DELETE', Uri.parse('$baseUrl$path'));
      request.headers.addAll(headers);
      request.body = json.encode(body);
      final streamedResponse = await request.send().timeout(_timeout);
      return await http.Response.fromStream(streamedResponse);
    });
  }
}
