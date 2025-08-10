import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import "react-toastify/dist/ReactToastify.css";
import SEO from "../components/SEO";
import { motion } from "framer-motion";
import {
  ShareIcon,
  LightBulbIcon,
  XMarkIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

import {
  MessageCircle,
  Copy,
  X,
  FacebookIcon,
  ChevronLeft,
  Brain,
  BookOpen,
  Bookmark,
  ChevronRight,
} from "lucide-react";
import { Dialog } from "@headlessui/react";

import { getTranslation, getBookTranslation } from "../utils/translations";
import PropTypes from "prop-types";
import BookmarkModal from "../components/BookmarkModal";

const ShareModal = ({ isOpen, onClose, hadithDetails, language }) => {
  const url = window.location.href;
  const text = `اطلع على هذا الحديث: ${
    hadithDetails.hadithArabic?.substring(0, 50) ||
    hadithDetails.hadithEnglish?.substring(0, 50)
  }...`;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success(getTranslation(language, "linkCopied"));
    onClose();
  };

  const shareOptions = [
    {
      name: "تويتر",
      icon: <X className="w-6 h-6 text-black" />,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(text)}`,
    },
    {
      name: "فيسبوك",
      icon: <FacebookIcon className="w-6 h-6 text-blue-600" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`,
    },
    {
      name: "واتساب",
      icon: <MessageCircle className="w-6 h-6 text-green-500" />,
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        text + " " + url
      )}`,
    },
  ];

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-[9999] font-cairo flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <Dialog.Panel className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-200/50">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg text-gray-900">
            {getTranslation(language, "shareHadith")}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-black/10 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {shareOptions.map((option) => (
              <a
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 space-x-reverse p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {option.icon}
                <span className="font-medium">{option.name}</span>
              </a>
            ))}
          </div>
          <button
            onClick={copyLink}
            className="w-full flex items-center justify-center space-x-2 space-x-reverse p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Copy className="w-5 h-5" />
            <span>{getTranslation(language, "copyLink")}</span>
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

const AIAssistant = ({ hadith, isOpen, onClose, language, hadithNumber }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: getTranslation(language, "aiWelcome"),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const isAuthenticated = localStorage.getItem("token");
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (isOpen && hadith) {
      setMessages([
        {
          role: "assistant",
          content: getTranslation(language, "aiWelcome"),
        },
      ]);
    }
  }, [isOpen, hadith, language]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (!isAuthenticated) {
      toast.error(getTranslation(language, "loginRequired"));
      return;
    }
    setIsLoading(true);
    const userMessage = input.trim();
    setInput("");
    const currentMessages = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(currentMessages);
    try {
      const backendResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/ai/chat`,
        {
          messages: currentMessages,
          hadith: {
            hadeeth: hadith.hadithArabic || hadith.hadithEnglish,
            number: hadith.hadithNumber,
            source: hadith.book?.bookName,
            grade_ar: hadith.status,
          },
        },
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: backendResponse.data.response },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(getTranslation(language, "aiError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-[9999] font-cairo flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <Dialog.Panel className="relative z-10 w-full max-w-2xl h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-200/50">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Brain className="w-6 h-6 text-purple-600" />
            <h3 className="font-bold text-lg text-gray-900">
              {getTranslation(language, "aiAssistant")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-black/10 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                {message.timestamp && (
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 max-w-[80%] p-3 rounded-lg">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <span className="text-sm">
                    {getTranslation(language, "aiTyping")}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-gray-200"
        >
          <div className="flex space-x-2 space-x-reverse">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getTranslation(language, "askQuestion")}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </Dialog.Panel>
    </Dialog>
  );
};

const IslamicHadithPage = () => {
  const { hadithId: hadithNumber, bookSlug, chapterNumber } = useParams();
  const [hadithDetails, setHadithDetails] = useState(null);
  const [language] = useState(() => {
    return localStorage.getItem("islamicLibraryLanguage") || "ar";
  });

  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisShort, setAnalysisShort] = useState("");
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [hadithNavigation, setHadithNavigation] = useState(null);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const navigate = useNavigate();
  const analysisCache = useRef({});
  const isAuthenticated = localStorage.getItem("token");

  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    fetchHadithDetails();
  }, [hadithNumber]);

  useEffect(() => {
    if (isAnalysisModalOpen && !isAnalysisLoading) {
      fetchShortAnalysis();
    }
  }, [isAnalysisModalOpen, hadithNumber]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (
        e.key === "ArrowLeft" &&
        hadithNavigation?.prevHadith &&
        !navigationLoading
      ) {
        navigateToHadith(hadithNavigation.prevHadith.id, "prev");
      } else if (
        e.key === "ArrowRight" &&
        hadithNavigation?.nextHadith &&
        !navigationLoading
      ) {
        navigateToHadith(hadithNavigation.nextHadith.id, "next");
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [hadithNavigation, navigationLoading]);

  const fetchHadithDetails = async () => {
    try {
      setIsLoading(true);

      // Check if it's a local book (from URL path)
      const isLocalBook = window.location.pathname.includes("/local-books/");

      let response;
      let hadithData;
      if (isLocalBook) {
        // For local books, use the local hadith endpoint
        response = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/islamic-library/local-books/${bookSlug}/hadiths/${hadithNumber}`
        );

        hadithData = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/islamic-library/local-books/${bookSlug}/hadiths/${hadithNumber}/navigation`
        );
      } else {
        // For external books, use the regular endpoint
        response = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/islamic-library/book/${bookSlug}/chapter/${chapterNumber}/hadith/${hadithNumber}`
        );
        hadithData = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/islamic-library/books/${bookSlug}/chapter/${chapterNumber}/hadith/${hadithNumber}/navigation`
        );
      }

      if (response.data?.hadiths?.data || response.data.hadith) {
        setHadithDetails(
          response.data?.hadiths?.data
            ? response.data.hadiths.data[0]
            : response.data.hadith
        );
        setHadithNavigation(hadithData?.data);
      } else {
        toast.error(getTranslation(language, "hadithNotFound"));
      }
    } catch (error) {
      console.error("Error fetching hadith details:", error);
      if (error.response?.status === 404) {
        toast.error(getTranslation(language, "hadithNotFound"));
      } else {
        toast.error(getTranslation(language, "errorLoadingHadith"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShortAnalysis = async () => {
    if (!isAuthenticated) {
      toast.error(getTranslation(language, "loginRequired"));
      return;
    }
    const cacheKey = `analysis_${hadithNumber}`;
    if (analysisCache.current[cacheKey]) {
      setAnalysisShort(analysisCache.current[cacheKey]);
      return;
    }
    setIsAnalysisLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/ai/analyze-hadith`,
        {
          hadith: {
            hadeeth: hadithDetails.hadithArabic || hadithDetails.hadithEnglish,
            number: hadithDetails.hadithNumber,
            reference: hadithDetails.book?.bookName,
            grade: hadithDetails.status,
            attribution: hadithDetails.englishNarrator,
          },
        },
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );
      const formattedResponse = formatResponse(response.data.analysis);
      analysisCache.current[cacheKey] = formattedResponse;
      setAnalysisShort(formattedResponse);
    } catch (error) {
      console.error("Error fetching short analysis:", error);
      setAnalysisShort(getTranslation(language, "analysisError"));
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const formatResponse = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, index) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <strong key={index} className="font-bold text-purple-700 block my-2">
            {line.replaceAll("**", "")}
          </strong>
        );
      }
      return (
        <p key={index} className="mb-2 text-gray-800">
          {line}
        </p>
      );
    });
  };

  const copyToClipboard = () => {
    let text = "";
    if (language === "ar" && hadithDetails.hadithArabic) {
      text = hadithDetails.hadithArabic;
    } else if (language === "en" && hadithDetails.hadithEnglish) {
      text = hadithDetails.hadithEnglish;
    } else {
      text = hadithDetails.hadithArabic || hadithDetails.hadithEnglish || "";
    }
    navigator.clipboard.writeText(text);
    toast.success(getTranslation(language, "copied"));
  };

  // Bookmark modal functions
  const openBookmarkModal = async () => {
    // Fetch collections from API
    try {
      const res = await import("../services/islamicBookmarksService");
      const data = await res.getUserCollections();
      setCollections(data.collections?.map((c) => c.collection) || []);
    } catch {
      setCollections([]);
    }
    setIsBookmarkModalOpen(true);
  };

  const closeBookmarkModal = () => {
    setIsBookmarkModalOpen(false);
  };

  // Enhanced navigation function
  const navigateToHadith = async (hadithId, direction) => {
    if (navigationLoading) return;

    setNavigationLoading(true);
    try {
      const isLocalBook = window.location.pathname.includes("/local-books/");
      const baseUrl = `/islamic-library/${
        hadithDetails.book.isLocal ? "local-books" : "book"
      }/${hadithDetails.book.bookSlug}`;
      const url = isLocalBook
        ? `${baseUrl}/hadith/${hadithId}`
        : `${baseUrl}/chapter/${hadithDetails.chapter.chapterNumber}/hadith/${hadithId}`;

      navigate(url);
    } catch (error) {
      console.error("Navigation error:", error);
      toast.error(getTranslation(language, "navigationError"));
    } finally {
      setNavigationLoading(false);
    }
  };

  const handleBookmarkModalSubmit = async ({ collection, notes }) => {
    try {
      const res = await import("../services/islamicBookmarksService");
      const bookmarkData = res.createHadithBookmarkData(
        hadithDetails.book,
        hadithDetails,
        language
      );
      bookmarkData.collection = collection;
      bookmarkData.notes = notes;
      await res.addIslamicBookmark(bookmarkData);
      toast.success(getTranslation(language, "bookmarkAdded"));
    } catch (error) {
      console.error("Error adding bookmark:", error);
      toast.error(getTranslation(language, "bookmarkError"));
    } finally {
      closeBookmarkModal();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 sm:py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-purple-600 mx-auto"></div>
              <div className="absolute inset-0 rounded-full border-2 border-purple-200"></div>
            </div>
            <p className="mt-6 text-gray-600 text-sm sm:text-base">
              {getTranslation(language, "loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hadithDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 sm:py-20">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-cairo font-semibold text-gray-600 mb-4">
              {getTranslation(language, "hadithNotFound")}
            </h3>
            <p className="text-gray-500 text-sm sm:text-base mb-6">
              {getTranslation(language, "tryDifferentHadith")}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm sm:text-base"
            >
              {getTranslation(language, "back")}
            </button>
          </div>
        </div>
      </div>
    );
  }
  // SEO Metadata
  const seoData = {
    title:
      language === "ar"
        ? `حديث ${hadithDetails?.hadithNumber || hadithDetails?.id} - ${
            getBookTranslation(language, hadithDetails?.book?.bookName) ||
            hadithDetails?.book?.bookName ||
            ""
          } | مشكاة`
        : `Hadith ${hadithDetails?.hadithNumber || hadithDetails?.id} - ${
            hadithDetails?.book?.bookNameEn ||
            getBookTranslation(language, hadithDetails?.book?.bookName) ||
            hadithDetails?.book?.bookName ||
            ""
          } | Meshkah`,
    description:
      language === "ar"
        ? `${
            hadithDetails?.hadithArabic?.substring(0, 160) ||
            hadithDetails?.arabic?.substring(0, 160) ||
            `حديث ${hadithDetails?.hadithNumber || hadithDetails?.id} من كتاب ${
              getBookTranslation(language, hadithDetails?.book?.bookName) ||
              hadithDetails?.book?.bookName
            }`
          }`
        : `${
            hadithDetails?.hadithEnglish?.substring(0, 160) ||
            hadithDetails?.english?.text?.substring(0, 160) ||
            `Hadith ${hadithDetails?.hadithNumber || hadithDetails?.id} from ${
              hadithDetails?.book?.bookNameEn ||
              getBookTranslation(language, hadithDetails?.book?.bookName) ||
              hadithDetails?.book?.bookName
            }`
          }`,
    keywords:
      language === "ar"
        ? `حديث ${hadithDetails?.hadithNumber || hadithDetails?.id}, ${
            getBookTranslation(language, hadithDetails?.book?.bookName) ||
            hadithDetails?.book?.bookName
          }, ${
            getBookTranslation(language, hadithDetails?.book?.writerName) ||
            hadithDetails?.book?.writerName
          }, حديث نبوي, مشكاة, مكتبة إسلامية, علوم إسلامية`
        : `Hadith ${hadithDetails?.hadithNumber || hadithDetails?.id}, ${
            hadithDetails?.book?.bookNameEn ||
            getBookTranslation(language, hadithDetails?.book?.bookName) ||
            hadithDetails?.book?.bookName
          }, ${
            hadithDetails?.book?.writerNameEn ||
            getBookTranslation(language, hadithDetails?.book?.writerName) ||
            hadithDetails?.book?.writerName
          }, Hadith, Meshkah, Islamic library, Islamic sciences`,
    canonicalUrl: `${window.location.origin}${window.location.pathname}${
      window.location.search ? "" : ""
    }`,
    ogImage: "https://hadith-shareef.com/logo.svg",
    alternateLanguages: [
      {
        hrefLang: "ar",
        href: `${window.location.origin}${window.location.pathname}?lang=ar`,
      },
      {
        hrefLang: "en",
        href: `${window.location.origin}${window.location.pathname}?lang=en`,
      },
      {
        hrefLang: "x-default",
        href: `${window.location.origin}${window.location.pathname}`,
      },
    ],
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name:
        language === "ar"
          ? `حديث ${hadithDetails?.hadithNumber || hadithDetails?.id}`
          : `Hadith ${hadithDetails?.hadithNumber || hadithDetails?.id}`,
      description:
        language === "ar"
          ? hadithDetails?.hadithArabic?.substring(0, 200) ||
            hadithDetails?.arabic?.substring(0, 200)
          : hadithDetails?.hadithEnglish?.substring(0, 200) ||
            hadithDetails?.english?.text?.substring(0, 200),
      text:
        language === "ar"
          ? hadithDetails?.hadithArabic || hadithDetails?.arabic
          : hadithDetails?.hadithEnglish || hadithDetails?.english?.text,
      isPartOf: {
        "@type": "Book",
        name:
          language === "ar"
            ? getBookTranslation(language, hadithDetails?.book?.bookName) ||
              hadithDetails?.book?.bookName
            : hadithDetails?.book?.bookNameEn ||
              getBookTranslation(language, hadithDetails?.book?.bookName) ||
              hadithDetails?.book?.bookName,
        author: {
          "@type": "Person",
          name:
            language === "ar"
              ? getBookTranslation(language, hadithDetails?.book?.writerName) ||
                hadithDetails?.book?.writerName
              : hadithDetails?.book?.writerNameEn ||
                getBookTranslation(language, hadithDetails?.book?.writerName) ||
                hadithDetails?.book?.writerName,
        },
      },
      position: parseInt(hadithDetails?.hadithNumber || hadithDetails?.id),
      publisher: {
        "@type": "Organization",
        name: "Meshkah",
      },
    },
  };

  return (
    <>
      <SEO {...seoData} />

      <div className="min-h-screen relative bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white/90 backdrop-blur-xl border-2 border-purple-200/50 rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 flex flex-col transition-all duration-300 overflow-hidden hover:shadow-3xl"
          >
            {/* Enhanced Card Header */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6 sm:mb-8">
              {/* Back Button and Hadith Info */}
              <div className="flex items-center justify-between sm:justify-start space-x-3 sm:space-x-4 space-x-reverse">
                <motion.button
                  onClick={() => navigate(-1)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 sm:p-3 rounded-full shadow-lg bg-white/80 hover:bg-white transition-all duration-300 border border-purple-200/50"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </motion.button>

                <div className="flex items-center space-x-3 sm:space-x-4 space-x-reverse">
                  <div className="relative">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                      <span className="font-cairo font-bold text-white text-lg sm:text-xl">
                        {hadithDetails.hadithNumber || hadithDetails.id}
                      </span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                      <span className="text-xs font-bold text-white">★</span>
                    </div>
                  </div>
                  <div className="text-right sm:text-left">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-cairo font-bold text-gray-900 mb-1">
                      {getTranslation(language, "hadith")} #
                      {hadithDetails.hadithNumber}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">
                      {getBookTranslation(
                        language,
                        hadithDetails.book?.bookName
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-end space-x-2 sm:space-x-3 space-x-reverse">
                <motion.button
                  onClick={copyToClipboard}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 sm:p-3 rounded-xl shadow-lg bg-white/80 hover:bg-white transition-all duration-300 border border-purple-200/50"
                  title={getTranslation(language, "copyHadith")}
                >
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </motion.button>
                <motion.button
                  onClick={() => setIsAnalysisModalOpen(true)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 sm:p-3 rounded-xl shadow-lg bg-white/80 hover:bg-white transition-all duration-300 border border-purple-200/50"
                  title={getTranslation(language, "analyzeHadith")}
                >
                  <LightBulbIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </motion.button>
                <motion.button
                  onClick={() => setIsShareModalOpen(true)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 sm:p-3 rounded-xl shadow-lg bg-white/80 hover:bg-white transition-all duration-300 border border-purple-200/50"
                  title={getTranslation(language, "share")}
                >
                  <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </motion.button>
                <motion.button
                  onClick={openBookmarkModal}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 sm:p-3 rounded-xl shadow-lg bg-white/80 hover:bg-white transition-all duration-300 border border-purple-200/50"
                  title={getTranslation(language, "bookmark")}
                >
                  <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </motion.button>
              </div>
            </div>

            {/* Enhanced Hadith Text */}
            <div className="mb-6 sm:mb-8">
              <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-purple-200/50 shadow-lg">
                <div className="flex items-center space-x-3 space-x-reverse mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-cairo font-bold text-gray-900">
                    {getTranslation(language, "hadithText")}
                  </h3>
                </div>
                <div className="relative">
                  {language === "ar" ? (
                    <p
                      className="text-lg sm:text-xl lg:text-2xl leading-relaxed text-gray-800 amiri-regular text-center sm:text-right"
                      style={{ lineHeight: "3rem" }}
                    >
                      {hadithDetails.hadithArabic}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {language === "en" && hadithDetails.hadithEnglish ? (
                        <p className="text-lg sm:text-xl lg:text-2xl leading-relaxed text-gray-800 text-center sm:text-left">
                          {hadithDetails.hadithEnglish}
                        </p>
                      ) : language === "ur" && hadithDetails.hadithUrdu ? (
                        <p className="text-lg sm:text-xl lg:text-2xl leading-relaxed text-gray-800 text-center sm:text-right">
                          {hadithDetails.hadithUrdu}
                        </p>
                      ) : (
                        <>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                                <span className="text-yellow-600 text-xs">
                                  !
                                </span>
                              </div>
                              <p className="text-sm font-medium text-yellow-800">
                                {getTranslation(
                                  language,
                                  "englishTranslationNotAvailable"
                                )}
                              </p>
                            </div>
                          </div>
                          <p
                            className="text-lg sm:text-xl lg:text-2xl leading-relaxed text-gray-800 amiri-regular text-center sm:text-right"
                            style={{ lineHeight: "3rem" }}
                          >
                            {hadithDetails.hadithArabic}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                  {/* Decorative elements */}
                  <div className="absolute top-0 left-0 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full opacity-20"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20"></div>
                </div>
              </div>
            </div>

            {/* Enhanced Metadata */}
            <div className="space-y-4 sm:space-y-6">
              {/* Status and Book Info */}
              <div className="flex flex-wrap items-center gap-6 sm:gap-3">
                {hadithDetails.status && (
                  <span
                    className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold shadow-md ${
                      hadithDetails.status === "Sahih"
                        ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300"
                        : hadithDetails.status === "Hasan"
                        ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300"
                        : "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300"
                    }`}
                  >
                    {getTranslation(
                      language,
                      hadithDetails.status.toLowerCase()
                    )}
                  </span>
                )}
                {hadithDetails.book && (
                  <Link
                    to={`/islamic-library/${
                      hadithDetails.book.isLocal ? "local-books" : "book"
                    }/${hadithDetails.book.bookSlug}`}
                  >
                    <span className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 shadow-md">
                      {language === "ar"
                        ? getBookTranslation(
                            language,
                            hadithDetails.book.bookName
                          )
                        : hadithDetails.book.bookNameEn
                        ? hadithDetails.book.bookNameEn
                        : getBookTranslation(
                            language,
                            hadithDetails.book.bookName
                          )}
                    </span>
                  </Link>
                )}
                {hadithDetails.chapter && (
                  <Link
                    to={`/islamic-library/${
                      hadithDetails.book.isLocal ? "local-books" : "book"
                    }/${hadithDetails.book.bookSlug}/chapter/${
                      hadithDetails.chapter.chapterNumber == 0
                        ? 1
                        : hadithDetails.chapter.chapterNumber
                    }`}
                  >
                    <span className="px-3 sm:px-4 mt-2 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300 shadow-md">
                      {language === "ar"
                        ? hadithDetails.chapter.chapterArabic.substring(
                            0,
                            30
                          ) || hadithDetails.chapter.arabic.substring(0, 30)
                        : language === "en"
                        ? hadithDetails.chapter.chapterEnglish.substring(
                            0,
                            30
                          ) || hadithDetails.chapter.english.substring(0, 30)
                        : hadithDetails.chapter.chapterUrdu.substring(0, 30)}
                      ...
                    </span>
                  </Link>
                )}
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {hadithDetails.volume && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-purple-200/50">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-purple-800">
                          📚
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {getTranslation(language, "volume")}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-purple-800">
                      {hadithDetails.volume}
                    </p>
                  </div>
                )}

                {hadithDetails.narrator && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-purple-200/50">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-800">
                          👤
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {getTranslation(language, "narrator")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {hadithDetails.narrator}
                    </p>
                  </div>
                )}

                {hadithDetails.grade && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-purple-200/50">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-green-800">
                          ⭐
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {getTranslation(language, "grade")}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-green-800">
                      {hadithDetails.grade}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center mt-5 justify-center space-x-4 sm:space-x-6 lg:space-x-8 space-x-reverse">
              {hadithNavigation && (
                <>
                  <motion.button
                    onClick={() =>
                      hadithNavigation.prevHadith &&
                      navigateToHadith(hadithNavigation.prevHadith.id, "prev")
                    }
                    disabled={!hadithNavigation.prevHadith || navigationLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      group relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600
                      hover:from-purple-600 hover:to-purple-700
                      transition-all duration-300 ease-out transform hover:scale-110 hover:rotate-3
                      disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0
                      flex items-center justify-center shadow-lg hover:shadow-2xl
                      ${
                        !hadithNavigation.prevHadith || navigationLoading
                          ? "opacity-40 cursor-not-allowed"
                          : ""
                      }
                    `}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {navigationLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white relative z-10 transform group-hover:translate-x-1 transition-transform duration-300" />
                    )}
                  </motion.button>

                  <div className="flex flex-col items-center bg-white/90 backdrop-blur-xl px-3 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-3 rounded-xl sm:rounded-2xl shadow-md border border-purple-200/50 transform hover:scale-105 transition-all duration-300">
                    <div className="text-xs text-gray-500 mb-1 font-medium">
                      حديث
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-gray-800">
                      {hadithNavigation.currentHadithNumber} من{" "}
                      {hadithNavigation.totalHadiths}
                    </div>
                    {navigationLoading && (
                      <div className="mt-1">
                        <div className="animate-pulse text-xs text-purple-600">
                          جاري التحميل...
                        </div>
                      </div>
                    )}
                    <div className="mt-1 text-xs text-gray-400 hidden sm:block">
                      استخدم الأسهم للتنقل
                    </div>
                  </div>

                  <motion.button
                    onClick={() =>
                      hadithNavigation.nextHadith &&
                      navigateToHadith(hadithNavigation.nextHadith.id, "next")
                    }
                    disabled={!hadithNavigation.nextHadith || navigationLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      group relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600
                      hover:from-blue-600 hover:to-blue-700
                      transition-all duration-300 ease-out transform hover:scale-110 hover:-rotate-3
                      disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0
                      flex items-center justify-center shadow-lg hover:shadow-2xl
                      ${
                        !hadithNavigation.nextHadith || navigationLoading
                          ? "opacity-40 cursor-not-allowed"
                          : ""
                      }
                    `}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {navigationLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white relative z-10 transform group-hover:-translate-x-1 transition-transform duration-300" />
                    )}
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Modals */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        hadithDetails={hadithDetails}
        language={language}
      />

      {isAnalysisModalOpen && (
        <div className="fixed inset-0 z-[9999] font-cairo flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setIsAnalysisModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-200/50">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2 space-x-reverse">
                <LightBulbIcon className="w-6 h-6 text-purple-600" />
                <h3 className="font-bold text-lg text-gray-900">
                  {getTranslation(language, "analyzeHadith")}
                </h3>
              </div>
              <button
                onClick={() => setIsAnalysisModalOpen(false)}
                className="p-2 rounded-full text-gray-500 hover:bg-black/10 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200/50 text-gray-700 text-sm sm:text-base">
                {getTranslation(language, "analyzeHadithNotice")}
              </div>
              {isAnalysisLoading ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                  <span className="text-gray-600">
                    {getTranslation(language, "analyzing")}
                  </span>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200/50">
                  {analysisShort}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BookmarkModal
        isOpen={isBookmarkModalOpen}
        onClose={closeBookmarkModal}
        onSubmit={handleBookmarkModalSubmit}
        existingCollections={collections}
        language={language}
        itemType="hadith"
        itemTitle={
          language === "ar"
            ? hadithDetails?.hadithArabic
            : hadithDetails?.hadithEnglish
        }
      />
    </>
  );
};

// PropTypes
ShareModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  hadithDetails: PropTypes.object.isRequired,
  language: PropTypes.string.isRequired,
};

AIAssistant.propTypes = {
  hadith: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired,
  hadithNumber: PropTypes.string.isRequired,
};

export default IslamicHadithPage;
