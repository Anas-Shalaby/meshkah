console.log("Background script loaded");

// Mishkath Background Script

// رابط API لجلب حديث عشوائي
const API_URL_Mishkath = "https://api.hadith-shareef.com/api/hadith/random";

// ========== Mishkah: حديث كل دقيقتين تلقائيًا ========== //
let hadithIds = [];
let hadithInterval = null;
let intervalMinutes = 2; // القيمة الافتراضية

// جلب قائمة IDs عند بدء الإضافة
async function fetchHadithIds() {
  try {
    const res = await fetch("https://api.hadith-shareef.com/api/hadith-ids");
    const data = await res.json();
    if (Array.isArray(data.ids)) {
      hadithIds = data.ids;
    }
  } catch (e) {
    console.error("فشل في جلب قائمة IDs:", e);
  }
}

// جلب حديث عشوائي
async function fetchRandomHadith() {
  if (!hadithIds.length) return;
  const randomId = hadithIds[Math.floor(Math.random() * hadithIds.length)];
  try {
    const res = await fetch(
      `https://api.hadith-shareef.com/api/hadith/${randomId}`
    );
    const hadith = await res.json();
    // إرسال الحديث للـ content script في كل التبويبات المفتوحة
    let popupDelivered = false;
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id && tab.url && tab.url.startsWith("http")) {
          chrome.tabs.sendMessage(
            tab.id,
            {
              type: "SHOW_HADITH_POPUP",
              hadith,
            },
            (res) => {
              if (chrome.runtime.lastError) {
                console.warn(
                  "Meshkah: لم يتمكن من إرسال الرسالة للتبويب",
                  tab.url,
                  chrome.runtime.lastError.message
                );
              } else {
                popupDelivered = true;
                console.log("Meshkah: تم إرسال الحديث للتبويب", tab.url);
              }
            }
          );
        }
      });
      // إذا لم يتم عرض الـ popup في أي تبويب، أظهر إشعار
      setTimeout(() => {
        if (!popupDelivered) {
          showFallbackNotification(hadith);
        }
      }, 1000);
    });
  } catch (e) {
    console.error("فشل في جلب الحديث:", e);
  }
}

// جدولة جلب الحديث حسب الفترة المختارة
function scheduleHadithInterval() {
  if (hadithInterval) clearInterval(hadithInterval);
  hadithInterval = setInterval(fetchRandomHadith, intervalMinutes * 60 * 1000);
}

// بدء الجدولة مع قراءة الفترة من التخزين
fetchHadithIds().then(() => {
  chrome.storage.local.get(["intervalMinutes"], (result) => {
    intervalMinutes = result.intervalMinutes || 2;
    // أول حديث مباشرة
    setTimeout(fetchRandomHadith, 2000);
    scheduleHadithInterval();
  });
});

// استقبال رسالة تغيير الفترة من settings.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "UPDATE_INTERVAL" && typeof msg.interval === "number") {
    intervalMinutes = msg.interval;
    scheduleHadithInterval();
  }
});

// دالة مساعدة: جدولة التنبيهات لكل الأوقات المحددة
function scheduleAlarms(times) {
  chrome.alarms.clearAll(() => {
    times.forEach((time, idx) => {
      const [hour, minute] = time.split(":").map(Number);
      const now = new Date();
      let alarmTime = new Date();
      alarmTime.setHours(hour, minute, 0, 0);
      if (alarmTime < now) alarmTime.setDate(alarmTime.getDate() + 1);
      const msUntil = alarmTime.getTime() - now.getTime();
      chrome.alarms.create("mishkath-" + idx, {
        when: Date.now() + msUntil,
        periodInMinutes: 24 * 60,
      });
    });
  });
}

// عند التثبيت أو التشغيل، جدولة التنبيهات
function initAlarms() {
  chrome.storage.sync.get(["reminderTimes"], (result) => {
    const times = result.reminderTimes || [];
    if (times.length > 0) scheduleAlarms(times);
  });
}

chrome.runtime.onInstalled.addListener(initAlarms);
chrome.runtime.onStartup.addListener(initAlarms);

// الاستماع لتغيرات مواقيت التذكير
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.reminderTimes) {
    scheduleAlarms(changes.reminderTimes.newValue || []);
  }
});

// عند إطلاق منبه: جلب حديث عشوائي وعرض إشعار
chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    const res = await fetch(API_URL_Mishkath);
    const data = await res.json();
    // تأكد أن الحديث كامل من الـ API
    const hadith = data.hadith || data; // حسب استجابة الـ API
    // عرض نص مختصر فقط في الإشعار
    chrome.notifications.create(
      "",
      {
        type: "basic",
        iconUrl: "icons/128x128.png",
        title: "حديث اليوم",
        message: hadith.title_ar
          ? hadith.hadith_text_ar
            ? hadith.hadith_text_ar.substring(0, 120) + "..."
            : "انقر لعرض الحديث"
          : "انقر لعرض الحديث",
        contextMessage: "اضغط لقراءة الشرح والمزيد",
        priority: 2,
      },
      (notifId) => {
        // تخزين الحديث كاملًا في التخزين المحلي
        chrome.storage.local.set(
          { lastHadith: hadith, lastNotifId: notifId },
          () => {
            // طباعة الحديث في الكونسول للتأكد من اكتماله
            console.log("تم تخزين الحديث في التخزين المحلي:", hadith);
          }
        );
      }
    );
  } catch (e) {
    console.error("فشل في جلب الحديث:", e);
  }
});

// عند الضغط على الإشعار، افتح الصفحة الرئيسية للامتداد
chrome.notifications.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});

// عند الضغط على أيقونة الامتداد، افتح الصفحة الرئيسية
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});

function showFallbackNotification(hadith) {
  chrome.notifications.create("", {
    type: "basic",
    iconUrl: "icons/128x128.png",
    title: hadith.title_ar || "حديث اليوم",
    message: hadith.hadith_text_ar
      ? hadith.hadith_text_ar.substring(0, 120) + "..."
      : "انقر لعرض الحديث",
    contextMessage:
      "تعذر عرض الحديث في الصفحة بسبب سياسة حماية الموقع أو عدم وجود صفحات مفتوحة",
    priority: 2,
  });
}
