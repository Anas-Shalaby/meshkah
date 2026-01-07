const express = require("express");
const router = express.Router();

const {
  authMiddleware,
  adminMiddleware,
  supervisorMiddleware,
  supervisorOrAdminMiddleware,
} = require("../middleware/authMiddleware");
const db = require("../config/database");
const { getMyFriendCode } = require("../controllers/friendsController");

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
  // Daily Tests
  createDailyTest,
  getAllDailyTests,
  getDailyTest,
  deleteDailyTest,
  getTestForUser,
  submitTest,
  getTestResults,
  checkTestAvailability,
  // Camp Q&A
  getCampQuestions,
  askCampQuestion,
  answerCampQuestion,
  deleteCampQuestion,
  getSharedReflection,
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
  exportStudyHallFawaid, // Add this
  getCampDailyMessages,
  createDailyMessage,
  updateDailyMessage,
  deleteDailyMessage,
  exportCampTasks,
  importCampTasks,
  startNewCohort,
  getCampCohorts,
  getAvailableCohorts,
  getMyCohort,
  getCampCohort,
  createCampCohort,
  updateCampCohort,
  deleteCampCohort,
  startCampCohort,
  completeCampCohort,
  // Supervisors
  getCampSupervisors,
  addCampSupervisor,
  removeCampSupervisor,
  cancelCampCohort,
  openCampCohort,
  closeCampCohort,
  getCohortStats,
  getCohortsComparison,
  getCohortParticipants,
  getCohortParticipantsForAdmin,
  migrateUserBetweenCohorts,
  bulkMigrateUsersBetweenCohorts,
  getScheduledCohorts,
  scheduleCampCohort,
  sendCohortNotification,
  sendCohortAnnouncement,
  getSupervisorCohortParticipants,
  removeParticipantFromCohort,
  migrateParticipantBySupervisor,
  getSupervisorCohortStats,
  getTestStatistics,
  getUserAttemptDetails,
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

// Get shared reflection by share_link (public - optional auth to let the author see themselves)
router.get("/shared/:shareLink", optionalAuthMiddleware, getSharedReflection);

// Notifications routes (must be before /:id routes)
router.get("/notifications", authMiddleware, getUserNotifications);
router.put("/notifications/:id/read", authMiddleware, markNotificationAsRead);
router.put(
  "/notifications/read-all",
  authMiddleware,
  markAllNotificationsAsRead
);

// ==================== REFERRAL SYSTEM ROUTES (must be before /:id) ====================

const CampReferralService = require("../services/campReferralService");

// Get my referral link for a specific cohort (protected)
router.get(
  "/referral/my-link/:campId/:campCode/:cohortNumber",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const campId = parseInt(req.params.campId);
      const cohortNumber = parseInt(req.params.cohortNumber);

      const result = await CampReferralService.getReferralLink(
        userId,
        campId,
        req.params.campCode,
        cohortNumber
      );
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("[Referral] Error getting referral link:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// Get my referral stats for a specific cohort (protected)
router.get(
  "/referral/my-stats/:campId/:cohortNumber",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const campId = parseInt(req.params.campId);
      const cohortNumber = parseInt(req.params.cohortNumber);

      const stats = await CampReferralService.getCohortReferralStats(
        userId,
        campId,
        cohortNumber
      );
      res.json({ success: true, stats });
    } catch (error) {
      console.error("[Referral] Error getting referral stats:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// Get my referrals list for a specific cohort (protected)
router.get(
  "/referral/my-referrals/:campId/:cohortNumber",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const campId = parseInt(req.params.campId);
      const cohortNumber = parseInt(req.params.cohortNumber);

      const referrals = await CampReferralService.getCohortReferralsList(
        userId,
        campId,
        cohortNumber
      );
      res.json({ success: true, referrals });
    } catch (error) {
      console.error("[Referral] Error getting referrals list:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// Check if user can invite in a cohort (protected)
router.get(
  "/referral/can-invite/:campId/:cohortNumber",
  authMiddleware,
  async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const cohortNumber = parseInt(req.params.cohortNumber);

      const result = await CampReferralService.canInvite(campId, cohortNumber);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("[Referral] Error checking invite permission:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// Track referral (called when user enrolls with referral code)
router.post("/referral/track", authMiddleware, async (req, res) => {
  try {
    const { referralCode, enrollmentId, cohortNumber } = req.body;

    if (!referralCode) {
      return res
        .status(400)
        .json({ success: false, message: "كود الإحالة مطلوب" });
    }

    if (!enrollmentId) {
      return res
        .status(400)
        .json({ success: false, message: "معرّف التسجيل مطلوب" });
    }

    if (!cohortNumber) {
      return res
        .status(400)
        .json({ success: false, message: "رقم الفوج مطلوب" });
    }

    const result = await CampReferralService.trackReferral(
      referralCode,
      enrollmentId,
      cohortNumber
    );
    res.json(result);
  } catch (error) {
    console.error("[Referral] Error tracking referral:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== CERTIFICATE SYSTEM ROUTES (must be before /:id) ====================

const CampCertificateService = require("../services/campCertificateService");

// Get all my certificates (protected)
router.get(
  "/certificates/my-certificates",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await CampCertificateService.getAllUserCertificates(
        userId
      );
      res.json(result);
    } catch (error) {
      console.error("Error getting all certificates:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// Verify certificate (public - for sharing)
router.get("/certificates/verify/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const result = await CampCertificateService.verifyCertificate(code);
    res.json(result);
  } catch (error) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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

// Get available cohorts for enrollment (public - requires auth for user enrollment status)
router.get("/:id/cohorts/available", getAvailableCohorts);

// Get user's current cohort (protected)
router.get("/:id/my-cohort", authMiddleware, getMyCohort);

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

// Start a new cohort for a camp (admin only) - Backward compatibility
router.post(
  "/admin/:id/cohorts/start",
  authMiddleware,
  adminMiddleware,
  startNewCohort
);

// ==================== COHORTS MANAGEMENT ROUTES (Admin only) ====================

// Get all cohorts for a camp
router.get(
  "/admin/:id/cohorts",
  authMiddleware,
  adminMiddleware,
  getCampCohorts
);

// Get single cohort details
router.get(
  "/admin/:id/cohorts/:cohortNumber",
  authMiddleware,
  adminMiddleware,
  getCampCohort
);

// Create new cohort
router.post(
  "/admin/:id/cohorts",
  authMiddleware,
  adminMiddleware,
  createCampCohort
);

// Update cohort
router.put(
  "/admin/:id/cohorts/:cohortNumber",
  authMiddleware,
  adminMiddleware,
  updateCampCohort
);

// Delete cohort
router.delete(
  "/admin/:id/cohorts/:cohortNumber",
  authMiddleware,
  adminMiddleware,
  deleteCampCohort
);

// Start cohort
router.post(
  "/admin/:id/cohorts/:cohortNumber/start",
  authMiddleware,
  adminMiddleware,
  startCampCohort
);

// Complete cohort
router.post(
  "/admin/:id/cohorts/:cohortNumber/complete",
  authMiddleware,
  adminMiddleware,
  completeCampCohort
);

// Cancel cohort
router.post(
  "/admin/:id/cohorts/:cohortNumber/cancel",
  authMiddleware,
  adminMiddleware,
  cancelCampCohort
);

// Open cohort
router.post(
  "/admin/:id/cohorts/:cohortNumber/open",
  authMiddleware,
  adminMiddleware,
  openCampCohort
);

// Close cohort
router.post(
  "/admin/:id/cohorts/:cohortNumber/close",
  authMiddleware,
  adminMiddleware,
  closeCampCohort
);

// Get cohort statistics
router.get(
  "/admin/:id/cohorts/:cohortNumber/stats",
  authMiddleware,
  adminMiddleware,
  getCohortStats
);

// Get cohorts comparison
router.get(
  "/admin/:id/cohorts/comparison",
  authMiddleware,
  adminMiddleware,
  getCohortsComparison
);

// Get cohort participants (excludes supervisors)
router.get(
  "/admin/:id/cohorts/:cohortNumber/participants",
  authMiddleware,
  adminMiddleware,
  getCohortParticipants
);

// Get cohort participants for admin (includes supervisors)
router.get(
  "/admin/:id/cohorts/:cohortNumber/participants/all",
  authMiddleware,
  adminMiddleware,
  getCohortParticipantsForAdmin
);

// Migrate user between cohorts
router.post(
  "/admin/:id/cohorts/:cohortNumber/migrate-user",
  authMiddleware,
  adminMiddleware,
  migrateUserBetweenCohorts
);

// Bulk migrate users between cohorts
router.post(
  "/admin/:id/cohorts/:cohortNumber/bulk-migrate",
  authMiddleware,
  adminMiddleware,
  bulkMigrateUsersBetweenCohorts
);

// Get scheduled cohorts
router.get(
  "/admin/:id/cohorts/scheduled",
  authMiddleware,
  adminMiddleware,
  getScheduledCohorts
);

// Schedule cohort
router.post(
  "/admin/:id/cohorts/:cohortNumber/schedule",
  authMiddleware,
  adminMiddleware,
  scheduleCampCohort
);

// Send cohort notification manually
router.post(
  "/admin/:id/cohorts/:cohortNumber/send-notification",
  authMiddleware,
  adminMiddleware,
  sendCohortNotification
);

// Send cohort announcement email to subscribers
router.post(
  "/admin/:id/cohorts/:cohortNumber/send-announcement",
  authMiddleware,
  adminMiddleware,
  sendCohortAnnouncement
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
// Export study hall content (Admin only)
router.get(
  "/admin/:id/study-hall/export",
  authMiddleware,
  adminMiddleware,
  exportStudyHallFawaid
);

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

// ==================== DAILY TESTS ROUTES ====================

// Admin routes for daily tests
router.post(
  "/admin/:id/daily-tests",
  authMiddleware,
  adminMiddleware,
  createDailyTest
);
router.get(
  "/admin/:id/daily-tests",
  authMiddleware,
  adminMiddleware,
  getAllDailyTests
);
router.get(
  "/admin/:id/daily-tests/:dayNumber",
  authMiddleware,
  adminMiddleware,
  getDailyTest
);
router.delete(
  "/admin/:id/daily-tests/:dayNumber",
  authMiddleware,
  adminMiddleware,
  deleteDailyTest
);
router.get(
  "/admin/:id/daily-tests/:dayNumber/statistics",
  authMiddleware,
  adminMiddleware,
  getTestStatistics
);
router.get(
  "/admin/daily-tests/attempts/:attemptId",
  authMiddleware,
  adminMiddleware,
  getUserAttemptDetails
);

// User routes for daily tests (must be before /:id routes)
router.get("/:id/daily-tests/:dayNumber", authMiddleware, getTestForUser);
router.post("/:id/daily-tests/:dayNumber/submit", authMiddleware, submitTest);
router.get(
  "/:id/daily-tests/:dayNumber/results",
  authMiddleware,
  getTestResults
);
router.get(
  "/:id/daily-tests/:dayNumber/check",
  authMiddleware,
  checkTestAvailability
);

// ==================== SUPERVISORS ROUTES (Admin only) ====================

// Get camp supervisors
router.get(
  "/:id/supervisors",
  authMiddleware,
  adminMiddleware,
  getCampSupervisors
);

// Get cohort supervisors
router.get(
  "/:id/cohorts/:cohortNumber/supervisors",
  authMiddleware,
  adminMiddleware,
  getCampSupervisors
);

// Add camp supervisor
router.post(
  "/:id/supervisors",
  authMiddleware,
  adminMiddleware,
  addCampSupervisor
);

// Add cohort supervisor
router.post(
  "/:id/cohorts/:cohortNumber/supervisors",
  authMiddleware,
  adminMiddleware,
  addCampSupervisor
);

// Remove camp supervisor
router.delete(
  "/:id/supervisors/:userId",
  authMiddleware,
  adminMiddleware,
  removeCampSupervisor
);

// Remove cohort supervisor
router.delete(
  "/:id/cohorts/:cohortNumber/supervisors/:userId",
  authMiddleware,
  adminMiddleware,
  removeCampSupervisor
);

// Supervisor APIs - Get cohort participants
router.get(
  "/:id/supervisor/cohort/:cohortNumber/participants",
  authMiddleware,
  supervisorMiddleware,
  getSupervisorCohortParticipants
);

// Supervisor APIs - Remove participant from cohort
router.delete(
  "/:id/supervisor/cohort/:cohortNumber/participants/:userId",
  authMiddleware,
  supervisorMiddleware,
  removeParticipantFromCohort
);

// Supervisor APIs - Migrate participant to another cohort
router.post(
  "/:id/supervisor/cohort/:cohortNumber/migrate-participant",
  authMiddleware,
  supervisorMiddleware,
  migrateParticipantBySupervisor
);

// Supervisor APIs - Get cohort statistics
router.get(
  "/:id/supervisor/cohort/:cohortNumber/stats",
  authMiddleware,
  supervisorMiddleware,
  getSupervisorCohortStats
);

// ==================== CERTIFICATE /:id ROUTES (must be after /:id is defined) ====================

// Request certificate for a camp (protected)
router.post("/:id/certificate/request", authMiddleware, async (req, res) => {
  try {
    const campId = req.params.id;
    const userId = req.user.id;
    const { cohort_number } = req.body;

    const result = await CampCertificateService.issueCertificate(
      userId,
      campId,
      cohort_number || null
    );
    res.json(result);
  } catch (error) {
    console.error("Error requesting certificate:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get my certificate for a camp (protected)
router.get("/:id/certificate", authMiddleware, async (req, res) => {
  try {
    const campId = req.params.id;
    const userId = req.user.id;
    const { cohort_number } = req.query;

    const result = await CampCertificateService.getUserCertificate(
      userId,
      campId,
      cohort_number || null
    );
    res.json(result);
  } catch (error) {
    console.error("Error getting certificate:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Issue certificates to all eligible users (admin only)
router.post(
  "/admin/:id/certificates/issue-all",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const campId = req.params.id;
      const { cohort_number } = req.body;

      const result = await CampCertificateService.issueAllCertificatesForCamp(
        campId,
        cohort_number || null
      );
      res.json(result);
    } catch (error) {
      console.error("Error issuing all certificates:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
