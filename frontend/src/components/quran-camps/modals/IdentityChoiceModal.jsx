import React from "react";
import { UserCheck, EyeOff } from "lucide-react";

const IdentityChoiceModal = ({ isOpen, onClose, onChoice }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            اختر طريقة المشاركة
          </h3>
          <p className="text-gray-600">كيف تريد أن تظهر في المخيم؟</p>
        </div>

        <div className="space-y-4">
          {/* خيار المشاركة العامة */}
          <button
            onClick={() => onChoice("public")}
            className="w-full p-6 border-2 border-green-200 rounded-2xl hover:border-green-400 hover:bg-green-50 transition-all duration-300 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right flex-1">
                <h4 className="text-lg font-bold text-gray-800">مشاركة عامة</h4>
                <p className="text-sm text-gray-600">
                  اسمك وصورتك ستظهر للجميع
                </p>
              </div>
            </div>
          </button>

          {/* خيار المشاركة المجهولة */}
          <button
            onClick={() => onChoice("anonymous")}
            className="w-full p-6 border-2 border-purple-200 rounded-2xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <EyeOff className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-right flex-1">
                <h4 className="text-lg font-bold text-gray-800">
                  مشاركة مجهولة
                </h4>
                <p className="text-sm text-gray-600">ستظهر كـ "مشارك مجهول"</p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdentityChoiceModal;
