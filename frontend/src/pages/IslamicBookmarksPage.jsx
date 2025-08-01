import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Hash,
  Bookmark,
  Share2,
  Copy,
  Search,
  Trash2,
  Eye,
} from "lucide-react";
import LanguageSelector from "../components/LanguageSelector";
import { getTranslation } from "../utils/translations";
import {
  getUserIslamicBookmarks,
  getUserCollections,
  removeIslamicBookmark,
} from "../services/islamicBookmarksService";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const IslamicBookmarksPage = () => {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("islamicLibraryLanguage") || "ar";
  });

  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    fetchBookmarks();
    fetchCollections();
  }, [currentPage, selectedType, selectedCollection]);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
      };

      if (selectedType !== "all") {
        params.type = selectedType;
      }

      if (selectedCollection !== "all") {
        params.collection = selectedCollection;
      }

      const response = await getUserIslamicBookmarks(params);
      setBookmarks(response.bookmarks);
      setTotalPages(response.pagination.total_pages);
      setTotalItems(response.pagination.total_items);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      toast.error(getTranslation(language, "errorOccurred"));
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await getUserCollections();
      setCollections(response.collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem("islamicLibraryLanguage", newLanguage);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBookmarks();
  };

  const handleRemoveBookmark = async (bookmarkId) => {
    try {
      await removeIslamicBookmark(bookmarkId);
      setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId));
      toast.success(getTranslation(language, "bookmarkRemoved"));
    } catch (error) {
      console.error("Error removing bookmark:", error);
      toast.error(getTranslation(language, "errorOccurred"));
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(getTranslation(language, "copied"));
  };

  const handleShare = (bookmark) => {
    const text =
      language === "ar"
        ? bookmark.hadith_text || bookmark.chapter_name || bookmark.book_name
        : language === "en"
        ? bookmark.hadith_text_en ||
          bookmark.chapter_name_en ||
          bookmark.book_name_en
        : bookmark.hadith_text_ur ||
          bookmark.chapter_name_ur ||
          bookmark.book_name_ur;

    if (navigator.share) {
      navigator.share({
        title: getTranslation(language, "shareHadith"),
        text: text,
        url: window.location.href,
      });
    } else {
      handleCopyText(text);
    }
  };

  const getBookmarkIcon = (type) => {
    switch (type) {
      case "book":
        return <BookOpen className="w-5 h-5" />;
      case "chapter":
        return <Hash className="w-5 h-5" />;
      case "hadith":
        return <Bookmark className="w-5 h-5" />;
      default:
        return <Bookmark className="w-5 h-5" />;
    }
  };

  const getBookmarkTitle = (bookmark) => {
    if (bookmark.type === "hadith") {
      return language === "ar"
        ? bookmark.hadith_text?.substring(0, 300) + "..."
        : language === "en"
        ? bookmark.hadith_text_en?.substring(0, 300) + "..."
        : bookmark.hadith_text_ur?.substring(0, 300) + "...";
    } else if (bookmark.type === "chapter") {
      return language === "ar"
        ? bookmark.chapter_name
        : language === "en"
        ? bookmark.chapter_name_en
        : bookmark.chapter_name_ur;
    } else {
      return language === "ar"
        ? bookmark.book_name
        : language === "en"
        ? bookmark.book_name_en
        : bookmark.book_name_ur;
    }
  };

  const getBookmarkSubtitle = (bookmark) => {
    if (bookmark.type === "hadith") {
      return `${getTranslation(language, "hadith")} #${bookmark.hadith_number}`;
    } else if (bookmark.type === "chapter") {
      return `${getTranslation(language, "chapter")} ${
        bookmark.chapter_number
      }`;
    } else {
      return getTranslation(language, "book");
    }
  };

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const title = getBookmarkTitle(bookmark).toLowerCase();
      const subtitle = getBookmarkSubtitle(bookmark).toLowerCase();
      return title.includes(searchLower) || subtitle.includes(searchLower);
    }
    return true;
  });

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  if (loading && bookmarks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {getTranslation(language, "loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50"
      style={{ direction: language === "ar" ? "rtl" : "ltr" }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl border border-white/30">
                  <Bookmark className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xs sm:text-sm font-bold text-gray-800">
                    ★
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-cairo font-bold text-white mb-2">
                  {getTranslation(language, "islamicBookmarks")}
                </h1>
                <p className="text-white/80 text-sm sm:text-lg">
                  {totalItems} {getTranslation(language, "bookmarks")} •{" "}
                  {getTranslation(language, "myCollections")}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={() => navigate("/islamic-library")}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-xl text-white rounded-2xl font-semibold hover:bg-white/30 transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl"
              >
                {getTranslation(language, "backToLibrary")}
              </button>
              <LanguageSelector
                currentLanguage={language}
                onLanguageChange={handleLanguageChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 mb-8 border border-purple-200/50 shadow-xl"
        >
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-cairo font-bold text-gray-900 mb-2">
              {getTranslation(language, "searchAndFilter")}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              {getTranslation(language, "findYourBookmarks")}
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={getTranslation(language, "searchPlaceholder")}
                className="w-full pl-12 pr-4 py-4 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-lg"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Type Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  {getTranslation(language, "bookmarkType")}
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                >
                  <option value="all">{getTranslation(language, "all")}</option>
                  <option value="book">
                    {getTranslation(language, "bookmarkBook")}
                  </option>
                  <option value="chapter">
                    {getTranslation(language, "bookmarkChapter")}
                  </option>
                  <option value="hadith">
                    {getTranslation(language, "bookmarkHadith")}
                  </option>
                </select>
              </div>

              {/* Collection Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  {getTranslation(language, "bookmarkCollection")}
                </label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full px-4 py-3 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                >
                  <option value="all">{getTranslation(language, "all")}</option>
                  {collections.map((collection) => (
                    <option
                      key={collection.collection}
                      value={collection.collection}
                    >
                      {collection.collection} ({collection.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all hover:scale-105 shadow-lg"
                >
                  {getTranslation(language, "search")}
                </button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Bookmarks List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="w-10 h-10 sm:w-16 sm:h-16 text-purple-200 mx-auto mb-4" />
              <h3 className="text-base sm:text-xl font-cairo font-semibold text-gray-600 mb-2">
                {getTranslation(language, "noResults")}
              </h3>
              <p className="text-gray-500 text-xs sm:text-base">
                {getTranslation(language, "tryDifferentKeywords")}
              </p>
            </div>
          ) : (
            filteredBookmarks.map((bookmark) => (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
                whileHover={{ y: -2, scale: 1.01 }}
                className="mb-4 sm:mb-6 bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-md sm:shadow-xl px-3 py-4 sm:px-6 sm:py-6 flex flex-col gap-3 sm:gap-4 border border-purple-200/40"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl shadow">
                    {getBookmarkIcon(bookmark.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg amiri-regular font-bold text-gray-900 mb-1 sm:mb-2 truncate">
                      {getBookmarkTitle(bookmark)}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 truncate">
                      {getBookmarkSubtitle(bookmark)}
                    </p>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className="px-2 py-1 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 text-[11px] sm:text-xs rounded-full font-semibold border border-purple-200">
                        {getTranslation(
                          language,
                          `bookmark${
                            bookmark.type.charAt(0).toUpperCase() +
                            bookmark.type.slice(1)
                          }`
                        )}
                      </span>
                      {bookmark.collection && (
                        <span className="px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-[11px] sm:text-xs rounded-full font-semibold border border-blue-200">
                          {bookmark.collection}
                        </span>
                      )}
                      {bookmark.notes && (
                        <span className="px-2 py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-[11px] sm:text-xs rounded-full font-semibold border border-green-200">
                          {getTranslation(language, "hasNotes")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                  <button
                    onClick={() => {
                      const chapterNum = bookmark.chapter_number || 1;
                      const hadithId =
                        bookmark.hadith_id || bookmark.hadith_number;
                      if (bookmark.type === "hadith") {
                        navigate(`/islamic-library/hadith/${hadithId}`);
                      } else if (bookmark.type === "chapter") {
                        navigate(
                          `/islamic-library/book/${bookmark.book_slug}/chapter/${chapterNum}`
                        );
                      } else if (bookmark.type === "book") {
                        navigate(`/islamic-library/book/${bookmark.book_slug}`);
                      }
                    }}
                    className="flex-1 min-w-[40px] p-2 sm:p-3 text-gray-400 hover:text-purple-600 transition-all hover:scale-105 bg-white/60 rounded-xl shadow-sm text-xs sm:text-sm flex items-center justify-center"
                    title={getTranslation(language, "view")}
                  >
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() =>
                      handleCopyText(
                        bookmark.hadith_text ||
                          bookmark.hadith_text_en ||
                          bookmark.hadith_text_ur
                      )
                    }
                    className="flex-1 min-w-[40px] p-2 sm:p-3 text-gray-400 hover:text-blue-600 transition-all hover:scale-105 bg-white/60 rounded-xl shadow-sm text-xs sm:text-sm flex items-center justify-center"
                    title={getTranslation(language, "copy")}
                  >
                    <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => handleShare(bookmark)}
                    className="flex-1 min-w-[40px] p-2 sm:p-3 text-gray-400 hover:text-green-600 transition-all hover:scale-105 bg-white/60 rounded-xl shadow-sm text-xs sm:text-sm flex items-center justify-center"
                    title={getTranslation(language, "share")}
                  >
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => handleRemoveBookmark(bookmark.id)}
                    className="flex-1 min-w-[40px] p-2 sm:p-3 text-gray-400 hover:text-red-600 transition-all hover:scale-105 bg-white/60 rounded-xl shadow-sm text-xs sm:text-sm flex items-center justify-center"
                    title={getTranslation(language, "remove")}
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                {bookmark.notes && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-yellow-200/50 mt-2 sm:mt-3">
                    <h4 className="text-xs sm:text-sm font-semibold text-yellow-800 mb-1 sm:mb-2 flex items-center space-x-2 space-x-reverse">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      <span>{getTranslation(language, "notes")}</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-yellow-700 leading-relaxed break-words">
                      {bookmark.notes}
                    </p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-2 space-x-reverse mt-8"
          >
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white/90 backdrop-blur-xl rounded-xl border border-purple-200/50 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all"
            >
              {getTranslation(language, "previous")}
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    currentPage === page
                      ? "bg-purple-600 text-white shadow-lg"
                      : "bg-white/90 backdrop-blur-xl border border-purple-200/50 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white/90 backdrop-blur-xl rounded-xl border border-purple-200/50 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all"
            >
              {getTranslation(language, "next")}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default IslamicBookmarksPage;
