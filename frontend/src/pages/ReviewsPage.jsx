import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Flame,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Award,
  Clock,
  Target,
  Settings,
  BarChart3,
  CheckCircle,
  XCircle,
  MessageSquare,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useRamadanTheme } from "../context/RamadanThemeContext";
import {
  getDueReviews,
  submitReview,
  getReviewStats,
} from "../services/reviewService";
import SEO from "../components/SEO";
import RamadanCountdown from "../components/ramadan/RamadanCountdown";
import RamadanFloatingElements from "../components/ramadan/RamadanFloatingElements";
import "../styles/book-journeys.css";
// عرض الحديث - تصميم بسيط وواضح
const HadithDisplay = ({ card, showAnswer, onReveal, onHintUsed }) => {
  const [showFullText, setShowFullText] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const hadithText = card.hadith.arabic;
  const isLongHadith = hadithText.length > 300;
  const displayText = showFullText || !isLongHadith ? hadithText : hadithText.substring(0, 300) + "...";

  // نظام المساعدة - يظهر جزء من الحديث تدريجياً
  const getHint = () => {
    const hintLengths = [80, 150, 250]; // طول كل مستوى من المساعدة
    const currentLength = hintLengths[hintLevel] || hadithText.length;
    return hadithText.substring(0, currentLength);
  };

  const handleShowHint = () => {
    if (hintLevel < 3) {
      setHintLevel(hintLevel + 1);
      onHintUsed();
    }
  };

  const canShowMoreHint = hintLevel < 3 && hintLevel * 80 < hadithText.length;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {!showAnswer ? (
        // السؤال
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-12 text-center border-2 border-purple-100"
        >
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full text-purple-700 font-medium mb-4">
              <Brain className="w-5 h-5" />
              {card.book_name} - حديث رقم {card.hadith.idInBook}
            </div>
          </div>

          <Brain className="w-20 h-20 text-purple-400 mx-auto mb-8" />
          
          <h3 className="text-3xl font-bold text-gray-800 mb-6 arabic-text">
            ما هو نص هذا الحديث؟
          </h3>
          
          <p className="text-gray-500 mb-8">
            حاول تذكر الحديث كاملاً قبل الكشف عن الإجابة
          </p>

          {/* عرض المساعدة */}
          {hintLevel > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-amber-50 border-2 border-amber-200 rounded-2xl p-6"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-amber-600" />
                <span className="text-amber-700 font-medium text-sm">
                  مساعدة ({hintLevel}/3)
                </span>
              </div>
              <p className="text-lg leading-relaxed text-gray-700 arabic-text text-center amiri-regular">
                {getHint()}
                {hintLevel < 3 && canShowMoreHint && <span className="text-amber-500">...</span>}
              </p>
            </motion.div>
          )}

          <div className="flex gap-3 justify-center">
            {canShowMoreHint && (
              <button
                onClick={handleShowHint}
                className="px-6 py-3 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                {hintLevel === 0 ? "احتاج مساعدة" : "مساعدة إضافية"}
              </button>
            )}
            
            <button
              onClick={onReveal}
              className="journey-btn-primary px-8 py-3"
            >
              <RotateCcw className="w-5 h-5 inline-block ml-2" />
              اكشف الإجابة
            </button>
          </div>

          {hintLevel > 0 && (
            <p className="text-xs text-amber-600 mt-4">
              💡 ملحوظة: استخدام المساعدات سيؤثر على تقييمك
            </p>
          )}
        </motion.div>
      ) : (
        // الإجابة (نفس الكود السابق)
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 rounded-3xl shadow-xl p-12 border-2 border-purple-200"
        >
          <div className="flex items-center justify-center gap-2 mb-8">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <span className="text-green-600 font-medium">الإجابة الصحيحة</span>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-purple-100">
            <p className="text-2xl leading-[3] text-gray-800 arabic-text text-center amiri-regular font-normal">
              {displayText}
            </p>
            
            {isLongHadith && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowFullText(!showFullText)}
                  className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1 mx-auto transition-colors"
                >
                  {showFullText ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      عرض أقل
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      عرض المزيد
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-6">
              الآن قيّم مستوى حفظك لهذا الحديث
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// أزرار التقييم - تصميم أبسط وأوضح
const QualityButtons = ({ onSelect, disabled }) => {
  const qualities = [
    {
      value: 0,
      label: "نسيت تماماً",
      emoji: "😔",
      description: "مراجعة غداً",
      color: "from-red-500 to-red-600",
      borderColor: "border-red-200",
      textColor: "text-red-700"
    },
    {
      value: 2,
      label: "صعب جداً",
      emoji: "😰",
      description: "بعد يومين",
      color: "from-orange-500 to-orange-600",
      borderColor: "border-orange-200",
      textColor: "text-orange-700"
    },
    {
      value: 3,
      label: "صعب",
      emoji: "🤔",
      description: "بعد 3 أيام",
      color: "from-yellow-500 to-yellow-600",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-700"
    },
    {
      value: 4,
      label: "سهل",
      emoji: "😊",
      description: "بعد أسبوع",
      color: "from-green-500 to-green-600",
      borderColor: "border-green-200",
      textColor: "text-green-700"
    },
    {
      value: 5,
      label: "متقن",
      emoji: "🎯",
      description: "بعد أسبوعين",
      color: "from-blue-500 to-blue-600",
      borderColor: "border-blue-200",
      textColor: "text-blue-700"
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-4 max-w-5xl mx-auto">
      {qualities.map((quality) => (
        <motion.button
          key={quality.value}
          whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -4 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          onClick={() => !disabled && onSelect(quality.value)}
          disabled={disabled}
          className={`relative bg-white rounded-2xl p-6 border-2 ${quality.borderColor} shadow-lg hover:shadow-xl transition-all ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {/* الخلفية الملونة */}
          <div className={`absolute inset-0 bg-gradient-to-br ${quality.color} opacity-5 rounded-2xl`} />
          
          <div className="relative">
            <div className={`text-base font-bold mb-1 ${quality.textColor}`}>
              {quality.label}
            </div>
            <div className="text-xs text-gray-500">
              {quality.description}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

// شاشة الإكمال
const CompletionScreen = ({ stats, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="text-center"
      >
        <Award className="w-24 h-24 text-amber-500 mx-auto mb-6" />
      </motion.div>

      <h2 className="text-3xl font-bold text-gray-800 mb-2 arabic-text text-center">
        أحسنت! 🎉
      </h2>
      <p className="text-gray-600 mb-8 arabic-text text-center">
        أنهيت جميع المراجعات لليوم
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 text-center border border-purple-100">
          <Target className="w-6 h-6 text-purple-500 mb-2 mx-auto" />
          <p className="text-2xl font-bold text-gray-800">
            {stats.reviewedToday || 0}
          </p>
          <p className="text-xs text-gray-500">مراجعة اليوم</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 text-center border border-green-100">
          <TrendingUp className="w-6 h-6 text-green-500 mb-2 mx-auto" />
          <p className="text-2xl font-bold text-gray-800">
            {stats.masteredCards || 0}
          </p>
          <p className="text-xs text-gray-500">بطاقة متقنة</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 text-center border border-amber-100">
          <Flame className="w-6 h-6 text-amber-500 mb-2 mx-auto" />
          <p className="text-2xl font-bold text-gray-800">
            {stats.streak || 0}
          </p>
          <p className="text-xs text-gray-500">يوم متتالي</p>
        </div>
      </div>

      <button onClick={onClose} className="journey-btn-primary w-full py-3">
        عرض الإحصائيات
      </button>
    </motion.div>
  );
};

// الصفحة الرئيسية
const ReviewsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isRamadanThemeActive } = useRamadanTheme();

  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [showCompletion, setShowCompletion] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // بدء التوقيت عند عرض بطاقة جديدة
    if (!showAnswer && cards.length > 0) {
      setStartTime(Date.now());
      setHintsUsed(0); // إعادة تعيين المساعدات لكل بطاقة جديدة
    }
  }, [currentIndex, showAnswer, cards]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cardsRes, statsRes] = await Promise.all([
        getDueReviews(),
        getReviewStats(),
      ]);

      setCards(cardsRes.cards || []);
      setStats(statsRes.stats || {});

      if (cardsRes.cards?.length === 0) {
        setShowCompletion(true);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast.error("حدث خطأ في تحميل المراجعات");
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = () => {
    if (!isSubmitting) {
      setShowAnswer(true);
    }
  };

  const handleHintUsed = () => {
    setHintsUsed(prev => prev + 1);
  };

  const handleQualitySelect = async (quality) => {
    if (isSubmitting) return;

    const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : null;

    try {
      setIsSubmitting(true);
      const currentCard = cards[currentIndex];

      await submitReview(currentCard.id, quality, timeTaken);

      // رسائل تحفيزية
      if (quality >= 4) {
        toast.success("🎉 ممتاز! الحديث متقن");
      } else if (quality >= 3) {
        toast.success("👍 جيد! استمر في المراجعة");
      } else {
        toast("💪 لا بأس، ستتحسن مع المراجعات", {
          icon: "💪",
        });
      }

      // الانتقال للبطاقة التالية
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else {
        // انتهت جميع البطاقات
        setShowCompletion(true);
      }

      // تحديث الإحصائيات
      const statsRes = await getReviewStats();
      setStats(statsRes.stats || {});
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("حدث خطأ في تسجيل المراجعة");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="journey-spinner w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-600 arabic-text">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div
      className={`min-h-screen pb-20 relative ${
        isRamadanThemeActive
          ? "ramadan-bg-gradient"
          : "bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50"
      }`}
    >
      <SEO
        title="المراجعة الذكية | مشكاة"
        description="راجع الأحاديث التي قرأتها باستخدام نظام المراجعة المتباعدة (Spaced Repetition) لحفظ طويل المدى"
        keywords="مراجعة، حفظ، أحاديث، spaced repetition، تكرار متباعد"
      />

      {/* Ramadan Countdown */}
      {isRamadanThemeActive && <RamadanCountdown />}

      {/* Floating Elements */}
      {isRamadanThemeActive && <RamadanFloatingElements />}

      {/* الهيدر */}
      <div className={`journey-header text-white  py-6 px-4 ${
        isRamadanThemeActive ? "pt-32 md:pt-28 z-0" : ""
      }`}>
        
        <div className="max-w-4xl mx-auto">
        <button
            onClick={() => navigate("/book-journeys")}
            style={{zIndex: 10000}}
            className="flex relative items-center gap-2 text-purple-200 mb-4 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
            العودة
          </button>  

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Brain className="w-7 h-7" />
                <h1 className="text-2xl font-bold arabic-text">
                  المراجعة الذكية
                </h1>
              </div>
              <p className="text-purple-200 text-sm">
                نظام المراجعة المتباعدة للحفظ طويل المدى
              </p>
            </div>

            <div className="flex gap-2 z-100 self-end md:self-auto" style={{zIndex: 10000}}>
              <button
                onClick={() => navigate("/reviews/stats")}
                className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                title="الإحصائيات"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate("/reviews/settings")}
                className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                title="الإعدادات"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <AnimatePresence mode="wait">
          {showCompletion ? (
            <CompletionScreen
              key="completion"
              stats={{
                reviewedToday: cards.length,
                masteredCards: stats.mastered_cards,
                streak: stats.review_streak,
              }}
              onClose={() => navigate("/reviews/stats")}
            />
          ) : currentCard ? (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* معلومات التقدم */}
              <div className="bg-white rounded-2xl p-5 mb-6 shadow-md border border-purple-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600 font-medium">
                    البطاقة {currentIndex + 1} من {cards.length}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-amber-600">
                      <Flame className="w-4 h-4" />
                      {stats.review_streak || 0} يوم
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      {stats.mastered_cards || 0} متقن
                    </span>
                  </div>
                </div>
                <div className="journey-progress-bar h-2">
                  <motion.div
                    className="journey-progress-bar-fill h-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((currentIndex + 1) / cards.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* عرض الحديث */}
              <HadithDisplay
                card={currentCard}
                showAnswer={showAnswer}
                onReveal={handleReveal}
                onHintUsed={handleHintUsed}
              />

              {/* أزرار التقييم */}
              <AnimatePresence>
                {showAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mt-8"
                  >
                    <QualityButtons
                      onSelect={handleQualitySelect}
                      disabled={isSubmitting}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReviewsPage;
