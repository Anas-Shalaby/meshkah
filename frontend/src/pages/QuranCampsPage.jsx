import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Users,
  Clock,
  ArrowRight,
  Play,
  CheckCircle,
  Clock3,
  Search,
  Filter,
  Heart,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap,
  Globe,
  Shield,
  Crown,
  Book,
  AlertCircle,
  ArrowUp,
  X,
  LayoutGrid,
  List,
} from "lucide-react";
import SEO from "../components/SEO";
import CampPublicCard from "../components/CampPublicCard";
import {
  CampCardSkeleton,
  StatsCardSkeleton,
} from "../components/CampSkeletons";
import { useRamadanTheme } from "../context/RamadanThemeContext";
import RamadanCountdown from "../components/ramadan/RamadanCountdown";
import RamadanFloatingElements from "../components/ramadan/RamadanFloatingElements";
import "../styles/quran-camps.css";
import FullPageLoadingScreen from "../components/FullPageLoadingScreen";
import { useTheme } from "../context/ThemeContext";
import { Player } from "@lottiefiles/react-lottie-player";
import heroLottieData from "../assets/lottie/books.json";

// ——— Framer Motion presets ———
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const QuranCampsPage = () => {
  const { isNight } = useTheme();
  const { isRamadanThemeActive, loading: themeLoading } = useRamadanTheme();

  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // all | quran | hadith
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [tagsFilter, setTagsFilter] = useState("all");
  const [favorites, setFavorites] = useState(new Set());
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem("camps_view_mode") || "grid";
    } catch (_) {
      return "grid";
    }
  }); // grid or list
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [displayedCamps, setDisplayedCamps] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const itemsPerPage = 12;

  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const token = (() => {
          try {
            return localStorage.getItem("token");
          } catch {
            return null;
          }
        })();
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/quran-camps`,
          {
            headers: token ? { "x-auth-token": token } : undefined,
          },
        );
        const data = await response.json();
        setCamps(data.data || []);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل المخيمات");
        console.error("Error fetching camps:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCamps();
  }, []);

  // Load saved filters
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem("camps_filters");
      if (savedFilters) {
        const parsed = JSON.parse(savedFilters);
        if (parsed.filter) setFilter(parsed.filter);
        if (parsed.difficultyFilter)
          setDifficultyFilter(parsed.difficultyFilter);
        if (parsed.durationFilter) setDurationFilter(parsed.durationFilter);
        if (parsed.tagsFilter) setTagsFilter(parsed.tagsFilter);
        if (parsed.searchQuery) setSearchQuery(parsed.searchQuery);
      }
    } catch (_) {}
  }, []);

  // Save filters
  useEffect(() => {
    try {
      localStorage.setItem(
        "camps_filters",
        JSON.stringify({
          filter,
          difficultyFilter,
          durationFilter,
          tagsFilter,
          searchQuery,
        }),
      );
    } catch (_) {}
  }, [filter, difficultyFilter, durationFilter, tagsFilter, searchQuery]);

  // Search suggestions
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const suggestions = camps
        .flatMap((camp) => [camp.name, camp.surah_name, ...(camp.tags || [])])
        .filter((item) =>
          item?.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        .slice(0, 5);
      setSearchSuggestions([...new Set(suggestions)]);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, camps]);
  // Advanced filtering and sorting with useMemo for performance optimization
  const filteredCamps = useMemo(() => {
    return camps
      .filter((camp) => {
        // Note: Hidden camps (private/unlisted) are already filtered in the backend API
        // They are not sent in the response at all, so no need to filter here

        // Public enrollment: hide camps with public enrollment disabled (unless user is already enrolled)
        if (camp.enable_public_enrollment === 0 && !camp.is_enrolled) {
          return false;
        }

        // Status filter
        if (filter !== "all" && camp.status !== filter) return false;

        // Camp type filter (multi-type system: quran / hadith)
        if (typeFilter !== "all") {
          const campType = camp.camp_type || "quran";
          if (campType !== typeFilter) return false;
        }

        // Search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            (camp.name || "").toLowerCase().includes(query) ||
            (camp.surah_name || "").toLowerCase().includes(query) ||
            camp.description?.toLowerCase().includes(query)
          );
        }

        // Difficulty filter
        if (difficultyFilter !== "all") {
          const difficulty = getDifficultyLevel(camp);
          if (difficultyFilter === "beginner" && difficulty !== "beginner")
            return false;
          if (
            difficultyFilter === "intermediate" &&
            difficulty !== "intermediate"
          )
            return false;
          if (difficultyFilter === "advanced" && difficulty !== "advanced")
            return false;
        }

        // Duration filter
        if (durationFilter !== "all") {
          if (durationFilter === "short" && camp.duration_days > 7)
            return false;
          if (
            durationFilter === "medium" &&
            (camp.duration_days <= 7 || camp.duration_days > 14)
          )
            return false;
          if (durationFilter === "long" && camp.duration_days <= 14)
            return false;
        }

        // Tags filter
        if (tagsFilter !== "all") {
          if (!camp.tags || !Array.isArray(camp.tags) || camp.tags.length === 0)
            return false;
          const hasTag = camp.tags.some(
            (tag) =>
              tag && tag.trim().toLowerCase() === tagsFilter.toLowerCase(),
          );
          if (!hasTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.start_date) - new Date(a.start_date);
          case "oldest":
            return new Date(a.start_date) - new Date(b.start_date);
          case "popular":
            return (b.enrolled_count || 0) - (a.enrolled_count || 0);
          case "name":
            return a.name.localeCompare(b.name);
          case "duration":
            return a.duration_days - b.duration_days;
          default:
            return 0;
        }
      });
  }, [
    camps,
    filter,
    typeFilter,
    searchQuery,
    sortBy,
    difficultyFilter,
    durationFilter,
    tagsFilter,
  ]);

  // Infinite scroll - initialize displayed camps
  useEffect(() => {
    const initialCamps = filteredCamps.slice(0, itemsPerPage);
    setDisplayedCamps(initialCamps);
    setHasMore(filteredCamps.length > itemsPerPage);
  }, [filteredCamps]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 1000
      ) {
        if (
          hasMore &&
          !loading &&
          filteredCamps.length > displayedCamps.length
        ) {
          setDisplayedCamps((prev) => {
            const nextBatch = filteredCamps.slice(
              0,
              prev.length + itemsPerPage,
            );
            setHasMore(nextBatch.length < filteredCamps.length);
            return nextBatch;
          });
        }
      }
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [
    displayedCamps.length,
    filteredCamps.length,
    hasMore,
    loading,
    filteredCamps,
  ]);

  // persist view mode & sort
  useEffect(() => {
    try {
      localStorage.setItem("camps_view_mode", viewMode);
      localStorage.setItem("camps_sort_by", sortBy);
    } catch (_) {}
  }, [viewMode, sortBy]);

  useEffect(() => {
    try {
      const savedSort = localStorage.getItem("camps_sort_by");
      if (savedSort) setSortBy(savedSort);
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "early_registration":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "active":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border border-gray-200";
      case "reopened":
        return "bg-indigo-100 text-indigo-800 border border-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "early_registration":
        return <Clock3 className="w-4 h-4" />;
      case "active":
        return <Play className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "reopened":
        return <Play className="w-4 h-4" />;
      default:
        return <Clock3 className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "early_registration":
        return "قريباً";
      case "active":
        return "نشط";
      case "completed":
        return "منتهي";
      case "reopened":
        return "مفتوح للاشتراك";
      default:
        return "غير محدد";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // عدّاد تنازلي بسيط حتى تاريخ البدء
  const formatCountdown = (dateString) => {
    try {
      const start = new Date(dateString);
      const now = new Date();
      const diffMs = start.getTime() - now.getTime();
      if (diffMs <= 0) return "اليوم";
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (days > 0) return `${days} يوم`;
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      if (hours > 0) return `${hours} ساعة`;
      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
      return `${minutes} دقيقة`;
    } catch (_) {
      return "قريباً";
    }
  };

  const getDifficultyLevel = (camp) => {
    if (camp.duration_days <= 7) return "beginner";
    if (camp.duration_days <= 14) return "intermediate";
    return "advanced";
  };

  // اشتقاق حالة "قريباً" من تاريخ البدء لحماية الواجهة من أي أخطاء حالة من الخادم

  const getEffectiveStatus = (camp) =>
    camp.status === "early_registration" ? "early_registration" : camp.status;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "beginner":
        return "text-green-600 bg-green-100";
      case "intermediate":
        return "text-yellow-600 bg-yellow-100";
      case "advanced":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case "beginner":
        return "مبتدئ";
      case "intermediate":
        return "متوسط";
      case "advanced":
        return "متقدم";
      default:
        return "غير محدد";
    }
  };

  const toggleFavorite = (campId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(campId)) {
      newFavorites.delete(campId);
    } else {
      newFavorites.add(campId);
    }
    setFavorites(newFavorites);
  };

  const getFilteredCampsCount = (status) => {
    return camps.filter((camp) => camp.status === status).length;
  };

  // Get all unique tags from all camps
  const getAllUniqueTags = useMemo(() => {
    const tagsSet = new Set();
    camps.forEach((camp) => {
      if (camp.tags && Array.isArray(camp.tags)) {
        camp.tags.forEach((tag) => {
          if (tag && tag.trim()) {
            tagsSet.add(tag.trim());
          }
        });
      }
    });
    return Array.from(tagsSet).sort();
  }, [camps]);

  // ——— Flat theme tokens (dark reference / flat light counterpart) ———
  const ACCENT = isNight ? "#9e98db" : "#7440E9";
  const GOLD = "#ffc107";
  const ui = isNight
    ? {
        page: "bg-[#1a1c22]",
        card: "bg-[#212328] border border-gray-800",
        text: "text-[#e0e0e0]",
        sub: "text-[#a0a0a0]",
        faint: "text-[#6b6b73]",
        input:
          "bg-[#1a1c22] border border-gray-800 text-[#e0e0e0] placeholder-[#6b6b73] focus:border-[#9e98db] focus:ring-2 focus:ring-[#9e98db]/30",
        pillInactive:
          "text-[#a0a0a0] hover:text-[#e0e0e0] hover:bg-white/[0.04] border border-transparent",
        chipInactive: "bg-white/5 text-[#a0a0a0]",
        segment: "bg-[#1a1c22] border border-gray-800",
        divider: "border-gray-800",
        ctaBorder: "border border-[#9e98db]/30 bg-[#212328]",
        onAccent: "#1a1c22",
      }
    : {
        page: "bg-[#f4f4f7]",
        card: "bg-white border border-gray-200",
        text: "text-[#24242c]",
        sub: "text-gray-500",
        faint: "text-gray-400",
        input:
          "bg-[#f1f1f5] border border-gray-200 text-[#24242c] placeholder-gray-400 focus:border-[#7440E9] focus:ring-2 focus:ring-[#7440E9]/25",
        pillInactive:
          "text-gray-500 hover:text-[#24242c] hover:bg-black/[0.03] border border-transparent",
        chipInactive: "bg-black/5 text-gray-500",
        segment: "bg-[#f1f1f5] border border-gray-200",
        divider: "border-gray-200",
        ctaBorder: "border border-[#7440E9]/25 bg-white",
        onAccent: "#ffffff",
      };

  const pillActiveStyle = {
    backgroundColor: `${ACCENT}26`,
    color: ACCENT,
    borderColor: `${ACCENT}66`,
  };
  const primaryBtnStyle = { backgroundColor: ACCENT, color: ui.onAccent };

  const statusTabs = [
    { id: "all", label: "الكل", icon: BookOpen, count: camps.length },
    {
      id: "early_registration",
      label: "قريباً",
      icon: Clock3,
      count: getFilteredCampsCount("early_registration"),
    },
    {
      id: "active",
      label: "نشط",
      icon: Play,
      count: getFilteredCampsCount("active"),
    },
    {
      id: "completed",
      label: "منتهي",
      icon: CheckCircle,
      count: getFilteredCampsCount("completed"),
    },
  ];

  const typeTabs = [
    { id: "all", label: "كل الأنواع", icon: BookOpen },
    { id: "quran", label: "مخيمات قرآن", icon: Book },
    { id: "hadith", label: "مخيمات حديث", icon: Sparkles },
  ];

  const heroStats = [
    {
      icon: BookOpen,
      value: camps.length,
      label: "مخيم متاح",
      color: ACCENT,
    },
    {
      icon: Users,
      value: camps.reduce((sum, camp) => sum + camp.enrolled_count, 0),
      label: "مشترك",
      color: ACCENT,
    },
    {
      icon: Zap,
      value: getFilteredCampsCount("active"),
      label: "مخيم نشط",
      color: GOLD,
    },
  ];

  const advancedFilterCount = [
    difficultyFilter !== "all" ? 1 : 0,
    durationFilter !== "all" ? 1 : 0,
    tagsFilter !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  if (loading) {
    return <FullPageLoadingScreen message="جاري تحميل المخيمات ..." />;
  }

  if (error) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center px-4 font-cairo ${ui.page}`}
        dir="rtl"
      >
        <SEO
          title="حدث خطأ - المخيمات القرآنية"
          description="حدث خطأ أثناء تحميل المخيمات القرآنية"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mx-auto max-w-md rounded-2xl p-8 text-center ${ui.card}`}
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className={`mb-3 text-2xl font-bold ${ui.text}`}>حدث خطأ</h2>
          <p className={`mb-2 text-lg ${ui.sub}`}>{error}</p>
          <p className={`mb-8 text-sm ${ui.faint}`}>
            يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى
          </p>
          <div className="flex justify-center gap-3">
            <motion.button
              onClick={() => {
                setError(null);
                setLoading(true);
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition hover:opacity-90"
              style={primaryBtnStyle}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <ArrowRight className="h-5 w-5 rotate-180" />
              إعادة المحاولة
            </motion.button>
            <motion.button
              onClick={() => (window.location.href = "/")}
              className={`rounded-xl px-6 py-3 font-semibold transition ${ui.segment} ${ui.text}`}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              العودة للرئيسية
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className={`camps-page min-h-screen font-almarai ${
        isRamadanThemeActive ? "ramadan-bg-gradient" : ui.page
      } ${ui.text}`}
    >
      <SEO
        title="المخيمات القرآنية - مشكاة الأحاديث"
        description="انضم إلى مخيماتنا القرآنية المكثفة للتعمق في سور القرآن الكريم مع منهج متكامل من القراءة والحفظ والتفسير"
        keywords="مخيمات قرآنية, حفظ القرآن, تفسير القرآن, دراسة القرآن"
        canonicalUrl={`${window.location.origin}/quran-camps`}
      />

      {/* Ramadan Countdown */}
      {isRamadanThemeActive && <RamadanCountdown />}

      {/* Floating Elements */}
      {isRamadanThemeActive && <RamadanFloatingElements />}

      {/* ——— Hero Section (clean, typography-focused) ——— */}
      <section
        className={`px-4 sm:px-6 lg:px-8 py-14 sm:py-20 ${
          isRamadanThemeActive ? "ramadan-hero-section pt-32 md:pt-28" : ""
        }`}
      >
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* ——— Text column (right side in RTL) ——— */}
          <div className="text-center lg:text-right">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              style={{ lineHeight: "1.2" }}
              className={`mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl ${ui.text}`}
            >
              المخيمات القرآنية
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`mx-auto mb-10 max-w-2xl text-base leading-relaxed sm:text-lg md:text-xl lg:mx-0 ${ui.sub}`}
            >
              انضم إلى رحلة تعمق في القرآن الكريم مع مخيمات مكثفة تجمع بين
              <span className="font-semibold" style={{ color: ACCENT }}>
                {" "}
                القراءة والحفظ والتفسير
              </span>
            </motion.p>

            {/* Stats */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5"
            >
              {heroStats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    whileHover={{ y: -4 }}
                    className={`rounded-2xl p-5 text-right sm:p-6 ${ui.card}`}
                  >
                    <span
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${stat.color}1f` }}
                    >
                      <Icon className="h-7 w-7" style={{ color: stat.color }} />
                    </span>
                    <p
                      className="text-3xl font-bold sm:text-4xl"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </p>
                    <p
                      className={`mt-1 text-sm font-medium sm:text-base ${ui.sub}`}
                    >
                      {stat.label}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* ——— Visual column (Lottie, left side in RTL) ——— */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <motion.div
              animate={{ y: [-8, 8, -8] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="w-full max-w-md lg:max-w-lg"
            >
              <Player
                autoplay
                loop
                src={heroLottieData}
                style={{ width: "100%", height: "auto" }}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ——— Command Bar: Search + Filters ——— */}
      <div className="mx-auto mb-8 max-w-7xl px-4 sm:px-6 lg:px-8" id="camps">
        <div className={`rounded-2xl p-4 sm:p-5 ${ui.card}`}>
          {/* Top row: search + controls */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search input */}
            <div className="relative z-50 flex-1">
              <Search
                className="pointer-events-none absolute right-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2"
                style={{ color: ACCENT }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  className={`absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 transition ${ui.faint} hover:opacity-80`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <input
                type="text"
                placeholder="ابحث عن مخيم، سورة، أو وصف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                style={{ colorScheme: isNight ? "dark" : "light" }}
                className={`relative z-10 w-full rounded-xl py-3 pr-11 pl-10 text-base outline-none transition ${ui.input}`}
                aria-label="البحث في المخيمات"
              />
              {/* Search Suggestions */}
              <AnimatePresence>
                {showSuggestions && searchSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`absolute left-0 right-0 top-full z-[9999] mt-2 overflow-hidden rounded-xl ${ui.card}`}
                  >
                    {searchSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSearchQuery(suggestion);
                          setShowSuggestions(false);
                        }}
                        className={`flex w-full items-center gap-2 border-b px-4 py-3 text-right text-sm transition last:border-b-0 ${ui.divider} ${ui.text} hover:bg-white/[0.04]`}
                      >
                        <Search className="h-4 w-4" style={{ color: ACCENT }} />
                        {suggestion}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ colorScheme: isNight ? "dark" : "light" }}
              className={`rounded-xl px-4 py-3 text-sm outline-none transition ${ui.input}`}
            >
              <option value="newest">الأحدث</option>
              <option value="oldest">الأقدم</option>
              <option value="popular">الأكثر شعبية</option>
              <option value="name">الاسم</option>
              <option value="duration">المدة</option>
            </select>

            {/* View Mode Toggle */}
            <div className={`flex shrink-0 rounded-xl p-1 ${ui.segment}`}>
              <button
                onClick={() => setViewMode("grid")}
                className="flex h-9 w-9 items-center justify-center rounded-lg transition"
                style={
                  viewMode === "grid"
                    ? { backgroundColor: `${ACCENT}26`, color: ACCENT }
                    : undefined
                }
                aria-label="عرض شبكي"
              >
                <LayoutGrid
                  className={`h-4 w-4 ${viewMode === "grid" ? "" : ui.faint}`}
                />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className="flex h-9 w-9 items-center justify-center rounded-lg transition"
                style={
                  viewMode === "list"
                    ? { backgroundColor: `${ACCENT}26`, color: ACCENT }
                    : undefined
                }
                aria-label="عرض قائمة"
              >
                <List
                  className={`h-4 w-4 ${viewMode === "list" ? "" : ui.faint}`}
                />
              </button>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                showAdvancedFilters ? "" : `${ui.segment} ${ui.text}`
              }`}
              style={showAdvancedFilters ? pillActiveStyle : undefined}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">فلاتر متقدمة</span>
              <span className="sm:hidden">فلاتر</span>
              {showAdvancedFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {advancedFilterCount > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ backgroundColor: ACCENT, color: ui.onAccent }}
                >
                  {advancedFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Result count */}
          {searchQuery && (
            <p className={`mt-3 px-1 text-sm ${ui.sub}`}>
              وجدنا {filteredCamps.length} مخيم
              {filteredCamps.length !== 1 ? "ات" : ""} لـ "{searchQuery}"
            </p>
          )}

          {/* Quick status filters */}
          <div
            className={`mt-4 flex flex-wrap items-center gap-2 border-t pt-4 ${ui.divider}`}
          >
            {statusTabs.map(({ id, label, icon: TabIcon, count }) => {
              const active = filter === id;
              return (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    active ? "" : ui.pillInactive
                  }`}
                  style={active ? pillActiveStyle : undefined}
                >
                  <TabIcon className="h-4 w-4" />
                  <span>{label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      active ? "" : ui.chipInactive
                    }`}
                    style={
                      active
                        ? { backgroundColor: `${ACCENT}33`, color: ACCENT }
                        : undefined
                    }
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Type filters */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {typeTabs.map(({ id, label, icon: TabIcon }) => {
              const active = typeFilter === id;
              const count =
                id === "all"
                  ? camps.length
                  : camps.filter((c) => (c.camp_type || "quran") === id).length;
              return (
                <button
                  key={id}
                  onClick={() => setTypeFilter(id)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
                    active ? "" : ui.pillInactive
                  }`}
                  style={active ? pillActiveStyle : undefined}
                >
                  <TabIcon className="h-4 w-4" />
                  <span>{label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      active ? "" : ui.chipInactive
                    }`}
                    style={
                      active
                        ? { backgroundColor: `${ACCENT}33`, color: ACCENT }
                        : undefined
                    }
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Advanced Filters */}
          <AnimatePresence initial={false}>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div
                  className={`mt-4 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-3 ${ui.divider}`}
                >
                  {/* Difficulty Filter */}
                  <div className="space-y-2">
                    <label
                      className={`flex items-center gap-2 text-sm font-semibold ${ui.text}`}
                    >
                      <Zap className="h-4 w-4" style={{ color: ACCENT }} />
                      مستوى الصعوبة
                    </label>
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      style={{ colorScheme: isNight ? "dark" : "light" }}
                      className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition ${ui.input}`}
                    >
                      <option value="all">جميع المستويات</option>
                      <option value="beginner">مبتدئ (7 أيام أو أقل)</option>
                      <option value="intermediate">متوسط (8-14 يوم)</option>
                      <option value="advanced">متقدم (أكثر من 14 يوم)</option>
                    </select>
                  </div>

                  {/* Duration Filter */}
                  <div className="space-y-2">
                    <label
                      className={`flex items-center gap-2 text-sm font-semibold ${ui.text}`}
                    >
                      <Clock className="h-4 w-4" style={{ color: ACCENT }} />
                      مدة المخيم
                    </label>
                    <select
                      value={durationFilter}
                      onChange={(e) => setDurationFilter(e.target.value)}
                      style={{ colorScheme: isNight ? "dark" : "light" }}
                      className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition ${ui.input}`}
                    >
                      <option value="all">جميع المدد</option>
                      <option value="short">قصير (7 أيام أو أقل)</option>
                      <option value="medium">متوسط (8-14 يوم)</option>
                      <option value="long">طويل (أكثر من 14 يوم)</option>
                    </select>
                  </div>

                  {/* Tags Filter */}
                  <div className="space-y-2">
                    <label
                      className={`flex items-center gap-2 text-sm font-semibold ${ui.text}`}
                    >
                      <Sparkles className="h-4 w-4" style={{ color: ACCENT }} />
                      العلامات التوضيحية
                    </label>
                    <select
                      value={tagsFilter}
                      onChange={(e) => setTagsFilter(e.target.value)}
                      style={{ colorScheme: isNight ? "dark" : "light" }}
                      className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition ${ui.input}`}
                    >
                      <option value="all">جميع العلامات</option>
                      {getAllUniqueTags.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end sm:col-span-2 lg:col-span-3">
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setDifficultyFilter("all");
                        setDurationFilter("all");
                        setTagsFilter("all");
                        setFilter("all");
                        setTypeFilter("all");
                      }}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${ui.segment} ${ui.text} hover:opacity-90`}
                    >
                      <X className="h-4 w-4" />
                      مسح جميع الفلاتر
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ——— Camps Grid / List ——— */}
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-20 lg:px-8">
        {filteredCamps.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`empty-state rounded-2xl py-16 text-center ${ui.card}`}
          >
            <div
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${ACCENT}1a` }}
            >
              <BookOpen className="h-12 w-12" style={{ color: ACCENT }} />
            </div>
            <h3 className={`mb-3 text-xl font-bold sm:text-2xl ${ui.text}`}>
              لا توجد مخيمات
            </h3>
            <p className={`mb-2 text-base sm:text-lg ${ui.sub}`}>
              {filter === "all"
                ? "لا توجد مخيمات متاحة حالياً"
                : `لا توجد مخيمات في فئة "${getStatusText(filter)}"`}
            </p>
            {(searchQuery ||
              filter !== "all" ||
              difficultyFilter !== "all" ||
              durationFilter !== "all" ||
              tagsFilter !== "all") && (
              <p className={`mb-8 text-sm sm:text-base ${ui.faint}`}>
                جرب تغيير الفلاتر أو البحث
              </p>
            )}
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              {(searchQuery ||
                filter !== "all" ||
                difficultyFilter !== "all" ||
                durationFilter !== "all" ||
                tagsFilter !== "all") && (
                <motion.button
                  onClick={() => {
                    setSearchQuery("");
                    setDifficultyFilter("all");
                    setDurationFilter("all");
                    setTagsFilter("all");
                    setFilter("all");
                  }}
                  className={`flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition ${ui.segment} ${ui.text}`}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <X className="h-4 w-4" />
                  مسح جميع الفلاتر
                </motion.button>
              )}
              <motion.button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition hover:opacity-90"
                style={primaryBtnStyle}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                تحديث الصفحة
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4 sm:space-y-5"
              }
            >
              {displayedCamps.map((camp, index) => (
                <motion.div
                  key={camp.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.45,
                    delay: (index % itemsPerPage) * 0.05,
                    ease: "easeOut",
                  }}
                >
                  <CampPublicCard
                    camp={camp}
                    index={index}
                    searchQuery={searchQuery}
                  />
                </motion.div>
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <div className={`flex items-center gap-2 ${ui.sub}`}>
                  <div
                    className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                    style={{
                      borderColor: `${ACCENT}`,
                      borderTopColor: "transparent",
                    }}
                  />
                  <span className="text-sm">جاري تحميل المزيد...</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ——— Call to Action (flat, professional) ——— */}
      <div className="px-4 pb-16 sm:px-6 lg:px-8">
        <div
          className={`mx-auto max-w-6xl overflow-hidden rounded-3xl px-6 py-12 sm:px-10 sm:py-16 ${ui.ctaBorder}`}
        >
          <div className="text-center">
            <div className="mb-6">
              <span
                className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium sm:text-sm"
                style={pillActiveStyle}
              >
                <Sparkles className="h-4 w-4" style={{ color: GOLD }} />
                <span>انضم إلى رحلة التعلم</span>
              </span>

              <h2
                className={`mb-4 text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl ${ui.text}`}
              >
                ابدأ رحلتك القرآنية اليوم
              </h2>
              <p
                className={`mx-auto mb-8 max-w-3xl text-base leading-relaxed sm:text-lg md:text-xl ${ui.sub}`}
              >
                انضم إلى مجتمع من المتعلمين المتحمسين للتعمق في كتاب الله
                <br />
                <span className="font-semibold" style={{ color: ACCENT }}>
                  واستكشف كنوز القرآن الكريم
                </span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="#camps"
                className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold transition hover:opacity-90 sm:text-base"
                style={primaryBtnStyle}
              >
                <BookOpen className="h-5 w-5" />
                استكشف المخيمات
                <ArrowRight className="h-4 w-4 rotate-180" />
              </Link>

              <button
                className={`inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold transition sm:text-base ${ui.segment} ${ui.text} hover:opacity-90`}
              >
                <Play className="h-5 w-5" style={{ color: ACCENT }} />
                شاهد الفيديو التعريفي
              </button>
            </div>

            {/* Features */}
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: "آمن ومضمون",
                  desc: "بيئة تعليمية آمنة ومضمونة",
                },
                {
                  icon: Crown,
                  title: "جودة عالية",
                  desc: "محتوى عالي الجودة ومتخصص",
                },
                {
                  icon: Globe,
                  title: "متاح للجميع",
                  desc: "مجاني ومتاح للجميع",
                },
              ].map(({ icon: FeatureIcon, title, desc }, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-6 text-center ${ui.card}`}
                >
                  <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${ACCENT}1f` }}
                  >
                    <FeatureIcon
                      className="h-7 w-7"
                      style={{ color: ACCENT }}
                    />
                  </div>
                  <h3 className={`mb-1.5 text-lg font-bold ${ui.text}`}>
                    {title}
                  </h3>
                  <p className={`text-sm ${ui.sub}`}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-8 left-8 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-xl transition"
            style={primaryBtnStyle}
            whileHover={{ scale: 1.1, y: -4 }}
            whileTap={{ scale: 0.9 }}
            aria-label="التمرير للأعلى"
          >
            <ArrowUp className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuranCampsPage;
