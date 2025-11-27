import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  MapPin,
  BookOpen,
  FolderOpen,
  FileText,
  Users,
  Sparkles,
} from "lucide-react";

const CampTour = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState(null);

  const tourSteps = [
    {
      id: "welcome",
      title: "مرحباً بك في رحلة المخيم! 🎉",
      description:
        "هذه جولة سريعة لتعرفك على أقسام المخيم وكيفية استخدامها. دعنا نبدأ!",
      icon: Sparkles,
      target: null,
      position: "center",
    },
    {
      id: "journey",
      title: "خريطة الرحلة",
      description:
        "من هنا يمكنك رؤية جميع أيام المخيم والمهام. انقر على أي يوم للانتقال إلى مهامه مباشرة.",
      icon: MapPin,
      target: '[data-tour="journey-tab"]',
      position: "bottom",
    },
    {
      id: "resources",
      title: "الموارد التعليمية",
      description:
        "هنا تجد جميع الموارد التعليمية: فيديوهات، كتب، ملفات صوتية، وروابط مفيدة. استخدمها لدعم رحلتك.",
      icon: FolderOpen,
      target: '[data-tour="resources-tab"]',
      position: "bottom",
    },
    {
      id: "journal",
      title: "سجلي الشخصي",
      description:
        "هذا هو مكانك الخاص لتسجيل تدبرك وأفكارك. يمكنك مشاركة تدبرك مع الآخرين أو إبقائه خاصاً.",
      icon: FileText,
      target: '[data-tour="journal-tab"]',
      position: "bottom",
    },
    {
      id: "friends",
      title: "الصحبة والأصدقاء",
      description:
        "تفاعل مع المشاركين الآخرين، اقرأ تدبراتهم، وشاركهم رحلتك في المخيم.",
      icon: Users,
      target: '[data-tour="friends-tab"]',
      position: "bottom",
    },
    {
      id: "help",
      title: "مركز المساعدة",
      description:
        "إذا احتجت مساعدة في أي وقت، انقر على زر المساعدة في أعلى الصفحة للوصول إلى الدليل الشامل.",
      icon: BookOpen,
      target: '[data-tour="help-button"]',
      position: "left",
    },
    {
      id: "complete",
      title: "أنت جاهز! 🎊",
      description:
        "الآن أنت تعرف كيفية استخدام جميع أقسام المخيم. ابدأ رحلتك واستمتع بالتعلم!",
      icon: Sparkles,
      target: null,
      position: "center",
    },
  ];

  useEffect(() => {
    if (currentStep < tourSteps.length) {
      const step = tourSteps[currentStep];
      if (step.target) {
        const element = document.querySelector(step.target);
        if (element) {
          setHighlightedElement(element);
          // Scroll to element
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          setHighlightedElement(null);
        }
      } else {
        setHighlightedElement(null);
      }
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
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

  const handleComplete = () => {
    localStorage.setItem("camp-tour-completed", "true");
    setHighlightedElement(null);
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("camp-tour-completed", "true");
    setHighlightedElement(null);
    if (onSkip) onSkip();
  };

  const currentStepData = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  if (!currentStepData) return null;

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {highlightedElement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 pointer-events-none"
          >
            <div className="absolute inset-0 bg-black/50" />
            <div
              className="absolute z-50 border-4 border-[#7440E9] rounded-xl shadow-2xl"
              style={{
                top: highlightedElement.getBoundingClientRect().top - 8,
                left: highlightedElement.getBoundingClientRect().left - 8,
                width: highlightedElement.getBoundingClientRect().width + 16,
                height: highlightedElement.getBoundingClientRect().height + 16,
                pointerEvents: "none",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tour Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-[calc(100%-2rem)] sm:w-full mx-4 sm:mx-4"
        style={{
          top: highlightedElement
            ? Math.min(
                highlightedElement.getBoundingClientRect().bottom + 12,
                window.innerHeight - 300
              )
            : "50%",
          left: highlightedElement
            ? Math.max(
                8,
                Math.min(
                  highlightedElement.getBoundingClientRect().left,
                  window.innerWidth - 320
                )
              )
            : "50%",
          transform: highlightedElement
            ? "none"
            : "translate(-50%, -50%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-[#7440E9] to-[#8b5cf6] rounded-lg flex-shrink-0">
              <currentStepData.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-200 truncate">
                {currentStepData.title}
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                {currentStep + 1} من {tourSteps.length}
              </p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="p-1.5 sm:p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            aria-label="تخطي"
          >
            <X className="w-4 h-4 sm:w-4 sm:h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            {currentStepData.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="px-3 sm:px-4 pb-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 sm:h-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${((currentStep + 1) / tourSteps.length) * 100}%`,
              }}
              className="bg-gradient-to-r from-[#7440E9] to-[#8b5cf6] h-1 sm:h-1.5 rounded-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 gap-2">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all flex-shrink-0 ${
              isFirstStep
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200"
            }`}
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">السابق</span>
          </button>
          <button
            onClick={isLastStep ? handleComplete : handleNext}
            className="px-4 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-[#7440E9] to-[#8b5cf6] text-white rounded-lg text-sm sm:text-base font-medium hover:shadow-lg transition-all flex items-center gap-1 sm:gap-2 active:scale-95 flex-1 sm:flex-initial justify-center"
          >
            {isLastStep ? "ابدأ الرحلة" : "التالي"}
            {!isLastStep && <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default CampTour;

