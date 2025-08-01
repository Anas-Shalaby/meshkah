import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Hash,
  Share2,
  Eye,
} from "lucide-react";
import LanguageSelector from "../components/LanguageSelector";
import {
  getTranslation,
  getBookTranslation,
  getWriterTranslation,
} from "../utils/translations";

const IslamicBookPage = () => {
  const { bookSlug } = useParams();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid, list, masonry
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("islamicLibraryLanguage") || "ar";
  });

  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    fetchBookData();
  }, [bookSlug]);

  const fetchBookData = async () => {
    try {
      setLoading(true);

      // Fetch book details
      const booksResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/islamic-library/books`
      );
      const booksData = await booksResponse.json();
      const currentBook = booksData.allBooks?.find(
        (b) => b.bookSlug === bookSlug
      );
      setBook(currentBook);

      // Check if it's a local book
      const isLocal = currentBook?.isLocal || false;
      if (isLocal) {
        // For local books, fetch chapters to display them
        const chaptersResponse = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/islamic-library/books/${bookSlug}/chapters`
        );
        const chaptersData = await chaptersResponse.json();
        if (chaptersData.status === 200) {
          setChapters(chaptersData.chapters);
        }
        return;
      }

      // Fetch chapters for external books only
      const chaptersResponse = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/islamic-library/books/${bookSlug}/chapters`
      );
      const chaptersData = await chaptersResponse.json();
      if (chaptersData.status === 200) {
        setChapters(chaptersData.chapters);
      }
    } catch (error) {
      console.error("Error fetching book data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem("islamicLibraryLanguage", newLanguage);
  };

  const filteredChapters = chapters.filter((chapter) =>
    (language === "ar"
      ? chapter.chapterArabic
      : language === "en"
      ? chapter.chapterEnglish
      : chapter.chapterUrdu
    )
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleShare = (chapter) => {
    const url = `${window.location.origin}/islamic-library/book/${bookSlug}/chapter/${chapter.chapterNumber}`;
    if (navigator.share) {
      navigator.share({
        title: `${getBookTranslation(language, book.bookName)} - ${
          language === "ar"
            ? chapter.chapterArabic
            : language === "en"
            ? chapter.chapterEnglish
            : chapter.chapterUrdu
        }`,
        text: `${getTranslation(language, "chapter")} ${chapter.chapterNumber}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {getTranslation(language, "loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-cairo font-semibold text-gray-600 mb-2">
              {getTranslation(language, "bookNotFound")}
            </h3>
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
      {/* Enhanced Header with Glass Effect */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-purple-200/50 sticky top-0 z-10  shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ">
          <div className="flex flex-col flex-wrap items-start justify-between gap-y-4">
            <div className="flex flex-wrap flex-row-reverse justify-between w-[100%]  lg:gap-6 flex-1 min-w-0">
              <Link
                to="/islamic-library"
                className="flex items-center space-x-2 space-x-reverse text-purple-600 hover:text-purple-700 transition-all whitespace-nowrap"
              >
                <span className="font-cairo font-medium">
                  {getTranslation(language, "back")}
                </span>
                {language === "ar" ? (
                  <ChevronLeft className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </Link>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between gap-4 flex-1 min-w-0"
              >
                <div className="min-w-0">
                  <h1
                    className="text-2xl sm:text-3xl font-cairo font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent break-words whitespace-pre-line leading-snug"
                    style={{ wordBreak: "break-word" }}
                  >
                    {language === "ar"
                      ? getBookTranslation(language, book.bookName)
                      : book.bookNameEn
                      ? book.bookNameEn
                      : getBookTranslation(language, book.bookName)}
                  </h1>
                  <p
                    className="text-sm text-gray-600 flex flex-wrap items-center gap-x-2 gap-y-1 break-words whitespace-pre-line"
                    style={{ wordBreak: "break-word" }}
                  >
                    <span>
                      {language === "ar"
                        ? getBookTranslation(language, book.writerName)
                        : book.writerNameEn
                        ? book.writerNameEn
                        : getWriterTranslation(language, book.writerName)}
                    </span>
                    {book.writerDeath && (
                      <>
                        <span>•</span>
                        <span className="text-purple-600">
                          {book.writerDeath}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="relative shrink-0">
              <LanguageSelector
                currentLanguage={language}
                onLanguageChange={handleLanguageChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Book Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-purple-200/50 shadow-xl"
        >
          <div className="flex flex-col gap-10 lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8 lg:space-x-reverse">
            <div className="relative">
              <div className="w-24 h-32 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                <img
                  src={`/assets/${book.bookSlug}.jpeg`}
                  alt={book.bookName}
                  className="w-full h-full object-cover rounded-2xl"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <BookOpen className="w-12 h-12 text-white hidden" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="flex-1 w-[100%]">
              <h2 className="text-3xl font-cairo font-bold text-gray-900 mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {language === "ar"
                  ? getBookTranslation(language, book.bookName)
                  : book.bookNameEn
                  ? book.bookNameEn
                  : getBookTranslation(language, book.bookName)}
              </h2>
              <p className="text-gray-600 mb-4 text-lg">
                {language === "ar"
                  ? getBookTranslation(language, book.writerName)
                  : book.writerNameEn
                  ? book.writerNameEn
                  : getWriterTranslation(language, book.writerName)}
                {book.writerDeath && (
                  <span className="text-purple-600 ml-2">
                    ({book.writerDeath})
                  </span>
                )}
              </p>

              <div className="grid grid-cols-3 lg:grid-cols-4 font-cairo gap-4">
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-800">
                    {book.hadiths_count}
                  </div>
                  <div className="text-sm text-purple-600">
                    {getTranslation(language, "hadiths")}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {book.chapters_count}
                  </div>
                  <div className="text-sm text-blue-600">
                    {getTranslation(language, "chapters")}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-800">100%</div>
                  <div className="text-sm text-green-600">
                    {getTranslation(language, "available")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        {/* Enhanced Search and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 mb-8 border border-purple-200/50 shadow-xl"
        >
          <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-6 lg:space-x-reverse">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={getTranslation(language, "searchPlaceholder")}
                className="w-full pl-12 pr-4 py-4 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-lg"
              />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-xl transition-all ${
                  viewMode === "grid"
                    ? "bg-purple-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-purple-100"
                }`}
              >
                <div className="w-5 h-5 grid grid-cols-2 gap-1">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>

              <button
                onClick={() => setViewMode("list")}
                className={`p-3 rounded-xl transition-all ${
                  viewMode === "list"
                    ? "bg-purple-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-purple-100"
                }`}
              >
                <div className="w-5 h-5 space-y-1">
                  <div className="w-full h-1 bg-current rounded-sm"></div>
                  <div className="w-full h-1 bg-current rounded-sm"></div>
                  <div className="w-full h-1 bg-current rounded-sm"></div>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
        {/* Enhanced Chapters Display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }`}
        >
          {filteredChapters.map((chapter, index) => (
            <motion.div key={index}>
              <Link
                to={
                  book?.isLocal
                    ? `/islamic-library/local-books/${bookSlug}/chapter/${chapter.chapterNumber}`
                    : `/islamic-library/book/${bookSlug}/chapter/${chapter.chapterNumber}`
                }
                className={`block group transition-all  ${
                  viewMode === "grid"
                    ? "bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-purple-200/50 shadow-xl hover:shadow-2xl"
                    : "bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-purple-200/50 shadow-lg hover:shadow-xl"
                }`}
              >
                <div
                  className={`${
                    viewMode === "grid"
                      ? "text-center"
                      : "flex items-center space-x-4 space-x-reverse"
                  }`}
                >
                  <div
                    className={`relative ${
                      viewMode === "grid" ? "mx-auto mb-4" : ""
                    }`}
                  >
                    <div
                      className={`bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg ${
                        viewMode === "grid" ? "w-16 h-16" : "w-12 h-12"
                      }`}
                    >
                      <Hash
                        className={`text-white ${
                          viewMode === "grid" ? "w-8 h-8" : "w-6 h-6"
                        }`}
                      />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-xs font-bold text-white">
                        {chapter.chapterNumber}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`flex-1 ${
                      viewMode === "grid" ? "text-center" : ""
                    }`}
                  >
                    <h3
                      className={`font-cairo font-bold text-gray-900 mb-2 line-clamp-2 ${
                        viewMode === "grid" ? "text-lg" : "text-xl"
                      }`}
                    >
                      {language === "ar"
                        ? chapter.chapterArabic
                        : language === "en"
                        ? chapter.chapterEnglish
                        : chapter.chapterUrdu}
                    </h3>

                    <div
                      className={`flex items-center justify-between text-sm text-gray-500 ${
                        viewMode === "grid" ? "flex-col space-y-2" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
                          {getTranslation(language, "chapter")}{" "}
                          {chapter.chapterNumber}
                        </span>
                        <span className="flex items-center space-x-1 space-x-reverse">
                          <Eye className="w-4 h-4" />
                          <span>{getTranslation(language, "available")}</span>
                        </span>
                      </div>

                      {viewMode === "list" && (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleShare(chapter);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {viewMode === "grid" && (
                  <div className="mt-4 pt-4 border-t border-purple-100">
                    <div className="flex items-center justify-center space-x-4 space-x-reverse">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleShare(chapter);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </div>
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced No Results */}
        {filteredChapters.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-cairo font-bold text-gray-600 mb-4">
              {getTranslation(language, "noResults")}
            </h3>
            <p className="text-gray-500 text-lg">
              {getTranslation(language, "tryDifferentSearch")}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default IslamicBookPage;
