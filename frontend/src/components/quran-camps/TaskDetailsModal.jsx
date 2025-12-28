import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  Star,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Play,
  FileText,
  Link as LinkIcon,
  PenLine,
  Eye,
  Send,
  AlertCircle,
} from "lucide-react";

/**
 * TaskDetailsModal - Enhanced task details and reflection modal
 * A cleaner, step-based approach for better UX
 */
const TaskDetailsModal = ({
  isOpen,
  onClose,
  task,
  camp,
  isReadOnly = false,
  isCampNotStarted = false,
  onComplete,
  onSaveDraft,
  reflectionText,
  setReflectionText,
  proposedStep,
  setProposedStep,
  shareInStudyHall,
  setShareInStudyHall,
  isSubmitting = false,
  EmbeddedVideoPlayer,
  TaskLinks,
  TaskAttachments,
  RichTadabburEditor,
  reflectionJson,
  setReflectionJson,
}) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Read, 2: Write, 3: Review
  const [hasReadTask, setHasReadTask] = useState(false);
  const [activeView, setActiveView] = useState("write"); // "write" | "preview"

  const totalSteps = 3;

  useEffect(() => {
    if (isOpen) {
      // Reset state when opening
      setCurrentStep(1);
      setHasReadTask(task?.completed || false);
    }
  }, [isOpen, task?.id]);

  if (!isOpen || !task) return null;

  const canProceed = currentStep === 1 ? hasReadTask : true;
  const isCompleted = task?.completed;

  const steps = [
    { id: 1, label: "قراءة المهمة", icon: BookOpen },
    { id: 2, label: "كتابة التدبر", icon: PenLine },
    { id: 3, label: "مراجعة وإرسال", icon: Send },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 top-[60px] bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full sm:max-w-2xl h-[calc(100vh-60px)] sm:h-auto sm:max-h-[85vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] p-3 sm:p-5 text-white">
            {/* Mobile Handle */}
            <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-3 sm:hidden" />
            
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-base sm:text-xl line-clamp-2 sm:truncate leading-tight">
                    {task.title}
                  </h2>
                  <div className="flex items-center gap-2 sm:gap-3 text-white/80 text-xs sm:text-sm mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      {task.estimated_time || "30 دقيقة"}
                    </span>
                    {task.points && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                        {task.points}
                      </span>
                    )}
                    <span
                      className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${
                        task.is_optional
                          ? "bg-orange-400/30"
                          : "bg-white/20"
                      }`}
                    >
                      {task.is_optional ? "اختياري" : "مطلوب"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Steps */}
            {!isCompleted && (
              <div className="mt-3 sm:mt-4 flex items-center justify-between gap-1 sm:gap-2">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isDone = currentStep > step.id;

                  return (
                    <React.Fragment key={step.id}>
                      <button
                        onClick={() => {
                          if (isDone || (step.id === 2 && hasReadTask)) {
                            setCurrentStep(step.id);
                          }
                        }}
                        disabled={step.id > currentStep && !isDone}
                        className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          isActive
                            ? "bg-white text-[#7440E9]"
                            : isDone
                            ? "bg-white/30 text-white"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        ) : (
                          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                        <span className="hidden sm:inline">{step.label}</span>
                        <span className="sm:hidden text-[10px]">
                          {step.id === 1 ? "قراءة" : step.id === 2 ? "كتابة" : "إرسال"}
                        </span>
                      </button>
                      {index < steps.length - 1 && (
                        <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 text-white/40 flex-shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* Completed Badge */}
            {isCompleted && (
              <div className="mt-4 flex items-center justify-center gap-2 bg-green-500/20 rounded-xl py-2">
                <CheckCircle2 className="w-5 h-5 text-green-300" />
                <span className="text-green-100 font-medium">تم إكمال هذه المهمة</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            {/* Step 1: Read Task */}
            {currentStep === 1 && (
              <div className="space-y-4 sm:space-y-5">
                {/* Video */}
                {task.youtube_link && EmbeddedVideoPlayer && (
                  <div className="rounded-xl overflow-hidden">
                    <EmbeddedVideoPlayer
                      youtubeLink={task.youtube_link}
                      taskId={task.id}
                      onVideoWatched={() => setHasReadTask(true)}
                    />
                  </div>
                )}

                {/* Verses */}
                {(task.verses_from || task.verses_to) && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-r-4 border-[#7440E9]">
                    <div className="flex items-center gap-2 text-[#7440E9] font-medium">
                      <BookOpen className="w-5 h-5" />
                      <span>
                        {task.verses_from && task.verses_to
                          ? `الآيات ${task.verses_from} - ${task.verses_to}`
                          : task.verses_from
                          ? `من الآية ${task.verses_from}`
                          : `إلى الآية ${task.verses_to}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-[#7440E9]" />
                    وصف المهمة
                  </h3>
                  <div
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: task.description || "" }}
                  />
                </div>

                {/* Resources */}
                {(task?.tafseer_link ||
                  task?.additional_links?.length > 0 ||
                  task?.attachments?.length > 0) && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-[#7440E9]" />
                      موارد مساعدة
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {TaskLinks && (
                        <TaskLinks
                          links={task?.additional_links}
                          tafsirLink={task?.tafseer_link}
                        />
                      )}
                      {TaskAttachments && (
                        <TaskAttachments
                          attachments={task?.attachments}
                          apiUrl={import.meta.env.VITE_API_URL}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Acknowledgment */}
                {!isCompleted && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasReadTask}
                        onChange={(e) => setHasReadTask(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-[#7440E9] focus:ring-[#7440E9] mt-0.5"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">
                          قرأت وصف المهمة جيداً وفهمت المطلوب
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          يرجى التأكد من قراءة تفاصيل المهمة بعناية قبل البدء
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Write Reflection */}
            {currentStep === 2 && (
              <div className="space-y-5">
                {/* Writing Tips */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800">نصائح للكتابة</p>
                      <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                        اكتب ما تعلمته وكيف ستطبقه في حياتك. شارك لحظات التأثر والتأمل.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reflection Editor */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    شاركنا تدبرك وفوائدك
                  </label>
                  <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                    للحصول على اقتراحات الأحاديث، اكتب{" "}
                    <span className="font-bold text-purple-600">/حديث</span>{" "}
                    ثم كلمة البحث (مثال:{" "}
                    <span className="font-bold text-purple-600">/حديث الصبر</span>)
                  </p>
                  
                  {RichTadabburEditor ? (
                    <RichTadabburEditor
                      initialContent={reflectionText}
                      onChange={(htmlContent) => setReflectionText(htmlContent)}
                      onJSONChange={(jsonContent) => setReflectionJson?.(jsonContent)}
                      placeholder="ابدأ كتابة الفوائد هنا..."
                      taskId={task?.id}
                    />
                  ) : (
                    <textarea
                      value={reflectionText}
                      onChange={(e) => setReflectionText(e.target.value)}
                      placeholder="ما الفائدة التي خرجت بها؟ شاركنا تدبرك..."
                      className="w-full h-36 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#7440E9]/20 focus:border-[#7440E9] transition-all text-gray-800"
                    />
                  )}
                </div>

                {/* Proposed Step */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الخطوة العملية{" "}
                    <span className="text-gray-400 font-normal">(اختياري)</span>
                  </label>
                  <input
                    type="text"
                    value={proposedStep}
                    onChange={(e) => setProposedStep(e.target.value)}
                    placeholder="ما الخطوة العملية التي ستتخذها؟"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7440E9]/20 focus:border-[#7440E9] transition-all text-gray-800"
                  />
                </div>

                {/* Privacy Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-700">
                    مشاركة في قاعة التدارس
                  </span>
                  <button
                    onClick={() => setShareInStudyHall(!shareInStudyHall)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      shareInStudyHall ? "bg-[#7440E9]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        shareInStudyHall ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#7440E9]" />
                  مراجعة قبل الإرسال
                </h3>

                {/* Preview Card */}
                <div className="bg-gradient-to-br from-[#F7F6FB] to-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#7440E9] to-[#8B5CF6] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">أنت</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">فائدتك</p>
                      <p className="text-xs text-gray-500">الآن</p>
                    </div>
                  </div>

                  {reflectionText ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: reflectionText }} 
                      className="text-gray-800 leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none"
                    />
                  ) : (
                    <p className="text-gray-400 italic">لم تكتب فائدة</p>
                  )}

                  {proposedStep && (
                    <div className="mt-4 p-3 bg-[#7440E9]/10 rounded-lg border-r-4 border-[#7440E9]">
                      <p className="text-xs font-semibold text-[#7440E9] mb-1">
                        الخطوة العملية:
                      </p>
                      <p className="text-sm text-gray-700">{proposedStep}</p>
                    </div>
                  )}
                </div>

                {/* Sharing Status */}
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <span>{shareInStudyHall ? "🌍" : "🔒"}</span>
                  <span>
                    {shareInStudyHall
                      ? "سيتم مشاركة هذه الفائدة في قاعة التدارس"
                      : "هذه الفائدة خاصة ولن تظهر في قاعة التدارس"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 sm:p-5 flex gap-3">
            {/* Back Button */}
            {currentStep > 1 && !isCompleted && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="hidden sm:inline">السابق</span>
              </button>
            )}

            {/* Main Action Button */}
            <button
              onClick={() => {
                if (currentStep < totalSteps) {
                  setCurrentStep(currentStep + 1);
                } else {
                  onComplete?.({
                    reflectionText,
                    proposedStep,
                    shareInStudyHall
                  });
                }
              }}
              disabled={!canProceed || isSubmitting || (isReadOnly && currentStep === totalSteps)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-base transition-all ${
                canProceed && !isSubmitting && !(isReadOnly && currentStep === totalSteps)
                  ? currentStep === totalSteps
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl active:scale-[0.98]"
                    : "bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white shadow-lg hover:shadow-xl active:scale-[0.98]"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : currentStep === totalSteps ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>إكمال المهمة</span>
                </>
              ) : currentStep === 1 ? (
                <>
                  <span>التالي: كتابة التدبر</span>
                  <ChevronLeft className="w-5 h-5" />
                </>
              ) : (
                <>
                  <span>التالي: مراجعة</span>
                  <ChevronLeft className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Close for completed tasks */}
            {isCompleted && (
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-base bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                إغلاق
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TaskDetailsModal;
