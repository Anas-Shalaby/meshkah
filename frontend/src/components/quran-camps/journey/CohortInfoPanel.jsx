import React from "react";
import { Users, Calendar, Trophy, TrendingUp } from "lucide-react";

/**
 * Cohort Info Panel Component
 * Displays cohort information and user stats
 */
const CohortInfoPanel = ({
  cohortNumber,
  cohortName,
  cohortStartDate,
  cohortEndDate,
  totalParticipants = 0,
  userRank = null,
  averageCompletion = 0,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return "غير متاح";
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="w-12 h-12 bg-gradient-to-br from-[#7440E9] to-[#B794F6] rounded-xl flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">معلومات الفوج</h3>
          <p className="text-sm text-gray-500">
            {cohortName || `فوج ${cohortNumber}`}
          </p>
        </div>
      </div>

      {/* Cohort Details */}
      <div className="space-y-4">
        {/* Dates */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
          <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs text-blue-600 font-medium mb-1">
              تواريخ الفوج
            </div>
            <div className="text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">البداية:</span>
                <span className="font-semibold">{formatDate(cohortStartDate)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">النهاية:</span>
                <span className="font-semibold">{formatDate(cohortEndDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-700 font-medium">
              عدد المشتركين
            </span>
          </div>
          <span className="text-lg font-bold text-purple-600">
            {totalParticipants}
          </span>
        </div>

        {/* User Rank */}
        {userRank && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-gray-700 font-medium">
                ترتيبك
              </span>
            </div>
            <span className="text-lg font-bold text-yellow-600">
              #{userRank}
            </span>
          </div>
        )}

        {/* Average Completion */}
        {averageCompletion > 0 && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-700 font-medium">
                متوسط الإكمال
              </span>
            </div>
            <span className="text-lg font-bold text-green-600">
              {averageCompletion}%
            </span>
          </div>
        )}
      </div>

      {/* Notice */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center leading-relaxed">
          💡 أنت ضمن <strong>{cohortName || `فوج ${cohortNumber}`}</strong>.
          التقدم والإحصائيات خاصة بفوجك فقط.
        </p>
      </div>
    </div>
  );
};

export default CohortInfoPanel;
