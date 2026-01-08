"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  Target,
  Eye,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { dashboardService } from "@/services/api";

type BookJourneysStats = {
  totalJourneys: number;
  activeJourneys: number;
  completedJourneys: number;
  totalParticipants: number;
  averageCompletionRate: number;
  totalCertificates: number;
  recentActivity: any[];
};

interface Journey {
  id: number;
  user_id: number;
  book_slug: string;
  pace: number;
  start_date: string;
  current_position: number;
  status: "active" | "paused" | "completed";
  completed_at?: string;
  username: string;
  book_name: string;
  progress_percentage: number;
}

export default function BookJourneysPage() {
  const [stats, setStats] = useState<BookJourneysStats>({
    totalJourneys: 0,
    activeJourneys: 0,
    completedJourneys: 0,
    totalParticipants: 0,
    averageCompletionRate: 0,
    totalCertificates: 0,
    recentActivity: [],
  });
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, journeysData] = await Promise.all([
          dashboardService.getBookJourneysStats(),
          dashboardService.getBookJourneys({ limit: 10 }),
        ]);

        setStats(statsData);
        setJourneys(journeysData.journeys || []);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل البيانات");
        console.error("Error fetching book journeys data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statsCards = [
    {
      title: "إجمالي الختمات",
      value: stats.totalJourneys.toLocaleString("ar-SA"),
      icon: BookOpen,
      color: "blue",
      description: "عدد جميع خطط الختم",
    },
    {
      title: "الختمات النشطة",
      value: stats.activeJourneys.toLocaleString("ar-SA"),
      icon: Clock,
      color: "green",
      description: "الخطط الجارية حالياً",
    },
    {
      title: "الختمات المكتملة",
      value: stats.completedJourneys.toLocaleString("ar-SA"),
      icon: CheckCircle,
      color: "purple",
      description: "الخطط المُنجزة",
    },
    {
      title: "إجمالي المشاركين",
      value: stats.totalParticipants.toLocaleString("ar-SA"),
      icon: Users,
      color: "orange",
      description: "عدد المستخدمين المشاركين",
    },
    {
      title: "متوسط الإنجاز",
      value: `${stats.averageCompletionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "indigo",
      description: "معدل إنجاز الخطط",
    },
    {
      title: "الشهادات المُصدرة",
      value: stats.totalCertificates.toLocaleString("ar-SA"),
      icon: Award,
      color: "teal",
      description: "عدد الشهادات المُمنحة",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            نشط
          </span>
        );
      case "paused":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            متوقف
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
            مكتمل
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {status}
          </span>
        );
    }
  };

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
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              إدارة ختمات الكتب
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              متابعة وإدارة خطط ختم الكتب والمشاركين
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>آخر تحديث: {new Date().toLocaleDateString("ar-SA")}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stat.description}
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

        {/* Recent Journeys Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              أحدث الختمات
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    المستخدم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    الكتاب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    التقدم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    تاريخ البدء
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {journeys.length > 0 ? (
                  journeys.map((journey) => (
                    <tr
                      key={journey.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {journey.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {journey.book_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {journey.pace} حديث يومياً
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${journey.progress_percentage}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {journey.progress_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(journey.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(journey.start_date).toLocaleDateString(
                          "ar-SA"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/dashboard/book-journeys/${journey.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          عرض التفاصيل
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      لا توجد ختمات حالياً
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completion Rate Chart Placeholder */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              معدل الإنجاز
            </h3>
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stats.averageCompletionRate.toFixed(1)}%
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  متوسط معدل إنجاز الخطط
                </p>
              </div>
            </div>
          </div>

          {/* Popular Books */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              إحصائيات الكتب
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    رياض الصالحين
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    45
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ختمة
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    الأربعين النووية
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                    32
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ختمة
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    بلوغ المرام
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                    28
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ختمة
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
