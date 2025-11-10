const cron = require("node-cron");
const CampNotificationService = require("../services/campNotificationService");
const db = require("../config/database");

class FriendsDigestScheduler {
  constructor() {
    this.isRunning = false;
  }

  /**
   * إرسال ملخص الصحبة اليومي لجميع المستخدمين النشطين
   */
  async sendDailyFriendDigests() {
    try {
      console.log("[Friends Digest] Starting daily friends digest job...");

      // تحديد آخر 24 ساعة (بتوقيت الرياض)
      const now = new Date();
      const since = new Date(now.getTime() - 24 * 60 * 60 * 1000); // آخر 24 ساعة

      // جلب جميع المستخدمين النشطين (المسجلين في مخيمات نشطة)
      const [activeUsers] = await db.query(
        `SELECT DISTINCT 
          ce.user_id,
          u.username,
          u.email
        FROM camp_enrollments ce
        JOIN users u ON ce.user_id = u.id
        JOIN quran_camps qc ON ce.camp_id = qc.id
        WHERE qc.status IN ('active', 'reopened')
          AND (ce.status IS NULL OR ce.status = 'enrolled')
        GROUP BY ce.user_id, u.username, u.email`
      );

      if (activeUsers.length === 0) {
        console.log("[Friends Digest] No active users found");
        return;
      }

      console.log(
        `[Friends Digest] Found ${activeUsers.length} active users to process`
      );

      let successCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      // التكرار على كل مستخدم نشط
      for (const user of activeUsers) {
        try {
          // 1. جلب قائمة أصدقاء المستخدم
          const [friendships] = await db.query(
            `SELECT
              CASE
                WHEN user1_id = ? THEN user2_id
                ELSE user1_id
              END as friend_id
            FROM friendships
            WHERE user1_id = ? OR user2_id = ?`,
            [user.user_id, user.user_id, user.user_id]
          );

          const friendIds = friendships.map((f) => f.friend_id);

          if (friendIds.length === 0) {
            skippedCount++;
            continue; // لا يوجد أصدقاء، تخطي هذا المستخدم
          }

          // 2. جلب نشاط الأصدقاء في آخر 24 ساعة
          const placeholders = friendIds.map(() => "?").join(",");
          const [activities] = await db.query(
            `SELECT
              ua.id,
              ua.user_id,
              ua.activity_type,
              ua.details,
              ua.created_at,
              u.username as friend_username,
              u.avatar_url as friend_avatar,
              qc.name as camp_name,
              qc.id as camp_id
            FROM user_activity ua
            LEFT JOIN users u ON ua.user_id = u.id
            LEFT JOIN quran_camps qc ON ua.camp_id = qc.id
            WHERE ua.user_id IN (${placeholders})
              AND ua.created_at >= ?
            ORDER BY ua.created_at DESC`,
            [friendIds, since]
          );

          if (activities.length === 0) {
            skippedCount++;
            continue; // لا يوجد نشاط، تخطي هذا المستخدم
          }

          // 3. تجميع النشاط حسب الصديق ونوع النشاط
          const friendSummary = {};

          activities.forEach((activity) => {
            const friendId = activity.user_id;
            const friendName = activity.friend_username || "صديق";

            if (!friendSummary[friendId]) {
              friendSummary[friendId] = {
                username: friendName,
                avatar: activity.friend_avatar,
                tasks: 0,
                reflections: 0,
                streaks: [],
                camps: new Set(),
              };
            }

            switch (activity.activity_type) {
              case "task_completed":
                friendSummary[friendId].tasks++;
                if (activity.camp_id) {
                  friendSummary[friendId].camps.add(
                    activity.camp_name || `مخيم ${activity.camp_id}`
                  );
                }
                break;

              case "reflection_shared":
                friendSummary[friendId].reflections++;
                if (activity.camp_id) {
                  friendSummary[friendId].camps.add(
                    activity.camp_name || `مخيم ${activity.camp_id}`
                  );
                }
                break;

              case "streak_achieved":
                let details = null;
                if (activity.details) {
                  if (typeof activity.details === "string") {
                    try {
                      details = JSON.parse(activity.details);
                    } catch (e) {
                      details = null;
                    }
                  } else {
                    details = activity.details;
                  }
                }
                if (details && details.streak_count) {
                  friendSummary[friendId].streaks.push(details.streak_count);
                }
                break;
            }
          });

          // 4. بناء رسالة الملخص
          const summaryParts = [];
          const friendArray = Object.values(friendSummary);

          friendArray.forEach((friend) => {
            const parts = [];

            if (friend.tasks > 0) {
              parts.push(
                friend.tasks === 1
                  ? "أتم مهمة واحدة"
                  : `أتم ${friend.tasks} مهام`
              );
            }

            if (friend.reflections > 0) {
              parts.push(
                friend.reflections === 1
                  ? "شارك فائدة واحدة"
                  : `شارك ${friend.reflections} فوائد`
              );
            }

            if (friend.streaks.length > 0) {
              const maxStreak = Math.max(...friend.streaks);
              parts.push(`وصل لسلسلة ${maxStreak} أيام! 🔥`);
            }

            if (parts.length > 0) {
              summaryParts.push(`${friend.username} ${parts.join("، ")}`);
            }
          });

          if (summaryParts.length === 0) {
            skippedCount++;
            continue;
          }

          // بناء الرسالة النهائية
          let summaryMessage = "ملخص صحبتك اليوم 🔥:\n\n";
          summaryMessage += summaryParts.join("\n");

          const totalFriends = friendArray.length;
          const totalActivities =
            friendArray.reduce((sum, f) => sum + f.tasks + f.reflections, 0) +
            friendArray.reduce((sum, f) => sum + f.streaks.length, 0);

          summaryMessage += `\n\n📊 إجمالي: ${totalFriends} من صحبتك نشطوا اليوم بـ ${totalActivities} نشاط!`;

          // 5. إرسال الإشعار
          // نحتاج إلى معرفة campId للمستخدم (يمكن استخدام أول مخيم نشط)
          const [userCamps] = await db.query(
            `SELECT ce.camp_id 
             FROM camp_enrollments ce
             JOIN quran_camps qc ON ce.camp_id = qc.id
             WHERE ce.user_id = ? 
               AND qc.status IN ('active', 'reopened')
             LIMIT 1`,
            [user.user_id]
          );

          const campId = userCamps.length > 0 ? userCamps[0].camp_id : null;

          // إرسال الإشعار
          await CampNotificationService.sendFriendsDigestNotification(
            user.user_id,
            campId,
            summaryMessage
          );

          successCount++;
          console.log(
            `[Friends Digest] Sent digest to user ${user.user_id} (${user.username})`
          );
        } catch (error) {
          errorCount++;
          console.error(
            `[Friends Digest] Error processing user ${user.user_id}:`,
            error.message
          );
        }
      }

      console.log(
        `[Friends Digest] Completed: ${successCount} sent, ${skippedCount} skipped, ${errorCount} errors`
      );
    } catch (error) {
      console.error("[Friends Digest] Fatal error:", error);
    }
  }

  /**
   * بدء الـ scheduler
   */
  start() {
    if (this.isRunning) {
      console.log("[Friends Digest] Scheduler is already running");
      return;
    }

    // تشغيل الملخص اليومي في الساعة 9 مساءً (21:00) بتوقيت الرياض
    cron.schedule(
      "8 21 * * *",
      async () => {
        console.log(
          "[Friends Digest] Running scheduled daily friends digest..."
        );
        try {
          await this.sendDailyFriendDigests();
          console.log(
            "[Friends Digest] Scheduled daily friends digest completed successfully"
          );
        } catch (error) {
          console.error(
            "[Friends Digest] Error in scheduled daily friends digest:",
            error
          );
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Riyadh",
      }
    );

    this.isRunning = true;
    console.log(
      "[Friends Digest] Scheduler started successfully. Daily digest will run at 9:00 PM (Saudi time)"
    );
  }

  /**
   * إيقاف الـ scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log("[Friends Digest] Scheduler is not running");
      return;
    }

    cron.destroy();
    this.isRunning = false;
    console.log("[Friends Digest] Scheduler stopped");
  }

  /**
   * تشغيل الملخص يدوياً للاختبار
   */
  async runManualDigest() {
    console.log("[Friends Digest] Running manual friends digest...");
    try {
      await this.sendDailyFriendDigests();
      console.log(
        "[Friends Digest] Manual friends digest completed successfully"
      );
    } catch (error) {
      console.error("[Friends Digest] Error in manual friends digest:", error);
    }
  }
}

module.exports = FriendsDigestScheduler;
