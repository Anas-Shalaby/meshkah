# قاعة التدارس التفاعلية - دليل المطور

## نظرة عامة

تم ترقية "قاعة التدارس" لتصبح تفاعلية ومنسقة، مما يسمح للمستخدمين بالتصويت على الفوائد المفيدة وحفظها في سجلهم الخاص.

## الميزات الجديدة

### 1. التصويت (Upvoting)

- **الوظيفة**: السماح للمستخدمين بالتصويت على الفوائد المفيدة
- **السلوك**: زر toggle - يمكن إضافة أو إزالة التصويت
- **التحديث**: فوري (Optimistic UI) مع rollback في حالة الفشل

### 2. الحفظ (Saving)

- **الوظيفة**: السماح للمستخدمين بحفظ الفوائد في سجلهم الخاص
- **السلوك**: زر toggle - يمكن إضافة أو إزالة الحفظ
- **التحديث**: فوري (Optimistic UI) مع rollback في حالة الفشل

### 3. الفرز المتقدم

- **الأحدث**: ترتيب حسب تاريخ الإنشاء (افتراضي)
- **الأكثر إفادة**: ترتيب حسب عدد التصويتات
- **الأكثر حفظًا**: ترتيب حسب عدد مرات الحفظ

## التغييرات في قاعدة البيانات

### جدول `camp_task_progress`

```sql
-- أعمدة جديدة
ALTER TABLE camp_task_progress
ADD COLUMN upvote_count INT DEFAULT 0 COMMENT 'عدد التصويتات الإيجابية',
ADD COLUMN save_count INT DEFAULT 0 COMMENT 'عدد مرات الحفظ';
```

### جدول `reflection_upvotes` (جديد)

```sql
CREATE TABLE reflection_upvotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    progress_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_progress_upvote (user_id, progress_id)
);
```

### جدول `user_saved_reflections` (جديد)

```sql
CREATE TABLE user_saved_reflections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    progress_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_progress_save (user_id, progress_id)
);
```

## API Endpoints الجديدة

### 1. التصويت على تدبر

```http
POST /api/quran-camps/reflections/:progressId/toggle-upvote
```

**Response:**

```json
{
  "success": true,
  "message": "تم التصويت بنجاح",
  "upvoted": true
}
```

### 2. حفظ تدبر

```http
POST /api/quran-camps/reflections/:progressId/toggle-save
```

**Response:**

```json
{
  "success": true,
  "message": "تم الحفظ بنجاح",
  "saved": true
}
```

### 3. جلب التدبرات المحفوظة

```http
GET /api/quran-camps/:campId/saved-reflections?page=1&limit=10&sort=newest
```

**Response:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

## التغييرات في Frontend

### 1. State Management

```jsx
const [sortBy, setSortBy] = useState("newest"); // "newest", "helpful", "saved"
```

### 2. تبويبات الفرز

```jsx
<div className="flex justify-center space-x-4" dir="rtl">
  <button onClick={() => setSortBy("newest")}>الأحدث</button>
  <button onClick={() => setSortBy("helpful")}>الأكثر إفادة</button>
  <button onClick={() => setSortBy("saved")}>الأكثر حفظًا</button>
</div>
```

### 3. أزرار التفاعل في البطاقات

```jsx
{
  /* زر التصويت */
}
<button onClick={() => handleToggleUpvote(item.progress_id)}>
  <ArrowUp className="w-4 h-4" />
  <span>{item.upvote_count || 0}</span>
</button>;

{
  /* زر الحفظ */
}
<button onClick={() => handleToggleSave(item.progress_id)}>
  <Bookmark className="w-4 h-4" />
  <span>{item.save_count || 0}</span>
</button>;
```

### 4. دوال Handlers

```jsx
const handleToggleUpvote = async (progressId) => {
  // Optimistic Update
  setStudyHallData(prevData => /* تحديث فوري */);

  // API Call
  const response = await fetch(`/api/quran-camps/reflections/${progressId}/toggle-upvote`, {
    method: 'POST',
    headers: { 'x-auth-token': token }
  });

  // Error Handling with Rollback
  if (!response.ok) {
    // إعادة تعيين القيم
  }
};
```

## تشغيل الهجرة

```bash
# تشغيل هجرة قاعدة البيانات
node backend/scripts/run-interactive-features-migration.js
```

## ملاحظات مهمة

1. **الأمان**: جميع الـ endpoints تتطلب مصادقة (`authMiddleware`)
2. **التحقق**: يتم التحقق من أن المستخدم مسجل في نفس المخيم
3. **الأداء**: استخدام Optimistic UI لتحسين تجربة المستخدم
4. **التخزين المؤقت**: دعم الكاش مع مفاتيح تتضمن معامل الفرز
5. **معالجة الأخطاء**: rollback تلقائي في حالة فشل الطلبات

## الاختبار

1. تأكد من تشغيل الهجرة بنجاح
2. اختبر التصويت والحفظ على تدبرات مختلفة
3. اختبر الفرز بجميع الخيارات المتاحة
4. تأكد من عمل Optimistic UI بشكل صحيح
5. اختبر معالجة الأخطاء (قطع الإنترنت، إلخ)

## الدعم المستقبلي

- إضافة التعليقات على التدبرات
- إشعارات عند التصويت أو الحفظ
- إحصائيات مفصلة للمستخدمين
- تصدير التدبرات المحفوظة
