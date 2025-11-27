import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  MapPin,
  BookOpen,
  MessageSquare,
  FileText,
  Users,
  X,
  ChevronUp,
} from "lucide-react";

const QuickAccessMenu = ({
  camp,
  currentDay,
  onNavigate,
  tabs,
  activeTab,
  setActiveTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle if not typing in an input/textarea
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      const key = e.key;
      const keyLower = key.toLowerCase();
      const keyCode = e.keyCode || e.which;

      // T key (English) or ت (Arabic) for Today/Current Day
      if (
        keyLower === "w" ||
        key === "ص" ||
        keyCode === 84 // T
      ) {
        e.preventDefault();
        if (currentDay && onNavigate) {
          onNavigate("day", currentDay);
          setIsOpen(false);
        }
        return;
      }

      // G key (English) or ق (Arabic) for Study Hall
      if (
        keyLower === "s" ||
        key === "س" ||
        keyCode === 71 // G
      ) {
        e.preventDefault();
        const studyTab = tabs?.find((t) => t.id === "study");
        if (studyTab) {
          setActiveTab("study");
          setIsOpen(false);
        }
        return;
      }

      // J key (English) or ج (Arabic) for Journal
      if (
        keyLower === "a" ||
        key === "ش" ||
        keyCode === 74 // J
      ) {
        e.preventDefault();
        const journalTab = tabs?.find((t) => t.id === "my_journal");
        if (journalTab) {
          setActiveTab("my_journal");
          setIsOpen(false);
        }
        return;
      }

      // M key (English) or م (Arabic) for Journey/Map
      if (
        keyLower === "d" ||
        key === "ي" ||
        keyCode === 77 // M
      ) {
        e.preventDefault();
        const journeyTab = tabs?.find((t) => t.id === "journey");
        if (journeyTab) {
          setActiveTab("journey");
          setIsOpen(false);
        }
        return;
      }

      // Escape to close menu
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tabs, setActiveTab, isOpen, currentDay, onNavigate]);

  const quickActions = [
    {
      id: "today",
      label: "اليوم الحالي",
      icon: MapPin,
      action: () => {
        if (currentDay && onNavigate) {
          onNavigate("day", currentDay);
        }
        setIsOpen(false);
      },
      shortcut: "W",
      arabicShortcut: "ت",
    },
    {
      id: "study",
      label: "قاعة التدارس",
      icon: Users,
      action: () => {
        const studyTab = tabs?.find((t) => t.id === "study");
        if (studyTab) {
          setActiveTab("study");
        }
        setIsOpen(false);
      },
      shortcut: "S",
      arabicShortcut: "ق",
    },
    {
      id: "journal",
      label: "سجلي",
      icon: FileText,
      action: () => {
        const journalTab = tabs?.find((t) => t.id === "my_journal");
        if (journalTab) {
          setActiveTab("my_journal");
        }
        setIsOpen(false);
      },
      shortcut: "A",
      arabicShortcut: "ج",
    },
    {
      id: "journey",
      label: "خريطة الرحلة",
      icon: MapPin,
      action: () => {
        const journeyTab = tabs?.find((t) => t.id === "journey");
        if (journeyTab) {
          setActiveTab("journey");
        }
        setIsOpen(false);
      },
      shortcut: "D",
      arabicShortcut: "م",
    },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-[#7440E9] to-[#5a2fc7] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300"
        aria-label="وصول سريع"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <Zap className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Quick Access Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 z-30"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-24 right-6 z-40 bg-white rounded-2xl shadow-2xl p-4 min-w-[200px] border border-gray-200"
              dir="rtl"
            >
              <div className="space-y-2">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={action.action}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg hover:bg-purple-50 transition-colors text-right"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="font-medium text-gray-800">
                          {action.label}
                        </span>
                      </div>
                      {action.shortcut && (
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-mono">
                            {action.shortcut}
                          </kbd>
                          {action.arabicShortcut && (
                            <kbd className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-mono">
                              {action.arabicShortcut}
                            </kbd>
                          )}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-full mt-3 pt-3 border-t border-gray-200 text-sm text-gray-500 hover:text-gray-700 text-center"
              >
                إغلاق (ESC)
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickAccessMenu;
