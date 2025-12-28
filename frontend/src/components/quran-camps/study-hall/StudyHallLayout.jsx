import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import StudyHallTabs from "./StudyHallTabs";
import StudyHallFilters from "./StudyHallFilters";
import ReflectionCard from "./ReflectionCard";
import TrendingSection from "./TrendingSection";
import { StudyHallSkeleton } from "../skeletons/StudyHallSkeleton";

/**
 * Main Study Hall Layout Component
 * Manages state, filtering, and displays all reflections
 */
const StudyHallLayout = ({
  campId,
  cohortNumber,
  cohortName,
  duration_days,
  currentUser,
  // Handlers from parent (CampJourneyInterface)
  getAvatarUrl,
  onUpvote,
  onSave,
  onPledge,
  onDelete,
  onEdit,
  onShareCamp,
  // Initial data
  initialReflections = [],
  isReadOnly = false,
  isCampNotStarted = false,
  campSettings = {},
  selectedDay: propsSelectedDay,
  setSelectedDay: propsSetSelectedDay,
  pagination = null,
  onPageChange = null,
  loading: parentLoading = false,
  loadingMore = false,
  loadMoreRef = null,
  enableInfiniteScroll = false,
  onRetry = null,
}) => {
  // State
  // State (Lifted state pattern for selectedDay)
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  // Use prop if provided, otherwise local state
  const [localSelectedDay, setLocalSelectedDay] = useState(null);
  const effectiveSelectedDay =
    propsSelectedDay !== undefined ? propsSelectedDay : localSelectedDay;
  const handleSetSelectedDay = propsSetSelectedDay || setLocalSelectedDay;

  const [sortBy, setSortBy] = useState("newest");
  const [taskType, setTaskType] = useState("all");

  const [reflections, setReflections] = useState(initialReflections);
  const [filteredReflections, setFilteredReflections] = useState([]);
  const [trendingReflections, setTrendingReflections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [expandedReflections, setExpandedReflections] = useState({});
  const [showUpvoteTooltip, setShowUpvoteTooltip] = useState(false);
  const [showBookmarkTooltip, setShowBookmarkTooltip] = useState(false);
  const [showPledgeTooltip, setShowPledgeTooltip] = useState(false);
  const [pledgingProgressId, setPledgingProgressId] = useState(null);
  const [pledgedSteps, setPledgedSteps] = useState([]);

  // Update reflections when initialReflections change
  useEffect(() => {
    setReflections(initialReflections);
  }, [initialReflections]);

  // Filter and sort reflections based on active filters
  useEffect(() => {
    let filtered = [...reflections];

    // Privacy Filtering:
    // 1. Show PUBLIC reflections from others
    // 2. Show ALL reflections (public & private) from current user
    filtered = filtered.filter(
      (r) =>
        !r.is_private || r.is_own || r.is_private === 0 || r.is_private === "0"
    );

    // Tab filtering
    if (activeTab === "mine") {
      filtered = filtered.filter((r) => r.is_own);
    } else if (activeTab === "saved") {
      filtered = filtered.filter((r) => r.is_saved_by_user || r.isSaved);
    } else if (activeTab === "trending") {
      filtered = filtered.filter((r) => (r.upvote_count || 0) >= 5);
    }

    // Search filtering
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.journal_entry || "").toLowerCase().includes(searchLower) ||
          (r.notes || "").toLowerCase().includes(searchLower) ||
          (r.reflectionText || "").toLowerCase().includes(searchLower) ||
          (r.benefits || "").toLowerCase().includes(searchLower) ||
          (r.content || "").toLowerCase().includes(searchLower) ||
          (r.title || "").toLowerCase().includes(searchLower) ||
          (r.task_title || "").toLowerCase().includes(searchLower) ||
          (r.userName || "").toLowerCase().includes(searchLower)
      );
    }

    // Day filtering - Commented out to rely on backend filtering since parent component fetches data based on selected day
    // if (effectiveSelectedDay) {
    //   filtered = filtered.filter((r) => String(r.day_number) === String(effectiveSelectedDay));
    // }

    // Task type filtering
    if (taskType !== "all") {
      filtered = filtered.filter((r) => r.task_type === taskType);
    }

    // Sorting
    if (sortBy === "newest") {
      filtered.sort(
        (a, b) => new Date(b.completed_at) - new Date(a.completed_at)
      );
    } else if (sortBy === "oldest") {
      filtered.sort(
        (a, b) => new Date(a.completed_at) - new Date(b.completed_at)
      );
    } else if (sortBy === "most_upvoted") {
      filtered.sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0));
    } else if (sortBy === "most_saved") {
      filtered.sort((a, b) => (b.save_count || 0) - (a.save_count || 0));
    }

    setFilteredReflections(filtered);

    // Calculate trending (top 5 most upvoted)
    const trending = [...reflections]
      .filter((r) => (r.upvote_count || 0) > 0)
      .sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0))
      .slice(0, 5);
    setTrendingReflections(trending);
  }, [
    reflections,
    activeTab,
    searchTerm,
    effectiveSelectedDay,
    sortBy,
    taskType,
  ]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    handleSetSelectedDay(null);
    setSortBy("newest");
    setTaskType("all");
  };

  // Calculate tab counts
  const tabCounts = {
    all: reflections.filter(
      (r) =>
        !r.is_private || r.is_own || r.is_private === 0 || r.is_private === "0"
    ).length,
    mine: reflections.filter((r) => r.is_own).length,
    saved: reflections.filter((r) => r.is_saved_by_user || r.isSaved).length,
    trending: reflections.filter((r) => (r.upvote_count || 0) >= 5).length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header - Simplified */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#7440E9]/10 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-[#7440E9]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          قاعة التدارس
        </h1>
        {cohortName && (
          <p className="text-gray-600 font-medium">
            {cohortName || `فوج ${cohortNumber}`}
          </p>
        )}

        {/* Cohort Info Notice - Minimal */}
        <p className="text-xs text-gray-400 mt-2 max-w-lg mx-auto">
          مساحة لتبادل الفوائد والتدبرات بين أعضاء الفوج فقط.
        </p>
      </div>

      {/* Tabs */}
      <StudyHallTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={tabCounts}
      />

      {/* Filters */}
      <StudyHallFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedDay={effectiveSelectedDay}
        setSelectedDay={handleSetSelectedDay}
        daysCount={duration_days || 30}
        sortBy={sortBy}
        setSortBy={setSortBy}
        taskType={taskType}
        setTaskType={setTaskType}
        onClearFilters={handleClearFilters}
      />

      {/* Main Content List - Full Width */}
      <div className="mt-8 space-y-6">
        {/* Loading State - Skeleton */}
        {(loading || parentLoading) && <StudyHallSkeleton count={5} />}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-900 font-semibold mb-1">حدث خطأ</h3>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </button>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading &&
          !parentLoading &&
          !error &&
          filteredReflections.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                لا توجد فوائد حالياً
              </h3>
              <p className="text-gray-500">
                {activeTab === "mine"
                  ? "لم تضف أي فوائد بعد. ابدأ بإضافة تدبراتك!"
                  : activeTab === "saved"
                  ? "لم تحفظ أي فوائد بعد."
                  : searchTerm || effectiveSelectedDay
                  ? "لا توجد نتائج تطابق بحثك. جرب معايير بحث مختلفة."
                  : "لا توجد فوائد في هذا القسم حالياً."}
              </p>
            </div>
          )}

        {/* Reflections List */}
        <AnimatePresence mode="popLayout">
          {!loading &&
            !parentLoading &&
            !error &&
            filteredReflections.map((item, index) => (
              <ReflectionCard
                key={item.id || item.progress_id}
                item={item}
                index={index}
                cohortNumber={cohortNumber}
                cohortName={cohortName}
                isReadOnly={isReadOnly}
                isCampNotStarted={isCampNotStarted}
                campSettings={campSettings}
                currentUser={currentUser}
                getAvatarUrl={getAvatarUrl}
                expandedReflections={expandedReflections}
                setExpandedReflections={setExpandedReflections}
                highlightSearchTermHTML={(text, term) => {
                  if (!term) return text;
                  const regex = new RegExp(`(${term})`, "gi");
                  return text.replace(
                    regex,
                    '<mark class="bg-yellow-200">$1</mark>'
                  );
                }}
                truncateHTML={(text, maxLength) => {
                  const stripped = text.replace(/<[^>]*>/g, "");
                  return stripped.length > maxLength
                    ? stripped.substring(0, maxLength) + "..."
                    : stripped;
                }}
                studyHallSearch={searchTerm}
                onUpvote={onUpvote}
                onSave={onSave}
                onPledge={onPledge}
                showUpvoteTooltip={showUpvoteTooltip}
                showBookmarkTooltip={showBookmarkTooltip}
                showPledgeTooltip={showPledgeTooltip}
                setShowUpvoteTooltip={setShowUpvoteTooltip}
                setShowBookmarkTooltip={setShowBookmarkTooltip}
                setShowPledgeTooltip={setShowPledgeTooltip}
                pledgingProgressId={pledgingProgressId}
                pledgedSteps={pledgedSteps}
                onDelete={onDelete}
                onEdit={onEdit}
                studyHallData={reflections}
                setStudyHallData={setReflections}
                onShareCamp={onShareCamp}
                showShareCamp={false}
              />
            ))}
        </AnimatePresence>

        {/* Infinite Scroll Trigger */}
        {enableInfiniteScroll &&
          loadMoreRef &&
          pagination &&
          pagination.has_next && (
            <div ref={loadMoreRef} className="py-4">
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 text-[#7440E9] animate-spin" />
                  <span className="mr-2 text-gray-600">
                    جاري تحميل المزيد...
                  </span>
                </div>
              )}
            </div>
          )}

        {/* Pagination Controls - Show only if infinite scroll is disabled or as fallback */}
        {pagination &&
          pagination.total_pages > 1 &&
          onPageChange &&
          !enableInfiniteScroll && (
            <div className="flex flex-col sm:flex-row justify-center items-center mt-8 gap-2 sm:gap-4">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={!pagination.has_prev || loading || parentLoading}
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-white/80 backdrop-blur-md shadow-lg border border-purple-100/80 text-[#7440E9] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-transform hover:scale-105 text-sm sm:text-base"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>السابق</span>
              </button>
              <span className="font-bold text-gray-700 text-sm sm:text-base">
                صفحة {pagination.page} من {pagination.total_pages}
              </span>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!pagination.has_next || loading || parentLoading}
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-white/80 backdrop-blur-md shadow-lg border border-purple-100/80 text-[#7440E9] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-transform hover:scale-105 text-sm sm:text-base"
              >
                <span>التالي</span>
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}

        {/* Show pagination info even with infinite scroll */}
        {enableInfiniteScroll && pagination && (
          <div className="flex justify-center items-center mt-4 text-sm text-gray-600">
            <span>
              عرض {filteredReflections.length} من {pagination.total_items} تدبر
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyHallLayout;
