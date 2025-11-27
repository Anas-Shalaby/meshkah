// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Trophy,
  Calendar,
  Clock,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  Target,
  FileText,
  MessageSquare,
  Send,
  Mail,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { ChipPill } from "@/components/ui/chip-pill";
import { StatCard } from "@/components/ui/stat-card";
import { TimelineStepper } from "@/components/quran-camps/timeline-stepper";

interface UserData {
  id: number;
  username: string;
  email: string;
}

interface EnrollmentData {
  id: number;
  total_points: number;
  enrolled_at: string;
  current_streak?: number;
  longest_streak?: number;
  last_activity_date?: string;
}

interface Task {
  id: number;
  title: string;
  task_type: string;
  day_number: number;
  completed: boolean;
  completed_at?: string;
  journal_entry?: string;
  notes?: string;
  points: number;
  order_in_day: number;
}

interface Stats {
  totalTasks: number;
  completedTasks: number;
  benefitsCount: number;
  progressPercentage: number;
}

interface CampSummary {
  id: number;
  name: string;
  surah_name: string;
  duration_days: number;
  start_date: string;
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

export default function ParticipantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campId = Array.isArray(params.id) ? params.id[0] : params.id;
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const [camp, setCamp] = useState<CampSummary | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksWithBenefits, setTasksWithBenefits] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "timeline" | "tasks" | "reflections" | "stats"
  >("timeline");

  useEffect(() => {
    const fetchData = async () => {
      if (!campId || !userId) return;
      try {
        setLoading(true);
        const [campResponse, progressResponse] = await Promise.all([
          dashboardService.getQuranCampDetails(campId),
          dashboardService.getUserCampProgress(campId, parseInt(userId)),
        ]);

        setCamp(campResponse.data?.data ?? null);
        if (progressResponse.success && progressResponse.data) {
          setUser(progressResponse.data.user);
          setEnrollment(progressResponse.data.enrollment);
          setTasks(progressResponse.data.tasks || []);
          setTasksWithBenefits(progressResponse.data.tasksWithBenefits || []);
          setStats(progressResponse.data.stats);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "حدث خطأ أثناء تحميل البيانات");
        console.error("Error fetching participant details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campId, userId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar", {
      month: "short",
      day: "numeric",
    });
  };

  // Group tasks by day
  const tasksByDay = useMemo(() => {
    const grouped: Record<number, Task[]> = {};
    tasks.forEach((task) => {
      if (!grouped[task.day_number]) {
        grouped[task.day_number] = [];
      }
      grouped[task.day_number].push(task);
    });
    return grouped;
  }, [tasks]);

  // Timeline steps
  const timelineSteps = useMemo(() => {
    if (!camp || !enrollment) return [];
    const steps = [];

    // Enrollment date
    steps.push({
      id: "enrollment",
      label: "التسجيل",
      dateLabel: formatShortDate(enrollment.enrolled_at),
      status: "complete" as const,
    });

    // First task completion
    const firstTask = tasks.find((t) => t.completed);
    if (firstTask && firstTask.completed_at) {
      steps.push({
        id: "first_task",
        label: "أول مهمة مكتملة",
        dateLabel: formatShortDate(firstTask.completed_at),
        status: "complete" as const,
      });
    }

    // 50% progress
    if (stats && stats.progressPercentage >= 50) {
      const midTask = tasks
        .filter((t) => t.completed)
        .sort((a, b) => {
          if (!a.completed_at || !b.completed_at) return 0;
          return (
            new Date(a.completed_at).getTime() -
            new Date(b.completed_at).getTime()
          );
        })[Math.floor(tasks.filter((t) => t.completed).length / 2)];

      if (midTask && midTask.completed_at) {
        steps.push({
          id: "halfway",
          label: "50% تقدم",
          dateLabel: formatShortDate(midTask.completed_at),
          status: "complete" as const,
        });
      }
    }

    // 100% progress
    if (stats && stats.progressPercentage >= 100) {
      const lastTask = tasks
        .filter((t) => t.completed)
        .sort((a, b) => {
          if (!a.completed_at || !b.completed_at) return 0;
          return (
            new Date(b.completed_at).getTime() -
            new Date(a.completed_at).getTime()
          );
        })[0];

      if (lastTask && lastTask.completed_at) {
        steps.push({
          id: "completed",
          label: "إكمال المخيم",
          dateLabel: formatShortDate(lastTask.completed_at),
          status: "current" as const,
        });
      }
    } else {
      steps.push({
        id: "in_progress",
        label: "قيد التنفيذ",
        dateLabel: "حالياً",
        status: "current" as const,
      });
    }

    return steps;
  }, [camp, enrollment, tasks, stats]);

  // Daily progress chart data
  const dailyProgress = useMemo(() => {
    const progress: Record<number, { completed: number; total: number }> = {};
    tasks.forEach((task) => {
      if (!progress[task.day_number]) {
        progress[task.day_number] = { completed: 0, total: 0 };
      }
      progress[task.day_number].total++;
      if (task.completed) {
        progress[task.day_number].completed++;
      }
    });
    return Object.entries(progress)
      .map(([day, data]) => ({
        day: parseInt(day),
        completed: data.completed,
        total: data.total,
        percentage:
          data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      }))
      .sort((a, b) => a.day - b.day);
  }, [tasks]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !user || !camp) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-rose-300">
          {error || "المستخدم أو المخيم غير موجود"}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <ActionToolbar
          title={`تفاصيل المشترك: ${user.username}`}
          subtitle={`${camp.name} • سورة ${camp.surah_name}`}
          meta={
            <ChipPill variant="neutral" className="border border-slate-700">
              {stats?.progressPercentage || 0}% تقدم
            </ChipPill>
          }
          secondaryActions={
            <Link
              href={`/dashboard/quran-camps/${campId}/participants`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة للمشتركين
            </Link>
          }
          endSlot={
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/quran-camps/${campId}/notifications`}
                className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-3 py-2 text-xs text-primary-100 transition hover:bg-primary/30"
              >
                <Send className="h-4 w-4" />
                إرسال إشعار
              </Link>
            </div>
          }
        />

        {/* Stats Cards */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="النقاط الإجمالية"
            value={(enrollment?.total_points || 0).toLocaleString("ar-EG")}
            icon={<Trophy className="h-6 w-6 text-amber-200" />}
            delta={{
              value: `${stats?.completedTasks || 0} مهمة مكتملة`,
              trend: (stats?.completedTasks || 0) > 0 ? "up" : "neutral",
            }}
          />
          <StatCard
            label="نسبة التقدم"
            value={`${stats?.progressPercentage || 0}%`}
            icon={<Target className="h-6 w-6 text-emerald-200" />}
            delta={{
              value: `${stats?.completedTasks || 0}/${
                stats?.totalTasks || 0
              } مهام`,
              trend: (stats?.progressPercentage || 0) > 50 ? "up" : "neutral",
            }}
          />
          <StatCard
            label="التدبرات والفوائد"
            value={(tasksWithBenefits.length || 0).toLocaleString("ar-EG")}
            icon={<BookOpen className="h-6 w-6 text-purple-200" />}
            delta={{
              value: `${stats?.benefitsCount || 0} إجمالي`,
              trend: (tasksWithBenefits.length || 0) > 0 ? "up" : "neutral",
            }}
          />
          <StatCard
            label="تاريخ التسجيل"
            value={formatShortDate(enrollment?.enrolled_at || "")}
            icon={<Calendar className="h-6 w-6 text-azure-200" />}
            delta={{
              value: enrollment?.current_streak
                ? `${enrollment.current_streak} يوم متتالي`
                : "—",
              trend: (enrollment?.current_streak || 0) > 0 ? "up" : "neutral",
            }}
          />
        </section>

        {/* Timeline */}
        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">
                مسار التقدم
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                رحلة المستخدم في المخيم
              </p>
            </div>
          </div>
          <TimelineStepper steps={timelineSteps} />
        </section>

        {/* Tabs */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900 shadow-lg">
          <div className="border-b border-slate-800 px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeTab === "timeline"
                    ? "border-primary/60 bg-primary/20 text-primary-100 shadow-lg shadow-primary/20"
                    : "border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                التقدم اليومي
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeTab === "tasks"
                    ? "border-primary/60 bg-primary/20 text-primary-100 shadow-lg shadow-primary/20"
                    : "border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                المهام ({tasks.length})
              </button>
              <button
                onClick={() => setActiveTab("reflections")}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeTab === "reflections"
                    ? "border-primary/60 bg-primary/20 text-primary-100 shadow-lg shadow-primary/20"
                    : "border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                التدبرات (
                {tasksWithBenefits.filter((t) => t.journal_entry).length})
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeTab === "stats"
                    ? "border-primary/60 bg-primary/20 text-primary-100 shadow-lg shadow-primary/20"
                    : "border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Award className="h-4 w-4" />
                الإحصائيات
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Daily Progress Tab */}
            {activeTab === "timeline" && (
              <div className="space-y-6">
                {dailyProgress.map((day) => (
                  <div
                    key={day.day}
                    className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950/60 to-slate-900/40 p-5 shadow-lg"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-sm font-bold text-primary-100">
                          {day.day}
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-slate-100">
                            اليوم {day.day}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {day.completed} من {day.total} مهام مكتملة
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-emerald-200">
                          {day.percentage}%
                        </p>
                      </div>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                        style={{ width: `${day.percentage}%` }}
                      />
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {tasksByDay[day.day]?.map((task) => (
                        <div
                          key={task.id}
                          className={`rounded-xl border p-3 ${
                            task.completed
                              ? "border-emerald-500/40 bg-emerald-500/10"
                              : "border-slate-700 bg-slate-950/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-100">
                                {task.title}
                              </p>
                              <ChipPill
                                variant="neutral"
                                className="mt-1 border border-slate-500/40 bg-slate-900/30 px-2 py-0.5 text-xs text-slate-200"
                              >
                                {getTaskTypeText(task.task_type)}
                              </ChipPill>
                            </div>
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                            ) : (
                              <XCircle className="h-5 w-5 text-slate-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === "tasks" && (
              <div className="space-y-4">
                {Object.entries(tasksByDay)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([day, dayTasks]) => (
                    <div
                      key={day}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
                    >
                      <h4 className="mb-4 text-base font-semibold text-slate-100">
                        اليوم {day}
                      </h4>
                      <div className="space-y-3">
                        {dayTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`rounded-xl border p-4 ${
                              task.completed
                                ? "border-emerald-500/40 bg-emerald-500/10"
                                : "border-slate-700 bg-slate-900/40"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="mb-2 flex items-center gap-2">
                                  {task.completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-slate-500" />
                                  )}
                                  <h5 className="text-sm font-semibold text-slate-100">
                                    {task.title}
                                  </h5>
                                </div>
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <ChipPill
                                    variant="neutral"
                                    className="border border-slate-500/40 bg-slate-900/30 px-2 py-0.5 text-xs text-slate-200"
                                  >
                                    {getTaskTypeText(task.task_type)}
                                  </ChipPill>
                                  <span className="text-xs text-slate-400">
                                    {task.points} نقطة
                                  </span>
                                  {task.completed && task.completed_at && (
                                    <span className="text-xs text-slate-400">
                                      {formatDate(task.completed_at)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Reflections Tab */}
            {activeTab === "reflections" && (
              <div className="space-y-4">
                {tasksWithBenefits.filter((t) => t.journal_entry).length > 0 ? (
                  tasksWithBenefits
                    .filter((t) => t.journal_entry)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-purple-900/20 p-5 shadow-lg"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <h4 className="text-base font-semibold text-purple-100">
                              {task.title}
                            </h4>
                            <div className="mt-2 flex items-center gap-2">
                              <ChipPill
                                variant="neutral"
                                className="border border-purple-500/40 bg-purple-900/30 px-3 py-1 text-xs text-purple-200"
                              >
                                {getTaskTypeText(task.task_type)}
                              </ChipPill>
                              <span className="text-xs text-purple-300">
                                اليوم {task.day_number}
                              </span>
                              {task.completed_at && (
                                <span className="text-xs text-purple-300">
                                  {formatDate(task.completed_at)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div
                          className="rounded-xl border border-purple-500/30 bg-purple-950/40 p-4 text-sm text-purple-100 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: task.journal_entry || "",
                          }}
                        />
                      </div>
                    ))
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-16 text-center">
                    <BookOpen className="h-12 w-12 text-slate-500" />
                    <p className="text-sm text-slate-400">
                      لم يكتب هذا المستخدم أي تدبرات بعد
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === "stats" && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
                  <h4 className="mb-4 text-base font-semibold text-slate-100">
                    إحصائيات المهام
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        إجمالي المهام
                      </span>
                      <span className="text-base font-semibold text-slate-100">
                        {stats?.totalTasks || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        المهام المكتملة
                      </span>
                      <span className="text-base font-semibold text-emerald-200">
                        {stats?.completedTasks || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        المهام المعلقة
                      </span>
                      <span className="text-base font-semibold text-slate-300">
                        {(stats?.totalTasks || 0) -
                          (stats?.completedTasks || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        نسبة الإكمال
                      </span>
                      <span className="text-base font-semibold text-primary-100">
                        {stats?.progressPercentage || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
                  <h4 className="mb-4 text-base font-semibold text-slate-100">
                    إحصائيات المحتوى
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        التدبرات المكتوبة
                      </span>
                      <span className="text-base font-semibold text-purple-200">
                        {
                          tasksWithBenefits.filter((t) => t.journal_entry)
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        الفوائد المكتوبة
                      </span>
                      <span className="text-base font-semibold text-emerald-200">
                        {tasksWithBenefits.filter((t) => t.notes).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        إجمالي المحتوى
                      </span>
                      <span className="text-base font-semibold text-primary-100">
                        {tasksWithBenefits.length}
                      </span>
                    </div>
                  </div>
                </div>

                {enrollment && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 md:col-span-2">
                    <h4 className="mb-4 text-base font-semibold text-slate-100">
                      معلومات التسجيل
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs text-slate-400">تاريخ التسجيل</p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">
                          {formatDate(enrollment.enrolled_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">
                          النقاط الإجمالية
                        </p>
                        <p className="mt-1 text-sm font-semibold text-amber-200">
                          {enrollment.total_points}
                        </p>
                      </div>
                      {enrollment.current_streak !== undefined && (
                        <div>
                          <p className="text-xs text-slate-400">
                            السلسلة الحالية
                          </p>
                          <p className="mt-1 text-sm font-semibold text-emerald-200">
                            {enrollment.current_streak} يوم
                          </p>
                        </div>
                      )}
                      {enrollment.longest_streak !== undefined && (
                        <div>
                          <p className="text-xs text-slate-400">أطول سلسلة</p>
                          <p className="mt-1 text-sm font-semibold text-primary-100">
                            {enrollment.longest_streak} يوم
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}


