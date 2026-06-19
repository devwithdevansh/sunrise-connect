class ReceiptModel {
  final String id;
  final String receiptNumber;
  final String studentName;
  final double amount;
  final String paymentDate;
  final String paymentMode;
  final String pdfUrl;

  const ReceiptModel({
    required this.id,
    required this.receiptNumber,
    required this.studentName,
    required this.amount,
    required this.paymentDate,
    required this.paymentMode,
    required this.pdfUrl,
  });

  factory ReceiptModel.fromJson(Map<String, dynamic> json) => ReceiptModel(
        id: (json['id'] ?? json['_id'] ?? '').toString(),
        receiptNumber: json['receiptNumber'] as String? ?? json['transactionId'] as String? ?? '',
        studentName: json['studentName'] as String? ?? '',
        amount: (json['amount'] as num).toDouble(),
        paymentDate: json['paymentDate'] as String? ?? json['createdAt'] as String? ?? '',
        paymentMode: json['paymentMode'] as String? ?? json['method'] as String? ?? 'UPI',
        pdfUrl: json['pdfUrl'] as String? ?? 'receipt.pdf',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'receiptNumber': receiptNumber,
        'studentName': studentName,
        'amount': amount,
        'paymentDate': paymentDate,
        'paymentMode': paymentMode,
        'pdfUrl': pdfUrl,
      };
}
