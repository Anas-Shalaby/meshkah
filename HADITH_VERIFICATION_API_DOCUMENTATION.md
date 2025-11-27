# 📚 دليل API التحقق من صحة الأحاديث - مشكاة

## نظرة عامة

هذا API مصمم خصيصاً لتحليل وتقييم الأحاديث النبوية من خلال مصادر موثوقة ومعتمدة. يقدم النظام تقييماً دقيقاً لدرجة الحديث (صحيح، حسن، ضعيف، موضوع) مع معلومات تفصيلية عن المصادر والرواة.

---

## 🚀 الميزات الأساسية

### 1. البحث في الأحاديث

- البحث في قاعدة بيانات `dorar.net` الموثوقة
- البحث في قاعدة بيانات `sunnah.com` المعتمدة
- استخراج تفاصيل دقيقة لكل حديث

### 2. تحليل درجات الأحاديث

- **صحيح**: الحديث الموثوق بالكامل
- **حسن**: الحديث الجيد مع بعض التحفظات
- **ضعيف**: الحديث الذي لا يُستدل به
- **موضوع**: الحديث المكذوب
- **واهي**: الحديث الضعيف جداً
- **قوي**: الحديث القوي السند

### 3. معلومات تفصيلية

- اسم الراوي
- اسم المحدث
- المصدر (الكتاب)
- رقم الحديث
- درجة الحديث
- خلاصة حكم المحدث
- التخريج

---

## 🔗 Endpoints المتاحة

### 1. البحث في الأحاديث

```http
GET /api/hadith-verification/search?text={نص_الحديث}&source={المصدر}
```

**المعاملات:**

- `text` (مطلوب): نص الحديث المراد البحث عنه
- `source` (اختياري): المصدر المطلوب البحث فيه (`dorar` أو `sunnah`)

**مثال:**

```http
GET /api/hadith-verification/search?text=إنما الأعمال بالنيات&source=dorar
```

**الاستجابة:**

```json
{
  "success": true,
  "data": {
    "dorar": {
      "success": true,
      "data": [
        {
          "hadith": "إنما الأعمال بالنيات وإنما لكل امرئ ما نوى",
          "rawi": "عمر بن الخطاب",
          "muhaddith": "البخاري",
          "book": "صحيح البخاري",
          "number": "1",
          "grade": "صحيح",
          "explainGrade": "إسناده صحيح",
          "takhrij": "أخرجه البخاري",
          "muhaddithId": "123",
          "bookId": "456",
          "sharhId": null,
          "gradeConfidence": "high",
          "source": "dorar"
        }
      ]
    },
    "sunnah": {
      "success": false,
      "data": []
    }
  },
  "metadata": {
    "totalResults": 1,
    "searchTime": "1.2s",
    "sources": ["dorar"]
  }
}
```

### 2. التحقق الشامل من الحديث

```http
POST /api/hadith-verification/verify
```

**Body (JSON):**

```json
{
  "text": "نص الحديث المراد التحقق منه"
}
```

**مثال:**

```json
{
  "text": "إنما الأعمال بالنيات وإنما لكل امرئ ما نوى"
}
```

**الاستجابة:**

```json
{
  "success": true,
  "data": {
    "verificationSummary": {
      "primaryGrade": "صحيح",
      "gradeConfidence": "high",
      "totalMatches": 3,
      "foundInDorar": true,
      "foundInSunnah": false,
      "gradesFound": ["صحيح"],
      "gradeAnalysis": {
        "status": "صحيح",
        "message": "هذا حديث صحيح ومعتمد",
        "explanation": "الحديث صحيح السند والمتن، يمكن الاستدلال به في الأحكام الشرعية",
        "color": "green",
        "icon": "✓"
      }
    },
    "searchResults": {
      "dorar": {
        "success": true,
        "data": [
          {
            "hadith": "إنما الأعمال بالنيات وإنما لكل امرئ ما نوى",
            "rawi": "عمر بن الخطاب",
            "muhaddith": "البخاري",
            "book": "صحيح البخاري",
            "number": "1",
            "grade": "صحيح",
            "explainGrade": "إسناده صحيح",
            "takhrij": "أخرجه البخاري",
            "muhaddithId": "123",
            "bookId": "456",
            "sharhId": null,
            "gradeConfidence": "high",
            "source": "dorar"
          }
        ]
      },
      "sunnah": {
        "success": false,
        "data": []
      }
    }
  }
}
```

---

## 🛠️ كيفية التكامل مع Flutter

### 1. إعداد HTTP Client

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class HadithVerificationService {
  static const String baseUrl = 'https://your-api-domain.com/api/hadith-verification';

  static Future<Map<String, dynamic>> searchHadith(String text, {String? source}) async {
    try {
      final uri = Uri.parse('$baseUrl/search')
          .replace(queryParameters: {
            'text': text,
            if (source != null) 'source': source,
          });

      final response = await http.get(uri);

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('فشل في البحث: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('خطأ في الشبكة: $e');
    }
  }

  static Future<Map<String, dynamic>> verifyHadith(String text) async {
    try {
      final uri = Uri.parse('$baseUrl/verify');

      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'text': text}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('فشل في التحقق: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('خطأ في الشبكة: $e');
    }
  }
}
```

### 2. إنشاء Models

```dart
class HadithResult {
  final String hadith;
  final String rawi;
  final String muhaddith;
  final String book;
  final String number;
  final String grade;
  final String explainGrade;
  final String takhrij;
  final String? muhaddithId;
  final String? bookId;
  final String? sharhId;
  final String gradeConfidence;
  final String source;

  HadithResult({
    required this.hadith,
    required this.rawi,
    required this.muhaddith,
    required this.book,
    required this.number,
    required this.grade,
    required this.explainGrade,
    required this.takhrij,
    this.muhaddithId,
    this.bookId,
    this.sharhId,
    required this.gradeConfidence,
    required this.source,
  });

  factory HadithResult.fromJson(Map<String, dynamic> json) {
    return HadithResult(
      hadith: json['hadith'] ?? '',
      rawi: json['rawi'] ?? '',
      muhaddith: json['muhaddith'] ?? '',
      book: json['book'] ?? '',
      number: json['number'] ?? '',
      grade: json['grade'] ?? '',
      explainGrade: json['explainGrade'] ?? '',
      takhrij: json['takhrij'] ?? '',
      muhaddithId: json['muhaddithId'],
      bookId: json['bookId'],
      sharhId: json['sharhId'],
      gradeConfidence: json['gradeConfidence'] ?? 'low',
      source: json['source'] ?? '',
    );
  }
}

class VerificationSummary {
  final String primaryGrade;
  final String gradeConfidence;
  final int totalMatches;
  final bool foundInDorar;
  final bool foundInSunnah;
  final List<String> gradesFound;
  final GradeAnalysis gradeAnalysis;

  VerificationSummary({
    required this.primaryGrade,
    required this.gradeConfidence,
    required this.totalMatches,
    required this.foundInDorar,
    required this.foundInSunnah,
    required this.gradesFound,
    required this.gradeAnalysis,
  });

  factory VerificationSummary.fromJson(Map<String, dynamic> json) {
    return VerificationSummary(
      primaryGrade: json['primaryGrade'] ?? '',
      gradeConfidence: json['gradeConfidence'] ?? 'low',
      totalMatches: json['totalMatches'] ?? 0,
      foundInDorar: json['foundInDorar'] ?? false,
      foundInSunnah: json['foundInSunnah'] ?? false,
      gradesFound: List<String>.from(json['gradesFound'] ?? []),
      gradeAnalysis: GradeAnalysis.fromJson(json['gradeAnalysis'] ?? {}),
    );
  }
}

class GradeAnalysis {
  final String status;
  final String message;
  final String explanation;
  final String color;
  final String icon;

  GradeAnalysis({
    required this.status,
    required this.message,
    required this.explanation,
    required this.color,
    required this.icon,
  });

  factory GradeAnalysis.fromJson(Map<String, dynamic> json) {
    return GradeAnalysis(
      status: json['status'] ?? '',
      message: json['message'] ?? '',
      explanation: json['explanation'] ?? '',
      color: json['color'] ?? 'gray',
      icon: json['icon'] ?? '',
    );
  }
}
```

### 3. استخدام API في UI

```dart
class HadithVerificationPage extends StatefulWidget {
  @override
  _HadithVerificationPageState createState() => _HadithVerificationPageState();
}

class _HadithVerificationPageState extends State<HadithVerificationPage> {
  final TextEditingController _textController = TextEditingController();
  bool _isLoading = false;
  VerificationSummary? _verificationResult;
  List<HadithResult> _searchResults = [];

  Future<void> _verifyHadith() async {
    if (_textController.text.trim().isEmpty) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final result = await HadithVerificationService.verifyHadith(_textController.text.trim());

      if (result['success'] == true) {
        setState(() {
          _verificationResult = VerificationSummary.fromJson(result['data']['verificationSummary']);

          // استخراج نتائج البحث
          _searchResults = [];
          final searchResults = result['data']['searchResults'];

          if (searchResults['dorar']?['success'] == true) {
            _searchResults.addAll(
              (searchResults['dorar']['data'] as List)
                  .map((item) => HadithResult.fromJson(item))
                  .toList()
            );
          }

          if (searchResults['sunnah']?['success'] == true) {
            _searchResults.addAll(
              (searchResults['sunnah']['data'] as List)
                  .map((item) => HadithResult.fromJson(item))
                  .toList()
            );
          }
        });
      } else {
        _showErrorSnackBar('فشل في التحقق من الحديث');
      }
    } catch (e) {
      _showErrorSnackBar('خطأ: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('فاحص الأحاديث'),
        backgroundColor: Colors.purple,
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          children: [
            // حقل إدخال النص
            TextField(
              controller: _textController,
              decoration: InputDecoration(
                labelText: 'أدخل نص الحديث',
                hintText: 'مثال: إنما الأعمال بالنيات',
                border: OutlineInputBorder(),
                suffixIcon: IconButton(
                  icon: Icon(Icons.clear),
                  onPressed: () => _textController.clear(),
                ),
              ),
              maxLines: 3,
              maxLength: 500,
            ),

            SizedBox(height: 16),

            // زر التحقق
            ElevatedButton(
              onPressed: _isLoading ? null : _verifyHadith,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.purple,
                padding: EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
              child: _isLoading
                  ? CircularProgressIndicator(color: Colors.white)
                  : Text('تحقق من الحديث', style: TextStyle(fontSize: 16)),
            ),

            SizedBox(height: 24),

            // عرض النتائج
            Expanded(
              child: _verificationResult == null
                  ? Center(
                      child: Text(
                        'أدخل نص الحديث واضغط على "تحقق"',
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                    )
                  : ListView(
                      children: [
                        // نتيجة التحقق الرئيسية
                        _buildVerificationResult(),

                        SizedBox(height: 16),

                        // نتائج البحث التفصيلية
                        _buildSearchResults(),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVerificationResult() {
    final analysis = _verificationResult!.gradeAnalysis;

    return Card(
      elevation: 4,
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'نتيجة التحقق',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),

            // درجة الحديث
            Container(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: _getGradeColor(analysis.color),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(analysis.icon, style: TextStyle(fontSize: 18)),
                  SizedBox(width: 8),
                  Text(
                    analysis.status,
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(height: 12),

            // رسالة التحليل
            Text(
              analysis.message,
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),

            SizedBox(height: 8),

            // الشرح التفصيلي
            Text(
              analysis.explanation,
              style: TextStyle(fontSize: 14, color: Colors.grey[700]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResults() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'نتائج البحث التفصيلية',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 12),

        ..._searchResults.map((result) => Card(
          elevation: 2,
          margin: EdgeInsets.only(bottom: 8),
          child: Padding(
            padding: EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // نص الحديث
                Text(
                  result.hadith,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    fontFamily: 'Amiri', // خط عربي جميل للأحاديث
                  ),
                ),

                SizedBox(height: 12),

                // التفاصيل
                _buildDetailRow('الراوي:', result.rawi),
                _buildDetailRow('المحدث:', result.muhaddith),
                _buildDetailRow('المصدر:', result.book),
                _buildDetailRow('الرقم:', result.number),
                _buildDetailRow('الدرجة:', result.grade),

                if (result.explainGrade.isNotEmpty)
                  _buildDetailRow('حكم المحدث:', result.explainGrade),

                if (result.takhrij.isNotEmpty)
                  _buildDetailRow('التخريج:', result.takhrij),
              ],
            ),
          ),
        )).toList(),
      ],
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.grey[700],
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Color _getGradeColor(String colorName) {
    switch (colorName) {
      case 'green':
        return Colors.green;
      case 'blue':
        return Colors.blue;
      case 'yellow':
        return Colors.orange;
      case 'red':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
```

---

## 📱 نصائح للتنفيذ في Flutter

### 1. إدارة الحالة

```dart
// استخدام Provider أو Bloc لإدارة الحالة
class HadithVerificationProvider extends ChangeNotifier {
  bool _isLoading = false;
  VerificationSummary? _verificationResult;
  List<HadithResult> _searchResults = [];
  String? _errorMessage;

  // Getters
  bool get isLoading => _isLoading;
  VerificationSummary? get verificationResult => _verificationResult;
  List<HadithResult> get searchResults => _searchResults;
  String? get errorMessage => _errorMessage;

  Future<void> verifyHadith(String text) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await HadithVerificationService.verifyHadith(text);
      // معالجة النتائج...
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
```

### 2. التخزين المحلي

```dart
import 'package:shared_preferences/shared_preferences.dart';

class HadithStorage {
  static const String _key = 'hadith_history';

  static Future<void> saveHadithHistory(List<HadithResult> hadiths) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonList = hadiths.map((h) => h.toJson()).toList();
    await prefs.setString(_key, json.encode(jsonList));
  }

  static Future<List<HadithResult>> getHadithHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = prefs.getString(_key);
    if (jsonString != null) {
      final jsonList = json.decode(jsonString) as List;
      return jsonList.map((item) => HadithResult.fromJson(item)).toList();
    }
    return [];
  }
}
```

### 3. معالجة الأخطاء

```dart
class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => 'API Error: $message (Status: $statusCode)';
}

// في الـ service
static Future<Map<String, dynamic>> verifyHadith(String text) async {
  try {
    final response = await http.post(/* ... */);

    switch (response.statusCode) {
      case 200:
        return json.decode(response.body);
      case 400:
        throw ApiException('طلب غير صحيح', 400);
      case 404:
        throw ApiException('لم يتم العثور على الحديث', 404);
      case 500:
        throw ApiException('خطأ في الخادم', 500);
      default:
        throw ApiException('خطأ غير متوقع: ${response.statusCode}', response.statusCode);
    }
  } on SocketException {
    throw ApiException('لا يوجد اتصال بالإنترنت');
  } on TimeoutException {
    throw ApiException('انتهت مهلة الطلب');
  }
}
```

---

## 🎨 تصميم UI متقدم

### 1. استخدام Themes

```dart
class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      primarySwatch: Colors.purple,
      fontFamily: 'Cairo', // خط عربي جميل
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.purple,
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.purple,
          foregroundColor: Colors.white,
          padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
    );
  }
}
```

### 2. Animations

```dart
class FadeInAnimation extends StatefulWidget {
  final Widget child;
  final Duration duration;

  const FadeInAnimation({
    Key? key,
    required this.child,
    this.duration = const Duration(milliseconds: 500),
  }) : super(key: key);

  @override
  _FadeInAnimationState createState() => _FadeInAnimationState();
}

class _FadeInAnimationState extends State<FadeInAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: widget.duration,
      vsync: this,
    );
    _animation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _animation,
      child: widget.child,
    );
  }
}
```

---

## 🔒 الأمان والأداء

### 1. Rate Limiting

```dart
class RateLimiter {
  static final Map<String, DateTime> _requests = {};
  static const Duration _limitDuration = Duration(minutes: 1);
  static const int _maxRequests = 10;

  static bool canMakeRequest(String userId) {
    final now = DateTime.now();
    final userRequests = _requests.entries
        .where((entry) => entry.key.startsWith(userId))
        .toList();

    // إزالة الطلبات القديمة
    userRequests.removeWhere((entry) =>
        now.difference(entry.value) > _limitDuration);

    return userRequests.length < _maxRequests;
  }

  static void recordRequest(String userId) {
    final key = '${userId}_${DateTime.now().millisecondsSinceEpoch}';
    _requests[key] = DateTime.now();
  }
}
```

### 2. Caching

```dart
class ApiCache {
  static final Map<String, CacheEntry> _cache = {};
  static const Duration _cacheDuration = Duration(minutes: 30);

  static Map<String, dynamic>? get(String key) {
    final entry = _cache[key];
    if (entry != null &&
        DateTime.now().difference(entry.timestamp) < _cacheDuration) {
      return entry.data;
    }
    _cache.remove(key);
    return null;
  }

  static void set(String key, Map<String, dynamic> data) {
    _cache[key] = CacheEntry(
      data: data,
      timestamp: DateTime.now(),
    );
  }
}

class CacheEntry {
  final Map<String, dynamic> data;
  final DateTime timestamp;

  CacheEntry({required this.data, required this.timestamp});
}
```

---

## 📊 إحصائيات الاستخدام

### 1. Analytics

```dart
class AnalyticsService {
  static Future<void> trackHadithVerification(String text, String result) async {
    // إرسال إحصائيات الاستخدام
    await FirebaseAnalytics.instance.logEvent(
      name: 'hadith_verification',
      parameters: {
        'text_length': text.length,
        'result_grade': result,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      },
    );
  }
}
```

---

## 🚀 نصائح إضافية للتطوير

### 1. اختبار API

```dart
// Unit Tests
void main() {
  group('HadithVerificationService', () {
    test('should return valid response for correct hadith', () async {
      final result = await HadithVerificationService.verifyHadith(
        'إنما الأعمال بالنيات'
      );

      expect(result['success'], true);
      expect(result['data']['verificationSummary'], isNotNull);
    });
  });
}
```

### 2. Offline Support

```dart
class OfflineHadithService {
  static Future<bool> isOnline() async {
    try {
      final result = await InternetAddress.lookup('google.com');
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } on SocketException catch (_) {
      return false;
    }
  }

  static Future<Map<String, dynamic>?> getCachedResult(String text) async {
    if (await isOnline()) return null;

    final cacheKey = _generateCacheKey(text);
    return ApiCache.get(cacheKey);
  }
}
```

---

## 📞 الدعم الفني

لأي استفسارات أو مشاكل في التكامل:

- **البريد الإلكتروني**: dev@meshkah.com
- **التليجرام**: @MeshkahDev
- **GitHub**: github.com/meshkah/hadith-verification-api

---

## 📝 ملاحظات مهمة

1. **المصادر**: API يعتمد على مصادر موثوقة مثل `dorar.net` و `sunnah.com`
2. **الأداء**: يتم استخدام caching لتحسين الأداء
3. **الأمان**: جميع الطلبات محمية بـ rate limiting
4. **التحديث**: API يتم تحديثه دورياً لضمان دقة النتائج
5. **الدعم**: يدعم API اللغة العربية بالكامل

---

**تم إعداد هذا الدليل بواسطة فريق تطوير مشكاة** 🚀

_آخر تحديث: ${new Date().toLocaleDateString('ar-SA')}_
