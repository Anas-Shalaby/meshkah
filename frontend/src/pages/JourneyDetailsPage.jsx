import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Flame,
  Target,
  Share2,
  Users,
  Pause,
  Play,
  Copy,
  CheckCircle,
  Award,
  TrendingUp,
  BarChart3,
  X,
  Book,
  Sparkles,
  Moon,
  Star,
  Twitter,
  Facebook,
  MessageCircle,
  Lightbulb,
  Heart,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useRamadanTheme } from "../context/RamadanThemeContext";
import {
  getJourneyDetails,
  getTodayHadiths,
  markHadithAsRead,
  getJourneyProgress,
  pauseJourney,
  resumeJourney,
  getShareLink,
  getJourneyFriends,
  getBuddyInfo,
  requestBuddy,
} from "../services/bookJourneysService";
import SEO from "../components/SEO";
import JourneyCertificate from "../components/book-journeys/JourneyCertificate";
import PledgeCard from "../components/book-journeys/PledgeCard";
import BuddyCard from "../components/book-journeys/BuddyCard";
import ProgressCalendar from "../components/book-journeys/ProgressCalendar";
import RamadanCountdown from "../components/ramadan/RamadanCountdown";
import RamadanFloatingElements from "../components/ramadan/RamadanFloatingElements";
import "../styles/book-journeys.css";
import FullPageLoadingScreen from "../components/FullPageLoadingScreen";
import JourneySettingsModal from "../components/book-journeys/JourneySettingsModal";

// مكون عرض حديث واحد في المنتصف
const FocusedHadithCard = ({
  hadith,
  position,
  total,
  onMarkRead,
  isReading,
  isMarkingRead,
  onNext,
  onPrev,
  hasPrev,
  hasNext,
  onOpenSaraj,
}) => {
  return (
    <motion.div
      key={hadith?.id}
      initial={{ opacity: 0.8, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0.8, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="journey-hadith-card"
    >
      {/* رأس البطاقة */}
      <div className="journey-hadith-card-header py-5 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-white/20 px-4 py-1.5 rounded-full text-lg font-bold">
              {hadith?.id_in_book}
            </span>
            <span className="text-purple-100">الحديث رقم</span>
          </div>
          <div className="text-left">
            <span className="text-purple-100 text-sm">التقدم</span>
            <p className="text-xl font-bold">
              {position} / {total}
            </p>
          </div>
        </div>

        {/* شريط تقدم */}
        <div className="mt-4 journey-progress-bar h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(position / total) * 100}%` }}
            className="journey-progress-bar-fill h-full"
          />
        </div>
      </div>

      {/* نص الحديث */}
      <div className="p-6 relative">
        <p className="journey-hadith-text text-center text-xl leading-loose">
          {hadith?.arabic}
        </p>
      </div>

      {/* أزرار التحكم */}
      <div className="px-6 pb-6">
        {/* زر القراءة */}
        {!hadith?.is_read && (
          <button
            onClick={() => onMarkRead(hadith.id)}
            disabled={isReading || isMarkingRead}
            className="w-full journey-btn-primary py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isReading || isMarkingRead ? (
              <div className="journey-spinner w-6 h-6" />
            ) : (
              <>
                قرأت هذا الحديث
                <Check className="w-6 h-6" />
              </>
            )}
          </button>
        )}

        {hadith?.is_read && (
          <div className="text-center py-4 bg-green-50 rounded-xl">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-green-600 font-medium arabic-text">
              تمت القراءة 
            </p>
          </div>
        )}

        {/* أزرار التنقل */}
        <div className="flex items-center justify-between mt-4 gap-4">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
              hasPrev
                ? "journey-btn-secondary"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
            السابق
          </button>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
              hasNext
                ? "journey-btn-secondary"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            }`}
          >
            التالي
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// مكون مشاركة التقدم على السوشيال ميديا
const ShareProgressModal = ({ isOpen, onClose, journey, progress }) => {
  const shareMessage = `📖 أقرأ ${journey?.book_name}

🎯 تقدمي: ${progress?.percent || 0}%
📚 قرأت ${progress?.read_count || 0} من ${progress?.total || 0} حديث
🔥 ${journey?.streak_count || 0} حديث متتالي

انضم لي في ختمة الكتاب عبر #مشكاة`;

  const shareUrl = window.location.origin + "/book-journeys";

  const handleShare = async (platform) => {
    let url = "";

    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareMessage
        )}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}&quote=${encodeURIComponent(shareMessage)}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(
          shareMessage + "\n\n" + shareUrl
        )}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(
          shareUrl
        )}&text=${encodeURIComponent(shareMessage)}`;
        break;
      case "copy":
        try {
          await navigator.clipboard.writeText(shareMessage + "\n\n" + shareUrl);
          toast.success("تم نسخ التقدم!");
        } catch (err) {
          toast.error("فشل النسخ");
        }
        return;
    }

    if (url) window.open(url, "_blank");
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 journey-modal-overlay z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="journey-modal-content p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 arabic-text">
            شارك تقدمك 🎉
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* معاينة المحتوى */}
        <div className="journey-certificate-preview p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Book className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800 arabic-text">
                {journey?.book_name}
              </p>
              <p className="text-sm text-gray-500">
                {progress?.percent || 0}% مكتمل
              </p>
            </div>
          </div>
          <div className="journey-progress-bar h-2">
            <div
              className="journey-progress-bar-fill h-full"
              style={{ width: `${progress?.percent || 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{progress?.read_count || 0} حديث</span>
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-500" />
              {journey?.streak_count || 0} يوم
            </span>
          </div>
        </div>

        {/* أزرار المشاركة */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleShare("whatsapp")}
            className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
          >
            واتساب
          </button>
          <button
            onClick={() => handleShare("twitter")}
            className="flex items-center justify-center gap-2 py-3 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors"
          >
            <Twitter className="w-5 h-5" />
            تويتر
          </button>
          <button
            onClick={() => handleShare("facebook")}
            className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <Facebook className="w-5 h-5" />
            فيسبوك
          </button>
          <button
            onClick={() => handleShare("telegram")}
            className="flex items-center justify-center gap-2 py-3 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700 transition-colors"
          >
            تيليجرام
          </button>
        </div>

        <button
          onClick={() => handleShare("copy")}
          className="w-full mt-3 py-3 journey-btn-secondary flex items-center justify-center gap-2"
        >
          <Copy className="w-5 h-5" />
          نسخ النص
        </button>
      </motion.div>
    </motion.div>
  );
};

// مكون تقدم الأصدقاء
const FriendsProgress = ({ friends, hasBuddy, onRequestBuddy, requesting }) => {
  if (!friends || friends.length === 0) {
    return (
      <div className="journey-empty-state">
        <Users className="journey-empty-icon" />
        <p className="text-gray-600 arabic-text">
          لا يوجد أصدقاء في هذه الختمة
        </p>
        <p className="text-sm text-gray-500 arabic-text">
          شارك رابط الختمة لدعوة أصدقائك!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {friends.map((friend) => (
        <motion.div
          key={friend.journey_id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="journey-friend-item"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
              {friend.username?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800 arabic-text">
                {friend.username}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex-1 journey-progress-bar h-1.5">
                  <div
                    className="journey-progress-bar-fill h-full"
                    style={{ width: `${friend.progress_percent}%` }}
                  />
                </div>
                <span>{friend.progress_percent}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {friend.completed_today ? (
                <span className="journey-status-completed text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  أكمل
                </span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                  لم يكمل
                </span>
              )}
              {/* زر طلب الرفقة */}
              {!hasBuddy && onRequestBuddy && (
                <button
                  onClick={() => onRequestBuddy(friend.user_id)}
                  disabled={requesting === friend.user_id}
                  className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-1"
                  title="اطلب أن يكون رفيقك في هذه الختمة"
                >
                  {requesting === friend.user_id ? (
                    <span>جاري...</span>
                  ) : (
                    <>
                      <Heart className="w-3 h-3" />
                      <span className="hidden sm:inline">رفقة</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// مكون المشاركة مع الأصدقاء
const ShareModal = ({ isOpen, onClose, shareData }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareData.share_url);
      setCopied(true);
      toast.success("تم نسخ الرابط!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("فشل نسخ الرابط");
    }
  };

  const shareText = `أقرأ ${shareData.book_name} معي! انضم لختمة الكتاب عبر الرابط:`;

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        shareText + "\n" + shareData.share_url
      )}`,
      "_blank"
    );
  };

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(shareData.share_url)}`,
      "_blank"
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 journey-modal-overlay z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="journey-modal-content p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 arabic-text">
            دعوة أصدقاء
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-gray-600 mb-4 arabic-text">
          شارك هذا الرابط مع أصدقائك لينضموا إلى قراءة{" "}
          <span className="font-bold text-purple-600">
            {shareData.book_name}
          </span>{" "}
          معك!
        </p>

        {/* رابط المشاركة */}
        <div className="flex items-center gap-2 p-3 journey-certificate-preview rounded-xl mb-4">
          <input
            type="text"
            value={shareData.share_url}
            readOnly
            className="flex-1 bg-transparent text-sm text-gray-600 outline-none"
          />
          <button
            onClick={handleCopy}
            className={`p-2 rounded-lg transition-colors ${
              copied ? "bg-green-100 text-green-600" : "journey-btn-primary"
            }`}
          >
            {copied ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* أزرار المشاركة */}
        <div className="flex gap-3">
          <button
            onClick={handleWhatsApp}
            className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
          >
            واتساب
          </button>
          <button
            onClick={handleTwitter}
            className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            تويتر
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// الصفحة الرئيسية
const JourneyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isRamadanThemeActive } = useRamadanTheme();

  const [journey, setJourney] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [friends, setFriends] = useState([]);
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readingHadith, setReadingHadith] = useState(null);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showProgressShareModal, setShowProgressShareModal] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // بيانات الرفيق
  const [buddyData, setBuddyData] = useState({ has_buddy: false, buddy: null, pending_requests: [] });
  const [requestingBuddy, setRequestingBuddy] = useState(null);

  // الحديث الحالي المعروض
  const [currentHadithIndex, setCurrentHadithIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadJourneyData();
    }
  }, [id]);

  // Smooth scroll للمنتصف الحديث عند تغييره أو عند تحميل الصفحة
  useEffect(() => {
    // الانتظار قليلاً حتى يتم render الحديث
    const scrollTimer = setTimeout(
      () => {
        const hadithElement = document.querySelector(".journey-hadith-card");
        if (hadithElement) {
          hadithElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      },
      currentHadithIndex === 0 ? 300 : 100
    ); // تأخير أطول للتحميل الأولي

    return () => clearTimeout(scrollTimer);
  }, [currentHadithIndex, loading]);

  const loadJourneyData = async (resetHadithIndex = true) => {
    try {
      setLoading(true);
      const [journeyRes, todayRes, progressRes, friendsRes, buddyRes] = await Promise.all(
        [
          getJourneyDetails(id),
          getTodayHadiths(id).catch(() => null),
          getJourneyProgress(id),
          getJourneyFriends(id).catch(() => ({ friends: [] })),
          getBuddyInfo(id).catch(() => ({ has_buddy: false, buddy: null, pending_requests: [] })),
        ]
      );

      setJourney(journeyRes.journey);
      setTodayData(todayRes);
      setProgressData(progressRes);
      setFriends(friendsRes.friends || []);
      setBuddyData(buddyRes);

      // إعادة تعيين مؤشر الحديث فقط إذا كان مطلوباً
      if (resetHadithIndex) {
        setCurrentHadithIndex(0);
      }
    } catch (error) {
      console.error("Error loading journey:", error);
      toast.error("حدث خطأ في تحميل الختمة");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (hadithId) => {
    if (isMarkingRead) return; // منع النقرات المتعددة

    try {
      setIsMarkingRead(true);
      setReadingHadith(hadithId);

      const result = await markHadithAsRead(id, hadithId);

      if (result.success) {
        if (result.progress?.is_completed) {
          toast.success("🎉 مبارك! أكملت ختمة الكتاب", { duration: 5000 });
        } else if (result.progress?.daily_completed) {
          toast.success("🎉 أحسنت! أكملت ورد اليوم", { duration: 3000 });
        } else {
          toast.success(result.message);
        }

        // تحديث الحديث الحالي ليصبح مقروء محلياً
        setTodayData((prev) => {
          if (!prev?.today?.hadiths) return prev;
          const updatedHadiths = prev.today.hadiths.map((h) =>
            h.id === hadithId ? { ...h, is_read: true } : h
          );
          return {
            ...prev,
            today: {
              ...prev.today,
              hadiths: updatedHadiths,
              completed: (prev.today.completed || 0) + 1,
            },
          };
        });

        // تحديث البيانات محلياً بدلاً من إعادة التحميل الكامل
        if (result.progress) {
          setProgressData((prev) => ({
            ...prev,
            current_position: result.progress.current_position,
            streak: result.progress.streak,
            is_completed: result.progress.is_completed,
            daily_completed: result.progress.daily_completed,
          }));
        }

        // الانتقال للحديث التالي فوراً بدون تأخير
        const remainingHadiths =
          todayData?.today?.hadiths?.length - currentHadithIndex - 1;
        if (remainingHadiths > 0) {
          setCurrentHadithIndex((prev) => prev + 1);
        }

        // إعادة تحميل البيانات بعد إكمال الكتاب لتحديث الـ status
        if (result.progress?.is_completed) {
          setTimeout(() => {
            loadJourneyData(false); // عدم إعادة تعيين مؤشر الحديث
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error marking hadith:", error);
      toast.error(error.response?.data?.message || "حدث خطأ");
    } finally {
      setReadingHadith(null);
      // الاحتفاظ بالزر disabled لفترة قصيرة لمنع النقرات المتعددة
      setTimeout(() => {
        setIsMarkingRead(false);
      }, 300);
    }
  };

  const handlePauseResume = async () => {
    try {
      if (journey.status === "active") {
        await pauseJourney(id);
        toast.success("تم إيقاف الختمة مؤقتاً");
      } else {
        await resumeJourney(id);
        toast.success("تم استئناف الختمة");
      }
      await loadJourneyData();
    } catch (error) {
      toast.error("حدث خطأ");
    }
  };

  const handleShare = async () => {
    try {
      const result = await getShareLink(id);
      setShareData(result);
      setShowShareModal(true);
    } catch (error) {
      toast.error("حدث خطأ في جلب رابط المشاركة");
    }
  };

  // طلب رفيق
  const handleRequestBuddy = async (targetUserId) => {
    try {
      setRequestingBuddy(targetUserId);
      const result = await requestBuddy(id, targetUserId);
      toast.success(result.message || "تم إرسال طلب الرفقة! 🤝");
      loadJourneyData(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "حدث خطأ في إرسال الطلب");
    } finally {
      setRequestingBuddy(null);
    }
  };

  // التنقل بين الأحاديث
  const handleNextHadith = () => {
    if (
      todayData?.today?.hadiths &&
      currentHadithIndex < todayData.today.hadiths.length - 1
    ) {
      setCurrentHadithIndex((prev) => prev + 1);
    }
  };

  const handlePrevHadith = () => {
    if (currentHadithIndex > 0) {
      setCurrentHadithIndex((prev) => prev - 1);
    }
  };

  const currentHadith = todayData?.today?.hadiths?.[currentHadithIndex];

  if (loading) {
    return <FullPageLoadingScreen message="جاري تحميل الختمة..." />;
  }

  if (!journey) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isRamadanThemeActive
            ? "ramadan-bg-gradient"
            : "bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50"
        }`}
      >
        <div className="text-center">
          <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 arabic-text">الختمة غير موجودة</p>
          <button
            onClick={() => navigate("/book-journeys")}
            className="mt-4 journey-btn-primary"
          >
            العودة للختمات
          </button>
        </div>
      </div>
    );
  }
  console.log(journey)
  return (
    <div
      className={`min-h-screen pb-20 relative ${
        isRamadanThemeActive
          ? "ramadan-bg-gradient"
          : "bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50"
      }`}
    >
      {/* SEO */}
      <SEO
        title={`${journey.book_name} | ختمة الكتاب - مشكاة`}
        description={`اقرأ ${journey.book_name} بجدول منظم. التقدم: ${
          journey.progress_percent
        }% - ${progressData?.progress?.read_count || 0} من ${
          journey.total_hadiths
        } حديث`}
        keywords={`${journey.book_name}، ختمة، قراءة أحاديث، تتبع التقدم`}
        canonicalUrl={window.location.href}
      />

      {/* Floating Elements */}
      {isRamadanThemeActive && <RamadanFloatingElements />}

      {/* الهيدر */}
      <div
        className={`journey-header text-white py-6 px-4 relative z-10 `}
      >
        <div className="max-w-4xl mx-auto relative z-10">
          {/* زر الرجوع */}
          <button
            onClick={() => navigate("/book-journeys")}
            className="flex items-center gap-2 text-purple-200 mb-4 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
            العودة للختمات
          </button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-0">
            <div>
              <div className="flex items-center gap-3 mb-1">
                {isRamadanThemeActive ? (
                  <Moon className="w-6 h-6 text-yellow-300" />
                ) : (
                  <Sparkles className="w-6 h-6 text-purple-200" />
                )}
                <h1 className="text-xl md:text-2xl font-bold arabic-text leading-relaxed">
                  {journey.book_name}
                </h1>
                {isRamadanThemeActive && (
                  <Star className="w-5 h-5 text-yellow-300 animate-pulse" />
                )}
              </div>
              <div className="flex items-center gap-3 text-purple-200 text-sm flex-wrap">
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-lg">
                  <Target className="w-4 h-4" />
                  {journey.pace} حديث/يوم
                </span>
                {journey.streak_count > 0 && (
                  <span className="journey-streak-badge">
                    <Flame className="w-4 h-4" />
                    {progressData?.stats?.streak || journey.streak_count} يوم متتالي
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 self-end md:self-auto w-full md:w-auto justify-end">
              {journey.status === "completed" && (
                <button
                  onClick={() => setShowCertificate(true)}
                  className="p-2 bg-amber-500/80 rounded-lg hover:bg-amber-500 transition-colors"
                  title="عرض الشهادة"
                >
                  <Award className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setShowProgressShareModal(true)}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                title="شارك تقدمك"
              >
                <TrendingUp className="w-5 h-5" />
              </button>
              <button
                onClick={handleShare}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                title="دعوة أصدقاء"
              >
                <Users className="w-5 h-5" />
              </button>
              {journey.status != 'completed' && (
                <>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    title="إعدادات الختمة"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handlePauseResume}
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    {journey.status === "active" ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* شريط التقدم */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>التقدم: {progressData?.progress?.percent || journey.progress_percent}%</span>
              <span>
                {progressData?.progress?.read_count || 0} /{" "}
                {progressData?.progress?.total || journey.total_hadiths} حديث
              </span>
            </div>
            <div className="journey-progress-bar h-3 bg-white/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressData?.progress?.percent || journey.progress_percent}%` }}
                transition={{ duration: 1 }}
                className="journey-progress-bar-fill h-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* التبويبات */}
      <div className="max-w-4xl mx-auto px-4 mt-4">
        <div className="journey-tabs flex gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("today")}
            className={`journey-tab flex-1 flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === "today" ? "journey-tab-active" : ""
            }`}
          >
            <Book className="w-4 h-4" />
            <span>القراءة</span>
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            className={`journey-tab flex-1 flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === "progress" ? "journey-tab-active" : ""
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>التقدم</span>
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`journey-tab flex-1 flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === "friends" ? "journey-tab-active" : ""
            }`}
          >
            <Users className="w-4 h-4" />
            <span>الأصدقاء</span>
            {friends.length > 0 && (
              <span className="bg-white text-purple-600 text-xs px-2 py-0.5 rounded-full font-bold">
                {friends.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* المحتوى */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "today" && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {journey.status === "paused" ? (
                <div className="journey-book-card text-center py-12">
                  <Pause className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-800 mb-2 arabic-text">
                    الختمة متوقفة
                  </h3>
                  <p className="text-gray-600 mb-4 arabic-text">
                    اضغط على زر الاستئناف لمتابعة القراءة
                  </p>
                  <div className="flex justify-center items-center">
                    <button
                    onClick={handlePauseResume}
                    className="journey-btn-primary"
                  >
                    <Play className="w-5 h-5 ml-2" />
                    استئناف الختمة
                  </button>
                  </div>
                </div>
              ) : journey.status === "completed" ? (
                <div className="journey-book-card text-center py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <Award className="w-20 h-20 text-amber-500 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2 arabic-text">
                    أكملت الكتاب! 🎉
                  </h3>
                  <p className="text-gray-600 arabic-text mb-6">
                    مبارك! لقد أتممت قراءة {journey.book_name}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setShowCertificate(true)}
                      className="journey-btn-primary flex"
                    >
                      <Award className="w-5 h-5 ml-2" />
                      احصل على الشهادة
                    </button>
                  </div>
                </div>
              ) : todayData?.today?.is_complete ? (
                <div className="journey-book-card  text-center py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2 arabic-text">
                    أكملت ورد اليوم! 🎉
                  </h3>
                  <p className="text-gray-600 mb-4 arabic-text">
                    أحسنت! عد غداً لإكمال المزيد
                  </p>
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="journey-streak-badge text-lg px-4 py-2">
                      <Flame className="w-6 h-6 journey-fire-icon" />
                      <span className="font-bold">
                        {progressData?.stats?.streak || journey.streak_count} يوم متتالي
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setShowProgressShareModal(true)}
                      className="journey-btn-primary flex"
                    >
                      <Share2 className="w-5 h-5 ml-2" />
                      شارك إنجازك
                    </button>
                  </div>
                </div>
              ) : currentHadith ? (
                <>
                  {/* تذكير بالتعهد */}
                  {journey?.pledge && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 bg-gradient-to-r from-violet-50 to-purple-50 border border-purple-100 rounded-xl p-3 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm text-gray-700 arabic-text leading-relaxed line-clamp-1">
                        {journey.pledge}
                      </p>
                    </motion.div>
                  )}
                  <FocusedHadithCard
                    hadith={currentHadith}
                    position={currentHadith.position}
                    total={journey.total_hadiths}
                    onMarkRead={handleMarkRead}
                    isReading={readingHadith === currentHadith.id}
                    isMarkingRead={isMarkingRead}
                    onNext={handleNextHadith}
                    onPrev={handlePrevHadith}
                    hasPrev={currentHadithIndex > 0}
                    hasNext={
                      currentHadithIndex <
                      (todayData?.today?.hadiths?.length || 0) - 1
                    }
                  />
                </>
              ) : (
                <div className="journey-book-card text-center py-12">
                  <Award className="w-16 h-16 text-amber-500 mx-auto mb-4 journey-milestone" />
                  <h3 className="text-lg font-bold text-gray-800 mb-2 arabic-text">
                    أكملت الكتاب! 🎉
                  </h3>
                  <p className="text-gray-600 arabic-text">
                    مبارك! لقد أتممت قراءة {journey.book_name}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setShowCertificate(true)}
                      className="mt-4 journey-btn-primary flex"
                    >
                      <Award className="w-5 h-5 ml-2" />
                      احصل على الشهادة
                    </button>
                  </div>
                </div>
              )}

              {/* عداد الأحاديث */}
              {todayData?.today?.hadiths?.length > 1 &&
                !todayData?.today?.is_complete && (
                  <div className="mt-4 flex justify-center gap-2">
                    {todayData.today.hadiths.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentHadithIndex(idx)}
                        className={`h-3 rounded-full transition-all ${
                          idx === currentHadithIndex
                            ? "bg-purple-600 w-8"
                            : "bg-gray-300 hover:bg-gray-400 w-3"
                        }`}
                      />
                    ))}
                  </div>
                )}
            </motion.div>
          )}

          {activeTab === "progress" && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* بطاقة التعهد */}
              <PledgeCard 
                pledge={journey?.pledge}
                journeyId={id}
                isOwner={journey?.is_owner}
                onPledgeUpdated={(newPledge) => setJourney({ ...journey, pledge: newPledge })}
              />
              
              {/* تقويم التقدم */}
              <ProgressCalendar journeyId={id} bookName={journey?.book_name} />
              
              {/* الإحصائيات */}
              <div className="journey-book-card p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 arabic-text">
                  الإحصائيات
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="journey-stat-card">
                    <p className="journey-stat-value">
                      {progressData?.progress?.read_count || 0}
                    </p>
                    <p className="journey-stat-label arabic-text">حديث مقروء</p>
                  </div>
                  <div className="journey-stat-card">
                    <p className="journey-stat-value text-blue-600">
                      {progressData?.progress?.remaining || 0}
                    </p>
                    <p className="journey-stat-label arabic-text">حديث متبقي</p>
                  </div>
                  <div className="journey-stat-card">
                    <p className="journey-stat-value text-amber-600">
                      {progressData?.stats?.days_since_start || 0}
                    </p>
                    <p className="journey-stat-label arabic-text">يوم متتالي</p>
                  </div>
                  <div className="journey-stat-card">
                    <p className="journey-stat-value text-green-600">
                      {progressData?.stats?.average_per_day || 0}
                    </p>
                    <p className="journey-stat-label arabic-text">معدل يومي</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                    <span className="text-gray-600 arabic-text">
                      السرعة المحددة
                    </span>
                    <span className="font-bold text-purple-600">
                      {progressData?.stats?.pace || 1} حديث/يوم
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                    <span className="text-gray-600 arabic-text">
                      الأيام منذ البداية
                    </span>
                    <span className="font-bold text-gray-800">
                      {progressData?.stats?.days_since_start || 0} يوم
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                    <span className="text-gray-600 arabic-text">
                      الأيام المتبقية (تقديرياً)
                    </span>
                    <span className="font-bold text-gray-800">
                      {progressData?.progress?.remaining_days || 0} يوم
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowProgressShareModal(true)}
                  className="w-full mt-6 journey-btn-primary flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  شارك تقدمك
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "friends" && (
            <motion.div
              key="friends"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* بطاقة الرفيق */}
              <BuddyCard 
                buddy={buddyData?.buddy}
                pendingRequests={buddyData?.pending_requests}
                journeyId={id}
                onRefresh={() => loadJourneyData(false)}
              />
              
              {/* قائمة الأصدقاء */}
              <div className="journey-book-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 arabic-text">
                    الأصدقاء في الختمة
                  </h3>
                  <button
                    onClick={handleShare}
                    className="journey-btn-secondary"
                  >
                    <Users className="w-4 h-4 ml-2" />
                    دعوة أصدقاء
                  </button>
                </div>

                <FriendsProgress 
                  friends={friends}
                  hasBuddy={buddyData?.has_buddy}
                  onRequestBuddy={handleRequestBuddy}
                  requesting={requestingBuddy}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* المودالات */}
      <AnimatePresence>
        {showShareModal && shareData && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            shareData={shareData}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProgressShareModal && (
          <ShareProgressModal
            isOpen={showProgressShareModal}
            onClose={() => setShowProgressShareModal(false)}
            journey={journey}
            progress={progressData?.progress}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCertificate && (
          <JourneyCertificate
            journeyId={id}
            journeyStatus={journey?.status}
            bookName={journey?.book_name}
            onClose={() => setShowCertificate(false)}
          />
        )}
      </AnimatePresence>

      {/* Modal إعدادات الختمة */}
      <JourneySettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        journey={journey}
        onUpdate={(settings) => {
          if (settings?.reset) {
            loadJourneyData(true);
          } else {
            loadJourneyData(false);
          }
        }}
      />
    </div>
  );
};

export default JourneyDetailsPage;
