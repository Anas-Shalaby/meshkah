import React, { useState, useEffect } from "react";
import { getLocalTimesForRiyadh } from "../utils/timezone";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Target,
  Brain,
  CheckCircle,
  Star,
} from "lucide-react";
import CampOnboardingTips from "../components/CampOnboardingTips";

const CampContentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [camp, setCamp] = useState(null);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [tasksByDay, setTasksByDay] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCampDetails();
  }, [id]);

  const fetchCampDetails = async () => {
    try {
      const [campResponse, tasksResponse, leaderboardResponse] =
        await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/quran-camps/${id}`, {
            headers: {
              "x-auth-token": localStorage.getItem("token"),
            },
          }),
          fetch(
            `${import.meta.env.VITE_API_URL}/quran-camps/${id}/daily-tasks`,
            {
              headers: {
                "x-auth-token": localStorage.getItem("token"),
              },
            }
          ),
        ]);

      const campData = await campResponse.json();
      const tasksData = await tasksResponse.json();
      // Group tasks by day
      const grouped = {};
      (tasksData.data || []).forEach((task) => {
        if (!grouped[task.day_number]) {
          grouped[task.day_number] = [];
        }
        grouped[task.day_number].push(task);
      });
      setTasksByDay(grouped);
      setCamp(campData.data);
    } catch (err) {
      setError("حدث خطأ أثناء تحميل تفاصيل المخيم");
      console.error("Error fetching camp details:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTaskTypeIcon = (type) => {
    switch (type) {
      case "reading":
        return <BookOpen className="w-5 h-5" />;
      case "memorization":
        return <Brain className="w-5 h-5" />;
      case "tafseer":
        return <Target className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getTaskTypeText = (type) => {
    switch (type) {
      case "reading":
        return "قراءة";
      case "memorization":
        return "حفظ";
      case "tafseer":
        return "تفسير";
      default:
        return "مهمة";
    }
  };

  const getTaskTypeColor = (type) => {
    switch (type) {
      case "reading":
        return "from-blue-500 to-blue-600";
      case "memorization":
        return "from-green-500 to-green-600";
      case "tafseer":
        return "from-purple-500 to-purple-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#7440E9] mx-auto mb-6"></div>
          <p className="text-xl font-bold text-gray-700 mb-2">
            جاري التحميل...
          </p>
          <p className="text-gray-600">استعد لرحلة رائعة مع القرآن الكريم</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">حدث خطأ</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-[#7440E9] text-white rounded-xl hover:bg-[#6B3AD1] transition-colors"
          >
            العودة للخلف
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5]">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-3 p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:text-[#7440E9]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">العودة</span>
            </button>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800">محتوى المخيم</h1>
              <p className="text-gray-600">{camp?.name}</p>
            </div>

            <div className="w-24"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Camp Overview */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {camp?.name}
            </h2>
            <p className="text-gray-600 text-lg">{camp?.description}</p>
          </div>

          {/* تنبيه أوقات التذكير حسب توقيت المستخدم */}
          <div className="text-center mb-6">
            {(() => {
              const { morningLocal, eveningLocal } = getLocalTimesForRiyadh();
              return (
                <p className="text-sm text-gray-600">
                  تصل التذكيرات اليومية في حوالي
                  <span className="mx-1 font-semibold text-[#7440E9]">
                    {morningLocal}
                  </span>
                  و
                  <span className="mx-1 font-semibold text-[#7440E9]">
                    {eveningLocal}
                  </span>
                  بحسب منطقتك الزمنية.
                </p>
              );
            })()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-[#7440E9]/5 rounded-2xl">
              <div className="w-16 h-16 bg-[#7440E9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">مدة المخيم</h3>
              <p className="text-[#7440E9] font-semibold text-xl">
                {camp?.duration_days} أيام
              </p>
            </div>

            <div className="text-center p-6 bg-[#7440E9]/5 rounded-2xl">
              <div className="w-16 h-16 bg-[#7440E9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">إجمالي المهام</h3>
              <p className="text-[#7440E9] font-semibold text-xl">
                {dailyTasks.length} مهمة
              </p>
            </div>

            <div className="text-center p-6 bg-[#7440E9]/5 rounded-2xl">
              <div className="w-16 h-16 bg-[#7440E9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">إجمالي النقاط</h3>
              <p className="text-[#7440E9] font-semibold text-xl">
                {dailyTasks.reduce((sum, task) => sum + (task.points || 0), 0)}{" "}
                نقطة
              </p>
            </div>
          </div>

          {/* شرح مبسّط داخل الصفحة للمشاركين */}
          <div className="mt-8">
            <CampOnboardingTips />
          </div>
        </div>

        {/* Daily Content */}
        {Object.keys(tasksByDay).map((day) => (
          <div key={day} className="mb-12">
            {/* Day Header */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-[#7440E9] to-[#B794F6] rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      اليوم {day}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      اليوم {day}
                    </h3>
                    <p className="text-gray-600">
                      {tasksByDay[day].length} مهمة
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-500">إجمالي الوقت</div>
                  <div className="text-lg font-semibold text-[#7440E9]">
                    {Math.ceil(
                      tasksByDay[day].reduce((sum, task) => {
                        const time = parseInt(task.estimated_time) || 30;
                        return sum + time;
                      }, 0) / 60
                    )}{" "}
                    ساعة
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks for this day */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasksByDay[day].map((task, index) => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${getTaskTypeColor(
                          task.task_type
                        )} rounded-xl flex items-center justify-center text-white`}
                      >
                        {getTaskTypeIcon(task.task_type)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">
                          {task.title}
                        </h4>
                        <p className="text-gray-500 text-sm">
                          {getTaskTypeText(task.task_type)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {task.estimated_time || "30 دقيقة"}
                      </div>
                      {task.points && (
                        <div className="text-sm text-[#7440E9] font-semibold">
                          {task.points} نقطة
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {task.description}
                  </p>

                  {task.verses && (
                    <div className="p-3 bg-[#7440E9]/5 rounded-xl mb-4">
                      <div className="text-sm text-[#7440E9] font-medium">
                        الآيات: {task.verses}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          task.is_optional ? "bg-yellow-500" : "bg-green-500"
                        }`}
                      ></div>
                      <span className="text-xs text-gray-500">
                        {task.is_optional ? "اختياري" : "مطلوب"}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400">
                      المهمة {index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Learning Path Summary */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mt-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            مسار التعلم
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-[#7440E9]/5 rounded-2xl">
              <div className="w-16 h-16 bg-[#7440E9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">القراءة</h4>
              <p className="text-gray-600 text-sm">
                قراءة يومية منظمة مع الشيخ المختار
              </p>
            </div>

            <div className="text-center p-6 bg-[#7440E9]/5 rounded-2xl">
              <div className="w-16 h-16 bg-[#7440E9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">الحفظ</h4>
              <p className="text-gray-600 text-sm">حفظ مكثف مع مراجعة مستمرة</p>
            </div>

            <div className="text-center p-6 bg-[#7440E9]/5 rounded-2xl">
              <div className="w-16 h-16 bg-[#7440E9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">التفسير</h4>
              <p className="text-gray-600 text-sm">
                فهم عميق للآيات مع التفسير
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampContentPage;
