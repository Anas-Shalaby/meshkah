console.log("Meshkah content.js loaded");

// استقبال رسالة الحديث من background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SHOW_HADITH_POPUP") {
    showHadithPopup(message.hadith);
  }
});

function showHadithPopup(hadith) {
  // تحقق من وجود البيانات
  const title = hadith.title || "حديث بدون عنوان";
  const text = hadith.hadeeth || "لا يوجد نص لهذا الحديث.";

  // إزالة أي popup سابق
  const oldPopup = document.getElementById("meshkah-hadith-popup");
  if (oldPopup) oldPopup.remove();

  // إنشاء عنصر popup
  const popup = document.createElement("div");
  popup.id = "meshkah-hadith-popup";
  popup.className = `fixed z-[999999] bottom-8 right-8 flex flex-col gap-5 animate-fade-in`;
  popup.style.fontFamily = "Tajawal, Arial, sans-serif";
  popup.style.direction = "rtl";
  // CSS inline أساسي
  popup.style.minWidth = "320px";
  popup.style.maxWidth = "400px";
  popup.style.width = "100%";
  popup.style.background = "#fff";
  popup.style.border = "1.5px solid #e5e7eb";
  popup.style.borderRadius = "1.5rem";
  popup.style.padding = "28px";
  popup.style.boxShadow = "0 8px 32px 0 rgba(31, 38, 135, 0.15)";
  popup.style.bottom = "32px";
  popup.style.right = "32px";
  popup.style.zIndex = "999999";

  // محتوى الحديث
  popup.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <span style="font-size:1.1rem;color:#374151;font-weight:bold;">${title}</span>
      <button id="meshkah-close-btn" style="color:#9ca3af;background:none;border:none;cursor:pointer;font-size:1.3rem;line-height:1;">×</button>
    </div>
    <div style="font-size:1.15rem;color:#22223b;line-height:1.8;margin-bottom:8px;text-align:right;">${text}</div>
    <div style="display:flex;gap:10px;margin-top:10px;justify-content:flex-end;">
      <button id="meshkah-ai-btn" style="background:#2563eb;color:#fff;border:none;border-radius:8px;padding:8px 18px;font-size:0.95rem;font-weight:600;box-shadow:0 2px 8px #2563eb22;cursor:pointer;">تحدث مع الذكاء الصناعي</button>
      <button id="meshkah-history-btn" style="background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;border-radius:8px;padding:8px 18px;font-size:0.95rem;font-weight:600;cursor:pointer;">سجل الأحاديث</button>
    </div>
  `;

  // زر الإغلاق
  popup.querySelector("#meshkah-close-btn").onclick = () => popup.remove();

  // زر AI Chat
  popup.querySelector("#meshkah-ai-btn").onclick = () => {
    window.open("https://chat.openai.com/", "_blank"); // يمكنك استبداله بواجهة AI خاصة بك
  };

  // زر سجل الأحاديث
  popup.querySelector("#meshkah-history-btn").onclick = () => {
    showHadithHistory();
  };

  // إضافة popup للصفحة
  document.body.appendChild(popup);

  // حفظ الحديث في Local Storage
  saveHadithToHistory(hadith);

  // إخفاء تلقائي بعد 90 ثانية
  setTimeout(() => {
    popup.remove();
  }, 90000);
}

function saveHadithToHistory(hadith) {
  const key = "meshkah_hadith_history";
  chrome.storage.local.get([key], (result) => {
    let history = result[key] || [];
    // تجنب التكرار
    if (!history.find((h) => h.id === hadith.id)) {
      history.unshift({ ...hadith, time: Date.now() });
      // احتفظ بآخر 100 حديث فقط
      if (history.length > 100) history = history.slice(0, 100);
      chrome.storage.local.set({ [key]: history });
    }
  });
}

function showHadithHistory() {
  const key = "meshkah_hadith_history";
  chrome.storage.local.get([key], (result) => {
    const history = result[key] || [];
    // إزالة أي popup سابق
    const oldPopup = document.getElementById("meshkah-hadith-popup");
    if (oldPopup) oldPopup.remove();
    // إنشاء popup جديد
    const popup = document.createElement("div");
    popup.id = "meshkah-hadith-popup";
    popup.className = `fixed z-[999999] bottom-8 right-8 max-w-md w-full bg-white shadow-2xl rounded-2xl border border-gray-200 p-6 flex flex-col gap-4 animate-fade-in`;
    popup.style.fontFamily = "Tajawal, Arial, sans-serif";
    popup.style.direction = "rtl";
    popup.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="text-lg font-bold text-blue-700">سجل الأحاديث</span>
        <button id="meshkah-close-btn" class="text-gray-400 hover:text-red-500 transition"><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' class='w-5 h-5'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'/></svg></button>
      </div>
      <div class="overflow-y-auto max-h-96 flex flex-col gap-3">
        ${
          history.length === 0
            ? '<div class="text-gray-400 text-center">لا يوجد أحاديث بعد</div>'
            : history
                .map(
                  (h) => `
          <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div class="text-xs text-gray-500 font-bold mb-1">${
              h.title_ar || ""
            }</div>
            <div class="text-sm text-gray-800">${h.hadith_text_ar}</div>
            <div class="text-[10px] text-gray-400 mt-1">${new Date(
              h.time
            ).toLocaleString("ar-EG")}</div>
          </div>
        `
                )
                .join("")
        }
      </div>
    `;
    popup.querySelector("#meshkah-close-btn").onclick = () => popup.remove();
    document.body.appendChild(popup);
  });
}

// Tailwind CSS CDN inject (لو لم يكن موجودًا)
(function injectTailwind() {
  if (!document.getElementById("tailwind-meshkah")) {
    const link = document.createElement("link");
    link.id = "tailwind-meshkah";
    link.rel = "stylesheet";
    link.href =
      "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css";
    document.head.appendChild(link);
  }
})();
