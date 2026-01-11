/**
 * Notification Worker - معالج الإشعارات في الخلفية
 * يعمل بشكل مستقل لمعالجة مهام الإشعارات من الـ Queue
 */

const { Worker } = require("bullmq");
const Redis = require("ioredis");

// استيراد خدمات الإشعارات
const telegramBotService = require("./telegramBotService");
const mailService = require("./mailService");
const campManagementService = require("./campManagementService");

const { NOTIFICATION_TYPES } = require("./notificationQueue");

// إعدادات Redis للتوافق مع Upstash و Production
const redisConfig = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
};

// إنشاء اتصال Redis للـ Worker
const connection = new Redis(process.env.REDIS_URL, redisConfig);

/**
 * معالجة مهمة إشعار Telegram لإنشاء فوج
 */
const processTelegramCohortCreated = async (job) => {
  const {
    campName,
    cohortNumber,
    startDate,
    endDate,
    maxParticipants,
    status,
    announcementMessage,
    shareLink,
  } = job.data;

  console.log(`📱 Processing Telegram notification for cohort ${cohortNumber}...`);

  const result = await telegramBotService.sendCohortCreatedNotification({
    campName,
    cohortNumber,
    startDate,
    endDate,
    maxParticipants,
    status,
    announcementMessage,
    shareLink,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to send Telegram notification");
  }

  return { success: true, message: "Telegram notification sent" };
};

/**
 * معالجة مهمة إشعار Telegram لتحديث فوج
 */
const processTelegramCohortUpdated = async (job) => {
  const { campName, cohortNumber, changes } = job.data;

  console.log(`📱 Processing Telegram update notification for cohort ${cohortNumber}...`);

  const result = await telegramBotService.sendCohortUpdatedNotification({
    campName,
    cohortNumber,
    changes,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to send Telegram update notification");
  }

  return { success: true, message: "Telegram update notification sent" };
};

/**
 * معالجة مهمة إرسال البريد الإلكتروني للمشتركين
 */
const processEmailCohortOpened = async (job) => {
  const { subscribers, campName, campShareLink, cohortNumber, announcementMessage } = job.data;

  console.log(`📧 Processing email notifications for ${subscribers.length} subscribers...`);

  let emailsSent = 0;
  let emailsFailed = 0;

  for (const subscriber of subscribers) {
    try {
      await mailService.sendCohortOpenedEmail(
        subscriber.email,
        campName,
        campShareLink,
        cohortNumber,
        subscriber.unsubscribe_token,
        announcementMessage
      );
      emailsSent++;
    } catch (error) {
      console.error(`Error sending email to ${subscriber.email}:`, error);
      emailsFailed++;
    }
  }

  return {
    success: true,
    emailsSent,
    emailsFailed,
    total: subscribers.length,
  };
};

/**
 * معالجة مهمة إرسال البريد الإلكتروني للمشرفين
 */
const processSupervisorEmail = async (job) => {
  const { campId, cohortNumber, startDate, endDate, announcementMessage, createdBy } = job.data;

  console.log(`📧 Processing supervisor notifications for camp ${campId}...`);

  const result = await campManagementService.notifySupervisorsOnCohortCreation({
    campId,
    cohortNumber,
    startDate,
    endDate,
    announcementMessage,
    createdBy,
  });

  return result;
};

/**
 * معالج المهام الرئيسي
 */
const processJob = async (job) => {
  console.log(`🔄 Processing job ${job.id} of type ${job.name}...`);

  switch (job.name) {
    case NOTIFICATION_TYPES.TELEGRAM_COHORT_CREATED:
      return await processTelegramCohortCreated(job);

    case NOTIFICATION_TYPES.TELEGRAM_COHORT_UPDATED:
      return await processTelegramCohortUpdated(job);

    case NOTIFICATION_TYPES.EMAIL_COHORT_OPENED:
      return await processEmailCohortOpened(job);

    case NOTIFICATION_TYPES.EMAIL_SUPERVISOR:
      return await processSupervisorEmail(job);

    default:
      throw new Error(`Unknown job type: ${job.name}`);
  }
};

// إنشاء الـ Worker
const notificationWorker = new Worker("notifications", processJob, {
  connection,
  concurrency: 5, // معالجة 5 مهام في وقت واحد
  limiter: {
    max: 10, // الحد الأقصى 10 مهام
    duration: 1000, // في ثانية واحدة
  },
});

// أحداث الـ Worker
notificationWorker.on("completed", (job, result) => {
  console.log(`✅ Job ${job.id} completed:`, result);
});

notificationWorker.on("failed", (job, error) => {
  console.error(`❌ Job ${job?.id} failed:`, error.message);
});

notificationWorker.on("error", (error) => {
  console.error("❌ Worker error:", error);
});

notificationWorker.on("ready", () => {
  console.log("🚀 Notification worker is ready and listening for jobs");
});

/**
 * إغلاق الـ Worker بشكل نظيف
 */
const closeWorker = async () => {
  await notificationWorker.close();
  await connection.quit();
};

module.exports = {
  notificationWorker,
  closeWorker,
};
