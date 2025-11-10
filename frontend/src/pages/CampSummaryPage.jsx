import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import {
  Trophy,
  CheckCheck,
  BookHeart,
  Bookmark,
  ArrowUp,
  Star,
  Download,
  Sparkles,
  BookOpen,
  TrendingUp,
  Zap,
  Flame,
  TrendingUp as TrendingUpIcon,
  ThumbsUp,
  Target,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Award,
  Crown,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import SEO from "../components/SEO";
import { toPng } from "html-to-image";

const CampSummaryPage = () => {
  const { id: campId } = useParams();
  const navigate = useNavigate();
  const [summaryData, setSummaryData] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const summaryCardRef = useRef(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("يجب تسجيل الدخول لعرض الملخص");
      }

      // جلب الملخص
      const summaryResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/quran-camps/${campId}/my-summary`,
        {
          headers: { "x-auth-token": token },
        }
      );

      if (!summaryResponse.ok) {
        if (summaryResponse.status === 404) {
          throw new Error("المخيم غير موجود");
        } else if (summaryResponse.status === 403) {
          throw new Error("غير مصرح لك بالوصول لهذا الملخص");
        } else {
          throw new Error(`خطأ في الخادم: ${summaryResponse.status}`);
        }
      }

      // جلب بيانات التقدم (للرسوم البيانية)
      const progressResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/quran-camps/${campId}/my-progress`,
        {
          headers: { "x-auth-token": token },
        }
      );

      const summaryResult = await summaryResponse.json();
      const progressResult = await progressResponse.json();

      if (summaryResult.success) {
        setSummaryData(summaryResult.data);
        setError(null);
      } else {
        throw new Error(summaryResult.message || "فشل في تحميل الملخص");
      }

      if (progressResult.success) {
        setUserProgress(progressResult.data);
      } else {
        // Progress data is optional, so we don't throw an error
        console.warn("Failed to load progress data:", progressResult.message);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      setError(
        error.message || "حدث خطأ أثناء تحميل الملخص. يرجى المحاولة مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campId) {
      fetchSummary();
    }
  }, [campId]);

  // تشغيل confetti عند تحميل الصفحة بنجاح
  useEffect(() => {
    if (summaryData && !loading && !error) {
      setShowConfetti(true);
      // إيقاف confetti بعد 5 ثوان
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [summaryData, loading, error]);

  // تحديث أبعاد النافذة عند تغيير الحجم
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // دالة لإعادة تشغيل confetti
  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
  };

  const handleDownloadImage = () => {
    if (summaryCardRef.current === null) {
      return;
    }
    toPng(summaryCardRef.current, {
      cacheBust: true,
      backgroundColor: "#ffffff",
      pixelRatio: 2,
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `ملخص-مخيم-${campId}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#7440E9] mx-auto"></div>
          <p className="mt-6 text-lg text-gray-700 font-semibold">
            جاري تحميل ملخصك... لحظات!
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">حدث خطأ</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchSummary();
              }}
              className="px-6 py-2 bg-[#7440E9] text-white rounded-lg hover:bg-[#5a2fc7] transition-colors font-semibold"
            >
              إعادة المحاولة
            </button>
            <button
              onClick={() => navigate("/quran-camps")}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              العودة للمخيمات
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            لم يتم العثور على ملخص لهذا المخيم.
          </p>
          <Link
            to="/quran-camps"
            className="text-[#7440E9] hover:underline font-semibold"
          >
            العودة للمخيمات
          </Link>
        </div>
      </div>
    );
  }

  // إعداد بيانات الرسوم البيانية
  const prepareChartData = () => {
    // إذا كان لدينا بيانات tasks من userProgress، استخدمها
    if (userProgress?.tasks && userProgress.tasks.length > 0) {
      const daysData = [];
      const tasksByDay = {};

      // تجميع المهام حسب اليوم
      userProgress.tasks.forEach((task) => {
        if (!tasksByDay[task.day_number]) {
          tasksByDay[task.day_number] = { total: 0, completed: 0 };
        }
        tasksByDay[task.day_number].total++;
        if (task.completed) {
          tasksByDay[task.day_number].completed++;
        }
      });

      // إعداد بيانات لكل يوم
      for (
        let day = 1;
        day <=
        (summaryData?.totalCampDays || Object.keys(tasksByDay).length || 7);
        day++
      ) {
        const dayData = tasksByDay[day] || { total: 0, completed: 0 };
        daysData.push({
          day: `يوم ${day}`,
          completed: dayData.completed,
          total: dayData.total,
          percentage:
            dayData.total > 0
              ? Math.round((dayData.completed / dayData.total) * 100)
              : 0,
        });
      }

      return daysData;
    }

    // إذا لم يكن لدينا tasks، أنشئ بيانات افتراضية بناءً على summaryData
    if (summaryData) {
      const daysData = [];
      const totalCampDays = summaryData.totalCampDays || 7;
      const completedTasks = summaryData.totalTasks || 0;
      const totalTasks = summaryData.totalTasksForCamp || completedTasks;
      const tasksPerDay =
        totalCampDays > 0 ? Math.ceil(totalTasks / totalCampDays) : 0;

      for (let day = 1; day <= totalCampDays; day++) {
        // توزيع المهام المكتملة على الأيام (تقريبي)
        const completedForDay =
          day <= summaryData.daysCompleted
            ? Math.min(
                completedTasks / summaryData.daysCompleted || 0,
                tasksPerDay
              )
            : 0;

        daysData.push({
          day: `يوم ${day}`,
          completed: Math.round(completedForDay),
          total: tasksPerDay,
          percentage:
            tasksPerDay > 0
              ? Math.round((completedForDay / tasksPerDay) * 100)
              : 0,
        });
      }

      return daysData;
    }

    return [];
  };

  const chartData = prepareChartData();

  // بيانات Pie Chart للمهام (استخدام البيانات الفعلية من API)
  const totalTasksForCamp =
    summaryData?.totalTasksForCamp || summaryData?.totalTasks || 0;
  const completedTasks = summaryData?.totalTasks || 0;
  const incompleteTasks =
    summaryData?.incompleteTasks !== undefined
      ? summaryData.incompleteTasks
      : Math.max(0, totalTasksForCamp - completedTasks);

  const tasksPieData = [
    {
      name: "مكتملة",
      value: completedTasks,
      color: "#10b981",
    },
    ...(incompleteTasks > 0
      ? [
          {
            name: "غير مكتملة",
            value: incompleteTasks,
            color: "#e5e7eb",
          },
        ]
      : []),
  ].filter((item) => item.value > 0);

  // بيانات Pie Chart للتأثير
  const impactPieData = [
    {
      name: "مفيد تلقيت",
      value: summaryData?.upvotesReceived || 0,
      color: "#8b5cf6",
    },
    {
      name: "مفيد قدمت",
      value: summaryData?.upvotesGiven || 0,
      color: "#ec4899",
    },
  ].filter((item) => item.value > 0);

  // ألوان الرسوم البيانية
  const CHART_COLORS = {
    primary: "#7440E9",
    secondary: "#3b82f6",
    accent: "#8b5cf6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
  };

  const completionPercentage = summaryData.totalCampDays
    ? Math.round((summaryData.daysCompleted / summaryData.totalCampDays) * 100)
    : 0;

  return (
    <>
      <SEO
        title={`ملخص ${summaryData.campName}`}
        description="حصاد رحلتك في المخيم القرآني."
      />

      {/* Confetti Effect */}
      {showConfetti && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 9999 }}
        >
          <Confetti
            width={windowDimensions.width}
            height={windowDimensions.height}
            recycle={false}
            numberOfPieces={200}
            colors={[
              "#7440E9",
              "#F7F6FB",
              "#F3EDFF",
              "#E9E4F5",
              "#FFD700",
              "#FF6B6B",
              "#4ECDC4",
              "#45B7D1",
            ]}
            gravity={0.3}
            initialVelocityY={20}
            initialVelocityX={5}
          />
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] relative overflow-hidden">
        {/* Decorative Background Elements (الهوية البصرية) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large Purple Dots */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-20 right-20 w-64 h-64 bg-[#7440E9]/20 rounded-full blur-xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute bottom-20 left-20 w-80 h-80 bg-[#7440E9]/15 rounded-full blur-2xl"
          />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300/5 rounded-full blur-3xl"></div>
        </div>

        <motion.div
          ref={summaryCardRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 bg-white rounded-3xl shadow-2xl border-2 border-purple-100/50 m-4"
        >
          {/* --- 1. Header احتفالي --- */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-[#7440E9]/20 rounded-full blur-2xl animate-pulse"></div>
                <Trophy className="w-28 h-28 text-[#7440E9] mx-auto mb-6 drop-shadow-lg relative z-10" />
              </div>
            </motion.div>
            <h1 className="text-5xl font-bold text-[#7440E9] mb-3">
              مبارك يا {summaryData.userName}! 🎉
            </h1>
            <p className="text-2xl text-gray-700 font-medium">
              لقد أتممت رحلة "{summaryData.campName}" بنجاح!
            </p>
            {summaryData.percentile !== undefined &&
              summaryData.percentile !== null &&
              summaryData.percentile >= 0 && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F7F6FB] to-[#F3EDFF] rounded-full border-2 border-[#7440E9]/30 shadow-lg">
                  <div className="p-1 bg-gradient-to-br from-[#7440E9] to-purple-600 rounded-full">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[#7440E9] font-semibold">
                    {summaryData.percentile >= 50
                      ? `أنت ضمن أفضل ${summaryData.percentile}% من المشاركين`
                      : summaryData.percentile > 0
                      ? `أنت ضمن أفضل ${summaryData.percentile}% من المشاركين`
                      : "شارك في المخيم واكسب نقاطاً!"}
                  </span>
                </div>
              )}
          </motion.div>

          {/* --- 2. بطاقات الإحصائيات الرئيسية --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* بطاقة النقاط */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-purple-200/50 shadow-xl p-6 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-[#7440E9] to-purple-600 rounded-xl shadow-lg">
                  <Star className="w-6 h-6 text-white fill-current" />
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-[#7440E9]">
                    {summaryData.totalPoints}
                  </p>
                  <p className="text-sm text-gray-600">نقطة مكتسبة</p>
                </div>
              </div>
            </motion.div>

            {/* بطاقة الأيام */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-blue-200/50 shadow-xl p-6 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-blue-600">
                    {summaryData.daysCompleted}/{summaryData.totalCampDays || 0}
                  </p>
                  <p className="text-sm text-gray-600">يوم مكتمل</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                />
              </div>
            </motion.div>

            {/* بطاقة المهام */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-green-200/50 shadow-xl p-6 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-green-600">
                    {summaryData.totalTasks}
                  </p>
                  <p className="text-sm text-gray-600">مهمة مكتملة</p>
                </div>
              </div>
            </motion.div>

            {/* بطاقة الـ Streak */}
            {summaryData.longestStreak && summaryData.longestStreak > 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-orange-200/50 shadow-xl p-6 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-orange-600">
                      {summaryData.longestStreak}
                    </p>
                    <p className="text-sm text-gray-600">أيام متتالية</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-purple-200/50 shadow-xl p-6 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl">
                    <BookHeart className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-purple-600">
                      {summaryData.reflectionsWritten}
                    </p>
                    <p className="text-sm text-gray-600">فائدة كتبتها</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* --- 3. الرسوم البيانية الرئيسية --- */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* رسم بياني للمهام اليومية (محسّن) */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-purple-200/50 shadow-xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#7440E9]" />
                    <h3 className="text-xl font-bold text-gray-800">
                      تقدم المهام اليومية
                    </h3>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#7440E9] to-[#9F7AEA] text-white rounded-full shadow-md">
                      <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                      <span className="font-medium">✅ مكتملة</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-full shadow-md">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div>
                      <span className="font-medium">📋 إجمالي</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    barCategoryGap="20%"
                  >
                    <defs>
                      <linearGradient
                        id="completedGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#7440E9" />
                        <stop offset="100%" stopColor="#9F7AEA" />
                      </linearGradient>
                      <linearGradient
                        id="totalGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#E5E7EB" />
                        <stop offset="100%" stopColor="#D1D5DB" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#F3F4F6"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#6B7280",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                      tickFormatter={(value) => `اليوم ${value}`}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#6B7280",
                        fontSize: 12,
                      }}
                      allowDecimals={false}
                      label={{
                        value: "عدد المهام",
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          textAnchor: "middle",
                          fill: "#6B7280",
                          fontSize: 12,
                          fontWeight: 500,
                        },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "none",
                        borderRadius: "16px",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                        padding: "16px",
                        direction: "rtl",
                        fontSize: "14px",
                      }}
                      labelStyle={{
                        color: "#374151",
                        fontWeight: "600",
                        marginBottom: "8px",
                        fontSize: "14px",
                      }}
                      formatter={(value, name) => {
                        const icon = name === "مهام مكتملة" ? "✅" : "📋";
                        return [`${icon} ${value} مهمة`, name];
                      }}
                      labelFormatter={(label) => `📅 ${label}`}
                    />
                    <Bar
                      dataKey="total"
                      name="إجمالي المهام"
                      fill="url(#totalGradient)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="completed"
                      name="مهام مكتملة"
                      fill="url(#completedGradient)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>

                {/* إحصائيات سريعة تحت الشارت */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-[#7440E9]/10 to-[#9F7AEA]/10 rounded-xl border border-[#7440E9]/20">
                    <div className="text-2xl font-bold text-[#7440E9]">
                      {chartData.reduce((sum, day) => sum + day.completed, 0)}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      مهام مكتملة
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border border-gray-300">
                    <div className="text-2xl font-bold text-gray-700">
                      {chartData.reduce((sum, day) => sum + day.total, 0)}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      إجمالي المهام
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl border border-green-300">
                    <div className="text-2xl font-bold text-green-600">
                      {chartData.length > 0
                        ? Math.round(
                            (chartData.reduce(
                              (sum, day) => sum + day.completed,
                              0
                            ) /
                              chartData.reduce(
                                (sum, day) => sum + day.total,
                                0
                              )) *
                              100
                          )
                        : 0}
                      %
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      نسبة الإنجاز
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl border border-blue-300">
                    <div className="text-2xl font-bold text-blue-600">
                      {chartData.length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      أيام المخيم
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Pie Chart للمهام */}
              {tasksPieData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-blue-200/50 shadow-xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <PieChart className="w-5 h-5 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-800">
                      توزيع المهام
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={tasksPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tasksPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Bar Chart للمساهمات */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-green-200/50 shadow-xl p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-800">مساهماتك</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      {
                        name: "فوائد كتبتها",
                        value: summaryData.reflectionsWritten || 0,
                      },
                      {
                        name: "فوائد حفظتها",
                        value: summaryData.reflectionsSaved || 0,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill={CHART_COLORS.secondary}
                      radius={[8, 8, 0, 0]}
                      name="العدد"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Pie Chart للتأثير */}
              {impactPieData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-pink-200/50 shadow-xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <ThumbsUp className="w-5 h-5 text-pink-600" />
                    <h3 className="text-xl font-bold text-gray-800">تأثيرك</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={impactPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {impactPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </div>
          )}

          {/* --- 4. مخطط تقدم المهام خلال الأيام (Grouped Bar Chart) --- */}
          {chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-indigo-200/50 shadow-xl p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xl font-bold text-gray-800">
                    تقدم المهام خلال الأيام
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-3 rounded bg-gradient-to-br from-[#7440E9] to-purple-600 shadow-sm"></div>
                    <span className="text-gray-700 font-semibold">مكتملة</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-3 rounded bg-gray-300"></div>
                    <span className="text-gray-700 font-semibold">إجمالي</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 20, left: 10, bottom: 15 }}
                  barCategoryGap="20%"
                >
                  <defs>
                    <linearGradient
                      id="completedBarGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#7440E9" stopOpacity={1} />
                      <stop
                        offset="100%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.9}
                      />
                    </linearGradient>
                    <linearGradient
                      id="totalBarGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#9ca3af" stopOpacity={0.6} />
                      <stop
                        offset="100%"
                        stopColor="#d1d5db"
                        stopOpacity={0.4}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                    horizontal={true}
                  />
                  <XAxis
                    dataKey="day"
                    stroke="#6b7280"
                    fontSize={13}
                    tick={{ fill: "#4b5563", fontWeight: 600 }}
                    tickLine={{ stroke: "#9ca3af" }}
                    axisLine={{ stroke: "#d1d5db", strokeWidth: 2 }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={13}
                    tick={{ fill: "#4b5563", fontWeight: 600 }}
                    tickLine={{ stroke: "#9ca3af" }}
                    axisLine={{ stroke: "#d1d5db", strokeWidth: 2 }}
                    allowDecimals={false}
                    domain={[0, "dataMax + 1"]}
                    label={{
                      value: "عدد المهام",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        textAnchor: "middle",
                        fill: "#6b7280",
                        fontWeight: 600,
                        fontSize: 13,
                      },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "2px solid #7440E9",
                      borderRadius: "12px",
                      boxShadow: "0 8px 24px rgba(116, 64, 233, 0.25)",
                      padding: "16px",
                      direction: "rtl",
                    }}
                    labelStyle={{
                      color: "#7440E9",
                      fontWeight: "bold",
                      marginBottom: "12px",
                      fontSize: "16px",
                    }}
                    itemStyle={{
                      color: "#374151",
                      fontSize: "15px",
                      fontWeight: 600,
                      padding: "4px 0",
                    }}
                    formatter={(value, name) => {
                      if (name === "مهام مكتملة") {
                        return [`${value} مهمة`, "✅ " + name];
                      }
                      if (name === "إجمالي المهام") {
                        return [`${value} مهمة`, "📋 " + name];
                      }
                      return [`${value}`, name];
                    }}
                    separator=": "
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "30px", paddingBottom: "10px" }}
                    iconType="square"
                    iconSize={14}
                    formatter={(value) => (
                      <span
                        style={{
                          color: "#4b5563",
                          fontSize: "14px",
                          fontWeight: 600,
                          marginRight: "8px",
                        }}
                      >
                        {value}
                      </span>
                    )}
                  />
                  {/* إجمالي المهام */}
                  <Bar
                    dataKey="total"
                    fill="url(#totalBarGradient)"
                    name="إجمالي المهام"
                    radius={[6, 6, 0, 0]}
                    barSize={50}
                    stroke="#9ca3af"
                    strokeWidth={1}
                  />
                  {/* المهام المكتملة */}
                  <Bar
                    dataKey="completed"
                    fill="url(#completedBarGradient)"
                    name="مهام مكتملة"
                    radius={[6, 6, 0, 0]}
                    barSize={50}
                    stroke="#7440E9"
                    strokeWidth={2}
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* إحصائيات سريعة أسفل الرسم */}
              <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#7440E9]">
                    {summaryData?.totalTasks || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    إجمالي مكتملة
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">
                    {summaryData?.totalTasksForCamp ||
                      summaryData?.totalTasks ||
                      0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    إجمالي المهام
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {summaryData?.totalTasksForCamp && summaryData?.totalTasks
                      ? Math.round(
                          (summaryData.totalTasks /
                            summaryData.totalTasksForCamp) *
                            100
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-gray-600 mt-1">نسبة الإتمام</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- 5. بطاقة خطة العمل --- */}
          {summaryData.actionPlan && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 }}
              className=" bg-[#7440E9] text-white rounded-2xl shadow-2xl p-8 mb-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-20 -translate-x-20"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Target className="w-6 h-6 text-yellow-300" />
                  </div>
                  <h3 className="text-2xl font-bold">التزامك للمستقبل</h3>
                </div>
                {typeof summaryData.actionPlan === "object" ? (
                  <div className="bg-white/10 rounded-xl p-4 border border-white/20 space-y-3">
                    <div>
                      <span className="text-yellow-200 font-semibold">
                        ماذا:
                      </span>
                      <p className="text-lg leading-relaxed mt-1">
                        {summaryData.actionPlan.what}
                      </p>
                    </div>
                    <div>
                      <span className="text-yellow-200 font-semibold">
                        متى:
                      </span>
                      <p className="text-lg leading-relaxed mt-1">
                        {summaryData.actionPlan.when}
                      </p>
                    </div>
                    {summaryData.actionPlan.measure && (
                      <div>
                        <span className="text-yellow-200 font-semibold">
                          كيف أقيس:
                        </span>
                        <p className="text-lg leading-relaxed mt-1">
                          {summaryData.actionPlan.measure}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-lg leading-relaxed  bg-white/10 rounded-xl p-4 border border-white/20">
                    "{summaryData.actionPlan}"
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* --- 6. أبرز المساهمات (الهوية البصرية) --- */}
          {summaryData.topReflection && summaryData.topReflection.text && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-purple-200/50 shadow-xl p-6 mb-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2  bg-[#7440E9] rounded-lg">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#7440E9]">
                  أبرز مساهماتك
                </h3>
              </div>
              <div className="bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] rounded-xl p-6 border-1 border-[#7440E9]">
                <p className="text-gray-700 text-lg leading-relaxed  mb-4 text-right">
                  "{summaryData.topReflection.text}"
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <div className="p-1.5 bg-[#7440E9]/10 rounded-full">
                    <ThumbsUp className="w-4 h-4 text-[#7440E9]" />
                  </div>
                  <span className="text-[#7440E9] font-bold">
                    {summaryData.topReflection.upvotes} 'مفيد'
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- قسم "الخطوات التالية" --- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="text-center space-y-6 mb-8"
          >
            <div className="text-center mb-8">
              <h3 className="text-4xl font-bold bg-gradient-to-r from-[#7440E9] to-[#9F7AEA] bg-clip-text text-transparent mb-2">
                ماذا بعد؟
              </h3>
              <p className="text-gray-600 text-lg">
                استمر في رحلتك القرآنية واكتشف المزيد
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* زر العودة للمخيم */}
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/quran-camps/${campId}`)}
                className="group relative overflow-hidden bg-gradient-to-br from-[#7440E9] to-[#9F7AEA] p-6 rounded-3xl shadow-2xl hover:shadow-[#7440E9]/25 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    العودة للمخيم
                  </h4>
                  <p className="text-white/80 text-sm">مراجعة تفاصيل المخيم</p>
                </div>
              </motion.button>

              {/* زر حفظ الملخص */}
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadImage}
                className="group relative overflow-hidden bg-white border-2 border-[#7440E9] p-6 rounded-3xl shadow-2xl hover:shadow-[#7440E9]/25 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#7440E9]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[#7440E9]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#7440E9]/20 transition-colors duration-300">
                    <Download className="w-8 h-8 text-[#7440E9]" />
                  </div>
                  <h4 className="text-xl font-bold text-[#7440E9] mb-2">
                    حفظ الملخص
                  </h4>
                  <p className="text-gray-600 text-sm">تحميل صورة الإنجاز</p>
                </div>
              </motion.button>

              {/* زر استكشاف مخيمات أخرى */}
              <Link
                to="/quran-camps"
                className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 block"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                    <TrendingUpIcon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    مخيمات أخرى
                  </h4>
                  <p className="text-white/80 text-sm">اكتشف رحلات جديدة</p>
                </div>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default CampSummaryPage;
