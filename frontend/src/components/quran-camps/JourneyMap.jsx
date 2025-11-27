import React from "react";
import { motion } from "framer-motion";
import { Check, Users, CheckCircle2 } from "lucide-react";
import { ARABIC_DAY_ORDINALS } from "../../constants/days.js";
const JourneyMap = ({
  camp,
  userProgress,
  selectedDay,
  setSelectedDay,
  setShowTaskSidebar,
  getDayStatus,
  getDayTheme,
  getLockedDayTheme,
  taskGroups,
  dailyTasks,
  completionStats,
  celebratingDay,
  isCampNotStarted,
  handleOnboarding,
  setShowTaskModalIntro,
  currentDay,
}) => {
  // حساب نسبة التقدم الكلية
  const totalProgress = React.useMemo(() => {
    if (!userProgress?.progress) return 0;
    const { completedTasks, totalTasks } = userProgress.progress;
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  }, [userProgress]);

  // حساب نسبة التقدم لكل يوم
  const getDayProgress = React.useCallback(
    (dayNumber) => {
      if (!userProgress?.tasks) return 0;
      const dayTasks = userProgress.tasks.filter(
        (task) => task.day_number === dayNumber
      );
      if (dayTasks.length === 0) return 0;
      const completedTasks = dayTasks.filter((task) => task.completed).length;
      return (completedTasks / dayTasks.length) * 100;
    },
    [userProgress]
  );

  const formatDayLabel = (dayNumber) => {
    const numericDay = Number(dayNumber);
    if (!Number.isFinite(numericDay) || numericDay <= 0)
      return `اليوم ${dayNumber}`;
    const ordinal = ARABIC_DAY_ORDINALS[numericDay];
    return ordinal ? `اليوم ${ordinal}` : `اليوم ${numericDay}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Journey Map - محسّن للموبايل */}
      <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-3 lg:gap-4 xl:gap-6 px-1 sm:px-2 lg:px-0">
        {Array.from({ length: camp.duration_days }, (_, index) => {
          const dayNumber = index + 1;
          const status = getDayStatus(dayNumber);
          const isActive = dayNumber === selectedDay;
          const isLastDay = dayNumber === camp.duration_days;
          const nextDayStatus = !isLastDay ? getDayStatus(dayNumber + 1) : null;
          // حساب نسبة التقدم لهذا اليوم
          const dayProgress = getDayProgress(dayNumber);
          const isDayCompleted = dayProgress === 100;

          return (
            <React.Fragment key={dayNumber}>
              <motion.div
                className="flex flex-col items-center min-w-[70px] sm:min-w-0"
                whileHover={status !== "locked" ? { scale: 1.05 } : {}}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Station */}
                <motion.div
                  style={{
                    backgroundImage: `url(/assets/tent.jpg)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                  animate={
                    celebratingDay === dayNumber && status === "completed"
                      ? {
                          scale: [1, 1.15, 1],
                          boxShadow: [
                            "0 0 0 0 rgba(34, 197, 94, 0.4)",
                            "0 0 0 20px rgba(34, 197, 94, 0)",
                            "0 0 0 0 rgba(34, 197, 94, 0)",
                          ],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.8,
                    ease: "easeOut",
                  }}
                  whileTap={
                    status !== "locked" && !isCampNotStarted
                      ? { scale: 0.95 }
                      : {}
                  }
                  onClick={() => {
                    if (status !== "locked" && !isCampNotStarted) {
                      if (isLastDay) {
                        setSelectedDay(dayNumber);
                        setShowTaskSidebar(true);
                      } else {
                        handleOnboarding(
                          "taskModal",
                          setShowTaskModalIntro,
                          () => {
                            setSelectedDay(dayNumber);
                            setShowTaskSidebar(true);
                          }
                        );
                      }
                    }
                  }}
                  title={
                    status !== "locked"
                      ? `اليوم ${dayNumber}: ${
                          getDayTheme(
                            dayNumber,
                            userProgress?.tasks,
                            taskGroups
                          ) || "مهام اليوم"
                        }`
                      : `اليوم ${dayNumber}: مغلق`
                  }
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer touch-manipulation ${
                    isCampNotStarted
                      ? "opacity-70 cursor-not-allowed grayscale"
                      : isDayCompleted && status === "completed"
                      ? "shadow-2xl border-2 border-green-500 ring-2 sm:ring-4 ring-green-300/50"
                      : status === "completed"
                      ? "shadow-lg border-2 border-green-500"
                      : status === "active"
                      ? `shadow-xl shadow-purple-500/50 ${
                          isActive
                            ? "ring-2 sm:ring-4 ring-purple-300"
                            : "ring-1 sm:ring-2 ring-purple-300"
                        }`
                      : status === "incomplete"
                      ? "shadow-lg border-2 border-orange-500"
                      : "opacity-50 cursor-not-allowed grayscale"
                  } ${
                    isActive && status !== "active"
                      ? "ring-1 sm:ring-2 ring-purple-200 shadow-xl"
                      : ""
                  }`}
                >
                  {/* Day Number Badge */}
                  <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center z-10 shadow-md">
                    <span className="text-[11px] sm:text-xs md:text-sm font-bold text-gray-700">
                      {dayNumber}
                    </span>
                  </div>

                  {/* Completion Counter Badge */}
                  {completionStats.dayStats[dayNumber] > 0 && (
                    <span
                      className={`absolute -bottom-1 -left-1 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full text-[9px] sm:text-[10px] md:text-xs font-bold text-white shadow-lg z-10 ${
                        status === "active"
                          ? "bg-purple-600"
                          : status === "completed"
                          ? "bg-green-600"
                          : "bg-gray-400"
                      }`}
                    >
                      <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                      <span className="mr-0.5 sm:mr-1">
                        {completionStats.dayStats[dayNumber]}
                      </span>
                    </span>
                  )}

                  {/* Checkmark for completed status - محسّن مع هالة نورانية */}
                  {isDayCompleted && status === "completed" && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                    >
                      {/* هالة نورانية */}
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.6, 0.8, 0.6],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-0 bg-green-400 rounded-full blur-md"
                      />
                      {/* أيقونة CheckCircle */}
                      <div className="relative bg-green-500 rounded-full p-1 sm:p-1.5 shadow-lg">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </motion.div>
                  )}

                  {/* Checkmark عادي للـ completed بدون 100% */}
                  {status === "completed" && !isDayCompleted && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500/80 backdrop-blur-sm rounded-full p-1 sm:p-1.5 z-10">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  )}
                </motion.div>

                {/* Day Label with Theme */}
                <div className="mt-1.5 sm:mt-2 text-center max-w-[70px] sm:max-w-none">
                  <span
                    className={`font-bold text-[11px] sm:text-xs md:text-sm block ${
                      status === "locked" ? "text-gray-500" : "text-gray-800"
                    }`}
                  >
                    {formatDayLabel(dayNumber)}
                  </span>
                  {status !== "locked" ? (
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-purple-600 font-medium mt-0.5 line-clamp-2 sm:line-clamp-none">
                      {getDayTheme(
                        dayNumber,
                        userProgress?.tasks,
                        taskGroups
                      ) || `مهام ${formatDayLabel(dayNumber)}`}
                    </p>
                  ) : (
                    // Show teaser for locked days
                    (() => {
                      const lockedTheme = getLockedDayTheme(
                        dayNumber,
                        taskGroups,
                        dailyTasks
                      );
                      return lockedTheme ? (
                        <p className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 italic mt-0.5 line-clamp-1">
                          {lockedTheme}
                        </p>
                      ) : null;
                    })()
                  )}
                </div>
              </motion.div>

              {/* Connecting Line - شريط تقدم مدمج */}
              {!isLastDay && (
                <div
                  className="flex-shrink-0 w-6 sm:w-10 md:w-14 lg:w-20 xl:w-24 h-2 sm:h-2.5 md:h-3 rounded-full overflow-hidden relative touch-manipulation"
                  onClick={() => {
                    if (nextDayStatus !== "locked" && !isCampNotStarted) {
                      const nextDay = dayNumber + 1;
                      const isLastDayNext = nextDay === camp.duration_days;
                      if (isLastDayNext) {
                        setSelectedDay(nextDay);
                        setShowTaskSidebar(true);
                      } else {
                        handleOnboarding(
                          "taskModal",
                          setShowTaskModalIntro,
                          () => {
                            setSelectedDay(nextDay);
                            setShowTaskSidebar(true);
                          }
                        );
                      }
                    }
                  }}
                  title={
                    nextDayStatus !== "locked"
                      ? `الانتقال إلى اليوم ${dayNumber + 1}`
                      : `اليوم ${dayNumber + 1} مغلق`
                  }
                >
                  {/* خلفية رمادية */}
                  <div
                    className={`absolute inset-0 rounded-full ${
                      isCampNotStarted || status === "locked"
                        ? "bg-gray-200"
                        : "bg-gray-200"
                    }`}
                  />

                  {/* شريط التقدم - يعتمد على نسبة إكمال اليوم الحالي (اليوم الذي يسبق الخط) */}
                  {!isCampNotStarted && status !== "locked" && (
                    <motion.div
                      className={`absolute inset-y-0 right-0 rounded-full ${
                        isDayCompleted
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : status === "completed"
                          ? "bg-gradient-to-r from-green-400 to-green-500"
                          : status === "active"
                          ? "bg-gradient-to-r from-[#7440E9] to-[#5a2fc7]"
                          : status === "incomplete"
                          ? "bg-gradient-to-r from-orange-400 to-orange-500"
                          : "bg-gray-300"
                      }`}
                      initial={{ width: 0 }}
                      animate={{
                        width: isDayCompleted
                          ? "100%"
                          : `${Math.max(0, Math.min(100, dayProgress))}%`,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                        delay: index * 0.1,
                      }}
                    >
                      {/* تأثير shimmer عند اكتمال 100% */}
                      {isDayCompleted && (
                        <motion.div
                          animate={{
                            x: ["-100%", "100%"],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        />
                      )}
                    </motion.div>
                  )}

                  {/* Ring highlight عند التحديد */}
                  {(dayNumber === selectedDay ||
                    dayNumber + 1 === selectedDay) &&
                    status !== "locked" && (
                      <motion.div
                        className="absolute inset-0 ring-2 ring-purple-200 rounded-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="mt-3 sm:mt-4 lg:mt-6 text-center px-2 sm:px-4">
        <p className="text-gray-600 mb-2 sm:mb-3 lg:mb-4 text-[11px] sm:text-xs md:text-sm lg:text-base">
          اضغط على أي محطة لعرض مهام ذلك اليوم
        </p>

        {/* Legend - محسّن للموبايل */}
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 text-[9px] sm:text-[10px] md:text-xs lg:text-sm">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-gray-200 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600 whitespace-nowrap">مستقبلي</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-[#7440E9] rounded-full animate-pulse flex-shrink-0"></div>
            <span className="text-gray-600 whitespace-nowrap">
              اليوم الحالي
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-orange-500 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600 whitespace-nowrap">غير مكتمل</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-green-500 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600 whitespace-nowrap">مكتمل</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyMap;
