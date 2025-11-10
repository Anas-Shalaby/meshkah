import { motion, AnimatePresence } from "framer-motion";
import { X, Info } from "lucide-react";

const OnboardingModal = ({
  isOpen,
  onClose,
  title,
  children,
  icon: Icon = Info,
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-gradient-to-br from-white via-purple-50 to-blue-50 rounded-2xl p-6 max-w-sm w-full shadow-xl border border-purple-100 relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16  bg-[#7440E9] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Icon className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>

        <div className="text-gray-600 mb-6 text-sm leading-relaxed">
          {children}
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md"
        >
          فهمت، شكرًا!
        </button>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-full"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </motion.div>
    </motion.div>
  );
};

export default OnboardingModal;
