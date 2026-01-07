const CampNotificationService = require("../services/campNotificationService");
const campUserService = require("../services/campUserService");
const campParticipantService = require("../services/campParticipantService");
const campAnalyticsService = require("../services/campAnalyticsService");
const campResourceService = require("../services/campResourceService");
const campQandAService = require("../services/campQandAService");
const campHelpService = require("../services/campHelpService");
const campSettingsService = require("../services/campSettingsService");
const campTaskService = require("../services/campTaskService");
const campManagementService = require("../services/campManagementService");
const campDetailsService = require("../services/campDetailsService");
const campProgressService = require("../services/campProgressService");
const campReflectionService = require("../services/campReflectionService");
const campTestService = require("../services/campTestService");
const {
  verifyAccess,
  isAdmin,
  hasSupervisorOrAdminAccess,
  isSupervisor,
} = require("../utils/permissionsHelper");
const db = require("../config/database");
const mailService = require("../services/mailService");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const shortid = require("shortid");
require("dotenv").config();
// Use puppeteer (with bundled Chromium) - this comes with Chromium built-in
// If puppeteer is not available, fallback to puppeteer-core

// ==================== HELPER FUNCTIONS ====================

/**
 * Get the current active cohort for a camp
 * Returns the cohort_number of the active cohort (early_registration or active status)
 * Falls back to the most recent cohort if no active one exists
 */
const getCurrentCohortNumber = async (campId) => {
  try {
    // First, try to get open cohort (is_open = 1)
    const [openCohorts] = await db.query(
      `SELECT cohort_number 
       FROM camp_cohorts 
       WHERE camp_id = ? 
         AND is_open = 1
       ORDER BY cohort_number DESC
       LIMIT 1`,
      [campId]
    );

    if (openCohorts.length > 0) {
      return openCohorts[0].cohort_number;
    }

    // Second, try to get active cohort (strict: only one active cohort allowed)
    const [activeCohorts] = await db.query(
      `SELECT cohort_number 
       FROM camp_cohorts 
       WHERE camp_id = ? 
         AND status = 'active'
       ORDER BY cohort_number DESC
       LIMIT 1`,
      [campId]
    );

    if (activeCohorts.length > 0) {
      // Verify only one active cohort exists (strict check)
      const [allActiveCohorts] = await db.query(
        `SELECT COUNT(*) as count FROM camp_cohorts 
         WHERE camp_id = ? AND status = 'active'`,
        [campId]
      );
      if (allActiveCohorts[0]?.count > 1) {
        console.warn(
          `Warning: Multiple active cohorts found for camp ${campId}. Using most recent.`
        );
      }
      return activeCohorts[0].cohort_number;
    }

    // Third, try to get early_registration cohort
    const [earlyRegCohorts] = await db.query(
      `SELECT cohort_number 
       FROM camp_cohorts 
       WHERE camp_id = ? 
         AND status = 'early_registration'
       ORDER BY cohort_number DESC
       LIMIT 1`,
      [campId]
    );

    if (earlyRegCohorts.length > 0) {
      return earlyRegCohorts[0].cohort_number;
    }

    // If no active cohort, get the most recent cohort
    const [recentCohorts] = await db.query(
      `SELECT cohort_number 
       FROM camp_cohorts 
       WHERE camp_id = ? 
       ORDER BY cohort_number DESC
       LIMIT 1`,
      [campId]
    );

    if (recentCohorts.length > 0) {
      return recentCohorts[0].cohort_number;
    }

    // Fallback to 1 if no cohorts exist
    return 1;
  } catch (error) {
    console.error("Error getting current cohort:", error);
    // Fallback: try to get from quran_camps table
    try {
      const [camps] = await db.query(
        `SELECT COALESCE(current_cohort_number, 1) as current_cohort_number 
         FROM quran_camps WHERE id = ?`,
        [campId]
      );
      return camps[0]?.current_cohort_number || 1;
    } catch (e) {
      return 1;
    }
  }
};

// ==================== USER APIs ====================

// Get all Quran camps
const getAllCamps = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user?.id || null;

    // Get basic camp info without dates (dates come from cohorts)
    let query = `
      SELECT 
        qc.id,
        qc.name,
        qc.description,
        qc.surah_number,
        qc.surah_name,
        qc.duration_days,
        qc.banner_image,
        qc.tags,
        qc.share_link,
        qc.created_at,
        qc.visibility_mode,
        qc.max_participants,
        qc.auto_start_camp,
        qc.is_template
      FROM quran_camps qc
    `;

    const params = [];
    const isAdmin = req.user?.role === "admin";

    // Hide templates from public listing
    query += ` WHERE qc.is_template = 0`;

    // Hide hidden camps from non-admins
    if (!isAdmin) {
      query += ` AND (qc.visibility_mode = 'public' OR qc.visibility_mode IS NULL)`;
    }

    if (status) {
      query += ` AND qc.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY qc.id DESC`;

    const [camps] = await db.query(query, params);

    // Process each camp to get ACTIVE cohort info
    const normalized = await Promise.all(
      camps.map(async (c) => {
        // Get current cohort number
        const currentCohortNumber = await getCurrentCohortNumber(c.id);

        // Get active cohort details (start_date, end_date)
        const [cohorts] = await db.query(
          `SELECT 
            DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
            DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
            status,
            is_open
           FROM camp_cohorts 
           WHERE camp_id = ? AND cohort_number = ?`,
          [c.id, currentCohortNumber]
        );

        const cohortData = cohorts[0] || null;

        // Helper function to translate status to Arabic
        const getStatusAr = (status) => {
          switch (status) {
            case "scheduled":
              return "قريباً";
            case "early_registration":
              return "قريباً";
            case "active":
              return "نشط";
            case "completed":
              return "منتهي";
            case "cancelled":
              return "ملغى";
            default:
              return status;
          }
        };

        // Use cohort status as camp status
        const cohortStatus = cohortData?.status || "completed";

        // Get enrollment count for ACTIVE cohort only (exclude supervisors)
        const [enrollCount] = await db.query(
          `SELECT COUNT(*) as count 
           FROM camp_enrollments ce
           WHERE ce.camp_id = ? AND ce.cohort_number = ?
           AND NOT EXISTS (
             SELECT 1 FROM camp_supervisors cs 
             WHERE cs.camp_id = ce.camp_id 
             AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
             AND cs.user_id = ce.user_id
           )`,
          [c.id, currentCohortNumber]
        );

        // Check if user is enrolled in current cohort
        let isEnrolled = 0;
        if (userId) {
          const [enrollment] = await db.query(
            `SELECT 1 FROM camp_enrollments 
             WHERE camp_id = ? AND user_id = ? AND cohort_number = ? 
             LIMIT 1`,
            [c.id, userId, currentCohortNumber]
          );
          isEnrolled = enrollment.length > 0 ? 1 : 0;
        }

        return {
          ...c,
          current_cohort_number: currentCohortNumber,
          status: cohortStatus, // Use cohort status instead of camp status
          status_ar: getStatusAr(cohortStatus), // Translate cohort status
          // Use cohort dates instead of camp dates
          start_date: cohortData?.start_date || null,
          end_date: cohortData?.end_date || null,
          tags: c.tags ? c.tags.split(",").map((tag) => tag.trim()) : [],
          is_enrolled: Boolean(isEnrolled),
          // Enrollment count from ACTIVE cohort only
          enrolled_count: enrollCount[0]?.count || 0,
          max_participants: c.max_participants
            ? Number(c.max_participants)
            : null,
          auto_start_camp: Boolean(c.auto_start_camp),
        };
      })
    );

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
      // 1. حذف joint_step_pledges المرتبطة بتقدم المهام في هذا المخيم
      await db.query(
        `
        DELETE jsp FROM joint_step_pledges jsp
        INNER JOIN camp_task_progress ctp ON jsp.progress_id = ctp.id
        INNER JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
        WHERE ce.camp_id = ?
      `,
        [id]
      );

      // 2. حذف تقدم المهام للمشتركين (عبر enrollment_id)
      await db.query(
        `
        DELETE ctp FROM camp_task_progress ctp
        INNER JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
        WHERE ce.camp_id = ?
      `,
        [id]
      );

      // 3. حذف بيانات المهام اليومية المرتبطة بالمخيم
      await db.query("DELETE FROM camp_daily_tasks WHERE camp_id = ?", [id]);

      // 4. حذف تسجيلات المشتركين في المخيم
      await db.query("DELETE FROM camp_enrollments WHERE camp_id = ?", [id]);

      // 5. حذف المخيم نفسه
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
    const result = await campDetailsService.getCampDetailsForAdmin({
      campId: id,
    });
    res.status(200).json({
      status: "success",
      data: {
        ...result,
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

    const result = await campDetailsService.getCampDetails({
      campId: id,
      userId,
    });

    res.json({
      success: true,
      data: {
        ...result,
      },
    });
  } catch (error) {
    console.error("Error fetching camp details:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب تفاصيل المخيم",
      error: error.message,
    });
  }
};

// Get daily tasks for a camp
const getCampDailyTasks = async (req, res) => {
  try {
    const { id } = req.params;
    const { axisId, cohort_number } = req.query;
    const userId = req.user?.id || null;

    const result = await campTaskService.getCampDailyTasks({
      campId: id,
      axisId,
      cohortNumber: cohort_number ? parseInt(cohort_number) : null,
      userId,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in getCampDailyTasks:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب المهام اليومية",
    });
  }
};

// Enroll in a camp
const enrollInCamp = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { hide_identity = false, cohort_number, referral_code } = req.body;

  const result = await campUserService.enrollUser({
    campId: id,
    userId,
    hideIdentity: hide_identity,
    cohortNumber: cohort_number,
    referralCode: referral_code, // إضافة كود الإحالة
  });

  return res.status(result.status).json(result.body);
};

// Get user's progress in a camp
const getMyProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await campProgressService.getUserProgress({
      campId: id,
      userId,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error fetching user progress:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب التقدم",
    });
  }
};

// Mark task as completed (without journal entry)
const markTaskComplete = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const result = await campProgressService.markTaskComplete({
      taskId,
      userId,
      ...req.body,
    });

    return res.status(result.status).json(result.body);
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

    const result = await campProgressService.updateTaskBenefits({
      taskId,
      userId,
      journal_entry,
      benefits,
      content_rich,
      is_private,
      proposed_step,
    });

    return res.status(result.status).json(result.body);
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
    const { page = 1, limit = 50, status, search, cohort_number } = req.query;

    // Verify admin access
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية للوصول إلى هذه البيانات",
      });
    }

    const cohortNumber = cohort_number ? parseInt(cohort_number) : null;

    const result = await campParticipantService.getParticipants({
      campId: id,
      cohortNumber,
      filters: { status, search },
      pagination: { page: parseInt(page), limit: parseInt(limit) },
      includeSupervisors: false,
    });

    res.json({
      success: true,
      data: result.participants,
      pagination: result.pagination,
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

    const result = await campParticipantService.getLeaderboard({
      campId: id,
      limit: parseInt(limit),
    });

    if (result.status === 404) {
      return res.status(404).json(result.body);
    }

    res.json(result.body);
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
      tags,
    } = req.body;

    const share_link = shortid.generate();

    const [result] = await db.query(
      `
      INSERT INTO quran_camps (name, description, surah_number, surah_name, start_date, duration_days, banner_image, opening_surah_number, opening_surah_name, opening_youtube_url , share_link , tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?)
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
        tags || null,
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
      tags,
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

    // Convert start_date from ISO string to MySQL DATE format
    let formattedStartDate = start_date;
    if (start_date) {
      // Extract YYYY-MM-DD from ISO string or Date object
      formattedStartDate = start_date.split("T")[0];
    }

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
    if (formattedStartDate !== undefined) {
      updateFields.push("start_date = ?");
      values.push(formattedStartDate);
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
    if (tags !== undefined) {
      updateFields.push("tags = ?");
      values.push(tags);
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

    // إذا تم تقليل عدد الأيام، احذف المهام الزائدة
    if (duration_days !== undefined) {
      await db.query(
        `DELETE FROM camp_daily_tasks 
         WHERE camp_id = ? AND day_number > ?`,
        [id, duration_days]
      );

      console.log(
        `[UpdateCamp] Deleted tasks for days > ${duration_days} in camp ${id}`
      );
    }

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

    const result = await campTaskService.addDailyTasks({ campId: id, tasks });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in addDailyTasks:", error);
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
    const result = await campTaskService.updateDailyTask({
      taskId,
      ...req.body,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in updateDailyTask:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديث المهمة",
    });
  }
};

// Get day challenges for a camp (admin)
const getCampDayChallenges = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await campTaskService.getCampDayChallenges({ campId: id });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in getCampDayChallenges:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب تحديات الأيام",
    });
  }
};

// Create or update a day challenge
const upsertCampDayChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const { day_number, title, description } = req.body;

    const result = await campTaskService.upsertCampDayChallenge({
      campId: id,
      dayNumber: day_number,
      title,
      description,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in upsertCampDayChallenge:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في حفظ التحدي اليومي",
    });
  }
};

// Delete a day challenge
const deleteCampDayChallenge = async (req, res) => {
  try {
    const { id, dayNumber } = req.params;

    const result = await campTaskService.deleteCampDayChallenge({
      campId: id,
      dayNumber,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in deleteCampDayChallenge:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في حذف التحدي اليومي",
    });
  }
};

// Get camp analytics (admin only)
const getCampAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { cohort_number } = req.query;

    const result = await campAnalyticsService.getCampAnalytics({
      campId: id,
      cohortNumber: cohort_number,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in getCampAnalytics:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب الإحصائيات",
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
    const result = await campAnalyticsService.getAdminStats();
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in getAdminStats:", error);
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

    const result = await campProgressService.getMyStreak({ campId, userId });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in getMyStreak:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب معلومات الـ Streak",
    });
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

    const result = await campProgressService.getMyStats({ campId, userId });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in getMyStats:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب الإحصائيات",
    });
  }
};

// Get study hall content for a camp (user-generated content)
const getStudyHallContent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      day,
      page = 1,
      limit = 20,
      sort = "newest",
      author_filter,
      date_from,
      date_to,
      search,
    } = req.query;
    const userId = req.user.id;

    const result = await campProgressService.getStudyHallContent({
      id,
      day,
      page,
      limit,
      sort,
      author_filter,
      date_from,
      date_to,
      search,
      userId,
    });
    return res.status(result.status).json(result.body);
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

  const result = await campUserService.removeUserFromCamp({ campId, userId });
  return res.status(result.status).json(result.body);
};

const leaveCamp = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await campUserService.leaveCamp({ campId: id, userId });
  return res.status(result.status).json(result.body);
};

// Get user's camp settings
const getCampSettings = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  const result = await campUserService.getCampSettings({
    campId: id,
    userId,
    userRole,
  });

  return res.status(result.status).json(result.body);
};

// Update user's camp settings
const updateCampSettings = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  const {
    hide_identity,
    notifications_enabled,
    daily_reminders,
    achievement_notifications,
    leaderboard_visibility,
  } = req.body;

  const result = await campUserService.updateCampSettings({
    campId: id,
    userId,
    userRole,
    hide_identity,
    notifications_enabled,
    daily_reminders,
    achievement_notifications,
    leaderboard_visibility,
  });

  return res.status(result.status).json(result.body);
};

// Get admin camp settings (admin only)
const getAdminCampSettings = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await campSettingsService.getAdminCampSettings({
      campId: id,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in getAdminCampSettings:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب إعدادات المخيم",
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

    const result = await campSettingsService.updateAdminCampSettings({
      campId: id,
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
    });

    // Send email notifications if camp was opened
    if (result.body.publicEnrollmentChanged) {
      try {
        const campNotificationController = require("./campNotificationController");
        await campNotificationController.sendCampOpenedNotification(
          result.body.campId,
          result.body.campName
        );
      } catch (emailListError) {
        console.error("Error sending camp opened emails:", emailListError);
      }
    }

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in updateAdminCampSettings:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديث إعدادات المخيم",
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

// Get user's camp progress with tasks and benefits (Admin only)
const getUserCampProgress = async (req, res) => {
  try {
    const { campId, userId } = req.params;
    const { cohort_number } = req.query;

    // Get cohort number from query or use current cohort
    let cohortNumber;
    if (cohort_number) {
      cohortNumber = parseInt(cohort_number);
    } else {
      cohortNumber = await getCurrentCohortNumber(campId);
    }

    // Verify user is enrolled in the camp and cohort
    const [enrollments] = await db.query(
      `
      SELECT 
        ce.*,
        qc.name as camp_name,
        u.username,
        u.email
      FROM camp_enrollments ce
      JOIN quran_camps qc ON ce.camp_id = qc.id
      JOIN users u ON ce.user_id = u.id
      WHERE ce.user_id = ? AND ce.camp_id = ? AND ce.cohort_number = ?
      `,
      [userId, campId, cohortNumber]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير مسجل في هذا المخيم والفوج",
      });
    }

    const enrollment = enrollments[0];

    // Get all tasks for the camp with user's progress
    const [tasks] = await db.query(
      `
      SELECT 
        cdt.*,
        ctp.completed,
        ctp.completed_at,
        ctp.journal_entry,
        ctp.notes,
        cdt.points
      FROM camp_daily_tasks cdt
      LEFT JOIN camp_task_progress ctp ON cdt.id = ctp.task_id AND ctp.enrollment_id = ?
      WHERE cdt.camp_id = ?
      ORDER BY cdt.day_number, cdt.order_in_day
    `,
      [enrollment.id, campId]
    );

    // Get tasks with benefits (journal_entry or notes)
    const tasksWithBenefits = tasks.filter(
      (task) => task.journal_entry || task.notes
    );

    // Calculate statistics
    const completedTasks = tasks.filter((task) => task.completed).length;
    const totalTasks = tasks.length;
    const benefitsCount = tasksWithBenefits.length;

    res.json({
      success: true,
      data: {
        user: {
          id: enrollment.user_id,
          username: enrollment.username,
          email: enrollment.email,
        },
        enrollment: {
          id: enrollment.id,
          total_points: enrollment.total_points,
          enrolled_at: enrollment.enrolled_at,
        },
        tasks,
        tasksWithBenefits,
        stats: {
          totalTasks,
          completedTasks,
          benefitsCount,
          progressPercentage:
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user camp progress:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب تفاصيل المستخدم",
      error: error.message,
    });
  }
};

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    // التحقق من وجود المستخدم
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "يجب تسجيل الدخول لعرض الإشعارات",
      });
    }

    const userId = req.user.id;
    const { limit = 20, offset, page } = req.query;

    // Support both offset and page parameters
    let calculatedOffset = 0;
    if (offset !== undefined) {
      calculatedOffset = parseInt(offset);
    } else if (page !== undefined) {
      calculatedOffset = (parseInt(page) - 1) * parseInt(limit);
    }

    const notifications = await CampNotificationService.getUserNotifications(
      userId || null,
      parseInt(limit),
      calculatedOffset
    );

    const unreadCount = await CampNotificationService.getUnreadCount(
      userId || null
    );

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          limit: parseInt(limit),
          offset: calculatedOffset,
          page: page
            ? parseInt(page)
            : Math.floor(calculatedOffset / parseInt(limit)) + 1,
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

    // Get current cohort number
    const currentCohortNumber = await getCurrentCohortNumber(id);

    // Verify user is enrolled in the camp (current cohort)
    const [enrollment] = await db.query(
      "SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ? AND cohort_number = ?",
      [userId, id, currentCohortNumber]
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

    // Get current cohort number
    const currentCohortNumber = await getCurrentCohortNumber(id);

    // Verify user is enrolled in the camp (current cohort)
    const [enrollment] = await db.query(
      "SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ? AND cohort_number = ?",
      [userId, id, currentCohortNumber]
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
          // جلب الفوج الحالي
          const campNotificationService = require("../services/campNotificationService");
          const cohortNumber =
            await campNotificationService.getCurrentCohortNumber(id);

          const [existingNotif] = await db.query(
            `SELECT id FROM camp_notifications 
             WHERE user_id = ? AND camp_id = ? AND type = 'achievement' AND title LIKE ? AND cohort_number = ? LIMIT 1`,
            [userId, id, `%أتممت رحلتك%`, cohortNumber]
          );
          if (existingNotif.length === 0) {
            await db.query(
              `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at)
               VALUES (?, ?, 'achievement', ?, ?, ?, NOW())`,
              [
                userId,
                id,
                `🎉 أتممت رحلتك في المخيم!`,
                `مبارك! لقد أكملت جميع مهام مخيمك. تم حفظ خطة عملك بنجاح. استمر في التطبيق العملي.
                `,
                cohortNumber,
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

    const result = await campProgressService.getMySummary({
      id,
      userId,
    });
    return res.status(result.status).json({
      success: result.success,
      message: result.message,
      data: {
        ...result.data,
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

    const result = await campReflectionService.toggleUpvoteReflection({
      progressId,
      userId,
    });

    return res.status(result.status).json(result.body);
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

    const result = await campReflectionService.toggleSaveReflection({
      progressId,
      userId,
    });

    return res.status(result.status).json(result.body);
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

    const result = await campReflectionService.getSavedReflections({
      userId,
      campId,
      page,
      limit,
      sort,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error getting saved reflections:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب الفوائد المحفوظة",
    });
  }
};

// حذف تدبر من قاعة التدارس
const deleteReflection = async (req, res) => {
  try {
    const { progressId } = req.params;
    const userId = req.user.id;

    const result = await campReflectionService.deleteReflection({
      progressId,
      userId,
    });

    return res.status(result.status).json(result.body);
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
// Upload attachment to task (admin only)
const uploadTaskAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "معرف المهمة مفقود",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "لم يتم رفع أي ملف",
      });
    }

    // Check if task exists
    const [tasks] = await db.query(
      "SELECT id, attachments FROM camp_daily_tasks WHERE id = ?",
      [taskId]
    );

    if (tasks.length === 0) {
      // Delete uploaded file if task doesn't exist
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(
        __dirname,
        "../public/api/uploads/camp-tasks",
        req.file.filename
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(404).json({
        success: false,
        message: "المهمة غير موجودة",
      });
    }

    const task = tasks[0];

    // Parse existing attachments or create new array
    let attachments = [];
    if (task.attachments) {
      try {
        attachments =
          typeof task.attachments === "string"
            ? JSON.parse(task.attachments)
            : task.attachments;
        if (!Array.isArray(attachments)) {
          attachments = [];
        }
      } catch (e) {
        attachments = [];
      }
    }

    // Determine file type
    const fileExt = req.file.originalname.split(".").pop().toLowerCase();
    let fileType = "file";
    if (["pdf"].includes(fileExt)) fileType = "pdf";
    else if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileExt))
      fileType = "image";
    else if (["doc", "docx"].includes(fileExt)) fileType = "document";
    else if (["txt"].includes(fileExt)) fileType = "text";

    // Add new attachment
    const attachmentUrl = `/api/uploads/camp-tasks/${req.file.filename}`;
    attachments.push({
      filename: req.file.originalname,
      url: attachmentUrl,
      type: fileType,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
    });

    // Update task with new attachments
    await db.query("UPDATE camp_daily_tasks SET attachments = ? WHERE id = ?", [
      JSON.stringify(attachments),
      taskId,
    ]);

    res.json({
      success: true,
      message: "تم رفع المرفق بنجاح",
      data: {
        attachment: attachments[attachments.length - 1],
        allAttachments: attachments,
      },
    });
  } catch (error) {
    console.error("Error uploading task attachment:", error);

    // Delete uploaded file on error
    if (req.file) {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(
        __dirname,
        "../public/api/uploads/camp-tasks",
        req.file.filename
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء رفع المرفق",
    });
  }
};

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

    // Get current cohort number - try to get from camp_cohorts if not in quran_camps
    let currentCohortNumber = camp.current_cohort_number || null;

    if (!currentCohortNumber) {
      // Try to get from camp_cohorts table
      const campNotificationService = require("../services/campNotificationService");
      currentCohortNumber =
        await campNotificationService.getCurrentCohortNumber(id);
    }

    if (!currentCohortNumber) {
      return res.status(400).json({
        success: false,
        message: "لا يوجد فوج نشط حالياً. يرجى إنشاء فوج أو تفعيل فوج موجود.",
      });
    }

    // Get participants based on target_type - only from active cohort
    let query = `
      SELECT DISTINCT ce.user_id, u.username, u.email, ce.total_points
      FROM camp_enrollments ce
      JOIN users u ON ce.user_id = u.id
      WHERE ce.camp_id = ?
      AND ce.cohort_number = ?
    `;
    const params = [id, currentCohortNumber];

    if (target_type === "active") {
      query += ` AND ce.total_points < 100`;
    } else if (target_type === "completed") {
      query += ` AND ce.total_points >= 100`;
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
          `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
           VALUES (?, ?, 'admin_message', ?, ?, ?, NOW())`,
          [participant.user_id, id, title, message, currentCohortNumber]
        );

        // Send email if user has email and wants notifications
        if (shouldSend && participant.email) {
          try {
            const emailSubject = `📢 إشعار من مخيم ${camp.name}: ${title}`;
            const emailHtml = `
              <div dir="rtl" style="font-family: 'Arabic Typography', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <div style="background-color: #4E27B9; padding: 30px; text-align: center;">
                  <img src="https://hadith-shareef.com/assets/icons/180×180.png" alt="Meshkah Logo" style="width: 100px; margin-bottom: 15px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">${title}</h1>
                </div>
                <div style="padding: 40px 30px;">
                  <p style="color: #2c3e50; font-size: 18px; line-height: 1.8; margin-bottom: 20px;">
                    مرحباً ${participant.username}،
                  </p>
                  <div style="background-color: #F9F7FD; border-radius: 8px; padding: 20px; margin: 20px 0; border-right: 4px solid #4E27B9;">
                    <p style="color: #555555; line-height: 1.8; font-size: 16px; margin: 0;">
                      ${message.replace(/\n/g, "<br>")}
                    </p>
                  </div>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://hadith-shareef.com/quran-camps/${id}" style="display: inline-block; background-color: #4E27B9; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 17px;">
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

    const result = await campResourceService.getCampResources({ campId });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in getCampResources:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الموارد",
    });
  }
};

// ==================== CAMP HELP SYSTEM ====================

// Get help guide for a camp
const getCampHelpGuide = async (req, res) => {
  try {
    const { id: campId } = req.params;

    const result = await campHelpService.getCampHelpGuide({ campId });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in getCampHelpGuide:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب دليل المساعدة",
    });
  }
};

// Helper function to get section title
const getSectionTitle = (sectionId) => {
  const sectionTitles = {
    "getting-started": "البدء في المخيم",
    "journey-map": "خريطة الرحلة",
    resources: "الموارد التعليمية",
    journal: "السجل الشخصي",
    friends: "نظام الصحبة",
    "study-hall": "قاعة التدارس",
    general: "عام",
  };
  return sectionTitles[sectionId] || sectionId;
};

// Get FAQ for a camp
const getCampHelpFAQ = async (req, res) => {
  try {
    const { id: campId } = req.params;
    const { category } = req.query;

    const result = await campHelpService.getCampHelpFAQ({ campId, category });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in getCampHelpFAQ:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الأسئلة الشائعة",
    });
  }
};

// Submit help feedback
const submitHelpFeedback = async (req, res) => {
  try {
    const { id: campId } = req.params;
    const userId = req.user?.id;
    const { feedback, rating, category } = req.body;

    const result = await campHelpService.submitHelpFeedback({
      campId,
      userId,
      feedback,
      rating,
      category,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in submitHelpFeedback:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إرسال الملاحظات",
    });
  }
};

// ==================== ADMIN HELP SYSTEM APIs ====================

// Get all help articles for a camp (admin)
const getCampHelpArticles = async (req, res) => {
  try {
    const { id: campId } = req.params;
    const { section_id } = req.query;

    const result = await campHelpService.getCampHelpArticles({
      campId,
      sectionId: section_id,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in getCampHelpArticles:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب مقالات المساعدة",
    });
  }
};

// Create a new help article (admin)
const createCampHelpArticle = async (req, res) => {
  try {
    const { id: campId } = req.params;
    const { title, content, section_id, display_order } = req.body;

    const result = await campHelpService.createCampHelpArticle({
      campId,
      title,
      content,
      sectionId: section_id,
      displayOrder: display_order,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in createCampHelpArticle:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إنشاء المقال",
    });
  }
};

// Update a help article (admin)
const updateCampHelpArticle = async (req, res) => {
  try {
    const { id: campId, articleId } = req.params;
    const { title, content, section_id, display_order } = req.body;

    const result = await campHelpService.updateCampHelpArticle({
      campId,
      articleId,
      title,
      content,
      sectionId: section_id,
      displayOrder: display_order,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in updateCampHelpArticle:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث المقال",
    });
  }
};

// Delete a help article (admin)
const deleteCampHelpArticle = async (req, res) => {
  try {
    const { id: campId, articleId } = req.params;

    const result = await campHelpService.deleteCampHelpArticle({
      campId,
      articleId,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in deleteCampHelpArticle:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء حذف المقال",
    });
  }
};

// Get all FAQ items for a camp (admin)
const getCampHelpFAQAdmin = async (req, res) => {
  try {
    const { id: campId } = req.params;
    const { category } = req.query;

    const result = await campHelpService.getCampHelpFAQAdmin({
      campId,
      category,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in getCampHelpFAQAdmin:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الأسئلة الشائعة",
    });
  }
};

// Create a new FAQ item (admin)
const createCampHelpFAQ = async (req, res) => {
  try {
    const { id: campId } = req.params;
    const { question, answer, category, display_order } = req.body;

    const result = await campHelpService.createCampHelpFAQ({
      campId,
      question,
      answer,
      category,
      displayOrder: display_order,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in createCampHelpFAQ:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إنشاء السؤال الشائع",
    });
  }
};

// Update a FAQ item (admin)
const updateCampHelpFAQ = async (req, res) => {
  try {
    const { id: campId, faqId } = req.params;
    const { question, answer, category, display_order } = req.body;

    const result = await campHelpService.updateCampHelpFAQ({
      campId,
      faqId,
      question,
      answer,
      category,
      displayOrder: display_order,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in updateCampHelpFAQ:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث السؤال الشائع",
    });
  }
};

// Delete a FAQ item (admin)
const deleteCampHelpFAQ = async (req, res) => {
  try {
    const { id: campId, faqId } = req.params;

    const result = await campHelpService.deleteCampHelpFAQ({ campId, faqId });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in deleteCampHelpFAQ:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء حذف السؤال الشائع",
    });
  }
};

// Create a new resource for a camp (admin only)
const createCampResource = async (req, res) => {
  try {
    const { id: campId } = req.params;
    const adminId = req.user.id;
    const { title, url, resource_type, category_id, display_order } = req.body;

    const result = await campResourceService.createCampResource({
      campId,
      adminId,
      title,
      url,
      resourceType: resource_type,
      categoryId: category_id,
      displayOrder: display_order,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in createCampResource:", error);
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

    const result = await campResourceService.updateCampResource({
      resourceId,
      title,
      url,
      resourceType: resource_type,
      categoryId: category_id,
      displayOrder: display_order,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in updateCampResource:", error);
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

    const result = await campResourceService.deleteCampResource({ resourceId });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in deleteCampResource:", error);
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

    const result = await campResourceService.getCampResourceCategories({
      campId,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in getCampResourceCategories:", error);
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

    const result = await campResourceService.createCampResourceCategory({
      campId,
      title,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in createCampResourceCategory:", error);
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

    const result = await campResourceService.updateCampResourceCategory({
      categoryId,
      title,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in updateCampResourceCategory:", error);
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

    const result = await campResourceService.deleteCampResourceCategory({
      categoryId,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in deleteCampResourceCategory:", error);
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
    const { categoryIds } = req.body;

    const result = await campResourceService.updateCategoryOrder({
      campId,
      categoryIds,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in updateCategoryOrder:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث ترتيب الفئات",
    });
  }
};

// Update resource order within a category (admin only)
const updateResourceOrder = async (req, res) => {
  try {
    const { categoryId, resourceIds } = req.body;

    const result = await campResourceService.updateResourceOrder({
      categoryId,
      resourceIds,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in updateResourceOrder:", error);
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
    const { cohort_number } = req.query;

    const result = await campQandAService.getCampQuestions({
      campId,
      cohortNumber: cohort_number,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in getCampQuestions:", error);
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

    const result = await campQandAService.askCampQuestion({
      campId,
      userId,
      question,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in askCampQuestion:", error);
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

    const result = await campQandAService.answerCampQuestion({
      questionId,
      adminId,
      answer,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in answerCampQuestion:", error);
    res
      .status(500)
      .json({ success: false, message: "حدث خطأ أثناء إضافة الإجابة" });
  }
};

// Delete a question (admin or original author)
// Get shared reflection by share_link (public endpoint - no auth required)
const getSharedReflection = async (req, res) => {
  try {
    const { shareLink } = req.params;

    // Get reflection with all related data
    const [reflections] = await db.query(
      `
      SELECT 
        ctp.id as progress_id,
        ctp.journal_entry,
        ctp.notes,
        ctp.content_rich,
        ctp.proposed_step,
        ctp.completed_at,
        ctp.created_at,
        ctp.upvote_count,
        ctp.save_count,
        cdt.id as task_id,
        cdt.title as task_title,
        cdt.description as task_description,
        cdt.day_number,
        cdt.task_type,
        cdt.verses_from,
        cdt.verses_to,
        qc.id as camp_id,
        qc.name as camp_name,
        qc.description as camp_description,
        qc.surah_name,
        qc.share_link as camp_share_link,
        u.id as author_id,
        u.username as author_name,
        u.avatar_url as author_avatar,
        cs.hide_identity,
        COALESCE(pledge_counts.pledge_count, 0) as pledge_count
      FROM camp_task_progress ctp
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN users u ON ce.user_id = u.id
      LEFT JOIN camp_settings cs ON ce.id = cs.enrollment_id
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      JOIN quran_camps qc ON cdt.camp_id = qc.id
      LEFT JOIN (
        SELECT progress_id, COUNT(*) as pledge_count
        FROM joint_step_pledges
        GROUP BY progress_id
      ) pledge_counts ON ctp.id = pledge_counts.progress_id
      WHERE ctp.share_link = ?
        AND ctp.is_private = false
        AND (ctp.journal_entry IS NOT NULL OR ctp.notes IS NOT NULL)
      `,
      [shareLink]
    );

    if (reflections.length === 0) {
      return res.status(404).json({
        success: false,
        message: "التدبر غير موجود أو غير متاح للمشاركة",
      });
    }

    const reflection = reflections[0];

    // Determine if current user is the author (when auth header is provided)
    const currentUserId = req.user?.id;
    const isAuthor = currentUserId && currentUserId === reflection.author_id;

    // Format ayah reference
    let ayahReference = null;
    if (reflection.verses_from) {
      const surahName = reflection.surah_name || "";
      if (
        reflection.verses_to &&
        reflection.verses_to !== reflection.verses_from
      ) {
        ayahReference = `${surahName} ${reflection.verses_from}-${reflection.verses_to}`;
      } else {
        ayahReference = `${surahName} ${reflection.verses_from}`;
      }
    }

    // Handle author anonymity
    let authorName;
    let authorAvatar;
    let authorId;

    if (reflection.hide_identity && !isAuthor) {
      // Hide identity for everyone except the author
      authorName = "مشارك مجهول";
      authorAvatar = null;
      authorId = null;
    } else {
      // Show real identity for the author or when hide_identity is false
      authorName = reflection.author_name;
      authorAvatar = reflection.author_avatar;
      authorId = reflection.author_id;
    }

    res.json({
      success: true,
      data: {
        reflection: {
          id: reflection.progress_id,
          content: reflection.journal_entry || reflection.notes,
          content_rich: reflection.content_rich,
          proposed_step: reflection.proposed_step,
          completed_at: reflection.completed_at,
          created_at: reflection.created_at,
          upvote_count: reflection.upvote_count || 0,
          save_count: reflection.save_count || 0,
          pledge_count: reflection.pledge_count || 0,
        },
        task: {
          id: reflection.task_id,
          title: reflection.task_title,
          description: reflection.task_description,
          day_number: reflection.day_number,
          task_type: reflection.task_type,
        },
        camp: {
          id: reflection.camp_id,
          name: reflection.camp_name,
          description: reflection.camp_description,
          surah_name: reflection.surah_name,
          share_link: reflection.camp_share_link,
        },
        author: {
          name: authorName,
          avatar: authorAvatar,
          author_id: authorId,
          is_anonymous: Boolean(reflection.hide_identity),
          can_view_identity: Boolean(isAuthor),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching shared reflection:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب التدبر المشترك",
    });
  }
};

const deleteCampQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await campQandAService.deleteCampQuestion({
      questionId,
      userId,
      userRole,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in deleteCampQuestion:", error);
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
    const { title, description, parent_group_id } = req.body;

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

    const [result] = await db.query(
      `
      INSERT INTO camp_task_groups (camp_id, title, description, parent_group_id)
      VALUES (?, ?, ?, ?)
    `,
      [id, title, description || null, parent_group_id || null]
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
    const { title, description, parent_group_id } = req.body;

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
        `SELECT * FROM camp_task_groups WHERE camp_id = ? ORDER BY COALESCE(parent_group_id, 0), id`,
        [id]
      );
      const oldToNewGroupId = new Map();

      // First pass: root groups
      for (const grp of groups) {
        if (grp.parent_group_id != null) continue;
        const [resGrp] = await db.query(
          `INSERT INTO camp_task_groups (camp_id, title, description, parent_group_id)
           VALUES (?, ?, ?, ?)`,
          [templateCampId, grp.title, grp.description || null, null]
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
            `INSERT INTO camp_task_groups (camp_id, title, description, parent_group_id)
             VALUES (?, ?, ?, ?)`,
            [templateCampId, grp.title, grp.description || null, newParentId]
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
          `INSERT INTO camp_task_groups (camp_id, title, description, parent_group_id)
           VALUES (?, ?, ?, ?)`,
          [newCampId, grp.title, grp.description || null, null]
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
            `INSERT INTO camp_task_groups (camp_id, title, description, parent_group_id)
             VALUES (?, ?, ?, ?)`,
            [newCampId, grp.title, grp.description || null, newParentId]
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

    const result = await campReflectionService.shareBenefit({
      benefitId,
      userId,
    });

    return res.status(result.status).json(result.body);
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
      // Determine status
      let status = "locked";
    });

    res.json({ success: true, data: axes });
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

    if (unlockDate) {
      unlockDate.setHours(0, 0, 0, 0);
      if (now < unlockDate) {
        return res.status(403).json({
          success: false,
          message: "هذا المحور غير متاح حالياً",
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

    // Get the cohort number from the progress record
    const [progressEnrollment] = await db.query(
      "SELECT cohort_number FROM camp_enrollments WHERE id = ?",
      [progressRecord.enrollment_id]
    );

    const progressCohortNumber = progressEnrollment[0]?.cohort_number;

    // Check if user is enrolled in the camp and same cohort
    const [userEnrollments] = await db.query(
      `SELECT id FROM camp_enrollments WHERE user_id = ? AND camp_id = ? AND cohort_number = ?`,
      [userId, progressRecord.camp_id, progressCohortNumber]
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

    // Clear study hall cache for this camp
    try {
      const redisClient = require("../utils/redisClient");
      if (redisClient) {
        const pattern = `study_hall:${progress[0].camp_id}:*`;
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      }
    } catch (redisError) {
      console.log("Redis not available for cache clearing");
    }

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

// Get all study hall content for admin (Admin only)
const getAdminStudyHallContent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      day,
      page = 1,
      limit = 50,
      sort = "newest",
      cohort_number,
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page)) || 1;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 50;
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

    // Get all study hall content (both reflections and benefits)
    let query = `
      SELECT 
        ctp.id as progress_id,
        cdt.id as task_id,
        cdt.title,
        cdt.day_number,
        ctp.journal_entry,
        ctp.notes,
        ctp.completed_at,
        ctp.created_at,
        ctp.is_private,
        ctp.upvote_count,
        ctp.save_count,
        u.id as user_id,
        u.username,
        u.email,
        ce.id as enrollment_id
      FROM camp_task_progress ctp
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN users u ON ce.user_id = u.id
      WHERE cdt.camp_id = ?
        AND ce.cohort_number = ?
        AND ctp.completed = 1
        AND (ctp.journal_entry IS NOT NULL AND ctp.journal_entry != '' 
             OR ctp.notes IS NOT NULL AND ctp.notes != '')
        AND (ctp.is_private IS NULL OR ctp.is_private = false)
    `;

    // Get cohort number from query or use current cohort
    let cohortNumber;
    if (cohort_number) {
      cohortNumber = parseInt(cohort_number);
    } else {
      cohortNumber = await getCurrentCohortNumber(id);
    }

    const params = [id, cohortNumber];

    // Filter by day if specified
    if (day) {
      query += ` AND cdt.day_number = ?`;
      params.push(day);
    }

    // Apply sorting
    if (sort === "newest") {
      query += ` ORDER BY ctp.completed_at DESC`;
    } else if (sort === "oldest") {
      query += ` ORDER BY ctp.completed_at ASC`;
    } else if (sort === "day") {
      query += ` ORDER BY cdt.day_number DESC, ctp.completed_at DESC`;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM camp_task_progress ctp
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN users u ON ce.user_id = u.id
      WHERE cdt.camp_id = ?
        AND ce.cohort_number = ?
        AND ctp.completed = 1
        AND (ctp.journal_entry IS NOT NULL AND ctp.journal_entry != '' 
             OR ctp.notes IS NOT NULL AND ctp.notes != '')
        AND (ctp.is_private IS NULL OR ctp.is_private = false)
    `;
    const countParams = [id, cohortNumber];
    if (day) {
      countParams.push(day);
    }
    const [countResult] = await db.query(countQuery, countParams);
    const totalItems = countResult[0].total;

    // Apply pagination
    query += ` LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const [content] = await db.query(query, params);

    // Format the content
    const formattedContent = content
      .map((item) => {
        const items = [];
        if (item.journal_entry) {
          items.push({
            id: `reflection-${item.progress_id}`,
            progress_id: item.progress_id,
            type: "reflection",
            title: `تدبر: ${item.title}`,
            upvote_count: item.upvote_count,
            save_count: item.save_count,
            content: item.journal_entry,
            day: item.day_number,
            completed_at: item.completed_at,
            user_id: item.user_id,
            username: item.username,
            email: item.email,
          });
        }
        if (item.notes) {
          items.push({
            id: `benefits-${item.progress_id}`,
            progress_id: item.progress_id,
            type: "benefits",
            title: `فوائد: ${item.title}`,
            content: item.notes,
            day: item.day_number,
            completed_at: item.completed_at,
            user_id: item.user_id,
            username: item.username,
            email: item.email,
          });
        }
        return items;
      })
      .flat();

    res.json({
      success: true,
      data: {
        camp_id: camp.id,
        camp_name: camp.name,
        content: formattedContent,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total_items: totalItems,
          total_pages: Math.ceil(totalItems / limitNum),
          has_next: offset + limitNum < totalItems,
          has_prev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error getting admin study hall content:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب محتوى قاعة التدارس",
    });
  }
};

// Update study hall content (Admin only)
const updateStudyHallContent = async (req, res) => {
  try {
    const { progressId } = req.params;
    const { journal_entry, notes, type, reason } = req.body;

    if (!type || (type !== "reflection" && type !== "benefits")) {
      return res.status(400).json({
        success: false,
        message: "نوع المحتوى غير صحيح",
      });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "يرجى كتابة سبب التعديل",
      });
    }

    // Get progress record with user and camp info
    const [progress] = await db.query(
      `
      SELECT 
        ctp.*,
        ce.user_id,
        ce.camp_id,
        u.username,
        qc.name as camp_name
      FROM camp_task_progress ctp
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN users u ON ce.user_id = u.id
      JOIN quran_camps qc ON ce.camp_id = qc.id
      WHERE ctp.id = ?
    `,
      [progressId]
    );

    if (progress.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المحتوى غير موجود",
      });
    }

    const progressRecord = progress[0];

    // Update the content based on type
    if (type === "reflection" && journal_entry !== undefined) {
      await db.query(
        `UPDATE camp_task_progress SET journal_entry = ? WHERE id = ?`,
        [journal_entry || null, progressId]
      );
    } else if (type === "benefits" && notes !== undefined) {
      await db.query(`UPDATE camp_task_progress SET notes = ? WHERE id = ?`, [
        notes || null,
        progressId,
      ]);
    } else {
      return res.status(400).json({
        success: false,
        message: "يرجى تحديد المحتوى المراد تحديثه",
      });
    }

    // Send notification to user
    const CampNotificationService = require("../services/campNotificationService");
    await CampNotificationService.sendGeneralNotification(
      progressRecord.user_id,
      progressRecord.camp_id,
      progressRecord.camp_name,
      "تم تعديل محتوى قاعة التدارس",
      `تم تعديل ${
        type === "reflection" ? "التدبر" : "الفوائد"
      } الخاص بك في مخيم "${
        progressRecord.camp_name
      }".\n\nالسبب: ${reason}\n\nيرجى مراجعة المحتوى المحدث.`
    );

    res.json({
      success: true,
      message: "تم تحديث المحتوى بنجاح",
    });
  } catch (error) {
    console.error("Error updating study hall content:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديث المحتوى",
    });
  }
};

// Duplicate camp (admin only)
const duplicateCamp = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, start_date, duration_days, banner_image, tags } =
      req.body;

    const result = await campManagementService.duplicateCamp({
      campId: id,
      name,
      description,
      start_date,
      duration_days,
      banner_image,
      tags,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in duplicateCamp:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء نسخ المخيم",
    });
  }
};

// Export camp data to Excel (admin only)
const exportCampData = async (req, res) => {
  try {
    const { id } = req.params;
    const { type = "participants" } = req.query; // participants, tasks, leaderboard, all

    const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();

    // Get camp info
    const [campData] = await db.query(
      "SELECT * FROM quran_camps WHERE id = ?",
      [id]
    );

    if (campData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    const camp = campData[0];

    // Get current cohort number
    const currentCohortNumber = await getCurrentCohortNumber(id);

    // Export participants
    if (type === "participants" || type === "all") {
      // Get total tasks count
      const [totalTasksResult] = await db.query(
        "SELECT COUNT(*) as total FROM camp_daily_tasks WHERE camp_id = ?",
        [id]
      );
      const totalTasks = totalTasksResult[0].total || 1;

      const [participants] = await db.query(
        `
        SELECT 
          ce.id,
          u.username,
          u.email,
          ce.total_points,
          ce.current_streak,
          ce.longest_streak,
          ce.enrollment_date as enrolled_at,
          ce.last_activity_date as last_activity_at,
          COUNT(ctp.id) as completed_tasks,
          ? as total_tasks,
          ROUND((COUNT(ctp.id) / ?) * 100, 2) as completion_percentage
        FROM camp_enrollments ce
        JOIN users u ON ce.user_id = u.id
        LEFT JOIN camp_task_progress ctp ON ce.id = ctp.enrollment_id AND ctp.completed = 1
        WHERE ce.camp_id = ? AND ce.cohort_number = ?
        GROUP BY ce.id
        ORDER BY ce.total_points DESC
      `,
        [totalTasks, totalTasks, id, currentCohortNumber]
      );

      const worksheet = workbook.addWorksheet("المشتركين");
      worksheet.columns = [
        { header: "اسم المستخدم", key: "username", width: 25 },
        { header: "البريد الإلكتروني", key: "email", width: 30 },
        { header: "النقاط", key: "total_points", width: 10 },
        { header: "نسبة الإكمال (%)", key: "completion_percentage", width: 15 },
        { header: "المهام المكتملة", key: "completed_tasks", width: 15 },
        { header: "السلسلة الحالية", key: "current_streak", width: 15 },
        { header: "أطول سلسلة", key: "longest_streak", width: 15 },
        { header: "تاريخ التسجيل", key: "enrolled_at", width: 20 },
        { header: "آخر نشاط", key: "last_activity_at", width: 20 },
      ];

      // Add data rows
      if (participants && participants.length > 0) {
        participants.forEach((p) => {
          worksheet.addRow({
            username: p.username || "",
            email: p.email || "",
            total_points: Number(p.total_points) || 0,
            completion_percentage: parseFloat(
              p.completion_percentage || 0
            ).toFixed(2),
            completed_tasks: Number(p.completed_tasks) || 0,
            current_streak: Number(p.current_streak) || 0,
            longest_streak: Number(p.longest_streak) || 0,
            enrolled_at: p.enrolled_at
              ? new Date(p.enrolled_at).toLocaleDateString("ar-SA")
              : "",
            last_activity_at: p.last_activity_at
              ? new Date(p.last_activity_at).toLocaleDateString("ar-SA")
              : "",
          });
        });
      } else {
        // Add a row indicating no participants
        worksheet.addRow(["لا يوجد مشتركين", "", "", "", "", "", "", "", ""]);
      }

      // Style header
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "8b5cf6" },
      };

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.font = { name: "Arial", size: 11 };
          cell.alignment = {
            horizontal: "right",
            vertical: "middle",
            wrapText: true,
          };
        });
      });
    }

    // Export tasks completion stats
    if (type === "tasks" || type === "all") {
      const [taskStats] = await db.query(
        `
        SELECT 
          cdt.id,
          cdt.day_number,
          cdt.task_type,
          cdt.title,
          COUNT(ctp.id) as completed_count,
          (SELECT COUNT(*) FROM camp_enrollments WHERE camp_id = ? AND cohort_number = ?) as total_participants
        FROM camp_daily_tasks cdt
        LEFT JOIN camp_task_progress ctp ON cdt.id = ctp.task_id AND ctp.completed = 1
        LEFT JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id AND ce.cohort_number = ?
        WHERE cdt.camp_id = ?
        GROUP BY cdt.id
        ORDER BY cdt.day_number, cdt.order_in_day
      `,
        [id, currentCohortNumber, currentCohortNumber, id]
      );

      const worksheet = workbook.addWorksheet("إحصائيات المهام");
      worksheet.columns = [
        { header: "اليوم", key: "day_number", width: 10 },
        { header: "نوع المهمة", key: "task_type", width: 20 },
        { header: "العنوان", key: "title", width: 40 },
        { header: "عدد المكتملين", key: "completed_count", width: 15 },
        { header: "إجمالي المشتركين", key: "total_participants", width: 15 },
        {
          header: "نسبة الإكمال (%)",
          key: "completion_rate",
          width: 15,
        },
      ];

      // Add data rows
      if (taskStats && taskStats.length > 0) {
        taskStats.forEach((task) => {
          const completionRate =
            task.total_participants > 0
              ? (
                  (task.completed_count / task.total_participants) *
                  100
                ).toFixed(2)
              : "0.00";
          worksheet.addRow({
            day_number: Number(task.day_number) || 0,
            task_type: task.task_type || "",
            title: task.title || "",
            completed_count: Number(task.completed_count) || 0,
            total_participants: Number(task.total_participants) || 0,
            completion_rate: completionRate,
          });
        });
      } else {
        // Add a row indicating no task stats
        worksheet.addRow(["", "لا يوجد بيانات", "", "", "", ""]);
      }

      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "8b5cf6" },
      };

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.font = { name: "Arial", size: 11 };
          cell.alignment = {
            horizontal: "right",
            vertical: "middle",
            wrapText: true,
          };
        });
      });
    }

    // Export leaderboard
    if (type === "leaderboard" || type === "all") {
      // Get total tasks count
      const [totalTasksResult] = await db.query(
        "SELECT COUNT(*) as total FROM camp_daily_tasks WHERE camp_id = ?",
        [id]
      );
      const totalTasks = totalTasksResult[0].total || 1;

      const [leaderboard] = await db.query(
        `
        SELECT 
          ce.total_points,
          u.username,
          ce.current_streak,
          ce.longest_streak,
          COUNT(ctp.id) as completed_tasks,
          ? as total_tasks,
          ROUND((COUNT(ctp.id) / ?) * 100, 2) as completion_percentage
        FROM camp_enrollments ce
        JOIN users u ON ce.user_id = u.id
        LEFT JOIN camp_settings cs ON ce.id = cs.enrollment_id
        LEFT JOIN camp_task_progress ctp ON ce.id = ctp.enrollment_id AND ctp.completed = 1
        WHERE ce.camp_id = ? AND ce.cohort_number = ?
          AND COALESCE(cs.leaderboard_visibility, true) = true
          AND NOT EXISTS (
            SELECT 1 FROM camp_supervisors cs2 
            WHERE cs2.camp_id = ce.camp_id 
            AND (cs2.cohort_number = ce.cohort_number OR cs2.cohort_number IS NULL)
            AND cs2.user_id = ce.user_id
          )
        GROUP BY ce.id
        ORDER BY ce.total_points DESC
      `,
        [totalTasks, totalTasks, id, currentCohortNumber]
      );

      const worksheet = workbook.addWorksheet("لوحة المتصدرين");
      worksheet.columns = [
        { header: "الترتيب", key: "rank", width: 10 },
        { header: "اسم المستخدم", key: "username", width: 25 },
        { header: "النقاط", key: "total_points", width: 15 },
        { header: "نسبة الإكمال (%)", key: "completion_percentage", width: 15 },
        { header: "السلسلة الحالية", key: "current_streak", width: 15 },
        { header: "أطول سلسلة", key: "longest_streak", width: 15 },
      ];

      // Add data rows
      if (leaderboard && leaderboard.length > 0) {
        leaderboard.forEach((entry, index) => {
          worksheet.addRow({
            rank: index + 1,
            username: entry.username || "",
            total_points: Number(entry.total_points) || 0,
            completion_percentage: parseFloat(
              entry.completion_percentage || 0
            ).toFixed(2),
            current_streak: Number(entry.current_streak) || 0,
            longest_streak: Number(entry.longest_streak) || 0,
          });
        });
      } else {
        // Add a row indicating no leaderboard data
        worksheet.addRow(["", "لا يوجد بيانات", "", "", "", ""]);
      }

      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "8b5cf6" },
      };

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.font = { name: "Arial", size: 11 };
          cell.alignment = {
            horizontal: "right",
            vertical: "middle",
            wrapText: true,
          };
        });
      });
    }

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    const filename = `camp_${camp.id}_${type}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting camp data:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تصدير البيانات",
    });
  }
};

const deleteStudyHallContent = async (req, res) => {
  try {
    const { progressId } = req.params;
    const { type, reason } = req.body;

    if (!type || (type !== "reflection" && type !== "benefits")) {
      return res.status(400).json({
        success: false,
        message: "نوع المحتوى غير صحيح",
      });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "يرجى كتابة سبب الحذف",
      });
    }

    // Get progress record with user and camp info
    const [progress] = await db.query(
      `
      SELECT 
        ctp.*,
        ce.user_id,
        ce.camp_id,
        u.username,
        qc.name as camp_name
      FROM camp_task_progress ctp
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN users u ON ce.user_id = u.id
      JOIN quran_camps qc ON ce.camp_id = qc.id
      WHERE ctp.id = ?
    `,
      [progressId]
    );

    if (progress.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المحتوى غير موجود",
      });
    }

    const progressRecord = progress[0];

    // Delete the content based on type
    if (type === "reflection") {
      await db.query(
        `UPDATE camp_task_progress SET journal_entry = NULL WHERE id = ?`,
        [progressId]
      );
    } else if (type === "benefits") {
      await db.query(
        `UPDATE camp_task_progress SET notes = NULL WHERE id = ?`,
        [progressId]
      );
    }

    // Send notification to user
    const CampNotificationService = require("../services/campNotificationService");
    await CampNotificationService.sendGeneralNotification(
      progressRecord.user_id,
      progressRecord.camp_id,
      progressRecord.camp_name,
      "تم حذف محتوى قاعة التدارس",
      `تم حذف ${
        type === "reflection" ? "التدبر" : "الفوائد"
      } الخاص بك من قاعة التدارس في مخيم "${
        progressRecord.camp_name
      }".\n\nالسبب: ${reason}`
    );

    res.json({
      success: true,
      message: "تم حذف المحتوى بنجاح",
    });
  } catch (error) {
    console.error("Error deleting study hall content:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في حذف المحتوى",
    });
  }
};

// Get all daily messages for a camp (admin only)
const getCampDailyMessages = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if camp exists
    const [camps] = await db.query(
      "SELECT id, name, duration_days FROM quran_camps WHERE id = ?",
      [id]
    );
    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    const camp = camps[0];

    // Check if table exists, if not return empty array
    let messages = [];
    try {
      const [result] = await db.query(
        `
        SELECT 
          id,
          camp_id,
          day_number,
          title,
          message,
          is_active,
          created_at,
          updated_at
        FROM camp_daily_messages
        WHERE camp_id = ?
        ORDER BY day_number ASC, created_at ASC
      `,
        [id]
      );
      messages = result || [];
    } catch (tableError) {
      // Table doesn't exist, return empty array
      console.log("camp_daily_messages table doesn't exist yet");
    }

    res.json({
      success: true,
      data: {
        camp_id: camp.id,
        camp_name: camp.name,
        duration_days: camp.duration_days,
        messages: messages,
      },
    });
  } catch (error) {
    console.error("Error fetching daily messages:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب الرسائل اليومية",
      error: error.message,
    });
  }
};

// Create a daily message (admin only)
const createDailyMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { day_number, title, message, is_active = true } = req.body;

    // Validate required fields
    if (!day_number || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "اليوم والعنوان والرسالة مطلوبون",
      });
    }

    // Check if camp exists
    const [camps] = await db.query(
      "SELECT id, name, duration_days FROM quran_camps WHERE id = ?",
      [id]
    );
    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    const camp = camps[0];

    // Validate day_number
    if (day_number < 1 || day_number > camp.duration_days) {
      return res.status(400).json({
        success: false,
        message: `رقم اليوم يجب أن يكون بين 1 و ${camp.duration_days}`,
      });
    }

    // Create table if it doesn't exist
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS camp_daily_messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          camp_id INT NOT NULL,
          day_number INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          is_active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (camp_id) REFERENCES quran_camps(id) ON DELETE CASCADE,
          INDEX idx_camp_day (camp_id, day_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } catch (tableError) {
      // Table might already exist, continue
      console.log("Table creation skipped or already exists");
    }

    // Insert the message
    const [result] = await db.query(
      `
      INSERT INTO camp_daily_messages (camp_id, day_number, title, message, is_active)
      VALUES (?, ?, ?, ?, ?)
    `,
      [id, day_number, title, message, is_active ? 1 : 0]
    );

    res.json({
      success: true,
      message: "تم إنشاء الرسالة اليومية بنجاح",
      data: {
        id: result.insertId,
        camp_id: id,
        day_number,
        title,
        message,
        is_active,
      },
    });
  } catch (error) {
    console.error("Error creating daily message:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إنشاء الرسالة اليومية",
      error: error.message,
    });
  }
};

// Update a daily message (admin only)
const updateDailyMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { day_number, title, message, is_active } = req.body;

    // Check if message exists
    const [messages] = await db.query(
      `
      SELECT dm.*, qc.duration_days
      FROM camp_daily_messages dm
      JOIN quran_camps qc ON dm.camp_id = qc.id
      WHERE dm.id = ?
    `,
      [messageId]
    );

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الرسالة غير موجودة",
      });
    }

    const existingMessage = messages[0];

    // Validate day_number if provided
    if (day_number !== undefined) {
      if (day_number < 1 || day_number > existingMessage.duration_days) {
        return res.status(400).json({
          success: false,
          message: `رقم اليوم يجب أن يكون بين 1 و ${existingMessage.duration_days}`,
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (day_number !== undefined) {
      updates.push("day_number = ?");
      values.push(day_number);
    }
    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }
    if (message !== undefined) {
      updates.push("message = ?");
      values.push(message);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "لا توجد بيانات للتحديث",
      });
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(messageId);

    await db.query(
      `
      UPDATE camp_daily_messages
      SET ${updates.join(", ")}
      WHERE id = ?
    `,
      values
    );

    res.json({
      success: true,
      message: "تم تحديث الرسالة اليومية بنجاح",
    });
  } catch (error) {
    console.error("Error updating daily message:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديث الرسالة اليومية",
      error: error.message,
    });
  }
};

// Delete a daily message (admin only)
const deleteDailyMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    // Check if message exists
    const [messages] = await db.query(
      "SELECT id FROM camp_daily_messages WHERE id = ?",
      [messageId]
    );

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الرسالة غير موجودة",
      });
    }

    // Delete the message
    await db.query("DELETE FROM camp_daily_messages WHERE id = ?", [messageId]);

    res.json({
      success: true,
      message: "تم حذف الرسالة اليومية بنجاح",
    });
  } catch (error) {
    console.error("Error deleting daily message:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في حذف الرسالة اليومية",
      error: error.message,
    });
  }
};

// Export camp tasks to JSON or CSV (admin only)
const exportCampTasks = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = "json" } = req.query;

    // Check if camp exists
    const [camps] = await db.query(
      "SELECT id, name, duration_days FROM quran_camps WHERE id = ?",
      [id]
    );
    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    // Get all tasks for the camp
    const [tasks] = await db.query(
      `
      SELECT 
        id,
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
        order_in_group
      FROM camp_daily_tasks
      WHERE camp_id = ?
      ORDER BY day_number, order_in_day
    `,
      [id]
    );

    if (format === "csv") {
      // Generate CSV
      const csvRows = [];

      // Header
      csvRows.push(
        "day_number,task_type,title,description,verses_from,verses_to,tafseer_link,youtube_link,order_in_day,is_optional,points,estimated_time,group_id,order_in_group"
      );

      // Data rows
      tasks.forEach((task) => {
        const row = [
          task.day_number || "",
          task.task_type || "",
          `"${(task.title || "").replace(/"/g, '""')}"`,
          `"${(task.description || "").replace(/"/g, '""')}"`,
          task.verses_from || "",
          task.verses_to || "",
          task.tafseer_link || "",
          task.youtube_link || "",
          task.order_in_day || "",
          task.is_optional ? "1" : "0",
          task.points || "",
          task.estimated_time || "",
          task.group_id || "",
          task.order_in_group || "",
        ];
        csvRows.push(row.join(","));
      });

      const csv = csvRows.join("\n");
      const csvBuffer = Buffer.from("\ufeff" + csv, "utf8"); // BOM for Excel UTF-8 support

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="camp-${id}-tasks-${
          new Date().toISOString().split("T")[0]
        }.csv"`
      );
      return res.send(csvBuffer);
    } else {
      // JSON format
      res.json({
        success: true,
        data: {
          camp_id: parseInt(id),
          camp_name: camps[0].name,
          duration_days: camps[0].duration_days,
          exported_at: new Date().toISOString(),
          tasks: tasks.map((task) => ({
            day_number: task.day_number,
            task_type: task.task_type,
            title: task.title,
            description: task.description || "",
            verses_from: task.verses_from,
            verses_to: task.verses_to,
            tafseer_link: task.tafseer_link || "",
            youtube_link: task.youtube_link || "",
            order_in_day: task.order_in_day,
            is_optional: task.is_optional === 1 || task.is_optional === true,
            points: task.points,
            estimated_time: task.estimated_time,
            group_id: task.group_id,
            order_in_group: task.order_in_group,
          })),
        },
      });
    }
  } catch (error) {
    console.error("Error exporting tasks:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تصدير المهام",
      error: error.message,
    });
  }
};

// Helper function to parse CSV/XLSX file
const parseTasksFile = async (file) => {
  const ExcelJS = require("exceljs");
  const tasks = [];

  try {
    // Check file extension
    const fileName = file.originalname.toLowerCase();
    const isCSV = fileName.endsWith(".csv");
    const isXLSX = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    let worksheet;

    if (isCSV) {
      // Parse CSV using ExcelJS
      const workbook = new ExcelJS.Workbook();
      const csvText = file.buffer.toString("utf8");
      await workbook.csv.read(csvText);
      worksheet = workbook.worksheets[0];
    } else if (isXLSX) {
      // Parse XLSX
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      worksheet = workbook.worksheets[0];
    } else {
      throw new Error("Unsupported file format. Please use CSV or XLSX.");
    }

    if (!worksheet || worksheet.rowCount < 2) {
      throw new Error("File is empty or has no data rows");
    }

    // Get header row
    const headerRow = worksheet.getRow(1);
    const headers = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value
        ? cell.value.toString().trim().toLowerCase()
        : "";
    });

    // Map header names to field names
    const headerMap = {
      day_number: "day_number",
      day: "day_number",
      task_type: "task_type",
      type: "task_type",
      title: "title",
      description: "description",
      verses_from: "verses_from",
      verses_to: "verses_to",
      tafseer_link: "tafseer_link",
      youtube_link: "youtube_link",
      order_in_day: "order_in_day",
      order: "order_in_day",
      is_optional: "is_optional",
      optional: "is_optional",
      points: "points",
      estimated_time: "estimated_time",
      time: "estimated_time",
      group_id: "group_id",
      order_in_group: "order_in_group",
    };

    // Normalize headers
    const normalizedHeaders = headers.map((h) => {
      const normalized = h.replace(/\s+/g, "_").toLowerCase();
      return headerMap[normalized] || normalized;
    });

    // Parse data rows
    for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);
      const task = {};
      let hasData = false;

      row.eachCell((cell, colNumber) => {
        const fieldName = normalizedHeaders[colNumber];
        if (fieldName) {
          let value = cell.value;

          // Convert Excel date to number
          if (
            value &&
            typeof value === "object" &&
            value.constructor.name === "DateTime"
          ) {
            value = value.getDate();
          } else if (value && typeof value === "object" && value.getDate) {
            value = value.getDate();
          }

          // Convert to appropriate type
          if (value !== null && value !== undefined && value !== "") {
            hasData = true;

            if (
              fieldName === "day_number" ||
              fieldName === "verses_from" ||
              fieldName === "verses_to" ||
              fieldName === "order_in_day" ||
              fieldName === "points" ||
              fieldName === "estimated_time" ||
              fieldName === "group_id" ||
              fieldName === "order_in_group"
            ) {
              task[fieldName] = parseInt(value) || null;
            } else if (fieldName === "is_optional") {
              task[fieldName] =
                value === true ||
                value === 1 ||
                value === "1" ||
                value.toString().toLowerCase() === "true" ||
                value.toString().toLowerCase() === "yes" ||
                value.toString().toLowerCase() === "نعم";
            } else {
              task[fieldName] = value ? value.toString().trim() : "";
            }
          }
        }
      });

      if (hasData) {
        tasks.push(task);
      }
    }

    return tasks;
  } catch (error) {
    throw new Error(`Error parsing file: ${error.message}`);
  }
};

// Import camp tasks from JSON or CSV/XLSX (admin only)
const importCampTasks = async (req, res) => {
  try {
    const { id } = req.params;
    let tasks = [];
    let replace = false;

    // Check if file was uploaded
    if (req.file) {
      // Parse CSV/XLSX file
      tasks = await parseTasksFile(req.file);
      replace = req.body.replace === "true" || req.body.replace === true;
    } else {
      // Parse JSON from body
      tasks = req.body.tasks;
      replace = req.body.replace || false;

      // Validate input
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({
          success: false,
          message: "يجب إرسال قائمة بالمهام أو ملف CSV/XLSX",
        });
      }
    }

    // Check if camp exists
    const [camps] = await db.query(
      "SELECT id, name, duration_days FROM quran_camps WHERE id = ?",
      [id]
    );
    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    const camp = camps[0];

    // Validate each task
    const validTaskTypes = [
      "reading",
      "memorization",
      "prayer",
      "tafseer_tabari",
      "tafseer_kathir",
      "youtube",
      "journal",
    ];

    const errors = [];
    const validTasks = [];

    tasks.forEach((task, index) => {
      const errorMessages = [];

      // Required fields
      if (!task.day_number || task.day_number < 1) {
        errorMessages.push("day_number is required and must be >= 1");
      }
      // Remove validation against camp.duration_days - accept tasks from file regardless
      if (!task.task_type || !validTaskTypes.includes(task.task_type)) {
        errorMessages.push(
          `task_type is required and must be one of: ${validTaskTypes.join(
            ", "
          )}`
        );
      }
      if (!task.title || task.title.trim().length === 0) {
        errorMessages.push("title is required");
      }

      if (errorMessages.length > 0) {
        errors.push({
          index: index + 1,
          task: task.title || `Task #${index + 1}`,
          errors: errorMessages,
        });
      } else {
        validTasks.push({
          camp_id: parseInt(id),
          day_number: parseInt(task.day_number),
          task_type: task.task_type,
          title: task.title.trim(),
          description: task.description || "",
          verses_from: task.verses_from || null,
          verses_to: task.verses_to || null,
          tafseer_link: task.tafseer_link || null,
          youtube_link: task.youtube_link || null,
          order_in_day: parseInt(task.order_in_day) || 1,
          is_optional:
            task.is_optional === true || task.is_optional === 1 || false,
          points: parseInt(task.points) || 3,
          estimated_time: task.estimated_time
            ? parseInt(task.estimated_time)
            : null,
          group_id: task.group_id ? parseInt(task.group_id) : null,
          order_in_group: task.order_in_group
            ? parseInt(task.order_in_group)
            : null,
        });
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `تم العثور على ${errors.length} خطأ/أخطاء في البيانات`,
        errors,
      });
    }

    // Start transaction
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Delete existing tasks if replace is true
      // Must delete in order: joint_step_pledges -> camp_task_progress -> camp_daily_tasks
      if (replace) {
        // First, get all task IDs for this camp
        const [taskIds] = await connection.query(
          "SELECT id FROM camp_daily_tasks WHERE camp_id = ?",
          [id]
        );

        if (taskIds.length > 0) {
          const taskIdList = taskIds.map((t) => t.id);

          // Get all progress IDs for these tasks
          const [progressIds] = await connection.query(
            "SELECT id FROM camp_task_progress WHERE task_id IN (?)",
            [taskIdList]
          );

          if (progressIds.length > 0) {
            const progressIdList = progressIds.map((p) => p.id);

            // Delete joint_step_pledges related to these progress records
            await connection.query(
              "DELETE FROM joint_step_pledges WHERE progress_id IN (?)",
              [progressIdList]
            );
          }

          // Delete camp_task_progress related to these tasks
          await connection.query(
            "DELETE FROM camp_task_progress WHERE task_id IN (?)",
            [taskIdList]
          );
        }

        // Finally, delete the tasks
        await connection.query(
          "DELETE FROM camp_daily_tasks WHERE camp_id = ?",
          [id]
        );
      }

      // Insert new tasks
      for (const task of validTasks) {
        await connection.query(
          `
          INSERT INTO camp_daily_tasks (
            camp_id, day_number, task_type, title, description,
            verses_from, verses_to, tafseer_link, youtube_link,
            order_in_day, is_optional, points, estimated_time, group_id, order_in_group
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            task.camp_id,
            task.day_number,
            task.task_type,
            task.title,
            task.description,
            task.verses_from,
            task.verses_to,
            task.tafseer_link,
            task.youtube_link,
            task.order_in_day,
            task.is_optional ? 1 : 0,
            task.points,
            task.estimated_time,
            task.group_id,
            task.order_in_group,
          ]
        );
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: `تم استيراد ${validTasks.length} مهمة بنجاح`,
        data: {
          imported_count: validTasks.length,
          replaced: replace,
        },
      });
    } catch (transactionError) {
      await connection.rollback();
      connection.release();
      throw transactionError;
    }
  } catch (error) {
    console.error("Error importing tasks:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في استيراد المهام",
      error: error.message,
    });
  }
};

// Download user reflections as PDF using external API (no Puppeteer required)
const downloadReflectionsPDF = async (req, res) => {
  try {
    const { campId } = req.params;
    const userId = req.user.id;

    // Get data from service
    const result = await campReflectionService.downloadReflectionsPDF({
      campId,
      userId,
    });

    if (result.status !== 200) {
      return res.status(result.status).json(result.body);
    }

    const { camp, user, reflections } = result.body.data;

    if (reflections.length === 0) {
      return res.status(404).json({
        success: false,
        message: "لا توجد تدبرات متاحة للتصدير",
      });
    }

    // Format ayah reference
    const formatAyahReference = (task) => {
      if (!task.verses_from) return null;
      const surahName = camp.surah_name || "";
      if (task.verses_to && task.verses_to !== task.verses_from) {
        return `${surahName} ${task.verses_from}-${task.verses_to}`;
      }
      return `${surahName} ${task.verses_from}`;
    };

    // Convert rich content JSON to HTML if available
    const getReflectionContent = (reflection) => {
      // Always prefer journal_entry if available (it's the HTML version)
      if (reflection.journal_entry) {
        return reflection.journal_entry;
      }

      // Fallback to content_rich if journal_entry is not available
      if (reflection.content_rich) {
        try {
          const richContent = JSON.parse(reflection.content_rich);
          // If it's a Tiptap JSON structure, extract text
          if (richContent.type === "doc" && richContent.content) {
            const extractText = (node) => {
              if (node.type === "text") return node.text || "";
              if (node.content && Array.isArray(node.content)) {
                return node.content.map(extractText).join("");
              }
              return "";
            };
            return extractText(richContent);
          }
          return "";
        } catch (e) {
          return "";
        }
      }
      return "";
    };

    // Escape HTML to prevent XSS and ensure proper rendering
    const escapeHtml = (text) => {
      if (!text) return "";
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    };

    // Clean HTML content
    const cleanHtmlContent = (html) => {
      if (!html) return "";
      // Remove null bytes and other control characters except newlines and tabs
      html = html.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, "");
      return html;
    };

    // Build HTML content for reflections
    const reflectionsHtml = reflections
      .map((reflection, index) => {
        const ayahRef = formatAyahReference(reflection);
        const content = getReflectionContent(reflection);
        const date = new Date(
          reflection.created_at || reflection.completed_at
        ).toLocaleDateString("ar-SA", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const safeTaskTitle = escapeHtml(reflection.task_title || "");
        const cleanContent = cleanHtmlContent(content || "");

        return `
          <div class="reflection-card">
            <div class="reflection-header">
              <div class="reflection-number">${index + 1}</div>
              <div class="reflection-meta">
                <span class="reflection-day">اليوم ${
                  reflection.day_number
                }</span>
                ${
                  ayahRef
                    ? `<span class="reflection-ayah">${escapeHtml(
                        ayahRef
                      )}</span>`
                    : ""
                }
                <span class="reflection-date">${date}</span>
              </div>
            </div>
            <div class="reflection-task-title">${safeTaskTitle}</div>
            <div class="reflection-content">${cleanContent}</div>
          </div>
        `;
      })
      .join("");

    // Build complete HTML template
    const campName = camp && camp.name ? String(camp.name).trim() : "مخيم";
    const campNameSafe = campName.replace(/[<>:"/\\|?*]/g, "_");
    const exportDate = new Date().toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <title>تدبرات ${campNameSafe}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Cairo', 'Arial', sans-serif;
            }
            body {
                font-family: 'Cairo', 'Arial', sans-serif;
                margin: 0;
                padding: 40px;
                line-height: 1.8;
                color: #2c3e50;
                direction: rtl;
                text-align: right;
                background: #ffffff;
                font-size: 14px;
            }
            .cover-page {
                page-break-after: always;
                height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                padding: 40px;
                background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            }
            .cover-page-title {
                font-size: 48px;
                font-weight: 700;
                color: #2c3e50;
                margin-bottom: 40px;
                letter-spacing: 1px;
                line-height: 1.4;
            }
            .cover-page-cohort {
                font-size: 32px;
                font-weight: 600;
                color: #4E27B9;
                margin-top: 30px;
                padding: 20px 40px;
                border: 3px solid #4E27B9;
                border-radius: 12px;
                background: rgba(78, 39, 185, 0.05);
            }
            .header {
                text-align: center;
                margin-bottom: 50px;
                padding: 30px 0;
                border-bottom: 3px solid #4E27B9;
                position: relative;
            }
            .camp-title {
                font-size: 32px;
                font-weight: 700;
                color: #2c3e50;
                margin-bottom: 10px;
                letter-spacing: 0.5px;
            }
            .user-name {
                font-size: 18px;
                color: #4E27B9;
                font-weight: 600;
                margin-top: 10px;
            }
            .reflection-card {
                margin-bottom: 40px;
                padding: 30px;
                border: 2px solid #28a745;
                background: #f8fff9;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                page-break-inside: avoid;
                border-right: 4px solid #28a745;
            }
            .reflection-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e9ecef;
            }
            .reflection-number {
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 18px;
                flex-shrink: 0;
            }
            .reflection-meta {
                display: flex;
                gap: 15px;
                flex-wrap: wrap;
                flex: 1;
                margin-right: 15px;
            }
            .reflection-day {
                background: #e8f5e9;
                color: #28a745;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                border: 1px solid #28a745;
            }
            .reflection-ayah {
                background: #fff3e0;
                color: #e65100;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                border: 1px solid #ffb74d;
            }
            .reflection-date {
                color: #7f8c8d;
                font-size: 12px;
                padding: 6px 0;
            }
            .reflection-task-title {
                font-size: 20px;
                font-weight: 700;
                color: #2c3e50;
                margin-bottom: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                border-right: 3px solid #28a745;
            }
            .reflection-content {
                color: #2c3e50;
                line-height: 2;
                font-size: 15px;
                padding: 20px;
                background: #ffffff;
                border-radius: 8px;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            .footer {
                text-align: center;
                margin-top: 60px;
                padding: 30px 0;
                border-top: 2px solid #e9ecef;
                color: #7f8c8d;
                font-size: 12px;
            }
            @media print {
                body { 
                    margin: 0; 
                    padding: 20px; 
                }
                .cover-page {
                    page-break-after: always;
                    height: 100vh;
                }
                .reflection-card { 
                    page-break-inside: avoid; 
                    margin-bottom: 30px;
                }
            }
        </style>
    </head>
    <body>
        <div class="cover-page">
            <div class="cover-page-title">${escapeHtml(campName)}</div>
            <div class="cover-page-cohort">الفوج الأول</div>
        </div>
        
        <div class="header">
            <div class="camp-title">${escapeHtml(campName)}</div>
            <div class="user-name">تدبرات ${escapeHtml(user.username)}</div>
        </div>
        
        ${reflectionsHtml}
        
        <div class="footer">
            <div>تم التصدير في ${exportDate}</div>
            <div style="margin-top: 10px;">عدد التدبرات: ${
              reflections.length
            }</div>
            <div style="margin-top: 10px; color: #4E27B9; font-weight: 600;">Exported from Mishkah App</div>
        </div>
    </body>
    </html>
    `;

    // Call external PDF generation API
    try {
      // You can replace this URL with your preferred PDF API service
      // Options: html2pdf.app, PDFShift, Gotenberg, etc.
      const pdfApiUrl =
        process.env.PDF_API_URL || "https://api.html2pdf.app/v1/generate";
      const pdfApiKey = process.env.PDF_API_KEY || "";

      // First, make the API call with JSON response type to get the FileUrl
      const apiResponse = await axios.post(
        "https://v2.api2pdf.com/chrome/pdf/html",
        {
          html: htmlContent,
          apiKey: pdfApiKey, // سجل مجاناً في موقعهم لو طلبوا
          settings: {
            format: "A4",
            margin: { top: 20, right: 20, bottom: 20, left: 20 },
          },
        },
        {
          headers: {
            Authorization: `${pdfApiKey}`,
          },
          responseType: "json", // First get JSON response to check for FileUrl
          validateStatus: function (status) {
            // Accept all status codes so we can handle errors manually
            return true;
          },
        }
      );

      // Check if response is successful
      if (apiResponse.status < 200 || apiResponse.status >= 300) {
        let errorMessage = "خطأ غير معروف من API";
        if (apiResponse.data) {
          errorMessage =
            apiResponse.data.message ||
            apiResponse.data.error ||
            apiResponse.data.Error ||
            JSON.stringify(apiResponse.data);
        }
        throw new Error(
          `فشل API في إنشاء PDF (Status: ${apiResponse.status}): ${errorMessage}`
        );
      }

      // Parse the response
      const responseData = apiResponse.data;

      // Check if API returned an error
      if (responseData.Error || !responseData.Success) {
        const errorMsg =
          responseData.Error || responseData.message || "فشل في إنشاء ملف PDF";
        throw new Error(`خطأ من API: ${errorMsg}`);
      }

      // Check if we have a FileUrl (API returns URL instead of direct PDF)
      let pdfBuffer;
      if (responseData.FileUrl) {
        // Download the PDF from the provided URL
        console.log("Downloading PDF from:", responseData.FileUrl);
        const pdfDownloadResponse = await axios.get(responseData.FileUrl, {
          responseType: "arraybuffer",
        });

        if (
          !pdfDownloadResponse.data ||
          pdfDownloadResponse.data.length === 0
        ) {
          throw new Error("فشل في تحميل ملف PDF - الملف فارغ");
        }

        // Validate it's a PDF
        const firstBytes = Buffer.from(pdfDownloadResponse.data).slice(0, 4);
        const pdfHeader = String.fromCharCode(...firstBytes);

        if (pdfHeader !== "%PDF") {
          throw new Error(
            `الملف المُحمل ليس ملف PDF صالح. Header: ${pdfHeader}`
          );
        }

        pdfBuffer = pdfDownloadResponse.data;
      } else {
        // If no FileUrl, check if PDF is in response directly
        if (!responseData || !Buffer.isBuffer(responseData)) {
          throw new Error("لم يتم العثور على رابط ملف PDF في الاستجابة من API");
        }
        pdfBuffer = responseData;
      }

      // Create filename
      const campNameSafe = (camp.name || "").replace(/[<>:"/\\|?*]/g, "_");
      const filename = `${campNameSafe} - تدبري.pdf`;
      const asciiFilename = `${
        campNameSafe
          .replace(/[^a-zA-Z0-9\s-]/g, "_")
          .trim()
          .replace(/\s+/g, "_") || `camp_${camp.id}`
      }_tadabburi.pdf`;
      const encodedFilename = encodeURIComponent(filename);

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`
      );
      res.setHeader("Content-Length", pdfBuffer.length.toString());
      res.setHeader("Cache-Control", "no-cache");

      // Send PDF buffer
      res.send(Buffer.from(pdfBuffer));
    } catch (apiError) {
      console.error("Error calling external PDF API:", apiError);

      // More detailed error logging
      let errorMessage = apiError.message;

      if (apiError.response) {
        console.error("API Response Status:", apiError.response.status);

        // Try to parse error response - could be arraybuffer or already parsed
        let errorDataStr = "";
        try {
          if (
            Buffer.isBuffer(apiError.response.data) ||
            apiError.response.data instanceof ArrayBuffer
          ) {
            errorDataStr = Buffer.from(apiError.response.data).toString();
          } else {
            errorDataStr = JSON.stringify(apiError.response.data);
          }

          // Try to parse as JSON to get structured error
          try {
            const errorData = JSON.parse(errorDataStr);
            errorMessage =
              errorData.message ||
              errorData.error ||
              errorData.Message ||
              errorMessage;
            console.error("API Error Details:", errorData);
          } catch (e) {
            // Not JSON, use as-is
            errorMessage = errorDataStr.substring(0, 200) || errorMessage;
          }
        } catch (e) {
          errorMessage =
            apiError.response.data?.toString().substring(0, 200) ||
            errorMessage;
        }

        console.error("API Response Data:", errorDataStr.substring(0, 500));
      }

      throw new Error(
        `فشل في إنشاء ملف PDF عبر API الخارجي. الخطأ: ${errorMessage}`
      );
    }
  } catch (error) {
    console.error("Error generating reflections PDF:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إنشاء ملف PDF",
      error: error.message,
    });
  }
};

// Download user reflections as PDF (original Puppeteer version - kept for backward compatibility)
const downloadUserReflections = async (req, res) => {
  let browser;
  try {
    const { campId } = req.params;
    const userId = req.user.id;

    // Get user's enrollment - use the most recent enrollment
    const [enrollments] = await db.query(
      `SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ? ORDER BY cohort_number DESC, id DESC LIMIT 1`,
      [userId, campId]
    );

    if (enrollments.length === 0) {
      return res.status(403).json({
        success: false,
        message: "لست مسجلاً في هذا المخيم",
      });
    }

    // Get camp details - explicitly select name to ensure it's retrieved
    const [campData] = await db.query(
      `SELECT id, name, description, surah_name, start_date, duration_days, status FROM quran_camps WHERE id = ?`,
      [campId]
    );

    if (campData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    const camp = campData[0];

    // Debug: Log camp data to verify name exists
    console.log("Camp data:", {
      id: camp.id,
      name: camp.name,
      hasName: !!camp.name,
      nameType: typeof camp.name,
    });

    // Get user details
    const [users] = await db.query(
      `SELECT username, email FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود",
      });
    }

    const user = users[0];

    // Get all reflections for this user and camp, sorted by creation date (oldest first)
    const [reflections] = await db.query(
      `
      SELECT 
        ctp.id,
        ctp.journal_entry,
        ctp.content_rich,
        ctp.created_at,
        ctp.completed_at,
        cdt.title as task_title,
        cdt.day_number,
        cdt.verses_from,
        cdt.verses_to,
        cdt.task_type
      FROM camp_task_progress ctp
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      WHERE ctp.enrollment_id = ? 
        AND ctp.journal_entry IS NOT NULL 
        AND ctp.journal_entry != ''
      ORDER BY ctp.created_at ASC
      `,
      [enrollments[0].id]
    );

    if (reflections.length === 0) {
      return res.status(404).json({
        success: false,
        message: "لا توجد تدبرات متاحة للتصدير",
      });
    }

    // Format ayah reference
    const formatAyahReference = (task) => {
      if (!task.verses_from) return null;
      const surahName = camp.surah_name || "";
      if (task.verses_to && task.verses_to !== task.verses_from) {
        return `${surahName} ${task.verses_from}-${task.verses_to}`;
      }
      return `${surahName} ${task.verses_from}`;
    };

    // Convert rich content JSON to HTML if available
    const getReflectionContent = (reflection) => {
      // Always prefer journal_entry if available (it's the HTML version)
      if (reflection.journal_entry) {
        return reflection.journal_entry;
      }

      // Fallback to content_rich if journal_entry is not available
      if (reflection.content_rich) {
        try {
          const richContent = JSON.parse(reflection.content_rich);
          // If it's a Tiptap JSON structure, extract text
          if (richContent.type === "doc" && richContent.content) {
            // Simple extraction - you might want to use a proper Tiptap HTML renderer
            const extractText = (node) => {
              if (node.type === "text") return node.text || "";
              if (node.content && Array.isArray(node.content)) {
                return node.content.map(extractText).join("");
              }
              return "";
            };
            return extractText(richContent);
          }
          return "";
        } catch (e) {
          return "";
        }
      }
      return "";
    };

    // Escape HTML to prevent XSS and ensure proper rendering
    const escapeHtml = (text) => {
      if (!text) return "";
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    };

    // Clean HTML content - remove potentially problematic characters and ensure valid HTML
    const cleanHtmlContent = (html) => {
      if (!html) return "";
      // Remove null bytes and other control characters except newlines and tabs
      html = html.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, "");
      // Ensure proper encoding
      return html;
    };

    // Build HTML content
    const reflectionsHtml = reflections
      .map((reflection, index) => {
        const ayahRef = formatAyahReference(reflection);
        const content = getReflectionContent(reflection);
        const date = new Date(
          reflection.created_at || reflection.completed_at
        ).toLocaleDateString("ar-SA", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Escape task title for safety
        const safeTaskTitle = escapeHtml(reflection.task_title || "");
        // Clean and sanitize content HTML
        const cleanContent = cleanHtmlContent(content || "");

        return `
          <div class="reflection-card">
            <div class="reflection-header">
              <div class="reflection-number">${index + 1}</div>
              <div class="reflection-meta">
                <span class="reflection-day">اليوم ${
                  reflection.day_number
                }</span>
                ${
                  ayahRef
                    ? `<span class="reflection-ayah">${escapeHtml(
                        ayahRef
                      )}</span>`
                    : ""
                }
                <span class="reflection-date">${date}</span>
              </div>
            </div>
            <div class="reflection-task-title">${safeTaskTitle}</div>
            <div class="reflection-content">${cleanContent}</div>
          </div>
        `;
      })
      .join("");

    // HTML template with Arabic RTL support
    const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <title>تدبرات ${camp.name}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Cairo', 'Arial', sans-serif;
            }
            body {
                font-family: 'Cairo', 'Arial', sans-serif;
                margin: 0;
                padding: 40px;
                line-height: 1.8;
                color: #2c3e50;
                direction: rtl;
                text-align: right;
                background: #ffffff;
                font-size: 14px;
            }
            .header {
                text-align: center;
                margin-bottom: 50px;
                padding: 30px 0;
                border-bottom: 3px solid #4E27B9;
                position: relative;
            }
            .logo-placeholder {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #4E27B9 0%, #3D1F94 100%);
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 32px;
                font-weight: bold;
            }
            .camp-title {
                font-size: 32px;
                font-weight: 700;
                color: #2c3e50;
                margin-bottom: 10px;
                letter-spacing: 0.5px;
            }
            .user-name {
                font-size: 18px;
                color: #4E27B9;
                font-weight: 600;
                margin-top: 10px;
            }
            .reflection-card {
                margin-bottom: 40px;
                padding: 30px;
                border: 2px solid #e9ecef;
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                page-break-inside: avoid;
                border-right: 4px solid #4E27B9;
            }
            .reflection-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #f0f0f0;
            }
            .reflection-number {
                background: linear-gradient(135deg, #4E27B9 0%, #3D1F94 100%);
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 18px;
                flex-shrink: 0;
            }
            .reflection-meta {
                display: flex;
                gap: 15px;
                flex-wrap: wrap;
                flex: 1;
                margin-right: 15px;
            }
            .reflection-day {
                background: #f8f9fa;
                color: #4E27B9;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                border: 1px solid #4E27B9;
            }
            .reflection-ayah {
                background: #fff3e0;
                color: #e65100;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                border: 1px solid #ffb74d;
            }
            .reflection-date {
                color: #7f8c8d;
                font-size: 12px;
                padding: 6px 0;
            }
            .reflection-task-title {
                font-size: 20px;
                font-weight: 700;
                color: #2c3e50;
                margin-bottom: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                border-right: 3px solid #4E27B9;
            }
            .reflection-content {
                color: #2c3e50;
                line-height: 2;
                font-size: 15px;
                padding: 20px;
                background: #fafafa;
                border-radius: 8px;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            .cover-page {
                page-break-after: always;
                height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                padding: 40px;
                background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            }
            .cover-page-title {
                font-size: 48px;
                font-weight: 700;
                color: #2c3e50;
                margin-bottom: 40px;
                letter-spacing: 1px;
                line-height: 1.4;
            }
            .cover-page-cohort {
                font-size: 32px;
                font-weight: 600;
                color: #4E27B9;
                margin-top: 30px;
                padding: 20px 40px;
                border: 3px solid #4E27B9;
                border-radius: 12px;
                background: rgba(78, 39, 185, 0.05);
            }
            .footer {
                text-align: center;
                margin-top: 60px;
                padding: 30px 0;
                border-top: 2px solid #e9ecef;
                color: #7f8c8d;
                font-size: 12px;
            }
            @media print {
                body { 
                    margin: 0; 
                    padding: 20px; 
                }
                .cover-page {
                    page-break-after: always;
                    height: 100vh;
                }
                .reflection-card { 
                    page-break-inside: avoid; 
                    margin-bottom: 30px;
                }
            }
        </style>
    </head>
    <body>
        <div class="cover-page">
            <div class="cover-page-title">${escapeHtml(camp.name)}</div>
            <div class="cover-page-cohort">الفوج الأول</div>
        </div>
        
        <div class="header">
            <div class="camp-title">${camp.name}</div>
            <div class="user-name">تدبرات ${user.username}</div>
        </div>
        
        ${reflectionsHtml}
        
        <div class="footer">
            <div>تم التصدير في ${new Date().toLocaleDateString("ar-SA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</div>
            <div style="margin-top: 10px;">عدد التدبرات: ${
              reflections.length
            }</div>
        </div>
    </body>
    </html>
    `;

    // Launch Puppeteer with channel or executablePath
    // Try to find Chrome in common locations
    const os = require("os");
    const fs = require("fs");
    const { execSync } = require("child_process");
    const platform = os.platform();
    let executablePath = null;

    // Check environment variable first (useful for production servers)
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      console.log("Using PUPPETEER_EXECUTABLE_PATH:", executablePath);
    } else {
      // Common Chrome/Chromium paths
      if (platform === "darwin") {
        // macOS
        const chromePaths = [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ];
        for (const path of chromePaths) {
          if (fs.existsSync(path)) {
            executablePath = path;
            break;
          }
        }
      } else if (platform === "linux") {
        // Linux - more paths for production servers
        const chromePaths = [
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
          "/usr/bin/chromium-chromium",
          "/snap/bin/chromium",
          "/opt/google/chrome/chrome",
          "/opt/google/chrome/google-chrome",
          "/usr/local/bin/chromium",
          "/usr/local/bin/chromium-browser",
          process.env.CHROME_BIN, // Common environment variable
        ].filter(Boolean); // Remove undefined values

        for (const path of chromePaths) {
          if (fs.existsSync(path)) {
            executablePath = path;
            console.log("Found Chrome at:", path);
            break;
          }
        }

        // If not found, try to find it using 'which' command
        if (!executablePath) {
          try {
            const whichChrome = execSync(
              "which google-chrome 2>/dev/null || which chromium-browser 2>/dev/null || which chromium 2>/dev/null",
              {
                encoding: "utf8",
                timeout: 2000,
              }
            ).trim();
            if (whichChrome && fs.existsSync(whichChrome)) {
              executablePath = whichChrome;
              console.log("Found Chrome using 'which':", whichChrome);
            }
          } catch (e) {
            // 'which' command failed, continue with other options
            console.log("Could not find Chrome using 'which' command");
          }
        }
      } else if (platform === "win32") {
        // Windows
        const chromePaths = [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          process.env.LOCALAPPDATA +
            "\\Google\\Chrome\\Application\\chrome.exe",
        ];
        for (const path of chromePaths) {
          if (fs.existsSync(path)) {
            executablePath = path;
            break;
          }
        }
      }
    }

    const launchOptions = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--single-process", // Useful for limited memory environments
      ],
      timeout: 60000,
    };

    // If we have bundled Chromium (from puppeteer), NEVER set executablePath or channel
    // This ensures we use the bundled Chromium
    if (hasBundledChromium) {
      // Explicitly don't set executablePath or channel - use bundled Chromium
      console.log(
        "Using bundled Chromium from puppeteer (no external Chrome needed)"
      );
      // Make sure we don't accidentally use channel or executablePath
      delete launchOptions.executablePath;
      delete launchOptions.channel;
    } else if (executablePath) {
      // Only use executablePath if we're using puppeteer-core
      launchOptions.executablePath = executablePath;
      console.log("Launching Puppeteer with executablePath:", executablePath);
    }

    try {
      browser = await puppeteer.launch(launchOptions);
    } catch (launchError) {
      console.error("Puppeteer launch error:", launchError.message);

      if (hasBundledChromium) {
        // If bundled Chromium failed, there might be missing dependencies
        // Try with more minimal args
        console.log("Retrying with minimal launch options...");
        const minimalOptions = {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--single-process",
          ],
          timeout: 60000,
        };
        try {
          browser = await puppeteer.launch(minimalOptions);
        } catch (minimalError) {
          throw new Error(
            `فشل في تشغيل Chromium المدمج. الخطأ: ${minimalError.message}\n\n` +
              `قد تحتاج إلى تثبيت المكتبات المطلوبة على Ubuntu:\n` +
              `apt-get update && apt-get install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils`
          );
        }
      } else if (!hasBundledChromium) {
        // Using puppeteer-core without Chrome installed
        throw new Error(
          `فشل في تشغيل Chrome. يرجى التأكد من تثبيت Google Chrome أو Chromium على الخادم.\n\n` +
            `الخطأ: ${launchError.message}\n\n` +
            `الحلول:\n` +
            `1. تثبيت Chrome على Ubuntu: apt-get update && apt-get install -y google-chrome-stable\n` +
            `2. أو تثبيت Chromium: apt-get install -y chromium-browser\n` +
            `3. أو استخدام puppeteer العادي بدلاً من puppeteer-core (يأتي مع Chromium المدمج)\n` +
            `4. أو تعيين متغير البيئة: export PUPPETEER_EXECUTABLE_PATH=/path/to/chrome`
        );
      } else {
        throw new Error(`فشل في تشغيل Chrome. الخطأ: ${launchError.message}`);
      }
    }

    const page = await browser.newPage();

    // Set viewport for better rendering
    await page.setViewport({
      width: 1200,
      height: 1600,
    });

    // Set content and wait for fonts to load
    try {
      await page.setContent(htmlContent, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });
    } catch (contentError) {
      console.error("Error setting page content:", contentError);
      // Try with a simpler wait condition
      await page.setContent(htmlContent, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
    }

    // Wait a bit for fonts to fully load (using Promise instead of waitForTimeout)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate PDF
    let pdfBuffer;
    try {
      // Check if page content loaded correctly
      const pageTitle = await page.title();

      pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
          top: "20mm",
          right: "20mm",
          bottom: "20mm",
          left: "20mm",
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: "<div></div>",
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; color: #666; width: 100%; padding: 0 20px;">
            صفحة <span class="pageNumber"></span> من <span class="totalPages"></span>
          </div>
        `,
      });
    } catch (pdfError) {
      console.error("Error generating PDF:", pdfError);
      // Try to get page content for debugging
      try {
        const bodyText = await page.evaluate(() =>
          document.body?.innerText?.substring(0, 200)
        );
        console.log("Page body preview:", bodyText);
      } catch (e) {
        console.error("Could not get page content:", e);
      }
      throw new Error(`فشل في إنشاء PDF: ${pdfError.message}`);
    }

    // Close browser
    await browser.close();

    // Validate PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("فشل في إنشاء ملف PDF - الملف فارغ");
    }

    // Check if it's a valid PDF (starts with PDF magic bytes: %PDF)
    // Convert first 4 bytes to string properly
    const firstBytes = pdfBuffer.slice(0, 4);
    const pdfHeader = String.fromCharCode(...firstBytes);

    if (pdfHeader !== "%PDF") {
      console.error("Invalid PDF header:", pdfHeader);
      console.error("PDF buffer length:", pdfBuffer.length);
      console.error("First 4 bytes (decimal):", Array.from(firstBytes));
      console.error(
        "First 20 bytes as hex:",
        pdfBuffer.slice(0, 20).toString("hex")
      );
      throw new Error(
        `الملف المُنشأ ليس ملف PDF صالح. Header: ${pdfHeader}, Length: ${pdfBuffer.length}`
      );
    }

    // Set response headers
    // Create filename in format: "[اسم المخيم] - تدبري"
    // Remove invalid filename characters but keep Arabic text and spaces
    // Always use camp.name, never fallback to camp.id
    // Ensure we're using the actual name field from database
    const campName = camp && camp.name ? String(camp.name).trim() : "مخيم";

    // Debug log
    console.log("Creating filename with camp name:", campName);

    const campNameSafe = campName.replace(/[<>:"/\\|?*]/g, "_");
    const filename = `${campNameSafe} - تدبري.pdf`;

    // Debug log
    console.log("Final filename:", filename);

    // Create safe ASCII filename for fallback (Content-Disposition filename)
    // Only ASCII characters allowed in the basic filename parameter
    // Convert Arabic to transliteration or use safe characters
    const safeCampName = campName
      .replace(/[^a-zA-Z0-9\s-]/g, "_")
      .trim()
      .replace(/\s+/g, "_");
    // If after removing non-ASCII it's empty, use a generic name
    const finalSafeName = safeCampName || "camp";
    const asciiFilename = `${finalSafeName}_tadabburi.pdf`;

    // Create UTF-8 filename for display (using RFC 5987 encoding)
    const encodedFilename = encodeURIComponent(filename);

    // Set response headers BEFORE sending
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`
    );
    res.setHeader("Content-Length", pdfBuffer.length.toString());
    res.setHeader("Cache-Control", "no-cache");

    // Ensure pdfBuffer is a Buffer
    if (!Buffer.isBuffer(pdfBuffer)) {
      pdfBuffer = Buffer.from(pdfBuffer);
    }

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error("Error generating reflections PDF:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إنشاء ملف PDF",
      error: error.message,
    });
  }
};

// Start cohort (Admin only)
const startCampCohort = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;

    // Verify cohort exists
    const [cohorts] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    if (cohorts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج غير موجود",
      });
    }

    const cohort = cohorts[0];

    if (cohort.status === "active") {
      return res.status(400).json({
        success: false,
        message: "الفوج نشط بالفعل",
      });
    }

    if (cohort.status === "completed" || cohort.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "لا يمكن بدء فوج مكتمل أو ملغى",
      });
    }

    // Check if there's already an active cohort (only one active cohort allowed)
    const [activeCohorts] = await db.query(
      `SELECT cohort_number FROM camp_cohorts 
       WHERE camp_id = ? AND status = 'active' AND cohort_number != ?`,
      [id, cohortNumber]
    );

    if (activeCohorts.length > 0) {
      return res.status(400).json({
        success: false,
        message: `يوجد فوج نشط آخر بالفعل (الفوج رقم ${activeCohorts[0].cohort_number}). يجب إكمال أو إلغاء الفوج النشط قبل بدء فوج جديد`,
        code: "ACTIVE_COHORT_EXISTS",
      });
    }

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

    // Update cohort status, is_open, and start_date to today
    await db.query(
      `UPDATE camp_cohorts SET status = 'active', is_open = 1, start_date = ? WHERE camp_id = ? AND cohort_number = ?`,
      [todayStr, id, cohortNumber]
    );

    // Update camp's current_cohort_number
    await db.query(
      `UPDATE quran_camps SET current_cohort_number = ? WHERE id = ?`,
      [cohortNumber, id]
    );

    // Update camp status to 'active' and start_date to today if it's in 'early_registration' status
    const [campStatus] = await db.query(
      `SELECT status FROM quran_camps WHERE id = ?`,
      [id]
    );
    if (
      campStatus.length > 0 &&
      campStatus[0].status === "early_registration"
    ) {
      await db.query(
        `UPDATE quran_camps SET status = 'active', start_date = ? WHERE id = ?`,
        [todayStr, id]
      );
    } else {
      // حتى لو لم تكن الحالة early_registration، حدث start_date لليوم الحالي
      await db.query(`UPDATE quran_camps SET start_date = ? WHERE id = ?`, [
        todayStr,
        id,
      ]);
    }

    // Send notifications to participants
    const CampNotificationService = require("../services/campNotificationService");
    try {
      // Get camp name
      const [campInfo] = await db.query(
        "SELECT name FROM quran_camps WHERE id = ?",
        [id]
      );
      const campName = campInfo?.name || "المخيم";

      // Get all participants in this cohort
      const [participants] = await db.query(
        `SELECT DISTINCT ce.user_id, u.username, u.email 
         FROM camp_enrollments ce
         JOIN users u ON ce.user_id = u.id
         WHERE ce.camp_id = ? AND ce.cohort_number = ?`,
        [id, cohortNumber]
      );

      // Send notification and email to each participant
      for (const participant of participants) {
        try {
          // Send notification
          await CampNotificationService.sendCampStartedNotification(
            participant.user_id,
            id,
            campName
          );

          // Send email if email exists
          if (participant.email) {
            try {
              await mailService.sendCampStartedEmail(
                participant.email,
                participant.username,
                campName,
                id
              );
            } catch (emailErr) {
              console.error(
                `Failed to send email to user ${participant.user_id}:`,
                emailErr
              );
            }
          }
        } catch (err) {
          console.error(
            `Failed to send notification to user ${participant.user_id}:`,
            err
          );
        }
      }
    } catch (notifError) {
      console.error("Error sending notifications:", notifError);
      // Continue even if notifications fail
    }

    // Note: Email notifications are now sent manually via the admin dashboard
    // Removed automatic email sending on cohort start

    res.json({
      success: true,
      message: "تم بدء الفوج بنجاح",
    });
  } catch (error) {
    console.error("Error starting cohort:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في بدء الفوج",
      error: error.message,
    });
  }
};

// Complete cohort (Admin only)
const completeCampCohort = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;

    // Verify cohort exists
    const [cohorts] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    if (cohorts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج غير موجود",
      });
    }

    const cohort = cohorts[0];

    if (cohort.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "الفوج مكتمل بالفعل",
      });
    }

    // Update cohort status, actual_end_date, and is_open
    await db.query(
      `UPDATE camp_cohorts 
       SET status = 'completed', actual_end_date = CURDATE(), is_open = 0 
       WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    // Send completion notifications
    const CampNotificationService = require("../services/campNotificationService");
    try {
      // Get camp name
      const [campInfo] = await db.query(
        "SELECT name FROM quran_camps WHERE id = ?",
        [id]
      );
      const campName = campInfo[0]?.name || "المخيم";

      // Get all participants in this cohort
      const [participants] = await db.query(
        `SELECT DISTINCT ce.user_id, u.username, u.email 
         FROM camp_enrollments ce
         JOIN users u ON ce.user_id = u.id
         WHERE ce.camp_id = ? AND ce.cohort_number = ?`,
        [id, cohortNumber]
      );

      // Send notification to each participant
      for (const participant of participants) {
        try {
          await CampNotificationService.sendCampFinishedNotification(
            participant.user_id,
            id,
            campName
          );
        } catch (err) {
          console.error(
            `Failed to send notification to user ${participant.user_id}:`,
            err
          );
        }
      }
    } catch (notifError) {
      console.error("Error sending notifications:", notifError);
    }

    res.json({
      success: true,
      message: "تم إكمال الفوج بنجاح",
    });
  } catch (error) {
    console.error("Error completing cohort:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إكمال الفوج",
      error: error.message,
    });
  }
};

// Cancel cohort (Admin only)
const cancelCampCohort = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;

    // Verify cohort exists
    const [cohorts] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    if (cohorts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج غير موجود",
      });
    }

    const cohort = cohorts[0];

    if (cohort.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "لا يمكن إلغاء فوج مكتمل",
      });
    }

    if (cohort.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "الفوج ملغى بالفعل",
      });
    }

    // Update cohort status and is_open
    await db.query(
      `UPDATE camp_cohorts SET status = 'cancelled', is_open = 0 WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    // Notify participants (optional)
    // You can add notification logic here if needed

    res.json({
      success: true,
      message: "تم إلغاء الفوج بنجاح",
    });
  } catch (error) {
    console.error("Error cancelling cohort:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إلغاء الفوج",
      error: error.message,
    });
  }
};

// Open cohort (Admin only) - Set is_open = true
const openCampCohort = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;

    // Verify cohort exists
    const [cohorts] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    if (cohorts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج غير موجود",
      });
    }

    const cohort = cohorts[0];

    if (cohort.is_open === 1) {
      return res.status(400).json({
        success: false,
        message: "الفوج مفتوح بالفعل",
      });
    }

    if (cohort.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "لا يمكن فتح فوج ملغى",
      });
    }

    // Update cohort is_open status
    await db.query(
      `UPDATE camp_cohorts SET is_open = 1 WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    // Update camp's current_cohort_number to this cohort
    await db.query(
      `UPDATE quran_camps SET current_cohort_number = ? WHERE id = ?`,
      [cohortNumber, id]
    );

    // Note: Email notifications are now sent manually via the admin dashboard
    // Removed automatic email sending on cohort open

    res.json({
      success: true,
      message: "تم فتح الفوج بنجاح",
    });
  } catch (error) {
    console.error("Error opening cohort:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في فتح الفوج",
      error: error.message,
    });
  }
};

// Close cohort (Admin only) - Set is_open = false
const closeCampCohort = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;

    // Verify cohort exists
    const [cohorts] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    if (cohorts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج غير موجود",
      });
    }

    const cohort = cohorts[0];

    if (cohort.is_open === 0) {
      return res.status(400).json({
        success: false,
        message: "الفوج مغلق بالفعل",
      });
    }

    // Update cohort is_open status
    await db.query(
      `UPDATE camp_cohorts SET is_open = 0 WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    res.json({
      success: true,
      message: "تم إغلاق الفوج بنجاح",
    });
  } catch (error) {
    console.error("Error closing cohort:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إغلاق الفوج",
      error: error.message,
    });
  }
};

// Get cohort statistics (Admin only)
const getCohortStats = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;

    // Verify cohort exists
    const [cohorts] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    if (cohorts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج غير موجود",
      });
    }

    // Get participants count
    const [participantsCount] = await db.query(
      `SELECT COUNT(*) as count FROM camp_enrollments WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    // Get total tasks count
    const [totalTasks] = await db.query(
      `SELECT COUNT(*) as count FROM camp_daily_tasks WHERE camp_id = ?`,
      [id]
    );

    const totalTasksCount = totalTasks[0]?.count || 0;

    // Get completed tasks count
    const [completedTasks] = await db.query(
      `
      SELECT COUNT(DISTINCT ctp.task_id) as count
      FROM camp_task_progress ctp
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      WHERE ce.camp_id = ? AND ce.cohort_number = ? AND ctp.completed = 1
    `,
      [id, cohortNumber]
    );

    // Get average progress
    // First calculate progress for each user, then get the average
    const [avgProgress] = await db.query(
      `
      SELECT 
        COALESCE(AVG(user_progress), 0) as avg_progress
      FROM (
        SELECT 
          ce.id,
          CASE 
            WHEN ? > 0 THEN (COUNT(DISTINCT ctp.task_id) / ?) * 100
            ELSE 0
          END as user_progress
        FROM camp_enrollments ce
        LEFT JOIN camp_task_progress ctp ON ce.id = ctp.enrollment_id AND ctp.completed = 1
        WHERE ce.camp_id = ? AND ce.cohort_number = ?
        GROUP BY ce.id
      ) as user_progresses
    `,
      [totalTasksCount, totalTasksCount, id, cohortNumber]
    );

    // Get leaderboard top 10
    const [leaderboard] = await db.query(
      `
      SELECT 
        ce.user_id,
        u.username,
        u.avatar_url,
        ce.total_points,
        COUNT(DISTINCT ctp.task_id) as completed_tasks,
        RANK() OVER (ORDER BY ce.total_points DESC) as \`rank\`
      FROM camp_enrollments ce
      JOIN users u ON ce.user_id = u.id
      LEFT JOIN camp_task_progress ctp ON ce.id = ctp.enrollment_id AND ctp.completed = 1
      WHERE ce.camp_id = ? AND ce.cohort_number = ?
      GROUP BY ce.id, ce.user_id, u.username, u.avatar_url, ce.total_points
      ORDER BY ce.total_points DESC
      LIMIT 10
    `,
      [id, cohortNumber]
    );

    // Get daily completion rate (last 7 days)
    const [dailyStats] = await db.query(
      `
      SELECT 
        DATE(ctp.completed_at) as date,
        COUNT(DISTINCT ctp.id) as completions
      FROM camp_task_progress ctp
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      WHERE ce.camp_id = ? 
        AND ce.cohort_number = ? 
        AND ctp.completed = 1
        AND ctp.completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(ctp.completed_at)
      ORDER BY date DESC
    `,
      [id, cohortNumber]
    );

    res.json({
      success: true,
      data: {
        participants_count: participantsCount[0]?.count || 0,
        total_tasks: totalTasksCount,
        completed_tasks: completedTasks[0]?.count || 0,
        average_progress: avgProgress[0]?.avg_progress || 0,
        leaderboard: leaderboard || [],
        daily_completion_rate: dailyStats || [],
      },
    });
  } catch (error) {
    console.error("Error fetching cohort stats:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب إحصائيات الفوج",
      error: error.message,
    });
  }
};

// Get cohorts comparison (Admin only)
const getCohortsComparison = async (req, res) => {
  try {
    const { id } = req.params;

    // Get all cohorts with their stats (excluding supervisors)
    const [cohorts] = await db.query(
      `
      SELECT 
        cc.*,
        COUNT(DISTINCT CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM camp_supervisors cs 
            WHERE cs.camp_id = ce.camp_id 
            AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
            AND cs.user_id = ce.user_id
          ) THEN ce.id
        END) as participants_count,
        COUNT(DISTINCT CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM camp_supervisors cs 
            WHERE cs.camp_id = ce.camp_id 
            AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
            AND cs.user_id = ce.user_id
          ) THEN ctp.id
        END) as completed_tasks_count,
        AVG(CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM camp_supervisors cs 
            WHERE cs.camp_id = ce.camp_id 
            AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
            AND cs.user_id = ce.user_id
          ) THEN ce.total_points
        END) as avg_points
      FROM camp_cohorts cc
      LEFT JOIN camp_enrollments ce ON cc.camp_id = ce.camp_id AND cc.cohort_number = ce.cohort_number
      LEFT JOIN camp_task_progress ctp ON ce.id = ctp.enrollment_id AND ctp.completed = 1
      WHERE cc.camp_id = ?
      GROUP BY cc.id
      ORDER BY cc.cohort_number ASC
    `,
      [id]
    );

    res.json({
      success: true,
      data: cohorts.map((cohort) => ({
        ...cohort,
        settings: cohort.settings ? JSON.parse(cohort.settings) : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching cohorts comparison:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب مقارنة الأفواج",
      error: error.message,
    });
  }
};

// Get cohort participants (Admin only)
const getCohortParticipants = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;
    const { page = 1, limit = 50, search, status } = req.query;

    // Verify admin access
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية للوصول إلى هذه البيانات",
      });
    }

    // Verify cohort exists
    const cohortExists = await campParticipantService.verifyCohortExists(
      id,
      parseInt(cohortNumber)
    );
    if (!cohortExists) {
      return res.status(404).json({
        success: false,
        message: "الفوج غير موجود",
      });
    }

    const result = await campParticipantService.getParticipants({
      campId: id,
      cohortNumber: parseInt(cohortNumber),
      filters: { status, search },
      pagination: { page: parseInt(page), limit: parseInt(limit) },
      includeSupervisors: false,
    });

    res.json({
      success: true,
      data: result.participants,
      pagination: {
        ...result.pagination,
        totalPages: result.pagination.pages,
      },
    });
  } catch (error) {
    console.error("Error fetching cohort participants:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب المشتركين",
      error: error.message,
    });
  }
};

// Get cohort participants for admin (Admin only) - includes supervisors
const getCohortParticipantsForAdmin = async (req, res) => {
  try {
    const { id, cohortNumber = 1 } = req.params;
    const { page = 1, limit = 50, search, status } = req.query;

    // Verify admin access
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية للوصول إلى هذه البيانات",
      });
    }

    // Verify cohort exists
    const cohortExists = await campParticipantService.verifyCohortExists(
      id,
      parseInt(cohortNumber)
    );
    if (!cohortExists) {
      return res.status(404).json({
        success: false,
        message: "الفوج غير موجود",
      });
    }

    // Admin endpoint - include all participants including supervisors
    const result = await campParticipantService.getParticipants({
      campId: id,
      cohortNumber: parseInt(cohortNumber),
      filters: { status, search },
      pagination: { page: parseInt(page), limit: parseInt(limit) },
      includeSupervisors: true, // Include supervisors for admin view
    });

    res.json({
      success: true,
      data: result.participants,
      pagination: {
        ...result.pagination,
        totalPages: result.pagination.pages,
      },
    });
  } catch (error) {
    console.error("Error fetching cohort participants for admin:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب المشتركين",
      error: error.message,
    });
  }
};

// Migrate user between cohorts (Admin only)
const migrateUserBetweenCohorts = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;
    const { user_id, target_cohort_number } = req.body;

    if (!user_id || !target_cohort_number) {
      return res.status(400).json({
        success: false,
        message: "user_id و target_cohort_number مطلوبان",
      });
    }

    // Verify source cohort exists
    const [sourceCohort] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    if (sourceCohort.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج المصدر غير موجود",
      });
    }

    // Verify target cohort exists
    const [targetCohort] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, target_cohort_number]
    );

    if (targetCohort.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج الهدف غير موجود",
      });
    }

    // Check if user is enrolled in source cohort
    const [enrollment] = await db.query(
      `SELECT * FROM camp_enrollments WHERE camp_id = ? AND user_id = ? AND cohort_number = ?`,
      [id, user_id, cohortNumber]
    );

    if (enrollment.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير مسجل في الفوج المصدر",
      });
    }

    // Check if user is already enrolled in target cohort
    const [existingEnrollment] = await db.query(
      `SELECT * FROM camp_enrollments WHERE camp_id = ? AND user_id = ? AND cohort_number = ?`,
      [id, user_id, target_cohort_number]
    );

    if (existingEnrollment.length > 0) {
      return res.status(400).json({
        success: false,
        message: "المستخدم مسجل بالفعل في الفوج الهدف",
      });
    }

    // Start transaction
    await db.query("START TRANSACTION");

    try {
      // Update enrollment cohort_number
      await db.query(
        `UPDATE camp_enrollments SET cohort_number = ? WHERE camp_id = ? AND user_id = ? AND cohort_number = ?`,
        [target_cohort_number, id, user_id, cohortNumber]
      );

      // Update friendships cohort_number
      await db.query(
        `UPDATE camp_friendships SET cohort_number = ? WHERE camp_id = ? AND (user_id = ? OR friend_id = ?) AND cohort_number = ?`,
        [target_cohort_number, id, user_id, user_id, cohortNumber]
      );

      // Update Q&A cohort_number
      await db.query(
        `UPDATE camp_qanda SET cohort_number = ? WHERE camp_id = ? AND user_id = ? AND cohort_number = ?`,
        [target_cohort_number, id, user_id, cohortNumber]
      );

      // Note: camp_task_progress is linked via enrollment_id, so it will automatically follow

      // Update participants count (triggers should handle this, but we'll do it manually to be safe)
      await db.query(
        `UPDATE camp_cohorts SET current_participants = GREATEST(current_participants - 1, 0) WHERE camp_id = ? AND cohort_number = ?`,
        [id, cohortNumber]
      );
      await db.query(
        `UPDATE camp_cohorts SET current_participants = current_participants + 1 WHERE camp_id = ? AND cohort_number = ?`,
        [id, target_cohort_number]
      );

      await db.query("COMMIT");

      res.json({
        success: true,
        message: "تم نقل المستخدم بنجاح",
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error migrating user:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في نقل المستخدم",
      error: error.message,
    });
  }
};

// Bulk migrate users between cohorts (Admin only)
const bulkMigrateUsersBetweenCohorts = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;
    const { user_ids, target_cohort_number } = req.body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "user_ids يجب أن يكون مصفوفة غير فارغة",
      });
    }

    if (!target_cohort_number) {
      return res.status(400).json({
        success: false,
        message: "target_cohort_number مطلوب",
      });
    }

    // Verify cohorts exist
    const [sourceCohort] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    if (sourceCohort.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج المصدر غير موجود",
      });
    }

    const [targetCohort] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, target_cohort_number]
    );

    if (targetCohort.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج الهدف غير موجود",
      });
    }

    // Start transaction
    await db.query("START TRANSACTION");

    try {
      let migratedCount = 0;
      const placeholders = user_ids.map(() => "?").join(",");

      // Update enrollments
      const [updateResult] = await db.query(
        `UPDATE camp_enrollments 
         SET cohort_number = ? 
         WHERE camp_id = ? AND user_id IN (${placeholders}) AND cohort_number = ?`,
        [target_cohort_number, id, ...user_ids, cohortNumber]
      );
      migratedCount = updateResult.affectedRows;

      // Update friendships
      await db.query(
        `UPDATE camp_friendships 
         SET cohort_number = ? 
         WHERE camp_id = ? AND (user_id IN (${placeholders}) OR friend_id IN (${placeholders})) AND cohort_number = ?`,
        [target_cohort_number, id, ...user_ids, ...user_ids, cohortNumber]
      );

      // Update Q&A
      await db.query(
        `UPDATE camp_qanda 
         SET cohort_number = ? 
         WHERE camp_id = ? AND user_id IN (${placeholders}) AND cohort_number = ?`,
        [target_cohort_number, id, ...user_ids, cohortNumber]
      );

      // Update participants count
      await db.query(
        `UPDATE camp_cohorts SET current_participants = GREATEST(current_participants - ?, 0) WHERE camp_id = ? AND cohort_number = ?`,
        [migratedCount, id, cohortNumber]
      );
      await db.query(
        `UPDATE camp_cohorts SET current_participants = current_participants + ? WHERE camp_id = ? AND cohort_number = ?`,
        [migratedCount, id, target_cohort_number]
      );

      await db.query("COMMIT");

      res.json({
        success: true,
        message: `تم نقل ${migratedCount} مستخدم بنجاح`,
        data: {
          migrated_count: migratedCount,
        },
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error bulk migrating users:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في نقل المستخدمين",
      error: error.message,
    });
  }
};

// Get scheduled cohorts (Admin only)
const getScheduledCohorts = async (req, res) => {
  try {
    const { id } = req.params;

    const [cohorts] = await db.query(
      `SELECT * FROM camp_cohorts 
       WHERE camp_id = ? AND status = 'scheduled' 
       ORDER BY start_date ASC`,
      [id]
    );

    res.json({
      success: true,
      data: cohorts.map((cohort) => ({
        ...cohort,
        settings: cohort.settings ? JSON.parse(cohort.settings) : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching scheduled cohorts:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب الأفواج المجدولة",
      error: error.message,
    });
  }
};

// Schedule cohort (Admin only)
const scheduleCampCohort = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;
    const { start_date } = req.body;

    if (!start_date) {
      return res.status(400).json({
        success: false,
        message: "start_date مطلوب",
      });
    }

    const startDate = new Date(start_date);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "تاريخ البدء غير صحيح",
      });
    }

    // Verify cohort exists
    const [cohorts] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    if (cohorts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج غير موجود",
      });
    }

    // Update start_date and status
    await db.query(
      `UPDATE camp_cohorts 
       SET start_date = ?, status = 'scheduled' 
       WHERE camp_id = ? AND cohort_number = ?`,
      [start_date, id, cohortNumber]
    );

    res.json({
      success: true,
      message: "تم جدولة الفوج بنجاح",
    });
  } catch (error) {
    console.error("Error scheduling cohort:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جدولة الفوج",
      error: error.message,
    });
  }
};

// Start a new cohort for a camp (Admin only) - Keep for backward compatibility
// This function now uses the new camp_cohorts table
const startNewCohort = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, status } = req.body;

    // Get camp details
    const [camps] = await db.query(
      `SELECT *, COALESCE(current_cohort_number, 1) as current_cohort_number, COALESCE(total_cohorts, 1) as total_cohorts, duration_days FROM quran_camps WHERE id = ?`,
      [id]
    );

    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    const camp = camps[0];

    // Check if camp is in a valid state to start a new cohort
    if (camp.status !== "completed" && camp.status !== "reopened") {
      return res.status(400).json({
        success: false,
        message: "لا يمكن بدء فوج جديد إلا للمخيمات المنتهية أو المفتوحة",
      });
    }

    // Get next cohort number
    const [maxCohort] = await db.query(
      `SELECT MAX(cohort_number) as max_cohort FROM camp_cohorts WHERE camp_id = ?`,
      [id]
    );
    const newCohortNumber =
      (maxCohort[0]?.max_cohort || camp.current_cohort_number || 0) + 1;
    const newTotalCohorts = (camp.total_cohorts || 1) + 1;

    // Validate start_date if provided
    let newStartDate = start_date || camp.start_date;
    if (start_date) {
      const startDateObj = new Date(start_date);
      if (isNaN(startDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: "تاريخ البدء غير صحيح",
        });
      }
      newStartDate = start_date;
    }

    // Calculate end_date
    let newEndDate = null;
    if (camp.duration_days) {
      const endDateObj = new Date(newStartDate);
      endDateObj.setDate(endDateObj.getDate() + camp.duration_days);
      newEndDate = endDateObj.toISOString().split("T")[0];
    }

    // Determine new status
    let newStatus = status || "early_registration";
    if (!["early_registration", "active"].includes(newStatus)) {
      newStatus = "early_registration";
    }

    // Determine is_open based on status
    // If status is 'active', set is_open = 1, otherwise 0
    const isOpen = newStatus === "active" ? 1 : 0;

    // Create new cohort in camp_cohorts table
    const [cohortResult] = await db.query(
      `
      INSERT INTO camp_cohorts (
        camp_id, cohort_number, start_date, end_date, status, created_by, is_open
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        newCohortNumber,
        newStartDate,
        newEndDate,
        newStatus,
        req.user?.id || null,
        isOpen,
      ]
    );

    // Delete all old friendships from previous cohorts when starting a new cohort
    // This ensures that users start fresh with no friends in the new cohort
    await db.query(
      `DELETE FROM camp_friendships 
       WHERE camp_id = ? AND cohort_number < ?`,
      [id, newCohortNumber]
    );

    // Update camp with new cohort information (only current_cohort_number and total_cohorts)
    // Don't update start_date or status to keep cohorts independent
    await db.query(
      `UPDATE quran_camps 
       SET current_cohort_number = ?, 
           total_cohorts = ?
       WHERE id = ?`,
      [newCohortNumber, newTotalCohorts, id]
    );

    res.json({
      success: true,
      message: `تم بدء الفوج رقم ${newCohortNumber} بنجاح`,
      data: {
        camp_id: id,
        cohort_number: newCohortNumber,
        total_cohorts: newTotalCohorts,
        start_date: newStartDate,
        status: newStatus,
        cohort_id: cohortResult.insertId,
      },
    });
  } catch (error) {
    console.error("Error starting new cohort:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في بدء الفوج الجديد",
      error: error.message,
    });
  }
};

// ==================== COHORTS MANAGEMENT APIs ====================

// Get all cohorts for a camp (Admin only)
const getCampCohorts = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 50, sort = "cohort_number" } = req.query;

    // Verify camp exists
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

    let query = `
      SELECT 
        cc.*,
        COUNT(DISTINCT CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM camp_supervisors cs 
            WHERE cs.camp_id = ce.camp_id 
            AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
            AND cs.user_id = ce.user_id
          ) THEN ce.id
        END) as participants_count,
        COUNT(DISTINCT CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM camp_supervisors cs 
            WHERE cs.camp_id = ce.camp_id 
            AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
            AND cs.user_id = ce.user_id
          ) AND ctp.completed = 1 THEN ctp.id
        END) as completed_tasks_count
      FROM camp_cohorts cc
      LEFT JOIN camp_enrollments ce ON cc.camp_id = ce.camp_id AND cc.cohort_number = ce.cohort_number
      LEFT JOIN camp_task_progress ctp ON ce.id = ctp.enrollment_id
      WHERE cc.camp_id = ?
    `;
    const params = [id];

    if (status) {
      query += ` AND cc.status = ?`;
      params.push(status);
    }

    query += ` GROUP BY cc.id`;

    // Sorting
    const validSorts = ["cohort_number", "start_date", "status", "created_at"];
    const sortField = validSorts.includes(sort) ? sort : "cohort_number";
    const sortOrder = sortField === "cohort_number" ? "ASC" : "DESC";
    query += ` ORDER BY cc.${sortField} ${sortOrder}`;

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [cohorts] = await db.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM camp_cohorts WHERE camp_id = ?`;
    const countParams = [id];
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: cohorts.map((cohort) => ({
        ...cohort,
        settings: cohort.settings ? JSON.parse(cohort.settings) : null,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching camp cohorts:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب الأفواج",
      error: error.message,
    });
  }
};

// Get available cohorts for a camp (Public - open or active cohorts)
const getAvailableCohorts = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    // Verify camp exists
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

    // Get all available cohorts (open or active/early_registration)
    // Do NOT include supervisor information (hidden from regular users)
    // Exclude supervisors from participants_count
    const [cohorts] = await db.query(
      `
      SELECT 
        cc.*,
        COUNT(DISTINCT CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM camp_supervisors cs 
            WHERE cs.camp_id = ce.camp_id 
            AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
            AND cs.user_id = ce.user_id
          ) THEN ce.id
        END) as participants_count,
        CASE 
          WHEN cc.status = 'active' THEN 'نشط'
          WHEN cc.status = 'early_registration' THEN 'التسجيل المبكر'
          WHEN cc.status = 'scheduled' THEN 'مجدول'
          WHEN cc.status = 'completed' THEN 'منتهي'
          WHEN cc.status = 'cancelled' THEN 'ملغي'
          ELSE 'غير محدد'
        END as status_ar,
        CASE
          WHEN cc.is_open = 1 THEN 'مفتوح'
          ELSE 'مغلق'
        END as open_status_ar
      FROM camp_cohorts cc
      LEFT JOIN camp_enrollments ce ON cc.camp_id = ce.camp_id AND cc.cohort_number = ce.cohort_number
      WHERE cc.camp_id = ? 
        AND (cc.is_open = 1 OR cc.status IN ('early_registration', 'active' , 'scheduled'))
      GROUP BY cc.id
      ORDER BY cc.cohort_number DESC
    `,
      [id]
    );

    // Check if user is enrolled in any cohort
    let userEnrollments = [];
    if (userId) {
      const [enrollments] = await db.query(
        `SELECT cohort_number FROM camp_enrollments 
         WHERE camp_id = ? AND user_id = ?`,
        [id, userId]
      );
      userEnrollments = enrollments.map((e) => e.cohort_number);
    }

    const cohortsWithEnrollment = cohorts.map((cohort) => ({
      ...cohort,
      is_enrolled: userEnrollments.includes(cohort.cohort_number),
      settings: cohort.settings ? JSON.parse(cohort.settings) : null,
    }));

    res.json({
      success: true,
      data: cohortsWithEnrollment,
    });
  } catch (error) {
    console.error("Error fetching available cohorts:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب الأفواج المتاحة",
      error: error.message,
    });
  }
};

// Get user's current cohort for a camp
const getMyCohort = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "يجب تسجيل الدخول",
      });
    }

    // Get user's enrollment
    const [enrollments] = await db.query(
      `SELECT ce.*, cc.*
       FROM camp_enrollments ce
       JOIN camp_cohorts cc ON ce.camp_id = cc.camp_id AND ce.cohort_number = cc.cohort_number
       WHERE ce.camp_id = ? AND ce.user_id = ?
       ORDER BY ce.cohort_number DESC
       LIMIT 1`,
      [id, userId]
    );

    if (enrollments.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: "لم يتم التسجيل في هذا المخيم",
      });
    }

    const enrollment = enrollments[0];
    enrollment.settings = enrollment.settings
      ? JSON.parse(enrollment.settings)
      : null;

    res.json({
      success: true,
      data: enrollment,
    });
  } catch (error) {
    console.error("Error fetching user cohort:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب فوجك",
      error: error.message,
    });
  }
};

// Get single cohort details (Admin only)
const getCampCohort = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;

    const [cohorts] = await db.query(
      `
      SELECT 
        cc.*,
        qc.name as camp_name,
        qc.duration_days,
        COUNT(DISTINCT CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM camp_supervisors cs 
            WHERE cs.camp_id = ce.camp_id 
            AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
            AND cs.user_id = ce.user_id
          ) THEN ce.id
        END) as participants_count,
        COUNT(DISTINCT CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM camp_supervisors cs 
            WHERE cs.camp_id = ce.camp_id 
            AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
            AND cs.user_id = ce.user_id
          ) AND ctp.completed = 1 THEN ctp.id
        END) as completed_tasks_count,
        COUNT(DISTINCT cdt.id) as total_tasks_count
      FROM camp_cohorts cc
      JOIN quran_camps qc ON cc.camp_id = qc.id
      LEFT JOIN camp_enrollments ce ON cc.camp_id = ce.camp_id AND cc.cohort_number = ce.cohort_number
      LEFT JOIN camp_task_progress ctp ON ce.id = ctp.enrollment_id
      LEFT JOIN camp_daily_tasks cdt ON qc.id = cdt.camp_id
      WHERE cc.camp_id = ? AND cc.cohort_number = ?
      GROUP BY cc.id
    `,
      [id, cohortNumber]
    );

    if (cohorts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج غير موجود",
      });
    }

    const cohort = cohorts[0];
    cohort.settings = cohort.settings ? JSON.parse(cohort.settings) : null;

    res.json({
      success: true,
      data: cohort,
    });
  } catch (error) {
    console.error("Error fetching cohort:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب تفاصيل الفوج",
      error: error.message,
    });
  }
};

// Create new cohort (Admin only)
const createCampCohort = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      start_date,
      end_date,
      max_participants,
      settings,
      status = "scheduled",
      is_open = 0,
      announcement_message,
      send_email_to_subscribers = false,
    } = req.body;
    const userId = req.user.id;

    // Verify camp exists
    const [camps] = await db.query(
      "SELECT id, name, duration_days FROM quran_camps WHERE id = ?",
      [id]
    );
    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    const camp = camps[0];

    // Validate dates
    if (!start_date) {
      return res.status(400).json({
        success: false,
        message: "تاريخ البدء مطلوب",
      });
    }

    // Ensure start_date is in YYYY-MM-DD format (date only, no time)
    let normalizedStartDate = start_date;
    if (start_date.includes("T")) {
      normalizedStartDate = start_date.split("T")[0];
    }

    const startDate = new Date(normalizedStartDate);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "تاريخ البدء غير صحيح",
      });
    }

    // Normalize to YYYY-MM-DD format
    normalizedStartDate = startDate.toISOString().split("T")[0];

    // Calculate end_date if not provided
    let calculatedEndDate = end_date;
    if (!calculatedEndDate && camp.duration_days) {
      const endDateObj = new Date(startDate);
      endDateObj.setDate(endDateObj.getDate() + camp.duration_days);
      calculatedEndDate = endDateObj.toISOString().split("T")[0];
    } else if (calculatedEndDate && calculatedEndDate.includes("T")) {
      calculatedEndDate = calculatedEndDate.split("T")[0];
    }

    // Get next cohort number
    const [maxCohort] = await db.query(
      `SELECT MAX(cohort_number) as max_cohort FROM camp_cohorts WHERE camp_id = ?`,
      [id]
    );
    const nextCohortNumber = (maxCohort[0]?.max_cohort || 0) + 1;

    // Prevent creating active or early_registration cohort if there's already an active one
    // Allow scheduled cohorts even if there's an active cohort
    if (status === "active" || status === "early_registration") {
      const [activeCohorts] = await db.query(
        `SELECT cohort_number FROM camp_cohorts 
         WHERE camp_id = ? AND status = 'active'`,
        [id]
      );

      if (activeCohorts.length > 0) {
        return res.status(400).json({
          success: false,
          message: `يوجد فوج نشط بالفعل (الفوج رقم ${activeCohorts[0].cohort_number}). يجب إكمال أو إلغاء الفوج النشط قبل إنشاء فوج جديد بنشط أو تسجيل مبكر. يمكنك إنشاء فوج مجدول (scheduled) بدلاً من ذلك`,
          code: "ACTIVE_COHORT_EXISTS",
        });
      }
    }

    // Check for date conflicts with other cohorts
    // تعارض يحدث إذا كان هناك تداخل في الفترات الزمنية:
    // الفوج الجديد يبدأ قبل انتهاء فوج موجود AND ينتهي بعد بدء فوج موجود
    if (calculatedEndDate) {
      const [conflicts] = await db.query(
        `
        SELECT cohort_number, start_date, end_date 
        FROM camp_cohorts 
        WHERE camp_id = ? 
          AND status NOT IN ('cancelled', 'completed')
          AND (
            -- الفوج الموجود يبدأ قبل انتهاء الفوج الجديد
            DATE(start_date) < DATE(?)
            AND
            -- الفوج الموجود ينتهي بعد بدء الفوج الجديد (أو لا يوجد تاريخ انتهاء)
            (end_date IS NULL OR DATE(end_date) > DATE(?))
          )
        `,
        [id, calculatedEndDate, normalizedStartDate]
      );

      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: "يوجد تعارض في التواريخ مع أفواج أخرى",
          conflicts: conflicts,
        });
      }
    }

    // Determine is_open value (from request or default to 0)
    const cohortIsOpen = is_open === 1 || is_open === true ? 1 : 0;

    // Prepare settings with announcement_message
    let cohortSettings = settings || {};
    if (announcement_message) {
      cohortSettings.announcement_message = announcement_message;
    }

    // Insert new cohort
    const [result] = await db.query(
      `
      INSERT INTO camp_cohorts (
        camp_id, cohort_number, name, start_date, end_date, 
        status, max_participants, settings, created_by, is_open
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        nextCohortNumber,
        name || null,
        normalizedStartDate,
        calculatedEndDate || null,
        status,
        max_participants || null,
        Object.keys(cohortSettings).length > 0
          ? JSON.stringify(cohortSettings)
          : null,
        userId,
        cohortIsOpen,
      ]
    );

    // Update total_cohorts in quran_camps
    await db.query(`UPDATE quran_camps SET total_cohorts = ? WHERE id = ?`, [
      nextCohortNumber,
      id,
    ]);

    // Update current_cohort_number only (don't update start_date or status)
    // This allows each cohort to have its own start date independent of camp
    if (
      nextCohortNumber === 1 ||
      status === "early_registration" ||
      status === "active"
    ) {
      await db.query(
        `UPDATE quran_camps 
         SET current_cohort_number = ?
         WHERE id = ?`,
        [nextCohortNumber, id]
      );
    }

    // Fetch created cohort
    const [newCohort] = await db.query(
      `SELECT * FROM camp_cohorts WHERE id = ?`,
      [result.insertId]
    );

    // Send emails to subscribers if requested
    let emailsSent = 0;
    if (
      send_email_to_subscribers === true ||
      send_email_to_subscribers === "true"
    ) {
      try {
        // Get all active subscribers (subscription_type = 'cohorts' or 'both')
        const [subscribers] = await db.query(
          `SELECT email, unsubscribe_token 
           FROM camp_notification_subscribers 
           WHERE is_active = 1 
             AND (subscription_type = 'cohorts' OR subscription_type = 'both')`
        );

        // Get camp details for email
        const [campDetails] = await db.query(
          `SELECT name, share_link FROM quran_camps WHERE id = ?`,
          [id]
        );
        const campName = campDetails[0]?.name || camp.name;
        const campShareLink = campDetails[0]?.share_link || id;

        // Send email to each subscriber
        for (const subscriber of subscribers) {
          try {
            await mailService.sendCohortOpenedEmail(
              subscriber.email,
              campName,
              campShareLink,
              nextCohortNumber,
              subscriber.unsubscribe_token,
              announcement_message
            );
            emailsSent++;
          } catch (emailError) {
            console.error(
              `Error sending email to ${subscriber.email}:`,
              emailError
            );
          }
        }
      } catch (emailError) {
        console.error("Error sending cohort announcement emails:", emailError);
        // Don't fail the request if email sending fails
      }
    }

    // Notify supervisors about new cohort creation
    const supervisorNotificationResult =
      await campManagementService.notifySupervisorsOnCohortCreation({
        campId: id,
        cohortNumber: nextCohortNumber,
        startDate: normalizedStartDate,
        endDate: calculatedEndDate,
        announcementMessage: announcement_message,
        createdBy: userId,
      });

    res.status(201).json({
      success: true,
      message: "تم إنشاء الفوج بنجاح",
      data: {
        ...newCohort[0],
        settings: newCohort[0].settings
          ? JSON.parse(newCohort[0].settings)
          : null,
      },
      emails_sent: emailsSent,
      supervisor_emails_sent: supervisorNotificationResult.supervisorEmailsSent,
      supervisor_emails_failed:
        supervisorNotificationResult.supervisorEmailsFailed,
    });
  } catch (error) {
    console.error("Error creating cohort:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إنشاء الفوج",
      error: error.message,
    });
  }
};

// Update cohort (Admin only)
const updateCampCohort = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;
    const {
      name,
      start_date,
      end_date,
      max_participants,
      settings,
      status,
      notes,
      is_open,
    } = req.body;

    // Verify cohort exists
    const [cohorts] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    if (cohorts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج غير موجود",
      });
    }

    const cohort = cohorts[0];
    const oldStatus = cohort.status;
    const oldIsOpen = cohort.is_open;

    // Prevent updating active or completed cohorts (except for notes and settings)
    if (cohort.status === "completed") {
      if (start_date || end_date || status) {
        return res.status(400).json({
          success: false,
          message: "لا يمكن تعديل التواريخ أو الحالة للفوج النشط أو المكتمل",
        });
      }
    }

    // Validate dates if provided
    if (start_date) {
      const startDate = new Date(start_date);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "تاريخ البدء غير صحيح",
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name || null);
    }
    if (start_date !== undefined) {
      updates.push("start_date = ?");
      params.push(start_date);
    }
    if (end_date !== undefined) {
      updates.push("end_date = ?");
      params.push(end_date || null);
    }
    if (max_participants !== undefined) {
      updates.push("max_participants = ?");
      params.push(max_participants || null);
    }
    if (settings !== undefined) {
      updates.push("settings = ?");
      params.push(settings ? JSON.stringify(settings) : null);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      params.push(status);
    }
    if (notes !== undefined) {
      updates.push("notes = ?");
      params.push(notes || null);
    }
    if (is_open !== undefined) {
      updates.push("is_open = ?");
      params.push(is_open === 1 || is_open === true ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "لا توجد بيانات للتحديث",
      });
    }

    params.push(id, cohortNumber);

    await db.query(
      `UPDATE camp_cohorts SET ${updates.join(
        ", "
      )} WHERE camp_id = ? AND cohort_number = ?`,
      params
    );

    // Fetch updated cohort
    const [updatedCohort] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    const newStatus = status !== undefined ? status : oldStatus;
    const newIsOpen =
      is_open !== undefined
        ? is_open === 1 || is_open === true
          ? 1
          : 0
        : oldIsOpen;

    // Send email notifications if cohort becomes available for registration
    // Check if status changed to early_registration/active OR is_open changed to 1
    const statusChangedToAvailable =
      (newStatus === "early_registration" || newStatus === "active") &&
      oldStatus !== "early_registration" &&
      oldStatus !== "active";
    const openedForRegistration = newIsOpen === 1 && oldIsOpen === 0;

    if (statusChangedToAvailable || openedForRegistration) {
      try {
        const [campInfo] = await db.query(
          "SELECT name FROM quran_camps WHERE id = ?",
          [id]
        );
        const campName = campInfo[0]?.name || "المخيم";

        const campNotificationController = require("./campNotificationController");
        await campNotificationController.sendCohortOpenedNotification(
          id,
          cohortNumber,
          campName
        );
      } catch (emailListError) {
        console.error(
          "Error sending cohort opened emails to subscribers:",
          emailListError
        );
        // Continue even if email list notifications fail
      }
    }

    res.json({
      success: true,
      message: "تم تحديث الفوج بنجاح",
      data: {
        ...updatedCohort[0],
        settings: updatedCohort[0].settings
          ? JSON.parse(updatedCohort[0].settings)
          : null,
      },
    });
  } catch (error) {
    console.error("Error updating cohort:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديث الفوج",
      error: error.message,
    });
  }
};

// Delete cohort (Admin only)
const deleteCampCohort = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;
    const { migrateToCohort, deleteParticipants } = req.query;

    // Verify cohort exists
    const [cohorts] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    if (cohorts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج غير موجود",
      });
    }

    const cohort = cohorts[0];

    // Check if cohort has participants
    const [participants] = await db.query(
      `SELECT COUNT(*) as count FROM camp_enrollments WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );
    const participantCount = participants[0].count;

    // Prevent deletion of active cohorts
    if (cohort.status === "active") {
      return res.status(400).json({
        success: false,
        message: "لا يمكن حذف فوج نشط. يرجى إكماله أو إلغاؤه أولاً",
      });
    }

    // Handle participants
    if (participantCount > 0) {
      if (migrateToCohort) {
        // Migrate participants to another cohort
        await db.query(
          `UPDATE camp_enrollments SET cohort_number = ? WHERE camp_id = ? AND cohort_number = ?`,
          [migrateToCohort, id, cohortNumber]
        );

        // Update participants count in target cohort
        await db.query(
          `UPDATE camp_cohorts 
           SET current_participants = current_participants + ? 
           WHERE camp_id = ? AND cohort_number = ?`,
          [participantCount, id, migrateToCohort]
        );
      } else if (deleteParticipants === "true") {
        // Delete participants (cascade will handle related data)
        await db.query(
          `DELETE FROM camp_enrollments WHERE camp_id = ? AND cohort_number = ?`,
          [id, cohortNumber]
        );
      } else {
        return res.status(400).json({
          success: false,
          message: `يوجد ${participantCount} مشترك في هذا الفوج. يرجى تحديد migrateToCohort أو deleteParticipants=true`,
        });
      }
    }

    // Delete cohort
    await db.query(
      `DELETE FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    res.json({
      success: true,
      message: "تم حذف الفوج بنجاح",
    });
  } catch (error) {
    console.error("Error deleting cohort:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في حذف الفوج",
      error: error.message,
    });
  }
};

const getCampInteractions = async (req, res) => {
  try {
    const { id } = req.params;
    const { cohort_number } = req.query;

    // التحقق من وجود المخيم
    const [camps] = await db.query(
      `SELECT id, name FROM quran_camps WHERE id = ?`,
      [id]
    );

    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    // Get cohort number from query or use current cohort
    let cohortNumber;
    if (cohort_number) {
      cohortNumber = parseInt(cohort_number);
    } else {
      cohortNumber = await getCurrentCohortNumber(id);
    }

    // جلب جميع المهمات المكتملة مع معلومات المستخدمين مقسمة بالأيام
    const [interactions] = await db.query(
      `
      SELECT 
        cdt.day_number,
        cdt.id as task_id,
        cdt.title as task_title,
        cdt.description as task_description,
        cdt.task_type,
        ctp.completed_at,
        u.id as user_id,
        u.username,
        ce.id as enrollment_id
      FROM camp_daily_tasks cdt
      INNER JOIN camp_task_progress ctp ON cdt.id = ctp.task_id
      INNER JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      INNER JOIN users u ON ce.user_id = u.id
      WHERE cdt.camp_id = ?
        AND ce.cohort_number = ?
        AND ctp.completed = true
      ORDER BY cdt.day_number ASC, ctp.completed_at ASC
      `,
      [id, cohortNumber]
    );

    // تنظيم البيانات حسب الأيام
    const interactionsByDay = {};

    interactions.forEach((interaction) => {
      const dayNumber = interaction.day_number;

      if (!interactionsByDay[dayNumber]) {
        interactionsByDay[dayNumber] = {
          day_number: dayNumber,
          tasks: {},
        };
      }

      const taskId = interaction.task_id;
      if (!interactionsByDay[dayNumber].tasks[taskId]) {
        interactionsByDay[dayNumber].tasks[taskId] = {
          task_id: taskId,
          task_title: interaction.task_title,
          task_description: interaction.task_description,
          task_type: interaction.task_type,
          completions: [],
        };
      }

      interactionsByDay[dayNumber].tasks[taskId].completions.push({
        user_id: interaction.user_id,
        username: interaction.username,
        completed_at: interaction.completed_at,
      });
    });

    // تحويل الكائن إلى مصفوفة
    const result = Object.keys(interactionsByDay)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((dayNumber) => ({
        day_number: parseInt(dayNumber),
        tasks: Object.values(interactionsByDay[dayNumber].tasks),
      }));

    res.json({
      success: true,
      data: result,
      total_days: result.length,
      total_interactions: interactions.length,
    });
  } catch (error) {
    console.error("Error getting camp interactions:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب تفاصيل التفاعلات",
      error: error.message,
    });
  }
};

// ==================== SUPERVISORS MANAGEMENT APIs ====================

// Get camp supervisors (Admin only)
const getCampSupervisors = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;
    const cohortNum = cohortNumber || req.query.cohortNumber;

    const result = await campManagementService.getCampSupervisors({
      campId: id,
      cohortNumber: cohortNum,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in getCampSupervisors:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب المشرفين",
    });
  }
};

// Add camp supervisor (Admin only)
const addCampSupervisor = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;
    const { userId } = req.body;
    const createdBy = req.user.id;

    const result = await campManagementService.addCampSupervisor({
      campId: id,
      userId,
      createdBy,
      cohortNumber,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in addCampSupervisor:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إضافة المشرف",
    });
  }
};

// Remove camp supervisor (Admin only)
const removeCampSupervisor = async (req, res) => {
  try {
    const { id, userId, cohortNumber } = req.params;
    const cohortNum = cohortNumber || req.query.cohortNumber;

    const result = await campManagementService.removeCampSupervisor({
      campId: id,
      userId,
      cohortNumber: cohortNum,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in removeCampSupervisor:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إزالة المشرف",
    });
  }
};

// Note: isSupervisor helper is now imported from utils/permissionsHelper

// Get cohort participants for supervisor (Supervisor only)
const getSupervisorCohortParticipants = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50, search, status } = req.query;

    // Verify user is supervisor for this cohort
    const accessInfo = await verifyAccess(id, req.user, parseInt(cohortNumber));
    if (!accessInfo.hasAccess) {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية للوصول إلى هذا الفوج",
      });
    }

    // Verify cohort exists
    const cohortExists = await campParticipantService.verifyCohortExists(
      id,
      parseInt(cohortNumber)
    );
    if (!cohortExists) {
      return res.status(404).json({
        success: false,
        message: "الفوج غير موجود",
      });
    }

    // Get participants (excluding supervisors)
    const result = await campParticipantService.getParticipants({
      campId: id,
      cohortNumber: parseInt(cohortNumber),
      filters: { status, search },
      pagination: { page: parseInt(page), limit: parseInt(limit) },
      includeSupervisors: false,
    });

    res.json({
      success: true,
      data: result.participants,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching supervisor cohort participants:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب المشتركين",
      error: error.message,
    });
  }
};

// Remove participant from cohort (Supervisor only)
const removeParticipantFromCohort = async (req, res) => {
  try {
    const { id, cohortNumber, userId } = req.params;
    const supervisorId = req.user.id;

    // Verify user is supervisor for this cohort
    const isSupervisorForCohort = await isSupervisor(
      id,
      supervisorId,
      cohortNumber
    );
    if (!isSupervisorForCohort) {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية لإزالة المشتركين من هذا الفوج",
      });
    }

    // Verify enrollment exists
    const [enrollments] = await db.query(
      `SELECT id FROM camp_enrollments 
       WHERE camp_id = ? AND cohort_number = ? AND user_id = ?`,
      [id, cohortNumber, userId]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المشترك غير موجود في هذا الفوج",
      });
    }

    // Remove enrollment
    await db.query(
      `DELETE FROM camp_enrollments 
       WHERE camp_id = ? AND cohort_number = ? AND user_id = ?`,
      [id, cohortNumber, userId]
    );

    res.json({
      success: true,
      message: "تم إزالة المشترك من الفوج بنجاح",
    });
  } catch (error) {
    console.error("Error removing participant from cohort:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إزالة المشترك",
      error: error.message,
    });
  }
};

// Migrate participant to another cohort (Supervisor only)
const migrateParticipantBySupervisor = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;
    const { user_id, target_cohort_number } = req.body;
    const supervisorId = req.user.id;

    // Verify user is supervisor for this cohort
    const isSupervisorForCohort = await isSupervisor(
      id,
      supervisorId,
      cohortNumber
    );
    if (!isSupervisorForCohort) {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية لنقل المشتركين من هذا الفوج",
      });
    }

    // Verify target cohort exists
    const [targetCohorts] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, target_cohort_number]
    );

    if (targetCohorts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج الهدف غير موجود",
      });
    }

    // Verify enrollment exists in source cohort
    const [enrollments] = await db.query(
      `SELECT id FROM camp_enrollments 
       WHERE camp_id = ? AND cohort_number = ? AND user_id = ?`,
      [id, cohortNumber, user_id]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المشترك غير موجود في هذا الفوج",
      });
    }

    // Check if user is already enrolled in target cohort
    const [existingEnrollments] = await db.query(
      `SELECT id FROM camp_enrollments 
       WHERE camp_id = ? AND cohort_number = ? AND user_id = ?`,
      [id, target_cohort_number, user_id]
    );

    if (existingEnrollments.length > 0) {
      return res.status(400).json({
        success: false,
        message: "المشترك مسجل بالفعل في الفوج الهدف",
      });
    }

    // ========================================
    // البدأ بعملية النقل مع حذف التقدم القديم
    // ========================================

    // 1. حذف التقدم اليومي في الفوج القديم (daily_tasks_progress)
    await db.query(
      `DELETE FROM daily_tasks_progress 
       WHERE camp_id = ? AND cohort_number = ? AND user_id = ?`,
      [id, cohortNumber, user_id]
    );

    // 2. حذف التقدم العام (camp_progress)
    await db.query(
      `DELETE FROM camp_progress 
       WHERE camp_id = ? AND cohort_number = ? AND user_id = ?`,
      [id, cohortNumber, user_id]
    );

    // 3. حذف الـ streaks
    await db.query(
      `DELETE FROM camp_streaks 
       WHERE camp_id = ? AND cohort_number = ? AND user_id = ?`,
      [id, cohortNumber, user_id]
    );

    // 4. حذف الصداقات القديمة - محصورة في الفوج القديم
    // (سيحتاج المستخدم إعادة بناء صداقاته في الفوج الجديد)
    const user1Id = user_id; // سنستخدمها في الحالتين
    await db.query(
      `DELETE FROM camp_friendships 
       WHERE camp_id = ? AND cohort_number = ? 
       AND (user1_id = ? OR user2_id = ?)`,
      [id, cohortNumber, user1Id, user1Id]
    );

    // 5. حذف طلبات الصداقة المعلقة المرتبطة بالفوج القديم
    await db.query(
      `DELETE FROM friend_requests 
       WHERE camp_id = ? 
       AND (sender_id = ? OR receiver_id = ?) 
       AND status = 'pending'`,
      [id, user_id, user_id]
    );

    // 6. تحديث cohort_number في enrollment (النقل الفعلي)
    await db.query(
      `UPDATE camp_enrollments 
       SET cohort_number = ? 
       WHERE camp_id = ? AND cohort_number = ? AND user_id = ?`,
      [target_cohort_number, id, cohortNumber, user_id]
    );

    // 7. إنشاء سجل progress جديد في الفوج الجديد (البدء من الصفر)
    await db.query(
      `INSERT INTO camp_progress (camp_id, cohort_number, user_id, points, completed_tasks)
       VALUES (?, ?, ?, 0, 0)
       ON DUPLICATE KEY UPDATE points = 0, completed_tasks = 0`,
      [id, target_cohort_number, user_id]
    );

    res.json({
      success: true,
      message: `تم نقل المشترك إلى الفوج ${target_cohort_number} بنجاح مع إعادة تعيين تقدمه وصداقاته`,
    });
  } catch (error) {
    console.error("Error migrating participant:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في نقل المشترك",
      error: error.message,
    });
  }
};

// Get cohort statistics for supervisor (Supervisor only)
const getSupervisorCohortStats = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;
    const userId = req.user.id;

    // Verify user is supervisor for this cohort
    const isSupervisorForCohort = await isSupervisor(id, userId, cohortNumber);
    if (!isSupervisorForCohort) {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية للوصول إلى إحصائيات هذا الفوج",
      });
    }

    // Verify cohort exists
    const [cohorts] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );

    if (cohorts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج غير موجود",
      });
    }

    // Get total tasks count
    const [totalTasksResult] = await db.query(
      `SELECT COUNT(*) as total FROM camp_daily_tasks WHERE camp_id = ?`,
      [id]
    );
    const totalTasks = totalTasksResult[0].total || 1;

    // Get statistics - use subqueries to calculate properly (excluding supervisors)
    const [statsResult] = await db.query(
      `
      SELECT 
        COUNT(DISTINCT ce.id) as total_participants,
        COUNT(DISTINCT CASE WHEN ce.status = 'active' THEN ce.id END) as active_participants,
        COUNT(DISTINCT CASE WHEN ce.status = 'completed' THEN ce.id END) as completed_participants,
        COALESCE(AVG(
          CASE 
            WHEN task_counts.completed_count > 0 
            THEN (task_counts.completed_count / ?) * 100 
            ELSE 0 
          END
        ), 0) as average_progress,
        COALESCE(AVG(ce.total_points), 0) as average_points
      FROM camp_enrollments ce
      LEFT JOIN (
        SELECT 
          enrollment_id,
          COUNT(DISTINCT id) as completed_count
        FROM camp_task_progress
        WHERE completed = 1
        GROUP BY enrollment_id
      ) task_counts ON ce.id = task_counts.enrollment_id
      WHERE ce.camp_id = ? AND ce.cohort_number = ?
      AND NOT EXISTS (
        SELECT 1 FROM camp_supervisors cs 
        WHERE cs.camp_id = ce.camp_id 
        AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
        AND cs.user_id = ce.user_id
      )
    `,
      [totalTasks, id, cohortNumber]
    );

    const result = {
      total_participants: statsResult[0]?.total_participants || 0,
      active_participants: statsResult[0]?.active_participants || 0,
      completed_participants: statsResult[0]?.completed_participants || 0,
      average_progress: parseFloat(statsResult[0]?.average_progress || 0),
      average_points: parseFloat(statsResult[0]?.average_points || 0),
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching supervisor cohort stats:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب الإحصائيات",
      error: error.message,
    });
  }
};

// Send cohort notification email manually (Admin only)
// Send cohort announcement email to subscribers (Admin only)
const sendCohortAnnouncement = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;
    const { announcement_message } = req.body;

    // Verify camp exists
    const [camps] = await db.query(
      "SELECT id, name, share_link FROM quran_camps WHERE id = ?",
      [id]
    );
    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    // Verify cohort exists
    const [cohorts] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );
    if (cohorts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج غير موجود",
      });
    }

    const camp = camps[0];
    const cohort = cohorts[0];
    const campName = camp.name;
    const campShareLink = camp.share_link || id;

    // Get announcement message from cohort settings or use provided one
    let message = announcement_message;
    if (!message && cohort.settings) {
      const settings = JSON.parse(cohort.settings);
      message = settings.announcement_message;
    }

    // Get all active subscribers (subscription_type = 'cohorts' or 'both')
    const [subscribers] = await db.query(
      `SELECT email, unsubscribe_token 
       FROM camp_notification_subscribers 
       WHERE is_active = 1 
         AND (subscription_type = 'cohorts' OR subscription_type = 'both')`
    );

    if (subscribers.length === 0) {
      return res.json({
        success: true,
        message: "لا يوجد مشتركين نشطين لإرسال الإيميلات لهم",
        emails_sent: 0,
      });
    }

    // Send email to each subscriber
    let emailsSent = 0;
    let emailsFailed = 0;
    const errors = [];

    for (const subscriber of subscribers) {
      try {
        await mailService.sendCohortOpenedEmail(
          subscriber.email,
          campName,
          campShareLink,
          cohortNumber,
          subscriber.unsubscribe_token,
          message
        );
        emailsSent++;
      } catch (emailError) {
        emailsFailed++;
        errors.push({
          email: subscriber.email,
          error: emailError.message,
        });
        console.error(
          `Error sending email to ${subscriber.email}:`,
          emailError
        );
      }
    }

    res.json({
      success: true,
      message: `تم إرسال ${emailsSent} إيميل بنجاح`,
      emails_sent: emailsSent,
      emails_failed: emailsFailed,
      total_subscribers: subscribers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error sending cohort announcement:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إرسال الإعلان",
      error: error.message,
    });
  }
};

const sendCohortNotification = async (req, res) => {
  try {
    const { id, cohortNumber } = req.params;

    // Verify camp exists
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

    // Verify cohort exists
    const [cohorts] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [id, cohortNumber]
    );
    if (cohorts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الفوج غير موجود",
      });
    }

    const camp = camps[0];
    const campNotificationController = require("./campNotificationController");

    // Send notification
    await campNotificationController.sendCohortOpenedNotification(
      id,
      cohortNumber,
      camp.name
    );

    res.json({
      success: true,
      message: "تم إرسال الإشعار بنجاح",
    });
  } catch (error) {
    console.error("Error sending cohort notification:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إرسال الإشعار",
      error: error.message,
    });
  }
};

// Export study hall content to Excel (Admin only)
const exportStudyHallFawaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { cohort_number } = req.query;
    const ExcelJS = require("exceljs");

    // Get camp details
    const [camps] = await db.query(
      `SELECT name FROM quran_camps WHERE id = ?`,
      [id]
    );
    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }
    // const campName = camps[0].name;

    // Get cohort number
    let cohortNumber = cohort_number
      ? parseInt(cohort_number)
      : await getCurrentCohortNumber(id);

    // Query all matching content without pagination
    let query = `
      SELECT 
        cdt.day_number,
        cdt.title as task_title,
        CASE 
            WHEN ctp.journal_entry IS NOT NULL AND ctp.journal_entry != '' THEN 'تدبر'
            ELSE 'فائدة'
        END as type,
        COALESCE(NULLIF(ctp.journal_entry, ''), NULLIF(ctp.notes, '')) as content,
        u.username,
        u.email,
        ctp.completed_at,
        ctp.upvote_count,
        ctp.save_count
      FROM camp_task_progress ctp
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN users u ON ce.user_id = u.id
      WHERE cdt.camp_id = ?
        AND ce.cohort_number = ?
        AND ctp.completed = 1
        AND (ctp.journal_entry IS NOT NULL AND ctp.journal_entry != '' 
             OR ctp.notes IS NOT NULL AND ctp.notes != '')
        AND (ctp.is_private IS NULL OR ctp.is_private = false)
      ORDER BY cdt.day_number ASC, ctp.completed_at DESC
    `;

    const [rows] = await db.query(query, [id, cohortNumber]);

    // Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("الفوائد والتدبرات");

    // Setup Columns
    worksheet.columns = [
      { header: "اليوم", key: "day", width: 10 },
      { header: "النوع", key: "type", width: 15 },
      { header: "عنوان المهمة", key: "task", width: 30 },
      { header: "المحتوى", key: "content", width: 60 },
      { header: "المشارك", key: "username", width: 20 },
      { header: "البريد الإلكتروني", key: "email", width: 30 },
      { header: "التاريخ", key: "date", width: 20 },
      { header: "الإعجابات", key: "upvotes", width: 10 },
      { header: "الحفظ", key: "saves", width: 10 },
    ];

    // Style Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4F46E5" }, // Indigo color
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

    // Function to strip HTML tags
    const stripHtml = (html) => {
      if (!html) return "";
      return html
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    };

    // Add Data
    rows.forEach((row) => {
      const cleanContent = stripHtml(row.content);
      const rowData = worksheet.addRow({
        day: `اليوم ${row.day_number}`,
        type: row.type,
        task: row.task_title,
        content: cleanContent,
        username: row.username,
        email: row.email,
        date: new Date(row.completed_at).toLocaleDateString("ar-SA"),
        upvotes: row.upvote_count || 0,
        saves: row.save_count || 0,
      });

      // Style content cells to wrap text
      rowData.getCell("content").alignment = { wrapText: true };
    });

    // Response Headers for File Download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="StudyHall_Camp${id}_Cohort${cohortNumber}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting study hall content:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تصدير الملف",
      error: error.message,
    });
  }
};

// ==================== DAILY TESTS CONTROLLERS ====================

// Create or update daily test (Admin only)
const createDailyTest = async (req, res) => {
  try {
    const { id } = req.params; // camp_id
    const { day_number, title, description, points, is_active, questions } =
      req.body;

    if (!day_number || !title) {
      return res.status(400).json({
        success: false,
        message: "رقم اليوم والعنوان مطلوبان",
      });
    }

    // Check admin access
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بإنشاء الاختبارات",
      });
    }

    const result = await campTestService.createDailyTest({
      campId: parseInt(id),
      dayNumber: parseInt(day_number),
      testData: {
        title,
        description,
        points: points || 0,
        is_active: is_active !== undefined ? is_active : true,
        questions: questions || [],
      },
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error creating daily test:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إنشاء الاختبار",
      error: error.message,
    });
  }
};

// Get all daily tests for a camp (Admin only - list without full details)
const getAllDailyTests = async (req, res) => {
  try {
    const { id } = req.params;

    // Check admin access
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بجلب الاختبارات",
      });
    }

    const result = await campTestService.getAllDailyTests({
      campId: parseInt(id),
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error getting all daily tests:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الاختبارات",
      error: error.message,
    });
  }
};

// Get daily test (Admin only - with all details)
const getDailyTest = async (req, res) => {
  try {
    const { id, dayNumber } = req.params;

    // Check admin access
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بجلب الاختبارات",
      });
    }

    const result = await campTestService.getDailyTest({
      campId: parseInt(id),
      dayNumber: parseInt(dayNumber),
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error getting daily test:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الاختبار",
      error: error.message,
    });
  }
};

// Delete daily test (Admin only)
const deleteDailyTest = async (req, res) => {
  try {
    const { id, dayNumber } = req.params;

    // Check admin access
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بحذف الاختبارات",
      });
    }

    // Get test ID
    const [tests] = await db.query(
      `SELECT id FROM camp_daily_tests WHERE camp_id = ? AND day_number = ?`,
      [id, dayNumber]
    );

    if (tests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الاختبار غير موجود",
      });
    }

    const testId = tests[0].id;

    // Delete test (cascade will delete questions, answers, attempts, responses)
    await db.query(`DELETE FROM camp_daily_tests WHERE id = ?`, [testId]);

    res.json({
      success: true,
      message: "تم حذف الاختبار بنجاح",
    });
  } catch (error) {
    console.error("Error deleting daily test:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء حذف الاختبار",
      error: error.message,
    });
  }
};

// Get test for user (without correct answers if not submitted)
const getTestForUser = async (req, res) => {
  try {
    const { id, dayNumber } = req.params;
    const userId = req.user.id;

    // Get test ID
    const [tests] = await db.query(
      `SELECT id FROM camp_daily_tests 
       WHERE camp_id = ? AND day_number = ? AND is_active = true`,
      [id, dayNumber]
    );

    if (tests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الاختبار غير موجود أو غير نشط",
      });
    }

    const result = await campTestService.getTestForUser({
      testId: tests[0].id,
      userId,
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error getting test for user:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الاختبار",
      error: error.message,
    });
  }
};

// Submit test attempt
const submitTest = async (req, res) => {
  try {
    const { id, dayNumber } = req.params;
    const userId = req.user.id;
    const { responses } = req.body;

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        message: "يجب إرسال قائمة بالإجابات",
      });
    }

    // Get test ID
    const [tests] = await db.query(
      `SELECT id FROM camp_daily_tests 
       WHERE camp_id = ? AND day_number = ? AND is_active = true`,
      [id, dayNumber]
    );

    if (tests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الاختبار غير موجود أو غير نشط",
      });
    }

    const testId = tests[0].id;

    // Get user enrollment
    const [enrollments] = await db.query(
      `SELECT id FROM camp_enrollments 
       WHERE user_id = ? AND camp_id = ? 
       ORDER BY cohort_number DESC, id DESC 
       LIMIT 1`,
      [userId, id]
    );

    if (enrollments.length === 0) {
      return res.status(403).json({
        success: false,
        message: "غير مسجل في هذا المخيم",
      });
    }

    // Get attempt (must exist and not be submitted)
    const [attempts] = await db.query(
      `SELECT id, submitted_at FROM camp_test_attempts 
       WHERE test_id = ? AND enrollment_id = ?`,
      [testId, enrollments[0].id]
    );

    if (attempts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "لم يتم فتح هذا الاختبار بعد",
      });
    }

    const attempt = attempts[0];

    // Check if already submitted
    if (attempt.submitted_at) {
      return res.status(400).json({
        success: false,
        message: "تم حل هذا الاختبار مسبقاً",
      });
    }

    const attemptId = attempt.id;

    const result = await campTestService.submitTestAttempt({
      attemptId,
      responses,
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error submitting test:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إرسال الاختبار",
      error: error.message,
    });
  }
};

// Get test results
const getTestResults = async (req, res) => {
  try {
    const { id, dayNumber } = req.params;
    const userId = req.user.id;

    // Get test ID
    const [tests] = await db.query(
      `SELECT id FROM camp_daily_tests 
       WHERE camp_id = ? AND day_number = ?`,
      [id, dayNumber]
    );

    if (tests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الاختبار غير موجود",
      });
    }

    const testId = tests[0].id;

    // Get user enrollment
    const [enrollments] = await db.query(
      `SELECT id FROM camp_enrollments 
       WHERE user_id = ? AND camp_id = ? 
       ORDER BY cohort_number DESC, id DESC 
       LIMIT 1`,
      [userId, id]
    );

    if (enrollments.length === 0) {
      return res.status(403).json({
        success: false,
        message: "غير مسجل في هذا المخيم",
      });
    }

    // Get attempt
    const [attempts] = await db.query(
      `SELECT id FROM camp_test_attempts 
       WHERE test_id = ? AND enrollment_id = ?`,
      [testId, enrollments[0].id]
    );

    if (attempts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "لم يتم حل هذا الاختبار بعد",
      });
    }

    const result = await campTestService.getTestResults({
      attemptId: attempts[0].id,
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error getting test results:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب النتائج",
      error: error.message,
    });
  }
};

// Check if test is available (should open)
const checkTestAvailability = async (req, res) => {
  try {
    const { id, dayNumber } = req.params;
    const userId = req.user.id;

    const result = await campTestService.checkIfTestShouldOpen({
      campId: parseInt(id),
      dayNumber: parseInt(dayNumber),
      userId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error checking test availability:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء التحقق من الاختبار",
      error: error.message,
    });
  }
};

// Get test statistics (Admin only)
const getTestStatistics = async (req, res) => {
  try {
    const { id, dayNumber } = req.params;

    // Check admin access
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بجلب إحصائيات الاختبارات",
      });
    }

    // Get test ID
    const [tests] = await db.query(
      `SELECT id FROM camp_daily_tests 
       WHERE camp_id = ? AND day_number = ?`,
      [id, dayNumber]
    );

    if (tests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الاختبار غير موجود",
      });
    }

    const testId = tests[0].id;

    const result = await campTestService.getTestStatistics({
      testId: testId,
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error getting test statistics:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب إحصائيات الاختبار",
      error: error.message,
    });
  }
};

// Get user attempt details (Admin only)
const getUserAttemptDetails = async (req, res) => {
  try {
    const { attemptId } = req.params;

    // Check admin access
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بجلب تفاصيل المحاولات",
      });
    }

    const result = await campTestService.getTestResults({
      attemptId: parseInt(attemptId),
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error getting user attempt details:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب تفاصيل المحاولة",
      error: error.message,
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
  getCampDayChallenges,
  upsertCampDayChallenge,
  deleteCampDayChallenge,
  getAdminStats,
  getCampParticipants,
  getCampAnalytics,
  updateCampStatus,
  deleteCamp,
  getCampDetailsForAdmin,
  leaveCamp,
  duplicateCamp,
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
  // User management function
  removeUserFromCamp,
  getUserDetails,
  getUserCampProgress,
  uploadTaskAttachment,
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
  // Shared Reflections
  getSharedReflection,
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
  // Cohorts Management
  startNewCohort,
  getCampCohorts,
  getAvailableCohorts,
  getMyCohort,
  getCampCohort,
  createCampCohort,
  updateCampCohort,
  deleteCampCohort,

  // Supervisors APIs
  getCampSupervisors,
  addCampSupervisor,
  removeCampSupervisor,
  isSupervisor,
  getSupervisorCohortParticipants,
  removeParticipantFromCohort,
  migrateParticipantBySupervisor,
  getSupervisorCohortStats,
  startCampCohort,
  completeCampCohort,
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
  // Send cohort announcement manually
  sendCohortAnnouncement,
  // Study Hall Content Management (Admin)
  getAdminStudyHallContent,
  updateStudyHallContent,
  deleteStudyHallContent,
  exportStudyHallFawaid, // Add this
  // Export
  exportCampData,
  // Daily Messages
  getCampDailyMessages,
  createDailyMessage,
  updateDailyMessage,
  deleteDailyMessage,
  // Tasks Import/Export
  exportCampTasks,
  importCampTasks,
  getCampInteractions,
  // Reflections Export
  downloadUserReflections,
  downloadReflectionsPDF,
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
  getDailyTest,
  getTestForUser,
  submitTest,
  getTestResults,
  checkTestAvailability,
  deleteDailyTest,
  getTestStatistics,
  getAllDailyTests,
  getUserAttemptDetails,
};
