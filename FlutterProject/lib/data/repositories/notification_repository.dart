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
      } else {
        final dueDate = DateTime.tryParse(f.dueDate) ?? now;
        final isOverdue = dueDate.isBefore(now);
        list.add(NotificationModel(
          id: 'pending-${f.id}',
          title: isOverdue ? 'Fee Overdue Alert ⚠️' : 'Fee Due Reminder 🔔',
          message: 'Your fee of ₹${f.remainingAmount.toInt()} for ${f.termName} is due on ${f.dueDate}. Please pay in full.',
          type: isOverdue ? 'ALERT' : 'REMINDER',
          createdAt: f.dueDate,
          isRead: false,
        ));
      }
    }
    // Sort unread first
    list.sort((a, b) => (a.isRead ? 1 : 0).compareTo(b.isRead ? 1 : 0));
    return list;
  }
}
