"use client";

// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Plus,
  Trash2,
  Download,
  Search,
  Filter,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  GraduationCap,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { ChipPill } from "@/components/ui/chip-pill";
import { CampNavigation } from "@/components/quran-camps/CampNavigation";
import { CohortSelector } from "@/components/quran-camps/CohortSelector";

export default function EmailSubscribersPage() {
  const params = useParams();
  const campId = Array.isArray(params?.id) ? params.id[0] : params?.id || "";

  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newSubscriptionType, setNewSubscriptionType] = useState("both");
  const [newNotes, setNewNotes] = useState("");
  const [showSendNotificationModal, setShowSendNotificationModal] =
    useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [selectedCohortNumber, setSelectedCohortNumber] = useState<
    number | null
  >(null);
  const [selectedAnnouncementCohort, setSelectedAnnouncementCohort] = useState<
    number | null
  >(null);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  useEffect(() => {
    fetchSubscribers();
    fetchStats();
    if (campId) {
      loadCohorts();
    }
  }, [page, filterActive, filterType, campId]);

  const loadCohorts = async () => {
    try {
      const response = await dashboardService.getCampCohorts(campId);
      if (response.success) {
        setCohorts(response.data || []);
      }
    } catch (err) {
      console.error("Error loading cohorts:", err);
    }
  };

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getEmailSubscribers({
        page,
        limit: 50,
        is_active: filterActive !== "all" ? filterActive : undefined,
        subscription_type: filterType !== "all" ? filterType : undefined,
      });

      if (response.success) {
        setSubscribers(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
      } else {
        setError(response.message || "حدث خطأ في جلب المشتركين");
      }
    } catch (err) {
      console.error("Error fetching subscribers:", err);
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await dashboardService.getEmailSubscribersStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleAddSubscriber = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال بريد إلكتروني صحيح",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await dashboardService.addEmailSubscriber({
        email: newEmail,
        subscription_type: newSubscriptionType,
        notes: newNotes || undefined,
      });

      if (response.success) {
        toast({
          title: "نجح",
          description: "تم إضافة المشترك بنجاح",
        });
        setShowAddModal(false);
        setNewEmail("");
        setNewNotes("");
        setNewSubscriptionType("both");
        fetchSubscribers();
        fetchStats();
      } else {
        toast({
          title: "خطأ",
          description: response.message || "حدث خطأ في إضافة المشترك",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error adding subscriber:", err);
      toast({
        title: "خطأ",
        description: "حدث خطأ في الاتصال",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubscriber = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المشترك؟")) {
      return;
    }

    try {
      const response = await dashboardService.removeEmailSubscriber(id);
      if (response.success) {
        toast({
          title: "نجح",
          description: "تم حذف المشترك بنجاح",
        });
        fetchSubscribers();
        fetchStats();
      } else {
        toast({
          title: "خطأ",
          description: response.message || "حدث خطأ في حذف المشترك",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error deleting subscriber:", err);
      toast({
        title: "خطأ",
        description: "حدث خطأ في الاتصال",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      const blob = await dashboardService.exportEmailSubscribers("csv");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `camp-subscribers-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "نجح",
        description: "تم تصدير القائمة بنجاح",
      });
    } catch (err) {
      console.error("Error exporting:", err);
      toast({
        title: "خطأ",
        description: "حدث خطأ في التصدير",
        variant: "destructive",
      });
    }
  };

  const filteredSubscribers = subscribers.filter((sub) => {
    if (searchQuery) {
      return sub.email.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const getSubscriptionTypeLabel = (type: string) => {
    switch (type) {
      case "camps":
        return "مخيمات فقط";
      case "cohorts":
        return "أفواج فقط";
      case "both":
        return "مخيمات وأفواج";
      default:
        return type;
    }
  };

  const handleSendCohortNotification = async () => {
    if (!selectedCohortNumber) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار فوج",
        variant: "destructive",
      });
      return;
    }

    try {
      setSendingNotification(true);
      await dashboardService.sendCohortNotification(
        campId,
        selectedCohortNumber
      );
      toast({
        title: "نجح",
        description: `تم إرسال الإشعار بنجاح للمشتركين في الفوج ${selectedCohortNumber}`,
      });
      setShowSendNotificationModal(false);
      setSelectedCohortNumber(null);
    } catch (err: any) {
      toast({
        title: "خطأ",
        description: err?.response?.data?.message || "حدث خطأ في إرسال الإشعار",
        variant: "destructive",
      });
      console.error("Error sending notification:", err);
    } finally {
      setSendingNotification(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!selectedAnnouncementCohort) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار فوج",
        variant: "destructive",
      });
      return;
    }

    try {
      setSendingAnnouncement(true);
      const response = await dashboardService.sendCohortAnnouncement(
        campId,
        selectedAnnouncementCohort,
        announcementMessage || undefined
      );
      toast({
        title: "نجح",
        description: `تم إرسال ${response.emails_sent || 0} إيميل بنجاح`,
      });
      setShowAnnouncementModal(false);
      setSelectedAnnouncementCohort(null);
      setAnnouncementMessage("");
    } catch (err: any) {
      toast({
        title: "خطأ",
        description: err?.response?.data?.message || "حدث خطأ في إرسال الإعلان",
        variant: "destructive",
      });
      console.error("Error sending announcement:", err);
    } finally {
      setSendingAnnouncement(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <CampNavigation campId={campId} />

        <ActionToolbar
          title="القائمة البريدية"
          subtitle="إدارة المشتركين في إشعارات المخيمات والأفواج"
          secondaryActions={
            <Link
              href={`/dashboard/quran-camps/${campId}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة للمخيم
            </Link>
          }
          endSlot={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                إضافة بريد
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                تصدير
              </button>
              <button
                onClick={() => setShowSendNotificationModal(true)}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/30"
              >
                <Mail className="h-4 w-4" />
                إرسال إشعار فوج
              </button>
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-200 transition hover:bg-purple-500/30"
              >
                <GraduationCap className="h-4 w-4" />
                إرسال إعلان فوج جديد
              </button>
            </div>
          }
        />

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">إجمالي المشتركين</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {stats.total}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-500/20 p-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">نشطين</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {stats.active}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-500/20 p-3">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">جدد هذا الشهر</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {stats.new_this_month}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-500/20 p-3">
                  <Filter className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">مخيمات وأفواج</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {stats.by_type.both || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالبريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 pr-10 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <select
            value={filterActive}
            onChange={(e) => {
              setFilterActive(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">جميع الحالات</option>
            <option value="true">نشط</option>
            <option value="false">ملغي</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">جميع الأنواع</option>
            <option value="both">مخيمات وأفواج</option>
            <option value="camps">مخيمات فقط</option>
            <option value="cohorts">أفواج فقط</option>
          </select>
        </div>

        {/* Subscribers List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-900/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center">
            <Mail className="mx-auto mb-4 h-12 w-12 text-slate-600" />
            <p className="text-slate-400">لا يوجد مشتركين</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-950/60">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                      البريد الإلكتروني
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                      نوع الاشتراك
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                      الحالة
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                      تاريخ الاشتراك
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                      ملاحظات
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredSubscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-slate-950/40">
                      <td className="px-6 py-4 text-sm text-slate-200">
                        {subscriber.email}
                      </td>
                      <td className="px-6 py-4">
                        <ChipPill variant="neutral">
                          {getSubscriptionTypeLabel(
                            subscriber.subscription_type
                          )}
                        </ChipPill>
                      </td>
                      <td className="px-6 py-4">
                        {subscriber.is_active ? (
                          <ChipPill variant="success">نشط</ChipPill>
                        ) : (
                          <ChipPill variant="warning">ملغي</ChipPill>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(subscriber.subscribed_at).toLocaleDateString(
                          "ar-SA"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {subscriber.notes || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteSubscriber(subscriber.id)}
                          className="rounded-lg p-2 text-rose-400 transition hover:bg-rose-950/40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-slate-800 px-6 py-4 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  السابق
                </button>
                <span className="text-sm text-slate-400">
                  صفحة {page} من {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Subscriber Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <div
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-100">
                  إضافة مشترك جديد
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    نوع الاشتراك
                  </label>
                  <select
                    value={newSubscriptionType}
                    onChange={(e) => setNewSubscriptionType(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="both">مخيمات وأفواج</option>
                    <option value="camps">مخيمات فقط</option>
                    <option value="cohorts">أفواج فقط</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    ملاحظات (اختياري)
                  </label>
                  <textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    placeholder="ملاحظات إضافية..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAddSubscriber}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send Notification Modal */}
        {showSendNotificationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setShowSendNotificationModal(false)}
            />
            <div
              className="relative w-full max-w-md mx-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    إرسال إشعار فوج
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    اختر فوج لإرسال إشعار بريدي للمشتركين
                  </p>
                </div>
                <button
                  onClick={() => setShowSendNotificationModal(false)}
                  className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    اختر الفوج
                  </label>
                  {cohorts.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                      لا توجد أفواج متاحة
                    </p>
                  ) : (
                    <select
                      value={selectedCohortNumber || ""}
                      onChange={(e) =>
                        setSelectedCohortNumber(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="">-- اختر فوج --</option>
                      {cohorts.map((cohort) => (
                        <option
                          key={cohort.cohort_number}
                          value={cohort.cohort_number}
                        >
                          الفوج {cohort.cohort_number}
                          {cohort.name && ` - ${cohort.name}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedCohortNumber && (
                  <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3">
                    <p className="text-sm text-cyan-200">
                      سيتم إرسال إشعار بريدي لجميع المشتركين في الخدمة البريدية
                      (الذين اشتركوا في "أفواج فقط" أو "مخيمات وأفواج") حول
                      الفوج {selectedCohortNumber}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowSendNotificationModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSendCohortNotification}
                  disabled={!selectedCohortNumber || sendingNotification}
                  className="rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingNotification ? (
                    <>
                      <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Mail className="inline h-4 w-4 mr-2" />
                      إرسال الإشعار
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send Announcement Modal */}
        {showAnnouncementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setShowAnnouncementModal(false)}
            />
            <div
              className="relative w-full max-w-lg mx-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    إرسال إعلان فوج جديد
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    اختر فوج واكتب رسالة لإرسالها للمشتركين
                  </p>
                </div>
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    اختر الفوج
                  </label>
                  <select
                    value={selectedAnnouncementCohort || ""}
                    onChange={(e) =>
                      setSelectedAnnouncementCohort(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">اختر فوج...</option>
                    {cohorts.map((cohort) => (
                      <option
                        key={cohort.cohort_number}
                        value={cohort.cohort_number}
                      >
                        الفوج {cohort.cohort_number}
                        {cohort.name ? ` - ${cohort.name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    رسالة الإعلان (اختياري)
                  </label>
                  <textarea
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                    rows={6}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="اكتب رسالة مخصصة للمشتركين... يمكنك استخدام المتغيرات: {camp_name}, {cohort_number}, {start_date}, {camp_url}"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    يمكنك استخدام المتغيرات:{" "}
                    <code className="text-purple-400">
                      {"{camp_name}"}, {"{cohort_number}"}, {"{start_date}"},{" "}
                      {"{camp_url}"}
                    </code>
                  </p>
                </div>

                {selectedAnnouncementCohort && (
                  <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10">
                    <p className="text-sm text-blue-200">
                      سيتم إرسال الإعلان لجميع المشتركين النشطين في النشرة
                      البريدية (subscription_type = 'cohorts' أو 'both')
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowAnnouncementModal(false);
                    setSelectedAnnouncementCohort(null);
                    setAnnouncementMessage("");
                  }}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSendAnnouncement}
                  disabled={!selectedAnnouncementCohort || sendingAnnouncement}
                  className="rounded-lg border border-purple-500/40 bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-100 transition hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingAnnouncement ? (
                    <>
                      <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Mail className="inline h-4 w-4 mr-2" />
                      إرسال الإعلان
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
