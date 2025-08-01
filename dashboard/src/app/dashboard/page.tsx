"use client";

import { useEffect, useState } from "react";
import { Users, Printer, Package, TrendingUp, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { dashboardService } from "@/services/api";
import PlanStats from "@/components/PlanStats";

interface DashboardStats {
  totalUsers: number;
  totalPrintRequests: number;
  pendingRequests: number;
  completedRequests: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPrintRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل البيانات");
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsCards = [
    {
      title: "إجمالي المستخدمين",
      value: stats.totalUsers.toLocaleString("ar-SA"),
      icon: Users,
      color: "blue",
    },
    {
      title: "طلبات الطباعة",
      value: stats.totalPrintRequests.toLocaleString("ar-SA"),
      icon: Printer,
      color: "green",
    },
    {
      title: "طلبات معلقة",
      value: stats.pendingRequests.toLocaleString("ar-SA"),
      icon: AlertCircle,
      color: "yellow",
    },
    {
      title: "طلبات مكتملة",
      value: stats.completedRequests.toLocaleString("ar-SA"),
      icon: Package,
      color: "purple",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-red-600 dark:text-red-400">{error}</div>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            مرحباً، Admin
          </h1>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>آخر تحديث: {new Date().toLocaleDateString("ar-SA")}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-full bg-${stat.color}-50 dark:bg-${stat.color}-900/50`}
                >
                  <stat.icon
                    className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <PlanStats />

        {/* Recent Activity Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            النشاط الأخير
          </h2>
          <div className="space-y-4">
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              لا يوجد نشاط حديث
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
