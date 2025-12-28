"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Settings,
  Bell,
  Trophy,
  Calendar,
  Users,
  Play,
  Globe,
  FileText,
  MessageSquare,
  UserPlus,
  EyeOff,
  Lock,
  Loader2,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { dashboardService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { ChipPill } from "@/components/ui/chip-pill";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

interface CampSettings {
  enable_leaderboard: boolean;
  enable_study_hall: boolean;
  enable_public_enrollment: boolean;
  auto_start_camp: boolean;
  max_participants: number | null;
  enable_notifications: boolean;
  enable_daily_reminders: boolean;
  enable_achievement_notifications: boolean;
  visibility_mode: "public" | "private" | "unlisted";
  allow_user_content: boolean;
  surah_name: string;
  name: string;
  enable_interactions: boolean;
}

type VisibilityMode = CampSettings["visibility_mode"];

type IconRenderer = (props: { className?: string }) => React.ReactNode;

interface VisibilityOption {
  value: VisibilityMode;
  label: string;
  description: string;
  hint: string;
  icon: IconRenderer;
}

const VISIBILITY_CHOICES: VisibilityOption[] = [
  {
    value: "public",
    label: "عام",
    description: "مرئي في صفحة المخيمات وقابل للبحث",
    hint: "مفتوح للجميع",
    icon: Globe,
  },
  {
    value: "unlisted",
    label: "غير مدرج",
    description: "لا يظهر في الصفحة العامة لكن متاح بالرابط المباشر",
    hint: "يشارك بالرابط فقط",
    icon: EyeOff,
  },
  {
    value: "private",
    label: "خاص",
    description: "لا يظهر إلا للمشرفين ولا يمكن الاشتراك بدون دعوة",
    hint: "محمي بالكامل",
    icon: Lock,
  },
];

interface ToggleCardProps {
  icon: IconRenderer;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

const ToggleCard = ({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  disabled,
}: ToggleCardProps) => {
  return (
    <label
      className={cn(
        "group relative flex h-full cursor-pointer flex-col gap-4 rounded-3xl border px-5 py-4 transition-all duration-200",
        checked
          ? "border-primary/50 bg-primary/10 shadow-card"
          : "border-slate-800 bg-slate-950/50 hover:border-slate-800",
        disabled &&
          "cursor-not-allowed opacity-50 shadow-none hover:border-slate-800"
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
      />
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-slate-100">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="space-y-1 text-right">
          <p className="text-sm font-semibold text-slate-100">{title}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm font-medium text-slate-300">
        <span>{checked ? "مفعل" : "معطل"}</span>
        <span
          className={cn(
            "relative inline-flex h-6 w-12 items-center rounded-full bg-slate-800 transition",
            checked && "bg-primary/80"
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
              checked ? "translate-x-1" : "translate-x-[-25px]"
            )}
          />
        </span>
      </div>
    </label>
  );
};

export default function CampSettingsPage() {
  const params = useParams();
  const campId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [camp, setCamp] = useState<CampSettings>({
    enable_leaderboard: true,
    enable_study_hall: true,
    enable_public_enrollment: true,
    auto_start_camp: false,
    max_participants: null,
    enable_notifications: true,
    enable_daily_reminders: true,
    enable_achievement_notifications: true,
    visibility_mode: "public",
    allow_user_content: true,
    surah_name: "",
    name: "",
    enable_interactions: true,
  });
  const [previousEnablePublicEnrollment, setPreviousEnablePublicEnrollment] =
    useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!campId) return;
      try {
        const [campResponse, settingsResponse] = await Promise.all([
          dashboardService.getQuranCampDetails(campId),
          dashboardService.getAdminCampSettings(campId),
        ]);

        if (campResponse.data?.data) {
          setCamp((prev) => ({
            ...prev,
            ...campResponse.data.data,
          }));
        }

        if (settingsResponse.data?.data) {
          setCamp((prev) => ({
            ...prev,
            ...settingsResponse.data.data,
          }));
        }
      } catch (err) {
        setError("حدث خطأ أثناء تحميل الإعدادات");
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };

    if (campId) {
      fetchData();
    }
  }, [campId]);

  const handleCampSettingChange = (
    key: keyof CampSettings,
    value: boolean | string | number | null
  ) => {
    // Track enable_public_enrollment changes for notification
    if (key === "enable_public_enrollment") {
      const oldValue = camp.enable_public_enrollment;
      const newValue = value as boolean;
      if (oldValue === false && newValue === true) {
        // Show notification that emails will be sent
        toast({
          title: "تنبيه",
          description:
            "سيتم إرسال إشعارات بريدية للمشتركين في القائمة عند فتح المخيم",
        });
      }
    }
    setCamp((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!campId) return;
    try {
      setSaving(true);
      setError(null);
      await dashboardService.updateAdminCampSettings(campId, camp);
      toast({
        title: "تم حفظ الإعدادات بنجاح",
      });
    } catch (err) {
      console.error("Error updating settings:", err);
      setError("حدث خطأ في حفظ الإعدادات");
      toast({
        title: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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

  const activeVisibility =
    VISIBILITY_CHOICES.find(
      (option) => option.value === camp.visibility_mode
    ) ?? VISIBILITY_CHOICES[0];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <ActionToolbar
          title="إعدادات المخيم"
          subtitle={
            camp?.name
              ? `${camp.name} • سورة ${camp.surah_name || "غير محددة"}`
              : "التحكم في إعدادات هذا المخيم"
          }
          secondaryActions={
            <Link
              href={`/dashboard/quran-camps/${campId}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة للتفاصيل
            </Link>
          }
          endSlot={
            <div className="flex flex-wrap items-center gap-2">
              <ChipPill variant="neutral" className="gap-2">
                <Globe className="h-4 w-4" />
                {activeVisibility.label}
              </ChipPill>
              <ChipPill variant="neutral" className="gap-2">
                <Users className="h-4 w-4" />
                {camp.max_participants
                  ? `${camp.max_participants} حد أقصى`
                  : "بدون حد"}
              </ChipPill>
            </div>
          }
        />

        {error ? (
          <div className="rounded-3xl border border-rose-900/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="وضع الرؤية"
            value={activeVisibility.label}
            description={activeVisibility.description}
            icon={<Globe className="h-6 w-6" />}
          />
          <StatCard
            label="طريقة التسجيل"
            value={
              camp.enable_public_enrollment
                ? "التسجيل العام مفتوح"
                : "دعوات فقط"
            }
            description={
              camp.max_participants
                ? `الحد الأقصى ${camp.max_participants} مشترك`
                : "بدون حد أقصى للمشتركين"
            }
            icon={<UserPlus className="h-6 w-6" />}
          />
          <StatCard
            label="الإشعارات"
            value={camp.enable_notifications ? "مفعلة" : "معطلة"}
            description={
              camp.enable_notifications
                ? camp.enable_daily_reminders
                  ? "تشمل التذكيرات اليومية"
                  : "بدون تذكيرات يومية"
                : "لن يتم إرسال أي إشعارات"
            }
            icon={<Bell className="h-6 w-6" />}
          />
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                الرؤية والوصول
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                اختر كيف يظهر المخيم للمستخدمين الآخرين
              </p>
            </div>
            <Globe className="h-5 w-5 text-primary-100" />
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            {VISIBILITY_CHOICES.map((option) => {
              const Icon = option.icon;
              const active = camp.visibility_mode === option.value;
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() =>
                    handleCampSettingChange("visibility_mode", option.value)
                  }
                  className={cn(
                    "flex h-full flex-col gap-4 rounded-3xl border p-4 text-right transition",
                    active
                      ? "border-primary/60 bg-primary/10 shadow-card"
                      : "border-slate-800 bg-slate-950/40 hover:border-slate-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-slate-100">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-100">
                        {option.label}
                      </p>
                      <p className="text-xs text-slate-400">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <ChipPill variant="neutral" className="w-max">
                    {option.hint}
                  </ChipPill>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                التفاعل والمجتمع
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                اضبط الأدوات التفاعلية داخل المخيم
              </p>
            </div>
            <Settings className="h-5 w-5 text-primary-100" />
          </header>

          <div className="grid gap-4 lg:grid-cols-2">
            <ToggleCard
              icon={Trophy}
              title="لوحة المتصدرين"
              description="إظهار نقاط المشتركين وتشجيع المنافسة المحفزة"
              checked={camp.enable_leaderboard}
              onChange={(value) =>
                handleCampSettingChange("enable_leaderboard", value)
              }
            />
            <ToggleCard
              icon={FileText}
              title="قاعة الدراسة"
              description="تفعيل مساحة مشتركة لمتابعة الدروس والأنشطة اليومية"
              checked={camp.enable_study_hall}
              onChange={(value) =>
                handleCampSettingChange("enable_study_hall", value)
              }
            />
            <ToggleCard
              icon={UserPlus}
              title="التسجيل العام"
              description={
                camp.enable_public_enrollment
                  ? "التسجيل مفتوح للجميع"
                  : "التسجيل مغلق - لا يمكن لأحد التسجيل في أي فوج"
              }
              checked={camp.enable_public_enrollment}
              onChange={(value) =>
                handleCampSettingChange("enable_public_enrollment", value)
              }
            />
            {camp.enable_public_enrollment === false && (
              <div className="rounded-xl border border-yellow-800 bg-yellow-950/40 p-3 text-sm text-yellow-200">
                <p className="font-medium">المخيم مغلق</p>
                <p className="mt-1 text-xs text-yellow-300">
                  لا يمكن لأحد التسجيل في أي فوج حتى يتم فتح المخيم
                </p>
              </div>
            )}
            <ToggleCard
              icon={MessageSquare}
              title="محتوى المجتمع"
              description="السماح للمشتركين بمشاركة التدبر والفوائد اليومية"
              checked={camp.allow_user_content}
              onChange={(value) =>
                handleCampSettingChange("allow_user_content", value)
              }
            />
            <ToggleCard
              icon={Users}
              title="التفاعلات على المحتوى"
              description="تمكين الإعجابات والحفظ للمشاركات داخل المخيم"
              checked={camp.enable_interactions}
              onChange={(value) =>
                handleCampSettingChange("enable_interactions", value)
              }
              disabled={!camp.allow_user_content}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                الإشعارات والتذكيرات
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                تحكم في الرسائل التي تصل للمشتركين
              </p>
            </div>
            <Bell className="h-5 w-5 text-primary-100" />
          </header>

          <div className="grid gap-4 lg:grid-cols-3">
            <ToggleCard
              icon={Bell}
              title="الإشعارات العامة"
              description="إرسال التنبيهات العامة حول تحديثات المخيم"
              checked={camp.enable_notifications}
              onChange={(value) =>
                handleCampSettingChange("enable_notifications", value)
              }
            />
            <ToggleCard
              icon={Calendar}
              title="التذكيرات اليومية"
              description="تذكيرات يومية لإكمال المهام والورد القرآني"
              checked={camp.enable_daily_reminders}
              onChange={(value) =>
                handleCampSettingChange("enable_daily_reminders", value)
              }
              disabled={!camp.enable_notifications}
            />
            <ToggleCard
              icon={Trophy}
              title="تنبيهات الإنجازات"
              description="إخطار المشتركين عند إكمال مهام أو تحقيق إنجاز"
              checked={camp.enable_achievement_notifications}
              onChange={(value) =>
                handleCampSettingChange(
                  "enable_achievement_notifications",
                  value
                )
              }
              disabled={!camp.enable_notifications}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                إدارة الطاقة والاستمرارية
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                تحكم في الحد الأقصى للمشتركين وتشغيل المخيم تلقائياً
              </p>
            </div>
            <Play className="h-5 w-5 text-primary-100" />
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
              <label className="text-sm font-semibold text-slate-200">
                الحد الأقصى للمشتركين
              </label>
              <p className="text-xs text-slate-400">
                اترك الحقل فارغاً لإبقاء المخيم مفتوحاً للجميع.
              </p>
              <input
                type="number"
                min={1}
                value={
                  camp.max_participants ? Number(camp.max_participants) : ""
                }
                onChange={(event) =>
                  handleCampSettingChange(
                    "max_participants",
                    event.target.value ? parseInt(event.target.value, 10) : null
                  )
                }
                placeholder="مثال: 120"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <ToggleCard
              icon={Play}
              title="تشغيل تلقائي للمخيم"
              description="بدء المخيم عند وصوله لتاريخ البداية بدون تدخل يدوي"
              checked={camp.auto_start_camp}
              onChange={(value) =>
                handleCampSettingChange("auto_start_camp", value)
              }
            />
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900 px-6 py-5">
          <div className="text-sm text-slate-400">
            أي تغيير هنا ينعكس مباشرة على جميع المشتركين بعد الحفظ.
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/dashboard/quran-camps/${campId}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
            >
              إلغاء
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
