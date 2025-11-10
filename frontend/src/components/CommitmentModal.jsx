import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, CheckSquare, Square, CheckCircle } from "lucide-react"; // (استورد الأيقونات اللازمة)

const CommitmentModal = ({ isOpen, onClose, onConfirm, campName }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false); // (لإظهار loading)

  // (شروط المخيم - يمكن لاحقًا جلبها من الـ API)
  const conditions = [
    "أتعهد بتخصيص وقت كافٍ يوميًا لإتمام المهام.",
    "أتعهد بالالتزام بالجدية والتركيز أثناء التدارس.",
    "أفهم أن هذا المخيم يتطلب التزامًا يوميًا وقد يكون مكثفًا.",
  ];

  const handleConfirm = async () => {
    if (!isChecked) return;
    setIsEnrolling(true);
    try {
      // (استدعاء دالة الانضمام الأصلية)
      await onConfirm();
    } catch (error) {
      console.error("Enrollment failed in modal:", error);
    } finally {
      setIsEnrolling(false);
      // (لا تغلق المودال تلقائيًا عند الخطأ، لكن أغلقه عند النجاح)
      // (onConfirm الأصلية هي التي ستغلق الصفحة عبر navigate)
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-purple-600" />
                ميثاق الانضمام
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 text-lg mb-4">
              أهلاً بك! للانضمام إلى "
              <span className="font-semibold text-purple-700">{campName}</span>
              ", يرجى قراءة الشروط التالية والتعهّد بالالتزام بها:
            </p>

            {/* قائمة الشروط */}
            <div className="space-y-3 my-6">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">{condition}</span>
                </div>
              ))}
            </div>

            {/* Checkbox التعهّد */}
            <div className="mb-6">
              <label
                className="flex items-center space-x-3 cursor-pointer p-4 bg-purple-50 rounded-lg border border-purple-200"
                dir="rtl"
              >
                <div
                  onClick={() => setIsChecked(!isChecked)}
                  className={`w-6 h-6 flex-shrink-0 rounded-md border-2 ${
                    isChecked
                      ? "bg-purple-600 border-purple-600"
                      : "bg-white border-gray-400"
                  } flex items-center justify-center transition-all`}
                >
                  {isChecked && <CheckSquare className="w-4 h-4 text-white" />}
                </div>
                <span className="flex-1 font-semibold text-purple-800">
                  أقر وأتعهد بأنني قرأت الشروط ومستعد للالتزام بها.
                </span>
              </label>
            </div>

            {/* زر تأكيد الانضمام */}
            <button
              onClick={handleConfirm}
              disabled={!isChecked || isEnrolling} // (لا يمكن الضغط عليه إلا بعد الموافقة)
              className="w-full px-6 py-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors font-semibold flex items-center justify-center gap-2 text-lg
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
            >
              {isEnrolling ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <CheckSquare className="w-5 h-5" />
                  تأكيد الانضمام
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommitmentModal;
