import React from "react";
import { motion } from "framer-motion";
import { Trophy, Target, Star, Award } from "lucide-react";

/**
 * Milestone Marker Component
 * Special markers for significant days (10, 20, 30)
 */
const MilestoneMarker = ({ dayNumber, title, achieved = false, description }) => {
  const milestones = {
    10: {
      icon: Target,
      color: "from-blue-400 to-blue-600",
      title: "معلم الثبات",
      description: "10 أيام من الالتزام!",
    },
    20: {
      icon: Star,
      color: "from-purple-400 to-purple-600",
      title: "نصف الطريق",
      description: "وصلت لمنتصف الرحلة!",
    },
    30: {
      icon: Award,
      color: "from-yellow-400 to-yellow-600",
      title: "إتمام الرحلة",
      description: "مبروك! أنهيت المخيم!",
    },
  };

  const milestone = milestones[dayNumber] || {
    icon: Trophy,
    color: "from-green-400 to-green-600",
    title: title || "معلم خاص",
    description: description || "إنجاز رائع!",
  };

  const Icon = milestone.icon;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`
        relative p-4 rounded-2xl border-2
        ${
          achieved
            ? `bg-gradient-to-br ${milestone.color} border-white shadow-xl`
            : "bg-white border-gray-300 shadow-lg"
        }
        cursor-pointer transition-all duration-300
      `}
    >
      {/* Icon */}
      <div
        className={`
        w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto
        ${achieved ? "bg-white/20" : `bg-gradient-to-br ${milestone.color}`}
      `}
      >
        <Icon
          className={`w-6 h-6 ${achieved ? "text-white" : "text-white"}`}
        />
      </div>

      {/* Content */}
      <div className="text-center">
        <h4
          className={`text-sm font-bold mb-1 ${
            achieved ? "text-white" : "text-gray-800"
          }`}
        >
          {milestone.title}
        </h4>
        <p
          className={`text-xs ${
            achieved ? "text-white/90" : "text-gray-600"
          }`}
        >
          {milestone.description}
        </p>
        <div
          className={`mt-2 text-xs font-bold ${
            achieved ? "text-white" : "text-gray-500"
          }`}
        >
          اليوم {dayNumber}
        </div>
      </div>

      {/* Achievement Badge */}
      {achieved && (
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="absolute -top-3 -right-3"
        >
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-400">
            <span className="text-lg">✅</span>
          </div>
        </motion.div>
      )}

      {/* Locked Badge */}
      {!achieved && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center shadow-md border-2 border-white">
          <span className="text-sm">🔒</span>
        </div>
      )}
    </motion.div>
  );
};

export default MilestoneMarker;
