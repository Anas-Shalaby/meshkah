import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  MapPin,
  BookOpen,
  MessageSquare,
  FileText,
  Users,
  LayoutDashboard,
  FolderOpen,
} from "lucide-react";
import CampTooltip from "../ui/CampTooltip";

const CampTabs = ({
  tabs,
  activeTab,
  setActiveTab,
  handleOnboarding,
  setShowStudyHallIntro,
  setShowJournalIntro,
  campId,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabRefs = useRef({});
  const isInitialMount = useRef(true);

  // Sync activeTab with URL query params only on initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const tabFromUrl = searchParams.get("tab");
      if (tabFromUrl && tabs.find((t) => t.id === tabFromUrl)) {
        if (tabFromUrl !== activeTab) {
          // Save scroll position before changing tab
          const scrollY = window.scrollY;
          handleTabClick(tabFromUrl, false);
          // Restore scroll position
          requestAnimationFrame(() => {
            window.scrollTo({ top: scrollY, behavior: "instant" });
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle if not typing in an input/textarea
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      // Arrow keys for tab navigation
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const currentIndex = tabs.findIndex((t) => t.id === activeTab);
        if (currentIndex === -1) return;

        let newIndex;
        if (e.key === "ArrowRight") {
          // RTL: ArrowRight goes to previous tab
          newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        } else {
          // RTL: ArrowLeft goes to next tab
          newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        }

        const newTab = tabs[newIndex];
        if (newTab) {
          handleTabClick(newTab.id, false);
          // Focus the tab button without scrolling
          if (tabRefs.current[newTab.id]) {
            tabRefs.current[newTab.id].focus({ preventScroll: true });
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, tabs]);

  const getTabTooltip = (tabId) => {
    const tooltips = {
      journey: "خريطة الرحلة - عرض جميع أيام المخيم والمهام",
      study: "قاعة التدارس - التفاعل الجماعي ومشاركة التدبرات",
      resources: "الموارد - مصادر تعليمية متنوعة لدعم رحلتك",
      my_journal: "سجلي - سجل تدبرك وأفكارك الشخصية",
      friends: "الصحبة - التفاعل مع المشاركين الآخرين",
    };
    return tooltips[tabId] || "";
  };

  const handleTabClick = (tabId, updateUrl = true, e) => {
    // Prevent default behavior and stop propagation to avoid page scroll
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Save current scroll position immediately
    const scrollY =
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop;

    // Function to restore scroll position with multiple attempts
    const restoreScroll = () => {
      // Multiple attempts to ensure scroll is restored
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: "instant" });
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollY, behavior: "instant" });
          setTimeout(() => {
            window.scrollTo({ top: scrollY, behavior: "instant" });
          }, 10);
        });
      });
    };

    // Update URL first without causing scroll
    if (updateUrl) {
      // Use replace to avoid adding to history and causing scroll
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", tabId);
      // Use history.replaceState to avoid scroll
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${newParams.toString()}`
      );
    }

    // Set active tab immediately
    if (tabId === "study") {
      setActiveTab("study");
      if (campId) {
        localStorage.setItem(`camp-${campId}-activeTab`, "study");
      }
      handleOnboarding("studyHall", setShowStudyHallIntro, () => {
        // Restore scroll position after onboarding
        restoreScroll();
      });
    } else if (tabId === "my_journal") {
      setActiveTab("my_journal");
      if (campId) {
        localStorage.setItem(`camp-${campId}-activeTab`, "my_journal");
      }
      handleOnboarding("journal", setShowJournalIntro, () => {
        // Restore scroll position after onboarding
        restoreScroll();
      });
    } else {
      setActiveTab(tabId);
      if (campId) {
        localStorage.setItem(`camp-${campId}-activeTab`, tabId);
      }
    }

    // Always restore scroll position immediately
    restoreScroll();
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-1.5 lg:p-2 shadow-lg border border-gray-100 mb-3 sm:mb-4 lg:mb-8">
      {/* Mobile: Grid Layout */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:hidden gap-1.5 sm:gap-2">
        {tabs.map((tab) => (
          <CampTooltip
            key={tab.id}
            content={getTabTooltip(tab.id)}
            position="top"
          >
            <button
              ref={(el) => (tabRefs.current[tab.id] = el)}
              onClick={(e) => handleTabClick(tab.id, true, e)}
              data-tour={`${tab.id}-tab`}
              className={`flex focus:outline-none focus-visible:outline-2 focus-visible:outline-[#7440E9] focus-visible:outline-offset-2 focus:ring-0 focus-visible:ring-0 flex-col items-center justify-center p-2 sm:p-2.5 rounded-lg font-medium transition-all duration-300 active:scale-95 relative w-full ${
                activeTab === tab.id
                  ? "text-[#7440E9] bg-[#7440E9]/10 shadow-sm"
                  : "text-gray-600 active:text-gray-800 active:bg-gray-50"
              }`}
              aria-label={tab.label}
              aria-selected={activeTab === tab.id}
              role="tab"
              type="button"
            >
              <div className="relative">
                <tab.icon className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0 mb-1" />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#7440E9] text-white text-[10px] rounded-full font-semibold flex items-center justify-center border-2 border-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs text-center leading-tight mt-0.5 line-clamp-2">
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="mobileTabIndicator"
                  className="absolute bottom-0 inset-x-0 mx-auto w-8 h-0.5 bg-[#7440E9] rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          </CampTooltip>
        ))}
      </div>

      {/* Desktop: Horizontal Tabs */}
      <div className="hidden lg:flex lg:justify-between lg:items-stretch gap-1 relative overflow-x-auto scrollbar-hide pb-1">
        {tabs.map((tab) => (
          <CampTooltip
            key={tab.id}
            content={getTabTooltip(tab.id)}
            position="bottom"
          >
            <button
              ref={(el) => (tabRefs.current[tab.id] = el)}
              onClick={(e) => handleTabClick(tab.id, true, e)}
              data-tour={`${tab.id}-tab`}
              className={`flex-1 focus:outline-none focus-visible:outline-2 focus-visible:outline-[#7440E9] focus-visible:outline-offset-2 focus:ring-0 focus-visible:ring-0 flex items-center justify-center px-3 lg:px-8 xl:px-20 py-2.5 lg:py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap active:scale-95 relative ${
                activeTab === tab.id
                  ? "text-[#7440E9] bg-[#7440E9]/10 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
              aria-label={tab.label}
              aria-selected={activeTab === tab.id}
              role="tab"
              type="button"
            >
              <tab.icon className="w-5 lg:w-5 mr-1.5 lg:mr-2 flex-shrink-0" />
              <span className="text-sm xl:text-base truncate">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="mr-1 px-1.5 py-0.5 bg-[#7440E9] text-white text-xs rounded-full font-semibold min-w-[18px] text-center">
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="desktopTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7440E9] rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          </CampTooltip>
        ))}
      </div>
    </div>
  );
};

export default CampTabs;
