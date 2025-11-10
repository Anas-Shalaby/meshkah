const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const CampNotificationService = require("../services/campNotificationService");

// Get user notifications
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    const notifications = await CampNotificationService.getUserNotifications(
      userId,
      parseInt(limit),
      offset
    );

    const unreadCount = await CampNotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: notifications.length === parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب الإشعارات",
    });
  }
});

// Mark notification as read
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await CampNotificationService.markAsRead(id, userId);

    res.json({
      success: true,
      message: "تم تحديد الإشعار كمقروء",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديد الإشعار كمقروء",
    });
  }
});

// Mark all notifications as read
router.put("/read-all", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    await CampNotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: "تم تحديد جميع الإشعارات كمقروءة",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديد الإشعارات كمقروءة",
    });
  }
});

// Get unread count
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const unreadCount = await CampNotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب عدد الإشعارات غير المقروءة",
    });
  }
});

module.exports = router;
