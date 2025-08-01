const express = require("express");
const router = express.Router();
const db = require("../config/database");
const {
  generateMemorizationSchedule,
  updateStreak,
} = require("../utils/helper");
const { authMiddleware } = require("../middleware/authMiddleware");

// Create new memorization plan
router.post("/plans", authMiddleware, async (req, res) => {
  try {
    const { name, description, startDate, endDate, hadithsPerDay, hadithIds } =
      req.body;

    const [plan] = await db.query(
      "INSERT INTO memorization_plans (user_id, name, description, start_date, end_date, hadiths_per_day) VALUES (?, ?, ?, ?, ?, ?)",
      [req.user.id, name, description, startDate, endDate, hadithsPerDay]
    );

    // Schedule hadiths
    const scheduledDates = calculateScheduledDates(
      startDate,
      endDate,
      hadithsPerDay,
      hadithIds.length
    );

    for (let i = 0; i < hadithIds.length; i++) {
      await db.query(
        "INSERT INTO plan_hadiths (plan_id, hadith_id, order_in_plan, scheduled_date) VALUES (?, ?, ?, ?)",
        [plan.insertId, hadithIds[i], i + 1, scheduledDates[i]]
      );
    }

    res
      .status(201)
      .json({ message: "Plan created successfully", planId: plan.insertId });
  } catch (error) {
    res.status(500).json({ error: "Failed to create plan" });
  }
});

// Get today's tasks
router.get("/tasks/today", authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Get new hadiths to memorize
    const [newHadiths] = await db.query(
      `
      SELECT h.*, ph.order_in_plan
      FROM plan_hadiths ph
      JOIN hadiths h ON ph.hadith_id = h.id
      JOIN memorization_plans mp ON ph.plan_id = mp.id
      WHERE mp.user_id = ? AND ph.scheduled_date = ? AND mp.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM memorization_progress mp2 
        WHERE mp2.hadith_id = h.id AND mp2.user_id = ? AND mp2.status = 'memorized'
      )
    `,
      [req.user.id, today, req.user.id]
    );

    // Get hadiths due for review
    const [reviewHadiths] = await db.query(
      `
      SELECT h.*, rs.review_type
      FROM review_schedule rs
      JOIN hadiths h ON rs.hadith_id = h.id
      WHERE rs.user_id = ? AND rs.review_date = ? AND rs.status = 'pending'
    `,
      [req.user.id, today]
    );

    res.json({ newHadiths, reviewHadiths });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch today's tasks" });
  }
});

// Mark hadith as memorized
router.post("/hadith/:id/memorize", authMiddleware, async (req, res) => {
  try {
    const { planId, confidenceLevel, notes } = req.body;
    const hadithId = req.params.id;

    await db.query(
      `
      INSERT INTO memorization_progress 
      (user_id, hadith_id, plan_id, status, confidence_level, notes)
      VALUES (?, ?, ?, 'memorized', ?, ?)
      ON DUPLICATE KEY UPDATE
      status = 'memorized',
      confidence_level = ?,
      notes = ?
    `,
      [
        req.user.id,
        hadithId,
        planId,
        confidenceLevel,
        notes,
        confidenceLevel,
        notes,
      ]
    );

    // Schedule first review
    const firstReviewDate = new Date();
    firstReviewDate.setDate(firstReviewDate.getDate() + 2);

    await db.query(
      `
      INSERT INTO review_schedule 
      (user_id, hadith_id, review_date, review_type)
      VALUES (?, ?, ?, '2_days')
    `,
      [req.user.id, hadithId, firstReviewDate]
    );

    res.json({ message: "Hadith marked as memorized" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update progress" });
  }
});

// Get progress statistics
router.get("/progress/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [stats] = await db.query(
      `SELECT 
         COUNT(CASE WHEN status = 'memorized' THEN 1 END) as memorized_count,
         COUNT(*) as total_count,
         (SELECT current_streak FROM memorization_streaks WHERE user_id = ?) as current_streak,
         (SELECT longest_streak FROM memorization_streaks WHERE user_id = ?) as longest_streak
       FROM memorization_progress 
       WHERE user_id = ?`,
      [userId, userId, userId]
    );

    res.json({
      ...stats[0],
      percentage: Math.round(
        (stats[0].memorized_count / stats[0].total_count) * 100
      ),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
