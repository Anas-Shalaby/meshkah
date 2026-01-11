/**
 * Notification Queue Service using BullMQ
 * يعالج إشعارات Telegram والبريد الإلكتروني في الخلفية
 * لتحسين أداء الـ API وعدم انتظار المستخدم
 */

const { Queue } = require("bullmq");
const Redis = require("ioredis");

// إعدادات Redis للتوافق مع Upstash و Production
const redisConfig = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    if (times > 3) return null; // توقف بعد 3 محاولات
    return Math.min(times * 200, 2000); // تأخير تصاعدي
  },
};

// إنشاء اتصال Redis مخصص لـ BullMQ
const connection = new Redis(process.env.REDIS_URL, redisConfig);

// إنشاء Queue للإشعارات
const notificationQueue = new Queue("notifications", {
  connection,
  defaultJobOptions: {
    attempts: 3, // عدد محاولات إعادة المحاولة
    backoff: {
      type: "exponential",
      delay: 2000, // تأخير 2 ثواني بين المحاولات
    },
    removeOnComplete: {
      age: 3600, // حذف المهام المكتملة بعد ساعة
      count: 100, // الاحتفاظ بآخر 100 مهمة مكتملة
    },
    removeOnFail: {
      age: 86400, // حذف المهام الفاشلة بعد يوم
    },
  },
});

// أنواع الإشعارات
const NOTIFICATION_TYPES = {
  TELEGRAM_COHORT_CREATED: "telegram:cohort:created",
  TELEGRAM_COHORT_UPDATED: "telegram:cohort:updated",
  EMAIL_COHORT_OPENED: "email:cohort:opened",
  EMAIL_SUPERVISOR: "email:supervisor",
};

/**
 * إضافة مهمة إشعار Telegram لإنشاء فوج جديد
 */
const addTelegramCohortCreatedJob = async (data) => {
  return await notificationQueue.add(
    NOTIFICATION_TYPES.TELEGRAM_COHORT_CREATED,
    {
      type: NOTIFICATION_TYPES.TELEGRAM_COHORT_CREATED,
      ...data,
    },
    {
      priority: 1, // أولوية عالية
    }
  );
};

/**
 * إضافة مهمة إشعار Telegram لتحديث فوج
 */
const addTelegramCohortUpdatedJob = async (data) => {
  return await notificationQueue.add(
    NOTIFICATION_TYPES.TELEGRAM_COHORT_UPDATED,
    {
      type: NOTIFICATION_TYPES.TELEGRAM_COHORT_UPDATED,
      ...data,
    },
    {
      priority: 1,
    }
  );
};

/**
 * إضافة مهمة إرسال بريد إلكتروني للمشتركين
 */
const addCohortOpenedEmailJob = async (data) => {
  return await notificationQueue.add(
    NOTIFICATION_TYPES.EMAIL_COHORT_OPENED,
    {
      type: NOTIFICATION_TYPES.EMAIL_COHORT_OPENED,
      ...data,
    },
    {
      priority: 2, // أولوية متوسطة
    }
  );
};

/**
 * إضافة مهمة إرسال بريد إلكتروني للمشرفين
 */
const addSupervisorEmailJob = async (data) => {
  return await notificationQueue.add(
    NOTIFICATION_TYPES.EMAIL_SUPERVISOR,
    {
      type: NOTIFICATION_TYPES.EMAIL_SUPERVISOR,
      ...data,
    },
    {
      priority: 2,
    }
  );
};

/**
 * الحصول على إحصائيات الـ Queue
 */
const getQueueStats = async () => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    notificationQueue.getWaitingCount(),
    notificationQueue.getActiveCount(),
    notificationQueue.getCompletedCount(),
    notificationQueue.getFailedCount(),
    notificationQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + delayed,
  };
};

/**
 * إغلاق الاتصال بشكل نظيف
 */
const closeQueue = async () => {
  await notificationQueue.close();
  await connection.quit();
};

module.exports = {
  notificationQueue,
  connection,
  NOTIFICATION_TYPES,
  addTelegramCohortCreatedJob,
  addTelegramCohortUpdatedJob,
  addCohortOpenedEmailJob,
  addSupervisorEmailJob,
  getQueueStats,
  closeQueue,
};
