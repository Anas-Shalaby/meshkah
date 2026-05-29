import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Share2,
  Bookmark,
  Sparkles,
  Copy,
  RefreshCw,
  Heart,
  Check,
  ExternalLink,
  ArrowLeft,
  Star,
  BookOpen,
  Brain,
  TableCellsMergeIcon,
  Users,
  Twitter,
  Shield,
} from "lucide-react";
import { useBookmarks } from "../context/BookmarkContext";
import { useAuth } from "../context/AuthContext";
import { useRamadanTheme } from "../context/RamadanThemeContext";
import { useTheme } from "../context/ThemeContext";
import { getDashboardTheme } from "../components/home/dashboardTheme";
import BookmarkModal from "../components/BookmarkModal";
import RamadanCountdown from "../components/ramadan/RamadanCountdown";
import RamadanFloatingElements from "../components/ramadan/RamadanFloatingElements";
import SEO from "../components/SEO";
import { Link } from "react-router-dom";
import FullPageLoadingScreen from "../components/FullPageLoadingScreen";

const DailyHadith = () => {
  const [dailyHadith, setDailyHadith] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const { addBookmark, removeBookmark, bookmarks } = useBookmarks();
  const { user } = useAuth();
  const { isRamadanThemeActive } = useRamadanTheme();
  const { isNight } = useTheme();
  const t = isNight
    ? {
        page: "min-h-screen bg-[#1a1c22]",
        cardSolid:
          "rounded-[1.75rem] border border-white/10 bg-[#212328] p-4 shadow-[0_22px_60px_rgba(0,0,0,0.28)] sm:p-6 lg:p-8",
        cardInner:
          "rounded-[1.5rem] border border-white/10 bg-[#1a1c22]/75 p-4 shadow-inner sm:p-6 md:p-8",
        primaryBtn:
          "bg-[#9e98db] text-[#1a1c22] hover:bg-[#aaa4e4] shadow-[0_12px_30px_rgba(158,152,219,0.22)]",
        textHeading: "text-[#e0e0e0]",
        textBody: "text-[#e0e0e0]/80",
        textMuted: "text-[#e0e0e0]/55",
        textAccent: "text-[#9e98db]",
        divider: "border-white/10",
        modalOverlay:
          "fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm",
        modal:
          "rounded-2xl border border-white/10 bg-[#212328] p-6 text-[#e0e0e0] shadow-2xl",
      }
    : getDashboardTheme(false);

  // جلب حديث عشوائي
  const fetchRandomHadith = async () => {
    setLoading(true);
    try {
      // جلب قائمة IDs أولاً
      const idsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/hadith-ids`,
      );

      if (idsResponse.data.ids && idsResponse.data.ids.length > 0) {
        // اختيار ID عشوائي
        const randomIndex = Math.floor(
          Math.random() * idsResponse.data.ids.length,
        );
        const randomHadith = idsResponse.data.ids[randomIndex];

        // جلب تفاصيل الحديث
        const hadithResponse = await axios.get(
          `https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${randomHadith}`,
        );

        if (hadithResponse.data) {
          const hadithData = hadithResponse.data;
          setDailyHadith(hadithData);

          // تحقق من حالة الحفظ
          setIsBookmarked(bookmarks.some((b) => b.id === hadithData.id));

          // تحميل عدد الإعجابات من localStorage
          setLikesCount(0); // إعادة تعيين الإعجابات للحديث الجديد
          setIsLiked(false); // إعادة تعيين حالة الـ like للحديث الجديد

          // حفظ الحديث في localStorage مع التاريخ
          const today = new Date().toDateString();
          localStorage.setItem(
            "daily_hadith",
            JSON.stringify({
              hadith: hadithData,
              date: today,
              likes: 0, // إعادة تعيين الإعجابات
              isLiked: false, // إعادة تعيين حالة الـ like
            }),
          );
        }
      }
    } catch (error) {
      console.error("Error fetching hadith:", error);
      toast.error("حدث خطأ في جلب الحديث");
    } finally {
      setLoading(false);
    }
  };

  // تحميل الحديث المحفوظ أو جلب حديث جديد
  const loadDailyHadith = () => {
    const saved = localStorage.getItem("daily_hadith");
    const today = new Date().toDateString();

    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) {
        // نفس اليوم، استخدم الحديث المحفوظ
        setDailyHadith(parsed.hadith);
        setIsBookmarked(bookmarks.some((b) => b.id === parsed.hadith.id));
        setLikesCount(parsed.likes || 0);
        // تحميل حالة الـ like من localStorage
        setIsLiked(parsed.isLiked || false);
        setLoading(false);
        return true; // تم تحميل الحديث المحفوظ
      }
    }

    // يوم جديد أو أول مرة، جلب حديث جديد
    fetchRandomHadith();
    return false; // تم جلب حديث جديد
  };

  // تحليل الحديث
  const analyzeHadith = async () => {
    if (!dailyHadith) return;

    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً لاستخدام ميزة التحليل");
      return;
    }

    setAnalysisLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/ai/analyze-hadith`,
        {
          hadith: dailyHadith,
        },
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        },
      );

      if (response.data && response.data.analysis) {
        setAnalysis(response.data.analysis);
        setShowAnalysis(true);
        toast.success("تم تحليل الحديث بنجاح");
      } else {
        toast.error("لم يتم الحصول على تحليل للحديث");
      }
    } catch {
      console.error("Error analyzing hadith");
      toast.error("حدث خطأ في تحليل الحديث");
    } finally {
      setAnalysisLoading(false);
    }
  };

  // التعامل مع الحفظ
  const handleBookmarkToggle = () => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً لحفظ الحديث");
      return;
    }

    if (isBookmarked) {
      // إزالة من الحفظ
      removeBookmark(dailyHadith.id);
      setIsBookmarked(false);
    } else {
      // فتح مودال الحفظ
      setShowBookmarkModal(true);
    }
  };

  // معالجة إضافة الحفظ
  const handleBookmarkSubmit = async (collectionName) => {
    await addBookmark(dailyHadith.id, collectionName);
    setIsBookmarked(true);
    setShowBookmarkModal(false);
  };

  // الإعجاب بالحديث
  const toggleLike = () => {
    const newLikes = isLiked ? likesCount - 1 : likesCount + 1;
    const newIsLiked = !isLiked;

    setLikesCount(newLikes);
    setIsLiked(newIsLiked);

    // تحديث الـ likes وحالة الـ like في object الحديث المحفوظ
    const saved = localStorage.getItem("daily_hadith");
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.likes = newLikes;
      parsed.isLiked = newIsLiked;
      localStorage.setItem("daily_hadith", JSON.stringify(parsed));
    }
  };

  // نسخ الحديث
  const copyHadith = async () => {
    if (!dailyHadith) return;

    try {
      await navigator.clipboard.writeText(dailyHadith.hadeeth);
      setIsCopied(true);
      toast.success("تم نسخ الحديث");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("فشل في نسخ الحديث");
    }
  };

  // مشاركة الحديث
  const shareHadith = () => {
    if (!dailyHadith) return;

    // فتح مودال المشاركة مباشرة
    setShowShareModal(true);
  };

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
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(
          `حديث اليوم من مشكاة:\n\n${dailyHadith.hadeeth}`,
        )}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "qabilah":
        shareUrl = `https://qabilah.com/sharer?text=${encodeURIComponent(
          text,
        )}&url=${encodeURIComponent(
          "https://qabilah.com/profile/qabilah/posts",
        )}`;
        break;
      case "copy":
        navigator.clipboard.writeText(
          `https://hadith-shareef.com/hadiths/hadith/${dailyHadith.id}`,
        );
        toast.success("تم نسخ الحديث للمشاركة");
        setShowShareModal(false);
        return;
      default:
        return;
    }

    window.open(shareUrl, "_blank");
    setShowShareModal(false);
  };

  // جلب حديث جديد (حذف القديم)
  const fetchNewHadith = () => {
    // حذف الحديث القديم من localStorage
    localStorage.removeItem("daily_hadith");

    // إعادة تعيين الحالة
    setAnalysis(null);
    setShowAnalysis(false);
    setIsLiked(false);
    setLikesCount(0);

    // جلب حديث جديد
    fetchRandomHadith();

    toast.success("تم جلب حديث جديد");
  };

  useEffect(() => {
    loadDailyHadith();
  }, []);

  // تحديث حالة الحفظ عند تغيير bookmarks
  useEffect(() => {
    if (dailyHadith && bookmarks) {
      setIsBookmarked(bookmarks.some((b) => b.id === dailyHadith.id));
    }
  }, [dailyHadith, bookmarks]);

  return (
    <div
      className={`daily-hadith-page min-h-screen overflow-hidden ${
        isRamadanThemeActive
          ? "ramadan-bg-gradient ramadan-pattern-overlay"
          : t.page
      }`}
    >
      {/* Add padding when countdown is fixed */}
      <div>
        <SEO
          title="حديث اليوم - مشكاة الأحاديث"
          description="حديث اليوم من الأحاديث النبوية الشريفة مع التحليل والشرح"
          canonicalUrl={`${window.location.origin}/daily-hadith`}
        />

        <div className="max-w-7xl mx-auto relative px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="relative mb-4 sm:mb-6 lg:mb-8">
            <div className="text-center px-2 relative">
              <h2
                className={`mb-3 text-2xl font-bold leading-tight sm:mb-4 sm:text-3xl md:text-4xl lg:mb-6 lg:text-5xl ${t.textHeading}`}
              >
                حديث اليوم
              </h2>
              <p
                className={`mx-auto max-w-3xl text-sm leading-relaxed sm:text-base lg:text-xl ${t.textBody}`}
              >
                حديث نبوي مختار يومياً مع تحليل سريع وفوائد عملية
              </p>
            </div>
          </div>

          {loading ? (
            <FullPageLoadingScreen message="جاري تحميل حديث اليوم..." />
          ) : dailyHadith ? (
            <div className="relative z-10 max-w-5xl mx-auto">
              <div className="space-y-4 sm:space-y-6">
                {/* Main Hadith Card */}
                <div className={t.cardSolid}>
                  {/* Hadith Text Section */}
                  <div className={`mb-4 w-full sm:mb-6 ${t.cardInner}`}>
                    <div className="relative">
                      <p
                        className={`prose amiri-regular relative z-10 max-w-none text-right text-lg leading-loose sm:text-xl md:text-2xl ${isNight ? "text-[#e0e0e0]" : "text-gray-800"}`}
                        style={{ lineHeight: "2.5" }}
                      >
                        {dailyHadith.hadeeth}
                      </p>

                      {dailyHadith.attribution && (
                        <p
                          className={`mt-4 flex items-center justify-end gap-1.5 text-right font-sans text-xs sm:mt-6 sm:gap-2 sm:text-sm ${t.textMuted}`}
                        >
                          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                          المحدث - {dailyHadith.attribution}
                        </p>
                      )}

                      {dailyHadith.grade && (
                        <div className="text-right mt-4 sm:mt-6">
                          <span
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl sm:rounded-2xl font-semibold shadow-sm ${
                              isNight
                                ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                                : "border border-green-200 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800"
                            }`}
                          >
                            <Shield className="w-3 h-3 sm:w-4 sm:h-4 inline ml-1.5 sm:ml-2" />
                            حكم الحديث : {dailyHadith.grade}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* رابط الحديث الكامل */}
                  {dailyHadith.id && (
                    <div className="mb-4 sm:mb-6 text-center">
                      <Link
                        to={`/hadiths/hadith/${dailyHadith.id}`}
                        className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 hover:shadow-lg sm:gap-3 sm:rounded-2xl sm:px-6 sm:py-3 sm:text-base ${t.primaryBtn}`}
                      >
                        <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
                        <span>عرض الحديث الكامل</span>
                      </Link>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div
                    className={`flex flex-wrap items-center justify-center gap-2 border-t pt-4 sm:gap-3 ${t.divider}`}
                  >
                    <button
                      onClick={toggleLike}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm ${
                        isLiked
                          ? "bg-red-500 text-white"
                          : isNight
                            ? "border border-white/10 bg-[#1a1c22]/80 text-[#e0e0e0]/80 hover:border-[#9e98db]/30 hover:bg-[#1a1c22]"
                            : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          isLiked ? "fill-current" : ""
                        }`}
                      />
                      <span>{likesCount}</span>
                    </button>

                    <button
                      onClick={copyHadith}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:shadow-lg sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm ${t.primaryBtn}`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="hidden sm:inline">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="hidden sm:inline">نسخ</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={shareHadith}
                      className={`rounded-lg p-2 shadow-lg transition-all duration-300 sm:rounded-xl sm:p-3 ${isNight ? "border border-white/10 bg-[#1a1c22]/80 hover:border-[#9e98db]/30 hover:bg-[#1a1c22]" : "bg-white/90 hover:bg-white"}`}
                      title="مشاركة"
                    >
                      <Share2
                        className={`h-4 w-4 sm:h-5 sm:w-5 ${t.textAccent}`}
                      />
                    </button>

                    <button
                      onClick={handleBookmarkToggle}
                      className={`rounded-lg p-2 shadow-lg transition-all duration-300 sm:rounded-xl sm:p-3 ${isNight ? "border border-white/10 bg-[#1a1c22]/80 hover:border-[#9e98db]/30 hover:bg-[#1a1c22]" : "bg-white/90 hover:bg-white"}`}
                      title="حفظ"
                    >
                      <Bookmark
                        className={`h-4 w-4 sm:h-5 sm:w-5 ${t.textAccent} ${
                          isBookmarked ? "fill-current" : ""
                        }`}
                      />
                    </button>

                    <button
                      onClick={fetchNewHadith}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:shadow-lg sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm ${t.primaryBtn}`}
                    >
                      <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">حديث آخر</span>
                    </button>
                  </div>
                </div>

                {/* AI Analysis Section */}
                <div className={t.cardSolid}>
                  <div className="mb-4 text-center sm:mb-6">
                    <div className="mb-3 flex items-center justify-center gap-2 sm:mb-4 sm:gap-3">
                      <Sparkles
                        className={`h-6 w-6 sm:h-8 sm:w-8 ${t.textAccent}`}
                      />
                      <h2
                        className={`text-xl font-bold sm:text-2xl lg:text-3xl ${t.textHeading}`}
                      >
                        تحليل سريع
                      </h2>
                    </div>
                    <p className={`text-sm sm:text-base ${t.textBody}`}>
                      فهم أعمق للحديث مع فوائد عملية
                    </p>
                  </div>

                  {!showAnalysis ? (
                    <div className="text-center">
                      <button
                        onClick={analyzeHadith}
                        disabled={analysisLoading}
                        className={`group mx-auto flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all duration-300 hover:shadow-lg sm:gap-3 sm:rounded-2xl sm:px-8 sm:py-4 sm:text-base lg:text-lg ${t.primaryBtn}`}
                      >
                        {analysisLoading ? (
                          <>
                            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-t-2 border-t-white border-transparent rounded-full animate-spin" />
                            جاري التحليل...
                          </>
                        ) : (
                          <>
                            <Brain className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-pulse" />
                            <span>تحليل سريع</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className={t.cardInner}>
                      <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
                        <Sparkles
                          className={`h-5 w-5 sm:h-6 sm:w-6 ${t.textAccent}`}
                        />
                        <h3
                          className={`text-lg font-bold sm:text-xl lg:text-2xl ${t.textHeading}`}
                        >
                          التحليل
                        </h3>
                      </div>
                      <p
                        className={`amiri-regular text-sm leading-relaxed sm:text-base lg:text-lg ${isNight ? "text-[#e0e0e0]/90" : "text-gray-800"}`}
                      >
                        {analysis}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className={`text-lg ${t.textBody}`}>لم يتم العثور على حديث</p>
            </div>
          )}
        </div>

        {/* Bookmark Modal */}
        {showBookmarkModal && (
          <BookmarkModal
            isOpen={showBookmarkModal}
            onClose={() => setShowBookmarkModal(false)}
            onSubmit={handleBookmarkSubmit}
            hadith={dailyHadith}
            existingCollections={[
              ...new Set(bookmarks.map((b) => b.collection)),
            ]}
          />
        )}

        {/* Simple Share Modal */}
        <AnimatePresence>
          {showShareModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={t.modalOverlay}
              onClick={() => setShowShareModal(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`${t.modal} max-w-sm w-full`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <h3 className={`text-xl font-bold mb-2 ${t.textHeading}`}>
                    مشاركة الحديث
                  </h3>
                  <p className={`text-sm ${t.textBody}`}>اختر منصة المشاركة</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => shareToSocialMedia("whatsapp")}
                    className={`inline-flex h-[2.5rem] items-center gap-3 rounded-lg border px-4 text-[18px] font-medium transition-colors ${
                      isNight
                        ? "border-[#9e98db]/30 bg-[#1a1c22]/55 text-[#e0e0e0] hover:bg-[#1a1c22]"
                        : "border-primary bg-transparent text-primary hover:bg-primary/10"
                    }`}
                  >
                    <svg
                      className="w-5 h-5 text-green-800"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                    الواتس
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => shareToSocialMedia("telegram")}
                    className={`inline-flex h-[2.5rem] items-center gap-3 rounded-lg border px-4 text-[18px] font-medium transition-colors ${
                      isNight
                        ? "border-[#9e98db]/30 bg-[#1a1c22]/55 text-[#e0e0e0] hover:bg-[#1a1c22]"
                        : "border-primary bg-transparent text-primary hover:bg-primary/10"
                    }`}
                  >
                    <svg
                      className="w-7 h-7 text-blue-800"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 640"
                    >
                      <path d="M320 72C183 72 72 183 72 320C72 457 183 568 320 568C457 568 568 457 568 320C568 183 457 72 320 72zM435 240.7C431.3 279.9 415.1 375.1 406.9 419C403.4 437.6 396.6 443.8 390 444.4C375.6 445.7 364.7 434.9 350.7 425.7C328.9 411.4 316.5 402.5 295.4 388.5C270.9 372.4 286.8 363.5 300.7 349C304.4 345.2 367.8 287.5 369 282.3C369.2 281.6 369.3 279.2 367.8 277.9C366.3 276.6 364.2 277.1 362.7 277.4C360.5 277.9 325.6 300.9 258.1 346.5C248.2 353.3 239.2 356.6 231.2 356.4C222.3 356.2 205.3 351.4 192.6 347.3C177.1 342.3 164.7 339.6 165.8 331C166.4 326.5 172.5 322 184.2 317.3C256.5 285.8 304.7 265 328.8 255C397.7 226.4 412 221.4 421.3 221.2C423.4 221.2 427.9 221.7 430.9 224.1C432.9 225.8 434.1 228.2 434.4 230.8C434.9 234 435 237.3 434.8 240.6z" />
                    </svg>
                    تليجيرام
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => shareToSocialMedia("twitter")}
                    className={`inline-flex h-[2.5rem] items-center gap-3 rounded-lg border px-4 text-[18px] font-medium transition-colors ${
                      isNight
                        ? "border-[#9e98db]/30 bg-[#1a1c22]/55 text-[#e0e0e0] hover:bg-[#1a1c22]"
                        : "border-primary bg-transparent text-primary hover:bg-primary/10"
                    }`}
                  >
                    <Twitter className="w-7 text-blue-800 h-7" />
                    تويتر
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => shareToSocialMedia("qabilah")}
                    className={`inline-flex items-center gap-3 rounded-lg border px-4 text-[18px] font-medium transition-colors ${
                      isNight
                        ? "border-[#9e98db]/30 bg-[#1a1c22]/55 text-[#e0e0e0] hover:bg-[#1a1c22]"
                        : "border-[#F3E2DE] hover:bg-[#F3E2DE]"
                    }`}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 1080 1080"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M872.55 1080H207.44C92.87 1080 -0.0100098 987.12 -0.0100098 872.55V207.45C-0.0100098 92.88 92.87 0 207.44 0H872.55C987.12 0 1080 92.88 1080 207.45V872.56C1079.99 987.12 987.12 1080 872.55 1080Z"
                        fill="url(#paint0_linear_212_3)"
                      ></path>
                      <path
                        d="M554.67 965.75C511.13 970.65 477.08 956.76 453.34 938.82C429.61 920.86 417.74 895.76 417.74 863.51C417.74 847.08 420.16 831.25 425.04 816.04L488.16 575.43C450.42 615 405.69 634.77 353.97 634.77C326.58 634.77 301.48 628.24 278.66 615.14C255.84 602.06 237.88 582.59 224.8 556.72C211.71 530.86 205.17 499.98 205.17 464.06C205.17 434.25 208.82 405.64 216.12 378.25C228.9 327.74 248.83 285.29 275.91 250.9C302.98 216.52 334.33 190.96 369.94 174.22C405.54 157.49 442.51 149.12 480.85 149.12C516.75 149.12 547.03 154.3 571.68 164.64C596.33 175 618.38 190.81 637.86 212.11L683.84 174.18C696.32 163.89 711.99 158.25 728.17 158.25H823.65C833.82 158.25 841.17 167.99 838.37 177.77L662.38 792.31C657.5 809.95 655.08 822.12 655.08 828.82C655.08 836.72 657.05 842.2 661.01 845.25C664.96 848.29 671.51 849.81 680.64 849.81C684.59 849.81 688.96 849.54 693.75 849.01C701.55 848.14 709.26 846.65 716.88 844.74L749.5 836.72C756.58 834.98 762.22 842.67 758.44 848.9C758.44 848.9 676.85 952.01 554.67 965.75Z"
                        fill="white"
                      ></path>
                      <defs>
                        <linearGradient
                          id="paint0_linear_212_3"
                          x1="129.461"
                          y1="922.231"
                          x2="958.044"
                          y2="150.773"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stop-color="#FF544F"></stop>
                          <stop offset="0.5532" stop-color="#FF923F"></stop>
                          <stop offset="1" stop-color="#FFBF33"></stop>
                        </linearGradient>
                      </defs>
                    </svg>
                    قبيلة
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => shareToSocialMedia("copy")}
                    className="flex items-center gap-2 p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors col-span-2"
                  >
                    <Copy className="w-5 h-5" />
                    نسخ الرابط
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DailyHadith;
