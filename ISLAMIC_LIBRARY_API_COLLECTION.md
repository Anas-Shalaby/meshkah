# Islamic Library API Collection

A comprehensive collection of all Islamic Library APIs for mobile app development.

## Base URL
```
Production: https://api.hadith-shareef.com/api
Development: http://localhost:4000/api
```

## Authentication

All bookmark-related endpoints require authentication using JWT tokens. You need to register/login to get a token.

### Headers Required for Protected Endpoints
```
x-auth-token: AnasYoussef2024
Content-Type: application/json
```

---

## 🔐 Authentication APIs

### 1. User Registration
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- Username: Required, not empty
- Email: Required, valid email format
- Password: Required, minimum 6 characters

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response:**
```json
{
  "msg": "المستخدم موجود مسبقاً"
}
```

### 2. User Login
**POST** `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**comprehensive
```json
{
  "msg": "لا يوجد مستخدم بهذا الايميل"
}
```

```json
{
  "msg": "خطأ في الصلاحيات"
}
```comprehensive

### 3. Google OAuth Login
**POST** `/auth/google-login`

Login/Register using Google OAuth.

**Request Body:**
```jsoncomprehensive
{
  "token": "GOOGLE_ID_TOKEN"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",comprehensive
    "email": "john@example.com",
    "google_id": "123456789",
    "avatar_url": "https://lh3.googleusercontent.com/...",
    "role": "user"
  }
}
```

### 4. Get User Profile
**GET** `/auth/profile`

**Authentication Required:** Yes

Get current user's profile information.

**Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "avatar_url": null,
  "google_id": null,
  "role": "user",
  "weekly_achievement_count": 0,
  "created_at": "2024-01-01T12:00:00Z"
}
```

### 5. Update User Profile
**PUT** `/auth/update-profile`

**Authentication Required:** Yes

Update user profile (supports file upload for avatar).

**Request (Multipart Form Data):**
```
username: john_updated
avatar: [file upload]
```

**Response:**
```json
{
  "id": 1,
  "username": "john_updated",
  "email": "john@example.com",
  "avatar_url": "/uploads/avatars/avatar-1-1234567890.jpg",
  "role": "user"
}
```

### 6. Get Bookmarked Cards
**GET** `/auth/bookmarked-cards`

**Authentication Required:** Yes

Get user's bookmarked dawah cards.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Card Title",
    "description": "Card description",
    "bookmarked_at": "2024-01-01T12:00:00Z",
    "created_by_username": "creator_name",
    "created_by_avatar": "/uploads/avatar.jpg",
    "total_hadiths": 5
  }
]
```

### 7. Check Google Connection Status
**GET** `/auth/google-status`

**Authentication Required:** Yes

Check if user has connected their Google account.

**Response:**
```json
{
  "connected": true
}
```

### 8. Google OAuth Setup
**GET** `/auth/google`

Redirects to Google OAuth consent page for calendar integration.

### 9. Google OAuth Callback
**POST** `/auth/google/callback`

**Authentication Required:** Yes

Handle Google OAuth callback for calendar integration.

**Request Body:**
```json
{
  "code": "GOOGLE_AUTHORIZATION_CODE"
}
```

**Response:**
```
Text response: "تم ربط حسابك بجوجل بنجاح! يمكنك إغلاق هذه النافذة."
```

---

## 📚 Books & Categories APIs

### 1. Get All Books with Categories
**GET** `/islamic-library/books`

Returns all Islamic books organized by categories with both API and local books.

**Response:**
```json
{
  "status": 200,
  "categories": {
    "kutub_tisaa": {
      "id": "kutub_tisaa",
      "name": "كتب الأحاديث الكبيرة",
      "nameEn": "Major Hadith Books",
      "nameUr": "بڑی حدیث کی کتابیں",
      "description": "أهم كتب الحديث المعتمدة والمشهورة",
      "books": [...]
    },
    "arbaain": {...},
    "adab": {...}
  },
  "allBooks": [
    {
      "id": 1,
      "bookName": "صحيح البخاري",
      "bookNameEn": "Sahih al-Bukhari",
      "bookSlug": "sahih-bukhari",
      "hadiths_count": "7563",
      "chapters_count": "97",
      "status": "available",
      "isLocal": false
    }
  ]
}
```

### 2. Get Book Categories Only
**GET** `/islamic-library/categories`

Returns available book categories.

**Response:**
```json
{
  "status": 200,
  "categories": {
    "kutub_tisaa": {
      "id": "kutub_tisaa",
      "name": "كتب الأحاديث الكبيرة",
      "nameEn": "Major Hadith Books",
      "books": ["sahih-bukhari", "sahih-muslim", ...]
    }
  }
}
```

### 3. Get Books by Category
**GET** `/islamic-library/categories/{categoryId}/books`

**Parameters:**
- `categoryId`: Category identifier (kutub_tisaa, arbaain, adab)

**Response:**
```json
{
  "status": 200,
  "category": {
    "id": "kutub_tisaa",
    "name": "كتب الأحاديث الكبيرة",
    "nameEn": "Major Hadith Books"
  },
  "books": [...]
}
```

### 4. Get Library Statistics
**GET** `/islamic-library/statistics`

Returns comprehensive statistics about the Islamic library.

**Response:**
```json
{
  "status": 200,
  "statistics": {
    "totalBooks": 15,
    "totalHadiths": 45000,
    "totalChapters": 500,
    "booksByCategory": {
      "kutub_tisaa": {
        "count": 11,
        "hadiths": 35000
      }
    },
    "topBooks": [
      {
        "name": "صحيح البخاري",
        "nameEn": "Sahih al-Bukhari",
        "hadiths": 7563,
        "chapters": 97
      }
    ]
  }
}
```

---

## 📖 Local Books APIs

### 5. Get Local Book Details
**GET** `/islamic-library/local-books/{bookSlug}`

**Parameters:**
- `bookSlug`: Book identifier (nawawi40, qudsi40, etc.)

**Response:**
```json
{
  "status": 200,
  "book": {
    "id": 10,
    "bookName": "الأربعون النووية",
    "bookNameEn": "The Forty Hadith of Imam Nawawi",
    "bookSlug": "nawawi40",
    "hadiths_count": "42",
    "chapters_count": "1",
    "metadata": {
      "arabic": {
        "title": "الأربعون النووية",
        "author": "الإمام النووي"
      },
      "english": {
        "title": "The Forty Hadith of Imam Nawawi",
        "author": "Imam Nawawi"
      }
    },
    "hadiths": [...]
  }
}
```

### 6. Get Hadiths from Local Book
**GET** `/islamic-library/local-books/{bookSlug}/hadiths`

**Query Parameters:**
- `page`: Page number (default: 1)
- `paginate`: Items per page (default: 25)
- `search`: Search term (optional)

**Response:**
```json
{
  "status": 200,
  "hadiths": {
    "data": [
      {
        "id": 1,
        "idInBook": 1,
        "chapterId": 1,
        "arabic": "إنما الأعمال بالنيات...",
        "english": {
          "text": "Actions are according to intentions...",
          "narrator": "Umar ibn al-Khattab"
        }
      }
    ],
    "current_page": 1,
    "last_page": 2,
    "per_page": 25,
    "total": 42
  }
}
```

### 7. Get Specific Hadith from Local Book
**GET** `/islamic-library/local-books/{bookSlug}/hadiths/{hadithId}`

**Response:**
```json
{
  "status": 200,
  "hadith": {
    "id": 1,
    "idInBook": 1,
    "chapterId": 1,
    "hadithArabic": "إنما الأعمال بالنيات...",
    "hadithEnglish": "Actions are according to intentions...",
    "englishNarrator": "Umar ibn al-Khattab",
    "book": {
      "bookName": "الأربعون النووية",
      "bookNameEn": "The Forty Hadith of Imam Nawawi",
      "bookSlug": "nawawi40",
      "isLocal": true
    },
    "chapter": {
      "chapterNumber": 1,
      "chapterArabic": "جميع الأحاديث",
      "chapterEnglish": "All Hadiths"
    }
  }
}
```

---

## 📑 Chapters APIs

### 8. Get Book Chapters
**GET** `/islamic-library/books/{bookSlug}/chapters`

Works for both API books and local books.

**Response:**
```json
{
  "status": 200,
  "chapters": [
    {
      "chapterNumber": 1,
      "chapterArabic": "بدء الوحي",
      "chapterEnglish": "How the Divine Inspiration started",
      "chapterUrdu": "How the Divine Inspiration started",
      "hadiths_count": 7
    }
  ]
}
```

### 9. Get Chapter Navigation
**GET** `/islamic-library/local-books/{bookSlug}/chapters/{chapterId}/navigation`

Get navigation info for a specific chapter.

**Response:**
```json
{
  "status": 200,
  "navigation": {
    "current": {
      "id": 1,
      "title": "بدء الوحي",
      "titleEn": "How the Divine Inspiration started",
      "hadithsCount": 7
    },
    "previous": null,
    "next": {
      "id": 2,
      "title": "الإيمان",
      "titleEn": "Faith"
    },
    "totalChapters": 97,
    "currentChapterIndex": 1
  }
}
```

### 10. Get Hadiths by Chapter
**GET** `/islamic-library/books/{bookSlug}/chapters/{chapterId}/hadiths`

**Query Parameters:**
- `page`: Page number (default: 1)
- `paginate`: Items per page (default: 25)

**Response:**
```json
{
  "status": 200,
  "hadiths": {
    "data": [...],
    "current_page": 1,
    "last_page": 5,
    "per_page": 25,
    "total": 120
  }
}
```

---

## 🔍 Search APIs

### 11. Advanced Search
**GET** `/islamic-library/search`

Comprehensive search across all books with advanced filters.

**Query Parameters:**
- `q`: Main search query
- `book`: Filter by book slug
- `category`: Filter by category
- `narrator`: Filter by narrator name
- `status`: Filter by hadith status
- `chapter`: Filter by chapter
- `sort`: Sort field (relevance, book, chapter, hadithNumber)
- `order`: Sort order (asc, desc)
- `paginate`: Items per page (default: 25)
- `page`: Page number (default: 1)
- `includeLocal`: Include local books (true/false)
- `includeAPI`: Include API books (true/false)

**Example Request:**
```
GET /islamic-library/search?q=prayer&category=kutub_tisaa&sort=relevance&page=1
```

**Response:**
```json
{
  "status": 200,
  "message": "Search completed successfully",
  "search": {
    "query": "prayer",
    "filters": {
      "book": null,
      "category": "kutub_tisaa",
      "narrator": null
    },
    "sort": {
      "field": "relevance",
      "order": "desc"
    },
    "results": {
      "data": [
        {
          "id": 1,
          "hadithNumber": "1",
          "hadithEnglish": "Actions are according to intentions...",
          "hadithArabic": "إنما الأعمال بالنيات...",
          "englishNarrator": "Umar ibn al-Khattab",
          "book": {
            "bookName": "صحيح البخاري",
            "bookSlug": "sahih-bukhari"
          },
          "chapter": {
            "chapterNumber": "1",
            "chapterEnglish": "How the Divine Inspiration started"
          }
        }
      ],
      "current_page": 1,
      "last_page": 10,
      "per_page": 25,
      "total": 250,
      "next_page_url": "/api/islamic-library/search?page=2&q=prayer",
      "prev_page_url": null
    }
  }
}
```

### 12. Search Suggestions
**GET** `/islamic-library/suggestions`

Get autocomplete suggestions for search queries.

**Query Parameters:**
- `q`: Search query (minimum 2 characters)
- `type`: Suggestion type (all, narrators, books, chapters)

**Response:**
```json
{
  "status": 200,
  "suggestions": [
    {
      "type": "narrator",
      "value": "Abu Bakr",
      "book": "Sahih al-Bukhari",
      "bookSlug": "sahih-bukhari"
    },
    {
      "type": "book",
      "value": "Sahih al-Bukhari",
      "bookSlug": "sahih-bukhari",
      "category": "kutub_tisaa"
    },
    {
      "type": "chapter",
      "value": "Chapter 1",
      "chapterId": "1",
      "book": "Sahih al-Bukhari",
      "bookSlug": "sahih-bukhari"
    }
  ]
}
```

### 13. Search Statistics
**GET** `/islamic-library/search-stats`

Get search-related statistics.

**Response:**
```json
{
  "status": 200,
  "stats": {
    "totalBooks": 15,
    "totalHadiths": 45000,
    "categories": {
      "kutub_tisaa": {
        "name": "Major Hadith Books",
        "bookCount": 11,
        "hadithCount": 35000
      }
    },
    "books": [
      {
        "slug": "sahih-bukhari",
        "name": "Sahih al-Bukhari",
        "hadithCount": 7563,
        "category": "kutub_tisaa"
      }
    ]
  }
}
```

---

## 📝 Hadiths APIs

### 14. Get Hadiths with Filters
**GET** `/islamic-library/hadiths`

Advanced hadith retrieval with multiple filters.

**Query Parameters:**
- `hadithEnglish`: Search in English text
- `hadithUrdu`: Search in Urdu text
- `hadithArabic`: Search in Arabic text
- `hadithNumber`: Filter by hadith number
- `book`: Filter by book slug
- `chapter`: Filter by chapter
- `status`: Filter by status
- `paginate`: Items per page (default: 25)
- `page`: Page number (default: 1)

**Response:**
```json
{
  "status": 200,
  "hadiths": {
    "data": [
      {
        "id": 1,
        "hadithNumber": "1",
        "hadithEnglish": "Actions are according to intentions...",
        "hadithArabic": "إنما الأعمال بالنيات...",
        "englishNarrator": "Umar ibn al-Khattab",
        "book": {...},
        "chapter": {...}
      }
    ],
    "current_page": 1,
    "last_page": 10,
    "per_page": 25,
    "total": 250
  }
}
```

### 15. Get Specific Hadith
**GET** `/islamic-library/book/{bookSlug}/chapter/{chapterId}/hadith/{hadithNumber}`

Get a specific hadith by book, chapter, and hadith number.

**Response:**
```json
{
  "status": 200,
  "hadith": {
    "id": 1,
    "hadithNumber": "1",
    "hadithArabic": "إنما الأعمال بالنيات...",
    "hadithEnglish": "Actions are according to intentions...",
    "englishNarrator": "Umar ibn al-Khattab",
    "book": {
      "bookName": "صحيح البخاري",
      "bookNameEn": "Sahih al-Bukhari"
    },
    "chapter": {
      "chapterNumber": "1",
      "chapterArabic": "بدء الوحي",
      "chapterEnglish": "How the Divine Inspiration started"
    }
  }
}
```

---

## 🧭 Navigation APIs

### 16. Hadith Navigation (Local Books)
**GET** `/islamic-library/local-books/{bookSlug}/hadiths/{hadithNumber}/navigation`

Get next/previous hadith navigation for local books.

**Response:**
```json
{
  "status": 200,
  "book": {
    "bookName": "الأربعون النووية",
    "bookNameEn": "The Forty Hadith of Imam Nawawi"
  },
  "nextHadith": {
    "id": 2,
    "title": "حديث جبريل...",
    "titleEn": "The Hadith of Gabriel..."
  },
  "prevHadith": null,
  "currentHadithNumber": 1,
  "totalHadiths": 42
}
```

### 17. Hadith Navigation (API Books)
**GET** `/islamic-library/books/{bookSlug}/chapter/{chapterNumber}/hadith/{hadithNumber}/navigation`

Get next/previous hadith navigation for API books.

**Response:**
```json
{
  "status": 200,
  "nextHadith": {
    "id": 2,
    "title": "...",
    "titleEn": "..."
  },
  "prevHadith": {
    "id": 1,
    "title": "...",
    "titleEn": "..."
  },
  "currentHadithNumber": 2,
  "totalHadiths": 120
}
```

---

## 🔖 Bookmarks APIs

### 18. Add Islamic Bookmark
**POST** `/islamic-bookmarks/add`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "type": "hadith", // 'book', 'chapter', 'hadith'
  "bookSlug": "sahih-bukhari",
  "bookName": "صحيح البخاري",
  "bookNameEn": "Sahih al-Bukhari",
  "bookNameUr": "صحیح بخاری",
  "chapterNumber": 1,
  "chapterName": "بدء الوحي",
  "chapterNameEn": "How the Divine Inspiration started",
  "hadithId": 1,
  "hadithNumber": "1",
  "hadithText": "إنما الأعمال بالنيات...",
  "hadithTextEn": "Actions are according to intentions...",
  "collection": "Favorites",
  "notes": "Important hadith about intentions",
  "isLocal": false
}
```

**Response:**
```json
{
  "message": "Islamic bookmark added successfully",
  "bookmarkId": 123
}
```

### 19. Get User Bookmarks
**GET** `/islamic-bookmarks/user`

**Authentication Required:** Yes

**Query Parameters:**
- `type`: Filter by type (book, chapter, hadith)
- `collection`: Filter by collection name
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "bookmarks": [
    {
      "id": 123,
      "type": "hadith",
      "book_slug": "sahih-bukhari",
      "book_name": "صحيح البخاري",
      "book_name_en": "Sahih al-Bukhari",
      "hadith_id": 1,
      "hadith_number": "1",
      "hadith_text": "إنما الأعمال بالنيات...",
      "collection": "Favorites",
      "notes": "Important hadith about intentions",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 95,
    "items_per_page": 20
  }
}
```

### 20. Check if Item is Bookmarked
**GET** `/islamic-bookmarks/check`

**Authentication Required:** Yes

**Query Parameters:**
- `bookSlug`: Book identifier
- `type`: Item type (book, chapter, hadith)
- `chapterNumber`: Chapter number (if type is chapter or hadith)
- `hadithId`: Hadith ID (if type is hadith)

**Response:**
```json
{
  "isBookmarked": true,
  "bookmark": {
    "id": 123,
    "collection": "Favorites",
    "notes": "Important hadith"
  }
}
```

### 21. Remove Bookmark
**DELETE** `/islamic-bookmarks/remove/{bookmarkId}`

**Authentication Required:** Yes

**Response:**
```json
{
  "message": "Islamic bookmark removed successfully"
}
```

### 22. Update Bookmark
**PUT** `/islamic-bookmarks/update/{bookmarkId}`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "notes": "Updated notes",
  "collection": "New Collection"
}
```

**Response:**
```json
{
  "message": "Bookmark updated successfully"
}
```

### 23. Get User Collections
**GET** `/islamic-bookmarks/collections`

**Authentication Required:** Yes

**Response:**
```json
{
  "collections": [
    {
      "collection": "Favorites",
      "count": 25
    },
    {
      "collection": "Study List",
      "count": 15
    }
  ]
}
```

---

## 🚨 Error Handling

### Standard Error Response Format
```json
{
  "status": 404,
  "message": "Book not found",
  "error": "Detailed error message"
}
```

### Common HTTP Status Codes
- **200**: Success
- **201**: Created (for POST requests)
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (missing or invalid token)
- **404**: Not Found
- **500**: Internal Server Error

### Authentication Errors
```json
{
  "msg": "No token, authorization denied"
}
```

```json
{
  "msg": "Token is not valid"
}
```

---

## 📱 Mobile Implementation Tips

### 1. **Authentication Flow**
Implement proper authentication flow for mobile apps:

```javascript
// Authentication service example
class AuthService {
  constructor() {
    this.token = null;
    this.user = null;
  }

  async register(username, email, password) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    if (response.ok) {
      const { token } = await response.json();
      await this.setToken(token);
      return true;
    }
    throw new Error('Registration failed');
  }

  async login(email, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const { token } = await response.json();
      await this.setToken(token);
      return true;
    }
    throw new Error('Login failed');
  }

  async setToken(token) {
    this.token = token;
    // Store in secure storage
    await AsyncStorage.setItem('auth_token', token);
    // Get user profile
    await this.loadUserProfile();
  }

  async loadUserProfile() {
    if (!this.token) return;
    
    const response = await fetch('/api/auth/profile', {
      headers: { 'x-auth-token': this.token }
    });
    
    if (response.ok) {
      this.user = await response.json();
    }
  }

  async logout() {
    this.token = null;
    this.user = null;
    await AsyncStorage.removeItem('auth_token');
  }

  getAuthHeaders() {
    return this.token ? { 'x-auth-token': this.token } : {};
  }
}
```

### 2. **Pagination**
Always implement pagination for list endpoints to improve performance:
```javascript
// Example pagination handling
const loadBooks = async (page = 1) => {
  const response = await fetch(`/api/islamic-library/books?page=${page}&limit=20`);
  return response.json();
};
```

### 2. **Bookmark Management**
Implement comprehensive bookmark management with authentication:

```javascript
// Bookmark service example
class BookmarkService {
  constructor(authService) {
    this.authService = authService;
  }

  async addBookmark(bookmarkData) {
    const response = await fetch('/api/islamic-bookmarks/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.authService.getAuthHeaders()
      },
      body: JSON.stringify(bookmarkData)
    });
    
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to add bookmark');
  }

  async getUserBookmarks(type = null, collection = null, page = 1) {
    let url = `/api/islamic-bookmarks/user?page=${page}&limit=20`;
    if (type) url += `&type=${type}`;
    if (collection) url += `&collection=${collection}`;
    
    const response = await fetch(url, {
      headers: this.authService.getAuthHeaders()
    });
    
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to get bookmarks');
  }

  async isBookmarked(bookSlug, type, chapterNumber = null, hadithId = null) {
    let url = `/api/islamic-bookmarks/check?bookSlug=${bookSlug}&type=${type}`;
    if (chapterNumber) url += `&chapterNumber=${chapterNumber}`;
    if (hadithId) url += `&hadithId=${hadithId}`;
    
    const response = await fetch(url, {
      headers: this.authService.getAuthHeaders()
    });
    
    if (response.ok) {
      const { isBookmarked } = await response.json();
      return isBookmarked;
    }
    return false;
  }

  async removeBookmark(bookmarkId) {
    const response = await fetch(`/api/islamic-bookmarks/remove/${bookmarkId}`, {
      method: 'DELETE',
      headers: this.authService.getAuthHeaders()
    });
    
    return response.ok;
  }
}
```

### 3. **Search with Debouncing**
Implement search with debouncing to avoid too many API calls:
```javascript
// Debounced search implementation
const debouncedSearch = useCallback(
  debounce((query) => {
    searchHadiths(query);
  }, 500),
  []
);
```

### 4. **Caching**
Cache frequently accessed data like book lists and categories:
```javascript
// Example with AsyncStorage
const getCachedBooks = async () => {
  const cached = await AsyncStorage.getItem('books');
  if (cached) {
    return JSON.parse(cached);
  }
  // Fetch from API and cache
};
```

### 4. **Offline Support**
Store bookmarks locally and sync when online:
```javascript
// Example bookmark sync
const syncBookmarks = async () => {
  const localBookmarks = await getLocalBookmarks();
  const serverBookmarks = await fetchServerBookmarks();
  // Merge and resolve conflicts
};
```

### 5. **Error Handling**
Implement comprehensive error handling:
```javascript
const apiCall = async (url, options) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    // Handle network errors, show user-friendly messages
    console.error('API Error:', error);
    throw error;
  }
};
```

---

## 🔧 Testing Endpoints

### Using cURL Examples

**Register new user:**
```bash
curl -X POST "http://localhost:4000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Login user:**
```bash
curl -X POST "http://localhost:4000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get user profile (authenticated):**
```bash
curl -X GET "http://localhost:4000/api/auth/profile" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_JWT_TOKEN"
```

**Get all books:**
```bash
curl -X GET "http://localhost:4000/api/islamic-library/books" \
  -H "Content-Type: application/json"
```

**Search hadiths:**
```bash
curl -X GET "http://localhost:4000/api/islamic-library/search?q=prayer&category=kutub_tisaa" \
  -H "Content-Type: application/json"
```

**Add bookmark (requires authentication):**
```bash
curl -X POST "http://localhost:4000/api/islamic-bookmarks/add" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_JWT_TOKEN" \
  -d '{
    "type": "hadith",
    "bookSlug": "sahih-bukhari",
    "hadithId": 1,
    "collection": "Favorites"
  }'
```

**Check if item is bookmarked:**
```bash
curl -X GET "http://localhost:4000/api/islamic-bookmarks/check?bookSlug=sahih-bukhari&type=hadith&hadithId=1" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_JWT_TOKEN"
```

---

## 📋 Quick Reference

### Available Book Slugs (Local Books)
- `nawawi40` - The Forty Hadith of Imam Nawawi
- `qudsi40` - The Forty Hadith Qudsi
- `aladab_almufrad` - Al-Adab Al-Mufrad
- `riyad_assalihin` - Riyad al-Salihin
- `malik` - Muwatta Malik
- `darimi` - Sunan al-Darimi
- `shamail_muhammadiyah` - Shama'il Muhammadiyah
- `bulugh_al_maram` - Bulugh al-Maram
- `hisnul_muslim` - Hisnul Muslim
- `shahwaliullah40` - The Forty Hadith of Shahwaliullah

### Available Categories
- `kutub_tisaa` - Major Hadith Books
- `arbaain` - Forty Hadith Collections
- `adab` - Books of Etiquette and Manners

### Search Sort Options
- `relevance` - Sort by search relevance (default)
- `book` - Sort by book name
- `chapter` - Sort by chapter
- `hadithNumber` - Sort by hadith number

---

## 📋 API Summary

This comprehensive API collection includes **32 endpoints** organized into **7 main categories**:

### 🔐 Authentication (9 endpoints)
- User registration and login
- Google OAuth integration
- Profile management
- Token-based authentication for bookmarks

### 📚 Books & Categories (4 endpoints)
- Complete book listings with multilingual support
- Category-based organization
- Comprehensive statistics

### 📖 Local Books (3 endpoints)
- Access to curated local Islamic book collection
- Direct hadith access with pagination
- Detailed book metadata

### 📑 Chapters (3 endpoints)
- Chapter navigation for all books
- Hadith listings by chapter
- Navigation between chapters

### 🔍 Search (3 endpoints)
- Advanced search with relevance scoring
- Autocomplete suggestions
- Search analytics

### 📝 Hadiths (2 endpoints)
- Comprehensive hadith retrieval
- Multi-language support (Arabic, English, Urdu)

### 🧭 Navigation (2 endpoints)
- Seamless navigation between hadiths
- Context-aware previous/next functionality

### 🔖 Bookmarks (6 endpoints)
- Full bookmark management system
- Collection organization
- Real-time bookmark status checking

### 🎯 **Key Features for Mobile Apps:**
- **Multi-language Support**: Arabic, English, and Urdu
- **Advanced Search**: Relevance-based with Arabic text normalization
- **User Authentication**: JWT-based with Google OAuth
- **Bookmark System**: Complete CRUD operations with collections
- **Pagination**: Performance-optimized data loading
- **Navigation**: Seamless hadith and chapter navigation
- **Offline Ready**: Designed for caching and offline sync

### 🔧 **Developer Benefits:**
- **Complete Documentation**: Every endpoint with examples
- **Authentication Flow**: Ready-to-use implementation patterns
- **Error Handling**: Standardized error responses
- **Testing Examples**: cURL commands for all endpoints
- **Mobile Optimized**: React Native and mobile-specific guidance

This API collection provides everything needed to build a comprehensive Islamic Library mobile application with professional-grade features including user management, advanced search capabilities, and bookmark functionality.
