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
  ExternalLink,
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
  Crown,
  Award,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
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
  Medal,
  UserCheck,
  MapPin,
  FileText,
  File,
  BarChart3,
  Settings,
  Bell,
  AlertTriangle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Send,
  Edit,
  CheckCheck,
  BookHeart,
  Flame,
  TrendingUp,
  ThumbsUp,
  Activity,
  PieChart,
  Save,
  Clipboard,
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

// مكون مساعد لعرض إحصائيات إكمال المهام من الأصدقاء
const TaskCompletionStats = ({ friendsWhoCompleted, totalCount }) => {
  const friendsCount = friendsWhoCompleted?.length || 0;

  // لا تعرض شيئًا إذا لم يكملها أحد
  if (totalCount === 0) {
    return null;
  }

  // الحالة 1: أصدقاؤك فقط هم من أكملوها
  if (friendsCount > 0 && friendsCount === totalCount) {
    let text = "";
    if (friendsCount === 1) {
      text = `${friendsWhoCompleted[0]?.username || "صديق"} أتمها`;
    } else if (friendsCount === 2) {
      text = `${friendsWhoCompleted[0]?.username || "صديق"} و ${
        friendsWhoCompleted[1]?.username || "صديق"
      } أتموها`;
    } else {
      text = `${friendsWhoCompleted[0]?.username || "صديق"} و ${
        friendsCount - 1
      } أصدقاء آخرين أتموها`;
    }
    return (
      <span
        className="flex items-center text-xs sm:text-sm text-purple-600 font-semibold ml-2 sm:ml-3 flex-shrink-0"
        title={text}
      >
        <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
        <span>{text}</span>
      </span>
    );
  }

  // الحالة 2: أصدقاؤك + آخرون
  if (friendsCount > 0) {
    const otherCount = totalCount - friendsCount;
    let text = "";
    if (friendsCount === 1) {
      text = `${friendsWhoCompleted[0]?.username || "صديق"}`;
    } else {
      text = `${friendsWhoCompleted[0]?.username || "صديق"} و ${
        friendsCount - 1
      } أصدقاء`;
    }

    if (otherCount > 0) {
      text += ` و ${otherCount} آخرين أتموها`;
    } else {
      text += ` أتموها`;
    }

    return (
      <span
        className="flex items-center text-xs sm:text-sm text-purple-600 font-semibold ml-2 sm:ml-3 flex-shrink-0"
        title={text}
      >
        <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
        <span>{text}</span>
      </span>
    );
  }

  // الحالة 3: آخرون فقط، لا يوجد أصدقاء
  return (
    <span
      className="flex items-center text-xs sm:text-sm text-gray-500 font-medium ml-2 sm:ml-3 flex-shrink-0"
      title={`${totalCount} شخص أتموا هذه المهمة`}
    >
      <Users className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
      <span>{totalCount} أتموا</span>
    </span>
  );
};

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
  // Camp Journey Interface Component for Enrolled Users
  const CampJourneyInterface = ({
    camp,
    dailyTasks,
    taskGroups,
    showOpeningSurahModal,
    isCampOfficiallyFinished: parentIsCampOfficiallyFinished,
  }) => {
    // حساب اليوم الحالي بناءً على تاريخ بداية المخيم
    // هذا يحدد اليوم الحالي من المخيم بغض النظر عن متى انضم المستخدم
    // مثال: إذا بدأ المخيم يوم 1 ودخل المستخدم يوم 3، فاليوم الحالي = 3
    // وهذا يسمح للمستخدم بإكمال مهام اليوم 3 مباشرة، ومهام الأيام السابقة (1 و 2) تكون "incomplete"

    // State for resources and Q&A
    const [resources, setResources] = useState([]);
    const [qanda, setQanda] = useState([]);
    const [resourcesLoading, setResourcesLoading] = useState(false);
    const [qandaLoading, setQandaLoading] = useState(false);

    // Helper function to convert flat tasks to tree structure
    const buildTaskTree = (tasks, groups) => {
      if (!tasks || !Array.isArray(tasks)) return [];

      // Debug: التحقق من بيانات الأصدقاء قبل بناء الـ tree
      if (tasks && tasks.length > 0) {
        const taskWithFriends = tasks.find(
          (t) => t.completed_by_friends && t.completed_by_friends.length > 0
        );
      }

      // If API already returns tree structure, return it
      if (tasks.length > 0 && tasks[0].type === "group") {
        return tasks;
      }

      // Otherwise, build tree from flat structure
      const groupedTasks = {};
      const ungroupedTasks = [];

      tasks.forEach((task) => {
        if (task.group_id && groups) {
          const groupId = task.group_id;
          if (!groupedTasks[groupId]) {
            const group = groups.find((g) => g.id === groupId);
            if (group) {
              groupedTasks[groupId] = {
                id: groupId,
                type: "group",
                title: group.title,
                description: group.description,
                children: [],
              };
            }
          }
          if (groupedTasks[groupId]) {
            groupedTasks[groupId].children.push({
              ...task,
              type: "task",
            });
          }
        } else {
          ungroupedTasks.push({
            ...task,
            type: "task",
          });
        }
      });

      // Sort groups by order_in_camp
      const sortedGroups = Object.values(groupedTasks).sort((a, b) => {
        const groupA = groups?.find((g) => g.id === a.id);
        const groupB = groups?.find((g) => g.id === b.id);
        return (groupA?.order_in_camp || 0) - (groupB?.order_in_camp || 0);
      });

      // Sort tasks within each group
      sortedGroups.forEach((group) => {
        group.children.sort((a, b) => {
          if (a.order_in_group !== null && b.order_in_group !== null) {
            return a.order_in_group - b.order_in_group;
          }
          return (
            (a.order_in_group || a.order_in_day || 0) -
            (b.order_in_group || b.order_in_day || 0)
          );
        });
      });

      // Sort ungrouped tasks
      ungroupedTasks.sort(
        (a, b) => (a.order_in_day || 0) - (b.order_in_day || 0)
      );

      // Debug: التحقق من بيانات الأصدقاء بعد بناء الـ tree
      const allTasksInTree = [
        ...sortedGroups.flatMap((g) => g.children),
        ...ungroupedTasks,
      ];
      const taskWithFriendsAfter = allTasksInTree.find(
        (t) => t.completed_by_friends && t.completed_by_friends.length > 0
      );

      // Return tree structure: groups first, then ungrouped tasks
      return [
        ...sortedGroups,
        ...(ungroupedTasks.length > 0
          ? [{ type: "ungrouped", children: ungroupedTasks }]
          : []),
      ];
    };

    // Helper function to build task path (breadcrumbs)
    const buildTaskPath = (task, groups, dayNumber) => {
      const path = [{ type: "day", title: `اليوم ${dayNumber}`, dayNumber }];
      if (task.group_id && groups) {
        const group = groups.find((g) => g.id === task.group_id);
        if (group) {
          // Build parent groups chain
          const parentGroups = [];
          let currentGroup = group;

          // Traverse up the parent chain
          while (currentGroup && currentGroup.parent_group_id) {
            const parentGroup = groups.find(
              (g) => g.id === currentGroup.parent_group_id
            );
            if (parentGroup) {
              parentGroups.unshift({
                type: "group",
                title: parentGroup.title,
                groupId: parentGroup.id,
              }); // Add to beginning for correct order
              currentGroup = parentGroup;
            } else {
              break; // Stop if parent not found
            }
          }

          // Add parent groups first, then the current group
          path.push(...parentGroups);
          path.push({
            type: "group",
            title: group.title,
            groupId: group.id,
          });
        }
      }
      return path;
    };

    // Helper function to get day theme (main group title)
    const getDayTheme = (dayNumber, tasks, groups) => {
      if (!tasks || !groups) return null;
      const dayTasks = tasks.filter((task) => task.day_number === dayNumber);
      if (dayTasks.length === 0) return null;

      // Find the main group (first group by order_in_camp)
      const groupedTasks = dayTasks.filter((task) => task.group_id);
      if (groupedTasks.length === 0) return null;

      const groupIds = [...new Set(groupedTasks.map((task) => task.group_id))];
      const dayGroups = groups
        .filter((g) => groupIds.includes(g.id))
        .sort((a, b) => (a.order_in_camp || 0) - (b.order_in_camp || 0));

      return dayGroups.length > 0 ? dayGroups[0].title : null;
    };

    // Helper function to get locked day theme from taskGroups directly
    // This allows showing teaser for future days even if user hasn't accessed them yet
    const getLockedDayTheme = (dayNumber, groups, dailyTasks) => {
      if (!groups || !dailyTasks) return null;

      // Find tasks for this day from dailyTasks (all tasks, not just user's progress)
      const dayTasks = dailyTasks.filter(
        (task) => task.day_number === dayNumber
      );
      if (dayTasks.length === 0) return null;

      // Find the main group (first group by order_in_camp)
      const groupedTasks = dayTasks.filter((task) => task.group_id);
      if (groupedTasks.length === 0) return null;

      const groupIds = [...new Set(groupedTasks.map((task) => task.group_id))];
      const dayGroups = groups
        .filter((g) => groupIds.includes(g.id))
        .sort((a, b) => (a.order_in_camp || 0) - (b.order_in_camp || 0));

      return dayGroups.length > 0 ? dayGroups[0].title : null;
    };

    // Helper function to group tasks by groups
    const groupTasksByGroups = (tasks, groups) => {
      const groupedTasks = {};
      const ungroupedTasks = [];

      tasks.forEach((task) => {
        if (task.group_id) {
          const groupId = task.group_id;
          if (!groupedTasks[groupId]) {
            groupedTasks[groupId] = {
              group: groups.find((g) => g.id === groupId),
              tasks: [],
            };
          }
          groupedTasks[groupId].tasks.push(task);
        } else {
          ungroupedTasks.push(task);
        }
      });

      // Sort tasks within each group by order_in_group or order_in_day
      Object.keys(groupedTasks).forEach((groupId) => {
        groupedTasks[groupId].tasks.sort((a, b) => {
          if (a.order_in_group !== null && b.order_in_group !== null) {
            return a.order_in_group - b.order_in_group;
          }
          return (
            (a.order_in_group || a.order_in_day || 0) -
            (b.order_in_group || b.order_in_day || 0)
          );
        });
      });

      // Sort ungrouped tasks
      ungroupedTasks.sort(
        (a, b) => (a.order_in_day || 0) - (b.order_in_day || 0)
      );

      return { groupedTasks, ungroupedTasks };
    };

    // Helper function to extract YouTube video ID
    const extractYouTubeId = (url) => {
      if (!url) return null;
      const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11 ? match[2] : null;
    };

    // Helper function to get YouTube embed URL
    const getYouTubeEmbedUrl = (url) => {
      const videoId = extractYouTubeId(url);
      if (!videoId) return null;
      return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&controls=1`;
    };

    // Fetch resources and Q&A when component mounts
    useEffect(() => {
      const fetchResources = async () => {
        try {
          setResourcesLoading(true);
          const result = await campService.getCampResources(camp.id);
          if (result.success) {
            setResources(result.data || []);
          }
        } catch (error) {
          console.error("Error fetching resources:", error);
        } finally {
          setResourcesLoading(false);
        }
      };

      const fetchQandA = async () => {
        try {
          setQandaLoading(true);
          const result = await campService.getCampQandA(camp.id);
          if (result.success) {
            setQanda(result.data || []);
          }
        } catch (error) {
          console.error("Error fetching Q&A:", error);
        } finally {
          setQandaLoading(false);
        }
      };

      fetchResources();
      fetchQandA();
    }, [camp.id]);

    const handleQuestionAsked = () => {
      // Refetch Q&A after a new question is asked
      const fetchQandA = async () => {
        try {
          const result = await campService.getCampQandA(camp.id);
          if (result.success) {
            setQanda(result.data || []);
          }
        } catch (error) {
          console.error("Error fetching Q&A:", error);
        }
      };
      fetchQandA();
    };

    const getCurrentDay = () => {
      if (!camp || !camp.start_date) return 1;
      // إذا كان المخيم في حالة التسجيل المبكر ولم يبدأ من الإدارة، ثبّت اليوم على 1
      if (camp.status === "early_registration") return 1;

      const startDate = new Date(camp.start_date);
      startDate.setHours(0, 0, 0, 0); // تأكد من إزالة الوقت

      const today = new Date();
      today.setHours(0, 0, 0, 0); // تأكد من إزالة الوقت

      const diffTime = today - startDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // اليوم الأول = 1، محدود بعدد أيام المخيم
      return Math.max(1, Math.min(diffDays, camp.duration_days || 1));
    };

    // حساب اليوم الحالي للمخيم
    useEffect(() => {
      if (camp) {
        const currentDay = getCurrentDay();
        setCampDay(currentDay);
      }
    }, [camp]);
    const [activeTab, setActiveTab] = useState(() => {
      // استرجاع التبويب المحفوظ من localStorage
      const savedTab = localStorage.getItem(`camp-${camp.id}-activeTab`);
      return savedTab || "dashboard";
    });
    const [userProgress, setUserProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCampCompleted, setIsCampCompleted] = useState(false);
    const [completionStats, setCompletionStats] = useState({
      taskStats: {}, // { taskId: count }
      dayStats: {}, // { dayNumber: count }
    });
    const [summaryData, setSummaryData] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const summaryCardRef = useRef(null);

    // استخدام قيمة isCampOfficiallyFinished من الـ parent component
    // يجب إغلاق المخيم فقط عندما ينتهي عدد أيامه الفعلية (isCampOfficiallyFinished)
    // وليس عندما يكمل المستخدم المهام في اليوم الحالي
    const isCampFinished = parentIsCampOfficiallyFinished;

    // استخدام is_read_only من الـ API (للمخيمات المنتهية)
    const isReadOnly = camp?.is_read_only || camp?.status === "completed";

    // معلومات الانضمام المتأخر
    const joinedLate = camp?.joined_late || false;
    const missedDaysCount = camp?.missed_days_count || 0;

    // منع إكمال المهام إذا كان المخيم في حالة "early_registration" (لم يبدأ بعد)
    const isCampNotStarted = camp?.status === "early_registration";
    const [selectedDay, setSelectedDay] = useState(1);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showTaskSidebar, setShowTaskSidebar] = useState(false);
    const [celebratingDay, setCelebratingDay] = useState(null); // Track which day is being celebrated
    const [studyHallSelectedDay, setStudyHallSelectedDay] = useState(
      getCurrentDay()
    );
    const [studyHallFilter, setStudyHallFilter] = useState("all"); // "all", "my", "others"
    const [studyHallSearch, setStudyHallSearch] = useState(""); // البحث في التدبرات
    const [studyHallSort, setStudyHallSort] = useState("newest"); // "newest", "helpful", "saved"

    // Helper function to refetch study hall when sort/filter/day changes
    // Note: We don't include fetchStudyHallContent in deps to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const refetchStudyHall = useCallback(
      (newSort, newDay) => {
        fetchStudyHallContent(
          newDay || studyHallSelectedDay,
          newSort || studyHallSort,
          1, // Reset to page 1
          20,
          true // Reset cache
        );
      },
      [studyHallSelectedDay, studyHallSort]
    );

    const [dailyReflection, setDailyReflection] = useState("");
    const [showReflectionModal, setShowReflectionModal] = useState(false);
    const [activeTaskTab, setActiveTaskTab] = useState("task"); // 'task' or 'reflection'
    const [showActionPlanModal, setShowActionPlanModal] = useState(false);
    const [actionPlanEditMode, setActionPlanEditMode] = useState(false);
    const [innerJournalTab, setInnerJournalTab] = useState("myReflections"); // 'myReflections' or 'savedReflections'
    const [selectedTask, setSelectedTask] = useState(null);
    const [reflectionText, setReflectionText] = useState("");
    const [reflectionJson, setReflectionJson] = useState(null);
    const [benefitsText, setBenefitsText] = useState("");
    const [proposedStep, setProposedStep] = useState("");
    const [shareInStudyHall, setShareInStudyHall] = useState(false);
    const [taskReflections, setTaskReflections] = useState({});
    const [pledgedSteps, setPledgedSteps] = useState(new Set()); // تتبع الخطوات الملتزم بها
    const [pledgingProgressId, setPledgingProgressId] = useState(null); // للتحكم في حالة التحميل
    const [showPledgeTooltip, setShowPledgeTooltip] = useState({}); // لتتبع عرض رسالة الالتزام
    const [showUpvoteTooltip, setShowUpvoteTooltip] = useState({}); // لتتبع عرض tooltip التصويت
    const [showBookmarkTooltip, setShowBookmarkTooltip] = useState({}); // لتتبع عرض tooltip الحفظ
    const [expandedTasks, setExpandedTasks] = useState({});
    const [expandedGroups, setExpandedGroups] = useState({});

    // Onboarding states
    const [showTaskModalIntro, setShowTaskModalIntro] = useState(false);
    const [showStudyHallIntro, setShowStudyHallIntro] = useState(false);
    const [showJournalIntro, setShowJournalIntro] = useState(false);
    const [showLeaderboardIntro, setShowLeaderboardIntro] = useState(false);
    const [showActionPlanIntro, setShowActionPlanIntro] = useState(false);

    // Onboarding helpers
    const handleOnboarding = (featureKey, showModalSetter, originalAction) => {
      // مفتاح عام لكل الموقع (مرّة واحدة فقط لكل ميزة عبر جميع المخيمات)
      const globalKey = `onboarding_${featureKey}_seen`;
      // دعم رجعي: مفتاح قديم خاص بكل مخيم
      const legacyKey = `onboarding_${featureKey}_seen_camp_${camp?.id}`;
      try {
        // ترقية أي مشاهدة قديمة إلى المفتاح العام
        if (
          localStorage.getItem(legacyKey) &&
          !localStorage.getItem(globalKey)
        ) {
          localStorage.setItem(globalKey, "true");
        }
        if (!localStorage.getItem(globalKey)) {
          showModalSetter(true);
          return true;
        }
      } catch (e) {
        console.error("LocalStorage error:", e);
      }
      if (typeof originalAction === "function") originalAction();
      return false;
    };

    const closeOnboarding = (featureKey, showModalSetter, originalAction) => {
      const globalKey = `onboarding_${featureKey}_seen`;
      try {
        localStorage.setItem(globalKey, "true");
      } catch (e) {
        console.error("LocalStorage error:", e);
      }
      showModalSetter(false);
      if (typeof originalAction === "function") originalAction();
    };

    // Timer states
    const [timerActive, setTimerActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [timerInterval, setTimerInterval] = useState(null);

    // Leave camp states
    const [showLeaveCampModal, setShowLeaveCampModal] = useState(false);
    const [leavingCamp, setLeavingCamp] = useState(false);

    // Camp settings states
    const [showCampSettings, setShowCampSettings] = useState(false);
    const [campSettings, setCampSettings] = useState({
      hide_identity: false,
      notifications_enabled: true,
      daily_reminders: true,
      achievement_notifications: true,
      leaderboard_visibility: true,
    });
    const [updatingSettings, setUpdatingSettings] = useState(false);

    // Delete reflection modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [reflectionToDelete, setReflectionToDelete] = useState(null);
    const [reflectionToEdit, setReflectionToEdit] = useState(null); // للتحرير من سجلي

    // Task completion loading state
    const [isCompleting, setIsCompleting] = useState(false);

    // Opening surah modal state

    // التحقق من عرض مودال السورة الافتتاحية في اليوم الأول
    useEffect(() => {
      if (camp && camp.is_enrolled && !loading) {
        // حساب اليوم الحالي
        const getCurrentDay = () => {
          if (!camp || !camp.start_date) return 1;
          if (camp.status === "early_registration") return 1;
          const startDate = new Date(camp.start_date);
          startDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffTime = today - startDate;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return Math.max(1, Math.min(diffDays, camp.duration_days || 1));
        };

        const currentDay = getCurrentDay();

        if (currentDay === 1) {
          // عرض المودال بعد تأخير بسيط لضمان تحميل الصفحة
          setTimeout(() => {
            setShowOpeningSurahModal(true);
          }, 500);
        }
      }
    }, [camp, loading]);

    // Handler لتحديث الفوائد لكل مهمة
    const handleReflectionChange = (taskId, text) => {
      setTaskReflections((prev) => ({
        ...prev,
        [taskId]: text,
      }));
    };

    // Handler لتوسيع/طي تفاصيل المهمة
    const toggleTaskDetails = (taskId) => {
      setExpandedTasks((prev) => ({
        ...prev,
        [taskId]: !prev[taskId],
      }));
    };

    // دالة جلب صورة المستخدم (نفس الطريقة المستخدمة في Navbar)
    const getAvatarUrl = (user) => {
      if (!user) return "/default-avatar.png";
      if (user.avatar_url) {
        if (user.avatar_url.startsWith("http")) {
          return user.avatar_url;
        } else if (user.avatar_url.startsWith("/uploads/avatars")) {
          return `${import.meta.env.VITE_IMAGE_API}/api${user.avatar_url}`;
        }
      }
      return "/default-avatar.png";
    };

    // Timer functions
    const parseTimeString = (timeString) => {
      if (!timeString) return 30; // Default 30 minutes

      // Remove extra spaces and convert to lowercase for easier parsing
      const cleanString = timeString.toString().trim().toLowerCase();
      // Check for hours (ساعة, ساعات, hour, hours)
      if (
        cleanString.includes("ساعة") ||
        cleanString.includes("ساعات") ||
        cleanString.includes("hour") ||
        cleanString.includes("hours")
      ) {
        const hours = parseInt(cleanString.match(/[0-9٠-٩۰-۹]+/g)?.[0] || "1");
        return hours * 60; // Convert to minutes
      }

      // Check for minutes (دقيقة, دقائق, minute, minutes)
      if (
        cleanString.includes("دقيقة") ||
        cleanString.includes("دقائق") ||
        cleanString.includes("minute") ||
        cleanString.includes("minutes")
      ) {
        const minutes = parseInt(cleanString.match(/\d+/u)?.[0] || "30");
        return minutes;
      }

      // Check for seconds (ثانية, ثواني, second, seconds)
      if (
        cleanString.includes("ثانية") ||
        cleanString.includes("ثواني") ||
        cleanString.includes("second") ||
        cleanString.includes("seconds")
      ) {
        const seconds = parseInt(cleanString.match(/\d+/)?.[0] || "1800");
        return Math.ceil(seconds / 60); // Convert to minutes
      }

      // If it's just a number, assume it's minutes
      const number = parseInt(cleanString.match(/\d+/)?.[0] || "30");
      return number;
    };

    const startTimer = (estimatedTime) => {
      // استخدم الوقت المتبقي الحالي للاستئناف إن وجد، وإلا ابدأ من التقدير
      const initialSeconds =
        timeRemaining && timeRemaining > 0
          ? timeRemaining
          : parseTimeString(estimatedTime) * 60;

      // تأكد من عدم وجود مؤقت قديم يعمل
      if (timerInterval) {
        clearInterval(timerInterval);
      }

      setTimeRemaining(initialSeconds);
      setTimerActive(true);

      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            clearInterval(interval);
            toast.success("انتهى وقت المهمة! 🎉", {
              duration: 5000,
              style: {
                background: "#10B981",
                color: "#fff",
                fontSize: "16px",
              },
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimerInterval(interval);
    };

    const stopTimer = () => {
      setTimerActive(false);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    };

    const resetTimer = (estimatedTime) => {
      stopTimer();
      const timeInMinutes = parseTimeString(estimatedTime);
      const timeInSeconds = timeInMinutes * 60;
      setTimeRemaining(timeInSeconds);
    };

    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    };

    // Reset timer when modal opens or task changes
    useEffect(() => {
      if (showReflectionModal && selectedTask) {
        // Reset timer to the estimated time when modal opens
        const timeInMinutes = parseTimeString(selectedTask.estimated_time);
        const timeInSeconds = timeInMinutes * 60;
        setTimeRemaining(timeInSeconds);
        setTimerActive(false);
        // Clear any existing timer interval
        setTimerInterval((prevInterval) => {
          if (prevInterval) {
            clearInterval(prevInterval);
          }
          return null;
        });
      }
    }, [showReflectionModal, selectedTask?.id]);

    // دالة ترك المخيم
    const handleLeaveCamp = async () => {
      try {
        setLeavingCamp(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/quran-camps/${
            camp?.share_link || camp?.id
          }/leave`,
          {
            method: "POST",
            headers: {
              "x-auth-token": `${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          toast.success("تم ترك المخيم بنجاح");
          // إعادة التوجيه إلى صفحة المخيمات
          setTimeout(() => {
            navigate("/quran-camps");
          }, 1500);
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || "حدث خطأ في ترك المخيم");
        }
      } catch (error) {
        console.error("Error leaving camp:", error);
        toast.error("حدث خطأ في ترك المخيم");
      } finally {
        setLeavingCamp(false);
        setShowLeaveCampModal(false);
      }
    };

    // جلب إعدادات المستخدم في المخيم
    const fetchCampSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/quran-camps/${
            camp?.share_link || camp?.id
          }/settings`,
          {
            headers: {
              "x-auth-token": `${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setCampSettings(data.data || campSettings);
        }
      } catch (error) {
        console.error("Error fetching camp settings:", error);
      }
    };

    // تحديث إعدادات المستخدم في المخيم
    const updateCampSettings = async (newSettings) => {
      try {
        setUpdatingSettings(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/quran-camps/${
            camp?.share_link || camp?.id
          }/settings`,
          {
            method: "PUT",
            headers: {
              "x-auth-token": `${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(newSettings),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setCampSettings(data.data);
          toast.success("تم تحديث الإعدادات بنجاح");
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || "حدث خطأ في تحديث الإعدادات");
        }
      } catch (error) {
        console.error("Error updating camp settings:", error);
        toast.error("حدث خطأ في تحديث الإعدادات");
      } finally {
        setUpdatingSettings(false);
      }
    };

    // تحديث إعداد واحد
    const handleSettingChange = async (settingKey, value) => {
      const newSettings = { ...campSettings, [settingKey]: value };
      setCampSettings(newSettings);
      await updateCampSettings(newSettings);
    };

    // جلب إحصائيات الإنجاز (عدد الأشخاص الذين أكملوا كل مهمة ووصلوا لكل يوم)

    // جلب تقدم المستخدم من API
    const fetchUserProgress = useCallback(async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/quran-camps/${
            camp?.share_link || camp?.id
          }/my-progress`,
          {
            headers: {
              "x-auth-token": `${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUserProgress(data.data);

          // تحديد حالة الاكتمال بناءً على البيانات
          const progressData = data.data;
          const allTasksCompleted =
            progressData.tasks &&
            progressData.tasks.length > 0 &&
            progressData.tasks.every((task) => task.completed);

          // المخيم مكتمل فقط من خلال حفظ خطة العمل أو من API (ليس عند إكمال المهام)
          // isCampCompleted يجب أن يعتمد فقط على الخادم (is_completed من API)
          // وليس على إكمال المهام محلياً
          setIsCampCompleted(data.data?.is_completed || false);
          setSelectedDay(getCurrentDay());
        } else {
          console.error("Failed to fetch user progress");
        }
      } catch (error) {
        console.error("Error fetching user progress:", error);
      } finally {
        setLoading(false);
      }
    }, [camp?.id]);

    // جلب إعدادات المخيم عند تحميل الصفحة
    useEffect(() => {
      if (camp && currentUser) {
        fetchCampSettings();
      }
    }, [camp, currentUser]);

    // إكمال مهمة (بدون تدبر) مع تحديث فوري للـ state
    const markTaskComplete = useCallback(
      async (taskId) => {
        // قفل ناعم: منع إكمال المهام إذا انتهى المخيم (لكن السماح في المخيمات المنتهية للقراءة فقط)

        // منع إكمال المهام إذا كان المخيم لم يبدأ بعد
        if (isCampNotStarted) {
          toast.error(
            "المخيم لم يبدأ بعد. يرجى الانتظار حتى يبدأ الادمن المخيم."
          );
          return false;
        }
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            `${
              import.meta.env.VITE_API_URL
            }/quran-camps/tasks/${taskId}/mark-complete`,
            {
              method: "POST",
              headers: {
                "x-auth-token": `${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            // تحديث الـ state فوراً بدون انتظار تحديث الصفحة
            let taskToUpdate = null;
            let completedDay = null;
            let allDayTasksCompleted = false;

            setUserProgress((prev) => {
              taskToUpdate = prev.tasks.find((task) => task.id === taskId);
              if (!taskToUpdate) return prev;

              completedDay = taskToUpdate.day_number;

              const updatedTasks = prev.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      completed: true,
                      total_points: taskToUpdate.points || 0,
                      completed_at: new Date().toISOString(),
                    }
                  : task
              );

              // التحقق من إكمال جميع مهام اليوم
              const dayTasks = updatedTasks.filter(
                (task) => task.day_number === completedDay
              );
              allDayTasksCompleted =
                dayTasks.length > 0 && dayTasks.every((task) => task.completed);

              return {
                ...prev,
                tasks: updatedTasks,
                completedTasks: prev.completedTasks + 1,
                total_points:
                  isReadOnly || isCampFinished
                    ? prev.total_points
                    : prev.total_points + (taskToUpdate.points || 0),
              };
            });

            // إذا تم إكمال جميع مهام اليوم، عرض إشعار وربما شرح خطة العمل لليوم الأخير
            if (completedDay && allDayTasksCompleted) {
              // Trigger celebration animation
              setCelebratingDay(completedDay);
              // Clear celebration after animation completes
              setTimeout(() => {
                setCelebratingDay(null);
              }, 1500);

              setTimeout(() => {
                toast.success(
                  `رائع! تم إكمال جميع مهام اليوم ${completedDay} 🎉`,
                  {
                    duration: 3000,
                  }
                );
              }, 300);

              // تم إزالة الفتح التلقائي للـ Action Plan Modal
              // سيتم إضافة مهمة "كتابة الـ action plan" في الـ sidebar لليوم الأخير
            }

            // مسح cache قاعة التدارس لإظهار المحتوى الجديد
            clearStudyHallCache(studyHallSelectedDay);

            toast.success("تم إكمال المهمة بنجاح! 🎉");
            return true;
          } else {
            const errorData = await response.json();
            console.error("Failed to mark task complete:", errorData.message);
            toast.error(errorData.message || "حدث خطأ في إكمال المهمة");
            return false;
          }
        } catch (error) {
          console.error("Error marking task complete:", error);
          toast.error("حدث خطأ في الاتصال");
          return false;
        }
      },
      [
        isCampNotStarted,
        isReadOnly,
        studyHallSelectedDay,
        activeTab,
        studyHallSort,
      ]
    );

    // حفظ التدبر والفوائد
    const updateTaskBenefits = async (
      taskId,
      journalEntry,
      benefits,
      isPrivate = true,
      contentRich = null,
      proposedStep = null
    ) => {
      // منع حفظ الفوائد إذا كان المخيم منتهياً (read_only)
      if (isReadOnly) {
        toast.error(
          "لا يمكن إضافة ملاحظات أو فوائد في المخيمات المنتهية. يمكنك إكمال المهام فقط."
        );
        return false;
      }

      if (isCampNotStarted) {
        toast.error(
          "المخيم لم يبدأ بعد. يرجى الانتظار حتى يبدأ الادمن المخيم."
        );
        return false;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/quran-camps/tasks/${taskId}/benefits`,
          {
            method: "POST",
            headers: {
              "x-auth-token": `${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              journal_entry: journalEntry,
              benefits: benefits,
              content_rich: contentRich || journalEntry, // إرسال المحتوى الغني (JSON أولاً)
              is_private: isPrivate, // حالة الخصوصية
              proposed_step: proposedStep || null, // الخطوة العملية المقترحة
            }),
          }
        );

        if (response.ok) {
          // مسح الكاش لإعادة تحميل المحتوى الجديد
          clearStudyHallCache(studyHallSelectedDay);
          // إعادة جلب محتوى قاعة التدارس إذا كان التبويب مفتوح
          if (activeTab === "study") {
            await fetchStudyHallContent(
              studyHallSelectedDay,
              studyHallSort,
              1,
              20,
              true
            );
          }

          // عرض toast مع رابط إلى قاعة التدارس
          toast.success(
            (t) => (
              <div className="flex items-center justify-between gap-4">
                <span>تم حفظ التدبر والفوائد بنجاح! 📝</span>
                <button
                  onClick={() => {
                    setActiveTab("study");
                    toast.dismiss(t.id);
                  }}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap"
                >
                  عرض في قاعة التدارس
                </button>
              </div>
            ),
            {
              duration: 5000,
            }
          );
          return true;
        } else {
          const errorData = await response.json();
          console.error("Failed to update task benefits:", errorData.message);
          toast.error(errorData.message || "حدث خطأ في حفظ التدبر");
          return false;
        }
      } catch (error) {
        console.error("Error updating task benefits:", error);
        toast.error("حدث خطأ في الاتصال");
        return false;
      }
    };

    // دالة إرسال إشعار وإيميل عند انتهاء المخيم
    const sendCampFinishedNotification = async (campId, campName) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // التحقق من عدم إرسال الإشعار من قبل (باستخدام localStorage)
        const notificationKey = `camp-finished-notification-${campId}`;
        if (localStorage.getItem(notificationKey)) {
          return; // تم إرسال الإشعار من قبل
        }

        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/quran-camps/${campId}/notify-camp-finished`,
          {
            method: "POST",
            headers: {
              "x-auth-token": token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              campName: campName,
            }),
          }
        );

        if (response.ok) {
          // حفظ المفتاح في localStorage لمنع إرسال متعدد
          localStorage.setItem(notificationKey, "sent");
        }
      } catch (error) {
        console.error("Error sending camp finished notification:", error);
      }
    };

    // جلب البيانات عند تحميل المكون
    useEffect(() => {
      fetchUserProgress();
      checkCampCompletion();
    }, [camp.id, dailyTasks.length]);

    const checkCampCompletion = useCallback(async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/quran-camps/${
            camp?.share_link || camp?.id
          }/my-summary`,
          {
            headers: {
              "x-auth-token": token,
            },
          }
        );
        const data = await response.json();
        if (
          (data.success && data.data.daysCompleted === camp.duration_days) ||
          camp.status === "completed"
        ) {
          setIsCampCompleted(true);
        }
      } catch (error) {
        console.error("Error checking camp completion:", error);
      }
    }, [camp?.id]);
    // دالة التفعيل عند إكمال المخيم
    const markCampAsCompleted = async () => {
      setIsCampCompleted(true);
      setShowActionPlanModal(false);

      // جلب بيانات الملخص مباشرة
      try {
        setSummaryLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/quran-camps/${
            camp?.share_link || camp?.id
          }/my-summary`,
          {
            headers: {
              "x-auth-token": token,
            },
          }
        );
        const data = await response.json();

        if (data.success) {
          setSummaryData(data.data);
        }
      } catch (error) {
        console.error("Error fetching summary:", error);
      } finally {
        setSummaryLoading(false);
      }
    };

    // useEffect لجلب الملخص عند اكتمال المخيم
    useEffect(() => {
      const fetchSummary = async () => {
        if (!camp?.id || !isCampCompleted || summaryData) return;

        try {
          setSummaryLoading(true);
          const token = localStorage.getItem("token");
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/quran-camps/${
              camp?.share_link || camp?.id
            }/my-summary`,
            {
              headers: {
                "x-auth-token": token,
              },
            }
          );
          const data = await response.json();
          if (data.success) {
            setSummaryData(data.data);
          }
        } catch (error) {
          console.error("Error fetching summary:", error);
        } finally {
          setSummaryLoading(false);
        }
      };

      fetchSummary();
    }, [camp?.id, isCampCompleted, summaryData]);
    // دالة تحميل الصورة
    const handleDownloadImage = () => {
      if (summaryCardRef.current === null) {
        return;
      }
      toPng(summaryCardRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        width: summaryCardRef.current.offsetWidth,
        height: summaryCardRef.current.offsetHeight,
      })
        .then((dataUrl) => {
          const link = document.createElement("a");
          link.download = "my-camp-summary.png";
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.log(err);
          toast.error("حدث خطأ أثناء تحميل الصورة");
        });
    };

    // Initialize timer when task is selected
    useEffect(() => {
      if (selectedTask && selectedTask.estimated_time) {
        const timeInMinutes = parseTimeString(selectedTask.estimated_time);
        const timeInSeconds = timeInMinutes * 60;
        setTimeRemaining(timeInSeconds);
      }
    }, [selectedTask]);

    // Cleanup timer on component unmount
    useEffect(() => {
      return () => {
        if (timerInterval) {
          clearInterval(timerInterval);
        }
      };
    }, [timerInterval]);

    // جلب بيانات قاعة التدارس عند تغيير اليوم أو التبويب أو الفرز
    useEffect(() => {
      if (activeTab === "study") {
        fetchStudyHallContent(studyHallSelectedDay, studyHallSort, 1, 20, true);
      }
    }, [activeTab, studyHallSelectedDay, camp.id, studyHallSort]);
    // دالة جلب بيانات "سجلي"
    const fetchJournalData = useCallback(async () => {
      try {
        setJournalLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/quran-camps/${
            camp.id
          }/saved-reflections?sort=newest&limit=100`,
          {
            headers: {
              "x-auth-token": token,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();

          setJournalData({
            myReflections: data.data?.myReflections || [],
            savedReflections: data.data?.savedReflections || [],
            myActionPlan: data.data?.myActionPlan || null,
          });
        }
      } catch (error) {
        console.error("Error fetching journal:", error);
      } finally {
        setJournalLoading(false);
      }
    }, [camp?.id]);

    // جلب بيانات "سجلي" عند فتح التبويب
    useEffect(() => {
      if (activeTab === "my_journal" && camp?.id) {
        // إعادة جلب البيانات عند فتح التبويب لضمان تحديثها
        setJournalData({
          myReflections: [],
          savedReflections: [],
          myActionPlan: null,
        });
        fetchJournalData();
      }
    }, [activeTab, camp?.id]);

    // تحديث اليوم الحالي كل دقيقة
    useEffect(() => {
      const interval = setInterval(() => {
        const currentDay = getCurrentDay();
        if (currentDay !== selectedDay) {
          setSelectedDay(currentDay);
        }
      }, 60000); // كل دقيقة

      return () => clearInterval(interval);
    }, [selectedDay, camp.start_date, camp.duration_days]);

    // حفظ التبويب النشط في localStorage عند التغيير
    useEffect(() => {
      localStorage.setItem(`camp-${camp.id}-activeTab`, activeTab);
    }, [activeTab, camp.id]);

    // State for study hall content
    const [studyHallData, setStudyHallData] = useState([]);
    const [studyHallLoading, setStudyHallLoading] = useState(false);
    const [studyHallCache, setStudyHallCache] = useState({});
    const [expandedReflections, setExpandedReflections] = useState({}); // لتتبع النصوص الموسعة
    const [studyHallPagination, setStudyHallPagination] = useState({
      page: 1,
      limit: 20,
      total_items: 0,
      total_pages: 0,
      has_next: false,
      has_prev: false,
    });

    // State for journal data
    const [journalData, setJournalData] = useState({
      myReflections: [],
      savedReflections: [],
      myActionPlan: null,
    });
    const [journalLoading, setJournalLoading] = useState(false);
    const [expandedJournalItems, setExpandedJournalItems] = useState({}); // لتتبع النصوص الموسعة في السجل
    const [showShareMenu, setShowShareMenu] = useState({}); // لتتبع قائمة المشاركة لكل بطاقة
    const [showJournalMenu, setShowJournalMenu] = useState({}); // لتتبع قائمة التعديل والحذف لكل بطاقة في السجل
    const cardRefs = useRef({}); // Refs للبطاقات

    // إغلاق قائمة المشاركة عند النقر خارجها
    useEffect(() => {
      const handleClickOutside = (event) => {
        // التحقق من أن النقر لم يكن داخل أي قائمة مشاركة أو زر مشاركة
        if (
          !event.target.closest(".share-menu-popover") &&
          !event.target.closest('button[aria-label="مشاركة"]')
        ) {
          setShowShareMenu({});
        }
        // إغلاق قائمة التعديل والحذف عند النقر خارجها
        if (
          !event.target.closest(".journal-menu-popover") &&
          !event.target.closest('button[aria-label="خيارات السجل"]')
        ) {
          setShowJournalMenu({});
        }
      };

      if (
        Object.keys(showShareMenu).length > 0 ||
        Object.keys(showJournalMenu).length > 0
      ) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    }, [showShareMenu, showJournalMenu]);

    // تحسين الأداء: استخدام useMemo للبيانات المفلترة والمصنفة
    // هذا يحسن الأداء عن طريق تجنب إعادة حساب البيانات في كل render
    const filteredAndSortedData = useMemo(() => {
      if (!studyHallData.length) return [];

      // تطبيق الفلترة أولاً
      let filteredData = studyHallData;
      if (studyHallFilter === "my") {
        // عند الفلترة بـ "my"، استبعد التدبرات الشخصية (is_private = true)
        filteredData = studyHallData.filter((item) => {
          const isPrivate =
            item.is_private === true ||
            item.is_private === 1 ||
            item.is_private === "1";
          return item.is_own && !isPrivate;
        });
      } else if (studyHallFilter === "others") {
        // عند الفلترة بـ "others"، استبعد التدبرات الشخصية أيضاً
        filteredData = studyHallData.filter((item) => {
          const isPrivate =
            item.is_private === true ||
            item.is_private === 1 ||
            item.is_private === "1";
          return !item.is_own && !isPrivate;
        });
      } else {
        // عند الفلترة بـ "all"، استبعد جميع التدبرات الشخصية
        filteredData = studyHallData.filter((item) => {
          const isPrivate =
            item.is_private === true ||
            item.is_private === 1 ||
            item.is_private === "1";
          return !isPrivate;
        });
      }

      // تطبيق البحث مع تنظيف المدخلات
      if (studyHallSearch) {
        filteredData = filteredData.filter((item) => {
          const searchTerm = studyHallSearch.toLowerCase();
          return (
            item.content?.toLowerCase().includes(searchTerm) ||
            item.title?.toLowerCase().includes(searchTerm) ||
            item.userName?.toLowerCase().includes(searchTerm)
          );
        });
      }

      // دمج البيانات المتعلقة بنفس المهمة
      // هذا يمنع عرض نفس المهمة عدة مرات
      const groupedData = {};
      filteredData.forEach((item) => {
        const taskId = item.title?.split(":")[1]?.trim() || item.id;
        if (!groupedData[taskId]) {
          groupedData[taskId] = {
            ...item,
            reflectionText: item.type === "user_reflection" ? item.content : "",
            benefits:
              item.type === "user_benefits"
                ? item.content?.replace(/^الفوائد المستخرجة:\s*/g, "") || ""
                : "",
            totalPoints: item.points || 0,
          };
        } else {
          // دمج البيانات
          if (item.type === "user_reflection") {
            groupedData[taskId].reflectionText = item.content;
          }
          if (item.type === "user_benefits") {
            groupedData[taskId].benefits =
              item.content?.replace(/^الفوائد المستخرجة:\s*/g, "") || "";
          }
          groupedData[taskId].totalPoints += item.points || 0;
        }
      });

      // تطبيق الترتيب حسب الاختيار
      return Object.values(groupedData).sort((a, b) => {
        switch (studyHallSort) {
          case "newest":
            return (
              new Date(b.created_at || b.completed_at || 0) -
              new Date(a.created_at || a.completed_at || 0)
            );
          case "helpful":
            // الأكثر إفادة حسب عدد upvotes
            const aUpvotes = a.upvote_count || 0;
            const bUpvotes = b.upvote_count || 0;
            if (bUpvotes !== aUpvotes) {
              return bUpvotes - aUpvotes;
            }
            // في حالة التعادل، نرجع للأحدث
            return (
              new Date(b.created_at || b.completed_at || 0) -
              new Date(a.created_at || a.completed_at || 0)
            );
          case "saved":
            // الأكثر حفظًا حسب عدد saves
            const aSaves = a.save_count || 0;
            const bSaves = b.save_count || 0;
            if (bSaves !== aSaves) {
              return bSaves - aSaves;
            }
            // في حالة التعادل، نرجع للأحدث
            return (
              new Date(b.created_at || b.completed_at || 0) -
              new Date(a.created_at || a.completed_at || 0)
            );
          default:
            return (
              new Date(b.created_at || b.completed_at || 0) -
              new Date(a.created_at || a.completed_at || 0)
            );
        }
      });
    }, [studyHallData, studyHallFilter, studyHallSearch, studyHallSort]);

    // Fetch study hall content from API with pagination
    const fetchStudyHallContent = useCallback(
      async (
        day = studyHallSelectedDay,
        sort = studyHallSort,
        page = 1,
        limit = 20,
        resetCache = false
      ) => {
        // عند تغيير اليوم أو الترتيب، نعيد الصفحة إلى 1
        if (resetCache) {
          setStudyHallPagination((prev) => ({ ...prev, page: 1 }));
        }

        const cacheKey = `${camp.id}-${day}-${sort}-${page}-${limit}`;

        // تحقق من الكاش أولاً (فقط إذا لم يكن resetCache)
        if (!resetCache && studyHallCache[cacheKey]) {
          setStudyHallData(studyHallCache[cacheKey]);
          return;
        }

        try {
          setStudyHallLoading(true);
          const token = localStorage.getItem("token");
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/quran-camps/${
              camp.id
            }/study-hall?day=${day}&sort=${sort}&page=${page}&limit=${limit}`,
            {
              headers: {
                "x-auth-token": `${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const content = data.data.content || [];
            const pagination = data.data.pagination || {};

            // حفظ في الكاش (فقط للصفحة الأولى لكل يوم/ترتيب)
            if (page === 1) {
              setStudyHallCache((prev) => ({
                ...prev,
                [cacheKey]: content,
              }));
            }

            setStudyHallData(content);
            setStudyHallPagination({
              page: pagination.page || page,
              limit: pagination.limit || limit,
              total_items: pagination.total_items || 0,
              total_pages: pagination.total_pages || 0,
              has_next: pagination.has_next || false,
              has_prev: pagination.has_prev || false,
            });
          } else {
            console.error("Failed to fetch study hall content");
            toast.error("حدث خطأ في جلب محتوى قاعة التدارس");
          }
        } catch (error) {
          console.error("Error fetching study hall content:", error);
          toast.error("حدث خطأ في الاتصال");
        } finally {
          setStudyHallLoading(false);
        }
      },
      [camp.id, studyHallSelectedDay, studyHallSort, studyHallCache]
    );

    // دوال handlers للتصويت والحفظ
    const handleToggleUpvote = useCallback(
      async (progressId) => {
        // قفل ناعم: منع التفاعل إذا كان المخيم في وضع القراءة فقط
        if (isReadOnly) {
          toast.error("لا يمكن التفاعل مع محتوى المخيمات المنتهية.");
          return;
        }
        // 1. تحديث فوري (Optimistic Update) للـ UI
        setStudyHallData((prevData) =>
          prevData.map((item) => {
            if (item.progress_id === progressId) {
              const hasUpvoted = !item.is_upvoted_by_user;
              const currentCount = item.upvote_count ?? 0;
              const newUpvoteCount = hasUpvoted
                ? currentCount + 1
                : Math.max(0, currentCount - 1);
              return {
                ...item,
                is_upvoted_by_user: hasUpvoted ? 1 : 0,
                upvote_count: newUpvoteCount,
              };
            }
            return item;
          })
        );

        // تحديث journalData أيضًا
        setJournalData((prev) => ({
          ...prev,
          myReflections: prev.myReflections.map((item) => {
            if (item.progress_id === progressId) {
              const hasUpvoted = !item.is_upvoted_by_user;
              const currentCount = item.upvote_count ?? 0;
              return {
                ...item,
                is_upvoted_by_user: hasUpvoted ? 1 : 0,
                upvote_count: hasUpvoted
                  ? currentCount + 1
                  : Math.max(0, currentCount - 1),
              };
            }
            return item;
          }),
          savedReflections: prev.savedReflections.map((item) => {
            if (item.progress_id === progressId) {
              const hasUpvoted = !item.is_upvoted_by_user;
              const currentCount = item.upvote_count ?? 0;
              return {
                ...item,
                is_upvoted_by_user: hasUpvoted ? 1 : 0,
                upvote_count: hasUpvoted
                  ? currentCount + 1
                  : Math.max(0, currentCount - 1),
              };
            }
            return item;
          }),
        }));

        // 2. إرسال الطلب للـ Backend
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            `${
              import.meta.env.VITE_API_URL
            }/quran-camps/reflections/${progressId}/toggle-upvote`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-auth-token": token,
              },
            }
          );

          if (!response.ok) {
            // في حالة الفشل، إعادة تعيين القيم
            setStudyHallData((prevData) =>
              prevData.map((item) => {
                if (item.progress_id === progressId) {
                  const hasUpvoted = !item.is_upvoted_by_user;
                  const currentCount = item.upvote_count ?? 0;
                  const newUpvoteCount = hasUpvoted
                    ? Math.max(0, currentCount - 1)
                    : currentCount + 1;
                  return {
                    ...item,
                    is_upvoted_by_user: hasUpvoted ? 0 : 1,
                    upvote_count: newUpvoteCount,
                  };
                }
                return item;
              })
            );
            toast.error("حدث خطأ في التصويت");
          }
        } catch (error) {
          console.error("Upvote failed:", error);
          toast.error("حدث خطأ في التصويت");
        }
      },
      [camp?.id]
    );

    // دالة الالتزام بخطوة مشتركة
    const handlePledgeToJointStep = useCallback(
      async (progressId) => {
        if (isReadOnly || isCampNotStarted) {
          toast.error("لا يمكن الالتزام بالخطوة في هذا الوقت");
          return;
        }

        if (pledgingProgressId === progressId) {
          return; // منع الطلبات المتكررة
        }

        setPledgingProgressId(progressId);

        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            `${
              import.meta.env.VITE_API_URL
            }/quran-camps/progress/${progressId}/pledge`,
            {
              method: "POST",
              headers: {
                "x-auth-token": `${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          const data = await response.json();

          if (response.ok && data.success) {
            // تحديث حالة الالتزام
            setPledgedSteps((prev) => new Set([...prev, progressId]));

            // تحديث فوري (Optimistic Update) للـ UI
            setStudyHallData((prevData) => {
              const updated = prevData.map((item) => {
                if (item.progress_id === progressId) {
                  const currentCount =
                    item.pledge_count !== undefined &&
                    item.pledge_count !== null
                      ? item.pledge_count
                      : 0;
                  return {
                    ...item,
                    is_pledged_by_user: 1,
                    pledge_count: currentCount + 1,
                  };
                }
                return item;
              });
              return updated;
            });

            // تحديث journalData أيضًا
            setJournalData((prev) => ({
              ...prev,
              savedReflections: prev.savedReflections.map((item) => {
                if (item.progress_id === progressId) {
                  return {
                    ...item,
                    is_pledged_by_user: 1,
                    pledge_count:
                      (item.pledge_count !== undefined &&
                      item.pledge_count !== null
                        ? item.pledge_count
                        : 0) + 1,
                  };
                }
                return item;
              }),
            }));

            // إظهار رسالة متحركة فوق الزر
            setShowPledgeTooltip((prev) => ({
              ...prev,
              [progressId]: true,
            }));

            // إخفاء الرسالة بعد 3 ثوان
            setTimeout(() => {
              setShowPledgeTooltip((prev) => ({
                ...prev,
                [progressId]: false,
              }));
            }, 3000);

            toast.success("تم الالتزام بنجاح! 🎉", {
              duration: 3000,
              position: "top-center",
            });

            // إعادة جلب محتوى قاعة التدارس لتحديث البيانات بعد تأخير
            // للتأكد من أن السيرفر قد حدث البيانات في قاعدة البيانات
            // نستخدم تأخير 1.5 ثانية لضمان تحديث البيانات
            setTimeout(async () => {
              await fetchStudyHallContent(
                studyHallSelectedDay,
                studyHallSort,
                studyHallPagination.page,
                20,
                false
              );
            }, 1500);
          } else {
            toast.error(data.message || "حدث خطأ أثناء الالتزام", {
              duration: 3000,
              position: "top-center",
            });
          }
        } catch (error) {
          console.error("Error pledging to joint step:", error);
          toast.error("حدث خطأ أثناء الالتزام. يرجى المحاولة مرة أخرى.", {
            duration: 3000,
            position: "top-center",
          });
        } finally {
          setPledgingProgressId(null);
        }
      },
      [camp?.id]
    );

    const handleToggleSave = useCallback(
      async (progressId) => {
        // قفل ناعم: منع التفاعل إذا كان المخيم في وضع القراءة فقط
        if (isReadOnly) {
          toast.error("لا يمكن التفاعل مع محتوى المخيمات المنتهية.");
          return;
        }
        // 1. تحديث فوري (Optimistic Update) للـ UI
        setStudyHallData((prevData) =>
          prevData.map((item) => {
            if (item.progress_id === progressId) {
              const hasSaved = !item.is_saved_by_user;
              const currentCount = item.save_count ?? 0;
              const newSaveCount = hasSaved
                ? currentCount + 1
                : Math.max(0, currentCount - 1);
              return {
                ...item,
                is_saved_by_user: hasSaved ? 1 : 0,
                save_count: newSaveCount,
              };
            }
            return item;
          })
        );

        // تحديث journalData أيضًا
        setJournalData((prev) => ({
          ...prev,
          myReflections: prev.myReflections.map((item) => {
            if (item.progress_id === progressId) {
              const hasSaved = !item.is_saved_by_user;
              const currentCount = item.save_count ?? 0;
              return {
                ...item,
                is_saved_by_user: hasSaved ? 1 : 0,
                save_count: hasSaved
                  ? currentCount + 1
                  : Math.max(0, currentCount - 1),
              };
            }
            return item;
          }),
          savedReflections: prev.savedReflections.map((item) => {
            if (item.progress_id === progressId) {
              const hasSaved = !item.is_saved_by_user;
              const currentCount = item.save_count ?? 0;
              return {
                ...item,
                is_saved_by_user: hasSaved ? 1 : 0,
                save_count: hasSaved
                  ? currentCount + 1
                  : Math.max(0, currentCount - 1),
              };
            }
            return item;
          }),
        }));

        // 2. إرسال الطلب للـ Backend
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            `${
              import.meta.env.VITE_API_URL
            }/quran-camps/reflections/${progressId}/toggle-save`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-auth-token": token,
              },
            }
          );

          if (!response.ok) {
            // في حالة الفشل، إعادة تعيين القيم
            setStudyHallData((prevData) =>
              prevData.map((item) => {
                if (item.progress_id === progressId) {
                  const hasSaved = !item.is_saved_by_user;
                  const currentCount = item.save_count ?? 0;
                  const newSaveCount = hasSaved
                    ? Math.max(0, currentCount - 1)
                    : currentCount + 1;
                  return {
                    ...item,
                    is_saved_by_user: hasSaved ? 0 : 1,
                    save_count: newSaveCount,
                  };
                }
                return item;
              })
            );
            toast.error("حدث خطأ في الحفظ");
          }
        } catch (error) {
          console.error("Save failed:", error);
          toast.error("حدث خطأ في الحفظ");
        }
      },
      [camp?.id]
    );

    // دالة فتح مودال الحذف
    const openDeleteModal = (progressId) => {
      setReflectionToDelete(progressId);
      setShowDeleteModal(true);
    };

    // دالة حذف التدبر
    const handleDeleteReflection = async () => {
      if (!reflectionToDelete) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/quran-camps/reflections/${reflectionToDelete}/delete`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token,
            },
          }
        );

        if (response.ok) {
          // إزالة التدبر من القائمة
          setStudyHallData((prevData) =>
            prevData.filter((item) => item.progress_id !== reflectionToDelete)
          );
          toast.success("تم حذف التدبر بنجاح");
          // إغلاق المودال وإعادة تعيين الحالة
          setShowDeleteModal(false);
          setReflectionToDelete(null);
        } else {
          const data = await response.json();
          toast.error(data.message || "حدث خطأ في حذف التدبر");
        }
      } catch (error) {
        console.error("Delete failed:", error);
        toast.error("حدث خطأ في حذف التدبر");
      }
    };

    // دالة حذف الفائدة من سجلي مع خصم 3 نقاط
    const handleDeleteJournalReflection = async (progressId) => {
      if (!progressId) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/quran-camps/reflections/${progressId}/delete`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token,
            },
          }
        );

        if (response.ok) {
          // إزالة الفائدة من journalData
          setJournalData((prev) => ({
            ...prev,
            myReflections: prev.myReflections.filter(
              (item) => item.progress_id !== progressId
            ),
          }));

          // إعادة جلب بيانات التقدم لتحديث النقاط
          await fetchUserProgress();

          toast.success("تم حذف الفائدة بنجاح (تم خصم 3 نقاط)");
          setShowDeleteModal(false);
          setReflectionToDelete(null);
        } else {
          const data = await response.json();
          toast.error(data.message || "حدث خطأ في حذف الفائدة");
        }
      } catch (error) {
        console.error("Delete journal reflection failed:", error);
        toast.error("حدث خطأ في حذف الفائدة");
      }
    };

    // دالة تعديل الفائدة من سجلي
    const handleEditJournalReflection = (item) => {
      // البحث عن المهمة المرتبطة بهذه الفائدة
      // نستخدم day_number و task_title و task_type للبحث لأن item.id هو progress_id وليس task.id
      const task = userProgress?.tasks?.find(
        (t) =>
          t.day_number === item.day_number &&
          t.title === item.task_title &&
          (item.task_type ? t.task_type === item.task_type : true)
      );

      if (!task) {
        toast.error("لم يتم العثور على المهمة المرتبطة بهذه الفائدة");
        return;
      }

      // تعيين المهمة والفائدة الحالية
      const taskWithPath = {
        ...task,
        path:
          task.path || buildTaskPath(task, taskGroups || [], item.day_number),
      };

      setSelectedTask(taskWithPath);
      setReflectionText(item.journal_entry || "");
      setReflectionJson(item.content_rich || null);
      setProposedStep(item.proposed_step || "");
      setShareInStudyHall(!item.is_private);
      setReflectionToEdit(item.progress_id); // تتبع أن هذا تعديل
      setActiveTaskTab("reflection");
      setShowReflectionModal(true);
    };

    // الدالة الشاملة لإكمال المهمة مع حفظ التدبر والفوائد
    const handleSubmitTask = async (task) => {
      setIsCompleting(true);

      try {
        // --- الخطوة 1: حفظ الفوائد والتدبرات ---
        if (reflectionText.trim() !== "") {
          await updateTaskBenefits(
            task.id,
            reflectionText.trim(),
            "",
            !shareInStudyHall,
            reflectionJson,
            proposedStep || null // proposed_step
          );
        }

        // --- الخطوة 2: إكمال المهمة ---
        await markTaskComplete(task.id);

        // --- الخطوة 3: النجاح (إغلاق وتحديث) ---
        setIsCompleting(false);
        setShowReflectionModal(false);
        setReflectionText("");
        setReflectionJson(null);
        setProposedStep("");
        setShareInStudyHall(false);

        // إعادة جلب بيانات التقدم
        await fetchUserProgress();
      } catch (error) {
        console.error("Failed to complete task:", error);
        toast.error("حدث خطأ أثناء إكمال المهمة. يرجى المحاولة مرة أخرى.");
        setIsCompleting(false);
      }
    };

    // الدالة الشاملة الجديدة لإكمال المهمة وحفظ الفوائد
    const handleCompleteAndSave = async () => {
      // السماح بالإكمال بعد انتهاء المخيم؛ سيتم منع النقاط/التفاعل عبر isReadOnly

      // منع إكمال المهام إذا كان المخيم لم يبدأ بعد
      if (isCampNotStarted) {
        toast.error(
          "المخيم لم يبدأ بعد. يرجى الانتظار حتى يبدأ الادمن المخيم."
        );
        return;
      }
      if (isCompleting) return;
      setIsCompleting(true);

      try {
        // التحقق إذا كان هذا تعديلاً
        const isEdit = reflectionToEdit !== null;

        // الخطوة 1: حفظ/تحديث الفائدة فقط إذا لم يكن في وضع القراءة فقط
        if (!isReadOnly && reflectionText.trim() !== "") {
          await updateTaskBenefits(
            selectedTask.id,
            reflectionText.trim(),
            "",
            !shareInStudyHall,
            reflectionJson,
            proposedStep || null // proposed_step
          );
        }

        // الخطوة 2: إكمال المهمة (فقط إذا لم يكن تعديلاً)
        if (!isEdit) {
          await markTaskComplete(selectedTask.id);
        }

        // الخطوة 3: تحديث journalData إذا كان تعديلاً
        if (isEdit) {
          await fetchJournalData();
          toast.success("تم تحديث الفائدة بنجاح! ✅");
        }

        // الخطوة 4: إغلاق وتحديث
        setShowReflectionModal(false);
        setActiveTaskTab("task");
        setReflectionText("");
        setReflectionJson(null);
        setProposedStep("");
        setShareInStudyHall(false);
        setReflectionToEdit(null); // إعادة تعيين حالة التعديل
        await fetchUserProgress();
      } catch (error) {
        console.error("Failed to complete and save:", error);
        toast.error("حدث خطأ، يرجى المحاولة مرة أخرى.");
      } finally {
        setIsCompleting(false);
      }
    };

    // دالة لمسح الكاش عند الحاجة (مثل عند إضافة محتوى جديد)
    const clearStudyHallCache = (day = null) => {
      if (day) {
        // مسح كاش يوم محدد
        setStudyHallCache((prev) => {
          const newCache = { ...prev };
          delete newCache[`${camp.id}-${day}`];
          return newCache;
        });
      } else {
        // مسح كل الكاش
        setStudyHallCache({});
      }
    };

    // بانرات الحالة (انضمام متأخر / قراءة فقط)
    const Banners = () => (
      <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4">
        {joinedLate && !isReadOnly && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-800 px-4 py-3 flex items-center justify-between">
            <div className="text-sm sm:text-base font-medium">
              لقد انضممت متأخرًا. لديك {missedDaysCount} يوم/أيام فائتة من
              المخيم إستعن بالله.
            </div>
          </div>
        )}
        {isReadOnly &&
          !(
            userProgress?.tasks?.length > 0 &&
            userProgress.tasks.every((t) => t.completed)
          ) && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 text-gray-800 px-4 py-3 text-sm sm:text-base">
              هذا المخيم منتهي. يمكنك إكمال المهام للتتبع الشخصي فقط بدون نقاط
              أو تفاعل اجتماعي.
            </div>
          )}
      </div>
    );

    const tabs = useMemo(
      () => [
        { id: "journey", label: "خريطة الرحلة", icon: MapPin },
        { id: "tasks", label: "المهام اليومية", icon: CheckCircle },
        // Study hall only when enabled
        ...(camp?.enable_study_hall
          ? [{ id: "study", label: "قاعة التدارس", icon: BookOpen }]
          : []),
        {
          id: "resources",
          label: "مصادر الدراسة",
          icon: BookOpen,
          badge: resources?.length || 0,
        },
        {
          id: "qanda",
          label: "اسأل وأجب",
          icon: MessageSquare,
          badge: qanda?.length || 0,
        },
        { id: "my_journal", label: "سجلي", icon: FileText },
        { id: "friends", label: "الصحبة", icon: Users },
      ],
      [camp?.status, camp?.enable_study_hall, resources, qanda]
    );

    // حساب اليوم الحالي باستخدام useMemo لتجنب إعادة الحساب في كل render
    const currentDay = useMemo(() => {
      if (!camp || !camp.start_date) return 1;
      const startDate = new Date(camp.start_date);
      startDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = today - startDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(1, Math.min(diffDays, camp.duration_days || 1));
    }, [camp]);

    // استخدام useCallback لتجنب إعادة إنشاء الدوال في كل render
    const getDayStatus = useCallback(
      (dayNumber) => {
        if (!userProgress) return "locked";

        // جلب مهام اليوم
        const dayTasks = userProgress.tasks.filter(
          (task) => task.day_number === dayNumber
        );

        // إذا لم يكن هناك مهام، فاليوم مغلق
        if (dayTasks.length === 0) {
          if (dayNumber <= currentDay) return "incomplete";
          return "locked";
        }

        // التحقق من إكمال جميع المهام
        const completedDayTasks = dayTasks.filter((task) => task.completed);
        const allTasksCompleted =
          dayTasks.length > 0 && completedDayTasks.length === dayTasks.length;

        // إذا كانت جميع المهام مكتملة، فاليوم مكتمل (حتى لو كان اليوم الحالي)
        if (allTasksCompleted) {
          return "completed";
        }

        // إذا كان اليوم الحالي ولم تكتمل جميع المهام بعد
        if (dayNumber === currentDay) {
          return "active";
        }

        // الأيام السابقة التي لم تكتمل بعد
        if (dayNumber < currentDay) {
          return "incomplete";
        }

        // الأيام المستقبلية مغلقة
        return "locked";
      },
      [userProgress, currentDay]
    );

    // التحقق من إكمال جميع مهام يوم محدد
    const isDayTasksCompleted = useCallback(
      (dayNumber) => {
        if (!userProgress || !userProgress.tasks) return false;

        const dayTasks = userProgress.tasks.filter(
          (task) => task.day_number === dayNumber
        );

        if (dayTasks.length === 0) return false;

        const completedTasks = dayTasks.filter((task) => task.completed);
        return completedTasks.length === dayTasks.length;
      },
      [userProgress]
    );

    const getTrophyColor = (index) => {
      switch (index) {
        case 0:
          return "text-yellow-500";
        case 1:
          return "text-gray-400";
        case 2:
          return "text-yellow-700";
        default:
          return "text-gray-500";
      }
    };
    return (
      <div className="max-w-7xl mx-auto relative">
        {/* ----- زر الملخص للمخيم المنتهي (الهوية البصرية) ----- */}
        {/* ----- الواجهة العادية للمخيم ----- */}
        <>
          {/* Welcome Header with Leave Camp Button */}
          <div className="relative mb-4 sm:mb-6 lg:mb-8">
            {/* أزرار الإعدادات وترك المخيم في الزاوية اليمنى العلوية */}
            {/* أزرار الإعدادات وترك المخيم - تصميم متجاوب */}
            <div className="flex justify-end gap-2 mb-4 sm:mb-6 flex-wrap">
              {(isCampFinished || isCampCompleted) && camp && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full sm:w-auto"
                >
                  <Link
                    to={`/camp-summary/${camp.id}`}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-[#7440E9] text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl font-semibold flex items-center justify-center gap-2 transition-all transform active:scale-95 sm:hover:scale-105 backdrop-blur-sm border border-white/20 text-sm sm:text-base"
                  >
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">عرض ملخص إنجازك</span>
                    <span className="sm:hidden">الملخص</span>
                  </Link>
                </motion.div>
              )}
              {/* زر إعدادات المخيم */}
              <button
                type="button"
                onClick={() => setShowCampSettings(true)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 bg-[#7440E9] text-white rounded-lg sm:rounded-xl hover:bg-[#5a2fc7] transition-all font-medium flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg hover:shadow-xl transform active:scale-95 sm:hover:scale-105 duration-200"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">إعدادات المخيم</span>
                <span className="sm:hidden">الإعدادات</span>
              </button>
            </div>

            {/* Welcome Header */}
            <div className="text-center px-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-3 sm:mb-4 lg:mb-6 leading-tight">
                مرحباً بك في رحلة {camp.name}
              </h2>
              <p className="text-sm sm:text-base lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                استعد لرحلة تحويلية مع سورة {camp.surah_name} -{" "}
                {camp.duration_days} أيام من التعلم المكثف
              </p>
            </div>
          </div>

          {/* Progress Overview */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100 animate-pulse"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-lg sm:rounded-xl mx-auto mb-2 sm:mb-3 lg:mb-4"></div>
                  <div className="h-6 sm:h-7 lg:h-8 bg-gray-200 rounded mb-1 sm:mb-2"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100 text-center"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-[#7440E9] rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1">
                  اليوم {campDay}
                </div>
                <div className="text-xs sm:text-sm lg:text-base text-gray-600">
                  من {camp.duration_days}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100 text-center"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-yellow-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1">
                  {userProgress?.enrollment?.total_points || 0}
                </div>
                <div className="text-xs sm:text-sm lg:text-base text-gray-600">
                  نقطة مكتسبة
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100 text-center"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1">
                  {userProgress?.progress?.completedTasks || 0}
                </div>
                <div className="text-xs sm:text-sm lg:text-base text-gray-600">
                  مهمة مكتملة
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100 text-center"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1">
                  {userProgress?.enrollment?.current_streak ||
                    userProgress?.enrollment?.streak ||
                    0}
                </div>
                <div className="text-xs sm:text-sm lg:text-base text-gray-600">
                  يوم متتالي
                </div>
              </motion.div>
            </div>
          )}

          {/* Banners */}
          <Banners />

          {/* Tabs Navigation */}
          {/* Mobile: Grid Layout, Desktop: Horizontal Tabs */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-1.5 lg:p-2 shadow-lg border border-gray-100 mb-3 sm:mb-4 lg:mb-8">
            {/* Mobile Grid Layout */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:hidden gap-1.5 sm:gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === "study") {
                      handleOnboarding("studyHall", setShowStudyHallIntro, () =>
                        setActiveTab("study")
                      );
                    } else if (tab.id === "my_journal") {
                      handleOnboarding("journal", setShowJournalIntro, () =>
                        setActiveTab("my_journal")
                      );
                    } else {
                      setActiveTab(tab.id);
                    }
                  }}
                  className={`flex focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 flex-col items-center justify-center p-2 sm:p-2.5 rounded-lg font-medium transition-all duration-300 active:scale-95 relative ${
                    activeTab === tab.id
                      ? "text-[#7440E9] bg-[#7440E9]/10 shadow-sm"
                      : "text-gray-600 active:text-gray-800 active:bg-gray-50"
                  }`}
                >
                  <div className="relative">
                    <tab.icon className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0 mb-1" />
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#7440E9] text-white text-[10px] rounded-full font-semibold flex items-center justify-center border-2 border-white">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs text-center leading-tight mt-0.5 line-clamp-2">
                    {tab.label}
                  </span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-[#7440E9] rounded-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Desktop Horizontal Tabs */}
            <div className="hidden lg:flex space-x-1 relative overflow-x-auto scrollbar-hide pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === "study") {
                      handleOnboarding("studyHall", setShowStudyHallIntro, () =>
                        setActiveTab("study")
                      );
                    } else if (tab.id === "my_journal") {
                      handleOnboarding("journal", setShowJournalIntro, () =>
                        setActiveTab("my_journal")
                      );
                    } else {
                      setActiveTab(tab.id);
                    }
                  }}
                  className={`flex-1 min-w-fit focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 flex items-center justify-center px-3 lg:px-3 py-2.5 lg:py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap active:scale-95 ${
                    activeTab === tab.id
                      ? "text-[#7440E9] bg-[#7440E9]/10 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <tab.icon className="w-5 lg:w-5 mr-1.5 lg:mr-2 flex-shrink-0" />
                  <span className="text-sm xl:text-base truncate">
                    {tab.label}
                  </span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="mr-1 px-1.5 py-0.5 bg-[#7440E9] text-white text-xs rounded-full font-semibold min-w-[18px] text-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="relative">
            {/* Journey Tab */}
            <motion.div
              key="journey"
              initial={false}
              animate={{
                opacity: activeTab === "journey" ? 1 : 0,
                display: activeTab === "journey" ? "block" : "none",
              }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100"
              style={{
                position: activeTab === "journey" ? "relative" : "absolute",
                width: "100%",
                pointerEvents: activeTab === "journey" ? "auto" : "none",
              }}
            >
              {/* رسالة توضيحية للمخيم الذي لم يبدأ بعد */}
              {isCampNotStarted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500 rounded-xl shadow-md"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Clock3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base sm:text-lg font-bold text-blue-900 mb-1">
                        ⏳ المخيم لم يبدأ بعد
                      </h4>
                      <p className="text-sm sm:text-base text-blue-800 leading-relaxed">
                        عذراً، المخيم في حالة التسجيل المبكر. لا يمكنك فتح
                        المهام أو إكمالها حتى يبدأ الادمن المخيم. سيتم إشعارك
                        عند بدء المخيم عبر البريد الإلكتروني والإشعارات.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
              <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 lg:mb-6 text-center px-2">
                خريطة رحلتك
              </h3>

              {/* Journey Map - Grid Layout with connecting lines */}
              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 lg:gap-4 xl:gap-6 px-2 sm:px-0">
                {Array.from({ length: camp.duration_days }, (_, index) => {
                  const dayNumber = index + 1;
                  const status = getDayStatus(dayNumber);
                  const isActive = dayNumber === selectedDay;
                  const isLastDay = dayNumber === camp.duration_days;
                  const nextDayStatus = !isLastDay
                    ? getDayStatus(dayNumber + 1)
                    : null;

                  return (
                    <React.Fragment key={dayNumber}>
                      <motion.div
                        className="flex flex-col items-center"
                        whileHover={status !== "locked" ? { scale: 1.05 } : {}}
                      >
                        {/* Station */}
                        <motion.div
                          style={{
                            backgroundImage: `url(/assets/tent.jpg)`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                          }}
                          animate={
                            celebratingDay === dayNumber &&
                            status === "completed"
                              ? {
                                  scale: [1, 1.15, 1],
                                  boxShadow: [
                                    "0 0 0 0 rgba(34, 197, 94, 0.4)",
                                    "0 0 0 20px rgba(34, 197, 94, 0)",
                                    "0 0 0 0 rgba(34, 197, 94, 0)",
                                  ],
                                }
                              : {}
                          }
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                          }}
                          whileTap={
                            status !== "locked" && !isCampNotStarted
                              ? { scale: 0.95 }
                              : {}
                          }
                          onClick={() => {
                            if (status !== "locked" && !isCampNotStarted) {
                              if (isLastDay) {
                                // اليوم الأخير -> فتح السايد بار مع المهام + الخطة التطبيقية
                                setSelectedDay(dayNumber);
                                setShowTaskSidebar(true);
                              } else {
                                // يوم عادي -> Onboarding المهام
                                handleOnboarding(
                                  "taskModal",
                                  setShowTaskModalIntro,
                                  () => {
                                    setSelectedDay(dayNumber);
                                    setShowTaskSidebar(true);
                                  }
                                );
                              }
                            }
                          }}
                          title={
                            status !== "locked"
                              ? `اليوم ${dayNumber}: ${
                                  getDayTheme(
                                    dayNumber,
                                    userProgress?.tasks,
                                    taskGroups
                                  ) || "مهام اليوم"
                                }`
                              : `اليوم ${dayNumber}: مغلق`
                          }
                          className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                            isCampNotStarted
                              ? "opacity-70 cursor-not-allowed grayscale"
                              : status === "completed"
                              ? "shadow-lg border-2 border-green-500"
                              : status === "active"
                              ? `shadow-xl shadow-purple-500/50 ${
                                  isActive
                                    ? "ring-4 ring-purple-300"
                                    : "ring-2 ring-purple-300"
                                }`
                              : status === "incomplete"
                              ? "shadow-lg border-2 border-orange-500"
                              : "opacity-50 cursor-not-allowed grayscale"
                          } ${
                            isActive && status !== "active"
                              ? "ring-2 sm:ring-4 ring-purple-200 shadow-xl"
                              : ""
                          }`}
                        >
                          {/* Day Number Badge */}
                          <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center z-10">
                            <span className="text-[10px] sm:text-xs font-bold text-gray-700">
                              {dayNumber}
                            </span>
                          </div>

                          {/* Completion Counter Badge */}
                          {completionStats.dayStats[dayNumber] > 0 && (
                            <span
                              className={`absolute -bottom-1 -left-1 flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full text-[8px] sm:text-[10px] md:text-xs font-bold text-white shadow-lg z-10 ${
                                status === "active"
                                  ? "bg-purple-600"
                                  : status === "completed"
                                  ? "bg-green-600"
                                  : "bg-gray-400"
                              }`}
                            >
                              <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                              <span className="mr-0.5 sm:mr-1">
                                {completionStats.dayStats[dayNumber]}
                              </span>
                            </span>
                          )}

                          {/* Checkmark for completed status */}
                          {status === "completed" && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500/80 backdrop-blur-sm rounded-full p-1 sm:p-1.5 z-10">
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </div>
                          )}
                        </motion.div>

                        {/* Day Label with Theme */}
                        <div className="mt-2 sm:mt-2 text-center">
                          <span
                            className={`font-bold text-xs sm:text-sm block ${
                              status === "locked"
                                ? "text-gray-500"
                                : "text-gray-800"
                            }`}
                          >
                            اليوم {dayNumber}
                          </span>
                          {status !== "locked" ? (
                            <p className="text-[10px] sm:text-xs text-purple-600 font-medium mt-0.5">
                              {getDayTheme(
                                dayNumber,
                                userProgress?.tasks,
                                taskGroups
                              ) || "مهام اليوم"}
                            </p>
                          ) : (
                            // Show teaser for locked days
                            (() => {
                              const lockedTheme = getLockedDayTheme(
                                dayNumber,
                                taskGroups,
                                dailyTasks
                              );
                              return lockedTheme ? (
                                <p className="text-[9px] sm:text-[10px] text-gray-400 italic mt-0.5 line-clamp-1">
                                  {lockedTheme}
                                </p>
                              ) : null;
                            })()
                          )}
                        </div>
                      </motion.div>

                      {/* Connecting Line */}
                      {!isLastDay && (
                        <motion.button
                          onClick={() => {
                            if (
                              nextDayStatus !== "locked" &&
                              !isCampNotStarted
                            ) {
                              const nextDay = dayNumber + 1;
                              const isLastDayNext =
                                nextDay === camp.duration_days;
                              if (isLastDayNext) {
                                setSelectedDay(nextDay);
                                setShowTaskSidebar(true);
                              } else {
                                handleOnboarding(
                                  "taskModal",
                                  setShowTaskModalIntro,
                                  () => {
                                    setSelectedDay(nextDay);
                                    setShowTaskSidebar(true);
                                  }
                                );
                              }
                            }
                          }}
                          disabled={
                            nextDayStatus === "locked" || isCampNotStarted
                          }
                          className={`flex-shrink-0 h-1 sm:h-1.5 md:h-2 w-8 sm:w-12 md:w-16 lg:w-20 xl:w-24 rounded-full transition-all duration-300 ${
                            isCampNotStarted
                              ? "bg-gray-300 cursor-not-allowed opacity-50"
                              : status === "completed" &&
                                nextDayStatus !== "locked"
                              ? "bg-green-400 active:bg-green-500 sm:hover:bg-green-500 cursor-pointer"
                              : status === "active" &&
                                nextDayStatus !== "locked"
                              ? "bg-purple-400 active:bg-purple-500 sm:hover:bg-purple-500 cursor-pointer animate-pulse"
                              : status === "incomplete" &&
                                nextDayStatus !== "locked"
                              ? "bg-orange-400 active:bg-orange-500 sm:hover:bg-orange-500 cursor-pointer"
                              : "bg-gray-200 cursor-not-allowed"
                          } ${
                            (dayNumber === selectedDay ||
                              dayNumber + 1 === selectedDay) &&
                            nextDayStatus !== "locked"
                              ? "ring-2 ring-purple-200 shadow-md"
                              : ""
                          }`}
                          title={
                            nextDayStatus !== "locked"
                              ? `الانتقال إلى اليوم ${dayNumber + 1}`
                              : `اليوم ${dayNumber + 1} مغلق`
                          }
                          whileHover={
                            nextDayStatus !== "locked" && !isCampNotStarted
                              ? { scaleY: 1.5 }
                              : {}
                          }
                          whileTap={
                            nextDayStatus !== "locked" && !isCampNotStarted
                              ? { scaleY: 0.8 }
                              : {}
                          }
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="mt-4 sm:mt-6 lg:mt-8 text-center px-2">
                <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm lg:text-base">
                  اضغط على أي محطة لعرض مهام ذلك اليوم
                </p>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 xl:gap-6 text-[10px] sm:text-xs lg:text-sm">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded-full"></div>
                    <span className="text-gray-600">مستقبلي</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#7440E9] rounded-full animate-pulse"></div>
                    <span className="text-gray-600">اليوم الحالي</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-600">غير مكتمل</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">مكتمل</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tasks Tab */}
            <motion.div
              key="tasks"
              initial={false}
              animate={{
                opacity: activeTab === "tasks" ? 1 : 0,
                display: activeTab === "tasks" ? "block" : "none",
              }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100"
              style={{
                position: activeTab === "tasks" ? "relative" : "absolute",
                width: "100%",
                pointerEvents: activeTab === "tasks" ? "auto" : "none",
              }}
            >
              <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 lg:mb-6 text-center px-2">
                مهام اليوم {selectedDay}
              </h3>

              {/* رسالة توضيحية للمخيم الذي لم يبدأ بعد */}
              {isCampNotStarted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500 rounded-xl shadow-md"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Clock3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base sm:text-lg font-bold text-blue-900 mb-1">
                        ⏳ المخيم لم يبدأ بعد
                      </h4>
                      <p className="text-sm sm:text-base text-blue-800 leading-relaxed">
                        عذراً، المخيم في حالة التسجيل المبكر. لا يمكنك فتح
                        المهام أو إكمالها حتى يبدأ الادمن المخيم. سيتم إشعارك
                        عند بدء المخيم عبر البريد الإلكتروني والإشعارات.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, index) => (
                    <TaskCardSkeleton key={index} index={index} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {(() => {
                    const dayTasks =
                      userProgress?.tasks?.filter(
                        (task) => task.day_number === selectedDay
                      ) || [];
                    const { groupedTasks, ungroupedTasks } = groupTasksByGroups(
                      dayTasks,
                      taskGroups || []
                    );

                    return (
                      <>
                        {/* Display grouped tasks */}
                        {Object.keys(groupedTasks)
                          .sort((a, b) => {
                            const groupA = groupedTasks[a].group;
                            const groupB = groupedTasks[b].group;
                            return (
                              (groupA?.order_in_camp || 0) -
                              (groupB?.order_in_camp || 0)
                            );
                          })
                          .map((groupId) => {
                            const { group, tasks } = groupedTasks[groupId];
                            if (!group) return null;

                            return (
                              <div key={groupId} className="mb-6">
                                {/* Group Header - Clickable */}
                                <button
                                  onClick={() => {
                                    setExpandedGroups((prev) => ({
                                      ...prev,
                                      [groupId]:
                                        prev[groupId] === undefined
                                          ? false
                                          : !prev[groupId],
                                    }));
                                  }}
                                  className="w-full mb-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-r-4 border-purple-500 hover:from-purple-100 hover:to-indigo-100 transition-all duration-200 group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#7440E9] rounded-lg flex items-center justify-center flex-shrink-0">
                                      <FileText className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0 text-right">
                                      <div className="flex items-center gap-2 justify-end">
                                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-purple-900 transition-colors">
                                          {group.title}
                                        </h4>
                                        <motion.div
                                          animate={{
                                            rotate:
                                              expandedGroups[groupId] === false
                                                ? -90
                                                : 0,
                                          }}
                                          transition={{ duration: 0.2 }}
                                        >
                                          <ChevronDown className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                        </motion.div>
                                        <span className="text-sm text-gray-500 flex-shrink-0">
                                          ({tasks.length})
                                        </span>
                                      </div>
                                      {group.description && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          {group.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </button>

                                {/* Group Tasks - Collapsible */}
                                <AnimatePresence>
                                  {expandedGroups[groupId] !== false && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{
                                        height: "auto",
                                        opacity: 1,
                                      }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="space-y-3 sm:space-y-4 pr-4">
                                        {tasks.map((task, taskIndex) => {
                                          const isCompleted = task.completed;
                                          return (
                                            <motion.div
                                              key={task.id}
                                              initial={{
                                                opacity: 0,
                                                scale: 0.9,
                                                y: 20,
                                              }}
                                              animate={{
                                                opacity: 1,
                                                scale: 1,
                                                y: 0,
                                                ...(isCompleted
                                                  ? {
                                                      scale: [1, 1.03, 1],
                                                      boxShadow: [
                                                        "0 1px 3px rgba(0,0,0,0.1)",
                                                        "0 8px 20px rgba(34, 197, 94, 0.4)",
                                                        "0 4px 12px rgba(34, 197, 94, 0.2)",
                                                      ],
                                                    }
                                                  : {}),
                                              }}
                                              transition={{
                                                delay: taskIndex * 0.05,
                                                duration: 0.4,
                                                ease: [0.4, 0, 0.2, 1],
                                              }}
                                              className={`p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 task-card ${
                                                isCompleted
                                                  ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-lg"
                                                  : "bg-white shadow-lg border-gray-100 hover:border-purple-300 hover:shadow-xl"
                                              }`}
                                            >
                                              {/* Task content - reusing existing structure */}
                                              <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                  <motion.button
                                                    type="button"
                                                    disabled={isCampNotStarted}
                                                    onClick={async () => {
                                                      if (!isCompleted) {
                                                        await markTaskComplete(
                                                          task.id
                                                        );
                                                      }
                                                    }}
                                                    className={`
                                                  w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                                                  ${
                                                    isCompleted
                                                      ? "bg-green-500 text-white shadow-lg"
                                                      : "border-2 border-gray-400 text-gray-400 hover:border-purple-500 hover:bg-purple-50"
                                                  }
                                                `}
                                                    whileHover={
                                                      !isCompleted &&
                                                      !isCampNotStarted
                                                        ? { scale: 1.1 }
                                                        : {}
                                                    }
                                                    whileTap={
                                                      !isCompleted
                                                        ? { scale: 0.9 }
                                                        : {}
                                                    }
                                                  >
                                                    {isCompleted ? (
                                                      <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{
                                                          duration: 0.3,
                                                          delay: 0.1,
                                                        }}
                                                      >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                      </motion.div>
                                                    ) : (
                                                      <div className="w-3 h-3 rounded-full bg-transparent"></div>
                                                    )}
                                                  </motion.button>

                                                  <div className="flex-1 min-w-0 relative">
                                                    <h3
                                                      className={`text-base sm:text-lg lg:text-xl font-bold ${
                                                        isCompleted
                                                          ? "text-green-700 line-through decoration-green-500 decoration-1"
                                                          : "text-gray-900"
                                                      }`}
                                                    >
                                                      {task.title}
                                                    </h3>
                                                  </div>
                                                </div>

                                                {/* Completion Counter Badge */}
                                                <TaskCompletionStats
                                                  friendsWhoCompleted={
                                                    task.completed_by_friends ||
                                                    []
                                                  }
                                                  totalCount={
                                                    task.completed_by_count || 0
                                                  }
                                                />
                                              </div>

                                              <div className="relative mb-4 pr-9">
                                                <p
                                                  className={`text-gray-600 ${
                                                    isCompleted
                                                      ? "text-green-600 line-through decoration-green-400 decoration-1"
                                                      : ""
                                                  }`}
                                                >
                                                  {task.description}
                                                </p>
                                              </div>

                                              <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-2 mb-3 sm:mb-4">
                                                <TooltipComponent
                                                  text={`${
                                                    task.points || 3
                                                  } نقاط عند إكمال هذه المهمة`}
                                                >
                                                  <span className="flex items-center text-xs sm:text-sm font-medium text-purple-700 bg-purple-100 px-2 sm:px-3 py-1 rounded-full cursor-help">
                                                    <Star className="w-3 h-3 sm:w-4 sm:h-4 ml-1 fill-current" />
                                                    {task.points || 3} نقاط
                                                  </span>
                                                </TooltipComponent>

                                                {(task.verses_from ||
                                                  task.verses_to) && (
                                                  <TooltipComponent
                                                    text={`الآيات المطلوبة من سورة ${
                                                      camp.surah_name || ""
                                                    }`}
                                                  >
                                                    <span className="flex items-center text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 px-2 sm:px-3 py-1 rounded-full cursor-help">
                                                      <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                                                      <span className="hidden sm:inline">
                                                        الآيات:{" "}
                                                      </span>
                                                      <span className="sm:hidden">
                                                        آيات:{" "}
                                                      </span>
                                                      {task.verses_from &&
                                                      task.verses_to
                                                        ? `${task.verses_from}-${task.verses_to}`
                                                        : task.verses_from
                                                        ? `من ${task.verses_from}`
                                                        : `إلى ${task.verses_to}`}
                                                    </span>
                                                  </TooltipComponent>
                                                )}

                                                <TooltipComponent
                                                  text={`الوقت المتوقع لإكمال هذه المهمة`}
                                                >
                                                  <span className="flex items-center text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 px-2 sm:px-3 py-1 rounded-full cursor-help">
                                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                                                    {task.estimated_time ||
                                                      "30 دقيقة"}
                                                  </span>
                                                </TooltipComponent>
                                              </div>

                                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                                {task.youtube_link && (
                                                  <a
                                                    href={task.youtube_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs sm:text-sm font-medium text-red-600 bg-red-100 px-2 sm:px-3 py-1 rounded-full hover:bg-red-200 transition-colors"
                                                  >
                                                    يوتيوب
                                                  </a>
                                                )}
                                                {task.tafseer_link && (
                                                  <a
                                                    href={task.tafseer_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs sm:text-sm font-medium text-green-600 bg-green-100 px-2 sm:px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                                                  >
                                                    تفسير
                                                  </a>
                                                )}
                                              </div>

                                              <div className="flex flex-col gap-2">
                                                <button
                                                  onClick={() => {
                                                    const taskWithPath = {
                                                      ...task,
                                                      path:
                                                        task.path ||
                                                        buildTaskPath(
                                                          task,
                                                          taskGroups || [],
                                                          task.day_number
                                                        ),
                                                    };
                                                    setSelectedTask(
                                                      taskWithPath
                                                    );
                                                    setReflectionText(
                                                      task.journal_entry || ""
                                                    );
                                                    setShowReflectionModal(
                                                      true
                                                    );
                                                  }}
                                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                                                >
                                                  <BookOpen className="w-4 h-4" />
                                                  عرض المهمة
                                                </button>
                                              </div>
                                            </motion.div>
                                          );
                                        })}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}

                        {/* Display ungrouped tasks */}
                        {ungroupedTasks.length > 0 && (
                          <div className="space-y-3 sm:space-y-4">
                            {ungroupedTasks.map((task, index) => {
                              const isCompleted = task.completed;
                              return (
                                <motion.div
                                  key={task.id}
                                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: 0,
                                    ...(isCompleted
                                      ? {
                                          scale: [1, 1.03, 1],
                                          boxShadow: [
                                            "0 1px 3px rgba(0,0,0,0.1)",
                                            "0 8px 20px rgba(34, 197, 94, 0.4)",
                                            "0 4px 12px rgba(34, 197, 94, 0.2)",
                                          ],
                                        }
                                      : {}),
                                  }}
                                  whileHover={
                                    !isCompleted && !isCampNotStarted
                                      ? {
                                          scale: 1.02,
                                          y: -4,
                                          boxShadow:
                                            "0 10px 25px -5px rgba(139, 92, 246, 0.3)",
                                        }
                                      : {}
                                  }
                                  transition={{
                                    delay: index * 0.08,
                                    duration: 0.4,
                                    ease: [0.4, 0, 0.2, 1],
                                    ...(isCompleted ? { duration: 0.8 } : {}),
                                  }}
                                  className={`p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 task-card ${
                                    isCompleted
                                      ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-lg"
                                      : "bg-white shadow-lg border-gray-100 hover:border-purple-300 hover:shadow-xl"
                                  }`}
                                >
                                  {/* Same task structure as grouped tasks */}
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                      <motion.button
                                        type="button"
                                        disabled={isCampNotStarted}
                                        onClick={async () => {
                                          if (!isCompleted) {
                                            await markTaskComplete(task.id);
                                          }
                                        }}
                                        className={`
                                            w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                                            ${
                                              isCompleted
                                                ? "bg-green-500 text-white shadow-lg"
                                                : "border-2 border-gray-400 text-gray-400 hover:border-purple-500 hover:bg-purple-50"
                                            }
                                          `}
                                        whileHover={
                                          !isCompleted && !isCampNotStarted
                                            ? { scale: 1.1 }
                                            : {}
                                        }
                                        whileTap={
                                          !isCompleted ? { scale: 0.9 } : {}
                                        }
                                      >
                                        {isCompleted ? (
                                          <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                              duration: 0.3,
                                              delay: 0.1,
                                            }}
                                          >
                                            <CheckCircle2 className="w-4 h-4" />
                                          </motion.div>
                                        ) : (
                                          <div className="w-3 h-3 rounded-full bg-transparent"></div>
                                        )}
                                      </motion.button>

                                      <div className="flex-1 min-w-0 relative">
                                        <h3
                                          className={`text-base sm:text-lg lg:text-xl font-bold ${
                                            isCompleted
                                              ? "text-green-700 line-through decoration-green-500 decoration-1"
                                              : "text-gray-900"
                                          }`}
                                        >
                                          {task.title}
                                        </h3>
                                      </div>
                                    </div>

                                    {/* Completion Counter Badge */}
                                    <TaskCompletionStats
                                      friendsWhoCompleted={
                                        task.completed_by_friends || []
                                      }
                                      totalCount={task.completed_by_count || 0}
                                    />
                                  </div>

                                  <div className="relative mb-4 pr-9">
                                    <p
                                      className={`text-gray-600 ${
                                        isCompleted
                                          ? "text-green-600 line-through decoration-green-400 decoration-1"
                                          : ""
                                      }`}
                                    >
                                      {task.description}
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-2 mb-3 sm:mb-4">
                                    <TooltipComponent
                                      text={`${
                                        task.points || 3
                                      } نقاط عند إكمال هذه المهمة`}
                                    >
                                      <span className="flex items-center text-xs sm:text-sm font-medium text-purple-700 bg-purple-100 px-2 sm:px-3 py-1 rounded-full cursor-help">
                                        <Star className="w-3 h-3 sm:w-4 sm:h-4 ml-1 fill-current" />
                                        {task.points || 3} نقاط
                                      </span>
                                    </TooltipComponent>

                                    {(task.verses_from || task.verses_to) && (
                                      <TooltipComponent
                                        text={`الآيات المطلوبة من سورة ${
                                          camp.surah_name || ""
                                        }`}
                                      >
                                        <span className="flex items-center text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 px-2 sm:px-3 py-1 rounded-full cursor-help">
                                          <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                                          <span className="hidden sm:inline">
                                            الآيات:{" "}
                                          </span>
                                          <span className="sm:hidden">
                                            آيات:{" "}
                                          </span>
                                          {task.verses_from && task.verses_to
                                            ? `${task.verses_from}-${task.verses_to}`
                                            : task.verses_from
                                            ? `من ${task.verses_from}`
                                            : `إلى ${task.verses_to}`}
                                        </span>
                                      </TooltipComponent>
                                    )}

                                    <TooltipComponent
                                      text={`الوقت المتوقع لإكمال هذه المهمة`}
                                    >
                                      <span className="flex items-center text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 px-2 sm:px-3 py-1 rounded-full cursor-help">
                                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                                        {task.estimated_time || "30 دقيقة"}
                                      </span>
                                    </TooltipComponent>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                    {task.youtube_link && (
                                      <a
                                        href={task.youtube_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs sm:text-sm font-medium text-red-600 bg-red-100 px-2 sm:px-3 py-1 rounded-full hover:bg-red-200 transition-colors"
                                      >
                                        يوتيوب
                                      </a>
                                    )}
                                    {task.tafseer_link && (
                                      <a
                                        href={task.tafseer_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs sm:text-sm font-medium text-green-600 bg-green-100 px-2 sm:px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                                      >
                                        تفسير
                                      </a>
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-2">
                                    <button
                                      onClick={() => {
                                        const taskWithPath = {
                                          ...task,
                                          path:
                                            task.path ||
                                            buildTaskPath(
                                              task,
                                              taskGroups || [],
                                              task.day_number
                                            ),
                                        };
                                        setSelectedTask(taskWithPath);
                                        setReflectionText(
                                          task.journal_entry || ""
                                        );
                                        setActiveTaskTab("task");
                                        setShowReflectionModal(true);
                                      }}
                                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                                    >
                                      <BookOpen className="w-4 h-4" />
                                      عرض المهمة
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </motion.div>

            {/* Study Tab */}
            {camp?.enable_study_hall && (
              <motion.div
                key="study"
                initial={false}
                animate={{
                  opacity: activeTab === "study" ? 1 : 0,
                  display: activeTab === "study" ? "block" : "none",
                }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100"
                style={{
                  position: activeTab === "study" ? "relative" : "absolute",
                  width: "100%",
                  pointerEvents: activeTab === "study" ? "auto" : "none",
                }}
              >
                {/* تبويبات الأيام */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-hide">
                    {Array.from(
                      { length: camp.duration_days },
                      (_, i) => i + 1
                    ).map((day) => (
                      <button
                        key={day}
                        onClick={() => {
                          setStudyHallSelectedDay(day);
                          fetchStudyHallContent(
                            day,
                            studyHallSort,
                            1,
                            20,
                            true
                          );
                        }}
                        className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                          studyHallSelectedDay === day
                            ? "bg-[#7440E9] text-white shadow-lg"
                            : "bg-gray-100 text-gray-600 hover:bg-[#7440E9]/10 hover:text-[#7440E9]"
                        }`}
                      >
                        اليوم {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-center mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-2">
                    قاعة التدارس - اليوم {studyHallSelectedDay}
                  </h3>

                  {/* Modal إضافة تدبر جديد - خارج الـ container الرئيسي */}
                  {showAddReflectionModal && (
                    <div
                      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
                      style={{ zIndex: 9999 }}
                    >
                      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-gray-800">
                            أضف تدبر جديد
                          </h3>
                          <button
                            onClick={() => setShowAddReflectionModal(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              اختر المهمة المكتملة
                            </label>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {userProgress?.tasks?.filter(
                                (task) => task.completed
                              )?.length > 0 ? (
                                userProgress.tasks
                                  .filter((task) => task.completed)
                                  .map((task) => (
                                    <button
                                      key={task.id}
                                      onClick={() => setSelectedTask(task)}
                                      className={`w-full text-right p-3 rounded-lg border transition-all ${
                                        selectedTask?.id === task.id
                                          ? "border-[#7440E9] bg-[#F7F6FB]"
                                          : "border-gray-200 hover:border-[#7440E9]/30"
                                      }`}
                                    >
                                      <div className="font-medium text-gray-800">
                                        {task.title}
                                      </div>
                                      <div className="text-sm text-gray-600 mt-1">
                                        اليوم {task.day_number}
                                      </div>
                                    </button>
                                  ))
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                  <p className="text-sm">
                                    لا توجد مهام مكتملة بعد
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    اكمل بعض المهام أولاً لإضافة تدبرك
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {selectedTask && (
                            <>
                              <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  اكتب مذكرتك (خاص بك) 📝
                                </label>
                                <p className="text-xs text-gray-600 mb-2">
                                  للحصول على اقتراحات الأحاديث، اكتب{" "}
                                  <span className="font-bold text-purple-600">
                                    /حديث
                                  </span>{" "}
                                  ثم كلمة البحث (مثال:{" "}
                                  <span className="font-bold text-purple-600">
                                    /حديث الصبر
                                  </span>
                                  ).
                                </p>
                                <RichTadabburEditor
                                  initialContent={reflectionText}
                                  onChange={(htmlContent) =>
                                    setReflectionText(htmlContent)
                                  }
                                  onJSONChange={(jsonContent) =>
                                    setReflectionJson(jsonContent)
                                  }
                                  placeholder="ابدأ كتابة تدبرك هنا..."
                                />
                              </div>

                              {/* الجسر الذكي - مشاركة في قاعة التدارس */}
                              <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={shareInStudyHall}
                                    onChange={(e) =>
                                      setShareInStudyHall(e.target.checked)
                                    }
                                    className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500 ml-3"
                                  />
                                  <div className="flex-1">
                                    <span className="font-semibold text-purple-800 text-sm flex items-center">
                                      <Users className="w-4 h-4 ml-1" />
                                      مشاركة في قاعة التدارس
                                    </span>
                                    <p className="text-xs text-purple-600">
                                      سيتم نشر هذه المذكرة ليراها ويستفيد منها
                                      باقي المشاركين
                                    </p>
                                  </div>
                                </label>
                              </div>

                              {/* الخطوة العملية المقترحة (اختياري) */}
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  الخطوة العملية المقترحة (اختياري)
                                </label>
                                <textarea
                                  value={proposedStep}
                                  onChange={(e) =>
                                    setProposedStep(e.target.value)
                                  }
                                  placeholder="مثال: سأقوم بإهداء كتاب ديني لصديق هذا الأسبوع..."
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7440E9] focus:border-[#7440E9] resize-none text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  اقترح خطوة عملية يمكن للآخرين الالتزام بها معك
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex gap-3 mt-6">
                          <button
                            onClick={() => setShowAddReflectionModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                          >
                            إلغاء
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                selectedTask &&
                                (reflectionText || benefitsText)
                              ) {
                                try {
                                  // إضافة التدبر والفوائد
                                  if (reflectionText || benefitsText) {
                                    await updateTaskBenefits(
                                      selectedTask.id,
                                      reflectionText,
                                      benefitsText,
                                      !shareInStudyHall, // is_private
                                      reflectionJson,
                                      proposedStep || null // proposed_step
                                    );
                                  }

                                  // إعادة جلب بيانات قاعة التدارس
                                  await fetchStudyHallContent(
                                    studyHallSelectedDay,
                                    studyHallSort,
                                    1,
                                    20,
                                    true
                                  );

                                  // إعادة تعيين النموذج
                                  setSelectedTask(null);
                                  setReflectionText("");
                                  setReflectionJson(null);
                                  setBenefitsText("");
                                  setProposedStep("");
                                  setShareInStudyHall(false);
                                  setShowAddReflectionModal(false);

                                  // إشعار النجاح
                                  toast.success("تم إضافة التدبر بنجاح! 🎉", {
                                    duration: 3000,
                                    position: "top-center",
                                  });
                                } catch (error) {
                                  toast.error("حدث خطأ أثناء إضافة التدبر", {
                                    duration: 3000,
                                    position: "top-center",
                                  });
                                }
                              }
                            }}
                            disabled={
                              !selectedTask ||
                              (!reflectionText && !benefitsText)
                            }
                            className="flex-1 px-4 py-2 bg-[#7440E9] text-white rounded-lg hover:bg-[#5a2fc7] disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                          >
                            إضافة التدبر
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* تبويبات الفرز */}
                  {!studyHallLoading && studyHallData.length > 0 && (
                    <div className="mb-4 sm:mb-6">
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2 max-w-2xl mx-auto">
                        <button
                          onClick={() => {
                            setStudyHallSort("newest");
                            refetchStudyHall("newest", null);
                          }}
                          className={`flex-1 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-base transition-all duration-200 ${
                            studyHallSort === "newest"
                              ? "bg-[#7440E9] text-white shadow-lg shadow-[#7440E9]/30"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          الأحدث
                        </button>
                        <button
                          onClick={() => {
                            setStudyHallSort("helpful");
                            refetchStudyHall("helpful", null);
                          }}
                          className={`flex-1 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-base transition-all duration-200 ${
                            studyHallSort === "helpful"
                              ? "bg-[#7440E9] text-white shadow-lg shadow-[#7440E9]/30"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          الأكثر إفادة
                        </button>
                        <button
                          onClick={() => {
                            setStudyHallSort("saved");
                            refetchStudyHall("saved", null);
                          }}
                          className={`flex-1 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-base transition-all duration-200 ${
                            studyHallSort === "saved"
                              ? "bg-[#7440E9] text-white shadow-lg shadow-[#7440E9]/30"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          الأكثر حفظًا
                        </button>
                      </div>
                    </div>
                  )}

                  {/* بحث في التدبرات */}
                  {!studyHallLoading && studyHallData.length > 0 && (
                    <div className="mb-4 sm:mb-6 px-2 sm:px-0">
                      <div className="max-w-md mx-auto">
                        <div className="relative">
                          <input
                            type="text"
                            value={studyHallSearch}
                            onChange={(e) => {
                              const value = e.target.value;
                              // تنظيف المدخلات من الأحرف الخطيرة
                              const cleanValue = value.replace(/[<>"'&]/g, "");
                              setStudyHallSearch(cleanValue);
                            }}
                            placeholder="ابحث في التدبرات والفوائد..."
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-9 sm:pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7440E9] focus:border-[#7440E9] text-right text-sm sm:text-base"
                            aria-label="البحث في التدبرات والفوائد"
                            aria-describedby="search-description"
                            maxLength={100}
                          />
                          <div
                            className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2"
                            aria-hidden="true"
                          >
                            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                          </div>
                          {studyHallSearch && (
                            <button
                              onClick={() => setStudyHallSearch("")}
                              className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                              aria-label="مسح البحث"
                              title="مسح البحث"
                            >
                              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>
                        {studyHallSearch && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center px-2">
                            البحث عن: "{studyHallSearch}"
                          </p>
                        )}

                        {/* إحصائيات البحث والفلترة */}
                        {(studyHallSearch || studyHallFilter !== "all") && (
                          <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-gradient-to-r from-[#F7F6FB] to-[#F3EDFF] rounded-lg border border-[#7440E9]/20">
                            <div className="text-xs sm:text-sm text-[#7440E9] text-center font-medium">
                              {(() => {
                                let filteredData = studyHallData;
                                if (studyHallFilter === "my") {
                                  filteredData = studyHallData.filter(
                                    (item) => item.is_own
                                  );
                                } else if (studyHallFilter === "others") {
                                  filteredData = studyHallData.filter(
                                    (item) => !item.is_own
                                  );
                                }

                                if (studyHallSearch) {
                                  filteredData = filteredData.filter((item) => {
                                    const searchTerm =
                                      studyHallSearch.toLowerCase();
                                    return (
                                      item.content
                                        ?.toLowerCase()
                                        .includes(searchTerm) ||
                                      item.title
                                        ?.toLowerCase()
                                        .includes(searchTerm) ||
                                      item.userName
                                        ?.toLowerCase()
                                        .includes(searchTerm)
                                    );
                                  });
                                }

                                return `عرض ${filteredData.length} من أصل ${studyHallData.length} مساهمة`;
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {studyHallLoading ? (
                  <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6">
                    {[...Array(6)].map((_, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 animate-pulse"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="mb-4">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded mb-1"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-3">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6">
                    {filteredAndSortedData.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5 md:p-6 flex flex-col w-full max-w-2xl mx-auto hover:shadow-xl transition-all duration-300"
                      >
                        {/* ----- 1. Header: أيقونة المستخدم + الاسم + شارة النقاط ----- */}
                        <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            {/* أيقونة المستخدم */}
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#F7F6FB] to-[#F3EDFF] flex items-center justify-center border-2 border-[#7440E9]/30 flex-shrink-0">
                              {item.avatar_url &&
                              !campSettings.hide_identity ? (
                                <img
                                  src={getAvatarUrl({
                                    avatar_url: item.avatar_url,
                                  })}
                                  alt={item.userName}
                                  className="w-10 h-10 rounded-full object-cover"
                                  onError={(e) => {
                                    e.target.src = "/default-avatar.png";
                                  }}
                                />
                              ) : (
                                <User className="w-5 h-5 text-[#7440E9]" />
                              )}
                            </div>
                            {/* اسم المستخدم + علامة "مساهمتي" */}
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0 flex-1">
                              <h4 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg truncate">
                                {campSettings.hide_identity ||
                                (item.is_own && currentUser?.hide_identity)
                                  ? "مساهم مجهول"
                                  : item.userName || "مساهم مجهول"}
                              </h4>
                              {item.is_own && (
                                <span className="text-[#7440E9] text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-[#F7F6FB] rounded-full font-medium border border-[#7440E9]/20 whitespace-nowrap flex-shrink-0">
                                  مساهمتي
                                </span>
                              )}
                            </div>
                          </div>

                          {/* شارة النقاط */}
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1 bg-gradient-to-r from-[#F7F6FB] to-[#F3EDFF] text-[#7440E9] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-semibold border border-[#7440E9]/20">
                              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 fill-current" />
                              <span>
                                +{item.totalPoints || item.points || 3}
                              </span>
                            </div>

                            {/* زر القائمة (ثلاث نقاط) - يظهر فقط للتدبرات الخاصة بالمستخدم */}
                            {item.is_own && (
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // تبديل حالة القائمة
                                    setStudyHallData((prevData) =>
                                      prevData.map((i) =>
                                        i.progress_id === item.progress_id
                                          ? {
                                              ...i,
                                              showMenu:
                                                i.showMenu === undefined
                                                  ? true
                                                  : !i.showMenu,
                                            }
                                          : { ...i, showMenu: false }
                                      )
                                    );
                                  }}
                                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                  aria-label="خيارات"
                                >
                                  <svg
                                    className="w-5 h-5 text-gray-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>

                                {/* القائمة المنسدلة */}
                                {item.showMenu && (
                                  <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[150px]">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteModal(item.progress_id);
                                        setStudyHallData((prevData) =>
                                          prevData.map((i) =>
                                            i.progress_id === item.progress_id
                                              ? { ...i, showMenu: false }
                                              : i
                                          )
                                        );
                                      }}
                                      className="w-full text-right px-4 py-2 hover:bg-red-50 text-red-600 text-sm flex items-center gap-2"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                      حذف الملاحظة
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ----- 2. Body: نص الفائدة (المحتوى الأساسي - الأهم) ----- */}
                        <div className="mb-3 sm:mb-4 flex-1">
                          {(() => {
                            const reflectionId = item.progress_id || item.id;
                            const fullText =
                              item.reflectionText ||
                              item.benefits ||
                              item.content ||
                              "فائدة تدبرية قيمة من المخيم...";
                            const isExpanded =
                              expandedReflections[reflectionId];
                            const MAX_LENGTH = 50; // عدد الأحرف المحدد قبل الاقتطاع
                            // حساب الطول بدون HTML tags للعرض
                            const textWithoutHtml = fullText.replace(
                              /<[^>]*>/g,
                              ""
                            );
                            const shouldTruncate =
                              textWithoutHtml.length > MAX_LENGTH;

                            return (
                              <>
                                <div
                                  className="text-gray-800 text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed break-words prose prose-sm max-w-none select-text"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightSearchTermHTML(
                                      isExpanded || !shouldTruncate
                                        ? fullText
                                        : truncateHTML(fullText, MAX_LENGTH),
                                      studyHallSearch
                                    ),
                                  }}
                                  style={{
                                    userSelect: "text",
                                    WebkitUserSelect: "text",
                                    MozUserSelect: "text",
                                    msUserSelect: "text",
                                  }}
                                />
                                {shouldTruncate && (
                                  <button
                                    onClick={() => {
                                      setExpandedReflections((prev) => ({
                                        ...prev,
                                        [reflectionId]: !isExpanded,
                                      }));
                                    }}
                                    className="mt-2 text-[#7440E9] font-semibold text-sm hover:underline flex items-center gap-1"
                                  >
                                    {isExpanded ? "عرض أقل" : "المزيد"}
                                    {!isExpanded && (
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 9l-7 7-7-7"
                                        />
                                      </svg>
                                    )}
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        {/* عرض الخطوة العملية المقترحة */}
                        {item.proposed_step && (
                          <div className="mb-3 sm:mb-4 mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-r-4 border-[#7440E9] rounded-lg shadow-sm">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="text-sm sm:text-base font-semibold text-[#7440E9] mb-2">
                                  الخطوة العملية المقترحة:
                                </h4>
                                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                                  {item.proposed_step}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ----- 3. Footer: التاريخ + أزرار التفاعل ----- */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-500 border-t border-gray-100 pt-3 sm:pt-4 mt-auto">
                          {/* التاريخ */}
                          <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">
                              {item.completed_at &&
                              !isNaN(new Date(item.completed_at))
                                ? new Date(
                                    item.completed_at
                                  ).toLocaleDateString("ar-SA", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "تاريخ غير متاح"}
                            </span>
                          </div>

                          {/* أزرار التفاعل */}
                          <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto">
                            {/* زر "مفيد" (Upvote) */}
                            <div className="relative">
                              {/* Tooltip للتصويت */}
                              <AnimatePresence>
                                {showUpvoteTooltip[item.progress_id] && (
                                  <motion.div
                                    initial={{
                                      opacity: 0,
                                      y: -10,
                                      scale: 0.8,
                                    }}
                                    animate={{ opacity: 1, y: -50, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.8 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 300,
                                      damping: 20,
                                    }}
                                    className="absolute bottom-full left-[-50px] top-[10px] transform -translate-x-1/2 mb-2 z-50 pointer-events-none"
                                  >
                                    <motion.div
                                      animate={{
                                        y: item.is_upvoted_by_user
                                          ? [0, -3, 0]
                                          : [0, -5, 0],
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                      }}
                                      className="bg-gradient-to-r from-[#7440E9] to-[#5a2fc7] text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-2 border border-white/20"
                                    >
                                      <motion.div
                                        animate={{
                                          rotate: item.is_upvoted_by_user
                                            ? [0, 15, -15, 0]
                                            : [0, 10, -10, 0],
                                        }}
                                        transition={{
                                          duration: 0.6,
                                          repeat: Infinity,
                                          repeatDelay: 1,
                                        }}
                                      >
                                        <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                      </motion.div>
                                      <span>
                                        {item.is_upvoted_by_user
                                          ? "تم التصويت كمفيد! ✅"
                                          : "اضغط للتصويت كمفيد"}
                                      </span>
                                      {/* سهم يشير للزر */}
                                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                                        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-[#7440E9]"></div>
                                      </div>
                                    </motion.div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <motion.button
                                whileTap={!isReadOnly ? { scale: 0.9 } : {}}
                                onMouseEnter={() => {
                                  if (!isReadOnly) {
                                    setShowUpvoteTooltip((prev) => ({
                                      ...prev,
                                      [item.progress_id]: true,
                                    }));
                                  }
                                }}
                                onMouseLeave={() => {
                                  // إخفاء الرسالة فقط إذا لم يكن هناك تصويت حديث
                                  const hasRecentUpvote =
                                    item.is_upvoted_by_user === 1;

                                  // إذا لم يكن هناك تصويت، أو مرت 3 ثوان بعد التصويت، أخفي الرسالة
                                  if (!hasRecentUpvote) {
                                    setShowUpvoteTooltip((prev) => ({
                                      ...prev,
                                      [item.progress_id]: false,
                                    }));
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isReadOnly) {
                                    handleToggleUpvote(item.progress_id);
                                    // إظهار الرسالة بعد التصويت
                                    setShowUpvoteTooltip((prev) => ({
                                      ...prev,
                                      [item.progress_id]: true,
                                    }));
                                    // إخفاء الرسالة بعد 3 ثوان
                                    setTimeout(() => {
                                      setShowUpvoteTooltip((prev) => ({
                                        ...prev,
                                        [item.progress_id]: false,
                                      }));
                                    }, 3000);
                                  }
                                }}
                                disabled={isReadOnly}
                                title={
                                  isReadOnly
                                    ? "هذا المخيم منتهي. التفاعل الاجتماعي غير متاح."
                                    : undefined
                                }
                                className={`relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 ${
                                  isReadOnly
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                                    : item.is_upvoted_by_user
                                    ? "bg-[#7440E9] text-white border-[#7440E9]/20"
                                    : "bg-gray-100 text-gray-600 hover:bg-[#F7F6FB] hover:text-[#7440E9]"
                                }`}
                                aria-label="مفيد"
                              >
                                <motion.div
                                  animate={
                                    item.is_upvoted_by_user
                                      ? {
                                          rotate: [0, -180, 0],
                                          scale: [1, 1.3, 1],
                                        }
                                      : {}
                                  }
                                  transition={{
                                    duration: 0.5,
                                    ease: "easeOut",
                                  }}
                                >
                                  <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </motion.div>
                                <div className="font-semibold text-[10px] sm:text-xs md:text-sm min-w-[1rem] sm:min-w-[1.25rem] text-center">
                                  <AnimatePresence mode="wait" initial={false}>
                                    <motion.span
                                      key={String(item.upvote_count || 0)}
                                      initial={{
                                        y: -10,
                                        opacity: 0,
                                        scale: 1.2,
                                      }}
                                      animate={{ y: 0, opacity: 1, scale: 1 }}
                                      exit={{ y: 10, opacity: 0, scale: 0.8 }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 15,
                                      }}
                                    >
                                      {item.upvote_count || 0}
                                    </motion.span>
                                  </AnimatePresence>
                                </div>
                              </motion.button>
                            </div>

                            {/* زر "حفظ" (Save) */}
                            <div className="relative">
                              {/* Tooltip للحفظ */}
                              <AnimatePresence>
                                {showBookmarkTooltip[item.progress_id] && (
                                  <motion.div
                                    initial={{
                                      opacity: 0,
                                      y: -10,
                                      scale: 0.8,
                                    }}
                                    animate={{ opacity: 1, y: -50, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.8 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 300,
                                      damping: 20,
                                    }}
                                    className="absolute bottom-full left-[-60px] top-[10px] transform -translate-x-1/2 mb-2 z-50 pointer-events-none"
                                  >
                                    <motion.div
                                      animate={{
                                        y: item.is_saved_by_user
                                          ? [0, -3, 0]
                                          : [0, -5, 0],
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                      }}
                                      className="bg-gradient-to-r from-[#7440E9] to-[#5a2fc7] text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-2 border border-white/20"
                                    >
                                      <motion.div
                                        animate={{
                                          rotate: item.is_saved_by_user
                                            ? [0, 15, -15, 0]
                                            : [0, 10, -10, 0],
                                        }}
                                        transition={{
                                          duration: 0.6,
                                          repeat: Infinity,
                                          repeatDelay: 1,
                                        }}
                                      >
                                        <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" />
                                      </motion.div>
                                      <span>
                                        {item.is_saved_by_user
                                          ? "تم الحفظ بنجاح! ✅"
                                          : "اضغط لحفظ هذه الفائدة"}
                                      </span>
                                      {/* سهم يشير للزر */}
                                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                                        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-[#7440E9]"></div>
                                      </div>
                                    </motion.div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <motion.button
                                whileTap={!isReadOnly ? { scale: 0.9 } : {}}
                                onMouseEnter={() => {
                                  if (!isReadOnly) {
                                    setShowBookmarkTooltip((prev) => ({
                                      ...prev,
                                      [item.progress_id]: true,
                                    }));
                                  }
                                }}
                                onMouseLeave={() => {
                                  // إخفاء الرسالة فقط إذا لم يكن هناك حفظ حديث
                                  const hasRecentSave =
                                    item.is_saved_by_user === 1;

                                  // إذا لم يكن هناك حفظ، أو مرت 3 ثوان بعد الحفظ، أخفي الرسالة
                                  if (!hasRecentSave) {
                                    setShowBookmarkTooltip((prev) => ({
                                      ...prev,
                                      [item.progress_id]: false,
                                    }));
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isReadOnly) {
                                    handleToggleSave(item.progress_id);
                                    // إظهار الرسالة بعد الحفظ
                                    setShowBookmarkTooltip((prev) => ({
                                      ...prev,
                                      [item.progress_id]: true,
                                    }));
                                    // إخفاء الرسالة بعد 3 ثوان
                                    setTimeout(() => {
                                      setShowBookmarkTooltip((prev) => ({
                                        ...prev,
                                        [item.progress_id]: false,
                                      }));
                                    }, 3000);
                                  }
                                }}
                                disabled={isReadOnly}
                                title={
                                  isReadOnly
                                    ? "هذا المخيم منتهي. الحفظ غير متاح."
                                    : undefined
                                }
                                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 ${
                                  isReadOnly
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                                    : item.is_saved_by_user
                                    ? "bg-[#F7F6FB] text-[#7440E9] border border-[#7440E9]/20"
                                    : "bg-gray-100 text-gray-600 hover:bg-[#F7F6FB] hover:text-[#7440E9]"
                                }`}
                                aria-label="حفظ"
                              >
                                <motion.div
                                  key={
                                    item.is_saved_by_user
                                      ? "saved"
                                      : "not_saved"
                                  }
                                  animate={
                                    item.is_saved_by_user
                                      ? {
                                          rotate: [0, -10, 10, -10, 0],
                                          scale: [1, 1.2, 1],
                                        }
                                      : {}
                                  }
                                  transition={{ duration: 0.3 }}
                                >
                                  <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </motion.div>
                                <div className="font-semibold text-[10px] sm:text-xs md:text-sm min-w-[1rem] sm:min-w-[1.25rem] text-center">
                                  <AnimatePresence mode="wait" initial={false}>
                                    <motion.span
                                      key={String(item.save_count || 0)}
                                      initial={{
                                        y: -10,
                                        opacity: 0,
                                        scale: 1.2,
                                      }}
                                      animate={{ y: 0, opacity: 1, scale: 1 }}
                                      exit={{ y: 10, opacity: 0, scale: 0.8 }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 15,
                                      }}
                                    >
                                      {item.save_count || 0}
                                    </motion.span>
                                  </AnimatePresence>
                                </div>
                              </motion.button>
                            </div>

                            {/* زر "ألتزم معك" (Pledge) - يظهر دائماً إذا كانت هناك خطوة عملية مقترحة */}
                            {item.proposed_step && !item.is_own && (
                              <div className="relative">
                                {/* رسالة متحركة فوق الزر */}
                                <AnimatePresence>
                                  {showPledgeTooltip[item.progress_id] && (
                                    <motion.div
                                      initial={{
                                        opacity: 0,
                                        y: -10,
                                        scale: 0.8,
                                      }}
                                      animate={{ opacity: 1, y: -50, scale: 1 }}
                                      exit={{ opacity: 0, y: -20, scale: 0.8 }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 20,
                                      }}
                                      className="absolute bottom-full left-[-30px] top-[10px] transform -translate-x-1/2 mb-2 z-50 pointer-events-none"
                                    >
                                      <motion.div
                                        animate={{
                                          y:
                                            pledgedSteps.has(
                                              item.progress_id
                                            ) || item.is_pledged_by_user === 1
                                              ? [0, -3, 0]
                                              : [0, -5, 0],
                                        }}
                                        transition={{
                                          duration: 2,
                                          repeat: Infinity,
                                          ease: "easeInOut",
                                        }}
                                        className="bg-gradient-to-r from-[#7440E9] to-[#5a2fc7] text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-2 border border-white/20"
                                      >
                                        <motion.div
                                          animate={{
                                            rotate:
                                              pledgedSteps.has(
                                                item.progress_id
                                              ) || item.is_pledged_by_user === 1
                                                ? [0, 15, -15, 0]
                                                : [0, 10, -10, 0],
                                          }}
                                          transition={{
                                            duration: 0.6,
                                            repeat: Infinity,
                                            repeatDelay: 1,
                                          }}
                                        >
                                          <HandHeart className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </motion.div>
                                        <span>
                                          {pledgedSteps.has(item.progress_id) ||
                                          item.is_pledged_by_user === 1
                                            ? "تم الالتزام بنجاح! ✅"
                                            : "اضغط للالتزام بهذه الخطوة"}
                                        </span>
                                        {/* سهم يشير للزر */}
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                                          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-[#7440E9]"></div>
                                        </div>
                                      </motion.div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                <motion.button
                                  whileTap={
                                    !isReadOnly &&
                                    !isCampNotStarted &&
                                    pledgingProgressId !== item.progress_id &&
                                    !pledgedSteps.has(item.progress_id) &&
                                    !item.is_pledged_by_user
                                      ? { scale: 0.9 }
                                      : {}
                                  }
                                  onMouseEnter={() => {
                                    if (
                                      !isReadOnly &&
                                      !isCampNotStarted &&
                                      pledgingProgressId !== item.progress_id
                                    ) {
                                      setShowPledgeTooltip((prev) => ({
                                        ...prev,
                                        [item.progress_id]: true,
                                      }));
                                    }
                                  }}
                                  onMouseLeave={() => {
                                    // إخفاء الرسالة فقط إذا لم يكن هناك التزام حديث (بعد 3 ثوان من الالتزام)
                                    // إذا كان المستخدم قد التزم للتو، دع الرسالة تظهر
                                    const hasRecentPledge =
                                      pledgedSteps.has(item.progress_id) ||
                                      item.is_pledged_by_user === 1;

                                    // إذا لم يكن هناك التزام، أو مرت 3 ثوان بعد الالتزام، أخفي الرسالة
                                    if (!hasRecentPledge) {
                                      setShowPledgeTooltip((prev) => ({
                                        ...prev,
                                        [item.progress_id]: false,
                                      }));
                                    }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      !isReadOnly &&
                                      !isCampNotStarted &&
                                      pledgingProgressId !== item.progress_id &&
                                      !pledgedSteps.has(item.progress_id) &&
                                      !item.is_pledged_by_user
                                    ) {
                                      handlePledgeToJointStep(item.progress_id);
                                    }
                                  }}
                                  disabled={
                                    isReadOnly ||
                                    isCampNotStarted ||
                                    pledgingProgressId === item.progress_id ||
                                    pledgedSteps.has(item.progress_id) ||
                                    item.is_pledged_by_user === 1
                                  }
                                  title={
                                    isReadOnly || isCampNotStarted
                                      ? "لا يمكن الالتزام في هذا الوقت"
                                      : pledgingProgressId === item.progress_id
                                      ? "جاري الالتزام..."
                                      : pledgedSteps.has(item.progress_id) ||
                                        item.is_pledged_by_user === 1
                                      ? "تم الالتزام بهذه الخطوة"
                                      : "اضغط للالتزام بهذه الخطوة العملية"
                                  }
                                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 ${
                                    isReadOnly ||
                                    isCampNotStarted ||
                                    pledgingProgressId === item.progress_id
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                                      : pledgedSteps.has(item.progress_id) ||
                                        item.is_pledged_by_user === 1
                                      ? "bg-[#7440E9] text-white border-[#7440E9]/20"
                                      : "bg-gray-100 text-gray-600 hover:bg-[#F7F6FB] hover:text-[#7440E9]"
                                  }`}
                                  aria-label="ألتزم معك"
                                >
                                  {pledgingProgressId === item.progress_id ? (
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-gray-600"></div>
                                  ) : (
                                    <motion.div
                                      animate={
                                        pledgedSteps.has(item.progress_id) ||
                                        item.is_pledged_by_user === 1
                                          ? {
                                              scale: [1, 1.1, 1],
                                            }
                                          : {}
                                      }
                                      transition={{
                                        duration: 0.3,
                                        repeat:
                                          pledgedSteps.has(item.progress_id) ||
                                          item.is_pledged_by_user === 1
                                            ? Infinity
                                            : 0,
                                        repeatDelay: 2,
                                      }}
                                    >
                                      <HandHeart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </motion.div>
                                  )}
                                  <div className="font-semibold text-[10px] sm:text-xs md:text-sm min-w-[1rem] sm:min-w-[1.25rem] text-center">
                                    <AnimatePresence
                                      mode="wait"
                                      initial={false}
                                    >
                                      <motion.span
                                        key={String(
                                          item.pledge_count !== undefined &&
                                            item.pledge_count !== null
                                            ? item.pledge_count
                                            : 0
                                        )}
                                        initial={{
                                          y: -10,
                                          opacity: 0,
                                          scale: 1.2,
                                        }}
                                        animate={{ y: 0, opacity: 1, scale: 1 }}
                                        exit={{ y: 10, opacity: 0, scale: 0.8 }}
                                        transition={{
                                          type: "spring",
                                          stiffness: 500,
                                          damping: 15,
                                        }}
                                      >
                                        {item.pledge_count !== undefined &&
                                        item.pledge_count !== null
                                          ? item.pledge_count
                                          : 0}
                                      </motion.span>
                                    </AnimatePresence>
                                  </div>
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {!studyHallLoading &&
                  studyHallData.length > 0 &&
                  studyHallPagination.total_pages > 1 && (
                    <div className="flex items-center justify-center gap-2 sm:gap-3 mt-6 sm:mt-8 pb-4">
                      <button
                        onClick={() => {
                          const prevPage = studyHallPagination.page - 1;
                          if (prevPage >= 1) {
                            fetchStudyHallContent(
                              studyHallSelectedDay,
                              studyHallSort,
                              prevPage,
                              20,
                              false
                            );
                            // Scroll to top
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        disabled={
                          !studyHallPagination.has_prev || studyHallLoading
                        }
                        className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-semibold text-sm sm:text-base transition-all ${
                          !studyHallPagination.has_prev || studyHallLoading
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-[#7440E9] text-white hover:bg-[#5a2fc7] shadow-lg"
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                        السابق
                      </button>

                      <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 rounded-lg">
                        <span className="text-sm sm:text-base font-semibold text-gray-700">
                          صفحة {studyHallPagination.page} من{" "}
                          {studyHallPagination.total_pages}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          const nextPage = studyHallPagination.page + 1;
                          if (nextPage <= studyHallPagination.total_pages) {
                            fetchStudyHallContent(
                              studyHallSelectedDay,
                              studyHallSort,
                              nextPage,
                              20,
                              false
                            );
                            // Scroll to top
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        disabled={
                          !studyHallPagination.has_next || studyHallLoading
                        }
                        className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-semibold text-sm sm:text-base transition-all ${
                          !studyHallPagination.has_next || studyHallLoading
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-[#7440E9] text-white hover:bg-[#5a2fc7] shadow-lg"
                        }`}
                      >
                        التالي
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                {!studyHallLoading && studyHallData.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center"
                  >
                    <div className="w-20 h-20 bg-[#7440E9] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>

                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      أهلاً بك في قاعة التدارس!
                    </h3>

                    <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                      هذه الساحة مخصصة لعرض "أفضل" الفوائد والخواطر من جميع
                      المشاركين في المخيم.
                    </p>

                    <div className="bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] border-t-4 border-[#7440E9] rounded-lg p-6">
                      <h4 className="text-xl font-bold text-[#7440E9] mb-3">
                        كيف أشارك فائدتي؟
                      </h4>
                      <p className="text-gray-700 text-md leading-relaxed mb-6">
                        الأمر بسيط: اذهب إلى (خريطة الرحلة)، افتح "مهام اليوم"،
                        واكتب فائدتك في المربع المخصص. ستظهر مساهمتك هنا
                        تلقائيًا!
                      </p>
                      <button
                        onClick={() => setActiveTab("journey")}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-[#7440E9] text-white rounded-lg font-semibold hover:bg-[#5a2fc7] transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <Send className="w-5 h-5" />
                        <span>اذهب لخريطة الرحلة الآن</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* رسالة عندما لا توجد نتائج للفلترة أو البحث */}
                {!studyHallLoading &&
                  studyHallData.length > 0 &&
                  (() => {
                    let filteredData = studyHallData;
                    if (studyHallFilter === "my") {
                      // عند الفلترة بـ "my"، استبعد التدبرات الشخصية
                      filteredData = studyHallData.filter((item) => {
                        const isPrivate =
                          item.is_private === true ||
                          item.is_private === 1 ||
                          item.is_private === "1";
                        return item.is_own && !isPrivate;
                      });
                    } else if (studyHallFilter === "others") {
                      // عند الفلترة بـ "others"، استبعد التدبرات الشخصية أيضاً
                      filteredData = studyHallData.filter((item) => {
                        const isPrivate =
                          item.is_private === true ||
                          item.is_private === 1 ||
                          item.is_private === "1";
                        return !item.is_own && !isPrivate;
                      });
                    } else {
                      // عند الفلترة بـ "all"، استبعد جميع التدبرات الشخصية
                      filteredData = studyHallData.filter((item) => {
                        const isPrivate =
                          item.is_private === true ||
                          item.is_private === 1 ||
                          item.is_private === "1";
                        return !isPrivate;
                      });
                    }

                    // تطبيق البحث
                    if (studyHallSearch) {
                      filteredData = filteredData.filter((item) => {
                        const searchTerm = studyHallSearch.toLowerCase();
                        return (
                          item.content?.toLowerCase().includes(searchTerm) ||
                          item.title?.toLowerCase().includes(searchTerm) ||
                          item.userName?.toLowerCase().includes(searchTerm)
                        );
                      });
                    }

                    if (filteredData.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-600 mb-2">
                            {studyHallSearch
                              ? "لا توجد نتائج للبحث"
                              : "لا توجد نتائج للفلترة المحددة"}
                          </h4>
                          <p className="text-gray-500 text-sm mb-4">
                            {studyHallSearch
                              ? `لم يتم العثور على أي تدبرات تحتوي على "${studyHallSearch}"`
                              : studyHallFilter === "my"
                              ? "لم تقم بإضافة أي تدبرات بعد"
                              : "لم يقم الآخرون بإضافة أي تدبرات بعد"}
                          </p>
                          <div className="flex gap-2 justify-center">
                            {studyHallSearch && (
                              <button
                                onClick={() => setStudyHallSearch("")}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                              >
                                مسح البحث
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setStudyHallFilter("all");
                                setStudyHallSearch("");
                              }}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              عرض جميع المساهمات
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
              </motion.div>
            )}

            {/* Journal Tab */}
            <motion.div
              key="my_journal"
              initial={false}
              animate={{
                opacity: activeTab === "my_journal" ? 1 : 0,
                display: activeTab === "my_journal" ? "block" : "none",
              }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100"
              style={{
                position: activeTab === "my_journal" ? "relative" : "absolute",
                width: "100%",
                pointerEvents: activeTab === "my_journal" ? "auto" : "none",
              }}
            >
              <div className="w-full max-w-3xl mx-auto space-y-8 py-8">
                {journalLoading ? (
                  <div className="text-center p-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7440E9] mx-auto"></div>
                    <p className="mt-4 text-gray-600">جاري تحميل سجلّك...</p>
                  </div>
                ) : journalData ? (
                  <>
                    {/* --- 1. بطاقة "خطة العمل" (تظل في الأعلى) --- */}
                    {journalData.myActionPlan && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-[#7440E9] to-[#5a2fc7] text-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-5 md:p-6"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                              <Award className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0" />
                              <h3 className="text-lg sm:text-xl md:text-2xl font-bold">
                                خطة عملي من هذا المخيم
                              </h3>
                            </div>
                            {typeof journalData.myActionPlan === "object" ? (
                              <div className="text-purple-100 text-sm sm:text-base md:text-lg space-y-2 break-words">
                                <p>
                                  <span className="text-yellow-200 font-semibold">
                                    ماذا:
                                  </span>{" "}
                                  {journalData.myActionPlan.what}
                                </p>
                                <p>
                                  <span className="text-yellow-200 font-semibold">
                                    متى:
                                  </span>{" "}
                                  {journalData.myActionPlan.when}
                                </p>
                                {journalData.myActionPlan.measure && (
                                  <p>
                                    <span className="text-yellow-200 font-semibold">
                                      كيف أقيس:
                                    </span>{" "}
                                    {journalData.myActionPlan.measure}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-purple-100 text-sm sm:text-base md:text-lg leading-relaxed break-words">
                                "{journalData.myActionPlan}"
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setActionPlanEditMode(true);
                              setShowActionPlanModal(true);
                            }}
                            className="text-xs sm:text-sm font-semibold text-white bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-white/30 self-end sm:self-start flex-shrink-0"
                          >
                            تعديل
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* --- 2. التبويبات الداخلية (الجديدة) --- */}
                    <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 py-3 sm:py-4 -mx-3 sm:-mx-4 lg:-mx-6 xl:-mx-8 px-3 sm:px-4 lg:px-6 xl:px-8">
                      <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 border-b border-gray-200 overflow-x-auto scrollbar-hide -mx-2 px-2">
                        <button
                          onClick={() => setInnerJournalTab("myReflections")}
                          className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-sm sm:text-base md:text-lg transition-all whitespace-nowrap flex-shrink-0 ${
                            innerJournalTab === "myReflections"
                              ? "text-[#7440E9] border-b-2 sm:border-b-3 md:border-b-4 border-[#7440E9]"
                              : "text-gray-500 hover:text-[#7440E9]"
                          }`}
                        >
                          فوائدي ({journalData.myReflections?.length || 0})
                        </button>
                        <button
                          onClick={() => setInnerJournalTab("savedReflections")}
                          className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-sm sm:text-base md:text-lg transition-all whitespace-nowrap flex-shrink-0 ${
                            innerJournalTab === "savedReflections"
                              ? "text-[#7440E9] border-b-2 sm:border-b-3 md:border-b-4 border-[#7440E9]"
                              : "text-gray-500 hover:text-[#7440E9]"
                          }`}
                        >
                          ما حفظته ({journalData.savedReflections?.length || 0})
                        </button>
                      </div>
                    </div>

                    {/* --- 3. محتوى التبويبات (باستخدام AnimatePresence) --- */}
                    <div className="space-y-6">
                      <AnimatePresence mode="wait">
                        {innerJournalTab === "myReflections" && (
                          <motion.div
                            key="myReflections"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                          >
                            {journalData.myReflections &&
                            journalData.myReflections.length > 0 ? (
                              journalData.myReflections.map((item) => (
                                <motion.div
                                  key={`my-${item.id}`}
                                  ref={(el) => {
                                    if (el)
                                      cardRefs.current[`my-${item.id}`] = el;
                                  }}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="relative bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all"
                                >
                                  <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#F7F6FB] to-[#F3EDFF] flex items-center justify-center border-2 border-[#7440E9]/30 flex-shrink-0">
                                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                                          أنت
                                        </h4>
                                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                                          يوم {item.day_number} •{" "}
                                          {item.task_title}
                                        </p>
                                      </div>
                                    </div>

                                    {/* زر القائمة (ثلاث نقاط) */}
                                    {!isReadOnly && !isCampNotStarted && (
                                      <div className="relative">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowJournalMenu((prev) => {
                                              const isOpen =
                                                prev[`my-${item.id}`];
                                              // إغلاق جميع القوائم الأخرى وفتح/إغلاق القائمة الحالية
                                              const newMenu = {};
                                              if (!isOpen) {
                                                newMenu[`my-${item.id}`] = true;
                                              }
                                              return newMenu;
                                            });
                                          }}
                                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                          aria-label="خيارات السجل"
                                        >
                                          <svg
                                            className="w-5 h-5 text-gray-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                          </svg>
                                        </button>

                                        {/* القائمة المنسدلة */}
                                        {showJournalMenu[`my-${item.id}`] && (
                                          <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[150px] journal-menu-popover">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditJournalReflection(
                                                  item
                                                );
                                                setShowJournalMenu((prev) => ({
                                                  ...prev,
                                                  [`my-${item.id}`]: false,
                                                }));
                                              }}
                                              className="w-full text-right px-4 py-2 hover:bg-blue-50 text-blue-600 text-sm flex items-center justify-end gap-2"
                                            >
                                              <span>تعديل</span>
                                              <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                              </svg>
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setReflectionToDelete(
                                                  item.progress_id
                                                );
                                                setShowDeleteModal(true);
                                                setShowJournalMenu((prev) => ({
                                                  ...prev,
                                                  [`my-${item.id}`]: false,
                                                }));
                                              }}
                                              className="w-full text-right px-4 py-2 hover:bg-red-50 text-red-600 text-sm flex items-center justify-end gap-2"
                                            >
                                              <span>حذف</span>
                                              <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                              </svg>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* نص التدبر */}
                                  {item.journal_entry && (
                                    <div className="mb-3 sm:mb-4">
                                      {(() => {
                                        const itemId = `my-${item.id}`;
                                        const fullText = item.journal_entry;
                                        const isExpanded =
                                          expandedJournalItems[itemId];
                                        const MAX_LENGTH = 50;
                                        // حساب الطول بدون HTML tags للعرض
                                        const textWithoutHtml =
                                          fullText.replace(/<[^>]*>/g, "");
                                        const shouldTruncate =
                                          textWithoutHtml.length > MAX_LENGTH;

                                        return (
                                          <>
                                            <div
                                              className="text-gray-800 text-sm sm:text-base md:text-lg leading-relaxed break-words prose prose-sm max-w-none"
                                              dangerouslySetInnerHTML={{
                                                __html:
                                                  isExpanded || !shouldTruncate
                                                    ? fullText
                                                    : truncateHTML(
                                                        fullText,
                                                        MAX_LENGTH
                                                      ),
                                              }}
                                            />
                                            {shouldTruncate && (
                                              <button
                                                onClick={() => {
                                                  setExpandedJournalItems(
                                                    (prev) => ({
                                                      ...prev,
                                                      [itemId]: !isExpanded,
                                                    })
                                                  );
                                                }}
                                                className="mt-2 text-[#7440E9] font-semibold text-sm hover:underline flex items-center gap-1"
                                              >
                                                {isExpanded
                                                  ? "عرض أقل"
                                                  : "المزيد"}
                                                {!isExpanded && (
                                                  <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M19 9l-7 7-7-7"
                                                    />
                                                  </svg>
                                                )}
                                              </button>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  )}

                                  {/* نص الفوائد */}
                                  {item.notes && (
                                    <div className="mb-3 sm:mb-4 pt-3 sm:pt-4 border-t border-gray-100">
                                      <h5 className="font-semibold text-gray-700 mb-1.5 sm:mb-2 text-sm sm:text-base">
                                        الفوائد المستخرجة:
                                      </h5>
                                      {(() => {
                                        const itemId = `my-notes-${item.id}`;
                                        const fullText = item.notes;
                                        const isExpanded =
                                          expandedJournalItems[itemId];
                                        const MAX_LENGTH = 50;
                                        const shouldTruncate =
                                          fullText.length > MAX_LENGTH;

                                        return (
                                          <>
                                            <p className="text-gray-700 leading-relaxed text-sm sm:text-base break-words">
                                              {isExpanded || !shouldTruncate
                                                ? fullText
                                                : fullText.substring(
                                                    0,
                                                    MAX_LENGTH
                                                  ) + "..."}
                                            </p>
                                            {shouldTruncate && (
                                              <button
                                                onClick={() => {
                                                  setExpandedJournalItems(
                                                    (prev) => ({
                                                      ...prev,
                                                      [itemId]: !isExpanded,
                                                    })
                                                  );
                                                }}
                                                className="mt-2 text-[#7440E9] font-semibold text-sm hover:underline flex items-center gap-1"
                                              >
                                                {isExpanded
                                                  ? "عرض أقل"
                                                  : "المزيد"}
                                                {!isExpanded && (
                                                  <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M19 9l-7 7-7-7"
                                                    />
                                                  </svg>
                                                )}
                                              </button>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  )}

                                  {/* عرض الخطوة العملية المقترحة */}
                                  {item.proposed_step && (
                                    <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-r-4 border-[#7440E9] rounded-lg shadow-sm">
                                      <div className="flex items-start gap-2 sm:gap-3">
                                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                          <h5 className="text-sm sm:text-base font-semibold text-[#7440E9] mb-2">
                                            الخطوة العملية المقترحة:
                                          </h5>
                                          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                                            {item.proposed_step}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-500 border-t border-gray-100 pt-3 sm:pt-4 action-buttons-footer">
                                    <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                                      {item.completed_at && (
                                        <div className="flex items-center">
                                          <Calendar className="w-4 h-4 mr-1" />
                                          <span>
                                            {new Date(
                                              item.completed_at
                                            ).toLocaleDateString("ar-SA", {
                                              day: "numeric",
                                              month: "short",
                                              year: "numeric",
                                            })}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2 sm:space-x-3 self-end sm:self-auto flex-wrap">
                                      <button
                                        onClick={() => {
                                          if (!isReadOnly) {
                                            handleToggleUpvote(
                                              item.progress_id
                                            );
                                          }
                                        }}
                                        disabled={isReadOnly}
                                        className={`flex items-center space-x-1 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full transition-colors duration-200 ${
                                          isReadOnly
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                                            : item.is_upvoted_by_user
                                            ? "bg-[#F7F6FB] text-[#7440E9] border border-[#7440E9]/20"
                                            : "bg-gray-100 text-gray-600 hover:bg-[#F7F6FB] hover:text-[#7440E9]"
                                        }`}
                                      >
                                        <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="font-semibold text-xs sm:text-sm">
                                          {item.upvote_count || 0}
                                        </span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (!isReadOnly) {
                                            handleToggleSave(item.progress_id);
                                          }
                                        }}
                                        disabled={isReadOnly}
                                        className={`flex items-center space-x-1 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full transition-colors duration-200 ${
                                          isReadOnly
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                                            : item.is_saved_by_user
                                            ? "bg-[#F3EDFF] text-[#7440E9] border border-[#7440E9]/20"
                                            : "bg-gray-100 text-gray-600 hover:bg-[#F3EDFF] hover:text-[#7440E9]"
                                        }`}
                                      >
                                        <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="font-semibold text-xs sm:text-sm">
                                          {item.save_count || 0}
                                        </span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* قائمة المشاركة (Popover) */}
                                  <AnimatePresence>
                                    {showShareMenu[`my-${item.id}`] && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.15 }}
                                        className="share-menu-popover absolute top-14 right-4 z-20 w-48 bg-white rounded-lg shadow-xl border border-gray-200 p-2"
                                      >
                                        <button
                                          onClick={async () => {
                                            const cardElement =
                                              cardRefs.current[`my-${item.id}`];
                                            if (!cardElement) return;

                                            const buttonsToHide =
                                              cardElement.querySelector(
                                                ".action-buttons-footer"
                                              );

                                            // إخفاء الأزرار
                                            if (buttonsToHide)
                                              buttonsToHide.style.display =
                                                "none";

                                            try {
                                              const dataUrl = await toPng(
                                                cardElement,
                                                {
                                                  cacheBust: true,
                                                  backgroundColor: "#ffffff",
                                                  pixelRatio: 2,
                                                }
                                              );

                                              const link =
                                                document.createElement("a");
                                              link.download = `mishkat-reflection-${item.id}.png`;
                                              link.href = dataUrl;
                                              link.click();

                                              toast.success(
                                                "تم تحويل البطاقة لصورة!"
                                              );
                                            } catch (err) {
                                              console.error(
                                                "Error converting to image:",
                                                err
                                              );
                                              toast.error(
                                                "حدث خطأ أثناء تحويل الصورة."
                                              );
                                            } finally {
                                              // إظهار الأزرار مرة أخرى
                                              if (buttonsToHide)
                                                buttonsToHide.style.display =
                                                  "flex";
                                              setShowShareMenu((prev) => ({
                                                ...prev,
                                                [`my-${item.id}`]: false,
                                              }));
                                            }
                                          }}
                                          className="w-full text-right px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                                        >
                                          <Download className="w-4 h-4" />
                                          تحويل لصورة (PNG)
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              ))
                            ) : (
                              <div className="text-center py-12 bg-gradient-to-br from-[#F7F6FB] to-[#F3EDFF] rounded-xl border border-[#7440E9]/20">
                                <Heart className="w-16 h-16 text-[#7440E9]/50 mx-auto mb-4" />
                                <h4 className="text-lg font-semibold text-[#7440E9] mb-2">
                                  لم تقم بكتابة أي فوائد بعد
                                </h4>
                                <p className="text-gray-600 text-sm">
                                  اكتب تدبرك وفوائدك عند إكمال المهام لتظهر هنا
                                </p>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {innerJournalTab === "savedReflections" && (
                          <motion.div
                            key="savedReflections"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                          >
                            {journalData.savedReflections &&
                            journalData.savedReflections.length > 0 ? (
                              journalData.savedReflections.map((item) => (
                                <motion.div
                                  key={`saved-${item.id}`}
                                  ref={(el) => {
                                    if (el)
                                      cardRefs.current[`saved-${item.id}`] = el;
                                  }}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="relative bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all"
                                >
                                  <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                                      {item.author_avatar &&
                                      !item.hide_identity ? (
                                        <img
                                          src={getAvatarUrl({
                                            avatar_url: item.author_avatar,
                                          })}
                                          alt={item.author_name}
                                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-[#7440E9]/30 flex-shrink-0"
                                          onError={(e) => {
                                            e.target.src =
                                              "/default-avatar.png";
                                          }}
                                        />
                                      ) : (
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#F7F6FB] to-[#F3EDFF] flex items-center justify-center border-2 border-[#7440E9]/30 flex-shrink-0">
                                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />
                                        </div>
                                      )}
                                      <h4 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                                        {item.hide_identity
                                          ? "مساهم مجهول"
                                          : item.author_name || "مساهم مجهول"}
                                      </h4>
                                    </div>
                                    {/* زر المشاركة */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowShareMenu((prev) => ({
                                          ...prev,
                                          [`saved-${item.id}`]:
                                            !prev[`saved-${item.id}`],
                                        }));
                                      }}
                                      className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0"
                                      aria-label="مشاركة"
                                    >
                                      <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                  </div>
                                  {(() => {
                                    const itemId = `saved-${item.id}`;
                                    const fullText =
                                      item.journal_entry ||
                                      item.reflectionText ||
                                      "";
                                    const isExpanded =
                                      expandedJournalItems[itemId];
                                    const MAX_LENGTH = 50;
                                    const shouldTruncate =
                                      fullText.length > MAX_LENGTH;

                                    return (
                                      <div className="mb-3 sm:mb-4">
                                        <p className="text-gray-800 text-sm sm:text-base md:text-lg leading-relaxed break-words">
                                          {isExpanded || !shouldTruncate
                                            ? fullText
                                            : fullText.substring(
                                                0,
                                                MAX_LENGTH
                                              ) + "..."}
                                        </p>
                                        {shouldTruncate && (
                                          <button
                                            onClick={() => {
                                              setExpandedJournalItems(
                                                (prev) => ({
                                                  ...prev,
                                                  [itemId]: !isExpanded,
                                                })
                                              );
                                            }}
                                            className="mt-2 text-[#7440E9] font-semibold text-sm hover:underline flex items-center gap-1"
                                          >
                                            {isExpanded ? "عرض أقل" : "المزيد"}
                                            {!isExpanded && (
                                              <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M19 9l-7 7-7-7"
                                                />
                                              </svg>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* عرض الخطوة العملية المقترحة في savedReflections */}
                                  {item.proposed_step && (
                                    <div className="mb-3 sm:mb-4 mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-r-4 border-[#7440E9] rounded-lg shadow-sm">
                                      <div className="flex items-start gap-2 sm:gap-3">
                                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                          <h5 className="text-sm sm:text-base font-semibold text-[#7440E9] mb-2">
                                            الخطوة العملية المقترحة:
                                          </h5>
                                          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                                            {item.proposed_step}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-500 border-t border-gray-100 pt-3 sm:pt-4 action-buttons-footer">
                                    <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                                      <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        <span>
                                          {item.saved_at &&
                                          !isNaN(new Date(item.saved_at))
                                            ? new Date(
                                                item.saved_at
                                              ).toLocaleDateString("ar-SA", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                              })
                                            : "تاريخ غير متاح"}
                                        </span>
                                      </div>
                                      <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        <span>
                                          {item.saved_at &&
                                          !isNaN(new Date(item.saved_at))
                                            ? new Date(
                                                item.saved_at
                                              ).toLocaleTimeString("ar-SA", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })
                                            : "--"}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 sm:space-x-3 self-end sm:self-auto">
                                      <button
                                        onClick={() => {
                                          if (!isReadOnly) {
                                            handleToggleUpvote(
                                              item.progress_id
                                            );
                                          }
                                        }}
                                        disabled={isReadOnly}
                                        className={`flex items-center space-x-1 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full transition-colors duration-200 ${
                                          isReadOnly
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                                            : item.is_upvoted_by_user
                                            ? "bg-[#F7F6FB] text-[#7440E9] border border-[#7440E9]/20"
                                            : "bg-gray-100 text-gray-600 hover:bg-[#F7F6FB] hover:text-[#7440E9]"
                                        }`}
                                      >
                                        <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="font-semibold text-xs sm:text-sm">
                                          {item.upvote_count || 0}
                                        </span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (!isReadOnly) {
                                            handleToggleSave(item.progress_id);
                                          }
                                        }}
                                        disabled={isReadOnly}
                                        className={`flex items-center space-x-1 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full transition-colors duration-200 ${
                                          isReadOnly
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                                            : item.is_saved_by_user
                                            ? "bg-[#F3EDFF] text-[#7440E9] border border-[#7440E9]/20"
                                            : "bg-gray-100 text-gray-600 hover:bg-[#F3EDFF] hover:text-[#7440E9]"
                                        }`}
                                      >
                                        <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="font-semibold text-xs sm:text-sm">
                                          {item.save_count || 0}
                                        </span>
                                      </button>

                                      {/* زر "ألتزم معك" (Pledge) - يظهر دائماً إذا كانت هناك خطوة عملية مقترحة */}
                                      {item.proposed_step && (
                                        <div className="relative">
                                          {/* رسالة متحركة فوق الزر */}
                                          <AnimatePresence>
                                            {showPledgeTooltip[
                                              item.progress_id
                                            ] && (
                                              <motion.div
                                                initial={{
                                                  opacity: 0,
                                                  y: -10,
                                                  scale: 0.8,
                                                }}
                                                animate={{
                                                  opacity: 1,
                                                  y: -50,
                                                  scale: 1,
                                                }}
                                                exit={{
                                                  opacity: 0,
                                                  y: -20,
                                                  scale: 0.8,
                                                }}
                                                transition={{
                                                  type: "spring",
                                                  stiffness: 300,
                                                  damping: 20,
                                                }}
                                                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none"
                                              >
                                                <motion.div
                                                  animate={{
                                                    y:
                                                      pledgedSteps.has(
                                                        item.progress_id
                                                      ) ||
                                                      item.is_pledged_by_user ===
                                                        1
                                                        ? [0, -3, 0]
                                                        : [0, -5, 0],
                                                  }}
                                                  transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                  }}
                                                  className="bg-gradient-to-r from-[#7440E9] to-[#5a2fc7] text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-2 border border-white/20"
                                                >
                                                  <motion.div
                                                    animate={{
                                                      rotate:
                                                        pledgedSteps.has(
                                                          item.progress_id
                                                        ) ||
                                                        item.is_pledged_by_user ===
                                                          1
                                                          ? [0, 15, -15, 0]
                                                          : [0, 10, -10, 0],
                                                    }}
                                                    transition={{
                                                      duration: 0.6,
                                                      repeat: Infinity,
                                                      repeatDelay: 1,
                                                    }}
                                                  >
                                                    <HandHeart className="w-3 h-3 sm:w-4 sm:h-4" />
                                                  </motion.div>
                                                  <span>
                                                    {pledgedSteps.has(
                                                      item.progress_id
                                                    ) ||
                                                    item.is_pledged_by_user ===
                                                      1
                                                      ? "تم الالتزام بنجاح! ✅"
                                                      : "اضغط للالتزام بهذه الخطوة"}
                                                  </span>
                                                  {/* سهم يشير للزر */}
                                                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                                                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-[#7440E9]"></div>
                                                  </div>
                                                </motion.div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>

                                          <motion.button
                                            whileTap={
                                              !isReadOnly &&
                                              !isCampNotStarted &&
                                              pledgingProgressId !==
                                                item.progress_id &&
                                              !pledgedSteps.has(
                                                item.progress_id
                                              ) &&
                                              !item.is_pledged_by_user
                                                ? { scale: 0.9 }
                                                : {}
                                            }
                                            onMouseEnter={() => {
                                              if (
                                                !isReadOnly &&
                                                !isCampNotStarted &&
                                                pledgingProgressId !==
                                                  item.progress_id
                                              ) {
                                                setShowPledgeTooltip(
                                                  (prev) => ({
                                                    ...prev,
                                                    [item.progress_id]: true,
                                                  })
                                                );
                                              }
                                            }}
                                            onMouseLeave={() => {
                                              // إخفاء الرسالة فقط إذا لم يكن هناك التزام حديث (بعد 3 ثوان من الالتزام)
                                              // إذا كان المستخدم قد التزم للتو، دع الرسالة تظهر
                                              const hasRecentPledge =
                                                pledgedSteps.has(
                                                  item.progress_id
                                                ) ||
                                                item.is_pledged_by_user === 1;

                                              // إذا لم يكن هناك التزام، أو مرت 3 ثوان بعد الالتزام، أخفي الرسالة
                                              if (!hasRecentPledge) {
                                                setShowPledgeTooltip(
                                                  (prev) => ({
                                                    ...prev,
                                                    [item.progress_id]: false,
                                                  })
                                                );
                                              }
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (
                                                !isReadOnly &&
                                                !isCampNotStarted &&
                                                pledgingProgressId !==
                                                  item.progress_id &&
                                                !pledgedSteps.has(
                                                  item.progress_id
                                                ) &&
                                                !item.is_pledged_by_user
                                              ) {
                                                handlePledgeToJointStep(
                                                  item.progress_id
                                                );
                                              }
                                            }}
                                            disabled={
                                              isReadOnly ||
                                              isCampNotStarted ||
                                              pledgingProgressId ===
                                                item.progress_id ||
                                              pledgedSteps.has(
                                                item.progress_id
                                              ) ||
                                              item.is_pledged_by_user === 1
                                            }
                                            title={
                                              isReadOnly || isCampNotStarted
                                                ? "لا يمكن الالتزام في هذا الوقت"
                                                : pledgingProgressId ===
                                                  item.progress_id
                                                ? "جاري الالتزام..."
                                                : pledgedSteps.has(
                                                    item.progress_id
                                                  ) ||
                                                  item.is_pledged_by_user === 1
                                                ? "تم الالتزام بهذه الخطوة"
                                                : "اضغط للالتزام بهذه الخطوة العملية"
                                            }
                                            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 ${
                                              isReadOnly ||
                                              isCampNotStarted ||
                                              pledgingProgressId ===
                                                item.progress_id
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                                                : pledgedSteps.has(
                                                    item.progress_id
                                                  ) ||
                                                  item.is_pledged_by_user === 1
                                                ? "bg-[#7440E9] text-white border-[#7440E9]/20"
                                                : "bg-gray-100 text-gray-600 hover:bg-[#F7F6FB] hover:text-[#7440E9]"
                                            }`}
                                            aria-label="ألتزم معك"
                                          >
                                            {pledgingProgressId ===
                                            item.progress_id ? (
                                              <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-gray-600"></div>
                                            ) : (
                                              <motion.div
                                                animate={
                                                  pledgedSteps.has(
                                                    item.progress_id
                                                  ) ||
                                                  item.is_pledged_by_user === 1
                                                    ? {
                                                        scale: [1, 1.1, 1],
                                                      }
                                                    : {}
                                                }
                                                transition={{
                                                  duration: 0.3,
                                                  repeat:
                                                    pledgedSteps.has(
                                                      item.progress_id
                                                    ) ||
                                                    item.is_pledged_by_user ===
                                                      1
                                                      ? Infinity
                                                      : 0,
                                                  repeatDelay: 2,
                                                }}
                                              >
                                                <HandHeart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                              </motion.div>
                                            )}
                                            <div className="font-semibold text-[10px] sm:text-xs md:text-sm min-w-[1rem] sm:min-w-[1.25rem] text-center">
                                              <AnimatePresence
                                                mode="wait"
                                                initial={false}
                                              >
                                                <motion.span
                                                  key={String(
                                                    item.pledge_count !==
                                                      undefined &&
                                                      item.pledge_count !== null
                                                      ? item.pledge_count
                                                      : 0
                                                  )}
                                                  initial={{
                                                    y: -10,
                                                    opacity: 0,
                                                    scale: 1.2,
                                                  }}
                                                  animate={{
                                                    y: 0,
                                                    opacity: 1,
                                                    scale: 1,
                                                  }}
                                                  exit={{
                                                    y: 10,
                                                    opacity: 0,
                                                    scale: 0.8,
                                                  }}
                                                  transition={{
                                                    type: "spring",
                                                    stiffness: 500,
                                                    damping: 15,
                                                  }}
                                                >
                                                  {item.pledge_count !==
                                                    undefined &&
                                                  item.pledge_count !== null
                                                    ? item.pledge_count
                                                    : 0}
                                                </motion.span>
                                              </AnimatePresence>
                                            </div>
                                          </motion.button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              ))
                            ) : (
                              <div className="text-center py-12 bg-gradient-to-br from-[#F7F6FB] to-[#F3EDFF] rounded-xl border border-[#7440E9]/20">
                                <Bookmark className="w-16 h-16 text-[#7440E9]/50 mx-auto mb-4" />
                                <h4 className="text-lg font-semibold text-[#7440E9] mb-2">
                                  لا توجد فوائد محفوظة
                                </h4>
                                <p className="text-gray-600 text-sm mb-6">
                                  لم تقم بحفظ أي فوائد من قاعة التدارس بعد. اضغط
                                  على أيقونة "الحفظ" لإضافتها هنا.
                                </p>
                                <button
                                  onClick={() => setActiveTab("study")}
                                  className="px-6 py-3 bg-[#7440E9] text-white rounded-lg hover:bg-[#5a2fc7] transition-colors shadow-md hover:shadow-lg"
                                >
                                  انتقل إلى قاعة التدارس
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-10">
                    حدث خطأ أثناء تحميل سجلك.
                  </p>
                )}
              </div>
            </motion.div>

            {/* Resources Tab */}
            <motion.div
              key="resources"
              initial={false}
              animate={{
                opacity: activeTab === "resources" ? 1 : 0,
                display: activeTab === "resources" ? "block" : "none",
              }}
              transition={{ duration: 0.2 }}
              style={{
                position: activeTab === "resources" ? "relative" : "absolute",
                width: "100%",
                pointerEvents: activeTab === "resources" ? "auto" : "none",
              }}
            >
              <CampResources
                resources={resources}
                isLoading={resourcesLoading}
              />
            </motion.div>

            {/* Q&A Tab */}
            <motion.div
              key="qanda"
              initial={false}
              animate={{
                opacity: activeTab === "qanda" ? 1 : 0,
                display: activeTab === "qanda" ? "block" : "none",
              }}
              transition={{ duration: 0.2 }}
              style={{
                position: activeTab === "qanda" ? "relative" : "absolute",
                width: "100%",
                pointerEvents: activeTab === "qanda" ? "auto" : "none",
              }}
            >
              <CampQandA
                campId={camp.id}
                qanda={qanda}
                isLoading={qandaLoading}
                onQuestionAsked={handleQuestionAsked}
              />
            </motion.div>

            {/* Friends Tab */}
            <motion.div
              key="friends"
              initial={false}
              animate={{
                opacity: activeTab === "friends" ? 1 : 0,
                display: activeTab === "friends" ? "block" : "none",
              }}
              transition={{ duration: 0.2 }}
              style={{
                position: activeTab === "friends" ? "relative" : "absolute",
                width: "100%",
                pointerEvents: activeTab === "friends" ? "auto" : "none",
              }}
            >
              <FriendsTab campId={camp.id} />
            </motion.div>
          </div>

          {/* ----- Onboarding Modals ----- */}
          <AnimatePresence>
            {showTaskModalIntro && (
              <OnboardingModal
                key="taskModalIntro"
                isOpen={showTaskModalIntro}
                onClose={() =>
                  closeOnboarding("taskModal", setShowTaskModalIntro, () => {
                    // إعادة فتح مهام اليوم بعد الإغلاق
                    const tasksForDay = userProgress?.tasks?.filter(
                      (task) => task.day_number === selectedDay
                    );
                    if (tasksForDay && tasksForDay.length > 0) {
                      setShowTaskSidebar(true);
                    } else {
                      setShowTaskSidebar(true);
                    }
                  })
                }
                title="مهام اليوم"
                icon={Edit3}
              >
                هنا ستجد مهام اليوم (قراءة، حفظ، تفسير...). أكملها واكتب فائدتك
                للمشاركة في قاعة التدارس.
              </OnboardingModal>
            )}

            {showStudyHallIntro && (
              <OnboardingModal
                key="studyHallIntro"
                isOpen={showStudyHallIntro}
                onClose={() =>
                  closeOnboarding("studyHall", setShowStudyHallIntro, () =>
                    setActiveTab("study")
                  )
                }
                title="قاعة التدارس"
                icon={StudyHallIcon}
              >
                هذه هي ساحة النقاش الجماعي! هنا سترى الفوائد التي يشاركها
                الجميع. يمكنك التصويت للمفيد منها وحفظ ما يعجبك في سجلك.
              </OnboardingModal>
            )}

            {showJournalIntro && (
              <OnboardingModal
                key="journalIntro"
                isOpen={showJournalIntro}
                onClose={() =>
                  closeOnboarding("journal", setShowJournalIntro, () =>
                    setActiveTab("my_journal")
                  )
                }
                title="سجلي الشخصي"
                icon={JournalIcon}
              >
                هذا هو كنزك الخاص! ستجد هنا كل الفوائد التي كتبتها بنفسك، والتي
                حفظتها من قاعة التدارس، وخطة عملك.
              </OnboardingModal>
            )}

            {showLeaderboardIntro && (
              <OnboardingModal
                key="leaderboardIntro"
                isOpen={showLeaderboardIntro}
                onClose={() =>
                  closeOnboarding("leaderboard", setShowLeaderboardIntro, () =>
                    setActiveTab("leaderboard")
                  )
                }
                title="لوحة الصدارة"
                icon={LeaderboardIcon}
              >
                تنافس إيجابي يوضح ترتيب المشاركين بناءً على النقاط المكتسبة من
                إكمال المهام والتفاعل.
              </OnboardingModal>
            )}

            {showActionPlanIntro && (
              <OnboardingModal
                key="actionPlanIntro"
                isOpen={showActionPlanIntro}
                onClose={() =>
                  closeOnboarding("actionPlan", setShowActionPlanIntro, () =>
                    setShowActionPlanModal(true)
                  )
                }
                title="خطة العمل"
                icon={Target}
              >
                في اليوم الأخير، تحدد هنا التزامك العملي المستمر بعد انتهاء
                المخيم.
              </OnboardingModal>
            )}
          </AnimatePresence>

          {/* نافذة عرض جميع الملاحظات - منفصلة تمامًا لمنع rerender */}
          {showAllNotes && (
            <NotesModal
              key="notes-modal-instance"
              campId={id}
              onClose={closeNotesModal}
            />
          )}
          {/* Task Sidebar */}
          <AnimatePresence>
            {showTaskSidebar && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => setShowTaskSidebar(false)}
              >
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed right-0 top-[60px] sm:top-[60px] h-screen sm:h-[calc(100vh-50px)] pb-8 mb-4 w-full sm:max-w-md bg-white shadow-2xl overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Sidebar Header - Sticky */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-4 lg:p-6 z-10 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">
                          مهام اليوم {selectedDay}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                          {userProgress?.tasks?.filter(
                            (task) => task.day_number === selectedDay
                          )?.length || 0}{" "}
                          مهمة
                        </p>
                      </div>
                      <button
                        onClick={() => setShowTaskSidebar(false)}
                        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 active:scale-95"
                        aria-label="إغلاق"
                      >
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* رسالة توضيحية للمخيم الذي لم يبدأ بعد */}
                  {isCampNotStarted && (
                    <div className="p-3 sm:p-4 lg:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <Clock3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-bold text-blue-900 mb-1">
                            ⏳ المخيم لم يبدأ بعد
                          </h4>
                          <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                            عذراً، المخيم في حالة التسجيل المبكر. لا يمكنك فتح
                            المهام أو إكمالها حتى يبدأ الادمن المخيم. سيتم
                            إشعارك عند بدء المخيم.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tasks List */}
                  <div className="p-3 sm:p-4 lg:p-6 space-y-6 pb-4 sm:pb-6 mb-4">
                    {(() => {
                      const dayTasks =
                        userProgress?.tasks?.filter(
                          (task) => task.day_number === selectedDay
                        ) || [];
                      const taskTree = buildTaskTree(
                        dayTasks,
                        taskGroups || []
                      );

                      return (
                        <div className="space-y-6">
                          {taskTree.map((group, groupIndex) => {
                            // Handle ungrouped tasks
                            if (group.type === "ungrouped") {
                              return (
                                <div
                                  key="ungrouped"
                                  className="space-y-3 sm:space-y-4"
                                >
                                  {group.children.map((task, taskIndex) => (
                                    <motion.div
                                      key={task.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{
                                        delay:
                                          groupIndex * 0.2 + taskIndex * 0.1,
                                      }}
                                      className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all duration-300 ${
                                        task.completed
                                          ? "bg-green-50 border-green-200 shadow-md"
                                          : "bg-white border-gray-200 active:border-purple-300 sm:hover:border-purple-300 active:shadow-sm sm:hover:shadow-sm"
                                      }`}
                                    >
                                      {/* Task Header */}
                                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 relative">
                                        <div
                                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                            task.completed
                                              ? "bg-green-500"
                                              : "bg-[#7440E9]"
                                          }`}
                                        >
                                          {task.completed ? (
                                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                          ) : (
                                            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-2">
                                            <h4
                                              className={`font-semibold text-sm sm:text-base truncate flex-1 ${
                                                task.completed
                                                  ? "text-green-700 line-through decoration-green-500 decoration-2"
                                                  : "text-gray-800"
                                              }`}
                                            >
                                              {task.title}
                                            </h4>
                                            {/* Completion Counter Badge */}
                                            <TaskCompletionStats
                                              friendsWhoCompleted={
                                                task.completed_by_friends || []
                                              }
                                              totalCount={
                                                task.completed_by_count || 0
                                              }
                                            />
                                          </div>
                                          <p
                                            className={`text-xs sm:text-sm truncate mt-0.5 ${
                                              task.completed
                                                ? "text-green-600 line-through decoration-green-400 decoration-1"
                                                : "text-gray-500"
                                            }`}
                                          >
                                            {task.description}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Task Info */}
                                      <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                                        <span className="flex items-center gap-1">
                                          ⏱️ {task.estimated_time || "30 دقيقة"}
                                        </span>
                                        {task.points && (
                                          <span className="flex items-center gap-1">
                                            ⭐ {task.points}
                                          </span>
                                        )}
                                        <span
                                          className={`px-2 py-0.5 sm:py-1 rounded-full text-xs ${
                                            task.is_optional
                                              ? "bg-orange-100 text-orange-700"
                                              : "bg-blue-100 text-blue-700"
                                          }`}
                                        >
                                          {task.is_optional
                                            ? "اختياري"
                                            : "مطلوب"}
                                        </span>
                                      </div>

                                      {/* زر عرض المهمة */}
                                      <button
                                        onClick={() => {
                                          const taskWithPath = {
                                            ...task,
                                            path:
                                              task.path ||
                                              buildTaskPath(
                                                task,
                                                taskGroups || [],
                                                selectedDay
                                              ),
                                          };
                                          setSelectedTask(taskWithPath);
                                          setReflectionText(
                                            task.journal_entry || ""
                                          );
                                          setActiveTaskTab("task");
                                          setShowReflectionModal(true);
                                          setShowTaskSidebar(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-50 text-purple-600 rounded-lg active:bg-purple-100 sm:hover:bg-purple-100 transition-colors text-sm sm:text-base font-medium active:scale-95 sm:active:scale-100"
                                      >
                                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                                        عرض المهمة
                                      </button>
                                    </motion.div>
                                  ))}
                                </div>
                              );
                            }

                            // Handle grouped tasks
                            return (
                              <motion.div
                                key={group.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: groupIndex * 0.2 }}
                              >
                                {/* Group Header - Clickable */}
                                <button
                                  onClick={() => {
                                    setExpandedGroups((prev) => ({
                                      ...prev,
                                      [group.id]:
                                        prev[group.id] === undefined
                                          ? false
                                          : !prev[group.id],
                                    }));
                                  }}
                                  className="w-full text-right flex items-center justify-between gap-2 mb-3 pb-2 border-b border-purple-100 hover:border-purple-200 transition-colors group"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <motion.div
                                      animate={{
                                        rotate:
                                          expandedGroups[group.id] === false
                                            ? -90
                                            : 0,
                                      }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <ChevronDown className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                    </motion.div>
                                    <h4 className="text-lg sm:text-xl font-bold text-purple-700 group-hover:text-purple-800 transition-colors truncate">
                                      {group.title}
                                    </h4>
                                    <span className="text-sm text-gray-500 flex-shrink-0">
                                      ({group.children.length})
                                    </span>
                                  </div>
                                </button>
                                {group.description && (
                                  <p className="text-sm text-gray-600 mb-4 pr-7">
                                    {group.description}
                                  </p>
                                )}

                                {/* Group Tasks - Collapsible */}
                                <AnimatePresence>
                                  {expandedGroups[group.id] !== false && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{
                                        height: "auto",
                                        opacity: 1,
                                      }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="space-y-3 sm:space-y-4 pr-4">
                                        {group.children.map(
                                          (task, taskIndex) => (
                                            <motion.div
                                              key={task.id}
                                              initial={{ opacity: 0, x: -20 }}
                                              animate={{ opacity: 1, x: 0 }}
                                              transition={{
                                                delay:
                                                  groupIndex * 0.2 +
                                                  taskIndex * 0.1,
                                              }}
                                              className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all duration-300 ${
                                                task.completed
                                                  ? "bg-green-50 border-green-200 shadow-md"
                                                  : "bg-white border-gray-200 active:border-purple-300 sm:hover:border-purple-300 active:shadow-sm sm:hover:shadow-sm"
                                              }`}
                                            >
                                              {/* Task Header */}
                                              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 relative">
                                                <div
                                                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                    task.completed
                                                      ? "bg-green-500"
                                                      : "bg-[#7440E9]"
                                                  }`}
                                                >
                                                  {task.completed ? (
                                                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                  ) : (
                                                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                  )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center justify-between gap-2">
                                                    <h4
                                                      className={`font-semibold text-sm sm:text-base truncate flex-1 ${
                                                        task.completed
                                                          ? "text-green-700 line-through decoration-green-500 decoration-2"
                                                          : "text-gray-800"
                                                      }`}
                                                    >
                                                      {task.title}
                                                    </h4>
                                                    {/* Completion Counter Badge */}
                                                    <TaskCompletionStats
                                                      friendsWhoCompleted={
                                                        task.completed_by_friends ||
                                                        []
                                                      }
                                                      totalCount={
                                                        task.completed_by_count ||
                                                        0
                                                      }
                                                    />
                                                  </div>
                                                  <p
                                                    className={`text-xs sm:text-sm truncate mt-0.5 ${
                                                      task.completed
                                                        ? "text-green-600 line-through decoration-green-400 decoration-1"
                                                        : "text-gray-500"
                                                    }`}
                                                  >
                                                    {task.description}
                                                  </p>
                                                </div>
                                              </div>

                                              {/* Task Info */}
                                              <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                                                <span className="flex items-center gap-1">
                                                  ⏱️{" "}
                                                  {task.estimated_time ||
                                                    "30 دقيقة"}
                                                </span>
                                                {task.points && (
                                                  <span className="flex items-center gap-1">
                                                    ⭐ {task.points}
                                                  </span>
                                                )}
                                                <span
                                                  className={`px-2 py-0.5 sm:py-1 rounded-full text-xs ${
                                                    task.is_optional
                                                      ? "bg-orange-100 text-orange-700"
                                                      : "bg-blue-100 text-blue-700"
                                                  }`}
                                                >
                                                  {task.is_optional
                                                    ? "اختياري"
                                                    : "مطلوب"}
                                                </span>
                                              </div>

                                              {/* زر عرض المهمة */}
                                              <button
                                                onClick={() => {
                                                  const taskWithPath = {
                                                    ...task,
                                                    path:
                                                      task.path ||
                                                      buildTaskPath(
                                                        task,
                                                        taskGroups || [],
                                                        selectedDay
                                                      ),
                                                  };
                                                  setSelectedTask(taskWithPath);
                                                  setReflectionText(
                                                    task.journal_entry || ""
                                                  );
                                                  setActiveTaskTab("task");
                                                  setShowReflectionModal(true);
                                                  setShowTaskSidebar(false);
                                                }}
                                                className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-50 text-purple-600 rounded-lg active:bg-purple-100 sm:hover:bg-purple-100 transition-colors text-sm sm:text-base font-medium active:scale-95 sm:active:scale-100"
                                              >
                                                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                                                عرض المهمة
                                              </button>
                                            </motion.div>
                                          )
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* مهمة كتابة الـ Action Plan في اليوم الأخير */}
                    {selectedDay === camp.duration_days && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay:
                            (userProgress?.tasks?.filter(
                              (task) => task.day_number === selectedDay
                            )?.length || 0) * 0.1,
                        }}
                        className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 active:border-purple-400 sm:hover:border-purple-400 active:shadow-md sm:hover:shadow-md transition-all duration-300"
                      >
                        {/* Task Header */}
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg">
                            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base text-gray-800">
                              كتابة خطة العمل
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                              اكتب خطتك العملية لتطبيق ما تعلمته
                            </p>
                          </div>
                        </div>

                        {/* Task Info */}
                        <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                          <span>📝 مهمة نهائية</span>
                          <span className="px-2 py-0.5 sm:py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                            مطلوب
                          </span>
                        </div>

                        {/* زر فتح Action Plan Modal */}
                        <button
                          onClick={() => {
                            setShowTaskSidebar(false);
                            handleOnboarding(
                              "actionPlan",
                              setShowActionPlanIntro,
                              () => setShowActionPlanModal(true)
                            );
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg active:from-purple-700 active:to-indigo-700 sm:hover:from-purple-700 sm:hover:to-indigo-700 transition-all duration-300 text-sm sm:text-base font-semibold shadow-md active:shadow-lg sm:hover:shadow-lg transform active:scale-95 sm:hover:scale-105"
                        >
                          <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                          كتابة خطة العمل
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reflection Modal */}
          <AnimatePresence>
            {showReflectionModal && selectedTask && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 sm:top-[60px] bg-black/50 z-50 flex items-center justify-center p-0 sm:p-2 md:p-4"
                onClick={() => {
                  setShowReflectionModal(false);
                  setActiveTaskTab("task");
                  setReflectionToEdit(null);
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-none sm:rounded-xl md:rounded-2xl max-w-4xl w-full h-full sm:h-[95vh] md:h-auto md:max-h-[calc(100vh-2rem)] shadow-2xl flex flex-col overflow-hidden m-0 sm:m-2 md:m-4"
                >
                  {/* Sticky Header */}
                  <div className="sticky top-[60px] sm:top-[20px] bg-white border-b border-gray-200 p-3 sm:p-4 md:p-6 pb-3 sm:pb-4 md:pb-6 z-20 flex-shrink-0">
                    <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0 pr-1 sm:pr-0">
                        {/* Breadcrumbs */}
                        {selectedTask.path && selectedTask.path.length > 0 && (
                          <div
                            className="flex items-center gap-1 text-[10px] xs:text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2 overflow-x-auto scrollbar-hide"
                            dir="rtl"
                          >
                            {selectedTask.path.map((segment, index) => {
                              // Support both old format (string) and new format (object)
                              const segmentObj =
                                typeof segment === "string"
                                  ? { type: "day", title: segment }
                                  : segment;
                              const isGroup = segmentObj.type === "group";
                              const isClickable = isGroup;

                              return (
                                <div
                                  key={index}
                                  className="flex items-center flex-shrink-0"
                                >
                                  {isClickable ? (
                                    <button
                                      onClick={() => {
                                        // Toggle group in sidebar
                                        setExpandedGroups((prev) => ({
                                          ...prev,
                                          [segmentObj.groupId]:
                                            prev[segmentObj.groupId] ===
                                            undefined
                                              ? false
                                              : !prev[segmentObj.groupId],
                                        }));
                                        // Open sidebar if closed and set the correct day
                                        if (!showTaskSidebar) {
                                          // Find day number from path or use selectedTask's day
                                          const daySegment =
                                            selectedTask.path.find((s) => {
                                              const seg =
                                                typeof s === "string"
                                                  ? { type: "day", title: s }
                                                  : s;
                                              return seg.type === "day";
                                            });
                                          const dayToShow =
                                            daySegment?.dayNumber ||
                                            (typeof daySegment === "object"
                                              ? daySegment.dayNumber
                                              : null) ||
                                            selectedTask.day_number ||
                                            selectedDay;
                                          setSelectedDay(dayToShow);
                                          setShowTaskSidebar(true);
                                          setShowReflectionModal(false);
                                        }
                                      }}
                                      className="hover:text-purple-600 hover:underline transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                      {segmentObj.title}
                                    </button>
                                  ) : (
                                    <span className="hover:text-gray-700 transition-colors whitespace-nowrap">
                                      {segmentObj.title}
                                    </span>
                                  )}
                                  {index < selectedTask.path.length - 1 && (
                                    <ChevronLeft className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-gray-400 mx-0.5 sm:mx-1 flex-shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate leading-tight">
                          {selectedTask.title}
                        </h3>
                        <p className="text-[10px] xs:text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                          تفاصيل المهمة والتدبر
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowReflectionModal(false);
                          setActiveTaskTab("task");
                          setReflectionToEdit(null);
                        }}
                        className="p-1.5 xs:p-2 sm:p-2.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 active:scale-95 mt-0.5 sm:mt-0"
                        aria-label="إغلاق"
                      >
                        <X className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-gray-500" />
                      </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 sm:gap-2 mt-3 sm:mt-4 border-b border-gray-200">
                      <button
                        onClick={() => setActiveTaskTab("task")}
                        className={`flex-1 px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 text-xs xs:text-sm sm:text-base transition-colors relative font-medium outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${
                          activeTaskTab === "task"
                            ? "text-purple-600"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        تفاصيل المهمة
                        {activeTaskTab === "task" && (
                          <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-purple-600 rounded-t"></span>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTaskTab("reflection")}
                        className={`flex-1 px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 text-xs xs:text-sm sm:text-base transition-colors relative font-medium outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${
                          activeTaskTab === "reflection"
                            ? "text-purple-600"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        تدبري وإتمام
                        {activeTaskTab === "reflection" && (
                          <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-purple-600 rounded-t"></span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="overflow-y-auto flex-1 min-h-0 mt-20 sm:mt-0 p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 pb-3 xs:pb-4 sm:pb-5 md:pb-6">
                    {/* Tab Content: Task */}
                    {activeTaskTab === "task" && (
                      <div className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6">
                        {/* رسالة توضيحية للمخيم الذي لم يبدأ بعد */}
                        {isCampNotStarted && (
                          <div className="mb-4 xs:mb-5 sm:mb-6 p-3 xs:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500 rounded-lg xs:rounded-xl shadow-md">
                            <div className="flex items-start gap-2 xs:gap-3">
                              <div className="flex-shrink-0 w-8 h-8 xs:w-10 xs:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                <Clock3 className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm xs:text-base font-bold text-blue-900 mb-1">
                                  ⏳ المخيم لم يبدأ بعد
                                </h4>
                                <p className="text-xs xs:text-sm text-blue-800 leading-relaxed">
                                  عذراً، المخيم في حالة التسجيل المبكر. لا يمكنك
                                  إكمال هذه المهمة أو حفظ الفوائد حتى يبدأ
                                  الادمن المخيم. سيتم إشعارك عند بدء المخيم.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* تفاصيل المهمة */}
                        <div className="bg-gray-50 rounded-lg p-3 xs:p-3.5 sm:p-4">
                          <h4 className="font-semibold text-sm xs:text-base sm:text-lg text-gray-800 mb-2 xs:mb-2.5 sm:mb-3 arabic-text">
                            تفاصيل المهمة:
                          </h4>
                          <div className="space-y-2.5 xs:space-y-3 sm:space-y-4">
                            <p className="text-gray-600 text-xs xs:text-sm sm:text-base md:text-lg leading-relaxed arabic-text break-words">
                              {selectedTask.description}
                            </p>

                            <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 text-[10px] xs:text-xs sm:text-sm text-gray-500 flex-wrap arabic-text">
                              <span>
                                ⏱️ {selectedTask.estimated_time || "30 دقيقة"}
                              </span>
                              {selectedTask.points && (
                                <span>⭐ {selectedTask.points} نقطة</span>
                              )}
                              <span
                                className={`px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full text-[10px] xs:text-xs font-medium arabic-text ${
                                  selectedTask.is_optional
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {selectedTask.is_optional ? "اختياري" : "مطلوب"}
                              </span>
                            </div>

                            {/* تفاصيل الآيات */}
                            {(selectedTask.verses_from ||
                              selectedTask.verses_to) && (
                              <div>
                                <div className="flex items-center gap-1.5 xs:gap-2 text-[10px] xs:text-xs sm:text-sm text-[#7440E9] bg-blue-50 px-2 xs:px-3 py-1.5 xs:py-2 rounded-lg arabic-text">
                                  <BookOpen className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                                  <span className="font-medium">
                                    {selectedTask.verses_from &&
                                    selectedTask.verses_to
                                      ? `الآيات ${selectedTask.verses_from} - ${selectedTask.verses_to}`
                                      : selectedTask.verses_from
                                      ? `من الآية ${selectedTask.verses_from}`
                                      : `إلى الآية ${selectedTask.verses_to}`}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* الروابط */}
                            {(selectedTask.tafseer_link ||
                              selectedTask.youtube_link) && (
                              <div className="flex flex-col xs:flex-row gap-2 xs:gap-2.5 sm:gap-3 pt-2">
                                {selectedTask.tafseer_link && (
                                  <a
                                    href={selectedTask.tafseer_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 xs:gap-2 px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 bg-blue-100 text-blue-700 text-[11px] xs:text-xs sm:text-sm rounded-lg active:bg-blue-200 sm:hover:bg-blue-200 transition-colors font-semibold"
                                  >
                                    <BookOpen className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                                    افتح التفسير
                                  </a>
                                )}
                                {selectedTask.youtube_link && (
                                  <a
                                    href={selectedTask.youtube_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 xs:gap-2 px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 bg-red-100 text-red-700 text-[11px] xs:text-xs sm:text-sm rounded-lg active:bg-red-200 sm:hover:bg-red-200 transition-colors font-semibold"
                                  >
                                    <Play className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                                    شاهد الفيديو
                                  </a>
                                )}
                              </div>
                            )}

                            {/* الجسر بين القراءة والكتابة */}
                            <div className="mt-3 xs:mt-4 sm:mt-5 pt-2.5 xs:pt-3 sm:pt-4 border-t border-gray-200">
                              <button
                                onClick={() => setActiveTaskTab("reflection")}
                                className="hidden w-full sm:flex items-center justify-center gap-1.5 xs:gap-2 px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 sm:py-3.5 bg-purple-600 text-white rounded-lg xs:rounded-xl sm:rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-xs xs:text-sm sm:text-base active:scale-95"
                              >
                                <span className="text-center">
                                  قرأت المهمة، سأبدأ كتابة تدبري الآن
                                </span>
                                <ArrowLeft className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 font-bold flex-shrink-0" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab Content: Reflection */}
                    {activeTaskTab === "reflection" && (
                      <div className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6">
                        {/* رسالة توضيحية للمخيم الذي لم يبدأ بعد */}
                        {isCampNotStarted && (
                          <div className="mb-4 xs:mb-5 sm:mb-6 p-3 xs:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500 rounded-lg xs:rounded-xl shadow-md">
                            <div className="flex items-start gap-2 xs:gap-3">
                              <div className="flex-shrink-0 w-8 h-8 xs:w-10 xs:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                <Clock3 className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm xs:text-base font-bold text-blue-900 mb-1">
                                  ⏳ المخيم لم يبدأ بعد
                                </h4>
                                <p className="text-xs xs:text-sm text-blue-800 leading-relaxed">
                                  عذراً، المخيم في حالة التسجيل المبكر. لا يمكنك
                                  إكمال هذه المهمة أو حفظ الفوائد حتى يبدأ
                                  الادمن المخيم. سيتم إشعارك عند بدء المخيم.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ----- بداية قسم الكتابة الموحد مع المحرر الغني ----- */}
                        <div>
                          <label
                            htmlFor="reflectionInput"
                            className="block text-sm xs:text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1.5 xs:mb-2"
                          >
                            شاركنا تدبرك وفوائدك
                          </label>
                          <p className="text-[10px] xs:text-xs text-gray-600 mb-2 leading-relaxed">
                            للحصول على اقتراحات الأحاديث، اكتب{" "}
                            <span className="font-bold text-purple-600">
                              /حديث
                            </span>{" "}
                            ثم كلمة البحث (مثال:{" "}
                            <span className="font-bold text-purple-600">
                              /حديث الصبر
                            </span>
                            ).
                          </p>

                          {/* --- الإرشاد (UX Hint) --- */}
                          <div className="bg-purple-50 border-r-4 border-purple-400 p-2.5 xs:p-3 sm:p-4 rounded-lg mb-2.5 xs:mb-3 sm:mb-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <Sparkles className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-purple-600 mt-0.5" />
                              </div>
                              <div className="mr-2 xs:mr-2.5 sm:mr-3">
                                <p className="text-[11px] xs:text-xs sm:text-sm text-purple-700 font-medium leading-relaxed">
                                  سيتم نشر مساهمتك في "قاعة التدارس" ليستفيد
                                  منها الجميع!
                                </p>
                              </div>
                            </div>
                          </div>
                          {/* --- نهاية الإرشاد --- */}

                          <RichTadabburEditor
                            initialContent={reflectionText}
                            onChange={(htmlContent) =>
                              setReflectionText(htmlContent)
                            }
                            onJSONChange={(jsonContent) =>
                              setReflectionJson(jsonContent)
                            }
                            placeholder={
                              !reflectionText.trim()
                                ? "ابدأ بقراءة 'تفاصيل المهمة' (في التاب الأول) واستخدم التايمر. ثم عُد إلى هنا لتدوين أهم فائدة لمست قلبك."
                                : "ابدأ كتابة الفوائد هنا..."
                            }
                          />
                        </div>
                        {/* ----- نهاية قسم الكتابة الموحد ----- */}

                        {/* الجسر الذكي - مشاركة في قاعة التدارس */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 xs:p-3 sm:p-4">
                          <label className="flex items-start xs:items-center cursor-pointer gap-2 xs:gap-3">
                            <input
                              type="checkbox"
                              checked={shareInStudyHall}
                              onChange={(e) =>
                                setShareInStudyHall(e.target.checked)
                              }
                              className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-purple-600 rounded focus:ring-purple-500 ml-2 xs:ml-3 mt-0.5 xs:mt-0 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-purple-800 text-xs xs:text-sm sm:text-base flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 ml-1 flex-shrink-0" />
                                مشاركة في قاعة التدارس
                              </span>
                              <p className="text-[10px] xs:text-xs sm:text-sm text-purple-600 mt-0.5 xs:mt-1 leading-relaxed">
                                سيتم نشر هذه المذكرة ليراها ويستفيد منها باقي
                                المشاركين
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* الخطوة العملية المقترحة (اختياري) */}
                        <div>
                          <label className="block text-xs xs:text-sm sm:text-base font-medium text-gray-700 mb-1.5 xs:mb-2">
                            الخطوة العملية المقترحة (اختياري)
                          </label>
                          <textarea
                            value={proposedStep}
                            onChange={(e) => setProposedStep(e.target.value)}
                            placeholder="مثال: سأقوم بإهداء كتاب ديني لصديق هذا الأسبوع..."
                            rows={3}
                            className="w-full px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7440E9] focus:border-[#7440E9] resize-none text-xs xs:text-sm sm:text-base"
                          />
                          <p className="text-[10px] xs:text-xs sm:text-sm text-gray-500 mt-1">
                            اقترح خطوة عملية يمكن للآخرين الالتزام بها معك
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 xs:gap-2.5 sm:gap-3 pt-2">
                          {/* زر إكمال المهمة (فقط للمهام غير المكتملة) */}
                          {!selectedTask.completed && (
                            <button
                              type="button"
                              onClick={handleCompleteAndSave}
                              disabled={isCompleting || isCampNotStarted}
                              className="w-full px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 bg-green-500 text-white rounded-lg xs:rounded-xl active:bg-green-600 sm:hover:bg-green-600 transition-colors text-xs xs:text-sm sm:text-base font-medium flex items-center justify-center gap-1.5 xs:gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 sm:active:scale-100"
                            >
                              {isCompleting ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                  <span className="text-center">
                                    إكمال المهمة وحفظ الفوائد
                                  </span>
                                </>
                              )}
                            </button>
                          )}

                          {/* زر حفظ/تحديث الفائدة فقط (للمهام المكتملة أو غير المكتملة) */}
                          {selectedTask.completed && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (isCompleting) return;
                                setIsCompleting(true);

                                try {
                                  // حفظ/تحديث الفائدة فقط (بدون إكمال المهمة)
                                  if (reflectionText.trim() !== "") {
                                    await updateTaskBenefits(
                                      selectedTask.id,
                                      reflectionText.trim(),
                                      "",
                                      !shareInStudyHall,
                                      reflectionJson,
                                      proposedStep || null // proposed_step
                                    );

                                    const isEdit = reflectionToEdit !== null;
                                    if (isEdit) {
                                      toast.success(
                                        "تم تحديث الفائدة بنجاح! ✅"
                                      );
                                      await fetchJournalData();
                                    } else {
                                      toast.success("تم حفظ الفائدة بنجاح! ✅");
                                    }

                                    // تحديث بيانات المستخدم وقاعة التدارس
                                    await fetchUserProgress();
                                    if (studyHallSelectedDay) {
                                      await fetchStudyHallContent(
                                        studyHallSelectedDay,
                                        studyHallSort,
                                        studyHallPagination.page,
                                        20,
                                        false
                                      );
                                    }

                                    // تحديث النص المحفوظ في selectedTask
                                    setSelectedTask({
                                      ...selectedTask,
                                      journal_entry: reflectionText.trim(),
                                    });
                                    setReflectionToEdit(null); // إعادة تعيين حالة التعديل
                                    setShowReflectionModal(false);
                                    setActiveTaskTab("task");
                                  } else {
                                    toast.error("اكتب فائدة أولاً قبل الحفظ");
                                  }
                                } catch (error) {
                                  console.error(
                                    "Failed to save reflection:",
                                    error
                                  );
                                  toast.error(
                                    "حدث خطأ أثناء حفظ الفائدة. يرجى المحاولة مرة أخرى."
                                  );
                                } finally {
                                  setIsCompleting(false);
                                }
                              }}
                              disabled={isCompleting || isReadOnly}
                              className="w-full px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 bg-[#7440E9] text-white rounded-lg xs:rounded-xl active:bg-[#5a2fc7] sm:hover:bg-[#5a2fc7] transition-colors text-xs xs:text-sm sm:text-base font-medium flex items-center justify-center gap-1.5 xs:gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 sm:active:scale-100"
                            >
                              {isCompleting ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <Save className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                  <span className="text-center">
                                    {reflectionToEdit
                                      ? "تحديث الفائدة"
                                      : "حفظ الفائدة"}
                                  </span>
                                </>
                              )}
                            </button>
                          )}

                          {/* زر الإلغاء */}
                          <button
                            onClick={() => {
                              setShowReflectionModal(false);
                              setActiveTaskTab("task");
                              setReflectionToEdit(null);
                              setReflectionText("");
                              setReflectionJson(null);
                              setProposedStep("");
                              setShareInStudyHall(false);
                            }}
                            className="w-full px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg xs:rounded-xl active:bg-gray-300 sm:hover:bg-gray-300 transition-colors text-xs xs:text-sm sm:text-base font-medium active:scale-95 sm:active:scale-100"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Action Button */}
                  {activeTaskTab === "task" && (
                    <div className="sm:hidden px-3 xs:px-4 pb-2">
                      <button
                        onClick={() => setActiveTaskTab("reflection")}
                        className="w-full flex items-center justify-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2.5 xs:py-3 bg-purple-600 text-white rounded-lg xs:rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-sm xs:text-base active:scale-95"
                      >
                        <span className="text-center">
                          قرأت المهمة، سأبدأ كتابة تدبري الآن
                        </span>
                        <ArrowLeft className="w-4 h-4 xs:w-5 xs:h-5 font-bold flex-shrink-0" />
                      </button>
                    </div>
                  )}

                  {/* Footer with Timer */}
                  <div className="sticky bottom-0 bg-white border-t border-gray-200 px-3 xs:px-4 sm:px-5 md:px-6 py-2.5 xs:py-3 sm:py-4 flex-shrink-0 z-20 shadow-lg">
                    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3 sm:gap-4">
                      {/* Timer Display */}
                      <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 w-full xs:w-auto justify-between xs:justify-start">
                        <div
                          className={`text-base xs:text-lg sm:text-xl font-mono font-bold transition-colors duration-300 ${
                            timerActive
                              ? "text-[#7440EA]"
                              : timeRemaining === 0
                              ? "text-red-600"
                              : "text-gray-700"
                          }`}
                        >
                          {formatTime(timeRemaining)}
                        </div>
                        <div className="flex items-center gap-1.5 xs:gap-2">
                          {timerActive && (
                            <div className="flex items-center gap-1 xs:gap-1.5 px-1.5 xs:px-2 py-0.5 xs:py-1 bg-green-100 text-green-700 rounded-full text-[10px] xs:text-xs font-medium arabic-text">
                              <div className="w-1 xs:w-1.5 xs:h-1.5 bg-green-500 rounded-full animate-ping"></div>
                              <span className="whitespace-nowrap">يعمل</span>
                            </div>
                          )}
                          {!timerActive && timeRemaining === 0 && (
                            <div className="flex items-center gap-1 xs:gap-1.5 px-1.5 xs:px-2 py-0.5 xs:py-1 bg-red-100 text-red-700 rounded-full text-[10px] xs:text-xs font-medium arabic-text">
                              <div className="w-1 xs:w-1.5 xs:h-1.5 bg-red-500 rounded-full"></div>
                              <span className="whitespace-nowrap">انتهى</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Timer Controls */}
                      <div className="flex items-center gap-1.5 xs:gap-2 w-full xs:w-auto justify-end xs:justify-start">
                        {!timerActive ? (
                          <button
                            onClick={() =>
                              startTimer(selectedTask?.estimated_time)
                            }
                            className="px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 bg-green-500 active:bg-green-600 sm:hover:bg-green-600 text-white rounded-lg text-[10px] xs:text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1 xs:gap-1.5 arabic-text shadow-sm active:shadow-md sm:hover:shadow-md transform active:scale-95 sm:hover:scale-105"
                          >
                            <Play className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="hidden xs:inline sm:hidden md:inline">
                              بدء
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={stopTimer}
                            className="px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 bg-red-500 active:bg-red-600 sm:hover:bg-red-600 text-white rounded-lg text-[10px] xs:text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1 xs:gap-1.5 arabic-text shadow-sm active:shadow-md sm:hover:shadow-md transform active:scale-95 sm:hover:scale-105"
                          >
                            <Clock className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="hidden xs:inline sm:hidden md:inline">
                              إيقاف
                            </span>
                          </button>
                        )}

                        <button
                          onClick={() =>
                            resetTimer(selectedTask?.estimated_time)
                          }
                          className="px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 bg-gray-500 active:bg-gray-600 sm:hover:bg-gray-600 text-white rounded-lg text-[10px] xs:text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1 xs:gap-1.5 arabic-text shadow-sm active:shadow-md sm:hover:shadow-md transform active:scale-95 sm:hover:scale-105"
                        >
                          <Clock3 className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="hidden xs:inline sm:hidden md:inline">
                            إعادة
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal تأكيد ترك المخيم */}
          {showLeaveCampModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              >
                {/* أيقونة التحذير */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>

                {/* العنوان */}
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
                  هل أنت متأكد من ترك المخيم؟
                </h3>

                {/* التحذيرات */}
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-red-800 font-semibold mb-3 text-center">
                    تحذير هام:
                  </p>
                  <ul className="space-y-2 text-red-700 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>سيتم حذف جميع مهامك وتقدمك في المخيم</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>سيتم حذف جميع نقاطك المكتسبة</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>سيتم حذف جميع تدبراتك وفوائدك المحفوظة</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>سيتم إزالتك من لوحة الصدارة</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span className="font-bold">
                        لا يمكن التراجع عن هذا الإجراء!
                      </span>
                    </li>
                  </ul>
                </div>

                {/* الأزرار */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLeaveCampModal(false)}
                    disabled={leavingCamp}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleLeaveCamp}
                    disabled={leavingCamp}
                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {leavingCamp ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        جاري الترك...
                      </>
                    ) : (
                      <>نعم، ترك المخيم</>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
          {/* Modal تأكيد حذف التدبر */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              >
                {/* أيقونة التحذير */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>

                {/* العنوان */}
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
                  {(() => {
                    // التحقق إذا كان الحذف من سجلي
                    const isFromJournal = journalData?.myReflections?.some(
                      (item) => item.progress_id === reflectionToDelete
                    );
                    return isFromJournal
                      ? "هل أنت متأكد من حذف هذه الفائدة؟"
                      : "هل أنت متأكد من حذف هذا التدبر؟";
                  })()}
                </h3>

                {/* التحذيرات */}
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-red-800 font-semibold mb-3 text-center">
                    تحذير:
                  </p>
                  <ul className="space-y-2 text-red-700 text-sm">
                    {(() => {
                      // التحقق إذا كان الحذف من سجلي
                      const isFromJournal = journalData?.myReflections?.some(
                        (item) => item.progress_id === reflectionToDelete
                      );

                      if (isFromJournal) {
                        return (
                          <>
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 font-bold">•</span>
                              <span>سيتم حذف الفائدة نهائياً من سجلك</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 font-bold">•</span>
                              <span className="font-bold">
                                سيتم خصم 3 نقاط من نقاطك
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 font-bold">•</span>
                              <span>
                                سيتم حذفها من قاعة التدارس إذا كانت مشاركة
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 font-bold">•</span>
                              <span className="font-bold">
                                لا يمكن التراجع عن هذا الإجراء!
                              </span>
                            </li>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 font-bold">•</span>
                              <span>
                                سيتم حذف التدبر نهائياً من قاعة التدارس
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 font-bold">•</span>
                              <span>سيتم حذف كل التصويتات على هذا التدبر</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 font-bold">•</span>
                              <span>
                                سيتم إزالته من قوائم المستخدمين الذين حفظوه
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 font-bold">•</span>
                              <span className="font-bold">
                                لا يمكن التراجع عن هذا الإجراء!
                              </span>
                            </li>
                          </>
                        );
                      }
                    })()}
                  </ul>
                </div>

                {/* الأزرار */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setReflectionToDelete(null);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      // التحقق إذا كان الحذف من سجلي
                      const isFromJournal = journalData?.myReflections?.some(
                        (item) => item.progress_id === reflectionToDelete
                      );

                      if (isFromJournal) {
                        await handleDeleteJournalReflection(reflectionToDelete);
                      } else {
                        await handleDeleteReflection();
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    نعم، احذف
                  </button>
                </div>
              </motion.div>
            </div>
          )}
          {/* نافذة إعدادات المخيم الجانبية */}
          {showCampSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowCampSettings(false)}
            >
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-[60px] sm:top-[60px] h-screen sm:h-[calc(100vh-50px)] w-full sm:max-w-md bg-white shadow-2xl overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Sidebar Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 z-10 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800">
                        إعدادات المخيم
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                        إدارة إعداداتك في {camp.name}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCampSettings(false)}
                      className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 active:scale-95"
                      aria-label="إغلاق"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Settings Content */}
                <div className="p-3 sm:p-4 space-y-4 sm:space-y-6 pb-6 sm:pb-8">
                  {/* Privacy Settings */}
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />
                      إعدادات الخصوصية
                    </h4>

                    <div className="space-y-3 sm:space-y-4">
                      {/* Hide Identity */}
                      <div className="flex items-start justify-between p-2.5 sm:p-3 bg-white rounded-lg border border-gray-200 gap-2">
                        <div className="flex-1 pr-2 sm:pr-3 min-w-0">
                          <label className="text-xs sm:text-sm font-medium text-gray-700 block">
                            إخفاء هويتي
                          </label>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            ستظهر كـ "مشارك مجهول" في لوحة الصدارة
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={campSettings.hide_identity}
                            onChange={(e) =>
                              handleSettingChange(
                                "hide_identity",
                                e.target.checked
                              )
                            }
                            disabled={updatingSettings}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7440E9]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7440E9]"></div>
                        </label>
                      </div>

                      {/* Leaderboard Visibility */}
                      <div className="flex items-start justify-between p-2.5 sm:p-3 bg-white rounded-lg border border-gray-200 gap-2">
                        <div className="flex-1 pr-2 sm:pr-3 min-w-0">
                          <label className="text-xs sm:text-sm font-medium text-gray-700 block">
                            الظهور في لوحة الصدارة
                          </label>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            إظهار نقاطك في ترتيب المخيم
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={campSettings.leaderboard_visibility}
                            onChange={(e) =>
                              handleSettingChange(
                                "leaderboard_visibility",
                                e.target.checked
                              )
                            }
                            disabled={updatingSettings}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7440E9]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7440E9]"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      إعدادات الإشعارات
                    </h4>

                    <div className="space-y-3 sm:space-y-4">
                      {/* General Notifications */}
                      <div className="flex items-start justify-between p-2.5 sm:p-3 bg-white rounded-lg border border-gray-200 gap-2">
                        <div className="flex-1 pr-2 sm:pr-3 min-w-0">
                          <label className="text-xs sm:text-sm font-medium text-gray-700 block">
                            تفعيل الإشعارات
                          </label>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            استقبال إشعارات عامة من المخيم
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={campSettings.notifications_enabled}
                            onChange={(e) =>
                              handleSettingChange(
                                "notifications_enabled",
                                e.target.checked
                              )
                            }
                            disabled={updatingSettings}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      </div>

                      {/* Daily Reminders */}
                      <div className="flex items-start justify-between p-2.5 sm:p-3 bg-white rounded-lg border border-gray-200 gap-2">
                        <div className="flex-1 pr-2 sm:pr-3 min-w-0">
                          <label className="text-xs sm:text-sm font-medium text-gray-700 block">
                            تذكيرات يومية
                          </label>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            تذكير يومي لإكمال المهام
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={campSettings.daily_reminders}
                            onChange={(e) =>
                              handleSettingChange(
                                "daily_reminders",
                                e.target.checked
                              )
                            }
                            disabled={updatingSettings}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      </div>

                      {/* Achievement Notifications */}
                      <div className="flex items-start justify-between p-2.5 sm:p-3 bg-white rounded-lg border border-gray-200 gap-2">
                        <div className="flex-1 pr-2 sm:pr-3 min-w-0">
                          <label className="text-xs sm:text-sm font-medium text-gray-700 block">
                            إشعارات الإنجازات
                          </label>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            إشعارات عند إكمال المهام والإنجازات
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={campSettings.achievement_notifications}
                            onChange={(e) =>
                              handleSettingChange(
                                "achievement_notifications",
                                e.target.checked
                              )
                            }
                            disabled={updatingSettings}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                    <h4 className="text-sm sm:text-base font-semibold text-red-800 mb-3 sm:mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                      منطقة الخطر
                    </h4>

                    <div className="space-y-2 sm:space-y-3">
                      <p className="text-xs sm:text-sm text-red-700">
                        الإجراءات التالية لا يمكن التراجع عنها
                      </p>

                      <button
                        onClick={() => {
                          setShowCampSettings(false);
                          setShowLeaveCampModal(true);
                        }}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-red-500 text-white rounded-lg active:bg-red-600 sm:hover:bg-red-600 transition-colors text-sm sm:text-base font-medium flex items-center justify-center gap-2 active:scale-95 sm:active:scale-100"
                      >
                        <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                        ترك المخيم
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Action Plan Modal */}
          <AnimatePresence>
            {showActionPlanModal && (
              <ActionPlanModal
                campId={camp.id}
                onClose={() => {
                  setShowActionPlanModal(false);
                  setActionPlanEditMode(false); // إعادة تعيين وضع التعديل عند الإغلاق
                }}
                onCompletionSuccess={markCampAsCompleted}
                onNavigateToJournal={() => {
                  setShowActionPlanModal(false); // 1. أغلق المودال
                  setActionPlanEditMode(false);
                  setActiveTab("my_journal"); // 2. غير التبويب إلى "سجلي"
                }}
                editMode={actionPlanEditMode}
              />
            )}
          </AnimatePresence>
        </>
      </div>
    );
  };

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
                label: dailyTasks.length * 3,
                value: "نقطة",
                sub: null,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/15 shadow-ai-dark transition-ai flex flex-col items-center min-h-[175px] hover:border-primary/40 hover:shadow-ai-hover-dark"
              >
                {item.icon}
                <div className="text-3xl font-black text-white mb-1 flex items-center justify-center">
                  {item.label}
                </div>
                <div className="text-xl text-white/80 mb-1">{item.value}</div>
                {item.sub && (
                  <div className="text-sm text-white/50">{item.sub}</div>
                )}
              </div>
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
                  camp.enable_public_enrollment === false
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
        {!camp.is_enrolled ? (
          <>
            {/* Course Content Overview Section */}
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                  {currentUser ? "محتوى المخيم" : "اكتشف محتوى المخيم"}
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  {currentUser
                    ? `نظرة عامة على المواد والمهام التي ستدرسها خلال ${camp.duration_days} أيام`
                    : `تعرف على المواد والمهام التي ستدرسها خلال ${camp.duration_days} أيام من التعلم المكثف`}
                </p>
                {!currentUser && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl max-w-2xl mx-auto">
                    <p className="text-blue-800 font-medium">
                      💡 سجل دخولك للانضمام لهذه الرحلة المميزة والاستفادة من
                      جميع المميزات
                    </p>
                  </div>
                )}
              </div>

              {/* Course Content Overview */}
              {dailyTasks && dailyTasks.length > 0 && (
                <div className="mb-16">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dailyTasks.slice(0, 6).map((task, index) => (
                      <div
                        key={task.id}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex gap-3 items-center">
                            <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mr-3">
                              <span className="text-white font-bold text-sm">
                                اليوم {task.day_number}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800 text-sm">
                                المهمة {index + 1}
                              </h3>
                              <p className="text-gray-500 text-xs">
                                {task.is_optional ? "اختياري" : "مطلوب"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              {task.estimated_time || "30 دقيقة"}
                            </div>
                            {task.points && (
                              <div className="text-xs text-[#7440E9] font-semibold">
                                {task.points} نقطة
                              </div>
                            )}
                          </div>
                        </div>

                        <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                          {task.title}
                        </h4>
                        <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
                          {task.description}
                        </p>

                        {task.verses && (
                          <div className="mt-3 p-2 bg-[#7440E9]/5 rounded-lg">
                            <div className="text-xs text-[#7440E9] font-medium">
                              الآيات: {task.verses}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* View Full Content Button */}
                  <div className="text-center mt-8">
                    <button
                      onClick={() => navigate(`/camp-content/${id}`)}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#7440E9] to-[#B794F6] text-white rounded-2xl hover:from-[#6B3AD1] hover:to-[#A67FF0] shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    >
                      <BookOpen className="w-5 h-5" />
                      <span className="font-bold text-lg">
                        عرض المحتوى الكامل
                      </span>
                    </button>
                    <p className="text-gray-600 mt-3">
                      {dailyTasks.length} مهمة في{" "}
                      {Object.keys(tasksByDay).length} أيام
                    </p>
                  </div>
                </div>
              )}

              {/* Learning Path Overview */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                  مسار التعلم
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#7440E9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-800 mb-2">القراءة</h4>
                    <p className="text-gray-600 text-sm">
                      قراءة يومية منظمة مع الشيخ المختار
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#7440E9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-800 mb-2">الحفظ</h4>
                    <p className="text-gray-600 text-sm">
                      حفظ مكثف مع مراجعة مستمرة
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#7440E9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-800 mb-2">التفسير</h4>
                    <p className="text-gray-600 text-sm">
                      فهم عميق للآيات مع التفسير
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* What You'll Learn Section */}
            <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5]">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                    ماذا ستتعلم؟
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    رحلة شاملة تجمع بين القراءة والحفظ والتفسير في{" "}
                    <span className="text-[#7440E9] font-semibold">
                      {camp.duration_days}
                    </span>{" "}
                    أيام مكثفة
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Reading Card */}
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#7440E9] rounded-xl flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">
                        قراءة السورة
                      </h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        قراءة يومية منظمة مع الشيخ المختار لضمان النطق الصحيح
                      </p>
                      <div className="bg-[#7440E9]/10 rounded-xl p-4">
                        <div className="text-3xl font-bold text-[#7440E9] mb-1">
                          5 آيات
                        </div>
                        <div className="text-gray-600 font-medium">يومياً</div>
                      </div>
                    </div>
                  </div>

                  {/* Memorization Card */}
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#7440E9] rounded-xl flex items-center justify-center mx-auto mb-6">
                        <Brain className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">
                        حفظ الآيات
                      </h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        حفظ مكثف مع مراجعة مستمرة وتطبيق تقنيات الحفظ المتقدمة
                      </p>
                      <div className="bg-[#7440E9]/10 rounded-xl p-4">
                        <div className="text-3xl font-bold text-[#7440E9] mb-1">
                          3 ساعات
                        </div>
                        <div className="text-gray-600 font-medium">يومياً</div>
                      </div>
                    </div>
                  </div>

                  {/* Tafseer Card */}
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#7440E9] rounded-xl flex items-center justify-center mx-auto mb-6">
                        <Target className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">
                        دراسة التفسير
                      </h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        فهم عميق للآيات مع التفسير والتدبر في المعاني والأحكام
                      </p>
                      <div className="bg-[#7440E9]/10 rounded-xl p-4">
                        <div className="text-3xl font-bold text-[#7440E9] mb-1">
                          2 ساعة
                        </div>
                        <div className="text-gray-600 font-medium">يومياً</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Benefits */}
                <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      فوائد إضافية
                    </h3>
                    <p className="text-gray-600">
                      بالإضافة للتعلم الأساسي، ستحصل على فوائد قيمة أخرى
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#7440E9]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Heart className="w-6 h-6 text-[#7440E9]" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-1">
                        التدبر
                      </h4>
                      <p className="text-sm text-gray-600">فهم عميق للمعاني</p>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#7440E9]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-[#7440E9]" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-1">
                        المجتمع
                      </h4>
                      <p className="text-sm text-gray-600">مجتمع متحمس</p>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#7440E9]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Trophy className="w-6 h-6 text-[#7440E9]" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-1">
                        الشهادة
                      </h4>
                      <p className="text-sm text-gray-600">شهادة معتمدة</p>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#7440E9]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Award className="w-6 h-6 text-[#7440E9]" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-1">
                        التطبيق
                      </h4>
                      <p className="text-sm text-gray-600">تطبيق عملي</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Schedule Section */}
            <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5]">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                    الجدول الزمني اليومي
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    برنامج يومي منظم لضمان أقصى استفادة من المخيم
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Sun className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        6:00 ص
                      </h3>
                      <p className="text-gray-700 font-medium">قراءة الصبح</p>
                      <p className="text-sm text-gray-500 mt-1">30 دقيقة</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        7:00 ص
                      </h3>
                      <p className="text-gray-700 font-medium">حفظ الآيات</p>
                      <p className="text-sm text-gray-500 mt-1">3 ساعات</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        10:00 ص
                      </h3>
                      <p className="text-gray-700 font-medium">دراسة التفسير</p>
                      <p className="text-sm text-gray-500 mt-1">2 ساعة</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-lg">🕌</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        12:00 م
                      </h3>
                      <p className="text-gray-700 font-medium">صلاة الظهر</p>
                      <p className="text-sm text-gray-500 mt-1">
                        بالآيات المحفوظة
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        2:00 م
                      </h3>
                      <p className="text-gray-700 font-medium">فيديو التفسير</p>
                      <p className="text-sm text-gray-500 mt-1">1 ساعة</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-lg">✍️</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        3:00 م
                      </h3>
                      <p className="text-gray-700 font-medium">كتابة الفوائد</p>
                      <p className="text-sm text-gray-500 mt-1">30 دقيقة</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        4:00 م
                      </h3>
                      <p className="text-gray-700 font-medium">مراجعة يومية</p>
                      <p className="text-sm text-gray-500 mt-1">30 دقيقة</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#7440E9] rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        5:00 م
                      </h3>
                      <p className="text-gray-700 font-medium">تقييم التقدم</p>
                      <p className="text-sm text-gray-500 mt-1">15 دقيقة</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Commitment Requirements */}
            <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5]">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                    التزامك المطلوب
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    هذا المخيم يتطلب التزاماً كاملاً لضمان أفضل النتائج
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-[#7440E9] rounded-xl flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">
                        المطلوب منك
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center bg-[#7440E9]/5 rounded-xl p-4">
                        <Clock className="w-6 h-6 text-[#7440E9] mr-4" />
                        <div>
                          <div className="font-semibold text-gray-800">
                            6-7 ساعات يومياً
                          </div>
                          <div className="text-gray-600 text-sm">
                            وقت مخصص للدراسة
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center bg-[#7440E9]/5 rounded-xl p-4">
                        <Calendar className="w-6 h-6 text-[#7440E9] mr-4" />
                        <div>
                          <div className="font-semibold text-gray-800">
                            {camp.duration_days} يوم متتالي
                          </div>
                          <div className="text-gray-600 text-sm">
                            بدون انقطاع
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center bg-[#7440E9]/5 rounded-xl p-4">
                        <Target className="w-6 h-6 text-[#7440E9] mr-4" />
                        <div>
                          <div className="font-semibold text-gray-800">
                            100% التزام
                          </div>
                          <div className="text-gray-600 text-sm">
                            لا توجد أيام راحة
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center bg-[#7440E9]/5 rounded-xl p-4">
                        <Trophy className="w-6 h-6 text-[#7440E9] mr-4" />
                        <div>
                          <div className="font-semibold text-gray-800">
                            إكمال السورة كاملة
                          </div>
                          <div className="text-gray-600 text-sm">
                            مع الفهم العميق
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <X className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">
                        هذا المخيم ليس مناسب لك إذا:
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center bg-red-50 rounded-xl p-4">
                        <Clock className="w-6 h-6 text-red-500 mr-4" />
                        <div>
                          <div className="font-semibold text-gray-800">
                            لا تستطيع تخصيص 6 ساعات
                          </div>
                          <div className="text-gray-600 text-sm">
                            يومياً للدراسة
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center bg-red-50 rounded-xl p-4">
                        <Heart className="w-6 h-6 text-red-500 mr-4" />
                        <div>
                          <div className="font-semibold text-gray-800">
                            تبحث عن تجربة سهلة
                          </div>
                          <div className="text-gray-600 text-sm">بدون تحدٍ</div>
                        </div>
                      </div>
                      <div className="flex items-center bg-red-50 rounded-xl p-4">
                        <Shield className="w-6 h-6 text-red-500 mr-4" />
                        <div>
                          <div className="font-semibold text-gray-800">
                            لا تريد الالتزام الكامل
                          </div>
                          <div className="text-gray-600 text-sm">
                            أو لديك التزامات أخرى
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center bg-red-50 rounded-xl p-4">
                        <Info className="w-6 h-6 text-red-500 mr-4" />
                        <div>
                          <div className="font-semibold text-gray-800">
                            تتوقع نتائج سريعة
                          </div>
                          <div className="text-gray-600 text-sm">بدون جهد</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5]">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                    الأسئلة الشائعة
                  </h2>
                  <p className="text-xl text-gray-600">
                    إجابات على أكثر الأسئلة شيوعاً
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-800">
                        هل يمكنني الانضمام في منتصف المخيم؟
                      </h3>
                      <button
                        onClick={() => setOpenFAQ(openFAQ === 1 ? null : 1)}
                        className="p-2 bg-[#7440E9]/10 rounded-lg hover:bg-[#7440E9]/20 transition-colors"
                      >
                        {openFAQ === 1 ? (
                          <ChevronUp className="w-5 h-5 text-[#7440E9]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#7440E9]" />
                        )}
                      </button>
                    </div>
                    {openFAQ === 1 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-gray-600 leading-relaxed">
                          لا، يجب الانضمام من اليوم الأول للمخيم. هذا يضمن أن
                          جميع المشاركين يبدأون من نفس النقطة ويحصلون على نفس
                          التجربة.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-800">
                        ماذا لو فاتني يوم؟
                      </h3>
                      <button
                        onClick={() => setOpenFAQ(openFAQ === 2 ? null : 2)}
                        className="p-2 bg-[#7440E9]/10 rounded-lg hover:bg-[#7440E9]/20 transition-colors"
                      >
                        {openFAQ === 2 ? (
                          <ChevronUp className="w-5 h-5 text-[#7440E9]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#7440E9]" />
                        )}
                      </button>
                    </div>
                    {openFAQ === 2 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-gray-600 leading-relaxed">
                          إذا فاتك يوم، ستفقد نقاط ذلك اليوم، لكن يمكنك المتابعة
                          من اليوم التالي. ننصح بالالتزام الكامل للحصول على أفضل
                          النتائج.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-800">
                        هل المخيم مجاني؟
                      </h3>
                      <button
                        onClick={() => setOpenFAQ(openFAQ === 3 ? null : 3)}
                        className="p-2 bg-[#7440E9]/10 rounded-lg hover:bg-[#7440E9]/20 transition-colors"
                      >
                        {openFAQ === 3 ? (
                          <ChevronUp className="w-5 h-5 text-[#7440E9]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#7440E9]" />
                        )}
                      </button>
                    </div>
                    {openFAQ === 3 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-gray-600 leading-relaxed">
                          نعم، المخيم مجاني بالكامل! نحن نؤمن بأن تعلم القرآن
                          الكريم يجب أن يكون متاحاً للجميع بدون أي رسوم.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-800">
                        ما هي المتطلبات التقنية؟
                      </h3>
                      <button
                        onClick={() => setOpenFAQ(openFAQ === 4 ? null : 4)}
                        className="p-2 bg-[#7440E9]/10 rounded-lg hover:bg-[#7440E9]/20 transition-colors"
                      >
                        {openFAQ === 4 ? (
                          <ChevronUp className="w-5 h-5 text-[#7440E9]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#7440E9]" />
                        )}
                      </button>
                    </div>
                    {openFAQ === 4 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-gray-600 leading-relaxed">
                          تحتاج فقط إلى اتصال بالإنترنت وجهاز (كمبيوتر، تابلت،
                          أو موبايل). لا توجد متطلبات تقنية معقدة.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Final CTA Section */}
            <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#7440E9] to-[#B794F6]">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                  هل أنت مستعد للتحدي؟
                </h2>
                <p className="text-xl text-white/90 mb-12 leading-relaxed">
                  انضم إلى {camp.enrolled_count || 0} شخص آخر في رحلة تحويلية مع
                  القرآن الكريم
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <Zap className="w-10 h-10 text-white mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">
                      {camp.duration_days} يوم من التحدي
                    </h3>
                    <p className="text-white/80">مكثف ومحفز</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <Award className="w-10 h-10 text-white mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">
                      شهادة إنجاز
                    </h3>
                    <p className="text-white/80">معتمدة ومحترمة</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <Users className="w-10 h-10 text-white mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">
                      مجتمع متحمس
                    </h3>
                    <p className="text-white/80">من المتعلمين</p>
                  </div>
                </div>

                {!camp.is_enrolled && (
                  <div className="mb-8">
                    <button
                      onClick={handleEnroll}
                      disabled={
                        enrolling ||
                        camp.status === "completed" ||
                        camp.enable_public_enrollment === false
                      }
                      className="px-16 py-4 bg-white text-[#7440E9] text-2xl font-bold rounded-2xl hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {enrolling ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7440E9] mr-3"></div>
                          جاري التسجيل...
                        </div>
                      ) : !currentUser ? (
                        <span>سجل دخولك للانضمام </span>
                      ) : camp.enable_public_enrollment === false ? (
                        <span>التسجيل مغلق من قبل الإدارة</span>
                      ) : (
                        <span>انضم للرحلة الآن </span>
                      )}
                    </button>
                    {!currentUser && (
                      <p className="text-center text-gray-600 mt-4">
                        ستحتاج لتسجيل الدخول أولاً للانضمام لهذا المخيم
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Identity Choice Modal for Visitor Section */}
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
                      className=" bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all duration-300"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Export Notes Section */}

            {/* Enrolled User Content - Camp Journey Interface */}
            <CampJourneyInterface
              camp={camp}
              dailyTasks={dailyTasks}
              taskGroups={taskGroups}
              isCampOfficiallyFinished={isCampOfficiallyFinished}
              showOpeningSurahModal={showOpeningSurahModal}
              setShowOpeningSurahModal={setShowOpeningSurahModal}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default QuranCampDetailsPage;
