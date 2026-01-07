const db = require("../config/database");
const shortid = require("shortid");
const campParticipantService = require("./campParticipantService");
const mailService = require("./mailService");

/**
 * Get camp supervisors
 * @param {Object} params
 * @param {number} params.campId
 * @param {number} [params.cohortNumber]
 * @returns {Promise<{status: number, body: Object}>}
 */
const getCampSupervisors = async ({ campId, cohortNumber }) => {
  try {
    // Verify camp exists
    const [camps] = await db.query(
      "SELECT id, name FROM quran_camps WHERE id = ?",
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

    let query = `
      SELECT 
        cs.*,
        u.username,
        u.email,
        u.avatar_url,
        creator.username as created_by_username
      FROM camp_supervisors cs
      JOIN users u ON cs.user_id = u.id
      LEFT JOIN users creator ON cs.created_by = creator.id
      WHERE cs.camp_id = ?
    `;
    const params = [campId];

    if (cohortNumber) {
      query += ` AND (cs.cohort_number = ? OR cs.cohort_number IS NULL)`;
      params.push(cohortNumber);
    }

    query += ` ORDER BY cs.created_at DESC`;

    const [supervisors] = await db.query(query, params);
    return {
      status: 200,
      body: {
        success: true,
        data: supervisors,
      },
    };
  } catch (error) {
    console.error("Error in getCampSupervisors:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في جلب المشرفين",
        error: error.message,
      },
    };
  }
};

/**
 * Add camp supervisor
 * @param {Object} params
 * @param {number} params.campId
 * @param {number} params.userId
 * @param {number} params.createdBy
 * @param {number} [params.cohortNumber]
 * @returns {Promise<{status: number, body: Object}>}
 */
const addCampSupervisor = async ({
  campId,
  userId,
  createdBy,
  cohortNumber,
}) => {
  try {
    // Verify camp exists
    const [camps] = await db.query(
      "SELECT id, name FROM quran_camps WHERE id = ?",
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

    // Verify user exists
    const [users] = await db.query(
      "SELECT id, username FROM users WHERE id = ?",
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

    // Check if already a supervisor
    let checkQuery = `
      SELECT id FROM camp_supervisors 
      WHERE camp_id = ? AND user_id = ? AND (
        cohort_number = ? OR (cohort_number IS NULL AND ? IS NULL)
      )
    `;
    const [existing] = await db.query(checkQuery, [
      campId,
      userId,
      cohortNumber || null,
      cohortNumber || null,
    ]);

    if (existing.length > 0) {
      return {
        status: 400,
        body: {
          success: false,
          message: "المستخدم مشرف بالفعل على هذا المخيم/الفوج",
        },
      };
    }

    // Ensure supervisor is general (cohort_number = NULL) for all camps
    // Add supervisor to ALL camps as general supervisor
    const finalCohortNumber = null; // Always set to NULL for general supervision

    // Get all camps
    const [allCamps] = await db.query("SELECT id, name FROM quran_camps");

    // Add supervisor to all camps
    for (const camp of allCamps) {
      // Check if already a supervisor for this camp
      const [existing] = await db.query(
        `SELECT id FROM camp_supervisors 
         WHERE camp_id = ? AND user_id = ? AND cohort_number IS NULL`,
        [camp.id, userId]
      );

      if (existing.length === 0) {
        await db.query(
          `INSERT INTO camp_supervisors (camp_id, cohort_number, user_id, created_by)
           VALUES (?, ?, ?, ?)`,
          [camp.id, finalCohortNumber, userId, createdBy]
        );
      }
    }

    // Get user email and username for welcome email
    const [userDetails] = await db.query(
      "SELECT email, username FROM users WHERE id = ?",
      [userId]
    );

    // Send welcome email to new supervisor (mentioning all camps)
    if (userDetails.length > 0 && userDetails[0].email) {
      try {
        await mailService.sendSupervisorWelcomeEmail(
          userDetails[0].email,
          userDetails[0].username || "المشرف",
          "جميع المخيمات", // All camps
          null // No specific camp
        );
      } catch (emailError) {
        console.error("Error sending supervisor welcome email:", emailError);
        // Don't fail the operation if email fails
      }
    }

    // Auto-enroll supervisor if cohort was originally specified (for backward compatibility)
    // Note: Now supervisors are general, but we still check original cohortNumber for enrollment
    if (cohortNumber) {
      const [existingEnrollment] = await db.query(
        `SELECT id FROM camp_enrollments 
         WHERE user_id = ? AND camp_id = ? AND cohort_number = ?`,
        [userId, campId, cohortNumber]
      );

      if (existingEnrollment.length === 0) {
        const [cohorts] = await db.query(
          `SELECT start_date, status FROM camp_cohorts 
           WHERE camp_id = ? AND cohort_number = ?`,
          [campId, cohortNumber]
        );

        if (cohorts.length > 0) {
          // Generate friend code
          const generateFriendCode = () => {
            const timestamp = Date.now().toString(36).toUpperCase();
            const random = Math.random()
              .toString(36)
              .substring(2, 8)
              .toUpperCase();
            return `FC-${campId}-${timestamp}-${random}`;
          };

          let friendCode = generateFriendCode();
          let codeExists = true;
          let attempts = 0;
          const maxAttempts = 10;

          while (codeExists && attempts < maxAttempts) {
            const [existingCode] = await db.query(
              `SELECT id FROM camp_enrollments 
               WHERE friend_code = ? AND cohort_number = ?`,
              [friendCode, cohortNumber]
            );
            if (existingCode.length === 0) {
              codeExists = false;
            } else {
              friendCode = generateFriendCode();
              attempts++;
            }
          }

          await db.query(
            `INSERT INTO camp_enrollments 
             (user_id, camp_id, cohort_number, enrollment_date, status, friend_code, hide_identity)
             VALUES (?, ?, ?, NOW(), 'active', ?, false)`,
            [userId, campId, cohortNumber, friendCode]
          );
        }
      }
    }

    return {
      status: 200,
      body: {
        success: true,
        message: "تم إضافة المشرف بنجاح",
      },
    };
  } catch (error) {
    console.error("Error in addCampSupervisor:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return {
        status: 400,
        body: {
          success: false,
          message: "المستخدم مشرف بالفعل على هذا المخيم/الفوج",
        },
      };
    }
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في إضافة المشرف",
        error: error.message,
      },
    };
  }
};

/**
 * Remove camp supervisor
 * @param {Object} params
 * @param {number} params.campId
 * @param {number} params.userId
 * @param {number} [params.cohortNumber]
 * @returns {Promise<{status: number, body: Object}>}
 */
const removeCampSupervisor = async ({ campId, userId, cohortNumber }) => {
  try {
    // Verify supervisor exists
    let query = `
      SELECT id FROM camp_supervisors 
      WHERE camp_id = ? AND user_id = ?
    `;
    const params = [campId, userId];

    if (cohortNumber) {
      query += ` AND (cohort_number = ? OR cohort_number IS NULL)`;
      params.push(cohortNumber);
    } else {
      query += ` AND cohort_number IS NULL`;
    }

    const [supervisors] = await db.query(query, params);

    if (supervisors.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المشرف غير موجود",
        },
      };
    }

    // Remove supervisor
    await db.query(
      `DELETE FROM camp_supervisors WHERE camp_id = ? AND user_id = ? AND (
        cohort_number = ? OR (cohort_number IS NULL AND ? IS NULL)
      )`,
      [campId, userId, cohortNumber || null, cohortNumber || null]
    );

    return {
      status: 200,
      body: {
        success: true,
        message: "تم إزالة المشرف بنجاح",
      },
    };
  } catch (error) {
    console.error("Error in removeCampSupervisor:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ في إزالة المشرف",
        error: error.message,
      },
    };
  }
};

/**
 * Duplicate camp with all its content
 * @param {Object} params
 * @param {number} params.campId
 * @param {string} [params.name]
 * @param {string} [params.description]
 * @param {Date} [params.start_date]
 * @param {number} [params.duration_days]
 * @param {string} [params.banner_image]
 * @param {string} [params.tags]
 * @returns {Promise<{status: number, body: Object}>}
 */
const duplicateCamp = async ({
  campId,
  name,
  description,
  start_date,
  duration_days,
  banner_image,
  tags,
}) => {
  let connection;
  try {
    // Get original camp
    const [campData] = await db.query(
      "SELECT * FROM quran_camps WHERE id = ?",
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

    const originalCamp = campData[0];

    // Start transaction
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Create new camp
    const share_link = shortid.generate();
    const [newCampResult] = await connection.query(
      `
      INSERT INTO quran_camps (
        name, description, surah_number, surah_name, start_date, duration_days,
        banner_image, opening_surah_number, opening_surah_name, opening_youtube_url,
        share_link, tags, status, is_template
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'early_registration', 0)
    `,
      [
        name || `${originalCamp.name} (نسخة)`,
        description || originalCamp.description,
        originalCamp.surah_number,
        originalCamp.surah_name,
        start_date || originalCamp.start_date,
        duration_days || originalCamp.duration_days,
        banner_image || originalCamp.banner_image,
        originalCamp.opening_surah_number,
        originalCamp.opening_surah_name,
        originalCamp.opening_youtube_url,
        share_link,
        tags || originalCamp.tags,
      ]
    );

    const newCampId = newCampResult.insertId;

    // Copy task groups
    const [taskGroups] = await connection.query(
      "SELECT * FROM camp_task_groups WHERE camp_id = ?",
      [campId]
    );

    const groupIdMap = new Map();
    for (const group of taskGroups) {
      const [newGroupResult] = await connection.query(
        `
        INSERT INTO camp_task_groups (camp_id, title, description, parent_group_id, order_in_camp)
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          newCampId,
          group.title,
          group.description,
          group.parent_group_id
            ? groupIdMap.get(group.parent_group_id) || null
            : null,
          group.order_in_camp,
        ]
      );
      groupIdMap.set(group.id, newGroupResult.insertId);
    }

    // Copy tasks
    const [tasks] = await connection.query(
      "SELECT * FROM camp_daily_tasks WHERE camp_id = ?",
      [campId]
    );

    for (const task of tasks) {
      await connection.query(
        `
        INSERT INTO camp_daily_tasks (
          camp_id, day_number, task_type, title, description, verses_from, verses_to,
          tafseer_link, youtube_link, order_in_day, is_optional, points, estimated_time,
          group_id, order_in_group
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          newCampId,
          task.day_number,
          task.task_type,
          task.title,
          task.description,
          task.verses_from,
          task.verses_to,
          task.tafseer_link,
          task.youtube_link,
          task.order_in_day,
          task.is_optional,
          task.points,
          task.estimated_time,
          task.group_id ? groupIdMap.get(task.group_id) || null : null,
          task.order_in_group,
        ]
      );
    }

    // Copy resource categories
    const [categories] = await connection.query(
      "SELECT * FROM camp_resource_categories WHERE camp_id = ?",
      [campId]
    );

    const categoryIdMap = new Map();
    for (const category of categories) {
      const [newCategoryResult] = await connection.query(
        `
        INSERT INTO camp_resource_categories (camp_id, title, display_order)
        VALUES (?, ?, ?)
      `,
        [newCampId, category.title, category.display_order]
      );
      categoryIdMap.set(category.id, newCategoryResult.insertId);
    }

    // Copy resources
    const [resources] = await connection.query(
      "SELECT * FROM camp_resources WHERE camp_id = ?",
      [campId]
    );

    for (const resource of resources) {
      await connection.query(
        `
        INSERT INTO camp_resources (camp_id, category_id, title, url, resource_type, display_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [
          newCampId,
          resource.category_id
            ? categoryIdMap.get(resource.category_id) || null
            : null,
          resource.title,
          resource.url,
          resource.resource_type,
          resource.display_order,
        ]
      );
    }

    // Copy admin settings
    await connection.query(
      `
      UPDATE quran_camps SET
        enable_leaderboard = ?,
        enable_study_hall = ?,
        enable_public_enrollment = ?,
        auto_start_camp = ?,
        max_participants = ?,
        enable_notifications = ?,
        enable_daily_reminders = ?,
        enable_achievement_notifications = ?,
        visibility_mode = ?,
        allow_user_content = ?,
        enable_interactions = ?
        WHERE id = ?
      `,
      [
        originalCamp.enable_leaderboard,
        originalCamp.enable_study_hall,
        originalCamp.enable_public_enrollment,
        originalCamp.auto_start_camp,
        originalCamp.max_participants,
        originalCamp.enable_notifications,
        originalCamp.enable_daily_reminders,
        originalCamp.enable_achievement_notifications,
        originalCamp.visibility_mode || "public",
        originalCamp.allow_user_content,
        originalCamp.enable_interactions,
        newCampId,
      ]
    );

    await connection.commit();
    connection.release();

    return {
      status: 200,
      body: {
        success: true,
        message: "تم نسخ المخيم بنجاح",
        data: { campId: newCampId, share_link },
      },
    };
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("Error in duplicateCamp:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء نسخ المخيم",
      },
    };
  }
};

/**
 * Notify supervisors when a new cohort is created
 * @param {Object} params
 * @param {number} params.campId
 * @param {number} params.cohortNumber
 * @param {string} params.startDate
 * @param {string} params.endDate
 * @param {string} params.announcementMessage
 * @param {number} params.createdBy - Admin user ID who created the cohort
 * @returns {Promise<{supervisorEmailsSent: number, supervisorEmailsFailed: number, notifiedSupervisors: Array}>}
 */
const notifySupervisorsOnCohortCreation = async ({
  campId,
  cohortNumber,
  startDate,
  endDate,
  announcementMessage,
  createdBy,
}) => {
  let supervisorEmailsSent = 0;
  let supervisorEmailsFailed = 0;
  const notifiedSupervisors = [];

  try {
    // Get all general supervisors across ALL camps (cohort_number IS NULL)
    // These supervisors receive notifications for all cohorts in all camps
    const [supervisors] = await db.query(
      `SELECT DISTINCT u.id, u.email, u.username 
       FROM camp_supervisors cs
       JOIN users u ON cs.user_id = u.id
       WHERE cs.cohort_number IS NULL`,
      []
    );

    // Get camp details for email
    const [campDetails] = await db.query(
      `SELECT name, share_link FROM quran_camps WHERE id = ?`,
      [campId]
    );

    if (campDetails.length === 0) {
      console.error(`Camp ${campId} not found for supervisor notification`);
      return {
        supervisorEmailsSent,
        supervisorEmailsFailed,
        notifiedSupervisors,
      };
    }

    const campName = campDetails[0].name;
    const campShareLink = campDetails[0].share_link || campId;

    // Send briefing email to each supervisor
    for (const supervisor of supervisors) {
      try {
        await mailService.sendCampBriefing(
          supervisor.email,
          {
            name: campName,
            share_link: campShareLink,
            id: campId,
          },
          {
            cohortNumber,
            startDate,
            endDate,
          },
          announcementMessage
        );
        supervisorEmailsSent++;
        notifiedSupervisors.push({
          email: supervisor.email,
          username: supervisor.username,
        });
      } catch (emailError) {
        supervisorEmailsFailed++;
        console.error(
          `Error sending briefing email to supervisor ${supervisor.email}:`,
          emailError
        );
      }
    }
  } catch (error) {
    console.error("Error sending supervisor briefing emails:", error);
    // Don't throw - return what we have
  }

  // Send confirmation email to admin (the user who created the cohort)
  try {
    const [adminUser] = await db.query(
      "SELECT email, username FROM users WHERE id = ?",
      [createdBy]
    );

    if (adminUser.length > 0 && adminUser[0].email) {
      const adminEmail = adminUser[0].email;
      const adminUsername = adminUser[0].username || "المشرف";

      // Get camp name
      const [campDetailsForAdmin] = await db.query(
        `SELECT name FROM quran_camps WHERE id = ?`,
        [campId]
      );
      const campNameForAdmin = campDetailsForAdmin[0]?.name || campName;

      const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      };

      const confirmationHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #10b981; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 22px;">✅ تم إرسال الإشعارات بنجاح</h2>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              السلام عليكم ورحمة الله وبركاته،
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              عزيزي/عزيزتي <strong>${adminUsername}</strong>،
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              تم إنشاء الفوج رقم <strong>${cohortNumber}</strong> في مخيم <strong>${campNameForAdmin}</strong> بنجاح، وتم إرسال الإشعارات للمشرفين.
            </p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📊 ملخص الإشعارات:</h3>
              <p style="color: #4b5563; line-height: 1.8; margin: 5px 0;">
                <strong>عدد المشرفين الذين تم إرسال الإشعار لهم:</strong> ${supervisorEmailsSent}
              </p>
              ${
                supervisorEmailsFailed > 0
                  ? `
                <p style="color: #dc2626; line-height: 1.8; margin: 5px 0;">
                  <strong>عدد الإيميلات الفاشلة:</strong> ${supervisorEmailsFailed}
                </p>
              `
                  : ""
              }
            </div>
            
            ${
              notifiedSupervisors.length > 0
                ? `
              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h4 style="color: #1e40af; margin-top: 0; margin-bottom: 15px; font-size: 16px;">📧 قائمة المشرفين الذين تم إرسال الإشعار لهم:</h4>
                <ul style="color: #1e3a8a; line-height: 1.8; margin: 0; padding-right: 20px;">
                  ${notifiedSupervisors
                    .map((s) => `<li>${s.username} (${s.email})</li>`)
                    .join("")}
                </ul>
              </div>
            `
                : ""
            }
            
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 25px 0; border-right: 4px solid #10b981;">
              <p style="color: #166534; margin: 0; font-size: 14px; line-height: 1.6;">
                <strong>معلومات الفوج:</strong><br>
                • رقم الفوج: ${cohortNumber}<br>
                • تاريخ البدء: ${formatDate(startDate)}<br>
                ${endDate ? `• تاريخ الانتهاء: ${formatDate(endDate)}` : ""}
              </p>
            </div>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              فريق مشكاة الأحاديث
            </p>
          </div>
        </div>
      `;

      await mailService.sendMail(
        adminEmail,
        `✅ تأكيد: تم إرسال إشعارات الفوج رقم ${cohortNumber} في مخيم ${campNameForAdmin}`,
        "",
        confirmationHtml
      );
    }
  } catch (adminEmailError) {
    console.error("Error sending admin confirmation email:", adminEmailError);
    // Don't throw - continue
  }

  return { supervisorEmailsSent, supervisorEmailsFailed, notifiedSupervisors };
};

module.exports = {
  getCampSupervisors,
  addCampSupervisor,
  removeCampSupervisor,
  duplicateCamp,
  notifySupervisorsOnCohortCreation,
};
