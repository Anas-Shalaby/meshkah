import { useState, useEffect } from "react";
import { dashboardService } from "@/services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PlanStats {
  total_plans: number;
  active_plans: number;
  completed_plans: number;
  total_users: number;
  average_completion_rate: number;
  monthly_progress: {
    month: string;
    completed: number;
    active: number;
  }[];
}

export default function PlanStats() {
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getPlanStats();
        setStats(response.data);
      } catch (err) {
        setError("فشل في تحميل الإحصائيات");
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7440E9]"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            إجمالي الخطط
          </h3>
          <p className="text-3xl font-bold text-[#7440E9]">
            {stats.total_plans}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            الخطط النشطة
          </h3>
          <p className="text-3xl font-bold text-green-500">
            {stats.active_plans}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            الخطط المكتملة
          </h3>
          <p className="text-3xl font-bold text-blue-500">
            {stats.completed_plans}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            المستخدمين النشطين
          </h3>
          <p className="text-3xl font-bold text-purple-500">
            {stats.total_users}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
          التقدم الشهري
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthly_progress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completed" fill="#7440E9" name="مكتمل" />
              <Bar dataKey="active" fill="#4CAF50" name="نشط" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          معدل الإكمال
        </h3>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className="bg-[#7440E9] h-4 rounded-full"
            style={{ width: `${stats.average_completion_rate}%` }}
          ></div>
        </div>
        <p className="text-right mt-2 text-gray-600 dark:text-gray-400">
          {stats.average_completion_rate}% من المستخدمين يكملون خططهم
        </p>
      </div>
    </div>
  );
}
