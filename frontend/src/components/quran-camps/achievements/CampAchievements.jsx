import React from "react";
import { motion } from "framer-motion";
import {
  Award,
  Trophy,
  CheckCircle,
  Flame,
  Star,
  Target,
  Calendar,
  Sparkles,
} from "lucide-react";

const CampAchievements = ({ summaryData }) => {
  if (!summaryData) return null;

  // حساب الإنجازات المكتسبة
  const achievements = [];

  // إكمال جميع الأيام
  if (
    summaryData.daysCompleted >= summaryData.totalCampDays &&
    summaryData.totalCampDays > 0
  ) {
    achievements.push({
      id: "all_days",
      title: "مكتمل الأيام",
      description: "أكملت جميع أيام المخيم",
      icon: Calendar,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
    });
  }

  // إكمال جميع المهام
  if (
    summaryData.totalTasks >= summaryData.totalTasksForCamp &&
    summaryData.totalTasksForCamp > 0
  ) {
    achievements.push({
      id: "all_tasks",
      title: "مكتمل المهام",
      description: "أكملت جميع مهام المخيم",
      icon: CheckCircle,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
    });
  }

  // أطول streak
  if (summaryData.longestStreak >= 7) {
    achievements.push({
      id: "streak_7",
      title: "سلسلة نار 🔥",
      description: `${summaryData.longestStreak} يوم متتالي`,
      icon: Flame,
      color: "from-orange-500 to-red-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-700",
    });
  }

  // أكثر مساهمات مفيدة
  if (summaryData.upvotesReceived >= 10) {
    achievements.push({
      id: "helpful",
      title: "صاحب تأثير",
      description: `${summaryData.upvotesReceived} إعجاب على مساهماتك`,
      icon: Sparkles,
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-700",
    });
  }

  // 100% إتمام
  const completionPercentage =
    summaryData.totalCampDays > 0
      ? Math.round(
          (summaryData.daysCompleted / summaryData.totalCampDays) * 100
        )
      : 0;

  if (completionPercentage === 100) {
    achievements.push({
      id: "perfect",
      title: "مثالي ⭐",
      description: "100% إتمام - إنجاز رائع!",
      icon: Trophy,
      color: "from-yellow-400 to-amber-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-700",
    });
  }

  // مساهمات كثيرة
  if (summaryData.reflectionsWritten >= 10) {
    achievements.push({
      id: "writer",
      title: "كاتب نشط",
      description: `${summaryData.reflectionsWritten} فائدة مكتوبة`,
      icon: Target,
      color: "from-indigo-500 to-purple-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      textColor: "text-indigo-700",
    });
  }

  // نقاط عالية
  if (summaryData.totalPoints >= 100) {
    achievements.push({
      id: "points_master",
      title: "خبير النقاط",
      description: `${summaryData.totalPoints} نقطة`,
      icon: Star,
      color: "from-amber-500 to-yellow-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-700",
    });
  }

  if (achievements.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.3 }}
      className="bg-white rounded-2xl border border-[#E8E2FF] shadow-lg p-6 mb-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-[#7440E9] to-purple-600 rounded-xl shadow-lg">
          <Award className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-800">إنجازاتك 🏆</h3>
          <p className="text-sm text-gray-600">
            تحقق من الإنجازات التي حصلت عليها
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement, index) => {
          const Icon = achievement.icon;
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 1.4 + index * 0.1,
                type: "spring",
                stiffness: 200,
              }}
              whileHover={{ scale: 1.03, y: -3 }}
              className="bg-white border border-[#F0EBFF] rounded-xl p-4 shadow-sm"
            >
              <div className="relative">
                <div className="flex items-start gap-3 mb-2">
                  <div
                    className={`p-2 bg-gradient-to-br ${achievement.color} rounded-lg shadow`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4
                      className={`font-bold text-lg ${achievement.textColor} mb-1`}
                    >
                      {achievement.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default CampAchievements;
