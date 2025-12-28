const db = require("../config/database");
const campParticipantService = require("./campParticipantService");
const campNotificationService = require("./campNotificationService");
const mailService = require("./mailService");

/**
 * Camp Q&A Service
 * 
 * خدمة الأسئلة والأجوبة للمخيمات
 * تحتوi على جميع دوال إدارة الأسئلة والإجابات
 */

/**
 * Get all questions and answers for a camp
 * 
 * @param {Object} params - Parameters
 * @param {number} params.campId - Camp ID
 * @param {number} params.cohortNumber - Cohort number (optional, will use current if not provided)
 * @returns {Promise<{status: number, body: Object}>} - Response with Q&A data
 */
const getCampQuestions = async ({ campId, cohortNumber = null }) => {
  try {
    // Get cohort number from query or use current cohort
    let cohort;
    if (cohortNumber) {
      cohort = parseInt(cohortNumber);
    } else {
      cohort = await campParticipantService.getCurrentCohortNumber(campId);
    }

    const [qanda] = await db.query(
      `
      SELECT 
        q.id, q.question, q.answer, q.is_answered, q.created_at, q.answered_at,
        CASE 
          WHEN COALESCE(cs.hide_identity, false) = true THEN 'مشارك مجهول'
          ELSE u.username
        END as author,
        CASE 
          WHEN COALESCE(cs.hide_identity, false) = true THEN NULL
          ELSE u.avatar_url
        END as avatar_url,
        COALESCE(cs.hide_identity, false) as hide_identity
      FROM camp_qanda q
      JOIN users u ON q.user_id = u.id
      LEFT JOIN camp_enrollments ce ON ce.user_id = u.id AND ce.camp_id = q.camp_id AND ce.cohort_number = q.cohort_number
      LEFT JOIN camp_settings cs ON cs.enrollment_id = ce.id
      WHERE q.camp_id = ? AND q.cohort_number = ?
      ORDER BY q.created_at DESC
      `,
      [campId, cohort]
    );

    return {
      status: 200,
      body: {
        success: true,
        data: qanda,
      },
    };
  } catch (error) {
    console.error("Error in campQandAService.getCampQuestions:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء جلب الأسئلة والأجوبة",
      },
    };
  }
};

/**
 * Ask a new question in a camp
 * 
 * @param {Object} params - Parameters
 * @param {number} params.campId - Camp ID
 * @param {number} params.userId - User ID
 * @param {string} params.question - Question text
 * @returns {Promise<{status: number, body: Object}>} - Response with created question ID
 */
const askCampQuestion = async ({ campId, userId, question }) => {
  try {
    // Get current cohort number
    const currentCohortNumber =
      await campParticipantService.getCurrentCohortNumber(campId);

    const [result] = await db.query(
      `INSERT INTO camp_qanda (camp_id, user_id, question, cohort_number) VALUES (?, ?, ?, ?)`,
      [campId, userId, question, currentCohortNumber]
    );

    return {
      status: 201,
      body: {
        success: true,
        message: "تم إرسال سؤالك بنجاح",
        data: { id: result.insertId },
      },
    };
  } catch (error) {
    console.error("Error in campQandAService.askCampQuestion:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء إرسال السؤال",
      },
    };
  }
};

/**
 * Answer a question (admin/supervisor only)
 * 
 * @param {Object} params - Parameters
 * @param {number} params.questionId - Question ID
 * @param {number} params.adminId - Admin user ID
 * @param {string} params.answer - Answer text
 * @returns {Promise<{status: number, body: Object}>} - Response
 */
const answerCampQuestion = async ({ questionId, adminId, answer }) => {
  try {
    const [result] = await db.query(
      `
      UPDATE camp_qanda 
      SET answer = ?, is_answered = TRUE, answered_by_admin_id = ?, answered_at = NOW()
      WHERE id = ?
      `,
      [answer, adminId, questionId]
    );

    if (result.affectedRows === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "السؤال غير موجود",
        },
      };
    }

    // Create notification for the question author
    try {
      const [questionData] = await db.query(
        `SELECT q.user_id, q.camp_id, q.question, qc.name as camp_name, u.username, u.email
         FROM camp_qanda q
         JOIN quran_camps qc ON q.camp_id = qc.id
         JOIN users u ON q.user_id = u.id
         WHERE q.id = ?`,
        [questionId]
      );

      if (questionData.length > 0) {
        const { user_id, camp_id, camp_name, username, email } =
          questionData[0];

        // إدراج الإشعار في قاعدة البيانات
        let notificationInserted = false;
        let notificationError = null;

        // جلب الفوج الحالي
        const cohortNumber =
          await campNotificationService.getCurrentCohortNumber(camp_id);

        try {
          const [insertResult] = await db.query(
            `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
             VALUES (?, ?, 'qanda_answer', ?, ?, ?, NOW())`,
            [
              user_id,
              camp_id,
              "تم الرد على سؤالك",
              `تم الرد على سؤالك في مخيم "${camp_name}"`,
              cohortNumber,
            ]
          );

          notificationInserted = true;
        } catch (dbError) {
          notificationError = dbError;

          // محاولة استخدام 'admin_message' كبديل
          try {
            const [fallbackResult] = await db.query(
              `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
               VALUES (?, ?, 'admin_message', ?, ?, ?, NOW())`,
              [
                user_id,
                camp_id,
                "تم الرد على سؤالك",
                `تم الرد على سؤالك في مخيم "${camp_name}"`,
                cohortNumber,
              ]
            );

            console.log(
              `[Q&A Answer] ✅ Fallback notification inserted successfully! ID: ${fallbackResult.insertId}`
            );
            notificationInserted = true;
          } catch (fallbackError) {
            console.error(`[Q&A Answer] ❌❌ Fallback also failed!`, {
              code: fallbackError.code,
              errno: fallbackError.errno,
              message: fallbackError.message,
              sqlMessage: fallbackError.sqlMessage,
              stack: fallbackError.stack,
            });
          }
        }

        if (!notificationInserted) {
          console.error(
            `[Q&A Answer] ⚠️⚠️⚠️  CRITICAL: Notification was NOT inserted into database!`
          );
          console.error(
            `[Q&A Answer] notificationInserted flag: ${notificationInserted}`
          );
          if (notificationError) {
            console.error(
              `[Q&A Answer] Error details:`,
              JSON.stringify(
                notificationError,
                Object.getOwnPropertyNames(notificationError),
                2
              )
            );
          } else {
            console.error(
              `[Q&A Answer] No error object stored - this is suspicious!`
            );
          }
        } else {
          console.log(
            `[Q&A Answer] ✅✅✅ SUCCESS: Notification was inserted! notificationInserted=${notificationInserted}`
          );
        }

        // التحقق من إعدادات الإشعارات للمستخدم
        const shouldSend =
          await campNotificationService.checkNotificationSettings(
            user_id,
            camp_id,
            "general"
          );

        // إرسال email إذا كان المستخدم يريد الإشعارات
        if (shouldSend && email) {
          try {
            console.log(`[Q&A Answer] Attempting to send email to ${email}...`);
            const emailSubject = `💬 تم الرد على سؤالك في مخيم ${camp_name}`;
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl;">
                <h2 style="color: #4CAF50;">مرحباً ${username}! 👋</h2>
                <p>تم الرد على سؤالك في <strong>${camp_name}</strong></p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>الإجابة:</strong></p>
                  <p style="margin: 10px 0 0 0;">${answer}</p>
                </div>
                <p>يمكنك الاطلاع على جميع الأسئلة والأجوبة من خلال قسم الأسئلة الشائعة في المخيم.</p>
              </div>
            `;

            await mailService.sendMail({
              to: email,
              subject: emailSubject,
              html: emailHtml,
            });

            console.log(`[Q&A Answer] ✅ Email sent successfully to ${email}`);
          } catch (emailError) {
            console.error(
              `[Q&A Answer] ❌ Failed to send email to ${email}:`,
              emailError
            );
          }
        } else {
          console.log(
            `[Q&A Answer] ⏭️ Skipping email (shouldSend: ${shouldSend}, email: ${email})`
          );
        }
      }
    } catch (notificationError) {
      console.error(
        "[Q&A Answer] Error creating notification:",
        notificationError
      );
      // Continue anyway - notification failure shouldn't fail the answer
    }

    return {
      status: 200,
      body: {
        success: true,
        message: "تم الرد على السؤال بنجاح",
      },
    };
  } catch (error) {
    console.error("Error in campQandAService.answerCampQuestion:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء الرد على السؤال",
      },
    };
  }
};

/**
 * Delete a question
 * Admin can delete any question, user can only delete their own
 * 
 * @param {Object} params - Parameters
 * @param {number} params.questionId - Question ID
 * @param {number} params.userId - User ID
 * @param {string} params.userRole - User role (admin, user, etc.)
 * @returns {Promise<{status: number, body: Object}>} - Response
 */
const deleteCampQuestion = async ({ questionId, userId, userRole }) => {
  try {
    // Admin can delete any question, user can only delete their own
    const whereClause =
      userRole === "admin" ? "WHERE id = ?" : "WHERE id = ? AND user_id = ?";
    const params = userRole === "admin" ? [questionId] : [questionId, userId];

    const [result] = await db.query(
      `DELETE FROM camp_qanda ${whereClause}`,
      params
    );

    if (result.affectedRows === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "السؤال غير موجود أو لا تملك صلاحية حذفه",
        },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        message: "تم حذف السؤال بنجاح",
      },
    };
  } catch (error) {
    console.error("Error in campQandAService.deleteCampQuestion:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء حذف السؤال",
      },
    };
  }
};

module.exports = {
  getCampQuestions,
  askCampQuestion,
  answerCampQuestion,
  deleteCampQuestion,
};
