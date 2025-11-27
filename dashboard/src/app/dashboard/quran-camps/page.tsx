"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Calendar,
  Users,
  BookOpen,
  Trophy,
  Eye,
  Edit,
  Trash2,
  Play,
  Filter,
  BarChart3,
  AlertTriangle,
  Search,
  ChevronLeft,
  Bell,
  Copy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { StatCard } from "@/components/ui/stat-card";
import { ChipPill } from "@/components/ui/chip-pill";
import { FilterDrawer } from "@/components/ui/filter-drawer";
import { SURAH_LIST } from "@/constants/surah-list";
import { cn } from "@/lib/utils";

type CampStatus = "early_registration" | "active" | "completed" | "reopened";

type Camp = {
  id: number;
  name: string;
  description: string;
  surah_number: number;
  surah_name: string;
  start_date: string;
  duration_days: number;
  status: CampStatus;
  status_ar: string;
  enrolled_count: number;
  banner_image?: string;
  created_at: string;
  tags?: string[];
};

type SortOption = "name" | "date" | "participants" | "duration";
type SortOrder = "asc" | "desc";

type Filters = {
  search: string;
  status: CampStatus | "all";
  surahNumbers: number[];
  durationRange: [number, number];
  startDateRange: [string | null, string | null];
  tags: string[];
  enrollmentRange: [number, number];
  sortBy: SortOption;
  sortOrder: SortOrder;
};

export default function QuranCampsPage() {
  const createInitialFilters = (maxEnrollment: number = 1000): Filters => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quran-camps-filters");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            search: parsed.search || "",
            status: parsed.status || "all",
            surahNumbers: parsed.surahNumbers || [],
            durationRange: parsed.durationRange || [0, 60],
            startDateRange: parsed.startDateRange || [null, null],
            tags: parsed.tags || [],
            enrollmentRange: parsed.enrollmentRange || [0, maxEnrollment],
            sortBy: parsed.sortBy || "date",
            sortOrder: parsed.sortOrder || "desc",
          };
        } catch (e) {
          console.error("Error loading saved filters:", e);
        }
      }
    }
    return {
      search: "",
      status: "all",
      surahNumbers: [],
      durationRange: [0, 60],
      startDateRange: [null, null],
      tags: [],
      enrollmentRange: [0, maxEnrollment],
      sortBy: "date",
      sortOrder: "desc",
    };
  };

  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [selectedCamps, setSelectedCamps] = useState<number[]>([]);

  // Calculate max enrollment for initial filter range
  const maxEnrollment = useMemo(() => {
    if (camps.length === 0) return 1000;
    return Math.max(...camps.map((c) => c.enrolled_count || 0), 1000);
  }, [camps]);

  const [filters, setFilters] = useState<Filters>(() =>
    createInitialFilters(maxEnrollment)
  );

  const updateFilters = (
    updater: (prev: Filters) => Partial<Filters> | Filters
  ) => {
    setFilters((prev) => {
      const base = { ...prev };
      const patch = updater(base);
      const newFilters = { ...base, ...patch };
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("quran-camps-filters", JSON.stringify(newFilters));
      }
      return newFilters;
    });
  };

  const resetFilters = () => {
    const initial = createInitialFilters();
    setFilters(initial);
    if (typeof window !== "undefined") {
      localStorage.removeItem("quran-camps-filters");
    }
  };

  const filteredCamps = useMemo<Camp[]>(() => {
    const searchTerm = filters.search.trim().toLowerCase();
    const [durationMin, durationMax] = filters.durationRange;
    const [startFrom, startTo] = filters.startDateRange;
    const [enrollmentMin, enrollmentMax] = filters.enrollmentRange;

    let filtered = camps.filter((camp) => {
      const matchesStatus =
        filters.status === "all" ||
        camp.status === filters.status ||
        (filters.status === "completed" && camp.status === "reopened");

      if (!matchesStatus) return false;

      const surahNumber = Number(camp.surah_number);
      if (
        filters.surahNumbers.length > 0 &&
        !filters.surahNumbers.includes(surahNumber)
      ) {
        return false;
      }

      const durationDays = Number(camp.duration_days || 0);
      if (durationDays < durationMin || durationDays > durationMax) {
        return false;
      }

      const enrollmentCount = Number(camp.enrolled_count || 0);
      if (enrollmentCount < enrollmentMin || enrollmentCount > enrollmentMax) {
        return false;
      }

      const startDate = camp.start_date
        ? new Date(camp.start_date).toISOString().slice(0, 10)
        : null;
      if (
        startFrom &&
        startDate &&
        (startDate < startFrom || (startTo && startDate > startTo))
      ) {
        return false;
      }

      const normalizedTags = Array.isArray(camp.tags)
        ? camp.tags.map((tag) => String(tag).toLowerCase())
        : [];
      if (
        filters.tags.length > 0 &&
        !filters.tags.every((tag) => normalizedTags.includes(tag.toLowerCase()))
      ) {
        return false;
      }

      if (!searchTerm) return true;

      const haystack = [
        camp.name,
        camp.description,
        camp.surah_name,
        startDate,
        ...normalizedTags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchTerm);
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "", "ar");
          break;
        case "date":
          comparison =
            new Date(a.start_date || 0).getTime() -
            new Date(b.start_date || 0).getTime();
          break;
        case "participants":
          comparison = (a.enrolled_count || 0) - (b.enrolled_count || 0);
          break;
        case "duration":
          comparison = (a.duration_days || 0) - (b.duration_days || 0);
          break;
      }
      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [camps, filters]);

  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const response = await dashboardService.getQuranCamps();
        setCamps(response.data?.data || []);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل المخيمات");
        console.error("Error fetching camps:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCamps();
  }, []);

  useEffect(() => {
    setSelectedCamps([]);
  }, [filters]);

  const metrics = useMemo(() => {
    const today = new Date();
    const total = camps.length;
    const active = camps.filter((camp) => camp.status === "active").length;
    const upcoming = camps.filter(
      (camp) =>
        (camp.status === "early_registration" || camp.status === "reopened") &&
        new Date(camp.start_date) > today
    ).length;
    const completed = camps.filter(
      (camp) => camp.status === "completed"
    ).length;
    const totalEnrollment = camps.reduce(
      (sum, camp) => sum + (camp.enrolled_count || 0),
      0
    );
    const atRisk = camps.filter((camp) => {
      if (camp.status !== "active") return false;
      const start = new Date(camp.start_date);
      const daysRunning =
        (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return daysRunning > camp.duration_days + 3;
    }).length;

    return {
      total,
      active,
      upcoming,
      completed,
      totalEnrollment,
      atRisk,
      avgEnrollment: total ? Math.round(totalEnrollment / total) : 0,
    };
  }, [camps]);

  const statusFilters = [
    { value: "all", label: "الكل", count: camps.length },
    { value: "active", label: "نشط", count: metrics.active },
    {
      value: "early_registration",
      label: "قريبًا",
      count: metrics.upcoming,
    },
    { value: "completed", label: "مكتمل", count: metrics.completed },
    {
      value: "reopened",
      label: "معاد فتحه",
      count: camps.filter((camp) => camp.status === "reopened").length,
    },
  ];

  const toggleCampSelection = (campId: number) => {
    setSelectedCamps((prev) =>
      prev.includes(campId)
        ? prev.filter((id) => id !== campId)
        : [...prev, campId]
    );
  };

  const isCampSelected = (campId: number) =>
    selectedCamps.includes(campId || -1);

  const handleBulkStatusUpdate = async (status: "active" | "completed") => {
    if (selectedCamps.length === 0) return;
    try {
      await Promise.all(
        selectedCamps.map((campId) =>
          dashboardService.updateCampStatusAdmin(campId.toString(), status)
        )
      );
      toast({
        title: "تم تحديث حالة المخيمات المحددة",
      });
      const response = await dashboardService.getQuranCamps();
      setCamps(response.data?.data || []);
      setSelectedCamps([]);
    } catch (err) {
      console.error("Error updating camps:", err);
      toast({
        title: "فشل تحديث حالات المخيمات",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: CampStatus) => {
    switch (status) {
      case "early_registration":
        return "bg-azure-900/40 text-azure-200";
      case "active":
        return "bg-emerald-900/40 text-emerald-200";
      case "completed":
        return "bg-slate-800 text-slate-200";
      case "reopened":
        return "bg-purple-900/40 text-purple-200";
      default:
        return "bg-slate-800 text-slate-200";
    }
  };

  const DeleteCamp = async (campId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المخيم؟")) return;
    try {
      await dashboardService.deleteCamp(campId.toString());
      toast({
        title: "تم حذف المخيم بنجاح!",
      });
    } catch (error) {
      console.error("Error deleting camp:", error);
      toast({
        title: "فشل في حذف المخيم",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleReopenCamp = async (campId: number) => {
    if (!confirm("هل أنت متأكد من إعادة فتح هذا المخيم؟")) return;

    try {
      await dashboardService.updateCampStatusAdmin(campId.toString(), "active");
      toast({
        title: "تم إعادة فتح المخيم بنجاح!",
        variant: "default",
      });
      // Refresh camps list
      const response = await dashboardService.getQuranCamps();
      setCamps(response.data?.data || []);
    } catch (error) {
      console.error("Error reopening camp:", error);
      toast({
        title: "فشل في إعادة فتح المخيم",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateCamp = async (campId: number) => {
    if (!confirm("هل تريد نسخ هذا المخيم مع جميع المهام والموارد؟")) return;

    try {
      const response = await dashboardService.duplicateCamp(campId.toString());
      if (response.success) {
        toast({
          title: "تم نسخ المخيم بنجاح!",
          description: "سيتم إعادة تحميل القائمة",
        });
        const campsResponse = await dashboardService.getQuranCamps();
        setCamps(campsResponse.data?.data || []);
        // Navigate to new camp
        if (response.data?.campId) {
          window.location.href = `/dashboard/quran-camps/${response.data.campId}`;
        }
      }
    } catch (error) {
      console.error("Error duplicating camp:", error);
      toast({
        title: "فشل في نسخ المخيم",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-rose-300">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <ActionToolbar
          title="المخيمات القرآنية"
          subtitle="كل ما تحتاجه لمتابعة المخيمات، الأداء، والتحديثات اليومية"
          meta={
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString("ar", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          }
          primaryAction={
            <Link
              href="/dashboard/quran-camps/create"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              إنشاء مخيم جديد
            </Link>
          }
          secondaryActions={
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              <Filter className="h-4 w-4" />
              تصفية
            </button>
          }
          endSlot={
            <div className="flex items-center gap-2">
              <div className="relative flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-400 shadow-sm focus-within:ring-2 focus-within:ring-primary">
                <Search className="h-4 w-4" />
                <input
                  type="search"
                  placeholder="ابحث بالاسم أو السورة..."
                  value={filters.search}
                  onChange={(event) =>
                    updateFilters((prev) => ({
                      ...prev,
                      search: event.target.value,
                    }))
                  }
                  className="w-48 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                />
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortMenuOpen(!sortMenuOpen)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  ترتيب
                </button>
                {sortMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setSortMenuOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 z-20 w-56 rounded-xl border border-slate-700 bg-slate-900 shadow-lg p-2">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-400 mb-2 px-2">
                          ترتيب حسب
                        </label>
                        {[
                          { value: "date", label: "تاريخ البداية" },
                          { value: "name", label: "اسم المخيم" },
                          { value: "participants", label: "عدد المشتركين" },
                          { value: "duration", label: "المدة" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              updateFilters((prev) => ({
                                ...prev,
                                sortBy: option.value as SortOption,
                                sortOrder:
                                  prev.sortBy === option.value &&
                                  prev.sortOrder === "desc"
                                    ? "asc"
                                    : "desc",
                              }));
                              setSortMenuOpen(false);
                            }}
                            className={`w-full text-right px-3 py-2 text-sm rounded-lg transition ${
                              filters.sortBy === option.value
                                ? "bg-primary/20 text-primary-100"
                                : "text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option.label}</span>
                              {filters.sortBy === option.value && (
                                <span>
                                  {filters.sortOrder === "asc" ? (
                                    <ArrowUp className="h-3 w-3" />
                                  ) : (
                                    <ArrowDown className="h-3 w-3" />
                                  )}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="إجمالي المخيمات"
            value={metrics.total}
            description="إجمالي ما تم إطلاقه أو جدولة إطلاقه"
            icon={<BookOpen className="h-6 w-6" />}
            delta={{
              value: `${filteredCamps.length} نتائج ضمن التصفية`,
              trend: "neutral",
            }}
          />
          <StatCard
            label="مخيمات نشطة"
            value={metrics.active}
            description="قيد التنفيذ حالياً"
            icon={<Trophy className="h-6 w-6" />}
            delta={{
              value: metrics.atRisk
                ? `${metrics.atRisk} بحاجة لمتابعة`
                : "مستقر",
              trend: metrics.atRisk ? "down" : "neutral",
            }}
            variant={metrics.atRisk ? "attention" : "neutral"}
          />
          <StatCard
            label="القادم هذا الشهر"
            value={metrics.upcoming}
            description="يبدأ خلال الأيام القادمة"
            icon={<Calendar className="h-6 w-6" />}
            delta={{
              value: `${metrics.completed} مكتمل`,
              trend: "neutral",
            }}
          />
          <StatCard
            label="إجمالي المشتركين"
            value={metrics.totalEnrollment.toLocaleString("ar-EG")}
            description={`متوسط ${metrics.avgEnrollment.toLocaleString(
              "ar-EG"
            )} مشارك لكل مخيم`}
            icon={<Users className="h-6 w-6" />}
            delta={{
              value: metrics.avgEnrollment > 60 ? "+12%" : "+4%",
              trend: "up",
            }}
            variant="positive"
          />
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <div className="flex flex-wrap items-center gap-3">
            {statusFilters.map(({ value, label, count }) => {
              const isActive = filters.status === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    updateFilters((prev) => ({
                      ...prev,
                      status: value as CampStatus | "all" | undefined,
                    }))
                  }
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "border-slate-600 bg-slate-800 text-white shadow"
                      : "border-slate-700 text-slate-300 hover:bg-slate-800"
                  )}
                >
                  <span>{label}</span>
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-300">
                    {count.toLocaleString("ar-EG")}
                  </span>
                </button>
              );
            })}

            <div className="ml-auto flex flex-wrap items-center gap-3">
              {selectedCamps.length > 0 ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-4 py-1.5 text-xs text-primary-100">
                  <BarChart3 className="h-4 w-4" />
                  {selectedCamps.length} مختار
                </div>
              ) : null}

              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                <ChevronLeft className="h-4 w-4" />
                إعادة الضبط
              </button>
            </div>
          </div>

          {selectedCamps.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-700 bg-emerald-900/30 px-4 py-3 text-xs text-emerald-200">
              <span className="font-medium">إجراءات سريعة:</span>
              <button
                type="button"
                onClick={() => handleBulkStatusUpdate("active")}
                className="rounded-full bg-emerald-600 px-3 py-1 text-white transition hover:bg-emerald-500"
              >
                نقل إلى نشط
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatusUpdate("completed")}
                className="rounded-full border border-emerald-500 px-3 py-1 text-emerald-100 transition hover:bg-emerald-800"
              >
                إنهاء المخيمات
              </button>
            </div>
          ) : null}
        </section>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCamps.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-300">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-500" />
              <h3 className="text-lg font-semibold text-slate-200">
                لا توجد نتائج مطابقة
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                جرّب توسيع نطاق البحث أو إعادة ضبط عوامل التصفية.
              </p>
            </div>
          ) : (
            filteredCamps.map((camp) => {
              const progress =
                camp.status === "completed"
                  ? 100
                  : camp.status === "active"
                  ? Math.min(
                      100,
                      Math.round(
                        ((new Date().getTime() -
                          new Date(camp.start_date).getTime()) /
                          (camp.duration_days * 24 * 60 * 60 * 1000)) *
                          100
                      )
                    )
                  : 0;
              const tags = Array.isArray(camp.tags) ? camp.tags : [];
              return (
                <article
                  key={camp.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 transition hover:-translate-y-1 hover:shadow-card"
                >
                  <div className="flex items-center justify-between px-5 pb-3 pt-5">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-primary focus:ring-primary"
                        checked={isCampSelected(camp.id)}
                        onChange={() => toggleCampSelection(camp.id)}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-100">
                            {camp.name}
                          </h3>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                              getStatusColor(camp.status)
                            )}
                          >
                            {camp.status_ar}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          سورة {camp.surah_name} • {camp.duration_days} أيام
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDuplicateCamp(camp.id)}
                        className="rounded-full border border-slate-700 p-2 text-slate-500 transition hover:border-emerald-500 hover:text-emerald-300"
                        title="نسخ المخيم"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => DeleteCamp(camp.id)}
                        className="rounded-full border border-slate-700 p-2 text-slate-500 transition hover:border-rose-500 hover:text-rose-300"
                        title="حذف المخيم"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {camp.banner_image ? (
                    <div className="relative mx-5 mb-4 h-36 overflow-hidden rounded-2xl">
                      <img
                        src={camp.banner_image}
                        alt={camp.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                    </div>
                  ) : (
                    <div className="mx-5 mb-4 flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900 text-slate-500">
                      <AlertTriangle className="h-6 w-6" />
                      <span className="mr-2 text-xs">لا توجد صورة للمخيم</span>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col gap-4 px-5 pb-5">
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span>{formatDate(camp.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-500" />
                        <span>
                          {camp.enrolled_count.toLocaleString("ar-EG")} مشترك
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>جاهزية المخيم</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <span
                          className="block h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {tags.length ? (
                      <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 3).map((tag) => (
                          <ChipPill key={tag} variant="neutral">
                            {tag}
                          </ChipPill>
                        ))}
                        {tags.length > 3 ? (
                          <ChipPill variant="neutral">
                            +{tags.length - 3}
                          </ChipPill>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-auto flex items-center gap-2 pt-4">
                      <Link
                        href={`/dashboard/quran-camps/${camp.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
                      >
                        <Eye className="h-4 w-4" />
                        عرض التفاصيل
                      </Link>
                      <Link
                        href={`/dashboard/quran-camps/${camp.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-full border border-azure-500/40 bg-azure-900/30 px-4 py-1.5 text-xs font-medium text-azure-200 transition hover:bg-azure-800/40"
                      >
                        <Edit className="h-4 w-4" />
                        تعديل
                      </Link>
                      {camp.status === "completed" ? (
                        <button
                          onClick={() => handleReopenCamp(camp.id)}
                          className="ms-auto inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-900/40 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-800/40"
                        >
                          <Play className="h-4 w-4" />
                          إعادة فتح
                        </button>
                      ) : null}
                      {camp.status === "active" ||
                      camp.status === "early_registration" ? (
                        <Link
                          href={`/dashboard/quran-camps/${camp.id}/notifications`}
                          className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-3 py-1.5 text-xs text-primary-100 transition hover:bg-primary/20"
                        >
                          <Bell className="h-4 w-4" />
                          إرسال إشعار
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      <FilterDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="تصفية المخيمات"
        description="دقّق النتائج حسب السورة، التاريخ، أو العلامات"
        footer={
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                resetFilters();
                setFiltersOpen(false);
              }}
              className="w-full rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              إعادة الضبط
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="w-full rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              عرض النتائج
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-slate-200">
          <div>
            <label className="text-sm font-medium text-slate-200">السورة</label>
            <div className="mt-2 grid max-h-52 gap-2 overflow-y-auto rounded-2xl border border-slate-700 p-3">
              {SURAH_LIST.map((surah) => {
                const isChecked = filters.surahNumbers.includes(surah.number);
                return (
                  <label
                    key={surah.number}
                    className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-slate-800"
                  >
                    <span className="text-sm text-slate-200">{surah.name}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() =>
                        updateFilters((prev) => ({
                          ...prev,
                          surahNumbers: isChecked
                            ? prev.surahNumbers.filter(
                                (num) => num !== surah.number
                              )
                            : [...prev.surahNumbers, surah.number],
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-primary focus:ring-primary"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-200">
              مدة المخيم (أيام)
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="number"
                min={0}
                className="w-24 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                value={filters.durationRange[0]}
                onChange={(event) =>
                  updateFilters((prev) => ({
                    ...prev,
                    durationRange: [
                      Number(event.target.value),
                      prev.durationRange[1],
                    ],
                  }))
                }
              />
              <span className="text-sm text-slate-500">إلى</span>
              <input
                type="number"
                min={0}
                className="w-24 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                value={filters.durationRange[1]}
                onChange={(event) =>
                  updateFilters((prev) => ({
                    ...prev,
                    durationRange: [
                      prev.durationRange[0],
                      Number(event.target.value),
                    ],
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-200">
              تاريخ البداية
            </label>
            <div className="mt-2 grid gap-3">
              <input
                type="date"
                value={filters.startDateRange[0] ?? ""}
                onChange={(event) =>
                  updateFilters((prev) => ({
                    ...prev,
                    startDateRange: [
                      event.target.value || null,
                      prev.startDateRange[1],
                    ],
                  }))
                }
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="date"
                value={filters.startDateRange[1] ?? ""}
                onChange={(event) =>
                  updateFilters((prev) => ({
                    ...prev,
                    startDateRange: [
                      prev.startDateRange[0],
                      event.target.value || null,
                    ],
                  }))
                }
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-200">
              عدد المشتركين
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="number"
                min={0}
                className="w-24 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                value={filters.enrollmentRange[0]}
                onChange={(event) =>
                  updateFilters((prev) => ({
                    ...prev,
                    enrollmentRange: [
                      Number(event.target.value),
                      prev.enrollmentRange[1],
                    ],
                  }))
                }
              />
              <span className="text-sm text-slate-500">إلى</span>
              <input
                type="number"
                min={0}
                className="w-24 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                value={filters.enrollmentRange[1]}
                onChange={(event) =>
                  updateFilters((prev) => ({
                    ...prev,
                    enrollmentRange: [
                      prev.enrollmentRange[0],
                      Number(event.target.value),
                    ],
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-200">
              العلامات
            </label>
            <textarea
              className="mt-2 h-24 w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="اكتب العلامات مفصولة بفاصلة، مثال: ناشئة، حفظ، تلاوة"
              value={filters.tags.join(", ")}
              onChange={(event) => {
                const value = event.target.value;
                const tags = value
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean);
                updateFilters((prev) => ({
                  ...prev,
                  tags,
                }));
              }}
            />
          </div>
        </div>
      </FilterDrawer>
    </DashboardLayout>
  );
}
