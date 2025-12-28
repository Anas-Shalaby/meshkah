import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, BookOpen } from "lucide-react";
import TaskCompletionStats from "./TaskCompletionStats";

/**
 * SidebarTaskCard - Reusable Task Card for TaskSidebar
 * Displays individual task with status, actions, and completion stats
 */
const SidebarTaskCard = ({
  task,
  taskIndex,
  groupIndex = 0,
  currentDay,
  isReadOnly,
  isCampNotStarted,
  onQuickComplete,
  onViewTask,
}) => {
  const isOverdue = task.day_number < currentDay && !task.completed;
  const isToday = task.day_number === currentDay;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: groupIndex * 0.2 + taskIndex * 0.1,
      }}
      className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 ${
        task.completed
          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-md hover:shadow-lg"
          : isOverdue
          ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:border-orange-300 hover:shadow-md"
          : isToday
          ? "bg-gradient-to-br from-[#F7F6FB] to-[#F3EDFF] border-[#7440E9]/30 hover:border-[#7440E9]/50 hover:shadow-lg ring-2 ring-[#7440E9]/10"
          : "bg-white border-gray-200 hover:border-[#7440E9]/30 hover:shadow-md"
      }`}
    >
      {/* Task Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 relative">
        {/* Icon */}
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md transition-all duration-300 ${
            task.completed
              ? "bg-gradient-to-br from-green-500 to-emerald-600"
              : isOverdue
              ? "bg-gradient-to-br from-orange-500 to-amber-600"
              : isToday
              ? "bg-gradient-to-br from-[#7440E9] to-[#8B5CF6] ring-2 ring-[#7440E9]/30"
              : "bg-gradient-to-br from-gray-400 to-gray-500"
          }`}
        >
          {task.completed ? (
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          ) : (
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          )}
        </div>

        {/* Title & Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              className={`font-bold text-sm sm:text-base md:text-lg truncate flex-1 ${
                task.completed
                  ? "text-green-700 line-through decoration-green-500 decoration-2"
                  : isOverdue
                  ? "text-orange-800"
                  : isToday
                  ? "text-[#7440E9]"
                  : "text-gray-800"
              }`}
            >
              {task.title}
            </h4>
            {/* Completion Counter Badge */}
            <TaskCompletionStats
              friendsWhoCompleted={task.completed_by_friends || []}
              totalCount={task.completed_by_count || 0}
            />
          </div>
          <p
            className={`text-xs sm:text-sm truncate mt-1 leading-relaxed ${
              task.completed
                ? "text-green-600 line-through decoration-green-400 decoration-1"
                : isToday
                ? "text-[#7440E9]/70"
                : "text-gray-600"
            }`}
          >
            {task.description}
          </p>
        </div>
      </div>

      {/* Task Info Badges */}
      <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
        {isOverdue && (
          <span className="px-2 py-0.5 sm:py-1 rounded-full text-xs bg-orange-100 text-orange-700 font-medium">
            ⚠️ متأخر
          </span>
        )}
        {isToday && !task.completed && (
          <span className="px-2.5 py-1 sm:py-1.5 rounded-full text-xs bg-gradient-to-r from-[#7440E9]/10 to-[#8B5CF6]/10 text-[#7440E9] font-semibold border border-[#7440E9]/20">
            📅 اليوم
          </span>
        )}
        <span className="flex items-center gap-1">
          ⏱️ {task.estimated_time || "30 دقيقة"}
        </span>
        {task.points && (
          <span className="flex items-center gap-1">
            ⭐ {task.points}
          </span>
        )}
        <span
          className={`px-2.5 py-1 sm:py-1.5 rounded-full text-xs font-semibold ${
            task.is_optional
              ? "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border border-orange-200"
              : "bg-gradient-to-r from-[#7440E9]/10 to-[#8B5CF6]/10 text-[#7440E9] border border-[#7440E9]/20"
          }`}
        >
          {task.is_optional ? "اختياري" : "مطلوب"}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* Quick Complete Button */}
        {!task.completed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickComplete(task);
            }}
            disabled={isReadOnly || isCampNotStarted}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all duration-300 ${
              isReadOnly || isCampNotStarted
                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:from-green-600 hover:to-emerald-700 active:scale-95 transform"
            }`}
            title={
              isReadOnly || isCampNotStarted
                ? isCampNotStarted
                  ? "المخيم لم يبدأ بعد"
                  : "المخيم منتهي"
                : "إكمال سريع بدون فتح المهمة"
            }
          >
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">إتمام سريع</span>
            <span className="sm:hidden">إتمام</span>
          </button>
        )}

        {/* View Task Button */}
        <button
          onClick={() => onViewTask(task)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 transform active:scale-95 ${
            task.completed
              ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 hover:shadow-md hover:from-green-100 hover:to-emerald-100"
              : "bg-gradient-to-r from-[#F7F6FB] to-[#F3EDFF] text-[#7440E9] border border-[#7440E9]/30 hover:shadow-lg hover:from-[#F3EDFF] hover:to-[#E9E4F5] hover:border-[#7440E9]/50"
          }`}
        >
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>عرض المهمة</span>
        </button>
      </div>
    </motion.div>
  );
};

export default SidebarTaskCard;
