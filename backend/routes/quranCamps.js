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
const QuranService = require("../services/quranService");
const axios = require("axios");
const multer = require("multer");
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

// Configure multer for file uploads (CSV/XLSX)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const fileName = file.originalname.toLowerCase();
    const isAllowed =
      allowedTypes.includes(file.mimetype) ||
      fileName.endsWith(".csv") ||
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls");
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV and XLSX files are allowed"), false);
    }
  },
});

// Configure multer for task attachments (PDF, images, documents)
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const taskAttachmentsDir = path.join(
  __dirname,
  "../public/api/uploads/camp-tasks"
);
if (!fs.existsSync(taskAttachmentsDir)) {
  fs.mkdirSync(taskAttachmentsDir, { recursive: true });
}

const taskAttachmentUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, taskAttachmentsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    const fileName = file.originalname.toLowerCase();
    const isAllowed =
      allowedTypes.includes(file.mimetype) ||
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".gif") ||
      fileName.endsWith(".webp") ||
      fileName.endsWith(".doc") ||
      fileName.endsWith(".docx") ||
      fileName.endsWith(".txt");
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(
        new Error("نوع الملف غير مسموح. المسموح: PDF, صور, مستندات Word, نص"),
        false
      );
    }
  },
});

const {
  // User APIs
  getAllCamps,
  getCampDetails,
  getCampDailyTasks,
  enrollInCamp,
  getMyProgress,
  completeTask,
  markTaskComplete,
  trackReadingTime,
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
  downloadUserReflections,
  downloadReflectionsPDF,
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
  getCampDayChallenges,
  upsertCampDayChallenge,
  deleteCampDayChallenge,
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
  getCampInteractions,
  // User management functions
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeUserFromCamp,
  getUserDetails,
  getUserCampProgress,
  deleteDailyTask,
  uploadTaskAttachment,
  sendCampNotification,
  exportCampData,
  duplicateCamp,
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
  // Help System
  getCampHelpGuide,
  getCampHelpFAQ,
  submitHelpFeedback,
  // Help System Admin APIs
  getCampHelpArticles,
  createCampHelpArticle,
  updateCampHelpArticle,
  deleteCampHelpArticle,
  getCampHelpFAQAdmin,
  createCampHelpFAQ,
  updateCampHelpFAQ,
  deleteCampHelpFAQ,
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
  // Study Hall Content Management (Admin)
  getAdminStudyHallContent,
  updateStudyHallContent,
  deleteStudyHallContent,
  getCampDailyMessages,
  createDailyMessage,
  updateDailyMessage,
  deleteDailyMessage,
  exportCampTasks,
  importCampTasks,
  startNewCohort,
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

// Track reading time (protected)
router.post(
  "/tasks/:taskId/track-reading-time",
  authMiddleware,
  trackReadingTime
);

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

// Help System (protected)
router.get("/:id/help-guide", authMiddleware, getCampHelpGuide);
router.get("/:id/help-faq", authMiddleware, getCampHelpFAQ);
router.post("/:id/help-feedback", authMiddleware, submitHelpFeedback);

// Help System Admin APIs (admin only)
router.get(
  "/:id/admin/help-articles",
  authMiddleware,
  adminMiddleware,
  getCampHelpArticles
);
router.post(
  "/:id/admin/help-articles",
  authMiddleware,
  adminMiddleware,
  createCampHelpArticle
);
router.put(
  "/:id/admin/help-articles/:articleId",
  authMiddleware,
  adminMiddleware,
  updateCampHelpArticle
);
router.delete(
  "/:id/admin/help-articles/:articleId",
  authMiddleware,
  adminMiddleware,
  deleteCampHelpArticle
);
router.get(
  "/:id/admin/help-faq",
  authMiddleware,
  adminMiddleware,
  getCampHelpFAQAdmin
);
router.post(
  "/:id/admin/help-faq",
  authMiddleware,
  adminMiddleware,
  createCampHelpFAQ
);
router.put(
  "/:id/admin/help-faq/:faqId",
  authMiddleware,
  adminMiddleware,
  updateCampHelpFAQ
);
router.delete(
  "/:id/admin/help-faq/:faqId",
  authMiddleware,
  adminMiddleware,
  deleteCampHelpFAQ
);

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

// Day challenges management (admin only)
router.get(
  "/admin/:id/day-challenges",
  authMiddleware,
  adminMiddleware,
  getCampDayChallenges
);
router.post(
  "/admin/:id/day-challenges",
  authMiddleware,
  adminMiddleware,
  upsertCampDayChallenge
);
router.delete(
  "/admin/:id/day-challenges/:dayNumber",
  authMiddleware,
  adminMiddleware,
  deleteCampDayChallenge
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

// Upload attachment to task (admin only)
router.post(
  "/admin/tasks/:taskId/upload-attachment",
  authMiddleware,
  adminMiddleware,
  taskAttachmentUpload.single("file"),
  uploadTaskAttachment
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

// Get camp interactions by day (admin only)
router.get(
  "/:id/interactions",
  authMiddleware,
  adminMiddleware,
  getCampInteractions
);

// Export camp data (admin only)
router.get(
  "/admin/:id/export",
  authMiddleware,
  adminMiddleware,
  exportCampData
);

// Update camp status (admin only)
router.put("/:id/status", authMiddleware, adminMiddleware, updateCampStatus);

// Start a new cohort for a camp (admin only)
router.post(
  "/admin/:id/cohorts/start",
  authMiddleware,
  adminMiddleware,
  startNewCohort
);

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
router.get(
  "/:campId/participants/:userId/progress",
  authMiddleware,
  adminMiddleware,
  getUserCampProgress
);
router.delete("/:id", authMiddleware, adminMiddleware, deleteCamp);

// Duplicate camp (admin only)
router.post("/:id/duplicate", authMiddleware, adminMiddleware, duplicateCamp);

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
// PDF export routes - use external API version (no Puppeteer required)
router.get("/:campId/reflections/pdf", authMiddleware, downloadReflectionsPDF);
// Keep old route for backward compatibility (if needed)
// router.get("/:campId/reflections/pdf-puppeteer", authMiddleware, downloadUserReflections);

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

// Study Hall Content Management Routes (Admin only)
// Get all study hall content for admin
router.get(
  "/admin/:id/study-hall",
  authMiddleware,
  adminMiddleware,
  getAdminStudyHallContent
);

// Update study hall content
router.put(
  "/admin/study-hall/:progressId",
  authMiddleware,
  adminMiddleware,
  updateStudyHallContent
);

// Delete study hall content
router.delete(
  "/admin/study-hall/:progressId",
  authMiddleware,
  adminMiddleware,
  deleteStudyHallContent
);

// Daily Messages (admin only)
router.get(
  "/admin/:id/daily-messages",
  authMiddleware,
  adminMiddleware,
  getCampDailyMessages
);
router.post(
  "/admin/:id/daily-messages",
  authMiddleware,
  adminMiddleware,
  createDailyMessage
);
router.put(
  "/admin/daily-messages/:messageId",
  authMiddleware,
  adminMiddleware,
  updateDailyMessage
);
router.delete(
  "/admin/daily-messages/:messageId",
  authMiddleware,
  adminMiddleware,
  deleteDailyMessage
);

// Tasks Import/Export (admin only)
router.get(
  "/admin/:id/tasks/export",
  authMiddleware,
  adminMiddleware,
  exportCampTasks
);
router.post(
  "/admin/:id/tasks/import",
  authMiddleware,
  adminMiddleware,
  upload.single("file"), // Accept file upload
  importCampTasks
);

// Tafseer text API
router.get("/quran/tafseer-text", authMiddleware, async (req, res) => {
  try {
    const { surah, from, to, tafsir } = req.query;

    if (!surah || !from) {
      return res.status(400).json({
        success: false,
        message: "يجب تحديد رقم السورة ورقم الآية",
      });
    }

    const surahNumber = parseInt(surah);
    const fromVerse = parseInt(from);
    const toVerse = to ? parseInt(to) : fromVerse;

    const tafseer = await QuranService.getTafseer(
      surahNumber,
      fromVerse,
      toVerse,
      tafsir
    );

    res.json({
      success: true,
      data: tafseer,
      meta: {
        tafsir: tafsir,
        surah: surahNumber,
        from: fromVerse,
        to: toVerse,
      },
    });
  } catch (error) {
    console.error("Error fetching tafseer text:", error);
    res.status(500).json({
      success: false,
      message: error.message || "حدث خطأ في جلب التفسير",
    });
  }
});

// Tafseer Proxy (to fetch and display tafseer content)
router.get("/quran/tafseer", authMiddleware, async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "يجب تحديد رابط التفسير",
      });
    }

    // Decode URL
    const decodedUrl = decodeURIComponent(url);

    // Validate URL
    if (
      !decodedUrl.startsWith("http://") &&
      !decodedUrl.startsWith("https://")
    ) {
      return res.status(400).json({
        success: false,
        message: "رابط غير صالح",
      });
    }

    try {
      // Fetch HTML content
      const response = await axios.get(decodedUrl, {
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
        },
      });

      // Return HTML content
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(response.data);
    } catch (error) {
      console.error("Error fetching tafseer:", error);
      res.status(500).json({
        success: false,
        message: error.message || "حدث خطأ في تحميل التفسير",
      });
    }
  } catch (error) {
    console.error("Error in tafseer proxy:", error);
    res.status(500).json({
      success: false,
      message: error.message || "حدث خطأ في معالجة الطلب",
    });
  }
});

// Quran Audio Proxy (to bypass CORS)
// Handle OPTIONS request for CORS preflight
router.options("/quran/audio", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.status(200).end();
});

router.get("/quran/audio", authMiddleware, async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "يجب تحديد رابط الصوت",
      });
    }

    // Decode URL
    const decodedUrl = decodeURIComponent(url);

    // Validate URL is from cdn.islamic.network
    if (!decodedUrl.includes("cdn.islamic.network")) {
      return res.status(400).json({
        success: false,
        message: "رابط غير صالح",
      });
    }

    // Fetch audio from CDN
    const response = await axios.get(decodedUrl, {
      responseType: "stream",
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    // Set appropriate headers for CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

    // Pipe the audio stream to response
    response.data.pipe(res);
  } catch (error) {
    console.error("Error proxying audio:", error);

    // Set CORS headers even for errors
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    res.status(500).json({
      success: false,
      message: error.message || "حدث خطأ في تحميل الصوت",
    });
  }
});

// Quran Verses API (for embedded reader)
router.get("/quran/verses", authMiddleware, async (req, res) => {
  try {
    const { surah, from, to } = req.query;

    if (!surah || !from) {
      return res.status(400).json({
        success: false,
        message: "يجب تحديد رقم السورة ورقم الآية",
      });
    }

    const surahNumber = parseInt(surah);
    const fromVerse = parseInt(from);
    const toVerse = to ? parseInt(to) : fromVerse;
    const reciter = req.query.reciter || "ar.minshawi"; // Default to ar.minshawi

    // Only allow ar.minshawi or ar.alafasy
    const allowedReciters = ["ar.minshawi", "ar.alafasy"];
    const reciterId = allowedReciters.includes(reciter)
      ? reciter
      : "ar.minshawi";

    const verses = await QuranService.getVerses(
      surahNumber,
      fromVerse,
      toVerse,
      reciterId
    );

    res.json({
      success: true,
      data: verses,
    });
  } catch (error) {
    console.error("Error fetching Quran verses:", error);
    res.status(500).json({
      success: false,
      message: error.message || "حدث خطأ في جلب الآيات",
    });
  }
});

module.exports = router;
