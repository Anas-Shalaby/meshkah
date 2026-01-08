/**
 * مجدول تذكيرات الختمات - Journey Reminder Scheduler
 * إرسال التذكيرات اليومية للمستخدمين
 */

const cron = require("node-cron");
const JourneyNotificationService = require("../services/journeyNotificationService");

class JourneyReminderScheduler {
  constructor() {
    this.isRunning = false;
  }

  /**
   * بدء المجدول
   * يعمل كل يوم الساعة 8 صباحاً و 8 مساءً
   */
  start() {
    if (this.isRunning) {
      console.log("[JourneyReminder] Scheduler already running");
      return;
    }

    // تذكير صباحي الساعة 8 صباحاً
    cron.schedule("0 8 * * *", async () => {
      console.log("[JourneyReminder] Running morning reminders...");
      await this.sendReminders();
    });

    // تذكير مسائي الساعة 8 مساءً
    cron.schedule("0 20 * * *", async () => {
      console.log("[JourneyReminder] Running evening reminders...");
      await this.sendReminders();
    });

    // تحديث الـ streaks عند منتصف الليل
    cron.schedule("5 0 * * *", async () => {
      console.log("[JourneyReminder] Resetting streaks for inactive users...");
      await this.resetInactiveStreaks();
    });

    this.isRunning = true;
    console.log("[JourneyReminder] Scheduler started successfully");
  }

  /**
   * إرسال التذكيرات
   */
  async sendReminders() {
    try {
      const result = await JourneyNotificationService.sendDailyReminders();
      console.log(`[JourneyReminder] Sent ${result.count || 0} reminders`);
    } catch (error) {
      console.error("[JourneyReminder] Error sending reminders:", error);
    }
  }

  /**
   * إعادة تعيين الـ streaks للمستخدمين غير النشطين
   */
  async resetInactiveStreaks() {
    try {
      const db = require("./database");

      // المستخدمون الذين لم يقرأوا أمس ولديهم streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const [result] = await db.query(
        `UPDATE book_journeys 
         SET streak_count = 0 
         WHERE status = 'active' 
         AND streak_count > 0 
         AND (last_read_date IS NULL OR last_read_date < ?)`,
        [yesterdayStr]
      );

      console.log(
        `[JourneyReminder] Reset ${result.affectedRows} inactive streaks`
      );
    } catch (error) {
      console.error("[JourneyReminder] Error resetting streaks:", error);
    }
  }

  /**
   * إيقاف المجدول
   */
  stop() {
    this.isRunning = false;
    console.log("[JourneyReminder] Scheduler stopped");
  }
}

module.exports = JourneyReminderScheduler;
