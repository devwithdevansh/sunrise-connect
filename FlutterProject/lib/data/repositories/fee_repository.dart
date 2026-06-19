import 'dart:convert';
import '../../core/network/api_client.dart';
import '../models/fee_model.dart';

class FeeRepository {
  Future<List<FeeModel>> getFees(String studentId) async {
    try {
      final response = await ApiClient.get('/ledgers?studentId=$studentId', useStaffToken: true);
      if (response.statusCode == 200) {
        final body = json.decode(response.body);
        final list = body['data'] as List;
        return list.map((item) => FeeModel.fromJson(item as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      print('Error in getFees: $e');
    }
    return [];
  }

  Future<List<FeeModel>> getPendingFees(String studentId) async {
    final all = await getFees(studentId);
    return all.where((f) => !f.isPaid).toList();
  }

  Future<Map<String, double>> getAggregate(String studentId) async {
    final all = await getFees(studentId);
    double total = 0;
    double paid = 0;
    double pending = 0;
    for (final f in all) {
      total += f.amount;
      paid += f.paidAmount;
      pending += f.remainingAmount;
    }
    return {
      'total': total,
      'paid': paid,
      'pending': pending,
    };
  }

  /// Pay fee in full
  Future<bool> payFee(String ledgerId, double amount, String method) async {
    try {
      final response = await ApiClient.post(
        '/payments',
        {
          'ledgerId': ledgerId,
          'amount': amount,
          'method': method.toUpperCase(),
          'details': {
            'transactionId': 'TXN${DateTime.now().millisecondsSinceEpoch}',
            'bankName': 'Online Gateway'
          }
        },
        useStaffToken: true,
        extraHeaders: {
          'Idempotency-Key': 'idem-${DateTime.now().millisecondsSinceEpoch}-${ledgerId}'
        }
      );
      return response.statusCode == 201;
    } catch (e) {
      print('Error in payFee: $e');
      return false;
    }
  }
}
