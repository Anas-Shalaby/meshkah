/**
 * Review Routes
 * مسارات API لنظام المراجعة الذكية
 */

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const {authMiddleware} = require('../middleware/authMiddleware');

// جميع المسارات تتطلب تسجيل دخول
router.use(authMiddleware);

// ====================================
// User Routes
// ====================================

/**
 * GET /api/reviews/due
 * جلب البطاقات المستحقة للمراجعة اليوم
 * Query params:
 *   - limit: عدد البطاقات المراد جلبها (افتراضي: 50)
 */
router.get('/due', reviewController.getDueReviews);

/**
 * POST /api/reviews/:cardId/submit
 * تسجيل مراجعة بطاقة
 * Body:
 *   - quality: number (0-5) جودة الإجابة
 *   - timeTaken: number (seconds) الوقت المستغرق (اختياري)
 */
router.post('/:cardId/submit', reviewController.submitReview);

/**
 * GET /api/reviews/stats
 * إحصائيات المراجعة للمستخدم
 */
router.get('/stats', reviewController.getReviewStats);

/**
 * GET /api/reviews/settings
 * جلب إعدادات المراجعة للمستخدم
 */
router.get('/settings', reviewController.getReviewSettings);

/**
 * PUT /api/reviews/settings
 * تحديث إعدادات المراجعة
 * Body:
 *   - daily_new_cards: number
 *   - daily_review_cards: number
 *   - preferred_time: string (HH:MM:SS)
 *   - notifications_enabled: boolean
 *   - rest_days: array of strings (e.g., ["saturday", "sunday"])
 */
router.put('/settings', reviewController.updateReviewSettings);

/**
 * GET /api/reviews/history
 * سجل المراجعات (للرسوم البيانية)
 * Query params:
 *   - days: عدد الأيام (افتراضي: 30)
 */
router.get('/history', reviewController.getReviewHistory);


module.exports = router;
