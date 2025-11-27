import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CampTooltip = ({
  content,
  children,
  position = "top",
  delay = 200,
  disabled = false,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const isMobile = window.innerWidth < 640;

    let top = 0;
    let left = 0;

    // On mobile, prefer bottom position to avoid keyboard issues
    const effectivePosition =
      isMobile && position === "top" ? "bottom" : position;

    switch (effectivePosition) {
      case "top":
        top = triggerRect.top + scrollY - tooltipRect.height - 8;
        left =
          triggerRect.left +
          scrollX +
          triggerRect.width / 2 -
          tooltipRect.width / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + scrollY + 8;
        left =
          triggerRect.left +
          scrollX +
          triggerRect.width / 2 -
          tooltipRect.width / 2;
        break;
      case "left":
        top =
          triggerRect.top +
          scrollY +
          triggerRect.height / 2 -
          tooltipRect.height / 2;
        left = triggerRect.left + scrollX - tooltipRect.width - 8;
        break;
      case "right":
        top =
          triggerRect.top +
          scrollY +
          triggerRect.height / 2 -
          tooltipRect.height / 2;
        left = triggerRect.right + scrollX + 8;
        break;
      default:
        top = triggerRect.top + scrollY - tooltipRect.height - 8;
        left =
          triggerRect.left +
          scrollX +
          triggerRect.width / 2 -
          tooltipRect.width / 2;
    }

    // Adjust for viewport boundaries with better mobile handling
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = isMobile ? 12 : 8;

    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }
    if (top < scrollY + padding) top = scrollY + padding;
    if (top + tooltipRect.height > scrollY + viewportHeight - padding) {
      top = scrollY + viewportHeight - tooltipRect.height - padding;
    }

    setTooltipPosition({ top, left });
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setTimeout(calculatePosition, 10);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleClick = () => {
    if (disabled) return;
    const isMobile = window.innerWidth < 640;
    // On mobile, toggle on click; on desktop, keep hover behavior
    if (isMobile) {
      setIsVisible(!isVisible);
      if (!isVisible) {
        setTimeout(calculatePosition, 10);
      }
    }
  };

  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={className}
        style={{ display: "inline-block" }}
      >
        {children}
      </div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 pointer-events-none"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
            }}
          >
            <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs sm:text-sm rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-xl border border-gray-700 max-w-[85vw] sm:max-w-xs">
              <div className="text-right leading-relaxed" dir="rtl">
                {content}
              </div>
              {/* Arrow */}
              <div
                className={`absolute w-2 h-2 bg-gray-900 dark:bg-gray-800 border-gray-700 transform rotate-45 ${
                  position === "top"
                    ? "bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b"
                    : position === "bottom"
                    ? "top-[-4px] left-1/2 -translate-x-1/2 border-l border-t"
                    : position === "left"
                    ? "right-[-4px] top-1/2 -translate-y-1/2 border-r border-t"
                    : "left-[-4px] top-1/2 -translate-y-1/2 border-l border-b"
                }`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CampTooltip;
