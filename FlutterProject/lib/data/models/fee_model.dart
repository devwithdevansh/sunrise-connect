import '../../core/constants/fee_status.dart';

class FeeModel {
  final String id;
  final String studentId;
  final String termName;
  final double amount;
  final double paidAmount;
  final double remainingAmount;
  final String dueDate;
  final String status;
  final String academicYear;

  const FeeModel({
    required this.id,
    required this.studentId,
    required this.termName,
    required this.amount,
    required this.paidAmount,
    required this.remainingAmount,
    required this.dueDate,
    required this.status,
    required this.academicYear,
  });

  factory FeeModel.fromJson(Map<String, dynamic> json) => FeeModel(
        id: (json['id'] ?? json['_id'] ?? '').toString(),
        studentId: (json['studentId'] ?? '').toString(),
        termName: (json['termName'] ?? json['feePeriod'] ?? '').toString(),
        amount: (json['amount'] ?? json['totalAmount'] ?? 0.0 as num).toDouble(),
        paidAmount: (json['paidAmount'] ?? 0.0 as num).toDouble(),
        remainingAmount: (json['remainingAmount'] ?? 0.0 as num).toDouble(),
        dueDate: json['dueDate'] as String? ?? '',
        status: json['status'] as String? ?? 'PENDING',
        academicYear: json['academicYear'] as String? ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'studentId': studentId,
        'termName': termName,
        'amount': amount,
        'paidAmount': paidAmount,
        'remainingAmount': remainingAmount,
        'dueDate': dueDate,
        'status': status,
        'academicYear': academicYear,
      };

  bool get isPaid      => status == FeeStatus.paid;
  bool get isPending   => status == FeeStatus.pending;
  bool get isPartial   => status == FeeStatus.partial;
  bool get isOverdue   => status == FeeStatus.overdue;

  double get progressRatio => amount > 0 ? paidAmount / amount : 0;
}

