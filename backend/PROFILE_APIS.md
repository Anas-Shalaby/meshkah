# Profile APIs

Base path: `/api/auth/profile` (all require header `x-auth-token`)

## GET /stats

Query:

- `range`: `all|7d|30d`
- OR `start`,`end`: ISO strings

Response:

```json
{
  "bookmarksCount": 128,
  "collectionsCount": 6,
  "cardsCount": 0,
  "searchesCount": 34,
  "lastActivityAt": "2025-11-03T19:22:14.000Z",
  "topCollections": [
    { "name": "الافتراضي", "count": 52 },
    { "name": "الصلاة", "count": 21 }
  ]
}
```

## GET /activity

Query:

- `limit`: default 20, max 100
- `before`: ISO cursor

Response:

```json
{
  "items": [
    {
      "id": "ib_123",
      "type": "islamic_bookmark_added",
      "at": "2025-11-04T10:00:00.000Z",
      "meta": {
        "collection": "الصلاة",
        "type": "hadith",
        "bookSlug": "riyad_assalihin",
        "chapterNumber": 5,
        "hadithId": "415",
        "hadithNumber": "12"
      }
    },
    {
      "id": "s_77",
      "type": "search_performed",
      "at": "2025-11-03T12:00:00.000Z",
      "meta": {
        "title": "الصدق",
        "searchType": "hadith",
        "resultsCount": 42,
        "date": "2025-11-03",
        "time": "12:00:00"
      }
    }
  ],
  "nextCursor": "2025-11-01T00:00:00.000Z"
}
```

## GET /collections

Query:

- `limit`: default 5

Response:

```json
{ "collections": [{ "name": "الافتراضي", "count": 52 }] }
```

Notes:

- All counts/collections come from `islamic_bookmarks` (not `bookmarks`).
- Activity merges `islamic_bookmarks` and `search_history` only.
- Library-specific collections also exist under `/api/islamic-bookmarks/collections`; here we return the top N for profile.

## GET /ib-stats

Query:

- `top`: integer, default 5 (max 50)

Response:

```json
{
  "bookmarksTotal": 128,
  "byType": [
    { "type": "hadith", "count": 90 },
    { "type": "chapter", "count": 30 },
    { "type": "book", "count": 8 }
  ],
  "collectionsCount": 6,
  "topCollections": [{ "name": "الافتراضي", "count": 52 }],
  "topBooks": [
    { "slug": "riyad_assalihin", "name": "رياض الصالحين", "count": 21 }
  ]
}
```

## GET /ib-trends

Query:

- `range`: `all|7d|30d` (default 30d)
- OR `start`,`end`: ISO strings

Response:

```json
{
  "dailyCounts": [{ "date": "2025-11-01", "count": 5 }],
  "firstBookmarkAt": "2025-10-01T10:00:00.000Z",
  "lastBookmarkAt": "2025-11-04T10:00:00.000Z",
  "busiestDay": { "date": "2025-11-02", "count": 12 }
}
```

## GET /search-summary

Query:

- `range`: `all|7d|30d` or `start`,`end`
- `limit`: recent searches limit (default 10, max 50)

Response:

```json
{
  "searchesCount": 34,
  "recentSearches": [
    {
      "id": 1,
      "title": "الصدق",
      "searchType": "hadith",
      "resultsCount": 42,
      "date": "2025-11-03",
      "time": "12:00:00",
      "created_at": "2025-11-03T12:00:00.000Z"
    }
  ],
  "topQueries": [{ "title": "الصدق", "count": 5 }],
  "topTypes": [{ "searchType": "hadith", "count": 30 }],
  "avgResults": 18.2
}
```
