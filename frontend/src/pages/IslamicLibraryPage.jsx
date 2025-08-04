import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import BookCard from "../components/BookCard";
import LanguageSelector from "../components/LanguageSelector";
import IslamicLibraryStats from "../components/IslamicLibraryStats";
import IslamicLibraryTutorial from "../components/IslamicLibraryTutorial";
import FloatingHelpButton from "../components/FloatingHelpButton";
import { getTranslation, getBookTranslation } from "../utils/translations";
import { toast } from "react-toastify";
import WelcomeBanner from "../components/WelcomeBanner";
import SEO from "../components/SEO";

const IslamicLibraryPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState({});
  const [allBooks, setAllBooks] = useState([]);
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBookFilter, setSelectedBookFilter] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");
  const [selectedChapterFilter, setSelectedChapterFilter] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("kutub_tisaa");
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("islamicLibraryLanguage") || "ar";
  });
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(() => {
    return localStorage.getItem("hasSeenIslamicLibraryTutorial") === "true";
  });

  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/islamic-library/books`
      );
      const data = await response.json();
      if (data.status === 200) {
        setCategories(data.categories);
        setAllBooks(data.allBooks);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem("islamicLibraryLanguage", newLanguage);
  };

  const handleStartTutorial = () => {
    setShowTutorial(true);
  };

  const handleCompleteTutorial = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem("hasSeenIslamicLibraryTutorial", "true");
    toast.success(getTranslation(language, "tutorialCompleted"));
  };

  const handleSkipTutorial = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem("hasSeenIslamicLibraryTutorial", "true");
  };
  const handleDismissWelcome = () => {
    setHasSeenTutorial(true);
    localStorage.setItem("hasSeenIslamicLibraryTutorial", "true");
  };

  // SEO Structured Data for Islamic Library
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Library",
    "name": "المكتبة الإسلامية - مشكاة",
    "alternateName": "Islamic Library - Meshkah",
    "description": "مكتبة إسلامية شاملة تحتوي على كتب الحديث النبوي الشريف والعلوم الإسلامية، مع إمكانية البحث والتصفح باللغتين العربية والإنجليزية",
    "url": window.location.href,
    "sameAs": [
      "https://hadith-shareef.com",
      "https://twitter.com/mishkahcom1",
      "https://facebook.com/mishkahcom1"
    ],
    "hasPart": allBooks.map(book => ({
      "@type": "Book",
      "name": book.title,
      "description": book.description || `كتاب ${book.title} في الحديث النبوي الشريف`,
      "author": {
        "@type": "Person",
        "name": book.author || "مؤلف إسلامي"
      },
      "isbn": book.id,
      "numberOfPages": book.chapters?.length || 0,
      "inLanguage": language === "ar" ? "ar" : "en",
      "genre": "Islamic Literature",
      "subject": "Hadith"
    })),
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${window.location.origin}/islamic-library?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "مشكاة",
      "url": "https://hadith-shareef.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://hadith-shareef.com/logo.svg"
      }
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "SA",
      "addressLocality": "الرياض"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "Meshkah@hadith-shareef.com"
    }
  };

  // SEO Metadata
  const seoData = {
    title: language === "ar" 
      ? "المكتبة الإسلامية - مشكاة | كتب الحديث النبوي الشريف" 
      : "Islamic Library - Meshkah | Hadith Books Collection",
    description: language === "ar"
      ? "استكشف المكتبة الإسلامية الشاملة لمشكاة. تصفح كتب الحديث النبوي الشريف، الصحاح الستة، والعلوم الإسلامية. بحث متقدم وترجمة للغتين العربية والإنجليزية."
      : "Explore Meshkah's comprehensive Islamic library. Browse Hadith books, the Six Authentic Collections, and Islamic sciences. Advanced search with Arabic and English translations.",
    keywords: language === "ar"
      ? "مكتبة إسلامية, كتب الحديث, الصحاح الستة, البخاري, مسلم, أبو داود, الترمذي, النسائي, ابن ماجة, مشكاة, علوم إسلامية, حديث نبوي"
      : "Islamic library, Hadith books, Six Authentic Collections, Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah, Meshkah, Islamic sciences, Prophet's sayings",
    canonicalUrl: `${window.location.origin}/islamic-library`,
    ogImage: "https://hadith-shareef.com/logo.svg",
    alternateLanguages: [
      { hrefLang: "ar", href: `${window.location.origin}/islamic-library?lang=ar` },
      { hrefLang: "en", href: `${window.location.origin}/islamic-library?lang=en` },
      { hrefLang: "x-default", href: `${window.location.origin}/islamic-library` }
    ],
    structuredData
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setSearchLoading(true);
      setShowSearchResults(true);

      // Build search parameters
      const searchParams = new URLSearchParams();

      // Add search term based on language
      if (language === "ar") {
        searchParams.append("hadithArabic", searchTerm);
      } else if (language === "en") {
        searchParams.append("hadithEnglish", searchTerm);
      } else if (language === "ur") {
        searchParams.append("hadithUrdu", searchTerm);
      }

      // Add filters
      if (selectedBookFilter) {
        searchParams.append("book", selectedBookFilter);
      }
      if (selectedStatusFilter) {
        searchParams.append("status", selectedStatusFilter);
      }
      if (selectedChapterFilter) {
        searchParams.append("chapter", selectedChapterFilter);
      }

      // Add pagination
      searchParams.append("paginate", "25");

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/islamic-library/hadiths?${searchParams.toString()}`
      );

      const data = await response.json();

      if (data.status === 200) {
        setHadiths(data.hadiths?.data || []);
      } else if (data.status === 404) {
        // Handle case when no hadiths found
        setHadiths([]);
        // Don't show error toast for 404, just show no results message
      } else {
        console.error("API returned error:", data);
        setHadiths([]);
        toast.error(getTranslation(language, "searchError"));
      }
    } catch (error) {
      console.error("Error searching hadiths:", error);
      setHadiths([]);
      toast.error(getTranslation(language, "searchError"));
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSelectedBookFilter("");
    setSelectedStatusFilter("");
    setSelectedChapterFilter("");
    setShowSearchResults(false);
    setHadiths([]);
  };

  // Get books for selected category
  const getBooksForCategory = (categoryId) => {
    return categories[categoryId]?.books || [];
  };

  // Get current category books
  const currentCategoryBooks = getBooksForCategory(selectedCategory);

  // تعديل فلترة الكتب - لا تفلتر بناءً على searchTerm
  const filteredBooks = currentCategoryBooks.filter((book) => {
    // فقط فلتر بناءً على selectedBookFilter

    const matchesBookFilter =
      !selectedBookFilter || book.bookSlug === selectedBookFilter;
    return matchesBookFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 sm:py-20">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-sm sm:text-base">
              {getTranslation(language, "loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO {...seoData} />
      <div
        className="min-h-screen bg-gradient-to-br from-purple-50 font-cairo to-blue-50 "
        dir={language === "ar" ? "rtl" : "ltr"}
        lang={language}
      >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-purple-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            {/* Title Section */}
            <div className="flex items-center justify-between sm:justify-start">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-cairo font-bold text-gray-900">
                  {getTranslation(language, "libraryTitle")}
                </h1>
              </motion.div>
            </div>

            {/* Actions Section */}
            <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 space-x-reverse">
              <Link
                to="/islamic-bookmarks"
                className="group relative inline-flex items-center space-x-2 space-x-reverse px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-600 text-white rounded-lg font-cairo font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:bg-purple-700 transform hover:scale-105 text-xs sm:text-sm overflow-hidden border border-purple-200/50 backdrop-blur-sm"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Icon */}
                <Bookmark className="w-3 h-3 sm:w-4 sm:h-4 relative z-10" />

                {/* Text */}
                <span className="hidden sm:inline relative z-10">
                  {getTranslation(language, "myBookmarks")}
                </span>
                <span className="sm:hidden relative z-10">
                  {getTranslation(language, "bookmarks")}
                </span>

                {/* Star badge */}
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300 border-2 border-white">
                  <span className="text-[10px] sm:text-xs font-bold text-white">
                    ★
                  </span>
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </Link>

              <div className="relative flex items-center space-x-4 space-x-reverse">
                <Link
                  to="/islamic-library/help-support"
                  className="flex items-center space-x-2 space-x-reverse text-purple-600 hover:text-purple-700 transition-colors px-3 py-2 rounded-lg hover:bg-purple-50"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {getTranslation(language, "helpAndSupport")}
                  </span>
                </Link>
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
        {/* Welcome Banner for First-time Users */}
        {!hasSeenTutorial && (
          <WelcomeBanner
            language={language}
            onStartTutorial={handleStartTutorial}
            onDismiss={handleDismissWelcome}
          />
        )}

        {/* Library Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <IslamicLibraryStats language={language} />
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-purple-200/50 shadow-lg"
        >
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={getTranslation(language, "searchPlaceholder")}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
              />
            </div>

            {/* Filters Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                <span className="font-cairo font-medium text-gray-700 text-sm sm:text-base">
                  {getTranslation(language, "filters")}:
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 space-x-reverse text-purple-600 hover:text-purple-700 transition-colors text-sm sm:text-base px-3 py-2 rounded-lg hover:bg-purple-50"
              >
                <span>
                  {showFilters
                    ? getTranslation(language, "hideFilters")
                    : getTranslation(language, "showFilters")}
                </span>
                {showFilters ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col space-y-3 sm:flex-row sm:flex-wrap sm:items-center sm:space-y-0 sm:space-x-4 sm:space-x-reverse"
              >
                {/* Book Filter */}
                <select
                  value={selectedBookFilter}
                  onChange={(e) => setSelectedBookFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                >
                  <option value="">
                    {getTranslation(language, "selectBook")}
                  </option>
                  {allBooks.map((book, index) => (
                    <option key={index} value={book.bookSlug}>
                      {getBookTranslation(language, book.bookName)}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                >
                  <option value="">
                    {getTranslation(language, "selectGrade")}
                  </option>
                  <option value="Sahih">
                    {getTranslation(language, "sahih")}
                  </option>
                  <option value="Hasan">
                    {getTranslation(language, "hasan")}
                  </option>
                  <option value="Daif">
                    {getTranslation(language, "daif")}
                  </option>
                </select>

                {/* Clear Filters Button */}
                <button
                  type="button"
                  onClick={clearSearch}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base font-medium"
                >
                  {getTranslation(language, "clearAllFilters")}
                </button>
              </motion.div>
            )}
          </form>
        </motion.div>

        {/* Search Results */}
        {showSearchResults && (
          <div className="space-y-6">
            {/* Search Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-cairo font-bold text-gray-900">
                  {getTranslation(language, "searchResults")}
                </h2>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  {searchLoading
                    ? getTranslation(language, "searching")
                    : `${hadiths.length} ${getTranslation(
                        language,
                        "hadithsFound"
                      )}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSearchResults(false);
                  setSearchTerm("");
                  setHadiths([]);
                }}
                className="text-purple-600 hover:text-purple-800 transition-colors text-sm sm:text-base"
              >
                {getTranslation(language, "backToBooks")}
              </button>
            </div>

            {/* Loading State */}
            {searchLoading && (
              <div className="flex justify-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-purple-600"></div>
              </div>
            )}

            {/* No Results */}
            {!searchLoading && hadiths.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-cairo font-semibold text-gray-900 mb-2">
                  {getTranslation(language, "noResults")}
                </h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  {getTranslation(language, "tryDifferentKeywords")}
                </p>
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-gray-500">
                    {getTranslation(language, "searchTips")}
                  </p>
                  <ul className="text-xs sm:text-sm text-gray-500 space-y-1">
                    <li>• {getTranslation(language, "searchTip1")}</li>
                    <li>• {getTranslation(language, "searchTip2")}</li>
                    <li>• {getTranslation(language, "searchTip3")}</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setShowSearchResults(false);
                    setSearchTerm("");
                    setHadiths([]);
                  }}
                  className="mt-4 sm:mt-6 bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                >
                  {getTranslation(language, "backToBooks")}
                </button>
              </div>
            )}

            {/* Hadiths List */}
            {!searchLoading && hadiths.length > 0 && (
              <div className="grid gap-3 sm:gap-4">
                {hadiths.map((hadith, index) => (
                  <div
                    key={index}
                    className="bg-white/80 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-purple-200/50 shadow-md cursor-pointer hover:shadow-lg transition-all"
                    onClick={() =>
                      navigate(`/islamic-library/hadith/${hadith.id}`)
                    }
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="font-cairo font-bold text-purple-800 text-xs sm:text-sm">
                            {hadith.hadithNumber}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-cairo font-semibold text-gray-900 text-sm sm:text-base">
                            {getTranslation(language, "hadith")}{" "}
                            {hadith.hadithNumber}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            {hadith.volume && (
                              <span>
                                {getTranslation(language, "volume")}{" "}
                                {hadith.volume}
                              </span>
                            )}
                            {hadith.status && (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  hadith.status === "Sahih"
                                    ? "bg-green-100 text-green-800"
                                    : hadith.status === "Hasan"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {getTranslation(
                                  language,
                                  hadith.status.toLowerCase()
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hadith Text */}
                    <div className="mb-3 sm:mb-4">
                      <p className="text-gray-800 leading-relaxed text-sm sm:text-base line-clamp-3">
                        {language === "ar"
                          ? hadith.hadithArabic
                          : language === "en"
                          ? hadith.hadithEnglish
                          : hadith.hadithUrdu}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      {hadith.book && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {getBookTranslation(language, hadith.book.bookName)}
                        </span>
                      )}
                      {hadith.chapter && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {language === "ar"
                            ? hadith.chapter.chapterArabic
                            : language === "en"
                            ? hadith.chapter.chapterEnglish
                            : hadith.chapter.chapterUrdu}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Category Tabs */}
        {!showSearchResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              {Object.keys(categories).map((categoryId, index) => {
                const category = categories[categoryId];
                const isActive = selectedCategory === categoryId;
                const bookCount = category.books?.length || 0;

                return (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedCategory(categoryId)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-cairo font-bold transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-500/30"
                        : "bg-white/90 backdrop-blur-xl text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 border-2 border-purple-200/50 hover:border-purple-300/70 shadow-lg hover:shadow-xl"
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                      <span className="text-sm sm:text-lg">
                        {language === "ar"
                          ? category.name
                          : language === "en"
                          ? category.nameEn
                          : category.nameUr}
                      </span>
                      <span className="text-xs opacity-80">
                        {bookCount} {getTranslation(language, "book")}
                      </span>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeCategory"
                        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-white rounded-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Enhanced Category Description */}
        {!showSearchResults && categories[selectedCategory] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl border-2 border-purple-200/50 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-cairo font-bold text-gray-900 mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {language === "ar"
                    ? categories[selectedCategory].name
                    : language === "en"
                    ? categories[selectedCategory].nameEn
                    : categories[selectedCategory].nameUr}
                </h3>
                <p className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">
                  {language === "ar"
                    ? categories[selectedCategory].description
                    : language === "en"
                    ? categories[selectedCategory].descriptionEn
                    : categories[selectedCategory].descriptionUr}
                </p>
              </div>
            </div>

            {/* Category Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-purple-800">
                  {categories[selectedCategory].books?.length || 0}
                </div>
                <div className="text-xs sm:text-sm text-purple-600 font-semibold">
                  {getTranslation(language, "book")}
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-blue-800">
                  {getTranslation(language, "authentic")}
                </div>
                <div className="text-xs sm:text-sm text-blue-600 font-semibold">
                  {getTranslation(language, "quality")}
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 text-center sm:col-span-1 col-span-2">
                <div className="text-lg sm:text-2xl font-bold text-green-800">
                  100%
                </div>
                <div className="text-xs sm:text-sm text-green-600 font-semibold">
                  {getTranslation(language, "available")}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Books Grid */}
        {!showSearchResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 sm:space-y-8"
          >
            {/* Books Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-cairo font-bold text-gray-900 mb-2">
                  {getTranslation(language, "availableBooks")}
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  {filteredBooks.length}{" "}
                  {getTranslation(language, "booksFound")}
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex items-center justify-center sm:justify-end">
                <div className="flex items-center space-x-2 space-x-reverse bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-purple-200/50">
                  <button className="p-2 rounded-lg bg-purple-100 text-purple-700">
                    <div className="w-4 h-4 grid grid-cols-2 gap-1">
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {filteredBooks.map((book, index) => (
                <motion.div key={index}>
                  <BookCard book={book} language={language} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* No Results for Books */}
        {!showSearchResults && filteredBooks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 sm:py-20"
          >
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-cairo font-semibold text-gray-900 mb-2">
              {getTranslation(language, "noResults")}
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              {getTranslation(language, "tryDifferentKeywords")}
            </p>
            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-gray-500">
                {getTranslation(language, "searchTips")}
              </p>
              <ul className="text-xs sm:text-sm text-gray-500 space-y-1">
                <li>• {getTranslation(language, "searchTip1")}</li>
                <li>• {getTranslation(language, "searchTip2")}</li>
                <li>• {getTranslation(language, "searchTip3")}</li>
              </ul>
            </div>
            <button
              onClick={() => {
                setShowSearchResults(false);
                setSearchTerm("");
                setHadiths([]);
              }}
              className="mt-4 sm:mt-6 bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
            >
              {getTranslation(language, "backToBooks")}
            </button>
          </motion.div>
        )}
      </div>

      {/* Tutorial System */}
      {showTutorial && (
        <IslamicLibraryTutorial
          language={language}
          onComplete={handleCompleteTutorial}
          onSkip={handleSkipTutorial}
        />
      )}

      {/* Floating Help Button */}
      <FloatingHelpButton
        language={language}
        onStartTutorial={handleStartTutorial}
      />
    </div>
    </>
  );
};

export default IslamicLibraryPage;
