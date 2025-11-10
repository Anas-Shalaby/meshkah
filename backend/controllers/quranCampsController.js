const CampNotificationService = require("../services/campNotificationService");
const db = require("../config/database");
const mailService = require("../services/mailService");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const shortid = require("shortid");
// ==================== USER APIs ====================

// Get all Quran camps
const getAllCamps = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user?.id || null;

    let query = `
      SELECT 
        qc.*,
        DATE_FORMAT(qc.start_date, '%Y-%m-%d') as start_date_fmt,
        DATE_FORMAT(DATE_ADD(qc.start_date, INTERVAL qc.duration_days DAY), '%Y-%m-%d') as end_date_fmt,
        COUNT(DISTINCT ce.id) as enrolled_count,
        CASE 
          WHEN qc.status = 'early_registration' THEN 'قريباً'
          WHEN qc.status = 'active' THEN 'نشط'
          WHEN qc.status = 'completed' THEN 'منتهي'
          WHEN qc.status = 'reopened' THEN 'مفتوح للاشتراك'
        END as status_ar,
        CASE 
          WHEN ? IS NOT NULL AND EXISTS(
            SELECT 1 FROM camp_enrollments ce_check 
            WHERE ce_check.camp_id = qc.id AND ce_check.user_id = ?
          ) THEN 1
          ELSE 0
        END as is_enrolled
      FROM quran_camps qc
      LEFT JOIN camp_enrollments ce ON qc.id = ce.camp_id
    `;

    const params = [userId, userId];
    // Hide templates from public listing
    query += ` WHERE qc.is_template = 0`;
    if (status) {
      query += ` AND qc.status = ?`;
      params.push(status);
    }

    query += ` GROUP BY qc.id ORDER BY qc.start_date DESC`;

    const [camps] = await db.query(query, params);

    // Normalize dates to YYYY-MM-DD strings to avoid timezone shifts
    // Convert is_enrolled to boolean, and ensure max_participants is a number or null
    const normalized = camps.map((c) => ({
      ...c,
      start_date: c.start_date_fmt || c.start_date,
      end_date: c.end_date_fmt || c.end_date,
      is_enrolled: Boolean(c.is_enrolled),
      max_participants: c.max_participants ? Number(c.max_participants) : null,
      auto_start_camp: Boolean(c.auto_start_camp),
    }));

    res.json({
      success: true,
      data: normalized,
    });
  } catch (error) {
    console.error("Error fetching camps:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب المخيمات",
    });
  }
};

const deleteCamp = async (req, res) => {
  const { id } = req.params;

  try {
    // بدء معاملة قاعدة البيانات
    await db.query("START TRANSACTION");

    try {
      // 1. حذف بيانات المهام اليومية المرتبطة بالمخيم
      await db.query("DELETE FROM camp_daily_tasks WHERE camp_id = ?", [id]);

      // 2. حذف تقدم المهام للمشتركين (عبر enrollment_id)
      await db.query(
        `
        DELETE ctp FROM camp_task_progress ctp
        INNER JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
        WHERE ce.camp_id = ?
      `,
        [id]
      );

      // 3. حذف تسجيلات المشتركين في المخيم
      await db.query("DELETE FROM camp_enrollments WHERE camp_id = ?", [id]);

      // 4. حذف المخيم نفسه
      const [result] = await db.query("DELETE FROM quran_camps WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows === 0) {
        await db.query("ROLLBACK");
        return res.status(404).json({
          status: "error",
          message: "المخيم غير موجود",
        });
      }

      // تأكيد المعاملة
      await db.query("COMMIT");

      res.status(200).json({
        status: "success",
        message: "تم حذف المخيم وجميع بياناته المرتبطة بنجاح",
      });
    } catch (error) {
      // إلغاء المعاملة في حالة الخطأ
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error deleting camp:", error);
    res.status(500).json({
      status: "error",
      message: "حدث خطأ أثناء حذف المخيم",
      error: error.message,
    });
  }
};

// Get Camp Details for Admin (with statistics)
const getCampDetailsForAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. جلب تفاصيل المخيم مع حساب end_date
    const [campRows] = await db.query(
      `SELECT 
        qc.*,
        DATE_FORMAT(qc.start_date, '%Y-%m-%d') as start_date_fmt,
        DATE_FORMAT(DATE_ADD(qc.start_date, INTERVAL qc.duration_days DAY), '%Y-%m-%d') as end_date_fmt
      FROM quran_camps qc
      WHERE qc.id = ?`,
      [id]
    );

    if (campRows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "المخيم غير موجود",
      });
    }

    const camp = {
      ...campRows[0],
      start_date: campRows[0].start_date_fmt || campRows[0].start_date,
      end_date: campRows[0].end_date_fmt || campRows[0].end_date,
    };

    // 2. جلب إحصائيات المخيم
    const [enrollmentsCount] = await db.query(
      "SELECT COUNT(*) as count FROM camp_enrollments WHERE camp_id = ?",
      [id]
    );

    const [tasksCount] = await db.query(
      "SELECT COUNT(*) as count FROM camp_daily_tasks WHERE camp_id = ?",
      [id]
    );

    const [completedTasksCount] = await db.query(
      "SELECT COUNT(*) as count FROM camp_task_progress ctp JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id WHERE ce.camp_id = ? AND ctp.completed = 1",
      [id]
    );

    const [totalPoints] = await db.query(
      "SELECT SUM(points) as total FROM camp_enrollments WHERE camp_id = ?",
      [id]
    );

    // 3. جلب قائمة المهام اليومية
    const [dailyTasks] = await db.query(
      "SELECT * FROM camp_daily_tasks WHERE camp_id = ? ORDER BY day_number",
      [id]
    );

    // 4. جلب قائمة المشتركين
    const [participants] = await db.query(
      `
      SELECT 
        ce.*,
        u.username,
        u.email,
        u.avatar_url,
        u.hide_identity
      FROM camp_enrollments ce
      LEFT JOIN users u ON ce.user_id = u.id
      WHERE ce.camp_id = ?
      ORDER BY ce.enrollment_date DESC
    `,
      [id]
    );

    res.status(200).json({
      status: "success",
      data: {
        camp,
        statistics: {
          enrollments: enrollmentsCount[0].count,
          tasks: tasksCount[0].count,
          completedTasks: completedTasksCount[0].count,
          totalPoints: totalPoints[0].total || 0,
        },
        dailyTasks,
        participants,
      },
    });
  } catch (error) {
    console.error("Error fetching camp details for admin:", error);
    res.status(500).json({
      status: "error",
      message: "حدث خطأ في جلب تفاصيل المخيم",
      error: error.message,
    });
  }
};

// Get camp details
const getCampDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null; // السماح بالوصول بدون token

    // دعم جلب التفاصيل عبر share_link أو id رقمي
    const isShareLink = isNaN(Number(id));
    const whereClause = isShareLink ? "qc.share_link = ?" : "qc.id = ?";

    const [camps] = await db.query(
      `
  SELECT 
    qc.*,
    DATE_FORMAT(qc.start_date, '%Y-%m-%d') as start_date_fmt,
    DATE_FORMAT(DATE_ADD(qc.start_date, INTERVAL qc.duration_days DAY), '%Y-%m-%d') as end_date_fmt,
    COUNT(ce.id) as enrolled_count,
    CASE 
      WHEN qc.status = 'early_registration' THEN 'قريباً'
      WHEN qc.status = 'active' THEN 'نشط'
      WHEN qc.status = 'completed' THEN 'منتهي'
      WHEN qc.status = 'reopened' THEN 'مفتوح للاشتراك'
    END as status_ar,
    CASE 
      WHEN ? IS NOT NULL AND EXISTS(SELECT 1 FROM camp_enrollments ce2 WHERE ce2.camp_id = qc.id AND ce2.user_id = ?) THEN 1
      ELSE 0
    END as is_enrolled,
    CASE 
      WHEN qc.status = 'completed' THEN 1
      ELSE 0
    END as is_read_only
  FROM quran_camps qc
  LEFT JOIN camp_enrollments ce ON qc.id = ce.camp_id
  WHERE ${whereClause}
  GROUP BY qc.id
  `,
      [userId, userId, id]
    );

    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    const camp = {
      ...camps[0],
      start_date: camps[0].start_date_fmt || camps[0].start_date,
      end_date: camps[0].end_date_fmt || camps[0].end_date,
    };
    let joinedLate = false;
    let missedDaysCount = 0;
    let nowDayNumber = 1;

    // حساب اليوم الحالي بالنسبة لبدء المخيم (1..duration_days)
    try {
      if (camp.start_date && camp.duration_days) {
        const start = new Date(camp.start_date);
        const today = new Date();
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysSinceStart = Math.floor((today - start) / msPerDay) + 1; // اليوم الأول = 1
        const clamped = Math.max(
          1,
          Math.min(daysSinceStart, Number(camp.duration_days))
        );
        nowDayNumber = isFinite(clamped) ? clamped : 1;
      }
    } catch (_) {
      nowDayNumber = 1;
    }

    // إذا كان المستخدم مسجل، احسب إذا انضم متأخراً وعدد الأيام الفائتة
    if (userId && camp.is_enrolled && camp.status === "active") {
      const [enrollment] = await db.query(
        `
        SELECT created_at, enrollment_date
        FROM camp_enrollments 
        WHERE user_id = ? AND camp_id = ?
      `,
        [userId, id]
      );

      if (enrollment.length > 0) {
        const enrollmentDate = new Date(
          enrollment[0].enrollment_date || enrollment[0].created_at
        );
        const campStartDate = new Date(camp.start_date);
        const enrollmentDateByMonthAndYear = enrollmentDate
          .toISOString()
          .slice(0, 10);
        const campStartDateByMonthAndYear = campStartDate
          .toISOString()
          .slice(0, 10);

        if (enrollmentDateByMonthAndYear > campStartDateByMonthAndYear) {
          joinedLate = true;
          const diffTime = enrollmentDate - campStartDate;
          missedDaysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }
    }

    res.json({
      success: true,
      data: {
        ...camp,
        is_read_only: Boolean(camp.is_read_only),
        joined_late: joinedLate,
        missed_days_count: missedDaysCount,
        now_day_number: nowDayNumber,
      },
    });
  } catch (error) {
    console.error("Error fetching camp details:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب تفاصيل المخيم",
    });
  }
};

// Get daily tasks for a camp
const getCampDailyTasks = async (req, res) => {
  try {
    const { id } = req.params;
    const { axisId } = req.query; // دعم التصفية حسب ID المحور
    const userId = req.user?.id || null; // قد يكون null إذا لم يكن المستخدم مسجل الدخول

    // بناء استعلام SQL مع إمكانية التصفية حسب المحور
    let whereClause = "WHERE cdt.camp_id = ?";
    const queryParams = [id];

    if (axisId) {
      whereClause += " AND cdt.group_id = ?";
      queryParams.push(axisId);
    }

    // جلب المهام الأساسية
    const [tasks] = await db.query(
      `
      SELECT 
        cdt.*,
        CASE 
          WHEN cdt.task_type = 'reading' THEN 'قراءة'
          WHEN cdt.task_type = 'memorization' THEN 'حفظ'
          WHEN cdt.task_type = 'prayer' THEN 'صلاة'
          WHEN cdt.task_type = 'tafseer_tabari' THEN 'تفسير الطبري'
          WHEN cdt.task_type = 'tafseer_kathir' THEN 'تفسير ابن كثير'
          WHEN cdt.task_type = 'youtube' THEN 'فيديو'
          WHEN cdt.task_type = 'journal' THEN 'يوميات'
        END as task_type_ar,
        ctg.id as group_id,
        ctg.title as group_title,
        ctg.description as group_description,
        ctg.parent_group_id,
        ctg.order_in_camp as group_order,
        ctg.unlock_date as group_unlock_date,
        COALESCE(completion_counts.completed_by_count, 0) as completed_by_count
      FROM camp_daily_tasks cdt
      LEFT JOIN camp_task_groups ctg ON cdt.group_id = ctg.id
      LEFT JOIN (
        SELECT 
          task_id,
          COUNT(*) as completed_by_count
        FROM camp_task_progress
        WHERE completed = true
        GROUP BY task_id
      ) completion_counts ON cdt.id = completion_counts.task_id
      ${whereClause}
      ORDER BY 
        COALESCE(ctg.order_in_camp, 999999),
        cdt.day_number, 
        COALESCE(cdt.order_in_group, cdt.order_in_day)
    `,
      queryParams
    );

    // إذا كان المستخدم مسجل الدخول، أضف معلومات الأصدقاء
    if (userId) {
      // 1. جلب قائمة IDs الأصدقاء من camp_friendships (في هذا المخيم فقط)
      const [campFriendships] = await db.query(
        `SELECT
          CASE
            WHEN user1_id = ? THEN user2_id
            ELSE user1_id
          END as friend_id
        FROM camp_friendships
        WHERE camp_id = ? AND (user1_id = ? OR user2_id = ?)`,
        [userId, id, userId, userId]
      );

      const friendIds = campFriendships.map((f) => f.friend_id);

      if (friendIds.length > 0) {
        // 2. جلب enrollment_ids للأصدقاء في هذا المخيم
        const placeholders = friendIds.map(() => "?").join(",");
        const [friendEnrollments] = await db.query(
          `SELECT id, user_id
           FROM camp_enrollments
           WHERE user_id IN (${placeholders}) AND camp_id = ?`,
          [...friendIds, id]
        );

        const friendEnrollmentIds = friendEnrollments.map((e) => e.id);

        if (friendEnrollmentIds.length > 0) {
          // 3. جلب كل task_progress للأصدقاء لمهام هذا المخيم (استعلام واحد لتحسين الأداء)
          // التحقق من وجود tasks قبل تنفيذ الاستعلام
          if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            // لا توجد مهام، لا حاجة لإضافة بيانات الأصدقاء
            // المهام فارغة بالفعل أو سيتم إرجاعها فارغة
          } else {
            const taskIds = tasks.map((t) => t.id);

            // التحقق من وجود taskIds قبل بناء SQL query
            if (taskIds.length > 0) {
              const taskPlaceholders = taskIds.map(() => "?").join(",");
              const enrollmentPlaceholders = friendEnrollmentIds
                .map(() => "?")
                .join(",");

              const [allFriendsProgress] = await db.query(
                `SELECT 
                  ctp.task_id,
                  ctp.enrollment_id,
                  u.id as user_id,
                  u.username,
                  u.avatar_url as profile_picture
                FROM camp_task_progress ctp
                JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
                JOIN users u ON ce.user_id = u.id
                WHERE ctp.task_id IN (${taskPlaceholders})
                  AND ctp.enrollment_id IN (${enrollmentPlaceholders})
                  AND ctp.completed = true`,
                [...taskIds, ...friendEnrollmentIds]
              );

              // 4. تجميع البيانات حسب task_id
              const friendsByTask = new Map();

              allFriendsProgress.forEach((progress) => {
                const taskId = progress.task_id;
                if (!friendsByTask.has(taskId)) {
                  friendsByTask.set(taskId, []);
                }
                friendsByTask.get(taskId).push({
                  id: progress.user_id,
                  username: progress.username,
                  profile_picture: progress.profile_picture,
                });
              });

              // 5. إضافة البيانات إلى كل مهمة
              tasks.forEach((task) => {
                const friendsWhoCompleted = friendsByTask.get(task.id) || [];
                task.completed_by_friends = friendsWhoCompleted;
              });
            } else {
              // لا توجد task IDs، تحديد completed_by_friends كـ []
              tasks.forEach((task) => {
                task.completed_by_friends = [];
              });
            }
          }
        } else {
          // لا يوجد أصدقاء مسجلين في هذا المخيم
          if (tasks && Array.isArray(tasks)) {
            tasks.forEach((task) => {
              task.completed_by_friends = [];
            });
          }
        }
      } else {
        // لا يوجد أصدقاء
        if (tasks && Array.isArray(tasks)) {
          tasks.forEach((task) => {
            task.completed_by_friends = [];
          });
        }
      }
    } else {
      // المستخدم غير مسجل الدخول، لا توجد معلومات عن الأصدقاء
      if (tasks && Array.isArray(tasks)) {
        tasks.forEach((task) => {
          task.completed_by_friends = [];
        });
      }
    }

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Error fetching daily tasks:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب المهام اليومية",
    });
  }
};

// Enroll in a camp
const enrollInCamp = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { hide_identity = false } = req.body;

    // Check if camp exists and is open for enrollment
    // السماح بالتسجيل في early_registration, active, reopened, و completed
    const [camps] = await db.query(
      `
      SELECT * FROM quran_camps 
      WHERE id = ?
    `,
      [id]
    );

    if (camps.length === 0) {
      return res.status(400).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    const camp = camps[0];
    const isReadOnly = camp.status === "completed";

    // Check if user is already enrolled
    const [existingEnrollment] = await db.query(
      `
      SELECT * FROM camp_enrollments 
      WHERE user_id = ? AND camp_id = ?
    `,
      [userId, id]
    );

    if (existingEnrollment.length > 0) {
      return res.status(400).json({
        success: false,
        message: "أنت مسجل بالفعل في هذا المخيم",
      });
    }

    // Generate unique friend code
    const generateFriendCode = () => {
      // استخدام تنسيق: FC-{camp_id}-{random}
      // نستخدم timestamp + random للضمان التفرد
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `FC-${id}-${timestamp}-${random}`;
    };

    let friendCode = generateFriendCode();
    let codeExists = true;
    let attempts = 0;
    const maxAttempts = 10;

    // التأكد من تفرد الكود
    while (codeExists && attempts < maxAttempts) {
      const [existingCode] = await db.query(
        `SELECT id FROM camp_enrollments WHERE friend_code = ? AND camp_id = ?`,
        [friendCode, id]
      );

      if (existingCode.length === 0) {
        codeExists = false;
      } else {
        friendCode = generateFriendCode();
        attempts++;
      }
    }

    if (codeExists) {
      // في حالة فشل توليد كود فريد (نادر جداً)، نستخدم fallback
      friendCode = `FC-${id}-${userId}-${Date.now()}`;
    }

    // Create enrollment with friend code
    const [enrollmentResult] = await db.query(
      `
      INSERT INTO camp_enrollments (user_id, camp_id, status, friend_code)
      VALUES (?, ?, 'enrolled', ?)
    `,
      [userId, id, friendCode]
    );

    const enrollmentId = enrollmentResult.insertId;

    // Create camp settings with hide_identity
    await db.query(
      `
      INSERT INTO camp_settings (enrollment_id, hide_identity)
      VALUES (?, ?)
    `,
      [enrollmentId, hide_identity]
    );

    // Send welcome notification only if camp is not completed
    if (!isReadOnly) {
      try {
        await CampNotificationService.sendWelcomeNotification(
          userId,
          id,
          camp.name
        );
      } catch (notificationError) {
        console.error("Error sending welcome notification:", notificationError);
        // Don't fail the enrollment if notification fails
      }
      const [user] = await db.query(
        `
        SELECT * FROM users WHERE id = ?
      `,
        [userId]
      );
      // Send welcome email
      try {
        await mailService.sendCampWelcomeEmail(
          user[0].email,
          user[0].username,
          camp.name,
          id
        );
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Don't fail the enrollment if email fails
      }
    }

    res.json({
      success: true,
      message: isReadOnly
        ? "تم التسجيل في المخيم المنتهي. يمكنك إكمال المهام لكن بدون تفاعل اجتماعي"
        : "تم التسجيل في المخيم بنجاح",
      data: {
        read_only: isReadOnly,
      },
    });
  } catch (error) {
    console.error("Error enrolling in camp:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في التسجيل",
    });
  }
};

// Get user's progress in a camp
const getMyProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get enrollment info
    const [enrollments] = await db.query(
      `
      SELECT 
        ce.*,
        qc.name as camp_name,
        qc.surah_name,
        qc.start_date as camp_start_date,
        qc.duration_days
      FROM camp_enrollments ce
      JOIN quran_camps qc ON ce.camp_id = qc.id
      WHERE ce.user_id = ? AND ce.camp_id = ?
    `,
      [userId, id]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "لست مسجلاً في هذا المخيم",
      });
    }

    // Get all tasks for the camp with completion count
    const [tasks] = await db.query(
      `
      SELECT 
        cdt.*,
        ctp.completed,
        ctp.completed_at,
        ctp.journal_entry,
        ctp.notes,
        COALESCE(completion_counts.completed_by_count, 0) as completed_by_count
      FROM camp_daily_tasks cdt
      LEFT JOIN camp_task_progress ctp ON cdt.id = ctp.task_id AND ctp.enrollment_id = ?
      LEFT JOIN (
        SELECT 
          task_id,
          COUNT(*) as completed_by_count
        FROM camp_task_progress
        WHERE completed = true
        GROUP BY task_id
      ) completion_counts ON cdt.id = completion_counts.task_id
      WHERE cdt.camp_id = ?
      ORDER BY cdt.day_number, cdt.order_in_day
    `,
      [enrollments[0].id, id]
    );

    // إضافة بيانات الأصدقاء (نفس المنطق من getCampDailyTasks)
    // 1. جلب قائمة IDs الأصدقاء من camp_friendships (في هذا المخيم فقط)
    const [campFriendships] = await db.query(
      `SELECT
        CASE
          WHEN user1_id = ? THEN user2_id
          ELSE user1_id
        END as friend_id
      FROM camp_friendships
      WHERE camp_id = ? AND (user1_id = ? OR user2_id = ?)`,
      [userId, id, userId, userId]
    );

    const friendIds = campFriendships.map((f) => f.friend_id);

    if (friendIds.length > 0) {
      // 2. جلب enrollment_ids للأصدقاء في هذا المخيم
      const placeholders = friendIds.map(() => "?").join(",");
      const [friendEnrollments] = await db.query(
        `SELECT id, user_id
         FROM camp_enrollments
         WHERE user_id IN (${placeholders}) AND camp_id = ?`,
        [...friendIds, id]
      );

      const friendEnrollmentIds = friendEnrollments.map((e) => e.id);

      if (friendEnrollmentIds.length > 0) {
        // 3. جلب كل task_progress للأصدقاء لمهام هذا المخيم
        // التحقق من وجود tasks قبل تنفيذ الاستعلام
        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
          // لا توجد مهام، لا حاجة لإضافة بيانات الأصدقاء
          // المهام فارغة بالفعل أو سيتم إرجاعها فارغة
        } else {
          const taskIds = tasks.map((t) => t.id);

          // التحقق من وجود taskIds قبل بناء SQL query
          if (taskIds.length > 0) {
            const taskPlaceholders = taskIds.map(() => "?").join(",");
            const enrollmentPlaceholders = friendEnrollmentIds
              .map(() => "?")
              .join(",");

            const [allFriendsProgress] = await db.query(
              `SELECT 
                ctp.task_id,
                ctp.enrollment_id,
                u.id as user_id,
                u.username,
                u.avatar_url as profile_picture
              FROM camp_task_progress ctp
              JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
              JOIN users u ON ce.user_id = u.id
              WHERE ctp.task_id IN (${taskPlaceholders})
                AND ctp.enrollment_id IN (${enrollmentPlaceholders})
                AND ctp.completed = true`,
              [...taskIds, ...friendEnrollmentIds]
            );

            // 4. تجميع البيانات حسب task_id
            const friendsByTask = new Map();

            allFriendsProgress.forEach((progress) => {
              const taskId = progress.task_id;
              if (!friendsByTask.has(taskId)) {
                friendsByTask.set(taskId, []);
              }
              friendsByTask.get(taskId).push({
                id: progress.user_id,
                username: progress.username,
                profile_picture: progress.profile_picture,
              });
            });

            // 5. إضافة البيانات إلى كل مهمة
            tasks.forEach((task) => {
              const friendsWhoCompleted = friendsByTask.get(task.id) || [];
              task.completed_by_friends = friendsWhoCompleted;
            });
          } else {
            // لا توجد task IDs، تحديد completed_by_friends كـ []
            tasks.forEach((task) => {
              task.completed_by_friends = [];
            });
          }
        }
      } else {
        // لا يوجد أصدقاء مسجلين في هذا المخيم
        if (tasks && Array.isArray(tasks)) {
          tasks.forEach((task) => {
            task.completed_by_friends = [];
          });
        }
      }
    } else {
      // لا يوجد أصدقاء
      if (tasks && Array.isArray(tasks)) {
        tasks.forEach((task) => {
          task.completed_by_friends = [];
        });
      }
    }

    // Calculate progress
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;
    const progressPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Get user's rank in the camp using DENSE_RANK to handle ties correctly
    const [rankResult] = await db.query(
      `
      SELECT 
        user_rank
      FROM (
        SELECT 
          ce.user_id,
          DENSE_RANK() OVER (ORDER BY ce.total_points DESC) as user_rank
        FROM camp_enrollments ce
        WHERE ce.camp_id = ?
      ) ranked_users
      WHERE ranked_users.user_id = ?
      `,
      [id, userId]
    );

    const userRank = rankResult[0]?.user_rank || 1;

    res.json({
      success: true,
      data: {
        enrollment: enrollments[0],
        tasks,
        progress: {
          totalTasks,
          completedTasks,
          progressPercentage,
          rank: userRank,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب التقدم",
    });
  }
};

// Complete a task
const completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const { journal_entry, notes } = req.body;

    // Validation: Check if benefits are provided
    if (!notes || !notes.trim()) {
      return res.status(400).json({
        success: false,
        message: "يرجى كتابة الفوائد المستخرجة من المهمة",
      });
    }

    // Extract benefits from notes
    const benefitsMatch = notes.match(
      /الفوائد المستخرجة:\s*([\s\S]*?)(?:\n\n|$)/
    );
    const benefits = benefitsMatch ? benefitsMatch[1].trim() : "";

    // Validation: Check minimum word count for benefits
    const wordCount = benefits
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    if (wordCount < 20) {
      return res.status(400).json({
        success: false,
        message: "يرجى كتابة 20 كلمة على الأقل في الفوائد المستخرجة",
      });
    }

    // Check if camp status allows task completion (must be active or reopened, not early_registration or completed)
    const [campStatus] = await db.query(
      `
      SELECT qc.status, qc.name as camp_name FROM quran_camps qc
      JOIN camp_daily_tasks cdt ON qc.id = cdt.camp_id
      WHERE cdt.id = ?
    `,
      [taskId]
    );

    if (campStatus.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المهمة غير موجودة",
      });
    }

    const campStatusValue = campStatus[0].status;
    const isReadOnly = campStatusValue === "completed";

    // منع إكمال المهام إذا كان المخيم في حالة "early_registration"
    if (campStatusValue === "early_registration") {
      return res.status(403).json({
        success: false,
        message: "المخيم لم يبدأ بعد. يرجى الانتظار حتى يبدأ الادمن المخيم.",
      });
    }

    // منع إضافة ملاحظات/فوائد في المخيمات المنتهية
    if (isReadOnly) {
      return res.status(400).json({
        success: false,
        message:
          "لا يمكن إضافة ملاحظات أو فوائد في المخيمات المنتهية. يمكنك إكمال المهام فقط.",
      });
    }

    // السماح فقط للمخيمات النشطة أو المفتوحة للاشتراك
    if (campStatusValue !== "active" && campStatusValue !== "reopened") {
      return res.status(403).json({
        success: false,
        message: "المخيم غير نشط حالياً. لا يمكنك إكمال المهام.",
      });
    }

    // Get task details
    const [tasks] = await db.query(
      `
      SELECT cdt.*, qc.id as camp_id
      FROM camp_daily_tasks cdt
      JOIN quran_camps qc ON cdt.camp_id = qc.id
      WHERE cdt.id = ?
    `,
      [taskId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المهمة غير موجودة",
      });
    }

    // Get user's enrollment
    const [enrollments] = await db.query(
      `
      SELECT * FROM camp_enrollments 
      WHERE user_id = ? AND camp_id = ?
    `,
      [userId, tasks[0].camp_id]
    );

    if (enrollments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "لست مسجلاً في هذا المخيم",
      });
    }

    // Use transaction with row locking to prevent race conditions
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if task is already completed with row lock (FOR UPDATE)
      const [existingProgress] = await connection.query(
        `
        SELECT * FROM camp_task_progress 
        WHERE enrollment_id = ? AND task_id = ?
        FOR UPDATE
      `,
        [enrollments[0].id, taskId]
      );

      if (existingProgress.length > 0 && existingProgress[0].completed) {
        await connection.rollback();
        connection.release();
        return res.status(200).json({
          success: true,
          message: "هذه المهمة مكتملة بالفعل",
          alreadyCompleted: true,
        });
      }

      // Update or create progress
      let affectedRows = 0;
      if (existingProgress.length > 0) {
        const [updateResult] = await connection.query(
          `
          UPDATE camp_task_progress 
          SET completed = true, completed_at = NOW(), journal_entry = ?, notes = ?
          WHERE enrollment_id = ? AND task_id = ? AND completed = false
        `,
          [journal_entry, notes, enrollments[0].id, taskId]
        );
        affectedRows = updateResult.affectedRows || 0;
      } else {
        // Use INSERT to create new progress
        try {
          const [insertResult] = await connection.query(
            `
            INSERT INTO camp_task_progress (enrollment_id, task_id, completed, completed_at, journal_entry, notes)
            VALUES (?, ?, true, NOW(), ?, ?)
          `,
            [enrollments[0].id, taskId, journal_entry, notes]
          );
          affectedRows = insertResult.affectedRows || 0;
        } catch (insertError) {
          // If duplicate key error, task was just completed by another request
          if (
            insertError.code === "ER_DUP_ENTRY" ||
            insertError.errno === 1062
          ) {
            await connection.rollback();
            connection.release();
            return res.status(200).json({
              success: true,
              message: "هذه المهمة مكتملة بالفعل",
              alreadyCompleted: true,
            });
          }
          throw insertError;
        }
      }

      // Update total points only if task was actually completed (not already completed) and camp is not completed
      if (affectedRows > 0 && !isReadOnly) {
        await connection.query(
          `
          UPDATE camp_enrollments 
          SET total_points = total_points + ?
          WHERE id = ?
        `,
          [tasks[0].points, enrollments[0].id]
        );
      }

      await connection.commit();
      connection.release();
    } catch (transactionError) {
      await connection.rollback();
      connection.release();
      throw transactionError;
    }

    // Update streak only if camp is not completed
    if (!isReadOnly) {
      const streakInfo = await updateStreak(enrollments[0].id);

      // Send achievement notification
      try {
        await CampNotificationService.sendAchievementNotification(
          userId,
          tasks[0].camp_id,
          tasks[0].name || "المخيم القرآني",
          tasks[0].title,
          tasks[0].points
        );
      } catch (notificationError) {
        console.error(
          "Error sending achievement notification:",
          notificationError
        );
      }
    }

    // Check for milestones and send milestone notifications
    try {
      const [totalPointsResult] = await db.query(
        `SELECT total_points FROM camp_enrollments WHERE id = ?`,
        [enrollments[0].id]
      );

      const totalPoints = totalPointsResult[0].total_points;

      // Check for milestone achievements
      if (totalPoints >= 50 && totalPoints - tasks[0].points < 50) {
        await CampNotificationService.sendMilestoneNotification(
          userId,
          tasks[0].camp_id,
          tasks[0].name || "المخيم القرآني",
          "50 نقطة",
          totalPoints
        );
      } else if (totalPoints >= 100 && totalPoints - tasks[0].points < 100) {
        await CampNotificationService.sendMilestoneNotification(
          userId,
          tasks[0].camp_id,
          tasks[0].name || "المخيم القرآني",
          "100 نقطة",
          totalPoints
        );
      } else if (totalPoints >= 200 && totalPoints - tasks[0].points < 200) {
        await CampNotificationService.sendMilestoneNotification(
          userId,
          tasks[0].camp_id,
          tasks[0].name || "المخيم القرآني",
          "200 نقطة",
          totalPoints
        );
      }
    } catch (milestoneError) {
      console.error("Error sending milestone notification:", milestoneError);
    }

    // Clear leaderboard cache for this camp
    try {
      const redisClient = require("../utils/redisClient");
      if (redisClient) {
        const cachePattern = `leaderboard_${tasks[0].camp_id}_*`;
        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      }
    } catch (redisError) {
      console.log("Redis not available for cache clearing");
    }

    res.json({
      success: true,
      message: "تم إكمال المهمة بنجاح",
      data: {
        pointsEarned: tasks[0].points,
        currentStreak: streakInfo.current,
        longestStreak: streakInfo.longest,
        wordCount: wordCount,
      },
    });
  } catch (error) {
    console.error("Error completing task:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إكمال المهمة",
    });
  }
};

// Mark task as completed (without journal entry)
const markTaskComplete = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Get task details with camp status
    const [tasks] = await db.query(
      `
      SELECT cdt.*, qc.id as camp_id, qc.status as camp_status, qc.name as camp_name
      FROM camp_daily_tasks cdt
      JOIN quran_camps qc ON cdt.camp_id = qc.id
      WHERE cdt.id = ?
    `,
      [taskId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المهمة غير موجودة",
      });
    }

    // Check if camp status allows task completion (must be active or reopened)
    const campStatusValue = tasks[0].camp_status;
    const isReadOnly = campStatusValue === "completed";

    // منع إكمال المهام إذا كان المخيم في حالة "early_registration"
    if (campStatusValue === "early_registration") {
      return res.status(403).json({
        success: false,
        message: "المخيم لم يبدأ بعد. يرجى الانتظار حتى يبدأ الادمن المخيم.",
      });
    }

    // السماح فقط للمخيمات النشطة أو المفتوحة للاشتراك أو المنتهية (للقراءة فقط)
    if (
      campStatusValue !== "active" &&
      campStatusValue !== "reopened" &&
      campStatusValue !== "completed"
    ) {
      return res.status(403).json({
        success: false,
        message: "المخيم غير نشط حالياً. لا يمكنك إكمال المهام.",
      });
    }

    // Get user's enrollment
    const [enrollments] = await db.query(
      `
      SELECT * FROM camp_enrollments 
      WHERE user_id = ? AND camp_id = ?
    `,
      [userId, tasks[0].camp_id]
    );

    if (enrollments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "لست مسجلاً في هذا المخيم",
      });
    }

    // Use transaction with row locking to prevent race conditions
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if task is already completed with row lock (FOR UPDATE)
      const [existingProgress] = await connection.query(
        `
        SELECT * FROM camp_task_progress 
        WHERE enrollment_id = ? AND task_id = ?
        FOR UPDATE
      `,
        [enrollments[0].id, taskId]
      );

      if (existingProgress.length > 0 && existingProgress[0].completed) {
        await connection.rollback();
        connection.release();
        return res.status(200).json({
          success: true,
          message: "هذه المهمة مكتملة بالفعل",
          alreadyCompleted: true,
        });
      }

      // Update or create progress
      let affectedRows = 0;
      if (existingProgress.length > 0) {
        const [updateResult] = await connection.query(
          `
          UPDATE camp_task_progress 
          SET completed = true, completed_at = NOW()
          WHERE enrollment_id = ? AND task_id = ? AND completed = false
        `,
          [enrollments[0].id, taskId]
        );
        affectedRows = updateResult.affectedRows || 0;
      } else {
        // Use INSERT IGNORE to prevent duplicate key errors
        try {
          const [insertResult] = await connection.query(
            `
            INSERT INTO camp_task_progress (enrollment_id, task_id, completed, completed_at)
            VALUES (?, ?, true, NOW())
          `,
            [enrollments[0].id, taskId]
          );
          affectedRows = insertResult.affectedRows || 0;
        } catch (insertError) {
          // If duplicate key error, task was just completed by another request
          if (
            insertError.code === "ER_DUP_ENTRY" ||
            insertError.errno === 1062
          ) {
            await connection.rollback();
            connection.release();
            return res.status(200).json({
              success: true,
              message: "هذه المهمة مكتملة بالفعل",
              alreadyCompleted: true,
            });
          }
          throw insertError;
        }
      }

      // Update total points only if task was actually completed (not already completed) and camp is not completed
      if (affectedRows > 0 && !isReadOnly) {
        await connection.query(
          `
          UPDATE camp_enrollments 
          SET total_points = total_points + ?
          WHERE id = ?
        `,
          [tasks[0].points, enrollments[0].id]
        );
      }

      await connection.commit();
      connection.release();
    } catch (transactionError) {
      await connection.rollback();
      connection.release();
      throw transactionError;
    }

    // Update streak and send notification only if camp is not completed
    if (!isReadOnly) {
      const streakInfo = await updateStreak(enrollments[0].id);

      // Send achievement notification
      try {
        await CampNotificationService.sendAchievementNotification(
          userId,
          tasks[0].camp_id,
          tasks[0].camp_name,
          tasks[0].title,
          tasks[0].points
        );
      } catch (notificationError) {
        console.error(
          "Error sending achievement notification:",
          notificationError
        );
      }

      // تسجيل نشاط الـ Streak إذا وصل لرقم مميز (3, 5, 7 أيام)
      if (streakInfo && streakInfo.current) {
        const streakCount = streakInfo.current;
        if ([3, 5, 7, 10, 14, 21, 30].includes(streakCount)) {
          try {
            const streakDetails = JSON.stringify({
              streak_count: streakCount,
            });
            await db.query(
              `INSERT INTO user_activity (user_id, camp_id, activity_type, details)
               VALUES (?, ?, 'streak_achieved', ?)`,
              [userId, tasks[0].camp_id, streakDetails]
            );
          } catch (streakActivityError) {
            console.error(
              "Error logging streak activity:",
              streakActivityError
            );
            // لا نوقف العملية إذا فشل تسجيل النشاط
          }
        }
      }
    }

    // Check for milestones and send milestone notifications
    try {
      const [totalPointsResult] = await db.query(
        `SELECT total_points FROM camp_enrollments WHERE id = ?`,
        [enrollments[0].id]
      );

      const totalPoints = totalPointsResult[0].total_points;

      // Check for milestone achievements
      if (totalPoints >= 50 && totalPoints - tasks[0].points < 50) {
        await CampNotificationService.sendMilestoneNotification(
          userId,
          tasks[0].camp_id,
          tasks[0].name || "المخيم القرآني",
          "50 نقطة",
          totalPoints
        );
      } else if (totalPoints >= 100 && totalPoints - tasks[0].points < 100) {
        await CampNotificationService.sendMilestoneNotification(
          userId,
          tasks[0].camp_id,
          tasks[0].name || "المخيم القرآني",
          "100 نقطة",
          totalPoints
        );
      } else if (totalPoints >= 200 && totalPoints - tasks[0].points < 200) {
        await CampNotificationService.sendMilestoneNotification(
          userId,
          tasks[0].camp_id,
          tasks[0].name || "المخيم القرآني",
          "200 نقطة",
          totalPoints
        );
      }
    } catch (milestoneError) {
      console.error("Error sending milestone notification:", milestoneError);
    }

    // تسجيل نشاط إكمال المهمة
    try {
      const details = JSON.stringify({
        task_name: tasks[0].title,
        day: tasks[0].day_number || null,
        task_id: taskId,
      });
      await db.query(
        `INSERT INTO user_activity (user_id, camp_id, activity_type, details)
         VALUES (?, ?, 'task_completed', ?)`,
        [userId, tasks[0].camp_id, details]
      );
    } catch (activityError) {
      console.error("Error logging task completion activity:", activityError);
      // لا نوقف العملية إذا فشل تسجيل النشاط
    }

    // Clear leaderboard cache for this camp
    try {
      const redisClient = require("../utils/redisClient");
      if (redisClient) {
        const cachePattern = `leaderboard_${tasks[0].camp_id}_*`;
        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      }
    } catch (redisError) {
      console.log("Redis not available for cache clearing");
    }

    res.json({
      success: true,
      message: "تم إكمال المهمة بنجاح",
      data: {
        task_id: taskId,
        points_earned: tasks[0].points,
      },
    });
  } catch (error) {
    console.error("Error marking task complete:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إكمال المهمة",
    });
  }
};

// Update task benefits (without completing the task)
const updateTaskBenefits = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const { journal_entry, benefits, content_rich, is_private, proposed_step } =
      req.body;

    // تنظيف journal_entry (تحويل null/undefined/empty string إلى null)
    const cleanedJournalEntry =
      journal_entry &&
      typeof journal_entry === "string" &&
      journal_entry.trim() !== ""
        ? journal_entry.trim()
        : null;

    // قيمة is_private: true = شخصي، false = عام (يظهر في قاعة التدارس)
    // إذا لم يتم إرسالها، نعتبرها true (شخصي) للتوافق العكسي
    const isPrivate = is_private !== undefined ? Boolean(is_private) : true;

    // Get task details with camp status
    const [tasks] = await db.query(
      `
      SELECT cdt.*, qc.id as camp_id, qc.status as camp_status, qc.name as camp_name
      FROM camp_daily_tasks cdt
      JOIN quran_camps qc ON cdt.camp_id = qc.id
      WHERE cdt.id = ?
    `,
      [taskId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المهمة غير موجودة",
      });
    }

    // Check if camp status allows updating benefits (must be active or reopened)
    const campStatusValue = tasks[0].camp_status;

    // منع حفظ الفوائد إذا كان المخيم في حالة "early_registration"
    if (campStatusValue === "early_registration") {
      return res.status(403).json({
        success: false,
        message: "المخيم لم يبدأ بعد. يرجى الانتظار حتى يبدأ الادمن المخيم.",
      });
    }

    // منع حفظ الفوائد إذا كان المخيم مكتملاً
    if (campStatusValue === "completed") {
      return res.status(400).json({
        success: false,
        message: "لا يمكن التفاعل مع مهام المخيمات المكتملة",
      });
    }

    // السماح فقط للمخيمات النشطة أو المفتوحة للاشتراك
    if (campStatusValue !== "active" && campStatusValue !== "reopened") {
      return res.status(403).json({
        success: false,
        message: "المخيم غير نشط حالياً. لا يمكنك حفظ الفوائد.",
      });
    }

    // Get user's enrollment
    const [enrollments] = await db.query(
      `
      SELECT * FROM camp_enrollments 
      WHERE user_id = ? AND camp_id = ?
    `,
      [userId, tasks[0].camp_id]
    );

    if (enrollments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "لست مسجلاً في هذا المخيم",
      });
    }

    // Check if task progress exists
    const [existingProgress] = await db.query(
      `
      SELECT * FROM camp_task_progress 
      WHERE enrollment_id = ? AND task_id = ?
      `,
      [enrollments[0].id, taskId]
    );

    // التحقق من حالة journal_entry قبل وبعد التحديث (لإدارة النقاط)
    const hadJournalEntryBefore =
      existingProgress.length > 0 &&
      existingProgress[0].journal_entry !== null &&
      existingProgress[0].journal_entry !== "" &&
      typeof existingProgress[0].journal_entry === "string" &&
      existingProgress[0].journal_entry.trim() !== "";

    const hasJournalEntryAfter = cleanedJournalEntry !== null;

    // Prepare notes with benefits (backward compatibility)
    const updatedNotes = benefits ? `الفوائد المستخرجة:\n${benefits}` : "";

    // Prepare content_rich as JSON string if provided
    const contentRichJson = content_rich ? JSON.stringify(content_rich) : null;

    // التحقق من أن الفائدة لم تكن عامة مسبقاً (لتجنب تسجيل النشاط مرتين)
    const wasPrivateBefore =
      existingProgress.length > 0
        ? existingProgress[0].is_private !== false
        : true;

    // تحديد قيمة journal_entry للتحديث (null إذا كانت فارغة)
    const journalEntryValue = cleanedJournalEntry;

    if (existingProgress.length > 0) {
      // Update existing progress with journal entry, benefits, rich content, privacy status, and proposed_step
      await db.query(
        `
        UPDATE camp_task_progress 
        SET journal_entry = ?, notes = ?, content_rich = ?, is_private = ?, proposed_step = ?
        WHERE enrollment_id = ? AND task_id = ?
      `,
        [
          journalEntryValue,
          updatedNotes,
          contentRichJson,
          isPrivate,
          proposed_step || null,
          enrollments[0].id,
          taskId,
        ]
      );
    } else {
      // Create new progress record with journal entry, benefits, rich content, privacy status, and proposed_step
      await db.query(
        `
        INSERT INTO camp_task_progress (enrollment_id, task_id, completed, journal_entry, notes, content_rich, is_private, proposed_step)
        VALUES (?, ?, false, ?, ?, ?, ?, ?)
      `,
        [
          enrollments[0].id,
          taskId,
          journalEntryValue,
          updatedNotes,
          contentRichJson,
          isPrivate,
          proposed_step || null,
        ]
      );
    }

    // إدارة النقاط بناءً على حالة journal_entry
    // القاعدة: 3 نقاط إضافية عند كتابة الفائدة لأول مرة، وحذفها عند حذف الفائدة
    // لا تغيير في النقاط عند تعديل الفائدة فقط
    const JOURNAL_BONUS_POINTS = 3;

    if (!hadJournalEntryBefore && hasJournalEntryAfter) {
      // إضافة 3 نقاط عند كتابة الفائدة لأول مرة
      await db.query(
        `
        UPDATE camp_enrollments 
        SET total_points = total_points + ?
        WHERE id = ?
      `,
        [JOURNAL_BONUS_POINTS, enrollments[0].id]
      );
    } else if (hadJournalEntryBefore && !hasJournalEntryAfter) {
      // حذف 3 نقاط عند حذف الفائدة
      await db.query(
        `
        UPDATE camp_enrollments 
        SET total_points = GREATEST(0, total_points - ?)
        WHERE id = ?
      `,
        [JOURNAL_BONUS_POINTS, enrollments[0].id]
      );
    }
    // إذا كانت journal_entry موجودة قبل وبعد: لا تغيير في النقاط (تعديل فقط)

    // تسجيل نشاط مشاركة التدبر إذا كانت الفائدة عامة (is_private = false)
    // وفقط إذا كانت الفائدة خاصة مسبقاً أو جديدة (لتجنب التسجيل المكرر)
    if (!isPrivate && wasPrivateBefore) {
      try {
        // جلب ID الفائدة (camp_task_progress id)
        const [progressRecord] = await db.query(
          `SELECT id FROM camp_task_progress 
           WHERE enrollment_id = ? AND task_id = ?`,
          [enrollments[0].id, taskId]
        );

        if (progressRecord.length > 0) {
          const details = JSON.stringify({
            reflection_id: progressRecord[0].id,
            task_name: tasks[0].title,
            day: tasks[0].day_number || null,
            task_id: taskId,
          });
          await db.query(
            `INSERT INTO user_activity (user_id, camp_id, activity_type, details)
             VALUES (?, ?, 'reflection_shared', ?)`,
            [userId, tasks[0].camp_id, details]
          );
        }
      } catch (activityError) {
        console.error(
          "Error logging reflection share activity:",
          activityError
        );
        // لا نوقف العملية إذا فشل تسجيل النشاط
      }
    }

    res.json({
      success: true,
      message: "تم حفظ التدبر والفوائد بنجاح",
    });
  } catch (error) {
    console.error("Error updating task benefits:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في حفظ الفوائد",
    });
  }
};

// Get camp participants (admin only)
const getCampParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, status, search } = req.query;

    // Get total tasks count once for performance
    const [totalTasksResult] = await db.query(
      "SELECT COUNT(*) as total FROM camp_daily_tasks WHERE camp_id = ?",
      [id]
    );
    const totalTasks = totalTasksResult[0].total;

    let query = `
      SELECT 
        ce.*,
        u.username,
        u.email,
        COUNT(ctp.id) as completed_tasks,
        ? as total_tasks,
        ROUND((COUNT(ctp.id) / ?) * 100, 2) as progress_percentage
      FROM camp_enrollments ce
      JOIN users u ON ce.user_id = u.id
      LEFT JOIN camp_task_progress ctp ON ce.id = ctp.enrollment_id AND ctp.completed = true
      WHERE ce.camp_id = ?
    `;

    const params = [totalTasks, totalTasks, id];

    // Add status filter
    if (status && status !== "all") {
      query += ` AND ce.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (u.username LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY ce.id ORDER BY ce.total_points DESC`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [participants] = await db.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM camp_enrollments ce
      JOIN users u ON ce.user_id = u.id
      WHERE ce.camp_id = ?
    `;
    const countParams = [id];

    // Add status filter
    if (status && status !== "all") {
      countQuery += ` AND ce.status = ?`;
      countParams.push(status);
    }

    if (search) {
      countQuery += ` AND (u.username LIKE ? OR u.email LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: participants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching camp participants:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب المشتركين",
    });
  }
};

// Get camp leaderboard with caching
const getCampLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    // Check if camp is completed - return empty leaderboard
    const [campStatus] = await db.query(
      `SELECT status FROM quran_camps WHERE id = ?`,
      [id]
    );

    if (campStatus.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    if (campStatus[0].status === "completed") {
      return res.json({
        success: true,
        data: [],
        cached: false,
      });
    }

    const cacheKey = `leaderboard_${id}_${limit}`;

    // Try to get from cache first
    let leaderboard = null;
    try {
      const redisClient = require("../utils/redisClient");
      if (redisClient) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          leaderboard = JSON.parse(cached);
        }
      }
    } catch (redisError) {
      console.log("Redis not available, using database directly");
    }

    // If not in cache, fetch from database
    if (!leaderboard) {
      const [leaderboardData] = await db.query(
        `
        SELECT 
          ce.total_points,
          ce.user_id,
          COALESCE(cs.hide_identity, false) as hide_identity,
          COALESCE(cs.leaderboard_visibility, true) as leaderboard_visibility,
          CASE 
            WHEN COALESCE(cs.hide_identity, false) = true THEN 'مشارك مجهول'
            ELSE u.username
          END as display_name,
          CASE 
            WHEN COALESCE(cs.hide_identity, false) = true THEN NULL
            ELSE u.avatar_url
          END as avatar_url,
          DENSE_RANK() OVER (ORDER BY ce.total_points DESC) as user_rank
        FROM camp_enrollments ce
        JOIN users u ON ce.user_id = u.id
        LEFT JOIN camp_settings cs ON ce.id = cs.enrollment_id
        WHERE ce.camp_id = ? 
          AND COALESCE(cs.leaderboard_visibility, true) = true
        ORDER BY ce.total_points DESC
        LIMIT ?
      `,
        [id, parseInt(limit)]
      );

      // Convert integer values to boolean for consistency and remove sensitive data
      leaderboard = leaderboardData.map((user) => {
        const isHidden = Boolean(user.hide_identity);
        return {
          total_points: user.total_points,
          display_name: user.display_name,
          avatar_url: user.avatar_url, // Already NULL if hidden
          hide_identity: isHidden,
          leaderboard_visibility: Boolean(user.leaderboard_visibility),
          user_rank: user.user_rank,
          // Do NOT include user_id or username to protect anonymity
        };
      });

      // Cache the result for 5 minutes
      try {
        const redisClient = require("../utils/redisClient");
        if (redisClient) {
          await redisClient.setex(cacheKey, 300, JSON.stringify(leaderboard));
        }
      } catch (redisError) {
        console.log("Redis not available for caching");
      }
    }

    res.json({
      success: true,
      data: leaderboard,
      cached: leaderboard ? true : false,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب لوحة المتصدرين",
    });
  }
};

// ==================== ADMIN APIs ====================

// Create new camp
const createCamp = async (req, res) => {
  try {
    const {
      name,
      description,
      surah_number,
      surah_name,
      start_date,
      duration_days,
      banner_image,
      opening_surah_number,
      opening_surah_name,
      opening_youtube_url,
    } = req.body;

    const share_link = shortid.generate();

    const [result] = await db.query(
      `
      INSERT INTO quran_camps (name, description, surah_number, surah_name, start_date, duration_days, banner_image, opening_surah_number, opening_surah_name, opening_youtube_url , share_link)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        name,
        description,
        surah_number,
        surah_name,
        start_date,
        duration_days,
        banner_image,
        opening_surah_number || null,
        opening_surah_name || null,
        opening_youtube_url || null,
        share_link,
      ]
    );

    res.json({
      success: true,
      message: "تم إنشاء المخيم بنجاح",
      data: { campId: result.insertId, share_link },
    });
  } catch (error) {
    console.error("Error creating camp:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إنشاء المخيم",
    });
  }
};

// Update camp
const updateCamp = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      surah_number,
      surah_name,
      start_date,
      duration_days,
      banner_image,
      status,
      opening_surah_number,
      opening_surah_name,
      opening_youtube_url,
    } = req.body;

    // إذا تم تحديث الحالة، نحتاج الحصول على الحالة القديمة أولاً
    let oldStatus = null;
    let campName = null;
    let reopenedDateValue = null;

    // جلب الحالة القديمة دائماً (حتى لو لم يتم تحديث status) للتأكد من البيانات
    const [campData] = await db.query(
      `SELECT id, name, status FROM quran_camps WHERE id = ?`,
      [id]
    );

    if (campData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    oldStatus = campData[0].status;
    campName = campData[0].name;

    const updateFields = [];
    const values = [];

    if (name !== undefined) {
      updateFields.push("name = ?");
      values.push(name);
    }
    if (description !== undefined) {
      updateFields.push("description = ?");
      values.push(description);
    }
    if (surah_number !== undefined) {
      updateFields.push("surah_number = ?");
      values.push(surah_number);
    }
    if (surah_name !== undefined) {
      updateFields.push("surah_name = ?");
      values.push(surah_name);
    }
    if (start_date !== undefined) {
      updateFields.push("start_date = ?");
      values.push(start_date);
    }
    if (duration_days !== undefined) {
      updateFields.push("duration_days = ?");
      values.push(duration_days);
    }
    if (banner_image !== undefined) {
      updateFields.push("banner_image = ?");
      values.push(banner_image);
    }
    if (opening_surah_number !== undefined) {
      updateFields.push("opening_surah_number = ?");
      values.push(opening_surah_number);
    }
    if (opening_surah_name !== undefined) {
      updateFields.push("opening_surah_name = ?");
      values.push(opening_surah_name);
    }
    if (opening_youtube_url !== undefined) {
      updateFields.push("opening_youtube_url = ?");
      values.push(opening_youtube_url);
    }
    if (status !== undefined) {
      updateFields.push("status = ?");
      values.push(status);

      // حساب تاريخ اليوم بتوقيت الرياض
      const riyadhFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Riyadh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const todayParts = riyadhFormatter.formatToParts(new Date());
      const y = todayParts.find((p) => p.type === "year").value;
      const m = todayParts.find((p) => p.type === "month").value;
      const d = todayParts.find((p) => p.type === "day").value;
      const todayStr = `${y}-${m}-${d}`; // YYYY-MM-DD بتوقيت الرياض

      // إذا تم تغيير الحالة إلى 'reopened'، احفظ تاريخ اليوم في reopened_date
      if (status === "reopened") {
        updateFields.push("reopened_date = ?");
        values.push(todayStr);
        reopenedDateValue = todayStr;
      }

      // إذا تم تغيير الحالة من "early_registration" إلى "active"، حدث start_date ليكون تاريخ اليوم
      if (status === "active" && oldStatus === "early_registration") {
        updateFields.push("start_date = ?");
        values.push(todayStr);
        console.log(
          `[UPDATE CAMP] Camp ${id} (${campName}): Changing status from '${oldStatus}' to 'active'. Updating start_date to: ${todayStr}`
        );
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "لا توجد بيانات للتحديث",
      });
    }

    values.push(id);

    await db.query(
      `
      UPDATE quran_camps 
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `,
      values
    );

    // التحقق من أن reopened_date تم تحديثه إذا كانت الحالة reopened
    if (status === "reopened" && reopenedDateValue) {
      const [verify] = await db.query(
        `SELECT reopened_date FROM quran_camps WHERE id = ?`,
        [id]
      );
    }

    // إذا تم تغيير الحالة إلى "active" من "early_registration"، أرسل الإيميلات والإشعارات للمستخدمين
    if (
      status !== undefined &&
      status === "active" &&
      oldStatus === "early_registration"
    ) {
      try {
        // استخدام campName المحفوظ أو جلبها مرة أخرى
        if (!campName) {
          const [campDataAfterUpdate] = await db.query(
            `SELECT name FROM quran_camps WHERE id = ?`,
            [id]
          );
          campName = campDataAfterUpdate[0]?.name || "المخيم القرآني";
        }

        // جلب جميع المستخدمين المسجلين في المخيم
        const [enrollments] = await db.query(
          `SELECT ce.user_id, u.email, u.username 
           FROM camp_enrollments ce
           JOIN users u ON ce.user_id = u.id
           WHERE ce.camp_id = ?
           AND NOT EXISTS (
             SELECT 1 FROM camp_notifications cn
             WHERE cn.camp_id = ce.camp_id 
             AND cn.user_id = ce.user_id 
             AND cn.type = 'general'
             AND cn.title LIKE '%بدأ مخيم%'
           )`,
          [id]
        );

        console.log(
          `Camp ${id} started (via updateCamp). Sending notifications to ${enrollments.length} users`
        );

        // إرسال الإيميلات والإشعارات للمستخدمين (في الخلفية)
        Promise.all(
          enrollments.map(async (enrollment) => {
            try {
              // إرسال الإيميل
              await mailService.sendCampStartedEmail(
                enrollment.email,
                enrollment.username,
                campName,
                id
              );

              // إرسال الإشعار
              await CampNotificationService.sendCampStartedNotification(
                enrollment.user_id,
                id,
                campName
              );
            } catch (error) {
              console.error(
                `Failed to send notification to user ${enrollment.user_id}:`,
                error
              );
            }
          })
        ).catch((err) => {
          console.error("Error in Promise.all for camp started:", err);
        });
      } catch (error) {
        console.error("Error sending notifications when camp started:", error);
        // لا نفشل العملية الرئيسية إذا فشل إرسال الإشعارات
      }
    }

    // إذا تم تغيير الحالة إلى "completed"، أرسل الإيميلات للمستخدمين
    if (
      status !== undefined &&
      status === "completed" &&
      oldStatus !== "completed"
    ) {
      try {
        // استخدام campName المحفوظ أو جلبها مرة أخرى
        if (!campName) {
          const [campDataAfterUpdate] = await db.query(
            `SELECT name FROM quran_camps WHERE id = ?`,
            [id]
          );
          campName = campDataAfterUpdate[0]?.name || "المخيم القرآني";
        }

        // جلب جميع المستخدمين المسجلين في المخيم
        const [enrollments] = await db.query(
          `SELECT ce.user_id, u.email, u.username 
           FROM camp_enrollments ce
           JOIN users u ON ce.user_id = u.id
           WHERE ce.camp_id = ?
           AND NOT EXISTS (
             SELECT 1 FROM camp_notifications cn
             WHERE cn.camp_id = ce.camp_id 
             AND cn.user_id = ce.user_id 
             AND cn.type = 'achievement'
             AND cn.title LIKE '%انتهى مخيم%'
           )`,
          [id]
        );

        console.log(
          `Camp ${id} marked as completed (via updateCamp). Sending notifications to ${enrollments.length} users`
        );

        // إرسال الإيميلات والإشعارات للمستخدمين (في الخلفية)
        Promise.all(
          enrollments.map(async (enrollment) => {
            try {
              // إرسال الإيميل
              await mailService.sendCampFinishedEmail(
                enrollment.email,
                enrollment.username,
                campName,
                id
              );

              // إرسال الإشعار
              await CampNotificationService.sendCampFinishedNotification(
                enrollment.user_id,
                id,
                campName
              );

              console.log(
                `Sent camp finished notification to user ${enrollment.user_id}`
              );
            } catch (error) {
              console.error(
                `Failed to send notification to user ${enrollment.user_id}:`,
                error
              );
            }
          })
        ).catch((err) => {
          console.error("Error in Promise.all:", err);
        });
      } catch (error) {
        console.error(
          "Error sending notifications when camp status changed:",
          error
        );
        // لا نفشل العملية الرئيسية إذا فشل إرسال الإشعارات
      }
    }

    res.json({
      success: true,
      message: "تم تحديث المخيم بنجاح",
      data:
        status === "reopened"
          ? { reopened_date: reopenedDateValue }
          : undefined,
    });
  } catch (error) {
    console.error("Error updating camp:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديث المخيم",
    });
  }
};

// Add daily tasks to camp
const addDailyTasks = async (req, res) => {
  try {
    const { id } = req.params;
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "يجب إرسال قائمة بالمهام",
      });
    }

    // Insert all tasks
    for (const task of tasks) {
      await db.query(
        `
        INSERT INTO camp_daily_tasks (
          camp_id, day_number, task_type, title, description,
          verses_from, verses_to, tafseer_link, youtube_link,
          order_in_day, is_optional, points, estimated_time, group_id, order_in_group
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          id,
          task.day_number,
          task.task_type,
          task.title,
          task.description,
          task.verses_from,
          task.verses_to,
          task.tafseer_link,
          task.youtube_link,
          task.order_in_day,
          task.is_optional || false,
          task.points || 3,
          task.estimated_time || 30,
          task.group_id || null,
          task.order_in_group || null,
        ]
      );
    }

    res.json({
      success: true,
      message: "تم إضافة المهام اليومية بنجاح",
    });
  } catch (error) {
    console.error("Error adding daily tasks:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إضافة المهام",
    });
  }
};

// Update daily task
const updateDailyTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      day_number,
      task_type,
      title,
      description,
      verses_from,
      verses_to,
      tafseer_link,
      youtube_link,
      order_in_day,
      is_optional,
      points,
      estimated_time,
      group_id,
      order_in_group,
    } = req.body;

    await db.query(
      `
      UPDATE camp_daily_tasks SET
        day_number = COALESCE(?, day_number),
        task_type = COALESCE(?, task_type),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        verses_from = COALESCE(?, verses_from),
        verses_to = COALESCE(?, verses_to),
        tafseer_link = COALESCE(?, tafseer_link),
        youtube_link = COALESCE(?, youtube_link),
        order_in_day = COALESCE(?, order_in_day),
        is_optional = COALESCE(?, is_optional),
        points = COALESCE(?, points),
        estimated_time = COALESCE(?, estimated_time),
        group_id = COALESCE(?, group_id),
        order_in_group = COALESCE(?, order_in_group)
      WHERE id = ?
    `,
      [
        day_number,
        task_type,
        title,
        description,
        verses_from,
        verses_to,
        tafseer_link,
        youtube_link,
        order_in_day,
        is_optional,
        points,
        estimated_time,
        group_id,
        order_in_group,
        taskId,
      ]
    );

    res.json({
      success: true,
      message: "تم تحديث المهمة بنجاح",
    });
  } catch (error) {
    console.error("Error updating daily task:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديث المهمة",
    });
  }
};

// Get camp analytics (admin only)
const getCampAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    // Get basic stats
    const [enrollments] = await db.query(
      `
      SELECT 
        COUNT(*) as total_enrollments,
        COUNT(*) as active_enrollments,
        COUNT(*) as completed_enrollments,
        COALESCE(AVG(total_points), 0) as average_points
      FROM camp_enrollments 
      WHERE camp_id = ?
    `,
      [id]
    );

    // Get average progress
    const [progressStats] = await db.query(
      `
      SELECT 
        COALESCE(AVG(
          (SELECT COUNT(*) FROM camp_task_progress ctp 
           WHERE ctp.enrollment_id = ce.id AND ctp.completed = true) * 100.0 / 
          NULLIF((SELECT COUNT(*) FROM camp_daily_tasks cdt WHERE cdt.camp_id = ?), 0)
        ), 0) as average_progress
      FROM camp_enrollments ce
      WHERE ce.camp_id = ?
    `,
      [id, id]
    );

    // Get daily progress (last 30 days)
    const [dailyProgress] = await db.query(
      `
      SELECT 
        DATE(ctp.completed_at) as date,
        COUNT(*) as completed_tasks,
        0 as new_enrollments
      FROM camp_task_progress ctp
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      WHERE ce.camp_id = ? AND ctp.completed = true AND ctp.completed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(ctp.completed_at)
      ORDER BY DATE(ctp.completed_at) DESC
    `,
      [id]
    );

    // Get task completion rates
    const [taskCompletion] = await db.query(
      `
      SELECT 
        cdt.task_type,
        COUNT(ctp.id) as total_attempts,
        COUNT(CASE WHEN ctp.completed = true THEN 1 END) as completed_attempts,
        COALESCE((COUNT(CASE WHEN ctp.completed = true THEN 1 END) * 100.0 / NULLIF(COUNT(ctp.id), 0)), 0) as completion_rate
      FROM camp_daily_tasks cdt
      LEFT JOIN camp_task_progress ctp ON cdt.id = ctp.task_id
      WHERE cdt.camp_id = ?
      GROUP BY cdt.task_type
    `,
      [id]
    );

    // Get top performers
    const [topPerformers] = await db.query(
      `
      SELECT 
        u.username,
        ce.total_points,
        COALESCE(ROUND(
          (SELECT COUNT(*) FROM camp_task_progress ctp 
           WHERE ctp.enrollment_id = ce.id AND ctp.completed = true) * 100.0 / 
          NULLIF((SELECT COUNT(*) FROM camp_daily_tasks cdt WHERE cdt.camp_id = ?), 0),
          2
        ), 0) as progress_percentage
      FROM camp_enrollments ce
      JOIN users u ON ce.user_id = u.id
      WHERE ce.camp_id = ?
      ORDER BY ce.total_points DESC
      LIMIT 10
    `,
      [id, id]
    );

    const responseData = {
      totalEnrollments: enrollments[0]?.total_enrollments || 0,
      activeEnrollments: enrollments[0]?.active_enrollments || 0,
      completedEnrollments: enrollments[0]?.completed_enrollments || 0,
      averageProgress: progressStats[0]?.average_progress || 0,
      averagePoints: enrollments[0]?.average_points || 0,
      dailyProgress: dailyProgress || [],
      taskCompletion: taskCompletion || [],
      topPerformers: topPerformers || [],
    };

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching camp analytics:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب التحليلات",
      error: error.message,
    });
  }
};

// Update camp status (admin only)
const updateCampStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (
      !status ||
      !["early_registration", "active", "completed", "reopened"].includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "حالة المخيم غير صحيحة",
      });
    }

    // الحصول على بيانات المخيم قبل التحديث
    const [campData] = await db.query(
      `SELECT id, name, status FROM quran_camps WHERE id = ?`,
      [id]
    );

    if (campData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    const oldStatus = campData[0].status;
    const campName = campData[0].name;

    // تحديث حالة المخيم
    // حساب تاريخ اليوم بتوقيت الرياض
    const riyadhFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayParts = riyadhFormatter.formatToParts(new Date());
    const y = todayParts.find((p) => p.type === "year").value;
    const m = todayParts.find((p) => p.type === "month").value;
    const d = todayParts.find((p) => p.type === "day").value;
    const todayStr = `${y}-${m}-${d}`; // YYYY-MM-DD بتوقيت الرياض

    let reopenedDateValue = null;
    if (status === "reopened") {
      reopenedDateValue = todayStr;

      console.log(
        `[UPDATE CAMP STATUS] Camp ${id} (${campName}): Changing status from '${oldStatus}' to 'reopened'. Setting reopened_date to: ${todayStr}`
      );

      await db.query(
        `UPDATE quran_camps SET status = ?, reopened_date = ? WHERE id = ?`,
        [status, todayStr, id]
      );

      // التحقق من أن التحديث تم بنجاح
      const [verify] = await db.query(
        `SELECT reopened_date FROM quran_camps WHERE id = ?`,
        [id]
      );
      console.log(
        `[UPDATE CAMP STATUS] Verification: reopened_date is now: ${verify[0]?.reopened_date}`
      );
    } else if (status === "active" && oldStatus === "early_registration") {
      // إذا تم تغيير الحالة من "early_registration" إلى "active"، حدث start_date ليكون تاريخ اليوم
      console.log(
        `[UPDATE CAMP STATUS] Camp ${id} (${campName}): Changing status from '${oldStatus}' to 'active'. Updating start_date to: ${todayStr}`
      );

      await db.query(
        `UPDATE quran_camps SET status = ?, start_date = ? WHERE id = ?`,
        [status, todayStr, id]
      );

      console.log(
        `[UPDATE CAMP STATUS] Camp ${id}: start_date updated to today (${todayStr})`
      );
    } else {
      await db.query(`UPDATE quran_camps SET status = ? WHERE id = ?`, [
        status,
        id,
      ]);
    }

    // إذا تم تغيير الحالة إلى "active" من "early_registration"، أرسل الإيميلات والإشعارات للمستخدمين
    if (status === "active" && oldStatus === "early_registration") {
      try {
        // جلب جميع المستخدمين المسجلين في المخيم
        const [enrollments] = await db.query(
          `SELECT ce.user_id, u.email, u.username 
           FROM camp_enrollments ce
           JOIN users u ON ce.user_id = u.id
           WHERE ce.camp_id = ?
           AND NOT EXISTS (
             SELECT 1 FROM camp_notifications cn
             WHERE cn.camp_id = ce.camp_id 
             AND cn.user_id = ce.user_id 
             AND cn.type = 'general'
             AND cn.title LIKE '%بدأ مخيم%'
           )`,
          [id]
        );

        console.log(
          `Camp ${id} started. Sending notifications to ${enrollments.length} users`
        );

        // إرسال الإيميلات والإشعارات للمستخدمين (في الخلفية)
        enrollments.forEach(async (enrollment) => {
          try {
            // إرسال الإيميل
            await mailService.sendCampStartedEmail(
              enrollment.email,
              enrollment.username,
              campName,
              id
            );

            // إرسال الإشعار
            await CampNotificationService.sendCampStartedNotification(
              enrollment.user_id,
              id,
              campName
            );

            console.log(
              `Sent camp started notification to user ${enrollment.user_id}`
            );
          } catch (error) {
            console.error(
              `Failed to send notification to user ${enrollment.user_id}:`,
              error
            );
          }
        });
      } catch (error) {
        console.error("Error sending notifications when camp started:", error);
        // لا نفشل العملية الرئيسية إذا فشل إرسال الإشعارات
      }
    }

    // إذا تم تغيير الحالة إلى "completed"، أرسل الإيميلات للمستخدمين
    if (status === "completed" && oldStatus !== "completed") {
      try {
        // جلب جميع المستخدمين المسجلين في المخيم
        const [enrollments] = await db.query(
          `SELECT ce.user_id, u.email, u.username 
           FROM camp_enrollments ce
           JOIN users u ON ce.user_id = u.id
           WHERE ce.camp_id = ?
           AND NOT EXISTS (
             SELECT 1 FROM camp_notifications cn
             WHERE cn.camp_id = ce.camp_id 
             AND cn.user_id = ce.user_id 
             AND cn.type = 'achievement'
             AND cn.title LIKE '%انتهى مخيم%'
           )`,
          [id]
        );

        console.log(
          `Camp ${id} marked as completed. Sending notifications to ${enrollments.length} users`
        );

        // إرسال الإيميلات والإشعارات للمستخدمين (في الخلفية)
        Promise.all(
          enrollments.map(async (enrollment) => {
            try {
              // إرسال الإيميل
              await mailService.sendCampFinishedEmail(
                enrollment.email,
                enrollment.username,
                campName,
                id
              );

              // إرسال الإشعار
              await CampNotificationService.sendCampFinishedNotification(
                enrollment.user_id,
                id,
                campName
              );

              console.log(
                `Sent camp finished notification to user ${enrollment.user_id}`
              );
            } catch (error) {
              console.error(
                `Failed to send notification to user ${enrollment.user_id}:`,
                error
              );
            }
          })
        ).catch((err) => {
          console.error("Error in sending camp finished notifications:", err);
        });
      } catch (error) {
        console.error(
          "Error sending notifications when camp status changed:",
          error
        );
        // لا نفشل العملية الرئيسية إذا فشل إرسال الإشعارات
      }
    }

    res.json({
      success: true,
      message: `تم تحديث حالة المخيم إلى ${
        status === "early_registration"
          ? "تسجيل مبكر"
          : status === "active"
          ? "نشط"
          : status === "completed"
          ? "منتهي"
          : "مفتوح للاشتراك"
      }`,
      data:
        status === "reopened"
          ? { reopened_date: reopenedDateValue }
          : undefined,
    });
  } catch (error) {
    console.error("Error updating camp status:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديث حالة المخيم",
    });
  }
};

// Get admin stats
const getAdminStats = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_camps,
        COUNT(CASE WHEN status = 'early_registration' THEN 1 END) as upcoming_camps,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_camps,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_camps,
        (SELECT COUNT(*) FROM camp_enrollments) as total_enrollments,
        (SELECT COUNT(DISTINCT user_id) FROM camp_enrollments) as unique_users
      FROM quran_camps
    `);

    res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب الإحصائيات",
    });
  }
};

// حساب الـ Streak
const calculateStreak = async (enrollmentId) => {
  try {
    const connection = await db.getConnection();

    // جلب آخر نشاط
    const [lastActivity] = await connection.execute(
      `SELECT last_activity_date, current_streak, longest_streak 
       FROM camp_enrollments 
       WHERE id = ?`,
      [enrollmentId]
    );

    if (!lastActivity.length) {
      connection.release();
      return { current: 0, longest: 0 };
    }

    const lastDate = lastActivity[0].last_activity_date;
    const currentStreak = lastActivity[0].current_streak || 0;
    const longestStreak = lastActivity[0].longest_streak || 0;

    // استخدام MySQL لحساب التاريخ بدقة
    const [todayResult] = await connection.execute(
      `SELECT CURDATE() as today, DATE_SUB(CURDATE(), INTERVAL 1 DAY) as yesterday`
    );

    const today = todayResult[0].today.toISOString().split("T")[0];
    const yesterday = todayResult[0].yesterday.toISOString().split("T")[0];

    let newCurrentStreak = currentStreak;
    let newLongestStreak = longestStreak;

    if (!lastDate) {
      // أول نشاط للمستخدم
      newCurrentStreak = 1;
    } else {
      // تحويل last_activity_date إلى string للتأكد من المقارنة الصحيحة
      const lastDateStr =
        lastDate instanceof Date
          ? lastDate.toISOString().split("T")[0]
          : String(lastDate).split("T")[0];

      if (lastDateStr === today) {
        // النشاط اليوم موجود، لا تغيير في الـ streak
        newCurrentStreak = currentStreak;
      } else if (lastDateStr === yesterday) {
        // النشاط أمس موجود، زيادة الـ streak
        newCurrentStreak = currentStreak + 1;
      } else {
        // حساب الفرق بالأيام باستخدام MySQL
        const [diffResult] = await connection.execute(
          `SELECT DATEDIFF(CURDATE(), ?) as days_diff`,
          [lastDate]
        );

        const daysDiff = diffResult[0]?.days_diff || 999;

        if (daysDiff === 1) {
          // يوم واحد فقط - استمرار الـ streak
          newCurrentStreak = currentStreak + 1;
        } else if (daysDiff > 1) {
          // انقطاع الـ streak - ابدأ من جديد
          newCurrentStreak = 1;
        } else {
          // نفس اليوم أو خطأ في الحساب - لا تغيير
          newCurrentStreak = currentStreak;
        }
      }
    }

    // تحديث أطول streak
    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
    }

    // تحديث قاعدة البيانات (فقط إذا تغير الـ streak)
    // لا نحدث last_activity_date هنا لأن هذه الدالة للحساب فقط
    if (
      newCurrentStreak !== currentStreak ||
      newLongestStreak !== longestStreak
    ) {
      await connection.execute(
        `UPDATE camp_enrollments 
         SET current_streak = ?, longest_streak = ?
         WHERE id = ?`,
        [newCurrentStreak, newLongestStreak, enrollmentId]
      );
    }

    connection.release();

    return { current: newCurrentStreak, longest: newLongestStreak };
  } catch (error) {
    console.error("Error calculating streak:", error);
    return { current: 0, longest: 0 };
  }
};

// جلب معلومات الـ Streak
const getMyStreak = async (req, res) => {
  try {
    const { campId } = req.params;
    const userId = req.user.id;

    const connection = await db.getConnection();

    // جلب enrollment
    const [enrollments] = await connection.execute(
      `SELECT id, current_streak, longest_streak, last_activity_date
       FROM camp_enrollments 
       WHERE user_id = ? AND camp_id = ?`,
      [userId, campId]
    );

    if (!enrollments.length) {
      connection.release();
      return res
        .status(404)
        .json({ success: false, message: "لم يتم العثور على التسجيل" });
    }

    const enrollment = enrollments[0];

    // حساب الـ streak المحدث
    const streakInfo = await calculateStreak(enrollment.id);

    connection.release();

    res.json({
      success: true,
      data: {
        currentStreak: streakInfo.current,
        longestStreak: streakInfo.longest,
        lastActivityDate: enrollment.last_activity_date,
      },
    });
  } catch (error) {
    console.error("Error getting streak:", error);
    res
      .status(500)
      .json({ success: false, message: "خطأ في جلب معلومات الـ Streak" });
  }
};

// تحديث الـ Streak (يتم تلقائياً بعد إكمال المهمة)
const updateStreak = async (enrollmentId) => {
  try {
    const connection = await db.getConnection();

    // جلب معلومات الـ enrollment
    const [enrollments] = await connection.execute(
      `SELECT current_streak, longest_streak, last_activity_date
       FROM camp_enrollments 
       WHERE id = ?`,
      [enrollmentId]
    );

    if (!enrollments.length) {
      connection.release();
      return { current: 0, longest: 0 };
    }

    const enrollment = enrollments[0];

    // استخدام MySQL لحساب التاريخ بدقة
    const [todayResult] = await connection.execute(
      `SELECT CURDATE() as today, DATE_SUB(CURDATE(), INTERVAL 1 DAY) as yesterday`
    );

    const today = todayResult[0].today.toISOString().split("T")[0];
    const yesterday = todayResult[0].yesterday.toISOString().split("T")[0];

    let newCurrentStreak = enrollment.current_streak || 0;
    let newLongestStreak = enrollment.longest_streak || 0;

    if (!enrollment.last_activity_date) {
      // أول نشاط للمستخدم
      newCurrentStreak = 1;
    } else {
      // تحويل last_activity_date إلى string للتأكد من المقارنة الصحيحة
      const lastDateStr =
        enrollment.last_activity_date instanceof Date
          ? enrollment.last_activity_date.toISOString().split("T")[0]
          : String(enrollment.last_activity_date).split("T")[0];

      if (lastDateStr === today) {
        // النشاط اليوم موجود، لا تغيير في الـ streak
        newCurrentStreak = enrollment.current_streak || 0;
      } else if (lastDateStr === yesterday) {
        // النشاط أمس موجود، زيادة الـ streak
        newCurrentStreak = (enrollment.current_streak || 0) + 1;
      } else {
        // حساب الفرق بالأيام باستخدام MySQL
        const [diffResult] = await connection.execute(
          `SELECT DATEDIFF(CURDATE(), ?) as days_diff`,
          [enrollment.last_activity_date]
        );

        const daysDiff = diffResult[0]?.days_diff || 999;

        if (daysDiff === 1) {
          // يوم واحد فقط - استمرار الـ streak
          newCurrentStreak = (enrollment.current_streak || 0) + 1;
        } else if (daysDiff > 1) {
          // انقطاع الـ streak - ابدأ من جديد
          newCurrentStreak = 1;
        } else {
          // نفس اليوم أو خطأ في الحساب - لا تغيير
          newCurrentStreak = enrollment.current_streak || 0;
        }
      }
    }

    // تحديث أطول streak
    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
    }

    // تحديث قاعدة البيانات
    await connection.execute(
      `UPDATE camp_enrollments 
       SET current_streak = ?, longest_streak = ?, last_activity_date = CURDATE()
       WHERE id = ?`,
      [newCurrentStreak, newLongestStreak, enrollmentId]
    );

    connection.release();

    return { current: newCurrentStreak, longest: newLongestStreak };
  } catch (error) {
    console.error("Error updating streak:", error);
    return { current: 0, longest: 0 };
  }
};

// جلب إحصائيات المستخدم البسيطة
const getMyStats = async (req, res) => {
  try {
    const { campId } = req.params;
    const userId = req.user.id;

    const connection = await db.getConnection();

    // جلب معلومات الـ enrollment
    const [enrollments] = await connection.execute(
      `SELECT id, total_points, current_streak, longest_streak, last_activity_date
       FROM camp_enrollments 
       WHERE user_id = ? AND camp_id = ?`,
      [userId, campId]
    );

    if (!enrollments.length) {
      connection.release();
      return res
        .status(404)
        .json({ success: false, message: "لم يتم العثور على التسجيل" });
    }

    const enrollment = enrollments[0];

    // جلب إحصائيات المهام
    const [taskStats] = await connection.execute(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_tasks,
        AVG(CASE WHEN completed = 1 THEN LENGTH(notes) ELSE 0 END) as avg_words_per_task
       FROM camp_task_progress 
       WHERE enrollment_id = ?`,
      [enrollment.id]
    );

    // جلب أفضل يوم (اليوم الذي أكمل فيه أكثر مهام)
    const [bestDay] = await connection.execute(
      `SELECT 
        DATE(completed_at) as completion_date,
        COUNT(*) as tasks_completed
       FROM camp_task_progress 
       WHERE enrollment_id = ? AND completed = 1
       GROUP BY DATE(completed_at)
       ORDER BY tasks_completed DESC
       LIMIT 1`,
      [enrollment.id]
    );

    // حساب الوقت المستغرق (تقريبي)
    const [timeStats] = await connection.execute(
      `SELECT 
        MIN(completed_at) as first_completion,
        MAX(completed_at) as last_completion
       FROM camp_task_progress 
       WHERE enrollment_id = ? AND completed = 1`,
      [enrollment.id]
    );

    let totalTimeSpent = 0;
    if (
      timeStats.length > 0 &&
      timeStats[0].first_completion &&
      timeStats[0].last_completion
    ) {
      const firstDate = new Date(timeStats[0].first_completion);
      const lastDate = new Date(timeStats[0].last_completion);
      totalTimeSpent = Math.ceil(
        (lastDate - firstDate) / (1000 * 60 * 60 * 24)
      ); // أيام
    }

    connection.release();

    res.json({
      success: true,
      data: {
        totalTimeSpent: totalTimeSpent,
        averageWordsPerTask: Math.round(taskStats[0].avg_words_per_task || 0),
        bestDay: bestDay.length > 0 ? bestDay[0].completion_date : null,
        currentStreak: enrollment.current_streak || 0,
        longestStreak: enrollment.longest_streak || 0,
        totalTasksCompleted: taskStats[0].completed_tasks || 0,
        totalTasks: taskStats[0].total_tasks || 0,
        totalPoints: enrollment.total_points || 0,
        lastActivityDate: enrollment.last_activity_date,
      },
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({ success: false, message: "خطأ في جلب الإحصائيات" });
  }
};

// Get study hall content for a camp (user-generated content)
const getStudyHallContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, page = 1, limit = 20, sort = "newest" } = req.query;
    const userId = req.user.id;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page)) || 1;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 20; // Max 100 items per page
    const offset = (pageNum - 1) * limitNum;

    // Get camp details
    const [camps] = await db.query(`SELECT * FROM quran_camps WHERE id = ?`, [
      id,
    ]);

    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    const camp = camps[0];

    // Get user's enrollment
    const [enrollments] = await db.query(
      `SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ?`,
      [userId, id]
    );

    if (enrollments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "لست مسجلاً في هذا المخيم",
      });
    }

    // Get user's completed tasks with their journal entries and notes
    let query = `
      SELECT 
        cdt.id as task_id,
        cdt.title,
        cdt.description,
        cdt.day_number,
        cdt.points,
        ctp.id as progress_id,
        ctp.journal_entry,
        ctp.notes,
        ctp.is_private,
        ctp.proposed_step,
        ctp.completed_at,
        ctp.created_at,
        ctp.upvote_count,
        ctp.save_count,
        COALESCE(pledge_counts.pledge_count, 0) as pledge_count,
        CASE 
          WHEN EXISTS(SELECT 1 FROM reflection_upvotes ru WHERE ru.user_id = ? AND ru.progress_id = ctp.id) THEN 1
          ELSE 0
        END as is_upvoted_by_user,
        CASE 
          WHEN EXISTS(SELECT 1 FROM user_saved_reflections usr WHERE usr.user_id = ? AND usr.progress_id = ctp.id) THEN 1
          ELSE 0
        END as is_saved_by_user,
        CASE 
          WHEN EXISTS(SELECT 1 FROM joint_step_pledges jsp WHERE jsp.progress_id = ctp.id AND jsp.pledger_user_id = ?) THEN 1
          ELSE 0
        END as is_pledged_by_user
      FROM camp_daily_tasks cdt
      LEFT JOIN camp_task_progress ctp ON cdt.id = ctp.task_id 
        AND ctp.enrollment_id = ? 
        AND ctp.completed = 1
      LEFT JOIN (
        SELECT progress_id, COUNT(*) as pledge_count
        FROM joint_step_pledges
        GROUP BY progress_id
      ) pledge_counts ON ctp.id = pledge_counts.progress_id
      WHERE cdt.camp_id = ?
    `;

    const params = [userId, userId, userId, enrollments[0].id, id];

    // Filter by day if specified
    if (day) {
      query += ` AND cdt.day_number = ?`;
      params.push(day);
    }

    query += ` ORDER BY cdt.day_number DESC, ctp.completed_at DESC`;

    const [tasks] = await db.query(query, params);

    // Get shared content from other users (anonymized)
    // IMPORTANT: Never fetch real username/avatar if hide_identity is true
    // IMPORTANT: Only fetch public content (is_private = false or NULL for backward compatibility)
    let sharedQuery = `
      SELECT 
        cdt.title,
        cdt.description,
        cdt.day_number,
        cdt.points,
        ctp.id as progress_id,
        ctp.journal_entry,
        ctp.notes,
        ctp.proposed_step,
        ctp.completed_at,
        ctp.upvote_count,
        ctp.save_count,
        cs.hide_identity,
        COALESCE(pledge_counts.pledge_count, 0) as pledge_count,
        CASE 
          WHEN COALESCE(cs.hide_identity, false) = true THEN CONCAT('مشارك مجهول')
          ELSE u.username
        END as author_name,
        CASE 
          WHEN COALESCE(cs.hide_identity, false) = true THEN NULL
          ELSE u.avatar_url
        END as avatar_url,
        CASE 
          WHEN EXISTS(SELECT 1 FROM reflection_upvotes ru WHERE ru.user_id = ? AND ru.progress_id = ctp.id) THEN 1
          ELSE 0
        END as is_upvoted_by_user,
        CASE 
          WHEN EXISTS(SELECT 1 FROM user_saved_reflections usr WHERE usr.user_id = ? AND usr.progress_id = ctp.id) THEN 1
          ELSE 0
        END as is_saved_by_user,
        CASE 
          WHEN EXISTS(SELECT 1 FROM joint_step_pledges jsp WHERE jsp.progress_id = ctp.id AND jsp.pledger_user_id = ?) THEN 1
          ELSE 0
        END as is_pledged_by_user
      FROM camp_daily_tasks cdt
      JOIN camp_task_progress ctp ON cdt.id = ctp.task_id 
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      LEFT JOIN camp_settings cs ON ce.id = cs.enrollment_id
      JOIN users u ON ce.user_id = u.id
      LEFT JOIN (
        SELECT progress_id, COUNT(*) as pledge_count
        FROM joint_step_pledges
        GROUP BY progress_id
      ) pledge_counts ON ctp.id = pledge_counts.progress_id
      WHERE cdt.camp_id = ? 
        AND ctp.completed = 1
        AND ctp.journal_entry IS NOT NULL 
        AND ctp.journal_entry != ''
        AND ce.user_id != ?
        AND (ctp.is_private IS NULL OR ctp.is_private = false)
    `;

    const sharedParams = [userId, userId, userId, id, userId];

    if (day) {
      sharedQuery += ` AND cdt.day_number = ?`;
      sharedParams.push(day);
    }

    // Apply sorting
    let orderByClause = "ctp.completed_at DESC"; // Default: newest first
    if (sort === "helpful") {
      orderByClause = "ctp.upvote_count DESC, ctp.completed_at DESC";
    } else if (sort === "saved") {
      orderByClause = "ctp.save_count DESC, ctp.completed_at DESC";
    }

    sharedQuery += ` ORDER BY ${orderByClause}`;

    // Remove LIMIT 10 to get all shared content for proper pagination
    const [sharedContent] = await db.query(sharedQuery, sharedParams);

    // Format the content
    const studyHallContent = [];

    // Get current user info and check if they want to hide identity
    const [userInfo] = await db.query(
      `
      SELECT 
        u.username, 
        u.avatar_url,
        COALESCE(cs.hide_identity, false) as hide_identity
      FROM users u
      LEFT JOIN camp_settings cs ON cs.enrollment_id = ?
      WHERE u.id = ?
      `,
      [enrollments[0].id, userId]
    );

    const currentUser = userInfo[0] || {};
    const isCurrentUserHidden = Boolean(currentUser.hide_identity);

    // Add user's own content
    // Use display name based on hide_identity setting
    const displayName = isCurrentUserHidden
      ? "أنت"
      : currentUser.username || "أنت";
    const displayAvatar = isCurrentUserHidden ? null : currentUser.avatar_url;

    tasks.forEach((task) => {
      // فقط أضف التدبرات غير الشخصية في قاعة التدارس
      // is_private قد يكون null أو 0 (false) أو 1 (true) من MySQL
      const isPrivate =
        task.is_private === 1 ||
        task.is_private === true ||
        task.is_private === "1";

      if (task.journal_entry && !isPrivate) {
        studyHallContent.push({
          id: `user-${task.task_id}`,
          progress_id: task.progress_id,
          type: "user_reflection",
          title: `تدبر: ${task.title}`,
          content: task.journal_entry,
          day: task.day_number,
          points: task.points,
          completed_at: task.completed_at,
          is_own: true,
          is_private: false, // التدبرات في قاعة التدارس دائماً غير شخصية
          userName: displayName,
          avatar_url: displayAvatar,
          upvote_count: task.upvote_count || 0,
          save_count: task.save_count || 0,
          is_upvoted_by_user: task.is_upvoted_by_user || 0,
          is_saved_by_user: task.is_saved_by_user || 0,
          pledge_count:
            task.pledge_count !== undefined && task.pledge_count !== null
              ? task.pledge_count
              : 0,
          is_pledged_by_user: task.is_pledged_by_user || 0,
          proposed_step: task.proposed_step || null,
        });
      }

      // فقط أضف الفوائد غير الشخصية في قاعة التدارس
      if (task.notes && !isPrivate) {
        studyHallContent.push({
          id: `user-notes-${task.task_id}`,
          progress_id: task.progress_id,
          type: "user_benefits",
          title: `فوائد: ${task.title}`,
          content: task.notes,
          day: task.day_number,
          points: task.points,
          completed_at: task.completed_at,
          is_own: true,
          is_private: false, // الفوائد في قاعة التدارس دائماً غير شخصية
          userName: displayName,
          avatar_url: displayAvatar,
          upvote_count: task.upvote_count || 0,
          save_count: task.save_count || 0,
          is_upvoted_by_user: task.is_upvoted_by_user || 0,
          is_saved_by_user: task.is_saved_by_user || 0,
          pledge_count:
            task.pledge_count !== undefined && task.pledge_count !== null
              ? task.pledge_count
              : 0,
          is_pledged_by_user: task.is_pledged_by_user || 0,
          proposed_step: task.proposed_step || null,
        });
      }
    });

    // Add shared content from other users
    // IMPORTANT: Only use author_name and avatar_url (already sanitized in query)
    sharedContent.forEach((content, index) => {
      studyHallContent.push({
        id: `shared-${index}`,
        progress_id: content.progress_id,
        type: "shared_reflection",
        title: `تدبر من ${content.author_name}: ${content.title}`,
        content: content.journal_entry,
        day: content.day_number,
        points: content.points,
        completed_at: content.completed_at,
        is_own: false,
        is_private: false, // المحتوى المشترك دائماً غير شخصي
        userName: content.author_name, // Already sanitized (مشارك مجهول if hidden)
        avatar_url: content.avatar_url, // Already NULL if hidden
        upvote_count: content.upvote_count || 0,
        save_count: content.save_count || 0,
        is_upvoted_by_user: content.is_upvoted_by_user || 0,
        is_saved_by_user: content.is_saved_by_user || 0,
        pledge_count:
          content.pledge_count !== undefined && content.pledge_count !== null
            ? content.pledge_count
            : 0,
        is_pledged_by_user: content.is_pledged_by_user || 0,
        proposed_step: content.proposed_step || null,
      });
    });

    // Sort by completion date or other criteria
    if (sort === "newest") {
      studyHallContent.sort(
        (a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0)
      );
    } else if (sort === "helpful") {
      studyHallContent.sort((a, b) => {
        if (b.upvote_count !== a.upvote_count) {
          return b.upvote_count - a.upvote_count;
        }
        return new Date(b.completed_at || 0) - new Date(a.completed_at || 0);
      });
    } else if (sort === "saved") {
      studyHallContent.sort((a, b) => {
        if (b.save_count !== a.save_count) {
          return b.save_count - a.save_count;
        }
        return new Date(b.completed_at || 0) - new Date(a.completed_at || 0);
      });
    }

    // Get total count before pagination
    const totalItems = studyHallContent.length;
    const userContentCount = studyHallContent.filter(
      (item) => item.is_own
    ).length;
    const sharedContentCount = studyHallContent.filter(
      (item) => !item.is_own
    ).length;

    // Apply pagination
    const paginatedContent = studyHallContent.slice(offset, offset + limitNum);

    res.json({
      success: true,
      data: {
        camp_id: camp.id,
        camp_name: camp.name,
        surah_name: camp.surah_name,
        day: day || null,
        content: paginatedContent,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total_items: totalItems,
          total_pages: Math.ceil(totalItems / limitNum),
          has_next: offset + limitNum < totalItems,
          has_prev: pageNum > 1,
        },
        user_content_count: userContentCount,
        shared_content_count: sharedContentCount,
      },
    });
  } catch (error) {
    console.error("Error getting study hall content:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب محتوى قاعة التدارس",
    });
  }
};

// Remove User from Camp (not from system)
const removeUserFromCamp = async (req, res) => {
  const { campId, userId } = req.params;

  try {
    // بدء معاملة قاعدة البيانات
    await db.query("START TRANSACTION");

    try {
      // 1. حذف بيانات المستخدم من المخيم المحدد فقط
      await db.query(
        "DELETE FROM camp_enrollments WHERE camp_id = ? AND user_id = ?",
        [campId, userId]
      );

      // 2. حذف تقدم المهام للمستخدم في هذا المخيم
      await db.query(
        `
        DELETE ctp FROM camp_task_progress ctp
        INNER JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
        WHERE ce.camp_id = ? AND ce.user_id = ?
      `,
        [campId, userId]
      );

      // 3. تنظيف طلبات الصداقة المعلقة المرتبطة بهذا المخيم لهذا المستخدم
      await db.query(
        `DELETE fr FROM friend_requests fr
         WHERE fr.status = 'pending'
           AND (fr.sender_id = ? OR fr.receiver_id = ?)
           AND (
             fr.sender_id IN (SELECT user_id FROM camp_enrollments WHERE camp_id = ?)
             OR fr.receiver_id IN (SELECT user_id FROM camp_enrollments WHERE camp_id = ?)
           )`,
        [userId, userId, campId, campId]
      );

      // تأكيد المعاملة
      await db.query("COMMIT");

      res.status(200).json({
        status: "success",
        message: "تم حذف المستخدم من المخيم بنجاح",
      });
    } catch (error) {
      // إلغاء المعاملة في حالة الخطأ
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error removing user from camp:", error);
    res.status(500).json({
      status: "error",
      message: "حدث خطأ أثناء حذف المستخدم من المخيم",
      error: error.message,
    });
  }
};

const leaveCamp = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // بدء transaction لضمان حذف جميع البيانات بشكل آمن
    await db.query("START TRANSACTION");

    // 1. الحصول على enrollment_id للمستخدم في هذا المخيم
    const [enrollments] = await db.query(
      "SELECT id FROM camp_enrollments WHERE camp_id = ? AND user_id = ?",
      [id, userId]
    );

    if (enrollments.length === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({
        status: "error",
        message: "لست مسجلاً في هذا المخيم",
      });
    }

    const enrollmentId = enrollments[0].id;

    // 2. حذف تقدم المستخدم في المهام (camp_task_progress)
    await db.query("DELETE FROM camp_task_progress WHERE enrollment_id = ?", [
      enrollmentId,
    ]);

    // 3. حذف إشعارات المستخدم المرتبطة بالمخيم
    await db.query(
      "DELETE FROM camp_notifications WHERE camp_id = ? AND user_id = ?",
      [id, userId]
    );

    // 4. حذف إحصائيات الإشعارات للمستخدم في هذا المخيم
    await db.query("DELETE FROM camp_notification_stats WHERE user_id = ?", [
      userId,
    ]);

    // 5. حذف إعدادات المستخدم في المخيم (camp_settings)
    await db.query("DELETE FROM camp_settings WHERE enrollment_id = ?", [
      enrollmentId,
    ]);

    // 6. حذف تسجيل المستخدم في المخيم (camp_enrollments)
    await db.query(
      "DELETE FROM camp_enrollments WHERE camp_id = ? AND user_id = ?",
      [id, userId]
    );

    // 7. تنظيف طلبات الصداقة المعلقة المرتبطة بهذا المخيم
    // نحذف أي طلب صداقة معلق حيث المستخدم طرف فيه والطرف الآخر ما زال مسجلاً في نفس المخيم
    await db.query(
      `DELETE fr FROM friend_requests fr
       WHERE fr.status = 'pending'
         AND (fr.sender_id = ? OR fr.receiver_id = ?)
         AND (
           fr.sender_id IN (SELECT user_id FROM camp_enrollments WHERE camp_id = ?)
           OR fr.receiver_id IN (SELECT user_id FROM camp_enrollments WHERE camp_id = ?)
         )`,
      [userId, userId, id, id]
    );

    // تأكيد التغييرات
    await db.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "تم ترك المخيم بنجاح وحذف جميع البيانات المرتبطة",
    });
  } catch (error) {
    // في حالة حدوث خطأ، التراجع عن جميع التغييرات
    await db.query("ROLLBACK");

    console.error("Error leaving camp:", error);
    res.status(500).json({
      status: "error",
      message: "حدث خطأ أثناء ترك المخيم",
      error: error.message,
    });
  }
};

// Get user's camp settings
const getCampSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get user's enrollment and settings
    const [enrollments] = await db.query(
      `
            SELECT
              ce.*,
              COALESCE(cs.hide_identity, false) as hide_identity,
              COALESCE(cs.notifications_enabled, true) as notifications_enabled,
              COALESCE(cs.daily_reminders, true) as daily_reminders,
              COALESCE(cs.achievement_notifications, true) as achievement_notifications,
              COALESCE(cs.leaderboard_visibility, true) as leaderboard_visibility
            FROM camp_enrollments ce
            LEFT JOIN camp_settings cs ON ce.id = cs.enrollment_id
            WHERE ce.camp_id = ? AND ce.user_id = ?
          `,
      [id, userId]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "لست مسجلاً في هذا المخيم",
      });
    }

    const settings = {
      hide_identity: Boolean(enrollments[0].hide_identity),
      notifications_enabled: Boolean(enrollments[0].notifications_enabled),
      daily_reminders: Boolean(enrollments[0].daily_reminders),
      achievement_notifications: Boolean(
        enrollments[0].achievement_notifications
      ),
      leaderboard_visibility: Boolean(enrollments[0].leaderboard_visibility),
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching camp settings:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب الإعدادات",
      error: error.message,
    });
  }
};

// Update user's camp settings
const updateCampSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      hide_identity,
      notifications_enabled,
      daily_reminders,
      achievement_notifications,
      leaderboard_visibility,
    } = req.body;

    // Get user's enrollment
    const [enrollments] = await db.query(
      "SELECT id FROM camp_enrollments WHERE camp_id = ? AND user_id = ?",
      [id, userId]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "لست مسجلاً في هذا المخيم",
      });
    }

    const enrollmentId = enrollments[0].id;

    // Start transaction
    await db.query("START TRANSACTION");

    try {
      // Update or create camp settings
      await db.query(
        `
              INSERT INTO camp_settings (
                enrollment_id, hide_identity, notifications_enabled,
                daily_reminders, achievement_notifications, leaderboard_visibility
              ) VALUES (?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                hide_identity = VALUES(hide_identity),
                notifications_enabled = VALUES(notifications_enabled),
                daily_reminders = VALUES(daily_reminders),
                achievement_notifications = VALUES(achievement_notifications),
                leaderboard_visibility = VALUES(leaderboard_visibility),
                updated_at = CURRENT_TIMESTAMP
            `,
        [
          enrollmentId,
          hide_identity,
          notifications_enabled,
          daily_reminders,
          achievement_notifications,
          leaderboard_visibility,
        ]
      );

      await db.query("COMMIT");

      // Clear leaderboard cache when settings are updated
      try {
        const redisClient = require("../utils/redisClient");
        if (redisClient) {
          const cacheKey = `leaderboard_${id}_*`;
          const keys = await redisClient.keys(cacheKey);
          if (keys.length > 0) {
            await redisClient.del(...keys);
          }
        }
      } catch (redisError) {
        console.log("Redis not available for cache clearing");
      }

      res.json({
        success: true,
        message: "تم تحديث الإعدادات بنجاح",
        data: {
          hide_identity: Boolean(hide_identity),
          notifications_enabled: Boolean(notifications_enabled),
          daily_reminders: Boolean(daily_reminders),
          achievement_notifications: Boolean(achievement_notifications),
          leaderboard_visibility: Boolean(leaderboard_visibility),
        },
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error updating camp settings:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديث الإعدادات",
      error: error.message,
    });
  }
};

// Get admin camp settings (admin only)
const getAdminCampSettings = async (req, res) => {
  try {
    const { id } = req.params;

    // Get camp basic info
    const [camps] = await db.query("SELECT * FROM quran_camps WHERE id = ?", [
      id,
    ]);

    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    const camp = camps[0];

    // Get admin settings from camp table or default values
    const settings = {
      enable_leaderboard:
        camp.enable_leaderboard !== null
          ? Boolean(camp.enable_leaderboard)
          : true,
      enable_study_hall:
        camp.enable_study_hall !== null
          ? Boolean(camp.enable_study_hall)
          : true,
      enable_public_enrollment:
        camp.enable_public_enrollment !== null
          ? Boolean(camp.enable_public_enrollment)
          : true,
      auto_start_camp:
        camp.auto_start_camp !== null ? Boolean(camp.auto_start_camp) : false,
      max_participants: camp.max_participants || null,
      enable_notifications:
        camp.enable_notifications !== null
          ? Boolean(camp.enable_notifications)
          : true,
      enable_daily_reminders:
        camp.enable_daily_reminders !== null
          ? Boolean(camp.enable_daily_reminders)
          : true,
      enable_achievement_notifications:
        camp.enable_achievement_notifications !== null
          ? Boolean(camp.enable_achievement_notifications)
          : true,
      visibility_mode: camp.visibility_mode || "public", // public, private, unlisted
      allow_user_content:
        camp.allow_user_content !== null
          ? Boolean(camp.allow_user_content)
          : true,
      enable_interactions:
        camp.enable_interactions !== null
          ? Boolean(camp.enable_interactions)
          : true, // upvotes, saves
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching admin camp settings:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب إعدادات المخيم",
      error: error.message,
    });
  }
};

// Update admin camp settings (admin only)
const updateAdminCampSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      enable_leaderboard,
      enable_study_hall,
      enable_public_enrollment,
      auto_start_camp,
      max_participants,
      enable_notifications,
      enable_daily_reminders,
      enable_achievement_notifications,
      visibility_mode,
      allow_user_content,
      enable_interactions,
    } = req.body;

    // Check if camp exists
    const [camps] = await db.query("SELECT id FROM quran_camps WHERE id = ?", [
      id,
    ]);

    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    // Validate visibility_mode
    const validVisibilityModes = ["public", "private", "unlisted"];
    if (visibility_mode && !validVisibilityModes.includes(visibility_mode)) {
      return res.status(400).json({
        success: false,
        message: "وضع الرؤية غير صحيح",
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (enable_leaderboard !== undefined) {
      updateFields.push("enable_leaderboard = ?");
      updateValues.push(enable_leaderboard ? 1 : 0);
    }
    if (enable_study_hall !== undefined) {
      updateFields.push("enable_study_hall = ?");
      updateValues.push(enable_study_hall ? 1 : 0);
    }
    if (enable_public_enrollment !== undefined) {
      updateFields.push("enable_public_enrollment = ?");
      updateValues.push(enable_public_enrollment ? 1 : 0);
    }
    if (auto_start_camp !== undefined) {
      updateFields.push("auto_start_camp = ?");
      updateValues.push(auto_start_camp ? 1 : 0);
    }
    if (max_participants !== undefined) {
      updateFields.push("max_participants = ?");
      updateValues.push(max_participants || null);
    }
    if (enable_notifications !== undefined) {
      updateFields.push("enable_notifications = ?");
      updateValues.push(enable_notifications ? 1 : 0);
    }
    if (enable_daily_reminders !== undefined) {
      updateFields.push("enable_daily_reminders = ?");
      updateValues.push(enable_daily_reminders ? 1 : 0);
    }
    if (enable_achievement_notifications !== undefined) {
      updateFields.push("enable_achievement_notifications = ?");
      updateValues.push(enable_achievement_notifications ? 1 : 0);
    }
    if (visibility_mode !== undefined) {
      updateFields.push("visibility_mode = ?");
      updateValues.push(visibility_mode);
    }
    if (allow_user_content !== undefined) {
      updateFields.push("allow_user_content = ?");
      updateValues.push(allow_user_content ? 1 : 0);
    }
    if (enable_interactions !== undefined) {
      updateFields.push("enable_interactions = ?");
      updateValues.push(enable_interactions ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "لم يتم إرسال أي إعدادات للتحديث",
      });
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    updateValues.push(id);

    // Update camp settings
    await db.query(
      `UPDATE quran_camps SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: "تم تحديث إعدادات المخيم بنجاح",
    });
  } catch (error) {
    console.error("Error updating admin camp settings:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديث إعدادات المخيم",
      error: error.message,
    });
  }
};

// Get User Details with Camp Enrollments
const getUserDetails = async (req, res) => {
  const { userId } = req.params;

  try {
    // جلب بيانات المستخدم الأساسية
    const [users] = await db.query(
      `SELECT id, username, email, role, created_at, avatar_url 
       FROM users 
       WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "المستخدم غير موجود",
      });
    }

    const user = users[0];

    // جلب المخيمات المسجل فيها المستخدم
    const [enrollments] = await db.query(
      `SELECT 
         ce.id as enrollment_id,
         ce.enrolled_at,
         ce.points,
         c.id as camp_id,
         c.name as camp_name,
         c.surah_name,
         c.status as camp_status
       FROM camp_enrollments ce
       JOIN quran_camps c ON ce.camp_id = c.id
       WHERE ce.user_id = ?
       ORDER BY ce.enrolled_at DESC`,
      [userId]
    );

    // جلب إحصائيات المستخدم
    const [stats] = await db.query(
      `SELECT 
         COUNT(DISTINCT ce.camp_id) as total_camps,
         SUM(ce.points) as total_points,
         COUNT(DISTINCT ctp.task_id) as completed_tasks
       FROM camp_enrollments ce
       LEFT JOIN camp_task_progress ctp ON ce.id = ctp.enrollment_id
       WHERE ce.user_id = ?`,
      [userId]
    );

    res.status(200).json({
      status: "success",
      data: {
        user,
        enrollments,
        stats: stats[0] || {
          total_camps: 0,
          total_points: 0,
          completed_tasks: 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({
      status: "error",
      message: "حدث خطأ أثناء جلب بيانات المستخدم",
      error: error.message,
    });
  }
};

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const notifications = await CampNotificationService.getUserNotifications(
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    const unreadCount = await CampNotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: notifications.length === parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب الإشعارات",
    });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await CampNotificationService.markAsRead(id, userId);

    res.json({
      success: true,
      message: "تم تحديد الإشعار كمقروء",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديد الإشعار كمقروء",
    });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await CampNotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: "تم تحديد جميع الإشعارات كمقروءة",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديد الإشعارات كمقروءة",
    });
  }
};

// ==================== ACTION PLAN APIs ====================

// Get user's action plan for a camp
const getMyActionPlan = async (req, res) => {
  try {
    const { id } = req.params; // camp_id
    const userId = req.user.id;

    // Verify user is enrolled in the camp
    const [enrollment] = await db.query(
      "SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ?",
      [userId, id]
    );

    if (enrollment.length === 0) {
      return res.status(403).json({
        success: false,
        message: "يجب عليك الاشتراك في المخيم أولاً",
      });
    }

    // Get user's action plan
    const [actionPlans] = await db.query(
      `
      SELECT 
        id,
        user_id,
        camp_id,
        action_details,
        follow_up_sent,
        created_at,
        updated_at
      FROM user_action_plans
      WHERE user_id = ? AND camp_id = ?
      `,
      [userId, id]
    );

    if (actionPlans.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: "لا توجد خطة عمل بعد",
      });
    }

    const actionPlan = actionPlans[0];

    // Parse JSON if exists
    if (actionPlan.action_details) {
      actionPlan.action_details =
        typeof actionPlan.action_details === "string"
          ? JSON.parse(actionPlan.action_details)
          : actionPlan.action_details;
    }

    res.json({
      success: true,
      data: {
        ...actionPlan,
        follow_up_sent: Boolean(actionPlan.follow_up_sent),
      },
    });
  } catch (error) {
    console.error("Error fetching action plan:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب خطة العمل",
    });
  }
};

// Create or update user's action plan for a camp
const createOrUpdateActionPlan = async (req, res) => {
  try {
    const { id } = req.params; // camp_id
    const userId = req.user.id;

    // دعم النمط القديم (action_text) والنمط الجديد (action_details)
    let actionDetails = null;

    if (req.body.action_text) {
      // النمط القديم: تحويل النص إلى هيكل JSON
      actionDetails = {
        what: req.body.action_text.trim(),
        when: "",
        measure: "",
      };
    } else if (req.body.action_what || req.body.what) {
      // النمط الجديد: البيانات المهيكلة
      actionDetails = {
        what: (req.body.action_what || req.body.what || "").trim(),
        when: (req.body.action_when || req.body.when || "").trim(),
        measure: (req.body.action_measure || req.body.measure || "").trim(),
      };
    } else {
      // التحقق من وجود البيانات المهيكلة مباشرة
      if (req.body.action_details) {
        actionDetails = req.body.action_details;
      }
    }

    // Validate input
    if (
      !actionDetails ||
      !actionDetails.what ||
      actionDetails.what.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "يجب تحديد العمل المطلوب (حقل 'ماذا؟' إجباري)",
      });
    }

    if (!actionDetails.when || actionDetails.when.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "يجب تحديد الوقت أو التكرار (حقل 'متى؟' إجباري)",
      });
    }

    // تحويل إلى JSON string للتخزين
    const actionDetailsJson = JSON.stringify(actionDetails);

    // Verify user is enrolled in the camp
    const [enrollment] = await db.query(
      "SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ?",
      [userId, id]
    );

    if (enrollment.length === 0) {
      return res.status(403).json({
        success: false,
        message: "يجب عليك الاشتراك في المخيم أولاً",
      });
    }

    // Check if action plan exists
    const [existingPlans] = await db.query(
      "SELECT id FROM user_action_plans WHERE user_id = ? AND camp_id = ?",
      [userId, id]
    );

    let actionPlan;

    if (existingPlans.length > 0) {
      // Update existing action plan
      // تحديث action_text أيضًا للتوافق مع بنية الجدول
      const actionText = actionDetails.what || "";
      await db.query(
        `
        UPDATE user_action_plans 
        SET action_text = ?, action_details = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [actionText, actionDetailsJson, existingPlans[0].id]
      );

      // Get updated action plan
      const [updatedPlans] = await db.query(
        `
        SELECT 
          id,
          user_id,
          camp_id,
          action_details,
          follow_up_sent,
          created_at,
          updated_at
        FROM user_action_plans
        WHERE id = ?
        `,
        [existingPlans[0].id]
      );

      actionPlan = updatedPlans[0];

      // Parse JSON if exists
      if (actionPlan.action_details) {
        actionPlan.action_details =
          typeof actionPlan.action_details === "string"
            ? JSON.parse(actionPlan.action_details)
            : actionPlan.action_details;
      }

      // ملاحظة: عند تحديث خطة العمل لا نعيد إرسال إشعارات/إيميلات الإتمام

      res.json({
        success: true,
        message: "تم تحديث خطة العمل بنجاح",
        data: {
          ...actionPlan,
          follow_up_sent: Boolean(actionPlan.follow_up_sent),
        },
      });
    } else {
      // Create new action plan
      // استخدام actionDetails.what كـ action_text للتوافق مع بنية الجدول القديمة
      const actionText = actionDetails.what || "";
      const [result] = await db.query(
        `
        INSERT INTO user_action_plans (user_id, camp_id, action_text, action_details)
        VALUES (?, ?, ?, ?)
        `,
        [userId, id, actionText, actionDetailsJson]
      );

      // Get created action plan
      const [newPlans] = await db.query(
        `
        SELECT 
          id,
          user_id,
          camp_id,
          action_details,
          follow_up_sent,
          created_at,
          updated_at
        FROM user_action_plans
        WHERE id = ?
        `,
        [result.insertId]
      );

      actionPlan = newPlans[0];

      // Parse JSON if exists
      if (actionPlan.action_details) {
        actionPlan.action_details =
          typeof actionPlan.action_details === "string"
            ? JSON.parse(actionPlan.action_details)
            : actionPlan.action_details;
      }

      // Side-effect: if user completed all tasks, send personal completion notification/email (idempotent)
      try {
        const [totalTasksRows] = await db.query(
          `SELECT COUNT(*) as total FROM camp_daily_tasks WHERE camp_id = ?`,
          [id]
        );
        const totalTasks = totalTasksRows[0]?.total || 0;
        const [completedRows] = await db.query(
          `SELECT COUNT(*) as completed
           FROM camp_task_progress ctp
           JOIN camp_enrollments ce ON ce.id = ctp.enrollment_id
           WHERE ce.camp_id = ? AND ce.user_id = ? AND ctp.completed = 1`,
          [id, userId]
        );
        const completedCount = completedRows[0]?.completed || 0;
        if (totalTasks > 0 && completedCount >= totalTasks) {
          const [existingNotif] = await db.query(
            `SELECT id FROM camp_notifications 
             WHERE user_id = ? AND camp_id = ? AND type = 'achievement' AND title LIKE ? LIMIT 1`,
            [userId, id, `%أتممت رحلتك%`]
          );
          if (existingNotif.length === 0) {
            await db.query(
              `INSERT INTO camp_notifications (user_id, camp_id, type, title, message)
               VALUES (?, ?, 'achievement', ?, ?)`,
              [
                userId,
                id,
                `🎉 أتممت رحلتك في المخيم!`,
                `مبارك! لقد أكملت جميع مهام مخيمك. تم حفظ خطة عملك بنجاح. استمر في التطبيق العملي.
                `,
              ]
            );
            const [userRows] = await db.query(
              `SELECT email, username FROM users WHERE id = ? LIMIT 1`,
              [userId]
            );
            const [campRows] = await db.query(
              `SELECT name FROM quran_camps WHERE id = ? LIMIT 1`,
              [id]
            );
            if (userRows.length > 0) {
              const userEmail = userRows[0].email;
              const username = userRows[0].username || "";
              const campName =
                campRows.length > 0 ? campRows[0].name : "المخيم";
              try {
                await mailService.sendUserCompletedCampEmail(
                  userEmail,
                  username,
                  campName,
                  id,
                  actionDetailsJson
                );
              } catch (_) {}
            }
          }
        }
      } catch (_) {}

      res.status(201).json({
        success: true,
        message: "تم إنشاء خطة العمل بنجاح",
        data: {
          ...actionPlan,
          follow_up_sent: Boolean(actionPlan.follow_up_sent),
        },
      });
    }
  } catch (error) {
    console.error("Error creating/updating action plan:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في حفظ خطة العمل",
    });
  }
};

// Get user's camp summary (حصاد المخيم)
const getMySummary = async (req, res) => {
  try {
    const { id } = req.params; // camp_id
    const userId = req.user.id;

    // Verify user is enrolled in the camp
    const [enrollments] = await db.query(
      `
      SELECT 
        ce.*,
        qc.name as camp_name,
        u.username as user_name
      FROM camp_enrollments ce
      JOIN quran_camps qc ON ce.camp_id = qc.id
      JOIN users u ON ce.user_id = u.id
      WHERE ce.user_id = ? AND ce.camp_id = ?
      `,
      [userId, id]
    );

    if (enrollments.length === 0) {
      return res.status(403).json({
        success: false,
        message: "يجب عليك الاشتراك في المخيم أولاً",
      });
    }

    const enrollment = enrollments[0];

    // Get total tasks for the camp (actual total)
    const [totalTasksResult] = await db.query(
      "SELECT COUNT(*) as total FROM camp_daily_tasks WHERE camp_id = ?",
      [id]
    );
    const totalTasksForCamp = totalTasksResult[0]?.total || 0;

    // Get completed tasks count
    const [completedTasksResult] = await db.query(
      `
      SELECT COUNT(*) as completed
      FROM camp_task_progress ctp
      WHERE ctp.enrollment_id = ? AND ctp.completed = true
      `,
      [enrollment.id]
    );
    const completedTasks = completedTasksResult[0]?.completed || 0;

    // Calculate incomplete tasks
    const incompleteTasks = Math.max(0, totalTasksForCamp - completedTasks);

    // Get days completed (unique days with completed tasks)
    const [daysCompletedResult] = await db.query(
      `
      SELECT COUNT(DISTINCT cdt.day_number) as days_completed
      FROM camp_task_progress ctp
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      WHERE ctp.enrollment_id = ? AND ctp.completed = true
      `,
      [enrollment.id]
    );
    const daysCompleted = daysCompletedResult[0]?.days_completed || 0;

    // Get reflections written (journal_entry OR notes)
    const [reflectionsWrittenResult] = await db.query(
      `
      SELECT COUNT(*) as count
      FROM camp_task_progress ctp
      WHERE ctp.enrollment_id = ? 
        AND (ctp.journal_entry IS NOT NULL AND ctp.journal_entry != '' 
             OR ctp.notes IS NOT NULL AND ctp.notes != '')
      `,
      [enrollment.id]
    );
    const reflectionsWritten = reflectionsWrittenResult[0]?.count || 0;

    // Get reflections saved (count of reflections the user saved from others)
    const [reflectionsSavedResult] = await db.query(
      `
      SELECT COUNT(DISTINCT usr.progress_id) as count
      FROM user_saved_reflections usr
      JOIN camp_task_progress ctp ON usr.progress_id = ctp.id
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      WHERE usr.user_id = ? AND ce.camp_id = ?
      `,
      [userId, id]
    );
    const reflectionsSaved = reflectionsSavedResult[0]?.count || 0;

    // Get upvotes received (total upvotes on user's reflections)
    const [upvotesReceivedResult] = await db.query(
      `
      SELECT COALESCE(SUM(ctp.upvote_count), 0) as total
      FROM camp_task_progress ctp
      WHERE ctp.enrollment_id = ?
        AND (ctp.journal_entry IS NOT NULL AND ctp.journal_entry != '' 
             OR ctp.notes IS NOT NULL AND ctp.notes != '')
      `,
      [enrollment.id]
    );
    const upvotesReceived = upvotesReceivedResult[0]?.total || 0;

    // Get total points
    const totalPoints = enrollment.total_points || enrollment.points || 0;

    // Get action plan
    const [actionPlanResult] = await db.query(
      `
      SELECT action_details
      FROM user_action_plans
      WHERE user_id = ? AND camp_id = ?
      `,
      [userId, id]
    );

    // get camp duration days
    const [campDurationDaysResult] = await db.query(
      `
      SELECT duration_days
      FROM quran_camps
      WHERE id = ?
      `,
      [id]
    );

    // Parse action_details JSON
    let actionPlanDetails = null;
    if (actionPlanResult[0]?.action_details) {
      actionPlanDetails =
        typeof actionPlanResult[0].action_details === "string"
          ? JSON.parse(actionPlanResult[0].action_details)
          : actionPlanResult[0].action_details;
    }

    // Get total camp days
    const totalCampDays = campDurationDaysResult[0].duration_days || 0;

    // Get longest streak from enrollment
    const longestStreak = enrollment.longest_streak || 0;

    // Get upvotes given by user (count of upvotes the user gave to others in this camp)
    const [upvotesGivenResult] = await db.query(
      `
      SELECT COUNT(*) as count
      FROM reflection_upvotes ru
      JOIN camp_task_progress ctp ON ru.progress_id = ctp.id
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      WHERE ru.user_id = ? AND ce.camp_id = ?
      `,
      [userId, id]
    );
    const upvotesGiven = upvotesGivenResult[0]?.count || 0;

    // Get user's rank and percentile
    // Percentile: percentage of users the current user outperformed or tied with
    const [percentileResult] = await db.query(
      `
      SELECT 
        (SELECT COUNT(*) FROM camp_enrollments WHERE camp_id = ?) as total_participants,
        (
          SELECT COUNT(*) 
          FROM camp_enrollments ce2
          WHERE ce2.camp_id = ? 
          AND ce2.total_points < COALESCE((SELECT total_points FROM camp_enrollments WHERE user_id = ? AND camp_id = ?), 0)
        ) as users_below,
        (
          SELECT COUNT(*) 
          FROM camp_enrollments ce3
          WHERE ce3.camp_id = ? 
          AND ce3.total_points = COALESCE((SELECT total_points FROM camp_enrollments WHERE user_id = ? AND camp_id = ?), 0)
        ) as users_tied
      `,
      [id, id, userId, id, id, userId, id]
    );

    const usersBelow = percentileResult[0]?.users_below || 0;
    const usersTied = percentileResult[0]?.users_tied || 0;
    const totalParticipants = percentileResult[0]?.total_participants || 1;

    // Calculate percentile: (users with fewer points + 0.5 * tied users) / total participants * 100
    let percentile = null;

    if (totalParticipants > 0) {
      // Special case: if only one participant, they are at 100 percentile
      if (totalParticipants === 1) {
        percentile = 100;
      } else {
        // Include tied users in percentile calculation for better accuracy
        percentile = Math.round(
          ((usersBelow + (usersTied - 1) * 0.5) / totalParticipants) * 100
        );
        percentile = Math.max(0, Math.min(100, percentile)); // Ensure between 0-100

        // If user is tied with others at the top and percentile is too low, adjust it
        if (percentile === 0 && usersBelow === 0 && usersTied > 1) {
          // User is tied at the top with others - show higher percentile
          percentile = Math.min(
            99,
            Math.round(100 - (usersTied * 100) / totalParticipants)
          );
        }
      }
    }

    // Get top reflection (reflection with most upvotes)
    const [topReflectionResult] = await db.query(
      `
      SELECT 
        COALESCE(ctp.journal_entry, ctp.notes) as reflection_text,
        ctp.upvote_count
      FROM camp_task_progress ctp
      WHERE ctp.enrollment_id = ?
        AND (ctp.journal_entry IS NOT NULL AND ctp.journal_entry != '' 
             OR ctp.notes IS NOT NULL AND ctp.notes != '')
        AND ctp.upvote_count > 0
      ORDER BY ctp.upvote_count DESC
      LIMIT 1
      `,
      [enrollment.id]
    );
    const topReflection =
      topReflectionResult.length > 0
        ? {
            text: topReflectionResult[0].reflection_text,
            upvotes: topReflectionResult[0].upvote_count,
          }
        : null;

    res.json({
      success: true,
      data: {
        campName: enrollment.camp_name,
        userName: enrollment.user_name,
        daysCompleted: daysCompleted,
        totalCampDays: totalCampDays,
        totalTasks: completedTasks, // عدد المهام المكتملة
        totalTasksForCamp: totalTasksForCamp, // إجمالي المهام في المخيم
        incompleteTasks: incompleteTasks, // عدد المهام غير المكتملة
        reflectionsWritten: reflectionsWritten,
        reflectionsSaved: reflectionsSaved,
        upvotesReceived: upvotesReceived,
        upvotesGiven: upvotesGiven,
        totalPoints: totalPoints,
        actionPlan: actionPlanDetails,
        longestStreak: longestStreak,
        percentile: percentile,
        topReflection: topReflection,
      },
    });
  } catch (error) {
    console.error("Error fetching camp summary:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب الملخص",
    });
  }
};

// Toggle upvote for a reflection/benefit
const toggleUpvoteReflection = async (req, res) => {
  try {
    const { progressId } = req.params;
    const userId = req.user.id;

    // Check if reflection exists and user has access
    const [progress] = await db.query(
      `
      SELECT ctp.*, ce.user_id as owner_id, ce.camp_id, qc.status as camp_status
      FROM camp_task_progress ctp
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN quran_camps qc ON ce.camp_id = qc.id
      WHERE ctp.id = ? AND (ctp.journal_entry IS NOT NULL OR ctp.notes IS NOT NULL)
      `,
      [progressId]
    );

    if (progress.length === 0) {
      return res.status(404).json({
        success: false,
        message: "التدبر غير موجود",
      });
    }

    // منع التفاعل في المخيمات المنتهية
    if (progress[0].camp_status === "completed") {
      return res.status(403).json({
        success: false,
        message: "لا يمكن التفاعل مع محتوى المخيمات المنتهية",
      });
    }

    // Check if user is enrolled in the same camp
    const [enrollment] = await db.query(
      "SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ?",
      [userId, progress[0].camp_id]
    );

    if (enrollment.length === 0) {
      return res.status(403).json({
        success: false,
        message: "غير مسموح لك بالتصويت على هذا التدبر",
      });
    }

    // Check if user already upvoted
    const [existingUpvote] = await db.query(
      "SELECT * FROM reflection_upvotes WHERE user_id = ? AND progress_id = ?",
      [userId, progressId]
    );

    if (existingUpvote.length > 0) {
      // Remove upvote
      await db.query(
        "DELETE FROM reflection_upvotes WHERE user_id = ? AND progress_id = ?",
        [userId, progressId]
      );

      // Decrease upvote count
      await db.query(
        "UPDATE camp_task_progress SET upvote_count = upvote_count - 1 WHERE id = ?",
        [progressId]
      );

      res.json({
        success: true,
        message: "تم إلغاء التصويت",
        upvoted: false,
      });
    } else {
      // Add upvote
      await db.query(
        "INSERT INTO reflection_upvotes (user_id, progress_id) VALUES (?, ?)",
        [userId, progressId]
      );

      // Increase upvote count
      await db.query(
        "UPDATE camp_task_progress SET upvote_count = upvote_count + 1 WHERE id = ?",
        [progressId]
      );

      res.json({
        success: true,
        message: "تم التصويت بنجاح",
        upvoted: true,
      });
    }
  } catch (error) {
    console.error("Error toggling upvote:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في التصويت",
    });
  }
};

// Toggle save for a reflection/benefit
const toggleSaveReflection = async (req, res) => {
  try {
    const { progressId } = req.params;
    const userId = req.user.id;

    // Check if reflection exists and user has access
    const [progress] = await db.query(
      `
      SELECT ctp.*, ce.user_id as owner_id, ce.camp_id, qc.status as camp_status
      FROM camp_task_progress ctp
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN quran_camps qc ON ce.camp_id = qc.id
      WHERE ctp.id = ? AND (ctp.journal_entry IS NOT NULL OR ctp.notes IS NOT NULL)
      `,
      [progressId]
    );

    if (progress.length === 0) {
      return res.status(404).json({
        success: false,
        message: "التدبر غير موجود",
      });
    }

    // منع التفاعل في المخيمات المنتهية
    if (progress[0].camp_status === "completed") {
      return res.status(403).json({
        success: false,
        message: "لا يمكن التفاعل مع محتوى المخيمات المنتهية",
      });
    }

    // Check if user is enrolled in the same camp
    const [enrollment] = await db.query(
      "SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ?",
      [userId, progress[0].camp_id]
    );

    if (enrollment.length === 0) {
      return res.status(403).json({
        success: false,
        message: "غير مسموح لك بحفظ هذا التدبر",
      });
    }

    // Check if user already saved
    const [existingSave] = await db.query(
      "SELECT * FROM user_saved_reflections WHERE user_id = ? AND progress_id = ?",
      [userId, progressId]
    );

    if (existingSave.length > 0) {
      // Remove save
      await db.query(
        "DELETE FROM user_saved_reflections WHERE user_id = ? AND progress_id = ?",
        [userId, progressId]
      );

      // Decrease save count
      await db.query(
        "UPDATE camp_task_progress SET save_count = save_count - 1 WHERE id = ?",
        [progressId]
      );

      res.json({
        success: true,
        message: "تم إلغاء الحفظ",
        saved: false,
      });
    } else {
      // Add save
      await db.query(
        "INSERT INTO user_saved_reflections (user_id, progress_id) VALUES (?, ?)",
        [userId, progressId]
      );

      // Increase save count
      await db.query(
        "UPDATE camp_task_progress SET save_count = save_count + 1 WHERE id = ?",
        [progressId]
      );

      res.json({
        success: true,
        message: "تم الحفظ بنجاح",
        saved: true,
      });
    }
  } catch (error) {
    console.error("Error toggling save:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في الحفظ",
    });
  }
};

// Get saved reflections for a user
const getSavedReflections = async (req, res) => {
  try {
    const userId = req.user.id;
    const { campId } = req.params;
    const { page = 1, limit = 10, sort = "newest" } = req.query;

    const offset = (page - 1) * limit;

    // Check if user is enrolled in the camp
    const [enrollment] = await db.query(
      "SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ?",
      [userId, campId]
    );

    if (enrollment.length === 0) {
      return res.status(403).json({
        success: false,
        message: "غير مسموح لك بالوصول لهذا المخيم",
      });
    }

    let orderBy = "usr.created_at DESC";
    if (sort === "oldest") {
      orderBy = "usr.created_at ASC";
    } else if (sort === "most_upvoted") {
      orderBy = "ctp.upvote_count DESC";
    } else if (sort === "most_saved") {
      orderBy = "ctp.save_count DESC";
    }

    const [savedReflections] = await db.query(
      `
      SELECT 
        ctp.id,
        ctp.id as progress_id,
        ctp.journal_entry,
        ctp.notes,
        ctp.content_rich,
        ctp.is_private,
        ctp.proposed_step,
        ctp.upvote_count,
        ctp.save_count,
        ctp.created_at,
        cdt.title as task_title,
        cdt.day_number,
        cdt.task_type,
        u.username as author_name,
        u.avatar_url as author_avatar,
        cs.hide_identity,
        usr.created_at as saved_at,
        COALESCE(pledge_counts.pledge_count, 0) as pledge_count,
        CASE 
          WHEN EXISTS(SELECT 1 FROM reflection_upvotes ru WHERE ru.user_id = ? AND ru.progress_id = ctp.id) THEN 1
          ELSE 0
        END as is_upvoted_by_user,
        CASE 
          WHEN EXISTS(SELECT 1 FROM user_saved_reflections usr2 WHERE usr2.user_id = ? AND usr2.progress_id = ctp.id) THEN 1
          ELSE 0
        END as is_saved_by_user,
        CASE 
          WHEN EXISTS(SELECT 1 FROM joint_step_pledges jsp WHERE jsp.progress_id = ctp.id AND jsp.pledger_user_id = ?) THEN 1
          ELSE 0
        END as is_pledged_by_user
      FROM user_saved_reflections usr
      JOIN camp_task_progress ctp ON usr.progress_id = ctp.id
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN camp_settings cs ON ce.id = cs.enrollment_id
      JOIN users u ON ce.user_id = u.id
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      LEFT JOIN (
        SELECT progress_id, COUNT(*) as pledge_count
        FROM joint_step_pledges
        GROUP BY progress_id
      ) pledge_counts ON ctp.id = pledge_counts.progress_id
      WHERE usr.user_id = ? AND ce.camp_id = ?
        AND (ctp.journal_entry IS NOT NULL OR ctp.notes IS NOT NULL)
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
      `,
      [userId, userId, userId, userId, campId, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await db.query(
      `
      SELECT COUNT(*) as total
      FROM user_saved_reflections usr
      JOIN camp_task_progress ctp ON usr.progress_id = ctp.id
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      WHERE usr.user_id = ? AND ce.camp_id = ?
        AND (ctp.journal_entry IS NOT NULL OR ctp.notes IS NOT NULL)
      `,
      [userId, campId]
    );

    // Get user's own reflections (myReflections)
    const [myReflections] = await db.query(
      `
      SELECT 
        ctp.id,
        ctp.id as progress_id,
        ctp.journal_entry,
        ctp.notes,
        ctp.content_rich,
        ctp.is_private,
        ctp.proposed_step,
        ctp.upvote_count,
        ctp.save_count,
        ctp.created_at,
        ctp.completed_at,
        cdt.title as task_title,
        cdt.day_number,
        cdt.task_type,
        CASE 
          WHEN EXISTS(SELECT 1 FROM reflection_upvotes ru WHERE ru.user_id = ? AND ru.progress_id = ctp.id) THEN 1
          ELSE 0
        END as is_upvoted_by_user,
        CASE 
          WHEN EXISTS(SELECT 1 FROM user_saved_reflections usr WHERE usr.user_id = ? AND usr.progress_id = ctp.id) THEN 1
          ELSE 0
        END as is_saved_by_user
      FROM camp_task_progress ctp
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      WHERE ce.user_id = ? AND ce.camp_id = ?
        AND ctp.completed = 1
        AND (ctp.journal_entry IS NOT NULL OR ctp.notes IS NOT NULL)
      ORDER BY ctp.completed_at DESC
      `,
      [userId, userId, userId, campId]
    );

    // Get user's action plan for this camp
    const [actionPlans] = await db.query(
      `
      SELECT 
        id,
        user_id,
        camp_id,
        action_details,
        follow_up_sent,
        created_at,
        updated_at
      FROM user_action_plans
      WHERE user_id = ? AND camp_id = ?
      `,
      [userId, campId]
    );

    let myActionPlan = null;
    if (actionPlans.length > 0 && actionPlans[0].action_details) {
      myActionPlan =
        typeof actionPlans[0].action_details === "string"
          ? JSON.parse(actionPlans[0].action_details)
          : actionPlans[0].action_details;
    }

    res.json({
      success: true,
      data: {
        myReflections: myReflections || [],
        savedReflections: savedReflections || [],
        myActionPlan: myActionPlan,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching saved reflections:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب التدبرات المحفوظة",
    });
  }
};

// حذف تدبر من قاعة التدارس
const deleteReflection = async (req, res) => {
  try {
    const { progressId } = req.params;
    const userId = req.user.id;

    // التحقق من وجود التدبر
    const [reflection] = await db.query(
      `
      SELECT ctp.*, ce.user_id, ce.camp_id, ce.id as enrollment_id, qc.status as camp_status
      FROM camp_task_progress ctp
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN quran_camps qc ON ce.camp_id = qc.id
      WHERE ctp.id = ?
      `,
      [progressId]
    );

    if (reflection.length === 0) {
      return res.status(404).json({
        success: false,
        message: "التدبر غير موجود",
      });
    }

    // منع الحذف في المخيمات المنتهية
    if (reflection[0].camp_status === "completed") {
      return res.status(403).json({
        success: false,
        message: "لا يمكن حذف محتوى المخيمات المنتهية",
      });
    }

    // التحقق من أن المستخدم هو صاحب التدبر
    if (reflection[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "غير مسموح لك بحذف هذا التدبر",
      });
    }

    // التحقق من وجود journal_entry قبل الحذف (لإدارة النقاط)
    const hadJournalEntry =
      reflection[0].journal_entry !== null &&
      reflection[0].journal_entry !== "" &&
      reflection[0].journal_entry.trim() !== "";

    // حذف من جداول التفاعل أولاً (لضمان سلامة البيانات)
    // 1. حذف التصويتات
    await db.query("DELETE FROM reflection_upvotes WHERE progress_id = ?", [
      progressId,
    ]);

    // 2. حذف الحفظات
    await db.query("DELETE FROM user_saved_reflections WHERE progress_id = ?", [
      progressId,
    ]);

    // 3. حذف التدبر نفسه (سيحذف journal_entry و notes)
    await db.query(
      "UPDATE camp_task_progress SET journal_entry = NULL, notes = NULL WHERE id = ?",
      [progressId]
    );

    // 4. حذف 3 نقاط عند حذف الفائدة (إذا كانت موجودة)
    if (hadJournalEntry) {
      const JOURNAL_BONUS_POINTS = 3;
      await db.query(
        `
        UPDATE camp_enrollments 
        SET total_points = GREATEST(0, total_points - ?)
        WHERE id = ?
      `,
        [JOURNAL_BONUS_POINTS, reflection[0].enrollment_id]
      );
    }

    res.json({
      success: true,
      message: "تم حذف التدبر بنجاح",
    });
  } catch (error) {
    console.error("Error deleting reflection:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في حذف التدبر",
    });
  }
};

// إرسال إيميل وإشعار عند انتهاء المخيم
const notifyCampFinished = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // التحقق من وجود المخيم مع حساب end_date
    const [camps] = await db.query(
      `SELECT 
        id, 
        name, 
        DATE_ADD(start_date, INTERVAL duration_days DAY) as end_date 
      FROM quran_camps 
      WHERE id = ?`,
      [id]
    );

    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    const camp = camps[0];

    // التحقق من أن المستخدم مسجل في المخيم
    const [enrollments] = await db.query(
      `SELECT ce.*, u.email, u.username 
       FROM camp_enrollments ce
       JOIN users u ON ce.user_id = u.id
       WHERE ce.camp_id = ? AND ce.user_id = ?`,
      [id, userId]
    );

    if (enrollments.length === 0) {
      return res.status(403).json({
        success: false,
        message: "أنت غير مسجل في هذا المخيم",
      });
    }

    const enrollment = enrollments[0];

    // إرسال الإيميل
    try {
      await mailService.sendCampFinishedEmail(
        enrollment.email,
        enrollment.username || enrollment.user_name,
        camp.name,
        camp.id
      );
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // نستمر حتى لو فشل الإيميل
    }

    // إرسال إشعار Push (إن أمكن)
    try {
      await CampNotificationService.sendCampFinishedNotification(
        userId,
        id,
        camp.name
      );
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError);
      // نستمر حتى لو فشل الإشعار
    }

    res.json({
      success: true,
      message: "تم إرسال التهنئة بنجاح",
    });
  } catch (error) {
    console.error("Error in notifyCampFinished:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إرسال التهنئة",
    });
  }
};

// Delete a daily task (admin only)
const deleteDailyTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res
        .status(400)
        .json({ success: false, message: "معرف المهمة مفقود" });
    }

    // Delete the task
    const [result] = await db.query(
      "DELETE FROM camp_daily_tasks WHERE id = ?",
      [taskId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "المهمة غير موجودة" });
    }

    return res.json({ success: true, message: "تم حذف المهمة بنجاح" });
  } catch (error) {
    console.error("Error deleting daily task:", error);
    return res
      .status(500)
      .json({ success: false, message: "حدث خطأ أثناء حذف المهمة" });
  }
};

// Send notification to camp participants (admin only)
const sendCampNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, target_type, target_user_ids } = req.body;

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "العنوان والرسالة مطلوبان",
      });
    }

    // Validate target_type
    const validTargetTypes = ["all", "active", "completed", "specific"];
    if (!target_type || !validTargetTypes.includes(target_type)) {
      return res.status(400).json({
        success: false,
        message: "نوع الهدف غير صحيح",
      });
    }

    // Check if camp exists
    const [camps] = await db.query(
      "SELECT id, name FROM quran_camps WHERE id = ?",
      [id]
    );
    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    const camp = camps[0];

    // Get participants based on target_type
    let query = `
      SELECT DISTINCT ce.user_id, u.username, u.email
      FROM camp_enrollments ce
      JOIN users u ON ce.user_id = u.id
      WHERE ce.camp_id = ?
    `;
    const params = [id];

    if (target_type === "active") {
      query += ` AND ce.completion_percentage < 100`;
    } else if (target_type === "completed") {
      query += ` AND ce.completion_percentage >= 100`;
    } else if (target_type === "specific") {
      if (
        !target_user_ids ||
        !Array.isArray(target_user_ids) ||
        target_user_ids.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "يجب تحديد معرفات المستخدمين",
        });
      }
      query += ` AND ce.user_id IN (${target_user_ids
        .map(() => "?")
        .join(",")})`;
      params.push(...target_user_ids);
    }

    const [participants] = await db.query(query, params);

    if (participants.length === 0) {
      return res.status(404).json({
        success: false,
        message: "لا يوجد مشتركين يطابقون المعايير المحددة",
      });
    }

    // Send notifications to each participant
    const campNotificationService = require("../services/campNotificationService");
    const mailService = require("../services/mailService");

    let successCount = 0;
    let failCount = 0;

    for (const participant of participants) {
      try {
        // Check if user wants notifications
        const shouldSend =
          await campNotificationService.checkNotificationSettings(
            participant.user_id,
            id,
            "general"
          );

        // Insert notification in database (always save, even if user disabled notifications)
        await db.query(
          `INSERT INTO camp_notifications (user_id, camp_id, type, title, message) 
           VALUES (?, ?, 'admin_message', ?, ?)`,
          [participant.user_id, id, title, message]
        );

        // Send email if user has email and wants notifications
        if (shouldSend && participant.email) {
          try {
            const emailSubject = `📢 إشعار من مخيم ${camp.name}: ${title}`;
            const emailHtml = `
              <div dir="rtl" style="font-family: 'Arabic Typography', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <div style="background-color: #7440EA; padding: 30px; text-align: center;">
                  <img src="https://hadith-shareef.com/assets/icons/180×180.png" alt="Meshkah Logo" style="width: 100px; margin-bottom: 15px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">${title}</h1>
                </div>
                <div style="padding: 40px 30px;">
                  <p style="color: #2c3e50; font-size: 18px; line-height: 1.8; margin-bottom: 20px;">
                    مرحباً ${participant.username}،
                  </p>
                  <div style="background-color: #F9F7FD; border-radius: 8px; padding: 20px; margin: 20px 0; border-right: 4px solid #7440EA;">
                    <p style="color: #555555; line-height: 1.8; font-size: 16px; margin: 0;">
                      ${message.replace(/\n/g, "<br>")}
                    </p>
                  </div>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://hadith-shareef.com/quran-camps/${id}" style="display: inline-block; background-color: #7440EA; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 17px;">
                      الذهاب إلى المخيم
                    </a>
                  </div>
                </div>
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #EAEAEA;">
                  <p style="color: #AAAAAA; margin: 0; font-size: 12px;">© 2025 مشكاة - جميع الحقوق محفوظة</p>
                </div>
              </div>
            `;
            await mailService.sendMail(
              participant.email,
              emailSubject,
              message,
              emailHtml
            );
          } catch (emailError) {
            console.error(
              `Email error for user ${participant.user_id}:`,
              emailError
            );
            // Continue even if email fails
          }
        }

        successCount++;
      } catch (error) {
        console.error(
          `Error sending notification to user ${participant.user_id}:`,
          error
        );
        failCount++;
      }
    }

    res.json({
      success: true,
      message: `تم إرسال الإشعار بنجاح`,
      data: {
        total_recipients: participants.length,
        success_count: successCount,
        fail_count: failCount,
      },
    });
  } catch (error) {
    console.error("Error in sendCampNotification:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إرسال الإشعار",
      error: error.message,
    });
  }
};

// ==================== CAMP RESOURCES (STUDY HALL) ====================

// Get all resources for a specific camp
// Get all resources for a camp (grouped by category)
const getCampResources = async (req, res) => {
  try {
    const { id: campId } = req.params;

    // Get all categories with their resources
    const [categories] = await db.query(
      `
      SELECT 
        crc.id,
        crc.title,
        crc.display_order,
        COUNT(cr.id) as resource_count
      FROM camp_resource_categories crc
      LEFT JOIN camp_resources cr ON cr.category_id = crc.id
      WHERE crc.camp_id = ?
      GROUP BY crc.id, crc.title, crc.display_order
      ORDER BY crc.display_order ASC, crc.created_at ASC
      `,
      [campId]
    );

    // Get resources for each category
    const categoriesWithResources = await Promise.all(
      categories.map(async (category) => {
        const [resources] = await db.query(
          `
          SELECT 
            id, title, url, resource_type, display_order, created_at
          FROM camp_resources
          WHERE category_id = ?
          ORDER BY display_order ASC, created_at ASC
          `,
          [category.id]
        );
        return {
          id: category.id,
          title: category.title,
          display_order: category.display_order,
          resources: resources,
        };
      })
    );

    // Get resources without category
    const [uncategorizedResources] = await db.query(
      `
      SELECT 
        id, title, url, resource_type, display_order, created_at
      FROM camp_resources
      WHERE camp_id = ? AND category_id IS NULL
      ORDER BY display_order ASC, created_at ASC
      `,
      [campId]
    );

    // Add uncategorized section if there are resources
    if (uncategorizedResources.length > 0) {
      categoriesWithResources.push({
        id: null,
        title: "موارد أخرى",
        display_order: 999999,
        resources: uncategorizedResources,
      });
    }

    res.json({
      success: true,
      data: categoriesWithResources,
    });
  } catch (error) {
    console.error("Error fetching camp resources:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الموارد",
    });
  }
};

// Create a new resource for a camp (admin only)
const createCampResource = async (req, res) => {
  try {
    const { id: campId } = req.params;
    const adminId = req.user.id;
    const { title, url, resource_type, category_id, display_order } = req.body;

    // If category_id is provided, verify it belongs to this camp
    if (category_id) {
      const [categoryCheck] = await db.query(
        `SELECT id FROM camp_resource_categories WHERE id = ? AND camp_id = ?`,
        [category_id, campId]
      );
      if (categoryCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: "الفئة المحددة غير موجودة أو لا تنتمي لهذا المخيم",
        });
      }
    }

    // Get max display_order for this category (or null category)
    let order = display_order;
    if (order === undefined || order === null) {
      const [maxOrder] = await db.query(
        `
        SELECT COALESCE(MAX(display_order), -1) + 1 as next_order
        FROM camp_resources
        WHERE camp_id = ? AND (category_id = ? OR (category_id IS NULL AND ? IS NULL))
        `,
        [campId, category_id || null, category_id || null]
      );
      order = maxOrder[0].next_order;
    }

    const [result] = await db.query(
      `
      INSERT INTO camp_resources (camp_id, title, url, resource_type, category_id, display_order, created_by_admin_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [campId, title, url, resource_type, category_id || null, order, adminId]
    );

    res.status(201).json({
      success: true,
      message: "تمت إضافة المورد بنجاح",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("Error creating camp resource:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إضافة المورد",
    });
  }
};

// Update a camp resource (admin only)
const updateCampResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { title, url, resource_type, category_id, display_order } = req.body;

    // Get current resource to check camp_id
    const [currentResource] = await db.query(
      `SELECT camp_id FROM camp_resources WHERE id = ?`,
      [resourceId]
    );

    if (currentResource.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المورد غير موجود",
      });
    }

    const campId = currentResource[0].camp_id;

    // If category_id is provided, verify it belongs to this camp
    if (category_id !== undefined && category_id !== null) {
      const [categoryCheck] = await db.query(
        `SELECT id FROM camp_resource_categories WHERE id = ? AND camp_id = ?`,
        [category_id, campId]
      );
      if (categoryCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: "الفئة المحددة غير موجودة أو لا تنتمي لهذا المخيم",
        });
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) {
      updateFields.push("title = ?");
      updateValues.push(title);
    }
    if (url !== undefined) {
      updateFields.push("url = ?");
      updateValues.push(url);
    }
    if (resource_type !== undefined) {
      updateFields.push("resource_type = ?");
      updateValues.push(resource_type);
    }
    if (category_id !== undefined) {
      updateFields.push("category_id = ?");
      updateValues.push(category_id || null);
    }
    if (display_order !== undefined) {
      updateFields.push("display_order = ?");
      updateValues.push(display_order);
    }

    updateValues.push(resourceId);

    const [result] = await db.query(
      `
      UPDATE camp_resources 
      SET ${updateFields.join(", ")} 
      WHERE id = ?
      `,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "المورد غير موجود",
      });
    }

    res.json({
      success: true,
      message: "تم تحديث المورد بنجاح",
    });
  } catch (error) {
    console.error("Error updating camp resource:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث المورد",
    });
  }
};

// Delete a camp resource (admin only)
const deleteCampResource = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const [result] = await db.query(`DELETE FROM camp_resources WHERE id = ?`, [
      resourceId,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "المورد غير موجود" });
    }

    res.json({
      success: true,
      message: "تم حذف المورد بنجاح",
    });
  } catch (error) {
    console.error("Error deleting camp resource:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء حذف المورد",
    });
  }
};

// ==================== CAMP RESOURCE CATEGORIES ====================

// Get all resource categories for a camp (admin only)
const getCampResourceCategories = async (req, res) => {
  try {
    const { id: campId } = req.params;

    const [categories] = await db.query(
      `
      SELECT 
        crc.id,
        crc.title,
        crc.display_order,
        COUNT(cr.id) as resource_count
      FROM camp_resource_categories crc
      LEFT JOIN camp_resources cr ON cr.category_id = crc.id
      WHERE crc.camp_id = ?
      GROUP BY crc.id, crc.title, crc.display_order
      ORDER BY crc.display_order ASC, crc.created_at ASC
      `,
      [campId]
    );

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching camp resource categories:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الفئات",
    });
  }
};

// Create a new resource category (admin only)
const createCampResourceCategory = async (req, res) => {
  try {
    const { id: campId } = req.params;
    const { title } = req.body;

    // Get max display_order
    const [maxOrder] = await db.query(
      `
      SELECT COALESCE(MAX(display_order), -1) + 1 as next_order
      FROM camp_resource_categories
      WHERE camp_id = ?
      `,
      [campId]
    );

    const displayOrder = maxOrder[0].next_order;

    const [result] = await db.query(
      `
      INSERT INTO camp_resource_categories (camp_id, title, display_order)
      VALUES (?, ?, ?)
      `,
      [campId, title, displayOrder]
    );

    res.status(201).json({
      success: true,
      message: "تمت إضافة الفئة بنجاح",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("Error creating camp resource category:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إضافة الفئة",
    });
  }
};

// Update a resource category (admin only)
const updateCampResourceCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { title } = req.body;

    const [result] = await db.query(
      `
      UPDATE camp_resource_categories 
      SET title = ? 
      WHERE id = ?
      `,
      [title, categoryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "الفئة غير موجودة",
      });
    }

    res.json({
      success: true,
      message: "تم تحديث الفئة بنجاح",
    });
  } catch (error) {
    console.error("Error updating camp resource category:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث الفئة",
    });
  }
};

// Delete a resource category (admin only)
// Resources in this category will be moved to uncategorized (category_id set to NULL)
const deleteCampResourceCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Start transaction
    await db.query("START TRANSACTION");

    try {
      // Move resources to uncategorized
      await db.query(
        `
        UPDATE camp_resources 
        SET category_id = NULL 
        WHERE category_id = ?
        `,
        [categoryId]
      );

      // Delete the category
      const [result] = await db.query(
        `DELETE FROM camp_resource_categories WHERE id = ?`,
        [categoryId]
      );

      if (result.affectedRows === 0) {
        await db.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          message: "الفئة غير موجودة",
        });
      }

      await db.query("COMMIT");

      res.json({
        success: true,
        message: "تم حذف الفئة بنجاح، تم نقل الموارد إلى قسم 'موارد أخرى'",
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error deleting camp resource category:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء حذف الفئة",
    });
  }
};

// Update category order (admin only)
const updateCategoryOrder = async (req, res) => {
  try {
    const { id: campId } = req.params;
    const { categoryIds } = req.body; // Array of category IDs in desired order

    if (!Array.isArray(categoryIds)) {
      return res.status(400).json({
        success: false,
        message: "يجب إرسال قائمة بمعرفات الفئات",
      });
    }

    // Start transaction
    await db.query("START TRANSACTION");

    try {
      // Update display_order for each category
      for (let i = 0; i < categoryIds.length; i++) {
        await db.query(
          `
          UPDATE camp_resource_categories 
          SET display_order = ? 
          WHERE id = ? AND camp_id = ?
          `,
          [i, categoryIds[i], campId]
        );
      }

      await db.query("COMMIT");

      res.json({
        success: true,
        message: "تم تحديث ترتيب الفئات بنجاح",
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error updating category order:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث ترتيب الفئات",
    });
  }
};

// Update resource order within a category (admin only)
const updateResourceOrder = async (req, res) => {
  try {
    const { categoryId, resourceIds } = req.body; // categoryId can be null for uncategorized

    if (!Array.isArray(resourceIds)) {
      return res.status(400).json({
        success: false,
        message: "يجب إرسال قائمة بمعرفات الموارد",
      });
    }

    // Start transaction
    await db.query("START TRANSACTION");

    try {
      // Update display_order for each resource
      for (let i = 0; i < resourceIds.length; i++) {
        await db.query(
          `
          UPDATE camp_resources 
          SET display_order = ? 
          WHERE id = ? AND (category_id = ? OR (category_id IS NULL AND ? IS NULL))
          `,
          [i, resourceIds[i], categoryId || null, categoryId || null]
        );
      }

      await db.query("COMMIT");

      res.json({
        success: true,
        message: "تم تحديث ترتيب الموارد بنجاح",
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error updating resource order:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث ترتيب الموارد",
    });
  }
};

// ==================== CAMP Q&A ====================

// Get all questions and answers for a camp
const getCampQuestions = async (req, res) => {
  try {
    const { id: campId } = req.params;
    const [qanda] = await db.query(
      `
      SELECT 
        q.id, q.question, q.answer, q.is_answered, q.created_at, q.answered_at,
        CASE 
          WHEN COALESCE(cs.hide_identity, false) = true THEN 'مشارك مجهول'
          ELSE u.username
        END as author,
        CASE 
          WHEN COALESCE(cs.hide_identity, false) = true THEN NULL
          ELSE u.avatar_url
        END as avatar_url,
        COALESCE(cs.hide_identity, false) as hide_identity
      FROM camp_qanda q
      JOIN users u ON q.user_id = u.id
      LEFT JOIN camp_enrollments ce ON ce.user_id = u.id AND ce.camp_id = q.camp_id
      LEFT JOIN camp_settings cs ON cs.enrollment_id = ce.id
      WHERE q.camp_id = ?
      ORDER BY q.created_at DESC
      `,
      [campId]
    );
    res.json({ success: true, data: qanda });
  } catch (error) {
    console.error("Error fetching camp Q&A:", error);
    res
      .status(500)
      .json({ success: false, message: "حدث خطأ أثناء جلب الأسئلة والأجوبة" });
  }
};

// Ask a new question in a camp
const askCampQuestion = async (req, res) => {
  try {
    const { id: campId } = req.params;
    const userId = req.user.id;
    const { question } = req.body;

    const [result] = await db.query(
      `INSERT INTO camp_qanda (camp_id, user_id, question) VALUES (?, ?, ?)`,
      [campId, userId, question]
    );

    res.status(201).json({
      success: true,
      message: "تم إرسال سؤالك بنجاح",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("Error asking camp question:", error);
    res
      .status(500)
      .json({ success: false, message: "حدث خطأ أثناء إرسال السؤال" });
  }
};

// Answer a question (admin only)
const answerCampQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const adminId = req.user.id;
    const { answer } = req.body;

    const [result] = await db.query(
      `
      UPDATE camp_qanda 
      SET answer = ?, is_answered = TRUE, answered_by_admin_id = ?, answered_at = NOW()
      WHERE id = ?
      `,
      [answer, adminId, questionId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "السؤال غير موجود" });
    }

    // Create notification for the question author
    try {
      const [questionData] = await db.query(
        `SELECT q.user_id, q.camp_id, q.question, qc.name as camp_name, u.username, u.email
         FROM camp_qanda q
         JOIN quran_camps qc ON q.camp_id = qc.id
         JOIN users u ON q.user_id = u.id
         WHERE q.id = ?`,
        [questionId]
      );

      if (questionData.length > 0) {
        const { user_id, camp_id, camp_name, username, email } =
          questionData[0];

        // إدراج الإشعار في قاعدة البيانات (دائماً نحفظ حتى لو كان المستخدم معطل الإشعارات)
        // نحاول أولاً بـ 'qanda_answer' وإذا فشل نستخدم 'admin_message'
        let notificationInserted = false;
        let notificationError = null;

        try {
          const [insertResult] = await db.query(
            `INSERT INTO camp_notifications (user_id, camp_id, type, title, message) 
             VALUES (?, ?, 'qanda_answer', ?, ?)`,
            [
              user_id,
              camp_id,
              "تم الرد على سؤالك",
              `تم الرد على سؤالك في مخيم "${camp_name}"`,
            ]
          );

          notificationInserted = true;
        } catch (dbError) {
          notificationError = dbError;

          // محاولة استخدام 'admin_message' كبديل
          try {
            const [fallbackResult] = await db.query(
              `INSERT INTO camp_notifications (user_id, camp_id, type, title, message) 
               VALUES (?, ?, 'admin_message', ?, ?)`,
              [
                user_id,
                camp_id,
                "تم الرد على سؤالك",
                `تم الرد على سؤالك في مخيم "${camp_name}"`,
              ]
            );

            console.log(
              `[Q&A Answer] ✅ Fallback notification inserted successfully! ID: ${fallbackResult.insertId}`
            );
            notificationInserted = true;
          } catch (fallbackError) {
            console.error(`[Q&A Answer] ❌❌ Fallback also failed!`, {
              code: fallbackError.code,
              errno: fallbackError.errno,
              message: fallbackError.message,
              sqlMessage: fallbackError.sqlMessage,
              stack: fallbackError.stack,
            });
          }
        }

        if (!notificationInserted) {
          console.error(
            `[Q&A Answer] ⚠️⚠️⚠️  CRITICAL: Notification was NOT inserted into database!`
          );
          console.error(
            `[Q&A Answer] notificationInserted flag: ${notificationInserted}`
          );
          if (notificationError) {
            console.error(
              `[Q&A Answer] Error details:`,
              JSON.stringify(
                notificationError,
                Object.getOwnPropertyNames(notificationError),
                2
              )
            );
          } else {
            console.error(
              `[Q&A Answer] No error object stored - this is suspicious!`
            );
          }
        } else {
          console.log(
            `[Q&A Answer] ✅✅✅ SUCCESS: Notification was inserted! notificationInserted=${notificationInserted}`
          );
        }

        // التحقق من إعدادات الإشعارات للمستخدم (للتأكد من إرسال الـ email فقط)
        const campNotificationService = require("../services/campNotificationService");
        const shouldSend =
          await campNotificationService.checkNotificationSettings(
            user_id,
            camp_id,
            "general"
          );

        // إرسال email إذا كان المستخدم يريد الإشعارات
        if (shouldSend && email) {
          try {
            console.log(`[Q&A Answer] Attempting to send email to ${email}...`);
            const mailService = require("../services/mailService");
            const emailSubject = `💬 تم الرد على سؤالك في مخيم ${camp_name}`;
            const emailHtml = `
              <div dir="rtl" style="font-family: 'Arabic Typography', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <div style="background-color: #7440EA; padding: 30px; text-align: center;">
                  <img src="https://hadith-shareef.com/assets/icons/180×180.png" alt="Meshkah Logo" style="width: 100px; margin-bottom: 15px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">تم الرد على سؤالك</h1>
                </div>
                <div style="padding: 40px 30px;">
                  <p style="color: #2c3e50; font-size: 18px; line-height: 1.8; margin-bottom: 20px;">
                    مرحباً ${username}،
                  </p>
                  <div style="background-color: #F9F7FD; border-radius: 8px; padding: 20px; margin: 20px 0; border-right: 4px solid #7440EA;">
                    <p style="color: #555555; line-height: 1.8; font-size: 16px; margin: 0;">
                      تم الرد على سؤالك في مخيم "${camp_name}". يمكنك الاطلاع على الإجابة الآن.
                    </p>
                  </div>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://hadith-shareef.com/quran-camps/${camp_id}" style="display: inline-block; background-color: #7440EA; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 17px;">
                      عرض الإجابة
                    </a>
                  </div>
                </div>
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #EAEAEA;">
                  <p style="color: #AAAAAA; margin: 0; font-size: 12px;">© 2025 مشكاة - جميع الحقوق محفوظة</p>
                </div>
              </div>
            `;
            const emailInfo = await mailService.sendMail(
              email,
              emailSubject,
              `تم الرد على سؤالك في مخيم "${camp_name}"`,
              emailHtml
            );
            console.log(
              `[Q&A Answer] ✅ Email sent successfully! MessageId: ${emailInfo.messageId}`
            );
          } catch (emailError) {
            console.error(`[Q&A Answer] ❌ Email error for user ${user_id}:`, {
              message: emailError.message,
              code: emailError.code,
              stack: emailError.stack,
            });
            // Continue even if email fails
          }
        } else {
          console.log(
            `[Q&A Answer] ⏭️  Skipping email: shouldSend=${shouldSend}, email=${
              email ? "exists" : "missing"
            }`
          );
        }
      } else {
        console.error(
          `[Q&A Answer] ❌❌❌ CRITICAL: questionData.length is 0! No question data found!`
        );
        console.error(`[Q&A Answer] questionId: ${questionId}`);
        console.error(
          `[Q&A Answer] This means the query did not return any results.`
        );
        console.error(`[Q&A Answer] Possible reasons:`);
        console.error(`[Q&A Answer] 1. Question does not exist`);
        console.error(`[Q&A Answer] 2. Question was deleted`);
        console.error(`[Q&A Answer] 3. JOIN failed (camp or user not found)`);
      }
    } catch (notifError) {
      console.error(`[Q&A Answer] ❌❌❌ Fatal error creating notification:`, {
        message: notifError.message,
        code: notifError.code,
        errno: notifError.errno,
        sqlState: notifError.sqlState,
        sqlMessage: notifError.sqlMessage,
        stack: notifError.stack,
      });
      // Don't fail the response if notification fails
    }

    res.json({ success: true, message: "تمت إضافة إجابتك بنجاح" });
  } catch (error) {
    console.error("Error answering camp question:", error);
    res
      .status(500)
      .json({ success: false, message: "حدث خطأ أثناء إضافة الإجابة" });
  }
};

// Delete a question (admin or original author)
const deleteCampQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user.id;

    // Admin can delete any question, user can only delete their own
    const whereClause =
      req.user.role === "admin"
        ? "WHERE id = ?"
        : "WHERE id = ? AND user_id = ?";
    const params =
      req.user.role === "admin" ? [questionId] : [questionId, userId];

    const [result] = await db.query(
      `DELETE FROM camp_qanda ${whereClause}`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "السؤال غير موجود أو لا تملك صلاحية حذفه",
      });
    }

    res.json({ success: true, message: "تم حذف السؤال بنجاح" });
  } catch (error) {
    console.error("Error deleting camp question:", error);
    res
      .status(500)
      .json({ success: false, message: "حدث خطأ أثناء حذف السؤال" });
  }
};

// ==================== Task Groups APIs ====================

// Create a new task group
const createTaskGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, parent_group_id, order_in_camp, unlock_date } =
      req.body;

    // Verify camp exists
    const [camp] = await db.query("SELECT id FROM quran_camps WHERE id = ?", [
      id,
    ]);

    if (camp.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    // If parent_group_id is provided, verify it exists and belongs to the same camp
    if (parent_group_id) {
      const [parentGroup] = await db.query(
        "SELECT id FROM camp_task_groups WHERE id = ? AND camp_id = ?",
        [parent_group_id, id]
      );

      if (parentGroup.length === 0) {
        return res.status(400).json({
          success: false,
          message: "المجموعة الأم غير موجودة أو لا تنتمي لهذا المخيم",
        });
      }
    }

    // Validate unlock_date format if provided
    let unlockDateValue = null;
    if (unlock_date) {
      unlockDateValue = new Date(unlock_date);
      if (isNaN(unlockDateValue.getTime())) {
        return res.status(400).json({
          success: false,
          message: "تنسيق تاريخ الفتح غير صحيح",
        });
      }
    }

    const [result] = await db.query(
      `
      INSERT INTO camp_task_groups (camp_id, title, description, parent_group_id, order_in_camp, unlock_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        title,
        description || null,
        parent_group_id || null,
        order_in_camp || 0,
        unlockDateValue,
      ]
    );

    res.json({
      success: true,
      message: "تم إنشاء المجموعة بنجاح",
      data: { groupId: result.insertId },
    });
  } catch (error) {
    console.error("Error creating task group:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إنشاء المجموعة",
    });
  }
};

// Update a task group
const updateTaskGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { title, description, parent_group_id, order_in_camp, unlock_date } =
      req.body;

    // Get current group to verify it exists and get camp_id
    const [currentGroup] = await db.query(
      "SELECT camp_id FROM camp_task_groups WHERE id = ?",
      [groupId]
    );

    if (currentGroup.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المجموعة غير موجودة",
      });
    }

    const campId = currentGroup[0].camp_id;

    // If parent_group_id is provided, verify it exists and belongs to the same camp
    // Also prevent setting a group as its own parent
    if (parent_group_id) {
      if (parseInt(parent_group_id) === parseInt(groupId)) {
        return res.status(400).json({
          success: false,
          message: "لا يمكن تعيين المجموعة كأم لنفسها",
        });
      }

      const [parentGroup] = await db.query(
        "SELECT id FROM camp_task_groups WHERE id = ? AND camp_id = ?",
        [parent_group_id, campId]
      );

      if (parentGroup.length === 0) {
        return res.status(400).json({
          success: false,
          message: "المجموعة الأم غير موجودة أو لا تنتمي لهذا المخيم",
        });
      }
    }

    const updateFields = [];
    const values = [];

    if (title !== undefined) {
      updateFields.push("title = ?");
      values.push(title);
    }
    if (description !== undefined) {
      updateFields.push("description = ?");
      values.push(description);
    }
    if (parent_group_id !== undefined) {
      updateFields.push("parent_group_id = ?");
      values.push(parent_group_id);
    }
    if (order_in_camp !== undefined) {
      updateFields.push("order_in_camp = ?");
      values.push(order_in_camp);
    }
    if (unlock_date !== undefined) {
      // Validate unlock_date format if provided
      let unlockDateValue = null;
      if (unlock_date !== null && unlock_date !== "") {
        unlockDateValue = new Date(unlock_date);
        if (isNaN(unlockDateValue.getTime())) {
          return res.status(400).json({
            success: false,
            message: "تنسيق تاريخ الفتح غير صحيح",
          });
        }
      }
      updateFields.push("unlock_date = ?");
      values.push(unlockDateValue);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "لا توجد بيانات للتحديث",
      });
    }

    values.push(groupId);

    await db.query(
      `UPDATE camp_task_groups SET ${updateFields.join(", ")} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: "تم تحديث المجموعة بنجاح",
    });
  } catch (error) {
    console.error("Error updating task group:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديث المجموعة",
    });
  }
};

// Delete a task group
const deleteTaskGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check if group exists
    const [group] = await db.query(
      "SELECT id FROM camp_task_groups WHERE id = ?",
      [groupId]
    );

    if (group.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المجموعة غير موجودة",
      });
    }

    // Delete the group (CASCADE will handle child groups and SET NULL will handle tasks)
    await db.query("DELETE FROM camp_task_groups WHERE id = ?", [groupId]);

    res.json({
      success: true,
      message: "تم حذف المجموعة بنجاح",
    });
  } catch (error) {
    console.error("Error deleting task group:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في حذف المجموعة",
    });
  }
};

// Get all task groups for a camp
const getCampTaskGroups = async (req, res) => {
  try {
    const { id } = req.params;

    const [groups] = await db.query(
      `
      SELECT 
        ctg.*,
        COUNT(cdt.id) as tasks_count
      FROM camp_task_groups ctg
      LEFT JOIN camp_daily_tasks cdt ON ctg.id = cdt.group_id
      WHERE ctg.camp_id = ?
      GROUP BY ctg.id
      ORDER BY ctg.order_in_camp, ctg.created_at
    `,
      [id]
    );

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("Error fetching task groups:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب المجموعات",
    });
  }
};

// Search Hadith for Autocomplete (for Rich Text Editor Slash Commands)
// يستخدم نفس الـ logic الموجود في search.js
const searchHadithForAutocomplete = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const searchTerm = q.trim();

    // Create form data
    const formData = new URLSearchParams();
    formData.append("term", searchTerm);
    formData.append("trans", "ar");

    // Fetch from external API
    const externalRes = await axios.post(
      "https://hadeethenc.com/en/ajax/search",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Parse HTML response using JSDOM
    const dom = new JSDOM(externalRes.data);
    const document = dom.window.document;

    // Extract hadith IDs
    const hadithDivs = Array.from(
      document.querySelectorAll("div.rtl.text-right")
    );
    const hadithIds = hadithDivs
      .map((div) => {
        const a = div.querySelector("a[href]");
        if (a && a.getAttribute("href")) {
          const match = a.getAttribute("href").match(/\/hadith\/(\d+)/);
          return match ? match[1] : null;
        }
        return null;
      })
      .filter(Boolean);

    if (hadithIds.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Limit to first 10 results for autocomplete
    const limitedIds = hadithIds.slice(0, 10);

    // دالة لاستخراج نص الحديث فقط (بعد علامة <<)
    const extractHadithText = (fullText) => {
      if (!fullText) return fullText;

      // البحث عن النص بعد علامة << (حتى نهاية النص أو حتى علامة >>)
      const afterAngleBracketMatch = fullText.match(/<<(.+?)(?:>>|$)/);
      if (afterAngleBracketMatch && afterAngleBracketMatch[1]) {
        return afterAngleBracketMatch[1].trim();
      }

      // إذا لم يتم العثور على <<، نعيد النص الأصلي
      return fullText.trim();
    };

    // Fetch hadiths for limited IDs - جلب جميع الأحاديث بشكل متوازي (parallel) بدلاً من متسلسل
    const hadithPromises = limitedIds.map(async (id) => {
      try {
        const response = await axios.get(
          `https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${id}`,
          {
            timeout: 5000, // timeout 5 ثوانٍ لكل request
          }
        );
        if (response.data) {
          // Format the response to match expected format: {id, text}
          // The API response structure contains 'hadeeth' field for Arabic text
          const hadithData = response.data;
          let hadithText = hadithData.hadeeth || "";

          // استخراج نص الحديث فقط (بعد علامة <<)
          hadithText = extractHadithText(hadithText);

          if (hadithText) {
            return {
              id: hadithData.id || id,
              text: hadithText,
            };
          }
        }
        return null;
      } catch (error) {
        console.error(`Error fetching hadith ID ${id}:`, error.message);
        return null;
      }
    });

    // جلب جميع الأحاديث بشكل متوازي
    const hadithResults = await Promise.all(hadithPromises);
    // تصفية النتائج الفارغة
    const hadiths = hadithResults.filter((hadith) => hadith !== null);

    res.json({
      success: true,
      data: hadiths,
    });
  } catch (error) {
    console.error("Error searching hadiths for autocomplete:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في البحث",
    });
  }
};

// ==================== Templates System (Admin) ====================

// Get all camp templates
const getCampTemplates = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM quran_camps WHERE is_template = 1 ORDER BY updated_at DESC, id DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ success: false, message: "حدث خطأ في جلب القوالب" });
  }
};

// Save camp as a new template (duplicate, do NOT change original)
const saveCampAsTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch original camp
    const [origRows] = await db.query(
      `SELECT * FROM quran_camps WHERE id = ?`,
      [id]
    );
    if (origRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "المخيم غير موجود" });
    }
    const orig = origRows[0];

    await db.query("START TRANSACTION");
    try {
      const share_link = shortid.generate();

      // Insert new camp as template copy
      const [insertCamp] = await db.query(
        `INSERT INTO quran_camps (
            name, description, surah_number, surah_name, start_date, duration_days, banner_image,
            opening_surah_number, opening_surah_name, opening_youtube_url, share_link, status, is_template
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          `${orig.name} (قالب)`,
          orig.description || null,
          orig.surah_number || null,
          orig.surah_name || null,
          orig.start_date || new Date(),
          orig.duration_days || 0,
          orig.banner_image || null,
          orig.opening_surah_number || null,
          orig.opening_surah_name || null,
          orig.opening_youtube_url || null,
          share_link,
          orig.status || "early_registration",
        ]
      );
      const templateCampId = insertCamp.insertId;

      // Clone task groups from original
      const [groups] = await db.query(
        `SELECT * FROM camp_task_groups WHERE camp_id = ? ORDER BY COALESCE(parent_group_id, 0), order_in_camp, id`,
        [id]
      );
      const oldToNewGroupId = new Map();

      // First pass: root groups
      for (const grp of groups) {
        if (grp.parent_group_id != null) continue;
        const [resGrp] = await db.query(
          `INSERT INTO camp_task_groups (camp_id, title, description, parent_group_id, order_in_camp, unlock_date)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            templateCampId,
            grp.title,
            grp.description || null,
            null,
            grp.order_in_camp || 0,
            grp.unlock_date || null,
          ]
        );
        oldToNewGroupId.set(grp.id, resGrp.insertId);
      }

      // Handle nested groups
      let remaining = groups.filter((g) => g.parent_group_id != null);
      let safety = 0;
      while (remaining.length > 0 && safety < 50) {
        const nextRound = [];
        for (const grp of remaining) {
          const newParentId = oldToNewGroupId.get(grp.parent_group_id);
          if (!newParentId) {
            nextRound.push(grp);
            continue;
          }
          const [resGrp] = await db.query(
            `INSERT INTO camp_task_groups (camp_id, title, description, parent_group_id, order_in_camp, unlock_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              templateCampId,
              grp.title,
              grp.description || null,
              newParentId,
              grp.order_in_camp || 0,
              grp.unlock_date || null,
            ]
          );
          oldToNewGroupId.set(grp.id, resGrp.insertId);
        }
        remaining = nextRound;
        safety += 1;
      }

      // Clone tasks
      const [tasks] = await db.query(
        `SELECT * FROM camp_daily_tasks WHERE camp_id = ? ORDER BY day_number, COALESCE(order_in_group, order_in_day), id`,
        [id]
      );
      for (const t of tasks) {
        const mappedGroupId = t.group_id
          ? oldToNewGroupId.get(t.group_id) || null
          : null;
        await db.query(
          `INSERT INTO camp_daily_tasks (
            camp_id, day_number, task_type, title, description,
            verses_from, verses_to, tafseer_link, youtube_link,
            order_in_day, is_optional, points, estimated_time, group_id, order_in_group
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            templateCampId,
            t.day_number,
            t.task_type,
            t.title,
            t.description || null,
            t.verses_from || null,
            t.verses_to || null,
            t.tafseer_link || null,
            t.youtube_link || null,
            t.order_in_day || null,
            t.is_optional ? 1 : 0,
            t.points || 3,
            t.estimated_time || 30,
            mappedGroupId,
            t.order_in_group || null,
          ]
        );
      }

      await db.query("COMMIT");
      return res.json({
        success: true,
        message: "تم حفظ نسخة قالب من المخيم بنجاح",
        templateCampId,
      });
    } catch (inner) {
      await db.query("ROLLBACK");
      throw inner;
    }
  } catch (error) {
    console.error("Error saving camp as template:", error);
    res.status(500).json({ success: false, message: "حدث خطأ" });
  }
};

// Create a new camp by cloning a template
const createCampFromTemplate = async (req, res) => {
  const { templateId, newCampName } = req.body;
  if (!templateId || !newCampName) {
    return res
      .status(400)
      .json({ success: false, message: "templateId و newCampName مطلوبان" });
  }

  try {
    // Fetch template camp
    const [tmplRows] = await db.query(
      `SELECT * FROM quran_camps WHERE id = ? AND is_template = 1`,
      [templateId]
    );
    if (tmplRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "القالب غير موجود" });
    }
    const templateCamp = tmplRows[0];

    await db.query("START TRANSACTION");
    try {
      const share_link = shortid.generate();
      // Insert new camp (copy selective fields, override name/status/start_date/is_template)
      const [insertCamp] = await db.query(
        `INSERT INTO quran_camps (
            name, description, surah_number, surah_name, start_date, duration_days, banner_image,
            opening_surah_number, opening_surah_name, opening_youtube_url, share_link, status, is_template
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          newCampName,
          templateCamp.description || null,
          templateCamp.surah_number || null,
          templateCamp.surah_name || null,
          new Date(),
          templateCamp.duration_days || 0,
          templateCamp.banner_image || null,
          templateCamp.opening_surah_number || null,
          templateCamp.opening_surah_name || null,
          templateCamp.opening_youtube_url || null,
          share_link,
          "early_registration",
        ]
      );
      const newCampId = insertCamp.insertId;

      // Clone task groups
      const [groups] = await db.query(
        `SELECT * FROM camp_task_groups WHERE camp_id = ? ORDER BY COALESCE(parent_group_id, 0), order_in_camp, id`,
        [templateId]
      );
      const oldToNewGroupId = new Map();

      // First pass: create groups with null parent first
      for (const grp of groups) {
        if (grp.parent_group_id != null) continue;
        const [resGrp] = await db.query(
          `INSERT INTO camp_task_groups (camp_id, title, description, parent_group_id, order_in_camp, unlock_date)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            newCampId,
            grp.title,
            grp.description || null,
            null,
            grp.order_in_camp || 0,
            grp.unlock_date || null,
          ]
        );
        oldToNewGroupId.set(grp.id, resGrp.insertId);
      }

      // Subsequent passes until all groups are created (handles nested parents)
      let remaining = groups.filter((g) => g.parent_group_id != null);
      let safety = 0;
      while (remaining.length > 0 && safety < 50) {
        const nextRound = [];
        for (const grp of remaining) {
          const newParentId = oldToNewGroupId.get(grp.parent_group_id);
          if (!newParentId) {
            nextRound.push(grp);
            continue;
          }
          const [resGrp] = await db.query(
            `INSERT INTO camp_task_groups (camp_id, title, description, parent_group_id, order_in_camp, unlock_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              newCampId,
              grp.title,
              grp.description || null,
              newParentId,
              grp.order_in_camp || 0,
              grp.unlock_date || null,
            ]
          );
          oldToNewGroupId.set(grp.id, resGrp.insertId);
        }
        remaining = nextRound;
        safety += 1;
      }

      // Clone daily tasks
      const [tasks] = await db.query(
        `SELECT * FROM camp_daily_tasks WHERE camp_id = ? ORDER BY day_number, COALESCE(order_in_group, order_in_day), id`,
        [templateId]
      );
      for (const t of tasks) {
        const mappedGroupId = t.group_id
          ? oldToNewGroupId.get(t.group_id) || null
          : null;
        await db.query(
          `INSERT INTO camp_daily_tasks (
            camp_id, day_number, task_type, title, description,
            verses_from, verses_to, tafseer_link, youtube_link,
            order_in_day, is_optional, points, estimated_time, group_id, order_in_group
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newCampId,
            t.day_number,
            t.task_type,
            t.title,
            t.description || null,
            t.verses_from || null,
            t.verses_to || null,
            t.tafseer_link || null,
            t.youtube_link || null,
            t.order_in_day || null,
            t.is_optional ? 1 : 0,
            t.points || 3,
            t.estimated_time || 30,
            mappedGroupId,
            t.order_in_group || null,
          ]
        );
      }

      await db.query("COMMIT");
      return res.json({
        success: true,
        message: "تم نسخ المخيم بنجاح!",
        newCampId,
      });
    } catch (inner) {
      await db.query("ROLLBACK");
      throw inner;
    }
  } catch (error) {
    console.error("Error creating camp from template:", error);
    return res
      .status(500)
      .json({ success: false, message: "حدث خطأ في إنشاء المخيم" });
  }
};

// Share benefit (make it public in study hall)
const shareBenefit = async (req, res) => {
  try {
    const { benefitId } = req.params;
    const userId = req.user.id;

    // Get the benefit and verify ownership
    const [progress] = await db.query(
      `
      SELECT ctp.*, ce.user_id, ce.camp_id, qc.status as camp_status
      FROM camp_task_progress ctp
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN quran_camps qc ON ce.camp_id = qc.id
      WHERE ctp.id = ?
    `,
      [benefitId]
    );

    if (progress.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفائدة غير موجودة",
      });
    }

    // Check if user owns this benefit
    if (progress[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بمشاركة هذه الفائدة",
      });
    }

    // Check if camp is completed
    if (progress[0].camp_status === "completed") {
      return res.status(403).json({
        success: false,
        message: "لا يمكن مشاركة محتوى المخيمات المنتهية",
      });
    }

    // Update is_private to false
    await db.query(
      `
      UPDATE camp_task_progress
      SET is_private = false
      WHERE id = ?
    `,
      [benefitId]
    );

    // تسجيل نشاط مشاركة التدبر
    try {
      // جلب معلومات المهمة
      const [taskInfo] = await db.query(
        `SELECT cdt.title, cdt.day_number, cdt.id as task_id
         FROM camp_task_progress ctp
         JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
         WHERE ctp.id = ?`,
        [benefitId]
      );

      if (taskInfo.length > 0) {
        const details = JSON.stringify({
          reflection_id: benefitId,
          task_name: taskInfo[0].title,
          day: taskInfo[0].day_number || null,
          task_id: taskInfo[0].task_id,
        });
        await db.query(
          `INSERT INTO user_activity (user_id, camp_id, activity_type, details)
           VALUES (?, ?, 'reflection_shared', ?)`,
          [userId, progress[0].camp_id, details]
        );
      }
    } catch (activityError) {
      console.error("Error logging reflection share activity:", activityError);
      // لا نوقف العملية إذا فشل تسجيل النشاط
    }

    res.json({
      success: true,
      message: "تمت مشاركة الفائدة بنجاح",
    });
  } catch (error) {
    console.error("Error sharing benefit:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في مشاركة الفائدة",
    });
  }
};

// ==================== Curriculum Map APIs (Axis-based) ====================

// Get curriculum map for a camp (shows all axes with their status)
const getCurriculumMap = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "يجب تسجيل الدخول",
      });
    }

    // Check if user is enrolled and get camp details
    const [enrollments] = await db.query(
      `
      SELECT 
        ce.id,
        ce.enrollment_date,
        qc.start_date as camp_start_date,
        qc.duration_days
      FROM camp_enrollments ce
      JOIN quran_camps qc ON ce.camp_id = qc.id
      WHERE ce.user_id = ? AND ce.camp_id = ?
    `,
      [userId, id]
    );

    if (enrollments.length === 0) {
      return res.status(403).json({
        success: false,
        message: "لم يتم التسجيل في هذا المخيم",
      });
    }

    const enrollment = enrollments[0];
    const now = new Date();

    // Get all task groups (axes) for this camp, ordered by sort_order
    const [groups] = await db.query(
      `
      SELECT 
        ctg.id,
        ctg.title,
        ctg.description,
        ctg.order_in_camp as sort_order,
        ctg.unlock_date,
        COUNT(cdt.id) as tasks_count
      FROM camp_task_groups ctg
      LEFT JOIN camp_daily_tasks cdt ON ctg.id = cdt.group_id
      WHERE ctg.camp_id = ? AND ctg.parent_group_id IS NULL
      GROUP BY ctg.id
      ORDER BY COALESCE(ctg.order_in_camp, 999999), ctg.id
    `,
      [id]
    );

    // Get user's progress for all tasks in these groups
    const groupIds = groups.map((g) => g.id);
    let userProgress = [];
    if (groupIds.length > 0) {
      const placeholders = groupIds.map(() => "?").join(",");
      const [progress] = await db.query(
        `
        SELECT 
          cdt.group_id,
          cdt.id as task_id,
          ctp.completed
        FROM camp_daily_tasks cdt
        LEFT JOIN camp_task_progress ctp ON cdt.id = ctp.task_id 
          AND ctp.enrollment_id = ?
        WHERE cdt.camp_id = ? AND cdt.group_id IN (${placeholders})
      `,
        [enrollment.id, id, ...groupIds]
      );
      userProgress = progress;
    }

    // Calculate status for each group
    const axes = groups.map((group) => {
      // Calculate unlock date (use unlock_date if exists, otherwise calculate from camp start_date)
      let unlockDate = null;
      if (group.unlock_date) {
        unlockDate = new Date(group.unlock_date);
      } else if (enrollment.camp_start_date) {
        // Fallback: calculate based on sort_order (assuming 1 axis per day)
        const startDate = new Date(enrollment.camp_start_date);
        startDate.setDate(startDate.getDate() + (group.sort_order - 1));
        unlockDate = startDate;
      }

      // Determine status
      let status = "locked";
      if (unlockDate) {
        unlockDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (today >= unlockDate) {
          // Check if all tasks are completed
          const groupTasks = userProgress.filter(
            (p) => p.group_id === group.id
          );
          const completedTasks = groupTasks.filter((t) => t.completed === 1);
          if (
            groupTasks.length > 0 &&
            completedTasks.length === groupTasks.length
          ) {
            status = "completed";
          } else {
            status = "active";
          }
        }
      } else {
        // If no unlock_date, consider it active for now (backward compatibility)
        status = "active";
      }

      return {
        id: group.id,
        title: group.title,
        description: group.description,
        unlock_date: unlockDate ? unlockDate.toISOString() : null,
        tasks_count: group.tasks_count || 0,
        status: status,
      };
    });

    res.json({
      success: true,
      data: axes,
    });
  } catch (error) {
    console.error("Error fetching curriculum map:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب خريطة المنهج",
    });
  }
};

// Get axis content (councils and tasks) - New API
const getAxisContent = async (req, res) => {
  try {
    const { axisId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "يجب تسجيل الدخول",
      });
    }

    // Get the task group (axis) and verify it's a main axis (parent_group_id is null)
    const [groups] = await db.query(
      `
      SELECT 
        ctg.*,
        qc.start_date as camp_start_date,
        qc.id as camp_id
      FROM camp_task_groups ctg
      JOIN quran_camps qc ON ctg.camp_id = qc.id
      WHERE ctg.id = ? AND ctg.parent_group_id IS NULL
    `,
      [axisId]
    );

    if (groups.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المحور غير موجود أو ليس محوراً رئيسياً",
      });
    }

    const axis = groups[0];

    // Check if user is enrolled
    const [enrollments] = await db.query(
      `
      SELECT id
      FROM camp_enrollments
      WHERE user_id = ? AND camp_id = ?
    `,
      [userId, axis.camp_id]
    );

    if (enrollments.length === 0) {
      return res.status(403).json({
        success: false,
        message: "لم يتم التسجيل في هذا المخيم",
      });
    }

    // Check if axis is unlocked
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let unlockDate = null;
    if (axis.unlock_date) {
      unlockDate = new Date(axis.unlock_date);
    } else if (axis.camp_start_date) {
      const startDate = new Date(axis.camp_start_date);
      startDate.setDate(startDate.getDate() + (axis.order_in_camp - 1));
      unlockDate = startDate;
    }

    if (unlockDate) {
      unlockDate.setHours(0, 0, 0, 0);
      if (now < unlockDate) {
        return res.status(403).json({
          success: false,
          message: "هذا المحور غير متاح حالياً",
          unlock_date: unlockDate.toISOString(),
        });
      }
    }

    // Get all councils (sub-groups) for this axis
    const [councils] = await db.query(
      `
      SELECT 
        ctg.id,
        ctg.title,
        ctg.description,
        ctg.order_in_camp,
        COUNT(cdt.id) as tasks_count
      FROM camp_task_groups ctg
      LEFT JOIN camp_daily_tasks cdt ON ctg.id = cdt.group_id
      WHERE ctg.parent_group_id = ?
      GROUP BY ctg.id
      ORDER BY COALESCE(ctg.order_in_camp, 999999), ctg.id
    `,
      [axisId]
    );

    // Get all tasks for this axis (directly linked to axis) and tasks linked to councils
    const councilIds = councils.map((c) => c.id);
    const allGroupIds = [axisId, ...councilIds];

    let tasksQuery = "";
    let queryParams = [];
    if (allGroupIds.length > 0) {
      const placeholders = allGroupIds.map(() => "?").join(",");
      tasksQuery = `
        SELECT 
          cdt.*,
          cdt.group_id,
          CASE 
            WHEN cdt.task_type = 'reading' THEN 'قراءة'
            WHEN cdt.task_type = 'memorization' THEN 'حفظ'
            WHEN cdt.task_type = 'prayer' THEN 'صلاة'
            WHEN cdt.task_type = 'tafseer_tabari' THEN 'تفسير الطبري'
            WHEN cdt.task_type = 'tafseer_kathir' THEN 'تفسير ابن كثير'
            WHEN cdt.task_type = 'youtube' THEN 'فيديو'
            WHEN cdt.task_type = 'journal' THEN 'يوميات'
          END as task_type_ar,
          COALESCE(completion_counts.completed_by_count, 0) as completed_by_count
        FROM camp_daily_tasks cdt
        LEFT JOIN (
          SELECT 
            task_id,
            COUNT(*) as completed_by_count
          FROM camp_task_progress
          WHERE completed = true
          GROUP BY task_id
        ) completion_counts ON cdt.id = completion_counts.task_id
        WHERE cdt.group_id IN (${placeholders})
        ORDER BY cdt.group_id, COALESCE(cdt.order_in_group, cdt.order_in_day, 999999)
      `;
      queryParams = allGroupIds;
    }

    let tasks = [];
    if (tasksQuery) {
      const [tasksResult] = await db.query(tasksQuery, queryParams);
      tasks = tasksResult;
    }

    // Get user's progress for these tasks
    const taskIds = tasks.map((t) => t.id);
    let userProgress = [];
    if (taskIds.length > 0) {
      const placeholders = taskIds.map(() => "?").join(",");
      const [progress] = await db.query(
        `
        SELECT 
          task_id,
          completed,
          journal_entry,
          notes,
          completed_at
        FROM camp_task_progress
        WHERE enrollment_id = ? AND task_id IN (${placeholders})
      `,
        [enrollments[0].id, ...taskIds]
      );
      userProgress = progress;
    }

    // Merge progress with tasks
    const tasksWithProgress = tasks.map((task) => {
      const progress = userProgress.find((p) => p.task_id === task.id);
      return {
        ...task,
        completed: progress ? progress.completed === 1 : false,
        journal_entry: progress?.journal_entry || null,
        notes: progress?.notes || null,
        completed_at: progress?.completed_at || null,
      };
    });

    // Organize tasks by council (group)
    const councilsWithTasks = councils.map((council) => {
      const councilTasks = tasksWithProgress.filter(
        (task) => task.group_id === council.id
      );
      return {
        id: council.id,
        title: council.title,
        description: council.description,
        order_in_camp: council.order_in_camp,
        tasks: councilTasks,
      };
    });

    // Also include tasks directly linked to axis (if any)
    const axisTasks = tasksWithProgress.filter(
      (task) => task.group_id === axisId
    );

    res.json({
      success: true,
      data: {
        axis: {
          id: axis.id,
          title: axis.title,
          description: axis.description,
        },
        councils: councilsWithTasks,
        direct_tasks: axisTasks, // Tasks directly linked to axis (not in a council)
      },
    });
  } catch (error) {
    console.error("Error fetching axis content:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب محتوى المحور",
    });
  }
};

// Get tasks for a specific axis (legacy - kept for backward compatibility)
const getTasksForAxis = async (req, res) => {
  try {
    const { axisId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "يجب تسجيل الدخول",
      });
    }

    // Get the task group (axis)
    const [groups] = await db.query(
      `
      SELECT 
        ctg.*,
        qc.start_date as camp_start_date
      FROM camp_task_groups ctg
      JOIN quran_camps qc ON ctg.camp_id = qc.id
      WHERE ctg.id = ?
    `,
      [axisId]
    );

    if (groups.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المحور غير موجود",
      });
    }

    const group = groups[0];

    // Check if user is enrolled
    const [enrollments] = await db.query(
      `
      SELECT id
      FROM camp_enrollments
      WHERE user_id = ? AND camp_id = ?
    `,
      [userId, group.camp_id]
    );

    if (enrollments.length === 0) {
      return res.status(403).json({
        success: false,
        message: "لم يتم التسجيل في هذا المخيم",
      });
    }

    // Check if axis is unlocked
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let unlockDate = null;
    if (group.unlock_date) {
      unlockDate = new Date(group.unlock_date);
    } else if (group.camp_start_date) {
      const startDate = new Date(group.camp_start_date);
      startDate.setDate(startDate.getDate() + (group.order_in_camp - 1));
      unlockDate = startDate;
    }

    if (unlockDate) {
      unlockDate.setHours(0, 0, 0, 0);
      if (now < unlockDate) {
        return res.status(403).json({
          success: false,
          message: "هذا المحور غير متاح حالياً",
          unlock_date: unlockDate.toISOString(),
        });
      }
    }

    // Get all tasks for this axis
    const [tasks] = await db.query(
      `
      SELECT 
        cdt.*,
        CASE 
          WHEN cdt.task_type = 'reading' THEN 'قراءة'
          WHEN cdt.task_type = 'memorization' THEN 'حفظ'
          WHEN cdt.task_type = 'prayer' THEN 'صلاة'
          WHEN cdt.task_type = 'tafseer_tabari' THEN 'تفسير الطبري'
          WHEN cdt.task_type = 'tafseer_kathir' THEN 'تفسير ابن كثير'
          WHEN cdt.task_type = 'youtube' THEN 'فيديو'
          WHEN cdt.task_type = 'journal' THEN 'يوميات'
        END as task_type_ar,
        COALESCE(completion_counts.completed_by_count, 0) as completed_by_count
      FROM camp_daily_tasks cdt
      LEFT JOIN (
        SELECT 
          task_id,
          COUNT(*) as completed_by_count
        FROM camp_task_progress
        WHERE completed = true
        GROUP BY task_id
      ) completion_counts ON cdt.id = completion_counts.task_id
      WHERE cdt.group_id = ?
      ORDER BY COALESCE(cdt.order_in_group, cdt.order_in_day, 999999)
    `,
      [axisId]
    );

    // Get user's progress for these tasks
    const taskIds = tasks.map((t) => t.id);
    let userProgress = [];
    if (taskIds.length > 0) {
      const placeholders = taskIds.map(() => "?").join(",");
      const [progress] = await db.query(
        `
        SELECT 
          task_id,
          completed,
          journal_entry,
          notes,
          completed_at
        FROM camp_task_progress
        WHERE enrollment_id = ? AND task_id IN (${placeholders})
      `,
        [enrollments[0].id, ...taskIds]
      );
      userProgress = progress;
    }

    // Merge progress with tasks
    const tasksWithProgress = tasks.map((task) => {
      const progress = userProgress.find((p) => p.task_id === task.id);
      return {
        ...task,
        completed: progress ? progress.completed === 1 : false,
        journal_entry: progress?.journal_entry || null,
        notes: progress?.notes || null,
        completed_at: progress?.completed_at || null,
      };
    });

    res.json({
      success: true,
      data: {
        axis: {
          id: group.id,
          title: group.title,
          description: group.description,
        },
        tasks: tasksWithProgress,
      },
    });
  } catch (error) {
    console.error("Error fetching tasks for axis:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب مهام المحور",
    });
  }
};

// Pledge to a joint step (commit to a proposed step)
const pledgeToJointStep = async (req, res) => {
  try {
    const { progressId } = req.params;
    const userId = req.user.id;

    // Get the progress record to verify it exists and get related data
    const [progressRecords] = await db.query(
      `
      SELECT 
        ctp.id,
        ctp.proposed_step,
        ctp.notes,
        ctp.enrollment_id,
        ce.user_id as inspirer_user_id,
        ce.camp_id,
        cdt.title as task_title
      FROM camp_task_progress ctp
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      WHERE ctp.id = ?
    `,
      [progressId]
    );

    if (progressRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفائدة غير موجودة",
      });
    }

    const progressRecord = progressRecords[0];

    // Check if proposed_step exists
    if (!progressRecord.proposed_step || !progressRecord.proposed_step.trim()) {
      return res.status(400).json({
        success: false,
        message: "لا توجد خطوة عملية مقترحة في هذه الفائدة",
      });
    }

    // Check if user is enrolled in the camp
    const [userEnrollments] = await db.query(
      `SELECT id FROM camp_enrollments WHERE user_id = ? AND camp_id = ?`,
      [userId, progressRecord.camp_id]
    );

    if (userEnrollments.length === 0) {
      return res.status(403).json({
        success: false,
        message: "يجب أن تكون مسجلاً في هذا المخيم للالتزام بالخطوة",
      });
    }

    // Check if user has already pledged to this step
    const [existingPledge] = await db.query(
      `SELECT id FROM joint_step_pledges WHERE progress_id = ? AND pledger_user_id = ?`,
      [progressId, userId]
    );

    if (existingPledge.length > 0) {
      return res.status(400).json({
        success: false,
        message: "لقد التزمت بهذه الخطوة من قبل",
      });
    }

    // Prevent users from pledging to their own step
    if (progressRecord.inspirer_user_id === userId) {
      return res.status(400).json({
        success: false,
        message: "لا يمكنك الالتزام بخطوتك الخاصة",
      });
    }

    // Insert the pledge
    await db.query(
      `INSERT INTO joint_step_pledges (progress_id, pledger_user_id, created_at) VALUES (?, ?, NOW())`,
      [progressId, userId]
    );

    // Create activity log
    const activityDetails = JSON.stringify({
      proposed_step: progressRecord.proposed_step,
      benefit_text: progressRecord.notes || "",
      inspirer_user_id: progressRecord.inspirer_user_id,
      task_title: progressRecord.task_title,
      progress_id: progressId,
    });

    await db.query(
      `INSERT INTO user_activity (user_id, camp_id, activity_type, details, created_at) VALUES (?, ?, 'joint_step_pledged', ?, NOW())`,
      [userId, progressRecord.camp_id, activityDetails]
    );

    // Send notification to the inspirer (person who proposed the step)
    const CampNotificationService = require("../services/campNotificationService");
    await CampNotificationService.sendJointStepNotification(
      userId, // pledger
      progressRecord.inspirer_user_id, // inspirer
      progressRecord.camp_id,
      progressRecord.proposed_step
    );

    res.json({
      success: true,
      message: "تم الالتزام بنجاح",
    });
  } catch (error) {
    console.error("Error pledging to joint step:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في الالتزام بالخطوة" + error.message,
    });
  }
};

module.exports = {
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
  notifyCampFinished,

  // Interactive Features
  toggleUpvoteReflection,
  toggleSaveReflection,
  getSavedReflections,
  deleteReflection,
  shareBenefit,
  searchHadithForAutocomplete,
  pledgeToJointStep,

  // Admin APIs
  createCamp,
  updateCamp,
  addDailyTasks,
  updateDailyTask,
  getAdminStats,
  getCampParticipants,
  getCampAnalytics,
  updateCampStatus,
  deleteCamp,
  getCampDetailsForAdmin,
  leaveCamp,
  getCampSettings,
  updateCampSettings,
  getAdminCampSettings,
  updateAdminCampSettings,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  // Streak functions
  calculateStreak,
  updateStreak,
  deleteCamp,
  // User management function
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
  // Curriculum Map (Axis-based)
  getCurriculumMap,
  getTasksForAxis,
  getAxisContent,
  // Templates System
  getCampTemplates,
  saveCampAsTemplate,
  createCampFromTemplate,
};
