# Quran Camps API Documentation

## نظرة عامة

هذا التوثيق يغطي جميع APIs الخاصة بنظام المخيمات القرآنية في مشكاة الأحاديث.

## Base URL

```
https://api.hadith-shareef.com/api/quran-camps
```

## Authentication

جميع الـ APIs المحمية تتطلب header:

```
x-auth-token: YOUR_JWT_TOKEN
```

---

## 📚 User APIs

### 1. جلب جميع المخيمات

```http
GET /api/quran-camps
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "مخيم سورة البقرة",
      "description": "رحلة تعمق في سورة البقرة",
      "surah_number": 2,
      "surah_name": "البقرة",
      "start_date": "2024-01-15",
      "duration_days": 7,
      "status": "active",
      "status_ar": "نشط",
      "banner_image": "https://example.com/banner.jpg",
      "enrolled_count": 150,
      "is_enrolled": 0
    }
  ]
}
```

### 2. جلب تفاصيل مخيم

```http
GET /api/quran-camps/:id
```

**Headers:**

- `x-auth-token` (required)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "مخيم سورة البقرة",
    "description": "رحلة تعمق في سورة البقرة",
    "surah_number": 2,
    "surah_name": "البقرة",
    "start_date": "2024-01-15",
    "duration_days": 7,
    "status": "active",
    "status_ar": "نشط",
    "banner_image": "https://example.com/banner.jpg",
    "enrolled_count": 150,
    "is_enrolled": 1
  }
}
```

### 3. التسجيل في مخيم

```http
POST /api/quran-camps/:id/enroll
```

**Headers:**

- `x-auth-token` (required)
- `Content-Type: application/json`

**Body:**

```json
{
  "hide_identity": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "تم التسجيل في المخيم بنجاح"
}
```

**Error Responses:**

```json
{
  "success": false,
  "message": "أنت مسجل بالفعل في هذا المخيم"
}
```

### 4. جلب المهام اليومية

```http
GET /api/quran-camps/:id/daily-tasks
```

**Headers:**

- `x-auth-token` (required)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "day_number": 1,
      "task_type": "reading",
      "task_type_ar": "قراءة",
      "title": "قراءة الآيات 1-50",
      "description": "اقرأ الآيات الأولى من سورة البقرة",
      "verses_from": 1,
      "verses_to": 50,
      "order_in_day": 1,
      "is_optional": false,
      "points": 3,
      "estimated_time": "30 دقيقة"
    }
  ]
}
```

### 5. إكمال مهمة

```http
POST /api/quran-camps/tasks/:taskId/complete
```

**Headers:**

- `x-auth-token` (required)
- `Content-Type: application/json`

**Body:**

```json
{
  "journal_entry": "تدبر اليوم...",
  "notes": "الفوائد المستخرجة:\n1. فائدة أولى\n2. فائدة ثانية"
}
```

**Response:**

```json
{
  "success": true,
  "message": "تم إكمال المهمة بنجاح",
  "data": {
    "pointsEarned": 3,
    "currentStreak": 5,
    "longestStreak": 10,
    "wordCount": 25
  }
}
```

### 6. إكمال مهمة بدون تدبر

```http
POST /api/quran-camps/tasks/:taskId/mark-complete
```

**Headers:**

- `x-auth-token` (required)

**Response:**

```json
{
  "success": true,
  "message": "تم إكمال المهمة بنجاح",
  "data": {
    "task_id": 1,
    "points_earned": 3
  }
}
```

### 7. حفظ التدبر والفوائد

```http
POST /api/quran-camps/tasks/:taskId/benefits
```

**Headers:**

- `x-auth-token` (required)
- `Content-Type: application/json`

**Body:**

```json
{
  "journal_entry": "تدبر اليوم...",
  "benefits": "الفوائد المستخرجة:\n1. فائدة أولى\n2. فائدة ثانية"
}
```

**Response:**

```json
{
  "success": true,
  "message": "تم حفظ التدبر والفوائد بنجاح"
}
```

### 8. جلب تقدم المستخدم

```http
GET /api/quran-camps/:id/my-progress
```

**Headers:**

- `x-auth-token` (required)

**Response:**

```json
{
  "success": true,
  "data": {
    "enrollment": {
      "id": 1,
      "user_id": 123,
      "camp_id": 1,
      "enrollment_date": "2024-01-15T10:00:00Z",
      "total_points": 45,
      "current_streak": 5,
      "longest_streak": 10,
      "last_activity_date": "2024-01-20"
    },
    "tasks": [
      {
        "id": 1,
        "title": "قراءة الآيات 1-50",
        "completed": true,
        "completed_at": "2024-01-15T12:00:00Z",
        "journal_entry": "تدبر اليوم...",
        "notes": "الفوائد المستخرجة...",
        "points": 3
      }
    ],
    "progress": {
      "totalTasks": 21,
      "completedTasks": 15,
      "progressPercentage": 71,
      "rank": 5
    }
  }
}
```

### 9. جلب لوحة الصدارة

```http
GET /api/quran-camps/:id/leaderboard
```

**Headers:**

- `x-auth-token` (required)

**Query Parameters:**

- `limit` (optional): عدد المشتركين المطلوب عرضهم (default: 10)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "total_points": 150,
      "display_name": "أحمد محمد",
      "avatar_url": "https://example.com/avatar.jpg",
      "user_rank": 1,
      "hide_identity": false
    }
  ],
  "cached": true
}
```

### 10. جلب قاعة التدارس

```http
GET /api/quran-camps/:id/study-hall
```

**Headers:**

- `x-auth-token` (required)

**Query Parameters:**

- `day` (optional): اليوم المحدد (1-7)

**Response:**

```json
{
  "success": true,
  "data": {
    "camp_id": 1,
    "camp_name": "مخيم سورة البقرة",
    "surah_name": "البقرة",
    "day": 1,
    "content": [
      {
        "id": "user-1",
        "type": "user_reflection",
        "title": "تدبر: قراءة الآيات 1-50",
        "content": "تدبر اليوم...",
        "day": 1,
        "points": 3,
        "completed_at": "2024-01-15T12:00:00Z",
        "is_own": true,
        "userName": "أحمد محمد",
        "avatar_url": "https://example.com/avatar.jpg"
      }
    ],
    "total_items": 25,
    "user_content_count": 5,
    "shared_content_count": 20
  }
}
```

---

## 🔧 Admin APIs

### 1. إنشاء مخيم جديد

```http
POST /api/quran-camps/admin/create
```

**Headers:**

- `x-auth-token` (required)
- `Content-Type: application/json`

**Body:**

```json
{
  "name": "مخيم سورة البقرة",
  "description": "رحلة تعمق في سورة البقرة",
  "surah_number": 2,
  "surah_name": "البقرة",
  "start_date": "2024-01-15",
  "duration_days": 7,
  "banner_image": "https://example.com/banner.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "تم إنشاء المخيم بنجاح",
  "data": {
    "campId": 1
  }
}
```

### 2. تحديث مخيم

```http
PUT /api/quran-camps/admin/:id
```

**Headers:**

- `x-auth-token` (required)
- `Content-Type: application/json`

**Body:**

```json
{
  "name": "مخيم سورة البقرة المحدث",
  "status": "active"
}
```

**Response:**

```json
{
  "success": true,
  "message": "تم تحديث المخيم بنجاح"
}
```

### 3. إضافة مهام يومية

```http
POST /api/quran-camps/admin/:id/daily-tasks
```

**Headers:**

- `x-auth-token` (required)
- `Content-Type: application/json`

**Body:**

```json
{
  "tasks": [
    {
      "day_number": 1,
      "task_type": "reading",
      "title": "قراءة الآيات 1-50",
      "description": "اقرأ الآيات الأولى من سورة البقرة",
      "verses_from": 1,
      "verses_to": 50,
      "order_in_day": 1,
      "is_optional": false,
      "points": 3,
      "estimated_time": "30 دقيقة"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "تم إضافة المهام اليومية بنجاح"
}
```

### 4. جلب إحصائيات الإدارة

```http
GET /api/quran-camps/admin/stats
```

**Headers:**

- `x-auth-token` (required)

**Response:**

```json
{
  "success": true,
  "data": {
    "total_camps": 5,
    "upcoming_camps": 2,
    "active_camps": 2,
    "completed_camps": 1,
    "total_enrollments": 500,
    "unique_users": 300
  }
}
```

### 5. جلب مشتركي المخيم

```http
GET /api/quran-camps/:id/participants
```

**Headers:**

- `x-auth-token` (required)

**Query Parameters:**

- `page` (optional): رقم الصفحة (default: 1)
- `limit` (optional): عدد المشتركين في الصفحة (default: 50)
- `status` (optional): حالة المشترك (enrolled, active, completed, withdrawn)
- `search` (optional): البحث في الاسم أو الإيميل

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "camp_id": 1,
      "enrollment_date": "2024-01-15T10:00:00Z",
      "status": "enrolled",
      "total_points": 45,
      "hide_identity": false,
      "username": "أحمد محمد",
      "email": "ahmed@example.com",
      "completed_tasks": 15,
      "total_tasks": 21,
      "progress_percentage": 71.43
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

### 6. جلب تحليلات المخيم

```http
GET /api/quran-camps/:id/analytics
```

**Headers:**

- `x-auth-token` (required)

**Response:**

```json
{
  "success": true,
  "data": {
    "totalEnrollments": 150,
    "activeEnrollments": 120,
    "completedEnrollments": 30,
    "averageProgress": 65.5,
    "averagePoints": 45.2,
    "dailyProgress": [
      {
        "date": "2024-01-15",
        "completed_tasks": 25,
        "new_enrollments": 5
      }
    ],
    "taskCompletion": [
      {
        "task_type": "reading",
        "total_attempts": 150,
        "completed_attempts": 120,
        "completion_rate": 80.0
      }
    ],
    "topPerformers": [
      {
        "username": "أحمد محمد",
        "total_points": 150,
        "progress_percentage": 95.5
      }
    ]
  }
}
```

---

## 🔔 Camp Notifications API

### 1. جلب إشعارات المستخدم

```http
GET /api/camp-notifications
```

**Headers:**

- `x-auth-token` (required)

**Query Parameters:**

- `page` (optional): رقم الصفحة (default: 1)
- `limit` (optional): عدد الإشعارات في الصفحة (default: 20)

**Response:**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "user_id": 123,
        "camp_id": 1,
        "type": "welcome",
        "title": "مرحباً بك في مخيم سورة البقرة! 🎉",
        "message": "أهلاً وسهلاً بك في مخيم سورة البقرة! نحن سعداء لانضمامك إلينا في هذه الرحلة القرآنية المباركة.",
        "sent_at": "2024-01-15T10:00:00Z",
        "read_at": null,
        "is_read": false,
        "camp_name": "مخيم سورة البقرة"
      }
    ],
    "unreadCount": 3,
    "pagination": {
      "page": 1,
      "limit": 20,
      "hasMore": false
    }
  }
}
```

### 2. تحديد إشعار كمقروء

```http
PUT /api/camp-notifications/:id/read
```

**Headers:**

- `x-auth-token` (required)

**Response:**

```json
{
  "success": true,
  "message": "تم تحديد الإشعار كمقروء"
}
```

### 3. تحديد جميع الإشعارات كمقروءة

```http
PUT /api/camp-notifications/read-all
```

**Headers:**

- `x-auth-token` (required)

**Response:**

```json
{
  "success": true,
  "message": "تم تحديد جميع الإشعارات كمقروءة"
}
```

### 4. جلب عدد الإشعارات غير المقروءة

```http
GET /api/camp-notifications/unread-count
```

**Headers:**

- `x-auth-token` (required)

**Response:**

```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  }
}
```

---

## ❌ Error Responses

### Validation Errors

```json
{
  "success": false,
  "message": "بيانات غير صحيحة",
  "errors": [
    {
      "field": "name",
      "message": "اسم المخيم مطلوب"
    }
  ]
}
```

### Authentication Errors

```json
{
  "success": false,
  "message": "No token, authorization denied"
}
```

### Authorization Errors

```json
{
  "success": false,
  "message": "Access denied. Admin role required."
}
```

### General Errors

```json
{
  "success": false,
  "message": "حدث خطأ في جلب المخيمات"
}
```

---

## 📝 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (No token or invalid token)
- `403` - Forbidden (Admin role required)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔄 Rate Limiting

- User APIs: 100 requests per minute
- Admin APIs: 200 requests per minute
- Notification APIs: 50 requests per minute

---

## 📱 WebSocket Events

### Real-time Notifications

```javascript
// Connect to notifications
socket.emit("join_notifications", { token: "your_jwt_token" });

// Listen for new notifications
socket.on("new_notification", (notification) => {
  console.log("New notification:", notification);
});
```

---

## 🧪 Testing

### Test Data

```json
{
  "test_camp": {
    "name": "مخيم الاختبار",
    "surah_number": 1,
    "surah_name": "الفاتحة",
    "start_date": "2024-12-01",
    "duration_days": 3
  }
}
```

### Test User

```json
{
  "test_user": {
    "email": "test@example.com",
    "password": "test123",
    "role": "user"
  }
}
```

---

## 📞 Support

للحصول على المساعدة أو الإبلاغ عن مشاكل:

- Email: support@hadith-shareef.com
- GitHub Issues: [Repository Issues](https://github.com/your-repo/issues)

---

_آخر تحديث: ديسمبر 2024_
