import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  const shortcuts = [
    {
      category: "التنقل",
      items: [
        { keys: ["J"], description: "الانتقال للتبويب التالي" },
        { keys: ["K"], description: "الانتقال للتبويب السابق" },
      ],
    },
    {
      category: "البحث",
      items: [
        {
          keys: ["Ctrl", "K"],
          description: "فتح البحث السريع",
        },
      ],
    },
    {
      category: "عام",
      items: [
        { keys: ["Ctrl", "/"], description: "عرض قائمة الاختصارات" },
        { keys: ["Esc"], description: "إغلاق النوافذ المنبثقة" },
      ],
    },
  ];

  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold text-gray-900">
                  اختصارات لوحة المفاتيح
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {shortcuts.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      {category.category}
                    </h3>
                    <div className="space-y-2">
                      {category.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                          <span className="text-gray-700">
                            {item.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {item.keys.map((key, keyIndex) => (
                              <React.Fragment key={keyIndex}>
                                {keyIndex > 0 && (
                                  <span className="text-gray-400 mx-1">+</span>
                                )}
                                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono text-gray-700">
                                  {key === "Ctrl" && isMac ? "⌘" : key}
                                </kbd>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
                <p className="text-sm text-gray-600 text-center">
                  اضغط على Esc أو انقر خارج النافذة للإغلاق
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcutsModal;
