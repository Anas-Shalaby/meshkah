import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import "react-toastify/dist/ReactToastify.css";
import SEO from "../components/SEO";
import {
  motion,
  AnimatePresence,
  LazyMotion,
  domAnimation,
} from "framer-motion";
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
  Heart,
  Shield,
  Award,
  Zap,
  ArrowLeft,
  Eye,
  Clock,
  Users,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import {
  FacebookFilled,
  FacebookOutlined,
  TranslationOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import { useHadithCategories } from "../hooks/useHadithCategories";
import { Dialog } from "@headlessui/react";
import BookmarkModal from "../components/BookmarkModal";
import SunnahPlannerModal from "../components/SunnahPlannerModal";
import Joyride, { STATUS } from "react-joyride";
import { useAuth } from "../context/AuthContext";
import { useHadithTracking } from "../hooks/useHadithTracking";

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
      icon: (
        <svg
          className="w-8 h-8 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 640"
        >
          <path d="M453.2 112L523.8 112L369.6 288.2L551 528L409 528L297.7 382.6L170.5 528L99.8 528L264.7 339.5L90.8 112L236.4 112L336.9 244.9L453.2 112zM428.4 485.8L467.5 485.8L215.1 152L173.1 152L428.4 485.8z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(text)}`,
    },
    {
      name: "فيسبوك",
      icon: <FacebookFilled className="w-8 h-8 text-2xl text-blue-600" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`,
    },
    {
      name: "واتساب",
      icon: <WhatsAppOutlined className="w-8 h-8 text-2xl text-green-500" />,
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        text + " " + url
      )}`,
    },
    {
      name: "شارك على قبيلة",
      url: `https://qabilah.com/sharer?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(url)}`,
      dataSize: "medium",
      dataVariant: "button",
      dataLang: "ar",
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
          <div className="grid grid-cols-4 items-center gap-4">
            {shareOptions.map((option) =>
              option.name === "شارك على قبيلة" ? (
                <div key={option.name} className="flex flex-col items-center">
                  <a
                    className="flex hover:bg-[#F3E2DE]  border-[#F3E2DE] flex-col items-center px-4 text-[18px] p-4 rounded-lg  font-medium gap-3  transition-colors"
                    target="_blank"
                    href={option.url}
                    data-size={option.dataSize}
                    data-variant={option.dataVariant}
                    data-lang={option.dataLang}
                    title={option.name}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 1080 1080"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M872.55 1080H207.44C92.87 1080 -0.0100098 987.12 -0.0100098 872.55V207.45C-0.0100098 92.88 92.87 0 207.44 0H872.55C987.12 0 1080 92.88 1080 207.45V872.56C1079.99 987.12 987.12 1080 872.55 1080Z"
                        fill="url(#paint0_linear_212_3)"
                      ></path>
                      <path
                        d="M554.67 965.75C511.13 970.65 477.08 956.76 453.34 938.82C429.61 920.86 417.74 895.76 417.74 863.51C417.74 847.08 420.16 831.25 425.04 816.04L488.16 575.43C450.42 615 405.69 634.77 353.97 634.77C326.58 634.77 301.48 628.24 278.66 615.14C255.84 602.06 237.88 582.59 224.8 556.72C211.71 530.86 205.17 499.98 205.17 464.06C205.17 434.25 208.82 405.64 216.12 378.25C228.9 327.74 248.83 285.29 275.91 250.9C302.98 216.52 334.33 190.96 369.94 174.22C405.54 157.49 442.51 149.12 480.85 149.12C516.75 149.12 547.03 154.3 571.68 164.64C596.33 175 618.38 190.81 637.86 212.11L683.84 174.18C696.32 163.89 711.99 158.25 728.17 158.25H823.65C833.82 158.25 841.17 167.99 838.37 177.77L662.38 792.31C657.5 809.95 655.08 822.12 655.08 828.82C655.08 836.72 657.05 842.2 661.01 845.25C664.96 848.29 671.51 849.81 680.64 849.81C684.59 849.81 688.96 849.54 693.75 849.01C701.55 848.14 709.26 846.65 716.88 844.74L749.5 836.72C756.58 834.98 762.22 842.67 758.44 848.9C758.44 848.9 676.85 952.01 554.67 965.75Z"
                        fill="white"
                      ></path>
                      <defs>
                        <linearGradient
                          id="paint0_linear_212_3"
                          x1="129.461"
                          y1="922.231"
                          x2="958.044"
                          y2="150.773"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stop-color="#FF544F"></stop>
                          <stop offset="0.5532" stop-color="#FF923F"></stop>
                          <stop offset="1" stop-color="#FFBF33"></stop>
                        </linearGradient>
                      </defs>
                    </svg>
                    قبيلة
                  </a>
                  {/* Fallback button in case Qabilah script doesn't work */}
                  <a
                    href={option.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center  hover:bg-gray-100 justify-center gap-2 p-4 rounded-xl transition-colors text-sm text-indigo-600"
                    style={{ display: "none" }}
                    id="qabilah-fallback"
                  >
                    <span>قبيلة</span>
                  </a>
                </div>
              ) : (
                <a
                  key={option.name}
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col text-[18px]  font-medium items-center hover:bg-gray-100 justify-center gap-2 p-4 rounded-xl transition-colors"
                >
                  {option.icon}
                  <span className="">{option.name}</span>
                </a>
              )
            )}
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
  const { hadithId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { addBookmark, removeBookmark, bookmarks } = useBookmarks();
  const { categories } = useHadithCategories();
  const { trackHadithView, trackHadithRead, startReading } =
    useHadithTracking();

  // Performance optimizations with useMemo and useCallback
  const [hadithDetails, setHadithDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [similarHadiths, setSimilarHadiths] = useState([]);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisShort, setAnalysisShort] = useState("");
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSunnahModalOpen, setIsSunnahModalOpen] = useState(false);
  const [remainingQuestions, setRemainingQuestions] = useState(null);
  const [runTour, setRunTour] = useState(false);
  const [aiExample, setAiExample] = useState("");
  const [sirajData, setSirajData] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Joyride tour steps
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

  // Memoized values for performance
  const isBookmarked = useMemo(() => {
    return bookmarks.some(
      (bookmark) => bookmark.hadithId === parseInt(hadithId)
    );
  }, [bookmarks, hadithId]);

  const bookmarkItem = useMemo(() => {
    return bookmarks.find(
      (bookmark) => bookmark.hadithId === parseInt(hadithId)
    );
  }, [bookmarks, hadithId]);

  // Optimized fetch functions with useCallback
  const fetchHadithDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${hadithId}`
      );
      setHadithDetails(response.data);

      // تتبع مشاهدة الحديث
      if (response.data && isAuthenticated) {
        await trackHadithView(hadithId);
        // بدء تتبع وقت القراءة
        startReading(hadithId);
      }

      // Preload similar hadiths after we have the hadith details
      if (response.data) {
        fetchSimilarHadiths(response.data);
      }
    } catch (error) {
      console.error("Error fetching hadith details:", error);
      toast.error("حدث خطأ في تحميل الحديث");
    } finally {
      setIsLoading(false);
    }
  }, [hadithId, isAuthenticated]);

  const fetchSimilarHadiths = useCallback(async (hadithData) => {
    if (!hadithData?.categories?.length) return;

    try {
      setIsLoadingSimilar(true);
      const categoryId = hadithData.categories[0];
      const response = await axios.get(
        `https://hadeethenc.com/api/v1/hadeeths/list/?language=ar&category_id=${categoryId}&page=1&per_page=6`
      );
      setSimilarHadiths(
        response.data.data.filter((h) => String(h.id) !== String(hadithData.id))
      );
    } catch (error) {
      console.error("Error fetching similar hadiths:", error);
    } finally {
      setIsLoadingSimilar(false);
    }
  }, []);

  const fetchRemainingQuestions = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ai/remaining-questions`,
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }
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
  }, [isAuthenticated]);

  const fetchShortAnalysis = useCallback(async () => {
    try {
      setIsAnalysisLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/ai/analyze-hadith`,
        { hadith: hadithDetails },
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }
      );
      setAnalysisShort(response.data.analysis);
    } catch (error) {
      console.error("Error fetching short analysis:", error);
      toast.error("حدث خطأ في تحليل الحديث");
    } finally {
      setIsAnalysisLoading(false);
    }
  }, [hadithDetails]);

  // Format response function
  const formatResponse = useCallback((text) => {
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
  }, []);

  // Helper function to get category names
  const getCategoryNames = useCallback(() => {
    if (!hadithDetails || !hadithDetails.categories || !categories) return [];
    return hadithDetails.categories.map((catId) => {
      const category = categories.find((c) => String(c.id) === String(catId));
      return category ? category.title : "غير معروف";
    });
  }, [hadithDetails, categories]);

  // Enhanced handlers with useCallback
  const handleAuthRedirect = useCallback(() => {
    localStorage.setItem("redirectPath", location.pathname);
    navigate("/login");
  }, [location.pathname, navigate]);

  const handleBookmarkToggle = useCallback(() => {
    if (!isAuthenticated) {
      handleAuthRedirect();
      return;
    }

    if (isBookmarked) {
      removeBookmark(parseInt(hadithId));
      toast.success("تم إزالة الحديث من المحفوظات");
    } else {
      setIsBookmarkModalOpen(true);
    }
  }, [
    isAuthenticated,
    isBookmarked,
    hadithId,
    removeBookmark,
    handleAuthRedirect,
  ]);

  const copyToClipboard = useCallback(() => {
    if (hadithDetails?.hadeeth) {
      navigator.clipboard.writeText(hadithDetails.hadeeth);
      toast.success("تم نسخ الحديث!");
    }
  }, [hadithDetails]);

  const returnToPre = useCallback(() => navigate(-1), [navigate]);

  const handleQuickAnalysisClick = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setIsAnalysisModalOpen(true);
    fetchShortAnalysis();
  }, [isAuthenticated, fetchShortAnalysis]);

  // CollapsibleSection component - Mobile Friendly
  const CollapsibleSection = useCallback(
    ({ title, children, icon: Icon, defaultOpen = false }) => {
      const [isOpen, setIsOpen] = useState(defaultOpen);
      return (
        <motion.div className="w-full">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 text-right cursor-pointer transition-all duration-300 shadow-inner hover:from-purple-100 hover:to-indigo-100"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <span className="font-bold text-purple-600 text-sm sm:text-base">
                {title}
              </span>
            </div>
            <ChevronDownIcon
              className={`w-4 h-4 sm:w-5 sm:h-5 text-purple-600 transition-transform duration-300 ${
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
                  open: { opacity: 1, height: "auto", marginTop: "0.75rem" },
                  collapsed: { opacity: 0, height: 0, marginTop: "0rem" },
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-4 sm:p-5 bg-white/80 rounded-lg sm:rounded-xl border border-purple-200/50 shadow-sm text-gray-800 text-sm sm:text-base leading-relaxed text-right">
                  {children}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    },
    []
  );

  // Enhanced SimilarHadithCard component - Mobile Friendly
  const EnhancedSimilarHadithCard = useCallback(
    ({ hadith }) => (
      <Link to={`/hadiths/hadith/${hadith.id}`} className="block h-full group">
        <motion.div
          whileHover={{
            y: -8,
            boxShadow: "0px 20px 40px rgba(116, 64, 233, 0.15)",
          }}
          className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-purple-200/50 h-full flex flex-col text-right shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full opacity-20 -translate-y-2 translate-x-2"></div>

          {/* Header with icon */}
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 relative z-10">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 text-xs sm:text-sm mb-1">
                حديث مشابه
              </h4>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full"></div>
                <span className="text-xs text-gray-500">ذات صلة</span>
              </div>
            </div>
          </div>

          {/* Hadith content */}
          <div className="flex-1 relative z-10">
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed line-clamp-4 mb-3 sm:mb-4 font-medium">
              {hadith.hadeeth || hadith.title}
            </p>

            {/* Attribution if available */}
            {hadith.attribution && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500 mb-2 sm:mb-3">
                <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="text-xs">{hadith.attribution}</span>
              </div>
            )}

            {/* Grade if available */}
            {hadith.grade && (
              <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="text-xs">{hadith.grade}</span>
              </div>
            )}
          </div>

          {/* Footer with arrow */}
          <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-purple-100/50 relative z-10">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500">
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="text-xs">انقر للقراءة</span>
            </div>
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            </div>
          </div>
        </motion.div>
      </Link>
    ),
    []
  );

  // Original SimilarHadithCard component (kept for backward compatibility)
  const SimilarHadithCard = useCallback(
    ({ hadith }) => (
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
    ),
    []
  );

  // PropTypes for components
  CollapsibleSection.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    icon: PropTypes.elementType.isRequired,
    defaultOpen: PropTypes.bool,
  };

  EnhancedSimilarHadithCard.propTypes = {
    hadith: PropTypes.shape({
      id: PropTypes.string.isRequired,
      hadeeth: PropTypes.string,
      title: PropTypes.string,
      attribution: PropTypes.string,
      grade: PropTypes.string,
    }).isRequired,
  };

  SimilarHadithCard.propTypes = {
    hadith: PropTypes.shape({
      id: PropTypes.string.isRequired,
      hadeeth: PropTypes.string,
      title: PropTypes.string,
    }).isRequired,
  };

  // Generate wisdom function
  const generateWisdom = useCallback((hints, explanation) => {
    if (hints && hints.length > 0) {
      const w = hints[0].split(" ").slice(0, 7).join(" ");
      if (w.length >= 4 && w.length <= 30) return w;
    }
    if (explanation) {
      const w = explanation.split(" ").slice(0, 7).join(" ");
      if (w.length >= 4 && w.length <= 30) return w;
    }
    return "جوهر الحديث في العمل";
  }, []);

  // Effects
  useEffect(() => {
    fetchHadithDetails();
    fetchRemainingQuestions();

    // Check if tour should run
    const hasSeenTour = localStorage.getItem("hadithpage_tour");
    if (!hasSeenTour) {
      setRunTour(true);
    }
  }, [fetchHadithDetails, fetchRemainingQuestions]);

  // Ensure Qabilah script is loaded
  useEffect(() => {
    const checkQabilahScript = () => {
      if (
        window.qabilah ||
        document.querySelector('script[src*="qabilah.com/widgets.js"]')
      ) {
        return;
      }

      // If script not loaded, load it manually
      const script = document.createElement("script");
      script.src = "https://qabilah.com/widgets.js";
      script.async = true;
      document.head.appendChild(script);
    };

    // Check immediately and also after a delay
    checkQabilahScript();
    const timer = setTimeout(checkQabilahScript, 1000);

    // Show fallback button if Qabilah script doesn't work after 3 seconds
    const fallbackTimer = setTimeout(() => {
      const qabilahButton = document.querySelector(".qabilah-share-button");
      const fallbackButton = document.getElementById("qabilah-fallback");

      if (
        (qabilahButton && fallbackButton && !qabilahButton.style.display) ||
        qabilahButton.style.display === "none"
      ) {
        qabilahButton.style.display = "none";
        fallbackButton.style.display = "flex";
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Generate siraj data
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
  }, [hadithDetails, aiExample, generateWisdom]);

  // Enhanced loading state
  if (isLoading || !hadithDetails) {
    return (
      <LazyMotion features={domAnimation}>
        <div className="min-h-screen bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] flex flex-col justify-center items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="relative">
              <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <div
                className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-400 rounded-full animate-spin"
                style={{ animationDelay: "0.5s" }}
              ></div>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-lg text-purple-700 font-medium"
            >
              جاري تحميل الحديث...
            </motion.p>
          </motion.div>
        </div>
      </LazyMotion>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
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

      <div className="min-h-screen relative bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] overflow-x-hidden">
        <SEO
          title={`شرح حديث ${hadithDetails.title?.substring(0, 50)}...`}
          description={hadithDetails.explanation}
          keywords={`${hadithDetails.grade}, ${getCategoryNames().join(", ")}`}
        />

        {/* Enhanced AI Assistant Button - Mobile Friendly */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 z-50 flex flex-col items-center gap-2 sm:gap-3"
        >
          {isAuthenticated && remainingQuestions !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl border border-purple-200/50 text-xs sm:text-sm text-purple-800 text-center max-w-[280px] sm:max-w-xs"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                <p className="font-bold text-xs sm:text-sm">
                  أنا سراج، مساعدك الذكي
                </p>
              </div>
              <p className="text-xs">
                {remainingQuestions === -1
                  ? "عدد غير محدود من الأسئلة لأنك مستخدم مميز 😉❤️"
                  : `لديك ${remainingQuestions} محاولات متبقية اليوم`}
              </p>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!isAuthenticated) {
                handleAuthRedirect();
                return;
              }
              setIsAIChatOpen(true);
            }}
            className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-2xl shadow-purple-500/50 hover:shadow-3xl transition-all duration-300"
            title="الدردشة مع مساعد الذكاء الاصطناعي"
          >
            <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-sm sm:text-lg font-bold">إسأل سراج</span>
          </motion.button>
        </motion.div>

        {/* Enhanced Main Content - Mobile Friendly */}
        <div className="relative z-10 max-w-5xl mx-auto sm:px-6 lg:px-8  sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full bg-white/80 backdrop-blur-xl border-2 border-purple-200/50 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 flex flex-col text-center transition-all duration-300 overflow-hidden"
          >
            {/* Enhanced Header - Mobile Friendly */}
            <div className="flex flex-col sm:flex-row items-center justify-between w-full mb-6 sm:mb-8 gap-3 sm:gap-4">
              <motion.button
                onClick={returnToPre}
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.9 }}
                className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl bg-white/90 hover:bg-white transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                <span className="text-xs sm:text-sm font-medium text-purple-700">
                  رجوع
                </span>
              </motion.button>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  title="تحليل سريع"
                  onClick={handleQuickAnalysisClick}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg"
                >
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">تحليل سريع</span>
                  <span className="sm:hidden">تحليل</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={copyToClipboard}
                  className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/90 hover:bg-white transition-all duration-300 shadow-lg"
                  title="نسخ"
                >
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setIsShareModalOpen(true)}
                  className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/90 hover:bg-white transition-all duration-300 shadow-lg"
                  title="مشاركة"
                >
                  <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={handleBookmarkToggle}
                  className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg ${
                    isBookmarked
                      ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white"
                      : "bg-white/90 hover:bg-white"
                  }`}
                  title="حفظ"
                >
                  <Bookmark
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      isBookmarked ? "fill-current" : "text-purple-600"
                    }`}
                  />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={async () => {
                    if (!isAuthenticated) {
                      handleAuthRedirect();
                      return;
                    }
                    await trackHadithRead(hadithId);
                    toast.success("تم تسجيل قراءة الحديث بنجاح! 📖");
                  }}
                  className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/90 hover:bg-white transition-all duration-300 shadow-lg"
                  title="تمت القراءة"
                >
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </motion.button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full bg-gradient-to-br from-white/80 to-purple-50/80 rounded-2xl sm:rounded-3xl p-2 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-inner border border-purple-200/50"
            >
              <div className="relative">
                <p
                  style={{ lineHeight: "2.5" }}
                  className="prose max-w-none text-lg sm:text-xl md:text-2xl text-gray-800 leading-loose amiri-regular text-right relative z-10"
                >
                  {hadithDetails?.hadeeth}
                </p>

                {hadithDetails?.attribution && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-right text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6 font-sans flex items-center gap-1.5 sm:gap-2 justify-end"
                  >
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    المحدث - {hadithDetails.attribution}
                  </motion.p>
                )}

                {hadithDetails?.grade && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-right mt-4 sm:mt-6"
                  >
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 font-semibold border border-green-200 shadow-sm">
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 inline ml-1.5 sm:ml-2" />
                      حكم الحديث : {hadithDetails.grade}
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Enhanced Collapsible sections container - Mobile Friendly */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full space-y-4 sm:space-y-6"
            >
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
            </motion.div>
          </motion.div>

          {/* Enhanced Similar Hadiths Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 w-full max-w-5xl mx-auto mb-12"
          >
            {/* Enhanced Header - Mobile Friendly */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center mb-6 sm:mb-8 px-4"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl">
                  <BookA className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="text-center sm:text-right">
                  <h2 className="text-2xl sm:text-3xl font-bold text-purple-700">
                    أحاديث مشابهة
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    اكتشف أحاديث ذات صلة وثيقة
                  </p>
                </div>
              </div>

              {similarHadiths.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-full border border-purple-200/50"
                >
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-medium text-purple-700">
                    {similarHadiths.length} حديث مشابه
                  </span>
                </motion.div>
              )}
            </motion.div>

            {/* Enhanced Loading State - Mobile Friendly */}
            {isLoadingSimilar ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
                {[...Array(6)].map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-purple-200/50 shadow-lg h-40 sm:h-48"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-3 sm:h-4 bg-gray-200 rounded mb-1 sm:mb-2 animate-pulse"></div>
                        <div className="h-2 sm:h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="h-2 sm:h-3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-2 sm:h-3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-2 sm:h-3 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                      <div className="h-2 sm:h-3 bg-gray-200 rounded w-3/5 animate-pulse"></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : similarHadiths.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
                {similarHadiths.map((hadith, index) => (
                  <motion.div
                    key={hadith.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.1,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    whileHover={{
                      y: -4,
                      scale: 1.01,
                      transition: { duration: 0.3 },
                    }}
                    whileTap={{
                      scale: 0.98,
                      transition: { duration: 0.1 },
                    }}
                  >
                    <EnhancedSimilarHadithCard hadith={hadith} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 sm:py-16 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl sm:rounded-3xl border border-purple-200/50 mx-4 sm:mx-0"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                  <BookA className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600" />
                </div>
                <h4 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-3">
                  لا توجد أحاديث مشابهة
                </h4>
                <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto mb-4 sm:mb-6 px-4">
                  جرب البحث عن أحاديث أخرى أو استكشف الفئات المختلفة للعثور على
                  محتوى مشابه
                </p>
                <Link
                  to="/hadiths"
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                >
                  <span>استكشف جميع الأحاديث</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Link>
              </motion.div>
            )}

            {/* View All Button - Mobile Friendly */}
            {similarHadiths.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="text-center pt-6 sm:pt-8 px-4 sm:px-0"
              >
                <Link
                  to="/hadiths"
                  className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group text-sm sm:text-base"
                >
                  <span>عرض جميع الأحاديث</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            )}
          </motion.div>
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
    </LazyMotion>
  );
};

export default HadithPage;
