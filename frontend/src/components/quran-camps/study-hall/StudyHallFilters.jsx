import React, { useState, useEffect } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const StudyHallFilters = ({
  searchTerm,
  setSearchTerm,
  selectedDay,
  setSelectedDay,
  sortBy,
  setSortBy,
  taskType,
  setTaskType,
  daysCount,
  onClearFilters,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Debounce search
  const [localSearch, setLocalSearch] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, setSearchTerm]);

  const sortOptions = [
    { value: "newest", label: "الأحدث" },
    { value: "oldest", label: "الأقدم" },
    { value: "most_upvoted", label: "الأكثر إعجاباً" },
    { value: "most_saved", label: "الأكثر حفظاً" },
  ];

  const taskTypes = [
    { value: "all", label: "جميع الأنواع" },
    { value: "reading", label: "تلاوة" },
    { value: "memorization", label: "حفظ" },
    { value: "tafseer", label: "تفسير" },
    { value: "reflection", label: "تدبر" },
  ];

  const hasActiveFilters = searchTerm || selectedDay || sortBy !== "newest" || taskType !== "all";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 flex-wrap">
        {/* Search */}
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="ابحث في الفوائد..."
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7440E9]/20 focus:border-[#7440E9] transition-all"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Day Filter - Exposed Directly */}
        <div className="relative min-w-[140px]">
           <select
            value={selectedDay || ""}
            onChange={(e) =>
              setSelectedDay(e.target.value ? parseInt(e.target.value) : null)
            }
            className="w-full appearance-none px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7440E9]/20 focus:border-[#7440E9] transition-all bg-white cursor-pointer"
          >
            <option value="">جميع الأيام</option>
            {Array.from({ length: daysCount }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                اليوم {day}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>



        {/* Sort */}
        <div className="relative min-w-[150px]">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full appearance-none px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7440E9]/20 focus:border-[#7440E9] transition-all bg-white cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-medium whitespace-nowrap"
          >
            مسح الفلاتر
          </button>
        )}
      </div>
    </div>
  );
};

export default StudyHallFilters;
