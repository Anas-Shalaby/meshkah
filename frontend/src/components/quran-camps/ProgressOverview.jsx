import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Star,
  Target,
  Zap,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { ARABIC_DAY_ORDINALS } from "../../constants/days.js";

const ProgressOverview = ({
  loading,
  campDay,
  camp,
  userProgress,
  onSettingsClick,
  averageProgress, // متوسط التقدم العام (من API)
}) => {
  // حساب نسبة التقدم الكلية
  const overallProgress = useMemo(() => {
    if (!userProgress?.progress) return 0;
    const { completedTasks, totalTasks } = userProgress.progress;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }, [userProgress]);

  const formatDayLabel = (dayNumber) => {
    const numericDay = Number(dayNumber);
    if (!Number.isFinite(numericDay) || numericDay <= 0)
      return `اليوم ${dayNumber}`;
    const ordinal = ARABIC_DAY_ORDINALS[numericDay];
    return ordinal ? `اليوم ${ordinal}` : `اليوم ${numericDay}`;
  };

  // حساب نسبة التقدم في الأيام
  const daysProgress = useMemo(() => {
    if (!camp?.duration_days || !campDay) return 0;
    return Math.round((campDay / camp.duration_days) * 100);
  }, [camp, campDay]);

  // حساب الأيام المتأخرة
  const daysBehind = useMemo(() => {
    if (!camp?.duration_days || !campDay || !userProgress?.progress) return 0;
    const expectedDay = Math.ceil((overallProgress / 100) * camp.duration_days);
    return Math.max(0, campDay - expectedDay);
  }, [camp, campDay, overallProgress, userProgress]);

  // حساب تاريخ الإكمال المتوقع
  const estimatedCompletionDate = useMemo(() => {
    if (!camp?.start_date || !camp?.duration_days || !userProgress?.progress)
      return null;

    const { completedTasks, totalTasks } = userProgress.progress;
    if (completedTasks === 0 || totalTasks === 0) return null;

    const currentRate = completedTasks / campDay; // مهام لكل يوم
    if (currentRate === 0) return null;

    const remainingTasks = totalTasks - completedTasks;
    const daysNeeded = Math.ceil(remainingTasks / currentRate);

    const startDate = new Date(camp.start_date);
    const completionDate = new Date(startDate);
    completionDate.setDate(completionDate.getDate() + campDay + daysNeeded);

    return completionDate;
  }, [camp, campDay, userProgress]);

  // مقارنة مع المتوسط
  const progressComparison = useMemo(() => {
    if (!averageProgress) return null;
    const diff = overallProgress - averageProgress;
    return {
      diff: Math.round(diff),
      isAboveAverage: diff > 0,
    };
  }, [overallProgress, averageProgress]);

  if (loading) {
    return (
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100 animate-pulse"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-lg sm:rounded-xl mx-auto mb-2 sm:mb-3 lg:mb-4"></div>
              <div className="h-6 sm:h-7 lg:h-8 bg-gray-200 rounded mb-1 sm:mb-2"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      type: "day",
      icon: Calendar,
      value: campDay,
      label: `من ${camp.duration_days}`,
      bgColor: "bg-gradient-to-br from-[#7440E9] to-[#8B5CF6]",
      delay: 0,
    },
    {
      type: "points",
      icon: Star,
      value: userProgress?.enrollment?.total_points || 0,
      label: "نقطة مكتسبة",
      bgColor: "bg-gradient-to-br from-yellow-500 to-orange-500",
      delay: 0.1,
    },
    {
      type: "tasks",
      icon: Target,
      value: ` ${userProgress?.progress?.completedTasks || 0}`,
      label: `من ${userProgress?.progress?.totalTasks || 0} مهمة`,
      bgColor: "bg-gradient-to-br from-blue-500 to-cyan-500",
      delay: 0.2,
    },
    {
      type: "streak",
      icon: Zap,
      value:
        userProgress?.enrollment?.current_streak ||
        userProgress?.enrollment?.streak ||
        0,
      label: "يوم متتالي",
      bgColor: "bg-gradient-to-br from-orange-500 to-red-500",
      delay: 0.3,
    },
  ];

  return (
    <div className="mb-4 sm:mb-6 lg:mb-8 space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay }}
            className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="relative z-10">
              <motion.div
                className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${stat.bgColor} rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4 shadow-md`}
                whileHover={{ scale: 1.2, rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </motion.div>
              <motion.div
                className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: stat.delay + 0.2,
                  type: "spring",
                  stiffness: 200,
                }}
              >
                {stat.type === "day" ? formatDayLabel(stat.value) : stat.value}
              </motion.div>
              <motion.div
                className="text-xs sm:text-sm lg:text-base text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: stat.delay + 0.3 }}
              >
                {stat.label}
              </motion.div>
            </div>
          </motion.div>
        ))}

        {/* Settings Card - Always visible and prominent */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={onSettingsClick}
          className="hidden md:block bg-gradient-to-br from-[#7440E9] to-[#5a2fc7] rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border-2 border-[#7440E9]/20 text-center hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
        >
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

          <div className="relative z-10">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4 group-hover:bg-white/30 transition-colors">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-0.5 sm:mb-1">
              الإعدادات
            </div>
            <div className="text-xs sm:text-sm lg:text-base text-white/90">
              تخصيص تجربتك
            </div>
          </div>

          {/* Pulse animation indicator */}
          <motion.div
            className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.button>
      </div>
    </div>
  );
};

export default ProgressOverview;
