// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  CheckCircle,
  XCircle,
  Calendar,
  ArrowLeft,
  Users,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { CampNavigation } from "@/components/quran-camps/CampNavigation";
import { ActionToolbar } from "@/components/ui/action-toolbar";

export default function DailyTestsPage() {
  const params = useParams();
  const router = useRouter();
  const campId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [camp, setCamp] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testStats, setTestStats] = useState<Record<number, any>>({});

  const fetchCamp = async () => {
    try {
      if (!campId) return;
      const data = await dashboardService.getCampDetailsForAdmin(campId);
      setCamp(data.data);
    } catch (err: any) {
      setError(err.message || "حدث خطأ في جلب بيانات المخيم");
    }
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      if (!campId) return;

      // Fetch all tests for the camp in one call
      const response = await dashboardService.getDailyTests(campId);

      if (response.success && response.data) {
        const allTests = response.data;
        setTests(allTests);

        // Fetch statistics for each test (only for existing tests)
        const statsMap: Record<number, any> = {};
        const statsPromises = allTests.map(async (test: any) => {
          try {
            const statsResponse = await dashboardService.getTestStatistics(
              campId,
              test.day_number
            );
            if (statsResponse.success && statsResponse.data) {
              statsMap[test.day_number] = statsResponse.data;
            }
          } catch {
            // Skip if stats fetch fails
          }
        });

        await Promise.all(statsPromises);
        setTestStats(statsMap);
      } else {
        setTests([]);
        setTestStats({});
      }
    } catch (err: any) {
      console.error("Error fetching tests:", err);
      setError(err.message || "حدث خطأ في جلب الاختبارات");
      setTests([]);
      setTestStats({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campId) {
      fetchCamp();
      fetchTests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campId]);

  const handleDelete = async (dayNumber: number) => {
    if (!confirm(`هل أنت متأكد من حذف اختبار اليوم ${dayNumber}؟`)) {
      return;
    }

    if (!campId) return;

    try {
      const response = await dashboardService.deleteDailyTest(
        campId,
        dayNumber
      );

      if (response.success) {
        await fetchTests();
      } else {
        alert(response.message || "حدث خطأ في حذف الاختبار");
      }
    } catch (err: any) {
      console.error("Error deleting test:", err);
      alert(
        err.response?.data?.message || err.message || "حدث خطأ في حذف الاختبار"
      );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-primary border-slate-700"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-950">
        {/* Navigation */}
        <CampNavigation campId={campId} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Link
                href={`/dashboard/quran-camps/${campId}`}
                className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
                  الاختبارات اليومية
                </h1>
                <p className="text-slate-400">
                  {camp?.name || "إدارة الاختبارات اليومية للمخيم"}
                </p>
              </div>
            </div>

            {/* Action Toolbar */}
            <ActionToolbar
              actions={[
                {
                  label: "إضافة اختبار جديد",
                  icon: <Plus className="w-4 h-4" />,
                  onClick: () =>
                    router.push(
                      `/dashboard/quran-camps/${campId}/daily-tests/new`
                    ),
                  variant: "primary",
                },
              ]}
            />
          </div>

          {/* Tests List */}
          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-300">{error}</p>
            </div>
          ) : tests.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-200 mb-2">
                لا توجد اختبارات
              </h3>
              <p className="text-slate-400 mb-6">
                لم يتم إنشاء أي اختبارات يومية بعد
              </p>
              <button
                onClick={() =>
                  router.push(
                    `/dashboard/quran-camps/${campId}/daily-tests/new`
                  )
                }
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                <Plus className="w-5 h-5" />
                <span>إضافة اختبار جديد</span>
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {tests.map((test) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg hover:shadow-xl hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-primary/20">
                          {test.day_number}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-100 mb-1">
                            {test.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              اليوم {test.day_number}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4" />
                              {test.points} نقطة
                            </span>
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                test.is_active
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}
                            >
                              {test.is_active ? "نشط" : "غير نشط"}
                            </span>
                            {testStats[test.day_number] && (
                              <>
                                <span className="flex items-center gap-1.5">
                                  <Users className="w-4 h-4" />
                                  {
                                    testStats[test.day_number].statistics
                                      .total_attempts
                                  }{" "}
                                  حلوا
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <TrendingUp className="w-4 h-4" />
                                  {
                                    testStats[test.day_number].statistics
                                      .average_score
                                  }
                                  %
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {testStats[test.day_number] &&
                        testStats[test.day_number].statistics.total_attempts >
                          0 && (
                          <div className="mt-4 pt-4 border-t border-slate-800">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                <div className="text-xs text-slate-400 mb-1">
                                  إجمالي المحاولات
                                </div>
                                <div className="text-lg font-bold text-slate-100">
                                  {
                                    testStats[test.day_number].statistics
                                      .total_attempts
                                  }
                                </div>
                              </div>
                              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                <div className="text-xs text-slate-400 mb-1">
                                  متوسط النتيجة
                                </div>
                                <div className="text-lg font-bold text-emerald-400">
                                  {
                                    testStats[test.day_number].statistics
                                      .average_score
                                  }
                                  %
                                </div>
                              </div>
                              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                <div className="text-xs text-slate-400 mb-1">
                                  نجح
                                </div>
                                <div className="text-lg font-bold text-emerald-400">
                                  {
                                    testStats[test.day_number].statistics
                                      .passed_count
                                  }
                                </div>
                              </div>
                              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                <div className="text-xs text-slate-400 mb-1">
                                  نسبة النجاح
                                </div>
                                <div className="text-lg font-bold text-blue-400">
                                  {
                                    testStats[test.day_number].statistics
                                      .pass_rate
                                  }
                                  %
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/quran-camps/${campId}/daily-tests/${test.day_number}/results`
                                )
                              }
                              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-colors"
                            >
                              <BarChart3 className="w-4 h-4" />
                              <span>عرض تفاصيل النتائج</span>
                            </button>
                          </div>
                        )}
                      {test.description && (
                        <p className="text-slate-400 mt-3 text-sm leading-relaxed pr-16">
                          {test.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/quran-camps/${campId}/daily-tests/${test.day_number}`
                          )
                        }
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors border border-primary/20 hover:border-primary/40"
                        title="تعديل"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(test.day_number)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20 hover:border-red-500/40"
                        title="حذف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
