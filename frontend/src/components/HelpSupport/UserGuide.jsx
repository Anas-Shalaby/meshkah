import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  Bookmark,
  Share2,
  Globe,
  Filter,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";
import { getTranslation } from "../../utils/translations";

const UserGuide = ({ language }) => {
  const [expandedSections, setExpandedSections] = useState(new Set());

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const guideSections = [
    {
      id: "getting-started",
      title: getTranslation(language, "gettingStarted"),
      titleEn: "Getting Started",
      icon: BookOpen,
      content: [
        {
          subtitle: getTranslation(language, "welcomeToLibrary"),
          subtitleEn: "Welcome to the Islamic Library",
          steps: [
            {
              step: 1,
              text: getTranslation(language, "step1Description"),
              textEn: "Navigate to the Islamic Library from the main menu",
            },
            {
              step: 2,
              text: getTranslation(language, "step2Description"),
              textEn:
                "Choose your preferred language (Arabic, English, or Urdu)",
            },
            {
              step: 3,
              text: getTranslation(language, "step3Description"),
              textEn: "Browse through different book categories",
            },
          ],
        },
      ],
    },
    {
      id: "searching",
      title: getTranslation(language, "searchingHadiths"),
      titleEn: "Searching Hadiths",
      icon: Search,
      content: [
        {
          subtitle: getTranslation(language, "basicSearch"),
          subtitleEn: "Basic Search",
          steps: [
            {
              step: 1,
              text: getTranslation(language, "searchStep1"),
              textEn: "Use the search bar at the top of the library page",
            },
            {
              step: 2,
              text: getTranslation(language, "searchStep2"),
              textEn: "Type keywords in Arabic, English, or Urdu",
            },
            {
              step: 3,
              text: getTranslation(language, "searchStep3"),
              textEn: "Press Enter or click the search button",
            },
          ],
        },
        {
          subtitle: getTranslation(language, "advancedSearch"),
          subtitleEn: "Advanced Search",
          steps: [
            {
              step: 1,
              text: getTranslation(language, "advancedSearchStep1"),
              textEn: "Click on the filter icon to open advanced options",
            },
            {
              step: 2,
              text: getTranslation(language, "advancedSearchStep2"),
              textEn: "Select specific books, chapters, or hadith grades",
            },
            {
              step: 3,
              text: getTranslation(language, "advancedSearchStep3"),
              textEn: "Combine multiple filters for precise results",
            },
          ],
        },
      ],
    },
    {
      id: "bookmarking",
      title: getTranslation(language, "bookmarkingHadiths"),
      titleEn: "Bookmarking Hadiths",
      icon: Bookmark,
      content: [
        {
          subtitle: getTranslation(language, "savingFavorites"),
          subtitleEn: "Saving Favorites",
          steps: [
            {
              step: 1,
              text: getTranslation(language, "bookmarkStep1"),
              textEn: "Click the bookmark icon on any hadith",
            },
            {
              step: 2,
              text: getTranslation(language, "bookmarkStep2"),
              textEn: "Choose a collection or create a new one",
            },
            {
              step: 3,
              text: getTranslation(language, "bookmarkStep3"),
              textEn: "Access your bookmarks from the bookmarks page",
            },
          ],
        },
      ],
    },
    {
      id: "sharing",
      title: getTranslation(language, "sharingHadiths"),
      titleEn: "Sharing Hadiths",
      icon: Share2,
      content: [
        {
          subtitle: getTranslation(language, "shareOptions"),
          subtitleEn: "Share Options",
          steps: [
            {
              step: 1,
              text: getTranslation(language, "shareStep1"),
              textEn: "Click the share button on any hadith",
            },
            {
              step: 2,
              text: getTranslation(language, "shareStep2"),
              textEn: "Choose your preferred sharing method",
            },
            {
              step: 3,
              text: getTranslation(language, "shareStep3"),
              textEn: "Share via social media, email, or copy link",
            },
          ],
        },
      ],
    },
    {
      id: "language-settings",
      title: getTranslation(language, "languageSettings"),
      titleEn: "Language Settings",
      icon: Globe,
      content: [
        {
          subtitle: getTranslation(language, "changingLanguage"),
          subtitleEn: "Changing Language",
          steps: [
            {
              step: 1,
              text: getTranslation(language, "languageStep1"),
              textEn: "Click the language selector in the top right",
            },
            {
              step: 2,
              text: getTranslation(language, "languageStep2"),
              textEn: "Choose between Arabic, English, or Urdu",
            },
            {
              step: 3,
              text: getTranslation(language, "languageStep3"),
              textEn: "The interface will update immediately",
            },
          ],
        },
      ],
    },
    {
      id: "mobile-usage",
      title: getTranslation(language, "mobileUsage"),
      titleEn: "Mobile Usage",
      icon: Smartphone,
      content: [
        {
          subtitle: getTranslation(language, "mobileFeatures"),
          subtitleEn: "Mobile Features",
          steps: [
            {
              step: 1,
              text: getTranslation(language, "mobileStep1"),
              textEn:
                "The library is fully responsive and works on all devices",
            },
            {
              step: 2,
              text: getTranslation(language, "mobileStep2"),
              textEn: "Use touch gestures for navigation and zooming",
            },
            {
              step: 3,
              text: getTranslation(language, "mobileStep3"),
              textEn: "Enable offline reading for downloaded content",
            },
          ],
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {getTranslation(language, "completeUserGuide")}
        </h2>
        <p className="text-gray-600">
          {getTranslation(language, "guideDescription")}
        </p>
      </div>

      <div className="space-y-4">
        {guideSections.map((section) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {language === "ar" ? section.title : section.titleEn}
                </h3>
              </div>
              {expandedSections.has(section.id) ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {expandedSections.has(section.id) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-6 pb-6"
              >
                <div className="space-y-6">
                  {section.content.map((content, index) => (
                    <div key={index} className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-800">
                        {language === "ar"
                          ? content.subtitle
                          : content.subtitleEn}
                      </h4>
                      <div className="space-y-3">
                        {content.steps.map((step) => (
                          <div
                            key={step.step}
                            className="flex items-start space-x-3 space-x-reverse"
                          >
                            <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                              {step.step}
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                              {language === "ar" ? step.text : step.textEn}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200"
      >
        <div className="flex items-center space-x-3 space-x-reverse mb-4">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <span className="text-yellow-600 text-sm font-bold">💡</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {getTranslation(language, "proTips")}
          </h3>
        </div>
        <div className="space-y-2 text-gray-700">
          <p>• {getTranslation(language, "tip1")}</p>
          <p>• {getTranslation(language, "tip2")}</p>
          <p>• {getTranslation(language, "tip3")}</p>
          <p>• {getTranslation(language, "tip4")}</p>
        </div>
      </motion.div>
    </div>
  );
};

export default UserGuide;
