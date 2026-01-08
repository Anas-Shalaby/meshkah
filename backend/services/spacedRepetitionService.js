/**
 * Spaced Repetition Service
 * خدمة المراجعة المتباعدة باستخدام خوارزمية SM-2
 * 
 * SM-2 (SuperMemo 2) Algorithm:
 * - واحدة من أشهر وأقدم خوارزميات Spaced Repetition
 * - مثبتة علمياً منذ 1988
 * - بسيطة وفعالة
 */

/**
 * حساب موعد المراجعة القادمة باستخدام SM-2
 * 
 * @param {Object} card - بطاقة المراجعة الحالية
 * @param {number} quality - جودة الإجابة (0-5)
 *   0: نسيت تماماً
 *   1: تذكرت بصعوبة شديدة جداً
 *   2: تذكرت بصعوبة شديدة
 *   3: تذكرت بصعوبة ولكن بعد تفكير
 *   4: تذكرت بعد تردد بسيط
 *   5: تذكرت فوراً ومتقن تماماً
 * 
 * @returns {Object} معلومات المراجعة القادمة
 */
const calculateNextReview = (card, quality) => {
  let { 
    ease_factor = 2.5, 
    interval_days = 0, 
    repetitions = 0 
  } = card;

  // التحقق من صحة quality
  quality = Math.max(0, Math.min(5, quality));

  // خطوة 1: حساب ease_factor الجديد
  // الصيغة: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  let newEaseFactor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // الحد الأدنى لـ ease_factor هو 1.3
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  let newInterval;
  let newRepetitions;

  // خطوة 2: تحديد الفترة التالية
  if (quality < 3) {
    // فشل في التذكر - إعادة من البداية
    newInterval = 1;
    newRepetitions = 0;
  } else {
    // نجح في التذكر
    newRepetitions = repetitions + 1;

    // حساب الفترة حسب عدد التكرارات
    if (repetitions === 0) {
      // أول مراجعة ناجحة: بعد يوم واحد
      newInterval = 1;
    } else if (repetitions === 1) {
      // ثاني مراجعة ناجحة: بعد 6 أيام
      newInterval = 6;
    } else {
      // المراجعات التالية: الفترة السابقة × ease_factor
      newInterval = Math.round(interval_days * newEaseFactor);
    }
  }

  // خطوة 3: تحديد حالة البطاقة
  let status = 'learning';
  
  if (newRepetitions >= 3 && newInterval >= 21) {
    // متقن: 3+ مراجعات ناجحة وفترة أكثر من 3 أسابيع
    status = 'mastered';
  } else if (newRepetitions >= 1) {
    // قيد المراجعة: مراجعة ناجحة واحدة على الأقل
    status = 'reviewing';
  }

  // خطوة 4: حساب تاريخ المراجعة القادمة
  const nextReviewDate = addDays(new Date(), newInterval);

  // التأكد من أن newEaseFactor رقم صحيح
  if (isNaN(newEaseFactor) || !isFinite(newEaseFactor)) {
    newEaseFactor = 2.5; // القيمة الافتراضية
  }

  return {
    interval_days: newInterval,
    ease_factor: parseFloat(newEaseFactor.toFixed(2)),
    repetitions: newRepetitions,
    next_review_date: nextReviewDate,
    status
  };
};

/**
 * إضافة أيام لتاريخ معين
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0]; // YYYY-MM-DD
};

/**
 * حساب عدد البطاقات المستحقة اليوم
 */
const getDueCardsCount = async (userId, db) => {
  const [result] = await db.query(
    `SELECT COUNT(*) as count 
     FROM review_cards 
     WHERE user_id = ? AND next_review_date <= CURDATE()`,
    [userId]
  );
  return result[0]?.count || 0;
};

/**
 * حساب Streak المراجعة (الأيام المتتالية التي راجع فيها)
 */
const calculateReviewStreak = async (userId, db) => {
  const [history] = await db.query(
    `SELECT DISTINCT DATE(reviewed_at) as review_date
     FROM review_history
     WHERE user_id = ?
     ORDER BY review_date DESC
     LIMIT 365`,
    [userId]
  );

  if (history.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < history.length; i++) {
    const reviewDate = new Date(history[i].review_date);
    reviewDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((currentDate - reviewDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === streak) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

/**
 * توصيات ذكية للمراجعة
 */
const getReviewRecommendations = (stats) => {
  const recommendations = [];

  // إذا كان هناك بطاقات مستحقة كثيرة
  if (stats.due_today > 20) {
    recommendations.push({
      type: 'warning',
      message: `لديك ${stats.due_today} بطاقة للمراجعة. حاول مراجعة 10-15 بطاقة على الأقل اليوم.`
    });
  }

  // إذا كان معدل الجودة منخفض
  if (stats.overall_quality < 3) {
    recommendations.push({
      type: 'tip',
      message: 'معدل الحفظ منخفض. جرب قراءة الحديث بصوت عالٍ أو كتابته لتحسين الحفظ.'
    });
  }

  // إذا لم يراجع منذ فترة
  if (stats.days_since_last_review > 3) {
    recommendations.push({
      type: 'reminder',
      message: 'لم تراجع منذ عدة أيام. المراجعة المنتظمة مهمة للحفظ!'
    });
  }

  // تشجيع على الاستمرار
  if (stats.mastered_cards >= 10) {
    recommendations.push({
      type: 'achievement',
      message: `رائع! أتقنت ${stats.mastered_cards} حديث. استمر! 🎉`
    });
  }

  return recommendations;
};

/**
 * حساب الوقت المتوقع لإتقان جميع البطاقات
 */
const estimateCompletionTime = (stats) => {
  const { total_cards, mastered_cards, learning_cards, reviewing_cards } = stats;
  
  if (total_cards === 0) return 0;
  
  // متوسط الوقت لإتقان بطاقة واحدة (بالأيام)
  const avgDaysToMaster = 30; // تقدير
  
  const remainingCards = learning_cards + reviewing_cards;
  const estimatedDays = Math.ceil((remainingCards * avgDaysToMaster) / total_cards);
  
  return estimatedDays;
};

module.exports = {
  calculateNextReview,
  addDays,
  getDueCardsCount,
  calculateReviewStreak,
  getReviewRecommendations,
  estimateCompletionTime
};
