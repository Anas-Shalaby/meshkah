import React from "react";
import { motion } from "framer-motion";

/**
 * Progress Bar Component for Journey Map
 * Shows overall progress with percentage
 */
const ProgressBar = ({ completed, total, streak = 0, points = 0 }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">التقدم الإجمالي</h3>
          <p className="text-sm text-gray-500">
            {completed} من {total} يوماً مكتملة
          </p>
        </div>
        <div className="text-4xl font-bold text-[#7440E9]">{percentage}%</div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
        <motion.div
          className="absolute top-0 right-0 h-full bg-gradient-to-l from-[#7440E9] to-[#B794F6] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Milestone Markers */}
        {[25, 50, 75].map((milestone) => (
          <div
            key={milestone}
            className="absolute top-0 bottom-0 w-1 bg-white/50"
            style={{ right: `${100 - milestone}%` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
              {milestone}%
            </div>
          </div>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Days Completed */}
        <div className="text-center p-3 bg-green-50 rounded-xl border border-green-200">
          <div className="text-2xl font-bold text-green-600">{completed}</div>
          <div className="text-xs text-green-700 font-medium">أيام مكتملة</div>
        </div>

        {/* Current Streak */}
        <div className="text-center p-3 bg-orange-50 rounded-xl border border-orange-200">
          <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
            🔥 {streak}
          </div>
          <div className="text-xs text-orange-700 font-medium">أيام متتالية</div>
        </div>

        {/* Total Points */}
        <div className="text-center p-3 bg-purple-50 rounded-xl border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">⭐ {points}</div>
          <div className="text-xs text-purple-700 font-medium">نقاطك</div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
