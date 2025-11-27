import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Brain,
  Target,
  Heart,
  Users,
  Trophy,
  Award,
  Clock,
  Calendar,
  Shield,
  Info,
  X,
  CheckCircle,
  Sun,
  Play,
  Zap,
  ChevronDown,
  ChevronUp,
  UserCheck,
  EyeOff,
} from "lucide-react";
import IdentityChoiceModal from "./modals/IdentityChoiceModal";

const CampPublicView = ({
  camp,
  dailyTasks,
  tasksByDay,
  currentUser,
  enrolling,
  handleEnroll,
  handleIdentityChoice,
  showIdentityModal,
  setShowIdentityModal,
  id,
}) => {
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState(null);

  return (
    <>
      {/* Course Content Overview Section */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            {currentUser ? "محتوى المخيم" : "اكتشف محتوى المخيم"}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {currentUser
              ? `نظرة عامة على المواد والمهام التي ستدرسها خلال ${camp.duration_days} أيام`
              : `تعرف على المواد والمهام التي ستدرسها خلال ${camp.duration_days} أيام من التعلم المكثف`}
          </p>
          {!currentUser && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl max-w-2xl mx-auto">
              <p className="text-blue-800 font-medium">
                💡 سجل دخولك للانضمام لهذه الرحلة المميزة والاستفادة من جميع
                المميزات
              </p>
            </div>
          )}
        </div>

        {/* Course Content Overview */}
        {dailyTasks && dailyTasks.length > 0 && (
          <div className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dailyTasks.slice(0, 6).map((task, index) => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">
                          اليوم {task.day_number}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm">
                          المهمة {index + 1}
                        </h3>
                        <p className="text-gray-500 text-xs">
                          {task.is_optional ? "اختياري" : "مطلوب"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {task.estimated_time || "30 دقيقة"}
                      </div>
                      {task.points && (
                        <div className="text-xs text-[#7440E9] font-semibold">
                          {task.points} نقطة
                        </div>
                      )}
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                    {task.title}
                  </h4>
                  <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
                    {task.description}
                  </p>

                  {task.verses && (
                    <div className="mt-3 p-2 bg-[#7440E9]/5 rounded-lg">
                      <div className="text-xs text-[#7440E9] font-medium">
                        الآيات: {task.verses}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* View Full Content Button */}
            <div className="text-center mt-8">
              <button
                onClick={() => navigate(`/camp-content/${id}`)}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#7440E9] to-[#B794F6] text-white rounded-2xl hover:from-[#6B3AD1] hover:to-[#A67FF0] shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-bold text-lg">عرض المحتوى الكامل</span>
              </button>
              <p className="text-gray-600 mt-3">
                {dailyTasks.length} مهمة في {Object.keys(tasksByDay).length}{" "}
                أيام
              </p>
            </div>
          </div>
        )}

        {/* Learning Path Overview */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            مسار التعلم
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#7440E9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">القراءة</h4>
              <p className="text-gray-600 text-sm">
                قراءة يومية منظمة مع الشيخ المختار
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#7440E9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">الحفظ</h4>
              <p className="text-gray-600 text-sm">حفظ مكثف مع مراجعة مستمرة</p>
            </div>

            <div className="text-center">
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

      {/* What You'll Learn Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              ماذا ستتعلم؟
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              رحلة شاملة تجمع بين القراءة والحفظ والتفسير في{" "}
              <span className="text-[#7440E9] font-semibold">
                {camp.duration_days}
              </span>{" "}
              أيام مكثفة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Reading Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#7440E9] rounded-xl flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  قراءة السورة
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  قراءة يومية منظمة مع الشيخ المختار لضمان النطق الصحيح
                </p>
                <div className="bg-[#7440E9]/10 rounded-xl p-4">
                  <div className="text-3xl font-bold text-[#7440E9] mb-1">
                    5 آيات
                  </div>
                  <div className="text-gray-600 font-medium">يومياً</div>
                </div>
              </div>
            </div>

            {/* Memorization Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#7440E9] rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  حفظ الآيات
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  حفظ مكثف مع مراجعة مستمرة وتطبيق تقنيات الحفظ المتقدمة
                </p>
                <div className="bg-[#7440E9]/10 rounded-xl p-4">
                  <div className="text-3xl font-bold text-[#7440E9] mb-1">
                    3 ساعات
                  </div>
                  <div className="text-gray-600 font-medium">يومياً</div>
                </div>
              </div>
            </div>

            {/* Tafseer Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#7440E9] rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  دراسة التفسير
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  فهم عميق للآيات مع التفسير والتدبر في المعاني والأحكام
                </p>
                <div className="bg-[#7440E9]/10 rounded-xl p-4">
                  <div className="text-3xl font-bold text-[#7440E9] mb-1">
                    2 ساعة
                  </div>
                  <div className="text-gray-600 font-medium">يومياً</div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Benefits */}
          <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                فوائد إضافية
              </h3>
              <p className="text-gray-600">
                بالإضافة للتعلم الأساسي، ستحصل على فوائد قيمة أخرى
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#7440E9]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-[#7440E9]" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">التدبر</h4>
                <p className="text-sm text-gray-600">فهم عميق للمعاني</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-[#7440E9]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-[#7440E9]" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">المجتمع</h4>
                <p className="text-sm text-gray-600">مجتمع متحمس</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-[#7440E9]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-6 h-6 text-[#7440E9]" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">الشهادة</h4>
                <p className="text-sm text-gray-600">شهادة معتمدة</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-[#7440E9]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-[#7440E9]" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">التطبيق</h4>
                <p className="text-sm text-gray-600">تطبيق عملي</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Schedule Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              الجدول الزمني اليومي
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              برنامج يومي منظم لضمان أقصى استفادة من المخيم
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Sun className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">6:00 ص</h3>
                <p className="text-gray-700 font-medium">قراءة الصبح</p>
                <p className="text-sm text-gray-500 mt-1">30 دقيقة</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">7:00 ص</h3>
                <p className="text-gray-700 font-medium">حفظ الآيات</p>
                <p className="text-sm text-gray-500 mt-1">3 ساعات</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  10:00 ص
                </h3>
                <p className="text-gray-700 font-medium">دراسة التفسير</p>
                <p className="text-sm text-gray-500 mt-1">2 ساعة</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg">🕌</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  12:00 م
                </h3>
                <p className="text-gray-700 font-medium">صلاة الظهر</p>
                <p className="text-sm text-gray-500 mt-1">بالآيات المحفوظة</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">2:00 م</h3>
                <p className="text-gray-700 font-medium">فيديو التفسير</p>
                <p className="text-sm text-gray-500 mt-1">1 ساعة</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg">✍️</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">3:00 م</h3>
                <p className="text-gray-700 font-medium">كتابة الفوائد</p>
                <p className="text-sm text-gray-500 mt-1">30 دقيقة</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">4:00 م</h3>
                <p className="text-gray-700 font-medium">مراجعة يومية</p>
                <p className="text-sm text-gray-500 mt-1">30 دقيقة</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">5:00 م</h3>
                <p className="text-gray-700 font-medium">تقييم التقدم</p>
                <p className="text-sm text-gray-500 mt-1">15 دقيقة</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Commitment Requirements */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              التزامك المطلوب
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              هذا المخيم يتطلب التزاماً كاملاً لضمان أفضل النتائج
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#7440E9] rounded-xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  المطلوب منك
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center bg-[#7440E9]/5 rounded-xl p-4">
                  <Clock className="w-6 h-6 text-[#7440E9] mr-4" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      6-7 ساعات يومياً
                    </div>
                    <div className="text-gray-600 text-sm">
                      وقت مخصص للدراسة
                    </div>
                  </div>
                </div>
                <div className="flex items-center bg-[#7440E9]/5 rounded-xl p-4">
                  <Calendar className="w-6 h-6 text-[#7440E9] mr-4" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      {camp.duration_days} يوم متتالي
                    </div>
                    <div className="text-gray-600 text-sm">بدون انقطاع</div>
                  </div>
                </div>
                <div className="flex items-center bg-[#7440E9]/5 rounded-xl p-4">
                  <Target className="w-6 h-6 text-[#7440E9] mr-4" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      100% التزام
                    </div>
                    <div className="text-gray-600 text-sm">
                      لا توجد أيام راحة
                    </div>
                  </div>
                </div>
                <div className="flex items-center bg-[#7440E9]/5 rounded-xl p-4">
                  <Trophy className="w-6 h-6 text-[#7440E9] mr-4" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      إكمال السورة كاملة
                    </div>
                    <div className="text-gray-600 text-sm">مع الفهم العميق</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <X className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  هذا المخيم ليس مناسب لك إذا:
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center bg-red-50 rounded-xl p-4">
                  <Clock className="w-6 h-6 text-red-500 mr-4" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      لا تستطيع تخصيص 6 ساعات
                    </div>
                    <div className="text-gray-600 text-sm">يومياً للدراسة</div>
                  </div>
                </div>
                <div className="flex items-center bg-red-50 rounded-xl p-4">
                  <Heart className="w-6 h-6 text-red-500 mr-4" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      تبحث عن تجربة سهلة
                    </div>
                    <div className="text-gray-600 text-sm">بدون تحدٍ</div>
                  </div>
                </div>
                <div className="flex items-center bg-red-50 rounded-xl p-4">
                  <Shield className="w-6 h-6 text-red-500 mr-4" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      لا تريد الالتزام الكامل
                    </div>
                    <div className="text-gray-600 text-sm">
                      أو لديك التزامات أخرى
                    </div>
                  </div>
                </div>
                <div className="flex items-center bg-red-50 rounded-xl p-4">
                  <Info className="w-6 h-6 text-red-500 mr-4" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      تتوقع نتائج سريعة
                    </div>
                    <div className="text-gray-600 text-sm">بدون جهد</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              الأسئلة الشائعة
            </h2>
            <p className="text-xl text-gray-600">
              إجابات على أكثر الأسئلة شيوعاً
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  هل يمكنني الانضمام في منتصف المخيم؟
                </h3>
                <button
                  onClick={() => setOpenFAQ(openFAQ === 1 ? null : 1)}
                  className="p-2 bg-[#7440E9]/10 rounded-lg hover:bg-[#7440E9]/20 transition-colors"
                >
                  {openFAQ === 1 ? (
                    <ChevronUp className="w-5 h-5 text-[#7440E9]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#7440E9]" />
                  )}
                </button>
              </div>
              {openFAQ === 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-600 leading-relaxed">
                    لا، يجب الانضمام من اليوم الأول للمخيم. هذا يضمن أن جميع
                    المشاركين يبدأون من نفس النقطة ويحصلون على نفس التجربة.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  ماذا لو فاتني يوم؟
                </h3>
                <button
                  onClick={() => setOpenFAQ(openFAQ === 2 ? null : 2)}
                  className="p-2 bg-[#7440E9]/10 rounded-lg hover:bg-[#7440E9]/20 transition-colors"
                >
                  {openFAQ === 2 ? (
                    <ChevronUp className="w-5 h-5 text-[#7440E9]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#7440E9]" />
                  )}
                </button>
              </div>
              {openFAQ === 2 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-600 leading-relaxed">
                    إذا فاتك يوم، ستفقد نقاط ذلك اليوم، لكن يمكنك المتابعة من
                    اليوم التالي. ننصح بالالتزام الكامل للحصول على أفضل النتائج.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  هل المخيم مجاني؟
                </h3>
                <button
                  onClick={() => setOpenFAQ(openFAQ === 3 ? null : 3)}
                  className="p-2 bg-[#7440E9]/10 rounded-lg hover:bg-[#7440E9]/20 transition-colors"
                >
                  {openFAQ === 3 ? (
                    <ChevronUp className="w-5 h-5 text-[#7440E9]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#7440E9]" />
                  )}
                </button>
              </div>
              {openFAQ === 3 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-600 leading-relaxed">
                    نعم، المخيم مجاني بالكامل! نحن نؤمن بأن تعلم القرآن الكريم
                    يجب أن يكون متاحاً للجميع بدون أي رسوم.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  ما هي المتطلبات التقنية؟
                </h3>
                <button
                  onClick={() => setOpenFAQ(openFAQ === 4 ? null : 4)}
                  className="p-2 bg-[#7440E9]/10 rounded-lg hover:bg-[#7440E9]/20 transition-colors"
                >
                  {openFAQ === 4 ? (
                    <ChevronUp className="w-5 h-5 text-[#7440E9]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#7440E9]" />
                  )}
                </button>
              </div>
              {openFAQ === 4 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-600 leading-relaxed">
                    تحتاج فقط إلى اتصال بالإنترنت وجهاز (كمبيوتر، تابلت، أو
                    موبايل). لا توجد متطلبات تقنية معقدة.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#7440E9] to-[#B794F6]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            هل أنت مستعد للتحدي؟
          </h2>
          <p className="text-xl text-white/90 mb-12 leading-relaxed">
            انضم إلى {camp.enrolled_count || 0} شخص آخر في رحلة تحويلية مع
            القرآن الكريم
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <Zap className="w-10 h-10 text-white mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                {camp.duration_days} يوم من التحدي
              </h3>
              <p className="text-white/80">مكثف ومحفز</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <Award className="w-10 h-10 text-white mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">شهادة إنجاز</h3>
              <p className="text-white/80">معتمدة ومحترمة</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <Users className="w-10 h-10 text-white mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">مجتمع متحمس</h3>
              <p className="text-white/80">من المتعلمين</p>
            </div>
          </div>

          {!camp.is_enrolled && (
            <div className="mb-8">
              <button
                onClick={handleEnroll}
                disabled={
                  enrolling ||
                  camp.status === "completed" ||
                  camp.enable_public_enrollment === false
                }
                className="px-16 py-4 bg-white text-[#7440E9] text-2xl font-bold rounded-2xl hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {enrolling ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7440E9] mr-3"></div>
                    جاري التسجيل...
                  </div>
                ) : !currentUser ? (
                  <span>سجل دخولك للانضمام </span>
                ) : camp.enable_public_enrollment === false ? (
                  <span>التسجيل مغلق من قبل الإدارة</span>
                ) : (
                  <span>انضم للرحلة الآن </span>
                )}
              </button>
              {!currentUser && (
                <p className="text-center text-gray-600 mt-4">
                  ستحتاج لتسجيل الدخول أولاً للانضمام لهذا المخيم
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Identity Choice Modal for Visitor Section */}
      <IdentityChoiceModal
        isOpen={showIdentityModal}
        onClose={() => setShowIdentityModal(false)}
        onChoice={handleIdentityChoice}
      />
    </>
  );
};

export default CampPublicView;
