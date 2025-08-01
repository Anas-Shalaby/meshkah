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
import { Link } from "react-router-dom";
import { Loading3QuartersOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { useHadithCategories } from "../hooks/useHadithCategories";
import { useNavigate } from "react-router-dom";

const HadithCategories = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCategories, setCurrentCategories] = useState([]);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
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
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchLoading(true);
      setSearchError(null);
      setSearchResults(null);
      try {
        const formData = new FormData();
        formData.append("term", searchTerm);
        formData.append("trans", "ar");

        const res = await axios.post(
          "https://hadeethenc.com/en/ajax/search",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        const html = res.data || "";
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
        const hadithDivs = Array.from(
          doc.querySelectorAll("div.rtl.text-right")
        );
        const ids = hadithDivs
          .map((div) => {
            const a = div.querySelector("a[href]");
            let id = null;
            if (a && a.getAttribute("href")) {
              const match = a.getAttribute("href").match(/\/hadith\/(\d+)/);
              if (match) id = match[1];
            }
            return id;
          })
          .filter(Boolean);
        const fetchHadithDetails = async (id) => {
          try {
            const res = await axios.get(
              `${import.meta.env.VITE_API_URL}/hadith/${id}`
            );
            return res.data;
          } catch {
            return null;
          }
        };
        const hadithDetailsList = await Promise.all(
          ids.map(fetchHadithDetails)
        );

        const results = hadithDetailsList.filter(Boolean);
        setSearchResults(results);
      } catch {
        setSearchError("حدث خطأ أثناء البحث.");
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
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] font-cairo"
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 border-4 border-[#7440E9]/20 rounded-full animate-spin border-t-transparent border-b-transparent" />
          <h2 className="text-2xl font-bold text-[#7440E9] mt-4">
            جاري تحميل التصنيفات...
          </h2>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] font-cairo"
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
      className="min-h-screen bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] py-16 px-4 font-cairo"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl sm:text-6xl font-extrabold text-[#7440E9] mb-6">
            تصنيفات الأحاديث
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
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
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <input
                type="text"
                placeholder="ابحث عن حديث أو كلمة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 pr-12 text-lg text-black rounded-2xl border-2 border-[#7440E9]/20 focus:ring-4 focus:ring-[#7440E9]/20 focus:border-[#7440E9] focus:outline-none text-right bg-white/90 shadow-lg backdrop-blur-sm"
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
              <Loading3QuartersOutlined className="text-6xl text-[#7440E9] animate-spin" />
              <p className="text-lg text-gray-600 mt-4">جاري البحث...</p>
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
              <h2 className="text-3xl font-bold text-[#7440E9] mb-2">
                نتائج البحث
              </h2>
              <p className="text-gray-600">
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
                    className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 p-8"
                  >
                    {/* Hadith Text */}
                    <div className="text-xl font-cairo leading-loose mb-6 text-gray-900 bg-gradient-to-r from-gray-50 to-white p-6 rounded-2xl border-r-4 border-[#7440E9]">
                      {hadith.hadeeth}
                    </div>

                    {/* Grade Badge */}
                    {hadith.grade && (
                      <div className="mb-4">
                        <span
                          className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                            hadith.grade.includes("صحيح")
                              ? "bg-green-100 text-green-700 border border-green-200"
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
                          <Users className="w-4 h-4 text-yellow-600" />
                          <span className="text-yellow-700 font-bold">
                            {hadith.attribution}
                          </span>
                        </div>
                      )}
                      {hadith.source && (
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="w-4 h-4 text-orange-600" />
                          <span className="text-orange-700 font-bold">
                            {hadith.source}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-500">رقم: {hadith.id}</span>
                      </div>
                      {hadith.topic && (
                        <div className="flex items-center gap-2 text-sm">
                          <ChevronRight className="w-4 h-4 text-green-600" />
                          <span className="text-green-700">{hadith.topic}</span>
                        </div>
                      )}
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {getCategoryNamesByIds(hadith.categories).map(
                        (categoryName, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gradient-to-r from-[#7440E9]/10 to-[#8B5CF6]/10 text-[#7440E9] rounded-full text-sm font-medium border border-[#7440E9]/20"
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#7440E9] rounded-xl font-medium border-2 border-[#7440E9] hover:bg-[#7440E9] hover:text-white transition-all duration-200"
                      >
                        <ChevronRight className="w-4 h-4" />
                        أحاديث مشابهة
                      </a>
                    </div>

                    {/* Share Button */}
                    <div className="flex justify-end">
                      <button
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-[#7440E9] transition-colors duration-200"
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
                          className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative"
                        >
                          <button
                            className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 transition-colors"
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
                          <h3 className="text-xl font-bold text-[#7440E9] mb-6 text-center">
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

                          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3">
                            <input
                              type="text"
                              readOnly
                              value={`${window.location.origin}/hadiths/hadith/${hadith.id}`}
                              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 select-all"
                            />
                            <button
                              className="p-2 rounded-lg hover:bg-[#7440E9]/10 text-[#7440E9] transition-colors"
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
                      <span key={idx} className="px-3 text-gray-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-xl font-bold transition-all duration-200 ${
                          currentPage === page
                            ? "bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white shadow-lg"
                            : "bg-white text-[#7440E9] border border-[#7440E9]/20 hover:border-[#7440E9]"
                        }`}
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
              <h2 className="text-3xl font-bold text-[#7440E9] mb-4">
                استعرض التصنيفات
              </h2>
              <p className="text-gray-600 text-lg">
                اختر من التصنيفات التالية لاستكشاف الأحاديث
              </p>

              {/* Breadcrumb */}
              {history.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
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
                  className="relative bg-white/90 backdrop-blur-xl border border-white/20 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group p-8 text-center"
                  style={{ minHeight: 280 }}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#7440E9]/5 to-[#8B5CF6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#7440E9] to-[#8B5CF6] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="font-bold text-2xl text-[#7440E9] mb-4 group-hover:text-[#6D28D9] transition-colors duration-300">
                      {cat.title}
                    </h3>

                    <div className="inline-block mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-[#7440E9]/10 to-[#8B5CF6]/10 text-[#7440E9] font-semibold text-sm border border-[#7440E9]/20">
                      {cat.hadeeths_count} حديث
                    </div>

                    {/* مؤشر الـ sub-categories */}
                    {cat.subCategories && cat.subCategories.length > 0 && (
                      <div className="mb-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200">
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
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#7440E9] font-bold border-2 border-[#7440E9] hover:bg-[#7440E9] hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl group-hover:scale-105"
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
