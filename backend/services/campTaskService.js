const db = require("../config/database");
const campParticipantService = require("./campParticipantService");

/**
 * Get daily tasks for a camp
 * @param {Object} params
 * @param {number} params.campId
 * @param {string} [params.axisId] - Optional group/axis ID filter
 * @param {number} [params.cohortNumber] - Optional cohort number
 * @param {number} [params.userId] - Optional user ID for friend info
 * @returns {Promise<{status: number, body: Object}>}
 */
const getCampDailyTasks = async ({ campId, axisId, cohortNumber, userId }) => {
  try {
    // Get cohort number or use current cohort
    let effectiveCohortNumber = cohortNumber;
    if (!effectiveCohortNumber) {
      effectiveCohortNumber = await campParticipantService.getCurrentCohortNumber(campId);
    }

    // Build SQL query with optional axis filter
    let whereClause = "WHERE cdt.camp_id = ?";
    const queryParams = [campId];

    if (axisId) {
      whereClause += " AND cdt.group_id = ?";
      queryParams.push(axisId);
    }

    // Fetch basic tasks
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
       
        COALESCE(completion_counts.completed_by_count, 0) as completed_by_count
      FROM camp_daily_tasks cdt
      LEFT JOIN camp_task_groups ctg ON cdt.group_id = ctg.id
      LEFT JOIN (
        SELECT 
          task_id,
          COUNT(*) as completed_by_count
        FROM camp_task_progress ctp2
        JOIN camp_enrollments ce2 ON ctp2.enrollment_id = ce2.id
        WHERE ctp2.completed = true AND ce2.camp_id = ? AND ce2.cohort_number = ?
        GROUP BY task_id
      ) completion_counts ON cdt.id = completion_counts.task_id
      ${whereClause}
      ORDER BY 
        COALESCE(ctg.order_in_camp, 999999),
        cdt.day_number, 
        COALESCE(cdt.order_in_group, cdt.order_in_day)
    `,
      [campId, effectiveCohortNumber, ...queryParams]
    );

    // Fetch day challenges
    const [challengeRows] = await db.query(
      `
        SELECT day_number, title, description
        FROM camp_day_challenges
        WHERE camp_id = ?
      `,
      [campId]
    );

    const challengesByDay = challengeRows.reduce((acc, row) => {
      acc[row.day_number] = {
        title: row.title,
        description: row.description,
      };
      return acc;
    }, {});

    // Parse JSON fields and add challenges
    tasks.forEach((task) => {
      task.day_challenge = challengesByDay[task.day_number] || null;
      
      // Parse additional_links
      if (task.additional_links) {
        try {
          task.additional_links =
            typeof task.additional_links === "string"
              ? JSON.parse(task.additional_links)
              : task.additional_links;
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
      
      // Parse attachments
      if (task.attachments) {
        try {
          task.attachments =
            typeof task.attachments === "string"
              ? JSON.parse(task.attachments)
              : task.attachments;
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

    // Add friend information if userId provided
    if (userId) {
      const [campFriendships] = await db.query(
        `SELECT
          CASE
            WHEN user1_id = ? THEN user2_id
            ELSE user1_id
          END as friend_id
        FROM camp_friendships
        WHERE camp_id = ? AND cohort_number = ? AND (user1_id = ? OR user2_id = ?)`,
        [userId, campId, effectiveCohortNumber, userId, userId]
      );

      const friendIds = campFriendships.map((f) => f.friend_id);

      if (friendIds.length > 0) {
        // Get friends' progress for these tasks
        const [friendsProgress] = await db.query(
          `SELECT ctp.task_id, ctp.completed, u.id as user_id, u.username, u.avatar_url
           FROM camp_task_progress ctp
           JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
           JOIN users u ON ce.user_id = u.id
           WHERE ce.camp_id = ? AND ce.cohort_number = ? AND u.id IN (?)`,
          [campId, effectiveCohortNumber, friendIds]
        );

        // Group by task_id
        const friendsProgressByTask = friendsProgress.reduce((acc, p) => {
          if (!acc[p.task_id]) acc[p.task_id] = [];
          acc[p.task_id].push({
            user_id: p.user_id,
            name: p.username,
            avatar: p.avatar_url,
            completed: Boolean(p.completed),
          });
          return acc;
        }, {});

        tasks.forEach((task) => {
          task.friends_progress = friendsProgressByTask[task.id] || [];
        });
      }
    }

    // Calculate current camp day based on cohort start_date
    let campDay = null;
    if (effectiveCohortNumber) {
      const [cohortData] = await db.query(
        `SELECT start_date FROM camp_cohorts WHERE camp_id = ? AND cohort_number = ?`,
        [campId, effectiveCohortNumber]
      );

      if (cohortData.length > 0 && cohortData[0].start_date) {
        const cohortStartDate = new Date(cohortData[0].start_date);
        cohortStartDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate day difference
        const diffTime = today - cohortStartDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Camp day is 1-indexed (day 1 is the start date)
        campDay = diffDays + 1;

        // Ensure campDay is at least 1 (if today is before start_date, set to 0 or null)
        if (campDay < 1) {
          campDay = 0; // Or null - indicates camp hasn't started yet
        }
      }
    }

    return {
      status: 200,
      body: {
        success: true,
        data: tasks,
        dayChallenges: challengesByDay, // Add day challenges object for sidebar
        campDay: campDay, // Add current camp day to response
        cohortNumber: effectiveCohortNumber, // Also return the cohort number being shown
      },
    };
  } catch (error) {
    console.error("Error in getCampDailyTasks:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في جلب المهام اليومية",
        error: error.message,
      },
    };
  }
};

/**
 * Add daily tasks to camp
 * @param {Object} params
 * @param {number} params.campId
 * @param {Array} params.tasks - Array of task objects
 * @returns {Promise<{status: number, body: Object}>}
 */
const addDailyTasks = async ({ campId, tasks }) => {
  try {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {
        status: 400,
        body: {
          success: false,
          message: "يجب إرسال قائمة بالمهام",
        },
      };
    }

    // Insert all tasks
    for (const task of tasks) {
      const additionalLinksJson = task.additional_links
        ? typeof task.additional_links === "string"
          ? task.additional_links
          : JSON.stringify(task.additional_links)
        : null;
      const attachmentsJson = task.attachments
        ? typeof task.attachments === "string"
          ? task.attachments
          : JSON.stringify(task.attachments)
        : null;

      await db.query(
        `
        INSERT INTO camp_daily_tasks (
          camp_id, day_number, task_type, title, description,
          verses_from, verses_to, tafseer_link, youtube_link,
          additional_links, attachments,
          order_in_day, is_optional, points, estimated_time, group_id, order_in_group
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          campId,
          task.day_number,
          task.task_type,
          task.title,
          task.description,
          task.verses_from,
          task.verses_to,
          task.tafseer_link,
          task.youtube_link,
          additionalLinksJson,
          attachmentsJson,
          task.order_in_day,
          task.is_optional || false,
          task.points || 3,
          task.estimated_time || 30,
          task.group_id || null,
          task.order_in_group || null,
        ]
      );
    }

    return {
      status: 200,
      body: {
        success: true,
        message: "تم إضافة المهام اليومية بنجاح",
      },
    };
  } catch (error) {
    console.error("Error in addDailyTasks:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في إضافة المهام",
      },
    };
  }
};

/**
 * Update daily task
 * @param {Object} params
 * @param {number} params.taskId
 * @param {Object} params - Task fields to update
 * @returns {Promise<{status: number, body: Object}>}
 */
const updateDailyTask = async ({ taskId, ...fields }) => {
  try {
    const {
      day_number,
      task_type,
      title,
      description,
      verses_from,
      verses_to,
      tafseer_link,
      youtube_link,
      additional_links,
      attachments,
      order_in_day,
      is_optional,
      points,
      estimated_time,
      group_id,
      order_in_group,
    } = fields;

    // Convert JSON fields
    const additionalLinksJson =
      additional_links !== undefined
        ? typeof additional_links === "string"
          ? additional_links
          : JSON.stringify(additional_links)
        : null;
    const attachmentsJson =
      attachments !== undefined
        ? typeof attachments === "string"
          ? attachments
          : JSON.stringify(attachments)
        : null;

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
        additional_links = ?,
        attachments = ?,
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
        additionalLinksJson,
        attachmentsJson,
        order_in_day,
        is_optional,
        points,
        estimated_time,
        group_id,
        order_in_group,
        taskId,
      ]
    );

    return {
      status: 200,
      body: {
        success: true,
        message: "تم تحديث المهمة بنجاح",
      },
    };
  } catch (error) {
    console.error("Error in updateDailyTask:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في تحديث المهمة",
      },
    };
  }
};

/**
 * Delete daily task
 * @param {Object} params
 * @param {number} params.taskId
 * @returns {Promise<{status: number, body: Object}>}
 */
const deleteDailyTask = async ({ taskId }) => {
  try {
    if (!taskId) {
      return {
        status: 400,
        body: {
          success: false,
          message: "معرف المهمة مفقود",
        },
      };
    }

    const [result] = await db.query(
      "DELETE FROM camp_daily_tasks WHERE id = ?",
      [taskId]
    );

    if (result.affectedRows === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المهمة غير موجودة",
        },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        message: "تم حذف المهمة بنجاح",
      },
    };
  } catch (error) {
    console.error("Error in deleteDailyTask:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء حذف المهمة",
      },
    };
  }
};

/**
 * Get day challenges for a camp
 * @param {Object} params
 * @param {number} params.campId
 * @returns {Promise<{status: number, body: Object}>}
 */
const getCampDayChallenges = async ({ campId }) => {
  try {
    const [rows] = await db.query(
      `
        SELECT day_number, title, description
        FROM camp_day_challenges
        WHERE camp_id = ?
        ORDER BY day_number
      `,
      [campId]
    );

    return {
      status: 200,
      body: {
        success: true,
        data: rows,
      },
    };
  } catch (error) {
    console.error("Error in getCampDayChallenges:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في جلب تحديات الأيام",
      },
    };
  }
};

/**
 * Create or update a day challenge
 * @param {Object} params
 * @param {number} params.campId
 * @param {number} params.dayNumber
 * @param {string} params.title
 * @param {string} params.description
 * @returns {Promise<{status: number, body: Object}>}
 */
const upsertCampDayChallenge = async ({ campId, dayNumber, title, description }) => {
  try {
    const dayNum = Number(dayNumber);
    const trimmedTitle = typeof title === "string" ? title.trim() : "";
    const trimmedDescription =
      typeof description === "string" ? description.trim() : "";

    if (!Number.isInteger(dayNum) || dayNum <= 0) {
      return {
        status: 400,
        body: {
          success: false,
          message: "رقم اليوم غير صحيح",
        },
      };
    }

    if (!trimmedTitle ||!trimmedDescription) {
      return {
        status: 400,
        body: {
          success: false,
          message: "عنوان التحدي ووصفه مطلوبان",
        },
      };
    }

    const [camps] = await db.query(
      "SELECT duration_days FROM quran_camps WHERE id = ?",
      [campId]
    );

    if (camps.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المخيم غير موجود",
        },
      };
    }

    const durationDays = Number(camps[0].duration_days) || 0;
    if (durationDays > 0 && dayNum > durationDays) {
      return {
        status: 400,
        body: {
          success: false,
          message: `رقم اليوم يجب أن يكون بين 1 و ${durationDays}`,
        },
      };
    }

    await db.query(
      `
        INSERT INTO camp_day_challenges (camp_id, day_number, title, description)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          description = VALUES(description),
          updated_at = CURRENT_TIMESTAMP
      `,
      [campId, dayNum, trimmedTitle, trimmedDescription]
    );

    const [[challenge]] = await db.query(
      `
        SELECT day_number, title, description
        FROM camp_day_challenges
        WHERE camp_id = ? AND day_number = ?
      `,
      [campId, dayNum]
    );

    return {
      status: 200,
      body: {
        success: true,
        message: "تم حفظ التحدي اليومي بنجاح",
        data: challenge,
      },
    };
  } catch (error) {
    console.error("Error in upsertCampDayChallenge:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في حفظ التحدي اليومي",
      },
    };
  }
};

/**
 * Delete a day challenge
 * @param {Object} params
 * @param {number} params.campId
 * @param {number} params.dayNumber
 * @returns {Promise<{status: number, body: Object}>}
 */
const deleteCampDayChallenge = async ({ campId, dayNumber }) => {
  try {
    const dayNum = Number(dayNumber);

    if (!Number.isInteger(dayNum) || dayNum <= 0) {
      return {
        status: 400,
        body: {
          success: false,
          message: "رقم اليوم غير صحيح",
        },
      };
    }

    const [result] = await db.query(
      `
        DELETE FROM camp_day_challenges
        WHERE camp_id = ? AND day_number = ?
      `,
      [campId, dayNum]
    );

    if (result.affectedRows === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "لا يوجد تحدي لهذا اليوم",
        },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        message: "تم حذف التحدي اليومي بنجاح",
      },
    };
  } catch (error) {
    console.error("Error in deleteCampDayChallenge:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في حذف التحدي اليومي",
      },
    };
  }
};

module.exports = {
  getCampDailyTasks,
  addDailyTasks,
  updateDailyTask,
  deleteDailyTask,
  getCampDayChallenges,
  upsertCampDayChallenge,
  deleteCampDayChallenge,
};
