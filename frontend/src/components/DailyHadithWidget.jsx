import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Heart,
  Copy,
  Bookmark,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import axios from "axios";
import { useBookmarks } from "../context/BookmarkContext";
import { useAuth } from "../context/AuthContext";
import BookmarkModal from "./BookmarkModal";
import { toast } from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import { getDashboardTheme } from "./home/dashboardTheme";

function getShortArabicDate() {
  return new Intl.DateTimeFormat("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    calendar: "gregory",
  }).format(new Date());
}

const DailyHadithWidget = () => {
  const { isNight } = useTheme();
  const t = getDashboardTheme(isNight);
  const [dailyHadith, setDailyHadith] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { addBookmark, removeBookmark, bookmarks } = useBookmarks();
  const { user } = useAuth();
  const todayLabel = getShortArabicDate();

  const fetchRandomHadith = async () => {
    setLoading(true);
    try {
      const idsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/hadith-ids`,
      );

      if (idsResponse.data.ids?.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * idsResponse.data.ids.length,
        );
        const randomId = idsResponse.data.ids[randomIndex];

        const hadithResponse = await axios.get(
          `https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${randomId}`,
        );

        if (hadithResponse.data) {
          const hadithData = hadithResponse.data;
          setDailyHadith(hadithData);
          setLikesCount(0);
          setIsLiked(false);
          setIsBookmarked(false);

          localStorage.setItem(
            "daily_hadith",
            JSON.stringify({
              hadith: hadithData,
              date: new Date().toDateString(),
              likes: 0,
              isLiked: false,
            }),
          );
        }
      }
    } catch (error) {
      console.error("Error fetching hadith:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyHadith = () => {
    const saved = localStorage.getItem("daily_hadith");
    const today = new Date().toDateString();

    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) {
        setDailyHadith(parsed.hadith);
        setLikesCount(parsed.likes || 0);
        setIsLiked(parsed.isLiked || false);
        setIsBookmarked(bookmarks.some((b) => b.id === parsed.hadith.id));
        setLoading(false);
        return;
      }
    }
    fetchRandomHadith();
  };

  const toggleLike = () => {
    const newLikes = isLiked ? likesCount - 1 : likesCount + 1;
    const newIsLiked = !isLiked;
    setLikesCount(newLikes);
    setIsLiked(newIsLiked);

    const saved = localStorage.getItem("daily_hadith");
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.likes = newLikes;
      parsed.isLiked = newIsLiked;
      localStorage.setItem("daily_hadith", JSON.stringify(parsed));
    }
  };

  const shareHadith = () => setShowShareModal(true);

  const shareToSocialMedia = (platform) => {
    if (!dailyHadith) return;

    const text = `حديث اليوم من مشكاة:\n\n${dailyHadith.hadeeth}\n\n${window.location.origin}/daily-hadith`;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(
      `${window.location.origin}/daily-hadith`,
    );

    let shareUrl = "";
    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodedText}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(`حديث اليوم من مشكاة:\n\n${dailyHadith.hadeeth}`)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "copy":
        navigator.clipboard.writeText(
          `${window.location.origin}/hadiths/hadith/${dailyHadith.id}`,
        );
        toast.success("تم نسخ الرابط");
        setShowShareModal(false);
        return;
      default:
        return;
    }
    window.open(shareUrl, "_blank");
    setShowShareModal(false);
  };

  const handleBookmarkToggle = () => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً لحفظ الحديث");
      return;
    }
    if (isBookmarked) {
      removeBookmark(dailyHadith.id);
      setIsBookmarked(false);
    } else {
      setShowBookmarkModal(true);
    }
  };

  const handleBookmarkSubmit = async (collectionName) => {
    try {
      await addBookmark({
        id: dailyHadith.id,
        hadeeth: dailyHadith.hadeeth,
        attribution: dailyHadith.attribution,
        grade: dailyHadith.grade,
        collection: collectionName,
      });
      setIsBookmarked(true);
      setShowBookmarkModal(false);
      toast.success("تم حفظ الحديث بنجاح");
    } catch {
      toast.error("حدث خطأ في حفظ الحديث");
    }
  };

  useEffect(() => {
    if (dailyHadith && bookmarks) {
      setIsBookmarked(bookmarks.some((b) => b.id === dailyHadith.id));
    }
  }, [dailyHadith, bookmarks]);

  useEffect(() => {
    loadDailyHadith();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className={`${t.card} p-4 animate-pulse`}>
        <div className="mb-3 flex justify-between">
          <div className="h-4 w-24 rounded bg-purple-100" />
          <div className="h-6 w-16 rounded-full bg-purple-50" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-gray-100" />
          <div className="h-3 w-[90%] rounded bg-gray-100" />
          <div className="h-3 w-[75%] rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!dailyHadith) {
    return (
      <div className={`${t.card} p-8 text-center text-sm ${t.textBody}`}>
        تعذّر تحميل حديث اليوم.{" "}
        <button
          type="button"
          onClick={fetchRandomHadith}
          className={`font-semibold ${t.textAccent} hover:underline`}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`${t.card} p-4 sm:p-5`}
        dir="rtl"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isNight ? "bg-[#34343a] text-[#a89bb8]" : "bg-[#7440E9]/10 text-[#7440E9]"}`}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <h3 className={`text-sm font-bold ${t.textAccent}`}>حديث اليوم</h3>
              <p className={`truncate text-[10px] ${t.textMuted}`}>{todayLabel}</p>
            </div>
          </div>
          <Link
            to="/daily-hadith"
            className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${isNight ? "border-white/10 bg-[#2c2c31] text-zinc-300 hover:bg-[#34343a]" : "border-[#7440E9]/25 bg-[#7440E9]/5 text-[#7440E9] hover:bg-[#7440E9]/10"}`}
          >
            عرض كامل
            <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>

        <blockquote>
          <p className={`amiri-regular line-clamp-3 text-sm leading-relaxed ${isNight ? "text-zinc-200" : "text-gray-800"}`}>
            {dailyHadith.hadeeth}
          </p>
          {(dailyHadith.attribution || dailyHadith.grade) && (
            <p className={`mt-1.5 truncate text-[11px] ${t.textMuted}`}>
              {[dailyHadith.attribution, dailyHadith.grade].filter(Boolean).join(" · ")}
            </p>
          )}
        </blockquote>

        <div className={`mt-3 flex items-center justify-between border-t pt-3 ${isNight ? "border-white/10" : "border-purple-100/80"}`}>
          <div className="flex items-center gap-0.5">
            <ActionBtn
              onClick={toggleLike}
              active={isLiked}
              activeClass="bg-rose-500 text-white"
              label={likesCount > 0 ? String(likesCount) : undefined}
              title="إعجاب"
              compact
              isNight={isNight}
            >
              <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
            </ActionBtn>
            <ActionBtn onClick={shareHadith} title="مشاركة" compact isNight={isNight}>
              <Share2 className="h-3.5 w-3.5" />
            </ActionBtn>
            <ActionBtn
              onClick={handleBookmarkToggle}
              active={isBookmarked}
              activeClass="bg-amber-500 text-white"
              title={isBookmarked ? "محفوظ" : "حفظ"}
              compact
              isNight={isNight}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-current" : ""}`} />
            </ActionBtn>
          </div>
          {dailyHadith.id && (
            <Link
              to={`/hadiths/hadith/${dailyHadith.id}`}
              className={`text-[11px] font-medium ${t.link}`}
            >
              المصدر
            </Link>
          )}
        </div>
      </motion.article>

      {/* مشاركة */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              <h3 className="mb-1 text-center text-lg font-bold text-gray-900">
                مشاركة الحديث
              </h3>
              <p className="mb-4 text-center text-xs text-gray-500">
                اختر المنصة
              </p>
              <div className="grid grid-cols-2 gap-2">
                <SharePlatformBtn
                  label="واتساب"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => shareToSocialMedia("whatsapp")}
                />
                <SharePlatformBtn
                  label="تيليجرام"
                  className="bg-sky-500 hover:bg-sky-600"
                  onClick={() => shareToSocialMedia("telegram")}
                />
                <SharePlatformBtn
                  label="X"
                  className="bg-gray-900 hover:bg-black"
                  onClick={() => shareToSocialMedia("twitter")}
                />
                <SharePlatformBtn
                  label="فيسبوك"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => shareToSocialMedia("facebook")}
                />
                <button
                  type="button"
                  onClick={() => shareToSocialMedia("copy")}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  <Copy className="h-4 w-4" />
                  نسخ الرابط
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showBookmarkModal && (
        <BookmarkModal
          isOpen={showBookmarkModal}
          onClose={() => setShowBookmarkModal(false)}
          onSubmit={handleBookmarkSubmit}
          hadith={dailyHadith}
          existingCollections={[...new Set(bookmarks.map((b) => b.collection))]}
        />
      )}
    </>
  );
};

function ActionBtn({
  children,
  onClick,
  active = false,
  activeClass = "",
  label,
  title,
  compact = false,
  isNight = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center gap-0.5 rounded-lg font-medium transition-all active:scale-95 ${
        compact ? "h-8 min-w-8 px-1.5 text-[10px]" : "h-10 min-w-10 gap-1 rounded-xl px-2.5 text-sm"
      } ${
        active
          ? activeClass
          : isNight
            ? "text-zinc-400 hover:bg-[#34343a] hover:text-zinc-200"
            : "text-gray-500 hover:bg-purple-50 hover:text-[#7440E9]"
      }`}
    >
      {children}
      {label != null && <span className="tabular-nums">{label}</span>}
    </button>
  );
}

function SharePlatformBtn({ label, className, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl py-3 text-sm font-semibold text-white transition-colors ${className}`}
    >
      {label}
    </button>
  );
}

export default DailyHadithWidget;
