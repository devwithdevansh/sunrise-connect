import 'dart:convert';
import '../../core/network/api_client.dart';
import '../models/student_model.dart';

class StudentRepository {
  Future<List<StudentModel>> getStudentsForParent(String parentId) async {
    try {
      final response = await ApiClient.get('/students?parentId=$parentId', useStaffToken: true);
      if (response.statusCode == 200) {
        final body = json.decode(response.body);
        final list = body['data'] as List;
        return list.map((item) => StudentModel.fromJson(item as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      print('Error in getStudentsForParent: $e');
    }
    return [];
  }
}
