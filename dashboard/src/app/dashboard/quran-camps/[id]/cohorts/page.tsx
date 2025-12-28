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
  Plus,
  Lock,
  Unlock,
  Eye,
  ArrowRight,
  X,
  ChevronDown,
  Settings,
  Mail,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { StatCard } from "@/components/ui/stat-card";
import { ChipPill } from "@/components/ui/chip-pill";
import { CampNavigation } from "@/components/quran-camps/CampNavigation";

export default function CohortsPage() {
  const params = useParams();
  const router = useRouter();
  const rawCampId = params?.id;
  const campId = Array.isArray(rawCampId) ? rawCampId[0] : rawCampId || "";

  const [cohorts, setCohorts] = useState<any[]>([]);
  const [camp, setCamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCohortData, setNewCohortData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    max_participants: "",
    status: "scheduled",
    announcement_message: "",
    send_email_to_subscribers: false,
  });
  const [statusChangeModal, setStatusChangeModal] = useState({
    open: false,
    cohortNumber: 0,
    currentStatus: "",
  });
  const [changingStatus, setChangingStatus] = useState(false);
  const [sendingNotification, setSendingNotification] = useState<number | null>(
    null
  );
  const [showNotificationModal, setShowNotificationModal] = useState({
    open: false,
    cohortNumber: 0,
  });
  const [sendingCompletion, setSendingCompletion] = useState<number | null>(
    null
  );
  const [showCompletionModal, setShowCompletionModal] = useState({
    open: false,
    cohortNumber: 0,
    participantsCount: 0,
    alreadySent: false,
  });

  useEffect(() => {
    if (campId) {
      loadCohorts();
      loadCampDetails();
    }
  }, [campId, statusFilter]);

  const loadCampDetails = async () => {
    try {
      const response = await dashboardService.getCampDetailsForAdmin(campId);
      setCamp(response.data);
    } catch (err) {
      console.error("Error loading camp:", err);
    }
  };

  const loadCohorts = async () => {
    try {
      setLoading(true);
      const queryParams = statusFilter ? { status: statusFilter } : {};
      const response = await dashboardService.getCampCohorts(
        campId,
        queryParams
      );
      setCohorts(response.data || []);
      setError(null);
    } catch (err) {
      // @ts-ignore
      setError(err?.response?.data?.message || "حدث خطأ في جلب الأفواج");
      console.error("Error loading cohorts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCohort = async (cohortNumber: number) => {
    if (!confirm("هل أنت متأكد من فتح هذا الفوج؟")) return;

    try {
      await dashboardService.openCampCohort(campId, cohortNumber);
      alert("تم فتح الفوج بنجاح");
      loadCohorts();
    } catch (err) {
      // @ts-ignore
      alert(err?.response?.data?.message || "حدث خطأ في فتح الفوج");
    }
  };

  const handleCloseCohort = async (cohortNumber: number) => {
    if (!confirm("هل أنت متأكد من إغلاق هذا الفوج؟")) return;

    try {
      await dashboardService.closeCampCohort(campId, cohortNumber);
      alert("تم إغلاق الفوج بنجاح");
      loadCohorts();
    } catch (err) {
      // @ts-ignore
      alert(err?.response?.data?.message || "حدث خطأ في إغلاق الفوج");
    }
  };

  const handleStartCohort = async (cohortNumber: number) => {
    if (!confirm("هل أنت متأكد من بدء هذا الفوج؟")) return;

    try {
      await dashboardService.startCampCohort(campId, cohortNumber);
      alert("تم بدء الفوج بنجاح");
      loadCohorts();
    } catch (err) {
      // @ts-ignore
      alert(err?.response?.data?.message || "حدث خطأ في بدء الفوج");
    }
  };

  const handleCompleteCohort = async (cohortNumber: number) => {
    if (!confirm("هل أنت متأكد من إكمال هذا الفوج؟")) return;

    try {
      await dashboardService.completeCampCohort(campId, cohortNumber);
      alert("تم إكمال الفوج بنجاح");
      loadCohorts();
    } catch (err) {
      // @ts-ignore
      alert(err?.response?.data?.message || "حدث خطأ في إكمال الفوج");
    }
  };

  const handleCancelCohort = async (cohortNumber: number) => {
    if (!confirm("هل أنت متأكد من إلغاء هذا الفوج؟")) return;

    try {
      await dashboardService.cancelCampCohort(campId, cohortNumber);
      alert("تم إلغاء الفوج بنجاح");
      loadCohorts();
    } catch (err) {
      // @ts-ignore
      alert(err?.response?.data?.message || "حدث خطأ في إلغاء الفوج");
    }
  };

  const handleSendNotification = async (cohortNumber: number) => {
    if (
      !confirm(
        `هل أنت متأكد من إرسال إشعار بريدي للمشتركين في الفوج ${cohortNumber}؟`
      )
    ) {
      return;
    }

    try {
      setSendingNotification(cohortNumber);
      await dashboardService.sendCohortNotification(campId, cohortNumber);
      alert("تم إرسال الإشعار بنجاح للمشتركين في الخدمة البريدية");
    } catch (err: any) {
      alert(err?.response?.data?.message || "حدث خطأ في إرسال الإشعار");
      console.error("Error sending notification:", err);
    } finally {
      setSendingNotification(null);
    }
  };

  const handleOpenCompletionModal = (cohort: any) => {
    setShowCompletionModal({
      open: true,
      cohortNumber: cohort.cohort_number,
      participantsCount: cohort.participants_count || 0,
      alreadySent: cohort.completion_notification_sent === 1,
    });
  };

  const handleSendCompletionNotifications = async () => {
    const { cohortNumber } = showCompletionModal;
    
    try {
      setSendingCompletion(cohortNumber);
      setShowCompletionModal({ ...showCompletionModal, open: false });
      
      const response = await dashboardService.sendCohortCompletionNotifications(
        campId,
        cohortNumber
      );
      
      alert(
        `تم إرسال الإشعارات بنجاح!\n` +
        `تم الإرسال لـ ${response.data?.sent || 0} مشترك`
      );
      
      // Reload cohorts to update status
      loadCohorts();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "حدث خطأ في إرسال الإشعارات";
      alert(errorMsg);
      console.error("Error sending completion notifications:", err);
    } finally {
      setSendingCompletion(null);
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    if (!statusChangeModal.cohortNumber) return;

    try {
      setChangingStatus(true);
      await dashboardService.updateCampCohort(
        campId,
        statusChangeModal.cohortNumber,
        { status: newStatus }
      );
      alert("تم تغيير حالة الفوج بنجاح");
      setStatusChangeModal({ open: false, cohortNumber: 0, currentStatus: "" });
      loadCohorts();
    } catch (err) {
      // @ts-ignore
      alert(err?.response?.data?.message || "حدث خطأ في تغيير حالة الفوج");
    } finally {
      setChangingStatus(false);
    }
  };

  const openStatusChangeModal = (
    cohortNumber: number,
    currentStatus: string
  ) => {
    setStatusChangeModal({
      open: true,
      cohortNumber,
      currentStatus,
    });
  };

  const getAvailableStatuses = (currentStatus: string) => {
    const allStatuses = [
      { value: "scheduled", label: "مجدول" },
      { value: "early_registration", label: "التسجيل المبكر" },
      { value: "active", label: "نشط" },
      { value: "completed", label: "مكتمل" },
      { value: "cancelled", label: "ملغى" },
    ];

    // Filter out current status
    return allStatuses.filter((status) => status.value !== currentStatus);
  };

  const handleCreateCohort = async () => {
    if (!newCohortData.start_date) {
      alert("يرجى اختيار تاريخ البدء");
      return;
    }

    try {
      setCreating(true);
      const data = {
        start_date: newCohortData.start_date,
        status: newCohortData.status,
        ...(newCohortData.name && { name: newCohortData.name }),
        ...(newCohortData.end_date && { end_date: newCohortData.end_date }),
        ...(newCohortData.max_participants && {
          max_participants: parseInt(newCohortData.max_participants),
        }),
        ...(newCohortData.announcement_message && {
          announcement_message: newCohortData.announcement_message,
        }),
        send_email_to_subscribers: newCohortData.send_email_to_subscribers,
      };

      const response = await dashboardService.createCampCohort(campId, data);
      const emailsSent = response?.emails_sent || 0;
      let message = "تم إنشاء الفوج بنجاح";
      if (newCohortData.send_email_to_subscribers && emailsSent > 0) {
        message += `\nتم إرسال ${emailsSent} إيميل للمشتركين`;
      }
      alert(message);
      setShowCreateModal(false);
      setNewCohortData({
        name: "",
        start_date: "",
        end_date: "",
        max_participants: "",
        status: "scheduled",
        announcement_message: "",
        send_email_to_subscribers: false,
      });
      loadCohorts();
    } catch (err) {
      // @ts-ignore
      alert(err?.response?.data?.message || "حدث خطأ في إنشاء الفوج");
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800";
      case "early_registration":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800";
      case "scheduled":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600";
      case "completed":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "نشط";
      case "early_registration":
        return "التسجيل المبكر";
      case "scheduled":
        return "مجدول";
      case "completed":
        return "مكتمل";
      case "cancelled":
        return "ملغى";
      default:
        return status;
    }
  };

  if (loading && !camp) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <ActionToolbar
          title="إدارة الأفواج"
          subtitle={(camp as any)?.name || "المخيم"}
          secondaryActions={
            <Link
              href={`/dashboard/quran-camps/${campId}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة
            </Link>
          }
          endSlot={
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/quran-camps/${campId}/cohorts/comparison`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
              >
                <BarChart3 className="h-4 w-4" />
                مقارنة الأفواج
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                إنشاء فوج جديد
              </button>
            </div>
          }
        />

        {/* Navigation */}
        <CampNavigation campId={campId} />

        {/* Filters */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-lg">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm font-semibold text-slate-200">
              فلترة حسب الحالة:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">جميع الحالات</option>
              <option value="scheduled">مجدول</option>
              <option value="early_registration">التسجيل المبكر</option>
              <option value="active">نشط</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغى</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Cohorts List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : cohorts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900 p-12 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">لا توجد أفواج بعد</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              إنشاء أول فوج
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cohorts.map((cohort: any) => (
              <div
                key={cohort.id}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg hover:shadow-xl transition-all hover:border-primary/40 group"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-100">
                          {cohort.name || `الفوج ${cohort.cohort_number}`}
                        </h3>
                        {/* @ts-ignore */}
                        {cohort.cohort_number ===
                          (camp as any)?.current_cohort_number && (
                          <ChipPill variant="success" className="text-xs">
                            الحالي
                          </ChipPill>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <ChipPill
                          variant={
                            cohort.status === "active"
                              ? "success"
                              : cohort.status === "early_registration"
                              ? "neutral"
                              : cohort.status === "completed"
                              ? "neutral"
                              : "warning"
                          }
                          className="text-xs"
                        >
                          {getStatusLabel(cohort.status)}
                        </ChipPill>
                        {cohort.is_open === 1 ? (
                          <ChipPill
                            variant="success"
                            className="text-xs flex items-center gap-1"
                          >
                            <Unlock className="w-3 h-3" />
                            مفتوح
                          </ChipPill>
                        ) : (
                          <ChipPill
                            variant="neutral"
                            className="text-xs flex items-center gap-1"
                          >
                            <Lock className="w-3 h-3" />
                            مغلق
                          </ChipPill>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="rounded-xl bg-slate-950/50 p-3 border border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-xs text-slate-400">
                          تاريخ البدء
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-100">
                        {new Date(cohort.start_date).toLocaleDateString(
                          "ar-SA"
                        )}
                      </p>
                    </div>
                    {cohort.end_date && (
                      <div className="rounded-xl bg-slate-950/50 p-3 border border-slate-800">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          <span className="text-xs text-slate-400">
                            تاريخ الانتهاء
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-100">
                          {new Date(cohort.end_date).toLocaleDateString(
                            "ar-SA"
                          )}
                        </p>
                      </div>
                    )}
                    <div className="rounded-xl bg-slate-950/50 p-3 border border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-slate-400">
                          المشتركين
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-100">
                        {cohort.participants_count || 0}
                        {cohort.max_participants && (
                          <span className="text-slate-500">
                            {" "}
                            / {cohort.max_participants}
                          </span>
                        )}
                      </p>
                    </div>
                    {cohort.completed_tasks_count !== undefined && (
                      <div className="rounded-xl bg-slate-950/50 p-3 border border-slate-800">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-yellow-400" />
                          <span className="text-xs text-slate-400">
                            المهام المكتملة
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-100">
                          {cohort.completed_tasks_count}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800">
                    <Link
                      href={`/dashboard/quran-camps/${campId}/cohorts/${cohort.cohort_number}`}
                      className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      التفاصيل
                    </Link>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      {cohort.is_open === 0 &&
                        cohort.status !== "completed" &&
                        cohort.status !== "cancelled" && (
                          <button
                            onClick={() =>
                              handleOpenCohort(cohort.cohort_number)
                            }
                            className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                            title="فتح الفوج"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>
                        )}

                      {cohort.is_open === 1 &&
                        cohort.status !== "completed" &&
                        cohort.status !== "cancelled" && (
                          <button
                            onClick={() =>
                              handleCloseCohort(cohort.cohort_number)
                            }
                            className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                            title="إغلاق الفوج"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}

                      {/* Change Status Button */}
                      {cohort.status !== "completed" &&
                        cohort.status !== "cancelled" && (
                          <button
                            onClick={() =>
                              openStatusChangeModal(
                                cohort.cohort_number,
                                cohort.status
                              )
                            }
                            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                            title="تغيير الحالة"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        )}

                      {/* Quick Start Button (only for scheduled/early_registration) */}
                      {(cohort.status === "scheduled" ||
                        cohort.status === "early_registration") && (
                        <button
                          onClick={() =>
                            handleStartCohort(cohort.cohort_number)
                          }
                          className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                          title="بدء الفوج"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}

                      {cohort.status === "active" && (
                        <button
                          onClick={() =>
                            handleCompleteCohort(cohort.cohort_number)
                          }
                          className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                          title="إكمال الفوج"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      {cohort.status !== "completed" &&
                        cohort.status !== "cancelled" && (
                          <button
                            onClick={() =>
                              handleCancelCohort(cohort.cohort_number)
                            }
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            title="إلغاء الفوج"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                      {/* Send Notification Button */}
                      <button
                        onClick={() =>
                          handleSendNotification(cohort.cohort_number)
                        }
                        disabled={sendingNotification === cohort.cohort_number}
                        className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
                        title="إرسال إشعار بريدي للمشتركين"
                      >
                        {sendingNotification === cohort.cohort_number ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                      </button>

                      {/* Send Completion Notification Button (for completed cohorts) */}
                      {cohort.status === "completed" && (
                        <button
                          onClick={() => handleOpenCompletionModal(cohort)}
                          disabled={sendingCompletion === cohort.cohort_number}
                          className={
                            cohort.completion_notification_sent === 1
                              ? "p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                              : "p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50 animate-pulse"
                          }
                          title={
                            cohort.completion_notification_sent === 1
                              ? "تم إرسال إشعارات الانتهاء مسبقاً"
                              : "إرسال إشعارات انتهاء الفوج"
                          }
                        >
                          {sendingCompletion === cohort.cohort_number ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                          ) : cohort.completion_notification_sent === 1 ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completion Notification Modal */}
        {showCompletionModal.open && (
          <div className="fixed inset-0 md:top-[60px] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl max-w-md w-full">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-100">
                    {showCompletionModal.alreadySent
                      ? "⚠️ تم الإرسال مسبقاً"
                      : "📧 إرسال إشعارات الانتهاء"}
                  </h2>
                  <button
                    onClick={() =>
                      setShowCompletionModal({
                        ...showCompletionModal,
                        open: false,
                      })
                    }
                    className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {showCompletionModal.alreadySent ? (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-amber-900/20 border border-amber-500/30 p-4">
                      <p className="text-amber-200 text-sm">
                        تم إرسال إشعارات الانتهاء لهذا الفوج مسبقاً. هل تريد إعادة الإرسال؟
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-purple-900/20 border border-purple-500/30 p-4">
                      <p className="text-slate-300 text-sm mb-2">
                        سيتم إرسال إشعارات انتهاء الفوج{" "}
                        <span className="font-bold text-purple-300">
                          {showCompletionModal.cohortNumber}
                        </span>{" "}
                        لجميع المشتركين:
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Users className="w-5 h-5 text-purple-400" />
                        <span className="text-lg font-bold text-slate-100">
                          {showCompletionModal.participantsCount} مشترك
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-950/50 border border-slate-700 p-4">
                      <p className="text-xs text-slate-400">
                        📧 سيتم إرسال إشعار داخلي + بريد إلكتروني لكل مشترك
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() =>
                      setShowCompletionModal({
                        ...showCompletionModal,
                        open: false,
                      })
                    }
                    className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSendCompletionNotifications}
                    className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-purple-500"
                  >
                    {showCompletionModal.alreadySent ? "إعادة الإرسال" : "إرسال الإشعارات"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Cohort Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 md:top-[60px] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl max-w-lg w-full my-8 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 sm:p-8 pb-4 flex-shrink-0 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">
                    إنشاء فوج جديد
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    سيتم إرسال إشعارات بريدية تلقائياً إذا كان الفوج في حالة
                    التسجيل المبكر
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 sm:px-8 py-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      اسم الفوج (اختياري)
                    </label>
                    <input
                      type="text"
                      value={newCohortData.name}
                      onChange={(e) =>
                        setNewCohortData({
                          ...newCohortData,
                          name: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="مثال: الفوج الأول - رمضان 2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      تاريخ البدء <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={newCohortData.start_date}
                      onChange={(e) =>
                        setNewCohortData({
                          ...newCohortData,
                          start_date: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      تاريخ الانتهاء (اختياري)
                    </label>
                    <input
                      type="date"
                      value={newCohortData.end_date}
                      onChange={(e) =>
                        setNewCohortData({
                          ...newCohortData,
                          end_date: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      سيتم حسابها تلقائياً من مدة المخيم إذا لم يتم تحديدها
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      الحد الأقصى للمشتركين (اختياري)
                    </label>
                    <input
                      type="number"
                      value={newCohortData.max_participants}
                      onChange={(e) =>
                        setNewCohortData({
                          ...newCohortData,
                          max_participants: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="مثال: 100"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      الحالة الابتدائية
                    </label>
                    <select
                      value={newCohortData.status}
                      onChange={(e) =>
                        setNewCohortData({
                          ...newCohortData,
                          status: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="scheduled">مجدول</option>
                      <option value="early_registration">التسجيل المبكر</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-2">
                      الفوج في حالة "التسجيل المبكر" سيتم إرسال إشعارات بريدية
                      تلقائياً للمشتركين
                    </p>
                  </div>

                  {/* Announcement Message */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      رسالة الإعلان (اختياري)
                    </label>
                    <textarea
                      value={newCohortData.announcement_message}
                      onChange={(e) =>
                        setNewCohortData({
                          ...newCohortData,
                          announcement_message: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="اكتب رسالة مخصصة للمشتركين... يمكنك استخدام المتغيرات: {camp_name}, {cohort_number}, {start_date}, {camp_url}"
                    />
                    <p className="text-xs text-slate-500">
                      يمكنك استخدام المتغيرات:{" "}
                      <code className="text-purple-400">
                        {"{camp_name}"}, {"{cohort_number}"}, {"{start_date}"},{" "}
                        {"{camp_url}"}
                      </code>
                    </p>
                  </div>

                  {/* Send Email Checkbox */}
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-700 bg-slate-950">
                    <input
                      type="checkbox"
                      id="send-email-checkbox"
                      checked={newCohortData.send_email_to_subscribers}
                      onChange={(e) =>
                        setNewCohortData({
                          ...newCohortData,
                          send_email_to_subscribers: e.target.checked,
                        })
                      }
                      className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary focus:ring-2 focus:ring-primary"
                    />
                    <label
                      htmlFor="send-email-checkbox"
                      className="flex-1 text-sm text-slate-300 cursor-pointer"
                    >
                      <span className="font-medium">
                        إرسال إيميلات للمشتركين تلقائياً عند الإنشاء
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        سيتم إرسال إيميلات لجميع المشتركين النشطين في النشرة
                        البريدية (subscription_type = 'cohorts' أو 'both')
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-6 sm:p-8 pt-4 border-t border-slate-800 flex-shrink-0">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCreateCohort}
                  disabled={creating || !newCohortData.start_date}
                  className="flex-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "جاري الإنشاء..." : "إنشاء الفوج"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Status Modal */}
        {statusChangeModal.open && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl max-w-md w-full p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">
                    تغيير حالة الفوج
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    الحالة الحالية:{" "}
                    <span className="text-slate-200 font-medium">
                      {getStatusLabel(statusChangeModal.currentStatus)}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() =>
                    setStatusChangeModal({
                      open: false,
                      cohortNumber: 0,
                      currentStatus: "",
                    })
                  }
                  className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {getAvailableStatuses(statusChangeModal.currentStatus).map(
                  (status) => (
                    <button
                      key={status.value}
                      onClick={() => handleChangeStatus(status.value)}
                      disabled={changingStatus}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-right text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {status.label}
                    </button>
                  )
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800">
                <button
                  onClick={() =>
                    setStatusChangeModal({
                      open: false,
                      cohortNumber: 0,
                      currentStatus: "",
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
