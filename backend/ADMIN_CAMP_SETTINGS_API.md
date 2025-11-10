# API Documentation: Admin Camp Settings

## Overview

هذه API خاصة بإعدادات المدير للمخيم (Admin Camp Settings)، وهي تختلف عن إعدادات المستخدم (`/settings`).

## Endpoints

### 1. Get Admin Camp Settings

```http
GET /api/quran-camps/:id/admin/settings
```

**Headers:**

- `x-auth-token` (required)
- `Content-Type: application/json`

**Authorization:**

- Admin only

**Response:**

```json
{
  "success": true,
  "data": {
    "enable_leaderboard": true,
    "enable_study_hall": true,
    "enable_public_enrollment": true,
    "auto_start_camp": false,
    "max_participants": null,
    "enable_notifications": true,
    "enable_daily_reminders": true,
    "enable_achievement_notifications": true,
    "visibility_mode": "public",
    "allow_user_content": true,
    "enable_interactions": true
  }
}
```

---

### 2. Update Admin Camp Settings

```http
PUT /api/quran-camps/:id/admin/settings
```

**Headers:**

- `x-auth-token` (required)
- `Content-Type: application/json`

**Authorization:**

- Admin only

**Body (all fields optional):**

```json
{
  "enable_leaderboard": true,
  "enable_study_hall": true,
  "enable_public_enrollment": true,
  "auto_start_camp": false,
  "max_participants": 100,
  "enable_notifications": true,
  "enable_daily_reminders": true,
  "enable_achievement_notifications": true,
  "visibility_mode": "public",
  "allow_user_content": true,
  "enable_interactions": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "تم تحديث إعدادات المخيم بنجاح"
}
```

---

## Settings Fields Description

| Field                              | Type        | Default    | Description                                            |
| ---------------------------------- | ----------- | ---------- | ------------------------------------------------------ |
| `enable_leaderboard`               | boolean     | `true`     | تفعيل/تعطيل لوحة المتصدرين                             |
| `enable_study_hall`                | boolean     | `true`     | تفعيل/تعطيل Study Hall (قاعة الدراسة)                  |
| `enable_public_enrollment`         | boolean     | `true`     | السماح بالتسجيل العام في المخيم                        |
| `auto_start_camp`                  | boolean     | `false`    | بدء المخيم تلقائياً عند تاريخ البداية                  |
| `max_participants`                 | number/null | `null`     | الحد الأقصى للمشتركين (null = لا يوجد حد)              |
| `enable_notifications`             | boolean     | `true`     | تفعيل الإشعارات العامة للمخيم                          |
| `enable_daily_reminders`           | boolean     | `true`     | تفعيل التذكيرات اليومية                                |
| `enable_achievement_notifications` | boolean     | `true`     | تفعيل إشعارات الإنجازات                                |
| `visibility_mode`                  | string      | `"public"` | وضع الرؤية: `"public"`, `"private"`, `"unlisted"`      |
| `allow_user_content`               | boolean     | `true`     | السماح للمستخدمين بنشر المحتوى (reflections, benefits) |
| `enable_interactions`              | boolean     | `true`     | تفعيل التفاعلات (upvotes, saves)                       |

---

## Visibility Modes

- **`public`**: المخيم مرئي للجميع ويمكن البحث عنه
- **`private`**: المخيم غير مرئي للجميع، يحتاج رابط مباشر
- **`unlisted`**: المخيم مرئي للجميع لكن لا يظهر في البحث

---

## Error Responses

### 404 - Camp Not Found

```json
{
  "success": false,
  "message": "المخيم غير موجود"
}
```

### 400 - Invalid Visibility Mode

```json
{
  "success": false,
  "message": "وضع الرؤية غير صحيح"
}
```

### 400 - No Settings Provided

```json
{
  "success": false,
  "message": "لم يتم إرسال أي إعدادات للتحديث"
}
```

### 500 - Server Error

```json
{
  "success": false,
  "message": "حدث خطأ في تحديث إعدادات المخيم",
  "error": "Error message"
}
```

---

## Notes

1. جميع الحقول اختيارية في طلب التحديث
2. يمكن تحديث إعداد واحد أو عدة إعدادات معاً
3. القيم الافتراضية تستخدم عند عدم وجود قيمة
4. `max_participants` يمكن أن يكون `null` (لا يوجد حد) أو رقم موجب
5. هذه الإعدادات تؤثر على جميع المستخدمين في المخيم
6. الإعدادات الخاصة بالمستخدم (`/settings`) تختلف عن هذه الإعدادات
