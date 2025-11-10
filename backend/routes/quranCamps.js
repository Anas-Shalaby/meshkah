const express = require("express");
const router = express.Router();
// بسيط: محدد معدل طلبات ذاكرة مؤقتة لكل مستخدم لمسارات إكمال المهام
const completionRateLimiter = (() => {
  const userHits = new Map(); // key: userId, value: { count, resetAt }
  const WINDOW_MS = 10 * 1000; // نافذة 10 ثوانٍ
  const MAX_HITS = 5; // 5 طلبات في النافذة
  return function (req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) return next();
      const now = Date.now();
      const entry = userHits.get(userId) || {
        count: 0,
        resetAt: now + WINDOW_MS,
      };
      if (now > entry.resetAt) {
        entry.count = 0;
        entry.resetAt = now + WINDOW_MS;
      }
      entry.count += 1;
      userHits.set(userId, entry);
      if (entry.count > MAX_HITS) {
        return res.status(429).json({
          success: false,
          message: "طلبات متكررة بسرعة. يرجى المحاولة بعد قليل",
        });
      }
      next();
    } catch (_) {
      next();
    }
  };
})();
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");
const db = require("../config/database");
const { getMyFriendCode } = require("../controllers/friendsController");
const {
  validateCampCreation,
  validateCampUpdate,
  validateDailyTasks,
  validateTaskCompletion,
  validateEnrollment,
  validateCampResource,
  validateCampResourceCategory,
  validateCampQuestion,
  validateCampAnswer,
  validateTaskGroup,
} = require("../middleware/campValidation");

const {
  // User APIs
  getAllCamps,
  getCampDetails,
  getCampDailyTasks,
  enrollInCamp,
  getMyProgress,
  completeTask,
  markTaskComplete,
  updateTaskBenefits,
  getCampLeaderboard,
  getMyStreak,
  getMyStats,
  getStudyHallContent,
  // Action Plan APIs
  getMyActionPlan,
  createOrUpdateActionPlan,
  getMySummary,
  // Interactive Features
  toggleUpvoteReflection,
  toggleSaveReflection,
  getSavedReflections,
  deleteReflection,
  shareBenefit,
  searchHadithForAutocomplete,
  pledgeToJointStep,
  deleteCamp,
  notifyCampFinished,
  // Admin APIs
  createCamp,
  updateCamp,
  addDailyTasks,
  updateDailyTask,
  getAdminStats,
  getCampParticipants,
  getCampAnalytics,
  updateCampStatus,
  updateCampSettings,
  getCampSettings,
  getAdminCampSettings,
  updateAdminCampSettings,
  getCampDetailsForAdmin,
  leaveCamp,
  // User management functions
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeUserFromCamp,
  getUserDetails,
  deleteDailyTask,
  sendCampNotification,
  // Camp Resources
  getCampResources,
  createCampResource,
  updateCampResource,
  deleteCampResource,
  getCampResourceCategories,
  createCampResourceCategory,
  updateCampResourceCategory,
  deleteCampResourceCategory,
  updateCategoryOrder,
  updateResourceOrder,
  // Camp Q&A
  getCampQuestions,
  askCampQuestion,
  answerCampQuestion,
  deleteCampQuestion,
  // Task Groups
  createTaskGroup,
  updateTaskGroup,
  deleteTaskGroup,
  getCampTaskGroups,

  // Templates System
  getCampTemplates,
  saveCampAsTemplate,
  createCampFromTemplate,
} = require("../controllers/quranCampsController");

// Resolve :id or :campId to numeric camp id when a share_link is provided
async function resolveCampId(value) {
  if (!value) return null;
  const numericId = Number(value);
  if (!Number.isNaN(numericId) && Number.isFinite(numericId))
    return String(numericId);
  const [[row]] = await db.query(
    "SELECT id FROM quran_camps WHERE share_link = ?",
    [value]
  );
  return row ? String(row.id) : null;
}

router.param("id", async (req, res, next, val) => {
  try {
    const resolved = await resolveCampId(val);
    if (!resolved) {
      return res
        .status(404)
        .json({ success: false, message: "المخيم غير موجود" });
    }
    req.params.id = resolved;
    next();
  } catch (e) {
    next(e);
  }
});

router.param("campId", async (req, res, next, val) => {
  try {
    const resolved = await resolveCampId(val);
    if (!resolved) {
      return res
        .status(404)
        .json({ success: false, message: "المخيم غير موجود" });
    }
    req.params.campId = resolved;
    next();
  } catch (e) {
    next(e);
  }
});

// ==================== USER ROUTES ====================

// Get all Quran camps (public, but with optional auth to show enrollment status)
const { optionalAuthMiddleware } = require("../middleware/authMiddleware");
router.get("/", optionalAuthMiddleware, getAllCamps);

// Notifications routes (must be before /:id routes)
router.get("/notifications", authMiddleware, getUserNotifications);
router.put("/notifications/:id/read", authMiddleware, markNotificationAsRead);
router.put(
  "/notifications/read-all",
  authMiddleware,
  markAllNotificationsAsRead
);

// Get camp details (public - optional auth)
router.get(
  "/:id",
  (req, res, next) => {
    // Optional auth - إذا كان فيه token، تحقق منه، وإلا واصل بدون user
    const token = req.header("x-auth-token");
    if (token) {
      return authMiddleware(req, res, next);
    }
    req.user = null;
    next();
  },
  getCampDetails
);

// Public shortcut to get camp details by share_link explicitly
router.get(
  "/share/:id",
  (req, res, next) => {
    const token = req.header("x-auth-token");
    if (token) {
      return authMiddleware(req, res, next);
    }
    req.user = null;
    next();
  },
  getCampDetails
);

// Get daily tasks for a camp (public, but optional auth)
router.get(
  "/:id/daily-tasks",
  (req, res, next) => {
    const token = req.header("x-auth-token");
    if (token) {
      return authMiddleware(req, res, next);
    }
    req.user = null;
    next();
  },
  getCampDailyTasks
);

// Get camp leaderboard (protected)
router.get("/:id/leaderboard", authMiddleware, getCampLeaderboard);

// Enroll in a camp (protected)
router.post("/:id/enroll", authMiddleware, validateEnrollment, enrollInCamp);

// Get my friend code for a camp (protected)
router.get("/:id/my-friend-code", authMiddleware, getMyFriendCode);

// Get user's progress in a camp (protected)
router.get("/:id/my-progress", authMiddleware, getMyProgress);

// Complete a task (protected)
router.post(
  "/tasks/:taskId/complete",
  authMiddleware,
  completionRateLimiter,
  validateTaskCompletion,
  completeTask
);
// Mark task as complete (protected)
router.post("/tasks/:taskId/mark-complete", authMiddleware, markTaskComplete);
// Update task benefits (protected)
router.post("/tasks/:taskId/benefits", authMiddleware, updateTaskBenefits);

// Get my streak (protected)
router.get("/:id/my-streak", authMiddleware, getMyStreak);

// Get my stats (protected)
router.get("/:id/my-stats", authMiddleware, getMyStats);

// Get study hall content (protected)
router.get("/:id/study-hall", authMiddleware, getStudyHallContent);

// Get camp resources (protected)
router.get("/:id/resources", authMiddleware, getCampResources);

// Get camp Q&A (protected)
router.get("/:id/qanda", authMiddleware, getCampQuestions);

// Ask a question (protected)
router.post(
  "/:id/qanda",
  authMiddleware,
  validateCampQuestion,
  askCampQuestion
);

// Delete a question (protected - admin or owner)
router.delete("/qanda/:questionId", authMiddleware, deleteCampQuestion);

// Get or Create user's action plan for a camp (protected)
router.get("/:id/my-action-plan", authMiddleware, getMyActionPlan);
router.post("/:id/my-action-plan", authMiddleware, createOrUpdateActionPlan);

// Get user's camp summary (protected)
router.get("/:id/my-summary", authMiddleware, getMySummary);

// Notify camp finished (protected)
router.post("/:id/notify-camp-finished", authMiddleware, notifyCampFinished);

// ==================== ADMIN ROUTES ====================

// Templates System
router.post(
  "/admin/camps/create-from-template",
  authMiddleware,
  adminMiddleware,
  createCampFromTemplate
);

router.get(
  "/admin/templates",
  authMiddleware,
  adminMiddleware,
  getCampTemplates
);

router.put(
  "/admin/camps/:id/save-as-template",
  authMiddleware,
  adminMiddleware,
  saveCampAsTemplate
);

// Create new camp (admin only)
router.post(
  "/admin/create",
  authMiddleware,
  adminMiddleware,
  validateCampCreation,
  createCamp
);

// Update camp (admin only)
router.put(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  validateCampUpdate,
  updateCamp
);

// Add daily tasks to camp (admin only)
router.post(
  "/admin/:id/daily-tasks",
  authMiddleware,
  adminMiddleware,
  validateDailyTasks,
  addDailyTasks
);

// Update daily task (admin only)
router.put(
  "/admin/tasks/:taskId",
  authMiddleware,
  adminMiddleware,
  updateDailyTask
);

// Delete daily task (admin only)
router.delete(
  "/admin/tasks/:taskId",
  authMiddleware,
  adminMiddleware,
  deleteDailyTask
);

// Get admin stats (admin only)
router.get("/admin/stats", authMiddleware, adminMiddleware, getAdminStats);

// Get camp participants (admin only)
router.get(
  "/:id/participants",
  authMiddleware,
  adminMiddleware,
  getCampParticipants
);

// Get camp analytics (admin only)
router.get("/:id/analytics", authMiddleware, adminMiddleware, getCampAnalytics);

// Update camp status (admin only)
router.put("/:id/status", authMiddleware, adminMiddleware, updateCampStatus);

// Get camp details for admin (admin only)
router.get(
  "/:id/admin",
  authMiddleware,
  adminMiddleware,
  getCampDetailsForAdmin
);

// Get admin camp settings (admin only)
router.get(
  "/:id/admin/settings",
  authMiddleware,
  adminMiddleware,
  getAdminCampSettings
);

// Update admin camp settings (admin only)
router.put(
  "/:id/admin/settings",
  authMiddleware,
  adminMiddleware,
  updateAdminCampSettings
);

router.post("/:id/leave", authMiddleware, leaveCamp);

// User management routes (admin only)
router.delete(
  "/:campId/participants/:userId",
  authMiddleware,
  adminMiddleware,
  removeUserFromCamp
);
router.get("/users/:userId", authMiddleware, adminMiddleware, getUserDetails);
router.delete("/:id", authMiddleware, adminMiddleware, deleteCamp);

// Camp settings routes
router.get("/:id/settings", authMiddleware, getCampSettings);
router.put("/:id/settings", authMiddleware, updateCampSettings);

// Send notification to camp participants (admin only)
router.post(
  "/:id/admin/notifications/send",
  authMiddleware,
  adminMiddleware,
  sendCampNotification
);

// Admin routes for camp resources
router.post(
  "/admin/:id/resources",
  authMiddleware,
  adminMiddleware,
  validateCampResource,
  createCampResource
);
router.put(
  "/admin/resources/:resourceId",
  authMiddleware,
  adminMiddleware,
  validateCampResource,
  updateCampResource
);
router.delete(
  "/admin/resources/:resourceId",
  authMiddleware,
  adminMiddleware,
  deleteCampResource
);

// Admin routes for resource categories
router.get(
  "/admin/:id/resource-categories",
  authMiddleware,
  adminMiddleware,
  getCampResourceCategories
);
router.post(
  "/admin/:id/resource-categories",
  authMiddleware,
  adminMiddleware,
  validateCampResourceCategory,
  createCampResourceCategory
);
router.put(
  "/admin/resource-categories/:categoryId",
  authMiddleware,
  adminMiddleware,
  validateCampResourceCategory,
  updateCampResourceCategory
);
router.delete(
  "/admin/resource-categories/:categoryId",
  authMiddleware,
  adminMiddleware,
  deleteCampResourceCategory
);
router.put(
  "/admin/:id/resource-categories/order",
  authMiddleware,
  adminMiddleware,
  updateCategoryOrder
);
router.put(
  "/admin/resources/order",
  authMiddleware,
  adminMiddleware,
  updateResourceOrder
);

// Admin routes for Q&A
router.post(
  "/admin/qanda/:questionId/answer",
  authMiddleware,
  adminMiddleware,
  validateCampAnswer,
  answerCampQuestion
);

// Task Groups Routes
// Get task groups for a camp (public, but optional auth)
router.get(
  "/:id/task-groups",
  (req, res, next) => {
    const token = req.header("x-auth-token");
    if (token) {
      return authMiddleware(req, res, next);
    }
    req.user = null;
    next();
  },
  getCampTaskGroups
);

// Create task group (admin only)
router.post(
  "/admin/:id/task-groups",
  authMiddleware,
  adminMiddleware,
  validateTaskGroup,
  createTaskGroup
);

// Update task group (admin only)
router.put(
  "/admin/task-groups/:groupId",
  authMiddleware,
  adminMiddleware,
  validateTaskGroup,
  updateTaskGroup
);

// Delete task group (admin only)
router.delete(
  "/admin/task-groups/:groupId",
  authMiddleware,
  adminMiddleware,
  deleteTaskGroup
);

// Interactive Features Routes
// Toggle upvote for a reflection/benefit
router.post(
  "/reflections/:progressId/toggle-upvote",
  authMiddleware,
  toggleUpvoteReflection
);

// Toggle save for a reflection/benefit
router.post(
  "/reflections/:progressId/toggle-save",
  authMiddleware,
  toggleSaveReflection
);

// Get saved reflections for a user
router.get("/:campId/saved-reflections", authMiddleware, getSavedReflections);

// Delete a reflection
router.delete(
  "/reflections/:progressId/delete",
  authMiddleware,
  deleteReflection
);

// Share a benefit (make it public)
router.post("/benefits/:benefitId/share", authMiddleware, shareBenefit);

// Pledge to a joint step (commit to a proposed step)
router.post("/progress/:progressId/pledge", authMiddleware, pledgeToJointStep);

// Search Hadith for autocomplete (slash commands)
router.get(
  "/mishkat/search-hadith",
  authMiddleware,
  searchHadithForAutocomplete
);

module.exports = router;
