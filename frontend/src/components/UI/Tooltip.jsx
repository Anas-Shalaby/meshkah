import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Tooltip Component
 * @param {Object} props
 * @param {React.ReactNode} props.children - العنصر الذي سيظهر عليه الـ tooltip
 * @param {string} props.text - نص الـ tooltip
 * @param {string} props.position - موضع الـ tooltip (top, bottom, left, right)
 * @param {boolean} props.disabled - تعطيل الـ tooltip
 */
export const Tooltip = ({
  children,
  text,
  position = "top",
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  if (disabled || !text) return children;

  const positionClasses = {
    top: "bottom-full left-[-100px] -translate-x-0 mb-1.5",
    bottom: "top-full left-[-100px] -translate-x-0 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  };

  const arrowClasses = {
    top: "top-full left-1 -translate-y-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent",
    bottom:
      "bottom-full left-1 translate-y-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 -translate-x-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent",
    right:
      "right-full top-1/2 -translate-y-1/2 translate-x-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent",
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.8,
              y: position === "top" ? 5 : position === "bottom" ? -5 : 0,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 pointer-events-none ${positionClasses[position]}`}
            style={{ whiteSpace: "nowrap" }}
          >
            <div className="bg-gray-800 text-white text-xs sm:text-sm rounded-lg px-3 py-2 shadow-xl">
              {text}
              <div
                className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

/**
 * Confirmation Dialog Component
 */
export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  confirmColor = "purple",
}) => {
  if (!isOpen) return null;

  const colorClasses = {
    purple: "bg-purple-600 hover:bg-purple-700",
    red: "bg-red-600 hover:bg-red-700",
    green: "bg-green-600 hover:bg-green-700",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              {title}
            </h3>
            <p className="text-gray-600 mb-6 text-base sm:text-lg">{message}</p>
            <div className="flex gap-3 sm:gap-4 justify-end">
              <button
                onClick={onClose}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-sm sm:text-base"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-white rounded-xl transition-colors font-semibold text-sm sm:text-base ${colorClasses[confirmColor]}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
