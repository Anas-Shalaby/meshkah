/**
 * Review Controller
 * التحكم في نظام المراجعة الذكية
 */

const db = require('../config/database');
const SpacedRepetitionService = require('../services/spacedRepetitionService');

// قراءة بيانات الكتاب (مشابه لـ bookJourneysController)
const fs = require('fs');
const path = require('path');

const AVAILABLE_BOOKS = [
  { slug: 'nawawi40', name: 'الأربعين النووية', file: 'nawawi40.json' },
  { slug: 'qudsi40', name: 'الأحاديث القدسية', file: 'qudsi40.json' },
  { slug: 'riyad_assalihin', name: 'رياض الصالحين', file: 'riyad_assalihin.json' },
  { slug: 'bulugh_almaram', name: 'بلوغ المرام', file: 'bulugh_almaram.json' },
  { slug: 'hisnulmuslim', name: 'حصن المسلم', file: 'hisnulmuslim.json' },
  { slug: 'shamail_muhammadiyah', name: 'الشمائل المحمدية', file: 'shamail_muhammadiyah.json' },
  { slug: 'aladab_almufrad', name: 'الأدب المفرد', file: 'aladab_almufrad.json' },
  { slug: 'riyadiah40', name: 'الأربعون الرياضية', file: 'riyadiah40.json' },
  { slug: 'shahwaliullah40', name: 'أربعين شاه ولي الله', file: 'shahwaliullah40.json' }
];

const loadBookData = (bookSlug) => {
  const book = AVAILABLE_BOOKS.find((b) => b.slug === bookSlug);
  if (!book) return null;

  const filePath = path.join(__dirname, '../public', book.file);
  if (!fs.existsSync(filePath)) return null;

  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading book ${bookSlug}:`, error);
    return null;
  }
};

const getHadithById = (hadithIdInBook, bookSlug) => {
  const bookData = loadBookData(bookSlug);
  if (!bookData || !bookData.hadiths) return null;
  
  const searchId = parseInt(hadithIdInBook);
  
  // البحث أولاً بـ id (للكتب المحلية من Islamic Library)
  let hadith = bookData.hadiths.find(h => h.id === searchId);
  
  // إذا لم يُوجد، البحث بـ idInBook (للكتب من Book Journeys)
  if (!hadith) {
    hadith = bookData.hadiths.find(h => h.idInBook === searchId);
  }
  
  if (!hadith) return null;
  
  // تنسيق الحديث للعرض
  return {
    id: hadith.id,
    idInBook: hadith.idInBook || hadith.id,
    arabic: hadith.arabic,
    english: hadith.english?.text || hadith.english || ''
  };
};

/**
 * إنشاء بطاقة مراجعة تلقائياً عند قراءة حديث
 * يتم استدعاؤها من bookJourneysController عند تسجيل القراءة
 */
const createReviewCard = async (userId, journeyId, hadithId, bookSlug) => {
  try {
    // التحقق من عدم وجود بطاقة مسبقاً (البحث بـ hadith_id و book_slug للدقة)
    const [existing] = await db.query(
      'SELECT id FROM review_cards WHERE user_id = ? AND hadith_id = ? AND book_slug = ?',
      [userId, hadithId, bookSlug]
    );

    if (existing.length > 0) {
      // البطاقة موجودة مسبقاً
      return { exists: true, cardId: existing[0].id };
    }

    // جلب بيانات الحديث من الكتاب للحصول على idInBook
    const hadith = getHadithById(hadithId, bookSlug);
    const hadithIdInBook = hadith?.idInBook || hadithId;

    // إنشاء بطاقة جديدة
    const nextReviewDate = SpacedRepetitionService.addDays(new Date(), 1);
    
    const [result] = await db.query(
      `INSERT INTO review_cards 
       (user_id, journey_id, hadith_id, hadith_id_in_book, book_slug, next_review_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, journeyId, hadithId, hadithIdInBook, bookSlug, nextReviewDate]
    );


    return { 
      created: true, 
      cardId: result.insertId,
      nextReviewDate 
    };
  } catch (error) {
    console.error('Error creating review card:', error);
    // إذا فشل الإدراج بسبب عدم وجود العمود hadith_id_in_book، نحاول بالطريقة القديمة
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.warn('hadith_id_in_book column not found, using fallback insert');
      const nextReviewDate = SpacedRepetitionService.addDays(new Date(), 1);
      const [result] = await db.query(
        `INSERT INTO review_cards 
         (user_id, journey_id, hadith_id, book_slug, next_review_date)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, journeyId, hadithId, bookSlug, nextReviewDate]
      );
      return { created: true, cardId: result.insertId, nextReviewDate };
    }
    throw error;
  }
};


/**
 * GET /api/reviews/due
 * جلب البطاقات المستحقة للمراجعة اليوم
 */
const getDueReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const [cards] = await db.query(
      `SELECT rc.*, 
              bj.book_name,
              bj.book_slug
       FROM review_cards rc
       JOIN book_journeys bj ON rc.journey_id = bj.id
       WHERE rc.user_id = ? 
         AND rc.next_review_date <= CURDATE()
       ORDER BY rc.next_review_date ASC, rc.id ASC
       LIMIT ?`,
      [userId, limit]
    );

    // جلب تفاصيل الأحاديث
    const cardsWithHadiths = [];
    for (const card of cards) {
      let hadith = getHadithById(card.hadith_id, card.book_slug);
      
      // إذا لم يُعثر على الحديث في الملف، استخدم بيانات وهمية
      if (!hadith) {
        hadith = {
          id: card.hadith_id,
          idInBook: card.hadith_id,
          arabic: `نص الحديث رقم ${card.hadith_id} من كتاب ${card.book_name}. (سيتم تحميل النص الكامل لاحقاً)`,
          english: `Hadith #${card.hadith_id} from ${card.book_name}. (Full text will be loaded later)`
        };
      }
      
      cardsWithHadiths.push({
        ...card,
        hadith: {
          id: hadith.id,
          idInBook: hadith.idInBook || hadith.id,
          arabic: hadith.arabic,
          english: hadith.english || ''
        }
      });
    }

    res.json({
      success: true,
      cards: cardsWithHadiths,
      count: cardsWithHadiths.length,
      message: cardsWithHadiths.length > 0 
        ? `لديك ${cardsWithHadiths.length} بطاقة للمراجعة اليوم`
        : 'رائع! لا توجد مراجعات اليوم'
    });
  } catch (error) {
    console.error('Error getting due reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في جلب بطاقات المراجعة' 
    });
  }
};

/**
 * POST /api/reviews/:cardId/submit
 * تسجيل مراجعة بطاقة
 */
const submitReview = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { quality, timeTaken } = req.body;
    const userId = req.user.id;

    // التحقق من quality
    if (quality === undefined || quality < 0 || quality > 5) {
      return res.status(400).json({
        success: false,
        message: 'quality يجب أن يكون بين 0 و 5'
      });
    }

    // جلب البطاقة
    const [cards] = await db.query(
      'SELECT * FROM review_cards WHERE id = ? AND user_id = ?',
      [cardId, userId]
    );

    if (cards.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'البطاقة غير موجودة' 
      });
    }

    const card = cards[0];

    // حساب الجدولة التالية باستخدام SM-2
    const nextReview = SpacedRepetitionService.calculateNextReview(card, quality);

    // تحديث البطاقة
    const newQualityAvg = ((card.quality_avg * card.total_reviews) + quality) / (card.total_reviews + 1);

    await db.query(
      `UPDATE review_cards 
       SET interval_days = ?, 
           repetitions = ?, 
           ease_factor = ?,
           next_review_date = ?,
           status = ?,
           last_reviewed_at = NOW(),
           total_reviews = total_reviews + 1,
           quality_avg = ?
       WHERE id = ?`,
      [
        nextReview.interval_days,
        nextReview.repetitions,
        nextReview.ease_factor,
        nextReview.next_review_date,
        nextReview.status,
        newQualityAvg.toFixed(2),
        cardId
      ]
    );

    // تسجيل في التاريخ
    await db.query(
      'INSERT INTO review_history (card_id, user_id, quality, time_taken_seconds) VALUES (?, ?, ?, ?)',
      [cardId, userId, quality, timeTaken || null]
    );

    // رسالة تحفيزية حسب الجودة
    let message = 'تم تسجيل المراجعة';
    if (quality >= 4) {
      message = '🎉 ممتاز! الحديث متقن';
    } else if (quality >= 3) {
      message = '👍 جيد! استمر في المراجعة';
    } else {
      message = '💪 لا بأس، ستتحسن مع المراجعات';
    }

    res.json({
      success: true,
      message,
      nextReviewDate: nextReview.next_review_date,
      interval: nextReview.interval_days,
      status: nextReview.status
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في تسجيل المراجعة' 
    });
  }
};

/**
 * GET /api/reviews/stats
 * إحصائيات المراجعة للمستخدم
 */
const getReviewStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // الإحصائيات الأساسية
    const [stats] = await db.query(
      `SELECT 
         COUNT(*) as total_cards,
         SUM(CASE WHEN status = 'learning' THEN 1 ELSE 0 END) as learning_cards,
         SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing_cards,
         SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) as mastered_cards,
         SUM(CASE WHEN next_review_date <= CURDATE() THEN 1 ELSE 0 END) as due_today,
         AVG(quality_avg) as overall_quality,
         AVG(total_reviews) as avg_reviews_per_card
       FROM review_cards
       WHERE user_id = ?`,
      [userId]
    );

    // حساب Streak
    const reviewStreak = await SpacedRepetitionService.calculateReviewStreak(userId, db);

    // آخر مراجعة
    const [lastReview] = await db.query(
      `SELECT MAX(reviewed_at) as last_review_date
       FROM review_history
       WHERE user_id = ?`,
      [userId]
    );

    const lastReviewDate = lastReview[0]?.last_review_date;
    const daysSinceLastReview = lastReviewDate 
      ? Math.floor((new Date() - new Date(lastReviewDate)) / (1000 * 60 * 60 * 24))
      : null;

    // توقع وقت الإتقان
    const estimatedDays = SpacedRepetitionService.estimateCompletionTime(stats[0]);

    // التوصيات
    const recommendations = SpacedRepetitionService.getReviewRecommendations({
      ...stats[0],
      days_since_last_review: daysSinceLastReview
    });

    res.json({
      success: true,
      stats: {
        ...stats[0],
        review_streak: reviewStreak,
        last_review_date: lastReviewDate,
        days_since_last_review: daysSinceLastReview,
        estimated_completion_days: estimatedDays,
        recommendations
      }
    });
  } catch (error) {
    console.error('Error getting review stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في جلب الإحصائيات' 
    });
  }
};

/**
 * GET /api/reviews/settings
 * جلب إعدادات المراجعة
 */
const getReviewSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const [settings] = await db.query(
      'SELECT * FROM review_settings WHERE user_id = ?',
      [userId]
    );

    if (settings.length === 0) {
      // إنشاء إعدادات افتراضية
      await db.query(
        'INSERT INTO review_settings (user_id) VALUES (?)',
        [userId]
      );

      return res.json({
        success: true,
        settings: {
          daily_new_cards: 10,
          daily_review_cards: 50,
          preferred_time: '20:00:00',
          notifications_enabled: true,
          rest_days: null
        }
      });
    }

    res.json({ 
      success: true, 
      settings: settings[0] 
    });
  } catch (error) {
    console.error('Error getting review settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في جلب الإعدادات' 
    });
  }
};

/**
 * PUT /api/reviews/settings
 * تحديث إعدادات المراجعة
 */
const updateReviewSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      daily_new_cards, 
      daily_review_cards, 
      preferred_time, 
      notifications_enabled,
      rest_days 
    } = req.body;

    // التحقق من وجود الإعدادات
    const [existing] = await db.query(
      'SELECT user_id FROM review_settings WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      // إنشاء إعدادات جديدة
      await db.query(
        `INSERT INTO review_settings 
         (user_id, daily_new_cards, daily_review_cards, preferred_time, notifications_enabled, rest_days)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, daily_new_cards, daily_review_cards, preferred_time, notifications_enabled, JSON.stringify(rest_days)]
      );
    } else {
      // تحديث الإعدادات
      const updates = [];
      const values = [];

      if (daily_new_cards !== undefined) {
        updates.push('daily_new_cards = ?');
        values.push(daily_new_cards);
      }
      if (daily_review_cards !== undefined) {
        updates.push('daily_review_cards = ?');
        values.push(daily_review_cards);
      }
      if (preferred_time !== undefined) {
        updates.push('preferred_time = ?');
        values.push(preferred_time);
      }
      if (notifications_enabled !== undefined) {
        updates.push('notifications_enabled = ?');
        values.push(notifications_enabled);
      }
      if (rest_days !== undefined) {
        updates.push('rest_days = ?');
        values.push(JSON.stringify(rest_days));
      }

      if (updates.length > 0) {
        values.push(userId);
        await db.query(
          `UPDATE review_settings SET ${updates.join(', ')} WHERE user_id = ?`,
          values
        );
      }
    }

    res.json({ 
      success: true, 
      message: 'تم تحديث الإعدادات بنجاح' 
    });
  } catch (error) {
    console.error('Error updating review settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في تحديث الإعدادات' 
    });
  }
};

/**
 * GET /api/reviews/history
 * سجل المراجعات (للرسوم البيانية)
 */
const getReviewHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;

    const [history] = await db.query(
      `SELECT 
         DATE(reviewed_at) as date,
         COUNT(*) as reviews_count,
         AVG(quality) as avg_quality
       FROM review_history
       WHERE user_id = ? 
         AND reviewed_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(reviewed_at)
       ORDER BY date ASC`,
      [userId, days]
    );

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error getting review history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في جلب السجل' 
    });
  }
};

module.exports = {
  createReviewCard,
  getDueReviews,
  submitReview,
  getReviewStats,
  getReviewSettings,
  updateReviewSettings,
  getReviewHistory
};
