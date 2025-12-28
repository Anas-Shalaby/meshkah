import React from "react";
import { motion } from "framer-motion";
import { Star, Trophy, Zap, Crown } from "lucide-react";

/**
 * MilestoneIndicator - Small milestone badge for Journey Map
 * Shows at 25%, 50%, 75%, 100% of camp progress
 */
const MilestoneIndicator = ({ 
  type, // "quarter" | "half" | "three-quarters" | "complete"
  achieved = false,
  dayNumber,
  campDays,
  className = ""
}) => {
  const milestones = {
    quarter: {
      icon: Zap,
      color: "from-blue-400 to-blue-600",
      bgColor: "bg-blue-500",
      label: "ربع الرحلة",
      emoji: "⚡",
    },
    half: {
      icon: Star,
      color: "from-purple-400 to-purple-600",
      bgColor: "bg-purple-500",
      label: "نصف الرحلة",
      emoji: "⭐",
    },
    "three-quarters": {
      icon: Trophy,
      color: "from-orange-400 to-orange-600",
      bgColor: "bg-orange-500",
      label: "ثلاثة أرباع",
      emoji: "🏆",
    },
    complete: {
      icon: Crown,
      color: "from-yellow-400 to-yellow-600",
      bgColor: "bg-yellow-500",
      label: "إتمام الرحلة",
      emoji: "👑",
    },
  };

  const milestone = milestones[type] || milestones.quarter;
  const Icon = milestone.icon;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      className={`relative flex flex-col items-center ${className}`}
    >
      {/* Milestone Badge */}
      <div
        className={`
          relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
          transition-all duration-300 cursor-pointer
          ${achieved 
            ? `bg-gradient-to-br ${milestone.color} shadow-lg ring-2 ring-white` 
            : "bg-gray-200 shadow-md"
          }
        `}
        title={milestone.label}
      >
        {achieved ? (
          <span className="text-sm sm:text-base">{milestone.emoji}</span>
        ) : (
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        )}
        
        {/* Achievement glow */}
        {achieved && (
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${milestone.color} opacity-30 -z-10`}
          />
        )}
      </div>
      
      {/* Label */}
      <span 
        className={`
          text-[9px] sm:text-[10px] font-semibold mt-1 text-center whitespace-nowrap
          ${achieved ? "text-gray-700" : "text-gray-400"}
        `}
      >
        {milestone.label}
      </span>
    </motion.div>
  );
};

/**
 * Get milestone days for a given camp duration
 */
export const getMilestoneDays = (campDays) => {
  if (!campDays || campDays < 4) return [];
  
  const milestones = [];
  const quarter = Math.floor(campDays * 0.25);
  const half = Math.floor(campDays * 0.5);
  const threeQuarters = Math.floor(campDays * 0.75);
  
  if (quarter > 0) milestones.push({ day: quarter, type: "quarter" });
  if (half > 0 && half !== quarter) milestones.push({ day: half, type: "half" });
  if (threeQuarters > 0 && threeQuarters !== half) milestones.push({ day: threeQuarters, type: "three-quarters" });
  milestones.push({ day: campDays, type: "complete" });
  
  return milestones;
};

export default MilestoneIndicator;
