// lib/data/models/notification_model.dart
// Represents a single notification from the backend inbox API.

class NotificationModel {
  final String id;
  final String title;
  final String body;
  final String type; // 'BROADCAST' | 'PAYMENT_RECEIVED' | 'FEE_REMINDER' | 'SYSTEM'
  final String createdAt;
  final String? studentId; // Extracted from metadata for student-specific rendering
  bool isRead;

  NotificationModel({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.createdAt,
    this.studentId,
    required this.isRead,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    String? sId;
    if (json['metadata'] != null && json['metadata'] is Map) {
      sId = (json['metadata'] as Map)['studentId']?.toString();
    }
    
    return NotificationModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? json['message'] as String? ?? '',
      type: json['type'] as String? ?? 'BROADCAST',
      createdAt: json['createdAt'] as String? ?? '',
      studentId: sId,
      isRead: json['isRead'] as bool? ?? false,
    );
  }
}
