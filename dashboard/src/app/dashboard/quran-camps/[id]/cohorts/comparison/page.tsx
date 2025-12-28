"use client";

// @ts-nocheck
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, BarChart3 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { ChipPill } from "@/components/ui/chip-pill";

interface Cohort {
  id: number;
  name: string;
  cohort_number: number;
  status: string;
  participants_count: number;
  completed_tasks_count: number;
  avg_points: number;
  start_date: string;
  end_date: string;
  settings: any;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_open: number;
  max_participants: number;
}
interface CohortComparisonResponse {
  success: boolean;
  data: Cohort[];
}
export default function CohortsComparisonPage() {
  const params = useParams();
  const campId = params?.id;

  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (campId) {
      loadComparison();
    }
  }, [campId]);

  const loadComparison = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getCohortsComparison(
        campId as string
      );
      setCohorts(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "حدث خطأ في جلب مقارنة الأفواج");
      console.error("Error loading comparison:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl border border-rose-800 bg-rose-900/30 p-4 text-rose-200">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <ActionToolbar
          title="مقارنة الأفواج"
          subtitle="مقارنة إحصائيات جميع أفواج المخيم"
          secondaryActions={
            <Link
              href={`/dashboard/quran-camps/${campId}/cohorts`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة
            </Link>
          }
        />

        {/* Comparison Table */}
        {cohorts.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center">
            <BarChart3 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              لا توجد أفواج للمقارنة
            </h3>
            <p className="text-slate-400">
              يجب أن يكون هناك على الأقل فوجان للمقارنة
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-950/60 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      الفوج
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      المشتركين
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      المهام المكتملة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      متوسط النقاط
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      تاريخ البدء
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {cohorts.map((cohort) => (
                    <tr
                      key={cohort.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/quran-camps/${campId}/cohorts/${cohort.cohort_number}`}
                          className="text-azure-400 hover:text-azure-300 font-semibold transition-colors"
                        >
                          {cohort.name || `الفوج ${cohort.cohort_number}`}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ChipPill
                          variant={
                            cohort.status === "active"
                              ? "success"
                              : cohort.status === "completed"
                              ? "neutral"
                              : cohort.status === "cancelled"
                              ? "warning"
                              : "default"
                          }
                          className="text-xs"
                        >
                          {cohort.status === "scheduled"
                            ? "مجدول"
                            : cohort.status === "early_registration"
                            ? "التسجيل المبكر"
                            : cohort.status === "active"
                            ? "نشط"
                            : cohort.status === "completed"
                            ? "مكتمل"
                            : "ملغى"}
                        </ChipPill>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                        {cohort.participants_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                        {cohort.completed_tasks_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                        {cohort.avg_points ? cohort.avg_points.toFixed(1) : "0"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(cohort.start_date).toLocaleDateString(
                          "ar-SA"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
