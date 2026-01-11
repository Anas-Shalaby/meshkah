/**
 * Telegram Bot Service for Camp Cohort Notifications
 * يرسل إشعارات على قناة تيليجرام عند إنشاء أو تعديل الأفواج
 */

const TelegramBot = require("node-telegram-bot-api");

// التحقق من وجود متغيرات البيئة
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

// تهيئة البوت (بدون polling لأننا نستخدمه للإرسال فقط)
let bot = null;

const initializeBot = () => {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("⚠️ TELEGRAM_BOT_TOKEN not configured. Telegram notifications disabled.");
    return null;
  }
  if (!TELEGRAM_CHANNEL_ID) {
    console.warn("⚠️ TELEGRAM_CHANNEL_ID not configured. Telegram notifications disabled.");
    return null;
  }
  
  try {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
    console.log("✅ Telegram bot initialized successfully");
    return bot;
  } catch (error) {
    console.error("❌ Error initializing Telegram bot:", error);
    return null;
  }
};

// تهيئة البوت عند بدء التشغيل
initializeBot();

/**
 * تنسيق التاريخ بالعربية
 * @param {string} dateStr - تاريخ بالتنسيق ISO
 * @returns {string} التاريخ منسق بالعربية
 */
const formatArabicDate = (dateStr) => {
  if (!dateStr) return "غير محدد";
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  } catch (error) {
    return dateStr;
  }
};

/**
 * ترجمة حالة الفوج للعربية
 * @param {string} status - حالة الفوج بالإنجليزية
 * @returns {string} الحالة بالعربية مع إيموجي
 */
const getStatusArabic = (status) => {
  const statusMap = {
    scheduled: "📅 مجدول",
    early_registration: "📝 التسجيل المبكر",
    active: "🟢 نشط",
    completed: "✅ مكتمل",
    cancelled: "❌ ملغي",
  };
  return statusMap[status] || status;
};

/**
 * إرسال إشعار إنشاء فوج جديد
 * @param {Object} params
 * @param {string} params.campName - اسم المخيم
 * @param {number} params.cohortNumber - رقم الفوج
 * @param {string} params.startDate - تاريخ البدء
 * @param {string} params.endDate - تاريخ الانتهاء
 * @param {number} params.maxParticipants - الحد الأقصى للمشاركين
 * @param {string} params.status - حالة الفوج
 * @param {string} params.announcementMessage - رسالة الإعلان
 * @param {string} params.shareLink - رابط المشاركة
 */
const sendCohortCreatedNotification = async ({
  campName,
  cohortNumber,
  startDate,
  endDate,
  maxParticipants,
  status,
  announcementMessage,
  shareLink,
}) => {
  if (!bot) {
    console.warn("Telegram bot not initialized. Skipping notification.");
    return { success: false, error: "Bot not initialized" };
  }

  try {
    const message = `
📢 *فوج جديد في مخيم ${campName}!*

📋 *تفاصيل الفوج:*
• رقم الفوج: *${cohortNumber}*
• تاريخ البدء: ${formatArabicDate(startDate)}
• تاريخ الانتهاء: ${formatArabicDate(endDate)}
• الحد الأقصى: ${maxParticipants ? `${maxParticipants} مشارك` : "غير محدد"}
• الحالة: ${getStatusArabic(status)}
${announcementMessage ? `\n💬 *رسالة الإعلان:*\n${announcementMessage}` : ""}
${shareLink ? `\n🔗 [للتسجيل اضغط هنا](https://meshkah.com/quran-camps/${shareLink})` : ""}

━━━━━━━━━━━━━━━
🕌 *منصة مشكاة*
    `.trim();

    await bot.sendMessage(TELEGRAM_CHANNEL_ID, message, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });

    console.log(`✅ Telegram notification sent for new cohort ${cohortNumber} in camp ${campName}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending Telegram notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * إرسال إشعار تعديل فوج
 * @param {Object} params
 * @param {string} params.campName - اسم المخيم
 * @param {number} params.cohortNumber - رقم الفوج
 * @param {Array<{field: string, oldValue: any, newValue: any}>} params.changes - التغييرات
 */
const sendCohortUpdatedNotification = async ({
  campName,
  cohortNumber,
  changes,
}) => {
  if (!bot) {
    console.warn("Telegram bot not initialized. Skipping notification.");
    return { success: false, error: "Bot not initialized" };
  }

  // ترجمة أسماء الحقول
  const fieldNames = {
    start_date: "تاريخ البدء",
    end_date: "تاريخ الانتهاء",
    status: "الحالة",
    is_open: "حالة التسجيل",
    max_participants: "الحد الأقصى للمشاركين",
  };

  try {
    // تنسيق التغييرات
    const changesText = changes
      .map((change) => {
        const fieldName = fieldNames[change.field] || change.field;
        let oldVal = change.oldValue;
        let newVal = change.newValue;

        // تنسيق القيم حسب نوع الحقل
        if (change.field === "status") {
          oldVal = getStatusArabic(oldVal);
          newVal = getStatusArabic(newVal);
        } else if (change.field === "is_open") {
          oldVal = oldVal ? "مفتوح 🔓" : "مغلق 🔒";
          newVal = newVal ? "مفتوح 🔓" : "مغلق 🔒";
        } else if (change.field.includes("date")) {
          oldVal = formatArabicDate(oldVal);
          newVal = formatArabicDate(newVal);
        }

        return `• ${fieldName}: ${oldVal} ← *${newVal}*`;
      })
      .join("\n");

    const message = `
🔄 *تحديث على الفوج ${cohortNumber} في  ${campName}*

📝 *التغييرات:*
${changesText}

━━━━━━━━━━━━━━━
🕌 *منصة مشكاة*
    `.trim();

    await bot.sendMessage(TELEGRAM_CHANNEL_ID, message, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });

    console.log(`✅ Telegram update notification sent for cohort ${cohortNumber}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending Telegram update notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * اختبار الاتصال بالبوت
 */
const testConnection = async () => {
  if (!bot) {
    return { success: false, error: "Bot not initialized" };
  }

  try {
    const me = await bot.getMe();
    console.log("✅ Telegram bot connected:", me.username);
    return { success: true, botInfo: me };
  } catch (error) {
    console.error("❌ Telegram bot connection test failed:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendCohortCreatedNotification,
  sendCohortUpdatedNotification,
  testConnection,
  formatArabicDate,
  getStatusArabic,
};
