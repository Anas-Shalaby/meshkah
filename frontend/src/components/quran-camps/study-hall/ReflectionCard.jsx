import React from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import StudyHallCard from "../StudyHallCard";

/**
 * Enhanced Reflection Card with Cohort Badge
 * Wraps the existing StudyHallCard with additional cohort-aware features
 */
const ReflectionCard = ({
  item,
  index,
  cohortNumber,
  cohortName,
  ...otherProps
}) => {
  return (
    <div className="relative">
      {/* Cohort Badge */}
      {cohortNumber && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="absolute -top-3 right-2 sm:right-4 z-10"
        >
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-[#7440E9] to-[#B794F6] text-white rounded-full shadow-lg text-[10px] sm:text-xs font-semibold border-2 border-white">
            <Users className="w-3 h-3" />
            <span>
              {cohortName || `فوج ${cohortNumber}`}
            </span>
          </div>
        </motion.div>
      )}

      {/* Day Number Badge (if available) */}
      {item.day_number && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 + 0.1 }}
          className="absolute -top-3 left-2 sm:left-4 z-10"
        >
          <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white text-[#7440E9] rounded-full shadow-lg text-[10px] sm:text-xs font-bold border-2 border-[#7440E9]/20">
            اليوم {item.day_number}
          </div>
        </motion.div>
      )}

      {/* Original StudyHallCard */}
      <StudyHallCard
        item={item}
        index={index}
        {...otherProps}
      />
    </div>
  );
};

export default ReflectionCard;
