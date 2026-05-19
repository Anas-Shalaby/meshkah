/**
 * Camp Type Registry
 * --------------------------------------------------------
 * يعرّف الأنواع المتاحة للمخيمات (`quran` / `hadith`) ويوفّر لكل
 * نوع: مولّد المهام الافتراضي، مدقّق المصدر، ومنسّق محتوى المهمة.
 *
 * - `quran`: يعتمد على المسار الإداري الكامل (cohorts/supervisors/...)
 *   كما هو موجود في quranCampsController. لذا generateTasks للقرآن
 *   تُترك للسير الإداري التقليدي (يدوي أو من template).
 * - `hadith`: ينشئ تلقائيًا مهامًا يومية من ملف الكتاب المختار،
 *   ويعمل بدون أفواج (auto-start on enrollment).
 */

const fs = require("fs");
const path = require("path");

const HADITH_BOOKS = [
  { slug: "nawawi40", name: "الأربعين النووية", file: "nawawi40.json" },
  { slug: "qudsi40", name: "الأحاديث القدسية", file: "qudsi40.json" },
  { slug: "riyad_assalihin", name: "رياض الصالحين", file: "riyad_assalihin.json" },
  { slug: "bulugh_almaram", name: "بلوغ المرام", file: "bulugh_almaram.json" },
  { slug: "hisnulmuslim", name: "حصن المسلم", file: "hisnulmuslim.json" },
  { slug: "shamail_muhammadiyah", name: "الشمائل المحمدية", file: "shamail_muhammadiyah.json" },
  { slug: "aladab_almufrad", name: "الأدب المفرد", file: "aladab_almufrad.json" },
  { slug: "riyadiah40", name: "الأربعون الرياضية", file: "riyadiah40.json" },
  { slug: "shahwaliullah40", name: "أربعين شاه ولي الله", file: "shahwaliullah40.json" },
  { slug: "malik", name: "موطأ مالك", file: "malik.json" },
  { slug: "darimi", name: "سنن الدارمي", file: "darimi.json" },
];

const loadHadithBook = (slug) => {
  const book = HADITH_BOOKS.find((b) => b.slug === slug);
  if (!book) return null;
  const filePath = path.join(__dirname, "../public", book.file);
  if (!fs.existsSync(filePath)) return null;
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return { meta: book, data: JSON.parse(data) };
  } catch (err) {
    console.error(`[campTypeRegistry] failed to load ${slug}:`, err.message);
    return null;
  }
};

// ====================== QURAN ======================
const validateQuranSource = ({ surah_number, surah_name }) => {
  if (!surah_name && !surah_number) {
    return { ok: false, message: "اختر السورة المرجعية للمخيم" };
  }
  return { ok: true };
};

const generateQuranTasks = async () => {
  // Quran camps already use the existing admin/template flow for daily tasks.
  // We don't auto-generate here; we let the existing addDailyTasks pipeline do it.
  return { generated: false, reason: "uses_existing_flow" };
};

const formatQuranTaskContent = (task) => ({
  surah_number: task.surah_number || null,
  surah_name: task.surah_name || null,
  verses_from: task.verses_from || null,
  verses_to: task.verses_to || null,
});

// ====================== HADITH ======================
const validateHadithSource = ({ content_source_slug }) => {
  if (!content_source_slug) {
    return { ok: false, message: "اختر كتاب الحديث المرجعي للمخيم" };
  }
  if (!HADITH_BOOKS.find((b) => b.slug === content_source_slug)) {
    return {
      ok: false,
      message: "الكتاب المختار غير مدعوم. اختر كتابًا من القائمة المتاحة.",
    };
  }
  return { ok: true };
};

/**
 * Insert default daily tasks for a hadith camp into camp_daily_tasks.
 * Each day generates 3 tasks using existing system task types
 * (`reading`, `journal`, `journal`) so they get proper Arabic labels and
 * icons in the rest of the app, instead of inventing new types.
 *
 * @param {object} ctx
 * @param {object} ctx.db                  database connection (mysql pool/promise)
 * @param {number} ctx.campId
 * @param {string} ctx.contentSourceSlug   (e.g. 'nawawi40')
 * @param {number} ctx.durationDays        (defaults to 14)
 */
const generateHadithTasks = async ({ db, campId, contentSourceSlug, durationDays }) => {
  const loaded = loadHadithBook(contentSourceSlug);
  if (!loaded?.data?.hadiths?.length) {
    return { generated: false, reason: "book_not_found" };
  }

  const totalDays = Math.max(1, Number(durationDays) || 14);
  const hadiths = loaded.data.hadiths;
  const hadithsPerDay = Math.max(1, Math.ceil(hadiths.length / totalDays));

  const rows = [];
  for (let day = 1; day <= totalDays; day += 1) {
    const idx = (day - 1) * hadithsPerDay;
    const hadith = hadiths[Math.min(idx, hadiths.length - 1)];
    const hadithId = hadith?.id || day;
    const hadithNumber = hadith?.idInBook || hadith?.number || hadith?.id || day;

    const refMeta = JSON.stringify({
      hadith_id: hadithId,
      book_slug: contentSourceSlug,
      hadith_number: hadithNumber,
      chapter_id:
        hadith?.chapterId !== undefined && hadith?.chapterId !== null
          ? hadith.chapterId
          : null,
    });

    rows.push([
      campId,
      day,
      `قراءة حديث اليوم ${day}`,
      "اقرأ نص الحديث بتأنٍّ، وتأمّل ألفاظه ومعناه قبل الانتقال للمهمة التالية.",
      "reading",
      "hadith_id",
      refMeta,
      10,
    ]);

    rows.push([
      campId,
      day,
      `فوائد حديث اليوم ${day}`,
      "اكتب من 1 إلى 3 فوائد استخلصتها من الحديث، مع شاهد أو موقف يربطها بحياتك.",
      "journal",
      "hadith_id",
      refMeta,
      10,
    ]);

    rows.push([
      campId,
      day,
      `تطبيق عملي للحديث ${day}`,
      "اذكر سنة أو عملًا واحدًا مأخوذًا من الحديث ستلتزم به اليوم، واكتب كيف ستنفّذه.",
      "journal",
      "hadith_id",
      refMeta,
      15,
    ]);
  }

  await db.query(
    `INSERT INTO camp_daily_tasks
      (camp_id, day_number, title, description, task_type, content_ref_type, content_ref_meta, points)
     VALUES ?`,
    [rows]
  );

  return { generated: true, count: rows.length, days: totalDays };
};

const formatHadithTaskContent = (task) => {
  let meta = {};
  try {
    meta = task.content_ref_meta
      ? typeof task.content_ref_meta === "string"
        ? JSON.parse(task.content_ref_meta)
        : task.content_ref_meta
      : {};
  } catch {
    meta = {};
  }
  return {
    hadith_id: meta.hadith_id || null,
    book_slug: meta.book_slug || null,
    hadith_number: meta.hadith_number || null,
    chapter_id:
      meta.chapter_id !== undefined && meta.chapter_id !== null
        ? meta.chapter_id
        : null,
  };
};

// ====================== REGISTRY ======================
const registry = {
  quran: {
    label: "مخيم قرآن",
    description: "تجربة مخيم قرآني كاملة بأفواج وإشراف وتدرّج جماعي.",
    defaultEnableCohorts: true,
    autoStartOnEnroll: false,
    supportedSources: [{ type: "surah", label: "سورة محددة" }],
    validateSource: validateQuranSource,
    generateTasks: generateQuranTasks,
    formatTaskContent: formatQuranTaskContent,
  },
  hadith: {
    label: "مخيم حديث",
    description: "مخيم ذاتي السرعة لقراءة وفهم وتطبيق أحاديث من كتاب مختار، يبدأ تلقائيًا عند الاشتراك.",
    defaultEnableCohorts: false,
    autoStartOnEnroll: true,
    supportedSources: [
      { type: "book", label: "كتاب حديث", options: HADITH_BOOKS.map((b) => ({ slug: b.slug, name: b.name })) },
    ],
    validateSource: validateHadithSource,
    generateTasks: generateHadithTasks,
    formatTaskContent: formatHadithTaskContent,
  },
};

const getCampType = (type) => registry[type] || registry.quran;

const listCampTypes = () =>
  Object.entries(registry).map(([key, value]) => ({
    type: key,
    label: value.label,
    description: value.description,
    defaultEnableCohorts: value.defaultEnableCohorts,
    autoStartOnEnroll: value.autoStartOnEnroll,
    supportedSources: value.supportedSources,
  }));

module.exports = {
  registry,
  getCampType,
  listCampTypes,
  HADITH_BOOKS,
  loadHadithBook,
};
