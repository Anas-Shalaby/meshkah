// /Users/shalbyyousef/Desktop/Meshkah/backend/routes/admin.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const {
  authMiddleware,
  restrictTo,
  adminMiddleware,
} = require("../middleware/authMiddleware");
const { body } = require("express-validator");
const db = require("../config/database");
const mailService = require("../services/mailService");

// Get plan details
router.get(
  "/memorization/plan/:id",
  authMiddleware,
  restrictTo("admin"),
  async (req, res) => {
    try {
      const planId = parseInt(req.params.id);

      if (isNaN(planId)) {
        return res.status(400).json({
          error: "معرف الخطة غير صالح",
        });
      }

      // Get plan details with counts and dates from user_plans
      const [plans] = await db.query(
        `SELECT mp.*, 
              COUNT(DISTINCT ph.id) as total_hadiths,
              COUNT(DISTINCT CASE WHEN ph.status = 'memorized' THEN ph.id END) as memorized_hadiths,
              COUNT(DISTINCT up.user_id) as user_count,
              MIN(up.start_date) as start_date,
              MAX(up.end_date) as end_date
       FROM memorization_plans mp
       LEFT JOIN plan_hadiths ph ON mp.id = ph.plan_id
       LEFT JOIN user_plans up ON mp.id = up.plan_id
       WHERE mp.id = ?
       GROUP BY mp.id`,
        [planId]
      );

      if (plans.length === 0) {
        return res.status(404).json({
          error: "الخطة غير موجودة",
        });
      }

      const plan = plans[0];

      // Get plan hadiths
      const [hadiths] = await db.query(
        `SELECT h.*, ph.order_in_plan, ph.status as plan_status
         FROM plan_hadiths ph
         JOIN hadiths h ON ph.hadith_id = h.id
         WHERE ph.plan_id = ?
         ORDER BY ph.order_in_plan`,
        [planId]
      );

      // Get plan users with their start and end dates
      const [users] = await db.query(
        `SELECT u.id, u.username, u.email, up.start_date, up.end_date
         FROM users u
         JOIN user_plans up ON u.id = up.user_id
         WHERE up.plan_id = ?`,
        [planId]
      );

      const response = {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        start_date: plan.start_date,
        end_date: plan.end_date,
        hadiths_per_day: plan.hadiths_per_day,
        created_at: plan.created_at,
        status: plan.status,
        user_count: plan.user_count,
        total_hadiths: plan.total_hadiths,
        memorized_hadiths: plan.memorized_hadiths,
        hadiths: hadiths,
        users: users,
      };

      res.json({ data: { plan: response } });
    } catch (error) {
      console.error("Error fetching plan details:", error);
      res.status(500).json({
        error: "حدث خطأ أثناء جلب تفاصيل الخطة",
      });
    }
  }
);

// User Management Routes
router.get(
  "/users",
  authMiddleware,
  restrictTo("admin"),
  adminController.getAllUsers
);

router.get(
  "/users/stats",
  authMiddleware,
  restrictTo("admin"),
  adminController.getUserStats
);

router.patch(
  "/users/:id",
  authMiddleware,
  restrictTo("admin"),
  [
    body("role").optional().isIn(["user", "admin"]),
    body("active").optional().isBoolean(),
  ],
  adminController.updateUser
);

router.delete(
  "/users/:id",
  authMiddleware,
  restrictTo("admin"),
  adminController.deleteUser
);

// Content Management Routes
router.get(
  "/content/stats",
  authMiddleware,
  restrictTo("admin"),
  adminController.getContentStats
);

// Analytics Routes
router.get("/analytics/dashboard", adminController.getDashboardAnalytics);

// Get dashboard statistics
router.get(
  "/stats",
  [authMiddleware, restrictTo("admin")],
  async (req, res) => {
    try {
      const [totalUsers] = await db.query(
        "SELECT COUNT(*) as count FROM users"
      );
      const [totalPrintRequests] = await db.query(
        "SELECT COUNT(*) as count FROM print_requests"
      );
      const [pendingRequests] = await db.query(
        "SELECT COUNT(*) as count FROM print_requests WHERE status = 'pending'"
      );
      const [completedRequests] = await db.query(
        "SELECT COUNT(*) as count FROM print_requests WHERE status = 'approved'"
      );

      res.json({
        totalUsers: totalUsers[0].count,
        totalPrintRequests: totalPrintRequests[0].count,
        pendingRequests: pendingRequests[0].count,
        completedRequests: completedRequests[0].count,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "خطأ في جلب إحصائيات لوحة التحكم" });
    }
  }
);

// Get all memorization plans
router.get(
  "/memorization/plans",
  authMiddleware,
  restrictTo("admin"),
  async (req, res) => {
    try {
      const [plans] = await db.query(
        `SELECT mp.*, 
              COUNT(DISTINCT ph.id) as total_hadiths,
              COUNT(DISTINCT CASE WHEN ph.status = 'memorized' THEN ph.id END) as memorized_hadiths,
              COUNT(DISTINCT up.user_id) as user_count
       FROM memorization_plans mp
       LEFT JOIN plan_hadiths ph ON mp.id = ph.plan_id
       LEFT JOIN user_plans up ON mp.id = up.plan_id
       GROUP BY mp.id
       ORDER BY mp.created_at DESC`
      );

      res.json({ data: { plans } });
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  }
);

// Create new memorization plan
router.post(
  "/memorization/plans",
  authMiddleware,
  restrictTo("admin"),
  async (req, res) => {
    const connection = await db.getConnection();
    try {
      const { name, description, hadithsPerDay, selectedHadiths, quiz_link } =
        req.body;

      await connection.beginTransaction();

      // Create the plan
      const [plan] = await connection.query(
        `INSERT INTO memorization_plans 
       (name, description, hadiths_per_day , quiz_link , total_hadiths) 
       VALUES (?, ?, ?, ? , ?)`,
        [name, description, 1, quiz_link, selectedHadiths.length]
      );

      // Add hadiths to the plan
      for (let i = 0; i < selectedHadiths.length; i++) {
        await connection.query(
          `INSERT INTO plan_hadiths 
         (plan_id, hadith_id, order_in_plan) 
         VALUES (?, ?, ?)`,
          [plan.insertId, selectedHadiths[i], i + 1]
        );
      }

      await connection.commit();
      res.status(201).json({
        message: "Plan created successfully",
        planId: plan.insertId,
      });
    } catch (error) {
      await connection.rollback();
      console.error("Error creating plan:", error);
      res.status(500).json({ error: "Failed to create plan" });
    } finally {
      connection.release();
    }
  }
);

// Update memorization plan
router.put(
  "/memorization/plans/:id",
  authMiddleware,
  restrictTo("admin"),
  async (req, res) => {
    const connection = await db.getConnection();
    try {
      const { id } = req.params;
      const {
        name,
        description,
        startDate,
        endDate,
        hadithsPerDay,
        selectedHadiths,
      } = req.body;

      await connection.beginTransaction();

      // Update plan details
      await connection.query(
        `UPDATE memorization_plans 
       SET name = ?, description = ?, start_date = ?, end_date = ?, hadiths_per_day = ?
       WHERE id = ?`,
        [name, description, startDate, endDate, hadithsPerDay, id]
      );

      // If hadiths are provided, update them
      if (selectedHadiths) {
        // Delete existing hadiths
        await connection.query("DELETE FROM plan_hadiths WHERE plan_id = ?", [
          id,
        ]);

        // Schedule new hadiths
        const scheduledDates = calculateScheduledDates(
          startDate,
          endDate,
          hadithsPerDay,
          selectedHadiths.length
        );

        for (let i = 0; i < selectedHadiths.length; i++) {
          await connection.query(
            `INSERT INTO plan_hadiths 
           (plan_id, hadith_id, order_in_plan, scheduled_date) 
           VALUES (?, ?, ?, ?)`,
            [id, selectedHadiths[i], i + 1, scheduledDates[i]]
          );
        }
      }

      await connection.commit();
      res.json({ message: "Plan updated successfully" });
    } catch (error) {
      await connection.rollback();
      console.error("Error updating plan:", error);
      res.status(500).json({ error: "Failed to update plan" });
    } finally {
      connection.release();
    }
  }
);

// Delete memorization plan
router.delete(
  "/memorization/plans/:id",
  authMiddleware,
  restrictTo("admin"),
  async (req, res) => {
    const connection = await db.getConnection();
    try {
      const { id } = req.params;

      await connection.beginTransaction();

      // Delete related records first
      await connection.query("DELETE FROM plan_hadiths WHERE plan_id = ?", [
        id,
      ]);
      await connection.query("DELETE FROM user_plans WHERE plan_id = ?", [id]);
      await connection.query(
        "DELETE FROM memorization_progress WHERE plan_id = ?",
        [id]
      );

      // Delete the plan
      await connection.query("DELETE FROM memorization_plans WHERE id = ?", [
        id,
      ]);

      await connection.commit();
      res.json({ message: "Plan deleted successfully" });
    } catch (error) {
      await connection.rollback();
      console.error("Error deleting plan:", error);
      res.status(500).json({ error: "Failed to delete plan" });
    } finally {
      connection.release();
    }
  }
);

// Get available hadiths for plan creation
router.get(
  "/memorization/available-hadiths",
  authMiddleware,
  restrictTo("admin"),
  async (req, res) => {
    try {
      const [hadiths] = await db.query(
        `SELECT id, title_ar, hadith_text_ar
       FROM hadiths
       ORDER BY id ASC`
      );

      res.json({ data: hadiths });
    } catch (error) {
      console.error("Error fetching hadiths:", error);
      res.status(500).json({ error: "Failed to fetch hadiths" });
    }
  }
);

// Assign plan to user
router.post(
  "/memorization/plans/:planId/assign",
  authMiddleware,
  restrictTo("admin"),
  async (req, res) => {
    const connection = await db.getConnection();
    try {
      const { planId } = req.params;
      const { userId } = req.body;

      await connection.beginTransaction();

      // Check if user already has this plan
      const [existing] = await connection.query(
        "SELECT id FROM user_plans WHERE user_id = ? AND plan_id = ?",
        [userId, planId]
      );

      if (existing.length > 0) {
        throw new Error("User already has this plan");
      }

      // Assign plan to user
      await connection.query(
        "INSERT INTO user_plans (user_id, plan_id) VALUES (?, ?)",
        [userId, planId]
      );

      await connection.commit();
      res.json({ message: "Plan assigned successfully" });
    } catch (error) {
      await connection.rollback();
      console.error("Error assigning plan:", error);
      res.status(500).json({ error: error.message || "Failed to assign plan" });
    } finally {
      connection.release();
    }
  }
);

// get plan user
router.get(
  "/memorization/plan-users/:planId",
  authMiddleware,
  restrictTo("admin"),
  async (req, res) => {
    const { planId } = req.params;
    try {
      const [planUsers] = await db.query(
        `SELECT up.user_id, u.username, u.email
       FROM user_plans up
       JOIN users u ON up.user_id = u.id
       WHERE up.plan_id = ?`,
        [planId]
      );

      res.json(planUsers);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  }
);

// Helper function to calculate scheduled dates
function calculateScheduledDates(
  startDate,
  endDate,
  hadithsPerDay,
  totalHadiths
) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const dates = [];

  let currentDate = new Date(start);
  let hadithsScheduled = 0;

  while (currentDate <= end && hadithsScheduled < totalHadiths) {
    for (let i = 0; i < hadithsPerDay && hadithsScheduled < totalHadiths; i++) {
      dates.push(currentDate.toISOString().split("T")[0]);
      hadithsScheduled++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

// Get plan analytics
router.get(
  "/memorization/plans/:id/analytics",
  authMiddleware,
  restrictTo("admin"),
  async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      // Get plan details with counts
      const [planDetails] = await db.query(
        `SELECT mp.*, 
          COUNT(DISTINCT ph.id) as total_hadiths,
          COUNT(DISTINCT up.user_id) as total_users
        FROM memorization_plans mp
        LEFT JOIN plan_hadiths ph ON mp.id = ph.plan_id
        LEFT JOIN user_plans up ON mp.id = up.plan_id
        WHERE mp.id = ?
        GROUP BY mp.id`,
        [planId]
      );

      if (!planDetails[0]) {
        return res.status(404).json({ error: "Plan not found" });
      }

      const plan = planDetails[0];

      // Get active users (users who have completed at least one hadith in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [activeUsers] = await db.query(
        `SELECT COUNT(DISTINCT up.user_id) as count
        FROM user_plans up
        JOIN memorization_progress mp ON up.user_id = mp.user_id
        WHERE up.plan_id = ? AND mp.updated_at >= ?`,
        [planId, thirtyDaysAgo]
      );

      // Get completed hadiths
      const [completedHadiths] = await db.query(
        `SELECT COUNT(*) as count
        FROM memorization_progress
        WHERE plan_id = ? AND status = 'completed'`,
        [planId]
      );

      // Get daily progress for the last 30 days
      const [dailyProgress] = await db.query(
        `SELECT DATE(updated_at) as date, COUNT(*) as completed_hadiths
        FROM memorization_progress
        WHERE plan_id = ? 
        AND status = 'completed'
        AND updated_at >= ?
        GROUP BY DATE(updated_at)
        ORDER BY date ASC`,
        [planId, thirtyDaysAgo]
      );

      // Get top 10 users' progress
      const [userProgress] = await db.query(
        `SELECT 
          u.id as user_id,
          u.username,
          COUNT(mp.id) as completed_hadiths,
          MAX(mp.updated_at) as last_activity
        FROM users u
        JOIN user_plans up ON u.id = up.user_id
        LEFT JOIN memorization_progress mp ON u.id = mp.user_id AND mp.plan_id = ?
        WHERE up.plan_id = ?
        GROUP BY u.id, u.username
        ORDER BY completed_hadiths DESC
        LIMIT 10`,
        [planId, planId]
      );

      // Calculate average completion rate
      const totalPossibleCompletions = plan.total_users * plan.total_hadiths;
      const averageCompletionRate =
        totalPossibleCompletions > 0
          ? (completedHadiths[0].count / totalPossibleCompletions) * 100
          : 0;

      return res.json({
        total_users: plan.total_users,
        active_users: activeUsers[0].count,
        completed_hadiths: completedHadiths[0].count,
        total_hadiths: plan.total_hadiths,
        average_completion_rate: Math.round(averageCompletionRate * 100) / 100,
        daily_progress: dailyProgress.map((day) => ({
          date: day.date.toISOString().split("T")[0],
          completed_hadiths: day.completed_hadiths,
        })),
        user_progress: userProgress.map((user) => ({
          user_id: user.user_id,
          username: user.username,
          completed_hadiths: user.completed_hadiths,
          last_activity: user.last_activity,
        })),
      });
    } catch (error) {
      console.error("Error fetching plan analytics:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// إضافة route استقبال رسائل التواصل
router.post("/contact-us", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "جميع الحقول مطلوبة" });
    }
    const subject = `رسالة تواصل جديدة من الموقع: ${name}`;
    const html = `
      <div dir="rtl" style="font-family: 'Cairo', 'Amiri', Arial, sans-serif;">
        <h2>رسالة تواصل جديدة من الموقع</h2>
        <p><strong>الاسم:</strong> ${name}</p>
        <p><strong>البريد الإلكتروني:</strong> ${email}</p>
        <p><strong>الرسالة:</strong></p>
        <div style="background:#f8f7fa;padding:16px;border-radius:8px;margin-top:8px;">${message.replace(
          /\n/g,
          "<br>"
        )}</div>
      </div>
    `;
    await mailService.sendMail(
      "Meshkah@hadith-shareef.com",
      subject,
      message,
      html
    );
    res.json({ message: "تم إرسال الرسالة بنجاح!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ message: "حدث خطأ أثناء إرسال الرسالة" });
  }
});

module.exports = router;
