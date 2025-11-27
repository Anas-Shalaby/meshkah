// 1. استدعاء المكتبات بالطريقة الجديدة (v2)
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { onRequest } = require("firebase-functions/v2/https");
const { getMessaging } = require("firebase-admin/messaging");
const axios = require("axios");
const { CloudTasksClient } = require("@google-cloud/tasks");
const moment = require("moment-timezone");
const logger = require("firebase-functions/logger");

// 2. تهيئة Firebase
initializeApp();

const FIREBASE_PROJECT_ID = "mishkat-50a1c";
const QUEUE_NAME = "hadith-scheduler-queue";
const LOCATION_ID = "us-central1";
const HADITH_API_URL = "https://api.hadith-shareef.com/api/daily-hadith";
let SENDER_FUNCTION_URL =
  "https://us-central1-mishkat-50a1c.cloudfunctions.net/sendScheduledNotification";

// 3. كتابة الدالة بالطريقة الجديدة onSchedule
exports.sendDailyHadith = onSchedule("every day 08:00", async (event) => {
  // تحديد المنطقة الزمنية
  event.timeZone = "Africa/Cairo";

  const apiUrl = "https://api.hadith-shareef.com/api/daily-hadith"; // <-- غير هذا الرابط

  logger.info(`بدء جلب الحديث من: ${apiUrl}`);

  try {
    const response = await axios.get(apiUrl);
    const hadithData = response.data.data;

    // التأكد من وجود البيانات المطلوبة (العنوان والـ ID)
    if (!hadithData || !hadithData.title || !hadithData.id) {
      logger.error("الـ API لم يرجع البيانات المطلوبة (title or id).");
      return;
    }

    const hadithTitle = hadithData.title;
    const hadithId = hadithData.id;

    // --- تم تعديل حمولة البيانات لتشمل الـ ID ---
    const payload = {
      notification: {
        title: "حديث اليوم 🕌",
        body: hadithTitle,
      },
      data: {
        // إشارة للتطبيق بنوع المحتوى
        type: "hadith_details",
        // إرسال الـ ID ليستخدمه التطبيق
        hadithId: hadithId,
      },
      topic: "daily_hadith",
    };

    await getMessaging().send(payload);
    logger.info("تم إرسال إشعار الحديث اليومي بنجاح!", { hadithId: hadithId });
  } catch (error) {
    logger.error("حدث خطأ أثناء جلب الحديث أو إرسال الإشعار:", error);
  }
});

exports.createOrUpdateSchedule = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { userId, fcmToken, time, timezone } = req.body;
    if (!userId || !fcmToken || !time || !timezone) {
      logger.error("createOrUpdateSchedule: Missing fields", req.body);
      return res.status(400).send("Missing required fields.");
    }

    logger.info(
      `(أ) طلب جدولة جديد للمستخدم: ${userId} في ${time} ${timezone}`
    );

    const tasksClient = new CloudTasksClient();
    const parentQueuePath = tasksClient.queuePath(
      FIREBASE_PROJECT_ID,
      LOCATION_ID,
      QUEUE_NAME
    );

    // حساب الموعد القادم
    const [hour, minute] = time.split(":");
    const nextRun = moment().tz(timezone).hour(hour).minute(minute).second(0);
    if (nextRun.isBefore(moment())) {
      nextRun.add(1, "day");
    }

    // تجهيز المهمة
    const taskName = `user_${userId}_${fcmToken.slice(-10)}`;
    const taskPath = tasksClient.taskPath(
      FIREBASE_PROJECT_ID,
      LOCATION_ID,
      QUEUE_NAME,
      taskName
    );

    const task = {
      name: taskPath,
      httpRequest: {
        httpMethod: "POST",
        url: SENDER_FUNCTION_URL, // (رابط وظيفة ب)
        body: Buffer.from(JSON.stringify(req.body)).toString("base64"),
        headers: { "Content-Type": "application/json" },
      },
      scheduleTime: { seconds: nextRun.unix() },
    };

    // إلغاء أي مهمة قديمة
    try {
      await tasksClient.deleteTask({ name: taskPath });
      logger.info(`(أ) تم حذف المهمة القديمة لـ ${userId}`);
    } catch (error) {
      logger.info(`(أ) لا توجد مهمة قديمة لـ ${userId}, سيتم إنشاء واحدة.`);
    }

    // إنشاء المهمة الجديدة
    await tasksClient.createTask({ parent: parentQueuePath, task: task });
    logger.info(`(أ) تم جدولة مهمة جديدة لـ ${userId} في: ${nextRun.format()}`);
    res
      .status(200)
      .send({ message: `Schedule created. Next run at: ${nextRun.format()}` });
  } catch (error) {
    logger.error("Error in createOrUpdateSchedule:", error);
    res.status(500).send({ error: "Failed to create task." });
  }
});

// ==========================================================
// (3) الوظيفة (ب) الجديدة: مُرسِل الإشعارات المخصصة
// ==========================================================
exports.sendScheduledNotification = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { fcmToken, userId, time, timezone } = req.body;
    logger.info(`(ب) بدء إرسال إشعار مخصص للمستخدم: ${userId}`);

    // 1. جلب الحديث (نفس منطق وظيفتك القديمة)
    let hadithTitle, hadithId;
    try {
      const response = await axios.get(HADITH_API_URL);
      const hadithData = response.data.data;
      if (!hadithData || !hadithData.title || !hadithData.id) {
        throw new Error("الـ API لم يرجع البيانات المطلوبة.");
      }
      hadithTitle = hadithData.title;
      hadithId = hadithData.id.toString();
    } catch (e) {
      logger.error(`(ب) فشل جلب الحديث للمستخدم ${userId}:`, e.message);
      hadithTitle = "حديث اليوم متاح الآن 🕌"; // رسالة احتياطية
      hadithId = "0"; // ID افتراضي
    }

    // 2. تجهيز وإرسال الإشعار (بنفس شكل القديم تماماً)
    const payload = {
      notification: {
        title: "حديث اليوم 🕌", // (نفس العنوان)
        body: hadithTitle,
      },
      data: {
        type: "hadith_details", // (نفس النوع)
        hadithId: hadithId, // (نفس الـ ID)
      },
      topic: "daily_hadith",
      token: fcmToken, // (الإرسال للتوكن مباشرة وليس لـ topic)
    };

    try {
      await getMessaging().send(payload);
      logger.info(`(ب) تم إرسال الإشعار المخصص لـ ${userId} بنجاح.`);
    } catch (error) {
      // (هام) لو التوكن بايظ، لا تعيد الجدولة
      if (
        error.code === "messaging/registration-token-not-registered" ||
        error.code === "messaging/invalid-registration-token"
      ) {
        logger.warn(
          `(ب) التوكن ${fcmToken} للمستخدم ${userId} غير صالح. سيتم إيقاف الجدولة له.`
        );
        // (يفضل هنا إرسال طلب للسيرفر بتاعك لمسح التوكن ده)
        return res.status(200).send("Token invalid. Task deleted.");
      }
      throw error; // خطأ آخر؟ دعه يفشل لكي يعيد Cloud Tasks المحاولة
    }

    // 3. (الأهم) إعادة جدولة المهمة لبكرة (بعد 24 ساعة)
    const tasksClient = new CloudTasksClient();
    const parentQueuePath = tasksClient.queuePath(
      FIREBASE_PROJECT_ID,
      LOCATION_ID,
      QUEUE_NAME
    );
    const taskName = `user_${userId}_${fcmToken.slice(-10)}`;
    const taskPath = tasksClient.taskPath(
      FIREBASE_PROJECT_ID,
      LOCATION_ID,
      QUEUE_NAME,
      taskName
    );

    const nextRun = moment().add(24, "hours"); // (بكرة زي دلوقتي)

    const task = {
      name: taskPath,
      httpRequest: {
        httpMethod: "POST",
        url: SENDER_FUNCTION_URL,
        body: Buffer.from(JSON.stringify(req.body)).toString("base64"),
      },
      scheduleTime: { seconds: nextRun.unix() },
    };

    try {
      await tasksClient.deleteTask({ name: taskPath });
    } catch (e) {}
    await tasksClient.createTask({ parent: parentQueuePath, task: task });
    logger.info(`(ب) تم إعادة جدولة الإشعار للمستخدم ${userId} لليوم التالي.`);

    res
      .status(200)
      .send(`Notification sent and rescheduled for user ${userId}.`);
  } catch (error) {
    logger.error(`(ب) خطأ فادح في sendScheduledNotification:`, error);
    res.status(500).send("Error processing notification.");
  }
});
