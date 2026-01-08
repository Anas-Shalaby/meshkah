/**
 * نظام ختمات الكتب - Book Journeys Controller
 * يتيح للمستخدمين قراءة كتب الحديث بجدول زمني منظم مع تتبع التقدم
 */

const db = require("../config/database");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const JourneyCertificateService = require("../services/journeyCertificateService");

// قائمة الكتب المتاحة
const AVAILABLE_BOOKS = [
  {
    slug: "nawawi40",
    name: "الأربعين النووية",
    author: "الإمام يحيى بن شرف النووي",
    description:
      "أربعون حديثاً جامعة لأصول الدين وقواعده، تُعد من أهم المتون الحديثية",
    file: "nawawi40.json",
    image: "/assets/nawawi40.jpeg",
    category: "arbaain",
  },
  {
    slug: "qudsi40",
    name: "الأحاديث القدسية",
    author: "مجموعة من العلماء",
    description: "أحاديث قدسية مختارة يرويها النبي ﷺ عن ربه عز وجل",
    file: "qudsi40.json",
    image: "/assets/qudsi40.jpeg",
    category: "arbaain",
  },
  {
    slug: "riyad_assalihin",
    name: "رياض الصالحين",
    author: "الإمام النووي",
    description: "كتاب جامع للآداب والأخلاق والرقائق من صحيح الأحاديث النبوية",
    file: "riyad_assalihin.json",
    image: "/assets/riyad_assalihin.jpeg",
    category: "adab",
  },
  {
    slug: "bulugh_almaram",
    name: "بلوغ المرام",
    author: "ابن حجر العسقلاني",
    description: "أحاديث الأحكام الفقهية مع بيان درجتها ومخرجيها",
    file: "bulugh_almaram.json",
    image: "/assets/bulugh_al_maram.jpeg",
    category: "kutub_tisaa",
  },
  {
    slug: "hisnulmuslim",
    name: "حصن المسلم",
    author: "سعيد بن وهف القحطاني",
    description: "جامع الأذكار والأدعية من الكتاب والسنة الصحيحة",
    file: "hisnulmuslim.json",
    image: "/assets/hisnul_muslim.jpeg",
    category: "adab",
  },
  {
    slug: "shamail_muhammadiyah",
    name: "الشمائل المحمدية",
    author: "الإمام الترمذي",
    description: "صفات النبي ﷺ الخَلقية والخُلقية وسيرته العطرة",
    file: "shamail_muhammadiyah.json",
    image: "/assets/shamail_muhammadiyah.jpeg",
    category: "adab",
  },
  {
    slug: "aladab_almufrad",
    name: "الأدب المفرد",
    author: "الإمام البخاري",
    description: "كتاب في الآداب والأخلاق الإسلامية للإمام البخاري",
    file: "aladab_almufrad.json",
    image: "/assets/aladab_almufrad.jpeg",
    category: "adab",
  },
  {
    slug: "riyadiah40",
    name: "الأربعون الرياضية",
    author: "مجموعة من العلماء",
    description: "أربعون حديثاً في الرياضة والصحة البدنية من السنة النبوية",
    file: "riyadiah40.json",
    image: "/assets/riyadiah40.jpeg",
    category: "arbaain",
  },
  {
    slug: "shahwaliullah40",
    name: "أربعين شاه ولي الله",
    author: "شاه ولي الله الدهلوي",
    description: "أربعون حديثاً مختارة للعلامة شاه ولي الله الدهلوي",
    file: "shahwaliullah40.json",
    image: "/assets/shahwaliullah40.jpeg",
    category: "arbaain",
  },
  {
    slug: "malik",
    name: "موطأ مالك",
    author: "الإمام مالك بن أنس",
    description: "أصح ما صنف في عهده، جمع فيه بين الحديث والفقه",
    file: "malik.json",
    image: "/assets/malik.jpeg",
    category: "kutub_tisaa",
  },
  {
    slug: "darimi",
    name: "سنن الدارمي",
    author: "الإمام الدارمي",
    description: "من كتب الحديث المصنفة على الأبواب الفقهية",
    file: "darimi.json",
    image: "/assets/darimi.jpeg",
    category: "kutub_tisaa",
  },
];

// توليد كود مشاركة فريد
const generateShareCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

// قراءة ملف الكتاب
const loadBookData = (bookSlug) => {
  const book = AVAILABLE_BOOKS.find((b) => b.slug === bookSlug);
  if (!book) return null;

  const filePath = path.join(__dirname, "../public", book.file);
  if (!fs.existsSync(filePath)) return null;

  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading book ${bookSlug}:`, error);
    return null;
  }
};

// =====================================================
// APIs الأساسية
// =====================================================

/**
 * GET /api/book-journeys/books
 * قائمة الكتب المتاحة للختم
 */
const getAvailableBooks = async (req, res) => {
  try {
    const booksWithStats = await Promise.all(
      AVAILABLE_BOOKS.map(async (book) => {
        const bookData = loadBookData(book.slug);
        const hadithCount = bookData?.hadiths?.length || 0;

        // عدد الختمات النشطة لهذا الكتاب
        const [activeJourneys] = await db.query(
          `SELECT COUNT(*) as count FROM book_journeys 
           WHERE book_slug = ? AND status = 'active'`,
          [book.slug]
        );

        // عدد الختمات المكتملة
        const [completedJourneys] = await db.query(
          `SELECT COUNT(*) as count FROM book_journeys 
           WHERE book_slug = ? AND status = 'completed'`,
          [book.slug]
        );

        return {
          ...book,
          hadith_count: hadithCount,
          active_readers: activeJourneys[0]?.count || 0,
          total_completions: completedJourneys[0]?.count || 0,
          suggested_pace: [1, 3, 5], // خيارات السرعة المقترحة
          estimated_days: {
            pace_1: hadithCount,
            pace_3: Math.ceil(hadithCount / 3),
            pace_5: Math.ceil(hadithCount / 5),
          },
        };
      })
    );

    res.json({
      success: true,
      books: booksWithStats,
    });
  } catch (error) {
    console.error("Error getting available books:", error);
    res.status(500).json({ success: false, message: "خطأ في جلب قائمة الكتب" });
  }
};

/**
 * GET /api/book-journeys/my-journeys
 * ختماتي (نشطة + مكتملة)
 */
const getMyJourneys = async (req, res) => {
  try {
    const userId = req.user.id;

    const [journeys] = await db.query(
      `SELECT 
        bj.*,
        (SELECT COUNT(*) FROM journey_progress WHERE journey_id = bj.id) as read_count,
        (SELECT COUNT(*) FROM journey_friends WHERE journey_id = bj.id) as friends_count
       FROM book_journeys bj
       WHERE bj.user_id = ?
       ORDER BY 
         CASE bj.status 
           WHEN 'active' THEN 1 
           WHEN 'paused' THEN 2 
           ELSE 3 
         END,
         bj.updated_at DESC`,
      [userId]
    );

    // إضافة معلومات التقدم لكل ختمة
    const journeysWithProgress = journeys.map((journey) => {
      const progressPercent =
        journey.total_hadiths > 0
          ? Math.round((journey.read_count / journey.total_hadiths) * 100)
          : 0;

      const remainingDays =
        journey.pace > 0
          ? Math.ceil(
              (journey.total_hadiths - journey.read_count) / journey.pace
            )
          : 0;

      return {
        ...journey,
        progress_percent: progressPercent,
        remaining_hadiths: journey.total_hadiths - journey.read_count,
        remaining_days: remainingDays,
      };
    });

    res.json({
      success: true,
      journeys: journeysWithProgress,
      stats: {
        active: journeys.filter((j) => j.status === "active").length,
        paused: journeys.filter((j) => j.status === "paused").length,
        completed: journeys.filter((j) => j.status === "completed").length,
      },
    });
  } catch (error) {
    console.error("Error getting user journeys:", error);
    res.status(500).json({ success: false, message: "خطأ في جلب الختمات" });
  }
};

/**
 * POST /api/book-journeys/start
 * بدء ختمة جديدة
 */
const startJourney = async (req, res) => {
  try {
    const userId = req.user.id;
    const { book_slug, pace = 1 } = req.body;

    // التحقق من وجود الكتاب
    const book = AVAILABLE_BOOKS.find((b) => b.slug === book_slug);
    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "الكتاب غير موجود" });
    }

    // التحقق من عدم وجود ختمة نشطة لنفس الكتاب
    const [existingJourney] = await db.query(
      `SELECT id FROM book_journeys 
       WHERE user_id = ? AND book_slug = ? AND status = 'active'`,
      [userId, book_slug]
    );

    if (existingJourney.length > 0) {
      return res.status(400).json({
        success: false,
        message: "لديك ختمة نشطة لهذا الكتاب بالفعل",
        journey_id: existingJourney[0].id,
      });
    }

    // جلب عدد الأحاديث
    const bookData = loadBookData(book_slug);
    const totalHadiths = bookData?.hadiths?.length || 0;

    if (totalHadiths === 0) {
      return res.status(400).json({ success: false, message: "الكتاب فارغ" });
    }

    // توليد كود المشاركة
    const shareCode = generateShareCode();

    // إنشاء الختمة
    const [result] = await db.query(
      `INSERT INTO book_journeys 
       (user_id, book_slug, book_name, total_hadiths, pace, start_date, share_code, status)
       VALUES (?, ?, ?, ?, ?, CURDATE(), ?, 'active')`,
      [userId, book_slug, book.name, totalHadiths, pace, shareCode]
    );

    const journeyId = result.insertId;

    res.status(201).json({
      success: true,
      message: "تم بدء الختمة بنجاح",
      journey: {
        id: journeyId,
        book_slug,
        book_name: book.name,
        total_hadiths: totalHadiths,
        pace,
        share_code: shareCode,
        estimated_days: Math.ceil(totalHadiths / pace),
      },
    });
  } catch (error) {
    console.error("Error starting journey:", error);
    res.status(500).json({ success: false, message: "خطأ في بدء الختمة" });
  }
};

/**
 * GET /api/book-journeys/:id
 * تفاصيل ختمة
 */
const getJourneyDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const journeyId = req.params.id;

    const [journeys] = await db.query(
      `SELECT 
        bj.*,
        u.username as user_name,
        (SELECT COUNT(*) FROM journey_progress WHERE journey_id = bj.id) as read_count,
        (SELECT COUNT(*) FROM journey_friends WHERE journey_id = bj.id) as friends_count
       FROM book_journeys bj
       JOIN users u ON bj.user_id = u.id
       WHERE bj.id = ?`,
      [journeyId]
    );

    if (journeys.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "الختمة غير موجودة" });
    }

    const journey = journeys[0];

    // التحقق من أن المستخدم هو صاحب الختمة أو صديق
    const isOwner = journey.user_id === userId;

    if (!isOwner) {
      // التحقق من أنه صديق
      const [friendship] = await db.query(
        `SELECT 1 FROM journey_friends jf
         JOIN book_journeys bj ON jf.journey_id = bj.id
         WHERE jf.friend_journey_id = ? AND bj.user_id = ?`,
        [journeyId, userId]
      );

      if (friendship.length === 0) {
        return res
          .status(403)
          .json({ success: false, message: "غير مصرح لك بالوصول" });
      }
    }

    // جلب آخر الأحاديث المقروءة
    const [recentProgress] = await db.query(
      `SELECT * FROM journey_progress 
       WHERE journey_id = ? 
       ORDER BY read_at DESC 
       LIMIT 10`,
      [journeyId]
    );

    const progressPercent =
      journey.total_hadiths > 0
        ? Math.round((journey.read_count / journey.total_hadiths) * 100)
        : 0;

    res.json({
      success: true,
      journey: {
        ...journey,
        progress_percent: progressPercent,
        remaining_hadiths: journey.total_hadiths - journey.read_count,
        remaining_days:
          journey.pace > 0
            ? Math.ceil(
                (journey.total_hadiths - journey.read_count) / journey.pace
              )
            : 0,
        is_owner: isOwner,
      },
      recent_progress: recentProgress,
    });
  } catch (error) {
    console.error("Error getting journey details:", error);
    res
      .status(500)
      .json({ success: false, message: "خطأ في جلب تفاصيل الختمة" });
  }
};

/**
 * GET /api/book-journeys/:id/today
 * أحاديث اليوم
 */
const getTodayHadiths = async (req, res) => {
  try {
    const userId = req.user.id;
    const journeyId = req.params.id;

    // جلب الختمة
    const [journeys] = await db.query(
      `SELECT * FROM book_journeys WHERE id = ? AND user_id = ?`,
      [journeyId, userId]
    );

    if (journeys.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "الختمة غير موجودة" });
    }

    const journey = journeys[0];

    if (journey.status !== "active" && journey.status == "paused") {
      return res.status(400).json({
        success: false,
        message: "الختمة غير نشطة",
        status: journey.status,
      });
    }
    if(journey.status == 'completed'){
      return res.status(200).json({
        success: true,
        message: "الختمة مكتملة",
        status: journey.status,
      });
    }

    // جلب بيانات الكتاب
    const bookData = loadBookData(journey.book_slug);
    if (!bookData) {
      return res
        .status(404)
        .json({ success: false, message: "بيانات الكتاب غير موجودة" });
    }

    // جلب الأحاديث المقروءة
    const [readHadiths] = await db.query(
      `SELECT hadith_id FROM journey_progress WHERE journey_id = ?`,
      [journeyId]
    );
    const readHadithIds = new Set(readHadiths.map((h) => h.hadith_id));

    // جلب أحاديث اليوم (الأحاديث التالية حسب السرعة)
    const allHadiths = bookData.hadiths || [];
    const unreadHadiths = allHadiths.filter((h) => !readHadithIds.has(h.id));
    const todayHadiths = unreadHadiths.slice(0, journey.pace);

    // التحقق من إكمال ورد اليوم
    const [todayProgress] = await db.query(
      `SELECT COUNT(*) as count FROM journey_progress 
       WHERE journey_id = ? AND DATE(read_at) = CURDATE()`,
      [journeyId]
    );
    const completedToday = todayProgress[0]?.count >= journey.pace;

    res.json({
      success: true,
      journey: {
        id: journey.id,
        book_name: journey.book_name,
        pace: journey.pace,
        current_position: journey.current_position,
        total_hadiths: journey.total_hadiths,
        streak_count: journey.streak_count,
      },
      today: {
        hadiths: todayHadiths.map((h, index) => ({
          id: h.id,
          id_in_book: h.idInBook,
          position: journey.current_position + index + 1,
          arabic: h.arabic,
          english: h.english,
          is_read: false,
        })),
        required: journey.pace,
        completed: todayProgress[0]?.count || 0,
        is_complete: completedToday,
      },
      progress: {
        read_count: readHadithIds.size,
        total: journey.total_hadiths,
        percent: Math.round((readHadithIds.size / journey.total_hadiths) * 100),
        remaining: journey.total_hadiths - readHadithIds.size,
      },
    });
  } catch (error) {
    console.error("Error getting today hadiths:", error);
    res
      .status(500)
      .json({ success: false, message: "خطأ في جلب أحاديث اليوم" });
  }
};

/**
 * POST /api/book-journeys/:id/read/:hadithId
 * تأشير القراءة
 */
const markHadithAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: journeyId, hadithId } = req.params;
    const { notes } = req.body;

    // جلب الختمة
    const [journeys] = await db.query(
      `SELECT * FROM book_journeys WHERE id = ? AND user_id = ?`,
      [journeyId, userId]
    );

    if (journeys.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "الختمة غير موجودة" });
    }

    const journey = journeys[0];

    if (journey.status !== "active") {
      return res
        .status(400)
        .json({ success: false, message: "الختمة غير نشطة" });
    }

    // جلب بيانات الكتاب للتحقق من الحديث
    const bookData = loadBookData(journey.book_slug);
    const hadith = bookData?.hadiths?.find((h) => h.id === parseInt(hadithId));

    if (!hadith) {
      return res
        .status(404)
        .json({ success: false, message: "الحديث غير موجود" });
    }

    // التحقق من عدم قراءة الحديث مسبقاً
    const [existing] = await db.query(
      `SELECT id FROM journey_progress 
       WHERE journey_id = ? AND hadith_id = ?`,
      [journeyId, hadithId]
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "الحديث مقروء بالفعل" });
    }

    // تسجيل القراءة
    await db.query(
      `INSERT INTO journey_progress (journey_id, hadith_id, hadith_id_in_book, notes)
       VALUES (?, ?, ?, ?)`,
      [journeyId, hadithId, hadith.idInBook, notes || null]
    );

    // 🆕 إنشاء بطاقة مراجعة تلقائياً (Smart Review System)
    try {
      const ReviewController = require('./reviewController');
      await ReviewController.createReviewCard(
        userId,
        journeyId,
        hadithId,
        journey.book_slug
      );
    } catch (reviewError) {
      console.warn('Failed to create review card:', reviewError);
      // لا نوقف العملية إذا فشل إنشاء البطاقة
    }

    // تحديث موقع الختمة
    const [readCount] = await db.query(
      `SELECT COUNT(*) as count FROM journey_progress WHERE journey_id = ?`,
      [journeyId]
    );
    const newPosition = readCount[0].count;

    // تحديث streak
    let newStreak = journey.streak_count;
    const today = new Date().toISOString().split("T")[0];
    const lastReadDate = journey.last_read_date
      ? new Date(journey.last_read_date).toISOString().split("T")[0]
      : null;

    if (lastReadDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastReadDate === yesterdayStr) {
        newStreak = journey.streak_count + 1;
      } else if (lastReadDate !== today) {
        newStreak = 1;
      }
    }

    // التحقق من إكمال الكتاب
    let newStatus = journey.status;
    let completedAt = null;

    if (newPosition >= journey.total_hadiths) {
      newStatus = "completed";
      completedAt = new Date();
    }

    // تحديث الختمة
    await db.query(
      `UPDATE book_journeys 
       SET current_position = ?, streak_count = ?, last_read_date = CURDATE(), 
           status = ?, completed_at = ?
       WHERE id = ?`,
      [newPosition, newStreak, newStatus, completedAt, journeyId]
    );

    // إشعار الأصدقاء إذا اكتمل الكتاب
    if (newStatus === "completed") {
      await notifyFriendsOfCompletion(journeyId, userId, journey.book_name);
    }

    // التحقق من إكمال ورد اليوم وإرسال إشعار للأصدقاء
    const [todayCount] = await db.query(
      `SELECT COUNT(*) as count FROM journey_progress 
       WHERE journey_id = ? AND DATE(read_at) = CURDATE()`,
      [journeyId]
    );

    const completedDailyQuota = todayCount[0].count >= journey.pace;
    let dailyCompletionNotified = false;

    if (completedDailyQuota && todayCount[0].count === journey.pace) {
      // أكمل ورد اليوم للتو - إشعار الأصدقاء
      const JourneyNotificationService = require("../services/journeyNotificationService");
      await JourneyNotificationService.notifyFriendsOfDailyCompletion(
        journeyId,
        userId,
        journey.book_name
      );
      dailyCompletionNotified = true;
    }

    res.json({
      success: true,
      message:
        newStatus === "completed"
          ? "🎉 مبارك! أكملت الختمة"
          : completedDailyQuota && dailyCompletionNotified
          ? "🎉 أحسنت! أكملت ورد اليوم"
          : "تم تسجيل القراءة",
      progress: {
        current_position: newPosition,
        total: journey.total_hadiths,
        percent: Math.round((newPosition / journey.total_hadiths) * 100),
        streak: newStreak,
        is_completed: newStatus === "completed",
        daily_completed: completedDailyQuota,
      },
    });
  } catch (error) {
    console.error("Error marking hadith as read:", error);
    res.status(500).json({ success: false, message: "خطأ في تسجيل القراءة" });
  }
};

/**
 * GET /api/book-journeys/:id/progress
 * التقدم والإحصائيات
 */
const getJourneyProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const journeyId = req.params.id;

    const [journeys] = await db.query(
      `SELECT * FROM book_journeys WHERE id = ? AND user_id = ?`,
      [journeyId, userId]
    );

    if (journeys.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "الختمة غير موجودة" });
    }

    const journey = journeys[0];

    // إحصائيات القراءة
    const [dailyStats] = await db.query(
      `SELECT DATE(read_at) as date, COUNT(*) as count
       FROM journey_progress
       WHERE journey_id = ?
       GROUP BY DATE(read_at)
       ORDER BY date DESC
       LIMIT 30`,
      [journeyId]
    );

    // عدد الأحاديث المقروءة
    const [readCount] = await db.query(
      `SELECT COUNT(*) as count FROM journey_progress WHERE journey_id = ?`,
      [journeyId]
    );

    const progressPercent =
      journey.total_hadiths > 0
        ? Math.round((readCount[0].count / journey.total_hadiths) * 100)
        : 0;

    // حساب متوسط القراءة اليومي
    const daysSinceStart = Math.max(
      1,
      Math.ceil(
        (new Date() - new Date(journey.start_date)) / (1000 * 60 * 60 * 24)
      )
    );
    const averagePerDay = (readCount[0].count / daysSinceStart).toFixed(1);

    res.json({
      success: true,
      journey: {
        id: journey.id,
        book_name: journey.book_name,
        status: journey.status,
        start_date: journey.start_date,
        completed_at: journey.completed_at,
      },
      progress: {
        read_count: readCount[0].count,
        total: journey.total_hadiths,
        percent: progressPercent,
        remaining: journey.total_hadiths - readCount[0].count,
        remaining_days:
          journey.pace > 0
            ? Math.ceil(
                (journey.total_hadiths - readCount[0].count) / journey.pace
              )
            : 0,
      },
      stats: {
        streak: journey.streak_count,
        days_since_start: daysSinceStart,
        average_per_day: parseFloat(averagePerDay),
        pace: journey.pace,
      },
      daily_progress: dailyStats,
    });
  } catch (error) {
    console.error("Error getting journey progress:", error);
    res.status(500).json({ success: false, message: "خطأ في جلب التقدم" });
  }
};

/**
 * PUT /api/book-journeys/:id/pause
 * إيقاف مؤقت للختمة
 */
const pauseJourney = async (req, res) => {
  try {
    const userId = req.user.id;
    const journeyId = req.params.id;

    const [result] = await db.query(
      `UPDATE book_journeys SET status = 'paused' 
       WHERE id = ? AND user_id = ? AND status = 'active'`,
      [journeyId, userId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "الختمة غير موجودة أو غير نشطة" });
    }

    res.json({ success: true, message: "تم إيقاف الختمة مؤقتاً" });
  } catch (error) {
    console.error("Error pausing journey:", error);
    res.status(500).json({ success: false, message: "خطأ في إيقاف الختمة" });
  }
};

/**
 * PUT /api/book-journeys/:id/resume
 * استئناف الختمة
 */
const resumeJourney = async (req, res) => {
  try {
    const userId = req.user.id;
    const journeyId = req.params.id;

    const [result] = await db.query(
      `UPDATE book_journeys SET status = 'active' 
       WHERE id = ? AND user_id = ? AND status = 'paused'`,
      [journeyId, userId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "الختمة غير موجودة أو غير متوقفة" });
    }

    res.json({ success: true, message: "تم استئناف الختمة" });
  } catch (error) {
    console.error("Error resuming journey:", error);
    res.status(500).json({ success: false, message: "خطأ في استئناف الختمة" });
  }
};

/**
 * PUT /api/book-journeys/:id/pace
 * تغيير سرعة القراءة
 */
const updatePace = async (req, res) => {
  try {
    const userId = req.user.id;
    const journeyId = req.params.id;
    const { pace } = req.body;

    if (!pace || pace < 1 || pace > 20) {
      return res
        .status(400)
        .json({ success: false, message: "السرعة يجب أن تكون بين 1 و 20" });
    }

    const [result] = await db.query(
      `UPDATE book_journeys SET pace = ? 
       WHERE id = ? AND user_id = ? AND status IN ('active', 'paused')`,
      [pace, journeyId, userId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "الختمة غير موجودة" });
    }

    res.json({ success: true, message: "تم تحديث السرعة", pace });
  } catch (error) {
    console.error("Error updating pace:", error);
    res.status(500).json({ success: false, message: "خطأ في تحديث السرعة" });
  }
};

// =====================================================
// APIs مشاركة التقدم مع الأصدقاء
// =====================================================

/**
 * GET /api/book-journeys/:id/share-link
 * رابط دعوة للختمة
 */
const getShareLink = async (req, res) => {
  try {
    const userId = req.user.id;
    const journeyId = req.params.id;

    const [journeys] = await db.query(
      `SELECT share_code, book_slug, book_name FROM book_journeys 
       WHERE id = ? AND user_id = ?`,
      [journeyId, userId]
    );

    if (journeys.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "الختمة غير موجودة" });
    }

    const journey = journeys[0];
    const shareUrl = `${
      process.env.FRONTEND_URL || "https://hadith-shareef.com"
    }book-journeys/join/${journey.share_code}`;

    res.json({
      success: true,
      share_code: journey.share_code,
      share_url: shareUrl,
      book_name: journey.book_name,
    });
  } catch (error) {
    console.error("Error getting share link:", error);
    res
      .status(500)
      .json({ success: false, message: "خطأ في جلب رابط المشاركة" });
  }
};

/**
 * POST /api/book-journeys/join/:shareCode
 * الانضمام عبر رابط الدعوة
 */
const joinViaShareCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shareCode } = req.params;

    // جلب الختمة المصدر واسم المستخدم الحالي
    const [sourceJourneys] = await db.query(
      `SELECT bj.*, u.username as inviter_name
       FROM book_journeys bj
       JOIN users u ON bj.user_id = u.id
       WHERE bj.share_code = ?`,
      [shareCode]
    );

    if (sourceJourneys.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "رابط المشاركة غير صالح" });
    }

    const sourceJourney = sourceJourneys[0];

    // جلب اسم المستخدم الحالي
    const [currentUser] = await db.query(
      `SELECT username FROM users WHERE id = ?`,
      [userId]
    );

    const currentUsername =
      currentUser.length > 0 ? currentUser[0].username : "صديق";

    // التحقق من عدم الانضمام لختمة نفسك
    if (sourceJourney.user_id === userId) {
      return res
        .status(400)
        .json({ success: false, message: "لا يمكنك الانضمام لختمتك الخاصة" });
    }

    // التحقق من عدم وجود ختمة نشطة لنفس الكتاب
    const [existingJourney] = await db.query(
      `SELECT id FROM book_journeys 
       WHERE user_id = ? AND book_slug = ? AND status = 'active'`,
      [userId, sourceJourney.book_slug]
    );

    let myJourneyId;

    if (existingJourney.length > 0) {
      myJourneyId = existingJourney[0].id;
    } else {
      // إنشاء ختمة جديدة
      const newShareCode = generateShareCode();
      const [result] = await db.query(
        `INSERT INTO book_journeys 
         (user_id, book_slug, book_name, total_hadiths, pace, start_date, share_code, status)
         VALUES (?, ?, ?, ?, ?, CURDATE(), ?, 'active')`,
        [
          userId,
          sourceJourney.book_slug,
          sourceJourney.book_name,
          sourceJourney.total_hadiths,
          sourceJourney.pace,
          newShareCode,
        ]
      );
      myJourneyId = result.insertId;
    }

    // إضافة صداقة متبادلة
    await db.query(
      `INSERT IGNORE INTO journey_friends (journey_id, friend_journey_id)
       VALUES (?, ?), (?, ?)`,
      [myJourneyId, sourceJourney.id, sourceJourney.id, myJourneyId]
    );

    // إشعار صاحب الختمة الأصلية
    await db.query(
      `INSERT INTO journey_notifications
       (user_id, type, related_journey_id, friend_id, message)
       VALUES (?, 'friend_started_book', ?, ?, ?)`,
      [
        sourceJourney.user_id,
        sourceJourney.id,
        userId,
        `${currentUsername} انضم لقراءة ${sourceJourney.book_name} معك!`,
      ]
    );

    res.json({
      success: true,
      message: `تم الانضمام لقراءة ${sourceJourney.book_name}`,
      journey_id: myJourneyId,
      inviter: sourceJourney.inviter_name,
      is_new: existingJourney.length === 0,
    });
  } catch (error) {
    console.error("Error joining via share code:", error);
    res.status(500).json({ success: false, message: "خطأ في الانضمام" });
  }
};

/**
 * GET /api/book-journeys/:id/friends
 * قائمة الأصدقاء في نفس الختمة مع تقدمهم
 */
const getJourneyFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const journeyId = req.params.id;

    // التحقق من ملكية الختمة
    const [journeys] = await db.query(
      `SELECT * FROM book_journeys WHERE id = ? AND user_id = ?`,
      [journeyId, userId]
    );

    if (journeys.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "الختمة غير موجودة" });
    }

    // جلب الأصدقاء مع تقدمهم
    const [friends] = await db.query(
      `SELECT 
        bj.id as journey_id,
        bj.current_position,
        bj.total_hadiths,
        bj.streak_count,
        bj.last_read_date,
        bj.status,
        u.id as user_id,
        u.username,
        u.avatar_url,
        (SELECT COUNT(*) FROM journey_progress WHERE journey_id = bj.id AND DATE(read_at) = CURDATE()) as read_today
       FROM journey_friends jf
       JOIN book_journeys bj ON jf.friend_journey_id = bj.id
       JOIN users u ON bj.user_id = u.id
       WHERE jf.journey_id = ?
       ORDER BY bj.current_position DESC`,
      [journeyId]
    );

    const friendsWithProgress = friends.map((friend) => ({
      ...friend,
      progress_percent:
        friend.total_hadiths > 0
          ? Math.round((friend.current_position / friend.total_hadiths) * 100)
          : 0,
      completed_today: friend.read_today > 0,
    }));

    res.json({
      success: true,
      friends: friendsWithProgress,
      count: friends.length,
    });
  } catch (error) {
    console.error("Error getting journey friends:", error);
    res.status(500).json({ success: false, message: "خطأ في جلب الأصدقاء" });
  }
};

/**
 * GET /api/book-journeys/friends-activity
 * نشاط الأصدقاء (من أكمل اليوم)
 */
const getFriendsActivity = async (req, res) => {
  try {
    const userId = req.user.id;

    // جلب نشاط الأصدقاء اليوم
    const [activity] = await db.query(
      `SELECT 
        bj.id as journey_id,
        bj.book_name,
        bj.current_position,
        bj.total_hadiths,
        u.id as user_id,
        u.username,
        u.avatar,
        jp.read_at,
        (SELECT COUNT(*) FROM journey_progress WHERE journey_id = bj.id AND DATE(read_at) = CURDATE()) as read_today
       FROM journey_friends jf
       JOIN book_journeys my_journey ON jf.journey_id = my_journey.id
       JOIN book_journeys bj ON jf.friend_journey_id = bj.id
       JOIN users u ON bj.user_id = u.id
       LEFT JOIN journey_progress jp ON jp.journey_id = bj.id AND DATE(jp.read_at) = CURDATE()
       WHERE my_journey.user_id = ?
       GROUP BY bj.id
       ORDER BY jp.read_at DESC
       LIMIT 50`,
      [userId]
    );

    // تصنيف النشاط
    const completedToday = activity.filter((a) => a.read_today > 0);
    const notCompletedToday = activity.filter((a) => a.read_today === 0);

    res.json({
      success: true,
      activity: {
        completed_today: completedToday.map((a) => ({
          ...a,
          progress_percent:
            a.total_hadiths > 0
              ? Math.round((a.current_position / a.total_hadiths) * 100)
              : 0,
        })),
        not_completed: notCompletedToday.map((a) => ({
          ...a,
          progress_percent:
            a.total_hadiths > 0
              ? Math.round((a.current_position / a.total_hadiths) * 100)
              : 0,
        })),
      },
      stats: {
        total_friends: activity.length,
        completed_today: completedToday.length,
        not_completed: notCompletedToday.length,
      },
    });
  } catch (error) {
    console.error("Error getting friends activity:", error);
    res
      .status(500)
      .json({ success: false, message: "خطأ في جلب نشاط الأصدقاء" });
  }
};

/**
 * DELETE /api/book-journeys/:id/unfollow/:friendJourneyId
 * إلغاء متابعة صديق
 */
const unfollowFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: journeyId, friendJourneyId } = req.params;

    // التحقق من ملكية الختمة
    const [journeys] = await db.query(
      `SELECT id FROM book_journeys WHERE id = ? AND user_id = ?`,
      [journeyId, userId]
    );

    if (journeys.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "الختمة غير موجودة" });
    }

    // إزالة الصداقة
    await db.query(
      `DELETE FROM journey_friends 
       WHERE (journey_id = ? AND friend_journey_id = ?) 
          OR (journey_id = ? AND friend_journey_id = ?)`,
      [journeyId, friendJourneyId, friendJourneyId, journeyId]
    );

    res.json({ success: true, message: "تم إلغاء المتابعة" });
  } catch (error) {
    console.error("Error unfollowing friend:", error);
    res.status(500).json({ success: false, message: "خطأ في إلغاء المتابعة" });
  }
};

// =====================================================
// Helper Functions
// =====================================================

/**
 * إشعار الأصدقاء عند إكمال الختمة
 */
const notifyFriendsOfCompletion = async (journeyId, userId, bookName) => {
  try {
    // جلب أصدقاء الختمة
    const [friends] = await db.query(
      `SELECT bj.user_id FROM journey_friends jf
       JOIN book_journeys bj ON jf.friend_journey_id = bj.id
       WHERE jf.journey_id = ?`,
      [journeyId]
    );

    // إرسال إشعار لكل صديق
    for (const friend of friends) {
      await db.query(
        `INSERT INTO journey_notifications 
         (user_id, type, related_journey_id, friend_id, message)
         VALUES (?, 'friend_finished_book', ?, ?, ?)`,
        [friend.user_id, journeyId, userId, `صديقك أكمل ختمة ${bookName}! 🎉`]
      );
    }
  } catch (error) {
    console.error("Error notifying friends:", error);
  }
};

// =====================================================
// APIs الشهادات
// =====================================================

/**
 * GET /api/book-journeys/:id/certificate/check
 * التحقق من أهلية الشهادة
 */
const checkCertificateEligibility = async (req, res) => {
  try {
    const userId = req.user.id;
    const journeyId = req.params.id;

    const eligibility = await JourneyCertificateService.isEligible(
      userId,
      journeyId
    );

    res.json({
      success: true,
      ...eligibility,
    });
  } catch (error) {
    console.error("Error checking certificate eligibility:", error);
    res
      .status(500)
      .json({ success: false, message: "خطأ في التحقق من الأهلية" });
  }
};

/**
 * POST /api/book-journeys/:id/certificate
 * إنشاء الشهادة
 */
const generateCertificate = async (req, res) => {
  try {
    const userId = req.user.id;
    const journeyId = req.params.id;

    const result = await JourneyCertificateService.generateCertificate(
      userId,
      journeyId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: "تم إنشاء الشهادة بنجاح!",
      certificate: result.certificate,
    });
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).json({ success: false, message: "خطأ في إنشاء الشهادة" });
  }
};

/**
 * GET /api/book-journeys/:id/certificate
 * جلب شهادة المستخدم
 */
const getCertificate = async (req, res) => {
  try {
    const userId = req.user.id;
    const journeyId = req.params.id;

    const certificate = await JourneyCertificateService.getUserCertificate(
      userId,
      journeyId
    );

    if (!certificate) {
      return res
        .status(404)
        .json({ success: false, message: "الشهادة غير موجودة" });
    }

    res.json({
      success: true,
      certificate,
    });
  } catch (error) {
    console.error("Error getting certificate:", error);
    res.status(500).json({ success: false, message: "خطأ في جلب الشهادة" });
  }
};

/**
 * GET /api/book-journeys/:id/certificate/download
 * تحميل شهادة المستخدم
 */
const downloadCertificate = async (req, res) => {
  try {
    const userId = req.user.id;
    const journeyId = req.params.id;

    const certificate = await JourneyCertificateService.getUserCertificate(
      userId,
      journeyId
    );

    if (!certificate) {
      return res
        .status(404)
        .json({ success: false, message: "الشهادة غير موجودة" });
    }

    const fs = require("fs");
    const path = require("path");

    const filePath = path.join(__dirname, "../", certificate.pdf_path);

    // التحقق من وجود الملف
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: "ملف الشهادة غير موجود" });
    }

    // تحديد اسم الملف للتحميل
    const filename = `شهادة_ختم_${certificate.book_name.replace(/\s+/g, "_")}_${
      certificate.certificate_number
    }.pdf`;

    // إرسال الملف للتحميل
    res.setHeader("Content-Type", "application/pdf");

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("Error streaming certificate file:", error);
      res.status(500).json({ success: false, message: "خطأ في تحميل الشهادة" });
    });
  } catch (error) {
    console.error("Error downloading certificate:", error);
    res.status(500).json({ success: false, message: "خطأ في تحميل الشهادة" });
  }
};

/**
 * GET /api/book-journeys/verify-certificate/:code
 * التحقق من صحة الشهادة (عام)
 */
const verifyCertificate = async (req, res) => {
  try {
    const { code } = req.params;

    const result = await JourneyCertificateService.verifyCertificate(code);

    res.json(result);
  } catch (error) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({ valid: false, message: "خطأ في التحقق من الشهادة" });
  }
};

// =====================================================
// إشعارات الختمات
// =====================================================

/**
 * GET /api/book-journeys/notifications
 * جلب إشعارات الختمات
 */
const getJourneyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    // جلب الإشعارات
    const [notifications] = await db.query(
      `SELECT 
        jn.id,
        jn.type,
        jn.message,
        jn.is_read,
        jn.created_at as sent_at,
        jn.related_journey_id,
        u.username as friend_name,
        u.avatar_url as friend_avatar,
        bj.book_name
       FROM journey_notifications jn
       LEFT JOIN users u ON jn.friend_id = u.id
       LEFT JOIN book_journeys bj ON jn.related_journey_id = bj.id
       WHERE jn.user_id = ?
       ORDER BY jn.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    // عدد الإشعارات غير المقروءة
    const [unreadResult] = await db.query(
      `SELECT COUNT(*) as count FROM journey_notifications 
       WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );

    // تحويل الإشعارات لتناسب الشكل المطلوب
    const formattedNotifications = notifications.map((n) => ({
      id: `journey_${n.id}`,
      type: n.type,
      title: getNotificationTitle(n.type, n.friend_name),
      message: n.message,
      is_read: n.is_read,
      sent_at: n.sent_at,
      source: "journey",
      related_journey_id: n.related_journey_id,
      friend_name: n.friend_name,
      book_name: n.book_name,
    }));

    res.json({
      success: true,
      data: {
        notifications: formattedNotifications,
        unreadCount: unreadResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error("Error getting journey notifications:", error);
    res.status(500).json({ success: false, message: "خطأ في جلب الإشعارات" });
  }
};

// دالة مساعدة لعنوان الإشعار
const getNotificationTitle = (type, friendName = null) => {
  switch (type) {
    case "friend_completed_day":
      return friendName
        ? `${friendName} أكمل ورده اليومي`
        : "صديقك أكمل ورده اليومي";
    case "friend_finished_book":
      return friendName
        ? `${friendName} أكمل ختمة الكتاب`
        : "صديقك أكمل ختمة الكتاب";
    case "friend_started_book":
      return friendName
        ? `${friendName} بدأ ختمة جديدة`
        : "صديقك بدأ ختمة جديدة";
    case "reminder":
      return "تذكير بالورد اليومي";
    default:
      return "إشعار ختمات الكتب";
  }
};

/**
 * PUT /api/book-journeys/notifications/:id/read
 * تحديد إشعار كمقروء
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id.replace("journey_", "");

    await db.query(
      `UPDATE journey_notifications SET is_read = TRUE 
       WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );

    res.json({ success: true, message: "تم تحديد الإشعار كمقروء" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "خطأ في تحديث الإشعار" });
  }
};

/**
 * PUT /api/book-journeys/notifications/read-all
 * تحديد جميع الإشعارات كمقروءة
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query(
      `UPDATE journey_notifications SET is_read = TRUE WHERE user_id = ?`,
      [userId]
    );  

    res.json({ success: true, message: "تم تحديد جميع الإشعارات كمقروءة" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ success: false, message: "خطأ في تحديث الإشعارات" });
  }
};

// ===== إحصائيات وإدارة الختمات للـ Admin =====

/**
 * الحصول على إحصائيات الختمات للـ Admin Dashboard
 */
const getBookJourneysStats = async (req, res) => {
  try {
    // إحصائيات عامة
    const [totalJourneys] = await db.query(`
        SELECT COUNT(*) as count FROM book_journeys
      `);

    const [activeJourneys] = await db.query(`
        SELECT COUNT(*) as count FROM book_journeys WHERE status = 'active'
      `);

    const [completedJourneys] = await db.query(`
        SELECT COUNT(*) as count FROM book_journeys WHERE status = 'completed'
      `);

    const [totalParticipants] = await db.query(`
        SELECT COUNT(DISTINCT user_id) as count FROM book_journeys
      `);

    const [certificates] = await db.query(`
        SELECT COUNT(*) as count FROM journey_certificates
      `);

    // حساب متوسط معدل الإنجاز
    const [completionRates] = await db.query(`
        SELECT
          bj.id,
          bj.book_slug,
          bj.total_hadiths,
          COUNT(DISTINCT jp.hadith_id) as completed_hadiths
        FROM book_journeys bj
        LEFT JOIN journey_progress jp ON bj.id = jp.journey_id
        GROUP BY bj.id, bj.book_slug, bj.total_hadiths
      `);

    let totalCompletionRate = 0;
    let validJourneys = 0;

    completionRates.forEach((journey) => {
      if (journey.total_hadiths && journey.total_hadiths > 0) {
        const rate = (journey.completed_hadiths / journey.total_hadiths) * 100;
        totalCompletionRate += rate;
        validJourneys++;
      }
    });

    const averageCompletionRate =
      validJourneys > 0 ? totalCompletionRate / validJourneys : 0;

    res.json({
      totalJourneys: totalJourneys[0].count,
      activeJourneys: activeJourneys[0].count,
      completedJourneys: completedJourneys[0].count,
      totalParticipants: totalParticipants[0].count,
      averageCompletionRate: Math.round(averageCompletionRate * 10) / 10,
      totalCertificates: certificates[0].count,
      recentActivity: [],
    });
  } catch (error) {
    console.error("Error fetching book journeys stats:", error);
    res.status(500).json({ error: "حدث خطأ في جلب الإحصائيات" });
  }
};

/**
 * الحصول على جميع الختمات مع فلترة وتصفح
 */
const getAllBookJourneys = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, user_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "";
    let params = [];

    if (status) {
      whereClause += " AND bj.status = ?";
      params.push(status);
    }

    if (user_id) {
      whereClause += " AND bj.user_id = ?";
      params.push(user_id);
    }

    // الحصول على الختمات مع معلومات المستخدم والتقدم
    const [journeys] = await db.query(
      `
        SELECT
          bj.*,
          u.username,
          u.email,
          COUNT(DISTINCT jp.hadith_id) as completed_hadiths,
          ROUND(
            (COUNT(DISTINCT jp.hadith_id) / bj.total_hadiths) * 100, 1
          ) as progress_percentage,
          bj.book_name
        FROM book_journeys bj
        JOIN users u ON bj.user_id = u.id
        LEFT JOIN journey_progress jp ON bj.id = jp.journey_id
        WHERE 1=1 ${whereClause}
        GROUP BY bj.id, bj.book_slug, bj.total_hadiths, bj.user_id, bj.pace, bj.start_date,
                 bj.current_position, bj.share_code, bj.status, bj.completed_at,
                 bj.created_at, u.username, u.email
        ORDER BY bj.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...params, parseInt(limit), offset]
    );

    // الحصول على العدد الإجمالي
    const [totalCount] = await db.query(
      `
        SELECT COUNT(*) as count FROM book_journeys bj WHERE 1=1 ${whereClause}
      `,
      params
    );

    res.json({
      journeys,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching book journeys:", error);
    res.status(500).json({ error: "حدث خطأ في جلب الختمات" });
  }
};

/**
 * الحصول على تفاصيل ختمة محددة
 */
const getBookJourneyDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [journey] = await db.query(
      `
        SELECT
          bj.*,
          u.username,
          u.email,
          COUNT(DISTINCT jp.hadith_id) as completed_hadiths,
          bj.book_name
        FROM book_journeys bj
        JOIN users u ON bj.user_id = u.id
        LEFT JOIN journey_progress jp ON bj.id = jp.journey_id
        WHERE bj.id = ?
        GROUP BY bj.id
      `,
      [id]
    );

    if (journey.length === 0) {
      return res.status(404).json({ error: "الختمة غير موجودة" });
    }

    res.json({
      journey: journey[0],
      progress: [],
    });
  } catch (error) {
    console.error("Error fetching book journey details:", error);
    res.status(500).json({ error: "حدث خطأ في جلب تفاصيل الختمة" });
  }
};

/**
 * الحصول على مشاركي ختمة محددة
 */
const getBookJourneyParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [participants] = await db.query(
      `
        SELECT
          u.id,
          u.username,
          u.email,
          bj.status,
          bj.start_date,
          bj.completed_at,
          COUNT(jp.hadith_id) as completed_hadiths,
          bj.pace,
          bj.current_position
        FROM book_journeys bj
        JOIN users u ON bj.user_id = u.id
        LEFT JOIN journey_progress jp ON bj.id = jp.journey_id
        WHERE bj.id = ?
        GROUP BY u.id, u.username, u.email, bj.status, bj.start_date, bj.completed_at, bj.pace, bj.current_position
        LIMIT ? OFFSET ?
      `,
      [id, parseInt(limit), offset]
    );

    res.json({
      participants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: participants.length,
      },
    });
  } catch (error) {
    console.error("Error fetching journey participants:", error);
    res.status(500).json({ error: "حدث خطأ في جلب المشاركين" });
  }
};

/**
 * تحديث حالة الختمة
 */
const updateBookJourneyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["active", "paused", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "حالة غير صالحة" });
    }

    await db.query(
      `
        UPDATE book_journeys
        SET status = ?, completed_at = ?
        WHERE id = ?
      `,
      [status, status === "completed" ? new Date() : null, id]
    );

    res.json({ message: "تم تحديث حالة الختمة بنجاح" });
  } catch (error) {
    console.error("Error updating book journey status:", error);
    res.status(500).json({ error: "حدث خطأ في تحديث الحالة" });
  }
};

module.exports = {
  // APIs الأساسية
  getAvailableBooks,
  getMyJourneys,
  startJourney,
  getJourneyDetails,
  getTodayHadiths,
  markHadithAsRead,
  getJourneyProgress,
  pauseJourney,
  resumeJourney,
  updatePace,
  // APIs الأصدقاء
  getShareLink,
  joinViaShareCode,
  getJourneyFriends,
  getFriendsActivity,
  unfollowFriend,
  // APIs الشهادات
  checkCertificateEligibility,
  generateCertificate,
  getCertificate,
  downloadCertificate,
  verifyCertificate,
  // APIs الإشعارات
  getJourneyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,

  // APIs الإحصائيات للـ Admin
  getBookJourneysStats,
  getAllBookJourneys,
  getBookJourneyDetails,
  getBookJourneyParticipants,
  updateBookJourneyStatus,
};
