"use client";

import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Activity {
  id: string;
  type: "memorize" | "review" | "complete_plan";
  description: string;
  timestamp: string;
  details?: {
    planName?: string;
    hadithTitle?: string;
    points?: number;
  };
}

interface RecentActivityProps {
  activities: Activity[];
  detailed?: boolean;
}

export function RecentActivity({
  activities,
  detailed = false,
}: RecentActivityProps) {
  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "memorize":
        return "📚";
      case "review":
        return "🔄";
      case "complete_plan":
        return "🎯";
      default:
        return "📝";
    }
  };

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "memorize":
        return "text-blue-500";
      case "review":
        return "text-green-500";
      case "complete_plan":
        return "text-purple-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="space-y-8">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start">
          <div className="mr-4 mt-1">
            <span className="text-2xl">{getActivityIcon(activity.type)}</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">
              {activity.description}
            </p>
            {detailed && activity.details && (
              <div className="text-sm text-muted-foreground">
                {activity.details.planName && (
                  <p>الخطة: {activity.details.planName}</p>
                )}
                {activity.details.hadithTitle && (
                  <p>الحديث: {activity.details.hadithTitle}</p>
                )}
                {activity.details.points && (
                  <p className={getActivityColor(activity.type)}>
                    +{activity.details.points} نقطة
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {format(new Date(activity.timestamp), "PPP", { locale: ar })}
            </p>
          </div>
        </div>
      ))}
      {activities.length === 0 && (
        <div className="text-center text-muted-foreground">
          لا يوجد نشاط حديث
        </div>
      )}
    </div>
  );
}
