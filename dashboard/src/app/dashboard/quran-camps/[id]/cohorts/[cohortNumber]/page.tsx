"use client";

// @ts-nocheck
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Edit,
  Play,
  Pause,
  XCircle,
  Mail,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { StatCard } from "@/components/ui/stat-card";
import { ChipPill } from "@/components/ui/chip-pill";

export default function CohortDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const rawCampId = params?.id;
  const campId = Array.isArray(rawCampId) ? rawCampId[0] : rawCampId || "";
  const cohortNumber = parseInt((params?.cohortNumber as string) || "0");

  const [cohort, setCohort] = useState<any | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingNotification, setSendingNotification] = useState(false);

  useEffect(() => {
    if (campId && cohortNumber) {
      loadCohortDetails();
      loadCohortStats();
    }
  }, [campId, cohortNumber]);

  const loadCohortDetails = async () => {
    try {
      const response = await dashboardService.getCampCohort(
        campId,
        cohortNumber
      );
      setCohort(response.data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "حدث خطأ في جلب تفاصيل الفوج");
      console.error("Error loading cohort:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCohortStats = async () => {
    try {
      const response = await dashboardService.getCohortStats(
        campId,
        cohortNumber
      );
      setStats(response.data);
    } catch (err) {
      console.error("Error loading cohort stats:", err);
    }
  };

  const handleStartCohort = async () => {
    if (!confirm("هل أنت متأكد من بدء هذا الفوج؟")) return;

    try {
      await dashboardService.startCampCohort(campId, cohortNumber);
      alert("تم بدء الفوج بنجاح");
      loadCohortDetails();
    } catch (err: any) {
      alert(err?.response?.data?.message || "حدث خطأ في بدء الفوج");
    }
  };

  const handleCompleteCohort = async () => {
    if (!confirm("هل أنت متأكد من إكمال هذا الفوج؟")) return;

    try {
      await dashboardService.completeCampCohort(campId, cohortNumber);
      alert("تم إكمال الفوج بنجاح");
      loadCohortDetails();
    } catch (err: any) {
      alert(err?.response?.data?.message || "حدث خطأ في إكمال الفوج");
    }
  };

  const handleCancelCohort = async () => {
    if (!confirm("هل أنت متأكد من إلغاء هذا الفوج؟")) return;

    try {
      await dashboardService.cancelCampCohort(campId, cohortNumber);
      alert("تم إلغاء الفوج بنجاح");
      loadCohortDetails();
    } catch (err: any) {
      alert(err?.response?.data?.message || "حدث خطأ في إلغاء الفوج");
    }
  };

  const handleSendNotification = async () => {
    if (
      !confirm(
        `هل أنت متأكد من إرسال إشعار بريدي للمشتركين في الفوج ${cohortNumber}؟`
      )
    ) {
      return;
    }

    try {
      setSendingNotification(true);
      await dashboardService.sendCohortNotification(campId, cohortNumber);
      alert("تم إرسال الإشعار بنجاح للمشتركين في الخدمة البريدية");
    } catch (err: any) {
      alert(err?.response?.data?.message || "حدث خطأ في إرسال الإشعار");
      console.error("Error sending notification:", err);
    } finally {
      setSendingNotification(false);
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

  if (error || !cohort) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
          {error || "الفوج غير موجود"}
        </div>
      </DashboardLayout>
    );
  }

  const progressPercentage =
    cohort.total_tasks_count > 0
      ? ((cohort.completed_tasks_count / cohort.total_tasks_count) * 100) /
        cohort.current_participants
      : 0;

  const statusVariant =
    cohort.status === "active"
      ? "success"
      : cohort.status === "completed"
      ? "neutral"
      : cohort.status === "cancelled"
      ? "warning"
      : "default";

  const primaryAction =
    cohort.status === "scheduled" || cohort.status === "early_registration" ? (
      <button
        onClick={handleStartCohort}
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 dark:bg-green-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 dark:hover:bg-green-600"
      >
        <Play className="h-4 w-4" />
        بدء الفوج
      </button>
    ) : cohort.status === "active" ? (
      <button
        onClick={handleCompleteCohort}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 dark:bg-blue-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 dark:hover:bg-blue-600"
      >
        <CheckCircle className="h-4 w-4" />
        إكمال الفوج
      </button>
    ) : null;

  const secondaryActions = (
    <>
      <Link
        href={`/dashboard/quran-camps/${campId}/cohorts`}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 transition hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        العودة
      </Link>
      <Link
        href={`/dashboard/quran-camps/${campId}/cohorts/${cohortNumber}/edit`}
        className="inline-flex items-center gap-2 rounded-lg border border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 transition hover:bg-purple-50 dark:hover:bg-purple-900/20"
      >
        <Edit className="h-4 w-4" />
        تعديل الفوج
      </Link>
      <button
        onClick={handleSendNotification}
        disabled={sendingNotification}
        className="inline-flex items-center gap-2 rounded-lg border border-cyan-300 dark:border-cyan-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-cyan-700 dark:text-cyan-300 transition hover:bg-cyan-50 dark:hover:bg-cyan-900/20 disabled:opacity-50"
      >
        {sendingNotification ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-600"></div>
            جاري الإرسال...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            إرسال إشعار بريدي
          </>
        )}
      </button>
      {(cohort.status === "scheduled" ||
        cohort.status === "early_registration") && (
        <button
          onClick={handleCancelCohort}
          className="inline-flex items-center gap-2 rounded-lg border border-red-300 dark:border-red-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 transition hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <XCircle className="h-4 w-4" />
          إلغاء
        </button>
      )}
    </>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <ActionToolbar
          title={cohort.name || `الفوج ${cohort.cohort_number}`}
          subtitle={cohort.camp_name}
          meta={
            <ChipPill variant={statusVariant}>
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
          }
          primaryAction={primaryAction}
          secondaryActions={secondaryActions}
        />

        {/* Cohort Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            معلومات الفوج
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                رقم الفوج
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {cohort.cohort_number}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                الحالة
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {cohort.status === "scheduled"
                  ? "مجدول"
                  : cohort.status === "early_registration"
                  ? "التسجيل المبكر"
                  : cohort.status === "active"
                  ? "نشط"
                  : cohort.status === "completed"
                  ? "مكتمل"
                  : "ملغى"}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                تاريخ البدء
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(cohort.start_date).toLocaleDateString("ar-SA")}
              </div>
            </div>
            {cohort.end_date && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  تاريخ الانتهاء المتوقع
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(cohort.end_date).toLocaleDateString("ar-SA")}
                </div>
              </div>
            )}
            {cohort.actual_end_date && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  تاريخ الانتهاء الفعلي
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(cohort.actual_end_date).toLocaleDateString("ar-SA")}
                </div>
              </div>
            )}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                المشتركين
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {cohort.participants_count}
                {cohort.max_participants && ` / ${cohort.max_participants}`}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="المشتركين"
              value={stats.participants_count}
              icon={<Users className="h-6 w-6" />}
              variant="neutral"
              compact
            />
            <StatCard
              label="المهام المكتملة"
              value={`${stats.completed_tasks} / ${stats.total_tasks}`}
              icon={<CheckCircle className="h-6 w-6" />}
              variant="positive"
              compact
            />
            <StatCard
              label="متوسط التقدم"
              value={`${(() => {
                const progress = stats.average_progress;
                if (typeof progress === "number") return progress.toFixed(1);
                if (typeof progress === "string")
                  return (parseFloat(progress) || 0).toFixed(1);
                return "0.0";
              })()}%`}
              icon={<TrendingUp className="h-6 w-6" />}
              variant="neutral"
              compact
            />
            <StatCard
              label="معدل الإنجاز"
              value={`${progressPercentage.toFixed(1)}%`}
              icon={<BarChart3 className="h-6 w-6" />}
              variant="attention"
              compact
            />
          </div>
        )}

        {/* Progress Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            التقدم العام
          </h2>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-4 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{cohort.completed_tasks_count} مهام مكتملة</span>
            <span>{cohort.total_tasks_count} مهام إجمالية</span>
          </div>
        </div>

        {/* Leaderboard */}
        {stats && stats.leaderboard && stats.leaderboard.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              لوحة الصدارة
            </h2>
            <div className="space-y-3">
              {stats.leaderboard.map((user: any) => (
                <div
                  key={user.user_id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-bold">
                    {user.rank}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {user.username}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {user.completed_tasks} مهام • {user.total_points} نقطة
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Participants Link */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <Link
            href={`/dashboard/quran-camps/${campId}/cohorts/${cohortNumber}/participants`}
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  المشتركين
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  عرض وإدارة جميع المشتركين في هذا الفوج
                </div>
              </div>
            </div>
            <ArrowLeft className="w-5 h-5 text-gray-400 dark:text-gray-500 rotate-180" />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
