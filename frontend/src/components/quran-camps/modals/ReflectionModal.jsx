import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  BookOpen,
  Play,
  Check,
  CheckCircle2,
  Clock,
  Clock3,
  Lightbulb,
  Users,
  Save,
  ArrowLeft,
  Sparkles,
  Star,
  ExternalLink,
} from "lucide-react";
import RichTadabburEditor from "../../RichTadabburEditor";
import toast from "react-hot-toast";
import EmbeddedVideoPlayer from "../EmbeddedVideoPlayer";
import TaskLinks from "../TaskLinks";
import TaskAttachments from "../TaskAttachments";
import ReadingTimer from "../ReadingTimer";
import TaskNavigation from "../TaskNavigation";

const ReflectionModal = ({
  isOpen,
  onClose,
  selectedTask,
  camp,
  activeTaskTab,
  setActiveTaskTab,
  reflectionText,
  setReflectionText,
  reflectionJson,
  setReflectionJson,
  videoWatched,
  setVideoWatched,
  timerActive,
  timeRemaining,
  formatTime,
  startTimer,
  stopTimer,
  resetTimer,
  handleCompleteAndSave,
  updateTaskBenefits,
  isCampNotStarted,
  isReadOnly,
  isCompleting,
  setIsCompleting,
  reflectionToEdit,
  setReflectionToEdit,
  shareInStudyHall,
  setShareInStudyHall,
  proposedStep,
  setProposedStep,
  setExpandedGroups,
  showTaskSidebar,
  setShowTaskSidebar,
  setSelectedDay,
  selectedDay,
  fetchJournalData,
  fetchUserProgress,
  fetchStudyHallContent,
  studyHallSelectedDay,
  studyHallSort,
  studyHallPagination,
  allTasks,
  onNavigateTask,
  getDayStatus,
  currentDay,
}) => {
  if (!isOpen || !selectedTask) return null;

  // Helper function to check if a task's day is locked
  const isTaskDayLocked = (task) => {
    if (!getDayStatus || !currentDay || !task.day_number) return false;
    const dayStatus = getDayStatus(task.day_number);
    return dayStatus === "locked";
  };

  // Wrapper for onNavigateTask with locked day check
  const handleNavigateTask = (task) => {
    if (isTaskDayLocked(task)) {
      toast.error("لا يمكن الوصول إلى مهام اليوم المقفول");
      return;
    }
    if (onNavigateTask) {
      onNavigateTask(task);
    }
  };
  return (
    <AnimatePresence>
      {isOpen && selectedTask && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 sm:top-[60px] bg-black/50 z-50 flex items-center justify-center p-0 sm:p-2 md:p-4"
          onClick={() => {
            onClose();
            setActiveTaskTab("task");
            setReflectionToEdit(null);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-b from-white to-gray-50/30 rounded-none sm:rounded-xl md:rounded-2xl max-w-4xl w-full h-full sm:h-[95vh] md:h-auto md:max-h-[calc(100vh-4rem)] shadow-2xl flex flex-col overflow-hidden m-0 sm:m-2 md:m-4"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 sm:top-0 bg-gradient-to-b from-white via-white to-white/95 backdrop-blur-sm border-b border-gray-200/80 p-3 sm:p-4 md:p-6 pb-3 sm:pb-4 md:pb-6 z-20 flex-shrink-0 shadow-sm">
              <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0 pr-1 sm:pr-0">
                  {/* Breadcrumbs */}
                  {selectedTask.path && selectedTask.path.length > 0 && (
                    <div
                      className="flex items-center gap-1 text-[10px] xs:text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2 overflow-x-auto scrollbar-hide"
                      dir="rtl"
                    >
                      {selectedTask.path.map((segment, index) => {
                        // Support both old format (string) and new format (object)
                        const segmentObj =
                          typeof segment === "string"
                            ? { type: "day", title: segment }
                            : segment;
                        const isGroup = segmentObj.type === "group";
                        const isClickable = isGroup;

                        return (
                          <div
                            key={index}
                            className="flex items-center flex-shrink-0"
                          >
                            {isClickable ? (
                              <button
                                onClick={() => {
                                  // Toggle group in sidebar
                                  setExpandedGroups((prev) => ({
                                    ...prev,
                                    [segmentObj.groupId]:
                                      prev[segmentObj.groupId] === undefined
                                        ? false
                                        : !prev[segmentObj.groupId],
                                  }));
                                  // Open sidebar if closed and set the correct day
                                  if (!showTaskSidebar) {
                                    // Find day number from path or use selectedTask's day
                                    const daySegment = selectedTask.path.find(
                                      (s) => {
                                        const seg =
                                          typeof s === "string"
                                            ? { type: "day", title: s }
                                            : s;
                                        return seg.type === "day";
                                      }
                                    );
                                    const dayToShow =
                                      daySegment?.dayNumber ||
                                      (typeof daySegment === "object"
                                        ? daySegment.dayNumber
                                        : null) ||
                                      selectedTask.day_number ||
                                      selectedDay;
                                    setSelectedDay(dayToShow);
                                    setShowTaskSidebar(true);
                                    onClose();
                                  }
                                }}
                                className="hover:text-purple-600 hover:underline transition-colors cursor-pointer whitespace-nowrap"
                              >
                                {segmentObj.title}
                              </button>
                            ) : (
                              <span className="hover:text-gray-700 transition-colors whitespace-nowrap">
                                {segmentObj.title}
                              </span>
                            )}
                            {index < selectedTask.path.length - 1 && (
                              <ChevronLeft className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-gray-400 mx-0.5 sm:mx-1 flex-shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#7440E9] to-[#5a2fc7] flex items-center justify-center shadow-md flex-shrink-0">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate leading-tight">
                      {selectedTask.title}
                    </h3>
                  </div>
                  <p className="text-[10px] xs:text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                    تفاصيل المهمة والتدبر
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    setActiveTaskTab("task");
                    setReflectionToEdit(null);
                  }}
                  className="p-1.5 xs:p-2 sm:p-2.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 active:scale-95 mt-0.5 sm:mt-0"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-gray-500" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-1 sm:gap-2 mt-3 sm:mt-4 border-b-2 border-gray-200">
                <button
                  onClick={() => setActiveTaskTab("task")}
                  className={`flex-1 px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 text-xs xs:text-sm sm:text-base transition-all relative font-semibold outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${
                    activeTaskTab === "task"
                      ? "text-[#7440E9]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  تفاصيل المهمة
                  {activeTaskTab === "task" && (
                    <motion.span
                      layoutId="activeTab"
                      className="absolute bottom-0 right-0 left-0 h-1 bg-gradient-to-r from-[#7440E9] to-[#5a2fc7] rounded-t"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTaskTab("reflection")}
                  className={`flex-1 px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 text-xs xs:text-sm sm:text-base transition-all relative font-semibold outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${
                    activeTaskTab === "reflection"
                      ? "text-[#7440E9]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  تدبري وإتمام
                  {activeTaskTab === "reflection" && (
                    <motion.span
                      layoutId="activeTab"
                      className="absolute bottom-0 right-0 left-0 h-1 bg-gradient-to-r from-[#7440E9] to-[#5a2fc7] rounded-t"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 min-h-0 p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 pb-20 sm:pb-24">
              {/* Tab Content: Task */}
              {activeTaskTab === "task" && (
                <div className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6">
                  {/* رسالة توضيحية للمخيم الذي لم يبدأ بعد */}
                  {isCampNotStarted && (
                    <div className="mb-4 xs:mb-5 sm:mb-6 p-3 xs:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500 rounded-lg xs:rounded-xl shadow-md">
                      <div className="flex items-start gap-2 xs:gap-3">
                        <div className="flex-shrink-0 w-8 h-8 xs:w-10 xs:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <Clock3 className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm xs:text-base font-bold text-blue-900 mb-1">
                            ⏳ المخيم لم يبدأ بعد
                          </h4>
                          <p className="text-xs xs:text-sm text-blue-800 leading-relaxed">
                            عذراً، المخيم في حالة التسجيل المبكر. لا يمكنك إكمال
                            هذه المهمة أو حفظ الفوائد حتى يبدأ الادمن المخيم.
                            سيتم إشعارك عند بدء المخيم.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* تفاصيل المهمة */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl sm:rounded-2xl p-4 xs:p-5 sm:p-6 border border-gray-200/50 shadow-sm">
                    <h4 className="font-bold text-base xs:text-lg sm:text-xl text-gray-800 mb-3 xs:mb-4 sm:mb-5 arabic-text flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-[#7440E9] to-[#5a2fc7] rounded-full"></div>
                      تفاصيل المهمة
                    </h4>
                    <div className="space-y-3 xs:space-y-4 sm:space-y-5">
                      <p className="text-gray-700 text-sm xs:text-base sm:text-lg md:text-xl leading-relaxed arabic-text break-words bg-white/50 p-3 xs:p-4 rounded-lg">
                        {selectedTask.description}
                      </p>

                      <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 flex-wrap">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-gray-700 font-medium text-xs xs:text-sm">
                          <Clock className="w-4 h-4" />
                          {selectedTask.estimated_time || "30 دقيقة"}
                        </span>
                        {selectedTask.points && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 rounded-lg text-amber-700 font-medium text-xs xs:text-sm">
                            <Star className="w-4 h-4 fill-amber-500" />
                            {selectedTask.points} نقطة
                          </span>
                        )}
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs xs:text-sm font-semibold ${
                            selectedTask.is_optional
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {selectedTask.is_optional ? "اختياري" : "مطلوب"}
                        </span>
                      </div>

                      {/* مؤقت القراءة */}
                      {selectedTask.id && (
                        <ReadingTimer
                          taskId={selectedTask.id}
                          isTaskOpen={isOpen && activeTaskTab === "task"}
                        />
                      )}

                      {/* تفاصيل الآيات */}
                      {(selectedTask.verses_from || selectedTask.verses_to) && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#7440E9]/10 to-purple-50 border border-[#7440E9]/20 rounded-xl">
                          <div className="w-10 h-10 rounded-lg bg-[#7440E9] flex items-center justify-center flex-shrink-0 shadow-md">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-semibold text-[#7440E9] text-sm xs:text-base">
                            {selectedTask.verses_from && selectedTask.verses_to
                              ? `الآيات ${selectedTask.verses_from} - ${selectedTask.verses_to}`
                              : selectedTask.verses_from
                              ? `من الآية ${selectedTask.verses_from}`
                              : `إلى الآية ${selectedTask.verses_to}`}
                          </span>
                        </div>
                      )}

                      {/* روابط الموارد والمرفقات - أزرار بجانب بعض */}
                      {(selectedTask?.tafseer_link ||
                        selectedTask?.additional_links ||
                        selectedTask?.attachments) && (
                        <div className="space-y-2 sm:space-y-3">
                          <h5 className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <span>📚</span>
                            <span>موارد مساعدة لإتمام المهمة</span>
                          </h5>
                          <div className="flex flex-wrap gap-2 sm:gap-3">
                            <TaskLinks
                              links={selectedTask?.additional_links}
                              tafsirLink={selectedTask?.tafseer_link}
                            />
                            <TaskAttachments
                              attachments={selectedTask?.attachments}
                              apiUrl={import.meta.env.VITE_API_URL}
                            />
                          </div>
                        </div>
                      )}

                      {/* مشغل الفيديو المدمج */}
                      {selectedTask.youtube_link && (
                        <div className="pt-2">
                          <EmbeddedVideoPlayer
                            youtubeLink={selectedTask.youtube_link}
                            taskId={selectedTask.id}
                            onVideoWatched={() => setVideoWatched(true)}
                            showCloseButton={true}
                          />
                        </div>
                      )}

                      {/* الجسر بين القراءة والكتابة */}
                      {videoWatched && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 xs:mt-5 sm:mt-6 pt-3 xs:pt-4 sm:pt-5 border-t-2 border-gray-200"
                        >
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTaskTab("reflection")}
                            className="hidden w-full sm:flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-[#7440E9] to-[#5a2fc7] text-white rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base"
                          >
                            <span className="text-center">
                              قرأت المهمة، سأبدأ تدبري الآن
                            </span>
                            <ArrowLeft className="w-5 h-5 font-bold flex-shrink-0" />
                          </motion.button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Reflection */}
              {activeTaskTab === "reflection" && (
                <div className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6">
                  {/* رسالة توضيحية للمخيم الذي لم يبدأ بعد */}
                  {isCampNotStarted && (
                    <div className="mb-4 xs:mb-5 sm:mb-6 p-3 xs:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500 rounded-lg xs:rounded-xl shadow-md">
                      <div className="flex items-start gap-2 xs:gap-3">
                        <div className="flex-shrink-0 w-8 h-8 xs:w-10 xs:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <Clock3 className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm xs:text-base font-bold text-blue-900 mb-1">
                            ⏳ المخيم لم يبدأ بعد
                          </h4>
                          <p className="text-xs xs:text-sm text-blue-800 leading-relaxed">
                            عذراً، المخيم في حالة التسجيل المبكر. لا يمكنك إكمال
                            هذه المهمة أو حفظ الفوائد حتى يبدأ الادمن المخيم.
                            سيتم إشعارك عند بدء المخيم.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ----- بداية قسم الكتابة الموحد مع المحرر الغني ----- */}
                  <div>
                    <label
                      htmlFor="reflectionInput"
                      className="block text-sm xs:text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1.5 xs:mb-2"
                    >
                      شاركنا تدبرك وفوائدك
                    </label>
                    <p className="text-[10px] xs:text-xs text-gray-600 mb-2 leading-relaxed">
                      للحصول على اقتراحات الأحاديث، اكتب{" "}
                      <span className="font-bold text-purple-600">/حديث</span>{" "}
                      ثم كلمة البحث (مثال:{" "}
                      <span className="font-bold text-purple-600">
                        /حديث الصبر
                      </span>
                      ).
                    </p>

                    {/* --- الإرشاد (UX Hint) --- */}
                    <div className="bg-purple-50 border-r-4 border-purple-400 p-2.5 xs:p-3 sm:p-4 rounded-lg mb-2.5 xs:mb-3 sm:mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Sparkles className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-purple-600 mt-0.5" />
                        </div>
                        <div className="mr-2 xs:mr-2.5 sm:mr-3">
                          <p className="text-[11px] xs:text-xs sm:text-sm text-purple-700 font-medium leading-relaxed">
                            سيتم نشر مساهمتك في "قاعة التدارس" ليستفيد منها
                            الجميع!
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* --- نهاية الإرشاد --- */}

                    {/* --- التوجيه في الحالة الصفرية --- */}
                    {!reflectionText.trim() && (
                      <div className="bg-blue-50 border-r-4 border-blue-400 p-3 xs:p-4 sm:p-5 rounded-lg mb-3 xs:mb-4 sm:mb-5">
                        <div className="flex items-start gap-2 xs:gap-3">
                          <div className="flex-shrink-0">
                            <Lightbulb className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-blue-600 mt-0.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs xs:text-sm sm:text-base text-blue-800 leading-relaxed">
                              ابدأ بقراءة{" "}
                              <strong className="font-semibold">
                                'تفاصيل المهمة'
                              </strong>{" "}
                              (في التاب الأول) واستخدم التايمر. ثم عُد إلى هنا
                              لتدوين أهم فائدة لمست قلبك.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* --- نهاية التوجيه --- */}

                    <RichTadabburEditor
                      initialContent={reflectionText}
                      onChange={(htmlContent) => setReflectionText(htmlContent)}
                      onJSONChange={(jsonContent) =>
                        setReflectionJson(jsonContent)
                      }
                      placeholder={
                        !reflectionText.trim()
                          ? "ابدأ بقراءة 'تفاصيل المهمة' (في التاب الأول) واستخدم التايمر. ثم عُد إلى هنا لتدوين أهم فائدة لمست قلبك."
                          : "ابدأ كتابة الفوائد هنا..."
                      }
                    />
                  </div>
                  {/* ----- نهاية قسم الكتابة الموحد ----- */}

                  {/* الجسر الذكي - مشاركة في قاعة التدارس */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 xs:p-3 sm:p-4">
                    <label className="flex items-start xs:items-center cursor-pointer gap-2 xs:gap-3">
                      <input
                        type="checkbox"
                        checked={shareInStudyHall}
                        onChange={(e) => setShareInStudyHall(e.target.checked)}
                        className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-purple-600 rounded focus:ring-purple-500 ml-2 xs:ml-3 mt-0.5 xs:mt-0 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-purple-800 text-xs xs:text-sm sm:text-base flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 ml-1 flex-shrink-0" />
                          مشاركة في قاعة التدارس
                        </span>
                        <p className="text-[10px] xs:text-xs sm:text-sm text-purple-600 mt-0.5 xs:mt-1 leading-relaxed">
                          سيتم نشر هذه المذكرة ليراها ويستفيد منها باقي
                          المشاركين
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* الخطوة العملية المقترحة (اختياري) */}
                  <div>
                    <label className="block text-xs xs:text-sm sm:text-base font-medium text-gray-700 mb-1.5 xs:mb-2">
                      الخطوة العملية المقترحة (اختياري)
                    </label>
                    <textarea
                      value={proposedStep}
                      onChange={(e) => setProposedStep(e.target.value)}
                      placeholder="مثال: سأقوم بإهداء كتاب ديني لصديق هذا الأسبوع..."
                      rows={3}
                      className="w-full px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7440E9] focus:border-[#7440E9] resize-none text-xs xs:text-sm sm:text-base"
                    />
                    <p className="text-[10px] xs:text-xs sm:text-sm text-gray-500 mt-1">
                      اقترح خطوة عملية يمكن للآخرين الالتزام بها معك
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 xs:gap-2.5 sm:gap-3 pt-2">
                    {/* زر إكمال المهمة (فقط للمهام غير المكتملة) */}
                    {!selectedTask.completed && (
                      <motion.button
                        whileHover={{
                          scale: isCompleting || isCampNotStarted ? 1 : 1.02,
                        }}
                        whileTap={{
                          scale: isCompleting || isCampNotStarted ? 1 : 0.98,
                        }}
                        type="button"
                        onClick={handleCompleteAndSave}
                        disabled={isCompleting || isCampNotStarted}
                        className="w-full px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl sm:rounded-2xl transition-all text-sm sm:text-base font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      >
                        {isCompleting ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                            <span className="text-center">
                              إكمال المهمة وحفظ الفوائد
                            </span>
                          </>
                        )}
                      </motion.button>
                    )}

                    {/* زر حفظ/تحديث الفائدة فقط (للمهام المكتملة أو غير المكتملة) */}
                    {selectedTask.completed && (
                      <motion.button
                        whileHover={{
                          scale: isCompleting || isReadOnly ? 1 : 1.02,
                        }}
                        whileTap={{
                          scale: isCompleting || isReadOnly ? 1 : 0.98,
                        }}
                        type="button"
                        onClick={async () => {
                          if (isCompleting) return;
                          setIsCompleting(true);

                          try {
                            // حفظ/تحديث الفائدة فقط (بدون إكمال المهمة)
                            if (reflectionText.trim() !== "") {
                              await updateTaskBenefits(
                                selectedTask.id,
                                reflectionText.trim(),
                                "",
                                !shareInStudyHall,
                                reflectionJson,
                                proposedStep || null // proposed_step
                              );

                              const isEdit = reflectionToEdit !== null;
                              if (isEdit) {
                                toast.success("تم تحديث الفائدة بنجاح! ✅");
                                await fetchJournalData();
                              } else {
                                toast.success("تم حفظ الفائدة بنجاح! ✅");
                              }

                              // تحديث بيانات المستخدم وقاعة التدارس
                              await fetchUserProgress();
                              if (studyHallSelectedDay) {
                                await fetchStudyHallContent(
                                  studyHallSelectedDay,
                                  studyHallSort,
                                  studyHallPagination.page,
                                  20,
                                  false
                                );
                              }

                              // تحديث النص المحفوظ في selectedTask
                              // Note: This would need to be handled by parent component
                              setReflectionToEdit(null); // إعادة تعيين حالة التعديل
                              onClose();
                              setActiveTaskTab("task");
                            } else {
                              toast.error("اكتب فائدة أولاً قبل الحفظ");
                            }
                          } catch (error) {
                            console.error("Failed to save reflection:", error);
                            toast.error(
                              "حدث خطأ أثناء حفظ الفائدة. يرجى المحاولة مرة أخرى."
                            );
                          } finally {
                            setIsCompleting(false);
                          }
                        }}
                        disabled={isCompleting || isReadOnly}
                        className="w-full px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 bg-[#7440E9] text-white rounded-lg xs:rounded-xl active:bg-[#5a2fc7] sm:hover:bg-[#5a2fc7] transition-colors text-xs xs:text-sm sm:text-base font-medium flex items-center justify-center gap-1.5 xs:gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 sm:active:scale-100"
                      >
                        {isCompleting ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                            <span className="text-center">
                              {reflectionToEdit
                                ? "تحديث الفائدة"
                                : "حفظ الفائدة"}
                            </span>
                          </>
                        )}
                      </motion.button>
                    )}

                    {/* زر الإلغاء */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onClose();
                        setActiveTaskTab("task");
                        setReflectionToEdit(null);
                        setReflectionText("");
                        setReflectionJson(null);
                        setProposedStep("");
                        setShareInStudyHall(false);
                      }}
                      className="w-full px-4 sm:px-6 py-3 sm:py-3.5 bg-gray-200 text-gray-700 rounded-xl sm:rounded-2xl hover:bg-gray-300 transition-colors text-sm sm:text-base font-semibold touch-manipulation"
                    >
                      إلغاء
                    </motion.button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Action Button */}
            {activeTaskTab === "task" && videoWatched && (
              <div className="sm:hidden px-3 xs:px-4 pb-2">
                <button
                  onClick={() => setActiveTaskTab("reflection")}
                  className="w-full flex items-center justify-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2.5 xs:py-3 bg-purple-600 text-white rounded-lg xs:rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-sm xs:text-base active:scale-95"
                >
                  <span className="text-center">
                    قرأت المهمة، سأبدأ تدبري الآن ⬅️
                  </span>
                  <ArrowLeft className="w-4 h-4 xs:w-5 xs:h-5 font-bold flex-shrink-0" />
                </button>
              </div>
            )}

            {/* Footer with Timer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-3 xs:px-4 sm:px-5 md:px-6 py-2.5 xs:py-3 sm:py-4 flex-shrink-0 z-[60] shadow-lg">
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3 sm:gap-4">
                {/* Timer Display */}
                <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 w-full xs:w-auto justify-between xs:justify-start">
                  <div
                    className={`text-base xs:text-lg sm:text-xl font-mono font-bold transition-colors duration-300 ${
                      timerActive
                        ? "text-[#7440EA]"
                        : timeRemaining === 0
                        ? "text-red-600"
                        : "text-gray-700"
                    }`}
                  >
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="flex items-center gap-1.5 xs:gap-2">
                    {timerActive && (
                      <div className="flex items-center gap-1 xs:gap-1.5 px-1.5 xs:px-2 py-0.5 xs:py-1 bg-green-100 text-green-700 rounded-full text-[10px] xs:text-xs font-medium arabic-text">
                        <div className="w-1 xs:w-1.5 xs:h-1.5 bg-green-500 rounded-full animate-ping"></div>
                        <span className="whitespace-nowrap">يعمل</span>
                      </div>
                    )}
                    {!timerActive && timeRemaining === 0 && (
                      <div className="flex items-center gap-1 xs:gap-1.5 px-1.5 xs:px-2 py-0.5 xs:py-1 bg-red-100 text-red-700 rounded-full text-[10px] xs:text-xs font-medium arabic-text">
                        <div className="w-1 xs:w-1.5 xs:h-1.5 bg-red-500 rounded-full"></div>
                        <span className="whitespace-nowrap">انتهى</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timer Controls */}
                <div className="flex items-center gap-1.5 xs:gap-2 w-full xs:w-auto justify-end xs:justify-start">
                  {!timerActive ? (
                    <button
                      onClick={() => startTimer(selectedTask?.estimated_time)}
                      className="px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 bg-green-500 active:bg-green-600 sm:hover:bg-green-600 text-white rounded-lg text-[10px] xs:text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1 xs:gap-1.5 arabic-text shadow-sm active:shadow-md sm:hover:shadow-md transform active:scale-95 sm:hover:scale-105"
                    >
                      <Play className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="hidden xs:inline sm:hidden md:inline">
                        بدء
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={stopTimer}
                      className="px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 bg-red-500 active:bg-red-600 sm:hover:bg-red-600 text-white rounded-lg text-[10px] xs:text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1 xs:gap-1.5 arabic-text shadow-sm active:shadow-md sm:hover:shadow-md transform active:scale-95 sm:hover:scale-105"
                    >
                      <Clock className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="hidden xs:inline sm:hidden md:inline">
                        إيقاف
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => resetTimer(selectedTask?.estimated_time)}
                    className="px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 bg-gray-500 active:bg-gray-600 sm:hover:bg-gray-600 text-white rounded-lg text-[10px] xs:text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1 xs:gap-1.5 arabic-text shadow-sm active:shadow-md sm:hover:shadow-md transform active:scale-95 sm:hover:scale-105"
                  >
                    <Clock3 className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden xs:inline sm:hidden md:inline">
                      إعادة
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReflectionModal;
