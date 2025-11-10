const express = require("express");
const router = express.Router();
const FCMService = require("../services/fcmService");
const { body, validationResult } = require("express-validator");
const { authMiddleware } = require("../middleware/authMiddleware");
const db = require("../config/database");
const { getMessaging } = require("firebase-admin/messaging");
const admin = require("firebase-admin");

// Validation middleware
const validateNotification = [
  body("title").notEmpty().withMessage("العنوان مطلوب").trim(),
  body("body").notEmpty().withMessage("محتوى الإشعار مطلوب").trim(),
  body("target").notEmpty().withMessage("الموضوع مطلوب"),
];

/**
 * POST /api/notifications/send
 * Send notification to devices/topics
 */
router.post("/send", validateNotification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "بيانات غير صحيحة",
        errors: errors.array(),
      });
    }

    const { title, body, target, data = {} } = req.body;

    // إرسال الإشعار للموضوع المحدد
    const result = await FCMService.sendToTopic(target, title, body, data);

    if (result.success) {
      res.json({
        success: true,
        message: "تم إرسال الإشعار بنجاح",
        data: result,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "فشل في إرسال الإشعار",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error in notification route:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في الخادم",
      error: error.message,
    });
  }
});

/**
 * GET /api/notifications/topics
 * Get available topics
 */
router.get("/topics", (req, res) => {
  const topics = [
    { id: "update", name: "تحديث جديد" },
    { id: "premium_users", name: "المستخدمين المميزين" },
    { id: "new_features", name: "الميزات الجديدة" },
    { id: "maintenance", name: "الصيانة" },
    { id: "promotions", name: "العروض الترويجية" },
  ];

  res.json({
    success: true,
    data: topics,
  });
});

const CLOUD_FUNCTION_URL =
  "https://us-central1-mishkat-50a1c.cloudfunctions.net/createOrUpdateSchedule";

router.post("/register-device", authMiddleware, async (req, res) => {
  try {
    const { fcmToken } = req.body; // (يُرسل من Flutter)
    const userId = req.user.id; // (يُفترض أن authMiddleware يضع بيانات المستخدم هنا)

    if (!fcmToken) {
      return res.status(400).send("fcmToken is required");
    }

    // حفظ التوكن في قاعدة بياناتك (SQL كمثال)
    // (يستخدم ON DUPLICATE KEY لتحديثه إذا كان موجوداً، أو إضافته لو جديد)
    const query = `
            INSERT INTO user_devices (user_id, fcm_token, is_active , notification_time)
            VALUES (?, ?, TRUE , NULL)
            ON DUPLICATE KEY UPDATE
                user_id = ?, is_active = TRUE, last_updated = CURRENT_TIMESTAMP
        `;

    await db.query(query, [userId, fcmToken, userId]);
    await getMessaging().subscribeToTopic(fcmToken, "daily_hadith");

    res.status(200).send({ message: "Device registered successfully" });
  } catch (error) {
    console.error("Error registering device:", error);
    res.status(500).send("Server error");
  }
});

router.post("/set-notification-prefs", authMiddleware, async (req, res) => {
  try {
    const { time, timezone, fcmToken } = req.body; // (يُرسل من Flutter)
    const userId = req.user.id; // (من الـ authMiddleware)

    if (!time || !timezone || !fcmToken) {
      return res.status(400).send("time, timezone, and fcmToken are required");
    }

    // 1. تحديث قاعدة البيانات الخاصة بك أولاً
    const updateQuery = `
          UPDATE user_devices 
          SET notification_time = ?, timezone = ?
          WHERE user_id = ? AND fcm_token = ?
      `;
    await db.query(updateQuery, [time, timezone, userId, fcmToken]);

    console.log(`Preferences updated for user ${userId} in local DB.`);
    await getMessaging().unsubscribeFromTopic(fcmToken, "daily_hadith");

    // 2. (الأهم) استدعاء الـ Cloud Function (أ) لبدء الجدولة
    console.log(`Calling Cloud Function at: ${CLOUD_FUNCTION_URL}`);

    await axios.post(CLOUD_FUNCTION_URL, {
      userId: userId,
      fcmToken: fcmToken,
      time: time,
      timezone: timezone,
    });

    console.log(`Cloud Function triggered successfully for user ${userId}.`);

    // 3. إرسال رد لتطبيق Flutter
    res
      .status(200)
      .send({ message: "Notification schedule updated successfully" });
  } catch (error) {
    console.error("Error setting notification preferences:", error);
    // (معالجة إذا فشل استدعاء الـ Function)
    if (error.response) {
      console.error("Error from Cloud Function:", error.response.data);
    }
    res.status(500).send("Failed to update schedule");
  }
});
module.exports = router;
