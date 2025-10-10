import React, { useState, useEffect } from "react";
import SmartRecommendations from "../components/SmartRecommendations";
import UserStats from "../components/UserStats";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  BarChart3,
  RefreshCw,
  Filter,
  Sparkles,
  Target,
  TrendingUp,
  BookOpen,
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Play,
  SkipForward,
  CheckCircle,
} from "lucide-react";

const SmartRecommendationsPage = () => {
  const [activeTab, setActiveTab] = useState("recommendations");
  const [filterType, setFilterType] = useState("all");
  const [limit, setLimit] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [isTourVisible, setIsTourVisible] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // إعادة تحميل الصفحة لتحديث البيانات
    window.location.reload();
  };

  const handleGenerateNew = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      setRefreshing(true);

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/recommendations/generate-recommendations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({
            limit: limit,
          }),
        }
      );

      if (response.ok) {
        // إعادة تحميل الصفحة لعرض التوصيات الجديدة
        window.location.reload();
      }
    } catch (error) {
      console.error("Error generating new recommendations:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTourStart = () => {
    setShowTour(true);
    setIsTourVisible(true);
    setTourStep(0);
    setCompletedSteps([]);
  };

  const handleTourNext = () => {
    if (tourStep < tourSteps.length - 1) {
      setCompletedSteps([...completedSteps, tourStep]);
      setTourStep(tourStep + 1);
    } else {
      handleTourComplete();
    }
  };

  const handleTourPrevious = () => {
    if (tourStep > 0) {
      setTourStep(tourStep - 1);
    }
  };

  const handleTourSkip = () => {
    setIsTourVisible(false);
    setTimeout(() => {
      setShowTour(false);
    }, 300);
  };

  const handleTourComplete = () => {
    setIsTourVisible(false);
    setTimeout(() => {
      setShowTour(false);
    }, 300);
  };

  const tabs = [
    {
      id: "recommendations",
      label: "التوصيات الذكية",
      icon: Star,
    },
    {
      id: "stats",
      label: "إحصائياتك",
      icon: BarChart3,
    },
  ];

  const filterTypes = [
    { value: "all", label: "جميع التوصيات" },
    { value: "similar_content", label: "محتوى مشابه" },
    { value: "trending", label: "شائع" },
    { value: "personalized", label: "مخصص" },
  ];

  const limitOptions = [5, 10, 15, 20, 25];

  // بيانات الـ tour الجميل
  const tourSteps = [
    {
      id: "welcome",
      icon: Sparkles,
      title: "مرحباً بك في التوصيات الذكية! 🎉",
      description:
        "هنا ستجد أحاديث مخصصة لك بناءً على قراءاتك واهتماماتك الشخصية",
      action: "ابدأ الجولة",
      color: "from-purple-500 to-pink-500",
      position: "center",
    },
    {
      id: "filters",
      icon: Filter,
      title: "أنواع التوصيات 📚",
      description:
        "يمكنك تصفية التوصيات حسب النوع: محتوى مشابه، شائع، أو مخصص لك",
      action: "اكتشف الفلاتر",
      color: "from-blue-500 to-cyan-500",
      position: "top",
    },
    {
      id: "limit",
      icon: Target,
      title: "عدد التوصيات 🔢",
      description: "يمكنك اختيار عدد التوصيات التي تريد رؤيتها (من 5 إلى 25)",
      action: "اختر العدد",
      color: "from-green-500 to-emerald-500",
      position: "top",
    },
    {
      id: "recommendations",
      icon: Star,
      title: "التوصيات الذكية ✨",
      description: "هنا ستظهر أحاديث مخصصة لك مع درجة الثقة وسبب التوصية",
      action: "شاهد التوصيات",
      color: "from-orange-500 to-red-500",
      position: "center",
    },
    {
      id: "stats",
      icon: BarChart3,
      title: "الإحصائيات 📊",
      description: "تابع تقدمك واهتماماتك في قراءة الأحاديث من خلال الإحصائيات",
      action: "راجع الإحصائيات",
      color: "from-purple-500 to-indigo-500",
      position: "top",
    },
    {
      id: "complete",
      icon: CheckCircle,
      title: "أحسنت! 🎊",
      description:
        "لقد أكملت جولة التوصيات الذكية! الآن يمكنك الاستمتاع بجميع المميزات",
      action: "ابدأ الاستكشاف",
      color: "from-green-500 to-teal-500",
      position: "center",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Hero Section */}
        <div
          id="hero-section"
          className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 rounded-2xl sm:rounded-3xl shadow-2xl mb-6 sm:mb-12"
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full -translate-y-32 sm:-translate-y-48 translate-x-32 sm:translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-80 sm:h-80 bg-white/5 rounded-full translate-y-20 sm:translate-y-40 -translate-x-20 sm:-translate-x-40"></div>

          <div className="relative px-4 sm:px-8 py-8 sm:py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4 sm:mb-6 shadow-lg">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 sm:mb-4 leading-tight">
              التوصيات الذكية
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 px-2">
              اكتشف أحاديث جديدة مخصصة لك بناءً على قراءاتك واهتماماتك الشخصية
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mb-6 sm:mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full mb-2 sm:mb-3 mx-auto">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-lg sm:text-2xl font-bold text-white mb-1">
                  ذكية
                </div>
                <div className="text-white/80 text-xs sm:text-sm">
                  خوارزميات متقدمة
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full mb-2 sm:mb-3 mx-auto">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-lg sm:text-2xl font-bold text-white mb-1">
                  مخصصة
                </div>
                <div className="text-white/80 text-xs sm:text-sm">
                  لاهتماماتك
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full mb-2 sm:mb-3 mx-auto">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-lg sm:text-2xl font-bold text-white mb-1">
                  متنوعة
                </div>
                <div className="text-white/80 text-xs sm:text-sm">
                  فئات مختلفة
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="group flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-white text-purple-600 rounded-xl sm:rounded-2xl font-bold hover:bg-white/90 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base"
              >
                {refreshing ? (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-500" />
                )}
                تحديث التوصيات
              </button>

              <button
                onClick={handleGenerateNew}
                disabled={refreshing}
                className="group flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl sm:rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base"
              >
                <Star className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                توليد توصيات جديدة
              </button>

              <button
                onClick={handleTourStart}
                className="group flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-white/20 backdrop-blur-sm text-white font-bold rounded-xl sm:rounded-2xl hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base border border-white/30"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                جولة تعريفية
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {activeTab === "recommendations" && (
          <div
            id="filter-section"
            className="mb-6 sm:mb-8 bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-800">
                فلاتر متقدمة
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Filter by Type */}
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  نوع التوصية
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md text-sm sm:text-base"
                >
                  {filterTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Recommendations */}
              <div id="limit-section" className="space-y-2 sm:space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  عدد التوصيات
                </label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md text-sm sm:text-base"
                >
                  {limitOptions.map((option) => (
                    <option key={option} value={option}>
                      {option} توصية
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  إجراءات سريعة
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLimit(5)}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                  >
                    قليل
                  </button>
                  <button
                    onClick={() => setLimit(15)}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                  >
                    متوسط
                  </button>
                  <button
                    onClick={() => setLimit(25)}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                  >
                    كثير
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Tabs */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-1 sm:p-2 border border-gray-100">
            <nav className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex items-center justify-center sm:justify-start gap-2 sm:gap-3 py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg transform scale-105"
                        : "text-gray-600 hover:text-purple-600 hover:bg-purple-50 hover:shadow-md"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${
                        activeTab === tab.id
                          ? "scale-110"
                          : "group-hover:scale-110"
                      }`}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="space-y-8">
          {activeTab === "recommendations" && (
            <div
              id="recommendations-section"
              className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100"
            >
              <div className="mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2 sm:gap-3">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                  توصياتك الذكية
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  أحاديث مخصصة لك بناءً على قراءاتك واهتماماتك
                </p>
              </div>
              <SmartRecommendations
                limit={limit}
                showTitle={false}
                filterType={filterType}
              />
            </div>
          )}

          {activeTab === "stats" && (
            <div
              id="stats-tab"
              className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100"
            >
              <div className="mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2 sm:gap-3">
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  إحصائياتك الشخصية
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  تتبع تقدمك واهتماماتك في قراءة الأحاديث
                </p>
              </div>
              <UserStats />
            </div>
          )}
        </div>

        {/* Enhanced Info Section */}
        <div className="mt-8 sm:mt-16 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-white/10 rounded-full -translate-y-16 sm:-translate-y-32 translate-x-16 sm:translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-48 sm:h-48 bg-white/5 rounded-full translate-y-12 sm:translate-y-24 -translate-x-12 sm:-translate-x-24"></div>

          <div className="relative text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4 sm:mb-6">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3 sm:mb-4">
              كيف تعمل التوصيات الذكية؟
            </h3>
            <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed px-2">
              نظام ذكي متقدم يحلل قراءاتك ويقدم لك أفضل الأحاديث المناسبة
              لاهتماماتك
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <span className="text-2xl sm:text-3xl">🔍</span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
                تحليل اهتماماتك
              </h4>
              <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                نحلل الأحاديث التي تقرأها والمواضيع التي تهتم بها لفهم تفضيلاتك
                الشخصية
              </p>
            </div>

            <div className="text-center group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <span className="text-2xl sm:text-3xl">🤖</span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
                خوارزميات ذكية
              </h4>
              <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                نستخدم خوارزميات متقدمة لربط اهتماماتك بأحاديث جديدة ومناسبة
              </p>
            </div>

            <div className="text-center group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <span className="text-2xl sm:text-3xl">⭐</span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
                توصيات مخصصة
              </h4>
              <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                نقدم لك توصيات شخصية تناسب اهتماماتك وقراءاتك بشكل مثالي
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Tips Section */}
        <div className="mt-8 sm:mt-12 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-amber-200">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 shadow-lg">
              <span className="text-xl sm:text-2xl">💡</span>
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-800 mb-2 sm:mb-3">
              نصائح للحصول على توصيات أفضل
            </h3>
            <p className="text-amber-700 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-2">
              اتبع هذه النصائح الذهبية لتحسين جودة التوصيات المقدمة لك
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg border border-amber-200 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-blue-600 font-bold text-sm sm:text-lg">
                    📖
                  </span>
                </div>
                <h4 className="font-bold text-gray-800 text-base sm:text-lg">
                  اقرأ بانتظام
                </h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                اقرأ الأحاديث بانتظام لتطوير أنماط قراءتك وتحسين التوصيات
                المقدمة لك
              </p>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg border border-amber-200 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-purple-600 font-bold text-sm sm:text-lg">
                    💾
                  </span>
                </div>
                <h4 className="font-bold text-gray-800 text-base sm:text-lg">
                  احفظ المهمة
                </h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                احفظ الأحاديث المهمة لتخصيص التوصيات أكثر وتطوير ذوقك الشخصي
              </p>
            </div>
          </div>
        </div>

        {/* Beautiful Tour Modal */}
        <AnimatePresence>
          {showTour && isTourVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  duration: 0.4,
                }}
                className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-sm sm:max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-2 sm:mx-0"
              >
                {/* Progress Bar */}
                <div className="h-1 bg-gray-200">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${tourSteps[tourStep].color}`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((tourStep + 1) / tourSteps.length) * 100}%`,
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                <div className="p-4 sm:p-6 lg:p-8">
                  {/* Header */}
                  <div className="text-center mb-6 sm:mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.2,
                        type: "spring",
                        stiffness: 200,
                      }}
                      className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r ${tourSteps[tourStep].color} rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-lg`}
                    >
                      {React.createElement(tourSteps[tourStep].icon, {
                        className: "w-8 h-8 sm:w-10 sm:h-10 text-white",
                      })}
                    </motion.div>

                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 sm:mb-4 px-2"
                    >
                      {tourSteps[tourStep].title}
                    </motion.h3>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-gray-600 leading-relaxed text-sm sm:text-base lg:text-lg px-2"
                    >
                      {tourSteps[tourStep].description}
                    </motion.p>
                  </div>

                  {/* Action Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mb-6 sm:mb-8"
                  >
                    <button
                      className={`px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r ${tourSteps[tourStep].color} text-white font-bold rounded-lg sm:rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-sm sm:text-base`}
                    >
                      {tourSteps[tourStep].action}
                    </button>
                  </motion.div>

                  {/* Navigation */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
                    {/* Step Indicators */}
                    <div className="flex space-x-1.5 sm:space-x-2">
                      {tourSteps.map((_, index) => (
                        <motion.div
                          key={index}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 * index }}
                          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                            index === tourStep
                              ? `bg-gradient-to-r ${tourSteps[tourStep].color} shadow-lg`
                              : index < tourStep
                              ? "bg-green-400"
                              : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                      {tourStep > 0 && (
                        <motion.button
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 }}
                          onClick={handleTourPrevious}
                          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-300 text-sm sm:text-base flex-1 sm:flex-none"
                        >
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          السابق
                        </motion.button>
                      )}

                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        onClick={handleTourSkip}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-300 text-sm sm:text-base flex-1 sm:flex-none"
                      >
                        <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        تخطي
                      </motion.button>

                      {tourStep < tourSteps.length - 1 ? (
                        <motion.button
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 }}
                          onClick={handleTourNext}
                          className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 bg-gradient-to-r ${tourSteps[tourStep].color} text-white font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-sm sm:text-base flex-1 sm:flex-none`}
                        >
                          التالي
                          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </motion.button>
                      ) : (
                        <motion.button
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 }}
                          onClick={handleTourComplete}
                          className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-sm sm:text-base flex-1 sm:flex-none"
                        >
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          ابدأ الآن
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SmartRecommendationsPage;
