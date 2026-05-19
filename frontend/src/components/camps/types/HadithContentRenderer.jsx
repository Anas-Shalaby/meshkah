import { useEffect, useState } from "react";
import {
  BookOpen,
  Quote,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";

const HADITH_BOOK_NAMES_AR = {
  nawawi40: "الأربعين النووية",
  qudsi40: "الأحاديث القدسية",
  riyad_assalihin: "رياض الصالحين",
  bulugh_almaram: "بلوغ المرام",
  hisnulmuslim: "حصن المسلم",
  shamail_muhammadiyah: "الشمائل المحمدية",
  aladab_almufrad: "الأدب المفرد",
  riyadiah40: "الأربعون الرياضية",
  shahwaliullah40: "أربعين شاه ولي الله",
  malik: "موطأ مالك",
  darimi: "سنن الدارمي",
};

/**
 * HadithContentRenderer
 * --------------------------------------------------------
 * Fetches the hadith from the local Islamic Library endpoint
 * (`/api/islamic-library/local-books/:bookSlug/hadiths/:hadithId`)
 * and renders the Arabic text, chapter, narrator and a link
 * back to the library. Falls back gracefully if the network
 * fails or required metadata is missing.
 *
 * Accepts either:
 *  - meta = { hadith_id, book_slug, hadith_number, chapter_id? }
 *  - task = { content_ref_meta: {...same...}, description? }
 */
const HadithContentRenderer = ({ task, meta: metaProp, compact = false }) => {
  const meta = metaProp || task?.content_ref_meta || {};
  const { hadith_id: hadithId, book_slug: bookSlug, hadith_number: hadithNumber } =
    meta;
  const bookNameAr = bookSlug
    ? HADITH_BOOK_NAMES_AR[bookSlug] || bookSlug
    : null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hadithId || !bookSlug) {
      setData(null);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const apiUrl = import.meta.env.VITE_API_URL || "";
    const url = `${apiUrl}/islamic-library/local-books/${encodeURIComponent(
      bookSlug
    )}/hadiths/${encodeURIComponent(hadithId)}`;

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        if (controller.signal.aborted) return;
        setData(json?.hadith || null);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "تعذّر تحميل الحديث");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [hadithId, bookSlug]);

  if (!hadithId && !bookSlug) return null;

  const arabicText = data?.hadithArabic || data?.arabic || null;
  const chapterAr =
    data?.chapter?.chapterArabic || data?.chapter?.arabic || null;
  const narratorEn = data?.englishNarrator || data?.english?.narrator || null;
  const libraryHref =
    bookSlug && hadithId
      ? `/islamic-library/local-books/${bookSlug}/hadith/${hadithId}`
      : null;

  const wrapperBase = compact
    ? "rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-right"
    : "rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/40 p-4 text-right";

  return (
    <div className={wrapperBase} dir="rtl">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
          <Quote className="w-4 h-4 flex-shrink-0" />
          <span>
            {hadithNumber
              ? `حديث رقم ${hadithNumber}`
              : "حديث اليوم"}
          </span>
        </div>
        {bookNameAr && (
          <div className="text-[11px] text-amber-700/90 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{bookNameAr}</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-amber-700/90 py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>جاري تحميل نص الحديث...</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-100/60 rounded-lg p-2 mt-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            تعذّر تحميل نص الحديث الآن. يمكنك متابعة المهمة وفتح الحديث من
            المكتبة لاحقًا.
          </span>
        </div>
      )}

      {!loading && !error && arabicText && (
        <p
          className={`text-gray-900 leading-loose font-amiri ${
            compact ? "text-sm line-clamp-3" : "text-base"
          }`}
          style={{ fontFamily: "'Amiri', 'Scheherazade New', serif" }}
        >
          {arabicText}
        </p>
      )}

      {!loading && (chapterAr || narratorEn) && (
        <div
          className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] text-amber-800/80 ${
            compact ? "" : "border-t border-amber-200/60 pt-2"
          }`}
        >
          {chapterAr && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/80">
              الباب: {chapterAr}
            </span>
          )}
          {narratorEn && !compact && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/80">
              الراوي: {narratorEn}
            </span>
          )}
        </div>
      )}

      {libraryHref && (
        <a
          href={libraryHref}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-1 mt-3 px-3 py-1.5 rounded-full bg-amber-200/70 hover:bg-amber-300 text-amber-900 ${
            compact ? "text-[11px]" : "text-xs"
          } font-semibold transition`}
        >
          <ExternalLink className="w-3 h-3" />
          <span>عرض الحديث في المكتبة</span>
        </a>
      )}
    </div>
  );
};

export default HadithContentRenderer;
