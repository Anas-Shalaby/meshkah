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
import { searchIslamicLibrary, getIslamicLibrarySuggestions, getIslamicLibrarySearchStats } from "../services/api";

// Local books configuration for navigation
const LOCAL_BOOKS = {
  nawawi40: { bookSlug: "nawawi40", isLocal: true },
  qudsi40: { bookSlug: "qudsi40", isLocal: true },
  aladab_almufrad: { bookSlug: "aladab_almufrad", isLocal: true },
  shamail_muhammadiyah: { bookSlug: "shamail_muhammadiyah", isLocal: true },
  hisnul_muslim: { bookSlug: "hisnul_muslim", isLocal: true },
  bulugh_al_maram: { bookSlug: "bulugh_al_maram", isLocal: true },
  malik: { bookSlug: "malik", isLocal: true },
  darimi: { bookSlug: "darimi", isLocal: true },
  riyad_assalihin: { bookSlug: "riyad_assalihin", isLocal: true },
};

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
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedNarrator, setSelectedNarrator] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [searchStats, setSearchStats] = useState(null);

  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    fetchBooks();
  }, []);

  // Fetch search stats on mount
  useEffect(() => {
    getIslamicLibrarySearchStats().then((data) => setSearchStats(data.stats)).catch(() => {});
  }, []);

  // Suggestions handler
  useEffect(() => {
    if (searchTerm.length > 1) {
      getIslamicLibrarySuggestions({ q: searchTerm, type: "all" })
        .then((data) => setSuggestions(data.suggestions))
        .catch(() => setSuggestions([]));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

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

  const normalizeArabicText = (text) => {
    if (!text) return '';
    return text
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '') // Remove tashkeel
      .replace(/[أإآ]/g, 'ا') // Normalize alef variations
      .replace(/[يى]/g, 'ي') // Normalize yaa variations
      .replace(/[ةه]/g, 'ه') // Normalize taa marbouta and haa
      .replace(/[ؤئ]/g, 'و') // Normalize waw variations
      .trim();
  };

  // Enhanced search handler
  const handleSearch = async (e) => {
    e.preventDefault();
    
    // Check if there's any search criteria
    const hasSearchCriteria = searchTerm.trim() || selectedBookFilter || selectedNarrator || selectedCategoryFilter || selectedStatusFilter || selectedChapterFilter;
    
    if (!hasSearchCriteria) {
      toast.warning(getTranslation(language, "pleaseEnterSearchCriteria"));
      return;
    }

    try {
      setSearchLoading(true);
      setShowSearchResults(true);
      
      // Normalize search term if it's Arabic
      const normalizedSearchTerm = language === 'ar' ? normalizeArabicText(searchTerm.trim()) : searchTerm.trim();
      
      // Show feedback if normalization was applied
      if (language === 'ar' && searchTerm.trim() !== normalizedSearchTerm) {
        console.log('Arabic text normalized for search:', searchTerm.trim(), '→', normalizedSearchTerm);
      }
      
      const params = {
        q: normalizedSearchTerm,
        book: selectedBookFilter,
        category: selectedCategoryFilter,
        narrator: selectedNarrator,
        status: selectedStatusFilter,
        chapter: selectedChapterFilter,
        paginate: 25,
        page: 1,
      };
      const data = await searchIslamicLibrary(params);
      if (data.status === 200) {
        setHadiths(data.search?.results?.data || data.hadiths?.data || []);
      } else {
        setHadiths([]);
        toast.error(getTranslation(language, "searchError"));
      }
    } catch (error) {
      setHadiths([]);
      toast.error(getTranslation(language, "searchError"));
    } finally {
      setSearchLoading(false);
    }
  };

  // Suggestion click handler
  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === "narrator") {
      setSelectedNarrator(suggestion.value);
      setSearchTerm("");
    } else if (suggestion.type === "book") {
      setSelectedBookFilter(suggestion.bookSlug);
      setSearchTerm("");
    } else if (suggestion.type === "chapter") {
      setSelectedChapterFilter(suggestion.chapterId);
      setSearchTerm("");
    } else {
      setSearchTerm(suggestion.value);
    }
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSelectedBookFilter("");
    setSelectedStatusFilter("");
    setSelectedChapterFilter("");
    setSelectedNarrator("");
    setSelectedCategoryFilter("");
    setShowSearchResults(false);
    setHadiths([]);
    setSuggestions([]);
    setShowSuggestions(false);
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
            {/* Enhanced Search Bar with Suggestions */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchTerm.length > 1 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder={language === "ar" 
                  ? getTranslation(language, "searchInArabic")
                  : getTranslation(language, "searchPlaceholder")}
                className="w-full pl-10 sm:pl-12 pr-20 py-3 sm:py-4 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                dir={language === "ar" ? "rtl" : "ltr"}
              />
              
              {/* Search Button */}
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                {getTranslation(language, "search")}
              </button>
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-purple-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className={`w-2 h-2 rounded-full ${
                          suggestion.type === 'narrator' ? 'bg-blue-500' :
                          suggestion.type === 'book' ? 'bg-green-500' :
                          suggestion.type === 'chapter' ? 'bg-purple-500' : 'bg-gray-500'
                        }`}></div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{suggestion.value}</div>
                          <div className="text-xs text-gray-500">
                            {suggestion.type === 'narrator' && `${getTranslation(language, 'narrator')} - ${suggestion.book}`}
                            {suggestion.type === 'book' && `${getTranslation(language, 'book')} - ${suggestion.category}`}
                            {suggestion.type === 'chapter' && `${getTranslation(language, 'chapter')} - ${suggestion.book}`}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
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

            {/* Enhanced Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
              >
                {/* Book Filter */}
                <select
                  value={selectedBookFilter}
                  onChange={(e) => setSelectedBookFilter(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
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

                {/* Category Filter */}
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                >
                  <option value="">
                    {getTranslation(language, "selectCategory")}
                  </option>
                  {Object.keys(categories).map((categoryId) => {
                    const category = categories[categoryId];
                    return (
                      <option key={categoryId} value={categoryId}>
                        {language === "ar"
                          ? category.name
                          : language === "en"
                          ? category.nameEn
                          : category.nameUr}
                      </option>
                    );
                  })}
                </select>

                {/* Narrator Filter */}
                <input
                  type="text"
                  value={selectedNarrator}
                  onChange={(e) => setSelectedNarrator(e.target.value)}
                  placeholder={getTranslation(language, "narratorPlaceholder")}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                />

                {/* Status Filter */}
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
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

                {/* Chapter Filter */}
                <input
                  type="text"
                  value={selectedChapterFilter}
                  onChange={(e) => setSelectedChapterFilter(e.target.value)}
                  placeholder={getTranslation(language, "chapterPlaceholder")}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                />

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {/* Search with Filters Button */}
                  {(selectedBookFilter || selectedCategoryFilter || selectedNarrator || selectedStatusFilter || selectedChapterFilter) && (
                    <button
                      type="button"
                      onClick={handleSearch}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      {getTranslation(language, "search")}
                    </button>
                  )}
                  
                  {/* Clear Filters Button */}
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="flex-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium px-4 py-2"
                  >
                    {getTranslation(language, "clearAllFilters")}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>

        {/* Search Results */}
        {showSearchResults && (
          <div className="space-y-6">
            {/* Enhanced Search Header */}
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
                {/* Search Statistics */}
                {searchStats && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span>{getTranslation(language, "totalBooks")}: {searchStats.totalBooks}</span>
                    <span>{getTranslation(language, "totalHadiths")}: {searchStats.totalHadiths}</span>
                  </div>
                )}
                {/* Language Indicator */}
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {language === "ar" ? "العربية" : language === "en" ? "English" : "اردو"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSearchResults(false);
                  clearSearch();
                }}
                className="text-purple-600 hover:text-purple-800 transition-colors text-sm sm:text-base"
              >
                {getTranslation(language, "backToBooks")}
              </button>
            </div>

            {/* Loading State */}
            {searchLoading && (
              <div className="flex justify-center py-8 sm:py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {getTranslation(language, "searching")}...
                  </p>
                </div>
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
                    {language === "ar" && (
                      <>
                        <li>• {getTranslation(language, "arabicSearchTip1")}</li>
                        <li>• {getTranslation(language, "arabicSearchTip2")}</li>
                        <li>• {getTranslation(language, "arabicSearchTip3")}</li>
                      </>
                    )}
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setShowSearchResults(false);
                    clearSearch();
                  }}
                  className="mt-4 sm:mt-6 bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                >
                  {getTranslation(language, "backToBooks")}
                </button>
              </div>
            )}

            {/* Enhanced Hadiths List */}
            {!searchLoading && hadiths.length > 0 && (
              <div className="grid gap-4 sm:gap-6">
                {hadiths.map((hadith, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/80 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-purple-200/50 shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    onClick={() => {
                      // Check if it's a local book
                      const isLocalBook = hadith.bookSlug && LOCAL_BOOKS[hadith.bookSlug];
                      
                      if (isLocalBook) {
                        // Navigate to local book hadith page using hadithNumber
                        const hadithNumber = hadith.id
                        navigate(`/islamic-library/local-books/${hadith.bookSlug}/hadith/${hadithNumber}`);
                      } else {
                        // Navigate to API book hadith page using hadith ID
                        navigate(`/islamic-library/book/${hadith.bookSlug}/chapter/${hadith.chapter.chapterNumber}/hadith/${hadith.hadithNumber}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="font-cairo font-bold text-white text-sm sm:text-base">
                            {hadith.hadithNumber}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-cairo font-semibold text-gray-900 text-sm sm:text-base mb-1">
                            {getTranslation(language, "hadith")} {hadith.hadithNumber}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {hadith.volume && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {getTranslation(language, "volume")} {hadith.volume}
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
                            {hadith.bookSlug && LOCAL_BOOKS[hadith.bookSlug] && (
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                {getTranslation(language, "localBook")}
                              </span>
                            )}
                            {hadith.bookSlug && !LOCAL_BOOKS[hadith.bookSlug] && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {getTranslation(language, "apiBook")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Hadith Text */}
                    <div className="mb-4">
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                        {/* Arabic Text - Always show if available */}
                        {hadith.hadithArabic && (
                          <div className="mb-3">
                            <p className="text-gray-800 leading-relaxed text-sm sm:text-base line-clamp-3 font-cairo" dir="rtl">
                              {hadith.hadithArabic}
                            </p>
                          </div>
                        )}
                        
                        {/* English/Urdu Text - Show based on language preference */}
                        {(language === "en" || language === "ur") && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-gray-600 leading-relaxed text-sm sm:text-base line-clamp-3">
                              {language === "en"
                                ? hadith.hadithEnglish
                                : hadith.hadithUrdu}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Metadata */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {hadith.book && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {language === "ar" 
                            ? getBookTranslation(language, hadith.book.bookName)
                            : getBookTranslation(language, hadith.book.bookName)}
                        </span>
                      )}
                      {hadith.chapter && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          {language === "ar"
                            ? hadith.chapter.chapterArabic
                            : language === "en"
                            ? hadith.chapter.chapterEnglish
                            : hadith.chapter.chapterUrdu}
                        </span>
                      )}
                      {hadith.englishNarrator && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {language === "ar" 
                            ? hadith.englishNarrator 
                            : hadith.englishNarrator}
                        </span>
                      )}
                    </div>
                  </motion.div>
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
