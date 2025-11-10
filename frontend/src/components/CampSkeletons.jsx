import { motion } from "framer-motion";

// Skeleton Loader Component for Camp Cards
export const CampCardSkeleton = ({ index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative group min-h-[480px] overflow-hidden rounded-3xl border-2 border-gray-200 p-0 flex flex-col items-center text-center bg-white/90 backdrop-blur-xl"
      style={{
        minHeight: 480,
      }}
    >
      {/* Banner Skeleton */}
      <div className="h-40 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer relative overflow-hidden rounded-t-3xl mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer-x"></div>
      </div>

      {/* Title Skeleton */}
      <div className="h-8 w-3/4 bg-gray-200 rounded-lg animate-pulse mb-4 mx-4"></div>

      {/* Description Skeleton */}
      <div className="w-full px-4 mb-4 space-y-2">
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse mx-auto"></div>
        <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse mx-auto"></div>
      </div>

      {/* Stats Skeleton */}
      <div className="flex items-end justify-center gap-6 mb-4 mt-2 w-full px-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Button Skeleton */}
      <div className="mt-auto pt-4 px-4 pb-4 w-full">
        <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    </motion.div>
  );
};

// Skeleton Loader for Stats Cards
export const StatsCardSkeleton = ({ index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-purple-100"
    >
      <div className="flex items-center justify-center mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
      <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse mb-2 mx-auto"></div>
      <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mx-auto"></div>
    </motion.div>
  );
};

// Skeleton Loader for Search Bar
export const SearchBarSkeleton = () => {
  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-gray-100">
      <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse mb-4"></div>
      <div className="flex gap-4">
        <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    </div>
  );
};
