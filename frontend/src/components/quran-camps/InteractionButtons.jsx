import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Bookmark, HandHeart, Share2 } from "lucide-react";

const InteractionButtons = ({
  item,
  isReadOnly,
  isCampNotStarted,
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
  onShareCamp,
  showShareCamp = false,
}) => {
  const handleUpvote = (e) => {
    e.stopPropagation();
    if (!isReadOnly && onUpvote) {
      onUpvote(item.progress_id);
      setShowUpvoteTooltip((prev) => ({
        ...prev,
        [item.progress_id]: true,
      }));
      setTimeout(() => {
        setShowUpvoteTooltip((prev) => ({
          ...prev,
          [item.progress_id]: false,
        }));
      }, 2000);
    }
  };

  const handleSave = (e) => {
    e.stopPropagation();
    if (!isReadOnly && onSave) {
      onSave(item.progress_id);
      setShowBookmarkTooltip((prev) => ({
        ...prev,
        [item.progress_id]: true,
      }));
      setTimeout(() => {
        setShowBookmarkTooltip((prev) => ({
          ...prev,
          [item.progress_id]: false,
        }));
      }, 2000);
    }
  };

  const handlePledge = (e) => {
    e.stopPropagation();
    if (
      !isReadOnly &&
      !isCampNotStarted &&
      pledgingProgressId !== item.progress_id &&
      !pledgedSteps.has(item.progress_id) &&
      !item.is_pledged_by_user &&
      onPledge
    ) {
      onPledge(item.progress_id);
    }
  };

  const isPledged =
    pledgedSteps.has(item.progress_id) || item.is_pledged_by_user === 1;
  const isPledging = pledgingProgressId === item.progress_id;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Upvote Button */}
      <div className="relative">
        <AnimatePresence>
          {showUpvoteTooltip[item.progress_id] && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.8 }}
              animate={{ opacity: 1, y: -50, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none whitespace-nowrap"
            >
              <motion.div
                animate={{
                  y: item.is_upvoted_by_user ? [0, -3, 0] : [0, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="bg-gradient-to-r from-[#7440E9] to-[#5a2fc7] text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 border border-white/20"
              >
                <motion.div
                  animate={{
                    rotate: item.is_upvoted_by_user
                      ? [0, 15, -15, 0]
                      : [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                >
                  <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                </motion.div>
                <span>
                  {item.is_upvoted_by_user
                    ? "شكراً لك! ❤️"
                    : "تم التصويت بنجاح! 👍"}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={!isReadOnly ? { scale: 1.05 } : {}}
          whileTap={!isReadOnly ? { scale: 0.95 } : {}}
          onClick={handleUpvote}
          disabled={isReadOnly}
          title={
            isReadOnly
              ? "هذا المخيم منتهي. التفاعل الاجتماعي غير متاح."
              : "مفيد"
          }
          className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-200 font-medium ${
            isReadOnly
              ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
              : item.is_upvoted_by_user
              ? "bg-[#7440E9] text-white shadow-lg hover:shadow-xl"
              : "bg-gray-100 text-gray-600 hover:bg-[#F7F6FB] hover:text-[#7440E9] hover:shadow-md"
          }`}
          aria-label="مفيد"
        >
          <motion.div
            animate={
              item.is_upvoted_by_user
                ? {
                    rotate: [0, -180, 0],
                    scale: [1, 1.3, 1],
                  }
                : {}
            }
            transition={{
              duration: 0.5,
              ease: "easeOut",
            }}
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.div>
          <div className="font-semibold text-sm sm:text-base min-w-[1.5rem] text-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={String(item.upvote_count || 0)}
                initial={{
                  y: -10,
                  opacity: 0,
                  scale: 1.2,
                }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 10, opacity: 0, scale: 0.8 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 15,
                }}
              >
                {item.upvote_count || 0}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.button>
      </div>

      {/* Save Button */}
      <div className="relative">
        <AnimatePresence>
          {showBookmarkTooltip[item.progress_id] && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.8 }}
              animate={{ opacity: 1, y: -50, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none whitespace-nowrap"
            >
              <motion.div
                animate={{
                  y: item.is_saved_by_user ? [0, -3, 0] : [0, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="bg-gradient-to-r from-[#7440E9] to-[#5a2fc7] text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 border border-white/20"
              >
                <motion.div
                  animate={{
                    rotate: item.is_saved_by_user
                      ? [0, -10, 10, -10, 0]
                      : [0, 10, -10, 0],
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" />
                </motion.div>
                <span>
                  {item.is_saved_by_user
                    ? "تم الحفظ! ✅"
                    : "تم الحفظ بنجاح! 💾"}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={!isReadOnly ? { scale: 1.05 } : {}}
          whileTap={!isReadOnly ? { scale: 0.95 } : {}}
          onClick={handleSave}
          disabled={isReadOnly}
          title={isReadOnly ? "هذا المخيم منتهي. الحفظ غير متاح." : "حفظ"}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-200 font-medium ${
            isReadOnly
              ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
              : item.is_saved_by_user
              ? "bg-[#F7F6FB] text-[#7440E9] border-2 border-[#7440E9] shadow-lg hover:shadow-xl"
              : "bg-gray-100 text-gray-600 hover:bg-[#F7F6FB] hover:text-[#7440E9] hover:shadow-md"
          }`}
          aria-label="حفظ"
        >
          <motion.div
            key={item.is_saved_by_user ? "saved" : "not_saved"}
            animate={
              item.is_saved_by_user
                ? {
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.2, 1],
                  }
                : {}
            }
            transition={{ duration: 0.3 }}
          >
            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.div>
          <div className="font-semibold text-sm sm:text-base min-w-[1.5rem] text-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={String(item.save_count || 0)}
                initial={{
                  y: -10,
                  opacity: 0,
                  scale: 1.2,
                }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 10, opacity: 0, scale: 0.8 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 15,
                }}
              >
                {item.save_count || 0}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.button>
      </div>

      {/* Pledge Button - Only show if there's a proposed step and it's not own reflection */}
      {item.proposed_step && !item.is_own && (
        <div className="relative">
          <AnimatePresence>
            {showPledgeTooltip[item.progress_id] && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.8 }}
                animate={{ opacity: 1, y: -50, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none whitespace-nowrap"
              >
                <motion.div
                  animate={{
                    y: isPledged ? [0, -3, 0] : [0, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="bg-gradient-to-r from-[#7440E9] to-[#5a2fc7] text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 border border-white/20"
                >
                  <motion.div
                    animate={{
                      rotate: isPledged ? [0, 15, -15, 0] : [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  >
                    <HandHeart className="w-3 h-3 sm:w-4 sm:h-4" />
                  </motion.div>
                  <span>
                    {isPledged
                      ? "تم الالتزام بنجاح! ✅"
                      : "اضغط للالتزام بهذه الخطوة"}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={
              !isReadOnly && !isCampNotStarted && !isPledging && !isPledged
                ? { scale: 1.05 }
                : {}
            }
            whileTap={
              !isReadOnly && !isCampNotStarted && !isPledging && !isPledged
                ? { scale: 0.9 }
                : {}
            }
            onMouseEnter={() => {
              if (!isReadOnly && !isCampNotStarted && !isPledging) {
                setShowPledgeTooltip((prev) => ({
                  ...prev,
                  [item.progress_id]: true,
                }));
              }
            }}
            onMouseLeave={() => {
              if (!isPledged) {
                setShowPledgeTooltip((prev) => ({
                  ...prev,
                  [item.progress_id]: false,
                }));
              }
            }}
            onClick={handlePledge}
            disabled={isReadOnly || isCampNotStarted || isPledging || isPledged}
            title={
              isReadOnly || isCampNotStarted
                ? "لا يمكن الالتزام في هذا الوقت"
                : isPledging
                ? "جاري الالتزام..."
                : isPledged
                ? "تم الالتزام بهذه الخطوة"
                : "اضغط للالتزام بهذه الخطوة العملية"
            }
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-200 font-medium ${
              isReadOnly || isCampNotStarted || isPledging
                ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                : isPledged
                ? "bg-[#7440E9] text-white border-2 border-[#7440E9]/20 shadow-lg hover:shadow-xl"
                : "bg-gray-100 text-gray-600 hover:bg-[#F7F6FB] hover:text-[#7440E9] hover:shadow-md"
            }`}
            aria-label="ألتزم معك"
          >
            {isPledging ? (
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-gray-600"></div>
            ) : (
              <motion.div
                animate={
                  isPledged
                    ? {
                        scale: [1, 1.1, 1],
                      }
                    : {}
                }
                transition={{
                  duration: 0.3,
                  repeat: isPledged ? Infinity : 0,
                  repeatDelay: 2,
                }}
              >
                <HandHeart className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.div>
            )}
            <div className="font-semibold text-sm sm:text-base min-w-[1.5rem] text-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={String(
                    item.pledge_count !== undefined &&
                      item.pledge_count !== null
                      ? item.pledge_count
                      : 0
                  )}
                  initial={{
                    y: -10,
                    opacity: 0,
                    scale: 1.2,
                  }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 10, opacity: 0, scale: 0.8 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 15,
                  }}
                >
                  {item.pledge_count !== undefined && item.pledge_count !== null
                    ? item.pledge_count
                    : 0}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default InteractionButtons;
