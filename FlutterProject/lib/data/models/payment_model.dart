class PaymentModel {
  final String id;
  final String feeId;
  final double amount;
  final String paymentDate;
  final String paymentMode;
  final String transactionId;

  const PaymentModel({
    required this.id,
    required this.feeId,
    required this.amount,
    required this.paymentDate,
    required this.paymentMode,
    required this.transactionId,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> json) => PaymentModel(
        id: (json['id'] ?? json['_id'] ?? '').toString(),
        feeId: (json['feeId'] ?? json['ledgerId'] ?? '').toString(),
        amount: (json['amount'] as num).toDouble(),
        paymentDate: json['paymentDate'] as String? ?? json['createdAt'] as String? ?? '',
        paymentMode: json['paymentMode'] as String? ?? json['method'] as String? ?? 'UPI',
        transactionId: json['transactionId'] as String? ?? (json['details'] != null && json['details']['transactionId'] != null ? json['details']['transactionId'].toString() : ''),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'feeId': feeId,
        'amount': amount,
        'paymentDate': paymentDate,
        'paymentMode': paymentMode,
        'transactionId': transactionId,
      };
}
