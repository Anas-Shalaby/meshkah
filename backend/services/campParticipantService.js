const db = require("../config/database");

// Shared helper from campUserService
const getCurrentCohortNumber = async (campId) => {
  try {
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

    const [camps] = await db.query(
      `SELECT COALESCE(current_cohort_number, 1) as current_cohort_number 
       FROM quran_camps WHERE id = ?`,
      [campId]
    );
    return camps[0]?.current_cohort_number || 1;
  } catch (error) {
    console.error("Error getting current cohort:", error);
    return 1;
  }
};

/**
 * Get camp participants with filtering, pagination, and progress
 * @param {Object} options
 * @param {number} options.campId - Camp ID
 * @param {number} options.cohortNumber - Cohort number (optional, uses current if not provided)
 * @param {Object} options.filters - Filter options
 * @param {string} options.filters.status - Filter by enrollment status
 * @param {string} options.filters.search - Search by username or email
 * @param {Object} options.pagination - Pagination options
 * @param {number} options.pagination.page - Page number
 * @param {number} options.pagination.limit - Items per page
 * @param {boolean} options.includeSupervisors - Include supervisors in results
 * @returns {Promise<Object>}
 */
const getParticipants = async ({
  campId,
  cohortNumber = null,
  filters = {},
  pagination = { page: 1, limit: 50 },
  includeSupervisors = false,
}) => {
  try {
    // Get cohort number if not provided
    let targetCohortNumber = cohortNumber;
    if (!targetCohortNumber) {
      targetCohortNumber = await getCurrentCohortNumber(campId);
    }

    // Get total tasks count for progress calculation
    const [totalTasksResult] = await db.query(
      "SELECT COUNT(*) as total FROM camp_daily_tasks WHERE camp_id = ?",
      [campId]
    );
    const totalTasks = totalTasksResult[0]?.total || 1;

    // Build base query
    let query = `
      SELECT 
        ce.*,
        u.username,
        u.email,
        u.avatar_url,
        COUNT(DISTINCT ctp.id) as completed_tasks,
        ? as total_tasks,
        ROUND((COUNT(DISTINCT ctp.id) / ?) * 100, 2) as progress_percentage
    `;

    // Add supervisor flag if including supervisors
    if (includeSupervisors) {
      query += `,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM camp_supervisors cs 
            WHERE cs.camp_id = ce.camp_id 
            AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
            AND cs.user_id = ce.user_id
          ) THEN 1
          ELSE 0
        END as is_supervisor
      `;
    }

    query += `
      FROM camp_enrollments ce
      JOIN users u ON ce.user_id = u.id
      LEFT JOIN camp_task_progress ctp ON ce.id = ctp.enrollment_id AND ctp.completed = 1
      WHERE ce.camp_id = ? AND ce.cohort_number = ?
    `;

    const params = [totalTasks, totalTasks, campId, targetCohortNumber];

    // Exclude supervisors unless explicitly included
    if (!includeSupervisors) {
      query += `
        AND NOT EXISTS (
          SELECT 1 FROM camp_supervisors cs 
          WHERE cs.camp_id = ce.camp_id 
          AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
          AND cs.user_id = ce.user_id
        )
      `;
    }

    // Apply status filter
    if (filters.status && filters.status !== "all") {
      query += ` AND ce.status = ?`;
      params.push(filters.status);
    }

    // Apply search filter
    if (filters.search) {
      query += ` AND (u.username LIKE ? OR u.email LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ` GROUP BY ce.id ORDER BY ce.total_points DESC`;

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM camp_enrollments ce
      JOIN users u ON ce.user_id = u.id
      WHERE ce.camp_id = ? AND ce.cohort_number = ?
    `;
    const countParams = [campId, targetCohortNumber];

    if (!includeSupervisors) {
      countQuery += `
        AND NOT EXISTS (
          SELECT 1 FROM camp_supervisors cs 
          WHERE cs.camp_id = ce.camp_id 
          AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
          AND cs.user_id = ce.user_id
        )
      `;
    }

    if (filters.status && filters.status !== "all") {
      countQuery += ` AND ce.status = ?`;
      countParams.push(filters.status);
    }

    if (filters.search) {
      countQuery += ` AND (u.username LIKE ? OR u.email LIKE ?)`;
      countParams.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(pagination.limit), offset);

    const [participants] = await db.query(query, params);

    return {
      participants,
      pagination: {
        page: parseInt(pagination.page),
        limit: parseInt(pagination.limit),
        total,
        pages: Math.ceil(total / pagination.limit),
      },
    };
  } catch (error) {
    console.error("Error fetching participants:", error);
    throw error;
  }
};

/**
 * Get camp leaderboard with caching
 * @param {Object} options
 * @param {number} options.campId - Camp ID
 * @param {number} options.cohortNumber - Cohort number (optional)
 * @param {number} options.limit - Number of top participants to return
 * @param {boolean} options.forceRefresh - Force refresh cache
 * @returns {Promise<Object>}
 */
const getLeaderboard = async ({
  campId,
  cohortNumber = null,
  limit = 10,
  forceRefresh = false,
}) => {
  try {
    // Verify camp exists
    const [campInfo] = await db.query(
      `SELECT status FROM quran_camps WHERE id = ?`,
      [campId]
    );

    if (campInfo.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المخيم غير موجود",
        },
      };
    }

    // Get current cohort number if not provided
    let targetCohortNumber = cohortNumber;
    if (!targetCohortNumber) {
      targetCohortNumber = await getCurrentCohortNumber(campId);
    }

    // Return empty for completed camps
    if (campInfo[0].status === "completed") {
      return {
        status: 200,
        body: {
          success: true,
          data: [],
          cached: false,
        },
      };
    }

    const cacheKey = `leaderboard_${campId}_${targetCohortNumber}_${limit}`;

    // Try to get from cache first (unless force refresh)
    let leaderboard = null;
    if (!forceRefresh) {
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
          AND ce.cohort_number = ?
          AND COALESCE(cs.leaderboard_visibility, true) = true
          AND NOT EXISTS (
            SELECT 1 FROM camp_supervisors cs2 
            WHERE cs2.camp_id = ce.camp_id 
            AND (cs2.cohort_number = ce.cohort_number OR cs2.cohort_number IS NULL)
            AND cs2.user_id = ce.user_id
          )
        ORDER BY ce.total_points DESC
        LIMIT ?
      `,
        [campId, targetCohortNumber, parseInt(limit)]
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

    return {
      status: 200,
      body: {
        success: true,
        data: leaderboard,
        cached: !!leaderboard,
      },
    };
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    throw error;
  }
};

/**
 * Verify cohort exists
 * @param {number} campId - Camp ID
 * @param {number} cohortNumber - Cohort number
 * @returns {Promise<boolean>}
 */
const verifyCohortExists = async (campId, cohortNumber) => {
  try {
    const [cohorts] = await db.query(
      `SELECT * FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
      [campId, cohortNumber]
    );
    return cohorts.length > 0;
  } catch (error) {
    console.error("Error verifying cohort:", error);
    return false;
  }
};

module.exports = {
  getParticipants,
  getLeaderboard,
  verifyCohortExists,
  getCurrentCohortNumber,
};
