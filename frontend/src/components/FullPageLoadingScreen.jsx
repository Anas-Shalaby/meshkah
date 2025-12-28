import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const FullPageLoadingScreen = ({ message = "جاري التحميل..." }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-md flex items-center justify-center"
    >
      <div className="text-center">
        {/* Animated Logo/Icon */}
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: {
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            },
            scale: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6"
        >
          <div className="relative w-full h-full">
            {/* Outer ring */}
            <div className="absolute inset-0 border-4 border-[#7440E9]/20 rounded-full"></div>
            {/* Spinning ring */}
            <div className="absolute inset-0 border-4 border-[#7440E9] rounded-full border-t-transparent animate-spin"></div>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-[#7440E9]" />
            </div>
          </div>
        </motion.div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
            {message}
          </h3>
          <p className="text-sm sm:text-base text-gray-500">
            يرجى الانتظار قليلاً...
          </p>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 mt-6"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-[#7440E9] rounded-full"
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FullPageLoadingScreen;
