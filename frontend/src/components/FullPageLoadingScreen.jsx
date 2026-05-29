import React, { useContext } from "react";
import { motion } from "framer-motion";
import { Player } from "@lottiefiles/react-lottie-player";
import ThemeContext from "../context/ThemeContext";

const THEMES = {
  night: {
    overlay: "rgba(26,28,34,0.96)",
    card: "#212328",
    cardBorder: "rgba(158,152,219,0.18)",
    text: "#e0e0e0",
    muted: "#9a9aa6",
    accent: "#9e98db",
    glowOpacity1: 0.4,
    glowOpacity2: 0.2,
    shadow: "0_24px_70px_rgba(0,0,0,0.5)",
  },
  light: {
    overlay: "rgba(255,255,255,0.95)",
    card: "#ffffff",
    cardBorder: "rgba(116,64,233,0.12)",
    text: "#24242c",
    muted: "#6b7280",
    accent: "#7440E9",
    glowOpacity1: 0.18,
    glowOpacity2: 0.1,
    shadow: "0_24px_70px_rgba(116,64,233,0.18)",
  },
};

const FullPageLoadingScreen = ({ message = "جاري التحميل..." }) => {
  const ctx = useContext(ThemeContext);
  const isNight = ctx?.isNight ?? false;
  const t = isNight ? THEMES.night : THEMES.light;

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center font-almarai"
      style={{
        backgroundColor: t.overlay,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-[120px]"
        style={{ backgroundColor: t.accent, opacity: t.glowOpacity1 }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 h-64 w-64 rounded-full blur-[120px]"
        style={{ backgroundColor: t.accent, opacity: t.glowOpacity2 }}
      />

      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex flex-col items-center rounded-3xl border px-10 py-12 text-center"
        style={{
          backgroundColor: t.card,
          borderColor: t.cardBorder,
          boxShadow: t.shadow.replace(/_/g, " "),
        }}
      >
        {/* Lottie Animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <Player
            autoplay
            loop
            src="/assets/loading.json"
            style={{
              width: "180px",
              height: "180px",
              margin: "0 auto",
            }}
          />
        </motion.div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h3
            className="text-lg font-bold tracking-tight sm:text-xl"
            style={{ color: t.text }}
          >
            {message}
          </h3>
          <p className="text-sm sm:text-base" style={{ color: t.muted }}>
            يرجى الانتظار قليلاً...
          </p>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-7 flex items-center justify-center gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: t.accent }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default FullPageLoadingScreen;
