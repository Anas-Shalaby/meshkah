// @ts-nocheck
"use client";

import { useState, useEffect, useMemo, ReactNode, MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Edit,
  X,
  Search,
  BookOpen,
  Lightbulb,
  Calendar,
  User,
  Filter,
  Star,
  ThumbsUp,
  Bookmark,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { ChipPill } from "@/components/ui/chip-pill";
import { StatCard } from "@/components/ui/stat-card";
import { CampNavigation } from "@/components/quran-camps/CampNavigation";

interface ModalProps {
  title?: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}

interface CampSummary {
  id: number;
  name: string;
}

interface StudyHallContent {
  id: string;
  progress_id: number;
  type: "reflection" | "benefits";
  title: string;
  content: string;
  day: number;
  completed_at: string;
  user_id: number;
  username: string;
  email: string;
  upvote_count?: number;
  save_count?: number;
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

export default function StudyHallManagementPage() {
  const params = useParams();
  const campId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [camp, setCamp] = useState<CampSummary | null>(null);
  const [content, setContent] = useState<StudyHallContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "reflection" | "benefits"
  >("all");
  const [dayFilter, setDayFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedContent, setSelectedContent] =
    useState<StudyHallContent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editReason, setEditReason] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sortByInteractions, setSortByInteractions] = useState(false);
  const [selectedCohortNumber, setSelectedCohortNumber] = useState<
    number | null
  >(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!campId) return;
      try {
        setLoading(true);
        const [campResponse, contentResponse] = await Promise.all([
          dashboardService.getQuranCampDetails(campId),
          dashboardService.getAdminStudyHallContent(campId, {
            page,
            limit: 50,
            sort: sortBy,
            day: dayFilter !== "all" ? dayFilter : undefined,
            cohort_number: selectedCohortNumber || undefined,
          }),
        ]);

        const campData = campResponse.data?.data ?? null;
        setCamp(campData);

        // Set default cohort number
        if (campData?.current_cohort_number && !selectedCohortNumber) {
          setSelectedCohortNumber(campData.current_cohort_number);
        }
        if (contentResponse.success && contentResponse.data) {
          setContent(contentResponse.data.content || []);
          setTotalPages(contentResponse.data.pagination?.total_pages || 1);
        }
      } catch (err) {
        setError("حدث خطأ أثناء تحميل البيانات");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campId, page, sortBy, dayFilter, selectedCohortNumber]);

  const filteredContent = useMemo(() => {
    return content
      .filter((item) => {
        const matchesSearch =
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === "all" || item.type === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortByInteractions) {
          const aInteractions = (a.upvote_count || 0) + (a.save_count || 0);
          const bInteractions = (b.upvote_count || 0) + (b.save_count || 0);
          return bInteractions - aInteractions;
        }

        if (sortBy === "newest") {
          return (
            new Date(b.completed_at).getTime() -
            new Date(a.completed_at).getTime()
          );
        } else if (sortBy === "oldest") {
          return (
            new Date(a.completed_at).getTime() -
            new Date(b.completed_at).getTime()
          );
        } else if (sortBy === "day") {
          return b.day - a.day;
        }
        return 0;
      });
  }, [content, searchTerm, typeFilter, sortBy, sortByInteractions]);

  const metrics = useMemo(() => {
    const total = content.length;
    const reflections = content.filter((c) => c.type === "reflection").length;
    const benefits = content.filter((c) => c.type === "benefits").length;
    const uniqueUsers = new Set(content.map((c) => c.user_id)).size;
    const totalUpvotes = content.reduce(
      (sum, c) => sum + (c.upvote_count || 0),
      0
    );
    const totalSaves = content.reduce((sum, c) => sum + (c.save_count || 0), 0);

    return {
      total,
      reflections,
      benefits,
      uniqueUsers,
      totalUpvotes,
      totalSaves,
    };
  }, [content]);

  const handleEdit = (item: StudyHallContent) => {
    setSelectedContent(item);
    setEditContent(item.content);
    setEditReason("");
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!selectedContent) return;

    if (!editReason || editReason.trim() === "") {
      alert("يرجى كتابة سبب التعديل");
      return;
    }

    try {
      setSaving(true);
      const updateData =
        selectedContent.type === "reflection"
          ? {
              journal_entry: editContent,
              type: "reflection",
              reason: editReason,
            }
          : { notes: editContent, type: "benefits", reason: editReason };

      await dashboardService.updateStudyHallContent(
        selectedContent.progress_id.toString(),
        updateData
      );

      // Refresh content
      const contentResponse = await dashboardService.getAdminStudyHallContent(
        campId!,
        {
          page,
          limit: 50,
          sort: sortBy,
          day: dayFilter !== "all" ? dayFilter : undefined,
          cohort_number: selectedCohortNumber || undefined,
        }
      );

      if (contentResponse.success && contentResponse.data) {
        setContent(contentResponse.data.content || []);
      }

      setShowEditModal(false);
      setSelectedContent(null);
      setEditContent("");
      setEditReason("");
      alert("✅ تم تحديث المحتوى بنجاح");
    } catch (err) {
      console.error("Error updating content:", err);
      alert("❌ حدث خطأ أثناء تحديث المحتوى");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedContent) return;

    if (!deleteReason || deleteReason.trim() === "") {
      alert("يرجى كتابة سبب الحذف");
      return;
    }

    try {
      setDeleting(true);
      await dashboardService.deleteStudyHallContent(
        selectedContent.progress_id.toString(),
        selectedContent.type,
        deleteReason
      );

      // Refresh content
      const contentResponse = await dashboardService.getAdminStudyHallContent(
        campId!,
        {
          page,
          limit: 50,
          sort: sortBy,
          day: dayFilter !== "all" ? dayFilter : undefined,
          cohort_number: selectedCohortNumber || undefined,
        }
      );

      if (contentResponse.success && contentResponse.data) {
        setContent(contentResponse.data.content || []);
      }

      setShowDeleteModal(false);
      setSelectedContent(null);
      setDeleteReason("");
      alert("✅ تم حذف المحتوى بنجاح");
    } catch (err) {
      console.error("Error deleting content:", err);
      alert("❌ حدث خطأ أثناء حذف المحتوى");
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      if (!campId) return;
      const blob = await dashboardService.exportStudyHallFawaid(campId.toString(), {
        cohort_number: selectedCohortNumber || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fawaid_camp_${campId}_cohort_${
        selectedCohortNumber || "current"
      }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting:", err);
      alert("حدث خطأ أثناء تصدير الملف");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  // Get unique days for filter
  const uniqueDays = Array.from(new Set(content.map((c) => c.day))).sort(
    (a, b) => b - a
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <ActionToolbar
          title="إدارة محتوى قاعة التدارس"
          subtitle={
            camp?.name ? `إدارة محتوى قاعة التدارس - ${camp.name}` : undefined
          }
          meta={
            <ChipPill variant="neutral" className="border border-slate-700">
              {content.length} محتوى
            </ChipPill>
          }
          secondaryActions={
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/20"
              >
                <FileSpreadsheet className="h-4 w-4" />
                تصدير إكسل
              </button>
              <Link
                href={`/dashboard/quran-camps/${campId}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                العودة للتفاصيل
              </Link>
            </div>
          }
          endSlot={
            <div className="relative flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-400 shadow-sm focus-within:ring-2 focus-within:ring-primary">
              <Search className="h-4 w-4" />
              <input
                type="search"
                placeholder="ابحث في المحتوى..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-48 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
              />
            </div>
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="إجمالي المحتوى"
            value={metrics.total}
            icon={<BookOpen className="h-6 w-6" />}
            delta={{
              value: `${filteredContent.length} في القائمة`,
              trend: "neutral",
            }}
          />
          <StatCard
            label="التدبرات"
            value={metrics.reflections}
            icon={<BookOpen className="h-6 w-6" />}
            delta={{
              value: `${metrics.benefits} فوائد`,
              trend: "neutral",
            }}
          />
          <StatCard
            label="المستخدمين"
            value={metrics.uniqueUsers}
            icon={<User className="h-6 w-6" />}
            delta={{
              value: `${metrics.totalUpvotes} إعجاب • ${metrics.totalSaves} حفظ`,
              trend: "neutral",
            }}
          />
          <StatCard
            label="الصفحة"
            value={`${page}/${totalPages}`}
            icon={<Calendar className="h-6 w-6" />}
            delta={{
              value: `${content.length} عنصر`,
              trend: "neutral",
            }}
          />
        </section>

        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary-100" />
              <span className="text-sm font-semibold text-slate-200">
                فلترة:
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                typeFilter === "all"
                  ? "border-primary/60 bg-primary/20 text-primary-100 shadow-lg shadow-primary/20"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("reflection")}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                typeFilter === "reflection"
                  ? "border-purple-500/60 bg-purple-500/20 text-purple-100 shadow-lg shadow-purple/20"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-purple-500/40"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              التدبرات
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("benefits")}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                typeFilter === "benefits"
                  ? "border-amber-500/60 bg-amber-500/20 text-amber-100 shadow-lg shadow-amber/20"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-amber-500/40"
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              الفوائد
            </button>

            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                <label className="text-xs font-medium text-slate-400">
                  اليوم:
                </label>
                <select
                  value={dayFilter}
                  onChange={(event) => {
                    setDayFilter(event.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-sm text-slate-200 focus:outline-none focus:ring-0"
                >
                  <option value="all">الكل</option>
                  {uniqueDays.map((day) => (
                    <option key={day} value={day.toString()}>
                      اليوم {day}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                <label className="text-xs font-medium text-slate-400">
                  الترتيب:
                </label>
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setSortByInteractions(false);
                    setPage(1);
                  }}
                  className="bg-transparent text-sm text-slate-200 focus:outline-none focus:ring-0"
                >
                  <option value="newest">الأحدث</option>
                  <option value="oldest">الأقدم</option>
                  <option value="day">حسب اليوم</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSortByInteractions(!sortByInteractions);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  sortByInteractions
                    ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-100 shadow-lg shadow-emerald/20"
                    : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-emerald-500/40"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                حسب التفاعل
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 shadow-lg">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-100">
              محتوى قاعة التدارس ({filteredContent.length})
            </h2>
          </div>

          {filteredContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-slate-400">
              <BookOpen className="h-12 w-12" />
              <p>لا يوجد محتوى مطابق للبحث الحالي</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredContent.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col gap-4 px-6 py-6 transition hover:bg-gradient-to-r hover:from-slate-900/50 hover:to-slate-950/50 border-b border-slate-800 last:border-b-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div
                          className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${
                            item.type === "reflection"
                              ? "bg-purple-500/10 border border-purple-500/30"
                              : "bg-amber-500/10 border border-amber-500/30"
                          }`}
                        >
                          {item.type === "reflection" ? (
                            <BookOpen className="h-4 w-4 text-purple-300" />
                          ) : (
                            <Lightbulb className="h-4 w-4 text-amber-300" />
                          )}
                          <span
                            className={`text-xs font-semibold ${
                              item.type === "reflection"
                                ? "text-purple-200"
                                : "text-amber-200"
                            }`}
                          >
                            {item.type === "reflection" ? "تدبر" : "فوائد"}
                          </span>
                        </div>
                        <ChipPill
                          variant="neutral"
                          className="border-slate-700 bg-slate-950/60 text-slate-300"
                        >
                          اليوم {item.day}
                        </ChipPill>
                        <h3 className="text-lg font-semibold text-slate-100">
                          {item.title}
                        </h3>
                      </div>
                      <div
                        className="text-sm text-slate-300 leading-relaxed rounded-xl border border-slate-800 bg-gradient-to-br from-slate-950/60 to-slate-900/40 p-5 shadow-inner"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 rounded-lg bg-slate-950/60 px-3 py-1.5 border border-slate-800">
                          <User className="h-3.5 w-3.5 text-primary-200" />
                          <span className="font-medium text-slate-300">
                            {item.username}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5 rounded-lg bg-slate-950/60 px-3 py-1.5 border border-slate-800">
                          <Calendar className="h-3.5 w-3.5 text-azure-200" />
                          {formatDate(item.completed_at)}
                        </span>
                        {(item.upvote_count || 0) > 0 && (
                          <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/30">
                            <ThumbsUp className="h-3.5 w-3.5 text-emerald-300" />
                            <span className="font-medium text-emerald-200">
                              {item.upvote_count} إعجاب
                            </span>
                          </span>
                        )}
                        {(item.save_count || 0) > 0 && (
                          <span className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 border border-blue-500/30">
                            <Bookmark className="h-3.5 w-3.5 text-blue-300" />
                            <span className="font-medium text-blue-200">
                              {item.save_count} حفظ
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/20 px-4 py-2 text-xs font-medium text-primary-100 transition hover:bg-primary/30 hover:shadow-lg hover:shadow-primary/20"
                      >
                        <Edit className="h-4 w-4" />
                        تعديل
                      </button>
                      <button
                        onClick={() => {
                          setSelectedContent(item);
                          setDeleteReason("");
                          setShowDeleteModal(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20 hover:shadow-lg hover:shadow-rose-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="border-t border-slate-800 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="text-sm text-slate-400">
                صفحة {page} من {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          )}
        </section>

        {/* Edit Modal */}
        {showEditModal && selectedContent && (
          <Modal
            size="lg"
            title={`تعديل ${
              selectedContent.type === "reflection" ? "التدبر" : "الفوائد"
            }`}
            description={selectedContent.title}
            onClose={() => {
              setShowEditModal(false);
              setSelectedContent(null);
              setEditContent("");
              setEditReason("");
            }}
            footer={
              <>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedContent(null);
                    setEditContent("");
                    setEditReason("");
                  }}
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full border border-primary/40 bg-primary/20 px-4 py-2 text-sm text-primary-100 transition hover:bg-primary/30 disabled:opacity-50"
                >
                  {saving ? "جاري الحفظ..." : "حفظ"}
                </button>
              </>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  المحتوى:
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[300px] rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="أدخل المحتوى..."
                />
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs text-slate-400 mb-2">معاينة:</p>
                <div
                  className="text-sm text-slate-300"
                  dangerouslySetInnerHTML={{ __html: editContent }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  سبب التعديل: <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full min-h-[100px] rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="اكتب سبب التعديل..."
                  required
                />
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedContent && (
          <Modal
            title="تأكيد الحذف"
            description={`هل أنت متأكد من حذف ${
              selectedContent.type === "reflection" ? "التدبر" : "الفوائد"
            }؟ سيتم إرسال إشعار للمستخدم.`}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedContent(null);
              setDeleteReason("");
            }}
            footer={
              <>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedContent(null);
                    setDeleteReason("");
                  }}
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-full border border-rose-500/40 bg-rose-500/20 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/30 disabled:opacity-50"
                >
                  {deleting ? "جاري الحذف..." : "حذف"}
                </button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm font-medium text-slate-300 mb-2">
                  {selectedContent.title}
                </p>
                <div
                  className="text-sm text-slate-400 line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: selectedContent.content }}
                />
              </div>
              <p className="text-sm text-slate-400">
                المستخدم: {selectedContent.username} ({selectedContent.email})
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  سبب الحذف: <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full min-h-[100px] rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="اكتب سبب الحذف..."
                  required
                />
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
