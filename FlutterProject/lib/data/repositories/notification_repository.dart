import '../models/notification_model.dart';
import '../models/fee_model.dart';

class NotificationRepository {
  Future<List<NotificationModel>> getNotifications(List<FeeModel> fees) async {
    final List<NotificationModel> list = [];
    final now = DateTime.now();

    for (final f in fees) {
      if (f.isPaid) {
        list.add(NotificationModel(
          id: 'paid-${f.id}',
          title: 'Payment Received ✅',
          message: 'Payment of ₹${f.amount.toInt()} for ${f.termName} was received successfully.',
          type: 'SUCCESS',
          createdAt: f.dueDate,
          isRead: true,
        ));
      }
    }
    // Sort newest first by due/payment date
    list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return list;
  }
}
