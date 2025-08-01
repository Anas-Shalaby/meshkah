import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import "react-toastify/dist/ReactToastify.css";
import SEO from "../components/SEO";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import {
  ClipboardDocumentIcon,
  ShareIcon,
  BookOpenIcon,
  LightBulbIcon,
  StarIcon,
  XMarkIcon,
  ChevronDownIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
} from "@heroicons/react/24/outline";
import { useBookmarks } from "../context/BookmarkContext";
import {
  BookA,
  Bookmark,
  ChevronRight,
  MessageCircle,
  Copy,
  X,
  FacebookIcon,
  Calendar,
} from "lucide-react";
import { TranslationOutlined } from "@ant-design/icons";
import { useHadithCategories } from "../hooks/useHadithCategories";
import { Dialog } from "@headlessui/react";
import BookmarkModal from "../components/BookmarkModal";
import SunnahPlannerModal from "../components/SunnahPlannerModal";
import Joyride, { STATUS } from "react-joyride";

const ShareModal = ({ isOpen, onClose, hadithDetails }) => {
  const url = window.location.href;
  const text = `اطلع على هذا الحديث: ${
    hadithDetails.title || hadithDetails.hadeeth.substring(0, 50)
  }...`;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success("تم نسخ الرابط!");
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
      <Dialog.Panel className="relative z-10 w-full max-w-md bg-white  rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-200/50 ">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 ">
          <h3 className="font-bold text-lg text-gray-900 ">مشاركة الحديث</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500  hover:bg-black/10  transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-2 space-x-reverse bg-gray-100  rounded-xl p-3">
            <input
              type="text"
              readOnly
              value={url}
              className="flex-grow bg-transparent text-sm text-gray-600  outline-none"
            />
            <button
              onClick={copyLink}
              className="px-3 py-1 text-sm rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200  transition-colors"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {shareOptions.map((option) => (
              <a
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center hover:bg-gray-100 justify-center gap-2 p-4 rounded-xl  transition-colors"
              >
                {option.icon}
                <span className="text-sm text-indigo-600">{option.name}</span>
              </a>
            ))}
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

ShareModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  hadithDetails: PropTypes.object,
};

const AIAssistant = ({ hadith, isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `مرحباً بك! أنا سراج مساعدك الذكي لفهم الأحاديث النبوية. \nكيف يمكنني مساعدتك في فهم هذا الحديث؟`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [feedback, setFeedback] = useState({});

  const handleFeedback = (index, feedbackType) => {
    setFeedback((prev) => ({ ...prev, [index]: feedbackType }));
    toast.success("شكراً على تقييمك!");
  };

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    toast.success("تم نسخ النص!");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const isAuthenticated = localStorage.getItem("token");
  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (!isAuthenticated) {
      setError("يرجى تسجيل الدخول للاستمرار");
      toast.error("يرجى تسجيل الدخول للاستمرار");
      return;
    }
    setIsLoading(true);
    setError(null);
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
          hadith: hadith,
        },
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: backendResponse.data.response },
      ]);
    } catch (err) {
      setError(err.response?.data?.error || "حدث خطأ أثناء معالجة طلبك");
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
      <div
        className="fixed inset-0 bg-black/10 backdrop-blur-sm"
        aria-hidden="true"
      />
      <Dialog.Panel
        as={motion.div}
        className="relative z-10 w-full max-w-xl h-full sm:h-[85vh] bg-white/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-100"
      >
        <div className="flex items-center justify-between p-3 bg-purple-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold">سراج - مساعد الحديث</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-gray-200"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {messages.map((msg, index) => (
            <div key={index} className="space-y-2">
              <div
                className={`flex items-end gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {/* {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="w-5 h-5 text-purple-600" />
                  </div>
                )} */}
                <div
                  className={`max-w-xl p-3 px-4 rounded-2xl shadow-sm border ${
                    msg.role === "user"
                      ? "bg-indigo-100 text-indigo-900 border-indigo-100"
                      : "bg-gray-50 text-gray-900 border-gray-100"
                  }`}
                >
                  {msg.content.split("\n").map((line, i) => (
                    <p
                      key={i}
                      className="leading-relaxed text-sm font-semibold"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              {msg.role === "assistant" && !isLoading && (
                <div className="flex items-center gap-2 pl-11">
                  <button
                    onClick={() => handleCopy(msg.content)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="نسخ"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFeedback(index, "liked")}
                    className={`p-1 ${
                      feedback[index] === "liked"
                        ? "text-purple-500"
                        : "text-gray-400"
                    } hover:text-purple-500`}
                    title="أعجبني"
                  >
                    <HandThumbUpIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFeedback(index, "disliked")}
                    className={`p-1 ${
                      feedback[index] === "disliked"
                        ? "text-red-500"
                        : "text-gray-400"
                    } hover:text-red-500`}
                    title="لم يعجبني"
                  >
                    <HandThumbDownIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div className="max-w-lg p-3 px-4 rounded-2xl bg-white shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0s" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {error && (
          <div className="p-2 text-center text-red-500 text-sm">{error}</div>
        )}
        <div className="p-4 bg-gray-100 border-t border-gray-200">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اطرح سؤالك..."
              className="w-full px-4 py-2 rounded-full bg-white text-black border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="p-3 rounded-full bg-purple-600 text-white disabled:opacity-50 transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
              disabled={isLoading}
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
          <p className="text-xs text-center text-gray-500 mt-2">
            قد يقدم سراج معلومات غير دقيقة. تحقق من المصادر المهمة.
          </p>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

AIAssistant.propTypes = {
  hadith: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

const HadithPage = () => {
  const { bookmarks, addBookmark, removeBookmark } = useBookmarks();
  const { hadithId } = useParams();
  const [hadithDetails, setHadithDetails] = useState(null);
  const [language] = useState("ar");
  const [similarHadiths, setSimilarHadiths] = useState([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const { categories } = useHadithCategories();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisShort, setAnalysisShort] = useState("");
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [remainingQuestions, setRemainingQuestions] = useState(null);
  const analysisCache = useRef({});
  const navigate = useNavigate();
  const location = useLocation();
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSunnahModalOpen, setIsSunnahModalOpen] = useState(false);
  const [runTour, setRunTour] = useState(
    !localStorage.getItem("hadithpage_tour")
  );
  // eslint-disable-next-line no-unused-vars
  const [sirajData, setSirajData] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [aiExample, setAiExample] = useState("");
  const steps = [
    {
      target: ".bookmark-btn",
      content: "يمكنك حفظ الحديث في مفضلتك من هنا.",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: ".share-btn",
      content: "شارك الحديث مع أصدقائك بسهولة!",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: ".ai-insights-btn",
      content: "جرب التحليل الذكي للحديث واحصل على شرح مبسط وفوائد عملية.",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: ".achievements-link",
      content: "تابع إنجازاتك وشاراتك من هنا!",
      placement: "bottom",
      disableBeacon: true,
    },
  ];

  const handleAuthRedirect = () => {
    toast.error("يرجى تسجيل الدخول أولاً لاستخدام هذه الميزة");
    localStorage.setItem("redirectPath", location.pathname);
    navigate("/login");
  };

  const isBookmarked = bookmarks.some(
    (bookmark) => String(bookmark.hadith_id) === String(hadithDetails?.id)
  );

  const handleBookmarkToggle = () => {
    if (!isAuthenticated) {
      toast.error("يرجى تسجيل الدخول لحفظ الأحاديث");
      return;
    }
    if (isBookmarked) {
      removeBookmark(hadithDetails.id);
    } else {
      setIsBookmarkModalOpen(true);
    }
  };

  const fetchSimilarHadiths = async () => {
    if (!hadithDetails?.categories?.length) return;
    setIsLoadingSimilar(true);
    try {
      const categoryId = hadithDetails.categories[0];
      const response = await axios.get(
        `https://hadeethenc.com/api/v1/hadeeths/list/?language=ar&category_id=${categoryId}&page=1&per_page=6`
      );
      setSimilarHadiths(
        response.data.data.filter(
          (h) => String(h.id) !== String(hadithDetails.id)
        )
      );
    } catch (error) {
      console.error("Error fetching similar hadiths:", error);
    } finally {
      setIsLoadingSimilar(false);
    }
  };

  const getCategoryNames = () => {
    if (!hadithDetails || !hadithDetails.categories || !categories) return [];
    return hadithDetails.categories.map((catId) => {
      const category = categories.find((c) => String(c.id) === String(catId));
      return category ? category.title : "غير معروف";
    });
  };

  const fetchHadithDetails = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `https://hadeethenc.com/api/v1/hadeeths/one/?language=${language}&id=${hadithId}`
      );
      setHadithDetails(response.data);
    } catch (error) {
      console.error("Error fetching hadith details:", error);
      toast.error("حدث خطأ أثناء جلب تفاصيل الحديث");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHadithDetails();
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, [hadithId]);

  useEffect(() => {
    if (hadithDetails) {
      fetchSimilarHadiths();
    }
  }, [hadithDetails]);

  useEffect(() => {
    if (isAuthenticated) {
      // fetchCollections(); // Removed as per edit hint
    }
  }, [isAuthenticated]);

  const fetchRemainingQuestions = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ai/remaining-questions`,
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );

      // إذا كان المستخدم رقم 5، عيّن عدد غير محدود
      if (response.data.unlimited) {
        setRemainingQuestions(-1);
      } else {
        setRemainingQuestions(response.data.remaining);
      }
    } catch (error) {
      console.error("Error fetching remaining questions:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRemainingQuestions();
    }
  }, [isAuthenticated]);

  const copyToClipboard = () => {
    const textToCopy = `${hadithDetails.hadeeth}\n\nالمصدر: ${hadithDetails.attribution}\nالدرجة: ${hadithDetails.grade}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success("تم نسخ الحديث بنجاح!");
  };

  const returnToPre = () => navigate(-1);

  const fetchShortAnalysis = async () => {
    if (!isAuthenticated) {
      toast.error("يرجى تسجيل الدخول لاستخدام هذه الميزة");
      setIsAnalysisModalOpen(false);
      return;
    }
    const cacheKey = `analysis_${hadithId}`;
    if (analysisCache.current[cacheKey]) {
      setAnalysisShort(analysisCache.current[cacheKey]);
      return;
    }
    setIsAnalysisLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/ai/analyze-hadith`,
        { hadith: hadithDetails },
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );
      const formattedResponse = formatResponse(response.data.analysis);
      analysisCache.current[cacheKey] = formattedResponse;
      setAnalysisShort(formattedResponse);
    } catch (error) {
      console.error("Error fetching short analysis:", error);
      setAnalysisShort("عذراً، حدث خطأ أثناء محاولة تحليل الحديث.");
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

  // eslint-disable-next-line no-unused-vars
  const handleAIInsightsClick = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setIsAIChatOpen(true);
  };

  const CollapsibleSection = ({
    title,
    children,
    icon: Icon,
    defaultOpen = false,
  }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
      <motion.div className="w-full">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-center px-6 py-4 rounded-xl bg-[#f3edff]/80 text-right cursor-pointer transition-all duration-300 shadow-inner hover:bg-[#e9e4f5]/80"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-[#7440E9]" />
            <span className="font-bold text-[#7440E9] text-base">{title}</span>
          </div>
          <ChevronDownIcon
            className={`w-5 h-5 text-[#7440E9] transition-transform duration-300 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={{
                open: { opacity: 1, height: "auto", marginTop: "1rem" },
                collapsed: { opacity: 0, height: 0, marginTop: "0rem" },
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="p-5 bg-white/80 rounded-xl border border-[#e3d8fa] shadow-sm text-gray-800  text-base leading-relaxed text-right">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  CollapsibleSection.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    icon: PropTypes.elementType.isRequired,
    defaultOpen: PropTypes.bool,
  };

  const SimilarHadithCard = ({ hadith }) => (
    <Link to={`/hadiths/hadith/${hadith.id}`} className="block h-full">
      <motion.div
        whileHover={{
          y: -5,
          boxShadow: "0px 10px 20px rgba(116, 64, 233, 0.1)",
        }}
        className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-purple-100/80 h-full flex flex-col text-right"
      >
        <p className="text-gray-600 text-md leading-relaxed line-clamp-4 flex-grow">
          {hadith.title}
        </p>
      </motion.div>
    </Link>
  );

  SimilarHadithCard.propTypes = {
    hadith: PropTypes.shape({
      id: PropTypes.string.isRequired,
      hadeeth: PropTypes.string,
      title: PropTypes.string,
    }).isRequired,
  };

  // توليد حكمة مختصرة
  function generateWisdom(hints, explanation) {
    if (hints && hints.length > 0) {
      const w = hints[0].split(" ").slice(0, 7).join(" ");
      if (w.length >= 4 && w.length <= 30) return w;
    }
    if (explanation) {
      const w = explanation.split(" ").slice(0, 7).join(" ");
      if (w.length >= 4 && w.length <= 30) return w;
    }
    return "جوهر الحديث في العمل";
  }

  // توليد بيانات سراج الحديث
  useEffect(() => {
    if (!hadithDetails) return;
    const mindMapBranches = [
      {
        text: "الكلمات المفتاحية",
        children:
          hadithDetails.words_meanings?.map((w) => ({
            word: w.word,
            meaning: w.meaning,
          })) || [],
      },
      {
        text: "الفوائد",
        children: hadithDetails.hints || [],
      },
    ];
    // أضف فرع الأمثلة التطبيقية إذا كان aiExample موجودًا
    if (aiExample) {
      mindMapBranches.push({
        text: "أمثلة تطبيقية",
        children: [aiExample],
      });
    }
    const mindMap = {
      node: hadithDetails.hadeeth,
      branches: mindMapBranches,
    };
    setSirajData((prev) => ({
      ...prev,
      hadeeth: hadithDetails.hadeeth,
      attribution: `${hadithDetails.hadeeth_intro || ""} ${
        hadithDetails.attribution || ""
      } ${hadithDetails.reference || ""}`.trim(),
      grade: hadithDetails.grade || "",
      explanation: hadithDetails.explanation || "",
      mind_map: mindMap,
      task: aiExample || prev?.task || "",
      wisdom: generateWisdom(hadithDetails.hints, hadithDetails.explanation),
    }));
  }, [hadithDetails, aiExample]);

  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleQuickAnalysisClick = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setIsAnalysisModalOpen(true);
    fetchShortAnalysis();
  };

  if (isLoading || !hadithDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] flex justify-center items-center">
        <div className="w-16 h-16 border-4 border-t-4 border-t-purple-500 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Joyride
        steps={steps}
        run={runTour}
        continuous
        showSkipButton
        locale={{
          back: "السابق",
          close: "إغلاق",
          last: "إنهاء",
          next: "التالي",
          skip: "تخطي",
        }}
        styles={{ options: { zIndex: 99999 } }}
        callback={(data) => {
          if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) {
            setRunTour(false);
            localStorage.setItem("hadithpage_tour", "1");
          }
        }}
      />
      <div className="min-h-screen relative bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5]  sm:px-6 md:py-8 lg:px-8 overflow-x-hidden animate-fadeIn">
        <SEO
          title={`شرح حديث ${hadithDetails.title.substring(0, 50)}...`}
          description={hadithDetails.explanation}
          keywords={`${hadithDetails.grade}, ${getCategoryNames().join(", ")}`}
        />

        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center gap-2">
          {isAuthenticated && remainingQuestions !== null && (
            <motion.div className="px-4 py-2 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-purple-100/80 text-sm text-purple-800 text-center">
              <p className="font-bold">أنا سراج، مساعدك الذكي</p>
              <p className="text-xs">
                {remainingQuestions === -1
                  ? "عدد غير محدود من الأسئلة لأنك مستخدم مميز 😉❤️"
                  : `لديك ${remainingQuestions} محاولات متبقية اليوم `}
              </p>
            </motion.div>
          )}
          <motion.button
            onClick={() => {
              if (!isAuthenticated) {
                handleAuthRedirect();
                return;
              }
              setIsAIChatOpen(true);
            }}
            // whileHover={{ scale: 1.05, y: -5 }}
            // whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full px-6 py-3 shadow-2xl shadow-purple-500/50"
            title="الدردشة مع مساعد الذكاء الاصطناعي"
          >
            <SparklesIcon className="w-6 h-6" />
            <span className="text-lg font-bold">إسأل سراج</span>
          </motion.button>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div className="w-full bg-white/60 backdrop-blur-xl border-2 border-[#e3d8fa] rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col text-center transition-all duration-300 overflow-hidden">
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between w-full mb-6 gap-4">
              <div className="flex justify-between w-[100%] md:w-auto items-center gap-4">
                <motion.button
                  onClick={returnToPre}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full shadow-xl bg-white/70 hover:bg-white transition"
                >
                  <ChevronRight className="w-6 h-6 text-[#7440E9]" />
                </motion.button>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  title="تحليل سريع"
                  onClick={handleQuickAnalysisClick}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg"
                >
                  <SparklesIcon className="w-5 h-5" />
                  <span>تحليل سريع</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={copyToClipboard}
                  className="p-3 rounded-full bg-white/70"
                  title="نسخ"
                >
                  <ClipboardDocumentIcon className="w-5 h-5 text-gray-600" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setIsShareModalOpen(true)}
                  className="p-3 rounded-full bg-white/70 share-btn"
                  title="مشاركة"
                >
                  <ShareIcon className="w-5 h-5 text-gray-600" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={handleBookmarkToggle}
                  className={`p-3 rounded-full transition-colors ${
                    isBookmarked ? "bg-yellow-400 text-white" : "bg-white/70"
                  } bookmark-btn`}
                  title="حفظ"
                >
                  <Bookmark
                    className={`w-5 h-5 ${
                      isBookmarked ? "fill-current" : "text-gray-600"
                    }`}
                  />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => {
                    if (!isAuthenticated) {
                      handleAuthRedirect();
                      return;
                    }
                    setIsSunnahModalOpen(true);
                  }}
                  className="p-3 rounded-full bg-white/70 text-[#7440E9] hover:bg-[#f3f0fa] shadow transition"
                  title="أضف السنّة إلى مخططك"
                >
                  <Calendar className="w-6 h-6" />
                </motion.button>
              </div>
            </div>

            {/* Hadith Text */}
            <div className="w-full bg-white/50 rounded-2xl p-6 mb-8 shadow-inner border border-purple-100">
              <p
                style={{ lineHeight: "45px" }}
                className="prose max-w-none text-xl  md:text-2xl text-gray-800 leading-loose animate-fadeIn  amiri-regular text-right"
              >
                {hadithDetails?.hadeeth}
              </p>
              {hadithDetails?.attribution && (
                <p className="text-right text-sm text-gray-500 mt-4 font-sans">
                  المحدث - {hadithDetails.attribution}
                </p>
              )}
              {hadithDetails?.grade && (
                <div className="text-right mt-4">
                  <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 font-semibold border border-green-200">
                    حكم الحديث : {hadithDetails.grade}
                  </span>
                </div>
              )}
            </div>

            {/* Collapsible sections container */}
            <div className="w-full space-y-4">
              {hadithDetails.explanation && (
                <CollapsibleSection
                  title="شرح الحديث"
                  icon={LightBulbIcon}
                  defaultOpen={false}
                >
                  {hadithDetails.explanation}
                </CollapsibleSection>
              )}
              {hadithDetails.hints && hadithDetails.hints.length > 0 && (
                <CollapsibleSection title="نقاط مهمة وفوائد" icon={StarIcon}>
                  <ul>
                    {hadithDetails.hints.map((h, i) => (
                      <li className="mb-2" key={i}>
                        {h}
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}
              {hadithDetails.words_meanings &&
                hadithDetails.words_meanings.length > 0 && (
                  <CollapsibleSection
                    title="معاني الكلمات"
                    icon={TranslationOutlined}
                  >
                    {hadithDetails.words_meanings.map(({ word, meaning }) => (
                      <p key={word}>
                        <strong className="text-purple-700">{word}:</strong>{" "}
                        {meaning}
                      </p>
                    ))}
                  </CollapsibleSection>
                )}
              {getCategoryNames().length > 0 && (
                <CollapsibleSection title="التصنيفات" icon={BookOpenIcon}>
                  <div className="flex flex-wrap gap-2 p-2 justify-center">
                    {getCategoryNames().map((categoryName, index) => (
                      <Link
                        key={index}
                        to={`/hadiths/${hadithDetails.categories[index]}/page/1`}
                        className="px-3 py-1 text-sm rounded-full bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition"
                      >
                        {categoryName}
                      </Link>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </div>
          </motion.div>

          {/* Similar Hadiths Section */}
          {similarHadiths.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-12 w-full max-w-4xl mb-12 "
            >
              <h2 className="text-2xl font-bold mb-6 text-[#7440E9] flex items-center gap-3 justify-center">
                <BookA className="w-7 h-7" />
                أحاديث مشابهة
              </h2>
              {isLoadingSimilar ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {similarHadiths.map((hadith) => (
                    <SimilarHadithCard key={hadith.id} hadith={hadith} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {isAnalysisModalOpen && (
            <Dialog
              open={isAnalysisModalOpen}
              onClose={() => setIsAnalysisModalOpen(false)}
              className="fixed inset-0 z-[9999] font-cairo flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/10 backdrop-blur-sm"
                aria-hidden="true"
              />
              <Dialog.Panel
                as={motion.div}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="relative z-10 w-full max-w-2xl bg-white/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-200/50"
              >
                <div className="flex items-center justify-between p-4 border-b border-purple-200/30">
                  <h3 className="font-bold text-lg text-purple-800 flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-purple-500" />
                    <span>تحليل سريع للحديث</span>
                  </h3>
                  <button
                    onClick={() => setIsAnalysisModalOpen(false)}
                    className="p-2 rounded-full text-gray-500 hover:bg-black/10 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 text-right text-sm md:text-base  leading-loose text-gray-700 max-h-[60vh] overflow-y-auto">
                  {isAnalysisLoading ? (
                    <div className="flex justify-center items-center h-24">
                      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    analysisShort
                  )}
                </div>
              </Dialog.Panel>
            </Dialog>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAIChatOpen && (
            <AIAssistant
              hadith={hadithDetails}
              isOpen={isAIChatOpen}
              onClose={() => setIsAIChatOpen(false)}
            />
          )}
        </AnimatePresence>
        <BookmarkModal
          isOpen={isBookmarkModalOpen}
          onClose={() => setIsBookmarkModalOpen(false)}
          existingCollections={[...new Set(bookmarks.map((b) => b.collection))]}
          onSubmit={({ collection, notes }) => {
            addBookmark(hadithDetails.id, collection, notes);
            setIsBookmarkModalOpen(false);
          }}
        />
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          hadithDetails={hadithDetails}
        />
        <SunnahPlannerModal
          isOpen={isSunnahModalOpen}
          onClose={() => setIsSunnahModalOpen(false)}
          hadith={hadithDetails}
          className="sunnah-planner-modal"
        />
      </div>
      {showLoginModal && (
        <Dialog
          open={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          className="fixed inset-0 z-[4000000] font-cairo flex items-center justify-center p-4"
        >
          <Dialog.Panel
            as={motion.div}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              maxWidth: 400,
              width: "100%",
              padding: 24,
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 4px 32px #e3d8fa",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg text-purple-800 mb-4">
              تسجيل الدخول مطلوب
            </h3>
            <p className="text-gray-700 mb-6 text-center">
              يجب تسجيل الدخول لاستخدام ميزة التحليل السريع للأحاديث.
            </p>
            <button
              onClick={() => {
                setShowLoginModal(false);
                localStorage.setItem("redirectPath", location.pathname);
                navigate("/login");
              }}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold shadow hover:from-purple-600 hover:to-indigo-600 transition"
            >
              تسجيل الدخول
            </button>
          </Dialog.Panel>
        </Dialog>
      )}
    </>
  );
};

export default HadithPage;
