const db = require("../config/database");
const campParticipantService = require("./campParticipantService");

/**
 * Camp Analytics Service
 * 
 * خدمة الإحصائيات والتحليلات للمخيمات
 * تحتوي على جميع دوال التحليلات والإحصائيات المتعلقة بالمخيمات
 */

/**
 * Get comprehensive analytics for a camp
 * 
 * @param {Object} params - Parameters
 * @param {number} params.campId - Camp ID
 * @param {number} params.cohortNumber - Cohort number (optional, will use current if not provided)
 * @returns {Promise<{status: number, body: Object}>} - Response with analytics data
 */
const getCampAnalytics = async ({ campId, cohortNumber = null }) => {
  try {
    // Get cohort number from query or use current cohort
    let cohort;
    if (cohortNumber) {
      cohort = parseInt(cohortNumber);
    } else {
      cohort = await campParticipantService.getCurrentCohortNumber(campId);
    }

    // Get basic stats
    const [enrollments] = await db.query(
      `
      SELECT 
        COUNT(*) as total_enrollments,
        COUNT(*) as active_enrollments,
        COUNT(*) as completed_enrollments,
        COALESCE(AVG(total_points), 0) as average_points
      FROM camp_enrollments 
      WHERE camp_id = ? AND cohort_number = ?
    `,
      [campId, cohort]
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
      WHERE ce.camp_id = ? AND ce.cohort_number = ?
    `,
      [campId, campId, cohort]
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
      WHERE ce.camp_id = ? AND ce.cohort_number = ? AND ctp.completed = true AND ctp.completed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(ctp.completed_at)
      ORDER BY DATE(ctp.completed_at) ASC
    `,
      [campId, cohort]
    );

    // Get enrollment growth over time
    const [enrollmentGrowth] = await db.query(
      `
      SELECT 
        DATE(ce.enrollment_date) as date,
        COUNT(*) as new_enrollments
      FROM camp_enrollments ce
      WHERE ce.camp_id = ? AND ce.cohort_number = ?
      GROUP BY DATE(ce.enrollment_date)
      ORDER BY DATE(ce.enrollment_date) ASC
    `,
      [campId, cohort]
    );

    // Merge daily progress with enrollment growth
    const dailyProgressWithEnrollments = dailyProgress.map((day) => {
      const enrollmentDay = enrollmentGrowth.find((e) => e.date === day.date);
      return {
        ...day,
        new_enrollments: enrollmentDay?.new_enrollments || 0,
      };
    });

    // Get retention data (daily active users)
    const [retentionData] = await db.query(
      `
      SELECT 
        DATE(ctp.completed_at) as date,
        COUNT(DISTINCT ctp.enrollment_id) as active_users
      FROM camp_task_progress ctp
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      WHERE ce.camp_id = ? AND ce.cohort_number = ? AND ctp.completed = true
      GROUP BY DATE(ctp.completed_at)
      ORDER BY DATE(ctp.completed_at) ASC
    `,
      [campId, cohort]
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
      LEFT JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      WHERE cdt.camp_id = ? AND (ce.cohort_number = ? OR ce.cohort_number IS NULL)
      GROUP BY cdt.task_type
    `,
      [campId, cohort]
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
      [campId, campId]
    );

    const responseData = {
      totalEnrollments: enrollments[0]?.total_enrollments || 0,
      activeEnrollments: enrollments[0]?.active_enrollments || 0,
      completedEnrollments: enrollments[0]?.completed_enrollments || 0,
      averageProgress: progressStats[0]?.average_progress || 0,
      averagePoints: enrollments[0]?.average_points || 0,
      dailyProgress: dailyProgressWithEnrollments || [],
      taskCompletion: taskCompletion || [],
      topPerformers: topPerformers || [],
      enrollmentGrowth: enrollmentGrowth || [],
      retentionData: retentionData || [],
    };

    return {
      status: 200,
      body: {
        success: true,
        data: responseData,
      },
    };
  } catch (error) {
    console.error("Error in campAnalyticsService.getCampAnalytics:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في جلب الإحصائيات",
      },
    };
  }
};

/**
 * Get admin stats (overall statistics)
 * 
 * @returns {Promise<{status: number, body: Object}>} - Response with admin stats
 */
const getAdminStats = async () => {
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

    return {
      status: 200,
      body: {
        success: true,
        data: stats[0],
      },
    };
  } catch (error) {
    console.error("Error in campAnalyticsService.getAdminStats:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في جلب الإحصائيات",
      },
    };
  }
};

module.exports = {
  getCampAnalytics,
  getAdminStats,
};
