import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Hash,
  Share2,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
} from "lucide-react";
import LanguageSelector from "../components/LanguageSelector";
import {
  getTranslation,
  getBookTranslation,
  getWriterTranslation,
} from "../utils/translations";
import toast from "react-hot-toast";

const SmallBookPage = () => {
  const { bookSlug } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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
      const bookResponse = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/islamic-library/small-books/${bookSlug}`
      );
      const bookData = await bookResponse.json();
      if (bookData.status === 200) {
        setBook(bookData.book);
        setHadiths(bookData.book.hadiths);
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

  const filteredHadiths = hadiths.filter((hadith) => {
    const searchText = searchTerm.toLowerCase();
    const hadithText = language === "ar" ? hadith.arabic : hadith.english.text;
    return (
      hadithText?.toLowerCase().includes(searchText) ||
      hadith.english.narrator?.toLowerCase().includes(searchText) ||
      hadith.idInBook?.toString().includes(searchText)
    );
  });

  const handleHadithSelect = (hadith) => {
    navigate(`/islamic-library/small-books/${bookSlug}/hadiths/${hadith.id}`);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/islamic-library/small-books/${bookSlug}`;
    if (navigator.share) {
      navigator.share({
        title: getBookTranslation(language, book?.bookName),
        text: `${getTranslation(language, "book")} ${getBookTranslation(
          language,
          book?.bookName
        )}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const handleCopyHadith = (hadith) => {
    const text = language === "ar" ? hadith.arabic : hadith.english.text;
    navigator.clipboard.writeText(text);
    toast.success(getTranslation(language, "hadithCopied"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <Hash className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-cairo font-semibold text-gray-600 mb-2">
              {getTranslation(language, "bookNotFound")}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br  from-purple-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-purple-200/50 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Link
                to="/islamic-library/small-books"
                className="flex items-center space-x-2 space-x-reverse text-purple-600 hover:text-purple-700 transition-all hover:scale-105"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-cairo font-medium text-sm sm:text-base">
                  {getTranslation(language, "back")}
                </span>
              </Link>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2 sm:space-x-4 space-x-reverse"
              >
                <div className="relative">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Hash className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-6 sm:h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Star className="w-1.5 h-1.5 sm:w-3 sm:h-3 text-white" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-cairo font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {language === "ar"
                      ? getBookTranslation(language, book.bookName)
                      : book.bookNameEn
                      ? book.bookNameEn
                      : getBookTranslation(language, book.bookName)}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 flex flex-wrap items-center space-x-1 sm:space-x-2 space-x-reverse">
                    <span className="truncate">
                      {language === "ar"
                        ? getBookTranslation(language, book.writerName)
                        : book.writerNameEn
                        ? book.writerNameEn
                        : getWriterTranslation(language, book.writerName)}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-purple-600">
                      {getTranslation(language, "fortyHadiths")}
                    </span>
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse">
              <button
                onClick={handleShare}
                className="p-2 sm:p-3 text-gray-400 hover:text-green-600 transition-colors bg-white/50 rounded-xl"
                title={getTranslation(language, "share")}
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="relative">
                <LanguageSelector
                  currentLanguage={language}
                  onLanguageChange={handleLanguageChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8">
        {/* Enhanced Book Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-3 sm:p-8 mb-4 sm:mb-8 border border-purple-200/50 shadow-xl"
        >
          <div className="flex flex-col lg:flex-row items-center space-y-3 sm:space-y-6 lg:space-y-0 lg:space-x-8 lg:space-x-reverse">
            <div className="relative">
              <div className="w-16 h-16 sm:w-24 sm:h-32 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Hash className="w-6 h-6 sm:w-12 sm:h-12 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xs sm:text-sm font-bold text-white">
                  40
                </span>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-cairo font-bold text-gray-900 mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {getBookTranslation(language, book.bookName)}
              </h2>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {getWriterTranslation(language, book.writerName)}
              </p>

              <div className="grid grid-cols-2 gap-2 sm:gap-4 font-cairo max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-2 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-purple-800">
                    {book.hadiths_count}
                  </div>
                  <div className="text-xs sm:text-sm text-purple-600">
                    {getTranslation(language, "hadith")}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl p-2 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-indigo-800">
                    100%
                  </div>
                  <div className="text-xs sm:text-sm text-indigo-600">
                    {getTranslation(language, "trusted")}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-2 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-purple-800">
                    {getTranslation(language, "easyToMemorize")}
                  </div>
                  <div className="text-xs sm:text-sm text-purple-600">
                    {getTranslation(language, "easyToMemorize")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl font-cario rounded-3xl p-3 sm:p-6 mb-4 sm:mb-8 border border-purple-200/50 shadow-xl"
        >
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={getTranslation(language, "searchInHadiths")}
              className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-4 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-lg"
            />
          </div>
        </motion.div>

        {/* Enhanced Hadiths Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 gap-3 sm:gap-6"
        >
          {filteredHadiths.map((hadith, index) => (
            <motion.div
              key={hadith.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-purple-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group">
                {/* Hadith Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      <span className="font-cairo font-bold text-white text-sm">
                        {hadith.idInBook}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-cairo font-semibold text-gray-900 text-base">
                        {getTranslation(language, "hadith")} {hadith.idInBook}
                      </h3>
                      <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500">
                        <span className="flex items-center space-x-1 space-x-reverse">
                          <Heart className="w-3 h-3 text-red-500" />
                          <span>مختار</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyHadith(hadith);
                      }}
                      className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHadithSelect(hadith);
                      }}
                      className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Hadith Text Preview */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-6 border border-gray-200">
                  {language === "ar" ? (
                    <p className="text-lg sm:text-xl leading-relaxed text-gray-800 amiri-regular line-clamp-3">
                      {hadith.arabic.substring(0, 420) + "..."}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {hadith.english?.text ? (
                        <p className="text-lg sm:text-xl leading-relaxed text-gray-800 line-clamp-3">
                          {hadith.english.text.substring(0, 420) + "..."}
                        </p>
                      ) : (
                        <>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <div className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center">
                                <span className="text-yellow-600 text-xs">
                                  !
                                </span>
                              </div>
                              <p className="text-xs font-medium text-yellow-800">
                                {getTranslation(
                                  language,
                                  "englishTranslationNotAvailable"
                                )}
                              </p>
                            </div>
                          </div>
                          <p className="text-lg sm:text-xl leading-relaxed text-gray-800 amiri-regular line-clamp-3">
                            {hadith.arabic.substring(0, 420) + "..."}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-center pt-4 border-t border-purple-100">
                  <button
                    onClick={() => handleHadithSelect(hadith)}
                    className="flex items-center space-x-2 space-x-reverse text-purple-600 hover:text-purple-700 transition-colors font-semibold text-sm"
                  >
                    <span>{getTranslation(language, "readHadith")}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced No Results */}
        {filteredHadiths.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Hash className="w-12 h-12 text-gray-400" />
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

export default SmallBookPage;
