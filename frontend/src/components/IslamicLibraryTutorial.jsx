import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Search, 
  Filter, 
  Bookmark, 
  Share2, 
  Heart, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  X,
  Play,
  SkipForward,
  CheckCircle,
  Star
} from "lucide-react";
import { getTranslation } from "../utils/translations";

const IslamicLibraryTutorial = ({ language, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [completedSteps, setCompletedSteps] = useState([]);

  const tutorialSteps = [
    {
      id: "welcome",
      icon: Sparkles,
      title: getTranslation(language, "tutorialWelcome"),
      description: getTranslation(language, "tutorialWelcomeDesc"),
      action: getTranslation(language, "tutorialWelcomeAction"),
      color: "from-purple-500 to-pink-500",
      position: "center"
    },
    {
      id: "search",
      icon: Search,
      title: getTranslation(language, "tutorialSearch"),
      description: getTranslation(language, "tutorialSearchDesc"),
      action: getTranslation(language, "tutorialSearchAction"),
      color: "from-blue-500 to-cyan-500",
      position: "top"
    },
    {
      id: "filters",
      icon: Filter,
      title: getTranslation(language, "tutorialFilters"),
      description: getTranslation(language, "tutorialFiltersDesc"),
      action: getTranslation(language, "tutorialFiltersAction"),
      color: "from-green-500 to-emerald-500",
      position: "top"
    },
    {
      id: "categories",
      icon: BookOpen,
      title: getTranslation(language, "tutorialCategories"),
      description: getTranslation(language, "tutorialCategoriesDesc"),
      action: getTranslation(language, "tutorialCategoriesAction"),
      color: "from-orange-500 to-red-500",
      position: "center"
    },
    {
      id: "bookmarks",
      icon: Bookmark,
      title: getTranslation(language, "tutorialBookmarks"),
      description: getTranslation(language, "tutorialBookmarksDesc"),
      action: getTranslation(language, "tutorialBookmarksAction"),
      color: "from-purple-500 to-indigo-500",
      position: "top"
    },
    {
      id: "share",
      icon: Share2,
      title: getTranslation(language, "tutorialShare"),
      description: getTranslation(language, "tutorialShareDesc"),
      action: getTranslation(language, "tutorialShareAction"),
      color: "from-pink-500 to-rose-500",
      position: "center"
    },
    {
      id: "complete",
      icon: CheckCircle,
      title: getTranslation(language, "tutorialComplete"),
      description: getTranslation(language, "tutorialCompleteDesc"),
      action: getTranslation(language, "tutorialCompleteAction"),
      color: "from-green-500 to-teal-500",
      position: "center"
    }
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(() => {
      onSkip();
    }, 300);
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const currentStepData = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-6">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>{getTranslation(language, "step")} {currentStep + 1} {getTranslation(language, "of")} {tutorialSteps.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                />
              </div>
            </div>

            {/* Step Indicator */}
            <div className="flex justify-center space-x-2 mb-6">
              {tutorialSteps.map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentStep 
                      ? "bg-gradient-to-r from-purple-500 to-blue-500" 
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className={`w-16 h-16 bg-gradient-to-br ${currentStepData.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
              >
                <currentStepData.icon className="w-8 h-8 text-white" />
              </motion.div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {currentStepData.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {currentStepData.description}
              </p>

              {/* Action Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className={`w-full bg-gradient-to-r ${currentStepData.color} text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300`}
              >
                {currentStepData.action}
              </motion.button>
            </motion.div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center p-6 border-t border-gray-100">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-all ${
                currentStep === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">{getTranslation(language, "previous")}</span>
            </button>

            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {getTranslation(language, "skipTutorial")}
              </button>
              <button
                onClick={handleComplete}
                className="text-purple-600 hover:text-purple-700 text-sm px-3 py-1 rounded-lg hover:bg-purple-50 transition-colors"
              >
                {getTranslation(language, "finishTutorial")}
              </button>
            </div>

            <button
              onClick={handleNext}
              disabled={currentStep === tutorialSteps.length - 1}
              className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-all ${
                currentStep === tutorialSteps.length - 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <span className="text-sm">{getTranslation(language, "next")}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IslamicLibraryTutorial; 