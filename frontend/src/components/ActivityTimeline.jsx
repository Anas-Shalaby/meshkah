import { motion } from "framer-motion";
import {
  CheckCircle,
  Lightbulb,
  Flame,
  HandHeart,
  BookHeart,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

// Variants للأنيميشن المتتابع
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

// دالة لتحديد الأيقونة واللون والنص حسب نوع النشاط
const getActivityConfig = (activityType, details, user) => {
  const username = user?.username || "مستخدم";

  switch (activityType) {
    case "task_completed":
      return {
        icon: CheckCircle,
        color: "text-green-500",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        iconBg: "bg-green-100",
        message: `قام **${username}** بإتمام مهمة: **${
          details?.task_name || "مهمة"
        }**`,
        dayInfo: details?.day ? ` (اليوم ${details.day})` : "",
      };

    case "reflection_shared":
      return {
        icon: Lightbulb,
        color: "text-purple-500",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        iconBg: "bg-purple-100",
        message: `شارك **${username}** تدبرًا جديدًا في: **${
          details?.task_name || "قاعة التدارس"
        }**`,
        dayInfo: "",
      };

    case "streak_achieved":
      return {
        icon: Flame,
        color: "text-orange-500",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        iconBg: "bg-orange-100",
        message: `وصل **${username}** إلى **${
          details?.streak_count || "؟"
        } أيام** متتالية! 🔥`,
        dayInfo: "",
      };

    case "joint_step_pledged":
      return {
        icon: HandHeart,
        color: "text-[#7440E9]",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
        iconBg: "bg-indigo-100",
        message: `التزم **${username}** بخطوة عملية جديدة: **${
          details?.proposed_step || "خطوة عملية"
        }**`,
        dayInfo: "",
        isPledgeable: true,
        progressId: details?.progress_id,
        inspirerUserId: details?.inspirer_user_id,
      };

    default:
      return {
        icon: CheckCircle,
        color: "text-gray-500",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        iconBg: "bg-gray-100",
        message: `قام **${username}** بنشاط جديد`,
        dayInfo: "",
      };
  }
};

// دالة تنسيق التاريخ
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "الآن";
  } else if (diffMins < 60) {
    return `منذ ${diffMins} دقيقة`;
  } else if (diffHours < 24) {
    return `منذ ${diffHours} ساعة`;
  } else if (diffDays < 7) {
    return `منذ ${diffDays} يوم`;
  } else {
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};

// دالة جلب صورة المستخدم
const getAvatarUrl = (user) => {
  if (!user) return null;
  if (user.profile_picture) {
    if (user.profile_picture.startsWith("http")) {
      return user.profile_picture;
    } else if (user.profile_picture.startsWith("/uploads/avatars")) {
      return `${import.meta.env.VITE_IMAGE_API}/api${user.profile_picture}`;
    }
  }
  return null;
};

// مكون البطاقة الفردية في الخط الزمني
const TimelineItem = ({ activity, currentUser, onPledgeSuccess, isLast }) => {
  const { user, activity_type, details, created_at, camp } = activity;
  const [isPledging, setIsPledging] = useState(false);
  const [hasPledged, setHasPledged] = useState(false);

  const config = getActivityConfig(activity_type, details, user);
  const IconComponent = config.icon;
  const avatarUrl = getAvatarUrl(user);

  // دالة الالتزام بخطوة مشتركة
  const handlePledgeToStep = async () => {
    if (!config.progressId) {
      toast.error("خطأ: معرف الخطوة غير متاح");
      return;
    }

    if (currentUser && currentUser.id === user?.id) {
      toast.error("لا يمكنك الالتزام بخطوتك الخاصة");
      return;
    }

    if (currentUser && currentUser.id === config.inspirerUserId) {
      toast.error("لا يمكنك الالتزام بخطوتك الخاصة");
      return;
    }

    setIsPledging(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/quran-camps/progress/${
          config.progressId
        }/pledge`,
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
        setHasPledged(true);
        toast.success("تم الالتزام بنجاح! 🎉", {
          duration: 3000,
          position: "top-center",
        });
        if (onPledgeSuccess) {
          onPledgeSuccess();
        }
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
      setIsPledging(false);
    }
  };

  // تحويل النص الذي يحتوي على **text** إلى JSX
  const renderMessage = (message) => {
    const parts = message.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <motion.li
      variants={itemVariants}
      className="relative flex items-start gap-2 sm:gap-3 md:gap-4 pb-4 sm:pb-6 md:pb-8 last:pb-0"
      dir="rtl"
    >
      {/* الخط الرأسي */}
      {!isLast && (
        <div className="absolute right-[14px] sm:right-[18px] md:right-[22px] lg:right-5 top-10 sm:top-12 md:top-14 bottom-0 w-[2px] sm:w-0.5 bg-gradient-to-b from-gray-400 via-gray-300 to-gray-100"></div>
      )}

      {/* العقدة (Node) */}
      <div className="relative z-10 flex-shrink-0">
        <motion.div
          className={`w-7 h-7 sm:w-9 sm:h-9 md:w-12 md:h-12 rounded-full ${config.iconBg} border-2 sm:border-4 border-white shadow-xl flex items-center justify-center ${config.color} ring-1 sm:ring-2 ring-gray-100`}
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6" />
        </motion.div>
      </div>

      {/* البطاقة */}
      <motion.div
        className={`flex-1 ${config.bgColor} ${config.borderColor} border-2 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 lg:p-5 shadow-md hover:shadow-xl transition-all duration-300`}
        whileHover={{ scale: 1.01, x: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* رأس البطاقة */}
        <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
          {/* الصورة الشخصية */}
          <div className="flex-shrink-0">
            <motion.div
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm md:text-base overflow-hidden shadow-md ring-1 sm:ring-2 ring-white"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {user.profile_picture ? (
                <img
                  src={getAvatarUrl(user)}
                  alt={user?.username || "مستخدم"}
                  className="w-full h-full object-cover"
                />
              ) : user?.username === "مشارك مجهول" ? (
                "?"
              ) : (
                user?.username?.charAt(0)?.toUpperCase() || "?"
              )}
            </motion.div>
          </div>

          {/* المحتوى */}
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm md:text-base text-gray-800 leading-relaxed mb-1.5 sm:mb-2 break-words">
              {renderMessage(config.message + config.dayInfo)}
            </div>

            {/* معلومات المخيم */}
            {camp && (
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-1 sm:mb-2 break-words">
                في مخيم {camp.name}
                {camp.surah_name && ` - سورة ${camp.surah_name}`}
              </p>
            )}

            {/* الوقت */}
            <p className="text-[10px] sm:text-xs text-gray-500">
              {formatDate(created_at)}
            </p>
          </div>
        </div>

        {/* الخطوة العملية المقترحة (لنشاط joint_step_pledged) */}
        {activity_type === "joint_step_pledged" && details?.proposed_step && (
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/50">
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-700 mb-1.5 sm:mb-2 font-medium">
              الخطوة العملية:
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-800 bg-white/60 rounded-lg p-1.5 sm:p-2 md:p-3 mb-2 sm:mb-3 break-words">
              {details.proposed_step}
            </p>

            {/* زر "وأنا معكما" */}
            {currentUser &&
              currentUser.id !== user?.id &&
              currentUser.id !== config.inspirerUserId &&
              !hasPledged && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePledgeToStep}
                  disabled={isPledging}
                  className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-[#7440E9] text-white rounded-lg hover:bg-[#5a2fc7] transition-colors text-[10px] sm:text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {isPledging ? (
                    <>
                      <div className="animate-spin rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 border-b-2 border-white"></div>
                      <span>جاري الالتزام...</span>
                    </>
                  ) : (
                    <>
                      <HandHeart className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>وأنا معكما</span>
                    </>
                  )}
                </motion.button>
              )}

            {/* رسالة تأكيد الالتزام */}
            {hasPledged && (
              <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/80 border border-purple-300 rounded-lg flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[#7440E9] flex-shrink-0" />
                <span className="text-[10px] sm:text-xs md:text-sm text-purple-700 font-medium">
                  تم الالتزام بنجاح! ✅
                </span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.li>
  );
};

// المكون الرئيسي للخط الزمني
const ActivityTimeline = ({ activities, currentUser, onPledgeSuccess }) => {
  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full py-2">
      {/* الخط الزمني */}
      <motion.ul
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative space-y-0"
        dir="rtl"
      >
        {activities.map((activity, index) => (
          <TimelineItem
            key={activity.id}
            activity={activity}
            currentUser={currentUser}
            onPledgeSuccess={onPledgeSuccess}
            isLast={index === activities.length - 1}
          />
        ))}
      </motion.ul>
    </div>
  );
};

export default ActivityTimeline;
