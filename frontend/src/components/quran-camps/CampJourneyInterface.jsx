import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate, Link } from "react-router-dom";
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
  Map as MapIcon,
  Edit3,
  BookOpen as JournalIcon,
  Users as LeaderboardIcon,
  UsersIcon,
  BookOpen as StudyHallIcon,
  LayoutDashboard,
  FolderOpen,
  BarChart3,
  ExternalLink,
  Loader2,
  HelpCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import ActionPlanModal from "../ActionPlanModal";
import NotesModal from "../NotesModal";
import { toPng } from "html-to-image";
import copy from "copy-to-clipboard";
import OnboardingModal from "../OnboardingModal";
import CampResources from "../dashboard/CampResources";
import CampQandA from "../dashboard/CampQandA";
import CampHelpCenter from "./CampHelpCenter";
import RichTadabburEditor from "../RichTadabburEditor";
import CommitmentModal from "../CommitmentModal";
import FriendsTab from "../FriendsTab";
import * as campService from "../../services/campService";
import {
  Tooltip as TooltipComponent,
  ConfirmationDialog,
  Tooltip,
} from "../UI/Tooltip";
import TaskCompletionStats from "./TaskCompletionStats";
import CampBanners from "./CampBanners";
import AddReflectionModal from "./modals/AddReflectionModal";
import ReflectionModal from "./modals/ReflectionModal";
import LeaveCampModal from "./modals/LeaveCampModal";
import DeleteReflectionModal from "./modals/DeleteReflectionModal";
import TaskDetailsModal from "./modals/TaskDetailsModal";
import ProgressOverview from "./ProgressOverview";
import CampTabs from "./CampTabs";
import InteractionButtons from "./InteractionButtons";
// Import journey components
import DayNode from "./journey/DayNode";
import DayNodeSVG from "./journey/DayNodeSVG";
import ProgressBar from "./journey/ProgressBar";
import MilestoneIndicator from "./journey/MilestoneIndicator";
import MilestoneMarker from "./journey/MilestoneMarker";
import CohortInfoPanel from "./journey/CohortInfoPanel";

// Import study hall components
import StudyHallLayout from "./study-hall/StudyHallLayout";
import { StudyHallSkeleton } from "./skeletons/StudyHallSkeleton";
import ShareModal from "./ShareModal";
import JournalCard from "./JournalCard";
import EmbeddedVideoPlayer from "./EmbeddedVideoPlayer";
import TaskNavigation from "./TaskNavigation";
import TaskAttachments from "./TaskAttachments";
import TaskLinks from "./TaskLinks";
import CampBreadcrumbs from "./CampBreadcrumbs";
import QuickAccessMenu from "./QuickAccessMenu";
import DailyTestModal from "./daily-test/DailyTestModal";
import TestResultsView from "./daily-test/TestResultsView";
import TestReviewView from "./daily-test/TestReviewView";

// Import utility functions
import {
  getStatusText,
  groupTasksByDay,
  truncateHTML,
  highlightSearchTermHTML,
  highlightSearchTerm,
  formatDayLabel,
  formatChallengeDayLabel,
  getCurrentDay as getCurrentDayUtil,
} from "../../utils/campUtils.jsx";
import { getHadithBookNameAr } from "../../pages/QuranCampDetailsPage.jsx";
import HadithContentRenderer from "../camps/types/HadithContentRenderer";

const CampJourneyInterface = ({
  camp,
  dailyTasks,
  taskGroups,
  dayChallenges = {},
  showOpeningSurahModal,
  setShowOpeningSurahModal,
  isCampOfficiallyFinished: parentIsCampOfficiallyFinished,
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  // حساب اليوم الحالي بناءً على تاريخ بداية المخيم
  // هذا يحدد اليوم الحالي من المخيم بغض النظر عن متى انضم المستخدم
  // مثال: إذا بدأ المخيم يوم 1 ودخل المستخدم يوم 3، فاليوم الحالي = 3
  // وهذا يسمح للمستخدم بإكمال مهام اليوم 3 مباشرة، ومهام الأيام السابقة (1 و 2) تكون "incomplete"

  // State for resources and Q&A
  const [resources, setResources] = useState([]);
  const [qanda, setQanda] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [qandaLoading, setQandaLoading] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);

  // State for PDF download loading
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Helper function to convert flat tasks to tree structure
  const buildTaskTree = (tasks, groups) => {
    if (!tasks || !Array.isArray(tasks)) return [];

    // Debug: التحقق من بيانات الأصدقاء قبل بناء الـ tree
    if (tasks && tasks.length > 0) {
      const taskWithFriends = tasks.find(
        (t) => t.completed_by_friends && t.completed_by_friends.length > 0,
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
      (a, b) => (a.order_in_day || 0) - (b.order_in_day || 0),
    );

    // Debug: التحقق من بيانات الأصدقاء بعد بناء الـ tree
    const allTasksInTree = [
      ...sortedGroups.flatMap((g) => g.children),
      ...ungroupedTasks,
    ];
    const taskWithFriendsAfter = allTasksInTree.find(
      (t) => t.completed_by_friends && t.completed_by_friends.length > 0,
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
    const path = [{ type: "day", title: formatDayLabel(dayNumber), dayNumber }];
    if (task.group_id && groups) {
      const group = groups.find((g) => g.id === task.group_id);
      if (group) {
        // Build parent groups chain
        const parentGroups = [];
        let currentGroup = group;

        // Traverse up the parent chain
        while (currentGroup && currentGroup.parent_group_id) {
          const parentGroup = groups.find(
            (g) => g.id === currentGroup.parent_group_id,
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
    const dayTasks = dailyTasks.filter((task) => task.day_number === dayNumber);
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
      (a, b) => (a.order_in_day || 0) - (b.order_in_day || 0),
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
    return getCurrentDayUtil(camp);
  };

  // حساب اليوم الحالي للمخيم
  const [campDay, setCampDay] = useState(null);
  useEffect(() => {
    if (camp) {
      const currentDay = getCurrentDay();
      setCampDay(currentDay);
    }
  }, [camp]);
  const [activeTab, setActiveTab] = useState(() => {
    // استرجاع التبويب المحفوظ من localStorage
    const savedTab = localStorage.getItem(`camp-${camp.id}-activeTab`);
    return savedTab || "journey";
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

  // استخدام is_read_only من الـ API (للمخيمات المنتهية أو الفوج المقفول)
  const isReadOnly =
    camp?.is_read_only ||
    camp?.status === "completed" ||
    camp?.user_cohort?.is_closed;

  // معلومات الانضمام المتأخر
  const joinedLate = camp?.joined_late || false;
  const missedDaysCount = camp?.missed_days_count || 0;

  // منع إكمال المهام إذا كان المخيم في حالة "early_registration" أو "scheduled" (لم يبدأ/يفتح بعد)
  const isCampNotStarted =
    camp?.status === "early_registration" || camp?.status === "scheduled";
  const [selectedDay, setSelectedDay] = useState(1);
  const [challengeDetailsModal, setChallengeDetailsModal] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTaskSidebar, setShowTaskSidebar] = useState(false);
  // Test states
  const [showTestModal, setShowTestModal] = useState(false);
  const [testInfo, setTestInfo] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [dayTestInfo, setDayTestInfo] = useState(null);
  const [checkingTest, setCheckingTest] = useState(false);
  const [celebratingDay, setCelebratingDay] = useState(null); // Track which day is being celebrated
  const [studyHallSelectedDay, setStudyHallSelectedDay] =
    useState(getCurrentDay());
  const [studyHallFilter, setStudyHallFilter] = useState("all"); // "all", "my", "others"
  const [studyHallSearch, setStudyHallSearch] = useState(""); // البحث في التدبرات
  const [studyHallSort, setStudyHallSort] = useState("newest"); // "newest", "helpful", "saved"
  const [studyHallAuthorFilter, setStudyHallAuthorFilter] = useState(""); // فلترة حسب المؤلف
  const [studyHallDateFrom, setStudyHallDateFrom] = useState(""); // تاريخ البداية
  const [studyHallDateTo, setStudyHallDateTo] = useState(""); // تاريخ النهاية
  const [resourcesSubTab, setResourcesSubTab] = useState("resources"); // "resources" or "qanda"

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
        true, // Reset cache
      );
    },
    [studyHallSelectedDay, studyHallSort],
  );
  const [showAddReflectionModal, setShowAddReflectionModal] = useState(false);

  const [dailyReflection, setDailyReflection] = useState("");
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [activeTaskTab, setActiveTaskTab] = useState("task"); // 'task' or 'reflection'

  // Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "تأكيد",
    cancelText: "إلغاء",
    confirmColor: "purple",
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [taskOpenedAt, setTaskOpenedAt] = useState(null);
  const [showActionPlanModal, setShowActionPlanModal] = useState(false);
  const [actionPlanEditMode, setActionPlanEditMode] = useState(false);
  const [innerJournalTab, setInnerJournalTab] = useState("myReflections"); // 'myReflections' or 'savedReflections'
  const [selectedTask, setSelectedTask] = useState(null);
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionJson, setReflectionJson] = useState(null);
  const [benefitsText, setBenefitsText] = useState("");
  const [proposedStep, setProposedStep] = useState("");
  const [shareInStudyHall, setShareInStudyHall] = useState(true); // Default: مشاركة في قاعة التدارس
  const [videoWatched, setVideoWatched] = useState(false); // تتبع مشاهدة الفيديو
  // Read & Acknowledge mechanism states
  const [isInstructionsRead, setIsInstructionsRead] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showReflectionTabTooltip, setShowReflectionTabTooltip] =
    useState(false);
  const [showTadabburMode, setShowTadabburMode] = useState(false);
  const handleOpenTadabburMode = () => {
    setShowTadabburMode(true);
    setShowReflectionModal(false);
    setActiveTaskTab("task");
  };
  const [taskReflections, setTaskReflections] = useState({});
  const [pledgedSteps, setPledgedSteps] = useState(new Set()); // تتبع الخطوات الملتزم بها
  const [pledgingProgressId, setPledgingProgressId] = useState(null); // للتحكم في حالة التحميل
  const [showPledgeTooltip, setShowPledgeTooltip] = useState({}); // لتتبع عرض رسالة الالتزام
  const [showUpvoteTooltip, setShowUpvoteTooltip] = useState({}); // لتتبع عرض tooltip التصويت
  const [showBookmarkTooltip, setShowBookmarkTooltip] = useState({}); // لتتبع عرض tooltip الحفظ
  const [expandedTasks, setExpandedTasks] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const openChallengeDetailsModal = (dayNumber) => {
    const challenge = dayChallenges?.[dayNumber];
    if (!challenge) return;
    setChallengeDetailsModal({
      dayNumber,
      title: challenge.title,
      description: challenge.description,
    });
  };
  const closeChallengeDetailsModal = () => setChallengeDetailsModal(null);

  // Onboarding states
  const [showTaskModalIntro, setShowTaskModalIntro] = useState(false);
  const [showStudyHallIntro, setShowStudyHallIntro] = useState(false);
  const [showJournalIntro, setShowJournalIntro] = useState(false);
  const [showLeaderboardIntro, setShowLeaderboardIntro] = useState(false);
  const [showActionPlanIntro, setShowActionPlanIntro] = useState(false);
  const [showCheckBoxIntro, setShowCheckBoxIntro] = useState(false);
  // Onboarding helpers
  const handleOnboarding = (featureKey, showModalSetter, originalAction) => {
    // مفتاح عام لكل الموقع (مرّة واحدة فقط لكل ميزة عبر جميع المخيمات)
    const globalKey = `onboarding_${featureKey}_seen`;
    // دعم رجعي: مفتاح قديم خاص بكل مخيم
    const legacyKey = `onboarding_${featureKey}_seen_camp_${camp?.id}`;
    try {
      // ترقية أي مشاهدة قديمة إلى المفتاح العام
      if (localStorage.getItem(legacyKey) && !localStorage.getItem(globalKey)) {
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
  const [showCampNotifications, setShowCampNotifications] = useState(false);

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
      // Reset video watched state when modal opens or task changes
      setVideoWatched(false);
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
        },
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
        },
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
        },
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
        },
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

  // التحقق من وجود اختبار في اليوم المحدد
  const checkDayHasTest = useCallback(
    async (day) => {
      try {
        setCheckingTest(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/quran-camps/${
            camp.id
          }/daily-tests/${day}`,
          {
            headers: {
              "x-auth-token": token,
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setDayTestInfo({
              hasTest: true,
              test: data.data,
              hasAttempted: data.data.has_attempted || false,
            });
            return;
          }
        }
        setDayTestInfo({ hasTest: false });
      } catch (error) {
        console.error("Error checking test:", error);
        setDayTestInfo({ hasTest: false });
      } finally {
        setCheckingTest(false);
      }
    },
    [camp.id],
  );

  // التحقق من وجود اختبار عند تغيير اليوم
  useEffect(() => {
    if (showTaskSidebar && selectedDay) {
      checkDayHasTest(selectedDay);
    }
  }, [selectedDay, showTaskSidebar, checkDayHasTest]);

  // إكمال مهمة (بدون تدبر) مع تحديث فوري للـ state
  const markTaskComplete = useCallback(
    async (taskId) => {
      // قفل ناعم: منع إكمال المهام إذا انتهى المخيم (لكن السماح في المخيمات المنتهية للقراءة فقط)

      // منع إكمال المهام إذا كان المخيم لم يبدأ بعد
      if (isCampNotStarted) {
        toast.error(
          "المخيم لم يبدأ بعد. يرجى الانتظار حتى يبدأ الادمن المخيم.",
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
          },
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
                : task,
            );

            // التحقق من إكمال جميع مهام اليوم
            const dayTasks = updatedTasks.filter(
              (task) => task.day_number === completedDay,
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
                `رائع! تم إكمال جميع مهام ${formatDayLabel(completedDay)} 🎉`,
                {
                  duration: 3000,
                },
              );
            }, 300);

            // تم إزالة الفتح التلقائي للـ Action Plan Modal
            // سيتم إضافة مهمة "كتابة الـ action plan" في الـ sidebar لليوم الأخير
          }

          // مسح cache قاعة التدارس لإظهار المحتوى الجديد
          clearStudyHallCache(studyHallSelectedDay);

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
    ],
  );

  // حفظ التدبر والفوائد
  const updateTaskBenefits = async (
    taskId,
    journalEntry,
    benefits,
    isPrivate = true,
    contentRich = null,
    proposedStep = null,
  ) => {
    // منع حفظ الفوائد إذا كان المخيم منتهياً (read_only)
    if (isReadOnly) {
      toast.error(
        "لا يمكن إضافة ملاحظات أو فوائد في المخيمات المنتهية. يمكنك إكمال المهام فقط.",
      );
      return false;
    }

    if (isCampNotStarted) {
      toast.error("المخيم لم يبدأ بعد. يرجى الانتظار حتى يبدأ الادمن المخيم.");
      return false;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/quran-camps/tasks/${taskId}/benefits`,
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
        },
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
            true,
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
          },
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
        },
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
        },
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
        },
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
          },
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
        },
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

  // منع scroll عند تغيير التبويب
  const previousActiveTab = useRef(activeTab);
  useLayoutEffect(() => {
    if (previousActiveTab.current !== activeTab) {
      // Save scroll position before tab change
      const scrollY =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop;
      previousActiveTab.current = activeTab;

      // Restore scroll position immediately
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: "instant" });
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollY, behavior: "instant" });
        });
      });
    }
  }, [activeTab]);

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
  const [showShareCampModal, setShowShareCampModal] = useState(false); // لمشاركة المخيم
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

    // تحويل البيانات إلى الشكل المناسب للعرض
    // كل تدبر يجب أن يظهر بشكل منفصل (استخدام progress_id أو id كـ key فريد)
    const formattedData = filteredData.map((item) => {
      return {
        ...item,
        reflectionText:
          item.type === "user_reflection" || item.type === "shared_reflection"
            ? item.content
            : "",
        benefits:
          item.type === "user_benefits"
            ? item.content?.replace(/^الفوائد المستخرجة:\s*/g, "") || ""
            : "",
        totalPoints: item.points || 0,
      };
    });

    // تطبيق الترتيب حسب الاختيار
    return formattedData.sort((a, b) => {
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
      resetCache = false,
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
        // Build query parameters
        const params = new URLSearchParams({
          day: day || "",
          sort: sort || "newest",
          page: page.toString(),
          limit: limit.toString(),
        });

        if (studyHallAuthorFilter) {
          params.append("author_filter", studyHallAuthorFilter);
        }
        if (studyHallDateFrom) {
          params.append("date_from", studyHallDateFrom);
        }
        if (studyHallDateTo) {
          params.append("date_to", studyHallDateTo);
        }
        if (studyHallSearch) {
          params.append("search", studyHallSearch);
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/quran-camps/${
            camp.id
          }/study-hall?${params.toString()}`,
          {
            headers: {
              "x-auth-token": `${token}`,
              "Content-Type": "application/json",
            },
          },
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
    [camp.id, studyHallSelectedDay, studyHallSort, studyHallCache],
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
        }),
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
          },
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
            }),
          );
          toast.error("حدث خطأ في التصويت");
        }
      } catch (error) {
        console.error("Upvote failed:", error);
        toast.error("حدث خطأ في التصويت");
      }
    },
    [camp?.id],
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
          },
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
                  item.pledge_count !== undefined && item.pledge_count !== null
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
              false,
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
    [camp?.id],
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
        }),
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
          },
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
            }),
          );
          toast.error("حدث خطأ في الحفظ");
        }
      } catch (error) {
        console.error("Save failed:", error);
        toast.error("حدث خطأ في الحفظ");
      }
    },
    [camp?.id],
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
        },
      );

      if (response.ok) {
        // إزالة التدبر من القائمة
        setStudyHallData((prevData) =>
          prevData.filter((item) => item.progress_id !== reflectionToDelete),
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
        },
      );

      if (response.ok) {
        // إزالة الفائدة من journalData
        setJournalData((prev) => ({
          ...prev,
          myReflections: prev.myReflections.filter(
            (item) => item.progress_id !== progressId,
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
        (item.task_type ? t.task_type === item.task_type : true),
    );

    if (!task) {
      toast.error("لم يتم العثور على المهمة المرتبطة بهذه الفائدة");
      return;
    }

    // Check if the task's day is locked
    const taskDayStatus = getDayStatus(task.day_number);
    if (taskDayStatus === "locked") {
      toast.error("لا يمكن الوصول إلى مهام اليوم المقفول");
      return;
    }

    // تعيين المهمة والفائدة الحالية
    const taskWithPath = {
      ...task,
      path: task.path || buildTaskPath(task, taskGroups || [], item.day_number),
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

  // دالة تعديل الفائدة من قاعة التدارس
  const handleEditStudyHallReflection = (item) => {
    // تنظيف title من "تدبر: " أو أي بادئة مشابهة
    const cleanTitle = item.title
      ? item.title.replace(/^تدبر\s*:\s*/i, "").trim()
      : "";

    // البحث عن المهمة من userProgress
    // نحاول البحث بعدة طرق:
    // 1. استخدام task_title إذا كان موجوداً
    // 2. استخدام title بعد تنظيفه من "تدبر: "
    // 3. استخدام day فقط (نأخذ أول مهمة في اليوم)
    let task = null;

    if (item.task_title) {
      // البحث باستخدام task_title و day
      task = userProgress?.tasks?.find(
        (t) => t.day_number === item.day && t.title === item.task_title,
      );
    }

    // إذا لم نجد، نبحث باستخدام title بعد تنظيفه
    if (!task && cleanTitle && item.day) {
      task = userProgress?.tasks?.find(
        (t) => t.day_number === item.day && t.title === cleanTitle,
      );
    }

    // إذا لم نجد، نبحث باستخدام day فقط (نأخذ أول مهمة في اليوم)
    if (!task && item.day) {
      const dayTasks = userProgress?.tasks?.filter(
        (t) => t.day_number === item.day,
      );
      if (dayTasks && dayTasks.length > 0) {
        // نأخذ أول مهمة في اليوم (أو المهمة المكتملة إذا كانت موجودة)
        task = dayTasks.find((t) => t.completed) || dayTasks[0];
      }
    }

    if (!task) {
      toast.error("لم يتم العثور على المهمة المرتبطة بهذه الفائدة");
      return;
    }

    // Check if the task's day is locked
    const taskDayStatus = getDayStatus(item.day);
    if (taskDayStatus === "locked") {
      toast.error("لا يمكن الوصول إلى مهام اليوم المقفول");
      return;
    }

    // تعيين المهمة والفائدة الحالية
    const taskWithPath = {
      ...task,
      path: task.path || buildTaskPath(task, taskGroups || [], item.day),
    };

    setSelectedTask(taskWithPath);
    // استخدام content (سواء كان تدبر أو فائدة)
    setReflectionText(item.content || "");
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
          proposedStep || null, // proposed_step
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
      setShareInStudyHall(true); // Default: مشاركة في قاعة التدارس

      // إعادة جلب بيانات التقدم
      await fetchUserProgress();
    } catch (error) {
      console.error("Failed to complete task:", error);
      toast.error("حدث خطأ أثناء إكمال المهمة. يرجى المحاولة مرة أخرى.");
      setIsCompleting(false);
    }
  };

  // الدالة الشاملة الجديدة لإكمال المهمة وحفظ الفوائد
  // تذكير عند إغلاق المهمة بدون إتمام
  useEffect(() => {
    if (showReflectionModal && !selectedTask?.completed) {
      const handleBeforeUnload = (e) => {
        if (hasUnsavedChanges && reflectionText.trim()) {
          e.preventDefault();
          e.returnValue = "لديك تغييرات غير محفوظة. هل تريد المغادرة؟";
          return e.returnValue;
        }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [showReflectionModal, hasUnsavedChanges, reflectionText, selectedTask]);

  const handleCompleteAndSave = async () => {
    // السماح بالإكمال بعد انتهاء المخيم؛ سيتم منع النقاط/التفاعل عبر isReadOnly

    // منع إكمال المهام إذا كان المخيم لم يبدأ بعد
    if (isCampNotStarted) {
      toast.error("المخيم لم يبدأ بعد. يرجى الانتظار حتى يبدأ الادمن المخيم.");
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
          proposedStep || null, // proposed_step
        );
      }

      // الخطوة 2: إكمال المهمة (فقط إذا لم يكن تعديلاً)
      if (!isEdit) {
        await markTaskComplete(selectedTask.id);
      }

      // الخطوة 3: تحديث journalData إذا كان تعديلاً أو إضافة جديدة
      if (isEdit) {
        await fetchJournalData();
        toast.success("تم تحديث الفائدة بنجاح! ✅");
        // تحديث قاعة التدارس إذا كانت الفائدة عامة
        if (!shareInStudyHall) {
          // shareInStudyHall = false يعني عامة (is_private = false)
          clearStudyHallCache(selectedTask.day_number);
          if (activeTab === "study_hall") {
            await fetchStudyHallContent(
              studyHallSelectedDay,
              studyHallSort,
              1,
              20,
              true,
            );
          }
        }
      } else if (reflectionText.trim() !== "") {
        // تحديث سجلي بعد إضافة تدبر جديد
        await fetchJournalData();
        // تحديث قاعة التدارس إذا كانت الفائدة عامة
        if (!shareInStudyHall) {
          // shareInStudyHall = false يعني عامة
          clearStudyHallCache(selectedTask.day_number);
          if (activeTab === "study_hall") {
            await fetchStudyHallContent(
              studyHallSelectedDay,
              studyHallSort,
              1,
              20,
              true,
            );
          }
        }
      }

      // الخطوة 4: إغلاق وتحديث
      setHasUnsavedChanges(false);
      setShowReflectionModal(false);
      setActiveTaskTab("task");
      setReflectionText("");
      setReflectionJson(null);
      setProposedStep("");
      setShareInStudyHall(true); // Default: مشاركة في قاعة التدارس
      setReflectionToEdit(null); // إعادة تعيين حالة التعديل
      setTaskOpenedAt(null);
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
      // مسح كاش يوم محدد (جميع الصفحات والترتيبات)
      setStudyHallCache((prev) => {
        const newCache = { ...prev };
        // مسح جميع مفاتيح الكاش التي تحتوي على نفس اليوم
        Object.keys(newCache).forEach((key) => {
          if (key.startsWith(`${camp.id}-${day}-`)) {
            delete newCache[key];
          }
        });
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
      {isReadOnly &&
        !(
          userProgress?.tasks?.length > 0 &&
          userProgress.tasks.every((t) => t.completed)
        ) && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 text-gray-800 px-4 py-3 text-sm sm:text-base">
            هذا المخيم منتهي. يمكنك إكمال المهام للتتبع الشخصي فقط بدون نقاط أو
            تفاعل اجتماعي.
          </div>
        )}
    </div>
  );

  const tabs = useMemo(
    () => [
      { id: "journey", label: "خريطة الرحلة", icon: MapPin },
      // Study hall only when enabled
      ...(camp?.enable_study_hall
        ? [{ id: "study", label: "قاعة التدارس", icon: BookOpen }]
        : []),
      {
        id: "resources",
        label: "الموارد",
        icon: FolderOpen,
        badge: (resources?.length || 0) + (qanda?.length || 0),
      },
      { id: "my_journal", label: "سجلي", icon: FileText },
      { id: "friends", label: "الصحبة", icon: Users },
    ],
    [camp?.status, camp?.enable_study_hall, resources, qanda],
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
  const getDayProgress = useCallback(
    (dayNumber) => {
      if (!userProgress?.tasks) return 0;
      const dayTasks = userProgress.tasks.filter(
        (task) => task.day_number === dayNumber,
      );
      if (dayTasks.length === 0) return 0;
      const completedTasks = dayTasks.filter((task) => task.completed).length;
      return (completedTasks / dayTasks.length) * 100;
    },
    [userProgress],
  );

  const getDayStatus = useCallback(
    (dayNumber) => {
      if (!userProgress) return "locked";

      // جلب مهام اليوم
      const dayTasks = userProgress.tasks.filter(
        (task) => task.day_number === dayNumber,
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
    [userProgress, currentDay],
  );

  return (
    <div className="max-w-7xl mx-auto relative font-almarai">
      {/* ----- زر الملخص للمخيم المنتهي (الهوية البصرية) ----- */}
      {/* ----- الواجهة العادية للمخيم ----- */}
      <>
        {/* Welcome Header with Leave Camp Button */}
        <div className="relative mb-4 sm:mb-6 lg:mb-8">
          {/* زر عرض ملخص الإنجاز - يظهر فقط عند انتهاء المخيم */}
          {camp && camp.status === "completed" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 sm:mb-6"
            >
              <Link
                to={`/camp-summary/${camp.id}`}
                className="font-almarai group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#7440E9] via-[#8B5CF6] to-[#7440E9] text-white rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-[#7440E9]/50 font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 overflow-hidden"
                style={{
                  backgroundSize: "200% 200%",
                  animation: "gradient 3s ease infinite",
                }}
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-transparent to-yellow-400/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                {/* Sparkle effect */}
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative z-10"
                >
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 fill-yellow-300 text-yellow-300 drop-shadow-lg" />
                </motion.div>

                <span className="relative z-10 hidden sm:inline">
                  🎉 عرض ملخص إنجازك
                </span>
                <span className="relative z-10 sm:hidden">🎉 الملخص</span>

                {/* Pulse effect */}
                <motion.div
                  className="absolute inset-0 rounded-xl sm:rounded-2xl bg-white/20"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </Link>
            </motion.div>
          )}

          {/* Welcome Header */}
          <div className="text-center px-2 relative">
            <h2 className="font-almarai text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-3 sm:mb-4 lg:mb-6 leading-tight">
              مرحباً بك في رحلة {camp.name}
            </h2>
            <p className="font-almarai text-sm sm:text-base lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {camp.camp_type === "quran"
                ? `استعد لرحلة تحويلية مع سورة ${camp.surah_name}`
                : `استعد لرحلة تحويلية مع كتاب ${getHadithBookNameAr(camp.content_source_slug)}`}
              - {camp.duration_days} أيام من التعلم المكثف
            </p>
          </div>
        </div>

        {/* Progress Overview */}
        <ProgressOverview
          loading={loading}
          campDay={campDay}
          camp={camp}
          userProgress={userProgress}
          onSettingsClick={() => setShowCampSettings(true)}
        />

        {/* Banners */}
        <Banners />

        {/* Breadcrumbs */}
        <CampBreadcrumbs
          camp={camp}
          selectedDay={selectedDay}
          selectedTask={selectedTask}
          taskGroups={taskGroups}
        />

        {/* Tabs Navigation */}
        <CampTabs
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleOnboarding={handleOnboarding}
          setShowStudyHallIntro={setShowStudyHallIntro}
          setShowJournalIntro={setShowJournalIntro}
          campId={camp.id}
        />

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
                    <h4 className="font-almarai text-base sm:text-lg font-bold text-blue-900 mb-1">
                      🔒 المخيم لم يفتح بعد
                    </h4>
                    <p className="text-sm sm:text-base text-blue-800 leading-relaxed">
                      {camp?.status === "scheduled"
                        ? "المخيم مُجدول ولم يفتح بعد. لا يمكنك الوصول إلى المهام أو إكمالها حتى يبدأ المشرف المخيم رسمياً."
                        : "المخيم في حالة التسجيل المبكر. لا يمكنك فتح المهام أو إكمالها حتى يبدأ المشرف المخيم."}{" "}
                      سيتم إشعارك عند بدء المخيم عبر البريد الإلكتروني
                      والإشعارات.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Cohort Info Panel */}
            {camp.cohort_number && (
              <CohortInfoPanel
                cohortNumber={camp.cohort_number}
                cohortName={camp.cohort_name}
                cohortStartDate={camp.start_date}
                cohortEndDate={camp.end_date}
                totalParticipants={camp.total_participants || 0}
                userRank={userProgress?.rank || null}
                averageCompletion={completionStats.averageCompletion || 0}
              />
            )}

            {/* Progress Bar */}
            <ProgressBar
              completed={completionStats.completedDays || 0}
              total={camp.duration_days}
              streak={completionStats.currentStreak || 0}
              points={userProgress?.points || 0}
              completedTasks={
                userProgress?.tasks?.filter((task) => task.completed).length ||
                0
              }
              totalTasks={
                userProgress?.tasks?.length || dailyTasks?.length || 0
              }
              campDays={camp.duration_days}
            />

            {/* Journey Map using DayNodeSVG */}
            <div className="relative">
              {/* Lock overlay if cohort is closed or not started */}
              {(camp?.user_cohort?.is_closed ||
                camp?.user_cohort?.not_started) && (
                <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-8">
                  <div className="text-center">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                        camp?.user_cohort?.not_started
                          ? "bg-blue-100"
                          : camp?.user_cohort?.is_completed
                            ? "bg-gray-100"
                            : "bg-red-100"
                      }`}
                    >
                      <Lock
                        className={`w-8 h-8 ${
                          camp?.user_cohort?.not_started
                            ? "text-blue-600"
                            : camp?.user_cohort?.is_completed
                              ? "text-gray-600"
                              : "text-red-600"
                        }`}
                      />
                    </div>
                    <h3
                      className={`font-almarai text-xl font-bold mb-2 ${
                        camp?.user_cohort?.not_started
                          ? "text-blue-900"
                          : camp?.user_cohort?.is_completed
                            ? "text-gray-900"
                            : "text-red-900"
                      }`}
                    >
                      {camp?.user_cohort?.not_started
                        ? "المخيم لم يبدأ بعد"
                        : camp?.user_cohort?.is_completed
                          ? "المخيم منتهي"
                          : camp?.user_cohort?.is_cancelled
                            ? "المخيم تم إلغاؤه"
                            : "خريطة الرحلة مقفولة"}
                    </h3>
                    <p className="text-gray-700 text-sm max-w-md">
                      {camp?.user_cohort?.not_started ? (
                        <>
                          الفوج الذي انتسبت إليه (
                          {camp?.user_cohort?.cohort_number}) لم يبدأ بعد.
                          <br />
                          ستبدأ خريطة الرحلة والمهام عند بدء المخيم.
                        </>
                      ) : camp?.user_cohort?.is_completed ? (
                        <>
                          الفوج الذي انتسبت إليه (
                          {camp?.user_cohort?.cohort_number}) قد انتهى.
                          <br />
                          لا يمكنك الوصول إلى خريطة الرحلة والمهام بعد انتهاء
                          المخيم.
                        </>
                      ) : (
                        <>
                          عذراً، الفوج الذي انتسبت إليه (
                          {camp?.user_cohort?.cohort_number}) مقفول حالياً.
                          <br />
                          لا يمكنك الوصول إلى خريطة الرحلة والمهام في الوقت
                          الحالي.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}
              <div
                className={`flex flex-wrap justify-center items-center gap-2 sm:gap-3 lg:gap-4 px-1 sm:px-2 lg:px-0 ${
                  camp?.user_cohort?.is_closed || camp?.user_cohort?.not_started
                    ? "opacity-50 pointer-events-none"
                    : ""
                }`}
              >
                {Array.from({ length: camp.duration_days }, (_, index) => {
                  const dayNumber = index + 1;
                  const status = getDayStatus(dayNumber);
                  const dayProgress = getDayProgress(dayNumber);
                  const isMilestone = [10, 20, 30].includes(dayNumber);
                  const hasReflection = userProgress?.tasks?.some(
                    (task) => task.day_number === dayNumber && task.benefits,
                  );
                  const isSelected = dayNumber === selectedDay;
                  const isCelebrating =
                    celebratingDay === dayNumber && status === "completed";

                  // Convert status to DayNodeSVG format
                  const svgStatus =
                    status === "completed"
                      ? "completed"
                      : status === "active"
                        ? "active"
                        : status === "incomplete"
                          ? "incomplete"
                          : "locked";

                  return (
                    <React.Fragment key={dayNumber}>
                      <div className="flex flex-col items-center">
                        <motion.div
                          className="cursor-pointer"
                          whileHover={
                            status !== "locked" &&
                            !camp?.user_cohort?.is_closed &&
                            !camp?.user_cohort?.not_started
                              ? { scale: 1.05 }
                              : {}
                          }
                          whileTap={
                            status !== "locked" &&
                            !camp?.user_cohort?.is_closed &&
                            !camp?.user_cohort?.not_started
                              ? { scale: 0.95 }
                              : {}
                          }
                          onClick={() => {
                            if (camp?.user_cohort?.not_started) {
                              toast.error(
                                "المخيم لم يبدأ بعد - ستبدأ خريطة الرحلة عند بدء المخيم",
                              );
                              return;
                            }
                            if (camp?.user_cohort?.is_closed) {
                              toast.error(
                                "خريطة الرحلة مقفولة - الفوج الذي انتسبت إليه مقفول حالياً",
                              );
                              return;
                            }
                            if (status !== "locked" && !isCampNotStarted) {
                              handleOnboarding(
                                "taskModal",
                                setShowTaskModalIntro,
                                () => {
                                  setSelectedDay(dayNumber);
                                  setShowTaskSidebar(true);
                                },
                              );
                            }
                          }}
                        >
                          <DayNodeSVG
                            status={svgStatus}
                            progress={dayProgress}
                            isSelected={isSelected}
                            isCelebrating={isCelebrating}
                            size="md"
                          />
                        </motion.div>
                        {/* Day Label */}
                        <div className="mt-2 text-center max-w-[70px]">
                          <span
                            className={`font-bold text-xs block ${
                              status === "locked" ||
                              camp?.user_cohort?.is_closed ||
                              camp?.user_cohort?.not_started
                                ? "text-gray-500"
                                : "text-gray-800"
                            }`}
                          >
                            {formatDayLabel(dayNumber)}
                          </span>
                          {status !== "locked" &&
                            !camp?.user_cohort?.is_closed &&
                            !camp?.user_cohort?.not_started && (
                              <p className="text-[10px] text-purple-600 font-medium mt-0.5 line-clamp-2">
                                {getDayTheme(
                                  dayNumber,
                                  userProgress?.tasks,
                                  taskGroups,
                                ) || `مهام ${formatDayLabel(dayNumber)}`}
                              </p>
                            )}
                        </div>
                        {/* Milestone Marker for special days */}
                        {isMilestone && (
                          <MilestoneMarker
                            dayNumber={dayNumber}
                            achieved={status === "completed"}
                          />
                        )}
                      </div>
                      {dayNumber < camp.duration_days && (
                        <div className="flex-shrink-0 w-4 sm:w-6 md:w-8 h-1 sm:h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <motion.div
                            className={`h-full ${
                              status === "completed"
                                ? "bg-green-500"
                                : status === "active"
                                  ? "bg-[#7440E9]"
                                  : "bg-gray-300"
                            }`}
                            initial={{ width: 0 }}
                            animate={{
                              width:
                                status === "completed"
                                  ? "100%"
                                  : status === "active"
                                    ? `${dayProgress}%`
                                    : "0%",
                            }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Milestone Indicators */}
            <div className="flex justify-center gap-4 mt-6">
              {[10, 20, 30]
                .filter((day) => day <= camp.duration_days)
                .map((day) => {
                  const status = getDayStatus(day);
                  return (
                    <MilestoneIndicator
                      key={day}
                      type={
                        day === 10
                          ? "quarter"
                          : day === 20
                            ? "half"
                            : day === 30
                              ? "three-quarters"
                              : "complete"
                      }
                      achieved={status === "completed"}
                      dayNumber={day}
                      campDays={camp.duration_days}
                    />
                  );
                })}
            </div>
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
              <StudyHallLayout
                campId={camp.id}
                cohortNumber={camp.current_cohort_number}
                cohortName={camp.cohort_name}
                duration_days={camp.duration_days}
                currentUser={currentUser}
                getAvatarUrl={getAvatarUrl}
                onUpvote={handleToggleUpvote}
                onSave={handleToggleSave}
                onPledge={handlePledgeToJointStep}
                onDelete={openDeleteModal}
                onEdit={handleEditStudyHallReflection}
                onShareCamp={() => setShowShareCampModal(true)}
                initialReflections={studyHallData}
                isReadOnly={isReadOnly}
                isCampNotStarted={isCampNotStarted}
                campSettings={campSettings}
                selectedDay={studyHallSelectedDay}
                setSelectedDay={setStudyHallSelectedDay}
                pagination={studyHallPagination}
                onPageChange={(page) => {
                  fetchStudyHallContent(
                    studyHallSelectedDay,
                    studyHallSort,
                    page,
                    20,
                    false,
                  );
                }}
                loading={studyHallLoading}
                loadingMore={false}
                loadMoreRef={null}
                enableInfiniteScroll={false}
                onRetry={() => {
                  fetchStudyHallContent(
                    studyHallSelectedDay,
                    studyHallSort,
                    1,
                    20,
                    true,
                  );
                }}
              />
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
                            <h3 className="font-almarai text-lg sm:text-xl md:text-2xl font-bold">
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
                        className={`font-almarai px-3 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-sm sm:text-base md:text-lg transition-all whitespace-nowrap flex-shrink-0 ${
                          innerJournalTab === "myReflections"
                            ? "text-[#7440E9] border-b-2 sm:border-b-3 md:border-b-4 border-[#7440E9]"
                            : "text-gray-500 hover:text-[#7440E9]"
                        }`}
                      >
                        فوائدي ({journalData.myReflections?.length || 0})
                      </button>
                      <button
                        onClick={() => setInnerJournalTab("savedReflections")}
                        className={`font-almarai px-3 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-sm sm:text-base md:text-lg transition-all whitespace-nowrap flex-shrink-0 ${
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
                          {/* زر تحميل PDF */}
                          {journalData.myReflections &&
                            journalData.myReflections.length > 0 && (
                              <div className="flex justify-end mb-4 w-full sm:w-auto">
                                <motion.button
                                  whileHover={
                                    !isDownloadingPDF ? { scale: 1.05 } : {}
                                  }
                                  whileTap={
                                    !isDownloadingPDF ? { scale: 0.95 } : {}
                                  }
                                  disabled={isDownloadingPDF}
                                  onClick={async () => {
                                    if (isDownloadingPDF) return;

                                    setIsDownloadingPDF(true);
                                    try {
                                      const token =
                                        localStorage.getItem("token");
                                      const response = await fetch(
                                        `${
                                          import.meta.env.VITE_API_URL
                                        }/quran-camps/${
                                          camp.id
                                        }/reflections/pdf`,
                                        {
                                          method: "GET",
                                          headers: {
                                            "x-auth-token": token,
                                          },
                                        },
                                      );

                                      if (!response.ok) {
                                        // Try to get error message
                                        let errorMessage =
                                          "حدث خطأ أثناء تحميل الملف";
                                        try {
                                          const errorData =
                                            await response.json();
                                          errorMessage =
                                            errorData.message || errorMessage;
                                        } catch (e) {
                                          errorMessage = `خطأ ${response.status}: ${response.statusText}`;
                                        }
                                        throw new Error(errorMessage);
                                      }

                                      // Check content type
                                      const contentType =
                                        response.headers.get("content-type");
                                      if (
                                        !contentType ||
                                        !contentType.includes("application/pdf")
                                      ) {
                                        console.error(
                                          "Invalid content type:",
                                          contentType,
                                        );
                                        throw new Error(
                                          "الملف المُستلم ليس ملف PDF صالح",
                                        );
                                      }

                                      const blob = await response.blob();

                                      // Extract filename from Content-Disposition header
                                      // Use camp name as fallback instead of camp.id
                                      const campNameFallback = camp.name
                                        ? `${camp.name} - تدبري.pdf`
                                        : `تدبرات_${camp.id}.pdf`;
                                      let filename = campNameFallback;
                                      const contentDisposition =
                                        response.headers.get(
                                          "content-disposition",
                                        );
                                      if (contentDisposition) {
                                        // First try UTF-8 encoded filename (filename*=UTF-8''...)
                                        // This is the preferred format for non-ASCII characters
                                        const utf8Match =
                                          contentDisposition.match(
                                            /filename\*=UTF-8''([^;]+)/i,
                                          );
                                        if (utf8Match && utf8Match[1]) {
                                          try {
                                            filename = decodeURIComponent(
                                              utf8Match[1],
                                            );
                                          } catch (e) {
                                            filename = utf8Match[1];
                                          }
                                        } else {
                                          // Fallback to basic filename parameter
                                          const filenameMatch =
                                            contentDisposition.match(
                                              /filename=['"]?([^'";]+)['"]?/i,
                                            );
                                          if (
                                            filenameMatch &&
                                            filenameMatch[1]
                                          ) {
                                            filename = filenameMatch[1];
                                          }
                                        }
                                      }

                                      // Log for debugging
                                      console.log(
                                        "Extracted filename:",
                                        filename,
                                      );
                                      console.log(
                                        "Content-Disposition header:",
                                        contentDisposition,
                                      );

                                      // Verify blob type
                                      if (blob.type !== "application/pdf") {
                                        console.error(
                                          "Invalid blob type:",
                                          blob.type,
                                        );
                                        // Try to fix it
                                        const fixedBlob = new Blob([blob], {
                                          type: "application/pdf",
                                        });

                                        const url =
                                          window.URL.createObjectURL(fixedBlob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = filename;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        document.body.removeChild(a);
                                      } else {
                                        const url =
                                          window.URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = filename;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        document.body.removeChild(a);
                                      }

                                      toast.success(
                                        "تم تحميل ملف PDF بنجاح! 🎉",
                                        {
                                          duration: 3000,
                                        },
                                      );
                                    } catch (error) {
                                      console.error(
                                        "Error downloading PDF:",
                                        error,
                                      );
                                      toast.error(
                                        error.message ||
                                          "حدث خطأ أثناء تحميل الملف",
                                        {
                                          duration: 3000,
                                        },
                                      );
                                    } finally {
                                      setIsDownloadingPDF(false);
                                    }
                                  }}
                                  className={`flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#7440E9] to-[#5a2fc7] text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg font-semibold text-sm sm:text-base ${
                                    isDownloadingPDF
                                      ? "opacity-70 cursor-not-allowed"
                                      : "hover:from-[#5a2fc7] hover:to-[#4a24b5]"
                                  }`}
                                >
                                  {isDownloadingPDF ? (
                                    <>
                                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                      <span>جاري التحميل...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                                      <span className="whitespace-nowrap">
                                        تحميل التدبرات كـ PDF
                                      </span>
                                    </>
                                  )}
                                </motion.button>
                              </div>
                            )}

                          {journalData.myReflections &&
                          journalData.myReflections.length > 0 ? (
                            journalData.myReflections.map((item, index) => (
                              <JournalCard
                                key={`my-${item.id}`}
                                item={item}
                                index={index}
                                type="my"
                                isReadOnly={isReadOnly}
                                isCampNotStarted={isCampNotStarted}
                                getAvatarUrl={getAvatarUrl}
                                expandedItems={expandedJournalItems}
                                setExpandedItems={setExpandedJournalItems}
                                truncateHTML={truncateHTML}
                                showMenu={showJournalMenu}
                                setShowMenu={setShowJournalMenu}
                                onEdit={handleEditJournalReflection}
                                onDelete={(progressId) => {
                                  setReflectionToDelete(progressId);
                                  setShowDeleteModal(true);
                                }}
                                onUpvote={handleToggleUpvote}
                                onSave={handleToggleSave}
                                itemId={`my-${item.id}`}
                              />
                            ))
                          ) : (
                            <div className="text-center py-12 bg-gradient-to-br from-[#F7F6FB] to-[#F3EDFF] rounded-xl border border-[#7440E9]/20">
                              <Heart className="w-16 h-16 text-[#7440E9]/50 mx-auto mb-4" />
                              <h4 className="font-almarai text-lg font-semibold text-[#7440E9] mb-2">
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
                            journalData.savedReflections.map((item, index) => (
                              <JournalCard
                                key={`saved-${item.id}`}
                                item={item}
                                index={index}
                                type="saved"
                                isReadOnly={isReadOnly}
                                isCampNotStarted={isCampNotStarted}
                                getAvatarUrl={getAvatarUrl}
                                expandedItems={expandedJournalItems}
                                setExpandedItems={setExpandedJournalItems}
                                truncateHTML={truncateHTML}
                                showMenu={{}}
                                setShowMenu={() => {}}
                                onEdit={() => {}}
                                onDelete={() => {}}
                                onUpvote={handleToggleUpvote}
                                onSave={handleToggleSave}
                                itemId={`saved-${item.id}`}
                              />
                            ))
                          ) : (
                            <div className="text-center py-12 bg-gradient-to-br from-[#F7F6FB] to-[#F3EDFF] rounded-xl border border-[#7440E9]/20">
                              <Bookmark className="w-16 h-16 text-[#7440E9]/50 mx-auto mb-4" />
                              <h4 className="font-almarai text-lg font-semibold text-[#7440E9] mb-2">
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

          {/* Resources Tab - Combined */}
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
            className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100"
          >
            {/* Sub-tabs for Resources */}
            <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200 pb-3 sm:pb-4">
              <button
                onClick={() => setResourcesSubTab("resources")}
                className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-95 ${
                  resourcesSubTab === "resources"
                    ? "bg-[#7440E9] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">مصادر الدراسة</span>
                  {resources?.length > 0 && (
                    <span
                      className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold flex-shrink-0 ${
                        resourcesSubTab === "resources"
                          ? "bg-white/20 text-white"
                          : "bg-[#7440E9]/10 text-[#7440E9]"
                      }`}
                    >
                      {resources.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setResourcesSubTab("qanda")}
                className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-95 ${
                  resourcesSubTab === "qanda"
                    ? "bg-[#7440E9] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">اسأل وأجب</span>
                  {qanda?.length > 0 && (
                    <span
                      className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold flex-shrink-0 ${
                        resourcesSubTab === "qanda"
                          ? "bg-white/20 text-white"
                          : "bg-[#7440E9]/10 text-[#7440E9]"
                      }`}
                    >
                      {qanda.length}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Sub-tab Content */}
            <AnimatePresence mode="wait">
              {resourcesSubTab === "resources" ? (
                <motion.div
                  key="resources-content"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <CampResources
                    resources={resources}
                    isLoading={resourcesLoading}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="qanda-content"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <CampQandA
                    campId={camp.id}
                    qanda={qanda}
                    isLoading={qandaLoading}
                    onQuestionAsked={handleQuestionAsked}
                  />
                </motion.div>
              )}
            </AnimatePresence>
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
                    (task) => task.day_number === selectedDay,
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
                  setActiveTab("study"),
                )
              }
              title="قاعة التدارس"
              icon={StudyHallIcon}
            >
              هذه هي ساحة النقاش الجماعي! هنا سترى الفوائد التي يشاركها الجميع.
              يمكنك التصويت للمفيد منها وحفظ ما يعجبك في سجلك.
            </OnboardingModal>
          )}

          {showJournalIntro && (
            <OnboardingModal
              key="journalIntro"
              isOpen={showJournalIntro}
              onClose={() =>
                closeOnboarding("journal", setShowJournalIntro, () =>
                  setActiveTab("my_journal"),
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
                  setActiveTab("leaderboard"),
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
                  setShowActionPlanModal(true),
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

        <AnimatePresence>
          {challengeDetailsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={closeChallengeDetailsModal}
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={closeChallengeDetailsModal}
                  className="absolute top-3 left-3 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                      {formatChallengeDayLabel(
                        challengeDetailsModal?.dayNumber,
                      )}
                    </p>
                    <h3 className="font-almarai text-lg font-bold text-gray-900">
                      {challengeDetailsModal?.title}
                    </h3>
                  </div>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 max-h-[50vh] overflow-y-auto">
                  <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">
                    {challengeDetailsModal?.description}
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={closeChallengeDetailsModal}
                    className="rounded-full px-4 py-2 text-sm font-semibold text-amber-700 border border-amber-200 hover:bg-amber-50"
                  >
                    فهمت التحدي
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task Sidebar */}
        <AnimatePresence>
          {showTaskSidebar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1100] bg-black/50 dark:bg-black/70"
              onClick={() => setShowTaskSidebar(false)}
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="camp-task-sidebar fixed left-0 top-0 z-[1101] flex h-[100dvh] w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl dark:bg-[#1a1a1e] dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)] sm:max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Sidebar Header - Sticky */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-4 lg:p-6 z-10 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-almarai text-base sm:text-lg lg:text-xl font-bold text-gray-800">
                        مهام {formatDayLabel(selectedDay)}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                        {userProgress?.tasks?.filter(
                          (task) => task.day_number === selectedDay,
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
                          🔒 المخيم لم يفتح بعد
                        </h4>
                        <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                          {camp?.status === "scheduled"
                            ? "المخيم مُجدول ولم يفتح بعد. لا يمكنك الوصول إلى المهام أو إكمالها حتى يبدأ المشرف المخيم رسمياً."
                            : "المخيم في حالة التسجيل المبكر. لا يمكنك فتح المهام أو إكمالها حتى يبدأ المشرف المخيم."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Test Section */}
                {!isCampNotStarted && (
                  <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
                    {checkingTest ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-[#7440E9] border-gray-200"></div>
                      </div>
                    ) : dayTestInfo?.hasTest ? (
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-200">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7440E9] to-[#8B5CF6] text-white flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-almarai text-sm sm:text-base font-bold text-purple-900 mb-1">
                                اختبار اليوم
                              </h4>
                              <p className="text-xs text-purple-700">
                                {dayTestInfo.hasAttempted
                                  ? "تم حل الاختبار - يمكنك مراجعة النتائج"
                                  : "اختبار متاح - اضغط للبدء"}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (dayTestInfo.hasTest) {
                                if (dayTestInfo.hasAttempted) {
                                  // Show results directly if test is already completed
                                  // TestReviewView will fetch the results itself
                                  setTestResults({}); // Set a truthy value to trigger the modal
                                } else {
                                  // Open test modal for new test
                                  setTestInfo({
                                    testId: dayTestInfo.test.id,
                                    attemptId: dayTestInfo.test.attempt_id,
                                  });
                                  setShowTestModal(true);
                                }
                              }
                            }}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                              dayTestInfo.hasAttempted
                                ? "bg-white text-purple-700 border-2 border-purple-300 hover:bg-purple-50"
                                : "bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white hover:shadow-lg hover:shadow-purple-500/30"
                            }`}
                          >
                            {dayTestInfo.hasAttempted
                              ? "عرض النتائج"
                              : "بدء الاختبار"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">
                              لا يوجد اختبار متاح لهذا اليوم
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tasks List */}
                <div className="p-3 sm:p-4 lg:p-6 space-y-6 pb-4 sm:pb-6 mb-12">
                  {(() => {
                    const dayTasks =
                      userProgress?.tasks?.filter(
                        (task) => task.day_number === selectedDay,
                      ) || [];
                    const taskTree = buildTaskTree(dayTasks, taskGroups || []);
                    const dayChallenge = dayChallenges?.[selectedDay] || null;

                    return (
                      <div className="space-y-6">
                        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                              <Target className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-amber-700 tracking-wide mb-1">
                                {formatChallengeDayLabel(selectedDay)}
                              </p>
                              {dayChallenge ? (
                                <>
                                  <h4 className="text-base font-bold text-amber-900">
                                    {dayChallenge.title}
                                  </h4>
                                  <p className="mt-1 text-sm text-amber-800 leading-relaxed">
                                    {dayChallenge.description?.length > 50
                                      ? `${dayChallenge.description.slice(
                                          0,
                                          20,
                                        )}...`
                                      : dayChallenge.description}
                                  </p>
                                  <div className="mt-3">
                                    <button
                                      onClick={() =>
                                        openChallengeDetailsModal(selectedDay)
                                      }
                                      className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-white/40 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-white"
                                    >
                                      👁️ عرض تفاصيل التحدي
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <p className="text-sm text-amber-800 leading-relaxed">
                                  لا يوجد تحدي خاص لهذا اليوم بعد. تابع مهامك
                                  اليومية وشارك أفضل ما خرجت به.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
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
                                      delay: groupIndex * 0.2 + taskIndex * 0.1,
                                    }}
                                    className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 ${
                                      task.completed
                                        ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-md hover:shadow-lg"
                                        : task.day_number < currentDay
                                          ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:border-orange-300 hover:shadow-md"
                                          : task.day_number === currentDay
                                            ? "bg-gradient-to-br from-[#F7F6FB] to-[#F3EDFF] border-[#7440E9]/30 hover:border-[#7440E9]/50 hover:shadow-lg ring-2 ring-[#7440E9]/10"
                                            : "bg-white border-gray-200 hover:border-[#7440E9]/30 hover:shadow-md"
                                    }`}
                                  >
                                    {/* Task Header */}
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 relative">
                                      <div
                                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md transition-all duration-300 ${
                                          task.completed
                                            ? "bg-gradient-to-br from-green-500 to-emerald-600"
                                            : task.day_number < currentDay
                                              ? "bg-gradient-to-br from-orange-500 to-amber-600"
                                              : task.day_number === currentDay
                                                ? "bg-gradient-to-br from-[#7440E9] to-[#8B5CF6] ring-2 ring-[#7440E9]/30"
                                                : "bg-gradient-to-br from-gray-400 to-gray-500"
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
                                            className={`font-bold text-sm sm:text-base md:text-lg truncate flex-1 ${
                                              task.completed
                                                ? "text-green-700 line-through decoration-green-500 decoration-2"
                                                : task.day_number < currentDay
                                                  ? "text-orange-800"
                                                  : task.day_number ===
                                                      currentDay
                                                    ? "text-[#7440E9]"
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
                                          className={`text-xs sm:text-sm truncate mt-1 leading-relaxed ${
                                            task.completed
                                              ? "text-green-600 line-through decoration-green-400 decoration-1"
                                              : task.day_number === currentDay
                                                ? "text-[#7440E9]/70"
                                                : "text-gray-600"
                                          }`}
                                        >
                                          {task.description}
                                        </p>
                                      </div>
                                    </div>

                                    {camp?.camp_type === "hadith" &&
                                      task?.content_ref_meta?.hadith_id && (
                                        <div className="mb-2 sm:mb-3">
                                          <HadithContentRenderer
                                            meta={task.content_ref_meta}
                                            compact
                                          />
                                        </div>
                                      )}

                                    {/* Task Info */}
                                    <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                                      {task.day_number < currentDay &&
                                        !task.completed && (
                                          <span className="px-2 py-0.5 sm:py-1 rounded-full text-xs bg-orange-100 text-orange-700 font-medium">
                                            ⚠️ متأخر
                                          </span>
                                        )}
                                      {task.day_number === currentDay &&
                                        !task.completed && (
                                          <span className="px-2.5 py-1 sm:py-1.5 rounded-full text-xs bg-gradient-to-r from-[#7440E9]/10 to-[#8B5CF6]/10 text-[#7440E9] font-semibold border border-[#7440E9]/20">
                                            📅 اليوم
                                          </span>
                                        )}
                                      <span className="flex items-center gap-1">
                                        ⏱️ {task.estimated_time || "30 دقيقة"}
                                      </span>
                                      {task.points && (
                                        <span className="flex items-center gap-1">
                                          ⭐ {task.points}
                                        </span>
                                      )}
                                      <span
                                        className={`px-2.5 py-1 sm:py-1.5 rounded-full text-xs font-semibold ${
                                          task.is_optional
                                            ? "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border border-orange-200"
                                            : "bg-gradient-to-r from-[#7440E9]/10 to-[#8B5CF6]/10 text-[#7440E9] border border-[#7440E9]/20"
                                        }`}
                                      >
                                        {task.is_optional ? "اختياري" : "مطلوب"}
                                      </span>
                                    </div>

                                    {/* أزرار المهمة */}
                                    <div className="flex gap-2">
                                      {/* زر إتمام سريع (للمهام البسيطة) */}
                                      {!task.completed && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (
                                              isReadOnly ||
                                              isCampNotStarted
                                            ) {
                                              toast.error(
                                                isCampNotStarted
                                                  ? "المخيم لم يفتح بعد. لا يمكنك إكمال المهام حتى يبدأ المشرف المخيم رسمياً"
                                                  : "لا يمكن إكمال المهام في المخيمات المنتهية",
                                              );
                                              return;
                                            }
                                            setConfirmationModal({
                                              isOpen: true,
                                              title: "إكمال المهمة",
                                              message: `هل تريد إكمال المهمة "${task.title}" مباشرة؟\n\nيمكنك إضافة التدبر لاحقاً من قائمة المهام المكتملة.`,
                                              confirmText: "نعم، أكمل المهمة",
                                              cancelText: "إلغاء",
                                              confirmColor: "green",
                                              onConfirm: async () => {
                                                const success =
                                                  await markTaskComplete(
                                                    task.id,
                                                  );
                                                if (success) {
                                                  await fetchUserProgress();
                                                }
                                              },
                                            });
                                          }}
                                          disabled={
                                            isReadOnly || isCampNotStarted
                                          }
                                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all duration-300 ${
                                            isReadOnly || isCampNotStarted
                                              ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                                              : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:from-green-600 hover:to-emerald-700 active:scale-95 transform"
                                          }`}
                                          title={
                                            isReadOnly || isCampNotStarted
                                              ? isCampNotStarted
                                                ? "المخيم لم يفتح بعد"
                                                : "المخيم منتهي"
                                              : "إكمال سريع بدون فتح المهمة"
                                          }
                                        >
                                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                          <span className="hidden sm:inline">
                                            إتمام سريع
                                          </span>
                                          <span className="sm:hidden">
                                            إتمام
                                          </span>
                                        </button>
                                      )}
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
                                                selectedDay,
                                              ),
                                          };
                                          // Check if the task's day is locked
                                          const taskDayStatus = getDayStatus(
                                            task.day_number,
                                          );
                                          if (taskDayStatus === "locked") {
                                            toast.error(
                                              "لا يمكن الوصول إلى مهام اليوم المقفول",
                                            );
                                            return;
                                          }

                                          setSelectedTask(taskWithPath);
                                          setReflectionText(
                                            task.journal_entry || "",
                                          );
                                          setReflectionJson(
                                            task.content_rich || null,
                                          );
                                          setProposedStep(
                                            task.proposed_step || "",
                                          );
                                          setShareInStudyHall(!task.is_private);
                                          setActiveTaskTab("task");
                                          setShowReflectionModal(true);
                                          setShowTaskSidebar(false);
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 transform active:scale-95 ${
                                          task.completed
                                            ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 hover:shadow-md hover:from-green-100 hover:to-emerald-100"
                                            : "bg-gradient-to-r from-[#F7F6FB] to-[#F3EDFF] text-[#7440E9] border border-[#7440E9]/30 hover:shadow-lg hover:from-[#F3EDFF] hover:to-[#E9E4F5] hover:border-[#7440E9]/50"
                                        }`}
                                      >
                                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span>عرض المهمة</span>
                                      </button>
                                    </div>
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
                                  <h4 className="font-almarai text-lg sm:text-xl font-bold text-purple-700 group-hover:text-purple-800 transition-colors truncate">
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
                                      {group.children.map((task, taskIndex) => (
                                        <motion.div
                                          key={task.id}
                                          initial={{ opacity: 0, x: -20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{
                                            delay:
                                              groupIndex * 0.2 +
                                              taskIndex * 0.1,
                                          }}
                                          className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-300 ${
                                            task.completed
                                              ? "bg-green-50 border-green-300 shadow-md"
                                              : task.day_number < currentDay
                                                ? "bg-orange-50 border-orange-200 active:border-orange-300 sm:hover:border-orange-300"
                                                : task.day_number === currentDay
                                                  ? "bg-blue-50 border-blue-200 active:border-blue-300 sm:hover:border-blue-300"
                                                  : "bg-white border-gray-200 active:border-purple-300 sm:hover:border-purple-300 active:shadow-sm sm:hover:shadow-sm"
                                          }`}
                                        >
                                          {/* Task Header */}
                                          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 relative">
                                            <div
                                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                task.completed
                                                  ? "bg-green-500"
                                                  : task.day_number < currentDay
                                                    ? "bg-orange-500"
                                                    : task.day_number ===
                                                        currentDay
                                                      ? "bg-blue-500"
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
                                                    task.completed_by_count || 0
                                                  }
                                                />
                                              </div>
                                              <p
                                                className={`text-xs sm:text-sm truncate mt-0.5 ${
                                                  task.completed
                                                    ? "text-green-600 line-through decoration-green-400 decoration-1"
                                                    : task.day_number <
                                                        currentDay
                                                      ? "text-orange-600"
                                                      : task.day_number ===
                                                          currentDay
                                                        ? "text-blue-600"
                                                        : "text-gray-500"
                                                }`}
                                              >
                                                {task.description}
                                              </p>
                                            </div>
                                          </div>

                                          {camp?.camp_type === "hadith" &&
                                            task?.content_ref_meta
                                              ?.hadith_id && (
                                              <div className="mb-2 sm:mb-3">
                                                <HadithContentRenderer
                                                  meta={task.content_ref_meta}
                                                  compact
                                                />
                                              </div>
                                            )}

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
                                              className={`px-2.5 py-1 sm:py-1.5 rounded-full text-xs font-semibold ${
                                                task.is_optional
                                                  ? "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border border-orange-200"
                                                  : "bg-gradient-to-r from-[#7440E9]/10 to-[#8B5CF6]/10 text-[#7440E9] border border-[#7440E9]/20"
                                              }`}
                                            >
                                              {task.is_optional
                                                ? "اختياري"
                                                : "مطلوب"}
                                            </span>
                                          </div>

                                          {/* أزرار المهمة */}
                                          <div className="flex gap-2">
                                            {/* زر إتمام سريع (للمهام البسيطة) */}
                                            {!task.completed && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (
                                                    isReadOnly ||
                                                    isCampNotStarted
                                                  ) {
                                                    toast.error(
                                                      isCampNotStarted
                                                        ? "المخيم لم يفتح بعد. لا يمكنك إكمال المهام حتى يبدأ المشرف المخيم رسمياً"
                                                        : "لا يمكن إكمال المهام في المخيمات المنتهية",
                                                    );
                                                    return;
                                                  }
                                                  setConfirmationModal({
                                                    isOpen: true,
                                                    title: "إكمال المهمة",
                                                    message: `هل تريد إكمال المهمة "${task.title}" مباشرة؟\n\nيمكنك إضافة التدبر لاحقاً من قائمة المهام المكتملة.`,
                                                    confirmText:
                                                      "نعم، أكمل المهمة",
                                                    cancelText: "إلغاء",
                                                    confirmColor: "green",
                                                    onConfirm: async () => {
                                                      const success =
                                                        await markTaskComplete(
                                                          task.id,
                                                        );
                                                      if (success) {
                                                        await fetchUserProgress();
                                                      }
                                                    },
                                                  });
                                                }}
                                                disabled={
                                                  isReadOnly || isCampNotStarted
                                                }
                                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all duration-300 ${
                                                  isReadOnly || isCampNotStarted
                                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                                                    : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:from-green-600 hover:to-emerald-700 active:scale-95 transform"
                                                }`}
                                                title={
                                                  isReadOnly || isCampNotStarted
                                                    ? isCampNotStarted
                                                      ? "المخيم لم يفتح بعد"
                                                      : "المخيم منتهي"
                                                    : "إكمال سريع بدون فتح المهمة"
                                                }
                                              >
                                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                <span className="hidden sm:inline">
                                                  إتمام سريع
                                                </span>
                                                <span className="sm:hidden">
                                                  إتمام
                                                </span>
                                              </button>
                                            )}
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
                                                      selectedDay,
                                                    ),
                                                };

                                                // Check if the task's day is locked
                                                const taskDayStatus =
                                                  getDayStatus(task.day_number);
                                                if (
                                                  taskDayStatus === "locked"
                                                ) {
                                                  toast.error(
                                                    "لا يمكن الوصول إلى مهام اليوم المقفول",
                                                  );
                                                  return;
                                                }

                                                setSelectedTask(taskWithPath);
                                                setReflectionText(
                                                  task.journal_entry || "",
                                                );
                                                setReflectionJson(
                                                  task.content_rich || null,
                                                );
                                                setProposedStep(
                                                  task.proposed_step || "",
                                                );
                                                setShareInStudyHall(
                                                  !task.is_private,
                                                );
                                                setActiveTaskTab("task");
                                                setShowReflectionModal(true);
                                                setShowTaskSidebar(false);
                                              }}
                                              className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 transform active:scale-95 ${
                                                task.completed
                                                  ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 hover:shadow-md hover:from-green-100 hover:to-emerald-100"
                                                  : "bg-gradient-to-r from-[#F7F6FB] to-[#F3EDFF] text-[#7440E9] border border-[#7440E9]/30 hover:shadow-lg hover:from-[#F3EDFF] hover:to-[#E9E4F5] hover:border-[#7440E9]/50"
                                              }`}
                                            >
                                              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                                              <span>عرض المهمة</span>
                                            </button>
                                          </div>
                                        </motion.div>
                                      ))}
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
                            (task) => task.day_number === selectedDay,
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
                            () => setShowActionPlanModal(true),
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

        {/* Quick Access Menu */}
        <QuickAccessMenu
          camp={camp}
          currentDay={currentDay}
          onNavigate={(type, value) => {
            if (type === "day") {
              setSelectedDay(value);
              setShowTaskSidebar(true);
            }
          }}
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

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
                    (item) => item.progress_id === reflectionToDelete,
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
                      (item) => item.progress_id === reflectionToDelete,
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
                            <span>سيتم حذف التدبر نهائياً من قاعة التدارس</span>
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
                      (item) => item.progress_id === reflectionToDelete,
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
            className="fixed inset-0 z-[1100] bg-black/50"
            onClick={() => setShowCampSettings(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-[1101] h-[100dvh] w-full max-w-md overflow-y-auto bg-white shadow-2xl sm:max-w-md"
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
                              e.target.checked,
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
                              e.target.checked,
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
                              e.target.checked,
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
                              e.target.checked,
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

        {/* Floating Help Button - Always Visible */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          onClick={() => setShowHelpCenter(true)}
          data-tour="help-button"
          className="fixed top-20 sm:top-24 right-4 sm:right-24 z-[1102] bg-gradient-to-br from-[#7440E9] to-[#8b5cf6] text-white rounded-full sm:rounded-xl shadow-2xl hover:shadow-[#7440E9]/50 transition-all duration-300 active:scale-95 flex items-center gap-2 group px-3 sm:px-4 py-2.5 sm:py-3"
          aria-label="مركز المساعدة"
        >
          <motion.div
            animate={{
              rotate: [0, -10, 10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          >
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
          </motion.div>
          <span className="hidden sm:inline text-sm font-semibold whitespace-nowrap">
            مساعدة
          </span>
          {/* Pulse ring for attention */}
          <motion.div
            className="absolute inset-0 rounded-full sm:rounded-xl border-2 border-white/50"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.button>

        {/* Floating Settings Button - Mobile Only */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          onClick={() => setShowCampSettings(true)}
          className="lg:hidden fixed bottom-6 left-6 z-40 w-14 h-14 bg-gradient-to-br from-[#7440E9] to-[#5a2fc7] text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-[#7440E9]/50 transition-all duration-300 active:scale-95"
          aria-label="إعدادات المخيم"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <Settings className="w-6 h-6" />
          </motion.div>
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#7440E9]"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.button>

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

      {/* Share Camp Modal */}
      <ShareModal
        isOpen={showShareCampModal}
        onClose={() => setShowShareCampModal(false)}
        camp={camp}
      />

      {/* Help Center Modal */}
      {showHelpCenter && camp && (
        <CampHelpCenter
          campId={camp.id}
          onClose={() => setShowHelpCenter(false)}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationDialog
        isOpen={confirmationModal.isOpen}
        onClose={() =>
          setConfirmationModal({
            ...confirmationModal,
            isOpen: false,
            onConfirm: null,
          })
        }
        onConfirm={() => {
          if (confirmationModal.onConfirm) {
            confirmationModal.onConfirm();
          }
          setConfirmationModal({
            ...confirmationModal,
            isOpen: false,
            onConfirm: null,
          });
        }}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        cancelText={confirmationModal.cancelText}
        confirmColor={confirmationModal.confirmColor}
      />

      {/* Daily Test Modal */}
      {showTestModal && (
        <DailyTestModal
          isOpen={showTestModal}
          onClose={(submitted, results) => {
            setShowTestModal(false);
            if (submitted && results) {
              // If test was just submitted, show results using TestResultsView
              setTestResults(results);
              // Refresh user progress after test submission
              fetchUserProgress();
              // Refresh test info to update hasAttempted status
              checkDayHasTest(selectedDay);
            }
            setTestInfo(null);
          }}
          campId={camp.id}
          dayNumber={selectedDay}
          testId={testInfo?.testId}
          attemptId={testInfo?.attemptId}
        />
      )}

      {/* Test Results View */}
      {testResults && !showTestModal && selectedDay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 top-[60px] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setTestResults(null)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-800">
                نتائج الاختبار
              </h2>
              <button
                onClick={() => setTestResults(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {/* Use TestResultsView if results data is already available, otherwise use TestReviewView to fetch */}
              {testResults.attempt || testResults.questions ? (
                <TestResultsView
                  results={testResults}
                  test={testInfo?.test || dayTestInfo?.test}
                />
              ) : (
                <TestReviewView
                  campId={camp.id}
                  dayNumber={selectedDay}
                  onClose={() => setTestResults(null)}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Task Details Modal */}
      <TaskDetailsModal
        isOpen={showReflectionModal && selectedTask !== null}
        onClose={() => {
          setShowReflectionModal(false);
          setSelectedTask(null);
          setReflectionText("");
          setReflectionJson(null);
          setProposedStep("");
          setShareInStudyHall(true); // Default: مشاركة في قاعة التدارس
        }}
        task={selectedTask}
        camp={camp}
        isReadOnly={isReadOnly}
        isCampNotStarted={isCampNotStarted}
        onComplete={async (data) => {
          if (!selectedTask) return;

          try {
            setIsCompleting(true);
            // Save reflection if provided
            if (data.reflectionText) {
              await updateTaskBenefits(
                selectedTask.id,
                data.reflectionText,
                "",
                !data.shareInStudyHall,
                reflectionJson,
                data.proposedStep,
              );
            }

            // Mark task as complete
            await markTaskComplete(selectedTask.id);

            // Refresh data
            await fetchUserProgress();
            await fetchJournalData();

            // Close modal
            setShowReflectionModal(false);
            setSelectedTask(null);
            setReflectionText("");
            setReflectionJson(null);
            setProposedStep("");
            setShareInStudyHall(true); // Default: مشاركة في قاعة التدارس

            toast.success("تم إكمال المهمة بنجاح! 🎉");
          } catch (error) {
            toast.error("حدث خطأ أثناء إكمال المهمة");
            console.error(error);
          } finally {
            setIsCompleting(false);
          }
        }}
        reflectionText={reflectionText}
        setReflectionText={setReflectionText}
        proposedStep={proposedStep}
        setProposedStep={setProposedStep}
        shareInStudyHall={shareInStudyHall}
        setShareInStudyHall={setShareInStudyHall}
        isSubmitting={isCompleting}
        EmbeddedVideoPlayer={EmbeddedVideoPlayer}
        TaskLinks={TaskLinks}
        TaskAttachments={TaskAttachments}
        RichTadabburEditor={RichTadabburEditor}
        reflectionJson={reflectionJson}
        setReflectionJson={setReflectionJson}
      />
    </div>
  );
};

export default CampJourneyInterface;
