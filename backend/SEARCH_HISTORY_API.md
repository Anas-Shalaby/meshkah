# Search History API Documentation

## نظرة عامة

هذا الـ API يدير تاريخ البحث للمستخدمين في نظام الأحاديث. يتم استخدام `authMiddleware` لجلب `user_id` من الـ JWT token.

## Base URL

```
/api/search-history
```

## Authentication

جميع الـ endpoints تتطلب authentication عبر header:

```
x-auth-token: YOUR_JWT_TOKEN
```

## Endpoints

### 1. إضافة بحث جديد

**POST** `/`

#### Request Body:

```json
{
  "title": "الصلاة",
  "time": "14:30:25",
  "date": "2024-01-15",
  "search_type": "hadith", // اختياري - hadith, book, category, general
  "results_count": 5 // اختياري - عدد النتائج
}
```

#### Response:

```json
{
  "success": true,
  "message": "تم إضافة البحث بنجاح",
  "data": {
    "id": 123
  }
}
```

### 2. جلب تاريخ البحث

**GET** `/user`

#### Query Parameters:

- `limit` (default: 50) - عدد النتائج
- `offset` (default: 0) - عدد النتائج المراد تخطيها
- `date_from` - تاريخ البداية (YYYY-MM-DD)
- `date_to` - تاريخ النهاية (YYYY-MM-DD)
- `search_type` - نوع البحث
- `sort` (default: DESC) - ترتيب النتائج (ASC/DESC)

#### Example:

```
GET /api/search-history/user?limit=20&date_from=2024-01-01&sort=ASC
```

#### Response:

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "title": "الصلاة",
      "search_type": "hadith",
      "results_count": 5,
      "time": "14:30:25",
      "date": "2024-01-15",
      "created_at": "2024-01-15T14:30:25.000Z",
      "updated_at": "2024-01-15T14:30:25.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### 3. جلب الإحصائيات

**GET** `/user/stats`

#### Query Parameters:

- `days` (default: 30) - عدد الأيام للإحصائيات

#### Response:

```json
{
  "success": true,
  "data": {
    "total_searches": 150,
    "recent_searches": 25,
    "top_searches": [
      {
        "title": "الصلاة",
        "count": 15
      },
      {
        "title": "الزكاة",
        "count": 12
      }
    ],
    "search_types": [
      {
        "search_type": "hadith",
        "count": 120
      },
      {
        "search_type": "book",
        "count": 30
      }
    ],
    "daily_stats": [
      {
        "date": "2024-01-15",
        "count": 5
      },
      {
        "date": "2024-01-14",
        "count": 8
      }
    ],
    "period_days": 30
  }
}
```

### 4. حذف بحث محدد

**DELETE** `/:id`

#### Response:

```json
{
  "success": true,
  "message": "تم حذف البحث بنجاح"
}
```

### 5. حذف كل تاريخ البحث

**DELETE** `/user`

#### Request Body:

```json
{
  "confirm": true
}
```

#### Response:

```json
{
  "success": true,
  "message": "تم حذف 150 بحث بنجاح",
  "deleted_count": 150
}
```
