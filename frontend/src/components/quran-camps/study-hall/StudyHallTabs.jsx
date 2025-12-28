import React from "react";
import { motion } from "framer-motion";
import {
  Home,
  User,
  Bookmark,
  TrendingUp,
  Calendar,
} from "lucide-react";

const StudyHallTabs = ({ activeTab, setActiveTab, counts = {} }) => {
  const tabs = [
    {
      id: "all",
      label: "الكل",
      icon: Home,
      count: counts.all || 0,
    },
    {
      id: "mine",
      label: "فوائدي",
      icon: User,
      count: counts.mine || 0,
    },
    {
      id: "saved",
      label: "المحفوظة",
      icon: Bookmark,
      count: counts.saved || 0,
    },

    
  
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 sm:p-2 mb-4 sm:mb-6">
      <div className="flex items-center justify-center sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl
                transition-all duration-300 whitespace-nowrap
                border border-transparent flex-shrink-0
                ${
                  isActive
                    ? "bg-[#7440E9] text-white shadow-md shadow-purple-200/50"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-100"
                }
              `}
            >
              <Icon className={`w-5 h-5 sm:w-4 sm:h-4 ${isActive ? "text-white" : "text-gray-500"}`} />
              <span className="font-semibold text-sm hidden sm:block">{tab.label}</span>
              
              {/* Count badge */}
              {tab.count !== null && tab.count > 0 && (
                <span
                  className={`
                    px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold
                    ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#7440E9]/10 text-[#7440E9]"
                    }
                  `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StudyHallTabs;
