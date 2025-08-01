const db = require("../config/database");

// Helper function to calculate scheduled dates
const calculateScheduledDates = (
  startDate,
  endDate,
  hadithsPerDay,
  totalHadiths
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];
  let currentDate = new Date(start);

  for (let i = 0; i < totalHadiths; i++) {
    if (currentDate > end) break;
    dates.push(currentDate.toISOString().split("T")[0]);
    if ((i + 1) % hadithsPerDay === 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return dates;
};

// Create a new memorization plan
const createPlan = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      hadithsPerDay,
      selectedHadiths,
    } = req.body;

    await connection.beginTransaction();

    // Create the plan
    const [plan] = await connection.query(
      "INSERT INTO memorization_plans (user_id, name, description, start_date, end_date, hadiths_per_day) VALUES (?, ?, ?, ?, ?, ?)",
      [req.user.id, name, description, startDate, endDate, hadithsPerDay]
    );

    // Schedule hadiths
    const scheduledDates = calculateScheduledDates(
      startDate,
      endDate,
      hadithsPerDay,
      selectedHadiths.length
    );

    for (let i = 0; i < selectedHadiths.length; i++) {
      await connection.query(
        "INSERT INTO plan_hadiths (plan_id, hadith_id, order_in_plan, scheduled_date) VALUES (?, ?, ?, ?)",
        [plan.insertId, selectedHadiths[i], i + 1, scheduledDates[i]]
      );
    }

    await connection.commit();
    res
      .status(201)
      .json({ message: "Plan created successfully", planId: plan.insertId });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating plan:", error);
    res.status(500).json({ error: "Failed to create plan" });
  } finally {
    connection.release();
  }
};

// Get today's tasks
const getTodayTasks = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Get new hadiths to memorize
    const [newHadiths] = await db.query(
      `SELECT h.*, ph.order_in_plan, ph.plan_id
       FROM plan_hadiths ph
       JOIN hadiths h ON ph.hadith_id = h.id
       JOIN memorization_plans mp ON ph.plan_id = mp.id
       JOIN user_plans up ON mp.id = up.plan_id
       WHERE up.user_id = ? 
       AND up.status = 'active'
       AND NOT EXISTS (
         SELECT 1 FROM memorization_progress mp2 
         WHERE mp2.hadith_id = h.id AND mp2.user_id = ? AND mp2.status = 'memorized'
       )
       ORDER BY ph.order_in_plan`,
      [req.user.id, req.user.id]
    );

    // Get hadiths due for review
    const [reviewHadiths] = await db.query(
      `SELECT h.*, rs.review_type, mp.id as plan_id
       FROM review_schedule rs
       JOIN hadiths h ON rs.hadith_id = h.id
       JOIN memorization_progress mp2 ON rs.hadith_id = mp2.hadith_id AND rs.user_id = mp2.user_id
       JOIN memorization_plans mp ON mp2.plan_id = mp.id
       JOIN user_plans up ON mp.id = up.plan_id
       WHERE rs.user_id = ? 
       AND rs.review_date = ? 
       AND rs.status = 'pending'
       AND up.status = 'active'`,
      [req.user.id, today]
    );

    res.json({ newHadiths, reviewHadiths });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch today's tasks" });
  }
};

// Get user's memorization stats
const getStats = async (req, res) => {
  try {
    // Get total memorized hadiths
    const [memorizedResult] = await db.query(
      'SELECT COUNT(DISTINCT hadith_id) as count FROM memorization_progress WHERE user_id = ? AND status = "memorized"',
      [req.user.id]
    );

    // Get current streak
    const [streakResult] = await db.query(
      `SELECT COUNT(*) as streak
       FROM (
         SELECT DATE(created_at) as date
         FROM memorization_progress
         WHERE user_id = ?
         GROUP BY DATE(created_at)
         ORDER BY date DESC
       ) as dates`,
      [req.user.id]
    );

    // Get total points
    const [pointsResult] = await db.query(
      "SELECT points FROM user_points WHERE user_id = ?",
      [req.user.id]
    );

    // Calculate level based on points
    const level = Math.floor((pointsResult[0]?.points || 0) / 100) + 1;

    res.json({
      memorizedHadiths: memorizedResult[0].count,
      currentStreak: streakResult[0].streak,
      totalPoints: pointsResult[0]?.points || 0,
      level,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

// Get progress chart data
const getProgressChart = async (req, res) => {
  try {
    const [progressData] = await db.query(
      `SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN status = 'memorized' THEN 1 ELSE 0 END) as memorized,
        SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed
       FROM memorization_progress
       WHERE user_id = ?
       AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [req.user.id]
    );

    res.json(progressData);
  } catch (error) {
    console.error("Error fetching progress data:", error);
    res.status(500).json({ error: "Failed to fetch progress data" });
  }
};

// Complete a hadith task
const completeHadithTask = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { hadithId } = req.params;
    const { type } = req.params;
    const { plan_id, confidenceLevel, notes } = req.body;

    await connection.beginTransaction();

    // Record progress
    await connection.query(
      "INSERT INTO memorization_progress (user_id, hadith_id, plan_id, status, confidence_level, notes) VALUES (?, ?, ?, ?, ?, ?)",
      [req.user.id, hadithId, plan_id, type, confidenceLevel, notes]
    );

    // Update points
    const pointsEarned = type === "memorize" ? 10 : 5;
    await connection.query(
      "UPDATE user_points SET points = points + ? WHERE user_id = ?",
      [pointsEarned, req.user.id]
    );

    // If memorizing, schedule reviews
    if (type === "memorize") {
      const reviewDates = [
        new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      ];

      for (const date of reviewDates) {
        await connection.query(
          "INSERT INTO review_schedule (user_id, hadith_id, plan_id, review_date, review_type) VALUES (?, ?, ?, ?, ?)",
          [req.user.id, hadithId, planId, date, "review"]
        );
      }
    }

    await connection.commit();
    res.json({ message: "Task completed successfully", pointsEarned });
  } catch (error) {
    await connection.rollback();
    console.error("Error completing task:", error);
    res.status(500).json({ error: "Failed to complete task" });
  } finally {
    connection.release();
  }
};

// Get available hadiths for plan creation
const getAvailableHadiths = async (req, res) => {
  try {
    const [hadiths] = await db.query(
      `SELECT id, title, hadith_text, hadith_text_ar
       FROM hadiths
       WHERE id NOT IN (
         SELECT hadith_id
         FROM memorization_progress
         WHERE user_id = ? AND status = 'memorized'
       )
       ORDER BY id ASC
       LIMIT 100`,
      [req.user.id]
    );

    res.json(hadiths);
  } catch (error) {
    console.error("Error fetching hadiths:", error);
    res.status(500).json({ error: "Failed to fetch hadiths" });
  }
};

module.exports = {
  createPlan,
  getTodayTasks,
  getStats,
  getProgressChart,
  completeHadithTask,
  getAvailableHadiths,
};
