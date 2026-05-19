    /**
 * مودال مراجعة اليوم - Day Review Modal
 * يعرض أحاديث يوم محدد للمراجعة
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader,
} from "lucide-react";
import { getDayHadiths } from "../../services/bookJourneysService";

const DayReviewModal = ({ isOpen, onClose, journeyId, date, bookName }) => {
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen && journeyId && date) {
      loadDayHadiths();
    }
  }, [isOpen, journeyId, date]);

  const loadDayHadiths = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDayHadiths(journeyId, date);
      setHadiths(response.hadiths || []);
      setCurrentIndex(0);
    } catch (err) {
      console.error("Error loading day hadiths:", err);
      setError("حدث خطأ في تحميل أحاديث اليوم");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('ar-SA', options);
  };

  const handleNext = () => {
    if (currentIndex < hadiths.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!isOpen) return null;

  const currentHadith = hadiths[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* الهيدر */}
          <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold arabic-text">مراجعة اليوم</h2>
                  <p className="text-purple-200 text-xs sm:text-sm arabic-text">{formatDate(date)}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* شريط التقدم */}
            {hadiths.length > 0 && (
              <div className="mt-3 sm:mt-4">
                <div className="flex justify-between text-xs sm:text-sm text-purple-200 mb-2">
                  <span>الحديث {currentIndex + 1} من {hadiths.length}</span>
                  <span className="truncate max-w-[120px] sm:max-w-none">{bookName}</span>
                </div>
                <div className="h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / hadiths.length) * 100}%` }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* المحتوى */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[55vh] sm:max-h-[60vh]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <Loader className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500 animate-spin mb-4" />
                <p className="text-gray-500 arabic-text text-sm sm:text-base">جاري تحميل الأحاديث...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-red-500 arabic-text text-sm sm:text-base">{error}</p>
                <button
                  onClick={loadDayHadiths}
                  className="mt-4 px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm sm:text-base"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : hadiths.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 arabic-text text-sm sm:text-base">لم تقرأ أي أحاديث في هذا اليوم</p>
              </div>
            ) : currentHadith ? (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* رقم الحديث */}
                <div className="flex items-center justify-center mb-4 sm:mb-6">
                  <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 rounded-full font-bold text-base sm:text-lg">
                    الحديث رقم {currentHadith.idInBook}
                  </span>
                </div>

                {/* نص الحديث */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <p className="text-lg sm:text-xl leading-[2.2] sm:leading-[2.5] text-gray-800 arabic-text text-center amiri-regular">
                    {currentHadith.arabic}
                  </p>
                </div>

                {/* الملاحظات إن وجدت */}
                {currentHadith.notes && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-amber-800 arabic-text">
                      <span className="font-bold">ملاحظاتك:</span> {currentHadith.notes}
                    </p>
                  </div>
                )}
              </motion.div>
            ) : null}
          </div>

          {/* أزرار التنقل */}
          {hadiths.length > 1 && (
            <div className="border-t border-gray-100 p-3 sm:p-4 pb-5 sm:pb-6 flex items-center justify-between gap-2 sm:gap-4">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`flex-1 py-2.5 sm:py-3 rounded-xl font-medium flex items-center justify-center gap-1 sm:gap-2 transition-all text-sm sm:text-base ${
                  currentIndex > 0
                    ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                }`}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                السابق
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === hadiths.length - 1}
                className={`flex-1 py-2.5 sm:py-3 rounded-xl font-medium flex items-center justify-center gap-1 sm:gap-2 transition-all text-sm sm:text-base ${
                  currentIndex < hadiths.length - 1
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                }`}
              >
                التالي
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DayReviewModal;

