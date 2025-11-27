import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Calendar,
  Bookmark,
  ArrowUp,
  MoreVertical,
  Edit,
  Trash2,
  Target,
  ChevronDown,
  ChevronUp,
  Share2,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

const JournalCard = ({
  item,
  index,
  type, // 'my' or 'saved'
  isReadOnly,
  isCampNotStarted,
  getAvatarUrl,
  expandedItems,
  setExpandedItems,
  truncateHTML,
  showMenu,
  setShowMenu,
  onEdit,
  onDelete,
  onUpvote,
  onSave,
  itemId,
}) => {
  const fullText = item.journal_entry || item.content || "";
  const MAX_LENGTH = 50;
  const textWithoutHtml = fullText.replace(/<[^>]*>/g, "");
  const shouldTruncate = textWithoutHtml.length > MAX_LENGTH;
  const isExpanded = expandedItems[itemId];
  const [copied, setCopied] = useState(false);

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
      transition={{ delay: index * 0.05 }}
      className="relative bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          {type === "saved" && item.author_avatar && !item.hide_identity ? (
            <img
              src={getAvatarUrl({ avatar_url: item.author_avatar })}
              alt={item.author_name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#7440E9]/30 flex-shrink-0"
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#F7F6FB] to-[#F3EDFF] flex items-center justify-center border-2 border-[#7440E9]/30 flex-shrink-0">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#7440E9]" />
            </div>
          )}

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                {type === "my"
                  ? "أنت"
                  : item.hide_identity
                  ? "مساهم مجهول"
                  : item.author_name || "مساهم مجهول"}
              </h4>
              {type === "my" && (
                <span className="px-2 py-0.5 bg-[#7440E9]/10 text-[#7440E9] text-xs font-medium rounded-full border border-[#7440E9]/20 whitespace-nowrap">
                  مساهمتي
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {type === "my" && item.day_number && (
                <span className="text-xs text-gray-500">
                  يوم {item.day_number}
                </span>
              )}
              {type === "my" && item.task_title && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 truncate">
                    {item.task_title}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Menu Button */}
        {type === "my" && !isReadOnly && !isCampNotStarted && (
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => ({
                  ...prev,
                  [itemId]: !prev[itemId],
                }));
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="خيارات"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>

            <AnimatePresence>
              {showMenu[itemId] && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20 min-w-[150px]"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(item);
                      setShowMenu((prev) => ({ ...prev, [itemId]: false }));
                    }}
                    className="w-full text-right px-4 py-2 hover:bg-blue-50 text-blue-600 text-sm flex items-center justify-end gap-2 transition-colors"
                  >
                    <span>تعديل</span>
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.progress_id);
                      setShowMenu((prev) => ({ ...prev, [itemId]: false }));
                    }}
                    className="w-full text-right px-4 py-2 hover:bg-red-50 text-red-600 text-sm flex items-center justify-end gap-2 transition-colors"
                  >
                    <span>حذف</span>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Content */}
      {fullText && (
        <div className="mb-4">
          <div
            className="text-gray-800 text-base sm:text-lg leading-relaxed break-words prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html:
                isExpanded || !shouldTruncate
                  ? fullText
                  : truncateHTML(fullText, MAX_LENGTH),
            }}
          />
          {shouldTruncate && (
            <button
              onClick={() => {
                setExpandedItems((prev) => ({
                  ...prev,
                  [itemId]: !isExpanded,
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
      )}

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
              <h5 className="text-sm sm:text-base font-semibold text-[#7440E9] mb-2">
                الخطوة العملية المقترحة:
              </h5>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                {item.proposed_step}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          {item.completed_at && (
            <>
              <Calendar className="w-3.5 h-3.5 sm:w-4" />
              <span className="whitespace-nowrap">
                {new Date(item.completed_at).toLocaleDateString("ar-SA", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </>
          )}
        </div>

        {/* زر المشاركة */}
        {type === "my" && item.share_link && !item.is_private && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShareReflection}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all text-xs sm:text-sm font-medium shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>تم النسخ</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>مشاركة</span>
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default JournalCard;
