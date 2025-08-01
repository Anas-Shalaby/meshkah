import { useState } from "react";
import { motion } from "framer-motion";
import {
  HelpCircle,
  BookOpen,
  Search,
  Bookmark,
  Share2,
  ChevronLeft,
  MessageCircle,
  Globe,
  ChevronRight,
} from "lucide-react";
import { getTranslation } from "../../utils/translations";
import FAQ from "./FAQ";
import UserGuide from "./UserGuide";
import { useNavigate } from "react-router-dom";
import ContactSupport from "./ContactSupport";

const HelpCenter = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("guide");
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("islamicLibraryLanguage") || "ar";
  });

  const tabs = [
    {
      id: "guide",
      name: getTranslation(language, "userGuide"),
      nameEn: "User Guide",
      icon: BookOpen,
    },
    {
      id: "faq",
      name: getTranslation(language, "frequentlyAskedQuestions"),
      nameEn: "FAQ",
      icon: HelpCircle,
    },
    {
      id: "contact",
      name: getTranslation(language, "contactSupport"),
      nameEn: "Contact Support",
      icon: MessageCircle,
    },
  ];

  const quickActions = [
    {
      title: getTranslation(language, "howToSearch"),
      titleEn: "How to Search",
      description: getTranslation(language, "searchGuideDescription"),
      descriptionEn: "Learn how to effectively search for hadiths",
      icon: Search,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: getTranslation(language, "howToBookmark"),
      titleEn: "How to Bookmark",
      description: getTranslation(language, "bookmarkGuideDescription"),
      descriptionEn: "Save your favorite hadiths for later",
      icon: Bookmark,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: getTranslation(language, "howToShare"),
      titleEn: "How to Share",
      description: getTranslation(language, "shareGuideDescription"),
      descriptionEn: "Share hadiths with friends and family",
      icon: Share2,
      color: "from-green-500 to-green-600",
    },
    {
      title: getTranslation(language, "languageSettings"),
      titleEn: "Language Settings",
      description: getTranslation(language, "languageGuideDescription"),
      descriptionEn: "Change the interface language",
      icon: Globe,
      color: "from-orange-500 to-orange-600",
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "guide":
        return <UserGuide language={language} />;
      case "faq":
        return <FAQ language={language} />;
      case "contact":
        return <ContactSupport language={language} />;
      default:
        return <UserGuide language={language} />;
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50"
      style={{ direction: language === "ar" ? "rtl" : "ltr" }}
    >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-purple-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className=" items-center justify-between">
            <div className="flex items-center justify-between space-x-4 space-x-reverse w-100">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-center">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {getTranslation(language, "helpAndSupport")}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {getTranslation(language, "helpDescription")}
                  </p>
                </div>
              </div>
              <div className="">
                <button
                  onClick={() => navigate(-1)}
                  className="bg-purple-500 w-100 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-all duration-300"
                >
                  {language === "ar" ? (
                    <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  ) : (
                    <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
            {getTranslation(language, "quickActions")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50"
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-4`}
                >
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {language === "ar" ? action.title : action.titleEn}
                </h3>
                <p className="text-gray-600 text-sm">
                  {language === "ar"
                    ? action.description
                    : action.descriptionEn}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden"
        >
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                    activeTab === tab.id
                      ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2 space-x-reverse">
                    <tab.icon className="w-5 h-5" />
                    <span>{language === "ar" ? tab.name : tab.nameEn}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">{renderTabContent()}</div>
        </motion.div>
      </div>
    </div>
  );
};

export default HelpCenter;
