import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Hash,
  Heart,
  MessageSquare,
  ChevronRight,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import LanguageSelector from "../components/LanguageSelector";
import {
  getTranslation,
  getBookTranslation,
  getWriterTranslation,
} from "../utils/translations";

const SmallBooksPage = () => {
  const [books, setBooks] = useState([]);
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
    fetchSmallBooks();
  }, []);

  const fetchSmallBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/islamic-library/small-books`
      );
      const data = await response.json();
      if (data.status === 200) {
        setBooks(data.books);
      }
    } catch (error) {
      console.error("Error fetching small books:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem("islamicLibraryLanguage", newLanguage);
  };

  const filteredBooks = books.filter((book) =>
    getBookTranslation(language, book.bookName)
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br  from-purple-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
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

  return (
    <div className="min-h-screen bg-gradient-to-br mt-10 from-purple-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-purple-200/50 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Link
                to="/islamic-library"
                className="flex items-center space-x-2 space-x-reverse text-purple-600 hover:text-purple-700 transition-all hover:scale-105"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
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
                    {getTranslation(language, "fortyBooks")}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 flex flex-wrap items-center space-x-1 sm:space-x-2 space-x-reverse">
                    <span className="truncate">
                      {getTranslation(language, "fortyHadithsCollection")}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-purple-600">
                      {getTranslation(language, "fortyHadiths")}
                    </span>
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center">
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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Enhanced Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 sm:p-8 mb-6 sm:mb-8 border border-purple-200/50 shadow-xl"
        >
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
              <Hash className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-cairo font-bold text-gray-900 mb-3 sm:mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {getTranslation(language, "fortyBooks")}
            </h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-lg max-w-2xl mx-auto">
              {getTranslation(language, "fortyHadithsDescription")}
            </p>

            <div className="grid grid-cols-2 gap-2 sm:gap-4 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-2 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-purple-800">
                  {books.length}
                </div>
                <div className="text-xs sm:text-sm text-purple-600">
                  {getTranslation(language, "bookCount")}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl p-2 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-indigo-800">
                  100%
                </div>
                <div className="text-xs sm:text-sm text-indigo-600">
                  {getTranslation(language, "reliability")}
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
        </motion.div>

        {/* Enhanced Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 mb-8 border border-green-200/50 shadow-xl"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={getTranslation(language, "searchInFortyBooks")}
              className="w-full pl-12 pr-4 py-4 border border-green-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-lg"
            />
          </div>
        </motion.div>

        {/* Enhanced Books Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8"
        >
          {filteredBooks.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/islamic-library/small-books/${book.bookSlug}`}
                className="block group transition-all duration-300 hover:scale-105"
              >
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 sm:p-8 border border-purple-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                  {/* Book Icon */}
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
                      <Hash className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-xs sm:text-sm font-bold text-white">
                        40
                      </span>
                    </div>
                  </div>

                  {/* Book Info */}
                  <div className="text-center mb-4 sm:mb-6">
                    <h3 className="font-cairo font-bold text-gray-900 text-lg sm:text-xl mb-2 sm:mb-3">
                      {language === "ar"
                        ? getBookTranslation(language, book.bookName)
                        : book.bookNameEn
                        ? book.bookNameEn
                        : getBookTranslation(language, book.bookName)}
                    </h3>
                    <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                      {language === "ar"
                        ? getBookTranslation(language, book.writerName)
                        : getWriterTranslation(language, book.writerName)}
                    </p>

                    {/* Features */}
                    <div className="flex items-center justify-center space-x-3 sm:space-x-4 space-x-reverse text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                      <span className="flex items-center space-x-1 space-x-reverse">
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                        <span>
                          {getTranslation(language, "selectedHadiths")}
                        </span>
                      </span>
                      <span className="flex items-center space-x-1 space-x-reverse">
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        <span>{getTranslation(language, "trustedSource")}</span>
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-2 sm:p-3 text-center">
                      <div className="text-base sm:text-lg font-bold text-purple-800">
                        {book.hadiths_count}
                      </div>
                      <div className="text-xs text-purple-600">
                        {getTranslation(language, "hadith")}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-2 sm:p-3 text-center">
                      <div className="text-base sm:text-lg font-bold text-blue-800">
                        {book.chapters_count}
                      </div>
                      <div className="text-xs text-blue-600">
                        {getTranslation(language, "chapter")}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-2 space-x-reverse text-purple-600 group-hover:text-purple-700 transition-colors">
                      <span className="font-semibold text-sm sm:text-base">
                        {getTranslation(language, "exploreBook")}
                      </span>
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced No Results */}
        {filteredBooks.length === 0 && (
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

export default SmallBooksPage;
