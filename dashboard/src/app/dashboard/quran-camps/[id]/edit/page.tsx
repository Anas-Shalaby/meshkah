// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Calendar, BookOpen, Clock, FileText } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { SURAH_LIST } from "@/constants/surah-list";

export default function EditQuranCampPage() {
  const params = useParams();
  const router = useRouter();
  const campId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campData, setCampData] = useState({
    name: "",
    description: "",
    tags: "",
    surah_number: 20,
    surah_name: "طه",
    start_date: "",
    duration_days: 7,
    banner_image: "",
    status: "early_registration",
  });

  useEffect(() => {
    const fetchCampData = async () => {
      if (!campId) return;
      try {
        const response = await dashboardService.getQuranCampDetails(campId);
        const camp = response.data?.data;

        if (camp) {
          const tagsString =
            camp.tags && Array.isArray(camp.tags) ? camp.tags.join(", ") : "";

          setCampData({
            name: camp.name || "",
            description: camp.description || "",
            tags: tagsString,
            surah_number: camp.surah_number || 20,
            surah_name: camp.surah_name || "طه",
            start_date: camp.start_date || "",
            duration_days: camp.duration_days || 7,
            banner_image: camp.banner_image || "",
            status: camp.status || "early_registration",
          });
        }
      } catch (err) {
        setError("حدث خطأ أثناء تحميل بيانات المخيم");
        console.error("Error fetching camp data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (campId) {
      fetchCampData();
    }
  }, [campId]);

  const handleCampDataChange = (field: string, value: any) => {
    setCampData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSurahChange = (surahNumber: number) => {
    const surah = SURAH_LIST.find((s) => s.number === surahNumber);
    setCampData((prev) => ({
      ...prev,
      surah_number: surahNumber,
      surah_name: surah?.name || "",
    }));
  };

  const handleSubmit = async () => {
    if (!campId) return;
    try {
      setSaving(true);
      setError(null);

      await dashboardService.updateQuranCamp(campId, campData);

      router.push(`/dashboard/quran-camps/${campId}`);
    } catch (error) {
      console.error("Error updating camp:", error);
      setError("حدث خطأ في تحديث المخيم");
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

  if (error && !campData.name) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <ActionToolbar
          title="تعديل المخيم"
          subtitle="تحديث معلومات المخيم وإعداداته"
          secondaryActions={
            <Link
              href={`/dashboard/quran-camps/${campId}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة
            </Link>
          }
          primaryAction={
            <button
              onClick={handleSubmit}
              disabled={saving || !campData.name || !campData.start_date}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-5 py-2 text-sm font-medium text-primary-100 transition hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-100" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          }
        />

        {error ? (
          <div className="rounded-3xl border border-rose-900/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                معلومات المخيم
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                تحديث البيانات الأساسية للمخيم
              </p>
            </div>
            <BookOpen className="h-5 w-5 text-primary-100" />
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">
                اسم المخيم <span className="text-rose-400">*</span>
              </span>
              <input
                type="text"
                value={campData.name}
                onChange={(e) => handleCampDataChange("name", e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="مخيم عمر بن الخطاب"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">
                السورة <span className="text-rose-400">*</span>
              </span>
              <select
                value={campData.surah_number}
                onChange={(e) => handleSurahChange(parseInt(e.target.value))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {SURAH_LIST.map((surah) => (
                  <option key={surah.number} value={surah.number}>
                    {surah.number}. {surah.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">
                تاريخ البداية <span className="text-rose-400">*</span>
              </span>
              <input
                type="date"
                value={campData.start_date}
                onChange={(e) =>
                  handleCampDataChange("start_date", e.target.value)
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">
                المدة بالأيام <span className="text-rose-400">*</span>
              </span>
              <input
                type="number"
                min="1"
                max="30"
                value={campData.duration_days}
                onChange={(e) =>
                  handleCampDataChange(
                    "duration_days",
                    parseInt(e.target.value)
                  )
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">
                حالة المخيم <span className="text-rose-400">*</span>
              </span>
              <select
                value={campData.status}
                onChange={(e) => handleCampDataChange("status", e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="early_registration">تسجيل مبكر</option>
                <option value="active">نشط</option>
                <option value="completed">منتهي</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">
                رابط صورة البانر
              </span>
              <input
                type="url"
                value={campData.banner_image}
                onChange={(e) =>
                  handleCampDataChange("banner_image", e.target.value)
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="https://example.com/banner.jpg"
              />
            </label>

            <label className="md:col-span-2 block space-y-2">
              <span className="text-sm font-medium text-slate-300">
                وصف المخيم
              </span>
              <textarea
                value={campData.description}
                onChange={(e) =>
                  handleCampDataChange("description", e.target.value)
                }
                rows={4}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="وصف مختصر عن المخيم وأهدافه..."
              />
            </label>

            <label className="md:col-span-2 block space-y-2">
              <span className="text-sm font-medium text-slate-300">
                العلامات التوضيحية (Tags)
              </span>
              <input
                type="text"
                value={campData.tags}
                onChange={(e) => handleCampDataChange("tags", e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="مثال: للمبتدئين, تدبر عميق, رحلة 7 أيام"
              />
              <p className="text-xs text-slate-400">
                هام: افصل بين كل علامة والأخرى بفاصلة (,)
              </p>
            </label>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
