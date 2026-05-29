import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Users,
  Clock,
  BookOpen,
  Zap,
  Clock3,
  Play,
  CheckCircle,
  UserCheck,
  Sparkles,
  Shield,
  Eye,
} from "lucide-react";

import { formatDate } from "../utils/campUtils";
import { useTheme } from "../context/ThemeContext";

const formatCountdown = (dateString) => {
  try {
    const start = new Date(dateString);
    const now = new Date();
    const diffMs = start.getTime() - now.getTime();
    if (diffMs <= 0) return "اليوم";
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} يوم`;
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    if (hours > 0) return `${hours} ساعة`;
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    return `${minutes} دقيقة`;
  } catch {
    return "قريباً";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "early_registration":
      return "قريباً";
    case "active":
      return "نشط";
    case "completed":
      return "منتهي";
    case "reopened":
      return "مفتوح للاشتراك";
    default:
      return "غير محدد";
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "active":
      return "bg-[#9e98db]/15 text-[#9e98db] border border-[#9e98db]/40";
    case "early_registration":
      return "bg-blue-900/30 text-blue-300 border border-blue-900/50";
    case "completed":
      return "bg-gray-700/40 text-gray-300 border border-gray-600/50";
    case "reopened":
      return "bg-indigo-900/30 text-indigo-300 border border-indigo-900/50";
    default:
      return "bg-gray-700/40 text-gray-300 border border-gray-600/50";
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "active":
      return <Zap className="w-3 h-3" />;
    case "early_registration":
      return <Clock3 className="w-3 h-3" />;
    case "completed":
      return <CheckCircle className="w-3 h-3" />;
    case "reopened":
      return <Play className="w-3 h-3" />;
    default:
      return <Clock3 className="w-3 h-3" />;
  }
};
const CampPublicCard = ({ camp, index, searchQuery = "" }) => {
  const { isNight } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef(null);

  // ——— Flat theme tokens (dark reference / flat light counterpart) ———
  const ACCENT = isNight ? "#9e98db" : "#7440E9";
  const c = isNight
    ? {
        cardBg: "#212328",
        innerBg: "#1a1c22",
        borderClass: "border border-[#2a2d35] hover:border-[#9e98db]/50",
        text: "#e0e0e0",
        sub: "#a0a0a0",
        closedBtn:
          "bg-[#1a1c22] text-[#a0a0a0] border border-[#2a2d35] cursor-not-allowed",
      }
    : {
        cardBg: "#ffffff",
        innerBg: "#f4f4f7",
        borderClass: "border border-gray-200 hover:border-[#7440E9]/40",
        text: "#24242c",
        sub: "#6b7280",
        closedBtn:
          "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed",
      };

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Highlight search query in text
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          className="bg-[#ffc107] text-[#1a1c22] rounded px-1 font-semibold"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };
  return (
    <motion.div
      ref={cardRef}
      key={camp.id}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{
        duration: 0.5,
        delay: (index || 0) * 0.08,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{
        y: -6,
        transition: { duration: 0.3, ease: "easeOut" },
      }}
      whileTap={{ scale: 0.99 }}
      className={`relative group camp-card font-almarai flex min-h-[480px] cursor-pointer flex-col overflow-hidden rounded-3xl p-0 text-center transition-colors duration-300 ${c.borderClass}`}
      style={{ minHeight: 480, backgroundColor: c.cardBg }}
    >
      {/* صورة الغلاف / Placeholder */}
      <div
        className="relative mb-6 h-40 w-full overflow-hidden rounded-t-3xl"
        style={{ borderBottom: `1px solid ${isNight ? "#2a2d35" : "#e5e7eb"}` }}
      >
        {camp.banner_image && isInView ? (
          <>
            {!imageLoaded && (
              <div
                className="absolute inset-0 animate-pulse"
                style={{ backgroundColor: c.innerBg }}
              />
            )}
            <img
              src={camp.banner_image}
              alt={camp.name}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
              loading="lazy"
            />
          </>
        ) : camp.banner_image && !isInView ? (
          <div
            className="absolute inset-0 animate-pulse"
            style={{ backgroundColor: c.innerBg }}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: c.innerBg }}
          >
            <BookOpen
              className="h-12 w-12"
              style={{ color: ACCENT, opacity: 0.5 }}
            />
          </div>
        )}

        {/* شارة الحالة */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
              camp.status,
            )}`}
          >
            {getStatusIcon(camp.status)}
            {getStatusText(camp.status)}
            {camp.status === "early_registration" &&
              ` ( ${formatCountdown(camp.start_date)} )`}
          </span>

          {/* شارة المسجل */}
          {camp.is_enrolled && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-900/30 text-green-400 border border-green-900/50">
              <UserCheck className="w-3 h-3" />
              مسجل
            </span>
          )}

          {/* شارة يبدأ تلقائياً */}
          {camp.auto_start_camp && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#9e98db]/15 text-[#9e98db] border border-[#9e98db]/40">
              <Sparkles className="w-3 h-3" />
              يبدأ تلقائياً
            </span>
          )}

          {/* شارة التسجيل مغلق */}
          {camp.enable_public_enrollment === false && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-700/40 text-gray-300 border border-gray-600/50">
              <Shield className="w-3 h-3" />
              التسجيل مغلق
            </span>
          )}

          {/* شارة ممتلئ */}
          {camp.max_participants &&
            camp.enrolled_count >= camp.max_participants && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-900/30 text-red-400 border border-red-900/50">
                <Shield className="w-3 h-3" />
                ممتلئ
              </span>
            )}
        </div>
      </div>

      {/* العنوان */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3
          className="mb-3 flex items-center justify-center gap-2 px-4 text-2xl font-extrabold tracking-tight sm:text-3xl"
          style={{ color: c.text }}
        >
          <BookOpen className="h-5 w-5 shrink-0" style={{ color: ACCENT }} />
          {highlightText(camp.name, searchQuery)}
        </h3>
      </motion.div>

      {/* الوصف */}
      {camp.description && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p
            className="mb-4 px-4 text-base leading-relaxed line-clamp-3"
            style={{ color: c.sub }}
          >
            {highlightText(camp.description, searchQuery)}
          </p>
        </motion.div>
      )}

      {/* العلامات التوضيحية */}
      {camp.tags && camp.tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mb-5 mt-4 flex flex-wrap justify-center gap-2 px-4"
        >
          {camp.tags.map((tag, index) => (
            <motion.span
              key={index}
              whileHover={{ y: -2 }}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors"
              style={{
                backgroundColor: c.innerBg,
                color: ACCENT,
                borderColor: isNight ? "#2a2d35" : "#e5e7eb",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: ACCENT }}
              />
              {tag}
            </motion.span>
          ))}
        </motion.div>
      )}

      {/* صف إحصائيات */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-4 mb-4 mt-2 rounded-2xl px-2 py-3"
        style={{ backgroundColor: c.innerBg }}
      >
        <div className="flex items-stretch justify-around">
          <div className="flex flex-1 flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <Users className="h-5 w-5" style={{ color: ACCENT }} />
              <span className="text-base font-bold" style={{ color: c.text }}>
                {camp.enrolled_count ?? 0}
                {camp.max_participants ? ` / ${camp.max_participants}` : ""}
              </span>
            </div>
            <span className="text-[10px]" style={{ color: c.sub }}>
              {camp.max_participants ? "مشترك / الحد الأقصى" : "مشترك"}
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-5 w-5" style={{ color: ACCENT }} />
              <span className="text-base font-bold" style={{ color: c.text }}>
                {camp.duration_days ?? 0}
              </span>
            </div>
            <span className="text-[10px]" style={{ color: c.sub }}>
              أيام
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-5 w-5" style={{ color: ACCENT }} />
              <span className="text-base font-bold" style={{ color: c.text }}>
                {formatDate(camp.start_date)}
              </span>
            </div>
            <span className="text-[10px]" style={{ color: c.sub }}>
              تاريخ البدء
            </span>
          </div>
        </div>
      </motion.div>

      {/* نوع المخيم (لإيضاح quran/hadith) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="px-4"
      >
        <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold"
            style={
              (camp.camp_type || "quran") === "hadith"
                ? {
                    backgroundColor: `${"#ffc107"}1a`,
                    color: "#ffc107",
                    borderColor: `${"#ffc107"}40`,
                  }
                : {
                    backgroundColor: `${ACCENT}1a`,
                    color: ACCENT,
                    borderColor: `${ACCENT}40`,
                  }
            }
          >
            {(camp.camp_type || "quran") === "hadith"
              ? "مخيم حديث"
              : "مخيم قرآن"}
          </span>
          {(camp.camp_type || "quran") === "hadith" && (
            <span className="inline-flex items-center rounded-full border border-emerald-900/50 bg-emerald-900/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
              يبدأ تلقائيًا عند الاشتراك
            </span>
          )}
        </div>
      </motion.div>

      {/* سورة (للمخيم القرآني فقط) */}
      {camp.surah_name && (camp.camp_type || "quran") !== "hadith" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div
            className="mb-2 flex items-center justify-center gap-2 font-bold"
            style={{ color: ACCENT }}
          >
            <BookOpen className="w-4 h-4" /> سورة{" "}
            {highlightText(camp.surah_name, searchQuery)}
          </div>
        </motion.div>
      )}

      {/* كتاب الحديث (للمخيم الحديثي) */}
      {(camp.camp_type || "quran") === "hadith" && camp.content_source_slug && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div
            className="mb-2 flex items-center justify-center gap-2 px-4 font-bold"
            style={{ color: "#ffc107" }}
          >
            <BookOpen className="w-4 h-4" /> الكتاب:{" "}
            {{
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
            }[camp.content_source_slug] || camp.content_source_slug}
          </div>
        </motion.div>
      )}

      {/* زر التفاصيل */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-auto w-full px-4 pb-4 pt-4"
      >
        <Link
          to={`/quran-camps/${camp.share_link}`}
          className={`group/btn relative block w-full overflow-hidden rounded-xl px-6 py-3 text-center font-bold transition-colors duration-300 ${
            camp.is_enrolled
              ? "bg-green-600 text-white hover:bg-green-500"
              : camp.enable_public_enrollment === 0
                ? c.closedBtn
                : camp.max_participants &&
                    camp.enrolled_count >= camp.max_participants
                  ? c.closedBtn
                  : "bg-[#7440E9] text-white hover:bg-[#8B5CF6]"
          }`}
        >
          <span className="relative z-10">
            {camp.is_enrolled
              ? "متابعة التعلم"
              : camp.enable_public_enrollment === false
                ? "التسجيل مغلق"
                : camp.max_participants &&
                    camp.enrolled_count >= camp.max_participants
                  ? "المخيم ممتلئ"
                  : camp.status === "active"
                    ? "ابدأ التعلم الآن"
                    : camp.status === "early_registration"
                      ? "سجل الآن"
                      : camp.status === "reopened"
                        ? "انضم الآن"
                        : "عرض التفاصيل"}
          </span>
          {!(
            camp.enable_public_enrollment === 0 ||
            (camp.max_participants &&
              camp.enrolled_count >= camp.max_participants)
          ) && (
            <motion.div
              className="absolute inset-0 bg-white/15"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          )}
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default CampPublicCard;
