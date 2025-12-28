import React from "react";
import { motion } from "framer-motion";
import {
  Check,
  Lock,
  Circle,
  Star,
  Sparkles,
  Trophy,
  Flame,
} from "lucide-react";

/**
 * Enhanced Day Node Component for Journey Map
 * Represents a single day in the camp with clear visual states
 */
const DayNode = ({
  day,
  dayNumber,
  status, // "completed", "current", "locked", "available"
  isMilestone = false,
  onClick,
  points = 0,
  hasReflection = false,
}) => {
  // Determine colors and styles based on status
  const getStatusConfig = () => {
    switch (status) {
      case "completed":
        return {
          bgColor: "bg-gradient-to-br from-green-400 to-green-600",
          borderColor: "border-green-600",
          icon: Check,
          iconColor: "text-white",
          textColor: "text-green-700",
          shadowColor: "shadow-green-200",
          ringColor: "ring-green-500",
        };
      case "current":
        return {
          bgColor: "bg-gradient-to-br from-blue-400 to-blue-600",
          borderColor: "border-blue-600",
          icon: Circle,
          iconColor: "text-white",
          textColor: "text-blue-700",
          shadowColor: "shadow-blue-300",
          ringColor: "ring-blue-500",
        };
      case "locked":
        return {
          bgColor: "bg-gray-300",
          borderColor: "border-gray-400",
          icon: Lock,
          iconColor: "text-gray-600",
          textColor: "text-gray-400",
          shadowColor: "shadow-gray-200",
          ringColor: "ring-gray-400",
        };
      default: // "available"
        return {
          bgColor: "bg-gradient-to-br from-[#7440E9] to-[#B794F6]",
          borderColor: "border-[#7440E9]",
          icon: Circle,
          iconColor: "text-white",
          textColor: "text-[#7440E9]",
          shadowColor: "shadow-purple-200",
          ringColor: "ring-[#7440E9]",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const isClickable = status !== "locked";

  return (
    <div className="flex flex-col items-center">
      {/* Day Node */}
      <motion.button
        onClick={isClickable ? onClick : undefined}
        disabled={!isClickable}
        className={`
          relative w-16 h-16 rounded-2xl ${config.bgColor} border-2 ${config.borderColor}
          flex items-center justify-center shadow-lg ${config.shadowColor}
          transition-all duration-300
          ${isClickable ? "hover:scale-110 cursor-pointer" : "cursor-not-allowed"}
          ${isMilestone ? "ring-4 " + config.ringColor : ""}
        `}
        whileHover={isClickable ? { scale: 1.1 } : {}}
        whileTap={isClickable ? { scale: 0.95 } : {}}
        animate={
          status === "current"
            ? {
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 10px 25px -5px rgba(59, 130, 246, 0.3)",
                  "0 20px 35px -5px rgba(59, 130, 246, 0.5)",
                  "0 10px 25px -5px rgba(59, 130, 246, 0.3)",
                ],
              }
            : {}
        }
        transition={
          status === "current"
            ? { duration: 2, repeat: Infinity }
            : { duration: 0.3 }
        }
      >
        {/* Day Number */}
        <span className="text-white font-bold text-lg">{dayNumber}</span>

        {/* Status Icon (top-right) */}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
          <Icon className={`w-3 h-3 ${config.iconColor}`} />
        </div>

        {/* Milestone Badge */}
        {isMilestone && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -left-2"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <Trophy className="w-3 h-3 text-white" />
            </div>
          </motion.div>
        )}

        {/* Has Reflection Badge */}
        {hasReflection && status === "completed" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 -right-1"
          >
            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          </motion.div>
        )}

        {/* Points Badge (bottom-left) */}
        {points > 0 && status === "completed" && (
          <div className="absolute -bottom-1.5 -left-1.5 px-1.5 py-0.5 bg-yellow-400 rounded-full text-xs font-bold text-yellow-900 shadow-md border border-white">
            +{points}
          </div>
        )}
      </motion.button>

      {/* Day Label */}
      <div className="mt-2 text-center">
        <p
          className={`text-xs font-semibold ${config.textColor} ${
            status === "locked" ? "line-through" : ""
          }`}
        >
          {day?.title || `اليوم ${dayNumber}`}
        </p>
        {status === "current" && (
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs text-blue-600 font-bold mt-1"
          >
            أنت هنا!
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default DayNode;
