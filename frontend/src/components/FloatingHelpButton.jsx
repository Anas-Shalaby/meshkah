import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Sparkles, BookOpen, Search, Filter, Bookmark, Share2 } from "lucide-react";
import { getTranslation } from "../utils/translations";

const FloatingHelpButton = ({ language, onStartTutorial }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const quickTips = [
    {
      icon: Search,
      title: getTranslation(language, "quickTipSearch"),
      description: getTranslation(language, "quickTipSearchDesc"),
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Filter,
      title: getTranslation(language, "quickTipFilter"),
      description: getTranslation(language, "quickTipFilterDesc"),
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Bookmark,
      title: getTranslation(language, "quickTipBookmark"),
      description: getTranslation(language, "quickTipBookmarkDesc"),
      color: "from-purple-500 to-indigo-500"
    },
    {
      icon: Share2,
      title: getTranslation(language, "quickTipShare"),
      description: getTranslation(language, "quickTipShareDesc"),
      color: "from-pink-500 to-rose-500"
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-purple-200/50 p-4 mb-4"
          >
            {/* Header */}
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {getTranslation(language, "quickHelp")}
                </h3>
                <p className="text-gray-500 text-xs">
                  {getTranslation(language, "quickHelpDesc")}
                </p>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="space-y-3 mb-4">
              {quickTips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 space-x-reverse p-3 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  <div className={`w-8 h-8 bg-gradient-to-br ${tip.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <tip.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">
                      {tip.title}
                    </h4>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Start Tutorial Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsExpanded(false);
                onStartTutorial();
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
            >
              {getTranslation(language, "startTutorial")}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Help Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-white"
      >
        <HelpCircle className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

export default FloatingHelpButton; 