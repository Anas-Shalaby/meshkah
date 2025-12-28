const db = require("../config/database");
const campParticipantService = require("./campParticipantService");

// Helper function to translate cohort status to Arabic
function getStatusAr(status) {
  switch(status) {
    case 'scheduled': return 'قريباً';
    case 'early_registration': return 'قريباً';
    case 'active': return 'نشط';
    case 'completed': return 'منتهي';
    case 'cancelled': return 'ملغى';
    default: return status;
  }
}

const getCampDetails = async ({campId , userId}) => {
    try {
          // دعم جلب التفاصيل عبر share_link أو id رقمي
    const isShareLink = isNaN(Number(campId));
    const whereClause = isShareLink ? "qc.share_link = ?" : "qc.id = ?";

    const [camps] = await db.query(
      `
  SELECT 
    qc.*,
    qc.start_date,
    qc.tags,
    DATE_ADD(qc.start_date, INTERVAL qc.duration_days DAY) as end_date
  FROM quran_camps qc
  WHERE ${whereClause}
  `,
      [campId]
    );


    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المخيم غير موجود",
      });
    }

    // Get current cohort number
    const currentCohortNumber = await campParticipantService.getCurrentCohortNumber(campId);

    // Get cohort details including start_date and end_date
    const [cohorts] = await db.query(
      `SELECT 
         start_date,
         end_date,
         status, 
         is_open
       FROM camp_cohorts 
       WHERE camp_id = ? AND cohort_number = ?`,
      [campId, currentCohortNumber]
    );

    // Use cohort dates if available, otherwise fallback to camp dates
    const cohortStartDate =
      cohorts.length > 0 && cohorts[0].start_date
        ? cohorts[0].start_date
        : camps[0].start_date;

    const cohortEndDate =
      cohorts.length > 0 && cohorts[0].end_date
        ? cohorts[0].end_date
        : camps[0].end_date;

    // Get enrollment count for current cohort (excluding supervisors)
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
      [campId, currentCohortNumber]
    );

    // Check if user is supervisor (allows full access without enrollment)
    let isSupervisor = false;
    let supervisorCohortNumber = null;
    if (userId) {
      const [supervisorCheck] = await db.query(
        `SELECT cohort_number FROM camp_supervisors 
         WHERE camp_id = ? AND user_id = ? AND (
           cohort_number = ? OR cohort_number IS NULL
         )
         LIMIT 1`,
        [campId, userId, currentCohortNumber]
      );
      if (supervisorCheck.length > 0) {
        isSupervisor = true;
        supervisorCohortNumber = supervisorCheck[0].cohort_number;
      }
    }

    // Check if user is enrolled in current cohort
    let isEnrolled = 0;
    if (userId) {
      const [enrollment] = await db.query(
        `SELECT 1 FROM camp_enrollments 
         WHERE camp_id = ? AND user_id = ? AND cohort_number = ? 
         LIMIT 1`,
        [campId, userId, currentCohortNumber]
      );
      isEnrolled = enrollment.length > 0 ? 1 : 0;
    }

    // Get available cohorts (without supervisor information - hidden from regular users)
    // Exclude supervisors from participants_count
    const [availableCohorts] = await db.query(
      `SELECT 
        cc.cohort_number,
        cc.start_date,
        cc.end_date,
        cc.status,
        cc.is_open,
        cc.max_participants,
        COUNT(DISTINCT CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM camp_supervisors cs 
            WHERE cs.camp_id = ce.camp_id 
            AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
            AND cs.user_id = ce.user_id
          ) THEN ce.id
        END) as participants_count
       FROM camp_cohorts cc
       LEFT JOIN camp_enrollments ce ON cc.camp_id = ce.camp_id AND cc.cohort_number = ce.cohort_number
       WHERE cc.camp_id = ? 
         AND (cc.is_open = 1 OR cc.status IN ('early_registration', 'active' , 'scheduled'))
       GROUP BY cc.id
       ORDER BY cc.cohort_number DESC`,
      [campId]
    );

    // Use cohort status if available, otherwise default to 'completed'
    const cohortStatus = cohorts.length > 0 ? cohorts[0].status : 'completed';
    const isReadOnly = cohortStatus === 'completed' || cohortStatus === 'cancelled';

    const camp = {
      ...camps[0],
      current_cohort_number: currentCohortNumber,
      status: cohortStatus, // Use cohort status instead of camp status
      status_ar: getStatusAr(cohortStatus), // Translate cohort status
      is_read_only: isReadOnly,
      enrolled_count: enrollCount[0]?.count || 0,
      is_enrolled: Boolean(isEnrolled),
      start_date: cohortStartDate, // Use cohort start date
      tags: camps[0].tags
        ? camps[0].tags.split(",").map((tag) => tag.trim())
        : [],
      end_date: cohortEndDate, // Use cohort end date
      enable_public_enrollment: Boolean(camps[0].enable_public_enrollment),
      available_cohorts: availableCohorts.map((cohort) => ({
        cohort_number: cohort.cohort_number,
        start_date: cohort.start_date,
        end_date: cohort.end_date,
        status: cohort.status,
        is_open: Boolean(cohort.is_open),
        max_participants: cohort.max_participants,
        participants_count: cohort.participants_count,
        // Do NOT include supervisor information (hidden from regular users)
      })),
    };
    let joinedLate = false;
    let missedDaysCount = 0;
    let nowDayNumber = 1;

    // حساب اليوم الحالي بالنسبة لبدء الفوج (1..duration_days)
    try {
      if (camp.start_date && camp.duration_days) {
        const start = new Date(camp.start_date); // This is now cohort start_date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
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
        WHERE user_id = ? AND camp_id = ? AND cohort_number = ?
      `,
        [userId, campId, currentCohortNumber]
      );

      if (enrollment.length > 0) {
        const enrollmentDate = new Date(
          enrollment[0].enrollment_date || enrollment[0].created_at
        );
        const cohortStartDate = new Date(camp.start_date); // This is now cohort start_date
        const enrollmentDateByMonthAndYear = enrollmentDate
          .toISOString()
          .slice(0, 10);
        const cohortStartDateByMonthAndYear = cohortStartDate
          .toISOString()
          .slice(0, 10);

        if (enrollmentDateByMonthAndYear > cohortStartDateByMonthAndYear) {
          joinedLate = true;
          const diffTime = enrollmentDate - cohortStartDate;
          missedDaysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }
    }

    return {
        ...camp,
        joined_late: joinedLate,
        missed_days_count: missedDaysCount,
        now_day_number: nowDayNumber,
        is_supervisor: isSupervisor, // Flag to indicate supervisor access
        supervisor_cohort_number: supervisorCohortNumber,
    }
    } catch (error) {
        console.log(error);
        throw error;
    }
}
const getCampDetailsForAdmin = async ({campId})=> {
    try {
        // 1. جلب تفاصيل المخيم مع حساب end_date
            const [campRows] = await db.query(
              `SELECT 
                qc.*,
                DATE_FORMAT(qc.start_date, '%Y-%m-%d') as start_date_fmt,
                DATE_FORMAT(DATE_ADD(qc.start_date, INTERVAL qc.duration_days DAY), '%Y-%m-%d') as end_date_fmt
              FROM quran_camps qc
              WHERE qc.id = ?`,
              [campId]
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
        
            // Get current cohort number from camp_cohorts
            const currentCohortNumber = await campParticipantService.getCurrentCohortNumber(campId);
        
            // 2. جلب إحصائيات المخيم (للفوج الحالي فقط)
            // Exclude supervisors from enrollment count
            const [enrollmentsCount] = await db.query(
              `SELECT COUNT(*) as count 
               FROM camp_enrollments ce
               WHERE ce.camp_id = ? AND ce.cohort_number = ?
               AND NOT EXISTS (
                 SELECT 1 FROM camp_supervisors cs 
                 WHERE cs.camp_id = ce.camp_id 
                 AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
                 AND cs.user_id = ce.user_id
               )`,
              [campId, currentCohortNumber]
            );
        
            // Get supervisors count (admin only)
            const [supervisorsCount] = await db.query(
              `SELECT COUNT(*) as count 
               FROM camp_supervisors 
               WHERE camp_id = ? 
               AND (cohort_number = ? OR cohort_number IS NULL)`,
              [campId, currentCohortNumber]
            );
        
            const [tasksCount] = await db.query(
              "SELECT COUNT(*) as count FROM camp_daily_tasks WHERE camp_id = ?",
              [campId]
            );
        
            const [completedTasksCount] = await db.query(
              "SELECT COUNT(*) as count FROM camp_task_progress ctp JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id WHERE ce.camp_id = ? AND ce.cohort_number = ? AND ctp.completed = 1",
              [campId, currentCohortNumber]
            );
        
            // Note: points column doesn't exist in camp_enrollments, skipping points calculation
            const totalPoints = [{ total: 0 }];
        
            // 3. جلب قائمة المهام اليومية
            const [dailyTasks] = await db.query(
              "SELECT * FROM camp_daily_tasks WHERE camp_id = ? ORDER BY day_number",
              [campId]
            );
        
            const [dayChallenges] = await db.query(
              `
                SELECT day_number, title, description
                FROM camp_day_challenges
                WHERE camp_id = ?
                ORDER BY day_number
              `,
              [campId]
            );
        
            // 4. جلب قائمة المشتركين (للفوج الحالي فقط)
            const [participants] = await db.query(
              `
              SELECT 
                ce.*,
                u.username,
                u.email,
                u.avatar_url,
                COALESCE(cs.hide_identity, false) as hide_identity
              FROM camp_enrollments ce
              LEFT JOIN users u ON ce.user_id = u.id
              LEFT JOIN camp_settings cs ON ce.id = cs.enrollment_id
              WHERE ce.camp_id = ? AND ce.cohort_number = ?
              ORDER BY ce.enrollment_date DESC
            `,
              [campId, currentCohortNumber]
            );

            return {
                camp,
        statistics: {
          enrollments: enrollmentsCount[0].count,
          supervisors: supervisorsCount[0].count || 0, // Admin only
          tasks: tasksCount[0].count,
          completedTasks: completedTasksCount[0].count,
          totalPoints: totalPoints[0].total || 0,
        },
        dailyTasks,
        dayChallenges,
        participants,
            }
        
    } catch (error) {
        throw error;
    }
}
module.exports={
    getCampDetails,
    getCampDetailsForAdmin
}