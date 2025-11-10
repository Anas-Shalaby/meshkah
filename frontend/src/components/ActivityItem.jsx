import { CheckCircle, Zap, BookOpen, Target, HandHeart } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";

const ActivityItem = ({ activity, currentUser, onPledgeSuccess }) => {
  const { user, activity_type, details, created_at, camp } = activity;
  const [isPledging, setIsPledging] = useState(false);
  const [hasPledged, setHasPledged] = useState(false);

  let icon = <CheckCircle className="w-5 h-5 text-gray-400" />;
  let message = "أكمل نشاطًا غير محدد.";
  let iconColor = "text-gray-400";

  switch (activity_type) {
    case "task_completed":
      icon = <CheckCircle className="w-5 h-5 text-green-500" />;
      iconColor = "text-green-500";
      message = `أتم مهمة: "${details?.task_name || "مهمة"}"`;
      if (details?.day) {
        message += ` (اليوم ${details.day})`;
      }
      break;
    case "reflection_shared":
      icon = <BookOpen className="w-5 h-5 text-purple-500" />;
      iconColor = "text-purple-500";
      message = "شارك فائدة جديدة في قاعة التدارس";
      if (details?.task_name) {
        message += ` عن "${details.task_name}"`;
      }
      break;
    case "streak_achieved":
      icon = <Zap className="w-5 h-5 text-orange-500" />;
      iconColor = "text-orange-500";
      message = `وصل لسلسلة التزام ${details?.streak_count || "؟"} أيام! 🔥`;
      break;
    case "joint_step_pledged":
      icon = <Target className="w-5 h-5 text-[#7440E9]" />;
      iconColor = "text-[#7440E9]";
      const inspirerName = details?.inspirer_username || "مستخدم";
      const stepText = details?.proposed_step || "خطوة عملية";
      message = `التزم مع ${inspirerName} بـ: "${stepText}"`;
      break;
  }

  // دالة الالتزام بخطوة مشتركة (لنشاط joint_step_pledged)
  const handlePledgeToStep = async () => {
    if (!details?.progress_id) {
      toast.error("خطأ: معرف الخطوة غير متاح");
      return;
    }

    // التحقق من أن المستخدم ليس الملتزم الأصلي
    if (currentUser && currentUser.id === user?.id) {
      toast.error("لا يمكنك الالتزام بخطوتك الخاصة");
      return;
    }

    // التحقق من أن المستخدم ليس صاحب الخطوة الأصلي
    if (currentUser && currentUser.id === details?.inspirer_user_id) {
      toast.error("لا يمكنك الالتزام بخطوتك الخاصة");
      return;
    }

    setIsPledging(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/quran-camps/progress/${
          details.progress_id
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
        // إشعار الـ parent component لتحديث البيانات
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

  // تنسيق التاريخ
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

  const getAvatarUrl = (user) => {
    if (!user) return "/default-avatar.png";
    if (user) {
      if (user.startsWith("http")) {
        return user;
      } else if (user.startsWith("/uploads/avatars")) {
        return `${import.meta.env.VITE_IMAGE_API}/api${user}`;
      }
    }
    return "/default-avatar.png";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
      dir="rtl"
    >
      {/* الصورة الشخصية */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full  bg-purple-600  flex items-center justify-center text-white font-bold text-sm sm:text-base overflow-hidden">
          {user?.profile_picture ? (
            <img
              src={getAvatarUrl(user.profile_picture)}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            user?.username?.charAt(0)?.toUpperCase() || "?"
          )}
        </div>
      </div>

      {/* المحتوى */}
      <div className="flex-1 min-w-0 text-right">
        <div className="flex items-start gap-2 mb-1" dir="rtl">
          <div className={`flex-shrink-0 ${iconColor}`}>{icon}</div>
          <div className="flex-1">
            <p className="text-sm sm:text-base text-gray-800 leading-relaxed">
              <span className="font-semibold text-[#7440E9]">
                {user?.username || "مستخدم"}
              </span>{" "}
              {message}
            </p>
            {camp && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                في مخيم {camp.name}
                {camp.surah_name && ` - سورة ${camp.surah_name}`}
              </p>
            )}
            {/* عرض الخطوة العملية المقترحة لنشاط joint_step_pledged */}
            {activity_type === "joint_step_pledged" &&
              details?.proposed_step && (
                <div className="mt-2 p-2 sm:p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-r-4 border-[#7440E9] rounded-lg shadow-sm">
                  <p className="text-xs sm:text-sm text-[#7440E9] font-medium mb-1">
                    الخطوة العملية:
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700">
                    {details.proposed_step}
                  </p>
                  {/* زر "وأنا معكما" - يظهر فقط إذا كان المستخدم الحالي ليس الملتزم الأصلي وليس صاحب الخطوة ولم يلتزم من قبل */}
                  {currentUser &&
                    currentUser.id !== user?.id &&
                    currentUser.id !== details?.inspirer_user_id &&
                    !hasPledged && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePledgeToStep}
                        disabled={isPledging}
                        className="mt-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#7440E9] text-white rounded-lg hover:bg-[#5a2fc7] transition-colors text-xs sm:text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                      >
                        {isPledging ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            جاري الالتزام...
                          </>
                        ) : (
                          <>
                            <HandHeart className="w-3 h-3 sm:w-4 sm:h-4" />
                            وأنا معكما
                          </>
                        )}
                      </motion.button>
                    )}
                  {/* رسالة تأكيد الالتزام */}
                  {hasPledged && (
                    <div className="mt-2 px-2 sm:px-3 py-1.5 bg-purple-100 border border-purple-300 rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[#7440E9]" />
                      <span className="text-xs sm:text-sm text-purple-700 font-medium">
                        تم الالتزام بنجاح! ✅
                      </span>
                    </div>
                  )}
                </div>
              )}
            <p className="text-xs text-gray-400 mt-1">
              {formatDate(created_at)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityItem;
