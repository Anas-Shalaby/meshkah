import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Heart, Bookmark, User } from "lucide-react";

const TrendingSection = ({ trendingReflections = [], onReflectionClick }) => {
  if (!trendingReflections || trendingReflections.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 bg-gradient-to-br from-[#7440E9] to-[#B794F6] rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">الفوائد الرائجة اليوم</h3>
          <p className="text-xs text-gray-500">الأكثر تفاعلاً في آخر 24 ساعة</p>
        </div>
      </div>

      {/* Trending List */}
      <div className="space-y-3">
        {trendingReflections.slice(0, 5).map((reflection, index) => (
          <motion.button
            key={reflection.id || reflection.progress_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onReflectionClick && onReflectionClick(reflection)}
            className="w-full text-right p-3 rounded-xl hover:bg-[#F7F6FB] transition-all group border border-transparent hover:border-[#7440E9]/20"
          >
            {/* Rank Badge */}
            <div className="flex items-start gap-3">
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${
                    index === 0
                      ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
                      : index === 1
                      ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
                      : index === 2
                      ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }
                `}
              >
                {index + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Author */}
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-600 truncate">
                    {reflection.hide_identity
                      ? "مساهم مجهول"
                      : reflection.userName || reflection.user_name || "مساهم"}
                  </span>
                </div>

                {/* Text Preview */}
                <p className="text-sm text-gray-800 line-clamp-2 mb-2 group-hover:text-[#7440E9] transition-colors">
                  {reflection.journal_entry
                    ?.replace(/<[^>]*>/g, "")
                    .substring(0, 80) || "فائدة تدبرية قيمة..."}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {reflection.upvote_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="w-3 h-3" />
                    {reflection.save_count || 0}
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* View all */}
      {trendingReflections.length > 5 && (
        <button className="w-full mt-4 pt-4 border-t border-gray-100 text-sm text-[#7440E9] font-semibold hover:underline">
          عرض المزيد
        </button>
      )}
    </div>
  );
};

export default TrendingSection;
