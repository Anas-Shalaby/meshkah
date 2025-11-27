import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, Home } from "lucide-react";
import { ARABIC_DAY_ORDINALS } from "../../constants/days.js";
const CampBreadcrumbs = ({ camp, selectedDay, selectedTask, taskGroups }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Build breadcrumb items
  const breadcrumbs = [];

  // Home / Quran Camps
  breadcrumbs.push({
    type: "home",
    label: "المخيمات القرآنية",
    path: "/quran-camps",
    icon: Home,
  });

  // Camp
  if (camp) {
    breadcrumbs.push({
      type: "camp",
      label: camp.name,
      path: `/quran-camps/${camp.id}`,
    });
  }
  // Day (if selected)
  if (selectedDay) {
    breadcrumbs.push({
      type: "day",
      label: selectedDay,
      path: null, // Not clickable, just for display
    });
  }

  // Task Group (if task has a group)
  if (selectedTask?.group_id && taskGroups) {
    const group = taskGroups.find((g) => g.id === selectedTask.group_id);
    if (group) {
      breadcrumbs.push({
        label: group.title,
        path: null, // Not clickable, just for display
      });
    }
  }

  // Task (if selected)
  if (selectedTask) {
    breadcrumbs.push({
      label: selectedTask.title,
      path: null, // Not clickable, just for display
    });
  }

  if (breadcrumbs.length <= 1) {
    return null;
  }

  // For mobile: show only last 2 items, for desktop: show all
  const getVisibleBreadcrumbs = () => {
    if (breadcrumbs.length <= 2) return breadcrumbs;

    // On mobile, show only last 2 items with "..." at the start
    if (isMobile && breadcrumbs.length > 2) {
      return [
        { label: "...", path: null, isEllipsis: true },
        ...breadcrumbs.slice(-2),
      ];
    }

    return breadcrumbs;
  };
  const formatDayLabel = (dayNumber) => {
    const numericDay = Number(dayNumber);
    if (!Number.isFinite(numericDay) || numericDay <= 0)
      return `اليوم ${dayNumber}`;
    const ordinal = ARABIC_DAY_ORDINALS[numericDay];
    return ordinal ? `اليوم ${ordinal}` : `اليوم ${numericDay}`;
  };
  const visibleBreadcrumbs = getVisibleBreadcrumbs();
  return (
    <nav
      className="flex items-center gap-1 text-[10px] xs:text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3 overflow-x-auto scrollbar-hide px-1"
      dir="rtl"
      aria-label="مسار التنقل"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {visibleBreadcrumbs.map((crumb, index) => {
        const isLast = index === visibleBreadcrumbs.length - 1;
        const Icon = crumb.icon;
        const isEllipsis = crumb.isEllipsis;
        return (
          <React.Fragment key={index}>
            {isEllipsis ? (
              <span className="text-gray-400 px-1 flex-shrink-0">...</span>
            ) : crumb.path && !isLast && crumb.type !== "day" ? (
              <Link
                to={crumb.path}
                className="flex items-center gap-0.5 xs:gap-1 hover:text-purple-600 hover:underline transition-colors whitespace-nowrap flex-shrink-0 px-1 py-0.5 rounded active:bg-gray-100"
              >
                {Icon && (
                  <Icon className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                )}
                <span className="truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[200px] text-[10px] xs:text-xs sm:text-sm">
                  {crumb.type === "day"
                    ? formatDayLabel(crumb.label)
                    : crumb.label}
                </span>
              </Link>
            ) : (
              <span
                className={`flex items-center gap-0.5 xs:gap-1 whitespace-nowrap flex-shrink-0 px-1 ${
                  isLast ? "text-gray-800 font-semibold" : "text-gray-500"
                }`}
              >
                {Icon && (
                  <Icon className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                )}
                <span className="truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[200px] text-[10px] xs:text-xs sm:text-sm">
                  {crumb.type === "day"
                    ? formatDayLabel(crumb.label)
                    : crumb.label}
                </span>
              </span>
            )}
            {!isLast && !isEllipsis && (
              <ChevronLeft className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-gray-400 mx-0.5 flex-shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default CampBreadcrumbs;
