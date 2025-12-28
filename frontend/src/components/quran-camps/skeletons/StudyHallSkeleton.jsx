import { motion } from "framer-motion";

// Skeleton Loader for Study Hall Reflection Cards
export const StudyHallSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-5 md:p-6"
        >
          {/* Header Skeleton */}
          <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {/* Avatar Skeleton */}
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse flex-shrink-0"></div>

              {/* User Info Skeleton */}
              <div className="flex-1 min-w-0">
                <div className="h-4 sm:h-5 w-32 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse"></div>
                <div className="flex gap-2 mt-2">
                  <div className="h-5 w-16 bg-gray-100 rounded-md animate-pulse"></div>
                  <div className="h-5 w-20 bg-gray-100 rounded-md animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Points & Menu Skeleton */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="h-6 w-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="mb-4 space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Proposed Step Skeleton (optional) */}
          {index % 2 === 0 && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          )}

          {/* Footer Skeleton */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Skeleton for Study Hall Filters
export const StudyHallFiltersSkeleton = () => {
  return (
    <div className="bg-white rounded-xl p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-10 flex-1 min-w-[200px] bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
};
