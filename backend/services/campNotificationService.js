const db = require("../config/database");

class CampNotificationService {
  // جلب الفوج الحالي للمخيم
  static async getCurrentCohortNumber(campId) {
    try {
      // First, try to get open cohort (is_open = 1)
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

      // Second, try to get active or early_registration cohort
      const [activeCohorts] = await db.query(
        `SELECT cohort_number 
         FROM camp_cohorts 
         WHERE camp_id = ? 
           AND status IN ('active', 'early_registration')
         ORDER BY cohort_number DESC
         LIMIT 1`,
        [campId]
      );

      if (activeCohorts.length > 0) {
        return activeCohorts[0].cohort_number;
      }

      // If no active cohort, get the most recent cohort
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

      // Fallback to quran_camps table
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
  }

  // التحقق من إعدادات الإشعارات للمستخدم
  static async checkNotificationSettings(
    userId,
    campId,
    notificationType,
    cohortNumber = null
  ) {
    try {
      let settings = [];

      // إذا تم تمرير cohort_number، ابحث في هذا الفوج أولاً
      if (cohortNumber !== null) {
        const [cohortSettings] = await db.query(
          `SELECT 
             COALESCE(cs.notifications_enabled, true) as notifications_enabled,
             COALESCE(cs.daily_reminders, true) as daily_reminders,
             COALESCE(cs.achievement_notifications, true) as achievement_notifications
           FROM camp_enrollments ce
           LEFT JOIN camp_settings cs ON ce.id = cs.enrollment_id
           WHERE ce.user_id = ? AND ce.camp_id = ? AND ce.cohort_number = ?
           LIMIT 1`,
          [userId, campId, cohortNumber]
        );
        settings = cohortSettings;
      }

      // إذا لم يتم العثور على إعدادات في الفوج المحدد (أو لم يتم تحديد فوج)،
      // ابحث في أي فوج للمستخدم في هذا المخيم (الأحدث أولاً)
      if (settings.length === 0) {
        const [anyCohortSettings] = await db.query(
          `SELECT 
             COALESCE(cs.notifications_enabled, true) as notifications_enabled,
             COALESCE(cs.daily_reminders, true) as daily_reminders,
             COALESCE(cs.achievement_notifications, true) as achievement_notifications
           FROM camp_enrollments ce
           LEFT JOIN camp_settings cs ON ce.id = cs.enrollment_id
           WHERE ce.user_id = ? AND ce.camp_id = ?
           ORDER BY ce.cohort_number DESC, ce.id DESC
           LIMIT 1`,
          [userId, campId]
        );
        settings = anyCohortSettings;
      }

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
  static async sendWelcomeNotification(
    userId,
    campId,
    campName,
    cohortNumber = null
  ) {
    try {
      // إذا لم يتم تمرير cohortNumber، احصل عليه من المخيم
      if (cohortNumber === null) {
        cohortNumber = await this.getCurrentCohortNumber(campId);
      }

      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        userId,
        campId,
        "welcome",
        cohortNumber
      );
      if (!shouldSend) {
        console.log(
          `Welcome notification skipped for user ${userId} due to settings`
        );
        return;
      }

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
         VALUES (?, ?, 'welcome', ?, ?, ?, NOW())`,
        [
          userId,
          campId,
          `مرحباً بك في  ${campName}! 🎉`,
          `أهلاً وسهلاً بك في  ${campName}! نحن سعداء لانضمامك إلينا في هذه الرحلة القرآنية المباركة. استعد لرحلة مليئة بالبركة والفوائد.`,
          cohortNumber,
        ]
      );
    } catch (error) {
      console.error("Error sending welcome notification:", error);
    }
  }

  // تحليل سلوك المستخدم (متى يكمل المهام عادة)
  static async analyzeUserBehavior(userId, campId) {
    try {
      // جلب آخر 7 أيام من نشاط المستخدم
      const [behavior] = await db.query(
        `SELECT 
          AVG(HOUR(ctp.completed_at)) as avg_completion_hour,
          COUNT(DISTINCT DATE(ctp.completed_at)) as active_days,
          MAX(DATEDIFF(NOW(), ctp.completed_at)) as days_since_last_completion,
          COUNT(ctp.id) as total_completions
        FROM camp_task_progress ctp
        JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
        JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
        WHERE ce.user_id = ? 
          AND cdt.camp_id = ?
          AND ctp.completed = 1
          AND ctp.completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [userId, campId]
      );

      if (behavior.length === 0 || !behavior[0].total_completions) {
        return {
          avgHour: null,
          activeDays: 0,
          daysSinceLastCompletion: null,
          isRegular: false,
          completionRate: 0,
        };
      }

      const data = behavior[0];
      const avgHour = data.avg_completion_hour
        ? Math.round(data.avg_completion_hour)
        : null;
      const activeDays = data.active_days || 0;
      const daysSinceLastCompletion = data.days_since_last_completion || null;
      const isRegular = activeDays >= 5; // نشط في 5 أيام من آخر 7
      const completionRate = activeDays / 7;

      return {
        avgHour,
        activeDays,
        daysSinceLastCompletion,
        isRegular,
        completionRate,
      };
    } catch (error) {
      console.error("Error analyzing user behavior:", error);
      return {
        avgHour: null,
        activeDays: 0,
        daysSinceLastCompletion: null,
        isRegular: false,
        completionRate: 0,
      };
    }
  }

  // تحديد مستوى التذكير حسب التأخر
  static getReminderTone(daysBehind, isRegular) {
    if (daysBehind === 0) {
      return {
        tone: "gentle",
        title: "تذكير لطيف",
        emoji: "💚",
      };
    } else if (daysBehind === 1) {
      return {
        tone: "friendly",
        title: "تذكير ودود",
        emoji: "💙",
      };
    } else if (daysBehind === 2) {
      return {
        tone: "encouraging",
        title: "تذكير تشجيعي",
        emoji: "💛",
      };
    } else if (daysBehind >= 3 && daysBehind < 5) {
      return {
        tone: "urgent",
        title: "تذكير عاجل",
        emoji: "🧡",
      };
    } else {
      return {
        tone: "critical",
        title: "تذكير مهم",
        emoji: "❤️",
      };
    }
  }

  // إنشاء رسالة تذكير ذكية
  static createSmartReminderMessage(
    campName,
    dayNumber,
    tasksCount,

    daysBehind,
    isRegular,
    avgHour
  ) {
    const tone = this.getReminderTone(daysBehind, isRegular);

    let message = "";

    if (daysBehind === 0 && isRegular) {
      message = `مرحباً! اليوم هو اليوم ${dayNumber} من مخيم ${campName}. لديك ${tasksCount} مهام مباركة في انتظارك. أنت في المسار الصحيح! استمر في نفس الوتيرة 💚`;
    } else if (daysBehind === 0) {
      message = `مرحباً! اليوم هو اليوم ${dayNumber} من مخيم ${campName}. لديك ${tasksCount} مهام مباركة في انتظارك. لا تفوت فرصة الحصول على الأجر والثواب!`;
    } else if (daysBehind === 1) {
      // If the user is regular and has not missed any days, send a gentle reminder
      message = `مرحباً! اليوم هو اليوم ${dayNumber} من مخيم ${campName}. لديك ${tasksCount} مهام مباركة في انتظارك. يمكنك اللحاق بالمسار بسهولة! 💙`;
    } else if (daysBehind === 2) {
    }
    // If the user has not missed any days but is not regular, send a reminder with a sense of urgency
    else if (daysBehind === 0) {
      message = `مرحباً! اليوم هو اليوم ${dayNumber} من مخيم ${campName}. لديك ${tasksCount} مهام مباركة في انتظارك. أنت متأخر قليلاً، لكن يمكنك اللحاق! 💛`;
    } else if (daysBehind >= 3 && daysBehind < 5) {
      message = `مرحباً! اليوم هو اليوم ${dayNumber} من مخيم ${campName}. لديك ${tasksCount} مهام مباركة في انتظارك. أنت متأخر ${daysBehind} أيام. لا تفوت المزيد من الأيام! 🧡`;
    } else {
      message = `مرحباً! اليوم هو اليوم ${dayNumber} من مخيم ${campName}. لديك ${tasksCount} مهام مباركة في انتظارك. أنت متأخر ${daysBehind} أيام. حان الوقت للعودة للمسار! ❤️`;
    }

    // إضافة تلميح حسب الوقت المعتاد
    if (avgHour && daysBehind <= 1) {
      const currentHour = new Date().getHours();
      if (currentHour < avgHour - 1) {
        message += ` تذكر أنك عادة تكمل المهام حوالي الساعة ${avgHour}:00.`;
      }
    }

    return {
      title: `${tone.title} - اليوم ${dayNumber} من مخيم ${campName} ${tone.emoji}`,
      message,
    };
  }

  // إرسال تذكير يومي بمهام اليوم (محسّن بذكاء)
  static async sendDailyReminder(
    userId,
    campId,
    campName,
    dayNumber,
    tasksCount,
    daysBehind = 0,
    cohortNumber = null
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

      // تحليل سلوك المستخدم
      const behavior = await this.analyzeUserBehavior(userId, campId);

      // إذا كان المستخدم نشطاً بانتظام ولم يتأخر، تذكير واحد فقط
      if (
        behavior.isRegular &&
        daysBehind === 0 &&
        behavior.daysSinceLastCompletion === 0
      ) {
        // تذكير واحد فقط في الصباح
        const currentHour = new Date().getHours();
        if (currentHour < 8 || currentHour > 12) {
          console.log(
            `Smart reminder: User ${userId} is regular and on track, skipping reminder (hour: ${currentHour})`
          );
          return;
        }
      }

      // إنشاء رسالة ذكية
      const reminder = this.createSmartReminderMessage(
        campName,
        dayNumber,
        tasksCount,
        daysBehind,
        behavior.isRegular,
        behavior.avgHour
      );

      // إذا لم يتم تمرير cohortNumber، احصل عليه من المخيم
      if (cohortNumber === null) {
        cohortNumber = await this.getCurrentCohortNumber(campId);
      }

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
         VALUES (?, ?, 'daily_reminder', ?, ?, ?, NOW())`,
        [userId, campId, reminder.title, reminder.message, cohortNumber]
      );
      console.log(
        `Smart daily reminder sent to user ${userId} for camp ${campId}, day ${dayNumber}, days behind: ${daysBehind}`
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
      // ملاحظة: يجب استخدام الفوج النشط فقط وحساب اليوم بناءً على تاريخ بداية الفوج
      console.log(`[Daily Reminders] Today (Riyadh): ${todayStr}`);
      console.log(`[Daily Reminders] Active camps found: ${debugCamps.length}`);

      const [usersToNotify] = await db.query(
        `
        SELECT DISTINCT
          ce.user_id,
          qc.id as camp_id,
          qc.name as camp_name,
          ce.cohort_number,
          -- حساب اليوم بناءً على تاريخ بداية الفوج (camp_cohorts.start_date)
          -- Fallback إلى تاريخ المخيم إذا لم يكن هناك start_date للفوج
          COALESCE(
            (DATEDIFF(?, DATE(CONVERT_TZ(cc.start_date, '+00:00', '+03:00'))) + 1),
            CASE 
              WHEN qc.reopened_date IS NOT NULL THEN 
                (DATEDIFF(?, DATE(qc.reopened_date)) + 1)
              ELSE 
                (DATEDIFF(?, DATE(CONVERT_TZ(qc.start_date, '+00:00', '+03:00'))) + 1)
            END
          ) as current_day,
          COUNT(cdt.id) as pending_tasks_count
        FROM quran_camps qc
        JOIN camp_enrollments ce ON qc.id = ce.camp_id
        -- JOIN مع camp_cohorts للحصول على معلومات الفوج (LEFT JOIN للتعامل مع الأفواج القديمة التي قد لا تحتوي على start_date)
        LEFT JOIN camp_cohorts cc ON 
          cc.camp_id = qc.id 
          AND cc.cohort_number = ce.cohort_number
        JOIN camp_daily_tasks cdt ON qc.id = cdt.camp_id
        LEFT JOIN camp_task_progress ctp ON 
          ctp.task_id = cdt.id 
          AND ctp.enrollment_id = ce.id 
          AND ctp.completed = 1
        WHERE 
          -- المخيم نشط أو أعيد فتحه
          qc.status IN ('active', 'reopened')
          -- المستخدم مشترك في فوج نشط
          -- إذا كان الفوج موجود في camp_cohorts، يجب أن يكون نشط
          -- إذا لم يكن موجود، نستخدم منطق fallback للأفواج القديمة
          AND (
            -- إما أن الفوج غير موجود في camp_cohorts (للأفواج القديمة)
            cc.id IS NULL
            -- أو الفوج موجود ونشط
            OR (cc.is_open = 1 OR cc.status IN ('active', 'early_registration'))
          )
          -- الفوج شغال حالياً (اليوم بين البداية والنهاية) - استخدام تاريخ الفوج أو المخيم
          AND (
            COALESCE(
              DATE(CONVERT_TZ(cc.start_date, '+00:00', '+03:00')),
              CASE 
                WHEN qc.reopened_date IS NOT NULL THEN DATE(qc.reopened_date)
                ELSE DATE(CONVERT_TZ(qc.start_date, '+00:00', '+03:00'))
              END
            )
          ) <= ?
          AND ? < DATE_ADD(
            COALESCE(
              DATE(CONVERT_TZ(cc.start_date, '+00:00', '+03:00')),
              CASE 
                WHEN qc.reopened_date IS NOT NULL THEN DATE(qc.reopened_date)
                ELSE DATE(CONVERT_TZ(qc.start_date, '+00:00', '+03:00'))
              END
            ), 
            INTERVAL qc.duration_days DAY
          )
          -- المستخدم مشترك
          AND (ce.status IS NULL OR ce.status = 'enrolled')
          -- المهام المطلوبة من بداية الفوج حتى اليوم (جميع المهام غير المكتملة) - استخدام تاريخ الفوج أو المخيم
          AND cdt.day_number <= COALESCE(
            (DATEDIFF(?, DATE(CONVERT_TZ(cc.start_date, '+00:00', '+03:00'))) + 1),
            CASE 
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
          qc.status,
          ce.cohort_number,
          cc.start_date
        HAVING pending_tasks_count > 0
        `,
        [
          todayStr, // للـ DATEDIFF في current_day (cc.start_date) - السطر 451
          todayStr, // للـ DATEDIFF في current_day fallback (reopened_date) - السطر 454
          todayStr, // للـ DATEDIFF في current_day fallback (start_date) - السطر 456
          todayStr, // للتحقق من تاريخ البداية <= today - السطر 492
          todayStr, // للتحقق من today < تاريخ النهاية - السطر 493
          todayStr, // للـ DATEDIFF في day_number (cc.start_date) - السطر 507
          todayStr, // للـ DATEDIFF في day_number fallback (reopened_date) - السطر 510
          todayStr, // للـ DATEDIFF في day_number fallback (start_date) - السطر 512
        ]
      );

      console.log(
        `[Daily Reminders] Found ${usersToNotify.length} users with pending tasks`
      );

      if (usersToNotify.length === 0) {
        console.log("[Daily Reminders] Debugging: Why no users found?");
        // تحقق إضافي: لماذا لم يتم العثور على أحد؟
        for (const camp of debugCamps) {
          console.log(`\n[Debug] Checking camp ${camp.id} (${camp.name})`);
          console.log(`  - Status: ${camp.status}`);
          console.log(`  - Calculated day: ${camp.calculated_day}`);

          // جلب جميع المشتركين
          const [enrollments] = await db.query(
            `SELECT ce.id, ce.user_id, ce.status, ce.cohort_number 
             FROM camp_enrollments ce 
             WHERE ce.camp_id = ? AND (ce.status IS NULL OR ce.status = 'enrolled')`,
            [camp.id]
          );

          // حساب اليوم بناءً على الفوج
          const calculatedDay = camp.calculated_day;

          // جلب جميع المهام في المخيم للتحقق
          const [allTasks] = await db.query(
            `SELECT DISTINCT day_number, COUNT(*) as count 
             FROM camp_daily_tasks 
             WHERE camp_id = ?
             GROUP BY day_number
             ORDER BY day_number
             LIMIT 20`,
            [camp.id]
          );
          console.log(
            `  - All tasks in camp:`,
            allTasks.length > 0
              ? allTasks
                  .map((t) => `Day ${t.day_number}: ${t.count} tasks`)
                  .join(", ")
              : "No tasks found"
          );

          const [tasksForDay] = await db.query(
            `SELECT COUNT(*) as count FROM camp_daily_tasks 
             WHERE camp_id = ? AND day_number = ?`,
            [camp.id, calculatedDay]
          );

          // حساب اليوم بناءً على تاريخ الفوج لكل مستخدم
          for (const enr of enrollments) {
            const [cohortInfo] = await db.query(
              `SELECT start_date FROM camp_cohorts 
               WHERE camp_id = ? AND cohort_number = ? AND (is_open = 1 OR status IN ('active', 'early_registration'))`,
              [camp.id, enr.cohort_number]
            );

            if (cohortInfo.length > 0 && cohortInfo[0].start_date) {
              const cohortStartDate = new Date(cohortInfo[0].start_date);
              // تحويل todayStr إلى تاريخ بتوقيت الرياض
              const today = new Date(todayStr + "T00:00:00");
              const cohortDay =
                Math.floor((today - cohortStartDate) / (1000 * 60 * 60 * 24)) +
                1;

              const [tasksForCohortDay] = await db.query(
                `SELECT COUNT(*) as count FROM camp_daily_tasks 
                 WHERE camp_id = ? AND day_number = ?`,
                [camp.id, cohortDay]
              );
            }
          }

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
                [enr.id, camp.id, calculatedDay]
              );
              const pending = tasksForDay[0].count - completedTasks[0].count;
            }
          }
        }
      }

      // حساب الأيام المتأخرة لكل مستخدم
      let sent = 0;
      for (const user of usersToNotify) {
        try {
          // حساب الأيام المتأخرة
          const [enrollment] = await db.query(
            `SELECT 
               ce.id, 
               ce.created_at,
               COUNT(ctp.id) as completed_tasks,
               (SELECT COUNT(*) FROM camp_daily_tasks WHERE camp_id = ? AND day_number <= ?) as total_tasks
             FROM camp_enrollments ce
             LEFT JOIN camp_task_progress ctp ON ce.id = ctp.enrollment_id AND ctp.completed = 1
             WHERE ce.user_id = ? AND ce.camp_id = ?
             GROUP BY ce.id, ce.created_at`,
            [user.camp_id, user.current_day, user.user_id, user.camp_id]
          );

          // حساب نسبة الإتمام محلياً
          let completionPercentage = 0;
          if (enrollment.length > 0 && enrollment[0].total_tasks > 0) {
            completionPercentage = (enrollment[0].completed_tasks / enrollment[0].total_tasks) * 100;
          }

          let daysBehind = 0;
          if (enrollment.length > 0) {
            const expectedDay = Math.ceil(
              (completionPercentage / 100) * user.current_day
            );
            daysBehind = Math.max(0, user.current_day - expectedDay);
          }

          await this.sendDailyReminder(
            user.user_id,
            user.camp_id,
            user.camp_name,
            user.current_day,
            user.pending_tasks_count,
            daysBehind,
            user.cohort_number
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
    pointsEarned,
    cohortNumber = null
  ) {
    try {
      // إذا لم يتم تمرير cohortNumber، احصل عليه من المخيم
      if (cohortNumber === null) {
        cohortNumber = await this.getCurrentCohortNumber(campId);
      }

      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        userId,
        campId,
        "achievement",
        cohortNumber
      );
      if (!shouldSend) {
        return;
      }

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
         VALUES (?, ?, 'achievement', ?, ?, ?, NOW())`,
        [
          userId,
          campId,
          `إنجاز جديد! 🎉`,
          `مبروك! لقد أكملت مهمة "${taskTitle}" في مخيم ${campName} وحصلت على ${pointsEarned} نقطة. استمر في التقدم!`,
          cohortNumber,
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
    totalPoints,
    cohortNumber = null
  ) {
    try {
      // إذا لم يتم تمرير cohortNumber، احصل عليه من المخيم
      if (cohortNumber === null) {
        cohortNumber = await this.getCurrentCohortNumber(campId);
      }

      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        userId,
        campId,
        "achievement",
        cohortNumber
      );
      if (!shouldSend) {
        console.log(
          `Milestone notification skipped for user ${userId} due to settings`
        );
        return;
      }

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
         VALUES (?, ?, 'achievement', ?, ?, ?, NOW())`,
        [
          userId,
          campId,
          `مرحلة جديدة! 🏆`,
          `تهانينا! لقد وصلت إلى ${milestone} في مخيم ${campName} بإجمالي ${totalPoints} نقطة. أنت على الطريق الصحيح!`,
          cohortNumber,
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
    message,
    cohortNumber = null
  ) {
    try {
      // إذا لم يتم تمرير cohortNumber، احصل عليه من المخيم
      if (cohortNumber === null) {
        cohortNumber = await this.getCurrentCohortNumber(campId);
      }

      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        userId,
        campId,
        "admin_message",
        cohortNumber
      );
      if (!shouldSend) {
        console.log(
          `General notification skipped for user ${userId} due to settings`
        );
        return;
      }

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
         VALUES (?, ?, 'admin_message', ?, ?, ?, NOW())`,
        [userId, campId, title, message, cohortNumber]
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
  static async sendCampFinishedNotification(
    userId,
    campId,
    campName,
    cohortNumber = null
  ) {
    try {
      // إذا لم يتم تمرير cohortNumber، احصل عليه من المخيم
      if (cohortNumber === null) {
        cohortNumber = await this.getCurrentCohortNumber(campId);
      }

      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        userId,
        campId,
        "achievement",
        cohortNumber
      );
      if (!shouldSend) {
        console.log(
          `Camp finished notification skipped for user ${userId} due to settings`
        );
        return;
      }

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
         VALUES (?, ?, 'achievement', ?, ?, ?, NOW())`,
        [
          userId,
          campId,
          `🎉 مبارك! انتهى مخيم "${campName}"`,
          `تهانينا! لقد انتهى مخيم "${campName}". يمكنك الآن عرض ملخص إنجازك الكامل والإحصائيات التفصيلية من صفحة المخيم.`,
          cohortNumber,
        ]
      );
    } catch (error) {
      console.error("Error sending camp finished notification:", error);
    }
  }

  // إرسال إشعار بدء المخيم
  static async sendCampStartedNotification(
    userId,
    campId,
    campName,
    cohortNumber = null
  ) {
    try {
      // إذا لم يتم تمرير cohortNumber، احصل عليه من المخيم
      if (cohortNumber === null) {
        cohortNumber = await this.getCurrentCohortNumber(campId);
      }

      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        userId,
        campId,
        "general",
        cohortNumber
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
         AND title LIKE ? AND cohort_number = ?`,
        [userId, campId, `%بدأ مخيم%`, cohortNumber]
      );

      if (existing.length > 0) {
        console.log(
          `Camp started notification already sent to user ${userId} for cohort ${cohortNumber}`
        );
        return;
      }

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
         VALUES (?, ?, 'admin_message', ?, ?, ?, NOW())`,
        [
          userId,
          campId,
          `🎊 بدأ مخيم "${campName}"!`,
          `مبارك! بدأ مخيم "${campName}" الآن. استعد لرحلة مليئة بالبركة والفوائد. ابدأ في إكمال مهام اليوم الأول! 🚀`,
          cohortNumber,
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

      // جلب الفوج الحالي
      const cohortNumber = await this.getCurrentCohortNumber(campId);

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
         VALUES (?, ?, 'friends_digest', ?, ?, ?, NOW())`,
        [userId, campId, "حصاد صحبتك اليوم 🔥", message, cohortNumber]
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
      // جلب الفوج الحالي
      const cohortNumber = await this.getCurrentCohortNumber(campId);

      // التحقق من إعدادات الإشعارات (مع cohort_number)
      const shouldSend = await this.checkNotificationSettings(
        receiverId,
        campId,
        "general",
        cohortNumber
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
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
         VALUES (?, ?, 'friend_request', ?, ?, ?, NOW())`,
        [
          receiverId,
          campId,
          "طلب صداقة جديد",
          `${senderUsername} أرسل لك طلب صداقة في مخيم ${campName}`,
          cohortNumber,
        ]
      );
      console.log(
        `Friend request notification sent to user ${receiverId} from ${senderId} in camp ${campId} cohort ${cohortNumber}`
      );
    } catch (error) {
      console.error("Error sending friend request notification:", error);
      // لا نرمي الخطأ - نكتفي بتسجيله حتى لا نوقف عملية إرسال طلب الصداقة
      // الخطأ تم التعامل معه في friendsController.js
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
      // جلب الفوج الحالي
      const cohortNumber = await this.getCurrentCohortNumber(campId);

      // التحقق من إعدادات الإشعارات (مع cohort_number)
      const shouldSend = await this.checkNotificationSettings(
        senderId,
        campId,
        "general",
        cohortNumber
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
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
         VALUES (?, ?, 'friend_request_response', ?, ?, ?, NOW())`,
        [
          senderId,
          campId,
          titleText,
          `${receiverUsername} ${actionText} طلب صداقتك في مخيم ${campName}`,
          cohortNumber,
        ]
      );
      console.log(
        `Friend request response notification sent to user ${senderId} from ${receiverId} in camp ${campId} cohort ${cohortNumber}`
      );
    } catch (error) {
      console.error("Error responding to friend request notification:", error);
      // لا نرمي الخطأ - نكتفي بتسجيله حتى لا نوقف عملية الرد على طلب الصداقة
      // الخطأ تم التعامل معه في friendsController.js
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
      // جلب الفوج الحالي
      const cohortNumber = await this.getCurrentCohortNumber(campId);

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
         VALUES (?, ?, 'joint_step_pledge', ?, ?, ?, NOW())`,
        [inspirerId, campId, title, message, cohortNumber]
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

          // Use current cohort number from camp data
          const currentCohortNumber = camp.current_cohort_number;

          if (!currentCohortNumber) {
            console.log(
              `[Daily Messages] No active cohort found for camp ${camp.camp_id}, skipping`
            );
            continue;
          }

          // جلب جميع المشتركين في هذا المخيم - فقط من الفوج النشط
          const [participants] = await db.query(
            `
            SELECT DISTINCT
              ce.user_id,
              u.username,
              u.email
            FROM camp_enrollments ce
            JOIN users u ON ce.user_id = u.id
            WHERE ce.camp_id = ?
              AND ce.cohort_number = ?
              AND (ce.status IS NULL OR ce.status = 'enrolled' OR ce.status = 'active')
          `,
            [camp.camp_id, currentCohortNumber]
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
                    `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
                     VALUES (?, ?, 'daily_message', ?, ?, ?, NOW())`,
                    [
                      participant.user_id,
                      camp.camp_id,
                      processedTitle,
                      processedMessage,
                      currentCohortNumber,
                    ]
                  );
                } catch (insertError) {
                  // إذا فشل بسبب enum، استخدم 'admin_message' كبديل
                  if (insertError.code === "ER_WARN_INVALID_STRING") {
                    console.log(
                      `[Daily Messages] Using 'admin_message' as fallback for camp ${camp.camp_id}`
                    );
                    await db.query(
                      `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
                       VALUES (?, ?, 'admin_message', ?, ?, ?, NOW())`,
                      [
                        participant.user_id,
                        camp.camp_id,
                        processedTitle,
                        processedMessage,
                        currentCohortNumber,
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

  // إرسال إشعار انتهاء فوج لمشترك واحد
  static async sendCohortCompletionNotification(
    userId,
    campId,
    campName,
    cohortNumber
  ) {
    try {
      // التحقق من إعدادات الإشعارات
      const shouldSend = await this.checkNotificationSettings(
        userId,
        campId,
        "achievement",
        cohortNumber
      );
      if (!shouldSend) {
        console.log(
          `Cohort completion notification skipped for user ${userId} due to settings`
        );
        return false;
      }

      // إنشاء الرسالة
      const title = `📚 انتهى الفوج ${cohortNumber}`;
      const message = `انتهى الفوج ${cohortNumber} في مخيم ${campName}. نشكرك على مشاركتك معنا! جزاك الله خيراً على جهدك المبارك.`;

      await db.query(
        `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
         VALUES (?, ?, 'achievement', ?, ?, ?, NOW())`,
        [userId, campId, title, message, cohortNumber]
      );

      console.log(
        `✅ Sent cohort completion notification to user ${userId} for cohort ${cohortNumber}`
      );
      return true;
    } catch (error) {
      console.error(
        `Error sending cohort completion notification to user ${userId}:`,
        error
      );
      return false;
    }
  }

  // إرسال إشعارات انتهاء الفوج لجميع المشتركين (يدوياً)
  static async sendCohortCompletionToAll(campId, cohortNumber) {
    try {
      console.log(
        `[Cohort Completion] Starting to send completion notifications for camp ${campId}, cohort ${cohortNumber}`
      );

      // جلب معلومات المخيم والفوج
      const [campInfo] = await db.query(
        `SELECT qc.name as camp_name, cc.completion_notification_sent
         FROM quran_camps qc
         JOIN camp_cohorts cc ON qc.id = cc.camp_id
         WHERE cc.camp_id = ? AND cc.cohort_number = ?`,
        [campId, cohortNumber]
      );

      if (campInfo.length === 0) {
        throw new Error("Cohort not found");
      }

      const campName = campInfo[0].camp_name;

      // التحقق من أن الإشعارات لم ترسل مسبقاً
      if (campInfo[0].completion_notification_sent) {
        console.log(
          `[Cohort Completion] Notifications already sent for this cohort, skipping`
        );
        return {
          success: false,
          message: "تم إرسال الإشعارات مسبقاً لهذا الفوج",
          alreadySent: true,
        };
      }

      // جلب جميع المشتركين في الفوج (بما فيهم من لم يكملوا أي مهام)
      const [participants] = await db.query(
        `SELECT 
          ce.user_id,
          u.email,
          u.username
        FROM camp_enrollments ce
        JOIN users u ON ce.user_id = u.id
        WHERE ce.camp_id = ? 
          AND ce.cohort_number = ?
          AND ce.status IN ('enrolled', 'active')
          -- استثناء المشرفين
          AND NOT EXISTS (
            SELECT 1 FROM camp_supervisors cs
            WHERE cs.camp_id = ce.camp_id
            AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
            AND cs.user_id = ce.user_id
          )
        ORDER BY ce.id`,
        [campId, cohortNumber]
      );

      if (participants.length === 0) {
        return {
          success: false,
          message: "لا يوجد مشتركين في هذا الفوج",
          count: 0,
        };
      }

      console.log(
        `[Cohort Completion] Found ${participants.length} participants to notify`
      );

      const mailService = require("./mailService");

      let successCount = 0;
      let errorCount = 0;

      // إرسال الإشعارات والإيميلات لكل مشترك
      for (const participant of participants) {
        try {
          // إرسال إشعار داخلي
          const notificationSent = await this.sendCohortCompletionNotification(
            participant.user_id,
            campId,
            campName,
            cohortNumber
          );

          // إرسال إيميل
          if (participant.email) {
            try {
              await mailService.sendCohortCompletionEmail(
                participant.email,
                participant.username,
                campName,
                cohortNumber
              );
            } catch (emailError) {
              console.error(
                `Error sending email to ${participant.email}:`,
                emailError
              );
              // نستمر حتى لو فشل الإيميل
            }
          }

          if (notificationSent) {
            successCount++;
          }
        } catch (error) {
          console.error(
            `Error notifying user ${participant.user_id}:`,
            error
          );
          errorCount++;
        }
      }

      // تحديث حالة الفوج - تم إرسال الإشعارات
      await db.query(
        `UPDATE camp_cohorts 
         SET 
           completion_notification_sent = 1,
           completion_notification_sent_at = NOW()
         WHERE camp_id = ? AND cohort_number = ?`,
        [campId, cohortNumber]
      );

      console.log(
        `[Cohort Completion] ✅ Completed: ${successCount} sent, ${errorCount} errors`
      );

      return {
        success: true,
        message: `تم إرسال الإشعارات بنجاح`,
        count: successCount,
        errors: errorCount,
        total: participants.length,
      };
    } catch (error) {
      console.error("[Cohort Completion] Error:", error);
      return {
        success: false,
        message: error.message || "حدث خطأ في إرسال الإشعارات",
        error: error.message,
      };
    }
  }

  // ==================== SMART NOTIFICATIONS ====================

  // إرسال إشعار استعادة الـ Streak للمستخدمين الذين كسرت سلسلتهم
  static async sendStreakBrokenReminders() {
    try {
      console.log("[Streak Recovery] Starting streak broken reminders...");

      // جلب المستخدمين الذين كان لديهم streak >= 3 أيام وانقطع بالأمس
      const [usersWithBrokenStreak] = await db.query(`
        SELECT DISTINCT
          ce.user_id,
          ce.id as enrollment_id,
          qc.id as camp_id,
          qc.name as camp_name,
          ce.cohort_number,
          ce.current_streak,
          ce.longest_streak
        FROM camp_enrollments ce
        JOIN quran_camps qc ON ce.camp_id = qc.id
        WHERE qc.status IN ('active', 'reopened')
          AND (ce.status IS NULL OR ce.status = 'enrolled')
          -- الـ streak الحالي صفر أو 1 لكن الـ longest >= 3
          AND ce.current_streak <= 1
          AND ce.longest_streak >= 3
          -- لم يكمل أي مهمة اليوم
          AND NOT EXISTS (
            SELECT 1 FROM camp_task_progress ctp
            JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
            WHERE ctp.enrollment_id = ce.id 
              AND ctp.completed = 1
              AND DATE(ctp.completed_at) = CURDATE()
          )
          -- لم يتم إرسال إشعار streak broken له اليوم
          AND NOT EXISTS (
            SELECT 1 FROM camp_notifications cn
            WHERE cn.user_id = ce.user_id 
              AND cn.camp_id = qc.id
              AND cn.type = 'streak_broken'
              AND DATE(cn.sent_at) = CURDATE()
          )
      `);

      console.log(`[Streak Recovery] Found ${usersWithBrokenStreak.length} users with broken streaks`);

      let sent = 0;
      for (const user of usersWithBrokenStreak) {
        try {
          // التحقق من إعدادات الإشعارات
          const shouldSend = await this.checkNotificationSettings(
            user.user_id,
            user.camp_id,
            "daily_reminder",
            user.cohort_number
          );
          if (!shouldSend) continue;

          await db.query(
            `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
             VALUES (?, ?, 'streak_broken', ?, ?, ?, NOW())`,
            [
              user.user_id,
              user.camp_id,
              `🔥 سلسلتك انقطعت!`,
              `كنت متألقاً بسلسلة ${user.longest_streak} أيام متتالية في مخيم "${user.camp_name}"! لا تحزن، عد اليوم لتبدأ سلسلة جديدة. كل بداية جديدة تحمل أملاً جديداً! 💪`,
              user.cohort_number,
            ]
          );
          sent++;
        } catch (error) {
          console.error(`[Streak Recovery] Error for user ${user.user_id}:`, error);
        }
      }

      console.log(`[Streak Recovery] Sent ${sent} streak broken notifications`);
      return { sent, total: usersWithBrokenStreak.length };
    } catch (error) {
      console.error("[Streak Recovery] Error:", error);
      return { sent: 0, total: 0, error: error.message };
    }
  }

  // إرسال إشعار للغائبين (لم يكملوا أي مهمة منذ 3 أيام أو أكثر)
  static async sendInactiveUserReminders() {
    try {
      console.log("[Inactive Users] Starting inactive user reminders...");

      // جلب المستخدمين الغائبين 3 أيام أو أكثر
      const [inactiveUsers] = await db.query(`
        SELECT DISTINCT
          ce.user_id,
          ce.id as enrollment_id,
          qc.id as camp_id,
          qc.name as camp_name,
          ce.cohort_number,
          DATEDIFF(CURDATE(), COALESCE(
            (SELECT MAX(DATE(ctp.completed_at)) 
             FROM camp_task_progress ctp 
             WHERE ctp.enrollment_id = ce.id AND ctp.completed = 1),
            DATE(ce.created_at)
          )) as days_inactive
        FROM camp_enrollments ce
        JOIN quran_camps qc ON ce.camp_id = qc.id
        WHERE qc.status IN ('active', 'reopened')
          AND (ce.status IS NULL OR ce.status = 'enrolled')
          -- آخر نشاط كان قبل 3 أيام أو أكثر
          AND DATEDIFF(CURDATE(), COALESCE(
            (SELECT MAX(DATE(ctp.completed_at)) 
             FROM camp_task_progress ctp 
             WHERE ctp.enrollment_id = ce.id AND ctp.completed = 1),
            DATE(ce.created_at)
          )) >= 3
          -- لم يتم إرسال إشعار inactive له خلال آخر 3 أيام
          AND NOT EXISTS (
            SELECT 1 FROM camp_notifications cn
            WHERE cn.user_id = ce.user_id 
              AND cn.camp_id = qc.id
              AND cn.type = 'inactive_reminder'
              AND cn.sent_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)
          )
      `);

      console.log(`[Inactive Users] Found ${inactiveUsers.length} inactive users`);

      let sent = 0;
      for (const user of inactiveUsers) {
        try {
          // التحقق من إعدادات الإشعارات
          const shouldSend = await this.checkNotificationSettings(
            user.user_id,
            user.camp_id,
            "daily_reminder",
            user.cohort_number
          );
          if (!shouldSend) continue;

          await db.query(
            `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
             VALUES (?, ?, 'admin_message', ?, ?, ?, NOW())`,
            [
              user.user_id,
              user.camp_id,
              `💚 افتقدناك!`,
              `مرت ${user.days_inactive} أيام منذ آخر نشاط لك في مخيم "${user.camp_name}". الرحلة لا تزال مستمرة وننتظر عودتك! كل خطوة صغيرة تقربك من هدفك 🌟`,
              user.cohort_number,
            ]
          );
          sent++;
        } catch (error) {
          console.error(`[Inactive Users] Error for user ${user.user_id}:`, error);
        }
      }

      console.log(`[Inactive Users] Sent ${sent} inactive user reminders`);
      return { sent, total: inactiveUsers.length };
    } catch (error) {
      console.error("[Inactive Users] Error:", error);
      return { sent: 0, total: 0, error: error.message };
    }
  }

  // إرسال الملخص الأسبوعي (كل جمعة)
  static async sendWeeklyDigestToAllUsers() {
    try {
      console.log("[Weekly Digest] Starting weekly digest...");

      // جلب إحصائيات الأسبوع لكل مستخدم نشط
      const [usersStats] = await db.query(`
        SELECT 
          ce.user_id,
          ce.id as enrollment_id,
          qc.id as camp_id,
          qc.name as camp_name,
          ce.cohort_number,
          ce.current_streak,
          ce.total_points,
          -- عدد المهام المكتملة هذا الأسبوع
          (SELECT COUNT(*) 
           FROM camp_task_progress ctp
           JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
           WHERE ctp.enrollment_id = ce.id 
             AND ctp.completed = 1
             AND ctp.completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          ) as tasks_completed_this_week,
          -- ترتيب المستخدم في لوحة الصدارة
          (SELECT COUNT(*) + 1 
           FROM camp_enrollments other_ce
           WHERE other_ce.camp_id = qc.id 
             AND other_ce.cohort_number = ce.cohort_number
             AND other_ce.total_points > ce.total_points
          ) as leaderboard_rank
        FROM camp_enrollments ce
        JOIN quran_camps qc ON ce.camp_id = qc.id
        WHERE qc.status IN ('active', 'reopened')
          AND (ce.status IS NULL OR ce.status = 'enrolled')
          -- أكمل مهمة واحدة على الأقل هذا الأسبوع
          AND EXISTS (
            SELECT 1 FROM camp_task_progress ctp
            WHERE ctp.enrollment_id = ce.id 
              AND ctp.completed = 1
              AND ctp.completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          )
          -- لم يتم إرسال ملخص أسبوعي له هذا الأسبوع
          AND NOT EXISTS (
            SELECT 1 FROM camp_notifications cn
            WHERE cn.user_id = ce.user_id 
              AND cn.camp_id = qc.id
              AND cn.type = 'weekly_digest'
              AND cn.sent_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          )
      `);

      console.log(`[Weekly Digest] Found ${usersStats.length} users for weekly digest`);

      let sent = 0;
      for (const user of usersStats) {
        try {
          // التحقق من إعدادات الإشعارات
          const shouldSend = await this.checkNotificationSettings(
            user.user_id,
            user.camp_id,
            "achievement",
            user.cohort_number
          );
          if (!shouldSend) continue;

          // إنشاء رسالة الملخص
          let message = `📊 ملخصك الأسبوعي في مخيم "${user.camp_name}":\n\n`;
          message += `✅ المهام المكتملة: ${user.tasks_completed_this_week} مهمة\n`;
          message += `🔥 سلسلتك الحالية: ${user.current_streak} أيام\n`;
          message += `⭐ مجموع نقاطك: ${user.total_points} نقطة\n`;
          message += `🏆 ترتيبك: #${user.leaderboard_rank}\n\n`;
          message += `استمر في التقدم! أنت على الطريق الصحيح 💪`;

          await db.query(
            `INSERT INTO camp_notifications (user_id, camp_id, type, title, message, cohort_number, sent_at) 
             VALUES (?, ?, 'admin_message', ?, ?, ?, NOW())`,
            [
              user.user_id,
              user.camp_id,
              `📅 ملخصك الأسبوعي - ${user.camp_name}`,
              message,
              user.cohort_number,
            ]
          );
          sent++;
        } catch (error) {
          console.error(`[Weekly Digest] Error for user ${user.user_id}:`, error);
        }
      }

      console.log(`[Weekly Digest] Sent ${sent} weekly digests`);
      return { sent, total: usersStats.length };
    } catch (error) {
      console.error("[Weekly Digest] Error:", error);
      return { sent: 0, total: 0, error: error.message };
    }
  }
}

module.exports = CampNotificationService;

