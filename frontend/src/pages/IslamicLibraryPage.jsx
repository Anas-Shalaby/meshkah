import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Bookmark,
  HelpCircle,
  BookOpen,
  Sparkles,
  Library,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import BookCard from "../components/BookCard";
import LanguageSelector from "../components/LanguageSelector";
import IslamicLibraryTutorial from "../components/IslamicLibraryTutorial";
import FloatingHelpButton from "../components/FloatingHelpButton";
import { getTranslation, getBookTranslation } from "../utils/translations";
import { toast } from "react-toastify";
import WelcomeBanner from "../components/WelcomeBanner";
import SEO from "../components/SEO";
import { useRamadanTheme } from "../context/RamadanThemeContext";
import { useTheme } from "../context/ThemeContext";
import RamadanCountdown from "../components/ramadan/RamadanCountdown";
import RamadanFloatingElements from "../components/ramadan/RamadanFloatingElements";
import {
  searchIslamicLibrary,
  getIslamicLibrarySuggestions,
  getIslamicLibrarySearchStats,
} from "../services/api";
import FullPageLoadingScreen from "../components/FullPageLoadingScreen";

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

// ——— Flat theme tokens (dark reference: #1a1c22 / #212328 / #e0e0e0 / #9e98db) ———
const TOKENS = {
  dark: {
    page: "#1a1c22",
    text: "text-[#e0e0e0]",
    card: "rounded-2xl border border-white/5 bg-[#212328]",
    cardSm: "rounded-xl border border-white/5 bg-[#212328]",
    soft: "rounded-2xl border border-white/5 bg-[#212328]",
    field:
      "w-full rounded-xl border-0 bg-[#1a1c22] px-4 py-3 text-sm text-[#e0e0e0] placeholder-white/30 outline-none ring-1 ring-white/5 transition focus:ring-2 focus:ring-[#9e98db]/50 sm:text-base",
    heroWrap: "rounded-3xl border border-white/5 bg-[#212328]",
    heroInput:
      "h-16 w-full rounded-2xl border-0 bg-[#1a1c22] text-base text-[#e0e0e0] outline-none ring-1 ring-white/5 transition focus:ring-2 focus:ring-[#9e98db]/50",
    strong: "text-[#e0e0e0]",
    muted: "text-white/50",
    faint: "text-white/35",
    faint2: "text-white/40",
    accentText: "text-[#9e98db]",
    accentIcon: "text-[#9e98db]",
    accentBg: "bg-[#9e98db]",
    onAccent: "text-[#1a1c22]",
    badge: "border border-[#9e98db]/25 bg-[#9e98db]/10 text-[#9e98db]",
    iconBtn:
      "bg-[#1a1c22] text-[#e0e0e0] ring-1 ring-white/5 hover:bg-[#16171c]",
    pillActive: "bg-[#1a1c22] text-[#9e98db] border-b-2 border-[#9e98db]",
    pillInactive:
      "text-white/45 hover:text-[#e0e0e0] border-b-2 border-transparent",
    countActive: "bg-[#9e98db]/15 text-[#9e98db]",
    countInactive: "bg-white/5 text-white/40",
    suggestionPanel: "border border-white/5 bg-[#212328] shadow-xl",
    suggestionHover: "hover:bg-white/5",
    textBox: "rounded-xl bg-[#1a1c22]",
    innerStat: "rounded-xl bg-[#1a1c22]",
    emptyIconWrap: "bg-[#1a1c22]",
    emptyIcon: "text-[#9e98db]",
    spinner: "border-white/10 border-t-[#9e98db]",
    divider: "border-white/10",
    chips: {
      sky: "bg-white/5 text-sky-300",
      emerald: "bg-white/5 text-emerald-300",
      amber: "bg-white/5 text-amber-300",
      lilac: "bg-[#9e98db]/10 text-[#9e98db]",
    },
  },
  light: {
    page: "#f4f4f7",
    text: "text-[#24242c]",
    card: "rounded-2xl border border-black/5 bg-white",
    cardSm: "rounded-xl border border-black/5 bg-white",
    soft: "rounded-2xl border border-black/5 bg-white",
    field:
      "w-full rounded-xl border-0 bg-[#f1f1f5] px-4 py-3 text-sm text-[#24242c] placeholder-gray-400 outline-none ring-1 ring-black/5 transition focus:ring-2 focus:ring-[#7440E9]/40 sm:text-base",
    heroWrap: "rounded-3xl border border-black/5 bg-white",
    heroInput:
      "h-16 w-full rounded-2xl border-0 bg-[#f1f1f5] text-base text-[#24242c] outline-none ring-1 ring-black/5 transition focus:ring-2 focus:ring-[#7440E9]/40",
    strong: "text-[#24242c]",
    muted: "text-gray-500",
    faint: "text-gray-400",
    faint2: "text-gray-400",
    accentText: "text-[#7440E9]",
    accentIcon: "text-[#7440E9]",
    accentBg: "bg-[#7440E9]",
    onAccent: "text-white",
    badge: "border border-[#7440E9]/20 bg-[#7440E9]/10 text-[#7440E9]",
    iconBtn:
      "bg-[#f1f1f5] text-[#24242c] ring-1 ring-black/5 hover:bg-[#e9e9f0]",
    pillActive: "bg-[#f1f1f5] text-[#7440E9] border-b-2 border-[#7440E9]",
    pillInactive:
      "text-gray-500 hover:text-[#24242c] border-b-2 border-transparent",
    countActive: "bg-[#7440E9]/15 text-[#7440E9]",
    countInactive: "bg-black/5 text-gray-400",
    suggestionPanel: "border border-black/5 bg-white shadow-xl",
    suggestionHover: "hover:bg-black/5",
    textBox: "rounded-xl bg-[#f6f6fa]",
    innerStat: "rounded-xl bg-[#f6f6fa]",
    emptyIconWrap: "bg-[#f1f1f5]",
    emptyIcon: "text-[#7440E9]",
    spinner: "border-black/10 border-t-[#7440E9]",
    divider: "border-gray-200",
    chips: {
      sky: "bg-blue-50 text-blue-700",
      emerald: "bg-emerald-50 text-emerald-700",
      amber: "bg-amber-50 text-amber-700",
      lilac: "bg-[#7440E9]/10 text-[#7440E9]",
    },
  },
};

const GOLD = "#ffc107";

const gridContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const gridItem = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const floatTransition = {
  duration: 6,
  repeat: Infinity,
  ease: "easeInOut",
};

const IslamicLibraryPage = () => {
  const navigate = useNavigate();
  const { isRamadanThemeActive } = useRamadanTheme();
  const { isNight } = useTheme();
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

  const t = isNight ? TOKENS.dark : TOKENS.light;
  const pageBg = t.page;
  const primaryBtn = `${t.accentBg} ${t.onAccent} transition hover:opacity-90`;

  // Update document language. Direction is applied on this page's own
  // container (below) so we avoid mutating the global <html> dir, which
  // would shift the fixed top navbar.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Keep the global root direction consistent with the rest of the app
  // (LTR root). Other Islamic pages flip <html dir="rtl">; reset it here so
  // the fixed top navbar isn't pushed/shrunk when landing on this page.
  useEffect(() => {
    document.documentElement.removeAttribute("dir");
  }, []);

  useEffect(() => {
    fetchBooks();
  }, []);

  // Fetch search stats on mount
  useEffect(() => {
    getIslamicLibrarySearchStats()
      .then((data) => setSearchStats(data.stats))
      .catch(() => {});
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
        `${import.meta.env.VITE_API_URL}/islamic-library/books`,
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
    name: "المكتبة الإسلامية - مشكاة",
    alternateName: "Islamic Library - Meshkah",
    description:
      "مكتبة إسلامية شاملة تحتوي على كتب الحديث النبوي الشريف والعلوم الإسلامية، مع إمكانية البحث والتصفح باللغتين العربية والإنجليزية",
    url: window.location.href,
    sameAs: [
      "https://hadith-shareef.com",
      "https://twitter.com/mishkahcom1",
      "https://facebook.com/mishkahcom1",
    ],
    hasPart: allBooks.map((book) => ({
      "@type": "Book",
      name: book.title,
      description:
        book.description || `كتاب ${book.title} في الحديث النبوي الشريف`,
      author: {
        "@type": "Person",
        name: book.author || "مؤلف إسلامي",
      },
      isbn: book.id,
      numberOfPages: book.chapters?.length || 0,
      inLanguage: language === "ar" ? "ar" : "en",
      genre: "Islamic Literature",
      subject: "Hadith",
    })),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${window.location.origin}/islamic-library?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "مشكاة الأحاديث",
      alternateName: "Meshkah",
      url: "https://hadith-shareef.com",
      logo: {
        "@type": "ImageObject",
        url: "https://hadith-shareef.com/logo.svg",
      },
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "SA",
      addressLocality: "الرياض",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "Meshkah@hadith-shareef.com",
    },
  };

  // SEO Metadata
  const seoData = {
    title:
      language === "ar"
        ? "المكتبة الإسلامية - مشكاة | كتب الحديث النبوي الشريف"
        : "Islamic Library - Meshkah | Hadith Books Collection",
    description:
      language === "ar"
        ? "استكشف المكتبة الإسلامية الشاملة لمشكاة. تصفح كتب الحديث النبوي الشريف، الصحاح الستة، والعلوم الإسلامية. بحث متقدم وترجمة للغتين العربية والإنجليزية."
        : "Explore Meshkah's comprehensive Islamic library. Browse Hadith books, the Six Authentic Collections, and Islamic sciences. Advanced search with Arabic and English translations.",
    keywords:
      language === "ar"
        ? "مكتبة إسلامية, كتب الحديث, الصحاح الستة, البخاري, مسلم, أبو داود, الترمذي, النسائي, ابن ماجة, مشكاة, علوم إسلامية, حديث نبوي"
        : "Islamic library, Hadith books, Six Authentic Collections, Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah, Meshkah, Islamic sciences, Prophet's sayings",
    canonicalUrl: `${window.location.origin}/islamic-library`,
    ogImage: "https://hadith-shareef.com/logo.svg",
    alternateLanguages: [
      {
        hrefLang: "ar",
        href: `${window.location.origin}/islamic-library`,
      },
      {
        hrefLang: "en",
        href: `${window.location.origin}/islamic-library?lang=en`,
      },
      {
        hrefLang: "x-default",
        href: `${window.location.origin}/islamic-library`,
      },
    ],
    structuredData,
  };

  const normalizeArabicText = (text) => {
    if (!text) return "";
    return text
      .replace(
        /[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g,
        "",
      ) // Remove tashkeel
      .replace(/[أإآ]/g, "ا") // Normalize alef variations
      .replace(/[يى]/g, "ي") // Normalize yaa variations
      .replace(/[ةه]/g, "ه") // Normalize taa marbouta and haa
      .replace(/[ؤئ]/g, "و") // Normalize waw variations
      .trim();
  };

  // Enhanced search handler
  const handleSearch = async (e) => {
    e.preventDefault();

    // Check if there's any search criteria
    const hasSearchCriteria =
      searchTerm.trim() ||
      selectedBookFilter ||
      selectedNarrator ||
      selectedCategoryFilter ||
      selectedStatusFilter ||
      selectedChapterFilter;

    if (!hasSearchCriteria) {
      toast.warning(getTranslation(language, "pleaseEnterSearchCriteria"));
      return;
    }

    try {
      setSearchLoading(true);
      setShowSearchResults(true);

      // Normalize search term if it's Arabic
      const normalizedSearchTerm =
        language === "ar"
          ? normalizeArabicText(searchTerm.trim())
          : searchTerm.trim();

      // Show feedback if normalization was applied
      if (language === "ar" && searchTerm.trim() !== normalizedSearchTerm) {
        console.log(
          "Arabic text normalized for search:",
          searchTerm.trim(),
          "→",
          normalizedSearchTerm,
        );
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

  const activeFilterCount = [
    selectedBookFilter,
    selectedCategoryFilter,
    selectedNarrator,
    selectedStatusFilter,
    selectedChapterFilter,
  ].filter(Boolean).length;

  const dashboardStats = [
    {
      icon: BookOpen,
      value: searchStats?.totalBooks ?? allBooks.length ?? 0,
      label: getTranslation(language, "totalBooks"),
    },
    {
      icon: Library,
      value: searchStats?.totalHadiths ?? "—",
      label: getTranslation(language, "totalHadiths"),
    },
    {
      icon: Layers,
      value: Object.keys(categories).length || 0,
      label: getTranslation(language, "filters"),
    },
    {
      icon: Sparkles,
      value: "100%",
      label: getTranslation(language, "available"),
    },
  ];

  if (loading) {
    return (
      <FullPageLoadingScreen message={getTranslation(language, "loading")} />
    );
  }

  return (
    <>
      <SEO {...seoData} />
      <div
        className={`islamic-library-page relative min-h-screen overflow-x-hidden font-cairo ${
          t.text
        } ${isRamadanThemeActive ? "ramadan-bg-gradient" : ""}`}
        style={isRamadanThemeActive ? undefined : { backgroundColor: pageBg }}
        dir={language === "ar" ? "rtl" : "ltr"}
        lang={language}
      >
        {/* Ramadan Theme Elements */}
        {isRamadanThemeActive && <RamadanCountdown />}
        {isRamadanThemeActive && <RamadanFloatingElements />}

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
          {/* ——— Top header (flat bar) ——— */}
          <div
            className={`${t.soft} mb-8 flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${t.accentBg}`}
              >
                <Library className={`h-6 w-6 ${t.onAccent}`} />
              </span>
              <div>
                <h1
                  className={`text-lg font-bold leading-tight sm:text-xl ${t.strong}`}
                >
                  {getTranslation(language, "libraryTitle")}
                </h1>
                <p className={`text-xs ${t.faint2}`}>
                  {language === "ar"
                    ? "العربية"
                    : language === "en"
                      ? "English"
                      : "اردو"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                to="/islamic-bookmarks"
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition sm:text-sm ${t.iconBtn}`}
              >
                <Bookmark className="h-5 w-5" style={{ color: GOLD }} />
                <span className="hidden sm:inline">
                  {getTranslation(language, "myBookmarks")}
                </span>
                <span className="sm:hidden">
                  {getTranslation(language, "bookmarks")}
                </span>
              </Link>

              <Link
                to="/islamic-library/help-support"
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium transition sm:text-sm ${t.iconBtn}`}
              >
                <HelpCircle className={`h-5 w-5 ${t.accentIcon}`} />
                <span className="hidden md:inline">
                  {getTranslation(language, "helpAndSupport")}
                </span>
              </Link>

              <LanguageSelector
                currentLanguage={language}
                onLanguageChange={handleLanguageChange}
              />
            </div>
          </div>

          {/* Welcome Banner for First-time Users */}
          {!hasSeenTutorial && (
            <WelcomeBanner
              language={language}
              onStartTutorial={handleStartTutorial}
              onDismiss={handleDismissWelcome}
            />
          )}

          {/* ——— HERO + SEARCH (flat #212328 card) ——— */}
          <section
            className={`relative mb-8 px-5 py-10 text-center sm:px-10 sm:py-14 ${t.heroWrap}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative mx-auto max-w-3xl"
            >
              <motion.span
                animate={{ y: [0, -6, 0] }}
                transition={floatTransition}
                className={`mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium ${t.badge}`}
              >
                <Sparkles className="h-4 w-4" style={{ color: GOLD }} />
                {getTranslation(language, "libraryTitle")}
              </motion.span>

              <h2
                className={`mb-3 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl ${t.strong}`}
              >
                {getTranslation(language, "availableBooks")}
              </h2>
              <p
                className={`mx-auto mb-8 max-w-xl text-sm sm:text-base ${t.muted}`}
              >
                {getTranslation(language, "searchTips")}
              </p>

              {/* Search form */}
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <Search
                    className={`pointer-events-none absolute top-1/2 ltr:left-5 rtl:right-5 h-6 w-6 -translate-y-1/2 ${t.accentIcon}`}
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() =>
                      searchTerm.length > 1 && setShowSuggestions(true)
                    }
                    onBlur={() =>
                      setTimeout(() => setShowSuggestions(false), 200)
                    }
                    onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
                    placeholder={
                      language === "ar"
                        ? getTranslation(language, "searchInArabic")
                        : getTranslation(language, "searchPlaceholder")
                    }
                    className={`${t.heroInput} ltr:pl-14 ltr:pr-32 rtl:pr-14 rtl:pl-32`}
                    dir={language === "ar" ? "rtl" : "ltr"}
                  />
                  <button
                    type="submit"
                    className={`absolute top-1/2 -translate-y-1/2 rounded-xl px-5 py-2.5 text-sm font-semibold ltr:right-3 rtl:left-3 ${primaryBtn}`}
                  >
                    {getTranslation(language, "search")}
                  </button>

                  {/* Suggestions Dropdown */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className={`absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl p-2 text-start ${t.suggestionPanel}`}
                      >
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start transition ${t.suggestionHover}`}
                          >
                            <span
                              className={`h-2 w-2 shrink-0 rounded-full ${
                                suggestion.type === "narrator"
                                  ? "bg-sky-400"
                                  : suggestion.type === "book"
                                    ? "bg-emerald-400"
                                    : suggestion.type === "chapter"
                                      ? "bg-[#9e98db]"
                                      : "bg-gray-400"
                              }`}
                            />
                            <span className="flex-1">
                              <span
                                className={`block text-sm font-medium ${t.strong}`}
                              >
                                {suggestion.value}
                              </span>
                              <span className={`block text-xs ${t.faint2}`}>
                                {suggestion.type === "narrator" &&
                                  `${getTranslation(language, "narrator")} - ${
                                    suggestion.book
                                  }`}
                                {suggestion.type === "book" &&
                                  `${getTranslation(language, "book")} - ${
                                    suggestion.category
                                  }`}
                                {suggestion.type === "chapter" &&
                                  `${getTranslation(language, "chapter")} - ${
                                    suggestion.book
                                  }`}
                              </span>
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Advanced filters toggle */}
                <div className="mt-4 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${t.iconBtn}`}
                  >
                    <SlidersHorizontal className={`h-5 w-5 ${t.accentIcon}`} />
                    <span>
                      {showFilters
                        ? getTranslation(language, "hideFilters")
                        : getTranslation(language, "showFilters")}
                    </span>
                    {activeFilterCount > 0 && (
                      <span
                        className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${t.accentBg} ${t.onAccent}`}
                      >
                        {activeFilterCount}
                      </span>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showFilters ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Advanced Filters Accordion */}
                <AnimatePresence initial={false}>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 grid grid-cols-1 gap-3 text-start sm:grid-cols-2 lg:grid-cols-3">
                        {/* Book Filter */}
                        <select
                          value={selectedBookFilter}
                          onChange={(e) =>
                            setSelectedBookFilter(e.target.value)
                          }
                          className={t.field}
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
                          onChange={(e) =>
                            setSelectedCategoryFilter(e.target.value)
                          }
                          className={t.field}
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
                          placeholder={getTranslation(
                            language,
                            "narratorPlaceholder",
                          )}
                          className={t.field}
                        />

                        {/* Status Filter */}
                        <select
                          value={selectedStatusFilter}
                          onChange={(e) =>
                            setSelectedStatusFilter(e.target.value)
                          }
                          className={t.field}
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
                          onChange={(e) =>
                            setSelectedChapterFilter(e.target.value)
                          }
                          placeholder={getTranslation(
                            language,
                            "chapterPlaceholder",
                          )}
                          className={t.field}
                        />

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {(selectedBookFilter ||
                            selectedCategoryFilter ||
                            selectedNarrator ||
                            selectedStatusFilter ||
                            selectedChapterFilter) && (
                            <button
                              type="button"
                              onClick={handleSearch}
                              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${primaryBtn}`}
                            >
                              {getTranslation(language, "search")}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={clearSearch}
                            className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition ${t.iconBtn}`}
                          >
                            {getTranslation(language, "clearAllFilters")}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          </section>

          {/* ——— STATISTICS (grid of flat #212328 cards) ——— */}
          <motion.div
            variants={gridContainer}
            initial="hidden"
            animate="show"
            className="mb-8 grid grid-cols-2 gap-6 lg:grid-cols-4"
          >
            {dashboardStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  variants={gridItem}
                  whileHover={{ y: -4 }}
                  className={`${t.card} p-6 sm:p-8`}
                >
                  <span
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                      isNight ? "bg-[#9e98db]/10" : "bg-[#7440E9]/10"
                    }`}
                  >
                    <Icon className={`h-7 w-7 ${t.accentIcon}`} />
                  </span>
                  <div
                    className={`text-3xl font-bold sm:text-4xl ${t.accentText}`}
                  >
                    {stat.value}
                  </div>
                  <div
                    className={`mt-1 text-xs font-medium sm:text-sm ${t.muted}`}
                  >
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ——— SEARCH RESULTS ——— */}
          {showSearchResults && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className={`text-xl font-bold sm:text-2xl ${t.strong}`}>
                    {getTranslation(language, "searchResults")}
                  </h2>
                  <p className={`mt-1 text-sm ${t.muted}`}>
                    {searchLoading
                      ? getTranslation(language, "searching")
                      : `${hadiths.length} ${getTranslation(
                          language,
                          "hadithsFound",
                        )}`}
                  </p>
                  {searchStats && (
                    <div
                      className={`mt-2 flex flex-wrap gap-3 text-xs ${t.faint}`}
                    >
                      <span>
                        {getTranslation(language, "totalBooks")}:{" "}
                        {searchStats.totalBooks}
                      </span>
                      <span>
                        {getTranslation(language, "totalHadiths")}:{" "}
                        {searchStats.totalHadiths}
                      </span>
                    </div>
                  )}
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${t.badge}`}
                    >
                      {language === "ar"
                        ? "العربية"
                        : language === "en"
                          ? "English"
                          : "اردو"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSearchResults(false);
                    clearSearch();
                  }}
                  className={`inline-flex items-center gap-2 self-start rounded-xl px-4 py-2.5 text-sm transition ${t.iconBtn}`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  {getTranslation(language, "backToBooks")}
                </button>
              </div>

              {/* Loading State */}
              {searchLoading && (
                <div className="flex justify-center py-12">
                  <div className="text-center">
                    <div
                      className={`mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 ${t.spinner}`}
                    />
                    <p className={`text-sm ${t.muted}`}>
                      {getTranslation(language, "searching")}...
                    </p>
                  </div>
                </div>
              )}

              {/* No Results */}
              {!searchLoading && hadiths.length === 0 && (
                <div className={`${t.card} py-14 text-center`}>
                  <div
                    className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl ${t.emptyIconWrap}`}
                  >
                    <Search className={`h-10 w-10 ${t.emptyIcon}`} />
                  </div>
                  <h3
                    className={`mb-2 text-lg font-semibold sm:text-xl ${t.strong}`}
                  >
                    {getTranslation(language, "noResults")}
                  </h3>
                  <p className={`mb-4 text-sm ${t.muted}`}>
                    {getTranslation(language, "tryDifferentKeywords")}
                  </p>
                  <div className="mx-auto max-w-md space-y-2 text-start">
                    <p className={`text-xs ${t.faint}`}>
                      {getTranslation(language, "searchTips")}
                    </p>
                    <ul className={`space-y-1 text-xs ${t.faint}`}>
                      <li>• {getTranslation(language, "searchTip1")}</li>
                      <li>• {getTranslation(language, "searchTip2")}</li>
                      <li>• {getTranslation(language, "searchTip3")}</li>
                      {language === "ar" && (
                        <>
                          <li>
                            • {getTranslation(language, "arabicSearchTip1")}
                          </li>
                          <li>
                            • {getTranslation(language, "arabicSearchTip2")}
                          </li>
                          <li>
                            • {getTranslation(language, "arabicSearchTip3")}
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      setShowSearchResults(false);
                      clearSearch();
                    }}
                    className={`mt-6 rounded-xl px-6 py-3 text-sm font-semibold ${primaryBtn}`}
                  >
                    {getTranslation(language, "backToBooks")}
                  </button>
                </div>
              )}

              {/* Hadiths List */}
              {!searchLoading && hadiths.length > 0 && (
                <motion.div
                  variants={gridContainer}
                  initial="hidden"
                  animate="show"
                  className="grid gap-6"
                >
                  {hadiths.map((hadith, index) => (
                    <motion.div
                      key={index}
                      variants={gridItem}
                      whileHover={{ y: -3 }}
                      className={`${t.cardSm} cursor-pointer p-5`}
                      onClick={() => {
                        const isLocalBook =
                          hadith.bookSlug && LOCAL_BOOKS[hadith.bookSlug];

                        if (isLocalBook) {
                          const hadithNumber = hadith.id;
                          navigate(
                            `/islamic-library/local-books/${hadith.bookSlug}/hadith/${hadithNumber}`,
                          );
                        } else {
                          navigate(
                            `/islamic-library/book/${hadith.bookSlug}/chapter/${hadith.chapter.chapterNumber}/hadith/${hadith.hadithNumber}`,
                          );
                        }
                      }}
                    >
                      <div className="mb-4 flex items-start gap-3">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${t.accentBg}`}
                        >
                          <span className={`text-sm font-bold ${t.onAccent}`}>
                            {hadith.hadithNumber}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3
                            className={`mb-1 text-sm font-semibold sm:text-base ${t.strong}`}
                          >
                            {getTranslation(language, "hadith")}{" "}
                            {hadith.hadithNumber}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {hadith.volume && (
                              <span
                                className={`rounded-full px-2 py-1 ${t.chips.sky}`}
                              >
                                {getTranslation(language, "volume")}{" "}
                                {hadith.volume}
                              </span>
                            )}
                            {hadith.status && (
                              <span
                                className={`rounded-full px-2 py-1 font-semibold ${
                                  hadith.status === "Sahih"
                                    ? t.chips.emerald
                                    : hadith.status === "Hasan"
                                      ? t.chips.sky
                                      : t.chips.amber
                                }`}
                              >
                                {getTranslation(
                                  language,
                                  hadith.status.toLowerCase(),
                                )}
                              </span>
                            )}
                            {hadith.bookSlug &&
                              LOCAL_BOOKS[hadith.bookSlug] && (
                                <span
                                  className={`rounded-full px-2 py-1 ${t.chips.lilac}`}
                                >
                                  {getTranslation(language, "localBook")}
                                </span>
                              )}
                            {hadith.bookSlug &&
                              !LOCAL_BOOKS[hadith.bookSlug] && (
                                <span
                                  className={`rounded-full px-2 py-1 ${t.chips.sky}`}
                                >
                                  {getTranslation(language, "apiBook")}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Hadith Text */}
                      <div className={`${t.textBox} p-4`}>
                        {hadith.hadithArabic && (
                          <p
                            className={`text-sm leading-relaxed line-clamp-3 sm:text-base ${t.strong}`}
                            dir="rtl"
                          >
                            {hadith.hadithArabic}
                          </p>
                        )}
                        {(language === "en" || language === "ur") && (
                          <div className={`mt-3 border-t pt-3 ${t.divider}`}>
                            <p
                              className={`text-sm leading-relaxed line-clamp-3 sm:text-base ${t.muted}`}
                            >
                              {language === "en"
                                ? hadith.hadithEnglish
                                : hadith.hadithUrdu}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        {hadith.book && (
                          <span
                            className={`rounded-full px-2 py-1 ${t.chips.sky}`}
                          >
                            {language === "ar"
                              ? hadith.book.bookName
                              : getBookTranslation(
                                  language,
                                  hadith.book.bookName,
                                )}
                          </span>
                        )}
                        {hadith.chapter && (
                          <span
                            className={`rounded-full px-2 py-1 ${t.chips.lilac}`}
                          >
                            {language === "ar"
                              ? hadith.chapter.chapterArabic
                              : language === "en"
                                ? hadith.chapter.chapterEnglish
                                : hadith.chapter.chapterUrdu}
                          </span>
                        )}
                        {hadith.englishNarrator && (
                          <span
                            className={`rounded-full px-2 py-1 ${t.chips.emerald}`}
                          >
                            {hadith.englishNarrator}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {!showSearchResults && (
            <div
              className="sticky top-[4.75rem] z-30 -mx-4 mb-8 px-4 sm:mx-0 sm:px-0"
              style={
                isRamadanThemeActive ? undefined : { backgroundColor: pageBg }
              }
            >
              <div
                className={`flex gap-1 overflow-x-auto border-b py-1 ${t.divider} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
              >
                {Object.keys(categories).map((categoryId) => {
                  const category = categories[categoryId];
                  const isActive = selectedCategory === categoryId;
                  const bookCount = category.books?.length || 0;

                  return (
                    <button
                      key={categoryId}
                      onClick={() => setSelectedCategory(categoryId)}
                      className={`relative shrink-0 whitespace-nowrap rounded-t-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        isActive ? t.pillActive : t.pillInactive
                      }`}
                    >
                      <span>
                        {language === "ar"
                          ? category.name
                          : language === "en"
                            ? category.nameEn
                            : category.nameUr}
                      </span>
                      <span
                        className={`ms-2 rounded-full px-1.5 py-0.5 text-[11px] ${
                          isActive ? t.countActive : t.countInactive
                        }`}
                      >
                        {bookCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ——— CATEGORY DESCRIPTION ——— */}
          {!showSearchResults && categories[selectedCategory] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${t.card} mb-8 p-6 sm:p-8`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${t.accentBg}`}
                >
                  <BookOpen className={`h-7 w-7 ${t.onAccent}`} />
                </div>
                <div className="flex-1">
                  <h3
                    className={`mb-2 text-2xl font-bold sm:text-3xl ${t.accentText}`}
                  >
                    {language === "ar"
                      ? categories[selectedCategory].name
                      : language === "en"
                        ? categories[selectedCategory].nameEn
                        : categories[selectedCategory].nameUr}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed sm:text-base ${t.muted}`}
                  >
                    {language === "ar"
                      ? categories[selectedCategory].description
                      : language === "en"
                        ? categories[selectedCategory].descriptionEn
                        : categories[selectedCategory].descriptionUr}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className={`${t.innerStat} p-5 text-center`}>
                  <div className={`text-2xl font-bold ${t.accentText}`}>
                    {categories[selectedCategory].books?.length || 0}
                  </div>
                  <div className={`text-xs font-semibold ${t.faint2}`}>
                    {getTranslation(language, "book")}
                  </div>
                </div>
                <div className={`${t.innerStat} p-5 text-center`}>
                  <div className={`text-2xl font-bold ${t.accentText}`}>
                    {getTranslation(language, "authentic")}
                  </div>
                  <div className={`text-xs font-semibold ${t.faint2}`}>
                    {getTranslation(language, "quality")}
                  </div>
                </div>
                <div
                  className={`${t.innerStat} col-span-2 p-5 text-center sm:col-span-1`}
                >
                  <div className={`text-2xl font-bold ${t.accentText}`}>
                    100%
                  </div>
                  <div className={`text-xs font-semibold ${t.faint2}`}>
                    {getTranslation(language, "available")}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ——— BOOKS GRID ——— */}
          {!showSearchResults && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className={`text-2xl font-bold sm:text-3xl ${t.strong}`}>
                    {getTranslation(language, "availableBooks")}
                  </h2>
                  <p className={`mt-1 text-sm ${t.muted}`}>
                    {filteredBooks.length}{" "}
                    {getTranslation(language, "booksFound")}
                  </p>
                </div>
              </div>

              {filteredBooks.length > 0 && (
                <motion.div
                  variants={gridContainer}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  {filteredBooks.map((book, index) => (
                    <motion.div key={index} variants={gridItem}>
                      <BookCard book={book} language={language} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* No Results for Books */}
          {!showSearchResults && filteredBooks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`${t.card} py-16 text-center`}
            >
              <div
                className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${t.emptyIconWrap}`}
              >
                <Search className={`h-10 w-10 ${t.emptyIcon}`} />
              </div>
              <h3
                className={`mb-2 text-lg font-semibold sm:text-xl ${t.strong}`}
              >
                {getTranslation(language, "noResults")}
              </h3>
              <p className={`mb-4 text-sm ${t.muted}`}>
                {getTranslation(language, "tryDifferentKeywords")}
              </p>
              <div className="mx-auto max-w-md space-y-2 text-start">
                <p className={`text-xs ${t.faint}`}>
                  {getTranslation(language, "searchTips")}
                </p>
                <ul className={`space-y-1 text-xs ${t.faint}`}>
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
                className={`mt-6 rounded-xl px-6 py-3 text-sm font-semibold ${primaryBtn}`}
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
