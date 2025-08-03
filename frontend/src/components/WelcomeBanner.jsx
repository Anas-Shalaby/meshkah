import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, Heart, X, Play, Search } from "lucide-react";
import { getTranslation } from "../utils/translations";

const WelcomeBanner = ({ language, onStartTutorial, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handleStartTutorial = () => {
    setIsVisible(false);
    setTimeout(() => {
      onStartTutorial();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 text-white p-4 sm:p-6 rounded-2xl shadow-2xl mb-6 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 -translate-y-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-10 translate-y-10"></div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10">
          <div className="flex items-start space-x-4 space-x-reverse">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0"
            >
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
            </motion.div>

            {/* Content */}
            <div className="flex-1">
              <motion.h3
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg sm:text-xl font-bold mb-2"
              >
                {getTranslation(language, "welcomeToLibrary")}
              </motion.h3>
              
              <motion.p
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/90 text-sm sm:text-base mb-4 leading-relaxed"
              >
                {getTranslation(language, "welcomeBannerDesc")}
              </motion.p>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4"
              >
                <div className="flex items-center space-x-2 space-x-reverse text-sm">
                  <BookOpen className="w-4 h-4 text-white/80" />
                  <span>{getTranslation(language, "thousandsOfHadiths")}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-sm">
                  <Search className="w-4 h-4 text-white/80" />
                  <span>{getTranslation(language, "smartSearch")}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-sm">
                  <Heart className="w-4 h-4 text-white/80" />
                  <span>{getTranslation(language, "saveFavorites")}</span>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartTutorial}
                  className="flex items-center justify-center space-x-2 space-x-reverse bg-white text-purple-600 font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Play className="w-4 h-4" />
                  <span>{getTranslation(language, "takeTour")}</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDismiss}
                  className="flex items-center justify-center space-x-2 space-x-reverse bg-white/20 backdrop-blur-sm text-white font-semibold py-3 px-6 rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300"
                >
                  <span>{getTranslation(language, "exploreNow")}</span>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WelcomeBanner; 