import React, { useMemo } from "react";
import { motion } from "framer-motion";
import MilestoneIndicator from "./MilestoneIndicator";

/**
 * Progress Bar Component for Journey Map
 * Shows overall progress with percentage and milestones
 */
const ProgressBar = ({
  completed,
  total,
  streak = 0,
  points = 0,
  completedTasks = 0,
  totalTasks = 0,
  campDays = 0,
}) => {
  // Calculate percentage based on tasks if provided, otherwise use days
  const percentage = useMemo(() => {
    if (totalTasks > 0) {
      return Math.round((completedTasks / totalTasks) * 100);
    }
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [completedTasks, totalTasks, completed, total]);

  // Calculate milestone achievements
  const milestones = useMemo(() => {
    const totalDays = campDays || total;
    if (!totalDays || totalDays < 4) return [];

    const quarter = Math.floor(totalDays * 0.25);
    const half = Math.floor(totalDays * 0.5);
    const threeQuarters = Math.floor(totalDays * 0.75);

    const completedDaysCount = completed || 0;

    return [
      {
        type: "quarter",
        day: quarter,
        achieved: completedDaysCount >= quarter,
      },
      {
        type: "half",
        day: half,
        achieved: completedDaysCount >= half,
      },
      {
        type: "three-quarters",
        day: threeQuarters,
        achieved: completedDaysCount >= threeQuarters,
      },
      {
        type: "complete",
        day: totalDays,
        achieved: completedDaysCount >= totalDays,
      },
    ];
  }, [campDays, total, completed]);

  // Use tasks count if available, otherwise use days
  const displayCompleted = totalTasks > 0 ? completedTasks : completed;
  const displayTotal = totalTasks > 0 ? totalTasks : total;
  const displayLabel = totalTasks > 0 ? "مهمة مكتملة" : "يوماً مكتملة";

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 mb-6">
      {/* Header with percentage */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-semibold text-gray-700">
          تقدمك في المخيم
        </span>
        <span className="text-xs sm:text-sm font-bold text-[#7440E9]">
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#7440E9] to-[#B794F6] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      {/* Completion Stats */}
      <div className="flex justify-between mt-1.5 text-[10px] sm:text-xs text-gray-500">
        <span>
          {displayCompleted} {displayLabel}
        </span>
        <span>من أصل {displayTotal}</span>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-around gap-2">
            {milestones.map((milestone) => (
              <MilestoneIndicator
                key={milestone.type}
                type={milestone.type}
                achieved={milestone.achieved}
                dayNumber={milestone.day}
                campDays={campDays || total}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
