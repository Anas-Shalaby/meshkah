import React from "react";
import { motion } from "framer-motion";

/**
 * DayNodeSVG - Dynamic SVG tent/camp icon for Journey Map
 * Changes color and style based on day status
 */
const DayNodeSVG = ({
  status = "locked", // "completed" | "active" | "incomplete" | "locked"
  progress = 0, // 0-100 completion percentage
  isSelected = false,
  isCelebrating = false,
  size = "md", // "sm" | "md" | "lg"
}) => {
  const sizes = {
    sm: { width: 48, height: 48 },
    md: { width: 56, height: 56 },
    lg: { width: 72, height: 72 },
  };

  const { width, height } = sizes[size] || sizes.md;

  // Color schemes based on status
  const colorSchemes = {
    completed: {
      primary: "#22c55e", // green-500
      secondary: "#16a34a", // green-600
      accent: "#dcfce7", // green-100
      glow: "rgba(34, 197, 94, 0.4)",
    },
    active: {
      primary: "#7440E9", // brand purple
      secondary: "#8B5CF6", // purple-500
      accent: "#F3E8FF", // purple-100
      glow: "rgba(116, 64, 233, 0.4)",
    },
    incomplete: {
      primary: "#f97316", // orange-500
      secondary: "#ea580c", // orange-600
      accent: "#ffedd5", // orange-100
      glow: "rgba(249, 115, 22, 0.3)",
    },
    locked: {
      primary: "#9ca3af", // gray-400
      secondary: "#6b7280", // gray-500
      accent: "#f3f4f6", // gray-100
      glow: "rgba(156, 163, 175, 0.2)",
    },
  };

  const colors = colorSchemes[status] || colorSchemes.locked;

  return (
    <motion.div
      className="relative"
      animate={
        isCelebrating
          ? {
              scale: [1, 1.15, 1],
            }
          : {}
      }
      transition={{ duration: 0.6 }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Background Circle */}
        <circle
          cx="32"
          cy="32"
          r="30"
          fill={`url(#bgGradient-${status})`}
          stroke="white"
          strokeWidth="2"
        />

        {/* Tent Shape */}
        <path
          d="M32 14L48 46H16L32 14Z"
          fill={colors.accent}
          stroke={colors.primary}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Tent Opening */}
        <path
          d="M28 46L32 34L36 46"
          fill={colors.secondary}
          stroke={colors.secondary}
          strokeWidth="1"
          strokeLinejoin="round"
        />

        {/* Tent Pole */}
        <line
          x1="32"
          y1="14"
          x2="32"
          y2="10"
          stroke={colors.secondary}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Flag */}
        <path
          d="M32 10L40 14L32 18"
          fill={colors.primary}
          stroke={colors.primary}
          strokeWidth="1"
        />

        {/* Ground Line */}
        <path
          d="M12 48C16 46 24 47 32 46C40 45 48 47 52 48"
          stroke={colors.secondary}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Progress Arc (for active/incomplete) */}
        {(status === "active" || status === "incomplete") && progress > 0 && (
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={colors.primary}
            strokeWidth="3"
            strokeDasharray={`${(progress / 100) * 176} 176`}
            strokeLinecap="round"
            transform="rotate(-90 32 32)"
            opacity="0.6"
          />
        )}

        {/* Completed Checkmark */}
        {status === "completed" && (
          <g transform="translate(42, 8)">
            <circle cx="8" cy="8" r="10" fill="#22c55e" stroke="white" strokeWidth="2" />
            <path
              d="M5 8L7 10L11 6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* Locked Icon */}
        {status === "locked" && (
          <g transform="translate(42, 8)">
            <circle cx="8" cy="8" r="10" fill="#6b7280" stroke="white" strokeWidth="2" />
            <rect x="5" y="8" width="6" height="5" rx="1" fill="white" />
            <path
              d="M6 8V6C6 4.9 6.9 4 8 4C9.1 4 10 4.9 10 6V8"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        {/* Gradients Definition */}
        <defs>
          <radialGradient id={`bgGradient-${status}`} cx="0.5" cy="0.3" r="0.7">
            <stop offset="0%" stopColor={colors.accent} />
            <stop offset="100%" stopColor="white" />
          </radialGradient>
        </defs>
      </svg>



      {/* Celebration Particles */}
      {isCelebrating && status === "completed" && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-yellow-400"
              initial={{
                x: width / 2,
                y: height / 2,
                scale: 0,
              }}
              animate={{
                x: width / 2 + Math.cos((i * 60 * Math.PI) / 180) * 30,
                y: height / 2 + Math.sin((i * 60 * Math.PI) / 180) * 30,
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
};

export default DayNodeSVG;
