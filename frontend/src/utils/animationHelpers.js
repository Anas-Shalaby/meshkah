/**
 * دوال مساعدة للرسوم المتحركة
 */

/**
 * إنشاء تأثير typing للنصوص
 */
export const createTypingAnimation = (text, speed = 50) => {
  let currentIndex = 0;
  let currentText = "";

  const animate = (callback) => {
    if (currentIndex < text.length) {
      currentText += text[currentIndex];
      callback(currentText);
      currentIndex++;
      setTimeout(() => animate(callback), speed);
    }
  };

  return animate;
};

/**
 * تأثير glow متحرك
 */
export const getGlowAnimation = (color = "#7440E9") => {
  return {
    boxShadow: [
      `0 0 10px ${color}40`,
      `0 0 20px ${color}60`,
      `0 0 30px ${color}80`,
      `0 0 20px ${color}60`,
      `0 0 10px ${color}40`,
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };
};

/**
 * تأثير sparkle متحرك
 */
export const createSparklePosition = (index, total) => {
  const angle = (index / total) * Math.PI * 2;
  const radius = 100 + Math.random() * 50;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return {
    x,
    y,
    scale: [0, 1, 0],
    opacity: [0, 1, 0],
    transition: {
      duration: 2 + Math.random() * 1,
      repeat: Infinity,
      delay: Math.random() * 2,
    },
  };
};

/**
 * تأثير bounce للمكونات
 */
export const bounceAnimation = {
  initial: { opacity: 0, scale: 0.3 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25,
    },
  },
};

/**
 * تأثير stagger للأطفال
 */
export const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

/**
 * تأثير progress bar متحرك
 */
export const getProgressAnimation = (percentage, delay = 0) => {
  return {
    initial: { width: 0 },
    animate: { width: `${percentage}%` },
    transition: {
      duration: 1.5,
      delay,
      ease: "easeOut",
    },
  };
};

/**
 * تأثير fade in مع scale
 */
export const fadeInScale = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 },
};

/**
 * تأثير slide in من الاتجاه
 */
export const slideIn = (direction = "right", distance = 50) => {
  const directions = {
    right: { x: distance, y: 0 },
    left: { x: -distance, y: 0 },
    up: { x: 0, y: -distance },
    down: { x: 0, y: distance },
  };

  return {
    initial: { ...directions[direction], opacity: 0 },
    animate: { x: 0, y: 0, opacity: 1 },
    transition: { duration: 0.6 },
  };
};
