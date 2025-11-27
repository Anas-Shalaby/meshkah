import React from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

const LeaveCampModal = ({ isOpen, onClose, onConfirm, leavingCamp }) => {
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
          هل أنت متأكد من ترك المخيم؟
        </h3>

        {/* التحذيرات */}
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-800 font-semibold mb-3 text-center">
            تحذير هام:
          </p>
          <ul className="space-y-2 text-red-700 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span>سيتم حذف جميع مهامك وتقدمك في المخيم</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span>سيتم حذف جميع نقاطك المكتسبة</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span>سيتم حذف جميع تدبراتك وفوائدك المحفوظة</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span>سيتم إزالتك من لوحة الصدارة</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span className="font-bold">لا يمكن التراجع عن هذا الإجراء!</span>
            </li>
          </ul>
        </div>

        {/* الأزرار */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={leavingCamp}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={leavingCamp}
            className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {leavingCamp ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الترك...
              </>
            ) : (
              <>نعم، ترك المخيم</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LeaveCampModal;
