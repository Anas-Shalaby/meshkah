const db = require("../config/database");

class CampNotificationService {
  // التحقق من إعدادات الإشعارات للمستخدم
  static async checkNotificationSettings(userId, campId, notificationType) {
    try {
      const [settings] = await db.query(
        `SELECT 
           COALESCE(cs.notifications_enabled, true) as notifications_enabled,
           COALESCE(cs.daily_reminders, true) as daily_reminders,
           COALESCE(cs.achievement_notifications, true) as achievement_notifications
         FROM camp_enrollments ce
         LEFT JOIN camp_settings cs ON ce.id = cs.enrollment_id
         WHERE ce.user_id = ? AND ce.camp_id = ?`,
        [userId, campId]
      );

      // إذا لم يتم العثور على إعدادات، افترض أن الإشعارات مفعلة (للتأكد من إرسال الإشعارات)
      if (settings.length === 0) {
        console.log(
          `[Notification Settings] No settings found for user ${userId} in camp ${campId}, defaulting to enabled`
        );
        return true; // افتراضي: أرسل الإشعارات
      }

      const userSettings = settings[0];

      // التحقق من نوع الإشعار
      switch (notificationType) {
        case "welcome":
        case "general":
          return userSettings.notifications_enabled;
        case "daily_reminder":
        case "daily_message":
          return (
            userSettings.notifications_enabled && userSettings.daily_reminders
          );
        case "achievement":
        case "milestone":
          return (
            userSettings.notifications_enabled &&
            userSettings.achievement_notifications
          );
        default:
          return userSettings.notifications_enabled;
      }
    } catch (error) {
      console.error("Error checking notification settings:", error);
      return true; // في حالة الخطأ، أرسل الإشعار افتراضياً
    }
  }

  // إرسال إشعار ترحيب عند التسجيل في المخيم
  static async sendWelcomeNotification(userId, campId, campName) {
    try {
      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        userId,
        campId,
        "welcome"
      );
      if (!shouldSend) {
        console.log(
          `Welcome notification skipped for user ${userId} due to settings`
        );
        return;
      }

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message) 
         VALUES (?, ?, 'welcome', ?, ?)`,
        [
          userId,
          campId,
          `مرحباً بك في = ${campName}! 🎉`,
          `أهلاً وسهلاً بك في  ${campName}! نحن سعداء لانضمامك إلينا في هذه الرحلة القرآنية المباركة. استعد لرحلة مليئة بالبركة والفوائد.`,
        ]
      );
    } catch (error) {
      console.error("Error sending welcome notification:", error);
    }
  }

  // إرسال تذكير يومي بمهام اليوم
  static async sendDailyReminder(
    userId,
    campId,
    campName,
    dayNumber,
    tasksCount
  ) {
    try {
      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        userId,
        campId,
        "daily_reminder"
      );
      if (!shouldSend) {
        console.log(
          `Daily reminder skipped for user ${userId} due to settings`
        );
        return;
      }

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message) 
         VALUES (?, ?, 'daily_reminder', ?, ?)`,
        [
          userId,
          campId,
          `تذكير يومي - اليوم ${dayNumber} من مخيم ${campName} 📅`,
          `مرحباً! اليوم هو اليوم ${dayNumber} من مخيم ${campName}. لديك ${tasksCount} مهام مباركة في انتظارك. لا تفوت فرصة الحصول على الأجر والثواب!`,
        ]
      );
      console.log(
        `Daily reminder sent to user ${userId} for camp ${campId}, day ${dayNumber}`
      );
    } catch (error) {
      console.error("Error sending daily reminder:", error);
    }
  }

  // إرسال تذكير يومي لجميع المشتركين في مخيم نشط
  static async sendDailyRemindersToAllActiveCamps() {
    try {
      // احسب تاريخ اليوم بتوقيت الرياض لتجنب انزياح اليوم بسبب UTC
      const riyadhFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Riyadh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const todayParts = riyadhFormatter.formatToParts(new Date());
      const y = todayParts.find((p) => p.type === "year").value;
      const m = todayParts.find((p) => p.type === "month").value;
      const d = todayParts.find((p) => p.type === "day").value;
      const todayStr = `${y}-${m}-${d}`; // YYYY-MM-DD بتوقيت الرياض

      // أولاً: جلب معلومات المخيمات النشطة للتحقق
      const [debugCamps] = await db.query(
        `
        SELECT 
          qc.id,
          qc.name,
          qc.status,
          qc.start_date,
          qc.reopened_date,
          qc.duration_days,
          CASE 
            -- إذا كان reopened_date موجوداً، استخدمه كتاريخ بداية (بغض النظر عن الحالة)
            WHEN qc.reopened_date IS NOT NULL THEN 
              (DATEDIFF(?, DATE(qc.reopened_date)) + 1)
            -- وإلا استخدم start_date
            ELSE 
              (DATEDIFF(?, DATE(CONVERT_TZ(qc.start_date, '+00:00', '+03:00'))) + 1)
          END as calculated_day
        FROM quran_camps qc
        WHERE qc.status IN ('active', 'reopened')
        `,
        [todayStr, todayStr]
      );

      // جلب المستخدمين المشتركين في مخيمات نشطة ولديهم مهام اليوم غير مكتملة
      const [usersToNotify] = await db.query(
        `
        SELECT DISTINCT
          ce.user_id,
          qc.id as camp_id,
          qc.name as camp_name,
          CASE 
            -- إذا كان reopened_date موجوداً، استخدمه كتاريخ بداية (بغض النظر عن الحالة)
            WHEN qc.reopened_date IS NOT NULL THEN 
              (DATEDIFF(?, DATE(qc.reopened_date)) + 1)
            -- وإلا استخدم start_date
            ELSE 
              (DATEDIFF(?, DATE(CONVERT_TZ(qc.start_date, '+00:00', '+03:00'))) + 1)
          END as current_day,
          COUNT(cdt.id) as pending_tasks_count
        FROM quran_camps qc
        JOIN camp_enrollments ce ON qc.id = ce.camp_id
        JOIN camp_daily_tasks cdt ON qc.id = cdt.camp_id
        LEFT JOIN camp_task_progress ctp ON 
          ctp.task_id = cdt.id 
          AND ctp.enrollment_id = ce.id 
          AND ctp.completed = 1
        WHERE 
          -- المخيم نشط أو أعيد فتحه
          qc.status IN ('active', 'reopened')
          -- المخيم شغال حالياً (اليوم بين البداية والنهاية) - تحويل توقيت الرياض
          AND (
            CASE 
              -- إذا كان reopened_date موجوداً، استخدمه كتاريخ بداية (بغض النظر عن الحالة)
              WHEN qc.reopened_date IS NOT NULL THEN 
                DATE(qc.reopened_date)
              ELSE 
                DATE(CONVERT_TZ(qc.start_date, '+00:00', '+03:00'))
            END
          ) <= ?
          AND ? < DATE_ADD(
            CASE 
              WHEN qc.reopened_date IS NOT NULL THEN 
                DATE(qc.reopened_date)
              ELSE 
                DATE(CONVERT_TZ(qc.start_date, '+00:00', '+03:00'))
            END, 
            INTERVAL qc.duration_days DAY
          )
          -- المستخدم مشترك
          AND (ce.status IS NULL OR ce.status = 'enrolled')
          -- المهام المطلوبة اليوم (اليوم الحالي من عمر المخيم) - تحويل توقيت الرياض
          AND cdt.day_number = (
            CASE 
              -- إذا كان reopened_date موجوداً، استخدمه كتاريخ بداية (بغض النظر عن الحالة)
              WHEN qc.reopened_date IS NOT NULL THEN 
                (DATEDIFF(?, DATE(qc.reopened_date)) + 1)
              ELSE 
                (DATEDIFF(?, DATE(CONVERT_TZ(qc.start_date, '+00:00', '+03:00'))) + 1)
            END
          )
          -- المهمة غير مكتملة لهذا المستخدم
          AND ctp.id IS NULL
        GROUP BY
          ce.user_id,
          qc.id,
          qc.name,
          qc.start_date,
          qc.reopened_date,
          qc.status
        HAVING pending_tasks_count > 0
        `,
        [todayStr, todayStr, todayStr, todayStr, todayStr, todayStr]
      );

      if (usersToNotify.length === 0) {
        // تحقق إضافي: لماذا لم يتم العثور على أحد؟
        for (const camp of debugCamps) {
          const [enrollments] = await db.query(
            `SELECT ce.id, ce.user_id, ce.status FROM camp_enrollments ce 
             WHERE ce.camp_id = ? AND (ce.status IS NULL OR ce.status = 'enrolled')`,
            [camp.id]
          );

          const [tasksForDay] = await db.query(
            `SELECT COUNT(*) as count FROM camp_daily_tasks 
             WHERE camp_id = ? AND day_number = ?`,
            [camp.id, camp.calculated_day]
          );

          if (tasksForDay[0].count > 0 && enrollments.length > 0) {
            for (const enr of enrollments) {
              const [completedTasks] = await db.query(
                `SELECT COUNT(*) as count 
                 FROM camp_task_progress ctp
                 JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
                 WHERE ctp.enrollment_id = ? 
                   AND cdt.camp_id = ?
                   AND cdt.day_number = ?
                   AND ctp.completed = 1`,
                [enr.id, camp.id, camp.calculated_day]
              );
              console.log(
                `  - User ${enr.user_id} enrollment ${enr.id}: completed=${
                  completedTasks[0].count
                }, pending=${tasksForDay[0].count - completedTasks[0].count}`
              );
            }
          }
        }
      }

      let sent = 0;
      for (const user of usersToNotify) {
        try {
          await this.sendDailyReminder(
            user.user_id,
            user.camp_id,
            user.camp_name,
            user.current_day,
            user.pending_tasks_count
          );
          sent++;
        } catch (error) {
          console.error(
            `Failed to send reminder to user ${user.user_id} for camp ${user.camp_id}:`,
            error
          );
        }
      }

      console.log(
        `Daily reminders processed. Found ${usersToNotify.length} users with pending tasks, sent ${sent} notifications`
      );
    } catch (error) {
      console.error("Error sending daily reminders:", error);
    }
  }

  // إرسال إشعار إنجاز عند إكمال مهمة
  static async sendAchievementNotification(
    userId,
    campId,
    campName,
    taskTitle,
    pointsEarned
  ) {
    try {
      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        userId,
        campId,
        "achievement"
      );
      if (!shouldSend) {
        console.log(
          `Achievement notification skipped for user ${userId} due to settings`
        );
        return;
      }

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message) 
         VALUES (?, ?, 'achievement', ?, ?)`,
        [
          userId,
          campId,
          `إنجاز جديد! 🎉`,
          `مبروك! لقد أكملت مهمة "${taskTitle}" في مخيم ${campName} وحصلت على ${pointsEarned} نقطة. استمر في التقدم!`,
        ]
      );
    } catch (error) {
      console.error("Error sending achievement notification:", error);
    }
  }

  // إرسال إشعار إنجاز عند الوصول لمرحلة معينة
  static async sendMilestoneNotification(
    userId,
    campId,
    campName,
    milestone,
    totalPoints
  ) {
    try {
      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        userId,
        campId,
        "achievement"
      );
      if (!shouldSend) {
        console.log(
          `Milestone notification skipped for user ${userId} due to settings`
        );
        return;
      }

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message) 
         VALUES (?, ?, 'achievement', ?, ?)`,
        [
          userId,
          campId,
          `مرحلة جديدة! 🏆`,
          `تهانينا! لقد وصلت إلى ${milestone} في مخيم ${campName} بإجمالي ${totalPoints} نقطة. أنت على الطريق الصحيح!`,
        ]
      );
    } catch (error) {
      console.error("Error sending milestone notification:", error);
    }
  }

  // إرسال إشعار عام من المخيم
  static async sendGeneralNotification(
    userId,
    campId,
    campName,
    title,
    message
  ) {
    try {
      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        userId,
        campId,
        "admin_message"
      );
      if (!shouldSend) {
        console.log(
          `General notification skipped for user ${userId} due to settings`
        );
        return;
      }

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message) 
         VALUES (?, ?, 'admin_message', ?, ?)`,
        [userId, campId, title, message]
      );
    } catch (error) {
      console.error("Error sending general notification:", error);
    }
  }

  // جلب إشعارات المستخدم
  static async getUserNotifications(userId, limit = 20, offset = 0) {
    try {
      const [notifications] = await db.query(
        `SELECT 
           cn.*,
           qc.name as camp_name
         FROM camp_notifications cn
         LEFT JOIN quran_camps qc ON cn.camp_id = qc.id
         WHERE cn.user_id = ?
         ORDER BY cn.sent_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      return notifications;
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      return [];
    }
  }

  // تحديد إشعار كمقروء
  static async markAsRead(notificationId, userId) {
    try {
      await db.query(
        `UPDATE camp_notifications 
         SET is_read = true, read_at = NOW() 
         WHERE id = ? AND user_id = ?`,
        [notificationId, userId]
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  // تحديد جميع إشعارات المستخدم كمقروءة
  static async markAllAsRead(userId) {
    try {
      await db.query(
        `UPDATE camp_notifications 
         SET is_read = true, read_at = NOW() 
         WHERE user_id = ? AND is_read = false`,
        [userId]
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }

  // جلب عدد الإشعارات غير المقروءة
  static async getUnreadCount(userId) {
    try {
      const [result] = await db.query(
        `SELECT COUNT(*) as count FROM camp_notifications 
         WHERE user_id = ? AND is_read = false`,
        [userId]
      );
      return result[0].count;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  // إرسال إشعار عند انتهاء المخيم
  static async sendCampFinishedNotification(userId, campId, campName) {
    try {
      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        userId,
        campId,
        "achievement"
      );
      if (!shouldSend) {
        console.log(
          `Camp finished notification skipped for user ${userId} due to settings`
        );
        return;
      }

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message) 
         VALUES (?, ?, 'achievement', ?, ?)`,
        [
          userId,
          campId,
          `🎉 مبارك! انتهى مخيم "${campName}"`,
          `تهانينا! لقد انتهى مخيم "${campName}". يمكنك الآن عرض ملخص إنجازك الكامل والإحصائيات التفصيلية من صفحة المخيم.`,
        ]
      );
    } catch (error) {
      console.error("Error sending camp finished notification:", error);
    }
  }

  // إرسال إشعار بدء المخيم
  static async sendCampStartedNotification(userId, campId, campName) {
    try {
      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        userId,
        campId,
        "general"
      );
      if (!shouldSend) {
        console.log(
          `Camp started notification skipped for user ${userId} due to settings`
        );
        return;
      }

      // التحقق من عدم إرسال الإشعار من قبل
      const [existing] = await db.query(
        `SELECT id FROM camp_notifications 
         WHERE user_id = ? AND camp_id = ? AND type = 'admin_message' 
         AND title LIKE ?`,
        [userId, campId, `%بدأ مخيم%`]
      );

      if (existing.length > 0) {
        console.log(`Camp started notification already sent to user ${userId}`);
        return;
      }

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message) 
         VALUES (?, ?, 'admin_message', ?, ?)`,
        [
          userId,
          campId,
          `🎊 بدأ مخيم "${campName}"!`,
          `مبارك! بدأ مخيم "${campName}" الآن. استعد لرحلة مليئة بالبركة والفوائد. ابدأ في إكمال مهام اليوم الأول! 🚀`,
        ]
      );
    } catch (error) {
      console.error("Error sending camp started notification:", error);
    }
  }

  // إرسال ملخص الصحبة اليومي
  static async sendFriendsDigestNotification(userId, campId, message) {
    try {
      // التحقق من إعدادات الإشعارات
      // نستخدم "general" كنوع الإشعار لأن هذا ملخص عام
      const shouldSend = await this.checkNotificationSettings(
        userId,
        campId,
        "general"
      );
      if (!shouldSend) {
        console.log(
          `Friends digest notification skipped for user ${userId} due to settings`
        );
        return;
      }

      // التحقق من عدم إرسال ملخص اليوم بالفعل (لتجنب التكرار)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [existing] = await db.query(
        `SELECT id FROM camp_notifications 
         WHERE user_id = ? 
           AND camp_id = ? 
           AND type = 'friends_digest'
           AND sent_at >= ? 
           AND sent_at < ?`,
        [userId, campId, today, tomorrow]
      );

      if (existing.length > 0) {
        console.log(
          `Friends digest notification already sent to user ${userId} today`
        );
        return;
      }

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message) 
         VALUES (?, ?, 'friends_digest', ?, ?)`,
        [userId, campId, "حصاد صحبتك اليوم 🔥", message]
      );

      console.log(
        `Friends digest notification sent to user ${userId} for camp ${campId}`
      );
    } catch (error) {
      console.error("Error sending friends digest notification:", error);
      throw error;
    }
  }
  static async sendFriendRequestNotification(
    senderId,
    receiverId,
    campId,
    senderUsername
  ) {
    try {
      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        receiverId,
        campId,
        "general"
      );
      if (!shouldSend) {
        console.log(
          `Friend request notification skipped for user ${receiverId} due to settings`
        );
        return;
      }

      // جلب اسم المخيم
      const [campInfo] = await db.query(
        `SELECT name FROM quran_camps WHERE id = ?`,
        [campId]
      );
      const campName = campInfo.length > 0 ? campInfo[0].name : "المخيم";

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message) 
         VALUES (?, ?, 'friend_request', ?, ?)`,
        [
          receiverId,
          campId,
          "طلب صداقة جديد",
          `${senderUsername} أرسل لك طلب صداقة في مخيم ${campName}`,
        ]
      );
      console.log(
        `Friend request notification sent to user ${receiverId} from ${senderId} in camp ${campId}`
      );
    } catch (error) {
      console.error("Error sending friend request notification:", error);
      throw error;
    }
  }

  static async respondToFriendRequestNotification(
    receiverId,
    senderId,
    campId,
    action,
    receiverUsername
  ) {
    try {
      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        senderId,
        campId,
        "general"
      );
      if (!shouldSend) {
        console.log(
          `Friend request response notification skipped for user ${senderId} due to settings`
        );
        return;
      }

      // جلب اسم المخيم
      const [campInfo] = await db.query(
        `SELECT name FROM quran_camps WHERE id = ?`,
        [campId]
      );
      const campName = campInfo.length > 0 ? campInfo[0].name : "المخيم";

      const actionText = action === "قبول" ? "قبل" : "رفض";
      const titleText =
        action === "قبول" ? "تم قبول طلب الصداقة" : "تم رفض طلب الصداقة";

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message) 
         VALUES (?, ?, 'friend_request_response', ?, ?)`,
        [
          senderId,
          campId,
          titleText,
          `${receiverUsername} ${actionText} طلب صداقتك في مخيم ${campName}`,
        ]
      );
      console.log(
        `Friend request response notification sent to user ${senderId} from ${receiverId} in camp ${campId}`
      );
    } catch (error) {
      console.error("Error responding to friend request notification:", error);
      throw error;
    }
  }

  // إرسال إشعار عند الالتزام بخطوة مشتركة
  static async sendJointStepNotification(
    pledgerId,
    inspirerId,
    campId,
    stepText
  ) {
    try {
      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        inspirerId,
        campId,
        "general"
      );
      if (!shouldSend) {
        console.log(
          `Joint step notification skipped for user ${inspirerId} due to settings`
        );
        return;
      }

      // 1. تحقق من الصداقة في هذا المخيم
      const user1Id = Math.min(pledgerId, inspirerId);
      const user2Id = Math.max(pledgerId, inspirerId);
      const [campFriendship] = await db.query(
        `SELECT id FROM camp_friendships WHERE camp_id = ? AND user1_id = ? AND user2_id = ?`,
        [campId, user1Id, user2Id]
      );
      const areFriends = campFriendship.length > 0;

      // 2. تحقق من الخصوصية (hide_identity)
      // نحتاج إلى enrollment_id للملتزم (pledger)
      const [pledgerEnrollment] = await db.query(
        `SELECT id FROM camp_enrollments WHERE user_id = ? AND camp_id = ?`,
        [pledgerId, campId]
      );

      let isAnonymous = false;
      if (pledgerEnrollment.length > 0) {
        const [campSettings] = await db.query(
          `SELECT hide_identity FROM camp_settings WHERE enrollment_id = ?`,
          [pledgerEnrollment[0].id]
        );
        if (campSettings.length > 0) {
          isAnonymous = Boolean(campSettings[0].hide_identity);
        }
      }

      // 3. قرر نص الرسالة
      let title = "التزام جديد!";
      let message = "";

      if (areFriends && !isAnonymous) {
        // أصدقاء وليس مجهول - أظهر الاسم
        const [pledgerUser] = await db.query(
          `SELECT username FROM users WHERE id = ?`,
          [pledgerId]
        );
        const pledgerUsername =
          pledgerUser.length > 0 ? pledgerUser[0].username : "صديقك";
        message = `صاحبك "${pledgerUsername}" أُلهم بخطوتك، والتزم معك بـ: "${stepText}".`;
      } else if (areFriends && isAnonymous) {
        // أصدقاء لكن مجهول - لا تظهر الاسم
        message = `أحد أصحابك أُلهم بخطوتك، والتزم معك بـ: "${stepText}".`;
      } else {
        // ليسوا أصدقاء أو مجهول
        message = `أحد المشاركين أُلهم بخطوتك، والتزم معك بـ: "${stepText}".`;
      }

      // 4. حفظ الإشعار
      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, sent_at) 
         VALUES (?, ?, 'joint_step_pledge', ?, ?, NOW())`,
        [inspirerId, campId, title, message]
      );

      console.log(
        `Joint step notification sent to user ${inspirerId} from ${pledgerId} in camp ${campId}`
      );
    } catch (error) {
      console.error("Error sending joint step notification:", error);
      throw error;
    }
  }

  // إرسال Daily Messages المجدولة للمستخدمين
  static async sendScheduledDailyMessages() {
    try {
      console.log("[Daily Messages] Starting scheduled daily messages job...");

      // حساب اليوم الحالي من عمر المخيم (بتوقيت الرياض)
      const now = new Date();
      const riyadhDate = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Riyadh" })
      );
      const todayStr = riyadhDate.toISOString().split("T")[0];

      // جلب جميع الرسائل النشطة التي يجب إرسالها اليوم
      // نحتاج للتحقق من اليوم الحالي لكل مخيم
      const [activeCamps] = await db.query(
        `
        SELECT DISTINCT
          qc.id as camp_id,
          qc.name as camp_name,
          qc.start_date,
          qc.reopened_date,
          qc.duration_days,
          CASE 
            WHEN qc.reopened_date IS NOT NULL THEN 
              (DATEDIFF(?, DATE(qc.reopened_date)) + 1)
            ELSE 
              (DATEDIFF(?, DATE(CONVERT_TZ(qc.start_date, '+00:00', '+03:00'))) + 1)
          END as current_day
        FROM quran_camps qc
        WHERE qc.status IN ('active', 'reopened')
          AND (
            CASE 
              WHEN qc.reopened_date IS NOT NULL THEN 
                DATE(qc.reopened_date)
              ELSE 
                DATE(CONVERT_TZ(qc.start_date, '+00:00', '+03:00'))
            END
          ) <= ?
          AND ? < DATE_ADD(
            CASE 
              WHEN qc.reopened_date IS NOT NULL THEN 
                DATE(qc.reopened_date)
              ELSE 
                DATE(CONVERT_TZ(qc.start_date, '+00:00', '+03:00'))
            END, 
            INTERVAL qc.duration_days DAY
          )
      `,
        [todayStr, todayStr, todayStr, todayStr]
      );

      if (activeCamps.length === 0) {
        console.log("[Daily Messages] No active camps found");
        return;
      }

      console.log(
        `[Daily Messages] Found ${activeCamps.length} active camps to process`
      );

      let totalSent = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      for (const camp of activeCamps) {
        try {
          // جلب الرسائل النشطة لهذا اليوم في هذا المخيم
          let messages = [];
          try {
            const [campMessages] = await db.query(
              `
              SELECT id, day_number, title, message
              FROM camp_daily_messages
              WHERE camp_id = ? 
                AND day_number = ?
                AND is_active = 1
            `,
              [camp.camp_id, camp.current_day]
            );
            messages = campMessages || [];
          } catch (tableError) {
            // Table doesn't exist yet, skip this camp
            console.log(
              `[Daily Messages] camp_daily_messages table not found, skipping camp ${camp.camp_id}`
            );
            continue;
          }

          if (messages.length === 0) {
            console.log(
              `[Daily Messages] No messages scheduled for camp ${camp.camp_id}, day ${camp.current_day}`
            );
            continue;
          }

          // جلب جميع المشتركين في هذا المخيم
          const [participants] = await db.query(
            `
            SELECT DISTINCT
              ce.user_id,
              u.username,
              u.email
            FROM camp_enrollments ce
            JOIN users u ON ce.user_id = u.id
            WHERE ce.camp_id = ?
              AND (ce.status IS NULL OR ce.status = 'enrolled' OR ce.status = 'active')
          `,
            [camp.camp_id]
          );

          if (participants.length === 0) {
            console.log(
              `[Daily Messages] No participants found for camp ${camp.camp_id}`
            );
            continue;
          }

          // إرسال كل رسالة لكل مشترك
          for (const message of messages) {
            // استبدال المتغيرات في الرسالة
            const processedTitle = message.title
              .replace(/{day}/g, camp.current_day.toString())
              .replace(/{camp_name}/g, camp.camp_name);

            const processedMessage = message.message
              .replace(/{day}/g, camp.current_day.toString())
              .replace(/{camp_name}/g, camp.camp_name);

            for (const participant of participants) {
              try {
                // التحقق من إعدادات الإشعارات
                const shouldSend = await this.checkNotificationSettings(
                  participant.user_id,
                  camp.camp_id,
                  "daily_reminder"
                );

                if (!shouldSend) {
                  totalSkipped++;
                  continue;
                }

                // إدراج الإشعار في قاعدة البيانات
                // ملاحظة: قد نحتاج إلى إضافة 'daily_message' إلى enum إذا لم يكن موجوداً
                try {
                  await db.query(
                    `INSERT INTO camp_notifications (user_id, camp_id, type, title, message) 
                     VALUES (?, ?, 'daily_message', ?, ?)`,
                    [
                      participant.user_id,
                      camp.camp_id,
                      processedTitle,
                      processedMessage,
                    ]
                  );
                } catch (insertError) {
                  // إذا فشل بسبب enum، استخدم 'admin_message' كبديل
                  if (insertError.code === "ER_WARN_INVALID_STRING") {
                    console.log(
                      `[Daily Messages] Using 'admin_message' as fallback for camp ${camp.camp_id}`
                    );
                    await db.query(
                      `INSERT INTO camp_notifications (user_id, camp_id, type, title, message) 
                       VALUES (?, ?, 'admin_message', ?, ?)`,
                      [
                        participant.user_id,
                        camp.camp_id,
                        processedTitle,
                        processedMessage,
                      ]
                    );
                  } else {
                    throw insertError;
                  }
                }

                // إرسال إيميل إذا كان متوفراً (اختياري - يمكن إضافته لاحقاً)
                // حالياً فقط نرسل الإشعار في قاعدة البيانات

                totalSent++;
              } catch (participantError) {
                console.error(
                  `[Daily Messages] Error sending message to user ${participant.user_id}:`,
                  participantError.message
                );
                totalErrors++;
              }
            }
          }

          console.log(
            `[Daily Messages] Camp ${camp.camp_id} (${camp.camp_name}): Sent ${totalSent} messages, day ${camp.current_day}`
          );
        } catch (campError) {
          console.error(
            `[Daily Messages] Error processing camp ${camp.camp_id}:`,
            campError.message
          );
          totalErrors++;
        }
      }

      console.log(
        `[Daily Messages] Job completed: ${totalSent} sent, ${totalSkipped} skipped, ${totalErrors} errors`
      );
    } catch (error) {
      console.error(
        "[Daily Messages] Error in sendScheduledDailyMessages:",
        error
      );
    }
  }
}

module.exports = CampNotificationService;
