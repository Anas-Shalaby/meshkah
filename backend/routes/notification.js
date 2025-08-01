const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    // Force MySQL to not use query cache
    const [notifications] = await db.query(
      `SELECT SQL_NO_CACHE n.*, 
        c.share_link as card_id, c.title as card_title,
        u.username as sender_name, u.avatar_url as sender_avatar
       FROM notifications n
       LEFT JOIN dawah_cards c ON n.card_id = c.id
       LEFT JOIN users u ON n.sender_id = u.id
       WHERE n.user_id = ? 
       ORDER BY n.created_at DESC, n.is_read ASC
       LIMIT 50`,
      [req.user.id]
    );

    // Force fresh count
    const [unreadCount] = await db.query(
      `SELECT SQL_NO_CACHE COUNT(*) as count
       FROM notifications
       WHERE user_id = ? AND is_read = false`,
      [req.user.id]
    );

    res.json({
      notifications,
      unreadCount: unreadCount[0].count || 0,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب الإشعارات" });
  }
});

router.patch(
  "/notifications/mark-all-read",
  authMiddleware,
  async (req, res) => {
    try {
      await db.query(
        `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = ? AND is_read = false`,
        [req.user.id]
      );

      res.json({ message: "تم تعيين جميع الإشعارات كمقروءة" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث الإشعارات" });
    }
  }
);

router.patch("/notifications/read-all", authMiddleware, async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = ? AND is_read = false`,
      [req.user.id]
    );

    res.json({ message: "تم تعيين جميع الإشعارات كمقروءة" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "حدث خطأ أثناء تحديث الإشعارات" });
  }
});
// Add io parameter to the route
router.post("/notifications", authMiddleware, async (req, res) => {
  try {
    const { user_id, message, type, card_id, sender_id } = req.body;

    const [result] = await db.query(
      `INSERT INTO notifications 
        (user_id, message, type, card_id, sender_id, is_read) 
       VALUES (?, ?, ?, ?, ?, false)`,
      [user_id, message, type, card_id, sender_id]
    );

    // Fetch the created notification with additional details
    const [notification] = await db.query(
      `SELECT n.*, u.avatar_url as sender_avatar, u.username as sender_name
       FROM notifications n
       LEFT JOIN users u ON n.sender_id = u.id
       WHERE n.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "تم إنشاء الإشعار بنجاح",
      notification: notification[0],
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "حدث خطأ أثناء إنشاء الإشعار" });
  }
});

// Update the mark as read endpoint to return updated notification
router.patch("/notifications/:id", authMiddleware, async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    const [updatedNotification] = await db.query(
      `SELECT n.*, 
        c.id as card_id, c.title as card_title,
        u.username as sender_name, u.avatar_url as sender_avatar
       FROM notifications n
       LEFT JOIN dawah_cards c ON n.card_id = c.id
       LEFT JOIN users u ON n.sender_id = u.id
       WHERE n.id = ?`,
      [req.params.id]
    );

    if (!updatedNotification[0]) {
      return res.status(404).json({ message: "الإشعار غير موجود" });
    }

    res.json(updatedNotification[0]);
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ message: "حدث خطأ أثناء تحديث الإشعار" });
  }
});

// Delete a notification
router.delete("/notifications/:id", authMiddleware, async (req, res) => {
  try {
    const [result] = await db.query(
      `DELETE FROM notifications 
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "الإشعار غير موجود" });
    }

    res.json({ message: "تم حذف الإشعار بنجاح" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "حدث خطأ أثناء حذف الإشعار" });
  }
});

module.exports = router;
