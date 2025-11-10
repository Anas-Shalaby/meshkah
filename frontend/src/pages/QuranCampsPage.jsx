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
} from "lucide-react";
import SEO from "../components/SEO";
import CampPublicCard from "../components/CampPublicCard";
import {
  CampCardSkeleton,
  StatsCardSkeleton,
} from "../components/CampSkeletons";
import "../styles/quran-camps.css";

const QuranCampsPage = () => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [favorites, setFavorites] = useState(new Set());
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem("camps_view_mode") || "grid";
    } catch (_) {
      return "grid";
    }
  }); // grid or list
  const [showScrollTop, setShowScrollTop] = useState(false);

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
          }
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

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

  // اشتقاق حالة "قريباً" من تاريخ البدء لحماية الواجهة من أي أخطاء حالة من الخادم

  const getEffectiveStatus = (camp) =>
    camp.status === "early_registration" ? "early_registration" : camp.status;

  // Advanced filtering and sorting with useMemo for performance optimization
  const filteredCamps = useMemo(() => {
    return camps
      .filter((camp) => {
        // Visibility: hide private and unlisted from public listing
        if (camp.visibility_mode && camp.visibility_mode !== "public")
          return false;

        // Public enrollment: hide camps with public enrollment disabled (unless user is already enrolled)
        if (camp.enable_public_enrollment === 0 && !camp.is_enrolled) {
          return false;
        }

        // Status filter
        if (filter !== "all" && camp.status !== filter) return false;

        // Search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            camp.name.toLowerCase().includes(query) ||
            camp.surah_name.toLowerCase().includes(query) ||
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
  }, [camps, filter, searchQuery, sortBy, difficultyFilter, durationFilter]);

  const getDifficultyLevel = (camp) => {
    if (camp.duration_days <= 7) return "beginner";
    if (camp.duration_days <= 14) return "intermediate";
    return "advanced";
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <SEO
          title="المخيمات القرآنية - مشكاة الأحاديث"
          description="انضم إلى مخيماتنا القرآنية المكثفة للتعمق في سور القرآن الكريم مع منهج متكامل من القراءة والحفظ والتفسير"
        />

        {/* Hero Section Skeleton */}
        <div className="relative py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-blue-100/20 to-indigo-100/30"></div>

          <div className="max-w-7xl mx-auto relative">
            <div className="text-center">
              {/* Title Skeleton */}
              <div className="h-12 sm:h-16 md:h-20 bg-white/70 rounded-2xl animate-pulse mb-6 max-w-2xl mx-auto" />

              {/* Description Skeleton */}
              <div className="space-y-2 max-w-3xl mx-auto mb-8">
                <div className="h-4 bg-white/70 rounded-lg animate-pulse w-3/4 mx-auto" />
                <div className="h-4 bg-white/70 rounded-lg animate-pulse w-2/3 mx-auto" />
              </div>

              {/* Stats Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mb-8 sm:mb-12 px-4">
                {[0, 1, 2].map((i) => (
                  <StatsCardSkeleton key={i} index={i} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-gray-100">
            <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse mb-4"></div>
            <div className="flex gap-4">
              <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Camps Grid Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <CampCardSkeleton key={i} index={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <SEO
          title="حدث خطأ - المخيمات القرآنية"
          description="حدث خطأ أثناء تحميل المخيمات القرآنية"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-red-100"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <AlertCircle className="w-12 h-12 text-red-600" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-gray-900 mb-3"
          >
            حدث خطأ
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600 mb-2 text-lg"
          >
            {error}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-gray-500 mb-8 text-sm"
          >
            يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex gap-4 justify-center"
          >
            <motion.button
              onClick={() => {
                setError(null);
                setLoading(true);
                window.location.reload();
              }}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
              إعادة المحاولة
            </motion.button>
            <motion.button
              onClick={() => (window.location.href = "/")}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              العودة للرئيسية
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <SEO
        title="المخيمات القرآنية - مشكاة الأحاديث"
        description="انضم إلى مخيماتنا القرآنية المكثفة للتعمق في سور القرآن الكريم مع منهج متكامل من القراءة والحفظ والتفسير"
        keywords="مخيمات قرآنية, حفظ القرآن, تفسير القرآن, دراسة القرآن"
      />

      {/* Hero Section */}
      <div className="relative py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-blue-100/20 to-indigo-100/30"></div>
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center">
            <h1
              style={{ lineHeight: "1.2" }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 sm:mb-6 px-4"
            >
              المخيمات القرآنية
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-4">
              انضم إلى رحلة تعمق في القرآن الكريم مع مخيمات مكثفة تجمع بين
              <span className="text-purple-600 font-semibold">
                {" "}
                القراءة والحفظ والتفسير
              </span>
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mb-8 sm:mb-12 px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-purple-100 hover:shadow-2xl transition-all duration-300 group"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-center mb-3 sm:mb-4">
                  <motion.div
                    className="p-2 sm:p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                  </motion.div>
                </div>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2"
                >
                  {camps.length}
                </motion.p>
                <p className="text-gray-600 font-medium text-sm sm:text-base">
                  مخيم متاح
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-300 group"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-center mb-3 sm:mb-4">
                  <motion.div
                    className="p-2 sm:p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  </motion.div>
                </div>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2"
                >
                  {camps.reduce((sum, camp) => sum + camp.enrolled_count, 0)}
                </motion.p>
                <p className="text-gray-600 font-medium text-sm sm:text-base">
                  مشترك
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-indigo-100 hover:shadow-2xl transition-all duration-300 group sm:col-span-2 lg:col-span-1"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-center mb-3 sm:mb-4">
                  <motion.div
                    className="p-2 sm:p-3 bg-indigo-100 rounded-full group-hover:bg-indigo-200 transition-colors"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                  </motion.div>
                </div>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2"
                >
                  {getFilteredCampsCount("active")}
                </motion.p>
                <p className="text-gray-600 font-medium text-sm sm:text-base">
                  مخيم نشط
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filter Section */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12"
        id="camps"
      >
        {/* Search Bar */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-gray-100 mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Search Input */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none z-10" />
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setSearchQuery("")}
                    className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10 p-1 rounded-full hover:bg-gray-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
                <input
                  type="text"
                  placeholder="ابحث عن مخيم، سورة، أو وصف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 sm:py-4 pr-10 sm:pr-12 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-base sm:text-lg search-input"
                  aria-label="البحث في المخيمات"
                />
              </div>
              {searchQuery && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-gray-600 mt-2 px-2"
                >
                  وجدنا {filteredCamps.length} مخيم
                  {filteredCamps.length !== 1 ? "ات" : ""} لـ "{searchQuery}"
                </motion.p>
              )}
            </div>

            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              {/* Sort Dropdown */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm sm:text-base"
                >
                  <option value="newest">الأحدث</option>
                  <option value="oldest">الأقدم</option>
                  <option value="popular">الأكثر شعبية</option>
                  <option value="name">الاسم</option>
                  <option value="duration">المدة</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <div className="w-3 h-3 sm:w-4 sm:h-4 grid grid-cols-2 gap-0.5">
                    <div className="bg-gray-600 rounded-sm"></div>
                    <div className="bg-gray-600 rounded-sm"></div>
                    <div className="bg-gray-600 rounded-sm"></div>
                    <div className="bg-gray-600 rounded-sm"></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-white shadow-sm"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <div className="w-3 h-3 sm:w-4 sm:h-4 space-y-0.5">
                    <div className="w-full h-0.5 bg-gray-600 rounded"></div>
                    <div className="w-full h-0.5 bg-gray-600 rounded"></div>
                    <div className="w-full h-0.5 bg-gray-600 rounded"></div>
                  </div>
                </button>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-all text-sm sm:text-base"
              >
                <Filter className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">فلاتر متقدمة</span>
                <span className="sm:hidden">فلاتر</span>
                {showAdvancedFilters ? (
                  <ChevronUp className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 mr-2" />
                )}
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                    مستوى الصعوبة
                  </label>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm sm:text-base"
                  >
                    <option value="all">جميع المستويات</option>
                    <option value="beginner">مبتدئ (7 أيام أو أقل)</option>
                    <option value="intermediate">متوسط (8-14 يوم)</option>
                    <option value="advanced">متقدم (أكثر من 14 يوم)</option>
                  </select>
                </div>

                {/* Duration Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                    مدة المخيم
                  </label>
                  <select
                    value={durationFilter}
                    onChange={(e) => setDurationFilter(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm sm:text-base"
                  >
                    <option value="all">جميع المدد</option>
                    <option value="short">قصير (7 أيام أو أقل)</option>
                    <option value="medium">متوسط (8-14 يوم)</option>
                    <option value="long">طويل (أكثر من 14 يوم)</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setDifficultyFilter("all");
                      setDurationFilter("all");
                      setFilter("all");
                    }}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium text-sm sm:text-base"
                  >
                    مسح الفلاتر
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 px-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 rounded-full font-medium transition-all duration-300 text-sm sm:text-base ${
              filter === "all"
                ? "bg-purple-600 text-white shadow-xl transform scale-105"
                : "bg-white/90 text-gray-600 hover:bg-purple-50 hover:text-purple-600 backdrop-blur-md shadow-lg border border-gray-200"
            }`}
          >
            الكل ({camps.length})
          </button>
          <button
            onClick={() => setFilter("early_registration")}
            className={`px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 rounded-full font-medium transition-all duration-300 text-sm sm:text-base ${
              filter === "early_registration"
                ? "bg-purple-600 text-white shadow-xl transform scale-105"
                : "bg-white/90 text-gray-600 hover:bg-purple-50 hover:text-purple-600 backdrop-blur-md shadow-lg border border-gray-200"
            }`}
          >
            قريباً ({getFilteredCampsCount("early_registration")})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 rounded-full font-medium transition-all duration-300 text-sm sm:text-base ${
              filter === "active"
                ? "bg-purple-600 text-white shadow-xl transform scale-105"
                : "bg-white/90 text-gray-600 hover:bg-purple-50 hover:text-purple-600 backdrop-blur-md shadow-lg border border-gray-200"
            }`}
          >
            نشط ({getFilteredCampsCount("active")})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 rounded-full font-medium transition-all duration-300 text-sm sm:text-base ${
              filter === "completed"
                ? "bg-purple-600 text-white shadow-xl transform scale-105"
                : "bg-white/90 text-gray-600 hover:bg-purple-50 hover:text-purple-600 backdrop-blur-md shadow-lg border border-gray-200"
            }`}
          >
            منتهي ({getFilteredCampsCount("completed")})
          </button>
        </div>
      </div>

      {/* Camps Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20">
        {filteredCamps.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 sm:py-20 empty-state"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3"
            >
              لا توجد مخيمات
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 text-base sm:text-lg mb-2"
            >
              {filter === "all"
                ? "لا توجد مخيمات متاحة حالياً"
                : `لا توجد مخيمات في فئة "${getStatusText(filter)}"`}
            </motion.p>
            {(searchQuery ||
              filter !== "all" ||
              difficultyFilter !== "all" ||
              durationFilter !== "all") && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-500 text-sm sm:text-base mb-8"
              >
                جرب تغيير الفلاتر أو البحث
              </motion.p>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            >
              {(searchQuery ||
                filter !== "all" ||
                difficultyFilter !== "all" ||
                durationFilter !== "all") && (
                <motion.button
                  onClick={() => {
                    setSearchQuery("");
                    setDifficultyFilter("all");
                    setDurationFilter("all");
                    setFilter("all");
                  }}
                  className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4" />
                  مسح جميع الفلاتر
                </motion.button>
              )}
              <motion.button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                تحديث الصفحة
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
                : "space-y-4 sm:space-y-6"
            }
          >
            <AnimatePresence mode="wait">
              {filteredCamps.map((camp, index) => (
                <CampPublicCard
                  key={camp.id}
                  camp={camp}
                  index={index}
                  searchQuery={searchQuery}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Enhanced Call to Action */}
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full -translate-x-32 sm:-translate-x-48 -translate-y-32 sm:-translate-y-48"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full translate-x-32 sm:translate-x-48 translate-y-32 sm:translate-y-48"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center space-x-2 bg-white/20 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6 backdrop-blur-md shadow-lg border border-white/20">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>انضم إلى رحلة التعلم</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6">
              ابدأ رحلتك القرآنية اليوم
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-purple-100 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed">
              انضم إلى مجتمع من المتعلمين المتحمسين للتعمق في كتاب الله
              <br />
              <span className="text-white font-semibold">
                واستكشف كنوز القرآن الكريم
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8 sm:mb-12">
            <Link
              to="#camps"
              className="inline-flex items-center px-6 py-3 sm:px-8 sm:py-4 bg-white text-purple-600 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base lg:text-lg hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105"
            >
              <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              استكشف المخيمات
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            </Link>

            <button className="inline-flex items-center px-6 py-3 sm:px-8 sm:py-4 bg-white/20 text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base lg:text-lg hover:bg-white/30 transition-all duration-300 backdrop-blur-md shadow-lg border border-white/20">
              <Play className="w-4 h-4 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              شاهد الفيديو التعريفي
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 backdrop-blur-md shadow-lg border border-white/20">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                آمن ومضمون
              </h3>
              <p className="text-purple-100 text-sm sm:text-base">
                بيئة تعليمية آمنة ومضمونة
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 backdrop-blur-md shadow-lg border border-white/20">
                <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                جودة عالية
              </h3>
              <p className="text-purple-100 text-sm sm:text-base">
                محتوى عالي الجودة ومتخصص
              </p>
            </div>

            <div className="text-center sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 backdrop-blur-md shadow-lg border border-white/20">
                <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                متاح للجميع
              </h3>
              <p className="text-purple-100 text-sm sm:text-base">
                مجاني ومتاح للجميع
              </p>
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
            className="fixed bottom-8 left-8 z-50 p-4 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all backdrop-blur-md border-2 border-white/20"
            whileHover={{ scale: 1.1, y: -4 }}
            whileTap={{ scale: 0.9 }}
            aria-label="التمرير للأعلى"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuranCampsPage;
