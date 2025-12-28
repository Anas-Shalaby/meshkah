// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  TrendingUp,
  Users,
  Trophy,
  Calendar,
  BarChart3,
  PieChart as RechartsPieChart,
  Target,
  Award,
  Activity,
  BookOpen,
  MessageSquare,
  FileText,
  Heart,
  Save,
  Clock,
  Zap,
  TrendingDown,
  Folder,
  CheckCircle2,
  Download,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { CampNavigation } from "@/components/quran-camps/CampNavigation";
import { CohortSelector } from "@/components/quran-camps/CohortSelector";
import { ChipPill } from "@/components/ui/chip-pill";
import { StatCard } from "@/components/ui/stat-card";
import {
  LineChart,
  Line,
  AreaChart,
  PieChart,
  Area,
  BarChart,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  averageProgress: number;
  averagePoints: number;
  dailyProgress: Array<{
    date: string;
    completed_tasks: number;
    new_enrollments: number;
  }>;
  taskCompletion: Array<{
    task_type: string;
    completion_rate: number;
    total_attempts: number;
  }>;
  topPerformers: Array<{
    username: string;
    total_points: number;
    progress_percentage: number;
  }>;
  enrollmentGrowth?: Array<{
    date: string;
    new_enrollments: number;
  }>;
  retentionData?: Array<{
    date: string;
    active_users: number;
  }>;
}

interface CampSummary {
  id: number;
  name: string;
  surah_name: string;
  duration_days?: number;
  updated_at?: string;
}

const getTaskTypeText = (taskType: string) => {
  const types: Record<string, string> = {
    reading: "قراءة",
    memorization: "حفظ",
    prayer: "صلاة",
    tafseer_tabari: "تفسير الطبري",
    tafseer_kathir: "تفسير ابن كثير",
    youtube: "فيديو",
    journal: "يوميات",
  };
  return types[taskType] || taskType;
};

export default function CampAnalyticsPage() {
  const params = useParams();
  const campId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [camp, setCamp] = useState<CampSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [qanda, setQanda] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCohortNumber, setSelectedCohortNumber] = useState<
    number | null
  >(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!campId) return;
      try {
        const [
          campResponse,
          analyticsResponse,
          qandaResponse,
          resourcesResponse,
        ] = await Promise.all([
          dashboardService.getQuranCampDetails(campId),
          dashboardService.getCampAnalytics(
            campId,
            selectedCohortNumber || undefined
          ),
          dashboardService.getCampQandA(campId).catch(() => ({ data: [] })),
          dashboardService.getCampResources(campId).catch(() => ({ data: [] })),
        ]);

        const campData = campResponse.data?.data ?? null;
        setCamp(campData);

        // Set default cohort number
        if (campData?.current_cohort_number && !selectedCohortNumber) {
          setSelectedCohortNumber(campData.current_cohort_number);
        }

        setAnalytics(analyticsResponse.data?.data ?? null);
        setQanda(qandaResponse.data || []);
        setResources(resourcesResponse.data || []);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل التحليلات");
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    if (campId) {
      fetchData();
    }
  }, [campId, selectedCohortNumber]);

  const activityRate = useMemo(() => {
    if (!analytics || analytics.totalEnrollments === 0) return 0;
    return Math.round(
      ((analytics.activeEnrollments || 0) / analytics.totalEnrollments) * 100
    );
  }, [analytics]);

  const registeredCount = useMemo(() => {
    if (!analytics) return 0;
    return (
      (analytics.totalEnrollments || 0) -
      (analytics.activeEnrollments || 0) -
      (analytics.completedEnrollments || 0)
    );
  }, [analytics]);

  const latestProgressDate = useMemo(() => {
    if (!analytics?.dailyProgress?.length) return null;
    const timestamps = analytics.dailyProgress.map((day) =>
      new Date(day.date).getTime()
    );
    return new Date(Math.max(...timestamps));
  }, [analytics]);

  // إحصائيات إضافية
  const totalQuestions = useMemo(() => qanda.length, [qanda]);
  const answeredQuestions = useMemo(
    () => qanda.filter((q) => q.is_answered).length,
    [qanda]
  );
  const unansweredQuestions = useMemo(
    () => qanda.filter((q) => !q.is_answered).length,
    [qanda]
  );
  const totalResources = useMemo(() => {
    return resources.reduce(
      (acc, cat) => acc + (cat.resources?.length || 0),
      0
    );
  }, [resources]);

  // حساب إحصائيات التدبرات (من taskCompletion)
  const journalTasks = useMemo(() => {
    return analytics?.taskCompletion?.find((t) => t.task_type === "journal");
  }, [analytics]);

  const totalJournalAttempts = journalTasks?.total_attempts || 0;
  const completedJournals = Math.round(
    ((journalTasks?.completion_rate || 0) * totalJournalAttempts) / 100
  );

  // حساب إحصائيات النشاط اليومي
  const weeklyActivity = useMemo(() => {
    if (!analytics?.dailyProgress?.length) return null;
    const weekDays = [
      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];
    const activityByDay: Record<string, number> = {};

    analytics.dailyProgress.forEach((day) => {
      const date = new Date(day.date);
      const dayName = weekDays[date.getDay()];
      activityByDay[dayName] =
        (activityByDay[dayName] || 0) + day.completed_tasks;
    });

    return Object.entries(activityByDay).map(([day, count]) => ({
      day,
      count,
    }));
  }, [analytics]);

  // حساب معدل النمو
  const growthRate = useMemo(() => {
    if (!analytics?.dailyProgress || analytics.dailyProgress.length < 2)
      return 0;
    const recent = analytics.dailyProgress.slice(-7);
    const older = analytics.dailyProgress.slice(-14, -7);

    const recentAvg =
      recent.reduce((acc, d) => acc + d.completed_tasks, 0) / recent.length;
    const olderAvg =
      older.reduce((acc, d) => acc + d.completed_tasks, 0) / older.length;

    if (olderAvg === 0) return recentAvg > 0 ? 100 : 0;
    return Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
  }, [analytics]);

  // حساب أفضل يوم نشاط
  const bestDay = useMemo(() => {
    if (!analytics?.dailyProgress?.length) return null;
    const maxDay = analytics.dailyProgress.reduce((max, day) =>
      day.completed_tasks > max.completed_tasks ? day : max
    );
    return maxDay;
  }, [analytics]);

  // تحليل معدل الإكمال حسب اليوم في المخيم
  const completionByDay = useMemo(() => {
    if (!analytics?.dailyProgress?.length) return null;
    const dayMap: Record<number, { completed: number; total: number }> = {};

    // نحتاج إلى بيانات إضافية من API، لكن سنستخدم البيانات المتاحة
    analytics.dailyProgress.forEach((day) => {
      const date = new Date(day.date);
      const dayOfMonth = date.getDate();
      if (!dayMap[dayOfMonth]) {
        dayMap[dayOfMonth] = { completed: 0, total: 0 };
      }
      dayMap[dayOfMonth].completed += day.completed_tasks;
    });

    return Object.entries(dayMap)
      .map(([day, data]) => ({
        day: parseInt(day),
        completed: data.completed,
        percentage:
          data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      }))
      .sort((a, b) => a.day - b.day);
  }, [analytics]);

  // تحليل توزيع النقاط
  const pointsDistribution = useMemo(() => {
    if (!analytics?.topPerformers?.length) return null;
    const ranges = [
      { label: "0-50", min: 0, max: 50 },
      { label: "51-100", min: 51, max: 100 },
      { label: "101-200", min: 101, max: 200 },
      { label: "201-300", min: 201, max: 300 },
      { label: "300+", min: 301, max: Infinity },
    ];

    // نحتاج بيانات كاملة من API، لكن سنستخدم topPerformers كعينة
    const distribution = ranges.map((range) => ({
      range: range.label,
      count: analytics.topPerformers.filter(
        (p) => p.total_points >= range.min && p.total_points <= range.max
      ).length,
    }));

    return distribution;
  }, [analytics]);

  // حساب معدل الإكمال المتوسط اليومي
  const averageDailyCompletion = useMemo(() => {
    if (!analytics?.dailyProgress?.length) return 0;
    const total = analytics.dailyProgress.reduce(
      (sum, day) => sum + day.completed_tasks,
      0
    );
    return Math.round(total / analytics.dailyProgress.length);
  }, [analytics]);

  // حساب معدل النشاط (مهام مكتملة لكل مشترك)
  const tasksPerParticipant = useMemo(() => {
    if (!analytics?.totalEnrollments || analytics.totalEnrollments === 0)
      return 0;
    const totalTasks =
      analytics.dailyProgress?.reduce(
        (sum, day) => sum + day.completed_tasks,
        0
      ) || 0;
    return Math.round((totalTasks / analytics.totalEnrollments) * 10) / 10;
  }, [analytics]);

  // تحليل معدل الإكمال حسب نوع المهمة (مفصل)
  const detailedTaskCompletion = useMemo(() => {
    if (!analytics?.taskCompletion?.length) return null;
    return analytics.taskCompletion.map((task) => {
      const completedCount = Math.round(
        (task.completion_rate * task.total_attempts) / 100
      );
      const pendingCount = task.total_attempts - completedCount;
      return {
        ...task,
        completedCount,
        pendingCount,
        successRate: task.completion_rate,
      };
    });
  }, [analytics]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-800 border-t-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!camp) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
          {error || "المخيم غير موجود"}
        </div>
      </DashboardLayout>
    );
  }

  const navigation = [
    { href: `/dashboard/quran-camps/${campId}`, label: "نظرة عامة" },
    { href: `/dashboard/quran-camps/${campId}/tasks`, label: "المهام اليومية" },
    { href: `/dashboard/quran-camps/${campId}/resources`, label: "الموارد" },
    {
      href: `/dashboard/quran-camps/${campId}/qanda`,
      label: "الأسئلة والأجوبة",
    },
    {
      href: `/dashboard/quran-camps/${campId}/participants`,
      label: "المشتركين",
    },
    {
      href: `/dashboard/quran-camps/${campId}/analytics`,
      label: "التحليلات",
      active: true,
    },
    {
      href: `/dashboard/quran-camps/${campId}/settings`,
      label: "الإعدادات",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <ActionToolbar
          title="تحليلات المخيم"
          subtitle={`سورة ${camp.surah_name} • ${camp.name}`}
          meta={
            <div className="flex flex-wrap items-center gap-2">
              <ChipPill
                variant="neutral"
                className="border border-primary/40 bg-primary/15 text-primary-100"
              >
                {analytics?.totalEnrollments?.toLocaleString("ar-EG") || 0}{" "}
                مشترك
              </ChipPill>
              <ChipPill
                variant="neutral"
                className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              >
                {Math.round(analytics?.averageProgress || 0)}% متوسط التقدم
              </ChipPill>
            </div>
          }
          endSlot={
            <div className="flex items-center gap-2">
              {latestProgressDate && (
                <ChipPill
                  variant="neutral"
                  className="gap-2 border border-slate-700 bg-slate-900 text-slate-300"
                >
                  <Calendar className="h-4 w-4 text-primary-100" />
                  آخر تحديث{" "}
                  {latestProgressDate.toLocaleDateString("ar", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </ChipPill>
              )}
              <button
                onClick={async () => {
                  try {
                    const response = await dashboardService.exportCampData(
                      campId!,
                      "all"
                    );
                    const blob = new Blob([response.data], {
                      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute(
                      "download",
                      `camp_analytics_${campId}_${
                        new Date().toISOString().split("T")[0]
                      }.xlsx`
                    );
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error("Error exporting analytics:", error);
                    alert("حدث خطأ أثناء تصدير التحليلات");
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-900/30 px-3 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-800/40"
                title="تصدير التحليلات"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">تصدير PDF</span>
              </button>
            </div>
          }
        />

        {error ? (
          <div className="rounded-3xl border border-rose-900/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="إجمالي المشتركين"
            value={(analytics?.totalEnrollments || 0).toLocaleString("ar-EG")}
            description="جميع المسجلين في المخيم"
            icon={<Users className="h-6 w-6 text-primary-100" />}
            delta={{
              value: `${analytics?.activeEnrollments || 0} نشط`,
              trend: (analytics?.activeEnrollments || 0) > 0 ? "up" : "neutral",
            }}
          />
          <StatCard
            label="نشط حالياً"
            value={(analytics?.activeEnrollments || 0).toLocaleString("ar-EG")}
            description="مشتركين نشطين في المخيم"
            icon={<Activity className="h-6 w-6 text-emerald-200" />}
            variant="positive"
            delta={{
              value: `${activityRate}% نسبة النشاط`,
              trend:
                activityRate > 50
                  ? "up"
                  : activityRate > 25
                  ? "neutral"
                  : "down",
            }}
          />
          <StatCard
            label="مكتمل"
            value={(analytics?.completedEnrollments || 0).toLocaleString(
              "ar-EG"
            )}
            description="مشتركين أكملوا المخيم"
            icon={<Trophy className="h-6 w-6 text-amber-200" />}
            delta={{
              value: `${Math.round(
                analytics?.averagePoints || 0
              )} متوسط النقاط`,
              trend:
                (analytics?.completedEnrollments || 0) > 0 ? "up" : "neutral",
            }}
          />
          <StatCard
            label="متوسط التقدم"
            value={`${Math.round(analytics?.averageProgress || 0)}%`}
            description="معدل التقدم العام للمشتركين"
            icon={<Target className="h-6 w-6 text-cyan-200" />}
            delta={{
              value:
                analytics && analytics.totalEnrollments > 0
                  ? `${Math.round(
                      ((analytics.completedEnrollments || 0) /
                        analytics.totalEnrollments) *
                        100
                    )}% معدل الإكمال`
                  : "—",
              trend: (analytics?.averageProgress || 0) > 50 ? "up" : "neutral",
            }}
          />
        </section>

        <CampNavigation campId={campId} />

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  التقدم اليومي
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  تطور المهام المكتملة بمرور الوقت
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-primary-100" />
            </header>
            {analytics?.dailyProgress && analytics.dailyProgress.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={analytics.dailyProgress.slice(-14).map((day) => ({
                      date: new Date(day.date).toLocaleDateString("ar", {
                        month: "short",
                        day: "numeric",
                      }),
                      completed_tasks: day.completed_tasks,
                      new_enrollments: day.new_enrollments,
                    }))}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorCompleted"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8b5cf6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorEnrollments"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                        color: "#e2e8f0",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="completed_tasks"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                      name="مهام مكتملة"
                    />
                    <Area
                      type="monotone"
                      dataKey="new_enrollments"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorEnrollments)"
                      name="مشتركين جدد"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {analytics.dailyProgress.slice(-7).map((day, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                    >
                      <div className="mb-1 text-xs text-slate-400">
                        {new Date(day.date).toLocaleDateString("ar", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-emerald-200">مهام</p>
                          <p className="text-sm font-semibold text-emerald-100">
                            {day.completed_tasks}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-primary-200">جدد</p>
                          <p className="text-sm font-semibold text-primary-100">
                            {day.new_enrollments}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-12 text-center">
                <BarChart3 className="h-12 w-12 text-slate-500" />
                <p className="text-sm text-slate-400">
                  لا توجد بيانات يومية متاحة
                </p>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  توزيع إكمال المهام
                </h3>
                <p className="mt-1 text-sm text-slate-400">حسب نوع المهمة</p>
              </div>
              <RechartsPieChart className="h-5 w-5 text-primary-100" />
            </header>
            {analytics?.taskCompletion &&
            analytics.taskCompletion.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <defs>
                        {analytics.taskCompletion.map((entry, index) => {
                          const COLORS = [
                            { start: "#8b5cf6", end: "#7c3aed" },
                            { start: "#10b981", end: "#059669" },
                            { start: "#f59e0b", end: "#d97706" },
                            { start: "#ef4444", end: "#dc2626" },
                            { start: "#06b6d4", end: "#0891b2" },
                            { start: "#ec4899", end: "#db2777" },
                            { start: "#6366f1", end: "#4f46e5" },
                          ];
                          const color = COLORS[index % COLORS.length];
                          return (
                            <linearGradient
                              key={`gradient-${index}`}
                              id={`gradient-${index}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor={color.start} />
                              <stop offset="100%" stopColor={color.end} />
                            </linearGradient>
                          );
                        })}
                      </defs>
                      <Pie
                        data={analytics.taskCompletion.map((task, index) => ({
                          name: getTaskTypeText(task.task_type),
                          value: Math.round(
                            (task.completion_rate * task.total_attempts) / 100
                          ),
                          completion_rate: task.completion_rate,
                          total_attempts: task.total_attempts,
                          color: `url(#gradient-${index})`,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, completion_rate, percent }) => {
                          if (percent < 0.05) return null; // Hide labels for small slices
                          return `${name}\n${Math.round(completion_rate)}%`;
                        }}
                        outerRadius={110}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="#1e293b"
                        strokeWidth={3}
                        paddingAngle={2}
                      >
                        {analytics.taskCompletion.map((entry, index) => {
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={`url(#gradient-${index})`}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "12px",
                          color: "#e2e8f0",
                          padding: "12px",
                        }}
                        formatter={(value: any, name: any, props: any) => {
                          return [
                            `${value} مكتمل (${Math.round(
                              props.payload.completion_rate
                            )}%)`,
                            props.payload.name,
                          ];
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{
                          paddingTop: "20px",
                          fontSize: "12px",
                        }}
                        formatter={(value, entry: any) => {
                          const data = entry.payload;
                          return `${value} (${Math.round(
                            data.completion_rate
                          )}%)`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {analytics.taskCompletion.map((task, index) => {
                    const completedCount = Math.round(
                      (task.completion_rate * task.total_attempts) / 100
                    );
                    const COLORS = [
                      {
                        bg: "from-purple-500/20 to-purple-600/20",
                        border: "border-purple-500/40",
                        text: "text-purple-200",
                        bar: "from-purple-500 to-purple-600",
                      },
                      {
                        bg: "from-emerald-500/20 to-emerald-600/20",
                        border: "border-emerald-500/40",
                        text: "text-emerald-200",
                        bar: "from-emerald-500 to-emerald-600",
                      },
                      {
                        bg: "from-amber-500/20 to-amber-600/20",
                        border: "border-amber-500/40",
                        text: "text-amber-200",
                        bar: "from-amber-500 to-amber-600",
                      },
                      {
                        bg: "from-rose-500/20 to-rose-600/20",
                        border: "border-rose-500/40",
                        text: "text-rose-200",
                        bar: "from-rose-500 to-rose-600",
                      },
                      {
                        bg: "from-cyan-500/20 to-cyan-600/20",
                        border: "border-cyan-500/40",
                        text: "text-cyan-200",
                        bar: "from-cyan-500 to-cyan-600",
                      },
                      {
                        bg: "from-pink-500/20 to-pink-600/20",
                        border: "border-pink-500/40",
                        text: "text-pink-200",
                        bar: "from-pink-500 to-pink-600",
                      },
                      {
                        bg: "from-indigo-500/20 to-indigo-600/20",
                        border: "border-indigo-500/40",
                        text: "text-indigo-200",
                        bar: "from-indigo-500 to-indigo-600",
                      },
                    ];
                    const colorScheme = COLORS[index % COLORS.length];
                    return (
                      <div
                        key={index}
                        className={`rounded-xl border ${colorScheme.border} bg-gradient-to-br ${colorScheme.bg} p-4 shadow-lg`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span
                            className={`text-sm font-semibold ${colorScheme.text}`}
                          >
                            {getTaskTypeText(task.task_type)}
                          </span>
                          <span
                            className={`text-base font-bold ${colorScheme.text}`}
                          >
                            {Math.round(task.completion_rate)}%
                          </span>
                        </div>
                        <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-800/50">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${colorScheme.bar} transition-all duration-700 shadow-lg`}
                            style={{ width: `${task.completion_rate}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            {completedCount.toLocaleString("ar-EG")} مكتمل
                          </span>
                          <span>
                            {task.total_attempts.toLocaleString("ar-EG")} محاولة
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-12 text-center">
                <RechartsPieChart className="h-12 w-12 text-slate-500" />
                <p className="text-sm text-slate-400">
                  لا توجد بيانات إكمال متاحة
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Enrollment Growth Chart */}
        {analytics?.enrollmentGrowth &&
          analytics.enrollmentGrowth.length > 0 && (
            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    نمو المشتركين
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    تطور التسجيلات بمرور الوقت
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-200" />
              </header>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={analytics.enrollmentGrowth.map((day) => ({
                    date: new Date(day.date).toLocaleDateString("ar", {
                      month: "short",
                      day: "numeric",
                    }),
                    new_enrollments: day.new_enrollments,
                  }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorEnrollment"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="new_enrollments"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorEnrollment)"
                    name="مشتركين جدد"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </section>
          )}

        {/* Retention Chart */}
        {analytics?.retentionData && analytics.retentionData.length > 0 && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  معدل الاحتفاظ (Retention)
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  عدد المستخدمين النشطين يومياً
                </p>
              </div>
              <Users className="h-5 w-5 text-azure-200" />
            </header>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={analytics.retentionData.map((day) => ({
                  date: new Date(day.date).toLocaleDateString("ar", {
                    month: "short",
                    day: "numeric",
                  }),
                  active_users: day.active_users,
                }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    color: "#e2e8f0",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="active_users"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ fill: "#06b6d4", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="مستخدمين نشطين"
                />
              </LineChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* Top Performers Bar Chart */}
        {analytics?.topPerformers && analytics.topPerformers.length > 0 && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  أفضل الأداء
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  أعلى {analytics.topPerformers.length} مشارك
                </p>
              </div>
              <Award className="h-5 w-5 text-amber-200" />
            </header>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={analytics.topPerformers
                    .slice(0, 10)
                    .map((performer) => ({
                      name: performer.username,
                      points: performer.total_points,
                      progress: performer.progress_percentage,
                    }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    stroke="#9ca3af"
                    style={{ fontSize: "11px" }}
                  />
                  <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="points"
                    fill="#f59e0b"
                    name="النقاط"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-3 border-t border-slate-800 pt-4">
                {analytics.topPerformers
                  .slice(0, 10)
                  .map((performer, index) => (
                    <article
                      key={index}
                      className="group rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-amber-500/40 hover:bg-slate-900/80"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-sm font-bold text-amber-200">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">
                              {performer.username}
                            </p>
                            <p className="text-xs text-slate-400">
                              {performer.progress_percentage}% تقدم
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-lg font-bold text-amber-200">
                            {performer.total_points.toLocaleString("ar-EG")}
                          </p>
                          <p className="text-xs text-slate-400">نقطة</p>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-semibold text-slate-100">
                إحصائيات عامة
              </h3>
              <TrendingUp className="h-5 w-5 text-primary-100" />
            </header>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <span className="text-sm text-slate-300">متوسط النقاط</span>
                <span className="text-base font-semibold text-slate-100">
                  {Math.round(analytics?.averagePoints || 0).toLocaleString(
                    "ar-EG"
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <span className="text-sm text-slate-300">معدل الإكمال</span>
                <span className="text-base font-semibold text-slate-100">
                  {Math.round(analytics?.averageProgress || 0)}%
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <span className="text-sm text-slate-300">نسبة النشاط</span>
                <span className="text-base font-semibold text-slate-100">
                  {activityRate}%
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-semibold text-slate-100">
                توزيع الحالات
              </h3>
              <Users className="h-5 w-5 text-primary-100" />
            </header>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <span className="text-sm text-slate-300">مسجل</span>
                <span className="text-base font-semibold text-primary-100">
                  {registeredCount.toLocaleString("ar-EG")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <span className="text-sm text-slate-300">نشط</span>
                <span className="text-base font-semibold text-emerald-200">
                  {(analytics?.activeEnrollments || 0).toLocaleString("ar-EG")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <span className="text-sm text-slate-300">مكتمل</span>
                <span className="text-base font-semibold text-amber-200">
                  {(analytics?.completedEnrollments || 0).toLocaleString(
                    "ar-EG"
                  )}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* إحصائيات إضافية - التدبرات والتفاعل */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="التدبرات المكتوبة"
            value={completedJournals.toLocaleString("ar-EG")}
            description={`من ${totalJournalAttempts.toLocaleString(
              "ar-EG"
            )} محاولة`}
            icon={<BookOpen className="h-6 w-6 text-purple-200" />}
            delta={{
              value: journalTasks
                ? `${Math.round(journalTasks.completion_rate)}% معدل الإكمال`
                : "—",
              trend:
                (journalTasks?.completion_rate || 0) > 50 ? "up" : "neutral",
            }}
          />
          <StatCard
            label="الأسئلة المطروحة"
            value={totalQuestions.toLocaleString("ar-EG")}
            description={`${answeredQuestions} مجابة • ${unansweredQuestions} بدون إجابة`}
            icon={<MessageSquare className="h-6 w-6 text-blue-200" />}
            variant="positive"
            delta={{
              value:
                totalQuestions > 0
                  ? `${Math.round(
                      (answeredQuestions / totalQuestions) * 100
                    )}% معدل الإجابة`
                  : "—",
              trend: answeredQuestions > unansweredQuestions ? "up" : "down",
            }}
          />
          <StatCard
            label="الموارد التعليمية"
            value={totalResources.toLocaleString("ar-EG")}
            description="مواد تعليمية متاحة للمشاركين"
            icon={<FileText className="h-6 w-6 text-emerald-200" />}
            delta={{
              value: `${resources.length} فئة`,
              trend: totalResources > 0 ? "up" : "neutral",
            }}
          />
          <StatCard
            label="معدل النمو"
            value={`${growthRate > 0 ? "+" : ""}${growthRate}%`}
            description="مقارنة آخر أسبوع بالأسبوع السابق"
            icon={
              growthRate >= 0 ? (
                <TrendingUp className="h-6 w-6 text-emerald-200" />
              ) : (
                <TrendingDown className="h-6 w-6 text-rose-200" />
              )
            }
            variant={growthRate >= 0 ? "positive" : "attention"}
            delta={{
              value: growthRate >= 0 ? "نمو إيجابي" : "انخفاض",
              trend: growthRate >= 0 ? "up" : "down",
            }}
          />
        </section>

        {/* تحليل نشاط المستخدم - التدبرات */}
        {journalTasks && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  تحليل نشاط التدبرات
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  إحصائيات شاملة عن كتابة التدبرات واليوميات
                </p>
              </div>
              <BookOpen className="h-5 w-5 text-purple-200" />
            </header>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-300" />
                  <span className="text-sm text-slate-300">
                    إجمالي المحاولات
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-100">
                  {totalJournalAttempts.toLocaleString("ar-EG")}
                </p>
                <p className="mt-1 text-xs text-slate-400">محاولة كتابة تدبر</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm text-slate-300">
                    التدبرات المكتملة
                  </span>
                </div>
                <p className="text-2xl font-bold text-emerald-200">
                  {completedJournals.toLocaleString("ar-EG")}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {Math.round(journalTasks.completion_rate)}% معدل الإكمال
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-300" />
                  <span className="text-sm text-slate-300">
                    متوسط لكل مشارك
                  </span>
                </div>
                <p className="text-2xl font-bold text-amber-200">
                  {analytics && analytics.totalEnrollments > 0
                    ? Math.round(
                        totalJournalAttempts / analytics.totalEnrollments
                      ).toLocaleString("ar-EG")
                    : "0"}
                </p>
                <p className="mt-1 text-xs text-slate-400">محاولة لكل مشترك</p>
              </div>
            </div>
          </section>
        )}

        {/* النشاط الأسبوعي */}
        {weeklyActivity && weeklyActivity.length > 0 && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  توزيع النشاط الأسبوعي
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  أيام الأسبوع الأكثر نشاطاً
                </p>
              </div>
              <Calendar className="h-5 w-5 text-primary-100" />
            </header>
            <div className="grid gap-3 md:grid-cols-7">
              {weeklyActivity.map((item, index) => {
                const maxCount = Math.max(
                  ...weeklyActivity.map((w) => w.count)
                );
                const percentage =
                  maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <span className="text-xs font-medium text-slate-400">
                      {item.day}
                    </span>
                    <div className="relative h-32 w-full overflow-hidden rounded-lg bg-slate-800">
                      <div
                        className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-primary/60 to-primary transition-all duration-500"
                        style={{ height: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-100">
                      {item.count}
                    </span>
                    <span className="text-xs text-slate-400">مهمة</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* أفضل يوم نشاط */}
        {bestDay && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  أفضل يوم نشاط
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  اليوم الذي شهد أعلى معدل إنجاز
                </p>
              </div>
              <Award className="h-5 w-5 text-amber-200" />
            </header>
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-200">التاريخ</p>
                  <p className="mt-1 text-lg font-semibold text-amber-100">
                    {new Date(bestDay.date).toLocaleDateString("ar", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm text-amber-200">المهام المكتملة</p>
                  <p className="mt-1 text-2xl font-bold text-amber-100">
                    {bestDay.completed_tasks}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm text-amber-200">مشتركين جدد</p>
                  <p className="mt-1 text-2xl font-bold text-amber-100">
                    {bestDay.new_enrollments}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* تحليلات متقدمة */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* معدل الإكمال اليومي */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  معدل الإكمال اليومي
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  متوسط المهام المكتملة يومياً
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary-100" />
            </header>
            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
                <p className="text-xs text-primary-200">المتوسط اليومي</p>
                <p className="text-3xl font-bold text-primary-100">
                  {averageDailyCompletion}
                </p>
                <p className="mt-1 text-xs text-primary-300">مهمة مكتملة</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs text-slate-400">مهام لكل مشترك</p>
                <p className="text-2xl font-semibold text-slate-100">
                  {tasksPerParticipant}
                </p>
              </div>
            </div>
          </section>

          {/* توزيع النقاط */}
          {pointsDistribution && (
            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    توزيع النقاط
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    توزيع المشتركين حسب النقاط
                  </p>
                </div>
                <BarChart3 className="h-5 w-5 text-primary-100" />
              </header>
              <div className="space-y-3">
                {pointsDistribution.map((dist, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-200">
                        {dist.range} نقطة
                      </span>
                      <span className="text-sm font-semibold text-primary-100">
                        {dist.count}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
                        style={{
                          width: `${
                            analytics?.topPerformers?.length > 0
                              ? (dist.count / analytics.topPerformers.length) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* تحليل معدل النجاح */}
          {detailedTaskCompletion && detailedTaskCompletion.length > 0 && (
            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    معدل النجاح
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">حسب نوع المهمة</p>
                </div>
                <Target className="h-5 w-5 text-emerald-200" />
              </header>
              <div className="space-y-3">
                {detailedTaskCompletion
                  .sort((a, b) => b.successRate - a.successRate)
                  .slice(0, 5)
                  .map((task, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-200">
                          {getTaskTypeText(task.task_type)}
                        </span>
                        <span className="text-sm font-semibold text-emerald-200">
                          {Math.round(task.successRate)}%
                        </span>
                      </div>
                      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500/60 to-emerald-500 transition-all duration-500"
                          style={{ width: `${task.successRate}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>
                          {task.completedCount.toLocaleString("ar-EG")} مكتمل
                        </span>
                        <span>
                          {task.pendingCount.toLocaleString("ar-EG")} معلق
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>

        {/* إحصائيات التفاعل */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  إحصائيات الأسئلة والأجوبة
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  تفاعل المشاركين مع الأسئلة
                </p>
              </div>
              <MessageSquare className="h-5 w-5 text-blue-200" />
            </header>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-300" />
                  <span className="text-sm text-slate-300">إجمالي الأسئلة</span>
                </div>
                <span className="text-base font-semibold text-slate-100">
                  {totalQuestions.toLocaleString("ar-EG")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm text-emerald-200">تم الإجابة</span>
                </div>
                <span className="text-base font-semibold text-emerald-100">
                  {answeredQuestions.toLocaleString("ar-EG")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-300" />
                  <span className="text-sm text-amber-200">في الانتظار</span>
                </div>
                <span className="text-base font-semibold text-amber-100">
                  {unansweredQuestions.toLocaleString("ar-EG")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary-300" />
                  <span className="text-sm text-slate-300">معدل الإجابة</span>
                </div>
                <span className="text-base font-semibold text-primary-100">
                  {totalQuestions > 0
                    ? `${Math.round(
                        (answeredQuestions / totalQuestions) * 100
                      )}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  إحصائيات الموارد
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  المواد التعليمية المتاحة
                </p>
              </div>
              <FileText className="h-5 w-5 text-emerald-200" />
            </header>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm text-slate-300">إجمالي الموارد</span>
                </div>
                <span className="text-base font-semibold text-slate-100">
                  {totalResources.toLocaleString("ar-EG")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-primary-300" />
                  <span className="text-sm text-slate-300">عدد الفئات</span>
                </div>
                <span className="text-base font-semibold text-primary-100">
                  {resources.length.toLocaleString("ar-EG")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm text-slate-300">متوسط لكل فئة</span>
                </div>
                <span className="text-base font-semibold text-cyan-100">
                  {resources.length > 0
                    ? Math.round(
                        totalResources / resources.length
                      ).toLocaleString("ar-EG")
                    : "0"}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
