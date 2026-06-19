import 'dart:convert';
import '../../core/network/api_client.dart';
import '../models/payment_model.dart';
import '../models/receipt_model.dart';

class ReceiptRepository {
  /// Fetch all payments from the backend and filter them by the given ledger IDs
  Future<List<PaymentModel>> getPaymentsForLedgers(List<String> ledgerIds) async {
    if (ledgerIds.isEmpty) return [];
    try {
      final response = await ApiClient.get('/payments?limit=100', useStaffToken: true);
      if (response.statusCode == 200) {
        final body = json.decode(response.body);
        final list = body['data'] as List;
        final allPayments = list.map((item) => PaymentModel.fromJson(item as Map<String, dynamic>)).toList();
        // Filter payments that belong to this student's ledgers
        return allPayments.where((p) => ledgerIds.contains(p.feeId)).toList();
      }
    } catch (e) {
      print('Error in getPaymentsForLedgers: $e');
    }
    return [];
  }

  /// Map payments to receipt models
  Future<List<ReceiptModel>> getReceiptsForLedgers(List<String> ledgerIds, String studentName) async {
    final payments = await getPaymentsForLedgers(ledgerIds);
    return payments.map((p) => ReceiptModel(
      id: p.id,
      receiptNumber: p.transactionId.isNotEmpty ? p.transactionId : 'REC-${p.id.substring(p.id.length > 6 ? p.id.length - 6 : 0).toUpperCase()}',
      studentName: studentName,
      amount: p.amount,
      paymentDate: p.paymentDate,
      paymentMode: p.paymentMode,
      pdfUrl: 'receipt.pdf',
    )).toList();
  }
}
