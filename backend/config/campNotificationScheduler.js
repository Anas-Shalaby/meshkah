const cron = require("node-cron");
const CampNotificationService = require("../services/campNotificationService");
const mailService = require("../services/mailService");
const db = require("../config/database");

class CampNotificationScheduler {
  constructor() {
    this.isRunning = false;
  }

  // تفعيل المخيمات تلقائياً عند تاريخ البداية إذا كانت الخاصية مفعّلة
  async checkAndAutoStartCamps() {
    try {
      console.log("Checking camps to auto-start...");
      const todayStr = new Date().toISOString().split("T")[0];

      // تفعيل المخيمات تلقائياً عند تاريخ البداية إذا كانت الخاصية مفعّلة
      const [dueCamps] = await db.query(
        `SELECT id, name FROM quran_camps 
         WHERE status = 'early_registration' 
           AND auto_start_camp = 1 
           AND start_date <= ?`,
        [todayStr]
      );

      if (dueCamps.length === 0) {
        console.log("No camps due to auto-start today");
        return;
      }

      for (const camp of dueCamps) {
        try {
          await db.query(
            `UPDATE quran_camps SET status = 'active' WHERE id = ?`,
            [camp.id]
          );

          const [enrollments] = await db.query(
            `SELECT ce.user_id, u.email, u.username 
             FROM camp_enrollments ce 
             JOIN users u ON ce.user_id = u.id 
             WHERE ce.camp_id = ?`,
            [camp.id]
          );

          for (const e of enrollments) {
            try {
              if (e.email) {
                await mailService.sendCampStartedEmail(
                  e.email,
                  e.username,
                  camp.name,
                  camp.id
                );
              }
              await CampNotificationService.sendCampStartedNotification(
                e.user_id,
                camp.id,
                camp.name
              );
            } catch (notifyErr) {
              console.error(
                "Failed sending start notice to",
                e.user_id,
                notifyErr.message
              );
            }
          }

          console.log(
            `Auto-started camp ${camp.id} (${camp.name}) and notified ${enrollments.length} users`
          );
        } catch (campErr) {
          console.error("Error auto-starting camp", camp.id, campErr.message);
        }
      }
    } catch (error) {
      console.error("Error in checkAndAutoStartCamps:", error);
    }
  }

  // التحقق من المخيمات المنتهية وإرسال الإيميلات
  async checkAndNotifyFinishedCamps() {
    try {
      console.log("Checking for finished camps...");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // أولاً: تحديث حالة المخيمات المنتهية إلى "completed"
      const [campsToComplete] = await db.query(
        `SELECT DISTINCT qc.id as camp_id, qc.name as camp_name
        FROM quran_camps qc
        WHERE DATE_ADD(qc.start_date, INTERVAL qc.duration_days DAY) <= ?
        AND qc.status = 'active'`,
        [today]
      );

      if (campsToComplete.length > 0) {
        for (const camp of campsToComplete) {
          try {
            await db.query(
              `UPDATE quran_camps SET status = 'completed' WHERE id = ?`,
              [camp.camp_id]
            );
            console.log(
              `Camp ${camp.camp_id} (${camp.camp_name}) automatically marked as completed`
            );
          } catch (error) {
            console.error(
              `Failed to update camp ${camp.camp_id} status:`,
              error
            );
          }
        }
      }

      // جلب جميع المخيمات التي انتهت اليوم أو في الماضي ولم يتم إرسال إشعاراتها
      // نستخدم NOT EXISTS بدلاً من LEFT JOIN لضمان عدم إرسال إشعارات مكررة
      const [finishedCamps] = await db.query(
        `SELECT DISTINCT
          qc.id as camp_id,
          qc.name as camp_name,
          DATE_ADD(qc.start_date, INTERVAL qc.duration_days DAY) as end_date,
          ce.user_id,
          u.email,
          u.username
        FROM quran_camps qc
        JOIN camp_enrollments ce ON qc.id = ce.camp_id
        JOIN users u ON ce.user_id = u.id
        WHERE DATE_ADD(qc.start_date, INTERVAL qc.duration_days DAY) <= ?
        AND (qc.status = 'active' OR qc.status = 'completed')
        AND NOT EXISTS (
          SELECT 1 FROM camp_notifications cn
          WHERE cn.camp_id = qc.id 
          AND cn.user_id = ce.user_id 
          AND cn.type = 'achievement'
          AND (cn.title LIKE '%انتهى مخيم%' OR cn.title LIKE '%مبارك! انتهى مخيم%')
        )
        ORDER BY end_date DESC, ce.user_id`,
        [today]
      );

      if (finishedCamps.length === 0) {
        console.log("No finished camps found that need notifications");
        return;
      }

      console.log(
        `Found ${finishedCamps.length} users in finished camps that need notifications`
      );

      let successCount = 0;
      let errorCount = 0;

      for (const camp of finishedCamps) {
        try {
          // إرسال الإيميل
          await mailService.sendCampFinishedEmail(
            camp.email,
            camp.username,
            camp.camp_name,
            camp.camp_id
          );

          // إرسال الإشعار
          await CampNotificationService.sendCampFinishedNotification(
            camp.user_id,
            camp.camp_id,
            camp.camp_name
          );

          successCount++;
          console.log(
            `Sent camp finished notification to user ${camp.user_id} (${camp.email}) for camp "${camp.camp_name}"`
          );
        } catch (error) {
          errorCount++;
          console.error(
            `Failed to send notification to user ${camp.user_id} for camp ${camp.camp_id}:`,
            error.message
          );
        }
      }

      console.log(
        `Camp finished notifications completed: ${successCount} sent, ${errorCount} failed`
      );
    } catch (error) {
      console.error("Error in checkAndNotifyFinishedCamps:", error);
    }
  }

  // بدء الـ scheduler
  start() {
    if (this.isRunning) {
      console.log("Camp notification scheduler is already running");
      return;
    }

    // تشغيل التذكير اليومي في الساعة 7:30 صباحاً كل يوم
    cron.schedule(
      "00 8 * * *",
      async () => {
        console.log("Running daily camp reminders...");
        try {
          await CampNotificationService.sendDailyRemindersToAllActiveCamps();
          console.log("Daily camp reminders completed successfully");
        } catch (error) {
          console.error("Error in daily camp reminders:", error);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Riyadh", // توقيت السعودية
      }
    );

    // تشغيل التذكير المسائي في الساعة 7:30 مساءً كل يوم
    cron.schedule(
      "0 20 * * *",
      async () => {
        console.log("Running evening camp reminders...");
        try {
          await CampNotificationService.sendDailyRemindersToAllActiveCamps();
          console.log("Evening camp reminders completed successfully");
        } catch (error) {
          console.error("Error in evening camp reminders:", error);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Riyadh",
      }
    );

    // التحقق من المخيمات المنتهية كل يوم في الساعة 7:00 صباحاً
    cron.schedule(
      "0 7 * * *",
      async () => {
        console.log("Checking for finished camps and sending notifications...");
        try {
          await this.checkAndNotifyFinishedCamps();
          console.log("Finished camps check completed successfully");
        } catch (error) {
          console.error("Error in finished camps check:", error);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Riyadh",
      }
    );

    // إرسال Daily Messages المجدولة كل يوم في الساعة 6:00 صباحاً
    cron.schedule(
      "0 7 * * *",
      async () => {
        console.log("Running scheduled daily messages...");
        try {
          await CampNotificationService.sendScheduledDailyMessages();
          console.log("Scheduled daily messages completed successfully");
        } catch (error) {
          console.error("Error in scheduled daily messages:", error);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Riyadh",
      }
    );

    // تفعيل المخيمات المفعّل لها البدء التلقائي عند منتصف الليل (بتوقيت السعودية)
    cron.schedule(
      "5 0 * * *",
      async () => {
        console.log("Auto-starting due camps (if any)...");
        try {
          await this.checkAndAutoStartCamps();
          console.log("Auto-start camps check completed successfully");
        } catch (error) {
          console.error("Error in auto-start camps check:", error);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Riyadh",
      }
    );

    this.isRunning = true;
    console.log("Camp notification scheduler started successfully");
    console.log(
      "Daily reminders will be sent at 7:30 AM and 7:00 PM (Saudi time)"
    );
    console.log("Finished camps check will run at 7:00 AM daily (Saudi time)");
    console.log("Auto-start check will run at 12:05 AM daily (Saudi time)");
    console.log("Daily Messages will be sent at 7:00 AM daily (Saudi time)");
  }

  // إيقاف الـ scheduler
  stop() {
    if (!this.isRunning) {
      console.log("Camp notification scheduler is not running");
      return;
    }

    cron.destroy();
    this.isRunning = false;
    console.log("Camp notification scheduler stopped");
  }

  // تشغيل التذكير يدوياً للاختبار
  async runManualReminders() {
    console.log("Running manual camp reminders...");
    try {
      await CampNotificationService.sendDailyRemindersToAllActiveCamps();
      console.log("Manual camp reminders completed successfully");
    } catch (error) {
      console.error("Error in manual camp reminders:", error);
    }
  }
}

module.exports = CampNotificationScheduler;
