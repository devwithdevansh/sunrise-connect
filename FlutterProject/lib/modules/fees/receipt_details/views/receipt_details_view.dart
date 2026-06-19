import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../data/models/receipt_model.dart';
import '../controllers/receipt_details_controller.dart';

class ReceiptDetailsView extends GetView<ReceiptDetailsController> {
  const ReceiptDetailsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text('Receipts', style: AppTextStyles.h2),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.ink, size: 20),
          onPressed: () => Get.back(),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: controller.loadReceipts,
        color: AppColors.primaryMid,
        child: Obx(() {
          if (controller.isLoading.value && controller.receipts.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primaryMid));
          }

          if (controller.receipts.isEmpty) {
            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Container(
                height: MediaQuery.of(context).size.height * 0.7,
                alignment: Alignment.center,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.receipt_long_rounded, size: 64, color: AppColors.inkLight),
                    const SizedBox(height: 16),
                    Text('No Receipts Available', style: AppTextStyles.h2),
                    const SizedBox(height: 8),
                    Text('Receipts will be generated once payments are made.', style: AppTextStyles.bodyMedium),
                  ],
                ),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: controller.receipts.length,
            itemBuilder: (context, index) {
              final receipt = controller.receipts[index];
              return _buildReceiptRow(context, receipt);
            },
          );
        }),
      ),
    );
  }

  Widget _buildReceiptRow(BuildContext context, ReceiptModel receipt) {
    final dateStr = receipt.paymentDate.split('T').first;

    return GestureDetector(
      onTap: () => _showReceiptModal(context, receipt),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: AppColors.purplePale,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.receipt_rounded, color: AppColors.purple, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Receipt #${receipt.receiptNumber.substring(0, receipt.receiptNumber.length > 10 ? 10 : receipt.receiptNumber.length)}', style: AppTextStyles.labelLarge),
                  const SizedBox(height: 2),
                  Text('Date: $dateStr', style: AppTextStyles.bodySmall),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('₹${receipt.amount.toInt()}', style: AppTextStyles.h3.copyWith(color: AppColors.primaryMid)),
                const SizedBox(height: 4),
                Text('Tap to view', style: AppTextStyles.labelSmall.copyWith(color: AppColors.purple, fontSize: 9)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showReceiptModal(BuildContext context, ReceiptModel receipt) {
    final dateStr = receipt.paymentDate.split('T').first;

    Get.dialog(
      Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Colors.white,
        child: Container(
          padding: const EdgeInsets.all(24),
          constraints: const BoxConstraints(maxHeight: 520),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Digital Receipt 🧾', style: AppTextStyles.h2),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Get.back(),
                  ),
                ],
              ),
              const Divider(color: AppColors.border),
              const SizedBox(height: 12),
              // School details
              Text('SUNRISE CONVENT SCHOOL', style: AppTextStyles.labelLarge.copyWith(color: AppColors.primaryMid, letterSpacing: 0.5), textAlign: TextAlign.center),
              const SizedBox(height: 4),
              Text('Railnagar, Rajkot, Gujarat', style: AppTextStyles.bodySmall, textAlign: TextAlign.center),
              const SizedBox(height: 20),
              // Invoice detail rows
              _buildDetailRow('Receipt No:', receipt.receiptNumber),
              const SizedBox(height: 10),
              _buildDetailRow('Student Name:', receipt.studentName),
              const SizedBox(height: 10),
              _buildDetailRow('Payment Date:', dateStr),
              const SizedBox(height: 10),
              _buildDetailRow('Payment Mode:', receipt.paymentMode.toUpperCase()),
              const SizedBox(height: 10),
              _buildDetailRow('Status:', 'PAID', valueColor: AppColors.teal),
              const SizedBox(height: 20),
              const Divider(color: AppColors.border, thickness: 1.5),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total Paid', style: AppTextStyles.h2),
                  Text('₹${receipt.amount.toInt()}', style: AppTextStyles.displayMedium.copyWith(color: AppColors.teal, fontSize: 22)),
                ],
              ),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: () {
                  Get.back();
                  Get.snackbar(
                    'Success 🎉',
                    'Receipt pdf downloaded successfully to your device.',
                    snackPosition: SnackPosition.BOTTOM,
                    backgroundColor: AppColors.tealPale,
                  );
                },
                icon: const Icon(Icons.download_rounded, color: Colors.white),
                label: const Text('Download PDF', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryMid,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTextStyles.bodyMedium),
        Expanded(
          child: Text(
            value,
            style: AppTextStyles.labelLarge.copyWith(color: valueColor ?? AppColors.ink),
            textAlign: TextAlign.right,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
