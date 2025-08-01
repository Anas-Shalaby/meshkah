import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown } from "lucide-react";
import PropTypes from "prop-types";

const LanguageSelector = ({ onLanguageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("ar");

  const languages = [
    { code: "ar", name: "العربية", flag: "🇸🇦" },
    { code: "en", name: "English", flag: "🇺🇸" },
  ];

  useEffect(() => {
    // استرجاع اللغة المحفوظة من localStorage
    const savedLanguage = localStorage.getItem("islamicLibraryLanguage");
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
      onLanguageChange(savedLanguage);
    }
  }, [onLanguageChange]);

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
    localStorage.setItem("islamicLibraryLanguage", languageCode);
    onLanguageChange(languageCode);
    setIsOpen(false);
  };

  const currentLanguage = languages.find(
    (lang) => lang.code === selectedLanguage
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 sm:space-x-2 space-x-reverse px-2 sm:px-3 py-2 bg-white/80 backdrop-blur-md rounded-lg border border-purple-200/80 hover:border-purple-300/80 transition-colors"
      >
        <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
        <span className="text-xs sm:text-sm font-cairo">
          {currentLanguage?.flag}
        </span>
        <span className="text-xs sm:text-sm font-cairo text-gray-700 hidden sm:inline">
          {currentLanguage?.name}
        </span>
        <ChevronDown
          className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`absolute top-full ${
              selectedLanguage === "ar" ? "left-[-100px]" : "left-0"
            } sm:left-0 mt-2 w-40 sm:w-48 bg-white/95 backdrop-blur-md rounded-xl border border-purple-200/80 shadow-lg z-50`}
          >
            <div className="py-2">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`w-full flex items-center space-x-2 sm:space-x-3 space-x-reverse px-3 sm:px-4 py-2 sm:py-3 text-right hover:bg-purple-50 transition-colors ${
                    selectedLanguage === language.code
                      ? "bg-purple-100 text-purple-800"
                      : "text-gray-700"
                  }`}
                >
                  <span className="text-base sm:text-lg">{language.flag}</span>
                  <span className="font-cairo text-xs sm:text-sm">
                    {language.name}
                  </span>
                  {selectedLanguage === language.code && (
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-600 rounded-full ml-auto"></div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

LanguageSelector.propTypes = {
  onLanguageChange: PropTypes.func.isRequired,
};

export default LanguageSelector;
