import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useBookmarks } from "../context/BookmarkContext";
import { useTheme } from "../context/ThemeContext";
import {
  Plus,
  Copy,
  Edit,
  Trash2,
  User,
  Calendar,
  BookOpen,
  Settings,
  Award,
  Tent,
  BookOpenCheck,
  MessageCircle,
  Zap,
  GraduationCap,
  ChevronLeft,
  Sparkles,
  Star,
  Flame,
  Lock,
  Trophy,
} from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Dialog } from "@headlessui/react";
import EditCardModal from "../components/EditCardModal";
import SEO from "../components/SEO";
import { getMyJourneys } from "../services/bookJourneysService";

/* ——— Animation presets ——— */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ——— Count-up number (animates when scrolled into view) ——— */
const CountUp = ({ value = 0, duration = 1.4, className, style }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf;
    const to = Number(value) || 0;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className} style={style}>
      {display}
    </span>
  );
};

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const { bookmarks } = useBookmarks();
  const { isNight } = useTheme();

  /* ——— Theme tokens ——— */
  const ACCENT = isNight ? "#9e98db" : "#7440E9";
  const GOLD = "#ffc107";
  const EMERALD = isNight ? "#34d399" : "#10b981";
  const T = isNight
    ? {
        page: "bg-[#1a1c22]",
        card: "bg-[#212328] border border-gray-800",
        soft: "bg-[#1a1c22] border border-gray-800",
        text: "text-[#e0e0e0]",
        sub: "text-[#a0a0a0]",
        faint: "text-[#6b7280]",
        divider: "border-gray-800",
        rowHover: "hover:border-[#9e98db]/50",
        inputBg: "#1a1c22",
        modalBg: "#212328",
      }
    : {
        page: "bg-[#f4f4f7]",
        card: "bg-white border border-gray-200",
        soft: "bg-[#f7f7fb] border border-gray-200",
        text: "text-gray-900",
        sub: "text-gray-500",
        faint: "text-gray-400",
        divider: "border-gray-200",
        rowHover: "hover:border-[#7440E9]/40",
        inputBg: "#f4f4f7",
        modalBg: "#ffffff",
      };

  /* ——— State (functional) ——— */
  const [cards, setCards] = useState([]);
  const [enrolledCamps, setEnrolledCamps] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.username || "");
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(
    user?.avatar_url || "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCardEditModal, setShowCardEditModal] = useState(false);
  const [cardToEdit, setCardToEdit] = useState(null);

  /* ——— Avatar URL resolver ——— */
  const getAvatarUrl = (u) => {
    if (!u) return "/default-avatar.png";
    if (u.avatar_url) {
      if (u.avatar_url.startsWith("http")) return u.avatar_url;
      if (u.avatar_url.startsWith("/uploads/avatars"))
        return `${import.meta.env.VITE_IMAGE_API}/api${u.avatar_url}`;
    }
    return "/default-avatar.png";
  };
  const avatarUrl = getAvatarUrl(user);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* ——— Fetch dawah cards ——— */
  const fetchUserCards = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/dawah-cards`,
        { headers: { "x-auth-token": token } },
      );
      setCards(response.data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchUserCards();
  }, [fetchUserCards]);

  /* ——— Fetch enrolled camps + book journeys (real stats) ——— */
  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      try {
        const [campsRes, journeysData] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/quran-camps`, {
            headers: token ? { "x-auth-token": token } : {},
          }).then((r) => r.json()),
          getMyJourneys().catch(() => ({ journeys: [] })),
        ]);
        setEnrolledCamps((campsRes.data || []).filter((c) => c.is_enrolled));
        setJourneys(journeysData.journeys || []);
      } catch {
        setEnrolledCamps([]);
        setJourneys([]);
      }
    };
    load();
  }, []);

  /* ——— Avatar preview ——— */
  useEffect(() => {
    if (editImage) {
      const reader = new FileReader();
      reader.onloadend = () => setEditImagePreview(reader.result);
      reader.readAsDataURL(editImage);
    } else {
      setEditImagePreview(avatarUrl);
    }
  }, [editImage, avatarUrl]);

  /* ——— Delete dawah card ——— */
  const openDeleteModal = (id) => setDeleteModal({ open: true, id });
  const closeDeleteModal = () => setDeleteModal({ open: false, id: null });
  const confirmDelete = () => {
    axios
      .delete(`${import.meta.env.VITE_API_URL}/cards/${deleteModal.id}`, {
        headers: { "x-auth-token": localStorage.getItem("token") },
      })
      .then(() => {
        toast.success("تم حذف البطاقة بنجاح");
        fetchUserCards();
      })
      .catch(() => toast.error("حدث خطأ في حذف البطاقة"));
    closeDeleteModal();
  };

  const copyToClipboard = (card) => {
    navigator.clipboard.writeText(
      `${window.location.origin}/shared-card/${card.share_link}`,
    );
    toast.success("تم نسخ الرابط!");
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("username", editName);
      if (editImage) formData.append("avatar", editImage);
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/auth/update-profile`,
        formData,
        {
          headers: {
            "x-auth-token": token,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      toast.success("تم تحديث الحساب بنجاح");
      setShowEditModal(false);
      setUser(response.data);
    } catch {
      toast.error("حدث خطأ أثناء تحديث الحساب");
    } finally {
      setIsSaving(false);
    }
  };

  /* ——— Derived stats (real data) ——— */
  const completedJourneys = journeys.filter(
    (j) => j.status === "completed",
  ).length;
  const hadithCount = bookmarks?.length || 0;
  const streak = user?.streak_days ?? user?.streak ?? 0;

  const stats = [
    {
      icon: Tent,
      value: enrolledCamps.length,
      label: "المخيمات المشتركة",
      color: ACCENT,
    },
    {
      icon: BookOpenCheck,
      value: completedJourneys,
      label: "ختمات الكتب",
      color: GOLD,
    },
    {
      icon: MessageCircle,
      value: hadithCount,
      label: "أحاديث محفوظة",
      color: ACCENT,
    },
    {
      icon: Zap,
      value: streak,
      label: "أيام الالتزام المتتالية",
      color: EMERALD,
    },
  ];

  /* ——— Achievement badges (derived) ——— */
  const hasNawawiKhatma = journeys.some(
    (j) =>
      j.status === "completed" &&
      ((j.book_slug || "").includes("nawawi") ||
        (j.book_name || "").includes("الأربعين")),
  );
  const badges = [
    {
      icon: Star,
      label: "المجتهد",
      unlocked: enrolledCamps.length >= 1,
      color: ACCENT,
    },
    {
      icon: Trophy,
      label: "خاتم الأربعين النووية",
      unlocked: hasNawawiKhatma,
      color: GOLD,
    },
    {
      icon: BookOpen,
      label: "القارئ النهم",
      unlocked: hadithCount >= 10,
      color: ACCENT,
    },
    {
      icon: Flame,
      label: "الملتزم",
      unlocked: streak >= 7,
      color: EMERALD,
    },
    {
      icon: GraduationCap,
      label: "جامع الكتب",
      unlocked: completedJourneys >= 3,
      color: GOLD,
    },
    {
      icon: Sparkles,
      label: "المشارك الفعّال",
      unlocked: enrolledCamps.length >= 3,
      color: ACCENT,
    },
  ];

  const recentCamps = enrolledCamps.slice(0, 3);
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
      })
    : null;

  /* ——— Not logged in ——— */
  if (!user) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${T.page} font-cairo`}
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${ACCENT}26` }}
          >
            <User className="h-8 w-8" style={{ color: ACCENT }} />
          </div>
          <p className={`text-lg font-medium ${T.sub}`}>
            يرجى تسجيل الدخول للوصول إلى الملف الشخصي
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${T.page} ${T.text} font-cairo`} dir="rtl">
      <SEO
        title={`الملف الشخصي - ${user?.username || "مستخدم"} - مشكاة الأحاديث`}
        description="لوحة إنجازاتك في مشكاة: المخيمات، ختمات الكتب، والأحاديث المحفوظة"
        keywords="ملف شخصي, إنجازات, مخيمات, ختمات, مشكاة"
        canonicalUrl={`${window.location.origin}/profile`}
        noindex={true}
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14"
      >
        {/* ═══════ A. Profile Header ═══════ */}
        <motion.section
          variants={fadeUp}
          className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 ${T.card}`}
        >
          {isNight && (
            <div
              className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full blur-3xl"
              style={{ backgroundColor: `${ACCENT}14` }}
            />
          )}
          <div className="relative flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Identity */}
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-right">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowAvatarModal(true)}
                className="relative shrink-0 rounded-full"
                style={{ outline: "none" }}
              >
                <img
                  src={avatarUrl}
                  alt={user?.username}
                  className="h-28 w-28 rounded-full object-cover sm:h-32 sm:w-32"
                  style={{
                    border: `3px solid ${ACCENT}`,
                    boxShadow: `0 0 0 4px ${ACCENT}1f, 0 0 28px ${ACCENT}55`,
                  }}
                />
              </motion.button>
              <div>
                <h1 className={`text-2xl font-extrabold sm:text-3xl ${T.text}`}>
                  {user?.username}
                </h1>
                {memberSince && (
                  <p
                    className={`mt-1.5 flex items-center justify-center gap-1.5 text-sm sm:justify-start ${T.sub}`}
                  >
                    <Calendar className="h-4 w-4" style={{ color: ACCENT }} />
                    عضو منذ {memberSince}
                  </p>
                )}
                {user?.email && (
                  <p className={`mt-1 text-xs ${T.faint}`}>{user.email}</p>
                )}
              </div>
            </div>

            {/* Edit Profile button */}
            <motion.button
              whileHover={{
                y: -2,
                boxShadow: "0 10px 30px rgba(116,64,233,0.45)",
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setEditName(user?.username || "");
                setEditImage(null);
                setEditImagePreview(avatarUrl);
                setShowEditModal(true);
              }}
              className="flex items-center gap-2 rounded-2xl px-6 py-3 font-bold text-white transition-shadow"
              style={{ backgroundColor: "#7440E9" }}
            >
              <Settings className="h-5 w-5" />
              تعديل الملف الشخصي
            </motion.button>
          </div>
        </motion.section>

        {/* ═══════ B. Achievement Stats ═══════ */}
        <motion.section
          variants={stagger}
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5"
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -5 }}
                className={`rounded-3xl p-6 ${T.card} transition-transform`}
              >
                <span
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${stat.color}1f` }}
                >
                  <Icon className="h-6 w-6" style={{ color: stat.color }} />
                </span>
                <CountUp
                  value={stat.value}
                  className="block text-4xl font-extrabold leading-none"
                  style={{ color: stat.color }}
                />
                <p className={`mt-2 text-sm font-medium ${T.sub}`}>
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </motion.section>

        {/* ═══════ C. My Journey ═══════ */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <motion.section
            variants={fadeUp}
            className={`rounded-3xl p-6 ${T.card}`}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2
                className={`flex items-center gap-2 text-lg font-bold ${T.text}`}
              >
                <Tent className="h-5 w-5" style={{ color: ACCENT }} />
                آخر النشاطات
              </h2>
              <Link
                to="/quran-camps"
                className="text-xs font-semibold transition hover:opacity-80"
                style={{ color: ACCENT }}
              >
                عرض الكل
              </Link>
            </div>

            {recentCamps.length === 0 ? (
              <div className={`rounded-2xl py-10 text-center ${T.soft}`}>
                <Tent
                  className="mx-auto mb-3 h-10 w-10"
                  style={{ color: ACCENT, opacity: 0.5 }}
                />
                <p className={`text-sm ${T.sub}`}>لم تنضم إلى أي مخيم بعد</p>
                <Link
                  to="/quran-camps"
                  className="mt-3 inline-block text-sm font-semibold transition hover:opacity-80"
                  style={{ color: ACCENT }}
                >
                  استكشف المخيمات
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCamps.map((camp) => (
                  <Link
                    key={camp.id}
                    to={`/quran-camps/${camp.share_link || camp.id}`}
                    className={`flex items-center gap-3 rounded-2xl p-3 transition-colors ${T.soft} ${T.rowHover}`}
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                      style={{ backgroundColor: `${ACCENT}1f` }}
                    >
                      {camp.banner_image ? (
                        <img
                          src={camp.banner_image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <GraduationCap
                          className="h-6 w-6"
                          style={{ color: ACCENT }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${T.text}`}>
                        {camp.name || camp.title}
                      </p>
                      <p className={`mt-0.5 text-xs ${T.sub}`}>
                        {(camp.camp_type || "quran") === "hadith"
                          ? "مخيم حديث"
                          : "مخيم قرآن"}
                        {camp.enrolled_count != null
                          ? ` · ${camp.enrolled_count} مشترك`
                          : ""}
                      </p>
                    </div>
                    <ChevronLeft
                      className="h-4 w-4 shrink-0"
                      style={{ color: ACCENT }}
                    />
                  </Link>
                ))}
              </div>
            )}
          </motion.section>

          {/* Badges / Awards */}
          <motion.section
            variants={fadeUp}
            className={`rounded-3xl p-6 ${T.card}`}
          >
            <h2
              className={`mb-5 flex items-center gap-2 text-lg font-bold ${T.text}`}
            >
              <Award className="h-5 w-5" style={{ color: GOLD }} />
              أوسمة الإنجاز
            </h2>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-3">
              {badges.map((badge, i) => {
                const Icon = badge.unlocked ? badge.icon : Lock;
                return (
                  <motion.div
                    key={i}
                    whileHover={badge.unlocked ? { y: -4, scale: 1.03 } : {}}
                    className="flex flex-col items-center gap-2 text-center"
                  >
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-full transition-all"
                      style={
                        badge.unlocked
                          ? {
                              backgroundColor: `${badge.color}1f`,
                              border: `1.5px solid ${badge.color}80`,
                              boxShadow: `0 0 18px ${badge.color}33`,
                            }
                          : {
                              backgroundColor: isNight ? "#1a1c22" : "#f1f1f5",
                              border: `1.5px solid ${isNight ? "#2a2d35" : "#e5e7eb"}`,
                            }
                      }
                    >
                      <Icon
                        className="h-7 w-7"
                        style={{
                          color: badge.unlocked
                            ? badge.color
                            : isNight
                              ? "#6b7280"
                              : "#9ca3af",
                        }}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-semibold leading-tight ${
                        badge.unlocked ? T.text : T.faint
                      }`}
                    >
                      {badge.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        </div>
      </motion.div>

      {/* ═══════ Edit Profile Modal ═══════ */}
      <Dialog
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        className="fixed inset-0 z-50 overflow-y-auto font-cairo"
      >
        <div
          className="flex min-h-screen items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          dir="rtl"
        >
          <Dialog.Panel
            as={motion.div}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 mx-auto w-full max-w-md rounded-3xl p-8 text-center"
            style={{
              backgroundColor: T.modalBg,
              border: `1px solid ${isNight ? "#2a2d35" : "transparent"}`,
            }}
          >
            <Dialog.Title className={`mb-6 text-2xl font-bold ${T.text}`}>
              تعديل الملف الشخصي
            </Dialog.Title>

            <div className="mb-6 flex flex-col items-center gap-5">
              <img
                src={editImagePreview}
                alt="avatar preview"
                className="h-28 w-28 rounded-full object-cover"
                style={{
                  border: `3px solid ${ACCENT}`,
                  boxShadow: `0 0 22px ${ACCENT}44`,
                }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditImage(e.target.files[0])}
                className={`block w-full text-sm ${T.sub} file:mr-4 file:rounded-xl file:border-0 file:bg-[#7440E9] file:px-5 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:opacity-90`}
              />
            </div>

            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="اسم المستخدم الجديد"
              className={`mb-6 w-full rounded-2xl px-5 py-3.5 text-lg outline-none ${T.text}`}
              style={{
                backgroundColor: T.inputBg,
                border: `1px solid ${isNight ? "#2a2d35" : "#e5e7eb"}`,
              }}
            />

            <div className="flex justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleSaveProfile}
                disabled={isSaving || !editName.trim()}
                className="rounded-xl px-7 py-3 font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: "#7440E9" }}
              >
                {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowEditModal(false)}
                className="rounded-xl px-7 py-3 font-bold"
                style={{
                  backgroundColor: isNight ? "#1a1c22" : "#e5e7eb",
                  color: isNight ? "#a0a0a0" : "#374151",
                  border: `1px solid ${isNight ? "#2a2d35" : "transparent"}`,
                }}
              >
                إلغاء
              </motion.button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* ═══════ Avatar Modal ═══════ */}
      <Dialog
        open={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <Dialog.Panel className="relative flex flex-col items-center justify-center bg-transparent">
            <button
              onClick={() => setShowAvatarModal(false)}
              className="absolute left-4 top-4 z-20 rounded-full bg-white/90 p-3 text-gray-700 shadow-lg hover:bg-white"
              title="إغلاق"
            >
              ×
            </button>
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={avatarUrl}
              alt="avatar-large"
              className="max-h-[80vh] max-w-[90vw] rounded-3xl object-contain"
              style={{ border: `3px solid ${ACCENT}` }}
            />
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* ═══════ Edit Card Modal ═══════ */}
      <EditCardModal
        isOpen={showCardEditModal}
        onClose={() => setShowCardEditModal(false)}
        card={cardToEdit}
        onCardUpdated={(updatedCard) => {
          setCards((prev) =>
            prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)),
          );
          setShowCardEditModal(false);
        }}
      />
    </div>
  );
};

export default ProfilePage;
