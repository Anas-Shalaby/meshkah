const cron = require("node-cron");
const recommendationService = require("../services/recommendationService");

class RecommendationScheduler {
  constructor() {
    this.isRunning = false;
  }

  // بدء المهام المجدولة
  start() {
    if (this.isRunning) {
      console.log("Recommendation scheduler is already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting recommendation scheduler...");

    // تحديث التوصيات كل 6 ساعات
    cron.schedule(
      "0 */6 * * *",
      async () => {
        console.log("Running recommendation update job...");
        try {
          await recommendationService.updateRecommendationsForAllUsers();
          console.log("Recommendation update job completed successfully");
        } catch (error) {
          console.error("Error in recommendation update job:", error);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Riyadh",
      }
    );

    // تنظيف التوصيات القديمة كل يوم في الساعة 2 صباحاً
    cron.schedule(
      "0 2 * * *",
      async () => {
        console.log("Running recommendation cleanup job...");
        try {
          const db = require("../config/database");
          await db.query(
            `DELETE FROM smart_recommendations 
           WHERE expires_at < NOW() OR created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
          );
          console.log("Recommendation cleanup job completed successfully");
        } catch (error) {
          console.error("Error in recommendation cleanup job:", error);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Riyadh",
      }
    );

    // تحديث إحصائيات الأحاديث كل ساعة
    cron.schedule(
      "0 * * * *",
      async () => {
        console.log("Running hadith statistics update job...");
        try {
          const db = require("../config/database");

          // تحديث إحصائيات جميع الأحاديث
          const [hadiths] = await db.query("SELECT id FROM hadiths LIMIT 100");

          for (const hadith of hadiths) {
            try {
              // حساب متوسط التقييم
              const [ratingResult] = await db.query(
                `SELECT AVG(rating) as avg_rating 
               FROM user_hadith_interactions 
               WHERE hadith_id = ? AND rating IS NOT NULL`,
                [hadith.id]
              );

              const avgRating = ratingResult[0]?.avg_rating || 0;

              // حساب متوسط وقت القراءة
              const [durationResult] = await db.query(
                `SELECT AVG(duration_seconds) as avg_duration 
               FROM user_hadith_interactions 
               WHERE hadith_id = ? AND duration_seconds IS NOT NULL`,
                [hadith.id]
              );

              const avgDuration = durationResult[0]?.avg_duration || 0;

              // تحديث الإحصائيات
              await db.query(
                `INSERT INTO hadith_statistics 
               (hadith_id, average_rating, average_reading_time) 
               VALUES (?, ?, ?) 
               ON DUPLICATE KEY UPDATE 
               average_rating = VALUES(average_rating),
               average_reading_time = VALUES(average_reading_time)`,
                [hadith.id, avgRating, avgDuration]
              );

              // حساب درجة الشعبية
              const [stats] = await db.query(
                `SELECT 
                 total_views,
                 total_reads,
                 total_bookmarks,
                 total_memorizations,
                 average_rating
               FROM hadith_statistics 
               WHERE hadith_id = ?`,
                [hadith.id]
              );

              if (stats.length > 0) {
                const stat = stats[0];
                const popularityScore =
                  stat.total_views * 0.1 +
                  stat.total_reads * 0.3 +
                  stat.total_bookmarks * 0.4 +
                  stat.total_memorizations * 0.5 +
                  stat.average_rating * 2;

                await db.query(
                  `UPDATE hadith_statistics 
                 SET popularity_score = ? 
                 WHERE hadith_id = ?`,
                  [popularityScore, hadith.id]
                );
              }
            } catch (error) {
              console.error(
                `Error updating statistics for hadith ${hadith.id}:`,
                error
              );
            }
          }

          console.log("Hadith statistics update job completed successfully");
        } catch (error) {
          console.error("Error in hadith statistics update job:", error);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Riyadh",
      }
    );

    // تحليل أنماط المستخدمين كل 12 ساعة
    cron.schedule(
      "0 */12 * * *",
      async () => {
        console.log("Running user pattern analysis job...");
        try {
          const db = require("../config/database");

          // الحصول على المستخدمين النشطين في آخر 30 يوم
          const [activeUsers] = await db.query(
            `SELECT DISTINCT user_id 
           FROM user_hadith_interactions 
           WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)`
          );

          for (const user of activeUsers) {
            try {
              await recommendationService.updateUserReadingPatterns(
                user.user_id
              );
            } catch (error) {
              console.error(
                `Error updating patterns for user ${user.user_id}:`,
                error
              );
            }
          }

          console.log(
            `User pattern analysis completed for ${activeUsers.length} users`
          );
        } catch (error) {
          console.error("Error in user pattern analysis job:", error);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Riyadh",
      }
    );

    console.log("Recommendation scheduler started successfully");
  }

  // إيقاف المهام المجدولة
  stop() {
    if (!this.isRunning) {
      console.log("Recommendation scheduler is not running");
      return;
    }

    cron.getTasks().forEach((task) => {
      task.destroy();
    });

    this.isRunning = false;
    console.log("Recommendation scheduler stopped");
  }

  // الحصول على حالة المهام
  getStatus() {
    return {
      isRunning: this.isRunning,
      tasks: cron.getTasks().map((task) => ({
        name: task.name || "unnamed",
        running: task.running,
      })),
    };
  }
}

module.exports = new RecommendationScheduler();
