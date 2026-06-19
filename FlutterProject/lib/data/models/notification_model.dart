class NotificationModel {
  final String id;
  final String title;
  final String message;
  final String type;
  final String createdAt;
  bool isRead;

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.createdAt,
    required this.isRead,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) => NotificationModel(
        id: (json['id'] ?? json['_id'] ?? '').toString(),
        title: json['title'] as String? ?? '',
        message: json['message'] as String? ?? '',
        type: json['type'] as String? ?? 'INFO',
        createdAt: json['createdAt'] as String? ?? '',
        isRead: json['isRead'] as bool? ?? false,
      );
}
