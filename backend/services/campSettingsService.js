const db = require("../config/database");

/**
 * Get admin camp settings
 * @param {Object} params
 * @param {number} params.campId
 * @returns {Promise<{status: number, body: Object}>}
 */
const getAdminCampSettings = async ({ campId }) => {
  try {
    // Get camp basic info
    const [camps] = await db.query("SELECT * FROM quran_camps WHERE id = ?", [
      campId,
    ]);

    if (camps.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المخيم غير موجود",
        },
      };
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

    return {
      status: 200,
      body: {
        success: true,
        data: settings,
      },
    };
  } catch (error) {
    console.error("Error in getAdminCampSettings:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في جلب إعدادات المخيم",
        error: error.message,
      },
    };
  }
};

/**
 * Update admin camp settings
 * @param {Object} params
 * @param {number} params.campId
 * @param {boolean} [params.enable_leaderboard]
 * @param {boolean} [params.enable_study_hall]
 * @param {boolean} [params.enable_public_enrollment]
 * @param {boolean} [params.auto_start_camp]
 * @param {number} [params.max_participants]
 * @param {boolean} [params.enable_notifications]
 * @param {boolean} [params.enable_daily_reminders]
 * @param {boolean} [params.enable_achievement_notifications]
 * @param {string} [params.visibility_mode]
 * @param {boolean} [params.allow_user_content]
 * @param {boolean} [params.enable_interactions]
 * @returns {Promise<{status: number, body: Object}>}
 */
const updateAdminCampSettings = async ({
  campId,
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
}) => {
  try {
    // Check if camp exists and get current enable_public_enrollment value
    const [camps] = await db.query(
      "SELECT id, name, enable_public_enrollment FROM quran_camps WHERE id = ?",
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

    const oldEnablePublicEnrollment = camps[0].enable_public_enrollment;
    const campName = camps[0].name;

    // Validate visibility_mode
    const validVisibilityModes = ["public", "private", "unlisted"];
    if (visibility_mode && !validVisibilityModes.includes(visibility_mode)) {
      return {
        status: 400,
        body: {
          success: false,
          message: "وضع الرؤية غير صحيح",
        },
      };
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
      return {
        status: 400,
        body: {
          success: false,
          message: "لم يتم إرسال أي إعدادات للتحديث",
        },
      };
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    updateValues.push(campId);

    // Update camp settings
    await db.query(
      `UPDATE quran_camps SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    // Return information about public enrollment change for controller to handle notifications
    const publicEnrollmentChanged =
      enable_public_enrollment !== undefined &&
      oldEnablePublicEnrollment === false &&
      enable_public_enrollment === true;

    return {
      status: 200,
      body: {
        success: true,
        message: "تم تحديث إعدادات المخيم بنجاح",
        publicEnrollmentChanged,
        campId,
        campName,
      },
    };
  } catch (error) {
    console.error("Error in updateAdminCampSettings:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في تحديث إعدادات المخيم",
        error: error.message,
      },
    };
  }
};

module.exports = {
  getAdminCampSettings,
  updateAdminCampSettings,
};
