const db = require("../config/database");
const mailService = require("../services/mailService");
const CampNotificationService = require("../services/campNotificationService");
const CampReferralService = require("../services/campReferralService");

// Shared helpers (copied from controller to keep behavior identical)
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

const isSupervisor = async (campId, userId, cohortNumber = null) => {
  try {
    let query = `
      SELECT 1 FROM camp_supervisors 
      WHERE camp_id = ? AND user_id = ?`;
    const params = [campId, userId];

    if (cohortNumber !== null) {
      query += ` AND (cohort_number = ? OR cohort_number IS NULL)`;
      params.push(cohortNumber);
    }

    query += " LIMIT 1";
    const [rows] = await db.query(query, params);
    return rows.length > 0;
  } catch (error) {
    console.error("Error checking supervisor status:", error);
    return false;
  }
};

const enrollUser = async ({
  campId,
  userId,
  hideIdentity = false,
  cohortNumber,
  referralCode, // إضافة كود الإحالة
}) => {
  try {
    const [camps] = await db.query(`SELECT * FROM quran_camps WHERE id = ?`, [
      campId,
    ]);

    const camp = camps[0];

    const currentCohortNumber = await getCurrentCohortNumber(campId);
    let targetCohortNumber;

    if (cohortNumber && cohortNumber !== currentCohortNumber) {
      const [cohorts] = await db.query(
        `SELECT * FROM camp_cohorts 
         WHERE camp_id = ? AND cohort_number = ?`,
        [campId, cohortNumber]
      );

      if (cohorts.length > 0) {
        const cohort = cohorts[0];
        if (
          cohort.is_open === 1 ||
          cohort.status === "active" ||
          cohort.status === "early_registration"
        ) {
          targetCohortNumber = cohortNumber;
        } else {
          targetCohortNumber = currentCohortNumber;
        }
      } else {
        targetCohortNumber = currentCohortNumber;
      }
    } else {
      targetCohortNumber = currentCohortNumber;
    }

    const [finalCohortCheck] = await db.query(
      `SELECT * FROM camp_cohorts 
       WHERE camp_id = ? AND cohort_number = ?`,
      [campId, targetCohortNumber]
    );

    if (finalCohortCheck.length === 0) {
      console.error(
        `[EnrollInCamp] Cohort ${targetCohortNumber} not found for camp ${campId}`
      );
      return {
        status: 400,
        body: { success: false, message: "لا يوجد فوج متاح للتسجيل حالياً" },
      };
    }
    const isReadOnly =
      camp.status === "completed" || camp.status === "cancelled";

    console.log(
      `[EnrollInCamp] User ${userId} attempting to enroll in camp ${campId}, cohort ${targetCohortNumber}`
    );

    const cohort = finalCohortCheck[0];
    const maxParticipants = cohort.max_participants
      ? Number(cohort.max_participants)
      : camp.max_participants
      ? Number(camp.max_participants)
      : null;

    if (maxParticipants && maxParticipants > 0) {
      const [countRows] = await db.query(
        `SELECT COUNT(*) AS count 
         FROM camp_enrollments ce
         WHERE ce.camp_id = ? AND ce.cohort_number = ?
         AND NOT EXISTS (
           SELECT 1 FROM camp_supervisors cs 
           WHERE cs.camp_id = ce.camp_id 
           AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
           AND cs.user_id = ce.user_id
         )`,
        [campId, targetCohortNumber]
      );
      const currentEnrollments = Number(countRows?.[0]?.count || 0);
      if (currentEnrollments >= maxParticipants) {
        return {
          status: 400,
          body: {
            success: false,
            message: "عذراً، اكتمل العدد في هذا الفوج",
            code: "CAMP_CAPACITY_REACHED",
          },
        };
      }
    }

    const userIsSupervisor = await isSupervisor(
      campId,
      userId,
      targetCohortNumber
    );

    const [existingEnrollment] = await db.query(
      `
      SELECT * FROM camp_enrollments 
      WHERE user_id = ? AND camp_id = ? AND cohort_number = ?
    `,
      [userId, campId, targetCohortNumber]
    );

    if (existingEnrollment.length > 0) {
      return {
        status: 400,
        body: { success: false, message: "أنت مسجل بالفعل في هذا المخيم" },
      };
    }

    const generateReferralCode = () => {
      // توليد كود قصير يناسب VARCHAR(20)
      const random1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const random2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `${random1}${random2}`; // 8 أحرف فقط
    };

    // توليد كود إحالة فريد لهذا الـ enrollment الجديد
    let myReferralCode = generateReferralCode();
    let codeExists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (codeExists && attempts < maxAttempts) {
      const [existingCode] = await db.query(
        `SELECT id FROM camp_enrollments WHERE referral_code = ? AND camp_id = ? AND cohort_number = ?`,
        [myReferralCode, campId, targetCohortNumber]
      );

      if (existingCode.length === 0) {
        codeExists = false;
      } else {
        myReferralCode = generateReferralCode();
        attempts++;
      }
    }

    if (codeExists) {
      myReferralCode = `REF-${campId}-${userId}-${Date.now()}`;
    }

    const [enrollmentResult] = await db.query(
      `
      INSERT INTO camp_enrollments (user_id, camp_id, status, referral_code, cohort_number)
      VALUES (?, ?, 'enrolled', ?, ?)
    `,
      [userId, campId, myReferralCode, targetCohortNumber]
    );

    const enrollmentId = enrollmentResult.insertId;

    // DEBUG: Log referralCode value
    console.log(
      `[EnrollInCamp] DEBUG - Received referralCode: "${referralCode}", type: ${typeof referralCode}, enrollmentId: ${enrollmentId}`
    );

    // CRITICAL: تسجيل الإحالة إذا كان المستخدم جاء من رابط إحالة
    if (referralCode && enrollmentId) {
      try {
        const trackResult = await CampReferralService.trackReferral(
          referralCode, // الكود اللي استخدمه المستخدم للدخول
          enrollmentId,
          targetCohortNumber
        );
        if (trackResult.success) {
          console.log(
            `[EnrollInCamp] Tracked referral using code ${referralCode} for enrollment ${enrollmentId}`
          );
        } else {
          console.log(
            `[EnrollInCamp] Failed to track referral: ${trackResult.message}`
          );
        }
      } catch (trackError) {
        console.error("[EnrollInCamp] Error tracking referral:", trackError);
        // لا نريد أن يفشل التسجيل بسبب خطأ في الإحالة
      }
    } else {
      console.log(
        `[EnrollInCamp] Skipping referral tracking - referralCode: ${referralCode}, enrollmentId: ${enrollmentId}`
      );
    }

    console.log(
      `[EnrollInCamp] Successfully enrolled user ${userId} in camp ${campId}, cohort ${targetCohortNumber}, enrollment_id: ${enrollmentId}`
    );

    await db.query(
      `
      INSERT INTO camp_settings (enrollment_id, hide_identity)
      VALUES (?, ?)
    `,
      [enrollmentId, hideIdentity]
    );

    // إكمال الإحالة إذا كان المستخدم محالاً (يجب أن يحدث دائماً بعد التسجيل)
    // يتم استدعاؤه خارج شرط isReadOnly لأن الإحالة يجب أن تكتمل حتى في المخيمات المنتهية
    try {
      const referralResult = await CampReferralService.completeReferral(
        enrollmentId
      );
      if (referralResult.success) {
        console.log(
          `[EnrollInCamp] Completed referral from ${referralResult.referrerName}`
        );
      } else {
        console.log(
          `[EnrollInCamp] No pending referral to complete: ${referralResult.message}`
        );
      }
    } catch (referralError) {
      console.error("Error completing referral:", referralError);
      // لا نريد أن يفشل التسجيل بسبب خطأ في الإحالة
    }

    if (!isReadOnly) {
      try {
        await CampNotificationService.sendWelcomeNotification(
          userId,
          campId,
          camp.name
        );
      } catch (notificationError) {
        console.error("Error sending welcome notification:", notificationError);
      }
      const [user] = await db.query(
        `
        SELECT * FROM users WHERE id = ?
      `,
        [userId]
      );
      try {
        await mailService.sendCampWelcomeEmail(
          user[0].email,
          user[0].username,
          camp.name,
          campId
        );
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
      }
    }

    return {
      status: 200,
      body: {
        success: true,
        message: isReadOnly
          ? "تم التسجيل في المخيم المنتهي. يمكنك إكمال المهام لكن بدون تفاعل اجتماعي"
          : "تم التسجيل في المخيم بنجاح",
        data: { read_only: isReadOnly, supervisor: Boolean(userIsSupervisor) },
      },
    };
  } catch (error) {
    console.error("Error enrolling in camp:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return {
        status: 400,
        body: {
          success: false,
          message:
            "يبدو أن هناك مشكلة في قاعدة البيانات. يرجى تشغيل migration script لإصلاح unique constraint.",
          code: "CONSTRAINT_ISSUE",
        },
      };
    }

    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في التسجيل",
        error: error.message,
      },
    };
  }
};

const removeUserFromCamp = async ({ campId, userId }) => {
  try {
    const currentCohortNumber = await getCurrentCohortNumber(campId);
    await db.query("START TRANSACTION");

    try {
      await db.query(
        "DELETE FROM camp_enrollments WHERE camp_id = ? AND user_id = ? AND cohort_number = ?",
        [campId, userId, currentCohortNumber]
      );

      await db.query(
        `
        DELETE ctp FROM camp_task_progress ctp
        INNER JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
        WHERE ce.camp_id = ? AND ce.user_id = ? AND ce.cohort_number = ?
      `,
        [campId, userId, currentCohortNumber]
      );

      await db.query(
        `DELETE fr FROM friend_requests fr
         WHERE fr.status = 'pending'
           AND (fr.sender_id = ? OR fr.receiver_id = ?)
           AND (
             fr.sender_id IN (SELECT user_id FROM camp_enrollments WHERE camp_id = ? AND cohort_number = ?)
             OR fr.receiver_id IN (SELECT user_id FROM camp_enrollments WHERE camp_id = ? AND cohort_number = ?)
           )`,
        [
          userId,
          userId,
          campId,
          currentCohortNumber,
          campId,
          currentCohortNumber,
        ]
      );

      await db.query("COMMIT");

      return {
        status: 200,
        body: { status: "success", message: "تم حذف المستخدم من المخيم بنجاح" },
      };
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error removing user from camp:", error);
    return {
      status: 500,
      body: {
        status: "error",
        message: "حدث خطأ أثناء حذف المستخدم من المخيم",
        error: error.message,
      },
    };
  }
};

const leaveCamp = async ({ campId, userId }) => {
  try {
    const currentCohortNumber = await getCurrentCohortNumber(campId);
    await db.query("START TRANSACTION");

    const [enrollments] = await db.query(
      "SELECT id FROM camp_enrollments WHERE camp_id = ? AND user_id = ? AND cohort_number = ?",
      [campId, userId, currentCohortNumber]
    );

    if (enrollments.length === 0) {
      await db.query("ROLLBACK");
      return {
        status: 404,
        body: { status: "error", message: "لست مسجلاً في هذا المخيم" },
      };
    }

    const enrollmentId = enrollments[0].id;

    await db.query("DELETE FROM camp_task_progress WHERE enrollment_id = ?", [
      enrollmentId,
    ]);

    await db.query(
      "DELETE FROM camp_notifications WHERE camp_id = ? AND user_id = ?",
      [campId, userId]
    );

    await db.query("DELETE FROM camp_notification_stats WHERE user_id = ?", [
      userId,
    ]);

    await db.query("DELETE FROM camp_settings WHERE enrollment_id = ?", [
      enrollmentId,
    ]);

    await db.query(
      "DELETE FROM camp_enrollments WHERE camp_id = ? AND user_id = ? AND cohort_number = ?",
      [campId, userId, currentCohortNumber]
    );

    await db.query(
      `DELETE fr FROM friend_requests fr
       WHERE fr.status = 'pending'
         AND (fr.sender_id = ? OR fr.receiver_id = ?)
         AND (
           fr.sender_id IN (SELECT user_id FROM camp_enrollments WHERE camp_id = ? AND cohort_number = ?)
           OR fr.receiver_id IN (SELECT user_id FROM camp_enrollments WHERE camp_id = ? AND cohort_number = ?)
         )`,
      [userId, userId, campId, currentCohortNumber, campId, currentCohortNumber]
    );

    await db.query("COMMIT");

    return {
      status: 200,
      body: {
        status: "success",
        message: "تم ترك المخيم بنجاح وحذف جميع البيانات المرتبطة",
      },
    };
  } catch (error) {
    await db.query("ROLLBACK");

    console.error("Error leaving camp:", error);
    return {
      status: 500,
      body: {
        status: "error",
        message: "حدث خطأ أثناء ترك المخيم",
        error: error.message,
      },
    };
  }
};

const getCampSettings = async ({ campId, userId, userRole }) => {
  try {
    const currentCohortNumber = await getCurrentCohortNumber(campId);
    const hasSupervisorAccess = await isSupervisor(
      campId,
      userId,
      currentCohortNumber
    );
    const userIsAdmin = userId === 1 && userRole === "admin";

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
            WHERE ce.camp_id = ? AND ce.user_id = ? AND ce.cohort_number = ?
          `,
      [campId, userId, currentCohortNumber]
    );

    if (enrollments.length === 0 && (hasSupervisorAccess || userIsAdmin)) {
      const defaultSettings = {
        hide_identity: false,
        notifications_enabled: true,
        daily_reminders: true,
        achievement_notifications: true,
        leaderboard_visibility: true,
      };

      return { status: 200, body: { success: true, data: defaultSettings } };
    }

    if (enrollments.length === 0) {
      return {
        status: 404,
        body: { success: false, message: "لست مسجلاً في هذا المخيم" },
      };
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

    return { status: 200, body: { success: true, data: settings } };
  } catch (error) {
    console.error("Error fetching camp settings:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في جلب الإعدادات",
        error: error.message,
      },
    };
  }
};

const updateCampSettings = async ({
  campId,
  userId,
  userRole,
  hide_identity,
  notifications_enabled,
  daily_reminders,
  achievement_notifications,
  leaderboard_visibility,
}) => {
  try {
    const currentCohortNumber = await getCurrentCohortNumber(campId);
    const hasSupervisorAccess = await isSupervisor(
      campId,
      userId,
      currentCohortNumber
    );
    const userIsAdmin = userId === 1 && userRole === "admin";

    const [enrollments] = await db.query(
      "SELECT id FROM camp_enrollments WHERE camp_id = ? AND user_id = ? AND cohort_number = ?",
      [campId, userId, currentCohortNumber]
    );

    if (enrollments.length === 0) {
      return {
        status: 400,
        body: {
          success: false,
          message: "لا يمكن تحديث الإعدادات بدون تسجيل في المخيم",
        },
      };
    }

    const enrollmentId = enrollments[0].id;

    await db.query("START TRANSACTION");

    try {
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

      try {
        const redisClient = require("../utils/redisClient");
        if (redisClient) {
          const cacheKey = `leaderboard_${campId}_*`;
          const keys = await redisClient.keys(cacheKey);
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
          message: "تم تحديث الإعدادات بنجاح",
          data: {
            hide_identity: Boolean(hide_identity),
            notifications_enabled: Boolean(notifications_enabled),
            daily_reminders: Boolean(daily_reminders),
            achievement_notifications: Boolean(achievement_notifications),
            leaderboard_visibility: Boolean(leaderboard_visibility),
          },
        },
      };
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error updating camp settings:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في تحديث الإعدادات",
        error: error.message,
      },
    };
  }
};

module.exports = {
  enrollUser,
  removeUserFromCamp,
  leaveCamp,
  getCampSettings,
  updateCampSettings,
  getCurrentCohortNumber,
  isSupervisor,
};
