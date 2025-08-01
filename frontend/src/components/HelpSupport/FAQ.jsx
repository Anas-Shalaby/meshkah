import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Search,
  BookOpen,
  Bookmark,
  Share2,
  Globe,
  Smartphone,
  Wifi,
  WifiOff,
  Download,
  Upload,
  Settings,
  User,
  Shield,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { getTranslation } from "../../utils/translations";

const FAQ = ({ language }) => {
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  const toggleQuestion = (questionId) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const faqCategories = [
    {
      id: "general",
      title: getTranslation(language, "generalQuestions"),
      titleEn: "General Questions",
      icon: HelpCircle,
      questions: [
        {
          id: "what-is-library",
          question: getTranslation(language, "whatIsLibrary"),
          questionEn: "What is the Islamic Library?",
          answer: getTranslation(language, "libraryAnswer"),
          answerEn:
            "The Islamic Library is a comprehensive digital platform that provides access to authentic Islamic hadiths from major collections including Sahih Bukhari, Sahih Muslim, and many others. It offers search functionality, bookmarking, and multi-language support.",
        },
        {
          id: "how-to-access",
          question: getTranslation(language, "howToAccess"),
          questionEn: "How do I access the library?",
          answer: getTranslation(language, "accessAnswer"),
          answerEn:
            "You can access the library through any web browser on your computer, tablet, or smartphone. Simply navigate to the Islamic Library section from the main menu.",
        },
        {
          id: "is-free",
          question: getTranslation(language, "isLibraryFree"),
          questionEn: "Is the library free to use?",
          answer: getTranslation(language, "freeAnswer"),
          answerEn:
            "Yes, the Islamic Library is completely free to use. All features including search, bookmarking, and sharing are available at no cost.",
        },
      ],
    },
    {
      id: "search",
      title: getTranslation(language, "searchQuestions"),
      titleEn: "Search & Navigation",
      icon: Search,
      questions: [
        {
          id: "how-to-search",
          question: getTranslation(language, "howToSearchHadiths"),
          questionEn: "How do I search for hadiths?",
          answer: getTranslation(language, "searchAnswer"),
          answerEn:
            "Use the search bar at the top of the library page. You can search in Arabic, English, or Urdu. Type keywords related to the hadith content, narrator, or topic you're looking for.",
        },
        {
          id: "advanced-search",
          question: getTranslation(language, "advancedSearchFAQ"),
          questionEn: "How do I use advanced search filters?",
          answer: getTranslation(language, "advancedSearchAnswer"),
          answerEn:
            "Click the filter icon next to the search bar to access advanced options. You can filter by specific books, chapters, hadith grades (Sahih, Hasan, Daif), and more.",
        },
        {
          id: "search-languages",
          question: getTranslation(language, "searchLanguages"),
          questionEn: "Can I search in different languages?",
          answer: getTranslation(language, "searchLanguagesAnswer"),
          answerEn:
            "Yes, you can search in Arabic, English, and Urdu. The search results will show hadiths that match your query in the selected language.",
        },
      ],
    },
    {
      id: "bookmarks",
      title: getTranslation(language, "bookmarkQuestions"),
      titleEn: "Bookmarks & Collections",
      icon: Bookmark,
      questions: [
        {
          id: "how-to-bookmark",
          question: getTranslation(language, "howToBookmarkFAQ"),
          questionEn: "How do I bookmark a hadith?",
          answer: getTranslation(language, "bookmarkFAQAnswer"),
          answerEn:
            "Click the bookmark icon on any hadith. You can then choose an existing collection or create a new one to organize your saved hadiths.",
        },
        {
          id: "manage-collections",
          question: getTranslation(language, "manageCollections"),
          questionEn: "How do I manage my collections?",
          answer: getTranslation(language, "collectionsAnswer"),
          answerEn:
            "Go to the Bookmarks page to view and manage all your collections. You can create new collections, rename existing ones, and organize your saved hadiths.",
        },
        {
          id: "export-bookmarks",
          question: getTranslation(language, "exportBookmarks"),
          questionEn: "Can I export my bookmarks?",
          answer: getTranslation(language, "exportAnswer"),
          answerEn:
            "Currently, bookmarks are stored locally in your browser. You can access them from any device by logging into your account.",
        },
      ],
    },
    {
      id: "technical",
      title: getTranslation(language, "technicalQuestions"),
      titleEn: "Technical Support",
      icon: Settings,
      questions: [
        {
          id: "browser-support",
          question: getTranslation(language, "browserSupport"),
          questionEn: "Which browsers are supported?",
          answer: getTranslation(language, "browserAnswer"),
          answerEn:
            "The library works on all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using the latest version of your browser.",
        },
        {
          id: "mobile-support",
          question: getTranslation(language, "mobileSupport"),
          questionEn: "Does it work on mobile devices?",
          answer: getTranslation(language, "mobileAnswer"),
          answerEn:
            "Yes, the library is fully responsive and optimized for mobile devices. You can access all features on smartphones and tablets.",
        },
        {
          id: "offline-access",
          question: getTranslation(language, "offlineAccess"),
          questionEn: "Can I access the library offline?",
          answer: getTranslation(language, "offlineAnswer"),
          answerEn:
            "Currently, the library requires an internet connection to access hadiths. However, your bookmarks and settings are saved locally in your browser.",
        },
      ],
    },
    {
      id: "privacy",
      title: getTranslation(language, "privacyQuestions"),
      titleEn: "Privacy & Security",
      icon: Shield,
      questions: [
        {
          id: "data-privacy",
          question: getTranslation(language, "dataPrivacy"),
          questionEn: "How is my data protected?",
          answer: getTranslation(language, "privacyAnswer"),
          answerEn:
            "We take your privacy seriously. Your bookmarks and personal settings are stored locally in your browser. We don't collect or store personal information without your consent.",
        },
        {
          id: "account-security",
          question: getTranslation(language, "accountSecurity"),
          questionEn: "Is my account secure?",
          answer: getTranslation(language, "securityAnswer"),
          answerEn:
            "Yes, we use industry-standard security measures to protect your account. All data transmission is encrypted using HTTPS.",
        },
      ],
    },
  ];

  return (
    <div
      className="space-y-8"
      style={{ direction: `${language === "ar" ? "rtl" : "ltr"}` }}
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {getTranslation(language, "frequentlyAskedQuestions")}
        </h2>
        <p className="text-gray-600">
          {getTranslation(language, "faqDescription")}
        </p>
      </div>

      <div className="space-y-6">
        {faqCategories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
          >
            {/* Category Header */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <category.icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {language === "ar" ? category.title : category.titleEn}
                </h3>
              </div>
            </div>

            {/* Questions */}
            <div className="divide-y divide-gray-200">
              {category.questions.map((faq) => (
                <div key={faq.id} className="px-6">
                  <button
                    onClick={() => toggleQuestion(faq.id)}
                    className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="flex-1 "
                      style={{
                        textAlign: `${language === "ar" ? "right" : "left"}`,
                      }}
                    >
                      <h4 className="text-sm font-medium text-gray-900 leading-relaxed">
                        {language === "ar" ? faq.question : faq.questionEn}
                      </h4>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {expandedQuestions.has(faq.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedQuestions.has(faq.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pb-4"
                      >
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-700 leading-relaxed text-sm">
                            {language === "ar" ? faq.answer : faq.answerEn}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Contact Support Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {getTranslation(language, "stillNeedHelp")}
          </h3>
          <p className="text-gray-600 mb-4">
            {getTranslation(language, "contactSupportMessage")}
          </p>
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
            {getTranslation(language, "contactSupport")}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default FAQ;
