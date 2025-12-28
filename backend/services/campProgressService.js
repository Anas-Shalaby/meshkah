const db = require("../config/database");
const campParticipantService = require("./campParticipantService");
const permissionHelper = require("../utils/permissionsHelper");

const calculateStreak = async (enrollmentId) => {
  try {
    const connection = await db.getConnection();

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

    const [todayResult] = await connection.execute(
      `SELECT CURDATE() as today, DATE_SUB(CURDATE(), INTERVAL 1 DAY) as yesterday`
    );

    const today = todayResult[0].today.toISOString().split("T")[0];
    const yesterday = todayResult[0].yesterday.toISOString().split("T")[0];

    let newCurrentStreak = currentStreak;
    let newLongestStreak = longestStreak;

    if (!lastDate) {
      newCurrentStreak = 1;
    } else {
      const lastDateStr =
        lastDate instanceof Date
          ? lastDate.toISOString().split("T")[0]
          : String(lastDate).split("T")[0];

      if (lastDateStr === today) {
        newCurrentStreak = currentStreak;
      } else if (lastDateStr === yesterday) {
        newCurrentStreak = currentStreak + 1;
      } else {
        const [diffResult] = await connection.execute(
          `SELECT DATEDIFF(CURDATE(), ?) as days_diff`,
          [lastDate]
        );

        const daysDiff = diffResult[0]?.days_diff || 999;

        if (daysDiff === 1) {
          newCurrentStreak = currentStreak + 1;
        } else if (daysDiff > 1) {
          newCurrentStreak = 1;
        } else {
          newCurrentStreak = currentStreak;
        }
      }
    }

    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
    }

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
    console.error("Error in calculateStreak:", error);
    return { current: 0, longest: 0 };
  }
};

/**
 * Get user's streak information
 * @param {Object} params
 * @param {number} params.campId
 * @param {number} params.userId
 * @returns {Promise<{status: number, body: Object}>}
 */
const getMyStreak = async ({ campId, userId }) => {
  try {
    const connection = await db.getConnection();

    const currentCohortNumber =
      await campParticipantService.getCurrentCohortNumber(campId);

    const [enrollments] = await connection.execute(
      `SELECT id, current_streak, longest_streak, last_activity_date
       FROM camp_enrollments 
       WHERE user_id = ? AND camp_id = ? AND cohort_number = ?`,
      [userId, campId, currentCohortNumber]
    );

    if (!enrollments.length) {
      connection.release();
      return {
        status: 404,
        body: {
          success: false,
          message: "لم يتم العثور على التسجيل",
        },
      };
    }

    const enrollment = enrollments[0];
    const streakInfo = await calculateStreak(enrollment.id);

    connection.release();

    return {
      status: 200,
      body: {
        success: true,
        data: {
          currentStreak: streakInfo.current,
          longestStreak: streakInfo.longest,
          lastActivityDate: enrollment.last_activity_date,
        },
      },
    };
  } catch (error) {
    console.error("Error in getMyStreak:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "خطأ في جلب معلومات الـ Streak",
      },
    };
  }
};

/**
 * Update streak after task completion
 * @param {number} enrollmentId
 * @returns {Promise<{current: number, longest: number}>}
 */
const updateStreak = async (enrollmentId) => {
  try {
    const connection = await db.getConnection();

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

    const [todayResult] = await connection.execute(
      `SELECT CURDATE() as today, DATE_SUB(CURDATE(), INTERVAL 1 DAY) as yesterday`
    );

    const today = todayResult[0].today.toISOString().split("T")[0];
    const yesterday = todayResult[0].yesterday.toISOString().split("T")[0];

    let newCurrentStreak = enrollment.current_streak || 0;
    let newLongestStreak = enrollment.longest_streak || 0;

    if (!enrollment.last_activity_date) {
      newCurrentStreak = 1;
    } else {
      const lastDateStr =
        enrollment.last_activity_date instanceof Date
          ? enrollment.last_activity_date.toISOString().split("T")[0]
          : String(enrollment.last_activity_date).split("T")[0];

      if (lastDateStr === today) {
        newCurrentStreak = enrollment.current_streak || 0;
      } else if (lastDateStr === yesterday) {
        newCurrentStreak = (enrollment.current_streak || 0) + 1;
      } else {
        const [diffResult] = await connection.execute(
          `SELECT DATEDIFF(CURDATE(), ?) as days_diff`,
          [enrollment.last_activity_date]
        );

        const daysDiff = diffResult[0]?.days_diff || 999;

        if (daysDiff === 1) {
          newCurrentStreak = (enrollment.current_streak || 0) + 1;
        } else if (daysDiff > 1) {
          newCurrentStreak = 1;
        } else {
          newCurrentStreak = enrollment.current_streak || 0;
        }
      }
    }

    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
    }

    await connection.execute(
      `UPDATE camp_enrollments 
       SET current_streak = ?, longest_streak = ?, last_activity_date = CURDATE()
       WHERE id = ?`,
      [newCurrentStreak, newLongestStreak, enrollmentId]
    );

    connection.release();

    return { current: newCurrentStreak, longest: newLongestStreak };
  } catch (error) {
    console.error("Error in updateStreak:", error);
    return { current: 0, longest: 0 };
  }
};

/**
 * Get user's simple statistics
 * @param {Object} params
 * @param {number} params.campId
 * @param {number} params.userId
 * @returns {Promise<{status: number, body: Object}>}
 */
const getMyStats = async ({ campId, userId }) => {
  try {
    const connection = await db.getConnection();

    const currentCohortNumber =
      await campParticipantService.getCurrentCohortNumber(campId);
    const [enrollments] = await connection.execute(
      `SELECT id, total_points, current_streak, longest_streak, last_activity_date
       FROM camp_enrollments 
       WHERE user_id = ? AND camp_id = ? AND cohort_number = ?`,
      [userId, campId, currentCohortNumber]
    );

    if (!enrollments.length) {
      connection.release();
      return {
        status: 404,
        body: {
          success: false,
          message: "لم يتم العثور على التسجيل",
        },
      };
    }

    const enrollment = enrollments[0];

    const [taskStats] = await connection.execute(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_tasks,
        AVG(CASE WHEN completed = 1 THEN LENGTH(notes) ELSE 0 END) as avg_words_per_task
       FROM camp_task_progress 
       WHERE enrollment_id = ?`,
      [enrollment.id]
    );

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
      );
    }

    connection.release();

    return {
      status: 200,
      body: {
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
      },
    };
  } catch (error) {
    console.error("Error in getMyStats:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "خطأ في جلب الإحصائيات",
      },
    };
  }
};

const getUserProgress = async ({ campId, userId }) => {
  try {
    const userIsSupervisor = await permissionHelper.isSupervisor(
      userId,
      campId
    );

    // First, get user's enrollment to find their actual cohort number
    const [userEnrollments] = await db.query(
      `SELECT ce.*, ce.referral_points, qc.name as camp_name, qc.surah_name, qc.start_date as camp_start_date, 
       qc.duration_days, qc.status as camp_status
       FROM camp_enrollments ce
       JOIN quran_camps qc ON ce.camp_id = qc.id
       WHERE ce.user_id = ? AND ce.camp_id = ?
       ORDER BY ce.cohort_number DESC
       LIMIT 1`,
      [userId, campId]
    );

    if (!userEnrollments || userEnrollments.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "لست مسجلاً في هذا المخيم",
        },
      };
    }

    let enrollment = userEnrollments[0];
    const userCohortNumber = enrollment.cohort_number; // Use user's actual cohort!

    // Check if user is admin (id = 1 and role = 'admin') - has full access
    let userIsAdmin = false;
    if (userId) {
      const [adminCheck] = await db.query(
        `SELECT id, role FROM users WHERE id = ? AND id = 1 AND role = 'admin' LIMIT 1`,
        [userId]
      );
      if (adminCheck.length > 0) {
        userIsAdmin = true;
      }
    }

    // Get all tasks for the camp with completion count (using user's cohort!)
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
        FROM camp_task_progress ctp2
        JOIN camp_enrollments ce2 ON ctp2.enrollment_id = ce2.id
        WHERE ctp2.completed = true AND ce2.camp_id = ? AND ce2.cohort_number = ?
        GROUP BY task_id
      ) completion_counts ON cdt.id = completion_counts.task_id
      WHERE cdt.camp_id = ?
      ORDER BY cdt.day_number, cdt.order_in_day
    `,
      [enrollment.id || 0, campId, userCohortNumber, campId]
    );

    // إضافة بيانات الأصدقاء (نفس المنطق من getCampDailyTasks)
    // 1. جلب قائمة IDs الأصدقاء من camp_friendships (في هذا المخيم والفوج الحالي فقط)
    const [campFriendships] = await db.query(
      `SELECT
        CASE
          WHEN user1_id = ? THEN user2_id
          ELSE user1_id
        END as friend_id
      FROM camp_friendships
      WHERE camp_id = ? AND cohort_number = ? AND (user1_id = ? OR user2_id = ?)`,
      [userId, campId, userCohortNumber, userId, userId]
    );

    const friendIds = campFriendships.map((f) => f.friend_id);

    if (friendIds.length > 0) {
      // 2. جلب enrollment_ids للأصدقاء في هذا المخيم والفوج الحالي فقط
      const placeholders = friendIds.map(() => "?").join(",");
      const [friendEnrollments] = await db.query(
        `SELECT id, user_id
         FROM camp_enrollments
         WHERE user_id IN (${placeholders}) AND camp_id = ? AND cohort_number = ?`,
        [...friendIds, campId, userCohortNumber]
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

    // Parse JSON fields (additional_links and attachments) for each task
    tasks.forEach((task) => {
      if (task.additional_links) {
        try {
          task.additional_links =
            typeof task.additional_links === "string"
              ? JSON.parse(task.additional_links)
              : task.additional_links;
          // Ensure it's an array
          if (!Array.isArray(task.additional_links)) {
            task.additional_links = [];
          }
        } catch (e) {
          console.error(`Task ${task.id} - Error parsing additional_links:`, e);
          task.additional_links = [];
        }
      } else {
        task.additional_links = [];
      }
      if (task.attachments) {
        try {
          task.attachments =
            typeof task.attachments === "string"
              ? JSON.parse(task.attachments)
              : task.attachments;
          // Ensure it's an array
          if (!Array.isArray(task.attachments)) {
            task.attachments = [];
          }
        } catch (e) {
          console.error(`Task ${task.id} - Error parsing attachments:`, e);
          task.attachments = [];
        }
      } else {
        task.attachments = [];
      }
    });

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
      [campId, userId]
    );

    const userRank = rankResult[0]?.user_rank || 1;

    return {
      status: 200,
      body: {
        success: true, // Add success flag
        data: {
          enrollment: enrollment,
          tasks,
          progress: {
            totalTasks,
            completedTasks,
            progressPercentage,
            rank: userRank,
          },
          is_supervisor: userIsSupervisor, // Flag to indicate supervisor access
          is_admin: userIsAdmin, // Flag to indicate admin access (id = 1)
        },
      },
    };
  } catch (error) {
    console.error("Error in getMyProgress:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "خطأ في جلب التقدم",
      },
    };
  }
};

/**
 * Mark a task as complete
 * Complex function handling task completion with transactions, points, streaks, notifications
 * @param {Object} params
 * @param {number} params.taskId - Task ID
 * @param {number} params.userId - User ID
 * @returns {Promise<{status: number, body: Object}>}
 */
const markTaskComplete = async ({
  taskId,
  userId,
  journal_entry,
  proposed_step,
  share_in_study_hall,
}) => {
  const CampNotificationService = require("./campNotificationService");

  try {
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
      return {
        status: 404,
        body: {
          success: false,
          message: "المهمة غير موجودة",
        },
      };
    }

    // Check if camp status allows task completion
    const campStatusValue = tasks[0].camp_status;
    const isReadOnly = campStatusValue === "archived";

    if (campStatusValue === "early_registration") {
      return {
        status: 403,
        body: {
          success: false,
          message: "المخيم لم يبدأ بعد. يرجى الانتظار حتى يبدأ الادمن المخيم.",
        },
      };
    }

    if (
      campStatusValue !== "active" &&
      campStatusValue !== "reopened" &&
      campStatusValue !== "completed" && // Allow completion in 'completed' state for reflection updates
      campStatusValue !== "archived" // Allow completion in 'archived' state for reflection updates
    ) {
      return {
        status: 403,
        body: {
          success: false,
          message: "المخيم غير نشط حالياً. لا يمكنك إكمال المهام.",
        },
      };
    }

    // Use transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    let enrollments = [];

    try {
      // Get enrollment
      const [enrollmentsResult] = await connection.query(
        `SELECT ce.*, cc.start_date as cohort_start_date
         FROM camp_enrollments ce
         LEFT JOIN camp_cohorts cc ON ce.camp_id = cc.camp_id AND ce.cohort_number = cc.cohort_number
         WHERE ce.user_id = ? AND ce.camp_id = ?
         ORDER BY ce.cohort_number DESC, ce.id DESC
         LIMIT 1`,
        [userId, tasks[0].camp_id]
      );
      enrollments = enrollmentsResult;

      if (enrollments.length === 0) {
        await connection.rollback();
        connection.release();
        return {
          status: 403,
          body: {
            success: false,
            message: "غير مشترك في هذا المخيم",
          },
        };
      }

      // Check cohort start date
      if (enrollments[0].cohort_start_date) {
        const cohortStartDate = new Date(enrollments[0].cohort_start_date);
        cohortStartDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (today < cohortStartDate) {
          await connection.rollback();
          connection.release();
          return {
            status: 403,
            body: {
              success: false,
              message: "لا يمكن إكمال المهام قبل تاريخ بدء الفوج",
            },
          };
        }
      }

      // Check if task is already completed or exists
      const [existingProgress] = await connection.query(
        `SELECT * FROM camp_task_progress WHERE enrollment_id = ? AND task_id = ?`,
        [enrollments[0].id, taskId]
      );

      const isPrivate =
        share_in_study_hall === undefined ? true : !share_in_study_hall;
      let affectedRows = 0;
      let wasAlreadyCompleted = false;

      if (journal_entry != null) {
        try {
          const redisClient = require("../utils/redisClient");
          if (redisClient) {
            // Delete all cache keys for this camp
            const pattern = `study_hall:${tasks[0].camp_id}:*`;
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
              await redisClient.del(...keys);
            }
          }
        } catch (redisError) {
          console.log("Redis not available for cache clearing");
        }
      }
      if (existingProgress.length > 0) {
        wasAlreadyCompleted = existingProgress[0].completed;

        // Update existing progress (even if already completed, we might be updating reflection)
        const [updateResult] = await connection.query(
          `
          UPDATE camp_task_progress
          SET completed = true,
              completed_at = COALESCE(completed_at, NOW()),
              journal_entry = COALESCE(?, journal_entry),
              proposed_step = COALESCE(?, proposed_step),
              is_private = COALESCE(?, is_private)
          WHERE enrollment_id = ? AND task_id = ?
        `,
          [journal_entry, proposed_step, isPrivate, enrollments[0].id, taskId]
        );
        affectedRows = updateResult.affectedRows || 0;
      } else {
        let insertResult;
        if (
          journal_entry === null ||
          journal_entry === undefined ||
          journal_entry.trim() === ""
        ) {
          // Insert new progress
          [insertResult] = await connection.query(
            `
          INSERT INTO camp_task_progress (
            enrollment_id, task_id, completed, completed_at,
             proposed_step, is_private
          )
          VALUES (?, ?, true, NOW(), ?, ?)
        `,
            [enrollments[0].id, taskId, proposed_step, isPrivate]
          );
        } else {
          // Insert new progress
          [insertResult] = await connection.query(
            `
          INSERT INTO camp_task_progress (
            enrollment_id, task_id, completed, completed_at,
            journal_entry, proposed_step, is_private
          )
          VALUES (?, ?, true, NOW(), ?, ?, ?)
        `,
            [enrollments[0].id, taskId, journal_entry, proposed_step, isPrivate]
          );
        }

        affectedRows = insertResult.affectedRows || 0;
      }

      // Update total points only if it WAS NOT already completed
      // And camp is not readonly

      if (!wasAlreadyCompleted && affectedRows > 0 && !isReadOnly) {
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

    // Update streak and send notifications only if camp is not readonly
    if (!isReadOnly) {
      const streakInfo = await updateStreak(enrollments[0].id);

      // Send achievement notification
      try {
        await CampNotificationService.sendAchievementNotification(
          userId,
          tasks[0].camp_id,
          tasks[0].camp_name,
          tasks[0].title,
          tasks[0].points,
          enrollments[0].cohort_number
        );
      } catch (notificationError) {
        console.error(
          "Error sending achievement notification:",
          notificationError
        );
      }

      // Log streak activity for milestones
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
          }
        }
      }
    }

    // Check for milestones and send notifications
    try {
      const [totalPointsResult] = await db.query(
        `SELECT total_points FROM camp_enrollments WHERE id = ?`,
        [enrollments[0].id]
      );

      const totalPoints = totalPointsResult[0].total_points;

      if (totalPoints >= 50 && totalPoints - tasks[0].points < 50) {
        await CampNotificationService.sendMilestoneNotification(
          userId,
          tasks[0].camp_id,
          tasks[0].name || "المخيم القرآني",
          "50 نقطة",
          totalPoints,
          enrollments[0].cohort_number
        );
      } else if (totalPoints >= 100 && totalPoints - tasks[0].points < 100) {
        await CampNotificationService.sendMilestoneNotification(
          userId,
          tasks[0].camp_id,
          tasks[0].name || "المخيم القرآني",
          "100 نقطة",
          totalPoints,
          enrollments[0].cohort_number
        );
      } else if (totalPoints >= 200 && totalPoints - tasks[0].points < 200) {
        await CampNotificationService.sendMilestoneNotification(
          userId,
          tasks[0].camp_id,
          tasks[0].name || "المخيم القرآني",
          "200 نقطة",
          totalPoints,
          enrollments[0].cohort_number
        );
      }
    } catch (milestoneError) {
      console.error("Error sending milestone notification:", milestoneError);
    }

    // Log task completion activity
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
    }

    // Check if all required tasks for the day are completed and open test if available
    let testShouldOpen = false;
    let testData = null;
    try {
      const campTestService = require("./campTestService");
      const dayNumber = tasks[0].day_number;

      if (dayNumber) {
        const testCheck = await campTestService.checkIfTestShouldOpen({
          campId: tasks[0].camp_id,
          dayNumber: dayNumber,
          userId: userId,
        });

        if (testCheck.shouldOpen && testCheck.testId) {
          testShouldOpen = true;
          // Get test details for response (this will create attempt if needed)
          const testResult = await campTestService.getTestForUser({
            testId: testCheck.testId,
            userId: userId,
          });
          if (testResult.status === 200) {
            testData = {
              test_id: testCheck.testId,
              attempt_id: testResult.body.data.attempt_id,
              ...testResult.body.data,
            };
          }
        }
      }
    } catch (testError) {
      console.error("Error checking/opening daily test:", testError);
      // Don't fail the task completion if test check fails
    }

    return {
      status: 200,
      body: {
        success: true,
        message: "تم إكمال المهمة بنجاح",
        data: {
          task_id: taskId,
          points_earned: tasks[0].points,
          test_should_open: testShouldOpen,
          test: testData,
        },
      },
    };
  } catch (error) {
    console.error("Error in markTaskComplete:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في إكمال المهمة",
      },
    };
  }
};

/**
 * Update task benefits (journal entry and benefits)
 * @param {Object} params
 * @param {number} params.taskId - Task ID
 * @param {number} params.userId - User ID
 * @param {string} params.journal_entry - Journal entry (can be null)
 * @param {string} params.benefits - Benefits text
 * @param {Object} params.content_rich - Rich content object
 * @param {boolean} params.is_private - Privacy flag (default true)
 * @param {string} params.proposed_step - Proposed step
 * @returns {Promise<{status: number, body: Object}>}
 */
const updateTaskBenefits = async ({
  taskId,
  userId,
  journal_entry,
  benefits,
  content_rich,
  is_private,
  proposed_step,
}) => {
  const shortid = require("shortid");

  try {
    // Clean journal_entry and remove HTML tags to check if content is empty
    let cleanedJournalEntry = null;
    if (journal_entry && typeof journal_entry === "string") {
      // Remove HTML tags and check if there's actual text content
      const textContent = journal_entry
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
        .replace(/&[a-z]+;/gi, "") // Remove other HTML entities
        .trim();

      // Only set cleanedJournalEntry if there's actual content
      // If empty, we'll save null (don't force user to write reflection)
      if (textContent.length > 0) {
        cleanedJournalEntry = journal_entry.trim();
      }
    }

    const isPrivate = is_private !== undefined ? Boolean(is_private) : true;

    // Get task details
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
      return {
        status: 404,
        body: { success: false, message: "المهمة غير موجودة" },
      };
    }

    const campStatusValue = tasks[0].camp_status;

    if (campStatusValue === "early_registration") {
      return {
        status: 403,
        body: {
          success: false,
          message: "المخيم لم يبدأ بعد. يرجى الانتظار حتى يبدأ الادمن المخيم.",
        },
      };
    }

    if (campStatusValue === "completed") {
      return {
        status: 400,
        body: {
          success: false,
          message: "لا يمكن التفاعل مع مهام المخيمات المكتملة",
        },
      };
    }

    if (campStatusValue !== "active" && campStatusValue !== "reopened") {
      return {
        status: 403,
        body: {
          success: false,
          message: "المخيم غير نشط حالياً. لا يمكنك حفظ الفوائد.",
        },
      };
    }

    // Get enrollment
    const [enrollments] = await db.query(
      `
      SELECT * FROM camp_enrollments 
      WHERE user_id = ? AND camp_id = ?
      ORDER BY cohort_number DESC, id DESC
      LIMIT 1
    `,
      [userId, tasks[0].camp_id]
    );

    if (enrollments.length === 0) {
      return {
        status: 400,
        body: { success: false, message: "لست مسجلاً في هذا المخيم" },
      };
    }

    // Check existing progress
    const [existingProgress] = await db.query(
      `SELECT * FROM camp_task_progress WHERE enrollment_id = ? AND task_id = ?`,
      [enrollments[0].id, taskId]
    );

    const hadJournalEntryBefore =
      existingProgress.length > 0 &&
      existingProgress[0].journal_entry !== null &&
      existingProgress[0].journal_entry !== "" &&
      typeof existingProgress[0].journal_entry === "string" &&
      existingProgress[0].journal_entry.trim() !== "";

    const updatedNotes = benefits ? `الفوائد المستخرجة:\n${benefits}` : "";
    const contentRichJson = content_rich ? JSON.stringify(content_rich) : null;

    const wasPrivateBefore =
      existingProgress.length > 0
        ? existingProgress[0].is_private !== false
        : true;

    // If cleanedJournalEntry is null but journal_entry was provided (empty string),
    // keep the existing journal_entry if it exists
    const journalEntryToSave =
      cleanedJournalEntry !== null
        ? cleanedJournalEntry
        : existingProgress.length > 0 && existingProgress[0].journal_entry
        ? existingProgress[0].journal_entry
        : null;

    // Check if there's an existing journal entry (either from DB or new one being saved)
    // Use journal_entry parameter directly for new entries, or journalEntryToSave for existing ones
    const hasNewJournalEntry =
      journal_entry &&
      typeof journal_entry === "string" &&
      journal_entry.trim().length > 0;

    const hasExistingJournalEntry =
      existingProgress.length > 0 &&
      existingProgress[0].journal_entry !== null &&
      existingProgress[0].journal_entry !== "" &&
      typeof existingProgress[0].journal_entry === "string" &&
      existingProgress[0].journal_entry.trim().length > 0;

    const hasJournalEntry = hasNewJournalEntry || hasExistingJournalEntry;
    const hasJournalEntryAfter = hasJournalEntry;

    let shareLink =
      existingProgress.length > 0 ? existingProgress[0].share_link : null;

    // Create share_link if entry is public and has journal entry content
    if (!shareLink && !isPrivate && hasJournalEntry) {
      shareLink = `r-${shortid.generate()}`;
    }

    // Check if privacy or share_link changed (need to clear cache)
    const privacyChanged =
      existingProgress.length > 0 &&
      existingProgress[0].is_private !== (isPrivate ? 1 : 0);
    const shareLinkChanged =
      existingProgress.length > 0 &&
      existingProgress[0].share_link !== shareLink;

    // Clear study hall cache - delete all cache keys for this camp
    // Clear cache if content changed, privacy changed, or share_link changed
    if (
      cleanedJournalEntry ||
      updatedNotes ||
      privacyChanged ||
      shareLinkChanged
    ) {
      try {
        const redisClient = require("../utils/redisClient");
        if (redisClient) {
          // Delete all cache keys for this camp (using pattern matching)
          const pattern = `study_hall:${tasks[0].camp_id}:*`;
          const keys = await redisClient.keys(pattern);
          if (keys.length > 0) {
            await redisClient.del(...keys);
          }
        }
      } catch (redisError) {
        console.log("Redis not available for cache clearing");
      }
    }

    if (existingProgress.length > 0) {
      await db.query(
        `UPDATE camp_task_progress 
         SET journal_entry = ?, notes = ?, content_rich = ?, is_private = ?, proposed_step = ?, share_link = ?
         WHERE enrollment_id = ? AND task_id = ?`,
        [
          journalEntryToSave,
          updatedNotes,
          contentRichJson,
          isPrivate,
          proposed_step || null,
          shareLink,
          enrollments[0].id,
          taskId,
        ]
      );
    } else {
      await db.query(
        `INSERT INTO camp_task_progress (enrollment_id, task_id, completed, journal_entry, notes, content_rich, is_private, proposed_step, share_link)
         VALUES (?, ?, false, ?, ?, ?, ?, ?, ?)`,
        [
          enrollments[0].id,
          taskId,
          journalEntryToSave,
          updatedNotes,
          contentRichJson,
          isPrivate,
          proposed_step || null,
          shareLink,
        ]
      );
    }

    // Manage points (3 points for journal_entry)
    const JOURNAL_BONUS_POINTS = 3;

    if (!hadJournalEntryBefore && hasJournalEntryAfter) {
      await db.query(
        `UPDATE camp_enrollments SET total_points = total_points + ? WHERE id = ?`,
        [JOURNAL_BONUS_POINTS, enrollments[0].id]
      );
    } else if (hadJournalEntryBefore && !hasJournalEntryAfter) {
      await db.query(
        `UPDATE camp_enrollments SET total_points = GREATEST(0, total_points - ?) WHERE id = ?`,
        [JOURNAL_BONUS_POINTS, enrollments[0].id]
      );
    }

    // Log reflection share activity
    if (!isPrivate && wasPrivateBefore) {
      try {
        const [progressRecord] = await db.query(
          `SELECT id FROM camp_task_progress WHERE enrollment_id = ? AND task_id = ?`,
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
      }
    }

    return {
      status: 200,
      body: { success: true, message: "تم حفظ التدبر والفوائد بنجاح" },
    };
  } catch (error) {
    console.error("Error in updateTaskBenefits:", error);
    return {
      status: 500,
      body: { success: false, message: "حدث خطأ في حفظ الفوائد" },
    };
  }
};

const getStudyHallContent = async ({
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
}) => {
  try {
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page)) || 1;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 20; // Max 100 items per page
    const offset = (pageNum - 1) * limitNum;

    // Create cache key based on all parameters
    const cacheKey = `study_hall:${id}:${day || "all"}:${pageNum}:${limitNum}:${
      sort || "newest"
    }:${author_filter || ""}:${date_from || ""}:${date_to || ""}:${
      search || ""
    }:${userId}`;

    // Try to get from Redis cache first
    let cachedResult = null;
    try {
      const redisClient = require("../utils/redisClient");
      if (redisClient) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          cachedResult = JSON.parse(cached);
          // Return cached result if found
          return {
            status: 200,
            body: {
              ...cachedResult,
              cached: true,
            },
          };
        }
      }
    } catch (redisError) {
      console.log(
        "Redis not available, using database directly:",
        redisError.message
      );
    }

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

    // Get user's enrollment - get the most recent enrollment regardless of cohort
    const [allEnrollments] = await db.query(
      `SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ? ORDER BY cohort_number DESC, id DESC LIMIT 1`,
      [userId, id]
    );

    if (allEnrollments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "لست مسجلاً في هذا المخيم",
      });
    }

    // Use the user's actual cohort number, not the camp's current cohort
    const userCohortNumber = allEnrollments[0].cohort_number || 1;

    const enrollments = allEnrollments;

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
            ctp.share_link,
            ctp.completed_at,
            ctp.created_at,
            ctp.updated_at,
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

    query += ` ORDER BY cdt.day_number DESC, COALESCE(ctp.completed_at, ctp.updated_at, ctp.created_at) DESC`;

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
            ctp.share_link,
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
            AND ce.cohort_number = ?
            AND ctp.completed = 1
            AND ((ctp.journal_entry IS NOT NULL AND ctp.journal_entry != '' AND TRIM(REPLACE(REPLACE(REPLACE(ctp.journal_entry, '<p>', ''), '</p>', ''), '&nbsp;', '')) != '') 
                 OR (ctp.notes IS NOT NULL AND ctp.notes != '' AND TRIM(ctp.notes) != ''))
            AND ce.user_id != ?
            AND (ctp.is_private IS NULL OR ctp.is_private = false)
        `;

    const sharedParams = [
      userId,
      userId,
      userId,
      id,
      userCohortNumber, // Use user's cohort number instead of camp's current cohort
      userId,
    ];

    if (day) {
      sharedQuery += ` AND cdt.day_number = ?`;
      sharedParams.push(day);
    }

    // Filter by author (username search)
    if (author_filter && author_filter.trim() !== "") {
      sharedQuery += ` AND (u.username LIKE ? OR u.username = ?)`;
      const authorPattern = `%${author_filter.trim()}%`;
      sharedParams.push(authorPattern, author_filter.trim());
    }

    // Filter by date range
    if (date_from) {
      sharedQuery += ` AND DATE(ctp.completed_at) >= ?`;
      sharedParams.push(date_from);
    }
    if (date_to) {
      sharedQuery += ` AND DATE(ctp.completed_at) <= ?`;
      sharedParams.push(date_to);
    }

    // Search in content
    if (search && search.trim() !== "") {
      sharedQuery += ` AND (
            ctp.journal_entry LIKE ? OR 
            ctp.notes LIKE ? OR 
            cdt.title LIKE ?
          )`;
      const searchPattern = `%${search.trim()}%`;
      sharedParams.push(searchPattern, searchPattern, searchPattern);
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

      // التحقق من أن journal_entry ليس فارغاً (بعد إزالة HTML tags)
      const hasValidContent =
        task.journal_entry &&
        task.journal_entry
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim().length > 0;

      if (hasValidContent && !isPrivate) {
        studyHallContent.push({
          id: `user-${task.task_id}`,
          progress_id: task.progress_id,
          type: "user_reflection",
          title: task.title,
          content: task.journal_entry,
          day: task.day_number,
          day_number: task.day_number,
          points: task.points,
          completed_at: task.completed_at,
          is_own: true,
          is_private: false, // التدبرات في قاعة التدارس دائماً غير شخصية
          hide_identity: isCurrentUserHidden,
          userName: displayName,
          avatar_url: displayAvatar,
          share_link: task.share_link || null,
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

      // أضف الفوائد (تظهر للمستخدم نفسه حتى لو كانت خاصة)
      if (task.notes) {
        studyHallContent.push({
          id: `user-notes-${task.task_id}`,
          progress_id: task.progress_id,
          type: "user_benefits",
          title: `فوائد: ${task.title}`,
          content: task.notes,
          day: task.day_number,
          day_number: task.day_number,
          points: task.points,
          completed_at: task.completed_at,
          is_own: true,
          is_private: false, // الفوائد في قاعة التدارس دائماً غير شخصية
          hide_identity: isCurrentUserHidden,
          userName: displayName,
          avatar_url: displayAvatar,
          share_link: task.share_link || null,
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
      // إضافة التدبرات من المستخدمين الآخرين
      // التحقق من أن journal_entry ليس فارغاً (بعد إزالة HTML tags)
      const hasValidJournalContent =
        content.journal_entry &&
        content.journal_entry
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim().length > 0;

      if (hasValidJournalContent) {
        studyHallContent.push({
          id: `shared-reflection-${content.progress_id}`,
          progress_id: content.progress_id,
          type: "shared_reflection",
          title: `${content.title}`,
          content: content.journal_entry,
          day: content.day_number,
          day_number: content.day_number,
          points: content.points,
          completed_at: content.completed_at,
          is_own: false,
          is_private: false, // المحتوى المشترك دائماً غير شخصي
          hide_identity: Boolean(content.hide_identity),
          userName: content.author_name, // Already sanitized (مشارك مجهول if hidden)
          avatar_url: content.avatar_url, // Already NULL if hidden
          share_link: content.share_link || null,
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
      }

      // إضافة الفوائد من المستخدمين الآخرين
      const hasValidNotes = content.notes && content.notes.trim() !== "";
      if (hasValidNotes) {
        studyHallContent.push({
          id: `shared-benefits-${content.progress_id}`,
          progress_id: content.progress_id,
          type: "user_benefits",
          title: content.title,
          content: content.notes,
          day: content.day_number,
          day_number: content.day_number,
          points: content.points,
          completed_at: content.completed_at,
          is_own: false,
          is_private: false, // المحتوى المشترك دائماً غير شخصي
          hide_identity: Boolean(content.hide_identity),
          userName: content.author_name, // Already sanitized (مشارك مجهول if hidden)
          avatar_url: content.avatar_url, // Already NULL if hidden
          share_link: content.share_link || null,
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
      }
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

    // Create minimal content for caching (only essential fields)
    const minimalContent = paginatedContent.map((item) => ({
      id: item.id,
      progress_id: item.progress_id,
      type: item.type,
      title: item.title,
      content: item.content,
      day: item.day,
      day_number: item.day_number,
      points: item.points,
      completed_at: item.completed_at,
      is_own: item.is_own,
      is_private: item.is_private,
      hide_identity: item.hide_identity,
      userName: item.userName,
      avatar_url: item.avatar_url,
      share_link: item.share_link,
      upvote_count: item.upvote_count,
      save_count: item.save_count,
      is_upvoted_by_user: item.is_upvoted_by_user,
      is_saved_by_user: item.is_saved_by_user,
      pledge_count: item.pledge_count,
      is_pledged_by_user: item.is_pledged_by_user,
      proposed_step: item.proposed_step,
    }));

    const result = {
      success: true,
      data: {
        camp_id: camp.id,
        camp_name: camp.name,
        surah_name: camp.surah_name,
        day: day || null,
        content: minimalContent,
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
    };

    // Cache the result in Redis for 5 minutes (300 seconds)
    try {
      const redisClient = require("../utils/redisClient");
      if (redisClient) {
        await redisClient.setex(cacheKey, 300, JSON.stringify(result));
      }
    } catch (redisError) {
      console.log("Redis caching failed:", redisError.message);
    }

    return {
      status: 200,
      body: {
        ...result,
        cached: false,
      },
    };
  } catch (error) {
    console.error("Error in getStudyHallContent:", error);
    return {
      status: 500,
      body: { success: false, message: "حدث خطأ في جلب محتوى المدرسة" },
    };
  }
};

const getMySummary = async ({ id, userId }) => {
  try {
    // Get current cohort number from camp
    // Get current cohort number from camp_cohorts
    const currentCohortNumber =
      await campParticipantService.getCurrentCohortNumber(id);
    const hasSupervisorAccess = await permissionHelper.isSupervisor(
      id,
      userId,
      currentCohortNumber
    );
    const userIsAdmin = userId === 1;
    const hasFullAccess = userIsAdmin || hasSupervisorAccess;

    // Verify user is enrolled in the camp (current cohort)
    const [enrollments] = await db.query(
      `
      SELECT 
        ce.*,
        qc.name as camp_name,
        u.username as user_name
      FROM camp_enrollments ce
      JOIN quran_camps qc ON ce.camp_id = qc.id
      JOIN users u ON ce.user_id = u.id
      WHERE ce.user_id = ? AND ce.camp_id = ? AND ce.cohort_number = ?
      `,
      [userId, id, currentCohortNumber]
    );
    let enrollment = enrollments[0];
    if (hasFullAccess && enrollments.length === 0) {
      enrollment = {
        id: null,
        user_id: userId,
        camp_id: id,
        cohort_number: currentCohortNumber,
        camp_name: "المخيم",
        user_name: "المستخدم",
        is_supervisor: hasSupervisorAccess,
        is_admin: userIsAdmin,
        has_full_access: hasFullAccess,
      };
    }

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "لست مسجلا في هذا المخيم",
      });
    }

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
        AND (
          (ctp.journal_entry IS NOT NULL AND ctp.journal_entry != '' AND TRIM(REPLACE(REPLACE(REPLACE(ctp.journal_entry, '<p>', ''), '</p>', ''), '&nbsp;', '')) != '')
          OR (ctp.notes IS NOT NULL AND ctp.notes != '' AND TRIM(ctp.notes) != '')
        )
      `,
      [enrollment.id]
    );
    const reflectionsWritten = reflectionsWrittenResult[0]?.count || 0;
    const userCohortNumber = enrollment.cohort_number || currentCohortNumber;

    // Get reflections saved (count of reflections the user saved from others)
    const [reflectionsSavedResult] = await db.query(
      `
      SELECT COUNT(DISTINCT usr.progress_id) as count
      FROM user_saved_reflections usr
      JOIN camp_task_progress ctp ON usr.progress_id = ctp.id
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      WHERE usr.user_id = ? AND ce.camp_id = ? AND ce.cohort_number = ?
      `,
      [userId, id, userCohortNumber]
    );
    const reflectionsSaved = reflectionsSavedResult[0]?.count || 0;

    // Get upvotes received (total upvotes on user's reflections)
    const [upvotesReceivedResult] = await db.query(
      `
      SELECT COALESCE(SUM(ctp.upvote_count), 0) as total
      FROM camp_task_progress ctp
      WHERE ctp.enrollment_id = ?
        AND (
          (ctp.journal_entry IS NOT NULL AND ctp.journal_entry != '' AND TRIM(REPLACE(REPLACE(REPLACE(ctp.journal_entry, '<p>', ''), '</p>', ''), '&nbsp;', '')) != '')
          OR (ctp.notes IS NOT NULL AND ctp.notes != '' AND TRIM(ctp.notes) != '')
        )
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

    // Get user's cohort number and total points for percentile calculation
    const userTotalPoints = enrollment.total_points || enrollment.points || 0;

    // Get upvotes given by user (count of upvotes the user gave to others in this camp)
    const [upvotesGivenResult] = await db.query(
      `
      SELECT COUNT(*) as count
      FROM reflection_upvotes ru
      JOIN camp_task_progress ctp ON ru.progress_id = ctp.id
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      WHERE ru.user_id = ? AND ce.camp_id = ? AND ce.cohort_number = ?
      `,
      [userId, id, userCohortNumber]
    );
    const upvotesGiven = upvotesGivenResult[0]?.count || 0;

    // Get user's rank and percentile
    // Percentile: percentage of users the current user outperformed or tied with
    // Use cohort_number to filter enrollments to the same cohort

    const [percentileResult] = await db.query(
      `
      SELECT 
        (SELECT COUNT(*) FROM camp_enrollments WHERE camp_id = ? AND cohort_number = ?) as total_participants,
        (
          SELECT COUNT(*) 
          FROM camp_enrollments ce2
          WHERE ce2.camp_id = ? 
          AND ce2.cohort_number = ?
          AND ce2.total_points < ?
        ) as users_below,
        (
          SELECT COUNT(*) 
          FROM camp_enrollments ce3
          WHERE ce3.camp_id = ? 
          AND ce3.cohort_number = ?
          AND ce3.total_points = ?
        ) as users_tied
      `,
      [
        id,
        userCohortNumber, // total_participants
        id,
        userCohortNumber,
        userTotalPoints, // users_below
        id,
        userCohortNumber,
        userTotalPoints, // users_tied
      ]
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
        AND (
          (ctp.journal_entry IS NOT NULL AND ctp.journal_entry != '' AND TRIM(REPLACE(REPLACE(REPLACE(ctp.journal_entry, '<p>', ''), '</p>', ''), '&nbsp;', '')) != '')
          OR (ctp.notes IS NOT NULL AND ctp.notes != '' AND TRIM(ctp.notes) != '')
        )
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

    // Get best performance day (day with most completed tasks)
    const [bestDayResult] = await db.query(
      `
      SELECT 
        cdt.day_number,
        COUNT(*) as tasks_completed
      FROM camp_task_progress ctp
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      WHERE ctp.enrollment_id = ? AND ctp.completed = true
      GROUP BY cdt.day_number
      ORDER BY tasks_completed DESC
      LIMIT 1
      `,
      [enrollment.id]
    );
    const bestDay =
      bestDayResult.length > 0
        ? {
            day: bestDayResult[0].day_number,
            tasksCompleted: bestDayResult[0].tasks_completed,
          }
        : null;

    // Calculate productivity rate (points per day)
    const productivityRate =
      daysCompleted > 0
        ? Math.round((totalPoints / daysCompleted) * 100) / 100
        : 0;

    // Calculate attendance rate (percentage of days with activity)
    const attendanceRate =
      totalCampDays > 0 ? Math.round((daysCompleted / totalCampDays) * 100) : 0;

    // Get total participants count (for display only - no identities) - current cohort only
    const [totalParticipantsResult] = await db.query(
      `SELECT COUNT(*) as count FROM camp_enrollments WHERE camp_id = ? AND cohort_number = ?`,
      [id, userCohortNumber]
    );
    const totalParticipantsCount = totalParticipantsResult[0]?.count || 0;

    // Calculate user's rank (position only, no other user info)
    // Get count of users with more points (users above) - current cohort only
    const [rankResult] = await db.query(
      `
      SELECT COUNT(*) as users_above
      FROM camp_enrollments ce2
      WHERE ce2.camp_id = ?
      AND ce2.cohort_number = ?
      AND ce2.total_points > ?
      `,
      [id, userCohortNumber, userTotalPoints]
    );
    const usersAbove = rankResult[0]?.users_above || 0;
    // User's rank = users above + 1
    const userRank = usersAbove + 1;

    return {
      status: 200,

      success: true,
      message: "تم حساب الإحصائيات بنجاح",
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
        // New statistics
        bestDay: bestDay,
        productivityRate: productivityRate,
        attendanceRate: attendanceRate,
        totalParticipants: totalParticipantsCount,
        userRank: userRank, // Position only, respects privacy
      },
    };
  } catch (error) {
    console.error("Error in getMySummary:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء حساب الإحصائيات",
      },
    };
  }
};

module.exports = {
  calculateStreak,
  getMyStreak,
  updateStreak,
  getMyStats,
  getUserProgress,
  markTaskComplete,
  updateTaskBenefits,
  getStudyHallContent,
  getMySummary,
};
