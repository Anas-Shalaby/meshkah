const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { authMiddleware } = require("../middleware/authMiddleware");

const sendError = (res, status, message, messageAr = null) => {
  const response = {
    success: false,
    status: status,
    message: message,
  };
  if (messageAr) {
    response.messageAr = messageAr;
  }
  return res.status(status).json(response);
};
// Middleware للتحقق من صحة البيانات
const validateSearchHistory = (req, res, next) => {
  const { title, time, date } = req.body;

  if (!title || !time || !date) {
    return res.status(400).json({
      success: false,
      message: "المطلوب: title, time, date",
    });
  }

  // التحقق من صحة التاريخ والوقت
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^\d{2}:\d{2}:\d{2}$/;

  if (!dateRegex.test(date)) {
    return res.status(400).json({
      success: false,
      message: "تنسيق التاريخ يجب أن يكون: YYYY-MM-DD",
    });
  }

  if (!timeRegex.test(time)) {
    return res.status(400).json({
      success: false,
      message: "تنسيق الوقت يجب أن يكون: HH:MM:SS",
    });
  }

  next();
};

// إضافة بحث جديد للتاريخ
router.post("/", authMiddleware, validateSearchHistory, async (req, res) => {
  try {
    const user_id = req.user.id; // جلب user_id من الـ token
    const {
      title,
      time,
      date,
      search_type = "hadith",
      results_count = 0,
    } = req.body;

    // التحقق من عدم وجود نفس البحث في نفس اليوم
    const [existing] = await db.query(
      `SELECT id FROM search_history 
       WHERE user_id = ? AND title = ? AND date = ? 
       LIMIT 1`,
      [user_id, title, date]
    );

    if (existing.length > 0) {
      // تحديث وقت البحث الموجود
      await db.query(
        `UPDATE search_history 
         SET time = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [time, existing[0].id]
      );

      return res.status(200).json({
        success: true,
        message: "تم تحديث وقت البحث",
        data: { id: existing[0].id },
      });
    }

    // إضافة بحث جديد
    const [result] = await db.query(
      `INSERT INTO search_history 
       (user_id, title, search_type, results_count, time, date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, title, search_type, results_count, time, date]
    );

    res.status(201).json({
      success: true,
      message: "تم إضافة البحث بنجاح",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("خطأ في إضافة البحث:", error);
    sendError(res, 500, "Error adding search", "حدث خطأ أثناء إضافة البحث");
  }
});

// حذف كل تاريخ البحث للمستخدم
router.delete("/user", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id; // جلب user_id من الـ token
    const { confirm = false } = req.body;

    if (!confirm) {
      return sendError(res, 400, "Confirmation is required", "التأكيد مطلوب");
    }

    const [result] = await db.query(
      "DELETE FROM search_history WHERE user_id = ?",
      [user_id]
    );

    res.json({
      success: true,
      message: `تم حذف ${result.affectedRows} بحث بنجاح`,
      deleted_count: result.affectedRows,
    });
  } catch (error) {
    console.error("خطأ في حذف تاريخ البحث:", error);
    sendError(
      res,
      500,
      "Error deleting search history",
      "حدث خطأ أثناء حذف تاريخ البحث"
    );
  }
});
// جلب تاريخ البحث للمستخدم
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id; // جلب user_id من الـ token
    const {
      limit = 50,
      offset = 0,
      date_from,
      date_to,
      search_type,
      sort = "DESC", // ASC أو DESC
    } = req.query;

    let query = `
      SELECT id, title, search_type, results_count, 
             time, date, created_at, updated_at
      FROM search_history 
      WHERE user_id = ?
    `;

    const params = [user_id];

    // فلترة حسب التاريخ
    if (date_from) {
      query += " AND date >= ?";
      params.push(date_from);
    }

    if (date_to) {
      query += " AND date <= ?";
      params.push(date_to);
    }

    // فلترة حسب نوع البحث
    if (search_type) {
      query += " AND search_type = ?";
      params.push(search_type);
    }

    // ترتيب النتائج
    query += ` ORDER BY date ${sort}, time ${sort}`;

    // تحديد عدد النتائج
    query += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [results] = await db.query(query, params);

    // جلب العدد الإجمالي للنتائج
    let countQuery =
      "SELECT COUNT(*) as total FROM search_history WHERE user_id = ?";
    const countParams = [user_id];

    if (date_from) {
      countQuery += " AND date >= ?";
      countParams.push(date_from);
    }

    if (date_to) {
      countQuery += " AND date <= ?";
      countParams.push(date_to);
    }

    if (search_type) {
      countQuery += " AND search_type = ?";
      countParams.push(search_type);
    }

    const [countResult] = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: results,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: results.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.error("خطأ في جلب تاريخ البحث:", error);
    sendError(
      res,
      500,
      "Error fetching search history",
      "حدث خطأ أثناء جلب تاريخ البحث"
    );
  }
});

// جلب الإحصائيات
router.get("/user/stats", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id; // جلب user_id من الـ token
    const { days = 30 } = req.query;

    // إحصائيات عامة
    const [totalSearches] = await db.query(
      "SELECT COUNT(*) as total FROM search_history WHERE user_id = ?",
      [user_id]
    );

    // إحصائيات آخر X يوم
    const [recentSearches] = await db.query(
      `SELECT COUNT(*) as total 
       FROM search_history 
       WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [user_id, days]
    );

    // أكثر الكلمات بحثاً
    const [topSearches] = await db.query(
      `SELECT title, COUNT(*) as count 
       FROM search_history 
       WHERE user_id = ? 
       GROUP BY title 
       ORDER BY count DESC 
       LIMIT 10`,
      [user_id]
    );

    // إحصائيات حسب نوع البحث
    const [searchTypes] = await db.query(
      `SELECT search_type, COUNT(*) as count 
       FROM search_history 
       WHERE user_id = ? 
       GROUP BY search_type`,
      [user_id]
    );

    // إحصائيات حسب اليوم
    const [dailyStats] = await db.query(
      `SELECT DATE(date) as date, COUNT(*) as count 
       FROM search_history 
       WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(date) 
       ORDER BY date DESC`,
      [user_id, days]
    );

    res.json({
      success: true,
      data: {
        total_searches: totalSearches[0].total,
        recent_searches: recentSearches[0].total,
        top_searches: topSearches,
        search_types: searchTypes,
        daily_stats: dailyStats,
        period_days: parseInt(days),
      },
    });
  } catch (error) {
    console.error("خطأ في جلب الإحصائيات:", error);
    sendError(
      res,
      500,
      "Error fetching statistics",
      "حدث خطأ أثناء جلب الإحصائيات"
    );
  }
});

// حذف بحث محدد
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id; // جلب user_id من الـ token

    // التحقق من وجود البحث
    const [search] = await db.query(
      "SELECT id FROM search_history WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    if (search.length === 0) {
      return sendError(res, 404, "Search not found", "البحث غير موجود");
    }

    await db.query("DELETE FROM search_history WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "تم حذف البحث بنجاح",
    });
  } catch (error) {
    console.error("خطأ في حذف البحث:", error);
    sendError(res, 500, "Error deleting search", "حدث خطأ أثناء حذف البحث");
  }
});

module.exports = router;
