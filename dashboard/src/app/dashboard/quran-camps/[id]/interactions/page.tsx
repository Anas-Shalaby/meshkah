"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { CampNavigation } from "@/components/quran-camps/CampNavigation";
import { CohortSelector } from "@/components/quran-camps/CohortSelector";
import ActionToolbar from "@/components/ui/action-toolbar";
import { Button } from "@/components/ui/button";
import FilterDrawer from "@/components/ui/filter-drawer";
import { toast } from "@/components/ui/use-toast";
import { dashboardService } from "@/services/api";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileText,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface CampSummary {
  id: number;
  name: string;
  surah_name: string;
  duration_days?: number;
}

interface TaskCompletion {
  user_id: number;
  username: string;
  completed_at: string;
}

interface Task {
  task_id: number;
  task_title: string;
  task_description: string;
  task_type: string;
  completions: TaskCompletion[];
}

interface DayInteractions {
  day_number: number;
  tasks: Task[];
}

export default function CampInteractionsPage() {
  const params = useParams();
  const campId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [camp, setCamp] = useState<CampSummary | null>(null);
  const [interactions, setInteractions] = useState<DayInteractions[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState<string>("1");
  const [filteredInteractions, setFilteredInteractions] = useState<
    DayInteractions[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCohortNumber, setSelectedCohortNumber] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (campId) {
      getCamp();
      getInteractions();
    }
  }, [campId]);

  const getCamp = async () => {
    try {
      const response = await dashboardService.getQuranCampDetails(campId!);
      const campData = response.data?.data ?? null;
      setCamp(campData);

      // Set default cohort number
      if (campData?.current_cohort_number && !selectedCohortNumber) {
        setSelectedCohortNumber(campData.current_cohort_number);
      }

      // Load interactions after confirming active cohort exists
      if (selectedCohortNumber || campData?.current_cohort_number) {
        getInteractions();
      } else {
        setError("لا يوجد فوج نشط حالياً. يرجى إنشاء فوج أو تفعيل فوج موجود.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching camp:", error);
      setError("حدث خطأ أثناء تحميل بيانات المخيم");
      setLoading(false);
    }
  };

  const getInteractions = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getCampInteractions(
        campId!,
        selectedCohortNumber || undefined
      );
      // response is already res.data from axios, so response.data is the array
      setInteractions(response.data ?? []);
      setFilteredInteractions(response.data ?? []);
      setError(null);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      setError("حدث خطأ أثناء تحميل التفاعلات");
      toast({
        title: "حدث خطأ أثناء تحميل التفاصيل",
        description:
          error instanceof Error ? error.message : "حدث خطأ غير معروف",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const filteredInteractions = interactions.filter(
      (interaction) => interaction.day_number == parseInt(dayFilter)
    );
    setFilteredInteractions(filteredInteractions);
  }, [dayFilter]);

  const getTaskTypeLabel = (taskType: string) => {
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

  // Generate day options dynamically from interactions
  const dayOptions = interactions.map((day) => day.day_number);

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
        <ActionToolbar
          title="تفاصيل التفاعلات"
          subtitle={
            camp
              ? `سورة ${camp?.surah_name || ""} • ${
                  camp?.duration_days || 0
                } يوم`
              : undefined
          }
          primaryAction={
            <div className="flex gap-2 sm:gap-3">
              <div className="relative">
                <Link
                  href={`/dashboard/quran-camps/${campId}`}
                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-300 transition hover:bg-slate-800"
                >
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">العودة للتفاصيل</span>
                  <span className="sm:hidden">رجوع</span>
                </Link>
              </div>
            </div>
          }
          secondaryActions={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <label
                htmlFor="day-filter"
                className="text-xs sm:text-sm text-slate-400 whitespace-nowrap"
              >
                اليوم
              </label>
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value as string)}
                id="day-filter"
                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
              >
                {dayOptions.length > 0 ? (
                  dayOptions.map((dayNum) => (
                    <option key={dayNum} value={dayNum.toString()}>
                      اليوم {dayNum}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">اليوم 1</option>
                    <option value="2">اليوم 2</option>
                    <option value="3">اليوم 3</option>
                  </>
                )}
              </select>
            </div>
          }
        />

        <CampNavigation campId={campId as string} />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400">جاري التحميل...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-red-700 bg-red-950/20 px-8 py-16 text-center">
            <FileText className="h-12 w-12 text-red-500" />
            <div className="space-y-1">
              <p className="text-lg font-semibold text-red-100">{error}</p>
            </div>
          </div>
        ) : interactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 px-8 py-16 text-center">
            <FileText className="h-12 w-12 text-slate-500" />
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-100">
                لا توجد تفاعلات بعد
              </p>
              <p className="text-sm text-slate-400">
                لم يتم إكمال أي مهمات في هذا المخيم بعد
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {filteredInteractions.map((dayData) => (
              <div
                key={dayData.day_number}
                className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 shadow-lg"
              >
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b border-slate-800 pb-3 sm:pb-4">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex-shrink-0">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-100 truncate">
                      اليوم {dayData.day_number}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400">
                      {dayData.tasks.length} مهمة •{" "}
                      {dayData.tasks.reduce(
                        (sum, task) => sum + task.completions.length,
                        0
                      )}{" "}
                      إنجاز
                    </p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {dayData.tasks.map((task) => (
                    <div
                      key={task.task_id}
                      className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:p-5"
                    >
                      <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="mb-2 flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <h3 className="text-sm sm:text-base font-semibold text-slate-200 break-words">
                              {task.task_title}
                            </h3>
                          </div>
                          {task.task_description && (
                            <p className="mb-3 text-xs sm:text-sm text-slate-400 break-words">
                              {task.task_description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-slate-800/60 px-2 sm:px-2.5 py-1 text-xs text-slate-300 whitespace-nowrap">
                              {getTaskTypeLabel(task.task_type)}
                            </span>
                            <span className="flex items-center gap-1.5 rounded-lg bg-blue-500/20 px-2 sm:px-2.5 py-1 text-xs text-blue-300 whitespace-nowrap">
                              <Users className="h-3.5 w-3.5 flex-shrink-0" />
                              {task.completions.length} مستخدم
                            </span>
                          </div>
                        </div>
                      </div>

                      {task.completions.length > 0 && (
                        <div className="space-y-2 border-t border-slate-800 pt-3 sm:pt-4">
                          <p className="mb-2 sm:mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            من أكمل هذه المهمة:
                          </p>
                          <div className="space-y-2">
                            {task.completions.map((completion, idx) => (
                              <div
                                key={`${completion.user_id}-${idx}`}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 rounded-lg bg-slate-900/60 px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-800/50"
                              >
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
                                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex-shrink-0">
                                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-300" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                                      {completion.username}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {formatShortDate(completion.completed_at)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-xs text-slate-500 whitespace-nowrap self-end sm:self-auto">
                                  {formatDate(completion.completed_at)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
