import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Home, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const Breadcrumb = ({ items }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Build all breadcrumbs
  const allBreadcrumbs = [{ label: "الرئيسية", to: "/", icon: Home }, ...items];

  // For mobile: show only last 2 items, for desktop: show all
  const getVisibleBreadcrumbs = () => {
    if (allBreadcrumbs.length <= 2) return allBreadcrumbs;

    // On mobile, show only last 2 items with "..." at the start
    if (isMobile && allBreadcrumbs.length > 2) {
      return [
        { label: "...", to: null, isEllipsis: true },
        ...allBreadcrumbs.slice(-2),
      ];
    }

    return allBreadcrumbs;
  };

  const visibleBreadcrumbs = getVisibleBreadcrumbs();

  return (
    <nav
      className="flex items-center gap-0.5 xs:gap-1 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide px-1"
      aria-label="breadcrumb"
      dir="rtl"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {visibleBreadcrumbs.map((item, index) => {
        const isLast = index === visibleBreadcrumbs.length - 1;
        const isEllipsis = item.isEllipsis;
        const Icon = item.icon;

        return (
          <React.Fragment key={index}>
            {isEllipsis ? (
              <span className="text-gray-400 px-1 flex-shrink-0 text-[10px] xs:text-xs">
                ...
              </span>
            ) : item.to ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
                className="flex items-center gap-0.5 xs:gap-1 sm:gap-2 flex-shrink-0"
              >
                {index > 0 && (
                  <ChevronLeft className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-gray-300 mx-0.5 flex-shrink-0" />
                )}
                <Link
                  to={item.to}
                  className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 rounded-lg text-[10px] xs:text-xs sm:text-sm font-medium text-gray-600 hover:text-[#7440E9] hover:bg-[#7440E9]/5 active:bg-[#7440E9]/10 transition-all duration-200 group"
                >
                  {Icon && (
                    <Icon className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  )}
                  {index === 1 && !isMobile && (
                    <motion.div
                      whileHover={{ rotate: 15, scale: 1.2 }}
                      transition={{ duration: 0.3 }}
                    >
                      <BookOpen className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    </motion.div>
                  )}
                  <span className="truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[200px]">
                    {item.label}
                  </span>
                </Link>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
                className="flex items-center gap-0.5 xs:gap-1 sm:gap-2 flex-shrink-0"
              >
                {index > 0 && (
                  <ChevronLeft className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-gray-300 mx-0.5 flex-shrink-0" />
                )}
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 + 0.2 }}
                  className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 px-2 xs:px-3 sm:px-4 py-1 xs:py-1.5 rounded-lg bg-gradient-to-r from-[#7440E9]/10 to-[#8B5CF6]/10 border border-[#7440E9]/20"
                >
                  <span className="text-[10px] xs:text-xs sm:text-sm font-bold text-[#7440E9] truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[200px]">
                    {item.label}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
