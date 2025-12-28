import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  BookOpen,
  Send,
  Eye,
  Edit3,
  Sparkles,
  Clock,
  Star,
} from "lucide-react";

/**
 * TaskCompletionModal - Mobile-optimized modal for task completion
 * Provides a better UX for writing reflections with preview and guidance
 */
const TaskCompletionModal = ({
  isOpen,
  onClose,
  task,
  reflectionText,
  setReflectionText,
  proposedStep,
  setProposedStep,
  isPrivate,
  setIsPrivate,
  onSubmit,
  isSubmitting,
  camp,
}) => {
  const [activeView, setActiveView] = useState("write"); // "write" | "preview"
  const [charCount, setCharCount] = useState(0);
  const MIN_CHARS = 10;

  useEffect(() => {
    setCharCount(reflectionText?.length || 0);
  }, [reflectionText]);

  if (!isOpen || !task) return null;
  
  const isValid = true;
  const progressPercent = Math.min((charCount / MIN_CHARS) * 100, 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 top-[60px] bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-white rounded-2xl max-h-[75vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
         
          {/* Header */}
          <div className="bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] p-4 sm:p-5 text-white sm:rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg truncate  max-w-[200px]">
                    {task.title}
                  </h3>
                  <p className="text-white/80 text-xs flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {task.estimated_time || "30 دقيقة"}
                    <span className="mx-1">•</span>
                    <Star className="w-3 h-3" />
                    {task.points || 3} نقاط
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* View Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveView("write")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === "write"
                    ? "bg-white text-[#7440E9]"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>كتابة</span>
              </button>
              <button
                onClick={() => setActiveView("preview")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === "preview"
                    ? "bg-white text-[#7440E9]"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>معاينة</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {activeView === "write" ? (
              <div className="space-y-4">
                {/* Guidance */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        نصيحة للكتابة
                      </p>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        اكتب فائدة تدبرية استخلصتها من هذه المهمة. ما الذي
                        لمسك؟ كيف يمكنك تطبيقه في حياتك؟
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reflection Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    فائدتك التدبرية
                  </label>
                  <textarea
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    placeholder="ما الفائدة التي خرجت بها من هذه المهمة؟ شاركنا تدبرك وأفكارك..."
                    className="w-full h-32 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#7440E9]/20 focus:border-[#7440E9] transition-all text-gray-800"
                  />
                  {/* Character counter */}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isValid
                            ? "bg-gradient-to-r from-green-400 to-emerald-500"
                            : "bg-gradient-to-r from-[#7440E9] to-[#B794F6]"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs mr-3 font-medium ${
                        isValid ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      {charCount}/{MIN_CHARS}
                    </span>
                  </div>
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
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-700">
                    إخفاء في قاعة التدارس
                  </span>
                  <button
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isPrivate ? "bg-[#7440E9]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        isPrivate ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            ) : (
              /* Preview View */
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#7440E9] to-[#8B5CF6] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">أنت</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        اسمك
                      </p>
                      <p className="text-xs text-gray-500">الآن</p>
                    </div>
                  </div>
                  <p className="text-gray-800 leading-relaxed">
                    {reflectionText || (
                      <span className="text-gray-400 italic">
                        اكتب فائدتك لتظهر هنا...
                      </span>
                    )}
                  </p>
                  {proposedStep && (
                    <div className="mt-3 p-3 bg-[#F7F6FB] rounded-lg border-r-4 border-[#7440E9]">
                      <p className="text-xs font-semibold text-[#7440E9] mb-1">
                        الخطوة العملية:
                      </p>
                      <p className="text-sm text-gray-700">{proposedStep}</p>
                    </div>
                  )}
                </div>
                {isPrivate && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl">
                    <span>🔒</span>
                    <span>هذه الفائدة لن تظهر في قاعة التدارس</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 sm:p-5">
            <button
              onClick={onSubmit}
              disabled={!isValid || isSubmitting}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base transition-all ${
                isValid && !isSubmitting
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl active:scale-[0.98]"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>إكمال المهمة</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TaskCompletionModal;
