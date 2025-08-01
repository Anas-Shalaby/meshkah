// backend/routes/bookmarks.js
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

// Add a bookmark
// backend/routes/bookmarks.js
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const {
      hadith_id,
      collection = "Default",
      notes = "",
      hadith_book = "",
    } = req.body;
    const user_id = req.user.id;

    // Check if bookmark already exists
    const [existingBookmarks] = await db.query(
      "SELECT * FROM bookmarks WHERE user_id = ? AND hadith_id = ?",
      [user_id, hadith_id]
    );

    if (existingBookmarks.length > 0) {
      return res.status(400).json({ message: "Hadith already bookmarked" });
    }

    // Insert new bookmark
    const [result] = await db.query(
      "INSERT INTO bookmarks (user_id, hadith_id, collection, notes, hadith_book) VALUES (?, ?, ?, ?, ?)",
      [user_id, hadith_id, collection, notes, hadith_book]
    );

    res.status(201).json({
      message: "Bookmark added successfully",
      bookmarkId: result.insertId,
    });

    // منطق الإنجازات: أول Bookmark
    const [[{ count }]] = await db.query(
      "SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ?",
      [user_id]
    );
    if (count === 1) {
      const [rows] = await db.query(
        "SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = 2",
        [user_id]
      );
      if (rows.length === 0) {
        await db.query(
          "INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, 2)",
          [user_id]
        );
      }
    }
  } catch (error) {
    console.error("Bookmark add error:", error);
    res.status(500).json({
      message: "Error adding bookmark",
      error: error.message,
    });
  }
});

// Remove a bookmark
router.delete("/remove/:hadith_id", authMiddleware, async (req, res) => {
  try {
    const { hadith_id } = req.params;
    const user_id = req.user.id;

    const [result] = await db.query(
      "DELETE FROM bookmarks WHERE user_id = ? AND hadith_id = ?",
      [user_id, hadith_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Bookmark not found" });
    }

    res.json({ message: "Bookmark removed successfully" });
  } catch (error) {
    console.error("Bookmark remove error:", error);
    res.status(500).json({
      message: "Error removing bookmark",
      error: error.message,
    });
  }
});

// Get user's bookmarks
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { collection } = req.query;

    let query = "SELECT * FROM bookmarks WHERE user_id = ?";
    let queryParams = [user_id];

    if (collection) {
      query += " AND collection = ?";
      queryParams.push(collection);
    }

    const [bookmarks] = await db.query(query, queryParams);
    res.json(bookmarks);
  } catch (error) {
    console.error("Fetch bookmarks error:", error);
    res.status(500).json({
      message: "Error fetching bookmarks",
      error: error.message,
    });
  }
});

module.exports = router;
