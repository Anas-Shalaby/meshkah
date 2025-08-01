"use client";

import { useEffect, useState } from "react";
import { dashboardService } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PlanAnalyticsProps {
  planId: number;
}

interface Analytics {
  total_users: number;
  active_users: number;
  completed_hadiths: number;
  total_hadiths: number;
  average_completion_rate: number;
  recent_activity: {
    user_id: number;
    user_name: string;
    action: string;
    timestamp: string;
  }[];
}

export default function PlanAnalytics({ planId }: PlanAnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await dashboardService.getPlanAnalytics(planId);
        setAnalytics(data);
        setError(null);
      } catch (err) {
        setError("فشل في تحميل البيانات");
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [planId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
        <Card className="p-4">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return <Card className="p-4 text-center text-red-500">{error}</Card>;
  }

  if (!analytics) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            إجمالي المستخدمين
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.total_users}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            المستخدمين النشطين
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.active_users}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            الأحاديث المكتملة
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.completed_hadiths} / {analytics.total_hadiths}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            معدل الإكمال
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.average_completion_rate}%
          </p>
        </Card>
      </div>
    </div>
  );
}
