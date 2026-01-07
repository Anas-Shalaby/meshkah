import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Trophy,
  BookOpen,
  Star,
  CheckCircle,
  ExternalLink,
  User,
  Target,
  TrendingUp,
  Award,
  Eye,
  EyeOff,
  FileText,
  Download,
  File,
  BarChart3,
  Users,
} from "lucide-react";
import SEO from "../components/SEO";
import { useAuth } from "../context/AuthContext";
import RichTadabburEditor from "../components/RichTadabburEditor";

const MyCampJourneyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingTask, setCompletingTask] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [journalEntry, setJournalEntry] = useState("");
  const [notes, setNotes] = useState("");
  const [benefits, setBenefits] = useState("");
  const [shareInStudyHall, setShareInStudyHall] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [extractingBenefits, setExtractingBenefits] = useState(null);
  const [benefitsModal, setBenefitsModal] = useState(null);
  const [notesStats, setNotesStats] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchProgress = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/quran-camps/${id}/my-progress`,
          {
            headers: {
              "x-auth-token": localStorage.getItem("token"),
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setProgress(data.data);

          // Auto-select current day
          if (data.data.enrollment) {
            const daysSinceStart = Math.floor(
              (new Date() - new Date(data.data.enrollment.camp_start_date)) /
                (1000 * 60 * 60 * 24)
            );
            const currentDay = Math.min(
              Math.max(daysSinceStart + 1, 1),
              data.data.enrollment.duration_days || 1
            );
            setSelectedDay(currentDay);
          }
        } else {
          setError(data.message || "حدث خطأ في جلب التقدم");
        }
      } catch (err) {
        setError("حدث خطأ في جلب التقدم");
        console.error("Error fetching progress:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProgress();
      fetchNotesStats();
    }
  }, [id, user, navigate]);

  const fetchNotesStats = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/notes-export/camp/${id}/notes/stats`,
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setNotesStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching notes stats:", error);
    }
  };

  const handleExportNotes = async (format) => {
    try {
      setExporting(true);

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/notes-export/camp/${id}/notes/${format}`,
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في تصدير الملاحظات");
      }

      // تحميل الملف
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // تحديد اسم الملف حسب التنسيق
      const campName = progress?.camp?.name || "المخيم";
      const fileName = `ملاحظات_مخيم_${campName.replace(
        /\s+/g,
        "_"
      )}.${format}`;
      a.download = fileName;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // تحديث الإحصائيات بعد التصدير
      await fetchNotesStats();
    } catch (error) {
      console.error("Error exporting notes:", error);
      alert("حدث خطأ أثناء تصدير الملاحظات");
    } finally {
      setExporting(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      setCompletingTask(taskId);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/quran-camps/tasks/${taskId}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": localStorage.getItem("token"),
          },
          body: JSON.stringify({
            journal_entry: journalEntry,
            notes: `${
              benefits ? `الفوائد المستخرجة:\n${benefits}\n\n` : ""
            }${notes}`,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Refresh progress
        const progressResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/quran-camps/${id}/my-progress`,
          {
            headers: {
              "x-auth-token": localStorage.getItem("token"),
            },
          }
        );
        const progressData = await progressResponse.json();
        if (progressData.success) {
          setProgress(progressData.data);
        }

        setCompletingTask(null);
        setJournalEntry("");
        setNotes("");
        setBenefits("");

        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        alert(data.message || "حدث خطأ في إكمال المهمة");
      }
    } catch (err) {
      console.error("Error completing task:", err);
      alert("حدث خطأ في إكمال المهمة");
    } finally {
      setCompletingTask(null);
      setJournalEntry("");
      setNotes("");
      setBenefits("");
    }
  };

  const getTaskTypeIcon = (taskType) => {
    switch (taskType) {
      case "reading":
        return <BookOpen className="w-4 h-4" />;
      case "memorization":
        return <Trophy className="w-4 h-4" />;
      case "prayer":
        return <Star className="w-4 h-4" />;
      case "tafseer_tabari":
      case "tafseer_kathir":
        return <BookOpen className="w-4 h-4" />;
      case "youtube":
        return <ExternalLink className="w-4 h-4" />;
      case "journal":
        return <User className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTaskTypeText = (taskType) => {
    switch (taskType) {
      case "reading":
        return "قراءة";
      case "memorization":
        return "حفظ";
      case "prayer":
        return "صلاة";
      case "tafseer_tabari":
        return "تفسير الطبري";
      case "tafseer_kathir":
        return "تفسير ابن كثير";
      case "youtube":
        return "فيديو";
      case "journal":
        return "يوميات";
      default:
        return "مهمة";
    }
  };

  const getTaskTypeColor = (taskType) => {
    switch (taskType) {
      case "reading":
        return "bg-blue-100 text-blue-800";
      case "memorization":
        return "bg-yellow-100 text-yellow-800";
      case "prayer":
        return "bg-green-100 text-green-800";
      case "tafseer_tabari":
      case "tafseer_kathir":
        return "bg-purple-100 text-purple-800";
      case "youtube":
        return "bg-red-100 text-red-800";
      case "journal":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const groupTasksByDay = (tasks) => {
    return tasks.reduce((groups, task) => {
      const day = task.day_number;
      if (!groups[day]) {
        groups[day] = [];
      }
      groups[day].push(task);
      return groups;
    }, {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
          <p className="text-xl font-bold text-gray-700 mb-2">
            جاري تحميل رحلتك...
          </p>
          <p className="text-gray-600">استعد لرحلة رائعة مع القرآن الكريم</p>
        </div>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border-2 border-red-200 max-w-md mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-black text-red-900 mb-4">حدث خطأ</h3>
          <p className="text-red-700 font-medium mb-8">
            {error || "لا يمكن تحميل التقدم"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 shadow-xl hover:shadow-2xl font-bold text-lg transform hover:scale-105"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const tasksByDay = groupTasksByDay(progress.tasks || []);
  const today = new Date().toDateString();
  const campStartDate = new Date(
    progress.enrollment.camp_start_date
  ).toDateString();
  const daysSinceStart = Math.floor(
    (new Date() - new Date(progress.enrollment.camp_start_date)) /
      (1000 * 60 * 60 * 24)
  );

  // Check camp status
  const campStatus = progress.enrollment.camp_status;
  const isReadOnly = campStatus === "completed";
  const isCampNotStarted = campStatus === "early_registration";

  // Debug logging
  console.log("Camp start date:", progress.enrollment.camp_start_date);
  console.log("Current date:", new Date().toISOString());
  console.log("Days since start:", daysSinceStart);
  console.log("Selected day:", selectedDay);
  console.log("Tasks by day:", tasksByDay);

  // Calculate remaining days
  const totalDays = progress.enrollment.duration_days || 7;
  const daysRemaining = Math.max(0, totalDays - daysSinceStart);

  // Calculate streak (consecutive days with completed tasks)
  const calculateStreak = () => {
    let streak = 0;
    let currentDay = daysSinceStart;

    while (currentDay > 0) {
      const dayTasks = tasksByDay[currentDay] || [];
      const hasCompletedTask = dayTasks.some((task) => task.completed);

      if (hasCompletedTask) {
        streak++;
        currentDay--;
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  // Calculate daily commitment percentage
  const daysWithTasks = Math.min(daysSinceStart + 1, totalDays);
  const daysCompleted = Object.keys(tasksByDay).filter((day) => {
    const dayNum = parseInt(day);
    if (dayNum > daysSinceStart + 1) return false;
    const dayTasks = tasksByDay[day];
    return dayTasks && dayTasks.some((task) => task.completed);
  }).length;
  const commitmentPercentage =
    daysWithTasks > 0 ? Math.round((daysCompleted / daysWithTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <SEO
        title={`رحلتي في ${progress.enrollment.camp_name} - المخيمات القرآنية`}
        description={`تابع تقدمك في مخيم ${progress.enrollment.camp_name} للتعمق في سورة ${progress.enrollment.surah_name}`}
        keywords={`مخيم قرآني, ${progress.enrollment.surah_name}, حفظ القرآن, تقدم المخيم`}
        canonicalUrl={`${window.location.origin}/my-camp-journey/${campId}`}
        noindex={true}
      />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/quran-camps/${id}`)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              العودة
            </button>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">نقاطك</p>
                <p className="text-lg font-semibold text-gray-900">
                  {progress.enrollment.total_points}
                </p>
              </div>
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Export Notes Section */}
      {notesStats && notesStats.totalNotes > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">
                  تصدير ملاحظاتك
                </h3>
              </div>
              <BarChart3 className="w-5 h-5 text-gray-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {notesStats.totalNotes}
                </div>
                <div className="text-sm text-gray-600">إجمالي الملاحظات</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {notesStats.notesWithReflection}
                </div>
                <div className="text-sm text-gray-600">مع تدبر</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {notesStats.notesWithBenefits}
                </div>
                <div className="text-sm text-gray-600">مع فوائد</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(
                    (notesStats.avgReflectionLength +
                      notesStats.avgBenefitsLength) /
                      2
                  )}
                </div>
                <div className="text-sm text-gray-600">متوسط الطول</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleExportNotes("pdf")}
                disabled={exporting}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <File className="w-4 h-4 mr-2" />
                {exporting ? "جاري التصدير..." : "تصدير PDF"}
              </button>

              <button
                onClick={() => handleExportNotes("excel")}
                disabled={exporting}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {exporting ? "جاري التصدير..." : "تصدير Excel"}
              </button>

              <button
                onClick={() => handleExportNotes("word")}
                disabled={exporting}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4 mr-2" />
                {exporting ? "جاري التصدير..." : "تصدير Word"}
              </button>
            </div>

            <p className="text-sm text-gray-600 mt-4">
              💡 يمكنك تصدير جميع ملاحظاتك وتدبراتك في المخيم بصيغ مختلفة
              للاحتفاظ بها أو مشاركتها
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-8">
            <Link
              to={`/my-camp-journey/${id}`}
              className="flex items-center px-6 py-4 text-purple-600 border-b-2 border-purple-500 font-semibold"
            >
              <Calendar className="w-5 h-5 mr-2" />
              رحلتي
            </Link>
            <Link
              to={`/my-camp-journal/${id}`}
              className="flex items-center px-6 py-4 text-gray-600 hover:text-purple-600 transition-colors border-b-2 border-transparent hover:border-purple-500 font-semibold"
            >
              <FileText className="w-5 h-5 mr-2" />
              يومياتي
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {progress.enrollment.camp_name}
            </h1>
            <p className="text-xl text-blue-600 font-semibold mb-6">
              سورة {progress.enrollment.surah_name}
            </p>

            {/* Countdown Timer */}
            {daysRemaining > 0 && (
              <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 rounded-3xl p-6 md:p-8 mb-8 border-2 border-orange-200 shadow-2xl max-w-4xl mx-auto">
                <div className="flex items-center justify-center mb-4 md:mb-6">
                  <div className="p-3 md:p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mr-3 md:mr-4 shadow-lg">
                    <Clock className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-orange-900">
                    الوقت المتبقي
                  </h3>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-6xl font-black text-orange-900 mb-2">
                    {daysRemaining}
                  </div>
                  <p className="text-lg md:text-xl font-bold text-orange-700 mb-4">
                    {daysRemaining === 1 ? "يوم واحد متبقي" : "أيام متبقية"}
                  </p>
                  {daysRemaining <= 3 && (
                    <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-2xl font-bold text-base md:text-lg animate-pulse">
                      ⚠️ وقت محدود! استغل كل يوم
                    </div>
                  )}
                  {daysRemaining > 3 && daysRemaining <= 7 && (
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-2xl font-bold text-base md:text-lg">
                      💪 استمر في التقدم
                    </div>
                  )}
                  {daysRemaining > 7 && (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-2xl font-bold text-base md:text-lg">
                      🌟 أنت في بداية رحلة رائعة
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Progress Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-7xl mx-auto mb-8 md:mb-12">
              {/* Days Remaining */}
              <div className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-orange-200 hover:shadow-3xl transition-all duration-500 group transform hover:scale-105">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div className="p-3 md:p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Clock className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  {daysRemaining <= 3 && daysRemaining > 0 && (
                    <span className="text-xs md:text-sm bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 md:px-4 py-1 md:py-2 rounded-full font-bold animate-pulse shadow-lg">
                      عاجل!
                    </span>
                  )}
                </div>
                <p className="text-3xl md:text-5xl font-black text-orange-900 mb-2">
                  {daysRemaining}
                </p>
                <p className="text-orange-700 font-bold text-base md:text-lg mb-3">
                  يوم متبقي
                </p>
                <div className="text-xs md:text-sm text-orange-600 font-medium bg-orange-100 rounded-full px-3 md:px-4 py-1 md:py-2">
                  من أصل {totalDays} يوم
                </div>
              </div>

              {/* Streak Counter */}
              <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-green-200 hover:shadow-3xl transition-all duration-500 group transform hover:scale-105">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div className="p-3 md:p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  {currentStreak >= 3 && (
                    <span className="text-2xl md:text-3xl animate-bounce">
                      🔥
                    </span>
                  )}
                </div>
                <p className="text-3xl md:text-5xl font-black text-green-900 mb-2">
                  {currentStreak}
                </p>
                <p className="text-green-700 font-bold text-base md:text-lg mb-3">
                  يوم متتالي
                </p>
                <div className="text-xs md:text-sm text-green-600 font-medium bg-green-100 rounded-full px-3 md:px-4 py-1 md:py-2">
                  {currentStreak >= 5 ? "ممتاز! استمر 💪" : "واصل التحدي!"}
                </div>
              </div>

              {/* Commitment Percentage */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-blue-200 hover:shadow-3xl transition-all duration-500 group transform hover:scale-105">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div className="p-3 md:p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Target className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                </div>
                <p className="text-3xl md:text-5xl font-black text-blue-900 mb-2">
                  {commitmentPercentage}%
                </p>
                <p className="text-blue-700 font-bold text-base md:text-lg mb-3">
                  نسبة الالتزام
                </p>
                <div className="w-full bg-blue-200 rounded-full h-2 md:h-3 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 md:h-3 rounded-full transition-all duration-700 shadow-lg"
                    style={{ width: `${commitmentPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Rank */}
              <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-purple-200 hover:shadow-3xl transition-all duration-500 group transform hover:scale-105">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div className="p-3 md:p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Award className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  {progress.progress.rank <= 3 && (
                    <span className="text-2xl md:text-3xl animate-pulse">
                      {progress.progress.rank === 1
                        ? "🥇"
                        : progress.progress.rank === 2
                        ? "🥈"
                        : "🥉"}
                    </span>
                  )}
                </div>
                <p className="text-3xl md:text-5xl font-black text-purple-900 mb-2">
                  #{progress.progress.rank || "-"}
                </p>
                <p className="text-purple-700 font-bold text-base md:text-lg mb-3">
                  ترتيبك
                </p>
                <div className="text-xs md:text-sm text-purple-600 font-medium bg-purple-100 rounded-full px-3 md:px-4 py-1 md:py-2">
                  {progress.enrollment.total_points} نقطة
                </div>
              </div>
            </div>

            {/* Enhanced Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="bg-gradient-to-br from-white via-purple-50 to-blue-50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-2 border-purple-200 hover:shadow-3xl transition-all duration-500 group transform hover:scale-105">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-purple-700 font-bold text-lg mb-2">
                      المهام المكتملة
                    </p>
                    <p className="text-4xl font-black text-gray-900">
                      {progress.progress.completedTasks} /{" "}
                      {progress.progress.totalTasks}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-4 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-700 shadow-lg"
                    style={{
                      width: `${progress.progress.progressPercentage}%`,
                    }}
                  ></div>
                </div>
                <div className="mt-4 text-sm text-purple-600 font-medium">
                  {progress.progress.progressPercentage}% مكتمل
                </div>
              </div>

              <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-2 border-blue-200 hover:shadow-3xl transition-all duration-500 group transform hover:scale-105">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-blue-700 font-bold text-lg mb-2">
                      نسبة الإنجاز
                    </p>
                    <p className="text-4xl font-black text-gray-900">
                      {progress.progress.progressPercentage}%
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex items-center text-lg font-bold">
                  <Star className="w-6 h-6 text-yellow-500 mr-2" />
                  <span className="text-gray-700">
                    {progress.progress.progressPercentage >= 80
                      ? "أداء ممتاز! 🌟"
                      : progress.progress.progressPercentage >= 50
                      ? "أداء جيد 👍"
                      : "واصل الجهد 💪"}
                  </span>
                </div>
                <div className="mt-4 text-sm text-blue-600 font-medium">
                  {progress.progress.progressPercentage >= 80
                    ? "أنت في الطريق الصحيح!"
                    : progress.progress.progressPercentage >= 50
                    ? "استمر في التقدم"
                    : "ابدأ اليوم!"}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Tasks */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8 flex items-center justify-center">
              <BookOpen className="w-8 h-8 mr-3 text-purple-600" />
              المهام اليومية
            </h2>

            {Object.keys(tasksByDay).length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد مهام متاحة</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Enhanced Calendar View */}
                <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-3xl p-8 shadow-xl border-2 border-purple-200">
                  <h3 className="text-2xl font-black text-gray-900 mb-8 text-center">
                    تقويم المخيم
                  </h3>

                  <div className="grid grid-cols-7 gap-3 mb-6">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div
                        key={i}
                        className="text-center text-base font-bold text-purple-700 py-3 bg-white/80 rounded-xl shadow-lg"
                      >
                        اليوم {i + 1}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-3">
                    {Array.from(
                      { length: progress.enrollment.duration_days },
                      (_, i) => {
                        const dayNumber = i + 1;
                        const hasTasks = tasksByDay[dayNumber];
                        const isCurrentDay = daysSinceStart === dayNumber - 1;
                        const isPastDay = daysSinceStart > dayNumber - 1;
                        const isFutureDay = daysSinceStart < dayNumber - 1;

                        return (
                          <div key={dayNumber} className="col-span-1">
                            <button
                              onClick={() => setSelectedDay(dayNumber)}
                              className={`w-full aspect-square rounded-2xl transition-all duration-500 hover:scale-110 shadow-lg hover:shadow-2xl ${
                                selectedDay === dayNumber
                                  ? "bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 text-white shadow-2xl transform scale-105"
                                  : isCurrentDay
                                  ? "bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 text-white shadow-xl"
                                  : isPastDay
                                  ? "bg-gradient-to-br from-gray-400 via-slate-400 to-zinc-400 text-white shadow-lg"
                                  : "bg-white border-2 border-gray-300 text-gray-600 hover:border-purple-400 hover:bg-purple-50"
                              }`}
                            >
                              <div className="flex flex-col items-center justify-center h-full">
                                <span className="text-xl font-black mb-1">
                                  {dayNumber}
                                </span>
                                {hasTasks && (
                                  <div className="flex space-x-1">
                                    {Array.from({
                                      length: Math.min(hasTasks.length, 3),
                                    }).map((_, idx) => (
                                      <div
                                        key={idx}
                                        className={`w-2 h-2 rounded-full ${
                                          selectedDay === dayNumber ||
                                          isCurrentDay
                                            ? "bg-white"
                                            : "bg-purple-400"
                                        }`}
                                      />
                                    ))}
                                    {hasTasks.length > 3 && (
                                      <span className="text-xs font-bold">
                                        +
                                      </span>
                                    )}
                                  </div>
                                )}
                                {isCurrentDay && (
                                  <div className="text-xs font-bold mt-1 animate-pulse">
                                    اليوم
                                  </div>
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Selected Day Tasks */}
                {selectedDay && tasksByDay[selectedDay] && (
                  <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg mr-4">
                          {selectedDay}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          اليوم {selectedDay}
                        </h3>
                      </div>
                      <div
                        className={`flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                          daysSinceStart >= selectedDay - 1
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {daysSinceStart >= selectedDay - 1 ? "متاح" : "قريباً"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {tasksByDay[selectedDay].map((task, index) => (
                        <div
                          key={index}
                          className={`border-2 rounded-3xl p-8 transition-all duration-500 hover:shadow-2xl transform hover:scale-105 ${
                            task.completed
                              ? "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-300 shadow-green-200"
                              : "bg-gradient-to-br from-white via-gray-50 to-slate-50 border-gray-200 hover:border-purple-300 shadow-lg hover:shadow-xl"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center">
                              <div
                                className={`w-14 h-14 rounded-3xl flex items-center justify-center mr-6 shadow-xl group-hover:scale-110 transition-transform duration-300 ${getTaskTypeColor(
                                  task.task_type
                                )}`}
                              >
                                {getTaskTypeIcon(task.task_type)}
                              </div>
                              <div>
                                <h4 className="font-black text-gray-900 text-xl mb-2">
                                  {task.title}
                                </h4>
                                <p className="text-base text-gray-600 font-bold">
                                  {getTaskTypeText(task.task_type)}
                                </p>
                              </div>
                            </div>

                            {task.completed ? (
                              <div className="flex items-center bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                مكتمل
                              </div>
                            ) : (
                              <div className="flex items-center bg-gradient-to-r from-gray-400 to-slate-400 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                                <div className="w-5 h-5 border-2 border-white rounded-full mr-2" />
                                في الانتظار
                              </div>
                            )}
                          </div>

                          <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                            {task.description}
                          </p>

                          {task.verses_from && task.verses_to && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 mb-6 shadow-lg">
                              <p className="text-base text-blue-800 font-bold flex items-center">
                                <BookOpen className="w-5 h-5 mr-2" />
                                الآيات {task.verses_from} - {task.verses_to}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                              {task.tafseer_link && (
                                <a
                                  href={task.tafseer_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-sm font-bold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  تفسير
                                </a>
                              )}
                              {task.youtube_link && (
                                <a
                                  href={task.youtube_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-sm font-bold hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  فيديو
                                </a>
                              )}
                              {task.is_optional ? (
                                <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-400 to-slate-400 text-white rounded-full text-sm font-bold shadow-lg">
                                  اختياري
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-bold shadow-lg">
                                  مطلوب
                                </span>
                              )}

                              {/* زر استخراج الفوائد - متاح دائماً */}
                              <button
                                onClick={() => setBenefitsModal(task)}
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full text-sm font-bold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                              >
                                <Star className="w-4 h-4 mr-2" />
                                استخراج الفوائد
                              </button>
                            </div>
                          </div>

                          {!task.completed &&
                            daysSinceStart >= selectedDay - 1 && (
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleCompleteTask(task.id)}
                                  disabled={completingTask === task.id}
                                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white text-lg font-bold rounded-2xl hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none"
                                >
                                  {completingTask === task.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                                      جاري...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-6 h-6 mr-3" />
                                      إكمال المهمة
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                          {task.completed && task.completed_at && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl border border-green-200">
                              <p className="text-sm text-green-800 font-bold flex items-center">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                مكتمل في{" "}
                                {new Date(task.completed_at).toLocaleDateString(
                                  "ar-SA"
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Complete Task Modal */}
      {completingTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-purple-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mr-4 shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-gray-900">
                    إكمال المهمة
                  </h3>
                  <p className="text-lg text-green-600 font-bold">+3 نقاط</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Benefits Section */}
              <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-3xl p-8 border-2 border-purple-200 shadow-xl">
                <label className="text-xl font-black text-purple-900 mb-6 flex items-center">
                  <Star className="w-6 h-6 mr-3 text-yellow-500" />
                  الفوائد المستخرجة من المهمة
                  <span className="mr-auto text-sm text-purple-600 font-bold bg-purple-100 px-4 py-2 rounded-full">
                    {
                      benefits
                        .trim()
                        .split(/\s+/)
                        .filter((w) => w).length
                    }{" "}
                    كلمة
                  </span>
                </label>
                <textarea
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  rows={6}
                  className="w-full px-6 py-4 border-2 border-purple-300 rounded-2xl focus:ring-4 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none text-lg shadow-inner"
                  placeholder="ما هي أهم الفوائد والعبر التي استخرجتها؟
• اكتب النقاط الرئيسية
• ما الذي لفت انتباهك؟
• كيف يمكنك تطبيق ما تعلمت؟"
                />
                <p className="text-sm text-purple-700 mt-4 flex items-center font-bold">
                  <BookOpen className="w-4 h-4 mr-2" />
                  هذا القسم مهم لتوثيق تدبرك وفهمك للآيات
                </p>
                {benefits
                  .trim()
                  .split(/\s+/)
                  .filter((w) => w).length < 20 &&
                  benefits.trim() && (
                    <p className="text-sm text-orange-600 mt-2 font-bold">
                      ⚠️ يرجى كتابة 20 كلمة على الأقل للحصول على أفضل النتائج
                    </p>
                  )}
              </div>

              {/* Journal Entry Section */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-8 border-2 border-blue-200 shadow-xl">
                <label className="text-xl font-black text-blue-900 mb-6 flex items-center">
                  <User className="w-6 h-6 mr-3 text-blue-600" />
                  يومياتك الشخصية (اختياري)
                  <span className="mr-auto text-sm text-blue-600 font-bold bg-blue-100 px-4 py-2 rounded-full">
                    {
                      journalEntry
                        .trim()
                        .split(/\s+/)
                        .filter((w) => w).length
                    }{" "}
                    كلمة
                  </span>
                </label>
                <textarea
                  value={journalEntry}
                  onChange={(e) => setJournalEntry(e.target.value)}
                  rows={5}
                  className="w-full px-6 py-4 border-2 border-blue-300 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-lg shadow-inner"
                  placeholder="سجل تجربتك الشخصية مع هذه المهمة...
• كيف كان شعورك؟
• ما التحديات التي واجهتك؟
• ماذا تعلمت عن نفسك؟"
                />
              </div>

              {/* Notes Section */}
              <div className="bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 rounded-3xl p-8 border-2 border-gray-200 shadow-xl">
                <label className="text-xl font-black text-gray-900 mb-6 flex items-center">
                  <FileText className="w-6 h-6 mr-3 text-gray-600" />
                  ملاحظات إضافية (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-gray-500 focus:border-gray-500 transition-all resize-none text-lg shadow-inner"
                  placeholder="أي ملاحظات أخرى ترغب في تسجيلها..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 mt-10">
              <button
                onClick={() => {
                  setCompletingTask(null);
                  setJournalEntry("");
                  setNotes("");
                  setBenefits("");
                }}
                className="px-8 py-4 text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl"
              >
                إلغاء
              </button>
              <button
                onClick={async () => {
                  if (!benefits.trim()) return;

                  try {
                    const response = await fetch(
                      `${
                        import.meta.env.VITE_API_URL
                      }/quran-camps/tasks/${completingTask}/complete`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "x-auth-token": localStorage.getItem("token"),
                        },
                        body: JSON.stringify({
                          journal_entry: journalEntry,
                          notes: `${
                            benefits
                              ? `الفوائد المستخرجة:\n${benefits}\n\n`
                              : ""
                          }${notes}`,
                        }),
                      }
                    );

                    const data = await response.json();

                    if (data.success) {
                      // Refresh progress
                      const progressResponse = await fetch(
                        `${
                          import.meta.env.VITE_API_URL
                        }/quran-camps/${id}/my-progress`,
                        {
                          headers: {
                            "x-auth-token": localStorage.getItem("token"),
                          },
                        }
                      );
                      const progressData = await progressResponse.json();
                      if (progressData.success) {
                        setProgress(progressData.data);
                      }

                      setCompletingTask(null);
                      setJournalEntry("");
                      setNotes("");
                      setBenefits("");

                      // Show success message
                      setShowSuccessMessage(true);
                      setTimeout(() => setShowSuccessMessage(false), 3000);
                    } else {
                      alert(data.message || "حدث خطأ في إكمال المهمة");
                    }
                  } catch (err) {
                    console.error("Error completing task:", err);
                    alert("حدث خطأ في إكمال المهمة");
                  }
                }}
                disabled={!benefits.trim()}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed font-black text-lg flex items-center transform hover:scale-105 disabled:transform-none"
              >
                <CheckCircle className="w-6 h-6 mr-3" />
                تأكيد الإكمال
              </button>
            </div>

            {!benefits.trim() && (
              <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border-2 border-red-200">
                <p className="text-sm text-red-600 text-center font-bold">
                  * يرجى كتابة الفوائد المستخرجة للمتابعة
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Benefits Extraction Modal - Compact Design */}
      {benefitsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-hidden">
            {/* Simple Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">
                  استخراج الفوائد
                </h3>
              </div>
              <button
                onClick={() => {
                  setBenefitsModal(null);
                  setBenefits("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Task Info - Compact */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <h4 className="font-bold text-blue-900 text-sm mb-1">
                  {benefitsModal.title}
                </h4>
                <p className="text-blue-800 text-xs">
                  {benefitsModal.description}
                </p>
              </div>

              {/* Rich Text Editor - فوائد ومذكرات */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  اكتب مذكرتك (خاص بك) 📝
                </label>
                <p className="text-xs text-gray-600 mb-2">
                  للحصول على اقتراحات الأحاديث، اكتب{" "}
                  <span className="font-bold text-purple-600">/حديث</span> ثم
                  كلمة البحث (مثال:{" "}
                  <span className="font-bold text-purple-600">/حديث الصبر</span>
                  ).
                </p>
                <RichTadabburEditor
                  initialContent={benefits}
                  onChange={(htmlContent) => setBenefits(htmlContent)}
                  placeholder="ابدأ كتابة الفوائد هنا..."
                />
              </div>

              {/* الجسر الذكي - مشاركة في قاعة التدارس */}
              <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareInStudyHall}
                    onChange={(e) => setShareInStudyHall(e.target.checked)}
                    className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500 ml-3"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-purple-800 text-sm flex items-center">
                      <Users className="w-4 h-4 ml-1" />
                      مشاركة في قاعة التدارس
                    </span>
                    <p className="text-xs text-purple-600">
                      سيتم نشر هذه المذكرة ليراها ويستفيد منها باقي المشاركين
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer - Compact */}
            <div className="flex items-center justify-end space-x-2 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setBenefitsModal(null);
                  setBenefits("");
                  setNotes("");
                }}
                className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={async () => {
                  if (!benefits.trim()) {
                    alert("يرجى كتابة الفوائد المستخرجة");
                    return;
                  }

                  try {
                    setExtractingBenefits(benefitsModal.id);

                    // حفظ الفوائد باستخدام API الجديد
                    const response = await fetch(
                      `${import.meta.env.VITE_API_URL}/quran-camps/tasks/${
                        benefitsModal.id
                      }/benefits`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "x-auth-token": localStorage.getItem("token"),
                        },
                        body: JSON.stringify({
                          benefits: benefits,
                          notes: notes,
                        }),
                      }
                    );

                    const data = await response.json();

                    if (data.success) {
                      // Refresh progress
                      const progressResponse = await fetch(
                        `${
                          import.meta.env.VITE_API_URL
                        }/quran-camps/${id}/my-progress`,
                        {
                          headers: {
                            "x-auth-token": localStorage.getItem("token"),
                          },
                        }
                      );
                      const progressData = await progressResponse.json();
                      if (progressData.success) {
                        setProgress(progressData.data);
                      }

                      setBenefitsModal(null);
                      setBenefits("");
                      setNotes("");

                      // Show success message
                      setShowSuccessMessage(true);
                      setTimeout(() => setShowSuccessMessage(false), 3000);
                    } else {
                      alert(data.message || "حدث خطأ في حفظ الفوائد");
                    }
                  } catch (err) {
                    console.error("Error saving benefits:", err);
                    alert("حدث خطأ في حفظ الفوائد");
                  } finally {
                    setExtractingBenefits(null);
                  }
                }}
                disabled={
                  !benefits.trim() || extractingBenefits === benefitsModal.id
                }
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center text-sm"
              >
                {extractingBenefits === benefitsModal.id ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                    جاري...
                  </>
                ) : (
                  <>
                    <Star className="w-3 h-3 mr-1" />
                    حفظ
                  </>
                )}
              </button>
            </div>

            {!benefits.trim() && (
              <div className="px-4 pb-3">
                <p className="text-xs text-red-500 text-center">
                  * يرجى كتابة الفوائد المستخرجة
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-8 right-8 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white px-8 py-6 rounded-3xl shadow-2xl flex items-center space-x-4 border-2 border-white/20 backdrop-blur-sm">
            <div className="p-3 bg-white/20 rounded-full">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-black text-2xl mb-1">مبارك! 🎉</p>
              <p className="text-lg font-bold opacity-95">
                تم إكمال المهمة بنجاح
              </p>
              <p className="text-sm opacity-90">+3 نقاط مضافة لحسابك</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCampJourneyPage;
