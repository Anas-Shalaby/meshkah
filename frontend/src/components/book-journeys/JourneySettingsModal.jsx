import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Settings,
  Gauge,
  FileText,
  RotateCcw,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  updateJourneySettings,
  resetJourneyProgress,
} from "../../services/bookJourneysService";

/**
 * Modal لتعديل إعدادات الختمة
 * يسمح بتغيير: السرعة (pace)، التعهد، وإعادة ضبط الختمة
 */
const JourneySettingsModal = ({
  isOpen,
  onClose,
  journey,
  onUpdate,
}) => {
  const [pace, setPace] = useState(journey?.pace || 3);
  const [pledge, setPledge] = useState(journey?.pledge || "");
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const result = await updateJourneySettings(journey.id, { pace, pledge });
      
      toast.success("تم حفظ الإعدادات بنجاح ✅");
      
      if (onUpdate) {
        onUpdate(result.settings);
      }
      onClose();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("حدث خطأ في حفظ الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetLoading(true);
      await resetJourneyProgress(journey.id);
      
      toast.success("تم إعادة ضبط الختمة بنجاح 🔄");
      setShowResetConfirm(false);
      
      if (onUpdate) {
        onUpdate({ reset: true });
      }
      onClose();
    } catch (error) {
      console.error("Error resetting journey:", error);
      toast.error("حدث خطأ في إعادة الضبط");
    } finally {
      setResetLoading(false);
    }
  };

  const remainingHadiths = journey?.total_hadiths - (journey?.current_position || 0);
  const estimatedDays = Math.ceil(remainingHadiths / pace);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 top-[60px] z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6" />
                <h2 className="text-xl font-bold">إعدادات الختمة</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-purple-200 mt-2 text-sm">
              {journey?.book_name}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Pace Setting */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-medium mb-3">
                <Gauge className="w-5 h-5 text-purple-600" />
                عدد الأحاديث اليومية
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={pace}
                  onChange={(e) => setPace(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="bg-purple-100 text-purple-700 font-bold px-4 py-2 rounded-xl min-w-[60px] text-center">
                  {pace}
                </div>
              </div>
              <p className="text-gray-500 text-sm mt-2">
                باقي {remainingHadiths} حديث • تقدير الإنتهاء: {estimatedDays} يوم
              </p>
            </div>

            {/* Pledge Setting */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-medium mb-3">
                <FileText className="w-5 h-5 text-purple-600" />
                التعهد
              </label>
              <textarea
                value={pledge}
                onChange={(e) => setPledge(e.target.value)}
                placeholder="اكتب تعهدك هنا... مثال: أتعهد بقراءة الورد اليومي بعد صلاة الفجر"
                className="w-full p-4 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all resize-none h-24 text-right"
                dir="rtl"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  حفظ الإعدادات
                </>
              )}
            </button>

            {/* Divider */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="flex items-center gap-2 text-red-600 font-medium mb-3">
                <AlertTriangle className="w-5 h-5" />
                إعادة ضبط الختمة
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                سيتم حذف جميع التقدم والبدء من الصفر. هذا الإجراء لا يمكن التراجع عنه.
              </p>
              
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  إعادة ضبط الختمة
                </button>
              ) : (
                <div className="bg-red-50 p-4 rounded-xl space-y-3">
                  <p className="text-red-800 font-medium text-center">
                    هل أنت متأكد؟ سيتم حذف كل التقدم!
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={resetLoading}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {resetLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      تأكيد الحذف
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default JourneySettingsModal;
