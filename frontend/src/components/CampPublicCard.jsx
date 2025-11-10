import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
} from "lucide-react";

const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

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
      return "bg-purple-600/80 text-white";
    case "early_registration":
      return "bg-blue-500/80 text-white";
    case "completed":
      return "bg-gray-500/70 text-white";
    case "reopened":
      return "bg-indigo-500/80 text-white";
    default:
      return "bg-gray-500/70 text-white";
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
  // Highlight search query in text
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          className="bg-yellow-200 text-yellow-900 rounded px-1 font-semibold"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };
  return (
    <motion.div
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
        scale: 1.05,
        y: -12,
        transition: { duration: 0.3, ease: "easeOut" },
      }}
      whileTap={{ scale: 0.98 }}
      className="relative group min-h-[480px] overflow-hidden rounded-3xl border-2 border-[#e3d8fa] p-0 flex flex-col items-center text-center transition-all duration-300 cursor-pointer bg-white/90 backdrop-blur-xl camp-card"
      style={{
        minHeight: 480,
        fontFamily: "Amiri, Cairo, serif",
        background:
          "linear-gradient(135deg, #f7f6fb 0%, #f3edff 60%, #e9e4f5 100%)",
        boxShadow:
          "0 2px 16px 0 rgba(116,64,233,0.08) inset, 0 15px 30px -10px rgba(116,64,233,0.2)",
      }}
    >
      {/* زخرفة إسلامية أعلى البطاقة */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-full flex justify-center pointer-events-none select-none">
        <svg
          width="120"
          height="32"
          viewBox="0 0 120 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 32 Q60 0 120 32"
            stroke="#7440E9"
            strokeWidth="2"
            fill="none"
            opacity="0.13"
          />
          <circle cx="60" cy="16" r="6" fill="#e3d8fa" opacity="0.18" />
        </svg>
      </div>

      {/* خلفية مزخرفة */}
      <div
        className="h-40 w-full relative rounded-t-3xl mb-6 overflow-hidden"
        style={{
          borderBottom: "1px solid #e3d8fa",
        }}
      >
        {camp.banner_image ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
            style={{
              backgroundImage: `url(${camp.banner_image})`,
            }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0) 0%, #f3edff 80%), url('/assets/arabic-pattern-classic.svg')`,
              backgroundSize: "cover, 120px",
              backgroundPosition: "center, top right",
              backgroundRepeat: "no-repeat, repeat",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/10 to-[#f3edff]/60 rounded-t-3xl" />

        {/* شارة الحالة */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-md border border-white/20 ${getStatusColor(
              camp.status
            )}`}
          >
            {getStatusIcon(camp.status)}
            {getStatusText(camp.status)}
            {camp.status === "early_registration" &&
              ` ( ${formatCountdown(camp.start_date)} )`}
          </span>

          {/* شارة المسجل */}
          {camp.is_enrolled && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-md border border-white/20 bg-green-500/80 text-white">
              <UserCheck className="w-3 h-3" />
              مسجل
            </span>
          )}

          {/* شارة يبدأ تلقائياً */}
          {camp.auto_start_camp && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-md border border-white/20 bg-indigo-500/80 text-white">
              <Sparkles className="w-3 h-3" />
              يبدأ تلقائياً
            </span>
          )}

          {/* شارة التسجيل مغلق */}
          {camp.enable_public_enrollment === false && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-md border border-white/20 bg-gray-500/80 text-white">
              <Shield className="w-3 h-3" />
              التسجيل مغلق
            </span>
          )}

          {/* شارة ممتلئ */}
          {camp.max_participants &&
            camp.enrolled_count >= camp.max_participants && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-md border border-white/20 bg-red-500/80 text-white">
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
        <h3 className="text-2xl sm:text-3xl font-extrabold text-[#7440E9] mb-3 flex items-center gap-2 tracking-tight drop-shadow-sm px-4">
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
            <circle
              cx="10"
              cy="10"
              r="8"
              stroke="#7440E9"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          </svg>
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
            className="text-gray-700 text-base mb-4 line-clamp-3 px-4 leading-relaxed"
            style={{ fontFamily: "Cairo, Amiri, serif" }}
          >
            {highlightText(camp.description, searchQuery)}
          </p>
        </motion.div>
      )}

      {/* صف إحصائيات */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-end justify-center gap-6 mb-4 mt-2"
      >
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-base text-gray-700">
              {camp.enrolled_count ?? 0}
              {camp.max_participants ? ` / ${camp.max_participants}` : ""}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5">
            {camp.max_participants ? "مشترك / الحد الأقصى" : "مشترك"}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-base text-gray-700">
              {camp.duration_days ?? 0}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5">أيام</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <Calendar className="w-5 h-5 text-green-400" />
            <span className="font-bold text-base text-gray-700">
              {formatDate(camp.start_date)}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5">تاريخ البدء</span>
        </div>
      </motion.div>

      {/* سورة */}
      {camp.surah_name && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="text-[#7440E9] font-bold mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> سورة{" "}
            {highlightText(camp.surah_name, searchQuery)}
          </div>
        </motion.div>
      )}

      {/* زر التفاصيل */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-auto pt-4 px-4 pb-4 w-full"
      >
        <Link
          to={`/quran-camps/${camp.share_link}`}
          className={`block w-full px-6 py-3 rounded-xl font-bold text-center shadow-lg transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden group/btn ${
            camp.is_enrolled
              ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
              : camp.enable_public_enrollment === 0
              ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white cursor-not-allowed opacity-70"
              : camp.max_participants &&
                camp.enrolled_count >= camp.max_participants
              ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white cursor-not-allowed opacity-70"
              : "bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white hover:from-[#6D28D9] hover:to-[#7C3AED]"
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
              className="absolute inset-0 bg-white/20"
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
