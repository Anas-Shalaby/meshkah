import { motion } from "framer-motion";

// Skeleton Loader for Journal Cards
export const JournalSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gradient-to-br from-[#F7F6FB] to-[#F3EDFF] rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-[#7440E9]/20 shadow-md"
        >
          {/* Header Skeleton */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="h-5 w-40 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Footer Skeleton */}
          <div className="flex items-center justify-between pt-4 border-t border-[#7440E9]/10">
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Skeleton for Pledge Cards
export const PledgeSkeleton = ({ count = 2 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gradient-to-br from-[#F7F6FB] to-[#F3EDFF] rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-[#7440E9]/20 shadow-md"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#7440E9]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-5 w-32 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mb-3"></div>
              <div className="bg-white/60 rounded-lg p-3 sm:p-4 mb-3 border border-[#7440E9]/10">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
