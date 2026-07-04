import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/constants/storage_keys.dart';

import '../config/env.dart';

class ApiClient {
  // Single source of truth for the backend base URL — see Env.
  static String get baseUrl => Env.baseUrl;

  static const _secureStorage = FlutterSecureStorage();

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

  /// Perform a GET request.
  static Future<http.Response> get(String path) async {
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
    );
  }

  /// Perform a POST request.
  static Future<http.Response> post(String path, Map<String, dynamic> body, {Map<String, String>? extraHeaders}) async {
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
    );
  }
}
