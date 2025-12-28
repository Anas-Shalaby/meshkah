// @ts-nocheck
"use client";

import { useEffect, useMemo, useState, ReactNode } from "react";
import { useParams } from "next/navigation";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Users,
  Trophy,
  Eye,
  EyeOff,
  Search,
  Trash2,
  BookOpen,
  FileText,
  X,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { StatCard } from "@/components/ui/stat-card";
import { ChipPill } from "@/components/ui/chip-pill";
import { CampNavigation } from "@/components/quran-camps/CampNavigation";
import { CohortSelector } from "@/components/quran-camps/CohortSelector";
import { dashboardService } from "@/services/api";

interface Participant {
  id: number;
  user_id: number;
  username: string;
  email: string;
  status: "enrolled" | "active" | "completed" | "withdrawn";
  total_points: number;
  progress_percentage: number;
  completed_tasks: number;
  total_tasks: number;
  enrollment_date: string;
  hide_identity?: boolean;
  is_supervisor?: number; // 1 if supervisor, 0 if not
}

interface CampSummary {
  id: number;
  name: string;
}

const STATUS_FILTERS = [
  { value: "all", label: "الكل" },
  { value: "enrolled", label: "مسجل" },
  { value: "active", label: "نشط" },
  { value: "completed", label: "مكتمل" },
  { value: "withdrawn", label: "منسحب" },
] as const;

type StatusFilterValue = (typeof STATUS_FILTERS)[number]["value"];

const STATUS_STYLES: Record<string, string> = {
  enrolled: "bg-azure-900/30 text-azure-200 border border-azure-500/40",
  active: "bg-emerald-900/30 text-emerald-200 border border-emerald-500/40",
  completed: "bg-slate-800 text-slate-200 border border-slate-700",
  withdrawn: "bg-rose-900/30 text-rose-200 border border-rose-500/40",
};

interface UserTask {
  id: number;
  title: string;
  task_type: string;
  day_number: number;
  completed: boolean;
  completed_at?: string;
  journal_entry?: string;
  notes?: string;
  points: number;
}

interface ModalProps {
  title?: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}

const Modal = ({
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
}: ModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleContentClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const maxWidth = size === "lg" ? "max-w-4xl" : "max-w-2xl";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full mx-4 sm:mx-0 ${maxWidth} max-h-[90vh] overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-2xl`}
        onClick={handleContentClick}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          {children}
        </div>
        {footer ? (
          <div className="mt-6 flex justify-end gap-3">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body
  );
};

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

export default function CampParticipantsPage() {
  const params = useParams();
  const campId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [camp, setCamp] = useState<CampSummary | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [sortBy, setSortBy] = useState("points");
  const [selectedUser, setSelectedUser] = useState<Participant | null>(null);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [userBenefits, setUserBenefits] = useState<any[]>([]);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedCohortNumber, setSelectedCohortNumber] = useState<
    number | null
  >(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!campId) return;
      try {
        const campResponse = await dashboardService.getQuranCampDetails(campId);
        const campData = campResponse.data?.data ?? null;
        setCamp(campData);

        // Set default cohort number
        if (campData?.current_cohort_number && !selectedCohortNumber) {
          setSelectedCohortNumber(campData.current_cohort_number);
        }

        // Use selected cohort or current cohort
        const cohortToUse =
          selectedCohortNumber || campData?.current_cohort_number;

        if (!cohortToUse) {
          setError(
            "لا يوجد فوج نشط حالياً. يرجى إنشاء فوج أو تفعيل فوج موجود."
          );
          setLoading(false);
          return;
        }

        // Fetch participants for the selected cohort (includes supervisors for admin)
        const participantsResponse =
          await dashboardService.getCohortParticipantsForAdmin(
            campId,
            cohortToUse
          );

        setParticipants((participantsResponse?.data as Participant[]) || []);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل البيانات");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campId, selectedCohortNumber]);

  const filteredParticipants = useMemo(() => {
    return participants
      .filter((participant) => {
        const matchesSearch =
          participant.username
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          participant.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || participant.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "points":
            return b.total_points - a.total_points;
          case "progress":
            return b.progress_percentage - a.progress_percentage;
          case "name":
            return a.username.localeCompare(b.username);
          case "date":
            return (
              new Date(b.enrollment_date).getTime() -
              new Date(a.enrollment_date).getTime()
            );
          default:
            return 0;
        }
      });
  }, [participants, searchTerm, statusFilter, sortBy]);

  const metrics = useMemo(() => {
    const total = participants.length;
    const active = participants.filter((p) => p.status === "active").length;
    const completed = participants.filter(
      (p) => p.status === "completed"
    ).length;

    const hidden = participants.filter((p) => p.hide_identity).length;
    const averageProgress = total
      ? Math.round(
          participants.reduce(
            (sum, p) => sum + Number(p.progress_percentage),
            0
          ) / total
        )
      : 0;

    return { total, active, completed, hidden, averageProgress };
  }, [participants]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleRemoveUserFromCamp = async (userId: number) => {
    if (!campId) return;

    if (
      window.confirm(
        "⚠️ تحذير: هل أنت متأكد من حذف هذا المستخدم من المخيم؟\n\nسيتم حذف: \n• تسجيل المستخدم \n• تقدم المهام \n• النقاط المكتسبة\n\nهذا الإجراء لا يمكن التراجع عنه!"
      )
    ) {
      try {
        await dashboardService.removeUserFromCamp(campId, userId);
        const participantsResponse = await dashboardService.getCampParticipants(
          campId
        );
        setParticipants(participantsResponse?.data?.data || []);

        alert("✅ تم حذف المستخدم من المخيم بنجاح");
      } catch (err) {
        console.error("Error removing user from camp:", err);
        alert("❌ حدث خطأ أثناء حذف المستخدم من المخيم");
      }
    }
  };

  const openUserDetailsModal = async (participant: Participant) => {
    if (!campId) return;
    setSelectedUser(participant);
    setLoadingUserDetails(true);
    setShowUserModal(true);

    try {
      // Get user's camp progress with tasks and benefits
      const progressResponse = await dashboardService.getUserCampProgress(
        campId,
        participant.user_id
      );

      if (progressResponse.success && progressResponse.data) {
        const { tasks, tasksWithBenefits } = progressResponse.data;
        setUserTasks(tasks || []);
        setUserBenefits(tasksWithBenefits || []);
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setUserTasks([]);
    setUserBenefits([]);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !camp) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-rose-300">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-4 sm:p-6 pb-8 sm:pb-12">
        <CampNavigation campId={campId as string} />

        <ActionToolbar
          title="المشتركين في المخيم"
          subtitle={
            camp?.name ? `إدارة مشتركين ${camp.name}` : "إدارة المشتركين"
          }
          meta={
            <ChipPill
              variant="neutral"
              className="border border-slate-700 text-xs sm:text-sm"
            >
              {participants.length} مشترك
            </ChipPill>
          }
          secondaryActions={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/quran-camps/${campId}`}
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-300 transition hover:bg-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">العودة للتفاصيل</span>
                <span className="sm:hidden">رجوع</span>
              </Link>
              <Link
                href={`/dashboard/quran-camps/${campId}/study-hall`}
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-purple-500/40 bg-purple-900/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-purple-100 transition hover:bg-purple-800/40"
              >
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">إدارة قاعة التدارس</span>
                <span className="sm:hidden">قاعة التدارس</span>
              </Link>
            </div>
          }
          endSlot={
            <div className="relative flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-2 sm:px-3 py-1.5 text-slate-400 shadow-sm focus-within:ring-2 focus-within:ring-primary w-full sm:w-auto">
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <input
                type="search"
                placeholder="ابحث بالاسم أو البريد..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="flex-1 sm:w-48 bg-transparent text-xs sm:text-sm text-slate-200 outline-none placeholder:text-slate-500"
              />
            </div>
          }
        />

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="إجمالي المشتركين"
            value={metrics.total}
            icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" />}
            delta={{
              value: `${filteredParticipants.length} في القائمة`,
              trend: "neutral",
            }}
          />
          <StatCard
            label="مشتركين نشطين"
            value={metrics.active}
            icon={<Trophy className="h-5 w-5 sm:h-6 sm:w-6" />}
            delta={{
              value: metrics.hidden
                ? `${metrics.hidden} مخفي الهوية`
                : "الهوية مكشوفة",
              trend: metrics.hidden ? "down" : "neutral",
            }}
          />
          <StatCard
            label="مكتملون"
            value={metrics.completed}
            icon={<Eye className="h-5 w-5 sm:h-6 sm:w-6" />}
            delta={{
              value: `${metrics.averageProgress}% متوسط التقدم`,
              trend: "neutral",
            }}
          />
          <StatCard
            label="متوسط التقدم"
            value={`${metrics.averageProgress}%`}
            icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" />}
            delta={{ value: "حسب نسبة الإنجاز الكلية", trend: "neutral" }}
          />
        </section>

        <section className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
              {STATUS_FILTERS.map(({ value, label }) => {
                const isActive = statusFilter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full border px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition ${
                      isActive
                        ? "border-primary/60 bg-primary/20 text-primary-100 shadow"
                        : "border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span>{label}</span>
                    <span className="rounded-full border border-slate-700 bg-slate-950 px-1.5 sm:px-2 py-0.5 text-xs text-slate-400">
                      {(value === "all"
                        ? participants.length
                        : participants.filter((p) => p.status === value).length
                      ).toLocaleString("ar-EG")}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto sm:ms-auto">
              <label className="text-xs font-medium text-slate-400 whitespace-nowrap self-start sm:self-center">
                الترتيب حسب
              </label>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
              >
                <option value="points">النقاط</option>
                <option value="progress">التقدم</option>
                <option value="name">الاسم</option>
                <option value="date">تاريخ التسجيل</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 shadow-lg overflow-hidden">
          <div className="border-b border-slate-800 px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-100">
              قائمة المشتركين ({filteredParticipants.length})
            </h2>
          </div>

          {filteredParticipants.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 sm:px-6 py-12 sm:py-16 text-slate-400">
              <Users className="h-10 w-10 sm:h-12 sm:w-12" />
              <p className="text-sm sm:text-base">
                لا توجد نتائج مطابقة للبحث الحالي
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredParticipants.map((participant, index) => {
                const statusClass =
                  STATUS_STYLES[participant.status] || STATUS_STYLES.completed;
                return (
                  <article
                    key={participant.id}
                    className="group flex flex-col gap-4 sm:gap-6 px-4 sm:px-6 py-4 sm:py-6 transition hover:bg-slate-900/70"
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-xs sm:text-sm font-semibold text-primary-100 flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-semibold text-slate-100 truncate">
                              {participant.hide_identity
                                ? "مشارك مخفي"
                                : participant.username}
                            </h3>
                            {participant.hide_identity ? (
                              <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 flex-shrink-0" />
                            ) : null}
                            {participant.is_supervisor === 1 ? (
                              <ChipPill
                                variant="neutral"
                                className="bg-transparent text-xs sm:text-sm border border-amber-500/40 bg-amber-900/30 text-amber-200"
                              >
                                مشرف
                              </ChipPill>
                            ) : null}
                            <ChipPill
                              variant="neutral"
                              className={`bg-transparent text-xs sm:text-sm ${statusClass}`}
                            >
                              {participant.status === "withdrawn"
                                ? "منسحب"
                                : participant.status === "completed"
                                ? "مكتمل"
                                : participant.status === "active"
                                ? "نشط"
                                : "مسجل"}
                            </ChipPill>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-400 truncate">
                            {participant.email}
                          </p>
                          <p className="text-xs text-slate-500">
                            تاريخ التسجيل:{" "}
                            {formatDate(participant.enrollment_date)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 sm:gap-4 sm:flex sm:flex-wrap sm:items-center text-sm w-full sm:w-auto">
                        <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/60 px-2 sm:px-4 py-2 sm:py-3 text-center">
                          <p className="text-xs text-slate-400">النقاط</p>
                          <p className="text-base sm:text-lg font-semibold text-slate-100">
                            {participant.total_points}
                          </p>
                        </div>
                        <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/60 px-2 sm:px-4 py-2 sm:py-3 text-center">
                          <p className="text-xs text-slate-400">التقدم</p>
                          <p className="text-base sm:text-lg font-semibold text-slate-100">
                            {participant.progress_percentage}%
                          </p>
                        </div>
                        <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/60 px-2 sm:px-4 py-2 sm:py-3 text-center">
                          <p className="text-xs text-slate-400">إنجاز المهام</p>
                          <p className="text-base sm:text-lg font-semibold text-slate-100">
                            {participant.completed_tasks}/
                            {participant.total_tasks}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-t border-slate-800 pt-3 sm:pt-4 text-xs sm:text-sm text-slate-400">
                      <ChipPill
                        variant="default"
                        className="border border-slate-700 bg-slate-900/80 text-slate-300 text-xs"
                      >
                        رقم المستخدم: {participant.user_id}
                      </ChipPill>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <Link
                          href={`/dashboard/quran-camps/${campId}/participants/${participant.user_id}`}
                          className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-primary/40 bg-primary/20 px-2.5 sm:px-3 py-1.5 text-xs text-primary-100 transition hover:bg-primary/30 flex-1 sm:flex-initial justify-center"
                        >
                          <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">عرض التفاصيل</span>
                          <span className="sm:hidden">التفاصيل</span>
                        </Link>
                        <Link
                          href={`/dashboard/quran-camps/${campId}/participants/${participant.user_id}`}
                          className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-700 px-2.5 sm:px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800 flex-1 sm:flex-initial justify-center"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">
                            عرض الملف الشخصي
                          </span>
                          <span className="sm:hidden">الملف</span>
                        </Link>
                        <button
                          onClick={() =>
                            handleRemoveUserFromCamp(participant.user_id)
                          }
                          className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-rose-500/30 px-2.5 sm:px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-500/10 flex-1 sm:flex-initial justify-center"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">
                            إزالة من المخيم
                          </span>
                          <span className="sm:hidden">إزالة</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <Modal
            size="lg"
            title={`تفاصيل ${
              selectedUser.hide_identity ? "مشارك مخفي" : selectedUser.username
            }`}
            description="المهام المكتملة والفوائد المكتوبة"
            onClose={closeUserModal}
          >
            {loadingUserDetails ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-800 border-t-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* User Summary */}
                <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/60 p-3 sm:p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs text-slate-400">النقاط</p>
                      <p className="text-lg font-semibold text-slate-100">
                        {selectedUser.total_points}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">التقدم</p>
                      <p className="text-lg font-semibold text-slate-100">
                        {selectedUser.progress_percentage}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">المهام المكتملة</p>
                      <p className="text-lg font-semibold text-slate-100">
                        {selectedUser.completed_tasks}/
                        {selectedUser.total_tasks}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">الفوائد المكتوبة</p>
                      <p className="text-lg font-semibold text-emerald-200">
                        {userBenefits.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Benefits Section */}
                {userBenefits.length > 0 ? (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-100">
                      الفوائد المكتوبة ({userBenefits.length})
                    </h3>
                    <div className="space-y-3">
                      {userBenefits.map((task: any, index: number) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <ChipPill
                              variant="neutral"
                              className="border border-azure-500/40 bg-azure-900/30 px-3 py-1 text-xs text-azure-200"
                            >
                              {getTaskTypeText(task.task_type)}
                            </ChipPill>
                            <span className="text-xs text-slate-400">
                              اليوم {task.day_number}
                            </span>
                          </div>
                          <h4 className="mb-2 font-medium text-slate-100">
                            {task.title}
                          </h4>
                          {task.journal_entry && (
                            <div className="mb-2 rounded-xl border border-purple-500/40 bg-purple-900/20 p-3">
                              <p className="mb-1 text-xs font-medium text-purple-200">
                                التدبر:
                              </p>
                              <p
                                dangerouslySetInnerHTML={{
                                  __html: task.journal_entry,
                                }}
                                className="text-sm text-purple-100"
                              ></p>
                            </div>
                          )}
                          {task.notes && (
                            <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/20 p-3">
                              <p className="mb-1 text-xs font-medium text-emerald-200">
                                الفوائد:
                              </p>
                              <div
                                className="text-sm text-emerald-100"
                                dangerouslySetInnerHTML={{ __html: task.notes }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-12 text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-slate-500" />
                    <p className="mt-3 text-sm text-slate-400">
                      لم يكتب هذا المستخدم أي فوائد بعد
                    </p>
                  </div>
                )}

                {/* Tasks Summary */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-100">
                    ملخص المهام
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {userTasks
                      .filter((task: any) => task.completed)
                      .slice(0, 10)
                      .map((task: any, index: number) => (
                        <div
                          key={index}
                          className="rounded-xl border border-slate-700 bg-slate-950/60 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-100">
                                {task.title}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <ChipPill
                                  variant="neutral"
                                  className="border border-slate-500/40 bg-slate-900/30 px-2 py-0.5 text-xs text-slate-200"
                                >
                                  {getTaskTypeText(task.task_type)}
                                </ChipPill>
                                <span className="text-xs text-slate-400">
                                  اليوم {task.day_number}
                                </span>
                              </div>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                          </div>
                        </div>
                      ))}
                  </div>
                  {userTasks.filter((task: any) => task.completed).length ===
                    0 && (
                    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-8 text-center">
                      <Clock className="mx-auto h-10 w-10 text-slate-500" />
                      <p className="mt-2 text-sm text-slate-400">
                        لم يكمل هذا المستخدم أي مهام بعد
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
