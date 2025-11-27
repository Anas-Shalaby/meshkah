// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Bell,
  Users,
  CheckCircle,
  Clock3,
  Target,
  Loader2,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { ChipPill } from "@/components/ui/chip-pill";
import { StatCard } from "@/components/ui/stat-card";

type NotificationTemplate = {
  id: string;
  title: string;
  message: string;
  description: string;
  target_type: "all" | "active" | "completed";
};

const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: "welcome",
    title: "ترحيب",
    message:
      "أهلاً وسهلاً بك في المخيم! نحن سعداء لانضمامك إلينا في هذه الرحلة القرآنية المباركة. نتمنى لك تجربة رائعة ومثمرة.",
    description: "رسالة ترحيبية للمشتركين الجدد",
    target_type: "all",
  },
  {
    id: "reminder",
    title: "تذكير يومي",
    message:
      "تذكير لطيف: لا تنس إكمال مهام اليوم! استمر في رحلتك القرآنية وخذ وقتك للتدبر والفهم.",
    description: "تذكير للمشتركين لإكمال المهام اليومية",
    target_type: "active",
  },
  {
    id: "congratulations",
    title: "تهنئة",
    message:
      "مبروك! لقد أكملت المخيم بنجاح. نشكرك على التزامك ومثابرتك طوال هذه الرحلة المباركة. استمر في حفظك وتدبرك للقرآن الكريم.",
    description: "رسالة تهنئة للمشتركين المكتملين",
    target_type: "completed",
  },
  {
    id: "motivation",
    title: "تحفيز",
    message:
      "أنت تقوم بعمل رائع! استمر في التقدم وإكمال مهامك اليومية. كل خطوة تقربك من هدفك في حفظ وتدبر القرآن الكريم.",
    description: "رسالة تحفيزية للمشتركين النشطين",
    target_type: "active",
  },
];

export default function CampNotificationsPage() {
  const params = useParams();
  const campId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [camp, setCamp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    message: string;
    target_type: "all" | "active" | "completed" | "specific";
    target_user_ids: number[];
  }>({
    title: "",
    message: "",
    target_type: "all",
    target_user_ids: [],
  });

  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!campId) return;
      try {
        const [campResponse, participantsResponse] = await Promise.all([
          dashboardService.getQuranCampDetails(campId),
          dashboardService.getCampParticipants(campId),
        ]);

        setCamp(campResponse.data?.data);
        setParticipants(participantsResponse.data?.data || []);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل البيانات");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (campId) {
      fetchData();
    }
  }, [campId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (formData.target_type === "specific" && selectedUsers.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد مستخدمين على الأقل",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      setError(null);

      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        target_type: formData.target_type,
        ...(formData.target_type === "specific"
          ? { target_user_ids: selectedUsers }
          : {}),
      };

      const response = await dashboardService.sendCampNotification(
        campId!,
        payload
      );

      if (response.success) {
        toast({
          title: "تم بنجاح",
          description: `تم إرسال الإشعار إلى ${
            response.data?.success_count || 0
          } مستخدم`,
        });

        // Reset form
        setFormData({
          title: "",
          message: "",
          target_type: "all",
          target_user_ids: [],
        });
        setSelectedUsers([]);
        setSelectedTemplate(null);
      } else {
        throw new Error(response.message || "فشل في إرسال الإشعار");
      }
    } catch (err: any) {
      console.error("Error sending notification:", err);
      toast({
        title: "خطأ",
        description:
          err.response?.data?.message || "حدث خطأ أثناء إرسال الإشعار",
        variant: "destructive",
      });
      setError(err.response?.data?.message || "حدث خطأ أثناء إرسال الإشعار");
    } finally {
      setSending(false);
    }
  };

  const getTargetCount = () => {
    switch (formData.target_type) {
      case "all":
        return participants.length;
      case "active":
        return participants.filter((p) => (p.completion_percentage || 0) < 100)
          .length;
      case "completed":
        return participants.filter((p) => (p.completion_percentage || 0) >= 100)
          .length;
      case "specific":
        return selectedUsers.length;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-800 border-t-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !camp) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  const activeCount = participants.filter(
    (p) => (p.completion_percentage || 0) < 100
  ).length;
  const completedCount = participants.filter(
    (p) => (p.completion_percentage || 0) >= 100
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <ActionToolbar
          title="إرسال إشعارات"
          subtitle={camp?.name || "المخيم"}
          secondaryActions={
            <Link
              href={`/dashboard/quran-camps/${campId}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة
            </Link>
          }
          endSlot={
            <ChipPill variant="neutral" className="gap-2">
              <Bell className="h-4 w-4" />
              {participants.length} مشترك
            </ChipPill>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="إجمالي المشتركين"
            value={participants.length}
            icon={<Users className="h-6 w-6" />}
            variant="neutral"
          />
          <StatCard
            label="النشطين"
            value={activeCount}
            icon={<Clock3 className="h-6 w-6" />}
            variant="positive"
          />
          <StatCard
            label="المكتملين"
            value={completedCount}
            icon={<CheckCircle className="h-6 w-6" />}
            variant="attention"
          />
        </div>

        {error && (
          <div className="rounded-3xl border border-rose-900/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  معلومات الإشعار
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  أدخل عنوان ورسالة الإشعار
                </p>
              </div>
              <Bell className="h-5 w-5 text-primary-100" />
            </header>

            <div className="space-y-4">
              {/* Templates */}
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  قوالب جاهزة
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {NOTIFICATION_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setFormData({
                          ...formData,
                          title: template.title,
                          message: template.message,
                          target_type: template.target_type,
                        });
                        setSelectedUsers([]);
                      }}
                      className={`rounded-xl border p-3 text-right transition ${
                        selectedTemplate === template.id
                          ? "border-primary/60 bg-primary/10"
                          : "border-slate-700 bg-slate-900 hover:border-slate-600"
                      }`}
                    >
                      <div className="font-medium text-slate-100 mb-1">
                        {template.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {template.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">
                  العنوان <span className="text-rose-400">*</span>
                </span>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="مثال: تذكير مهم للمشتركين"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">
                  الرسالة <span className="text-rose-400">*</span>
                </span>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="اكتب رسالتك هنا..."
                  rows={6}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
                <p className="text-xs text-slate-400">
                  {formData.message.length} حرف
                </p>
              </label>
            </div>
          </section>

          {/* Target Selection */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  اختيار المستلمين
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  اختر من سيستلم هذا الإشعار
                </p>
              </div>
              <Target className="h-5 w-5 text-primary-100" />
            </header>

            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">
                  نوع المستلمين
                </span>
                <select
                  value={formData.target_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      target_type: e.target.value as
                        | "all"
                        | "active"
                        | "completed"
                        | "specific",
                    })
                  }
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="all">جميع المشتركين</option>
                  <option value="active">المشتركون النشطون فقط</option>
                  <option value="completed">المشتركون المكتملون فقط</option>
                  <option value="specific">مستخدمون محددون</option>
                </select>
              </label>

              {formData.target_type === "specific" && (
                <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    اختر المستخدمين
                  </label>
                  <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                    {participants.map((participant) => (
                      <label
                        key={participant.user_id}
                        className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 p-3 transition hover:bg-slate-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(participant.user_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([
                                ...selectedUsers,
                                participant.user_id,
                              ]);
                            } else {
                              setSelectedUsers(
                                selectedUsers.filter(
                                  (id) => id !== participant.user_id
                                )
                              );
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-slate-100">
                            {participant.username || participant.email}
                          </p>
                          <p className="text-xs text-slate-400">
                            تقدم: {participant.completion_percentage || 0}%
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              {formData.title && formData.message && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-azure-500/40 bg-azure-900/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-azure-300" />
                      <span className="font-medium text-azure-200">
                        سيتم إرسال الإشعار إلى:
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-azure-100">
                      {getTargetCount()} مستخدم
                    </p>
                  </div>

                  <div className="rounded-2xl border border-purple-500/40 bg-purple-900/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Bell className="h-5 w-5 text-purple-300" />
                      <span className="font-medium text-purple-200">
                        معاينة الإشعار:
                      </span>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="rounded-xl border border-purple-700/50 bg-purple-950/40 p-3">
                        <div className="font-semibold text-purple-100 mb-1">
                          {formData.title}
                        </div>
                        <div className="text-sm text-purple-200 whitespace-pre-wrap">
                          {formData.message}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href={`/dashboard/quran-camps/${campId}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={sending || getTargetCount() === 0}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-5 py-2 text-sm font-medium text-primary-100 transition hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  إرسال الإشعار
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
