## نظام مخيمات القرآن – توثيق شامل قابل للفهم من نموذج آخر

هذا الملف يقدّم وصفًا عمليًا ودقيقًا لنظام «مخيمات القرآن» في مشروع مشكاة، بهدف تمكين أي نموذج أو مطوّر من فهمه والتفاعل معه فورًا.

### 1) نظرة عامة
- **الفكرة**: إنشاء مخيمات تعلم/تدبر قرآني ذات مدة محددة وأهداف يومية. المستخدم يشترك، ويتابع مهامه اليومية، ويُحتسب تقدمه وسلسلة الإنجاز، وتُرسل له تذكيرات، وتتوفر أدوات للمشرف.
- **الحالات**: `early_registration`، `active`، `reopened`، `completed`.
- **الوحدات**: مخيمات، تسجيلات، مهام يومية، تقدم مهام، خطة عمل شخصية، إحصاءات/لوحة صدارة، موارد المخيم، أسئلة وأجوبة، قوالب مخيمات، إشعارات/رسائل بريدية.

### 2) أهم الملفات والمكونات في المستودع
- Backend
  - `backend/controllers/quranCampsController.js`: المنطق الكامل لمعظم واجهات المخيمات (مستخدم/أدمن/قوالب/موارد/Q&A/تقدم/إشعارات).
  - `backend/routes/quranCamps.js`: تعريف المسارات وربطها بالدوال.
  - `backend/services/campNotificationService.js`: إرسال التذكيرات اليومية/بداية/نهاية.
  - `backend/config/campNotificationScheduler.js`: جدولة مهام الكرون لتذكيرات المخيمات والتحقّق من المنتهية وإعادة الفتح.
  - `backend/middleware/campValidation.js`: التحقق من المدخلات لعمليات الإدارة والمهام.
  - مستند واجهات المستخدم `backend/QURAN_CAMPS_API.md` يشرح نقاط أساسية لواجهات المستخدم.
- Frontend (المستخدم)
  - `frontend/src/pages/QuranCampsPage.jsx`: عرض قائمة المخيمات العامة واستردادها من API.
  - `frontend/src/pages/QuranCampDetailsPage.jsx`: صفحة تفاصيل المخيم والاشتراك والتقدم والمهام اليومية…
  - مكونات داعمة مثل `frontend/src/components/dashboard/CampResources.jsx` لعرض/إدارة الموارد داخل المخيم (حسب الصلاحيات).
- Dashboard (الإدارة)
  - `dashboard/src/app/dashboard/quran-camps/page.tsx`: قائمة المخيمات وإدارتها.
  - `dashboard/src/app/dashboard/quran-camps/[id]/page.tsx`: تفاصيل مخيم للأدمن (إحصاءات/تغيير الحالة/الموارد/Q&A).
  - `dashboard/src/services/api.ts`: دوال استدعاء API لإدارة المخيمات والقوالب والموارد.

### 3) نموذج البيانات (مختصر عملي)
- جداول رئيسية متوقعة (أسماء مستدلة من الاستعلامات):
  - `quran_camps`: تعريف المخيم (name, description, start_date, duration_days, status, is_template, banner_image, share_link, reopened_date...)
  - `camp_enrollments`: تسجيل المستخدمين في المخيمات (camp_id, user_id, status, created_at)
  - `camp_daily_tasks`: مهام يومية للمخيم (camp_id, day_number, title, content, type ...)
  - `camp_task_progress`: إكمال المهام لكل مشترك (task_id, enrollment_id, completed, completed_at, benefits/notes)
  - `camp_notifications`: سجل الإشعارات المرسلة (user_id, camp_id, type, title, created_at)
  - وحدات إضافية: موارد المخيم (تصنيفات/عناصر)، أسئلة/أجوبة، مجموعات مهام، قوالب.

ملاحظة: الحسابات الزمنية تعتمد أحيانًا على توقيت الرياض (+03:00) لضبط اليوم الحالي للمخيم.

### 4) دورة حياة المخيم
1. الإنشاء (قد يكون من الصفر أو من «قالب»).
2. `early_registration`: التسجيل مفتوح قبل البدء.
3. `active`: عند بدء المخيم فعليًا، تُرسل إشعارات/بريد «بدأ المخيم» للمسجلين.
4. خلال المدة: تُنشَر المهام اليومية بحسب `day_number`، ويُرسل تذكير صباحي ومسائي للمتأخرين.
5. `completed`: عند الانتهاء، تُرسل تهنئة/إشعارات. يمكن لاحقًا `reopened` لإتاحة الاشتراك من جديد بتاريخ إعادة فتح.

### 5) واجهات المستخدم الرئيسية (User APIs)
Base: `/api/quran-camps`، مع توثيق إضافي في `backend/QURAN_CAMPS_API.md`.
- أمثلة مهمة كما تُظهرها الـ Controller:
  - GET `/quran-camps`: قائمة المخيمات العامة (تتضمن `is_enrolled`, `status_ar`, `enrolled_count`).
  - GET `/quran-camps/:id`: تفاصيل مخيم (يدعم `:id` أو `share_link` عبر آلية `router.param` للحل).
  - POST `/quran-camps/:id/enroll`: الاشتراك في المخيم.
  - GET `/quran-camps/:id/daily-tasks`: مهام اليوم/الأيام، مرتبطة بحساب اليوم الحالي.
  - POST `/quran-camps/task/:taskId/complete`: إكمال مهمة وتسجيل التقدم.
  - GET `/quran-camps/:id/leaderboard`, `/my-streak`, `/my-stats`: لوحة الصدارة، السلسلة، الإحصاءات.
  - Action Plan: `getMyActionPlan`, `createOrUpdateActionPlan`, `getMySummary`.
  - Interactive: مشاركة الفوائد، حفظ/رفع التدبر، حفظات التدبر.
  - Resources & Q&A: جلب موارد المخيم، الأسئلة والأجوبة.
  - POST `/quran-camps/:id/notify-finished`: إرسال تهنئة الانتهاء لمستخدم مسجل.

جميع الواجهات المحمية تتطلب `x-auth-token`.

### 6) إدارة المخيمات (Admin APIs)
- إنشاء/تحديث/حذف مخيم: create/update/delete.
- تحديث الحالة: `updateCampStatus` مع منطق جانبي لإرسال إشعارات «بدأ المخيم» عند الانتقال من `early_registration` إلى `active`.
- إضافة/تحديث/حذف مهام يومية.
- الإحصاءات والتحليلات وقائمة المشاركين.
- الإعدادات العامة والخاصة بالمخيم.
- الموارد (تصنيفات/عناصر) وQ&A ومجموعات المهام.
- نظام القوالب: حفظ مخيم كقالب، إنشاء مخيم من قالب، وإخفاء القوالب عن القائمة العامة (`is_template = 0` للعام).

### 7) الإشعارات والجدولة
- Scheduler: `backend/config/campNotificationScheduler.js`
  - تذكير يومي صباحي: 08:00 Asia/Riyadh.
  - تذكير يومي مسائي: 20:00 Asia/Riyadh.
  - فحص المخيمات المنتهية: 07:00 يوميًا.
  - تفعيل تلقائي/إعادة فتح (حسب الإعدادات) عند منتصف الليل – منطق مدمج في نفس الملف.
- Service: `backend/services/campNotificationService.js`
  - `sendDailyRemindersToAllActiveCamps`: يجلب المستخدمين المشتركين الذين لديهم مهام اليوم غير مكتملة ويُرسل إشعارات/بريد وفق تفضيلاتهم.
  - إشعارات بداية/نهاية المخيم: `sendCampStartedNotification`, `sendCampFinishedNotification`، مع إرسال بريد عبر `mailService`.

### 8) المنطق الزمني لحساب «يوم المخيم»
- اليوم الحالي يُحسب من `start_date` أو من `reopened_date` (إن وُجدت)، ويُحوَّل التوقيت إلى الرياض عند الحاجة.
- مهام اليوم: اختيار `camp_daily_tasks.day_number = current_day`.
- نطاق العمل: اليوم الحالي يجب أن يقع بين تاريخ البداية وتاريخ النهاية (`start + duration_days`).

### 9) الواجهة الأمامية (المستخدم)
- `QuranCampsPage.jsx`:
  - يجلب `/quran-camps` ويعرض الحالة والمدة والاشتراك.
  - يدعم عرض شبكي/قائمة، بحث وفرز، وحفظ تفضيلات العرض محليًا.
- `QuranCampDetailsPage.jsx`:
  - يعرض تفاصيل المخيم والاشتراك والتقدم والمهام اليومية ولوحة الصدارة والسلسلة.
  - يتكامل مع موارد/Q&A إن كانت متاحة.

### 10) لوحة التحكم (الأدمن)
- قائمة المخيمات: عرض/حذف/تغيير الحالة.
- تفاصيل مخيم: إحصاءات، موارد، Q&A، ضبط الإعدادات.
- قوالب: إنشاء من قالب/حفظ كقالب لإعادة الاستخدام.

### 11) الأمان والصلاحيات
- معظم واجهات القراءة العامة للمخيمات متاحة دون توكن، لكن كل ما يخص المستخدم (الاشتراك/التقدم/خطة العمل/الإشعارات) يتطلب `x-auth-token`.
- واجهات الأدمن خلف مسارات `admin` وتخضع للتحقق من صلاحيات.

### 12) روابط المشاركة والـ id
- يوجد حل مخصص في الراوتر يسمح بتمرير `:id` كرقم أو `share_link` كنص؛ يتم حله إلى `id` رقمي قبل وصول الطلب للـ Controller.

### 13) سلوك البريد والإشعارات
- عند بدء المخيم: إرسال بريد + إشعار للمسجلين (مع منع التكرار عبر سجل `camp_notifications`).
- عند الانتهاء: بريد تهنئة + إشعار.
- يوميًا: تذكير للمهام غير المكتملة فقط.

### 14) أفضل ممارسات للتكامل مع نموذج آخر
- لتقديم إجابات دقيقة للمستخدم:
  - اسأل عن هدفه: بحث عن مخيم، الاشتراك، متابعة تقدم، أو سؤال إداري.
  - إن احتاج اليوم الحالي للمخيم، احسبه وفق منطق `reopened_date` و`start_date` مع TZ الرياض.
  - عند عرض المهام، اعتمد `day_number = current_day` ولا تُظهر المكتمل إلا مع إشارة «مكتمل».
  - عند إرسال تذكير، تحقّق من إعدادات إشعارات المستخدم (إن وُجدت آليات تعطيل).

### 15) نقاط تكامل مهمة (روابط ملفات)
- منطق الواجهات: `backend/controllers/quranCampsController.js`
- المسارات: `backend/routes/quranCamps.js`
- التذكيرات: `backend/services/campNotificationService.js`
- المجدول: `backend/config/campNotificationScheduler.js`
- توثيق مختصر لواجهات المستخدم: `backend/QURAN_CAMPS_API.md`
- واجهة مستخدم عامة: `frontend/src/pages/QuranCampsPage.jsx`
- تفاصيل المستخدم: `frontend/src/pages/QuranCampDetailsPage.jsx`
- لوحة إدارة: `dashboard/src/app/dashboard/quran-camps/*` و`dashboard/src/services/api.ts`

هذا الملخص يغطي بنية النظام وسير العمل والواجهات الأساسية ليتمكن أي نموذج آخر من النقاش أو البناء فوقه بثقة.


