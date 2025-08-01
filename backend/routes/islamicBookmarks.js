const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db = require("../config/database");

const authMiddleware = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

// Add Islamic Library Bookmark
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const {
      type, // 'book', 'chapter', 'hadith'
      bookSlug,
      bookName,
      bookNameEn,
      bookNameUr,
      chapterNumber,
      chapterName,
      chapterNameEn,
      chapterNameUr,
      hadithId,
      hadithNumber,
      hadithText,
      hadithTextEn,
      hadithTextUr,
      collection = "Default",
      notes = "",
      isLocal = false,
    } = req.body;

    const user_id = req.user.id;

    // Check if bookmark already exists
    const [existingBookmarks] = await db.query(
      "SELECT * FROM islamic_bookmarks WHERE user_id = ? AND book_slug = ? AND type = ? AND (chapter_number = ? OR hadith_id = ?)",
      [user_id, bookSlug, type, chapterNumber || null, hadithId || null]
    );

    if (existingBookmarks.length > 0) {
      return res.status(400).json({ message: "Item already bookmarked" });
    }

    // Insert new bookmark
    const [result] = await db.query(
      `INSERT INTO islamic_bookmarks (
        user_id, type, book_slug, book_name, book_name_en, book_name_ur,
        chapter_number, chapter_name, chapter_name_en, chapter_name_ur,
        hadith_id, hadith_number, hadith_text, hadith_text_en, hadith_text_ur,
        collection, notes, is_local, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        user_id,
        type,
        bookSlug,
        bookName,
        bookNameEn,
        bookNameUr,
        chapterNumber,
        chapterName,
        chapterNameEn,
        chapterNameUr,
        hadithId,
        hadithNumber,
        hadithText,
        hadithTextEn,
        hadithTextUr,
        collection,
        notes,
        isLocal,
      ]
    );

    res.status(201).json({
      message: "Islamic bookmark added successfully",
      bookmarkId: result.insertId,
    });

    // Check for achievements
    const [[{ count }]] = await db.query(
      "SELECT COUNT(*) as count FROM islamic_bookmarks WHERE user_id = ?",
      [user_id]
    );

    // Book collector achievement (10 books)
    if (type === "book") {
      const [[{ bookCount }]] = await db.query(
        "SELECT COUNT(DISTINCT book_slug) as bookCount FROM islamic_bookmarks WHERE user_id = ? AND type = 'book'",
        [user_id]
      );
    }
  } catch (error) {
    console.error("Islamic bookmark add error:", error);
    res.status(500).json({
      message: "Error adding Islamic bookmark",
      error: error.message,
    });
  }
});

// Remove Islamic Library Bookmark
router.delete("/remove/:bookmarkId", authMiddleware, async (req, res) => {
  try {
    const { bookmarkId } = req.params;
    const user_id = req.user.id;

    const [result] = await db.query(
      "DELETE FROM islamic_bookmarks WHERE id = ? AND user_id = ?",
      [bookmarkId, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Bookmark not found" });
    }

    res.json({ message: "Islamic bookmark removed successfully" });
  } catch (error) {
    console.error("Islamic bookmark remove error:", error);
    res.status(500).json({
      message: "Error removing Islamic bookmark",
      error: error.message,
    });
  }
});

// Get user's Islamic bookmarks
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { type, collection, page = 1, limit = 20 } = req.query;

    let query = "SELECT * FROM islamic_bookmarks WHERE user_id = ?";
    let params = [user_id];

    if (type) {
      query += " AND type = ?";
      params.push(type);
    }

    if (collection && collection !== "all") {
      query += " AND collection = ?";
      params.push(collection);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [bookmarks] = await db.query(query, params);

    // Get total count for pagination
    let countQuery =
      "SELECT COUNT(*) as total FROM islamic_bookmarks WHERE user_id = ?";
    let countParams = [user_id];

    if (type) {
      countQuery += " AND type = ?";
      countParams.push(type);
    }

    if (collection && collection !== "all") {
      countQuery += " AND collection = ?";
      countParams.push(collection);
    }

    const [[{ total }]] = await db.query(countQuery, countParams);

    res.json({
      bookmarks,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get Islamic bookmarks error:", error);
    res.status(500).json({
      message: "Error fetching Islamic bookmarks",
      error: error.message,
    });
  }
});

// Get user's collections
router.get("/collections", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;

    const [collections] = await db.query(
      "SELECT DISTINCT collection, COUNT(*) as count FROM islamic_bookmarks WHERE user_id = ? GROUP BY collection ORDER BY count DESC",
      [user_id]
    );

    res.json({ collections });
  } catch (error) {
    console.error("Get collections error:", error);
    res.status(500).json({
      message: "Error fetching collections",
      error: error.message,
    });
  }
});

// Update bookmark notes
router.put("/update/:bookmarkId", authMiddleware, async (req, res) => {
  try {
    const { bookmarkId } = req.params;
    const { notes, collection } = req.body;
    const user_id = req.user.id;

    const [result] = await db.query(
      "UPDATE islamic_bookmarks SET notes = ?, collection = ?, updated_at = NOW() WHERE id = ? AND user_id = ?",
      [notes, collection, bookmarkId, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Bookmark not found" });
    }

    res.json({ message: "Bookmark updated successfully" });
  } catch (error) {
    console.error("Update bookmark error:", error);
    res.status(500).json({
      message: "Error updating bookmark",
      error: error.message,
    });
  }
});

// Check if item is bookmarked
router.get("/check", authMiddleware, async (req, res) => {
  try {
    const { bookSlug, type, chapterNumber, hadithId } = req.query;
    const user_id = req.user.id;

    let query =
      "SELECT * FROM islamic_bookmarks WHERE user_id = ? AND book_slug = ? AND type = ?";
    let params = [user_id, bookSlug, type];

    if (chapterNumber) {
      query += " AND chapter_number = ?";
      params.push(chapterNumber);
    }

    if (hadithId) {
      query += " AND hadith_id = ?";
      params.push(hadithId);
    }

    const [bookmarks] = await db.query(query, params);

    res.json({
      isBookmarked: bookmarks.length > 0,
      bookmark: bookmarks[0] || null,
    });
  } catch (error) {
    console.error("Check bookmark error:", error);
    res.status(500).json({
      message: "Error checking bookmark",
      error: error.message,
    });
  }
});

module.exports = router;
