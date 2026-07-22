// lib/core/services/fcm_service.dart
// Handles all Firebase Cloud Messaging lifecycle events.
// Initializes Firebase, requests permission, registers the FCM token with the
// backend, and handles foreground / background / terminated push notifications.

import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/storage_keys.dart';
import '../network/api_client.dart';
import '../../modules/dashboard/controllers/dashboard_controller.dart';
import 'firebase_options.dart';

/// Top-level handler — required by FCM for background/terminated messages.
/// Must be a top-level function (not inside a class).
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  
  // We DO NOT show a local notification here if the message already has a notification payload.
  // FCM automatically displays system tray notifications for background apps.
  // Showing a manual local notification here creates a duplicate that has no tap handler,
  // causing the app to just resume without switching students when tapped!
  if (message.notification == null) {
    // Only show local notification if it's a data-only background message
    final localNotifications = FlutterLocalNotificationsPlugin();
    const initSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
    );
    await localNotifications.initialize(initSettings);
    await FcmService._showLocalNotification(message);
  }
}

class FcmService {
  static final _messaging = FirebaseMessaging.instance;
  static final _localNotifications = FlutterLocalNotificationsPlugin();
  static String? initialRoute; // Stores route if app launched from terminated state via push notification
  static String? initialStudentId; // Stores studentId to auto-select

  // Android notification channel
  static const _androidChannel = AndroidNotificationChannel(
    'sunrise_connect_channel_v2', // Incremented ID to force Android to register the custom sound
    'Sunrise Connect Updates',
    description: 'School fee alerts and updates from Sunrise Connect',
    importance: Importance.high,
    playSound: true,
    sound: RawResourceAndroidNotificationSound('bell_notification'),
  );

  /// Call once from main.dart before runApp().
  static Future<void> init() async {
    // 1. Initialize Firebase
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    // 2. Register background message handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // 3. (Removed automatic permission request)

    // 4. Create Android notification channel
    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_androidChannel);

    // 5. Initialize flutter_local_notifications
    const initSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
    );
    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // 6. Handle foreground messages — show in-app local notification
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _showLocalNotification(message);
    });

    // 7. Handle notification tap when app was in background (not terminated)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _handleNotificationTap(message);
    });

    // 8. Handle notification tap when app was terminated
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      initialRoute = '/notifications'; // Save for splash screen to handle
      if (initialMessage.data.containsKey('studentId')) {
        initialStudentId = initialMessage.data['studentId'].toString();
      }
    }

    // 9. Register token with backend & listen for refreshes
    await registerToken();
    _messaging.onTokenRefresh.listen((newToken) async {
      await _sendTokenToBackend(newToken);
    });
  }

  /// Request permissions manually (usually after showing a custom dialogue)
  static Future<void> requestPermissions() async {
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    await registerToken();
  }

  /// Get current FCM token and register it with the backend.
  static Future<void> registerToken() async {
    try {
      final token = await _messaging.getToken();
      if (token != null) {
        await _sendTokenToBackend(token);
      }
    } catch (e) {
      // Token registration is non-critical — don't crash the app
      print('FCM token registration error: $e');
    }
  }

  /// POST the FCM token to the backend /notifications/fcm-token endpoint.
  static Future<void> _sendTokenToBackend(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final isLoggedIn = prefs.getBool(StorageKeys.isLoggedIn) ?? false;
      if (!isLoggedIn) return; // Don't register if not logged in

      await ApiClient.post(
        '/notifications/fcm-token',
        {'token': token, 'platform': 'android'},
      );
      print('FCM token registered with backend');
    } catch (e) {
      print('Failed to register FCM token with backend: $e');
    }
  }

  /// Remove the FCM token from the backend on logout.
  static Future<void> removeToken() async {
    try {
      final token = await _messaging.getToken();
      if (token != null) {
        await ApiClient.delete('/notifications/fcm-token', {'token': token});
      }
    } catch (e) {
      print('FCM token removal error: $e');
    }
  }

  /// Show a local notification (for foreground + background messages).
  static Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _androidChannel.id,
          _androidChannel.name,
          channelDescription: _androidChannel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
          sound: const RawResourceAndroidNotificationSound('bell_notification'),
        ),
      ),
      payload: json.encode(message.data),
    );

    // Refresh notifications real-time on dashboard if it's currently loaded
    if (Get.isRegistered<DashboardController>()) {
      Get.find<DashboardController>().refreshNotifications();
    }
  }

  /// Navigate to the Notifications screen when a notification is tapped.
  static void _handleNotificationTap(RemoteMessage message) {
    _navigateToNotifications(message.data);
  }

  /// Local notification tap handler.
  static void _onNotificationTap(NotificationResponse response) {
    if (response.payload != null) {
      try {
        final Map<String, dynamic> data = json.decode(response.payload!);
        _navigateToNotifications(data);
      } catch (e) {
        Get.toNamed('/notifications');
      }
    } else {
      Get.toNamed('/notifications');
    }
  }

  static Future<void> _navigateToNotifications(Map<String, dynamic> data) async {
    // VISUAL DEBUGGING: Show a snackbar so the user knows the tap handler fired and what data it got
    String debugMsg = data.containsKey('studentId') ? 'Found studentId: ${data['studentId']}' : 'No studentId in payload';
    Get.snackbar('Push Tapped', debugMsg, duration: const Duration(seconds: 4));

    if (data.containsKey('studentId')) {
      FcmService.initialStudentId = data['studentId'].toString();
    }

    if (Get.isRegistered<DashboardController>()) {
      final controller = Get.find<DashboardController>();
      bool switched = false;
      
      if (data.containsKey('studentId')) {
        final String sId = data['studentId'].toString();
        final s = controller.students.firstWhereOrNull((student) => student.id == sId);
        if (s != null && s.id != controller.student.value?.id) {
          await controller.switchStudent(s);
          switched = true;
        } else if (s == null) {
          Get.snackbar('Error', 'Student not found in loaded list!');
        }
      }
      
      if (!switched) {
        // Force refresh to pull the newly arrived notification from the server
        await controller.refreshNotifications();
      }
    }
    
    // Pop back to dashboard smoothly so the switch is visible without destroying controllers
    Get.until((route) => route.settings.name == '/dashboard' || route.isFirst);
    Future.delayed(const Duration(milliseconds: 300), () {
      Get.toNamed('/notifications');
    });
  }
}
