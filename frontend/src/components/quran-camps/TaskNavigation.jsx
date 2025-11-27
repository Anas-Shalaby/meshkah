import React from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";

const TaskNavigation = ({
  currentTask,
  allTasks,
  onNavigate,
  showSkipCompleted = false,
  getDayStatus,
  currentDay,
}) => {
  if (!currentTask || !allTasks || allTasks.length === 0) {
    return null;
  }

  // Helper function to check if a task's day is locked
  const isTaskDayLocked = (task) => {
    if (!getDayStatus || !currentDay || !task.day_number) return false;
    const dayStatus = getDayStatus(task.day_number);
    return dayStatus === "locked";
  };

  // Find current task index
  const currentIndex = allTasks.findIndex((t) => t.id === currentTask.id);

  if (currentIndex === -1) {
    return null;
  }

  // Find previous task (skip locked days)
  const findPreviousTask = () => {
    for (let i = currentIndex - 1; i >= 0; i--) {
      const task = allTasks[i];
      // Skip if task's day is locked
      if (isTaskDayLocked(task)) {
        continue;
      }
      if (!showSkipCompleted || !task.completed) {
        return task;
      }
    }
    return null;
  };

  // Find next task (skip locked days)
  const findNextTask = () => {
    for (let i = currentIndex + 1; i < allTasks.length; i++) {
      const task = allTasks[i];
      // Skip if task's day is locked
      if (isTaskDayLocked(task)) {
        continue;
      }
      if (!showSkipCompleted || !task.completed) {
        return task;
      }
    }
    return null;
  };

  const previousTask = findPreviousTask();
  const nextTask = findNextTask();

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle if not typing in an input/textarea
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      // Arrow keys for navigation
      if (e.key === "ArrowRight" && previousTask) {
        // RTL: ArrowRight goes to previous
        e.preventDefault();
        onNavigate(previousTask);
      } else if (e.key === "ArrowLeft" && nextTask) {
        // RTL: ArrowLeft goes to next
        e.preventDefault();
        onNavigate(nextTask);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previousTask, nextTask, onNavigate]);

  if (!previousTask && !nextTask) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-2 xs:gap-3 sm:gap-4 pt-3 xs:pt-4 border-t border-gray-200">
      {/* Previous Task Button */}
      <motion.button
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => previousTask && onNavigate(previousTask)}
        disabled={!previousTask}
        className={`flex items-center gap-2 xs:gap-3 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl font-medium text-sm xs:text-base transition-all duration-200 ${
          previousTask
            ? "bg-white border border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50/50 hover:text-purple-700 hover:shadow-sm"
            : "bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed"
        }`}
        aria-label="المهمة السابقة"
      >
        <ChevronRight className="w-4 h-4 xs:w-5 xs:h-5" />
        <span className="hidden xs:inline">السابق</span>
      </motion.button>

      {/* Task Counter */}
      <div className="flex-1 text-center">
        <span className="text-xs xs:text-sm text-gray-500 font-medium">
          المهمة {currentIndex + 1} من {allTasks.length}
        </span>
      </div>

      {/* Next Task Button */}
      <motion.button
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => nextTask && onNavigate(nextTask)}
        disabled={!nextTask}
        className={`flex items-center gap-2 xs:gap-3 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl font-medium text-sm xs:text-base transition-all duration-200 ${
          nextTask
            ? "bg-white border border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50/50 hover:text-purple-700 hover:shadow-sm"
            : "bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed"
        }`}
        aria-label="المهمة التالية"
      >
        <span className="hidden xs:inline">التالي</span>
        <ChevronLeft className="w-4 h-4 xs:w-5 xs:h-5" />
      </motion.button>
    </div>
  );
};

export default TaskNavigation;
