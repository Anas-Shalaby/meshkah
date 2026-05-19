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
  CheckCircle,
  Clock3,
  AlertCircle,
  Share2,
  Lock,
} from "lucide-react";

import SEO from "../components/SEO";
import { useAuth } from "../context/AuthContext";
import { useRamadanTheme } from "../context/RamadanThemeContext";
import RamadanCountdown from "../components/ramadan/RamadanCountdown";
import RamadanFloatingElements from "../components/ramadan/RamadanFloatingElements";
import { CampDetailsSkeleton } from "../components/CampDetailsSkeletons";
import CommitmentModal from "../components/CommitmentModal";

// Import extracted components
import CampPublicView from "../components/quran-camps/CampPublicView";
import CampJourneyInterface from "../components/quran-camps/CampJourneyInterface";
import IdentityChoiceModal from "../components/quran-camps/modals/IdentityChoiceModal";
import CampBreadcrumbs from "../components/quran-camps/CampBreadcrumbs";
import ShareModal from "../components/quran-camps/ShareModal";
import CohortSelector from "../components/quran-camps/CohortSelector";

// Import utility functions
import {
  getStatusText,
  getStatusColor,
  getStatusIcon,
  groupTasksByDay,
  truncateHTML,
  highlightSearchTermHTML,
  highlightSearchTerm,
  formatDate,
  getCurrentDay,
} from "../utils/campUtils.jsx";

// Arabic names for hadith books (matches backend campTypeRegistry slugs)
const HADITH_BOOK_NAMES_AR = {
  nawawi40: "الأربعين النووية",
  qudsi40: "الأحاديث القدسية",
  riyad_assalihin: "رياض الصالحين",
  bulugh_almaram: "بلوغ المرام",
  hisnulmuslim: "حصن المسلم",
  shamail_muhammadiyah: "الشمائل المحمدية",
  aladab_almufrad: "الأدب المفرد",
  riyadiah40: "الأربعون الرياضية",
  shahwaliullah40: "أربعين شاه ولي الله",
  malik: "موطأ مالك",
  darimi: "سنن الدارمي",
};

export const getHadithBookNameAr = (slug) =>
  HADITH_BOOK_NAMES_AR[slug] || slug || "كتاب الحديث";

const QuranCampDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { isRamadanThemeActive, loading: themeLoading } = useRamadanTheme();

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
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);
  const [pendingIdentityChoice, setPendingIdentityChoice] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [showTestimonials, setShowTestimonials] = useState(false);
  const [campDay, setCampDay] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [selectedCohortNumber, setSelectedCohortNumber] = useState(null);

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
          },
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
              parseInt(startDateParts[2]),
            );
            // حساب end_date: start_date + duration_days
            const calculatedEndDate = new Date(startDate);
            calculatedEndDate.setDate(
              calculatedEndDate.getDate() + campData.data.duration_days,
            );
            // تحويل إلى string YYYY-MM-DD
            endDateStr = `${calculatedEndDate.getFullYear()}-${String(
              calculatedEndDate.getMonth() + 1,
            ).padStart(2, "0")}-${String(calculatedEndDate.getDate()).padStart(
              2,
              "0",
            )}`;
          }

          if (endDateStr) {
            // مقارنة التواريخ كـ strings (YYYY-MM-DD) لتجنب مشاكل timezone
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(
              today.getMonth() + 1,
            ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

            // مقارنة strings: "2025-10-27" <= "2025-10-28" = true
            const finished = endDateStr <= todayStr;

            setIsCampOfficiallyFinished(finished);
          }
        }

        // جلب المهام واللوحة والمجموعات فقط للمستخدمين المسجلين
        if (token) {
          const [tasksResponse, groupsResponse] = await Promise.all([
            fetch(
              `${import.meta.env.VITE_API_URL}/quran-camps/${id}/daily-tasks`,
              { headers },
            ),
            fetch(
              `${import.meta.env.VITE_API_URL}/quran-camps/${id}/task-groups`,
              { headers },
            ),
          ]);

          const tasksData = await tasksResponse.json();
          const groupsData = await groupsResponse.json();

          // Debug: التحقق من بيانات الأصدقاء
          if (tasksData.data && tasksData.data.length > 0) {
            const taskWithFriends = tasksData.data.find(
              (t) =>
                t.completed_by_friends && t.completed_by_friends.length > 0,
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

    // المخيمات ذاتية السرعة (مثل الحديث) لا تحتاج اختيار فوج
    if (camp?.enable_cohorts !== false && !selectedCohortNumber) {
      toast.error("يرجى اختيار فوج للانضمام إليه");
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

    // التحقق من اختيار فوج (مخيمات قرآن فقط؛ مخيمات الحديث تبدأ تلقائيًا)
    if (camp?.enable_cohorts !== false && !selectedCohortNumber) {
      toast.error("يرجى اختيار فوج للانضمام إليه");
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
          // جسم بيانات التسجيل في المخيم
          body: JSON.stringify({
            hide_identity: choice === "anonymous",
            // اختيار الفوج للقرآن، أو 1 الافتراضي للحديث (الباك يضبط ذلك أيضًا)
            cohort_number:
              camp?.enable_cohorts === false ? 1 : selectedCohortNumber,
          }),
        },
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

  // استخدام getCurrentDay من campUtils
  useEffect(() => {
    if (camp) {
      const currentDay = getCurrentDay(camp);
      setCampDay(currentDay);
    }
  }, [camp]);

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
      <div
        className={`min-h-screen ${
          isRamadanThemeActive
            ? "ramadan-bg-gradient"
            : "bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50"
        } flex items-center justify-center px-4`}
      >
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
    <div
      className={`min-h-screen ${
        isRamadanThemeActive
          ? "ramadan-bg-gradient"
          : "bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50"
      }`}
    >
      <SEO
        title={`${camp.name} - المخيمات القرآنية`}
        description={camp.description}
        keywords={`مخيم قرآني, ${camp.surah_name}, حفظ القرآن, تفسير القرآن`}
        canonicalUrl={`${window.location.origin}/quran-camps/${id}`}
      />

      {isRamadanThemeActive && <RamadanFloatingElements />}

      {/* Cinematic Hero Section */}
      <div
        className={`camp-hero-section relative flex items-center justify-center overflow-hidden`}
      >
        {/* Cinematic Background */}
        {camp.banner_image ? (
          <div className="absolute inset-0">
            <img
              src={camp.banner_image}
              alt={camp.name}
              loading="lazy"
              className="w-full h-full object-cover camp-banner-image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-blue-900/40" />
          </div>
        ) : (
          <div
            className={`absolute inset-0 ${
              isRamadanThemeActive
                ? "ramadan-hero-section"
                : "bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
            }`}
          />
        )}

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-purple-500/20 rounded-full blur-lg animate-bounce"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
            {/* Mobile Layout */}
            <div className="block sm:hidden">
              <div className="flex items-center gap-2 justify-between mb-2">
                {/* Back Button - Mobile */}
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center text-white hover:text-[#7440E9] transition-all duration-300 group min-h-[44px]"
                >
                  <div className="p-2.5 bg-white/10 rounded-xl group-hover:bg-white/20 transition-all duration-300 shadow-lg">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  <span className="mr-2 font-almarai font-medium text-sm">
                    العودة
                  </span>
                </button>

                {/* Status Badge - Mobile */}
                {camp.is_enrolled ? (
                  <div className="flex items-center px-3 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-xl border border-green-400/30 shadow-lg min-h-[44px]">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse mr-2"></div>
                    <CheckCircle className="w-3.5 h-3.5 text-green-300 mr-1" />
                    <span className="text-green-100 font-almarai font-medium text-xs">
                      مسجل
                    </span>
                  </div>
                ) : (
                  <div
                    className={`flex items-center px-3 py-2 backdrop-blur-md rounded-xl border shadow-lg min-h-[44px] ${getStatusColor(
                      camp.status,
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
                    <span className="mr-1 font-almarai font-medium text-xs">
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
                <span className="mr-3 font-almarai font-semibold text-lg">
                  العودة
                </span>
              </button>

              {/* Status & Actions - Desktop */}
              <div className="flex items-center space-x-4">
                {camp.is_enrolled ? (
                  <div className="flex items-center gap-10 space-x-4">
                    {/* Status Badge - Desktop */}
                    <div className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-2xl border border-green-400/30 shadow-lg">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-3"></div>
                      <CheckCircle className="w-4 h-4 text-green-300 mr-2" />
                      <span className="text-green-100 font-almarai font-semibold">
                        مسجل في المخيم
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-10 space-x-4">
                    {/* Status Badge - Desktop */}
                    <div
                      className={`flex items-center px-4 py-2 backdrop-blur-md rounded-2xl border shadow-lg ${getStatusColor(
                        camp.status,
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
                      <span className="mr-2 font-almarai font-semibold">
                        {getStatusText(camp.status)}
                      </span>
                    </div>

                    {/* Quick Stats - Desktop */}
                    <div className="flex items-center gap-2 space-x-4 text-white/80">
                      <div className="text-center">
                        <div className="text-lg font-almarai font-bold text-white">
                          {camp.duration_days}
                        </div>
                        <div className="text-xs font-almarai">أيام</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-almarai font-bold text-white">
                          {camp.enrolled_count || 0}
                        </div>
                        <div className="text-xs font-almarai">مشترك</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center mt-12 sm:mt-16 md:mt-20">
          {/* Share Button in Hero */}
          <div className="absolute hidden top-0 left-4 sm:left-8">
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-300 group min-h-[44px]"
            >
              <Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="text-sm font-almarai font-semibold hidden sm:inline">
                مشاركة
              </span>
            </motion.button>
          </div>

          {/* Main Title */}
          <h1
            className="hero-title font-almarai leading-normal text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-6 sm:mb-8 bg-gradient-to-r from-white via-purple-100 to-blue-100 bg-clip-text text-transparent drop-shadow-2xl animate-fade-in"
            style={{ lineHeight: "1.5" }}
          >
            {camp.name}
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle font-almarai text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white/90 mb-8 sm:mb-10 md:mb-12 font-bold flex items-center justify-center">
            {camp.camp_type === "hadith"
              ? `كتاب ${getHadithBookNameAr(camp.content_source_slug)}`
              : `سورة ${camp.surah_name}`}
          </p>

          {/* Description */}
          <p className="hero-description font-almarai text-base sm:text-lg md:text-xl lg:text-2xl text-white/80 mb-10 sm:mb-12 md:mb-16 max-w-3xl mx-auto leading-relaxed">
            {camp.description}
          </p>

          {/* Stats Grid - Redesigned for Mobile */}
          <div className="stats-grid max-w-5xl mx-auto mb-10 sm:mb-12 md:mb-16">
            {/* Mobile: Horizontal Compact Cards */}
            <div className="grid grid-cols-2 gap-3 sm:hidden">
              {[
                {
                  icon: <Calendar className="w-5 h-5 text-purple-300" />,
                  label: formatDate(camp.start_date),
                  title: "يبدأ",
                },
                {
                  icon: <Clock className="w-5 h-5 text-blue-300" />,
                  label: camp.duration_days,
                  title: "أيام",
                },
                {
                  icon: <Users className="w-5 h-5 text-green-300" />,
                  label: camp.enrolled_count || 0,
                  title: "مشترك",
                },
                {
                  icon: <Trophy className="w-5 h-5 text-yellow-300" />,
                  label: dailyTasks.reduce(
                    (sum, task) => sum + (task.points || 0),
                    0,
                  ),
                  title: "نقطة",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.5 + i * 0.05,
                  }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 border border-white/15 shadow-lg flex items-center gap-3"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-almarai text-xl font-black text-white truncate">
                      {item.label}
                    </div>
                    <div className="font-almarai text-xs text-white/70 truncate">
                      {item.title}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Tablet & Desktop: Original Card Design */}
            <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                {
                  icon: (
                    <Calendar className="w-8 md:w-10 h-8 md:h-10 text-primary" />
                  ),
                  label: "يبدأ",
                  value: formatDate(camp.start_date),
                },
                {
                  icon: (
                    <Clock className="w-8 md:w-10 h-8 md:h-10 text-primary" />
                  ),
                  label: camp.duration_days,
                  value: "أيام",
                },
                {
                  icon: (
                    <Users className="w-8 md:w-10 h-8 md:h-10 text-primary" />
                  ),
                  label: camp.enrolled_count || 0,
                  value: "مشترك",
                },
                {
                  icon: (
                    <Trophy className="w-8 md:w-10 h-8 md:h-10 text-primary" />
                  ),
                  label: dailyTasks.reduce(
                    (sum, task) => sum + (task.points || 0),
                    0,
                  ),
                  value: "نقطة",
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
                  className="stats-card group bg-white/10 backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-white/15 shadow-ai-dark transition-ai flex flex-col items-center min-h-[160px] md:min-h-[175px] hover:border-primary/40 hover:shadow-ai-hover-dark"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="p-2.5 md:p-3 rounded-full mx-auto mb-3 md:mb-4 bg-primary/10 backdrop-blur-sm shadow-ai-dark"
                  >
                    {item.icon}
                  </motion.div>
                  <div className="font-almarai text-2xl md:text-3xl font-black text-white mb-1 text-center">
                    {item.label}
                  </div>
                  <div className="font-almarai text-lg md:text-xl text-white/80 text-center">
                    {item.value}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          {!camp.is_enrolled && (
            <div className="mb-6 sm:mb-8">
              <button
                onClick={handleEnrollClick}
                disabled={
                  enrolling ||
                  camp.status === "completed" ||
                  camp.enable_public_enrollment === false ||
                  (currentUser &&
                    camp?.enable_cohorts !== false &&
                    !selectedCohortNumber) ||
                  (camp?.max_participants &&
                    Number(camp.max_participants) > 0 &&
                    Number(camp.enrolled_count || 0) >=
                      Number(camp.max_participants))
                }
                className="font-almarai px-8 py-3 sm:px-12 sm:py-3.5 md:px-16 md:py-4 bg-white text-[#7440E9] text-lg sm:text-xl md:text-2xl font-bold rounded-2xl hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[52px]"
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
                ) : currentUser &&
                  camp?.enable_cohorts !== false &&
                  !selectedCohortNumber ? (
                  <span>يرجى اختيار فوج أولاً</span>
                ) : camp?.enable_cohorts === false ? (
                  <span>ابدأ المخيم الآن 🚀</span>
                ) : (
                  <span>انضم للرحلة الآن 🚀</span>
                )}
              </button>
              {!currentUser && (
                <p className="text-center text-white/80 mt-3 sm:mt-4 text-sm sm:text-base md:text-lg font-almarai">
                  ستحتاج لتسجيل الدخول أولاً للانضمام لهذا المخيم
                </p>
              )}
            </div>
          )}

          {/* Identity Choice Modal */}
          <IdentityChoiceModal
            isOpen={showIdentityModal}
            onClose={() => setShowIdentityModal(false)}
            onChoice={handleIdentityChoice}
          />

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
      <div className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 lg:px-8 bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5]">
        {camp && (
          <div className="max-w-7xl mx-auto mb-8">
            <CampBreadcrumbs
              camp={camp}
              selectedDay={null}
              selectedTask={null}
              taskGroups={taskGroups}
            />
          </div>
        )}

        {/* Cohort Selector - فوق محتوى المخيم
            يُخفى للمخيمات ذاتية السرعة (enable_cohorts=false، مثل مخيمات الحديث)
            لأنها تبدأ تلقائيًا فور الاشتراك بدون اختيار فوج. */}
        {!camp.is_enrolled && currentUser && camp.enable_cohorts !== false && (
          <div className="max-w-6xl mx-auto mb-8 sm:mb-10 md:mb-12">
            <CohortSelector
              campId={id}
              selectedCohortNumber={selectedCohortNumber}
              onSelectCohort={setSelectedCohortNumber}
              isEnrolled={camp.is_enrolled}
            />
          </div>
        )}

        {/* Self-paced banner لمخيمات الحديث (يبدأ تلقائيًا) */}
        {!camp.is_enrolled && currentUser && camp.enable_cohorts === false && (
          <div className="max-w-6xl mx-auto mb-6 sm:mb-8">
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 sm:p-5 text-right shadow-sm">
              <div className="text-emerald-800 font-bold text-base sm:text-lg mb-1">
                مخيم ذاتي السرعة
              </div>
              <div className="text-emerald-700 text-sm leading-relaxed">
                هذا المخيم يبدأ فور اشتراكك ولا يحتاج إلى اختيار فوج. تقدّم
                بالسرعة المناسبة لك يومًا بيوم.
              </div>
            </div>
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
