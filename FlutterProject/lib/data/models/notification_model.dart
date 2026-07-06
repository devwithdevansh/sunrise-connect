// lib/data/models/notification_model.dart
// Represents a single notification from the backend inbox API.

class NotificationModel {
  final String id;
  final String title;
  final String body;
  final String type; // 'BROADCAST' | 'PAYMENT_RECEIVED' | 'FEE_REMINDER' | 'SYSTEM'
  final String createdAt;
  bool isRead;

  NotificationModel({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.createdAt,
    required this.isRead,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) => NotificationModel(
        id: (json['id'] ?? json['_id'] ?? '').toString(),
        title: json['title'] as String? ?? '',
        body: json['body'] as String? ?? json['message'] as String? ?? '',
        type: json['type'] as String? ?? 'BROADCAST',
        createdAt: json['createdAt'] as String? ?? '',
        isRead: json['isRead'] as bool? ?? false,
      );
}
