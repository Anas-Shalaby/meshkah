/**
 * خدمة إشعارات الختمات - Journey Notification Service
 * إرسال التذكيرات والإشعارات للمستخدمين
 */

const db = require("../config/database");

class JourneyNotificationService {
  /**
   * إرسال تذكير يومي للمستخدمين الذين لم يقرأوا اليوم
   */
  static async sendDailyReminders() {
    try {
      // جلب الختمات النشطة التي لم تُقرأ اليوم
      const [journeys] = await db.query(
        `SELECT 
          bj.id as journey_id,
          bj.user_id,
          bj.book_name,
          bj.pace,
          bj.streak_count,
          u.email,
          u.username
         FROM book_journeys bj
         JOIN users u ON bj.user_id = u.id
         WHERE bj.status = 'active'
         AND bj.id NOT IN (
           SELECT DISTINCT journey_id 
           FROM journey_progress 
           WHERE DATE(read_at) = CURDATE()
         )`
      );

      console.log(
        `[JourneyNotifications] Found ${journeys.length} journeys needing reminders`
      );

      for (const journey of journeys) {
        // إنشاء إشعار تذكيري
        await db.query(
          `INSERT INTO journey_notifications 
           (user_id, type, related_journey_id, message)
           VALUES (?, 'reminder', ?, ?)`,
          [
            journey.user_id,
            journey.journey_id,
            `لا تنسَ وردك اليومي من ${journey.book_name}! (${journey.pace} أحاديث)`,
          ]
        );

        // يمكن إضافة إرسال بريد إلكتروني هنا
        // await mailService.sendJourneyReminder(journey.email, journey.username, journey.book_name);
      }

      return { success: true, count: journeys.length };
    } catch (error) {
      console.error(
        "[JourneyNotifications] Error sending daily reminders:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * إشعار عند إكمال صديق لوردة اليوم
   */
  static async notifyFriendsOfDailyCompletion(journeyId, userId, bookName) {
    try {
      // جلب أصدقاء الختمة
      const [friends] = await db.query(
        `SELECT bj.user_id 
         FROM journey_friends jf
         JOIN book_journeys bj ON jf.friend_journey_id = bj.id
         WHERE jf.journey_id = ?`,
        [journeyId]
      );

      // إرسال إشعار لكل صديق
      for (const friend of friends) {
        await db.query(
          `INSERT INTO journey_notifications 
           (user_id, type, related_journey_id, friend_id, message)
           VALUES (?, 'friend_completed_day', ?, ?, ?)`,
          [
            friend.user_id,
            journeyId,
            userId,
            `صديقك أكمل وردة اليوم من ${bookName}! 📖`,
          ]
        );
      }

      return { success: true, notified: friends.length };
    } catch (error) {
      console.error("[JourneyNotifications] Error notifying friends:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * إشعار عند إكمال صديق للكتاب بالكامل
   */
  static async notifyFriendsOfBookCompletion(journeyId, userId, bookName) {
    try {
      const [friends] = await db.query(
        `SELECT bj.user_id 
         FROM journey_friends jf
         JOIN book_journeys bj ON jf.friend_journey_id = bj.id
         WHERE jf.journey_id = ?`,
        [journeyId]
      );

      for (const friend of friends) {
        await db.query(
          `INSERT INTO journey_notifications 
           (user_id, type, related_journey_id, friend_id, message)
           VALUES (?, 'friend_finished_book', ?, ?, ?)`,
          [friend.user_id, journeyId, userId, `صديقك أكمل ختمة ${bookName}! 🎉`]
        );
      }

      return { success: true, notified: friends.length };
    } catch (error) {
      console.error(
        "[JourneyNotifications] Error notifying friends of completion:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * جلب إشعارات المستخدم
   */
  static async getUserNotifications(userId, limit = 20) {
    try {
      const [notifications] = await db.query(
        `SELECT 
          jn.*,
          u.username as friend_name,
          u.avatar as friend_avatar
         FROM journey_notifications jn
         LEFT JOIN users u ON jn.friend_id = u.id
         WHERE jn.user_id = ?
         ORDER BY jn.created_at DESC
         LIMIT ?`,
        [userId, limit]
      );

      return { success: true, notifications };
    } catch (error) {
      console.error(
        "[JourneyNotifications] Error getting notifications:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * تحديث الإشعارات كمقروءة
   */
  static async markAsRead(userId, notificationIds = null) {
    try {
      if (notificationIds && notificationIds.length > 0) {
        await db.query(
          `UPDATE journey_notifications 
           SET is_read = TRUE 
           WHERE user_id = ? AND id IN (?)`,
          [userId, notificationIds]
        );
      } else {
        await db.query(
          `UPDATE journey_notifications 
           SET is_read = TRUE 
           WHERE user_id = ?`,
          [userId]
        );
      }

      return { success: true };
    } catch (error) {
      console.error("[JourneyNotifications] Error marking as read:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * عدد الإشعارات غير المقروءة
   */
  static async getUnreadCount(userId) {
    try {
      const [result] = await db.query(
        `SELECT COUNT(*) as count 
         FROM journey_notifications 
         WHERE user_id = ? AND is_read = FALSE`,
        [userId]
      );

      return { success: true, count: result[0]?.count || 0 };
    } catch (error) {
      console.error(
        "[JourneyNotifications] Error getting unread count:",
        error
      );
      return { success: false, error: error.message };
    }
  }
}

module.exports = JourneyNotificationService;
