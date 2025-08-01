import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Share2,
  Bookmark,
  SparklesIcon,
  Copy,
  RefreshCw,
  Heart,
  Check,
  ExternalLink,
} from "lucide-react";
import { useBookmarks } from "../context/BookmarkContext";
import { useAuth } from "../context/AuthContext";
import BookmarkModal from "../components/BookmarkModal";
import SEO from "../components/SEO";
import { Link } from "react-router-dom";

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

  // جلب حديث عشوائي
  const fetchRandomHadith = async () => {
    setLoading(true);
    try {
      // جلب قائمة IDs أولاً
      const idsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/hadith-ids`
      );

      if (idsResponse.data.ids && idsResponse.data.ids.length > 0) {
        // اختيار ID عشوائي
        const randomIndex = Math.floor(
          Math.random() * idsResponse.data.ids.length
        );
        const randomHadith = idsResponse.data.ids[randomIndex];

        // جلب تفاصيل الحديث
        const hadithResponse = await axios.get(
          `https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${randomHadith}`
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
            })
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
        }
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
      `${window.location.origin}/daily-hadith`
    );

    let shareUrl = "";

    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodedText}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(
          `حديث اليوم من مشكاة:\n\n${dailyHadith.hadeeth}`
        )}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "copy":
        navigator.clipboard.writeText(
          `https://hadith-shareef.com/hadiths/hadith/${dailyHadith.id}`
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
    <div className="min-h-screen bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] py-8 px-4 sm:px-6 lg:px-8">
      <SEO
        title="حديث اليوم - مشكاة"
        description="حديث اليوم من الأحاديث النبوية الشريفة مع التحليل والشرح"
      />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#7440E9] mb-4"
          >
            حديث اليوم
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-gray-600 text-base sm:text-lg"
          >
            حديث نبوي مختار يومياً مع تحليل سريع وفوائد عملية
          </motion.p>
        </motion.div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center py-20"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-t-4 border-t-purple-500 border-gray-200 rounded-full mx-auto mb-4"
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-purple-600 font-semibold text-lg"
              >
                جاري تحميل حديث اليوم...
              </motion.p>
            </div>
          </motion.div>
        ) : dailyHadith ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {/* Main Hadith Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100 p-6 sm:p-8"
            >
              <div className="text-center mb-6">
                <p className="text-xl sm:text-xl lg:text-2xl leading-relaxed text-gray-800 amiri-regular mb-6">
                  {dailyHadith.hadeeth}
                </p>

                {dailyHadith.attribution && (
                  <p className="text-gray-600 text-sm sm:text-base mb-3">
                    المحدث: {dailyHadith.attribution}
                  </p>
                )}

                {dailyHadith.grade && (
                  <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    {dailyHadith.grade}
                  </span>
                )}

                {/* رابط الحديث الكامل */}
                {dailyHadith.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="mt-6"
                  >
                    <Link
                      to={`/hadiths/hadith/${dailyHadith.id}`}
                      className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-sm sm:text-base font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
                    >
                      <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                      <span>عرض الحديث الكامل</span>
                      <motion.div
                        className="w-2 h-2 bg-white rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </Link>
                  </motion.div>
                )}
              </div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleLike}
                  className={`flex items-center gap-2 px-4 py-3 rounded-full text-sm sm:text-base font-medium transition-all duration-200 ${
                    isLiked
                      ? "bg-red-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
                  />
                  <span>{likesCount}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyHadith}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-sm sm:text-base font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-5 h-5" />
                      تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      نسخ
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={shareHadith}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-sm sm:text-base font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
                >
                  <Share2 className="w-5 h-5" />
                  مشاركة
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBookmarkToggle}
                  className={`flex items-center gap-2 px-4 py-3 rounded-full text-sm sm:text-base font-medium transition-all duration-200 ${
                    isBookmarked
                      ? "bg-yellow-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  {isBookmarked ? (
                    <>
                      <Bookmark className="w-5 h-5 fill-current" />
                      محفوظ
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-5 h-5" />
                      حفظ
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchNewHadith}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-sm sm:text-base font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
                >
                  <RefreshCw className="w-5 h-5" />
                  حديث آخر
                </motion.button>
              </motion.div>
            </motion.div>

            {/* AI Analysis Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100 p-6 sm:p-8"
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="flex items-center justify-center gap-3 mb-4"
                >
                  <SparklesIcon className="w-8 h-8 text-purple-600" />
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#7440E9]">
                    تحليل سريع
                  </h2>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="text-gray-600 text-sm sm:text-base"
                >
                  فهم أعمق للحديث مع فوائد عملية
                </motion.p>
              </div>

              {!showAnalysis ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="text-center"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={analyzeHadith}
                    disabled={analysisLoading}
                    className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-base sm:text-lg font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    {analysisLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-6 h-6 border-2 border-t-2 border-t-white border-transparent rounded-full"
                        />
                        جاري التحليل...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-6 h-6 group-hover:animate-pulse" />
                        تحليل سريع
                      </>
                    )}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 sm:p-8"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="flex items-center gap-3 mb-4"
                  >
                    <SparklesIcon className="w-6 h-6 text-purple-600" />
                    <h3 className="text-xl sm:text-2xl font-bold text-purple-800">
                      التحليل
                    </h3>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="text-gray-800 text-base sm:text-lg leading-relaxed font-amiri"
                  >
                    {analysis}
                  </motion.p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">لم يتم العثور على حديث</p>
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
          existingCollections={[...new Set(bookmarks.map((b) => b.collection))]}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowShareModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                مشاركة الحديث
              </h3>
              <p className="text-gray-600 text-sm">اختر منصة المشاركة</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => shareToSocialMedia("whatsapp")}
                className="flex items-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                </svg>
                WhatsApp
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => shareToSocialMedia("telegram")}
                className="flex items-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                Telegram
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => shareToSocialMedia("twitter")}
                className="flex items-center gap-2 p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                Twitter
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => shareToSocialMedia("facebook")}
                className="flex items-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
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
    </div>
  );
};

export default DailyHadith;
