import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Copy,
  Share2,
  Search,
  BookOpen,
  Users,
  Award,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Loading3QuartersOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { useHadithCategories } from "../hooks/useHadithCategories";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import { useTheme } from "../context/ThemeContext";

const HadithCategories = () => {
  const navigate = useNavigate();
  const { isNight } = useTheme();
  const ACCENT = isNight ? "#9e98db" : "#7440E9";
  const c = isNight
    ? {
        page: "bg-[#1a1c22]",
        text: "text-[#e0e0e0]",
        sub: "text-[#a0a0a0]",
        card: "bg-[#212328] border border-[#2a2d35]",
        cardHover: "hover:border-[#9e98db]/50",
        soft: "bg-[#1a1c22] border border-[#2a2d35]",
        input:
          "bg-[#212328] text-[#e0e0e0] border-2 border-[#2a2d35] placeholder-[#6b7280] focus:border-[#9e98db]",
        chip: "bg-[#1a1c22] text-[#9e98db] border border-[#2a2d35]",
        outlineBtn:
          "bg-transparent text-[#9e98db] border-2 border-[#9e98db]/40 hover:bg-[#9e98db]/10",
        modal: "bg-[#212328] border border-[#2a2d35]",
        modalSoft: "bg-[#1a1c22] border border-[#2a2d35]",
        divider: "border-[#2a2d35]",
      }
    : {
        page: "bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5]",
        text: "text-gray-900",
        sub: "text-gray-600",
        card: "bg-white/90 backdrop-blur-xl border border-white/20",
        cardHover: "hover:border-purple-300",
        soft: "bg-gradient-to-r from-gray-50 to-white border border-transparent",
        input:
          "bg-white/90 text-black border-2 border-[#7440E9]/20 focus:ring-4 focus:ring-[#7440E9]/20 focus:border-[#7440E9] shadow-lg backdrop-blur-sm",
        chip: "bg-gradient-to-r from-[#7440E9]/10 to-[#8B5CF6]/10 text-[#7440E9] border border-[#7440E9]/20",
        outlineBtn:
          "bg-white text-[#7440E9] border-2 border-[#7440E9] hover:bg-[#7440E9] hover:text-white",
        modal: "bg-white border border-transparent",
        modalSoft: "bg-gray-100 border border-transparent",
        divider: "border-gray-200",
      };
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCategories, setCurrentCategories] = useState([]);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("search") || "",
  );
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const RESULTS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [shareDialogId, setShareDialogId] = useState(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const { categories: allCategories } = useHadithCategories();

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get(`${import.meta.env.VITE_API_URL}/sub-categories`)
      .then((res) => {
        const allCategories = res.data.data || [];
        // جلب التصنيفات الرئيسية (parent_id = null)
        const mainCategories = allCategories.filter(
          (cat) => cat.parent_id === null
        );
        setCurrentCategories(mainCategories);
        setLoading(false);
      })
      .catch(() => {
        setError("حدث خطأ أثناء تحميل التصنيفات.");
        setLoading(false);
      });
  }, []);

  const handleBack = () => {
    if (history.length > 0) {
      const last = history[history.length - 1];
      setCurrentCategories(last.cats);
      setHistory((prev) => prev.slice(0, prev.length - 1));
    }
  };

  // دالة جديدة لفتح الـ sub-categories
  const handleOpenSubCategories = async (categoryId) => {
    // التنقل للصفحة الجديدة مباشرة
    navigate(`/hadiths/category/${categoryId}`);
  };

  const getCategoryNamesByIds = (ids) => {
    if (!allCategories || !ids) return [];
    return ids.map((id) => {
      const category = allCategories.find((c) => String(c.id) === String(id));
      return category ? category.title : `Unknown (${id})`;
    });
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (searchTerm.trim()) {
      setSearchLoading(true);
      setSearchError(null);
      setSearchResults(null);

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/search`,
          { searchTerm },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          setSearchResults(response.data.results);
        } else {
          setSearchError(response.data.message);
        }
      } catch (error) {
        setSearchError("حدث خطأ أثناء البحث.");
        console.error("Search error:", error);
      } finally {
        setSearchLoading(false);
      }
    }
  };

  useEffect(() => {
    if (searchTerm === "") {
      setSearchResults(null);
      setSearchError(null);
      setSearchLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const urlSearchTerm = searchParams.get("search") || "";
    if (!urlSearchTerm) return;
    setSearchTerm(urlSearchTerm);
  }, [searchParams]);

  useEffect(() => {
    if (!loading && searchTerm.trim() && searchResults === null && !searchLoading) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchResults]);

  function getPagination(current, total) {
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }
    if (current - delta > 2) range.unshift("...");
    if (current + delta < total - 1) range.push("...");
    range.unshift(1);
    if (total > 1) range.push(total);
    return Array.from(new Set(range));
  }

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center font-cairo ${c.page}`}
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div
            className="w-16 h-16 mx-auto mb-6 border-4 rounded-full animate-spin border-t-transparent border-b-transparent"
            style={{ borderColor: `${ACCENT}33`, borderTopColor: "transparent", borderBottomColor: "transparent" }}
          />
          <h2 className="text-2xl font-bold mt-4" style={{ color: ACCENT }}>
            جاري تحميل التصنيفات...
          </h2>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center font-cairo ${c.page}`}
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen py-16 px-4 font-amiri ${c.page} ${c.text}`}
      dir="rtl"
    >
      <SEO
        title="تصنيفات الأحاديث - مشكاة الأحاديث"
        description="تصفح تصنيفات الأحاديث النبوية الشريفة في مشكاة. تصنيفات شاملة للأحاديث حسب الموضوع والفئة"
        keywords="تصنيفات أحاديث, أحاديث نبوية, مشكاة, حديث نبوي, تصنيفات إسلامية"
        canonicalUrl={`${window.location.origin}/hadiths/categories`}
      />
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6" style={{ color: ACCENT }}>
            تصنيفات الأحاديث
          </h1>
          <p className={`text-xl max-w-3xl mx-auto leading-relaxed ${c.sub}`}>
            استكشف الأحاديث النبوية الشريفة من خلال التصنيفات المختلفة
          </p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6" style={{ color: ACCENT }} />
              <input
                type="text"
                placeholder="ابحث عن حديث أو كلمة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-6 py-4 pr-12 text-lg rounded-2xl focus:outline-none text-right ${c.input}`}
                autoFocus
              />
              <button
                type="submit"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 px-6 py-2 rounded-xl bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white font-bold text-base hover:from-[#6D28D9] hover:to-[#7C3AED] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                بحث
              </button>
            </div>
          </form>
        </motion.div>

        {/* Loading State */}
        {searchTerm && searchLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mb-8"
          >
            <div className="text-center">
              <Loading3QuartersOutlined className="text-6xl animate-spin" style={{ color: ACCENT }} />
              <p className={`text-lg mt-4 ${c.sub}`}>جاري البحث...</p>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {searchTerm && searchError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-lg text-red-600 my-8"
          >
            {searchError}
          </motion.div>
        )}

        {/* Search Results */}
        {searchResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold mb-2" style={{ color: ACCENT }}>
                نتائج البحث
              </h2>
              <p className={c.sub}>
                تم العثور على {searchResults.length} حديث
              </p>
            </div>

            <div className="space-y-6">
              {searchResults
                .slice(
                  (currentPage - 1) * RESULTS_PER_PAGE,
                  currentPage * RESULTS_PER_PAGE
                )
                .map((hadith, idx) => (
                  <motion.div
                    key={hadith.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className={`rounded-3xl shadow-lg transition-all duration-300 p-8 ${c.card} ${c.cardHover}`}
                  >
                    {/* Hadith Text */}
                    <div className={`text-md font-amiri leading-loose mb-6 p-6 rounded-2xl ${c.soft} ${c.text}`}>
                      {hadith.hadeeth}
                    </div>

                    {/* Grade Badge */}
                    {hadith.grade && (
                      <div className="mb-4">
                        <span
                          className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                            hadith.grade.includes("صحيح")
                              ? isNight
                                ? "bg-green-900/30 text-green-400 border border-green-900/50"
                                : "bg-green-100 text-green-700 border border-green-200"
                              : isNight
                              ? "bg-red-900/30 text-red-400 border border-red-900/50"
                              : "bg-red-100 text-red-700 border border-red-200"
                          }`}
                        >
                          {hadith.grade}
                        </span>
                      </div>
                    )}

                    {/* Hadith Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {hadith.attribution && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4" style={{ color: isNight ? "#fbbf24" : "#ca8a04" }} />
                          <span className="font-bold" style={{ color: isNight ? "#fcd34d" : "#a16207" }}>
                            {hadith.attribution}
                          </span>
                        </div>
                      )}
                      {hadith.source && (
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="w-4 h-4" style={{ color: isNight ? "#fb923c" : "#ea580c" }} />
                          <span className="font-bold" style={{ color: isNight ? "#fdba74" : "#c2410c" }}>
                            {hadith.source}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4" style={{ color: isNight ? "#a0a0a0" : "#4b5563" }} />
                        <span className={c.sub}>رقم: {hadith.id}</span>
                      </div>
                      {hadith.topic && (
                        <div className="flex items-center gap-2 text-sm">
                          <ChevronRight className="w-4 h-4" style={{ color: isNight ? "#4ade80" : "#16a34a" }} />
                          <span style={{ color: isNight ? "#86efac" : "#15803d" }}>{hadith.topic}</span>
                        </div>
                      )}
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {getCategoryNamesByIds(hadith.categories).map(
                        (categoryName, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${c.chip}`}
                          >
                            {categoryName}
                          </span>
                        )
                      )}
                    </div>

                    {/* Action Links */}
                    <div className="flex flex-wrap gap-4 mb-4">
                      <Link
                        to={`/hadiths/hadith/${hadith.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white rounded-xl font-medium hover:from-[#6D28D9] hover:to-[#7C3AED] transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <BookOpen className="w-4 h-4" />
                        شرح الحديث
                      </Link>
                      <a
                        href={`/hadiths/${hadith.categories[0]}/page/1`}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${c.outlineBtn}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                        أحاديث مشابهة
                      </a>
                    </div>

                    {/* Share Button */}
                    <div className="flex justify-end">
                      <button
                        className={`flex items-center gap-2 px-4 py-2 transition-colors duration-200 ${c.sub} hover:opacity-80`}
                        title="مشاركة"
                        onClick={() => setShareDialogId(hadith.id)}
                      >
                        <Share2 className="w-5 h-5" />
                        مشاركة
                      </button>
                    </div>

                    {/* Share Dialog */}
                    {shareDialogId === hadith.id && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`rounded-3xl shadow-2xl p-8 w-full max-w-md relative ${c.modal}`}
                        >
                          <button
                            className={`absolute top-4 left-4 transition-colors ${c.sub} hover:opacity-80`}
                            onClick={() => setShareDialogId(null)}
                          >
                            <svg
                              width="24"
                              height="24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                          </button>
                          <h3 className="text-xl font-bold mb-6 text-center" style={{ color: ACCENT }}>
                            مشاركة الحديث
                          </h3>

                          <div className="flex justify-center gap-6 mb-6">
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(
                                `${window.location.origin}/hadiths/hadith/${hadith.id}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col items-center group"
                            >
                              <span className="bg-green-500/10 p-4 rounded-full shadow group-hover:scale-110 transition-transform duration-200">
                                <WhatsAppOutlined className="text-3xl text-green-500" />
                              </span>
                              <span className="text-green-700 text-sm font-bold mt-2">
                                واتساب
                              </span>
                            </a>
                            <a
                              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                                `${window.location.origin}/hadiths/hadith/${hadith.id}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col items-center group"
                            >
                              <span className="bg-blue-500/10 p-4 rounded-full shadow group-hover:scale-110 transition-transform duration-200">
                                <svg
                                  className="w-8 h-8 text-blue-500"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195A4.92 4.92 0 0 0 16.616 3c-2.73 0-4.942 2.21-4.942 4.932 0 .386.045.763.127 1.124C7.728 8.807 4.1 6.884 1.671 3.965c-.423.722-.666 1.561-.666 2.475 0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.239-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.057 0 14.009-7.496 14.009-13.986 0-.21 0-.423-.016-.634A9.936 9.936 0 0 0 24 4.557z" />
                                </svg>
                              </span>
                              <span className="text-blue-700 text-sm font-bold mt-2">
                                تويتر
                              </span>
                            </a>
                          </div>

                          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${c.modalSoft}`}>
                            <input
                              type="text"
                              readOnly
                              value={`${window.location.origin}/hadiths/hadith/${hadith.id}`}
                              className={`flex-1 bg-transparent border-none outline-none text-sm select-all ${c.sub}`}
                            />
                            <button
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: ACCENT }}
                              onClick={async () => {
                                await navigator.clipboard.writeText(
                                  `${window.location.origin}/hadiths/hadith/${hadith.id}`
                                );
                                setCopiedShare(true);
                                setTimeout(() => setCopiedShare(false), 1200);
                              }}
                            >
                              <Copy size={18} />
                            </button>
                            {copiedShare && (
                              <span className="text-xs text-green-600">
                                تم النسخ!
                              </span>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                ))}
            </div>

            {/* Pagination */}
            {searchResults.length > RESULTS_PER_PAGE && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center items-center gap-2 mt-8"
              >
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white font-bold disabled:opacity-50 transition-all duration-200"
                >
                  السابق
                </button>
                <div className="flex gap-1">
                  {getPagination(
                    currentPage,
                    Math.ceil(searchResults.length / RESULTS_PER_PAGE)
                  ).map((page, idx) =>
                    page === "..." ? (
                      <span key={idx} className={`px-3 ${c.sub}`}>
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-xl font-bold transition-all duration-200 ${
                          currentPage === page
                            ? "bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white shadow-lg"
                            : `${c.card} ${c.cardHover}`
                        }`}
                        style={currentPage === page ? undefined : { color: ACCENT }}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(
                        Math.ceil(searchResults.length / RESULTS_PER_PAGE),
                        p + 1
                      )
                    )
                  }
                  disabled={
                    currentPage ===
                    Math.ceil(searchResults.length / RESULTS_PER_PAGE)
                  }
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white font-bold disabled:opacity-50 transition-all duration-200"
                >
                  التالي
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Categories Section */}
        {!searchResults && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" style={{ color: ACCENT }}>
                استعرض التصنيفات
              </h2>
              <p className={`text-lg ${c.sub}`}>
                اختر من التصنيفات التالية لاستكشاف الأحاديث
              </p>

              {/* Breadcrumb */}
              {history.length > 0 && (
                <div className={`flex items-center justify-center gap-2 mt-4 text-sm ${c.sub}`}>
                  <span>الرئيسية</span>
                  {history.map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" />
                      <span>التصنيفات الفرعية</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {history.length > 0 && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                onClick={handleBack}
              >
                <ArrowLeft className="w-5 h-5" />
                رجوع
              </motion.button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentCategories.map((cat, idx) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className={`relative rounded-3xl shadow-lg transition-all duration-300 cursor-pointer group p-8 text-center ${c.card} ${c.cardHover}`}
                  style={{ minHeight: 280 }}
                >
                  <div className="relative z-10">
                    <div
                      className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300"
                      style={{ backgroundColor: `${ACCENT}1f` }}
                    >
                      <BookOpen className="w-8 h-8" style={{ color: ACCENT }} />
                    </div>

                    <h3 className={`font-bold text-2xl mb-4 transition-colors duration-300 ${c.text}`}>
                      {cat.title}
                    </h3>

                    <div className={`inline-block mb-6 px-4 py-2 rounded-full font-semibold text-sm ${c.chip}`}>
                      {cat.hadeeths_count} حديث
                    </div>

                    {/* مؤشر الـ sub-categories */}
                    {cat.subCategories && cat.subCategories.length > 0 && (
                      <div className="mb-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          isNight
                            ? "bg-green-900/30 text-green-400 border border-green-900/50"
                            : "bg-green-100 text-green-700 border border-green-200"
                        }`}>
                          <ChevronRight className="w-3 h-3" />
                          {cat.subCategories.length} تصنيف فرعي
                        </span>
                      </div>
                    )}

                    {/* أزرار التفاعل */}
                    <div className="space-y-3">
                      {/* زر فتح الـ sub-categories */}
                      {cat.subCategories && cat.subCategories.length > 0 && (
                        <button
                          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white font-bold hover:from-[#6D28D9] hover:to-[#7C3AED] transition-all duration-200 shadow-lg hover:shadow-xl group-hover:scale-105"
                          onClick={() => handleOpenSubCategories(cat.id)}
                        >
                          <BookOpen className="w-5 h-5" />
                          استكشاف التصنيفات الفرعية
                        </button>
                      )}

                      {/* زر الذهاب للأحاديث مباشرة */}
                      <button
                        className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl group-hover:scale-105 ${c.outlineBtn}`}
                        onClick={() => navigate(`/hadiths/${cat.id}/page/1`)}
                      >
                        <ChevronRight className="w-5 h-5" />
                        عرض جميع الأحاديث
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HadithCategories;
