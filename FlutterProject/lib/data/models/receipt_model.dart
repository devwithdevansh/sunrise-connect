class ReceiptModel {
  final String id;
  final String receiptNumber;
  final String studentName;
  final double amount;
  final String paymentDate;
  final String paymentMode;
  final String pdfUrl;
  final String termName;   // e.g. "June", "Term 1"
  final String feeType;    // e.g. "TRANSPORT", "TERM", "EDUCATION"
  final double concessionAmount;
  final double totalAmount;

  const ReceiptModel({
    required this.id,
    required this.receiptNumber,
    required this.studentName,
    required this.amount,
    required this.paymentDate,
    required this.paymentMode,
    required this.pdfUrl,
    this.termName = '',
    this.feeType = 'EDUCATION',
    this.concessionAmount = 0.0,
    this.totalAmount = 0.0,
  });

  factory ReceiptModel.fromJson(Map<String, dynamic> json) => ReceiptModel(
        id: (json['id'] ?? json['_id'] ?? '').toString(),
        receiptNumber: json['receiptNumber'] as String? ??
            json['transactionId'] as String? ?? '',
        studentName: json['studentName'] as String? ?? '',
        amount: ((json['amount'] ?? 0) as num).toDouble(),
        paymentDate: json['paymentDate'] as String? ??
            json['createdAt'] as String? ?? '',
        paymentMode: json['paymentMode'] as String? ??
            json['method'] as String? ?? 'UPI',
        pdfUrl: json['pdfUrl'] as String? ?? 'receipt.pdf',
        termName: json['termName'] as String? ?? '',
        feeType: json['feeType'] as String? ?? 'EDUCATION',
        concessionAmount: ((json['concessionAmount'] ?? 0) as num).toDouble(),
        totalAmount: ((json['totalAmount'] ?? 0) as num).toDouble(),
      );

  /// Whether this is a TRANSPORT receipt
  bool get isTransport => feeType == 'TRANSPORT';

  /// Human-readable category label
  String get categoryLabel {
    switch (feeType) {
      case 'TRANSPORT': return 'Transport';
      case 'TERM':
      case 'EDUCATION': return 'Education';
      case 'ADMISSION': return 'Admission';
      case 'BAG_KIT': return 'Bag / Kit';
      default: return 'General';
    }
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'receiptNumber': receiptNumber,
        'studentName': studentName,
        'amount': amount,
        'paymentDate': paymentDate,
        'paymentMode': paymentMode,
        'pdfUrl': pdfUrl,
        'termName': termName,
        'feeType': feeType,
        'concessionAmount': concessionAmount,
        'totalAmount': totalAmount,
      };
}
