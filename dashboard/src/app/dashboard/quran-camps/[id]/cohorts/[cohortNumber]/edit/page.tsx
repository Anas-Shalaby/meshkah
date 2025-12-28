"use client";

// @ts-nocheck
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Calendar,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { ChipPill } from "@/components/ui/chip-pill";

export default function EditCohortPage() {
  const params = useParams();
  const router = useRouter();
  const rawCampId = params?.id;
  const campId =Array.isArray(rawCampId) ? rawCampId[0] : rawCampId || "";
  const cohortNumber = parseInt((params?.cohortNumber as string) || "0");

  const [cohort, setCohort] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (campId && cohortNumber) {
      loadCohortDetails();
    }
  }, [campId, cohortNumber]);

  const loadCohortDetails = async () => {
    try {
      const response = await dashboardService.getCampCohort(
        campId,
        cohortNumber
      );
      const cohortData = response.data;
      setCohort(cohortData);

      // Populate form
      setName(cohortData.name || "");
      setStartDate(
        cohortData.start_date
          ? new Date(cohortData.start_date).toISOString().split("T")[0]
          : ""
      );
      setEndDate(
        cohortData.end_date
          ? new Date(cohortData.end_date).toISOString().split("T")[0]
          : ""
      );
      setMaxParticipants(cohortData.max_participants?.toString() || "");
      setStatus(cohortData.status || "scheduled");
      setIsOpen(cohortData.is_open === 1);

      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "حدث خطأ في جلب تفاصيل الفوج");
      console.error("Error loading cohort:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate) {
      alert("يرجى تحديد تاريخ البدء");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updateData: any = {
        name: name.trim() || undefined,
        start_date: startDate,
        end_date: endDate || undefined,
        max_participants: maxParticipants ? parseInt(maxParticipants) : undefined,
        status,
        is_open: isOpen,
      };

      // Remove undefined values
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key]
      );

      await dashboardService.updateCampCohort(
        campId,
        cohortNumber,
        updateData
      );

      alert("✅ تم تحديث الفوج بنجاح!");
      router.push(`/dashboard/quran-camps/${campId}/cohorts/${cohortNumber}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "حدث خطأ في تحديث الفوج");
      console.error("Error updating cohort:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-slate-400">جاري التحميل...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !cohort) {
    return (
      <DashboardLayout>
        <div className="rounded-3xl border border-rose-900/40 bg-rose-950/30 px-6 py-4 text-rose-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <p>{error || "الفوج غير موجود"}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit} className="space-y-6 pb-12">
        <ActionToolbar
          title="تعديل الفوج"
          subtitle={`${cohort?.camp_name} • الفوج ${cohortNumber}`}
          meta={
            <ChipPill variant="neutral" className="bg-purple-500/20 border-purple-500/40 text-purple-200">
              <Calendar className="h-3.5 w-3.5" />
              تعديل
            </ChipPill>
          }
          secondaryActions={
            <>
              <Link
                href={`/dashboard/quran-camps/${campId}/cohorts/${cohortNumber}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                إلغاء
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-5 py-2 text-sm font-medium text-primary-100 shadow-sm transition hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    حفظ التغييرات
                  </>
                )}
              </button>
            </>
          }
        />

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
            <div className="flex items-center gap-2 text-rose-200 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-slate-100 mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-100" />
            المعلومات الأساسية
          </h2>

          <div className="space-y-5">
            {/* Cohort Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                اسم الفوج (اختياري)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: الفوج الشتوي"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                اسم مميز للفوج (اختياري). إذا تركت فارغاً سيعرض "الفوج {cohortNumber}"
              </p>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                تاريخ البدء <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                التاريخ الذي سيبدأ فيه الفوج
              </p>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                تاريخ الانتهاء (اختياري)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                سيتم حسابه تلقائياً بناءً على مدة المخيم إذا تركته فارغاً
              </p>
            </div>

            {/* Max Participants */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                الحد الأقصى للمشتركين (اختياري)
              </label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                min="0"
                placeholder="غير محدود"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                عدد المقاعد المتاحة. اتركه فارغاً للسماح بعدد غير محدود
              </p>
            </div>
          </div>
        </section>

        {/* Status & Settings */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-slate-100 mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-100" />
            الحالة والإعدادات
          </h2>

          <div className="space-y-5">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                حالة الفوج
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="scheduled">مجدول</option>
                <option value="early_registration">التسجيل المبكر</option>
                <option value="active">نشط</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <p>• <strong>مجدول:</strong> الفوج مُجدّل للبدء لاحقاً</p>
                <p>• <strong>التسجيل المبكر:</strong> مفتوح للتسجيل قبل البدء</p>
                <p>• <strong>نشط:</strong> الفوج بدأ فعلياً</p>
                <p>• <strong>مكتمل:</strong> انتهى الفوج</p>
              </div>
            </div>

            {/* Is Open */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="is_open"
                checked={isOpen}
                onChange={(e) => setIsOpen(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-950 text-primary focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex-1">
                <label
                  htmlFor="is_open"
                  className="block text-sm font-medium text-slate-300 cursor-pointer"
                >
                  مفتوح للتسجيل
                </label>
                <p className="mt-1 text-xs text-slate-500">
                  السماح للمستخدمين بالتسجيل في هذا الفوج
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Current Participants Warning */}
        {cohort && cohort.participants_count > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-200 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-200 mb-1">
                  تحذير: يوجد {cohort.participants_count} مشترك في هذا الفوج
                </h3>
                <p className="text-sm text-amber-300/80">
                  تعديل تاريخ البدء أو الحالة قد يؤثر على تجربة المشتركين الحاليين.
                  يرجى التأكد من إخطارهم بأي تغييرات.
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </DashboardLayout>
  );
}
