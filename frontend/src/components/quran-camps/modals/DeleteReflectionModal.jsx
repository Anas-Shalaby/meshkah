import React from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

const DeleteReflectionModal = ({
  isOpen,
  onClose,
  onConfirm,
  isFromJournal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        {/* أيقونة التحذير */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>

        {/* العنوان */}
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
          {isFromJournal
            ? "هل أنت متأكد من حذف هذه الفائدة؟"
            : "هل أنت متأكد من حذف هذا التدبر؟"}
        </h3>

        {/* التحذيرات */}
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-800 font-semibold mb-3 text-center">تحذير:</p>
          <ul className="space-y-2 text-red-700 text-sm">
            {isFromJournal ? (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>سيتم حذف الفائدة نهائياً من سجلك</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span className="font-bold">سيتم خصم 3 نقاط من نقاطك</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>سيتم حذفها من قاعة التدارس إذا كانت مشاركة</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span className="font-bold">
                    لا يمكن التراجع عن هذا الإجراء!
                  </span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>سيتم حذف التدبر نهائياً من قاعة التدارس</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>سيتم حذف كل التصويتات على هذا التدبر</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>سيتم إزالته من قوائم المستخدمين الذين حفظوه</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span className="font-bold">
                    لا يمكن التراجع عن هذا الإجراء!
                  </span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* الأزرار */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            نعم، احذف
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteReflectionModal;
