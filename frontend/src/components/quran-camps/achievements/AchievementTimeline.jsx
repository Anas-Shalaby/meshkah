import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  BookOpen,
  Target,
  Award,
  ThumbsUp,
  Calendar,
} from "lucide-react";

const AchievementTimeline = ({ summaryData, userProgress }) => {
  // إنشاء timeline الإنجازات
  const milestones = useMemo(() => {
    const items = [];

    if (!summaryData) return items;

    // أول مهمة مكتملة
    if (summaryData.totalTasks >= 1) {
      items.push({
        id: "first_task",
        title: "أول مهمة",
        description: "أكملت أول مهمة في المخيم",
        icon: CheckCircle,
        date: "بداية الرحلة",
        color: "from-green-500 to-emerald-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-300",
        completed: true,
      });
    }

    // أول فائدة مكتوبة
    if (summaryData.reflectionsWritten >= 1) {
      items.push({
        id: "first_reflection",
        title: "أول فائدة",
        description: "كتبت أول فائدة في المخيم",
        icon: BookOpen,
        date: "بداية الكتابة",
        color: "from-blue-500 to-indigo-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-300",
        completed: true,
      });
    }

    // الوصول لـ 50% إتمام
    const completionPercentage =
      summaryData.totalCampDays > 0
        ? Math.round(
            (summaryData.daysCompleted / summaryData.totalCampDays) * 100
          )
        : 0;

    if (completionPercentage >= 50) {
      items.push({
        id: "halfway",
        title: "نصف الطريق",
        description: "أكملت 50% من المخيم",
        icon: Target,
        date: `${completionPercentage}% إتمام`,
        color: "from-purple-500 to-pink-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-300",
        completed: true,
      });
    }

    // أول مساهمة مفيدة
    if (summaryData.upvotesReceived >= 1) {
      items.push({
        id: "first_upvote",
        title: "أول اعجاب",
        description: "حصلت على أول إعجاب على مساهماتك",
        icon: ThumbsUp,
        date: `${summaryData.upvotesReceived} إعجاب`,
        color: "from-amber-500 to-yellow-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-300",
        completed: true,
      });
    }

    // الوصول لـ 100% إتمام
    if (completionPercentage === 100) {
      items.push({
        id: "complete",
        title: "مكتمل! 🎉",
        description: "أكملت المخيم بنجاح",
        icon: Award,
        date: "نهاية الرحلة",
        color: "from-yellow-400 to-orange-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-300",
        completed: true,
        isFinal: true,
      });
    }

    return items;
  }, [summaryData]);

  if (milestones.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4 }}
      className="bg-white rounded-2xl border border-[#E8E2FF] shadow-lg p-6 mb-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-[#7440E9] to-purple-600 rounded-xl shadow-lg">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-800">رحلتك في المخيم</h3>
          <p className="text-sm text-gray-600">المحطات المهمة في رحلتك</p>
        </div>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute right-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#DAD2FF] via-[#C8BEFF] to-[#DAD2FF]"></div>

        <div className="space-y-6">
          {milestones.map((milestone, index) => {
            const Icon = milestone.icon;
            const isLast = index === milestones.length - 1;

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 1.5 + index * 0.15,
                  type: "spring",
                  stiffness: 100,
                }}
                className="relative flex items-start gap-4"
              >
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 1.6 + index * 0.15,
                      type: "spring",
                      stiffness: 200,
                    }}
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${milestone.color} shadow-lg flex items-center justify-center`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>
                  {milestone.isFinal && (
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 blur-md"
                    />
                  )}
                </div>

                {/* Content card */}
                <motion.div
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex-1 bg-white border border-[#F0EBFF] rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-lg font-bold text-gray-800">
                      {milestone.title}
                    </h4>
                    <span className="text-xs font-medium text-gray-500 bg-white/50 px-2 py-1 rounded-full">
                      {milestone.date}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {milestone.description}
                  </p>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default AchievementTimeline;
