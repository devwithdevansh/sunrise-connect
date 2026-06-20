class StudentModel {
  final String id;
  final String name;
  final String phone;
  final String standard;
  final String division;
  final String medium;
  final String photoUrl;
  final String studentCode;
  final String transportType;

  const StudentModel({
    required this.id,
    required this.name,
    required this.phone,
    required this.standard,
    required this.division,
    required this.medium,
    required this.photoUrl,
    required this.studentCode,
    required this.transportType,
  });

  factory StudentModel.fromJson(Map<String, dynamic> json) => StudentModel(
        id: (json['id'] ?? json['_id'] ?? '').toString(),
        name: json['name'] as String? ?? json['studentName'] as String? ?? '',
        phone: (json['phone'] ?? json['primaryMobileNumber'] ?? '').toString(),
        standard: (json['standard'] ?? '').toString(),
        division: json['division'] as String? ?? '',
        medium: json['medium'] as String? ?? 'English',
        photoUrl: json['photoUrl'] as String? ?? 'assets/images/student.png',
        studentCode: json['studentCode'] as String? ?? '',
        transportType: json['transportType'] as String? ?? 'None',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'standard': standard,
        'division': division,
        'medium': medium,
        'photoUrl': photoUrl,
        'studentCode': studentCode,
        'transportType': transportType,
      };

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  String get classLabel => 'Std $standard · $division · $medium Medium';
}
