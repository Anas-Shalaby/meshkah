import { useState, useEffect, memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell,
  Calendar,
  GraduationCap,
  BookOpen,
  ChevronLeft,
  Sparkles,
  Loader2,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotificationContext } from "../../context/NotificationContext";
import DailyHadithWidget from "../DailyHadithWidget";
import NotificationCenter from "../NotificationCenter";
import DashboardSocialColumn from "./DashboardSocialColumn";
import CampThumbnail from "./CampThumbnail";
import MyLearningPanel from "./MyLearningPanel";
import { useTheme } from "../../context/ThemeContext";
import { getDashboardTheme } from "./dashboardTheme";
import {
  PLATFORM_STATS,
  getArabicDate,
  getGreeting,
  getAvatarUrl,
} from "./dashboardConstants";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const DashboardWelcomeCard = memo(function DashboardWelcomeCard({
  t,
  isAuthenticated,
  user,
  avatarUrl,
  greeting,
  today,
  unreadCount,
  onOpenLearning,
  onOpenNotifications,
}) {
  return (
    <motion.div
      {...fadeIn}
      className={`${t.card} relative overflow-hidden p-5 sm:p-6`}
    >
      <div className={t.cardInnerGlow} />

      {isAuthenticated && (
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenLearning}
            className={t.iconBtn}
            aria-label="مخيماتي وختمات الكتب"
            title="تعلّمي"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onOpenNotifications}
            className={`${t.iconBtn} relative`}
            aria-label="الإشعارات"
            title="الإشعارات"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -left-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      <div className="relative z-[1] flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {isAuthenticated ? (
          <img
            src={avatarUrl}
            alt=""
            className={`h-20 w-20 shrink-0 rounded-2xl object-cover shadow-md ${t.avatarBorder}`}
          />
        ) : (
          <div
            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl shadow-md ${t.logoBox}`}
          >
            <img src="/logo.svg" alt="" className="h-12 w-12" />
          </div>
        )}

        <div className="min-w-0 flex-1 text-center sm:text-right">
          {isAuthenticated ? (
            <>
              <p className={`mb-1 text-sm font-semibold ${t.textAccent}`}>
                {greeting}، {user?.username}
              </p>
              <h1
                className={`mb-2 text-xl font-bold sm:text-2xl ${t.textHeading}`}
              >
                مرحباً بك في مشكاة
              </h1>
              <p className={`text-sm leading-relaxed ${t.textBody}`}>
                نتمنى لك يوماً مباركاً مليئاً بالعلم والعمل. تابع مخيماتك
                وختماتك من الأيقونات أعلاه.
              </p>
            </>
          ) : (
            <>
              <h1
                className={`mb-2 text-xl font-bold sm:text-2xl ${t.textHeading}`}
              >
                مرحباً بك في مشكاة
              </h1>
              <p className={`mb-3 text-sm leading-relaxed ${t.textBody}`}>
                منصة للمخيمات التعليمية وختمات الكتب وحديث اليوم — ابدأ رحلتك
                الآن.
              </p>
              <Link to="/login" className={t.primaryBtn}>
                <Sparkles className="h-4 w-4" />
                تسجيل الدخول
              </Link>
            </>
          )}
          <p
            className={`mt-3 flex items-center justify-center gap-2 text-xs sm:justify-start ${t.textMuted}`}
          >
            <Calendar className={`h-3.5 w-3.5 ${t.textAccent}`} />
            {today}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

const DashboardCampsSection = memo(function DashboardCampsSection({
  t,
  title,
  emptyText,
  showAllLink,
  enrolledOnly,
  camps,
  loadingCamps,
}) {
  return (
    <motion.div
      {...fadeIn}
      transition={{ delay: 0.1 }}
      className={`${t.card} p-4 sm:p-5`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2
          className={`flex items-center gap-2 text-base font-bold ${t.textHeading}`}
        >
          <GraduationCap className={`h-5 w-5 ${t.sectionIcon}`} />
          {title}
        </h2>
        {showAllLink && (
          <Link
            to="/quran-camps"
            className={`flex items-center gap-1 text-sm font-semibold ${t.link}`}
          >
            عرض الكل
            <ChevronLeft className="h-4 w-4" />
          </Link>
        )}
      </div>
      {loadingCamps ? (
        <div className="flex justify-center py-8">
          <Loader2 className={`h-8 w-8 animate-spin ${t.loader}`} />
        </div>
      ) : camps.length === 0 ? (
        <p className={`py-6 text-center ${t.emptyText}`}>{emptyText}</p>
      ) : (
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scrollbar-thin">
          {camps.map((camp) => (
            <CampThumbnail
              key={camp.id}
              camp={camp}
              enrolled={enrolledOnly || camp.is_enrolled}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
});

const DashboardStatsRow = memo(function DashboardStatsRow({ t }) {
  return (
    <motion.div
      {...fadeIn}
      transition={{ delay: 0.05 }}
      className={`${t.card} p-4 sm:p-5`}
    >
      <h2 className={`mb-3 text-base font-bold ${t.textAccent}`}>
        إحصائيات المنصة
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PLATFORM_STATS.map((s) => (
          <div key={s.label} className={t.statCard}>
            <p className={t.statValue}>{s.value}</p>
            <p className={t.statLabel}>{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
});

const DashboardJourneysPromo = memo(function DashboardJourneysPromo({ t }) {
  return (
    <motion.div
      {...fadeIn}
      transition={{ delay: 0.15 }}
      className={`${t.card} p-4 sm:p-5`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2
          className={`flex items-center gap-2 text-base font-bold ${t.textHeading}`}
        >
          <BookOpen className={`h-5 w-5 ${t.sectionIcon}`} />
          ختمات الكتب
        </h2>
        <Link
          to="/book-journeys"
          className={`flex items-center gap-1 text-sm font-semibold ${t.link}`}
        >
          استكشف
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </div>
      <p className={`text-sm leading-relaxed ${t.textBody}`}>
        ختْم الكتب خطوة بخطوة مع متابعة يومية ومراجعة ذكية. سجّل دخولك لبدء
        ختمتك الأولى.
      </p>
    </motion.div>
  );
});

const DashboardDailyHadithSection = memo(function DashboardDailyHadithSection({
  t,
}) {
  return (
    <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
      <DailyHadithWidget themeOverride={t} />
    </motion.div>
  );
});

const HomeDashboard = () => {
  const { isNight } = useTheme();
  const t = useMemo(() => getDashboardTheme(isNight), [isNight]);
  const connectedTheme = useMemo(
    () => ({
      ...t,
      card: "rounded-none border-0 bg-transparent shadow-none backdrop-blur-0",
      socialCard: "p-5",
      cardInnerGlow: "hidden",
    }),
    [t],
  );
  const { user, isAuthenticated } = useAuth();
  const { unreadCount } = useNotificationContext();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [learningPanelOpen, setLearningPanelOpen] = useState(false);
  const [camps, setCamps] = useState([]);
  const [loadingCamps, setLoadingCamps] = useState(true);

  const avatarUrl = getAvatarUrl(user);
  const today = getArabicDate();
  const greeting = getGreeting();

  useEffect(() => {
    const fetchCamps = async () => {
      setLoadingCamps(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/quran-camps`, {
          headers: token ? { "x-auth-token": token } : {},
        });
        const data = await res.json();
        let list = data.data || [];
        if (isAuthenticated) {
          list = list.filter((c) => c.is_enrolled);
        }
        setCamps(list.slice(0, 12));
      } catch {
        setCamps([]);
      } finally {
        setLoadingCamps(false);
      }
    };
    fetchCamps();
  }, [isAuthenticated]);

  const openLearning = () => setLearningPanelOpen(true);
  const openNotifications = () => setNotificationsOpen(true);

  return (
    <div className={`${t.page} font-cairo`} dir="rtl">
      <div className="mx-auto w-full max-w-[1560px] px-4 py-6 lg:px-8 lg:py-8">
        {isAuthenticated ? (
          <div
            className={`mx-auto w-full overflow-hidden rounded-[2rem] border shadow-2xl backdrop-blur-xl ${
              isNight
                ? "border-white/[0.1] bg-[#36363c]/90 shadow-black/20"
                : "border-purple-200/60 bg-white/55 shadow-purple-200/40"
            }`}
          >
            <div
              className={`grid grid-cols-1 gap-0 lg:grid-cols-12 ${
                isNight
                  ? "divide-y divide-white/[0.08] lg:divide-x-reverse lg:divide-x lg:divide-y-0"
                  : "divide-y divide-purple-200/60 lg:divide-x-reverse lg:divide-x lg:divide-y-0"
              }`}
            >
              <div
                className={`divide-y p-3 sm:p-4 lg:col-span-8 lg:p-5 xl:col-span-8 ${
                  isNight ? "divide-white/[0.08]" : "divide-purple-200/60"
                }`}
              >
                <DashboardWelcomeCard
                  t={connectedTheme}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  avatarUrl={avatarUrl}
                  greeting={greeting}
                  today={today}
                  unreadCount={unreadCount}
                  onOpenLearning={openLearning}
                  onOpenNotifications={openNotifications}
                />
                <DashboardCampsSection
                  t={connectedTheme}
                  title="مخيماتي"
                  emptyText="لم تنضم إلى مخيم بعد."
                  showAllLink
                  enrolledOnly
                  camps={camps}
                  loadingCamps={loadingCamps}
                />
                <DashboardDailyHadithSection t={connectedTheme} />
              </div>
              <div className="p-3 sm:p-4 lg:col-span-4 lg:p-5 xl:col-span-4">
                <DashboardSocialColumn
                  themeOverride={connectedTheme}
                  connected
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-5">
            <DashboardWelcomeCard
              t={t}
              isAuthenticated={false}
              user={null}
              avatarUrl={avatarUrl}
              greeting={greeting}
              today={today}
              unreadCount={0}
              onOpenLearning={openLearning}
              onOpenNotifications={openNotifications}
            />
            <DashboardStatsRow t={t} />
            <DashboardCampsSection
              t={t}
              title="المخيمات"
              emptyText="لا توجد مخيمات متاحة حالياً."
              showAllLink
              enrolledOnly={false}
              camps={camps}
              loadingCamps={loadingCamps}
            />
            <DashboardJourneysPromo t={t} />
            <DashboardDailyHadithSection />
          </div>
        )}
      </div>

      <NotificationCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
      <MyLearningPanel
        isOpen={learningPanelOpen}
        onClose={() => setLearningPanelOpen(false)}
      />
    </div>
  );
};

export default HomeDashboard;
