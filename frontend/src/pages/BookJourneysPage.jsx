import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Users,
  Trophy,
  Clock,
  ChevronLeft,
  Play,
  Pause,
  CheckCircle,
  Flame,
  Target,
  Calendar,
  TrendingUp,
  Share2,
  Plus,
  Sparkles,
  Book,
  Brain,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useRamadanTheme } from "../context/RamadanThemeContext";
import {
  getAvailableBooks,
  getMyJourneys,
  startJourney,
} from "../services/bookJourneysService";
import { getDueReviews } from "../services/reviewService";
import SEO from "../components/SEO";
import RamadanCountdown from "../components/ramadan/RamadanCountdown";
import RamadanFloatingElements from "../components/ramadan/RamadanFloatingElements";
import "../styles/book-journeys.css";

// مودال بدء الختمة
const StartJourneyModal = ({ book, isOpen, onClose, onStart }) => {
  const [selectedPace, setSelectedPace] = useState(1);
  const [customPace, setCustomPace] = useState("");
  const [pledge, setPledge] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const calculateDays = (pace) => {
    if (!pace || pace < 1) return 0;
    return Math.ceil(book.hadith_count / pace);
  };

  const handlePaceChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setCustomPace(value);
      if (value && parseInt(value) >= 1 && parseInt(value) <= 50) {
        setSelectedPace(parseInt(value));
      }
    }
  };

  const handleQuickSelect = (pace) => {
    setSelectedPace(pace);
    setCustomPace(pace.toString());
  };

  const handleStart = async () => {
    if (selectedPace < 1 || selectedPace > 50) {
      toast.error("يجب أن يكون العدد بين 1 و 50");
      return;
    }
    setIsStarting(true);
    await onStart(book.slug, selectedPace, pledge.trim() || null);
    setIsStarting(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 top-[60px] bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* الهيدر */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Book className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg arabic-text">{book.name}</h3>
                <p className="text-purple-200 text-sm">{book.hadith_count} حديث</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* عدد الأحاديث يومياً */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3 arabic-text">
                كم حديث تريد قراءته يومياً؟
              </p>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={customPace}
                  onChange={handlePaceChange}
                  placeholder="أدخل العدد"
                  className="w-full px-4 py-3 text-xl font-bold text-center border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                />
              </div>
              
              {/* اختيارات سريعة */}
              <div className="flex gap-2 flex-wrap mt-3">
                {[1, 3, 5, 10].map((pace) => (
                  <button
                    key={pace}
                    onClick={() => handleQuickSelect(pace)}
                    className={`flex-1 min-w-[60px] px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedPace === pace
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md"
                        : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                    }`}
                  >
                    {pace}
                  </button>
                ))}
              </div>

              {/* المدة المتوقعة */}
              {selectedPace >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-center"
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    ستنتهي في {calculateDays(selectedPace)} يوم
                  </span>
                </motion.div>
              )}
            </div>

            {/* التعهد */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <p className="text-sm font-bold text-gray-800 arabic-text">
                  ما هي نيتك من هذه الختمة؟
                </p>
              </div>
              <textarea
                value={pledge}
                onChange={(e) => setPledge(e.target.value)}
                placeholder="أتعهد بإتمام هذا الكتاب تقرباً إلى الله..."
                className="w-full p-3 border border-amber-200 rounded-xl resize-none h-20 text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none arabic-text bg-white"
                dir="rtl"
              />
              <p className="text-xs text-amber-600 mt-1">
                💡 التعهد اختياري لكنه يساعدك على الاستمرار
              </p>
            </div>

            {/* الأزرار */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleStart}
                disabled={selectedPace < 1 || isStarting}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isStarting ? (
                  <span>جاري البدء...</span>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    ابدأ الختمة
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// مكون بطاقة الكتاب
const BookCard = ({ book, onStart, hasActiveJourney, index }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="journey-book-card"
      >
        {/* رأس البطاقة مع الصورة */}
        <div className="journey-book-card-header relative">
          {book.image && (
            <div className="absolute top-0 left-0 right-0 bottom-0 opacity-20">
              <img src={book.image} alt={book.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg border-2 border-white/30 flex-shrink-0">
                {book.image ? (
                  <img src={book.image} alt={book.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center">
                    <Book className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg arabic-text">{book.name}</h3>
                <p className="text-purple-100 text-sm">{book.author}</p>
              </div>
            </div>
            {hasActiveJourney && (
              <span className="bg-white/20 text-xs px-2 py-1 rounded-full">نشط</span>
            )}
          </div>
        </div>

        {/* محتوى البطاقة */}
        <div className="p-4">
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 arabic-text">
            {book.description}
          </p>

          {/* إحصائيات */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="journey-stat-card">
              <p className="journey-stat-value">{book.hadith_count}</p>
              <p className="journey-stat-label">حديث</p>
            </div>
            <div className="journey-stat-card">
              <p className="journey-stat-value text-blue-600">{book.active_readers}</p>
              <p className="journey-stat-label">قارئ</p>
            </div>
            <div className="journey-stat-card">
              <p className="journey-stat-value text-amber-600">{book.total_completions}</p>
              <p className="journey-stat-label">ختمة</p>
            </div>
          </div>

          {/* زر البدء */}
          <button
            onClick={() => !hasActiveJourney && setShowModal(true)}
            disabled={hasActiveJourney}
            className={`w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
              hasActiveJourney
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "journey-btn-primary"
            }`}
          >
            {hasActiveJourney ? (
              <>
                <CheckCircle className="w-4 h-4" />
                لديك ختمة نشطة
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                ابدأ الختمة
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Modal بدء الختمة */}
      <StartJourneyModal
        book={book}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onStart={async (slug, pace, pledge) => {
          await onStart(slug, pace, pledge);
          setShowModal(false);
        }}
      />
    </>
  );
};

// مكون بطاقة الختمة النشطة
const ActiveJourneyCard = ({ journey, index }) => {
  const navigate = useNavigate();

  const getStatusClass = (status) => {
    switch (status) {
      case "active":
        return "journey-status-active";
      case "paused":
        return "journey-status-paused";
      case "completed":
        return "journey-status-completed";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "نشط";
      case "paused":
        return "متوقف";
      case "completed":
        return "مكتمل";
      default:
        return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ x: -8 }}
      onClick={() => navigate(`/book-journeys/${journey.id}`)}
      className="journey-active-card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Book className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-gray-800 arabic-text">
              {journey.book_name}
            </h4>
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`px-2 py-0.5 rounded-full ${getStatusClass(
                  journey.status
                )}`}
              >
                {getStatusText(journey.status)}
              </span>
              {journey.streak_count > 0 && (
                <span className="journey-streak-badge">
                  <Flame className="w-3 h-3" />
                  {journey.streak_count}
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronLeft className="w-5 h-5 text-gray-400" />
      </div>

      {/* شريط التقدم */}
      <div className="journey-progress-bar h-2 mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${journey.progress_percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="journey-progress-bar-fill h-full"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{journey.progress_percent}% مكتمل</span>
        <span>
          {journey.read_count || 0} / {journey.total_hadiths} حديث
        </span>
      </div>

      {journey.status === "active" && journey.remaining_days > 0 && (
        <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          متبقي {journey.remaining_days} يوم
        </p>
      )}
    </motion.div>
  );
};

// الصفحة الرئيسية
const BookJourneysPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isRamadanThemeActive } = useRamadanTheme();
  const [books, setBooks] = useState([]);
  const [myJourneys, setMyJourneys] = useState([]);
  const [journeyStats, setJourneyStats] = useState({
    active: 0,
    paused: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("books");
  const [dueReviewsCount, setDueReviewsCount] = useState(0);

  // Pagination & Filtering State
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const BOOKS_PER_PAGE = 6;

  // Filter books based on category
  const filteredBooks = books.filter(
    (book) => selectedCategory === "all" || book.category === selectedCategory
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);
  const currentBooks = filteredBooks.slice(
    (currentPage - 1) * BOOKS_PER_PAGE,
    currentPage * BOOKS_PER_PAGE
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const booksRes = await getAvailableBooks();
      setBooks(booksRes.books || []);

      if (user) {
        const journeysRes = await getMyJourneys();
        setMyJourneys(journeysRes.journeys || []);
        setJourneyStats(
          journeysRes.stats || { active: 0, paused: 0, completed: 0 }
        );
        
        // جلب عدد البطاقات المستحقة للمراجعة
        try {
          const reviewsRes = await getDueReviews(1);
          setDueReviewsCount(reviewsRes.count || 0);
        } catch (err) {
          // لا نعرض خطأ إذا فشلت المراجعات
          console.log("Reviews not loaded:", err);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleStartJourney = async (bookSlug, pace, pledge = null) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }

    try {
      const result = await startJourney(bookSlug, pace, pledge);
      if (result.success) {
        toast.success(result.message || "تم بدء الختمة بنجاح!");
        navigate(`/book-journeys/${result.journey.id}`);
      }
    } catch (error) {
      console.error("Error starting journey:", error);
      toast.error(error.response?.data?.message || "حدث خطأ في بدء الختمة");
    }
  };

  const activeBookSlugs = new Set(
    myJourneys.filter((j) => j.status === "active").map((j) => j.book_slug)
  );

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isRamadanThemeActive
            ? "ramadan-bg-gradient"
            : "bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50"
        }`}
      >
        <div className="text-center">
          <div className="journey-spinner w-16 h-16 mx-auto mb-4" />
          <p className="text-gray-600 arabic-text">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen pb-20 ${
        isRamadanThemeActive
          ? "ramadan-bg-gradient"
          : "bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50"
      }`}
    >
      {/* SEO */}
      <SEO
        title="ختمات الكتب | مشكاة - قراءة منظمة لكتب الحديث"
        description="اقرأ كتب الحديث الشريف بجدول منظم يومي. الأربعين النووية، رياض الصالحين، حصن المسلم وغيرها. تتبع تقدمك وشارك مع أصدقائك."
        keywords="ختمات الكتب، كتب الحديث، الأربعين النووية، رياض الصالحين، حصن المسلم، قراءة يومية، أحاديث"
        canonicalUrl={window.location.href}
        ogImage="/assets/nawawi40.jpeg"
      />

      {/* Ramadan Countdown */}
      {isRamadanThemeActive && <RamadanCountdown />}

      {/* Floating Elements */}
      {isRamadanThemeActive && <RamadanFloatingElements />}

      {/* الهيدر */}
      <div
        className={`journey-header text-white py-8 px-4 ${
          isRamadanThemeActive ? "pt-32 md:pt-28" : ""
        }`}
      >
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-2 gap-4 md:gap-0">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-200" />
                <h1 className="text-2xl md:text-3xl font-bold arabic-text">ختمات الكتب</h1>
              </div>
              
              {/* زر المراجعة */}
              {user && dueReviewsCount > 0 && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  onClick={() => navigate("/reviews")}
                  className="relative bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-2 rounded-xl flex items-center gap-2 transition-all self-start md:self-auto"
                >
                  <Brain className="w-5 h-5" />
                  <span className="text-sm font-medium">المراجعة</span>
                  <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
                    {dueReviewsCount}
                  </span>
                </motion.button>
              )}
            </div>
            <p className="text-purple-100 arabic-text">
              اختر كتاباً من كتب الحديث واقرأه بجدول منظم مع تتبع التقدم
            </p>
          </motion.div>

          {/* إحصائيات */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{journeyStats.active}</p>
                <p className="text-xs text-purple-200">نشطة</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{journeyStats.completed}</p>
                <p className="text-xs text-purple-200">مكتملة</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{journeyStats.paused}</p>
                <p className="text-xs text-purple-200">متوقفة</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* التبويبات */}
      <div className="max-w-6xl mx-auto px-4 mt-4">
        <div className="journey-tabs flex gap-1">
          <button
            onClick={() => setActiveTab("books")}
            className={`journey-tab flex-1 flex items-center justify-center gap-2 ${
              activeTab === "books" ? "journey-tab-active" : ""
            }`}
          >
            <BookOpen className="w-4 h-4" />
            الكتب المتاحة
          </button>
          <button
            onClick={() => setActiveTab("my-journeys")}
            className={`journey-tab flex-1 flex items-center justify-center gap-2 ${
              activeTab === "my-journeys" ? "journey-tab-active" : ""
            }`}
          >
            <Target className="w-4 h-4" />
            ختماتي
            {myJourneys.length > 0 && (
              <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                {myJourneys.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* المحتوى */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "books" ? (
            <motion.div
              key="books"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* تصنيفات الكتب */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                {[
                  { id: "all", label: "الكل" },
                  { id: "kutub_tisaa", label: "كتب الأحاديث الكبيرة" },
                  { id: "arbaain", label: "الأربعينيات" },
                  { id: "adab", label: "الأدب والآداب" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setCurrentPage(1); // العودة للصفحة الأولى عند تغيير التصنيف
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                        : "bg-white text-gray-600 hover:bg-purple-50"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {currentBooks.map((book, index) => (
                  <BookCard
                    key={book.slug}
                    book={book}
                    index={index}
                    onStart={handleStartJourney}
                    hasActiveJourney={activeBookSlugs.has(book.slug)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50 hover:bg-gray-50 disabled:cursor-not-allowed text-gray-600 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 transform rotate-180" />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-bold transition-all ${
                        currentPage === page
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-200 scale-110"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-purple-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50 hover:bg-gray-50 disabled:cursor-not-allowed text-gray-600 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              )}

              {currentBooks.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>لا توجد كتب في هذا التصنيف حالياً</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="my-journeys"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {myJourneys.length === 0 ? (
                <div className="journey-empty-state">
                  <BookOpen className="journey-empty-icon" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2 arabic-text">
                    لا توجد ختمات بعد
                  </h3>
                  <p className="text-gray-500 mb-4 arabic-text">
                    اختر كتاباً من الكتب المتاحة وابدأ رحلتك!
                  </p>
                  <button
                    onClick={() => setActiveTab("books")}
                    className="journey-btn-primary"
                  >
                    تصفح الكتب
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* الختمات النشطة */}
                  {myJourneys.filter((j) => j.status === "active").length >
                    0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2 arabic-text">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        الختمات النشطة
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myJourneys
                          .filter((j) => j.status === "active")
                          .map((journey, index) => (
                            <ActiveJourneyCard
                              key={journey.id}
                              journey={journey}
                              index={index}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* الختمات المتوقفة */}
                  {myJourneys.filter((j) => j.status === "paused").length >
                    0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2 arabic-text">
                        <div className="w-2 h-2 bg-amber-500 rounded-full" />
                        متوقفة مؤقتاً
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myJourneys
                          .filter((j) => j.status === "paused")
                          .map((journey, index) => (
                            <ActiveJourneyCard
                              key={journey.id}
                              journey={journey}
                              index={index}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* الختمات المكتملة */}
                  {myJourneys.filter((j) => j.status === "completed").length >
                    0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2 arabic-text">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        الختمات المكتملة
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myJourneys
                          .filter((j) => j.status === "completed")
                          .map((journey, index) => (
                            <ActiveJourneyCard
                              key={journey.id}
                              journey={journey}
                              index={index}
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BookJourneysPage;
