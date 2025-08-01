import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  SparklesIcon,
  Share2,
  Heart,
  ExternalLink,
  Copy,
  Bookmark,
} from "lucide-react";
import axios from "axios";
import { useBookmarks } from "../context/BookmarkContext";
import { useAuth } from "../context/AuthContext";
import BookmarkModal from "./BookmarkModal";
import { toast } from "react-hot-toast";

const DailyHadithWidget = () => {
  const [dailyHadith, setDailyHadith] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { addBookmark, removeBookmark, bookmarks } = useBookmarks();
  const { user } = useAuth();

  // تحميل الحديث المحفوظ أو جلب حديث جديد
  const loadDailyHadith = () => {
    const saved = localStorage.getItem("daily_hadith");
    const today = new Date().toDateString();

    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) {
        // نفس اليوم، استخدم الحديث المحفوظ من الصفحة الكاملة
        setDailyHadith(parsed.hadith);
        setLikesCount(parsed.likes || 0);
        // تحميل حالة الـ like من localStorage
        setIsLiked(parsed.isLiked || false);
        // تحقق من حالة الحفظ
        setIsBookmarked(bookmarks.some((b) => b.id === parsed.hadith.id));
        setLoading(false);
        return true; // تم تحميل الحديث المحفوظ
      }
    }

    // يوم جديد أو أول مرة، جلب حديث جديد
    fetchRandomHadith();
    return false; // تم جلب حديث جديد
  };

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

          // إعادة تعيين الإعجابات للحديث الجديد
          setLikesCount(0);
          setIsLiked(false);
          setIsBookmarked(false);

          // حفظ الحديث في localStorage مع التاريخ (نفس key كالصفحة الكاملة)
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
    } finally {
      setLoading(false);
    }
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
        navigator.clipboard.writeText("/hadiths/hadith/" + dailyHadith.id);
        setShowShareModal(false);
        return;
      default:
        return;
    }

    window.open(shareUrl, "_blank");
    setShowShareModal(false);
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
    } catch (error) {
      console.error("Error saving hadith:", error);
      toast.error("حدث خطأ في حفظ الحديث");
    }
  };

  // تحديث حالة الحفظ عند تغيير bookmarks
  useEffect(() => {
    if (dailyHadith && bookmarks) {
      setIsBookmarked(bookmarks.some((b) => b.id === dailyHadith.id));
    }
  }, [dailyHadith, bookmarks]);

  useEffect(() => {
    loadDailyHadith();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-purple-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-4 border-t-purple-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-600 font-semibold">
            جاري تحميل حديث اليوم...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            <div>
              <h3 className="text-lg sm:text-xl font-bold">حديث اليوم</h3>
              <p className="text-xs sm:text-sm opacity-90">
                حديث نبوي مختار يومياً
              </p>
            </div>
          </div>
          <Link
            to="/daily-hadith"
            className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-200 text-center"
          >
            عرض كامل
          </Link>
        </div>
      </div>

      {/* Hadith Content */}
      <div className="p-4 sm:p-6">
        <div className="text-center mb-4 sm:mb-6">
          <p className="text-lg sm:text-xl lg:text-2xl leading-relaxed text-gray-800 amiri-regular mb-3 sm:mb-4">
            {dailyHadith?.hadeeth}
          </p>

          {dailyHadith?.attribution && (
            <p className="text-gray-600 text-xs sm:text-sm mb-2">
              المحدث: {dailyHadith.attribution}
            </p>
          )}

          {dailyHadith?.grade && (
            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
              {dailyHadith.grade}
            </span>
          )}

          {/* رابط الحديث الكامل */}
          {dailyHadith?.id && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-4"
            >
              <Link
                to={`/hadiths/hadith/${dailyHadith.id}`}
                className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-xs sm:text-sm font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 hover:scale-105"
              >
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform duration-300" />
                <span>عرض الحديث الكامل</span>
                <motion.div
                  className="w-1.5 h-1.5 bg-white rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </Link>
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleLike}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                isLiked
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              <Heart
                className={`w-3 h-3 sm:w-4 sm:h-4 ${
                  isLiked ? "fill-current" : ""
                }`}
              />
              <span>{likesCount}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={shareHadith}
              className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-xs sm:text-sm font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
            >
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
              مشاركة
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBookmarkToggle}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                isBookmarked
                  ? "bg-yellow-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              <Bookmark
                className={`w-3 h-3 sm:w-4 sm:h-4 ${
                  isBookmarked ? "fill-current" : ""
                }`}
              />
              {isBookmarked ? "محفوظ" : "حفظ"}
            </motion.button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/daily-hadith"
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors duration-200 text-xs sm:text-sm"
              >
                <span className="font-medium">تحليل سريع</span>
                <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/daily-hadith"
                className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-xs sm:text-sm font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
              >
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>عرض كامل</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

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
    </motion.div>
  );
};

export default DailyHadithWidget;
