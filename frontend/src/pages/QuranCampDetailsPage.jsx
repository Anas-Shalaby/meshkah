import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Trophy,
  Star,
  CheckCircle,
  Clock3,
  User,
  Eye,
  EyeOff,
  Target,
  Brain,
  ArrowUp,
  Bookmark,
  Heart,
  Zap,
  Shield,
  Award,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Share2,
  Download,
  Info,
  X,
  Plus,
  Sun,
  Lock,
  Play,
  CheckCircle2,
  Check,
  Lightbulb,
  MessageSquare,
  UserCheck,
  MapPin,
  FileText,
  Settings,
  Bell,
  AlertTriangle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Send,
  Save,
  HandHeart,
} from "lucide-react";

import SEO from "../components/SEO";
import { useAuth } from "../context/AuthContext";
import ActionPlanModal from "../components/ActionPlanModal";
import NotesModal from "../components/NotesModal";
import { toPng } from "html-to-image";
import copy from "copy-to-clipboard";
import OnboardingModal from "../components/OnboardingModal";
import { CampDetailsSkeleton } from "../components/CampDetailsSkeletons";
import { TaskCardSkeleton } from "../components/CampDetailsSkeletons";
import CampResources from "../components/dashboard/CampResources";
import CampQandA from "../components/dashboard/CampQandA";
import RichTadabburEditor from "../components/RichTadabburEditor";
import CommitmentModal from "../components/CommitmentModal";
import FriendsTab from "../components/FriendsTab";
import * as campService from "../services/campService";
import {
  Tooltip as TooltipComponent,
  ConfirmationDialog,
} from "../components/UI/Tooltip";
import {
  Map as MapIcon,
  Edit3,
  BookOpen as JournalIcon,
  Users as LeaderboardIcon,
  UsersIcon,
  BookOpen as StudyHallIcon,
} from "lucide-react";

// Import extracted components
import TaskCompletionStats from "../components/quran-camps/TaskCompletionStats";
import CampBanners from "../components/quran-camps/CampBanners";
import CampPublicView from "../components/quran-camps/CampPublicView";
import CampJourneyInterface from "../components/quran-camps/CampJourneyInterface";
import IdentityChoiceModal from "../components/quran-camps/modals/IdentityChoiceModal";
import AddReflectionModal from "../components/quran-camps/modals/AddReflectionModal";
import ReflectionModal from "../components/quran-camps/modals/ReflectionModal";
import LeaveCampModal from "../components/quran-camps/modals/LeaveCampModal";
import DeleteReflectionModal from "../components/quran-camps/modals/DeleteReflectionModal";
import Breadcrumb from "../components/quran-camps/Breadcrumb";
import ShareModal from "../components/quran-camps/ShareModal";

const QuranCampDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // تحقق إضافي من وجود token عند التحميل
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // إذا لم يكن هناك token، انتظر قليلاً للتأكد من تحميل الـ user
      const timer = setTimeout(() => {
        const tokenCheck = localStorage.getItem("token");
        if (!tokenCheck) {
          localStorage.setItem("redirectAfterLogin", `/quran-camps/${id}`);
          navigate("/login");
        }
      }, 1500); // زيادة الوقت قليلاً

      return () => clearTimeout(timer);
    }
  }, [id, navigate]);

  const [camp, setCamp] = useState(null);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [dayChallenges, setDayChallenges] = useState({});
  const [taskGroups, setTaskGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCampOfficiallyFinished, setIsCampOfficiallyFinished] =
    useState(false);
  const [showOpeningSurahModal, setShowOpeningSurahModal] = useState(false);

  const [showAddReflectionModal, setShowAddReflectionModal] = useState(false);

  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [hideIdentity, setHideIdentity] = useState(false);
  const [identityChoice, setIdentityChoice] = useState(null); // null, 'anonymous', 'public'
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);
  const [pendingIdentityChoice, setPendingIdentityChoice] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [showTestimonials, setShowTestimonials] = useState(false);
  const [campDay, setCampDay] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  // Sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchCampDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { "x-auth-token": token } : {};

        // جلب تفاصيل المخيم (متاح للجميع)
        const campResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/quran-camps/${id}`,
          {
            headers,
          }
        );

        const campData = await campResponse.json();
        setCamp(campData.data);
        // Ensure URL shows share_link instead of numeric id
        if (campData?.data?.share_link && id !== campData.data.share_link) {
          navigate(`/quran-camps/${campData.data.share_link}`, {
            replace: true,
          });
          return;
        }

        // التحقق من انتهاء المخيم رسمياً
        if (campData.data) {
          let endDateStr = null;

          // إذا كان end_date موجود في البيانات، استخدمه
          if (campData.data.end_date) {
            // استخراج التاريخ فقط بدون الوقت (YYYY-MM-DD)
            // التعامل مع ISO strings مثل "2025-10-27T21:00:00.000Z"
            endDateStr = String(campData.data.end_date).split("T")[0];
          }
          // إذا لم يكن موجوداً، احسبه من start_date + duration_days
          else if (campData.data.start_date && campData.data.duration_days) {
            const startDateStr = String(campData.data.start_date).split("T")[0];
            const startDateParts = startDateStr.split("-");
            const startDate = new Date(
              parseInt(startDateParts[0]),
              parseInt(startDateParts[1]) - 1,
              parseInt(startDateParts[2])
            );
            // حساب end_date: start_date + duration_days
            const calculatedEndDate = new Date(startDate);
            calculatedEndDate.setDate(
              calculatedEndDate.getDate() + campData.data.duration_days
            );
            // تحويل إلى string YYYY-MM-DD
            endDateStr = `${calculatedEndDate.getFullYear()}-${String(
              calculatedEndDate.getMonth() + 1
            ).padStart(2, "0")}-${String(calculatedEndDate.getDate()).padStart(
              2,
              "0"
            )}`;
          }

          if (endDateStr) {
            // مقارنة التواريخ كـ strings (YYYY-MM-DD) لتجنب مشاكل timezone
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(
              today.getMonth() + 1
            ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

            // مقارنة strings: "2025-10-27" <= "2025-10-28" = true
            const finished = endDateStr <= todayStr;

            setIsCampOfficiallyFinished(finished);
          }

          // ملاحظة: الإيميل والإشعارات يتم إرسالها تلقائياً من الـ scheduler
          // في الخادم كل يوم في الساعة 9:00 صباحاً (توقيت السعودية)
          // لا حاجة لإرسالها من Frontend لتجنب التكرار
        }

        // التحقق من وجود token بدلاً من user لتجنب مشاكل الـ refresh
        if (!token) {
          // حفظ URL المخيم في localStorage للعودة إليه بعد تسجيل الدخول
          localStorage.setItem("redirectAfterLogin", `/quran-camps/${id}`);
          navigate("/login");
          return;
        }

        // جلب المهام واللوحة والمجموعات فقط للمستخدمين المسجلين
        if (token) {
          const [tasksResponse, groupsResponse] = await Promise.all([
            fetch(
              `${import.meta.env.VITE_API_URL}/quran-camps/${id}/daily-tasks`,
              { headers }
            ),
            fetch(
              `${import.meta.env.VITE_API_URL}/quran-camps/${id}/task-groups`,
              { headers }
            ),
          ]);

          const tasksData = await tasksResponse.json();
          const groupsData = await groupsResponse.json();

          // Debug: التحقق من بيانات الأصدقاء
          if (tasksData.data && tasksData.data.length > 0) {
            const taskWithFriends = tasksData.data.find(
              (t) => t.completed_by_friends && t.completed_by_friends.length > 0
            );
          }

          setDailyTasks(tasksData.data || []);
          setDayChallenges(tasksData.dayChallenges || {});
          setTaskGroups(groupsData.data || []);
        }
      } catch (err) {
        setError("حدث خطأ أثناء تحميل تفاصيل المخيم");
        console.error("Error fetching camp details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCampDetails();
    }
  }, [id]);

  // دالة فتح نافذة الملاحظات وجلب البيانات
  const handleOpenNotesModal = useCallback(() => {
    setShowAllNotes(true);
  }, []);

  // دالة إغلاق نافذة الملاحظات
  const closeNotesModal = useCallback(() => {
    setShowAllNotes(false);
  }, []);

  const handleEnroll = async () => {
    // التحقق من أن التسجيل العام مفعّل
    if (camp?.enable_public_enrollment === false) {
      toast.error("التسجيل في هذا المخيم مغلق من قبل الإدارة");
      return;
    }

    // إذا لم يكن المستخدم مسجل دخول، اعرض رسالة تسجيل الدخول
    if (!currentUser) {
      toast.success("يرجى تسجيل الدخول أولاً للانضمام للمخيم");
      localStorage.setItem("redirectAfterLogin", `/quran-camps/${id}`);
      navigate("/login");
      return;
    }

    // إذا لم يتم اختيار نوع الهوية بعد، اعرض modal اختيار الهوية
    if (identityChoice === null) {
      setShowIdentityModal(true);
      return;
    }

    // افتح بوابة الميثاق بدلاً من التسجيل المباشر
    setPendingIdentityChoice(identityChoice);
    setShowCommitmentModal(true);
  };

  const handleIdentityChoice = (choice) => {
    setIdentityChoice(choice);
    setHideIdentity(choice === "anonymous");
    setShowIdentityModal(false);
    // بعد اختيار الهوية، اعرض بوابة الميثاق قبل التسجيل
    setPendingIdentityChoice(choice);
    setShowCommitmentModal(true);
  };

  // زر ذكي: يفتح تسجيل الدخول إن كان الزائر غير مسجل، أو يفتح ميثاق الالتزام إن كان مسجلًا
  const handleEnrollClick = () => {
    if (!currentUser) {
      toast.error("يرجى تسجيل الدخول أولاً للانضمام.");
      localStorage.setItem("redirectAfterLogin", `/quran-camps/${id}`);
      navigate("/login");
      return;
    }
    setShowCommitmentModal(true);
  };

  const confirmCommitmentAndEnroll = async () => {
    const choice = pendingIdentityChoice ?? identityChoice ?? "public";
    await handleEnrollWithChoice(choice);
    setShowCommitmentModal(false);
  };

  const handleEnrollWithChoice = async (choice) => {
    // التحقق من أن التسجيل العام مفعّل
    if (camp?.enable_public_enrollment === 0) {
      toast.error("التسجيل في هذا المخيم مغلق من قبل الإدارة");
      setEnrolling(false);
      return;
    }

    try {
      setEnrolling(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/quran-camps/${id}/enroll`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": localStorage.getItem("token"),
          },
          /*************  ✨ Windsurf Command 🌟  *************/
          // جسم بيانات التسجيل في المخيم
          body: JSON.stringify({
            hide_identity: choice === "anonymous",
          }),
        }
      );
      /*******  71dbbc77-f90d-45fc-adfa-91f3796949bc  *******/

      const data = await response.json();

      if (data.success) {
        toast.success("تم التسجيل في المخيم بنجاح! 🎉");
        // إعادة تحميل الصفحة لعرض المحتوى الجديد
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(data.message || "حدث خطأ في التسجيل");
      }
    } catch (error) {
      console.error("Error enrolling:", error);
      toast.error("حدث خطأ في الاتصال");
    } finally {
      setEnrolling(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "early_registration":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "early_registration":
        return <Clock3 className="w-4 h-4" />;
      case "completed":
        return <Trophy className="w-4 h-4" />;
      default:
        return <Clock3 className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "نشط الآن";
      case "early_registration":
        return "قريباً";
      case "completed":
        return "منتهي";
      default:
        return "غير محدد";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const groupTasksByDay = (tasks) => {
    // Debug: التحقق من بيانات الأصدقاء في المهام الأصلية
    if (tasks && tasks.length > 0) {
      const taskWithFriends = tasks.find(
        (t) => t.completed_by_friends && t.completed_by_friends.length > 0
      );
    }

    return tasks.reduce((groups, task) => {
      const day = task.day_number;
      if (!groups[day]) {
        groups[day] = [];
      }
      groups[day].push(task);
      return groups;
    }, {});
  };

  // دالة لقطع HTML مع الحفاظ على الـ tags المفتوحة
  const truncateHTML = (html, maxLength) => {
    if (!html) return "";

    // إذا كان النص أقصر من الحد الأقصى، أرجع HTML كما هو
    const textContent = html.replace(/<[^>]*>/g, "");
    if (textContent.length <= maxLength) {
      return html;
    }

    // إنشاء DOM parser مؤقت
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // ثوابت Node types
    const TEXT_NODE = 3;
    const ELEMENT_NODE = 1;

    // دالة مساعدة لقطع النص مع الحفاظ على الـ tags
    const truncateNode = (node, remainingLength) => {
      if (remainingLength <= 0) {
        return "";
      }

      if (node.nodeType === TEXT_NODE) {
        const text = node.textContent || "";
        if (text.length <= remainingLength) {
          return text;
        }
        return text.substring(0, remainingLength) + "...";
      }

      if (node.nodeType === ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        const attributes = Array.from(node.attributes)
          .map((attr) => `${attr.name}="${attr.value}"`)
          .join(" ");

        let html = `<${tagName}${attributes ? " " + attributes : ""}>`;
        let remaining = remainingLength;

        for (const child of Array.from(node.childNodes)) {
          const childHtml = truncateNode(child, remaining);
          if (!childHtml) break;
          html += childHtml;
          const childTextLength = (child.textContent || "").length;
          remaining -= childTextLength;
          if (remaining <= 0) break;
        }

        // إغلاق الـ tags المفتوحة
        if (!["br", "hr", "img", "input"].includes(tagName)) {
          html += `</${tagName}>`;
        }

        return html;
      }

      return "";
    };

    let result = "";
    let remaining = maxLength;

    for (const child of Array.from(tempDiv.childNodes)) {
      const childHtml = truncateNode(child, remaining);
      if (!childHtml) break;
      result += childHtml;
      const textLength = (child.textContent || "").length;
      remaining -= textLength;
      if (remaining <= 0) break;
    }

    return result || html.substring(0, maxLength) + "...";
  };

  // دالة لتمييز الكلمات المبحوث عنها مع الأمان - للـ HTML
  const highlightSearchTermHTML = (html, searchTerm) => {
    if (!searchTerm || !html) return html;

    // تنظيف مصطلح البحث من الأحرف الخطيرة
    const cleanSearchTerm = searchTerm.replace(/[<>"'&]/g, "");
    if (!cleanSearchTerm) return html;

    // استخدام regex آمن مع escape للأحرف الخاصة
    const regex = new RegExp(
      `(${cleanSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );

    // تقسيم HTML إلى أجزاء بين tags والنص
    // هذا regex يطابق أي HTML tag
    const tagRegex = /<[^>]*>/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    // استخراج جميع HTML tags
    while ((match = tagRegex.exec(html)) !== null) {
      // إضافة النص قبل الـ tag
      if (match.index > lastIndex) {
        const textBeforeTag = html.substring(lastIndex, match.index);
        parts.push({ type: "text", content: textBeforeTag });
      }
      // إضافة الـ tag نفسه
      parts.push({ type: "tag", content: match[0] });
      lastIndex = tagRegex.lastIndex;
    }

    // إضافة أي نص متبقي
    if (lastIndex < html.length) {
      parts.push({ type: "text", content: html.substring(lastIndex) });
    }

    // تطبيق التمييز على النص فقط (ليس على tags)
    return parts
      .map((part) => {
        if (part.type === "tag") {
          return part.content;
        } else {
          // تطبيق التمييز على النص
          return part.content.replace(regex, (match) => {
            return `<mark class="bg-yellow-200 px-1 rounded">${match}</mark>`;
          });
        }
      })
      .join("");
  };

  // دالة لتمييز الكلمات المبحوث عنها مع الأمان - للـ JSX
  // تنظف المدخلات وتطبق التمييز بأمان
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text;

    // تنظيف مصطلح البحث من الأحرف الخطيرة
    const cleanSearchTerm = searchTerm.replace(/[<>"'&]/g, "");
    if (!cleanSearchTerm) return text;

    // استخدام regex آمن مع escape للأحرف الخاصة
    const regex = new RegExp(
      `(${cleanSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (loading) {
    return (
      <>
        <SEO
          title="جاري التحميل - تفاصيل المخيم"
          description="جاري تحميل تفاصيل المخيم..."
        />
        <CampDetailsSkeleton />
      </>
    );
  }

  if (error || !camp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <SEO
          title="حدث خطأ - تفاصيل المخيم"
          description="حدث خطأ أثناء تحميل تفاصيل المخيم"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="text-center bg-white/90 backdrop-blur-xl rounded-3xl p-8 sm:p-12 shadow-2xl border-2 border-red-200 max-w-md mx-auto"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
          >
            <AlertCircle className="w-12 h-12 text-white" />
          </motion.div>
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl sm:text-3xl font-black text-red-900 mb-4"
          >
            حدث خطأ
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-red-700 font-medium mb-2 text-lg"
          >
            {error || "المخيم غير موجود"}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600 mb-8 text-sm"
          >
            يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              type="button"
              onClick={() => {
                setError(null);
                setLoading(true);
                window.location.reload();
              }}
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 shadow-xl hover:shadow-2xl font-bold text-lg flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
              إعادة المحاولة
            </motion.button>
            <motion.button
              type="button"
              onClick={() => navigate("/quran-camps")}
              className="px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all duration-300 shadow-xl hover:shadow-2xl font-bold text-lg"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              العودة للمخيمات
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }
  const tasksByDay = groupTasksByDay(dailyTasks);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <SEO
        title={`${camp.name} - المخيمات القرآنية`}
        description={camp.description}
        keywords={`مخيم قرآني, ${camp.surah_name}, حفظ القرآن, تفسير القرآن`}
      />

      {/* Cinematic Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Cinematic Background */}
        {camp.banner_image ? (
          <div className="absolute inset-0">
            <img
              src={camp.banner_image}
              alt={camp.name}
              className="w-full h-full object-cover camp-banner-image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-blue-900/40" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />
        )}

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-purple-500/20 rounded-full blur-lg animate-bounce"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            {/* Mobile Layout */}
            <div className="block sm:hidden">
              <div className="flex items-center gap-10 justify-between mb-3">
                {/* Back Button - Mobile */}
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center text-white hover:text-[#7440E9] transition-all duration-300 group"
                >
                  <div className="p-2 bg-white/10 rounded-xl group-hover:bg-white/20 transition-all duration-300 shadow-lg">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  <span className="mr-2 font-medium text-sm">العودة</span>
                </button>

                {/* Status Badge - Mobile */}
                {camp.is_enrolled ? (
                  <div className="flex items-center px-3 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-xl border border-green-400/30 shadow-lg">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse mr-2"></div>
                    <CheckCircle className="w-3 h-3 text-green-300 mr-1" />
                    <span className="text-green-100 font-medium text-xs">
                      مسجل
                    </span>
                  </div>
                ) : (
                  <div
                    className={`flex items-center px-3 py-2 backdrop-blur-md rounded-xl border shadow-lg ${getStatusColor(
                      camp.status
                    )}`}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mr-2 animate-pulse"
                      style={{
                        backgroundColor:
                          camp.status === "active"
                            ? "#10B981"
                            : camp.status === "early_registration"
                            ? "#3B82F6"
                            : "#6B7280",
                      }}
                    ></div>
                    {getStatusIcon(camp.status)}
                    <span className="mr-1 font-medium text-xs">
                      {getStatusText(camp.status)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between">
              {/* Back Button - Desktop */}
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-white hover:text-[#7440E9] transition-all duration-300 group"
              >
                <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="mr-3 font-semibold text-lg">العودة</span>
              </button>

              {/* Status & Actions - Desktop */}
              <div className="flex items-center space-x-4">
                {camp.is_enrolled ? (
                  <div className="flex items-center gap-10 space-x-4">
                    {/* Status Badge - Desktop */}
                    <div className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-2xl border border-green-400/30 shadow-lg">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-3"></div>
                      <CheckCircle className="w-4 h-4 text-green-300 mr-2" />
                      <span className="text-green-100 font-semibold">
                        مسجل في المخيم
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-10 space-x-4">
                    {/* Status Badge - Desktop */}
                    <div
                      className={`flex items-center px-4 py-2 backdrop-blur-md rounded-2xl border shadow-lg ${getStatusColor(
                        camp.status
                      )}`}
                    >
                      <div
                        className="w-2 h-2 rounded-full mr-3 animate-pulse"
                        style={{
                          backgroundColor:
                            camp.status === "active"
                              ? "#10B981"
                              : camp.status === "early_registration"
                              ? "#3B82F6"
                              : "#6B7280",
                        }}
                      ></div>
                      {getStatusIcon(camp.status)}
                      <span className="mr-2 font-semibold">
                        {getStatusText(camp.status)}
                      </span>
                    </div>

                    {/* Quick Stats - Desktop */}
                    <div className="flex items-center gap-2 space-x-4 text-white/80">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">
                          {camp.duration_days}
                        </div>
                        <div className="text-xs">أيام</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">
                          {camp.enrolled_count || 0}
                        </div>
                        <div className="text-xs">مشترك</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-20">
          {/* Share Button in Hero */}
          <div className="absolute hidden top-0 left-4 sm:left-8">
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-300 group"
            >
              <Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="text-sm font-semibold hidden sm:inline">
                مشاركة
              </span>
            </motion.button>
          </div>

          {/* Main Title */}
          <h1
            style={{ lineHeight: "1.7" }}
            className=" leading-normal text-7xl  md:text-9xl font-black mb-8 bg-gradient-to-r from-white via-purple-100 to-blue-100 bg-clip-text text-transparent drop-shadow-2xl animate-fade-in"
          >
            {camp.name}
          </h1>

          {/* Subtitle */}
          <p className="text-4xl md:text-5xl text-white/90 mb-12 font-bold flex items-center justify-center">
            سورة {camp.surah_name}
          </p>

          {/* Description */}
          <p className="text-2xl md:text-3xl text-white/80 mb-16 max-w-4xl mx-auto leading-relaxed">
            {camp.description}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16 max-w-5xl mx-auto">
            {[
              {
                icon: (
                  <div className="p-3 rounded-full mx-auto mb-4 bg-primary/10 backdrop-blur-sm shadow-ai-dark">
                    <Calendar className="w-10 h-10 text-primary" />
                  </div>
                ),
                label: "يبدأ",
                value: formatDate(camp.start_date),
                sub: null,
              },
              {
                icon: (
                  <div className="p-3 rounded-full mx-auto mb-4 bg-primary/10 backdrop-blur-sm shadow-ai-dark">
                    <Clock className="w-10 h-10 text-primary" />
                  </div>
                ),
                label: camp.duration_days,
                value: "أيام",
                sub: null,
              },
              {
                icon: (
                  <div className="p-3 rounded-full mx-auto mb-4 bg-green-500/10 backdrop-blur-sm shadow-ai-dark">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                ),
                label: camp.enrolled_count || 0,
                value: "مشترك",
                sub: null,
              },
              {
                icon: (
                  <div className="p-3 rounded-full mx-auto mb-4 bg-primary/10 backdrop-blur-sm shadow-ai-dark">
                    <Trophy className="w-10 h-10 text-primary" />
                  </div>
                ),
                label: `${dailyTasks.reduce(
                  (sum, task) => sum + (task.points || 0),
                  0
                )}`,
                value: "نقطة",
                sub: null,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 0.6 + i * 0.1,
                  ease: "easeOut",
                }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/15 shadow-ai-dark transition-ai flex flex-col items-center min-h-[175px] hover:border-primary/40 hover:shadow-ai-hover-dark"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {item.icon}
                </motion.div>
                <div className="text-3xl font-black text-white mb-1 flex items-center justify-center">
                  {item.label}
                </div>
                <div className="text-xl text-white/80 mb-1">{item.value}</div>
                {item.sub && (
                  <div className="text-sm text-white/50">{item.sub}</div>
                )}
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          {!camp.is_enrolled && (
            <div className="mb-8">
              <button
                onClick={handleEnrollClick}
                disabled={
                  enrolling ||
                  camp.status === "completed" ||
                  camp.enable_public_enrollment === false ||
                  (camp?.max_participants &&
                    Number(camp.max_participants) > 0 &&
                    Number(camp.enrolled_count || 0) >=
                      Number(camp.max_participants))
                }
                className="px-16 py-4 bg-white text-[#7440E9] text-2xl font-bold rounded-2xl hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {enrolling ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7440E9] mr-3"></div>
                    جاري المعالجة...
                  </div>
                ) : camp.enable_public_enrollment === false ? (
                  <span>التسجيل مغلق حاليًا</span>
                ) : camp?.max_participants &&
                  Number(camp.max_participants) > 0 &&
                  Number(camp.enrolled_count || 0) >=
                    Number(camp.max_participants) ? (
                  <span>عذراً، اكتمل العدد</span>
                ) : (
                  <span>انضم للرحلة الآن 🚀</span>
                )}
              </button>
              {!currentUser && (
                <p className="text-center text-white/80 mt-4 text-lg">
                  ستحتاج لتسجيل الدخول أولاً للانضمام لهذا المخيم
                </p>
              )}
            </div>
          )}

          {/* Identity Choice Modal */}
          {showIdentityModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    اختر طريقة المشاركة
                  </h3>
                  <p className="text-gray-600">كيف تريد أن تظهر في المخيم؟</p>
                </div>

                <div className="space-y-4">
                  {/* خيار المشاركة العامة */}
                  <button
                    onClick={() => handleIdentityChoice("public")}
                    className="w-full p-6 border-2 border-green-200 rounded-2xl hover:border-green-400 hover:bg-green-50 transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <UserCheck className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="text-right flex-1">
                        <h4 className="text-lg font-bold text-gray-800">
                          مشاركة عامة
                        </h4>
                        <p className="text-sm text-gray-600">
                          اسمك وصورتك ستظهر للجميع
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* خيار المشاركة المجهولة */}
                  <button
                    onClick={() => handleIdentityChoice("anonymous")}
                    className="w-full p-6 border-2 border-purple-200 rounded-2xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <EyeOff className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="text-right flex-1">
                        <h4 className="text-lg font-bold text-gray-800">
                          مشاركة مجهولة
                        </h4>
                        <p className="text-sm text-gray-600">
                          ستظهر كـ "مشارك مجهول"
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowIdentityModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Commitment Gate Modal */}
          <CommitmentModal
            isOpen={showCommitmentModal}
            onClose={() => setShowCommitmentModal(false)}
            onConfirm={confirmCommitmentAndEnroll}
            campName={camp?.name}
          />
        </div>
      </div>

      {/* Main Content Section - Conditional Rendering */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5]">
        {camp && (
          <div className="max-w-7xl mx-auto mb-8">
            <Breadcrumb
              items={[
                { label: "المخيمات القرآنية", to: "/quran-camps" },
                { label: camp.name },
              ]}
            />
          </div>
        )}
        {!camp.is_enrolled ? (
          <CampPublicView
            camp={camp}
            dailyTasks={dailyTasks}
            tasksByDay={tasksByDay}
            currentUser={currentUser}
            enrolling={enrolling}
            handleEnroll={handleEnroll}
            handleIdentityChoice={handleIdentityChoice}
            showIdentityModal={showIdentityModal}
            setShowIdentityModal={setShowIdentityModal}
            id={id}
          />
        ) : (
          <>
            {/* Enrolled User Content - Camp Journey Interface */}
            <CampJourneyInterface
              camp={camp}
              dailyTasks={dailyTasks}
              taskGroups={taskGroups}
              dayChallenges={dayChallenges}
              showAddReflectionModal={showAddReflectionModal}
              isCampOfficiallyFinished={isCampOfficiallyFinished}
              showOpeningSurahModal={showOpeningSurahModal}
              setShowOpeningSurahModal={setShowOpeningSurahModal}
            />
          </>
        )}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          camp={camp}
        />
      </div>
    </div>
  );
};

export default QuranCampDetailsPage;
