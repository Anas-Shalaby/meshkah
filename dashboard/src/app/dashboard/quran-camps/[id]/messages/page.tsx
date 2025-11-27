// @ts-nocheck
"use client";

import { useState, useEffect, useMemo, ReactNode, MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  X,
  Calendar,
  MessageSquare,
  Send,
  Sparkles,
  Heart,
  Target,
  BookOpen,
  CheckCircle2,
  Clock,
  Save,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { ChipPill } from "@/components/ui/chip-pill";
import { StatCard } from "@/components/ui/stat-card";

interface DailyMessage {
  id: number;
  camp_id: number;
  day_number: number;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CampSummary {
  id: number;
  name: string;
  surah_name: string;
  duration_days: number;
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

  const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
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
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl`}
        onClick={handleContentClick}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {title ? (
              <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
            ) : null}
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

const MESSAGE_TEMPLATES = [
  {
    id: "welcome",
    name: "رسالة ترحيب",
    title: "مرحباً بك في اليوم {day}",
    message:
      "أهلاً وسهلاً بك في اليوم {day} من مخيم {camp_name}! 🌟\n\nنتمنى لك رحلة مباركة ومثمرة في حفظ وتدبر القرآن الكريم.\n\nاستعد للمهام اليومية واستمتع بالرحلة!",
  },
  {
    id: "motivation",
    name: "رسالة تحفيزية",
    title: "استمر في التقدم! اليوم {day}",
    message:
      "رائع! أنت في اليوم {day} من مخيم {camp_name}! 🎯\n\nاستمر في التقدم ولا تتوقف. كل خطوة تقربك من هدفك.\n\nبارك الله في جهدك!",
  },
  {
    id: "reminder",
    name: "تذكير بالمهام",
    title: "تذكير: مهام اليوم {day}",
    message:
      "تذكير لطيف: لديك مهام مباركة في انتظارك اليوم! 📖\n\nلا تنسَ إكمال مهام اليوم {day} من مخيم {camp_name}.\n\nالوقت الآن مناسب للبدء!",
  },
  {
    id: "milestone",
    name: "إنجاز هام",
    title: "تهنئة: إكمال {day}% من الرحلة",
    message:
      "مبارك! لقد أكملت {day}% من رحلتك في مخيم {camp_name}! 🎉\n\nأنت تقوم بعمل رائع. استمر في التقدم!\n\nبارك الله في مسيرتك!",
  },
  {
    id: "encouragement",
    name: "رسالة تشجيع",
    title: "أنت تقوم بعمل رائع!",
    message:
      "نريد أن نخبرك أنك تقوم بعمل رائع في مخيم {camp_name}! 💪\n\nاستمر في التقدم واعلم أن كل جهدك محسوب ومثابرة.\n\nبارك الله فيك!",
  },
];

export default function DailyMessagesPage() {
  const params = useParams();
  const campId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [camp, setCamp] = useState<CampSummary | null>(null);
  const [messages, setMessages] = useState<DailyMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<DailyMessage | null>(
    null
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [formData, setFormData] = useState({
    day_number: 1,
    title: "",
    message: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!campId) return;
      try {
        setLoading(true);
        const [campResponse, messagesResponse] = await Promise.all([
          dashboardService.getQuranCampDetails(campId),
          dashboardService.getCampDailyMessages(campId),
        ]);

        setCamp(campResponse.data?.data ?? null);
        if (messagesResponse.success && messagesResponse.data) {
          setMessages(messagesResponse.data.messages || []);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "حدث خطأ أثناء تحميل البيانات");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campId]);

  const handleCreate = () => {
    setSelectedMessage(null);
    setSelectedTemplate("");
    setFormData({
      day_number: 1,
      title: "",
      message: "",
      is_active: true,
    });
    setShowCreateModal(true);
  };

  const handleEdit = (message: DailyMessage) => {
    setSelectedMessage(message);
    setFormData({
      day_number: message.day_number,
      title: message.title,
      message: message.message,
      is_active: message.is_active,
    });
    setShowEditModal(true);
  };

  const handleDelete = (message: DailyMessage) => {
    setSelectedMessage(message);
    setShowDeleteModal(true);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = MESSAGE_TEMPLATES.find((t) => t.id === templateId);
    if (template && camp) {
      setSelectedTemplate(templateId);
      setFormData({
        ...formData,
        title: template.title
          .replace("{day}", formData.day_number.toString())
          .replace("{camp_name}", camp.name),
        message: template.message
          .replace(/{day}/g, formData.day_number.toString())
          .replace(/{camp_name}/g, camp.name),
      });
    }
  };

  const handleSave = async () => {
    if (!campId) return;

    if (!formData.title || !formData.message) {
      alert("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      setSaving(true);
      if (selectedMessage) {
        // Update
        await dashboardService.updateDailyMessage(
          selectedMessage.id.toString(),
          formData
        );
        alert("✅ تم تحديث الرسالة بنجاح");
      } else {
        // Create
        await dashboardService.createDailyMessage(campId, formData);
        alert("✅ تم إنشاء الرسالة بنجاح");
      }

      // Refresh messages
      const messagesResponse = await dashboardService.getCampDailyMessages(
        campId
      );
      if (messagesResponse.success && messagesResponse.data) {
        setMessages(messagesResponse.data.messages || []);
      }

      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedMessage(null);
      setFormData({
        day_number: 1,
        title: "",
        message: "",
        is_active: true,
      });
    } catch (err: any) {
      console.error("Error saving message:", err);
      alert(err.response?.data?.message || "❌ حدث خطأ أثناء حفظ الرسالة");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedMessage) return;

    try {
      setSaving(true);
      await dashboardService.deleteDailyMessage(selectedMessage.id.toString());

      // Refresh messages
      const messagesResponse = await dashboardService.getCampDailyMessages(
        campId!
      );
      if (messagesResponse.success && messagesResponse.data) {
        setMessages(messagesResponse.data.messages || []);
      }

      setShowDeleteModal(false);
      setSelectedMessage(null);
      alert("✅ تم حذف الرسالة بنجاح");
    } catch (err: any) {
      console.error("Error deleting message:", err);
      alert(err.response?.data?.message || "❌ حدث خطأ أثناء حذف الرسالة");
    } finally {
      setSaving(false);
    }
  };

  // Group messages by day
  const messagesByDay = useMemo(() => {
    const grouped: Record<number, DailyMessage[]> = {};
    messages.forEach((msg) => {
      if (!grouped[msg.day_number]) {
        grouped[msg.day_number] = [];
      }
      grouped[msg.day_number].push(msg);
    });
    return grouped;
  }, [messages]);

  // Statistics
  const stats = useMemo(() => {
    const total = messages.length;
    const active = messages.filter((m) => m.is_active).length;
    const inactive = messages.filter((m) => !m.is_active).length;
    const daysWithMessages = new Set(messages.map((m) => m.day_number)).size;
    const daysWithoutMessages = (camp?.duration_days || 0) - daysWithMessages;

    return { total, active, inactive, daysWithMessages, daysWithoutMessages };
  }, [messages, camp]);

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
      <div className="space-y-8 pb-12">
        <ActionToolbar
          title="إدارة الرسائل اليومية"
          subtitle={camp?.name ? `رسائل يومية لـ ${camp.name}` : undefined}
          meta={
            <ChipPill variant="neutral" className="border border-slate-700">
              {messages.length} رسالة
            </ChipPill>
          }
          secondaryActions={
            <Link
              href={`/dashboard/quran-camps/${campId}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة للتفاصيل
            </Link>
          }
          primaryAction={
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              إضافة رسالة
            </button>
          }
        />

        {/* Stats Cards */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="إجمالي الرسائل"
            value={stats.total}
            icon={<MessageSquare className="h-6 w-6 text-primary-100" />}
            delta={{
              value: `${stats.active} نشطة`,
              trend: stats.active > 0 ? "up" : "neutral",
            }}
          />
          <StatCard
            label="رسائل نشطة"
            value={stats.active}
            icon={<CheckCircle2 className="h-6 w-6 text-emerald-200" />}
            delta={{
              value: `${stats.inactive} معطلة`,
              trend: stats.active > stats.inactive ? "up" : "neutral",
            }}
          />
          <StatCard
            label="أيام برسائل"
            value={stats.daysWithMessages}
            icon={<Calendar className="h-6 w-6 text-azure-200" />}
            delta={{
              value: `${stats.daysWithoutMessages} بدون رسائل`,
              trend: stats.daysWithMessages > 0 ? "up" : "neutral",
            }}
          />
          <StatCard
            label="مدة المخيم"
            value={`${camp?.duration_days || 0} يوم`}
            icon={<Clock className="h-6 w-6 text-amber-200" />}
            delta={{
              value: `${Math.round(
                (stats.daysWithMessages / (camp?.duration_days || 1)) * 100 || 0
              )}% تغطية`,
              trend: stats.daysWithMessages > 0 ? "up" : "neutral",
            }}
          />
        </section>

        {/* Messages by Day */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900 shadow-lg">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-100">
              الرسائل المجدولة ({messages.length})
            </h2>
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-slate-400">
              <MessageSquare className="h-12 w-12" />
              <p>لا توجد رسائل مجدولة بعد</p>
              <button
                onClick={handleCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-4 py-2 text-sm text-primary-100 transition hover:bg-primary/30"
              >
                <Plus className="h-4 w-4" />
                إضافة أول رسالة
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {Array.from(
                { length: camp?.duration_days || 0 },
                (_, i) => i + 1
              ).map((day) => {
                const dayMessages = messagesByDay[day] || [];
                return (
                  <div
                    key={day}
                    className="px-6 py-5 transition hover:bg-slate-900/70"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-sm font-bold text-primary-100">
                          {day}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-100">
                            اليوم {day}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {dayMessages.length > 0
                              ? `${dayMessages.length} رسالة`
                              : "لا توجد رسائل"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setFormData({
                            day_number: day,
                            title: "",
                            message: "",
                            is_active: true,
                          });
                          setSelectedMessage(null);
                          setShowCreateModal(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-3 py-1.5 text-xs text-primary-100 transition hover:bg-primary/30"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        إضافة رسالة
                      </button>
                    </div>
                    {dayMessages.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {dayMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`rounded-xl border p-4 ${
                              msg.is_active
                                ? "border-emerald-500/40 bg-emerald-500/10"
                                : "border-slate-700 bg-slate-950/60 opacity-60"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="mb-2 flex items-center gap-2">
                                  <h4 className="text-sm font-semibold text-slate-100">
                                    {msg.title}
                                  </h4>
                                  {msg.is_active ? (
                                    <ChipPill
                                      variant="success"
                                      className="border border-emerald-500/40 bg-emerald-900/30 px-2 py-0.5 text-xs text-emerald-200"
                                    >
                                      نشط
                                    </ChipPill>
                                  ) : (
                                    <ChipPill
                                      variant="neutral"
                                      className="border border-slate-500/40 bg-slate-900/30 px-2 py-0.5 text-xs text-slate-400"
                                    >
                                      معطل
                                    </ChipPill>
                                  )}
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                                  {msg.message}
                                </p>
                              </div>
                              <div className="ml-4 flex items-center gap-2">
                                <button
                                  onClick={() => handleEdit(msg)}
                                  className="rounded-full border border-primary/40 bg-primary/20 p-2 text-primary-100 transition hover:bg-primary/30"
                                  title="تعديل"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(msg)}
                                  className="rounded-full border border-rose-500/40 bg-rose-500/10 p-2 text-rose-200 transition hover:bg-rose-500/20"
                                  title="حذف"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <Modal
            size="lg"
            title={
              selectedMessage
                ? "تعديل الرسالة اليومية"
                : "إضافة رسالة يومية جديدة"
            }
            description={`اليوم ${formData.day_number} من ${camp?.name || ""}`}
            onClose={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              setSelectedMessage(null);
              setSelectedTemplate("");
              setFormData({
                day_number: 1,
                title: "",
                message: "",
                is_active: true,
              });
            }}
            footer={
              <>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedMessage(null);
                    setSelectedTemplate("");
                    setFormData({
                      day_number: 1,
                      title: "",
                      message: "",
                      is_active: true,
                    });
                  }}
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-4 py-2 text-sm text-primary-100 transition hover:bg-primary/30 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-100 border-t-transparent" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      حفظ
                    </>
                  )}
                </button>
              </>
            }
          >
            <div className="space-y-6">
              {/* Templates */}
              {!selectedMessage && (
                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-200">
                    قوالب جاهزة:
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {MESSAGE_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template.id)}
                        className={`rounded-xl border p-3 text-right transition ${
                          selectedTemplate === template.id
                            ? "border-primary/60 bg-primary/20 text-primary-100"
                            : "border-slate-700 bg-slate-950/60 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {template.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Day Number */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  رقم اليوم: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={camp?.duration_days || 30}
                  value={formData.day_number}
                  onChange={(e) => {
                    const day = parseInt(e.target.value) || 1;
                    setFormData({ ...formData, day_number: day });
                    // Update template if selected
                    if (selectedTemplate) {
                      handleTemplateSelect(selectedTemplate);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-slate-400">
                  من 1 إلى {camp?.duration_days || 0} يوم
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  العنوان: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="مثال: مرحباً بك في اليوم الأول"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Message */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  الرسالة: <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="اكتب محتوى الرسالة هنا..."
                  rows={8}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="mt-2 text-xs text-slate-400">
                  يمكنك استخدام {`{day}`} و {`{camp_name}`} في النص وسيتم
                  استبدالها تلقائياً
                </p>
              </div>

              {/* Preview */}
              {formData.title && formData.message && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="mb-2 text-xs font-semibold text-slate-400">
                    معاينة:
                  </p>
                  <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                    <h4 className="mb-2 text-sm font-semibold text-primary-100">
                      {formData.title
                        .replace(/{day}/g, formData.day_number.toString())
                        .replace(/{camp_name}/g, camp?.name || "")}
                    </h4>
                    <p className="text-sm text-primary-200 leading-relaxed whitespace-pre-wrap">
                      {formData.message
                        .replace(/{day}/g, formData.day_number.toString())
                        .replace(/{camp_name}/g, camp?.name || "")}
                    </p>
                  </div>
                </div>
              )}

              {/* Active Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    تفعيل الرسالة
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    الرسائل المعطلة لن يتم إرسالها
                  </p>
                </div>
                <button
                  onClick={() =>
                    setFormData({ ...formData, is_active: !formData.is_active })
                  }
                  className={`relative h-6 w-11 rounded-full transition ${
                    formData.is_active ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${
                      formData.is_active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedMessage && (
          <Modal
            title="تأكيد الحذف"
            description="هل أنت متأكد من حذف هذه الرسالة؟"
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedMessage(null);
            }}
            footer={
              <>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedMessage(null);
                  }}
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={saving}
                  className="rounded-full border border-rose-500/40 bg-rose-500/20 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/30 disabled:opacity-50"
                >
                  {saving ? "جاري الحذف..." : "حذف"}
                </button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm font-medium text-slate-200">
                  {selectedMessage.title}
                </p>
                <p className="mt-2 text-sm text-slate-400 line-clamp-3">
                  {selectedMessage.message}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <ChipPill
                    variant="neutral"
                    className="border border-slate-700 bg-slate-900/80 text-slate-300"
                  >
                    اليوم {selectedMessage.day_number}
                  </ChipPill>
                  {selectedMessage.is_active ? (
                    <ChipPill
                      variant="success"
                      className="border border-emerald-500/40 bg-emerald-900/30 text-emerald-200"
                    >
                      نشط
                    </ChipPill>
                  ) : (
                    <ChipPill
                      variant="neutral"
                      className="border border-slate-500/40 bg-slate-900/30 text-slate-400"
                    >
                      معطل
                    </ChipPill>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}


