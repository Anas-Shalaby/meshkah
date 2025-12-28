const db = require("../config/database");

/**
 * Camp Reflection Service
 * Handles all reflection and benefit-related operations
 * - Upvotes and saves
 * - Fetching saved reflections
 * - Deleting reflections
 * - Sharing benefits
 * - Downloading reflections as PDF
 */

/**
 * Toggle upvote for a reflection
 * @param {Object} params
 * @param {number} params.progressId - Progress ID
 * @param {number} params.userId - User ID
 * @returns {Promise<{status: number, body: Object}>}
 */
const toggleUpvoteReflection = async ({ progressId, userId }) => {
  try {
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
      return {
        status: 404,
        body: {
          success: false,
          message: "التدبر غير موجود",
        },
      };
    }

    // منع التفاعل في المخيمات المنتهية
    if (progress[0].camp_status === "completed") {
      return {
        status: 403,
        body: {
          success: false,
          message: "لا يمكن التفاعل مع محتوى المخيمات المنتهية",
        },
      };
    }

    // Get the cohort number from the progress record
    const [progressEnrollment] = await db.query(
      "SELECT cohort_number FROM camp_enrollments WHERE id = ?",
      [progress[0].enrollment_id]
    );

    const progressCohortNumber = progressEnrollment[0]?.cohort_number;

    // Check if user is enrolled in the same camp and cohort
    const [enrollment] = await db.query(
      "SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ? AND cohort_number = ?",
      [userId, progress[0].camp_id, progressCohortNumber]
    );

    if (enrollment.length === 0) {
      return {
        status: 403,
        body: {
          success: false,
          message: "غير مسموح لك بالتصويت على هذا التدبر",
        },
      };
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

      return {
        status: 200,
        body: {
          success: true,
          message: "تم إلغاء التصويت",
          upvoted: false,
        },
      };
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

      // Send notification to reflection owner (only if not self-upvote)
      if (progress[0].owner_id !== userId) {
        try {
          const CampNotificationService = require("./campNotificationService");

          // Get reflection content for notification
          const reflectionText =
            progress[0].journal_entry || progress[0].notes || "";
          const truncatedText = reflectionText
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/g, " ")
            .trim()
            .substring(0, 100);

          // Get upvoter info
          const [upvoterInfo] = await db.query(
            `SELECT u.username, ce.id as enrollment_id 
             FROM users u
             JOIN camp_enrollments ce ON ce.user_id = u.id
             WHERE u.id = ? AND ce.camp_id = ?`,
            [userId, progress[0].camp_id]
          );

          if (upvoterInfo.length > 0) {
            // Check if upvoter hides identity
            const [upvoterSettings] = await db.query(
              `SELECT hide_identity FROM camp_settings WHERE enrollment_id = ?`,
              [upvoterInfo[0].enrollment_id]
            );
            const isAnonymous =
              upvoterSettings.length > 0 &&
              Boolean(upvoterSettings[0].hide_identity);

            // Check if they are friends
            const user1Id = Math.min(userId, progress[0].owner_id);
            const user2Id = Math.max(userId, progress[0].owner_id);
            const [friendship] = await db.query(
              `SELECT id FROM camp_friendships WHERE camp_id = ? AND user1_id = ? AND user2_id = ?`,
              [progress[0].camp_id, user1Id, user2Id]
            );
            const areFriends = friendship.length > 0;

            // Build notification message
            let title = "إعجاب جديد بفائدتك!";
            let message = "";

            if (areFriends && !isAnonymous) {
              message = `أعجب "${
                upvoterInfo[0].username
              }" بفائدتك: "${truncatedText}${
                truncatedText.length >= 100 ? "..." : ""
              }"`;
            } else if (areFriends && isAnonymous) {
              message = `أعجب أحد أصحابك بفائدتك: "${truncatedText}${
                truncatedText.length >= 100 ? "..." : ""
              }"`;
            } else {
              message = `أعجب أحد المشاركين بفائدتك: "${truncatedText}${
                truncatedText.length >= 100 ? "..." : ""
              }"`;
            }

            // Get cohort number
            const cohortNumber = progressCohortNumber || 1;

            // Insert notification (no email, only in-app)
            await db.query(
              `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
               VALUES (?, ?, 'admin_message', ?, ?, ?, NOW())`,
              [
                progress[0].owner_id,
                progress[0].camp_id,
                title,
                message,
                cohortNumber,
              ]
            );
          }
        } catch (notificationError) {
          console.error(
            "Error sending upvote notification:",
            notificationError
          );
          // Don't fail the upvote if notification fails
        }
      }

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

      return {
        status: 200,
        body: {
          success: true,
          message: "تم التصويت بنجاح",
          upvoted: true,
        },
      };
    }
  } catch (error) {
    console.error("Error in toggleUpvoteReflection:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في التصويت",
      },
    };
  }
};

/**
 * Toggle save for a reflection
 * @param {Object} params
 * @param {number} params.progressId - Progress ID
 * @param {number} params.userId - User ID
 * @returns {Promise<{status: number, body: Object}>}
 */
const toggleSaveReflection = async ({ progressId, userId }) => {
  try {
    // Check if reflection exists and user has access
    const [progress] = await db.query(
      `
      SELECT ctp.*, ce.user_id as owner_id, ce.camp_id, cc.status as cohort_status
      FROM camp_task_progress ctp
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN quran_camps qc ON ce.camp_id = qc.id
      JOIN camp_cohorts cc ON ce.camp_id = cc.camp_id AND ce.cohort_number = cc.cohort_number
      WHERE ctp.id = ? AND (ctp.journal_entry IS NOT NULL OR ctp.notes IS NOT NULL)
      `,
      [progressId]
    );

    if (progress.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "التدبر غير موجود",
        },
      };
    }

    // منع التفاعل في المخيمات المنتهية
    if (progress[0].cohort_status === "completed") {
      return {
        status: 403,
        body: {
          success: false,
          message: "لا يمكن التفاعل مع محتوى المخيمات المنتهية",
        },
      };
    }

    // Get the cohort number from the progress record
    const [progressEnrollment] = await db.query(
      "SELECT cohort_number FROM camp_enrollments WHERE id = ?",
      [progress[0].enrollment_id]
    );

    const progressCohortNumber = progressEnrollment[0]?.cohort_number;

    // Check if user is enrolled in the same camp and cohort
    const [enrollment] = await db.query(
      "SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ? AND cohort_number = ?",
      [userId, progress[0].camp_id, progressCohortNumber]
    );

    if (enrollment.length === 0) {
      return {
        status: 403,
        body: {
          success: false,
          message: "غير مسموح لك بحفظ هذا التدبر",
        },
      };
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

      return {
        status: 200,
        body: {
          success: true,
          message: "تم إلغاء الحفظ",
          saved: false,
        },
      };
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

      return {
        status: 200,
        body: {
          success: true,
          message: "تم الحفظ بنجاح",
          saved: true,
        },
      };
    }
  } catch (error) {
    console.error("Error in toggleSaveReflection:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في الحفظ",
      },
    };
  }
};

/**
 * Get saved reflections for a user
 * @param {Object} params
 * @param {number} params.userId - User ID
 * @param {number} params.campId - Camp ID
 * @param {number} params.page - Page number (default 1)
 * @param {number} params.limit - Items per page (default 10)
 * @param {string} params.sort - Sort order (newest, oldest, most_upvoted, most_saved)
 * @returns {Promise<{status: number, body: Object}>}
 */
const getSavedReflections = async ({
  userId,
  campId,
  page = 1,
  limit = 10,
  sort = "newest",
}) => {
  try {
    const offset = (page - 1) * limit;

    // Get user's enrollment - use the most recent enrollment regardless of current cohort
    const [enrollment] = await db.query(
      "SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ? ORDER BY cohort_number DESC, id DESC LIMIT 1",
      [userId, campId]
    );

    if (enrollment.length === 0) {
      return {
        status: 403,
        body: {
          success: false,
          message: "غير مسموح لك بالوصول لهذا المخيم",
        },
      };
    }

    // Use user's actual cohort number, not camp's current cohort
    const userCohortNumber = enrollment[0].cohort_number || 1;

    // Get user info for myReflections
    const [users] = await db.query(
      "SELECT username, avatar_url FROM users WHERE id = ?",
      [userId]
    );
    const user = users[0] || { username: "User", avatar_url: null };

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
        ctp.share_link,
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
      WHERE usr.user_id = ? AND ce.camp_id = ? AND ce.cohort_number = ?
        AND (
          (ctp.journal_entry IS NOT NULL AND ctp.journal_entry != '' AND TRIM(REPLACE(REPLACE(REPLACE(ctp.journal_entry, '<p>', ''), '</p>', ''), '&nbsp;', '')) != '')
          OR (ctp.notes IS NOT NULL AND ctp.notes != '' AND TRIM(ctp.notes) != '')
        )
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
      `,
      [
        userId,
        userId,
        userId,
        userId,
        campId,
        userCohortNumber,
        parseInt(limit),
        offset,
      ]
    );

    // Get total count
    const [countResult] = await db.query(
      `
      SELECT COUNT(*) as total
      FROM user_saved_reflections usr
      JOIN camp_task_progress ctp ON usr.progress_id = ctp.id
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      WHERE usr.user_id = ? AND ce.camp_id = ? AND ce.cohort_number = ?
        AND (ctp.journal_entry IS NOT NULL OR ctp.notes IS NOT NULL)
      `,
      [userId, campId, userCohortNumber]
    );

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Get my reflections (user's own contributions to this camp)
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
        ctp.share_link,
        ctp.upvote_count,
        ctp.save_count,
        ctp.created_at,
        ctp.completed_at,
        cdt.title as task_title,
        cdt.day_number,
        cdt.task_type,
        '${user.username}' as author_name,
        '${user.avatar_url}' as author_avatar,
        0 as hide_identity,
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
      FROM camp_task_progress ctp
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      LEFT JOIN (
        SELECT progress_id, COUNT(*) as pledge_count
        FROM joint_step_pledges
        GROUP BY progress_id
      ) pledge_counts ON ctp.id = pledge_counts.progress_id
      WHERE ce.user_id = ? AND ce.camp_id = ?
        AND (
          (ctp.journal_entry IS NOT NULL AND ctp.journal_entry != '' AND TRIM(REPLACE(REPLACE(REPLACE(ctp.journal_entry, '<p>', ''), '</p>', ''), '&nbsp;', '')) != '')
          OR (ctp.notes IS NOT NULL AND ctp.notes != '' AND TRIM(ctp.notes) != '')
        )
      ORDER BY ctp.created_at DESC
      `,
      [userId, userId, userId, userId, campId]
    );

    // Get My Action Plan (User's action plan items) - Placeholder for now
    const myActionPlan = null;

    // Get user's pledges (commitments to others' steps)
    const [myPledges] = await db.query(
      `
      SELECT 
        jsp.id as pledge_id,
        jsp.progress_id,
        jsp.created_at as pledged_at,
        ctp.proposed_step,
        ctp.journal_entry,
        ctp.notes,
        cdt.title as task_title,
        cdt.day_number,
        cdt.task_type,
        ce.user_id as inspirer_user_id,
        u.username as inspirer_name,
        u.avatar_url as inspirer_avatar,
        cs.hide_identity as inspirer_hide_identity,
        ctp.share_link
      FROM joint_step_pledges jsp
      JOIN camp_task_progress ctp ON jsp.progress_id = ctp.id
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      JOIN users u ON ce.user_id = u.id
      LEFT JOIN camp_settings cs ON ce.id = cs.enrollment_id
      WHERE jsp.pledger_user_id = ? AND ce.camp_id = ? AND ce.cohort_number = ?
      ORDER BY jsp.created_at DESC
      `,
      [userId, campId, userCohortNumber]
    );

    return {
      status: 200,
      body: {
        success: true,
        data: {
          savedReflections,
          myReflections,
          myActionPlan,
          myPledges: myPledges || [],
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
        },
      },
    };
  } catch (error) {
    console.error("Error in getSavedReflections:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في جلب الفوائد المحفوظة",
      },
    };
  }
};

/**
 * Delete a reflection
 * @param {Object} params
 * @param {number} params.progressId - Progress ID
 * @param {number} params.userId - User ID
 * @returns {Promise<{status: number, body: Object}>}
 */
const deleteReflection = async ({ progressId, userId }) => {
  try {
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
      return {
        status: 404,
        body: {
          success: false,
          message: "التدبر غير موجود",
        },
      };
    }

    // منع الحذف في المخيمات المنتهية
    if (reflection[0].camp_status === "completed") {
      return {
        status: 403,
        body: {
          success: false,
          message: "لا يمكن حذف محتوى المخيمات المنتهية",
        },
      };
    }

    // التحقق من أن المستخدم هو صاحب التدبر
    if (reflection[0].user_id !== userId) {
      return {
        status: 403,
        body: {
          success: false,
          message: "غير مسموح لك بحذف هذا التدبر",
        },
      };
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

    // Clear study hall cache for this camp
    try {
      const redisClient = require("../utils/redisClient");
      if (redisClient) {
        const pattern = `study_hall:${reflection[0].camp_id}:*`;
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      }
    } catch (redisError) {
      console.log("Redis not available for cache clearing");
    }

    return {
      status: 200,
      body: {
        success: true,
        message: "تم حذف التدبر بنجاح",
      },
    };
  } catch (error) {
    console.error("Error in deleteReflection:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في حذف التدبر",
      },
    };
  }
};

/**
 * Share a benefit (make it public)
 * @param {Object} params
 * @param {number} params.benefitId - Benefit ID (progress_id)
 * @param {number} params.userId - User ID
 * @returns {Promise<{status: number, body: Object}>}
 */
const shareBenefit = async ({ benefitId, userId }) => {
  try {
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
      return {
        status: 404,
        body: {
          success: false,
          message: "الفائدة غير موجودة",
        },
      };
    }

    // Check if user owns this benefit
    if (progress[0].user_id !== userId) {
      return {
        status: 403,
        body: {
          success: false,
          message: "غير مصرح لك بمشاركة هذه الفائدة",
        },
      };
    }

    // Check if camp is completed
    if (progress[0].camp_status === "completed") {
      return {
        status: 403,
        body: {
          success: false,
          message: "لا يمكن مشاركة محتوى المخيمات المنتهية",
        },
      };
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

    return {
      status: 200,
      body: {
        success: true,
        message: "تم مشاركة الفائدة بنجاح في قاعة التدارس",
      },
    };
  } catch (error) {
    console.error("Error in shareBenefit:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في مشاركة الفائدة",
      },
    };
  }
};

/**
 * Download user reflections as PDF
 * @param {Object} params
 * @param {number} params.campId - Camp ID
 * @param {number} params.userId - User ID
 * @returns {Promise<{status: number, body: Object}>}
 */
const downloadReflectionsPDF = async ({ campId, userId }) => {
  try {
    // Get user's enrollment - use the most recent enrollment
    const [enrollments] = await db.query(
      `SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ? ORDER BY cohort_number DESC, id DESC LIMIT 1`,
      [userId, campId]
    );

    if (enrollments.length === 0) {
      return {
        status: 403,
        body: {
          success: false,
          message: "لست مسجلاً في هذا المخيم",
        },
      };
    }

    const enrollment = enrollments[0];

    // Get camp details
    const [campData] = await db.query(
      `SELECT id, name, description, surah_name, start_date, duration_days, status FROM quran_camps WHERE id = ?`,
      [campId]
    );

    if (campData.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المخيم غير موجود",
        },
      };
    }

    const camp = campData[0];

    // Get user details
    const [users] = await db.query(
      `SELECT username, email FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المستخدم غير موجود",
        },
      };
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
        AND TRIM(REPLACE(REPLACE(REPLACE(ctp.journal_entry, '<p>', ''), '</p>', ''), '&nbsp;', '')) != ''
      ORDER BY ctp.created_at ASC
      `,
      [enrollment.id]
    );

    if (reflections.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "لا توجد فوائد لتحميلها",
        },
      };
    }

    // Return data for PDF generation (controller will handle actual PDF creation)
    return {
      status: 200,
      body: {
        success: true,
        data: {
          camp,
          user,
          reflections,
        },
      },
    };
  } catch (error) {
    console.error("Error in downloadReflectionsPDF:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في تحميل الفوائد",
      },
    };
  }
};

module.exports = {
  toggleUpvoteReflection,
  toggleSaveReflection,
  getSavedReflections,
  deleteReflection,
  shareBenefit,
  downloadReflectionsPDF,
};
