document.addEventListener("DOMContentLoaded", () => {
  // Tab switching logic
  const tabs = document.querySelectorAll(".main-tab");
  const sections = document.querySelectorAll(".tab-section");
  tabs.forEach((tab) => {
    tab.onclick = () => {
      tabs.forEach((t) => t.classList.remove("active"));
      sections.forEach((s) => s.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
    };
  });

  // --- Reminders Tab ---
  const remindersSection = document.getElementById("tab-reminders");
  function renderReminders(times = []) {
    remindersSection.innerHTML = `
      <div class="card reminders-card">
        <div class="card-title">مواعيد التذكير اليومية</div>
        <form id="reminder-form">
          <div id="reminder-times"></div>
          <button type="submit" class="reminder-save-btn">حفظ المواقيت</button>
        </form>
        <button type="button" class="reminder-add-btn" id="add-time" title="إضافة وقت">
          <svg width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#7440E9"/><path d="M12 7v10M7 12h10" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    `;
    const timeList = remindersSection.querySelector("#reminder-times");
    function createTimeRow(value = "") {
      const row = document.createElement("div");
      row.className = "reminder-row animate-fadeIn";
      row.innerHTML = `
        <img src="icons/clock.svg" class="reminder-clock" alt="ساعة" />
        <input type="time" class="reminder-time-input" value="${value}" required />
        <button type="button" class="reminder-remove-btn" title="حذف الوقت">
          <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#eee"/><path d="M8 8l8 8M16 8l-8 8" stroke="#b00" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        `;
      row.querySelector(".reminder-remove-btn").onclick = () =>
        chrome.storage.sync.remove("reminderTimes");

      row.querySelector(".reminder-remove-btn").onclick = () => row.remove();

      return row;
    }
    if (times.length === 0) {
      timeList.innerHTML =
        '<div class="reminder-empty">لم تقم بإضافة أي مواعيد بعد.</div>';
    } else {
      times.forEach((time) => timeList.appendChild(createTimeRow(time)));
    }
    remindersSection.querySelector("#add-time").onclick = () => {
      timeList.appendChild(createTimeRow(""));
      timeList.querySelector(".reminder-empty")?.remove();
    };
    remindersSection.querySelector("#reminder-form").onsubmit = (e) => {
      e.preventDefault();
      const times = Array.from(timeList.querySelectorAll('input[type="time"]'))
        .map((input) => input.value)
        .filter(Boolean);
      chrome.storage.sync.set({ reminderTimes: times }, () => {
        showToast("تم حفظ المواقيت بنجاح!");
      });
    };
  }
  chrome.storage.sync.get(["reminderTimes"], (result) => {
    renderReminders(result.reminderTimes || []);
  });

  // --- Hadith Tab ---
  const hadithSection = document.getElementById("tab-hadith");
  function renderHadithCard(hadith) {
    if (!hadith || !(hadith.hadith_text_ar || hadith.text || hadith.hadeeth)) {
      hadithSection.innerHTML = `
        <div class="card">
          <h2 class="hadith-title">حديث اليوم</h2>
          <div class="hadith-text">لا يوجد حديث حالياً. ستصلك الأحاديث في أوقات التذكير .</div>
        </div>
      `;

      return;
    }
    hadithSection.innerHTML = `
      <div class="card">
        <h2 class="hadith-title">حديث اليوم</h2>
        <div class="hadith-text" style="white-space:pre-line;word-break:break-word;overflow-wrap:break-word;max-height:400px;overflow:auto;">${
          hadith.hadith_text_ar || hadith.text || hadith.hadeeth || ""
        }</div>
        ${
          hadith.explanation_ar || hadith.explanation
            ? `<div class="hadith-explanation">${
                hadith.explanation_ar || hadith.explanation
              }</div>`
            : ""
        }
        <a href="https://hadith-shareef.com/hadiths/hadith/${
          hadith.id
        }" target="_blank" style="font-size:0.8em; color:#999; margin-top:1em; text-align:center; display:block;">اطلع على الحديث الكامل في الموقع</a>
      </div>
    `;
  }
  function fetchAndStoreHadith() {
    hadithSection.innerHTML = `<div class="card"><div class="hadith-title">حديث اليوم</div><div class="hadith-text">جاري جلب الحديث...</div></div>`;
    // الخطوة 1: جلب كل الـ IDs
    fetch("https://api.hadith-shareef.com/api/hadith-ids")
      .then((res) => res.json())
      .then((ids) => {
        if (!Array.isArray(ids) || ids.length === 0)
          throw new Error("لا يوجد أحاديث متاحة.");
        // الخطوة 2: اختيار ID عشوائي
        const randomId = ids[Math.floor(Math.random() * ids.length)];
        // الخطوة 3: جلب الحديث بالـ ID
        return fetch(
          `https://api.hadith-shareef.com/api/hadith/${randomId}`
        ).then((res) => res.json());
      })
      .then((data) => {
        const hadith = data.hadith || data;
        chrome.storage.local.set({ lastHadith: hadith }, () => {
          renderHadithCard(hadith);
        });
      })
      .catch(() => {
        hadithSection.innerHTML = `<div class="card"><div class="hadith-title">حديث اليوم</div><div class="hadith-text">حدث خطأ أثناء جلب الحديث. حاول مرة أخرى.</div><button class="btn" id="refresh-hadith">تحديث الحديث</button></div>`;
      });
  }
  chrome.storage.local.get(["lastHadith"], ({ lastHadith }) => {
    renderHadithCard(lastHadith);
  });

  const aiSection = document.getElementById("tab-ai");
  let aiMessages = [];
  let hadithContext = {};
  function renderAIChat(hadith) {
    hadithContext = hadith || {};
    aiSection.innerHTML = `
      <div class="card">
        <div class="card-title">محادثة الذكاء الاصطناعي حول الحديث</div>
        <div style="background:#f3edff; font-family:Amiri ,serif; border-radius:10px; padding:1em; color:#333; font-size:1.5em; margin-bottom:1em; white-space:pre-line; word-break:break-word; overflow-wrap:break-word; max-height:400px; overflow:auto;">${
          hadith?.hadith_text_ar ||
          hadith?.title_ar ||
          hadith?.text ||
          hadith?.hadeeth ||
          "لا توجد أحاديث حالياً. ستصلك الأحاديث في أوقات التذكير."
        }</div>
        <div class="chat-area"> 
          <div id="chat-log" class="chat-scroll"></div>
          <div class="input-row">
            <input type="text" id="user-input" placeholder="اكتب سؤالك عن الحديث..." />
            <button class="btn" id="send-btn" title="إرسال">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M3 20l18-8-18-8v7l13 1-13 1v7z" fill="currentColor"/></svg>
            </button>
          </div>
        </div>
        <p style="font-size:0.8em; color:#999; margin-top:1em; text-align:center;">قد يقدم سراج معلومات غير دقيقة. تحقق من المصادر المهمة.</p>
      </div>
    `;
    const chatLog = aiSection.querySelector("#chat-log");
    const userInput = aiSection.querySelector("#user-input");
    const sendBtn = aiSection.querySelector("#send-btn");
    function renderMessages() {
      chatLog.innerHTML = "";
      if (aiMessages.length === 0) {
        chatLog.innerHTML =
          '<div class="chat-empty">ابدأ بكتابة سؤالك حول الحديث...</div>';
      } else {
        aiMessages.forEach((msg) => {
          const isUser = msg.role === "user";
          const bubble = document.createElement("div");
          bubble.className =
            "chat-bubble " + (isUser ? "user" : "ai") + " animate-fadeIn";
          bubble.innerHTML = `
            <img src="icons/${
              isUser ? "user" : "ai"
            }.svg" class="avatar" alt="${isUser ? "مستخدم" : "ذكاء اصطناعي"}" />
            <div class="bubble">${msg.content}</div>
          `;
          chatLog.appendChild(bubble);
        });
        chatLog.scrollTop = chatLog.scrollHeight;
      }
    }
    renderMessages();
    let isLoading = false;
    async function sendMessage() {
      const question = userInput.value.trim();
      if (!question || isLoading) return;
      aiMessages.push({ role: "user", content: question });
      renderMessages();
      userInput.value = "";
      // Show loader
      const loader = document.createElement("div");
      loader.className = "chat-loader";
      loader.innerHTML =
        '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
      chatLog.appendChild(loader);
      chatLog.scrollTop = chatLog.scrollHeight;
      isLoading = true;
      try {
        const hadith = {
          hadeeth:
            hadithContext?.hadith_text_ar ||
            hadithContext?.title_ar ||
            hadithContext?.text ||
            hadithContext?.hadeeth ||
            "",
          explanation:
            hadithContext?.explanation_ar || hadithContext?.explanation || "",
          attribution: hadithContext?.attribution || "",
          source: hadithContext?.source || "",
          grade_ar: hadithContext?.grade_ar || hadithContext?.grade || "",
          takhrij_ar: hadithContext?.takhrij_ar || "",
        };
        const res = await fetch(
          "https://api.hadith-shareef.com/api/ai/ai-chat",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: aiMessages,
              hadith,
            }),
          }
        );
        const data = await res.json();
        const aiMsg =
          data.response ||
          data.reply ||
          data.answer ||
          "لم يتم الحصول على رد من الذكاء الاصطناعي.";
        aiMessages.push({ role: "assistant", content: aiMsg });
        chatLog.removeChild(loader);
        renderMessages();
      } catch (e) {
        chatLog.removeChild(loader);
        aiMessages.push({
          role: "assistant",
          content: "حدث خطأ في الاتصال بالذكاء الاصطناعي.",
        });
        renderMessages();
      }
      isLoading = false;
    }
    sendBtn.onclick = sendMessage;
    userInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  }
  chrome.storage.local.get(["lastHadith"], ({ lastHadith }) => {
    renderAIChat(lastHadith);
  });

  // --- Home/Landing Tab ---
  const homeSection = document.getElementById("tab-home");
  function renderLanding() {
    homeSection.innerHTML = `
      <section class="landing-hero animate-fadeIn">
        <div class="landing-title">مِشكاة - منصة الأحاديث الذكية</div>
        <div class="landing-subtitle">ذكّر نفسك يوميًا بأحاديث نبوية ملهمة وناقشها مع الذكاء الاصطناعي</div>
        <p class="landing-desc">منصة مشكاة تساعدك على تذكّر الأحاديث النبوية وتطبيقها في حياتك اليومية من خلال تذكيرات ذكية ودردشة تفاعلية مع الذكاء الاصطناعي.</p>
        <button class="landing-cta animate-bounce" type="button">ابدأ الآن</button>
      </section>
      <section class="features-grid animate-slideUp">
        <div class="feature-card animate-fadeIn">
          <div class="feature-icon" style="background:#f3edff;"><img src="icons/clock.svg" width="32"/></div>
          <div class="feature-title">تذكير بالأحاديث</div>
          <div class="feature-desc">احصل على إشعارات بأحاديث مختارة في الأوقات التي تحددها بنفسك.</div>
        </div>
        <div class="feature-card animate-fadeIn" style="animation-delay:0.1s;">
          <div class="feature-icon" style="background:#e6f9f3;"><img src="icons/ai.svg" width="32"/></div>
          <div class="feature-title">دردشة الذكاء الاصطناعي</div>
          <div class="feature-desc">ناقش الحديث مع الذكاء الاصطناعي واسأل عن المعاني أو الفوائد أو التطبيق العملي.</div>
        </div>
        <div class="feature-card animate-fadeIn" style="animation-delay:0.2s;">
          <div class="feature-icon" style="background:#f7f6fb;"><img src="icons/user.svg" width="32"/></div>
          <div class="feature-title">تخصيص المواقيت</div>
          <div class="feature-desc">حدد مواعيد التذكير بما يناسب يومك واحتياجاتك.</div>
        </div>
      </section>
      <section class="how-it-works animate-fadeIn">
        <h3 class="section-title">كيف تعمل المنصة؟</h3>
        <div class="steps">
          <div class="step animate-slideUp">
            <div class="step-icon"><img src="icons/clock.svg" width="28"/></div>
            <div class="step-title">1. اختر أوقات التذكير</div>
            <div class="step-desc">حدد الأوقات التي تود أن يصلك فيها حديث نبوي يوميًا.</div>
          </div>
          <div class="step animate-slideUp" style="animation-delay:0.1s;">
            <div class="step-icon"><img src="icons/ai.svg" width="28"/></div>
            <div class="step-title">2. استقبل الحديث وناقشه</div>
            <div class="step-desc">سيصلك حديث جديد ويمكنك مناقشته مع الذكاء الاصطناعي لفهمه أكثر.</div>
          </div>
          <div class="step animate-slideUp" style="animation-delay:0.2s;">
            <div class="step-icon"><img src="icons/user.svg" width="28"/></div>
            <div class="step-title">3. طبّق وتابع تقدمك</div>
            <div class="step-desc">طبّق ما تعلمته وراقب تقدمك في التطبيق.</div>
          </div>
        </div>
      </section>
      <section class="testimonials animate-fadeIn">
        <h3 class="section-title">آراء المستخدمين</h3>
        <div class="testimonials-list">
          <div class="testimonial animate-slideUp">
            <div class="testimonial-text">"أحببت فكرة التذكير اليومي بالأحاديث، التطبيق سهل وملهم!"</div>
            <div class="testimonial-user">— احمد</div>
          </div>
          <div class="testimonial animate-slideUp" style="animation-delay:0.1s;">
            <div class="testimonial-text">"الدردشة مع الذكاء الاصطناعي حول الحديث أضافت لي الكثير من الفهم."</div>
            <div class="testimonial-user">— عبدالله</div>
          </div>
        </div>
      </section>
    `;
  }
  renderLanding();
  // إصلاح زر ابدأ الآن ليعمل دائمًا حتى بعد إعادة render
  document.addEventListener("click", function (e) {
    if (e.target && e.target.classList.contains("landing-cta")) {
      const tabBtn = document.querySelector('.main-tab[data-tab="reminders"]');
      if (tabBtn) tabBtn.click();
    }
  });

  function showToast(message) {
    let toast = document.createElement("div");
    toast.className = "toast-reminder";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("show");
    }, 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
});
