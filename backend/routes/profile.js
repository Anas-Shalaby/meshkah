const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { authMiddleware } = require("../middleware/authMiddleware");

// Helper: send consistent error
const sendError = (res, status, message, messageAr = null) => {
  const response = { success: false, status, message };
  if (messageAr) response.messageAr = messageAr;
  return res.status(status).json(response);
};

// Helper: parse time range to MySQL date conditions
function buildTimeFilter(range, start, end) {
  if (range && range !== "all") {
    if (range === "7d")
      return {
        sql: "AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
        params: [],
      };
    if (range === "30d")
      return {
        sql: "AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)",
        params: [],
      };
  }
  if (start || end) {
    const clauses = [];
    const params = [];
    if (start) {
      clauses.push("created_at >= ?");
      params.push(new Date(start));
    }
    if (end) {
      clauses.push("created_at <= ?");
      params.push(new Date(end));
    }
    if (clauses.length) return { sql: `AND ${clauses.join(" AND ")}`, params };
  }
  return { sql: "", params: [] };
}

// GET /auth/profile/stats
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, start, end } = req.query;

    // Time filters for created_at where applicable
    const bookmarkTF = buildTimeFilter(range, start, end);
    const searchTF = buildTimeFilter(range, start, end);

    // Bookmarks count (Islamic Library bookmarks table)
    const [[{ bookmarksCount }]] = await db.query(
      `SELECT COUNT(*) AS bookmarksCount FROM islamic_bookmarks WHERE user_id = ? ${bookmarkTF.sql}`,
      [userId, ...bookmarkTF.params]
    );

    // Collections count (distinct from islamic_bookmarks.collection)
    const [[{ collectionsCount }]] = await db.query(
      `SELECT COUNT(DISTINCT collection) AS collectionsCount FROM islamic_bookmarks WHERE user_id = ?`,
      [userId]
    );

    // Searches count (search_history by user)
    const [[{ searchesCount }]] = await db.query(
      `SELECT COUNT(*) AS searchesCount FROM search_history WHERE user_id = ? ${searchTF.sql}`,
      [userId, ...searchTF.params]
    );

    // Last activity across sources (coalesce over timestamps)
    const [[{ lastBookmark }]] = await db.query(
      `SELECT MAX(created_at) AS lastBookmark FROM islamic_bookmarks WHERE user_id = ?`,
      [userId]
    );
    const [[{ lastSearch }]] = await db.query(
      `SELECT MAX(created_at) AS lastSearch FROM search_history WHERE user_id = ?`,
      [userId]
    );
    const [[{ lastUserUpdate }]] = await db.query(
      `SELECT NULL AS lastUserUpdate` // users table may not have updated_at consistently
    );

    const lastActivityAt =
      [lastBookmark, lastSearch, lastUserUpdate]
        .map(
          (r) =>
            (r && (r.lastBookmark || r.lastSearch || r.lastUserUpdate)) || null
        )
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0] || null;

    // Top 5 collections by islamic_bookmarks
    const [topCollectionsRows] = await db.query(
      `SELECT collection AS name, COUNT(*) AS count
       FROM islamic_bookmarks
       WHERE user_id = ?
       GROUP BY collection
       ORDER BY count DESC
       LIMIT 5`,
      [userId]
    );

    return res.json({
      bookmarksCount: Number(bookmarksCount) || 0,
      collectionsCount: Number(collectionsCount) || 0,
      cardsCount: 0,
      searchesCount: Number(searchesCount) || 0,
      lastActivityAt,
      topCollections: topCollectionsRows || [],
    });
  } catch (error) {
    console.error("/auth/profile/stats error:", error);
    return sendError(
      res,
      500,
      "Error fetching profile stats",
      "خطأ في جلب إحصائيات الملف الشخصي"
    );
  }
});

// GET /auth/profile/activity (cursor pagination)
router.get("/activity", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const before = req.query.before ? new Date(req.query.before) : null;

    const timeClause = before ? "AND t.at < ?" : "";
    const params = [userId];

    // Merge islamic_bookmarks (added) and search_history (performed)
    let sql = `
      SELECT * FROM (
        SELECT 
          CONCAT('ib_', ib.id) AS id,
          'islamic_bookmark_added' AS type,
          ib.created_at AS at,
          JSON_OBJECT(
            'collection', ib.collection,
            'type', ib.type,
            'bookSlug', ib.book_slug,
            'chapterNumber', ib.chapter_number,
            'hadithId', ib.hadith_id,
            'hadithNumber', ib.hadith_number
          ) AS meta
        FROM islamic_bookmarks ib
        WHERE ib.user_id = ?
        UNION ALL
        SELECT
          CONCAT('s_', sh.id) AS id,
          'search_performed' AS type,
          sh.created_at AS at,
          JSON_OBJECT(
            'title', sh.title,
            'searchType', sh.search_type,
            'resultsCount', sh.results_count,
            'date', sh.date,
            'time', sh.time
          ) AS meta
        FROM search_history sh
        WHERE sh.user_id = ?
      ) t
      WHERE 1=1 ${timeClause}
      ORDER BY t.at DESC
      LIMIT ?`;

    const queryParams = [userId, userId];
    if (before) queryParams.push(before);
    queryParams.push(limit + 1); // fetch one extra to compute nextCursor

    const [rows] = await db.query(sql, queryParams);

    let nextCursor = null;
    let items = rows;
    if (rows.length > limit) {
      const last = rows[limit - 1];
      nextCursor = last.at;
      items = rows.slice(0, limit);
    }

    return res.json({ items, nextCursor });
  } catch (error) {
    console.error("/auth/profile/activity error:", error);
    return sendError(
      res,
      500,
      "Error fetching profile activity",
      "خطأ في جلب النشاط"
    );
  }
});

// GET /auth/profile/collections (top N from bookmarks)
router.get("/collections", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 5, 100);
    const [rows] = await db.query(
      `SELECT collection AS name, COUNT(*) AS count
       FROM islamic_bookmarks
       WHERE user_id = ?
       GROUP BY collection
       ORDER BY count DESC
       LIMIT ?`,
      [userId, limit]
    );
    return res.json({ collections: rows });
  } catch (error) {
    console.error("/auth/profile/collections error:", error);
    return sendError(
      res,
      500,
      "Error fetching collections",
      "خطأ في جلب المجموعات"
    );
  }
});

// GET /auth/profile/ib-stats - Islamic bookmarks stats
router.get("/ib-stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const top = Math.min(parseInt(req.query.top) || 5, 50);

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM islamic_bookmarks WHERE user_id = ?`,
      [userId]
    );

    const [byType] = await db.query(
      `SELECT type, COUNT(*) AS count
       FROM islamic_bookmarks
       WHERE user_id = ?
       GROUP BY type`,
      [userId]
    );

    const [[{ collectionsCount }]] = await db.query(
      `SELECT COUNT(DISTINCT collection) AS collectionsCount
       FROM islamic_bookmarks
       WHERE user_id = ?`,
      [userId]
    );

    const [topCollections] = await db.query(
      `SELECT collection AS name, COUNT(*) AS count
       FROM islamic_bookmarks
       WHERE user_id = ?
       GROUP BY collection
       ORDER BY count DESC
       LIMIT ?`,
      [userId, top]
    );

    const [topBooks] = await db.query(
      `SELECT book_slug AS slug, COALESCE(book_name, book_slug) AS name, COUNT(*) AS count
       FROM islamic_bookmarks
       WHERE user_id = ? AND book_slug IS NOT NULL AND book_slug <> ''
       GROUP BY book_slug, name
       ORDER BY count DESC
       LIMIT ?`,
      [userId, top]
    );

    return res.json({
      bookmarksTotal: Number(total) || 0,
      byType,
      collectionsCount: Number(collectionsCount) || 0,
      topCollections,
      topBooks,
    });
  } catch (error) {
    console.error("/auth/profile/ib-stats error:", error);
    return sendError(
      res,
      500,
      "Error fetching ib-stats",
      "خطأ في جلب الإحصائيات"
    );
  }
});

// GET /auth/profile/ib-trends - time trends for islamic_bookmarks
router.get("/ib-trends", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, start, end } = req.query;
    const tf = buildTimeFilter(range || "30d", start, end);

    const [daily] = await db.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM islamic_bookmarks
       WHERE user_id = ? ${tf.sql}
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`,
      [userId, ...tf.params]
    );

    const [[{ firstAt }]] = await db.query(
      `SELECT MIN(created_at) AS firstAt FROM islamic_bookmarks WHERE user_id = ?`,
      [userId]
    );
    const [[{ lastAt }]] = await db.query(
      `SELECT MAX(created_at) AS lastAt FROM islamic_bookmarks WHERE user_id = ?`,
      [userId]
    );

    // busiestDay
    let busiestDay = null;
    if (daily.length) {
      busiestDay = daily.reduce((a, b) => (b.count > a.count ? b : a));
    }

    return res.json({
      dailyCounts: daily,
      firstBookmarkAt: firstAt || null,
      lastBookmarkAt: lastAt || null,
      busiestDay,
    });
  } catch (error) {
    console.error("/auth/profile/ib-trends error:", error);
    return sendError(
      res,
      500,
      "Error fetching ib-trends",
      "خطأ في جلب الترندات"
    );
  }
});

// GET /auth/profile/search-summary - search history summary
router.get("/search-summary", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, start, end, limit } = req.query;
    const tf = buildTimeFilter(range, start, end);
    const recentLimit = Math.min(parseInt(limit) || 10, 50);

    const [[{ searchesCount }]] = await db.query(
      `SELECT COUNT(*) AS searchesCount FROM search_history WHERE user_id = ? ${tf.sql}`,
      [userId, ...tf.params]
    );

    const [recentSearches] = await db.query(
      `SELECT id, title, search_type AS searchType, results_count AS resultsCount, date, time, created_at
       FROM search_history
       WHERE user_id = ? ${tf.sql}
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, ...tf.params, recentLimit]
    );

    const [topQueries] = await db.query(
      `SELECT title, COUNT(*) AS count
       FROM search_history
       WHERE user_id = ? ${tf.sql}
       GROUP BY title
       ORDER BY count DESC
       LIMIT 5`,
      [userId, ...tf.params]
    );

    const [topTypes] = await db.query(
      `SELECT search_type AS searchType, COUNT(*) AS count
       FROM search_history
       WHERE user_id = ? ${tf.sql}
       GROUP BY search_type
       ORDER BY count DESC`,
      [userId, ...tf.params]
    );

    const [[{ avgResults }]] = await db.query(
      `SELECT AVG(results_count) AS avgResults
       FROM search_history
       WHERE user_id = ? ${tf.sql}`,
      [userId, ...tf.params]
    );

    return res.json({
      searchesCount: Number(searchesCount) || 0,
      recentSearches,
      topQueries,
      topTypes,
      avgResults: avgResults !== null ? Number(avgResults) : 0,
    });
  } catch (error) {
    console.error("/auth/profile/search-summary error:", error);
    return sendError(
      res,
      500,
      "Error fetching search summary",
      "خطأ في جلب ملخص البحث"
    );
  }
});

module.exports = router;
