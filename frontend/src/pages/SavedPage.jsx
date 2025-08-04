import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useBookmarks } from "../context/BookmarkContext";
import axios from "axios";
import { 
  Bookmark, 
  BookOpen, 
  Share2, 
  ArrowUp, 
  Search, 
  Filter, 
  X, 
  Heart,
  Eye,
  Trash2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Users,
  Shield,
  Calendar,
  MessageCircle
} from "lucide-react";
import HadithCard from "../components/HadithCard";
import { Loading3QuartersOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../components/SEO";

const gradientBg = "bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50";

const patterns = [
  "/assets/arabic-pattern-classic.svg",
  "/assets/manuscript-texture.svg",
  "/assets/arabic-pattern-classic.svg",
];

const quotes = [
  "خيركم من تعلم القرآن وعلمه.",
  "الدال على الخير كفاعله.",
  "من سلك طريقًا يلتمس فيه علمًا سهل الله له به طريقًا إلى الجنة.",
  "الكلمة الطيبة صدقة.",
  "إنما الأعمال بالنيات.",
  "تبسمك في وجه أخيك صدقة.",
];

const SavedPage = () => {
  const { user } = useAuth();
  const { bookmarks, removeBookmark, loading } = useBookmarks();
  const [selectedCollection, setSelectedCollection] = useState("الكل");
  const [bookmarkedHadiths, setBookmarkedHadiths] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [modalHadith, setModalHadith] = useState(null);
  const [readingMode, setReadingMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [patternIdx] = useState(() => Math.floor(Math.random() * patterns.length));
  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // SEO Data for Saved Page
  const seoData = {
    title: "الأحاديث المحفوظة - مشكاة | أحاديثي المفضلة",
    description: "استكشف أحاديثك المحفوظة والمفضلة في مشكاة. تصفح، ابحث، وشارك أحاديثك المفضلة مع إمكانية التنظيم في مجموعات.",
    keywords: "أحاديث محفوظة, أحاديث مفضلة, مشكاة, حديث نبوي, حفظ أحاديث, مجموعات أحاديث, مشاركة أحاديث",
    canonicalUrl: `${window.location.origin}/saved`,
    ogImage: "https://hadith-shareef.com/logo.svg",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "الأحاديث المحفوظة - مشكاة",
      "description": "صفحة الأحاديث المحفوظة والمفضلة في مشكاة",
      "url": window.location.href,
      "publisher": {
        "@type": "Organization",
        "name": "مشكاة",
        "url": "https://hadith-shareef.com"
      }
    }
  };

  // جلب تفاصيل الأحاديث المحفوظة
  const fetchBookmarkedHadithDetails = useCallback(async () => {
    if (!bookmarks || bookmarks.length === 0) return [];
    setIsLoadingDetails(true);
    try {
      const hadithDetailsPromises = bookmarks.map(async (bookmark) => {
        try {
          if (!bookmark.hadith_book) {
            const response = await axios.get(
              `${import.meta.env.VITE_API_URL}/hadith/${bookmark.hadith_id}`,
              { params: { language: "ar" } }
            );
            return {
              ...response.data,
              bookmarkCollection: bookmark.collection || "الافتراضي",
              originalBookmarkId: bookmark.id,
              bookmarkedAt: bookmark.created_at || new Date().toISOString(),
            };
          }
          const response = await axios.get(
            `https://api.hadith.gading.dev/books/${bookmark.hadith_book}/${bookmark.hadith_id}`
          );
          return {
            ...response.data.data,
            bookmarkCollection: bookmark.collection || "الافتراضي",
            originalBookmarkId: bookmark.id,
            bookmarkedAt: bookmark.created_at || new Date().toISOString(),
          };
        } catch {
          return {
            id: bookmark.hadith_id,
            hadeeth: "تعذر جلب تفاصيل الحديث",
            bookmarkCollection: bookmark.collection || "الافتراضي",
            originalBookmarkId: bookmark.id,
            bookmarkedAt: bookmark.created_at || new Date().toISOString(),
          };
        }
      });
      const results = await Promise.all(hadithDetailsPromises);
      setIsLoadingDetails(false);
      return results;
    } catch {
      setIsLoadingDetails(false);
      return [];
    }
  }, [bookmarks]);

  useEffect(() => {
    const fetchBookmarkedHadiths = async () => {
      if (!bookmarks || bookmarks.length === 0) return;
      try {
        const hadiths = await fetchBookmarkedHadithDetails();
        setBookmarkedHadiths(hadiths);
      } catch {
        // تم تجاهل الخطأ
      }
    };
    fetchBookmarkedHadiths();
  }, [bookmarks, fetchBookmarkedHadithDetails]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // بناء قائمة المجموعات الفريدة مع خيار "الكل"
  const uniqueCollections = [
    "الكل",
    ...Array.from(
      new Set(bookmarkedHadiths.map((h) => h.bookmarkCollection || "الافتراضي"))
    ),
  ];

  // فلترة الأحاديث حسب المجموعة المختارة
  const filteredHadiths =
    selectedCollection === "الكل"
      ? bookmarkedHadiths
      : bookmarkedHadiths.filter(
          (h) => h.bookmarkCollection === selectedCollection
        );

  // دالة لإزالة التشكيل
  function removeTashkeel(str) {
    return str.replace(/[\u064B-\u0652]/g, "");
  }

  // فلترة حسب البحث مع تجاهل التشكيل
  const normalizedSearch = removeTashkeel(searchTerm).toLowerCase();
  const searchedHadiths = searchTerm.trim()
    ? filteredHadiths.filter((h) => {
        const hay = [h.hadeeth, h.attribution, h.grade, h.bookmarkCollection]
          .filter(Boolean)
          .map((x) => removeTashkeel(x).toLowerCase())
          .join(" ");
        return hay.includes(normalizedSearch);
      })
    : filteredHadiths;

  // ترتيب النتائج
  const sortedHadiths = [...searchedHadiths].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt);
      case "oldest":
        return new Date(a.bookmarkedAt) - new Date(b.bookmarkedAt);
      case "alphabetical":
        return a.hadeeth.localeCompare(b.hadeeth, 'ar');
      default:
        return 0;
    }
  });

  // حذف مع تأكيد
  const openDeleteModal = (id) => setDeleteModal({ open: true, id });
  const closeDeleteModal = () => setDeleteModal({ open: false, id: null });
  const confirmDelete = () => {
    removeBookmark(deleteModal.id);
    setBookmarkedHadiths((prev) =>
      prev.filter((h) => h.originalBookmarkId !== deleteModal.id)
    );
    closeDeleteModal();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4">
            <Bookmark className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">يرجى تسجيل الدخول</h2>
          <p className="text-gray-600">للوصول إلى المحفوظات الخاصة بك</p>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-6 shadow-lg">
            <Loading3QuartersOutlined className="text-4xl text-purple-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">جاري تحميل المحفوظات</h2>
          <p className="text-gray-600">يرجى الانتظار بينما نقوم بجلب أحاديثك المحفوظة</p>
        </motion.div>
      </div>
    );
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-6 shadow-lg">
            <Bookmark className="w-12 h-12 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">لا توجد أحاديث محفوظة</h2>
          <p className="text-gray-600 mb-6">ابدأ بحفظ الأحاديث المفضلة لديك للوصول إليها لاحقاً</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            استكشف الأحاديث
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <SEO {...seoData} />
      <div className={`min-h-screen ${gradientBg} relative overflow-hidden`}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto px-4 py-6"
        >
          {/* Quote Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6"
          >
            <div className="inline-block bg-white/80 backdrop-blur-xl rounded-2xl px-6 py-3 shadow-lg border border-purple-200/50">
              <p className="text-lg sm:text-xl text-purple-700 font-medium">{quote}</p>
            </div>
          </motion.div>

          {/* Main Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Bookmark className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">الأحاديث المحفوظة</h1>
                <p className="text-sm text-gray-600">استكشف أحاديثك المفضلة</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-xl border border-purple-200/50 text-purple-700 hover:bg-white transition-all duration-300 shadow-lg"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">الفلترة</span>
              </button>
              <button
                onClick={() => setReadingMode((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 shadow-lg ${
                  readingMode
                    ? "bg-purple-600 text-white"
                    : "bg-white/80 backdrop-blur-xl border border-purple-200/50 text-purple-700 hover:bg-white"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">وضع القراءة</span>
              </button>
            </motion.div>
          </div>

          {/* Enhanced Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث في الأحاديث المحفوظة..."
                className="w-full pr-10 pl-4 py-3 rounded-xl border border-purple-200/50 bg-white/80 backdrop-blur-xl text-gray-800 placeholder-gray-400 shadow-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all duration-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              يمكنك البحث باسم الراوي أو نص الحديث أو التصنيف أو الدرجة، بدون الحاجة للتشكيل
            </p>
          </motion.div>

          {/* Enhanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-purple-200/50"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Collection Filter */}
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">المجموعات</label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueCollections.map((col) => (
                        <button
                          key={col}
                          onClick={() => setSelectedCollection(col)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                            selectedCollection === col
                              ? "bg-purple-600 text-white shadow-lg"
                              : "bg-white/80 text-gray-700 hover:bg-purple-50 border border-purple-200"
                          }`}
                        >
                          {col === "الكل" ? "كل المجموعات" : col}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">الترتيب</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white/80 text-gray-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="newest">الأحدث</option>
                      <option value="oldest">الأقدم</option>
                      <option value="alphabetical">أبجدي</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-full border border-purple-200/50 shadow-lg">
              <Heart className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">
                {sortedHadiths.length} حديث محفوظ
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Content Section */}
        <div className="max-w-6xl mx-auto px-4 pb-8">
          {isLoadingDetails ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-6 shadow-lg">
                <Loading3QuartersOutlined className="text-4xl text-purple-600 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">جاري تحميل تفاصيل الأحاديث</h3>
              <p className="text-gray-500">يرجى الانتظار بينما نقوم بجلب تفاصيل أحاديثك المحفوظة</p>
            </motion.div>
          ) : !readingMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
              {sortedHadiths.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="col-span-full text-center py-16"
                >
                  <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-6 shadow-lg">
                    <Search className="w-12 h-12 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد نتائج</h3>
                  <p className="text-gray-500 mb-4">جرب تغيير كلمات البحث أو الفلاتر</p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCollection("الكل");
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    إعادة تعيين البحث
                  </button>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {sortedHadiths.map((hadith, index) => (
                                         <motion.div
                       key={hadith.id}
                       initial={{ opacity: 0, y: 30 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -30 }}
                       transition={{ duration: 0.4, delay: index * 0.1 }}
                       className="flex flex-col h-full"
                     >
                       <HadithCard
                         hadith={hadith}
                         isBookmarked={true}
                         onBookmarkToggle={() => openDeleteModal(hadith.id)}
                         onRead={() => setModalHadith(hadith)}
                         onRemove={() => openDeleteModal(hadith.id)}
                         showDeleteButton={true}
                       />
                     </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-200/50 max-w-4xl mx-auto"
            >
              {sortedHadiths.map((h, index) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="mb-12 last:mb-0"
                >
                  <div className="text-2xl font-[Amiri,serif] text-gray-800 leading-loose text-center mb-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200/50 shadow-lg">
                    {h.hadeeth}
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {h.attribution && (
                      <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                        <Users className="w-3 h-3" />
                        {h.attribution}
                      </span>
                    )}
                    {h.grade && (
                      <span className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                        <Shield className="w-3 h-3" />
                        {h.grade}
                      </span>
                    )}
                    {h.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Enhanced Delete Modal */}
      <AnimatePresence>
        {deleteModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">تأكيد الحذف</h3>
                <p className="text-gray-600 mb-6">
                  هل أنت متأكد أنك تريد حذف هذا الحديث من المحفوظات؟
                </p>
                <div className="flex gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={confirmDelete}
                    className="px-6 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                  >
                    تأكيد الحذف
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={closeDeleteModal}
                    className="px-6 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
                  >
                    إلغاء
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300"
            title="العودة للأعلى"
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
    </>
  );
};

export default SavedPage;
