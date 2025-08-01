document.addEventListener("DOMContentLoaded", () => {
  const intervalInput = document.getElementById("interval");
  const saveBtn = document.getElementById("save-btn");
  const historyList = document.getElementById("history-list");

  // تحميل الإعداد الحالي
  chrome.storage.local.get(["intervalMinutes"], (result) => {
    intervalInput.value = Number(intervalInput.value) || 2;
  });

  // تحميل سجل الأحاديث
  function loadHistory() {
    chrome.storage.local.get(["meshkah_hadith_history"], (result) => {
      const history = result.meshkah_hadith_history || [];
      historyList.innerHTML =
        history.length === 0
          ? '<div class="text-gray-400 text-center">لا يوجد أحاديث بعد</div>'
          : history
              .map(
                (h) => `
          <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div class="text-xs text-gray-500 font-bold mb-1">${
              h.title || ""
            }</div>
            <div class="text-sm text-gray-800">${h.hadeeth}</div>
            <div class="text-[10px] text-gray-400 mt-1">${new Date(
              h.time
            ).toLocaleString("ar-EG")}</div>
          </div>
        `
              )
              .join("");
    });
  }
  loadHistory();

  // عند الحفظ
  saveBtn.onclick = () => {
    const val = Math.max(
      1,
      Math.min(60, parseInt(intervalInput.value, 10) || 2)
    );
    chrome.storage.local.set({ intervalMinutes: val }, () => {
      // أبلغ background.js لتغيير الجدولة
      chrome.runtime.sendMessage({ type: "UPDATE_INTERVAL", interval: val });
      saveBtn.textContent = "تم الحفظ ✔";
      setTimeout(() => (saveBtn.textContent = "حفظ الإعدادات"), 1500);
    });
  };
});
