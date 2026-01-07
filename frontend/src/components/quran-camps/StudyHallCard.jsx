import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Calendar,
  Star,
  MoreVertical,
  Trash2,
  Edit,
  Target,
  ChevronDown,
  ChevronUp,
  Share2,
  Copy,
  Check,
  BookOpen,
  Brain,
  Video,
  FileText,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import InteractionButtons from "./InteractionButtons";

const StudyHallCard = ({
  item,
  index,
  isReadOnly,
  isCampNotStarted,
  campSettings,
  currentUser,
  getAvatarUrl,
  expandedReflections,
  setExpandedReflections,
  highlightSearchTermHTML,
  truncateHTML,
  studyHallSearch,
  onUpvote,
  onSave,
  onPledge,
  showUpvoteTooltip,
  showBookmarkTooltip,
  showPledgeTooltip,
  setShowUpvoteTooltip,
  setShowBookmarkTooltip,
  setShowPledgeTooltip,
  pledgingProgressId,
  pledgedSteps,
  onDelete,
  onEdit,
  studyHallData,
  setStudyHallData,
  onShareCamp,
  showShareCamp = false,
}) => {
  const reflectionId = item.progress_id || item.id;
  const fullText =
    item.reflectionText ||
    item.benefits ||
    item.content ||
    "فائدة تدبرية قيمة من المخيم...";
  const MAX_LENGTH = 50;
  const textWithoutHtml = fullText.replace(/<[^>]*>/g, "");
  const shouldTruncate = textWithoutHtml.length > MAX_LENGTH;
  const isExpanded = expandedReflections[reflectionId];
  const [copied, setCopied] = useState(false);

  // دالة الحصول على اسم المهمة
  const getTaskName = () => {
    if (item.task_title) return item.task_title;
    if (item.title) {
      // تنظيف title من "تدبر: " أو أي بادئة مشابهة
      return item.title.replace(/^تدبر\s*:\s*/i, "").trim();
    }
    return null;
  };

  // دالة الحصول على أيقونة نوع المهمة
  const getTaskTypeIcon = (taskType) => {
    switch (taskType?.toLowerCase()) {
      case "reading":
      case "قراءة":
        return BookOpen;
      case "memorization":
      case "حفظ":
        return Brain;
      case "video":
      case "فيديو":
        return Video;
      case "reflection":
      case "تدبر":
        return Sparkles;
      default:
        return FileText;
    }
  };

  // دالة الحصول على اسم نوع المهمة بالعربية
  const getTaskTypeName = (taskType) => {
    switch (taskType?.toLowerCase()) {
      case "reading":
        return "قراءة";
      case "memorization":
        return "حفظ";
      case "video":
        return "فيديو";
      case "reflection":
        return "تدبر";
      default:
        return taskType || "مهمة";
    }
  };

  // دالة حساب الوقت النسبي (منذ ساعتين، إلخ)
  const getRelativeTime = (dateString) => {
    if (!dateString) return "تاريخ غير متاح";

    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "الآن";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `منذ ${diffInMinutes} دقيقة`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `منذ ${diffInHours} ${diffInHours === 1 ? "ساعة" : "ساعة"}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `منذ ${diffInDays} ${diffInDays === 1 ? "يوم" : "أيام"}`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `منذ ${diffInWeeks} ${diffInWeeks === 1 ? "أسبوع" : "أسابيع"}`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `منذ ${diffInMonths} ${diffInMonths === 1 ? "شهر" : "أشهر"}`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `منذ ${diffInYears} ${diffInYears === 1 ? "سنة" : "سنوات"}`;
  };

  // دالة نسخ رابط المشاركة
  const handleShareReflection = async () => {
    if (!item.share_link) {
      toast.error("هذا التدبر غير متاح للمشاركة");
      return;
    }

    const shareUrl = `${window.location.origin}/shared-reflection/${item.share_link}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("تم نسخ رابط المشاركة! 🎉");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("فشل نسخ الرابط");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative font-almarai"
    >
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-5 md:p-6 flex flex-col w-full max-w-2xl mx-auto hover:shadow-xl transition-all duration-300 group">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#F7F6FB] to-[#F3EDFF] flex items-center justify-center border-2 border-[#7440E9]/30 flex-shrink-0">
              {item.avatar_url && !campSettings.hide_identity ? (
                <img
                  src={getAvatarUrl({ avatar_url: item.avatar_url })}
                  alt={item.userName}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = "/default-avatar.png";
                  }}
                />
              ) : (
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#7440E9]" />
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h4 className="font-bold text-gray-900 text-xs sm:text-lg truncate">
                  {item.is_own
                    ? "أنت"
                    : campSettings.hide_identity ||
                      (item.is_own && currentUser?.hide_identity)
                    ? "مساهم مجهول"
                    : item.userName || "مساهم مجهول"}
                </h4>
              </div>

              {/* Task Name and Type */}
              {getTaskName() && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded-md border border-gray-100 text-[10px] font-medium max-w-[150px] truncate">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-target w-2.5 h-2.5 text-[#7440E9]"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="6"></circle>
                      <circle cx="12" cy="12" r="2"></circle>
                    </svg>
                    <span className="truncate">{getTaskName()}</span>
                  </div>

                  {item.task_type && (
                    <span className="text-[10px] sm:text-xs text-gray-500 px-1.5 py-0.5 bg-gray-50 rounded-md border border-gray-200">
                      {getTaskTypeName(item.task_type)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Points, Share & Menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 bg-gradient-to-r from-[#F7F6FB] to-[#F3EDFF] text-[#7440E9] px-2 sm:px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold border border-[#7440E9]/20">
              <Star className="w-3.5 h-3.5 sm:w-4 fill-current" />
              <span>+{item.totalPoints || item.points || 3}</span>
            </div>

            {/* زر المشاركة */}
            {item.share_link && !item.is_private && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShareReflection}
                className="p-2 hover:bg-[#F7F6FB] rounded-full transition-colors relative group"
                aria-label="مشاركة"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Share2 className="w-5 h-5 text-[#7440E9]" />
                )}
                {/* Tooltip */}
                <span className="absolute left-1/2 -translate-x-1/2 -bottom-8 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {copied ? "تم النسخ!" : "مشاركة"}
                </span>
              </motion.button>
            )}

            {/* Menu for own reflections */}
            {item.is_own && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setStudyHallData((prevData) =>
                      prevData.map((i) =>
                        i.progress_id === item.progress_id
                          ? {
                              ...i,
                              showMenu:
                                i.showMenu === undefined ? true : !i.showMenu,
                            }
                          : { ...i, showMenu: false }
                      )
                    );
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="خيارات"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>

                <AnimatePresence>
                  {item.showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20 min-w-[150px]"
                    >
                      {/* زر التعديل */}
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                            setStudyHallData((prevData) =>
                              prevData.map((i) =>
                                i.progress_id === item.progress_id
                                  ? { ...i, showMenu: false }
                                  : i
                              )
                            );
                          }}
                          className="w-full text-right px-4 py-2 hover:bg-blue-50 text-blue-600 text-sm flex items-center gap-2 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          تعديل الملاحظة
                        </button>
                      )}

                      {/* زر الحذف */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.progress_id);
                          setStudyHallData((prevData) =>
                            prevData.map((i) =>
                              i.progress_id === item.progress_id
                                ? { ...i, showMenu: false }
                                : i
                            )
                          );
                        }}
                        className="w-full text-right px-4 py-2 hover:bg-red-50 text-red-600 text-sm flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        حذف الملاحظة
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4 flex-1">
          <div
            className="text-gray-800 text-base sm:text-lg leading-relaxed break-words prose prose-sm max-w-none select-text"
            dangerouslySetInnerHTML={{
              __html: highlightSearchTermHTML(
                isExpanded || !shouldTruncate
                  ? fullText
                  : truncateHTML(fullText, MAX_LENGTH),
                studyHallSearch
              ),
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
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Proposed Step */}
        {item.proposed_step && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-gradient-to-r from-[#F7F6FB] to-[#F3EDFF] border-r-4 border-[#7440E9] rounded-lg"
          >
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-[#7440E9] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm sm:text-base font-semibold text-[#7440E9] mb-2">
                  الخطوة العملية المقترحة:
                </h4>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  {item.proposed_step}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer - Interactions and Time */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
          {/* Left: Interaction Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <InteractionButtons
              item={item}
              isReadOnly={isReadOnly}
              isCampNotStarted={isCampNotStarted}
              onUpvote={onUpvote}
              onSave={onSave}
              onPledge={onPledge}
              showUpvoteTooltip={showUpvoteTooltip}
              showBookmarkTooltip={showBookmarkTooltip}
              showPledgeTooltip={showPledgeTooltip}
              setShowUpvoteTooltip={setShowUpvoteTooltip}
              setShowBookmarkTooltip={setShowBookmarkTooltip}
              setShowPledgeTooltip={setShowPledgeTooltip}
              pledgingProgressId={pledgingProgressId}
              pledgedSteps={pledgedSteps}
              onShareCamp={onShareCamp}
              showShareCamp={showShareCamp}
            />
          </div>

          {/* Right: Relative Time */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <Calendar className="w-3.5 h-3.5 sm:w-4" />
            <span className="whitespace-nowrap">
              {getRelativeTime(item.completed_at)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StudyHallCard;
