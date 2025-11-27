"use client";

// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Users,
  Calendar,
  BookOpen,
  Trophy,
  Edit,
  Play,
  Pause,
  CheckCircle,
  BarChart3,
  MessageSquare,
  ExternalLink,
  Clock,
  FileText,
  FileVideo,
  FileAudio,
  Image as ImageIcon,
  Link as LinkIcon,
  Download,
  X,
  HelpCircle,
  Share2,
  Copy,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { StatCard } from "@/components/ui/stat-card";
import { ChipPill } from "@/components/ui/chip-pill";
import { TimelineStepper } from "@/components/quran-camps/timeline-stepper";
import { CampNavigation } from "@/components/quran-camps/CampNavigation";

// @ts-ignore
type CampStatus = "early_registration" | "active" | "completed" | "reopened";

type Camp = {
  id: number;
  name: string;
  status: CampStatus;
  status_ar: string;
  surah_name: string;
  duration_days: number;
  start_date: string;
  created_at: string;
  updated_at?: string;
  banner_image?: string;
  description?: string;
  enrolled_count?: number;
  tags?: string[];
  current_cohort_number?: number;
  total_cohorts?: number;
};

type CampStats = {
  total_enrollments: number;
  completed_enrollments: number;
  average_progress: number;
  top_performers?: Array<{
    username: string;
    rank: number;
    total_points: number;
  }>;
};

type CampResource = {
  id: number;
  title: string;
  description?: string;
  link?: string;
};

type CampQuestion = {
  id: number;
  question: string;
  answer?: string;
};

type StatusMetaTone = "attention" | "positive" | "default";

const STATUS_META: Record<
  CampStatus,
  { title: string; description: string; tone: StatusMetaTone }
> = {
  early_registration: {
    title: "التسجيل المبكر",
    description: "تأكد من جاهزية المهام والمواد قبل الانطلاق.",
    tone: "attention",
  },
  active: {
    title: "نشط الآن",
    description: "تابع تقدّم المشاركين وجدول المهام يومياً.",
    tone: "positive",
  },
  completed: {
    title: "مكتمل",
    description: "راجع الأداء وجهّز تقارير التعلم للمشاركين.",
    tone: "default",
  },
  reopened: {
    title: "أعيد فتحه",
    description: "يستقبل مشاركين جدد بناءً على الإصدار السابق.",
    tone: "positive",
  },
};

export default function CampDetailsPage() {
  const params = useParams();
  const pathname = usePathname();
  const rawCampId = params?.id;
  const campId = Array.isArray(rawCampId) ? rawCampId[0] : rawCampId;

  const [camp, setCamp] = useState<Camp | null>(null);
  const [stats, setStats] = useState<CampStats | null>(null);
  const [resources, setResources] = useState<CampResource[]>([]);
  const [qanda, setQanda] = useState<CampQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [startingCohort, setStartingCohort] = useState(false);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [isSticky, setIsSticky] = useState(false);

  const resolveResourceMeta = (resource: CampResource) => {
    const fallback = {
      label: "مرفق",
      icon: <FileText className="h-4 w-4" />,
      chipClass: "border-slate-700 bg-slate-900 text-slate-200",
      hostname: null as string | null,
    };

    if (!resource?.link) {
      return fallback;
    }

    try {
      const url = new URL(resource.link);
      const hostname = url.hostname.replace(/^www\./, "");
      const linkPath = url.pathname.toLowerCase();
      const extension = linkPath.split(".").pop() || "";

      const meta = { ...fallback, hostname };

      if (hostname.includes("youtube") || hostname.includes("youtu.be")) {
        return {
          ...meta,
          label: "فيديو",
          icon: <FileVideo className="h-4 w-4" />,
          chipClass: "border-red-500/30 bg-red-500/10 text-red-200",
        };
      }

      if (["mp3", "wav", "m4a"].includes(extension)) {
        return {
          ...meta,
          label: "صوتي",
          icon: <FileAudio className="h-4 w-4" />,
          chipClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
        };
      }

      if (["png", "jpg", "jpeg", "webp", "gif"].includes(extension)) {
        return {
          ...meta,
          label: "صورة",
          icon: <ImageIcon className="h-4 w-4" />,
          chipClass: "border-sky-500/30 bg-sky-500/10 text-sky-100",
        };
      }

      if (["pdf", "doc", "docx", "ppt", "pptx"].includes(extension)) {
        return {
          ...meta,
          label: "مستند",
          icon: <FileText className="h-4 w-4" />,
          chipClass: "border-amber-500/30 bg-amber-500/10 text-amber-100",
        };
      }

      return {
        ...meta,
        label: "رابط خارجي",
        icon: <LinkIcon className="h-4 w-4" />,
        chipClass: "border-primary/40 bg-primary/15 text-primary-100",
      };
    } catch {
      return fallback;
    }
  };

  const loadCampDetails = useCallback(
    async ({ silent = false } = {}) => {
      if (!campId) return;
      try {
        if (!silent) setLoading(true);
        const [campResponse, statsResponse, resourcesResponse, qandaResponse] =
          await Promise.all([
            dashboardService.getQuranCampDetails(campId),
            dashboardService.getCampStats(campId),
            dashboardService
              .getCampResources(campId)
              .catch(() => ({ data: [] })),
            dashboardService.getCampQandA(campId).catch(() => ({ data: [] })),
          ]);

        setCamp(campResponse.data?.data ?? null);
        setStats(statsResponse.data?.data ?? null);
        setResources(resourcesResponse?.data || []);
        setQanda(qandaResponse?.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching camp details:", err);
        setError("حدث خطأ أثناء تحميل تفاصيل المخيم");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [campId]
  );

  useEffect(() => {
    if (campId) {
      loadCampDetails();
    }
  }, [campId, loadCampDetails]);

  const handleStatusChange = async (newStatus: CampStatus) => {
    if (!campId) return;
    try {
      setUpdatingStatus(true);
      await dashboardService.updateCampStatus(campId, newStatus);
      await loadCampDetails({ silent: true });
    } catch (err) {
      console.error("Error updating status:", err);
      alert("حدث خطأ في تحديث حالة المخيم");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStartNewCohort = () => {
    if (!campId || !camp) return;
    // Set default date to today
    const today = new Date().toISOString().split("T")[0];
    setSelectedStartDate(today);
    setShowStartDateModal(true);
  };

  const handleConfirmStartCohort = async () => {
    if (!campId || !camp) return;

    if (!selectedStartDate) {
      alert("يرجى اختيار تاريخ البدء");
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(selectedStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert("لا يمكن اختيار تاريخ في الماضي");
      return;
    }

    try {
      setStartingCohort(true);
      setShowStartDateModal(false);
      await dashboardService.startNewCohort(campId, {
        start_date: selectedStartDate,
      });
      alert("تم بدء الفوج الجديد بنجاح");
      await loadCampDetails({ silent: true });
    } catch (err: any) {
      console.error("Error starting new cohort:", err);
      alert(err?.response?.data?.message || "حدث خطأ في بدء الفوج الجديد");
    } finally {
      setStartingCohort(false);
      setSelectedStartDate("");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleExport = async (type: string = "all") => {
    if (!campId) return;
    try {
      const response = await dashboardService.exportCampData(campId, type);
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filename = `camp_${campId}_${type}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("حدث خطأ أثناء تصدير البيانات");
    }
  };

  const computedEndDate = useMemo(() => {
    if (!camp?.start_date) return null;
    const start = new Date(camp.start_date);
    const end = new Date(start);
    end.setDate(end.getDate() + (camp.duration_days || 0));
    return end;
  }, [camp?.start_date, camp?.duration_days]);

  const timelineSteps = useMemo((): Array<{
    id: string;
    label: string;
    dateLabel?: string;
    status: "complete" | "current" | "upcoming";
  }> => {
    if (!camp) return [];
    const baseSteps: Array<{
      id: string;
      label: string;
      dateLabel?: string;
      status: "complete" | "current" | "upcoming";
    }> = [
      {
        id: "planning",
        label: "التحضير",
        dateLabel: formatDate(camp.created_at),
        status: "complete" as const,
      },
      {
        id: "early_registration",
        label: "التسجيل المبكر",
        dateLabel: formatDate(camp.start_date),
        status:
          camp.status === "early_registration"
            ? ("current" as const)
            : camp.status === "active" ||
              camp.status === "completed" ||
              camp.status === "reopened"
            ? ("complete" as const)
            : ("upcoming" as const),
      },
      {
        id: "active",
        label: "قيد التنفيذ",
        dateLabel: formatDate(camp.start_date),
        status:
          camp.status === "active" ||
          camp.status === "completed" ||
          camp.status === "reopened"
            ? ("current" as const)
            : ("upcoming" as const),
      },
      {
        id: "completed",
        label: "الإغلاق",
        dateLabel: computedEndDate
          ? formatDate(computedEndDate.toISOString())
          : undefined,
        status:
          camp.status === "completed" || camp.status === "reopened"
            ? ("current" as const)
            : ("upcoming" as const),
      },
    ];

    if (camp.status === "reopened") {
      baseSteps.push({
        id: "reopened",
        label: "فتح للاشتراك",
        dateLabel: formatDate(camp.updated_at ?? camp.created_at),
        status: "current" as const,
      });
    }
    return baseSteps;
  }, [camp, computedEndDate]);

  const statusMeta = camp ? STATUS_META[camp.status] : null;
  const statusVariant =
    statusMeta?.tone === "positive"
      ? "success"
      : statusMeta?.tone === "attention"
      ? "warning"
      : "neutral";

  const answeredCount = useMemo(
    () => qanda.filter((item) => !!item.answer).length,
    [qanda]
  );

  // تتبع scroll position للـ sticky bar
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // دالة نسخ رابط المخيم
  const handleCopyLink = () => {
    if (camp?.share_link) {
      const fullLink = `${window.location.origin}/quran-camps/${camp.share_link}`;
      navigator.clipboard.writeText(fullLink);
      alert("تم نسخ الرابط!");
    }
  };

  // دالة نسخ المخيم
  const handleDuplicateCamp = async () => {
    if (!campId) return;
    if (!confirm("هل تريد نسخ هذا المخيم مع جميع المهام والموارد؟")) return;
    
    try {
      const response = await dashboardService.duplicateCamp(campId);
      if (response.success) {
        alert("تم نسخ المخيم بنجاح! سيتم توجيهك إلى المخيم الجديد.");
        window.location.href = `/dashboard/quran-camps/${response.data.campId}`;
      }
    } catch (error) {
      console.error("Error duplicating camp:", error);
      alert("حدث خطأ في نسخ المخيم");
    }
  };

  const primaryAction = camp
    ? (() => {
        switch (camp.status) {
          case "early_registration":
            return (
              <button
                onClick={() => handleStatusChange("active")}
                disabled={updatingStatus}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
              >
                <Play className="h-4 w-4" />
                {updatingStatus ? "جاري التحديث..." : "بدء المخيم"}
              </button>
            );
          case "active":
            return (
              <button
                onClick={() => handleStatusChange("completed")}
                disabled={updatingStatus}
                className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-5 py-2 text-sm font-medium text-slate-100 shadow-sm transition hover:bg-slate-700 disabled:opacity-60"
              >
                <Pause className="h-4 w-4" />
                {updatingStatus ? "جاري التحديث..." : "إنهاء المخيم"}
              </button>
            );
          case "completed":
            return (
              <button
                onClick={() => handleStatusChange("reopened")}
                disabled={updatingStatus}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-60"
              >
                <Play className="h-4 w-4" />
                {updatingStatus ? "جاري التحديث..." : "فتح للاشتراك الجديد"}
              </button>
            );
          case "reopened":
            return (
              <button
                onClick={() => handleStatusChange("completed")}
                disabled={updatingStatus}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600/90 px-5 py-2 text-sm font-medium text-emerald-50 shadow-sm transition hover:bg-emerald-500 disabled:opacity-60"
              >
                <Pause className="h-4 w-4" />
                {updatingStatus ? "جاري التحديث..." : "إغلاق التسجيل"}
              </button>
            );
          default:
            return null;
        }
      })()
    : null;

  const secondaryActions = camp ? (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/dashboard/quran-camps"
        className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        العودة
      </Link>
      <Link
        href={`/dashboard/quran-camps/${campId}/edit`}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
      >
        <Edit className="h-4 w-4" />
        تعديل
      </Link>
      <Link
        href={`/dashboard/quran-camps/${campId}/tasks`}
        className="inline-flex items-center gap-2 rounded-full border border-azure-500/40 bg-azure-900/30 px-4 py-2 text-sm font-medium text-azure-200 transition hover:bg-azure-800/30"
      >
        <BookOpen className="h-4 w-4" />
        المهام اليومية
      </Link>
      <Link
        href={`/dashboard/quran-camps/${campId}/study-hall`}
        className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-900/30 px-4 py-2 text-sm font-medium text-purple-100 transition hover:bg-purple-800/40"
      >
        <BookOpen className="h-4 w-4" />
        إدارة قاعة التدارس
      </Link>
      <div className="relative group">
        <button
          onClick={() => handleExport("all")}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-900/30 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-800/40"
        >
          <Download className="h-4 w-4" />
          تصدير البيانات
        </button>
        <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-10 w-48 rounded-xl border border-slate-700 bg-slate-900 shadow-lg p-2">
          <button
            onClick={() => handleExport("participants")}
            className="w-full text-right px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition"
          >
            تصدير المشتركين
          </button>
          <button
            onClick={() => handleExport("tasks")}
            className="w-full text-right px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition"
          >
            تصدير إحصائيات المهام
          </button>
          <button
            onClick={() => handleExport("leaderboard")}
            className="w-full text-right px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition"
          >
            تصدير لوحة المتصدرين
          </button>
          <button
            onClick={() => handleExport("all")}
            className="w-full text-right px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition border-t border-slate-700 mt-1 pt-2"
          >
            تصدير الكل
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (!campId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-slate-300">
          المعرف غير موجود
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !camp) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-rose-300">{error || "المخيم غير موجود"}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Sticky Action Bar */}
      {isSticky && camp && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-slate-100 truncate">
                  {camp.name}
                </h2>
                <ChipPill variant={statusVariant} className="text-xs flex-shrink-0">
                  {statusMeta?.title || camp.status_ar}
                </ChipPill>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {primaryAction}
                <Link
                  href={`/dashboard/quran-camps/${campId}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
                >
                  <Edit className="h-3.5 w-3.5" />
                  تعديل
                </Link>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
                  title="نسخ الرابط"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleDuplicateCamp}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
                  title="نسخ المخيم"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8 pb-12">
        <ActionToolbar
          title={camp.name}
          subtitle={`سورة ${camp.surah_name} • ${camp.duration_days} أيام`}
          meta={
            <ChipPill variant={statusVariant}>
              {statusMeta?.title || camp.status_ar}
            </ChipPill>
          }
          primaryAction={primaryAction}
          secondaryActions={secondaryActions}
          endSlot={
            <ChipPill variant="neutral" className="gap-2">
              <Calendar className="h-4 w-4" />
              آخر تحديث {formatDate(camp.updated_at ?? camp.created_at)}
            </ChipPill>
          }
        />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {camp.banner_image ? (
              <div className="relative h-56 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
                <img
                  src={camp.banner_image}
                  alt={camp.name}
                  className="h-full w-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute bottom-4 left-4 space-y-1 text-slate-100">
                  <h2 className="text-2xl font-semibold">{camp.name}</h2>
                  <p className="text-sm text-slate-300">
                    يبدأ {formatDate(camp.start_date)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 text-slate-400">
                <BookOpen className="h-10 w-10 text-slate-500" />
                <p className="mt-3 text-sm">لم يتم إضافة بانر لهذا المخيم</p>
              </div>
            )}

            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    مسار المخيم
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {statusMeta?.description || "تابع تقدم المخيم"}
                  </p>
                </div>
                <ChipPill variant={statusVariant} className="text-xs">
                  {statusMeta?.title || camp.status_ar}
                </ChipPill>
              </div>
              <TimelineStepper steps={timelineSteps} />
              <div className="mt-6 grid gap-4 border-t border-slate-800 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-2">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      تاريخ البداية
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-100">
                      {formatDate(camp.start_date)}
                    </p>
                  </div>
                </div>
                {computedEndDate ? (
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-emerald-500/10 p-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        تاريخ الإغلاق المتوقع
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">
                        {formatDate(computedEndDate.toISOString())}
                      </p>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-azure-500/10 p-2">
                    <Users className="h-4 w-4 text-azure-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      المشتركين
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-100">
                      {camp.enrolled_count?.toLocaleString("ar-EG") || 0} مشارك
                    </p>
                  </div>
                </div>
              </div>
              {camp.tags && camp.tags.length ? (
                <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800 pt-6">
                  <span className="text-xs font-medium text-slate-400">
                    العلامات:
                  </span>
                  {camp.tags.slice(0, 4).map((tag) => (
                    <ChipPill key={tag} variant="neutral" className="text-xs">
                      {tag}
                    </ChipPill>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <StatCard
                label="إجمالي المشتركين"
                value={
                  camp.enrolled_count != null
                    ? camp.enrolled_count.toLocaleString("ar-EG")
                    : "0"
                }
                icon={<Users className="h-6 w-6" />}
                delta={{
                  value:
                    stats && stats.completed_enrollments != null
                      ? `${stats.completed_enrollments.toLocaleString(
                          "ar-EG"
                        )} أتموا البرنامج`
                      : "بانتظار البيانات",
                  trend:
                    stats && stats.completed_enrollments > 0 ? "up" : "neutral",
                }}
              />
              <StatCard
                label="متوسط التقدم"
                value={
                  stats &&
                  stats.average_progress != null &&
                  !isNaN(stats.average_progress)
                    ? `${stats.average_progress.toFixed(1)}%`
                    : "0%"
                }
                icon={<Trophy className="h-6 w-6" />}
                delta={{
                  value:
                    stats &&
                    stats.total_enrollments &&
                    stats.total_enrollments > 0 &&
                    stats.completed_enrollments != null
                      ? `${Math.round(
                          (stats.completed_enrollments /
                            stats.total_enrollments) *
                            100
                        )}% إكمال`
                      : "لا يوجد بيانات",
                  trend:
                    stats &&
                    stats.average_progress != null &&
                    stats.average_progress > 50
                      ? "up"
                      : "neutral",
                }}
              />
              <StatCard
                label="مدة التنفيذ"
                value={`${camp.duration_days} يوم`}
                icon={<Clock className="h-6 w-6" />}
                description="يشمل فترات التسجيل والتنفيذ"
              />
              <StatCard
                label="نشاط النقاش"
                value={qanda.length}
                icon={<MessageSquare className="h-6 w-6" />}
                delta={{
                  value:
                    answeredCount > 0
                      ? `${answeredCount} مجابة`
                      : "بانتظار الردود",
                  trend: answeredCount > 0 ? "up" : "neutral",
                }}
              />
            </div>

            {/* Cohorts Management Section */}
            {(camp.status === "completed" || camp.status === "reopened") && (
              <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      إدارة الأفواج
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      بدء فوج جديد للمخيم مع عزل البيانات عن الفوج السابق
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 border-t border-slate-800 pt-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-primary/10 p-2">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        الفوج الحالي
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">
                        الفوج رقم {camp.current_cohort_number || 1}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-emerald-500/10 p-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        إجمالي الأفواج
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">
                        {camp.total_cohorts || 1} فوج
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 border-t border-slate-800 pt-6">
                  <button
                    onClick={handleStartNewCohort}
                    disabled={startingCohort}
                    className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
                  >
                    {startingCohort
                      ? "جاري البدء..."
                      : `بدء فوج جديد (الفوج رقم ${
                          (camp.current_cohort_number || 1) + 1
                        })`}
                  </button>
                </div>
              </div>
            )}

            {camp.description ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-100">
                  وصف المخيم
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {camp.description}
                </p>
              </div>
            ) : null}
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
              <h3 className="text-sm font-semibold text-slate-200">
                موجز الحالة
              </h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>آخر تحديث</span>
                  <span>{formatDate(camp.updated_at ?? camp.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>نوع المخيم</span>
                  <span>{camp.tags?.[0] || "مكثف"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>المسجلين</span>
                  <span>
                    {stats?.total_enrollments?.toLocaleString("ar-EG") || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
              <h3 className="text-sm font-semibold text-slate-200">
                روابط سريعة
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-primary-100">
                <li>
                  <Link
                    className="inline-flex border border-slate-700 hover:border-primary/40 hover:bg-primary/10 bg-slate-900/30 px-4 py-2 rounded-full items-center gap-2 text-primary-100 transition hover:text-primary-50"
                    href={`/dashboard/quran-camps/${campId}/participants`}
                  >
                    <Users className="h-4 w-4" />
                    إدارة المشاركين
                  </Link>
                </li>
                <li>
                  <Link
                    className="inline-flex border border-slate-700 hover:border-primary/40 hover:bg-primary/10 bg-slate-900/30 px-4 py-2 rounded-full items-center gap-2 text-primary-100 transition hover:text-primary-50"
                    href={`/dashboard/quran-camps/${campId}/interactions`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    التفاعلات
                  </Link>
                </li>
                <li>
                  <Link
                    className="inline-flex border border-slate-700 hover:border-primary/40 hover:bg-primary/10 bg-slate-900/30 px-4 py-2 rounded-full items-center gap-2 text-primary-100 transition hover:text-primary-50"
                    href={`/dashboard/quran-camps/${campId}/resources`}
                  >
                    <BookOpen className="h-4 w-4" />
                    الموارد التعليمية
                  </Link>
                </li>
                <li>
                  <Link
                    className="inline-flex border border-slate-700 hover:border-primary/40 hover:bg-primary/10 bg-slate-900/30 px-4 py-2 rounded-full items-center gap-2 text-primary-100 transition hover:text-primary-50"
                    href={`/dashboard/quran-camps/${campId}/analytics`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    لوحة التحليلات
                  </Link>
                </li>
                <li>
                  <Link
                    className="inline-flex border border-slate-700 hover:border-primary/40 hover:bg-primary/10 bg-slate-900/30 px-4 py-2 rounded-full items-center gap-2 text-primary-100 transition hover:text-primary-50"
                    href={`/dashboard/quran-camps/${campId}/study-hall`}
                  >
                    <BookOpen className="h-4 w-4" />
                    إدارة قاعة التدارس
                  </Link>
                </li>
                <li>
                  <Link
                    className="inline-flex border border-slate-700 hover:border-primary/40 hover:bg-primary/10 bg-slate-900/30 px-4 py-2 rounded-full items-center gap-2 text-primary-100 transition hover:text-primary-50"
                    href={`/dashboard/quran-camps/${campId}/messages`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    الرسائل اليومية
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </section>

        <CampNavigation campId={campId} />

        {stats && stats.total_enrollments !== undefined ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-100">
                نظرة عامة على التقدم
              </h3>
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>متوسط التقدم</span>
                    <span>{stats.average_progress?.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-800">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${stats.average_progress}%` }}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                    <p>إجمالي المشاركات</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-100">
                      {stats.total_enrollments}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                    <p>أتموا المخيم</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-100">
                      {stats.completed_enrollments}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-100">
                  أفضل المشاركين
                </h3>
                <Link
                  href={`/dashboard/quran-camps/${campId}/participants`}
                  className="text-sm text-primary-100 transition hover:text-primary-50"
                >
                  عرض الكل
                </Link>
              </div>
              <div className="space-y-3">
                {stats.top_performers?.slice(0, 3).map((performer) => (
                  <div
                    key={performer.username}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300"
                  >
                    <div>
                      <p className="font-medium text-slate-100">
                        {performer.username}
                      </p>
                      <p className="text-xs text-slate-400">
                        الترتيب #{performer.rank}
                      </p>
                    </div>
                    <span className="text-base font-semibold text-primary-100">
                      {performer.total_points} نقطة
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  الموارد
                </h3>
                <p className="text-sm text-slate-400">
                  إدارة الملفات والروابط المرفقة بالمخيم
                </p>
              </div>
              <Link
                href={`/dashboard/quran-camps/${campId}/resources`}
                className="text-sm text-primary-100 transition hover:text-primary-50"
              >
                إدارة الموارد
              </Link>
            </div>
            {resources.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-sm text-slate-400">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-500">
                  <FileText className="h-5 w-5" />
                </div>
                لا توجد موارد مضافة بعد
              </div>
            ) : (
              <div className="space-y-3">
                {resources.slice(0, 4).map((resource) => {
                  const meta = resolveResourceMeta(resource);

                  return (
                    <article
                      key={resource.id}
                      className="group rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 transition hover:border-primary/40 hover:bg-slate-900/80"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-primary-100 shadow-inner">
                            {meta.icon}
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="font-semibold text-slate-100">
                              {resource.title}
                            </p>
                            {resource.description ? (
                              <p className="text-xs leading-relaxed text-slate-400">
                                {resource.description}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        {resource.link ? (
                          <a
                            href={resource.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary-100 transition hover:bg-primary/20"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium ${meta.chipClass}`}
                        >
                          {meta.icon}
                          {meta.label}
                        </span>
                        {meta.hostname ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-300">
                            <LinkIcon className="h-3.5 w-3.5" />
                            {meta.hostname}
                          </span>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  الأسئلة والنقاشات
                </h3>
                <p className="text-sm text-slate-400">
                  تفاعل المشاركين والأسئلة الموجهة للمشرفين
                </p>
              </div>
              <Link
                href={`/dashboard/quran-camps/${campId}/qanda`}
                className="text-sm text-primary-100 transition hover:text-primary-50"
              >
                إدارة الأسئلة
              </Link>
            </div>
            {qanda.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
                لا توجد أسئلة بعد
              </div>
            ) : (
              <div className="space-y-3">
                {qanda.slice(0, 4).map((question) => (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-100">
                        {question.question}
                      </p>
                      {question.answer ? (
                        <ChipPill variant="success">تم الرد</ChipPill>
                      ) : null}
                    </div>
                    {question.answer ? (
                      <p className="mt-2 text-xs text-slate-400">
                        {question.answer}
                      </p>
                    ) : (
                      <Link
                        href={`/dashboard/quran-camps/${campId}/qanda`}
                        className="mt-2 inline-flex items-center gap-2 text-xs text-primary-100 transition hover:text-primary-40"
                      >
                        <MessageSquare className="h-4 w-4" />
                        الرد الآن
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Date Modal */}
      {showStartDateModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setShowStartDateModal(false)}
            />
            <div
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    بدء فوج جديد
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    اختر تاريخ بدء الفوج الجديد (الفوج رقم{" "}
                    {(camp?.current_cohort_number || 1) + 1})
                  </p>
                </div>
                <button
                  onClick={() => setShowStartDateModal(false)}
                  className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                  aria-label="إغلاق"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    تاريخ البدء
                  </label>
                  <input
                    type="date"
                    value={selectedStartDate}
                    onChange={(e) => setSelectedStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    سيتم بدء فوج جديد بنفس المخيم مع عزل جميع البيانات عن الفوج
                    السابق
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowStartDateModal(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmStartCohort}
                  disabled={!selectedStartDate || startingCohort}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {startingCohort ? "جاري البدء..." : "بدء الفوج"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </DashboardLayout>
  );
}
