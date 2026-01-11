/**
 * نظام ختمات الكتب - Book Journeys Routes
 * مسارات API للختمات ومشاركة التقدم مع الأصدقاء
 */

const express = require("express");
const router = express.Router();
const {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");
const bookJourneysController = require("../controllers/bookJourneysController");

// =====================================================
// مسارات عامة (بدون تسجيل دخول)
// =====================================================

// =====================================================
// مسارات الإدارة (Admin Only)
// =====================================================

/**
 * GET /api/book-journeys/admin/stats
 * إحصائيات الختمات للـ Admin Dashboard
 */
router.get(
  "/admin/stats",
  authMiddleware,
  adminMiddleware,
  bookJourneysController.getBookJourneysStats
);

/**
 * GET /api/book-journeys/admin/all
 * جميع الختمات مع فلترة وتصفح
 */
router.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  bookJourneysController.getAllBookJourneys
);

/**
 * GET /api/book-journeys/admin/:id
 * تفاصيل ختمة محددة للـ Admin
 */
router.get(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  bookJourneysController.getBookJourneyDetails
);

/**
 * GET /api/book-journeys/admin/:id/participants
 * مشاركو ختمة محددة
 */
router.get(
  "/admin/:id/participants",
  authMiddleware,
  adminMiddleware,
  bookJourneysController.getBookJourneyParticipants
);

/**
 * PUT /api/book-journeys/admin/:id/status
 * تحديث حالة الختمة
 */
router.put(
  "/admin/:id/status",
  authMiddleware,
  adminMiddleware,
  bookJourneysController.updateBookJourneyStatus
);

/**
 * GET /api/book-journeys/books
 * قائمة الكتب المتاحة للختم
 */
router.get("/books", bookJourneysController.getAvailableBooks);

// =====================================================
// مسارات تتطلب تسجيل دخول
// =====================================================

/**
 * GET /api/book-journeys/my-journeys
 * ختماتي (نشطة + مكتملة)
 */
router.get(
  "/my-journeys",
  authMiddleware,
  bookJourneysController.getMyJourneys
);

/**
 * POST /api/book-journeys/start
 * بدء ختمة جديدة
 * Body: { book_slug: string, pace?: number }
 */
router.post("/start", authMiddleware, bookJourneysController.startJourney);

/**
 * GET /api/book-journeys/friends-activity
 * نشاط الأصدقاء (من أكمل اليوم)
 */
router.get(
  "/friends-activity",
  authMiddleware,
  bookJourneysController.getFriendsActivity
);

/**
 * POST /api/book-journeys/join/:shareCode
 * الانضمام عبر رابط الدعوة
 */
router.post(
  "/join/:shareCode",
  authMiddleware,
  bookJourneysController.joinViaShareCode
);

// =====================================================
// مسارات الإشعارات (يجب أن تكون قبل /:id)
// =====================================================

/**
 * GET /api/book-journeys/notifications
 * جلب إشعارات الختمات
 */
router.get(
  "/notifications",
  authMiddleware,
  bookJourneysController.getJourneyNotifications
);

/**
 * PUT /api/book-journeys/notifications/read-all
 * تحديد جميع الإشعارات كمقروءة
 */
router.put(
  "/notifications/read-all",
  authMiddleware,
  bookJourneysController.markAllNotificationsAsRead
);

/**
 * PUT /api/book-journeys/notifications/:id/read
 * تحديد إشعار كمقروء
 */
router.put(
  "/notifications/:id/read",
  authMiddleware,
  bookJourneysController.markNotificationAsRead
);

// =====================================================
// مسارات الشهادات (المسارات الثابتة قبل /:id)
// =====================================================

/**
 * GET /api/book-journeys/verify-certificate/:code
 * التحقق من صحة الشهادة (عام - بدون تسجيل دخول)
 */
router.get(
  "/verify-certificate/:code",
  bookJourneysController.verifyCertificate
);

// =====================================================
// مسارات الختمة المحددة
// =====================================================

/**
 * GET /api/book-journeys/:id
 * تفاصيل ختمة
 */
router.get("/:id", authMiddleware, bookJourneysController.getJourneyDetails);

/**
 * GET /api/book-journeys/:id/today
 * أحاديث اليوم
 */
router.get(
  "/:id/today",
  authMiddleware,
  bookJourneysController.getTodayHadiths
);

/**
 * POST /api/book-journeys/:id/read/:hadithId
 * تأشير القراءة
 * Body: { notes?: string }
 */
router.post(
  "/:id/read/:hadithId",
  authMiddleware,
  bookJourneysController.markHadithAsRead
);

/**
 * GET /api/book-journeys/:id/progress
 * التقدم والإحصائيات
 */
router.get(
  "/:id/progress",
  authMiddleware,
  bookJourneysController.getJourneyProgress
);

/**
 * PUT /api/book-journeys/:id/pause
 * إيقاف مؤقت للختمة
 */
router.put("/:id/pause", authMiddleware, bookJourneysController.pauseJourney);

/**
 * PUT /api/book-journeys/:id/resume
 * استئناف الختمة
 */
router.put("/:id/resume", authMiddleware, bookJourneysController.resumeJourney);

/**
 * PUT /api/book-journeys/:id/pace
 * تغيير سرعة القراءة
 * Body: { pace: number }
 */
router.put("/:id/pace", authMiddleware, bookJourneysController.updatePace);

/**
 * PUT /api/book-journeys/:id/pledge
 * تحديث التعهد
 * Body: { pledge: string, pledge_shared?: boolean }
 */
router.put("/:id/pledge", authMiddleware, bookJourneysController.updatePledge);

/**
 * PUT /api/book-journeys/:id/settings
 * تحديث إعدادات الختمة (pace, pledge, وغيرها)
 * Body: { pace?: number, pledge?: string, pledge_shared?: boolean }
 */
router.put(
  "/:id/settings",
  authMiddleware,
  bookJourneysController.updateJourneySettings
);

/**
 * POST /api/book-journeys/:id/reset
 * إعادة ضبط الختمة (حذف التقدم والبدء من جديد)
 * Body: { confirm: boolean }
 */
router.post(
  "/:id/reset",
  authMiddleware,
  bookJourneysController.resetJourneyProgress
);


/**
 * GET /api/book-journeys/:id/calendar
 * جلب بيانات التقويم الشهري
 * Query: { month?: number, year?: number }
 */
router.get(
  "/:id/calendar",
  authMiddleware,
  bookJourneysController.getProgressCalendar
);

// =====================================================
// مسارات نظام الرفقة (Buddy System)
// =====================================================

/**
 * GET /api/book-journeys/:id/buddy
 * معلومات الرفيق الحالي
 */
router.get("/:id/buddy", authMiddleware, bookJourneysController.getBuddyInfo);

/**
 * POST /api/book-journeys/:id/buddy/request
 * طلب رفيق جديد
 * Body: { target_user_id: number }
 */
router.post(
  "/:id/buddy/request",
  authMiddleware,
  bookJourneysController.requestBuddy
);

/**
 * PUT /api/book-journeys/:id/buddy/accept/:buddyRequestId
 * قبول طلب الرفقة
 */
router.put(
  "/:id/buddy/accept/:buddyRequestId",
  authMiddleware,
  bookJourneysController.acceptBuddy
);

/**
 * PUT /api/book-journeys/:id/buddy/decline/:buddyRequestId
 * رفض طلب الرفقة
 */
router.put(
  "/:id/buddy/decline/:buddyRequestId",
  authMiddleware,
  bookJourneysController.declineBuddy
);

/**
 * POST /api/book-journeys/:id/buddy/encourage
 * إرسال تشجيع للرفيق
 * Body: { message: string }
 */
router.post(
  "/:id/buddy/encourage",
  authMiddleware,
  bookJourneysController.sendBuddyEncouragement
);

// =====================================================
// مسارات الأصدقاء
// =====================================================

/**
 * GET /api/book-journeys/:id/share-link
 * رابط دعوة للختمة
 */
router.get(
  "/:id/share-link",
  authMiddleware,
  bookJourneysController.getShareLink
);

/**
 * GET /api/book-journeys/:id/friends
 * قائمة الأصدقاء في نفس الختمة مع تقدمهم
 */
router.get(
  "/:id/friends",
  authMiddleware,
  bookJourneysController.getJourneyFriends
);

/**
 * DELETE /api/book-journeys/:id/unfollow/:friendJourneyId
 * إلغاء متابعة صديق
 */
router.delete(
  "/:id/unfollow/:friendJourneyId",
  authMiddleware,
  bookJourneysController.unfollowFriend
);

// =====================================================
// مسارات الشهادات للختمة المحددة
// =====================================================

/**
 * GET /api/book-journeys/:id/certificate/check
 * التحقق من أهلية الشهادة
 */
router.get(
  "/:id/certificate/check",
  authMiddleware,
  bookJourneysController.checkCertificateEligibility
);

/**
 * GET /api/book-journeys/:id/certificate
 * جلب شهادة المستخدم
 */
router.get(
  "/:id/certificate",
  authMiddleware,
  bookJourneysController.getCertificate
);

/**
 * GET /api/book-journeys/:id/certificate/download
 * تحميل شهادة المستخدم
 */
router.get(
  "/:id/certificate/download",
  authMiddleware,
  bookJourneysController.downloadCertificate
);

/**
 * POST /api/book-journeys/:id/certificate
 * إنشاء الشهادة
 */
router.post(
  "/:id/certificate",
  authMiddleware,
  bookJourneysController.generateCertificate
);

module.exports = router;
