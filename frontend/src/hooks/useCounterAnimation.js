import { useEffect, useRef, useState } from "react";

/**
 * Hook لإنشاء تأثير عدّاد متحرك للأرقام
 * @param {number} endValue - القيمة النهائية
 * @param {number} duration - مدة التحريك بالمللي ثانية
 * @param {boolean} startAnimation - بدء التحريك تلقائياً
 * @returns {number} القيمة الحالية المتحركة
 */
export const useCounterAnimation = (
  endValue,
  duration = 2000,
  startAnimation = true
) => {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    if (!startAnimation || endValue === 0) {
      setCount(0);
      return;
    }

    setIsAnimating(true);
    setCount(0);

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min(
        (timestamp - startTimeRef.current) / duration,
        1
      );

      // استخدام easing function لتأثير سلس
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(easeOutQuart * endValue);

      setCount(currentValue);

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setCount(endValue);
        setIsAnimating(false);
        startTimeRef.current = null;
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [endValue, duration, startAnimation]);

  return { count, isAnimating };
};

export default useCounterAnimation;
