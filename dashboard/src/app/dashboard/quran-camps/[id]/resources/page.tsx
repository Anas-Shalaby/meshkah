"use client";

import { useState, useEffect, useMemo, ReactNode, MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Edit,
  Video,
  FileText,
  Link as LinkIcon,
  Mic,
  ExternalLink,
  FolderPlus,
  GripVertical,
  Layers,
  ListPlus,
  BookOpenCheck,
  BookOpen,
  Sparkles,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { ChipPill } from "@/components/ui/chip-pill";
import { CampNavigation } from "@/components/quran-camps/CampNavigation";
import { CohortSelector } from "@/components/quran-camps/CohortSelector";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";

type ResourceType = "video" | "pdf" | "audio" | "link";

interface ResourceMeta {
  label: string;
  icon: typeof Video;
  chipClass: string;
}

const RESOURCE_META: Record<ResourceType, ResourceMeta> = {
  video: {
    label: "فيديو",
    icon: Video,
    chipClass: "border-red-500/40 bg-red-500/10 text-red-200",
  },
  pdf: {
    label: "PDF",
    icon: FileText,
    chipClass: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  },
  audio: {
    label: "صوتي",
    icon: Mic,
    chipClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  },
  link: {
    label: "رابط",
    icon: LinkIcon,
    chipClass: "border-primary/40 bg-primary/15 text-primary-100",
  },
};

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
  surah_name: string;
  duration_days?: number;
  updated_at?: string;
}

interface Resource {
  id: number;
  title: string;
  url: string;
  resource_type: ResourceType;
  display_order: number;
  created_at: string;
  category_id?: number | null;
}

interface Category {
  id: number | null;
  title: string;
  display_order: number;
  resources: Resource[];
}

interface CategoryInfo {
  id: number;
  title: string;
  display_order: number;
  resource_count: number;
}

type NewCategoryState = {
  title: string;
};

type NewResourceState = {
  title: string;
  url: string;
  resource_type: ResourceType;
  category_id: number | null;
};

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
          <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body
  );
};

const extractHostname = (value: string) => {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "");
  } catch (error) {
    return null;
  }
};

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getResourceIcon = (type: ResourceType) => {
  return RESOURCE_META[type]?.icon || LinkIcon;
};

const getResourceTypeText = (type: ResourceType) => {
  return RESOURCE_META[type]?.label || type;
};

const getResourceChipClass = (type: ResourceType) => {
  return (
    RESOURCE_META[type]?.chipClass ||
    "border-slate-700 bg-slate-900 text-slate-200"
  );
};

export default function CampResourcesPage() {
  const params = useParams();
  const campId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [camp, setCamp] = useState<CampSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCohortNumber, setSelectedCohortNumber] = useState<
    number | null
  >(null);

  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [showAddResourceForm, setShowAddResourceForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(
    null
  );
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [selectedCategoryForResource, setSelectedCategoryForResource] =
    useState<number | null>(null);

  const [newCategory, setNewCategory] = useState<NewCategoryState>({
    title: "",
  });
  const [newResource, setNewResource] = useState<NewResourceState>({
    title: "",
    url: "",
    resource_type: "link",
    category_id: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!campId) return;
      try {
        const [campResponse, resourcesResponse, categoriesResponse] =
          await Promise.all([
            dashboardService.getQuranCampDetails(campId),
            dashboardService.getCampResources(
              campId,
              selectedCohortNumber || undefined
            ),
            dashboardService
              .getCampResourceCategories(campId)
              .catch(() => ({ data: [] })),
          ]);
        const campData = campResponse.data?.data ?? null;
        setCamp(campData);

        // Set default cohort number
        if (campData?.current_cohort_number && !selectedCohortNumber) {
          setSelectedCohortNumber(campData.current_cohort_number);
        }

        setCategories(resourcesResponse?.data || []);
        setCategoriesList(categoriesResponse?.data || []);
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
  }, [campId, selectedCohortNumber]);

  const refreshData = async () => {
    if (!campId) return;
    try {
      const [resourcesResponse, categoriesResponse] = await Promise.all([
        dashboardService.getCampResources(
          campId,
          selectedCohortNumber || undefined
        ),
        dashboardService
          .getCampResourceCategories(campId)
          .catch(() => ({ data: [] })),
      ]);
      setCategories(resourcesResponse?.data || []);
      setCategoriesList(categoriesResponse?.data || []);
    } catch (err) {
      console.error("Error refreshing data:", err);
    }
  };

  const handleAddCategory = async () => {
    if (!campId || !newCategory.title.trim()) return;
    try {
      setSaving(true);
      setError(null);
      await dashboardService.createCampResourceCategory(
        campId,
        newCategory.title
      );
      await refreshData();
      closeCategoryForm();
    } catch (error: any) {
      console.error("Error adding category:", error);
      setError(error.response?.data?.message || "حدث خطأ في إضافة الفئة");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.title.trim()) return;
    try {
      setSaving(true);
      setError(null);
      await dashboardService.updateCampResourceCategory(
        String(editingCategory.id),
        editingCategory.title
      );
      await refreshData();
      closeEditCategoryForm();
    } catch (error: any) {
      console.error("Error updating category:", error);
      setError(error.response?.data?.message || "حدث خطأ في تحديث الفئة");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (
      !campId ||
      !confirm(
        "هل أنت متأكد من حذف هذه الفئة؟ سيتم نقل الموارد إلى قسم 'موارد أخرى'"
      )
    )
      return;
    try {
      setSaving(true);
      setError(null);
      await dashboardService.deleteCampResourceCategory(String(categoryId));
      await refreshData();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      setError(error.response?.data?.message || "حدث خطأ في حذف الفئة");
    } finally {
      setSaving(false);
    }
  };

  const handleAddResource = async () => {
    if (!campId || !newResource.title.trim() || !newResource.url.trim()) return;
    try {
      setSaving(true);
      setError(null);
      await dashboardService.createCampResource(campId, {
        title: newResource.title,
        url: newResource.url,
        resource_type: newResource.resource_type,
        category_id: newResource.category_id || null,
      });
      await refreshData();
      closeResourceForm();
    } catch (error: any) {
      console.error("Error adding resource:", error);
      setError(error.response?.data?.message || "حدث خطأ في إضافة المورد");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateResource = async () => {
    if (
      !editingResource ||
      !editingResource.title.trim() ||
      !editingResource.url.trim()
    )
      return;
    try {
      setSaving(true);
      setError(null);
      await dashboardService.updateCampResource(String(editingResource.id), {
        title: editingResource.title,
        url: editingResource.url,
        resource_type: editingResource.resource_type,
        category_id: selectedCategoryForResource,
      });
      await refreshData();
      closeResourceForm();
    } catch (error: any) {
      console.error("Error updating resource:", error);
      setError(error.response?.data?.message || "حدث خطأ في تحديث المورد");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (!campId || !confirm("هل أنت متأكد من حذف هذا المورد؟")) return;
    try {
      setSaving(true);
      setError(null);
      await dashboardService.deleteCampResource(String(resourceId));
      await refreshData();
    } catch (error: any) {
      console.error("Error deleting resource:", error);
      setError(error.response?.data?.message || "حدث خطأ في حذف المورد");
    } finally {
      setSaving(false);
    }
  };

  const startEditingResource = (
    resource: Resource,
    categoryId: number | null
  ) => {
    setEditingResource(resource);
    setSelectedCategoryForResource(categoryId);
    setShowAddResourceForm(false);
  };

  const closeCategoryForm = () => {
    setShowAddCategoryForm(false);
    setNewCategory({ title: "" });
  };

  const closeEditCategoryForm = () => {
    setEditingCategory(null);
  };

  const closeResourceForm = () => {
    setShowAddResourceForm(false);
    setEditingResource(null);
    setSelectedCategoryForResource(null);
    setNewResource({
      title: "",
      url: "",
      resource_type: "link",
      category_id: null,
    });
  };

  const openAddCategoryForm = () => {
    closeResourceForm();
    closeEditCategoryForm();
    setShowAddCategoryForm(true);
  };

  const openAddResourceForm = (categoryId: number | null = null) => {
    closeCategoryForm();
    closeEditCategoryForm();
    setEditingResource(null);
    setShowAddResourceForm(true);
    setSelectedCategoryForResource(categoryId);
    setNewResource({
      title: "",
      url: "",
      resource_type: "link",
      category_id: categoryId,
    });
  };

  const totalCategories = categories.length;
  const totalResources = categories.reduce(
    (acc, category) => acc + (category.resources?.length || 0),
    0
  );
  const uncategorizedResources =
    categories.find((category) => category.id === null)?.resources?.length || 0;

  const topCategory = useMemo(() => {
    if (!categoriesList.length) return null;
    return categoriesList.reduce((acc, category) =>
      category.resource_count > (acc?.resource_count || 0) ? category : acc
    );
  }, [categoriesList]);

  const latestResourceDate = useMemo(() => {
    const timestamps = categories
      .flatMap((category) => category.resources || [])
      .map((resource) => new Date(resource.created_at).getTime());
    if (!timestamps.length) return null;
    return new Date(Math.max(...timestamps));
  }, [categories]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-800 border-t-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!camp) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
          {error || "المخيم غير موجود"}
        </div>
      </DashboardLayout>
    );
  }

  const isEditingCategory = Boolean(editingCategory);
  const isEditingResource = Boolean(editingResource);

  const categoryModal =
    showAddCategoryForm || editingCategory ? (
      <Modal
        title={isEditingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}
        description="انشئ مجموعات لتنظيم مصادر الدراسة وتسهيل الوصول لها"
        onClose={isEditingCategory ? closeEditCategoryForm : closeCategoryForm}
        footer={
          <>
            <button
              onClick={
                isEditingCategory ? closeEditCategoryForm : closeCategoryForm
              }
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              onClick={
                isEditingCategory ? handleUpdateCategory : handleAddCategory
              }
              disabled={
                saving ||
                !(isEditingCategory
                  ? editingCategory?.title.trim()
                  : newCategory.title.trim())
              }
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-emerald-100" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving
                ? "جاري الحفظ..."
                : isEditingCategory
                ? "حفظ التعديلات"
                : "إضافة الفئة"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-2 text-sm text-slate-300">
            <span>عنوان الفئة</span>
            <input
              type="text"
              value={
                isEditingCategory
                  ? editingCategory?.title || ""
                  : newCategory.title
              }
              onChange={(event) =>
                isEditingCategory && editingCategory
                  ? setEditingCategory({
                      ...editingCategory,
                      title: event.target.value,
                    })
                  : setNewCategory({ title: event.target.value })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  isEditingCategory
                    ? handleUpdateCategory()
                    : handleAddCategory();
                }
              }}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              placeholder="مثال: شروحات الفيديو"
            />
          </label>
        </div>
      </Modal>
    ) : null;

  const resourceModal =
    showAddResourceForm || editingResource ? (
      <Modal
        size="lg"
        title={isEditingResource ? "تعديل مورد" : "إضافة مورد جديد"}
        description="شارك الدروس والمراجع التي تدعم رحلة المخيم"
        onClose={closeResourceForm}
        footer={
          <>
            <button
              onClick={closeResourceForm}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              onClick={
                isEditingResource ? handleUpdateResource : handleAddResource
              }
              disabled={
                saving ||
                !(isEditingResource
                  ? editingResource?.title.trim()
                  : newResource.title.trim()) ||
                !(isEditingResource
                  ? editingResource?.url.trim()
                  : newResource.url.trim())
              }
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-4 py-2 text-sm font-medium text-primary-100 transition hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-100" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving
                ? "جاري الحفظ..."
                : isEditingResource
                ? "حفظ التعديلات"
                : "إضافة المورد"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block space-y-2 text-sm text-slate-300">
            <span>عنوان المورد</span>
            <input
              type="text"
              value={
                isEditingResource
                  ? editingResource?.title || ""
                  : newResource.title
              }
              onChange={(event) =>
                isEditingResource && editingResource
                  ? setEditingResource({
                      ...editingResource,
                      title: event.target.value,
                    })
                  : setNewResource({
                      ...newResource,
                      title: event.target.value,
                    })
              }
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="مثال: شرح سورة الفاتحة"
            />
          </label>

          <label className="block space-y-2 text-sm text-slate-300">
            <span>نوع المورد</span>
            <select
              value={
                isEditingResource
                  ? editingResource?.resource_type || "link"
                  : newResource.resource_type
              }
              onChange={(event) =>
                isEditingResource && editingResource
                  ? setEditingResource({
                      ...editingResource,
                      resource_type: event.target.value as ResourceType,
                    })
                  : setNewResource({
                      ...newResource,
                      resource_type: event.target.value as ResourceType,
                    })
              }
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {Object.entries(RESOURCE_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2 text-sm text-slate-300">
            <span>الفئة</span>
            <select
              value={
                isEditingResource
                  ? selectedCategoryForResource ??
                    editingResource?.category_id ??
                    ""
                  : newResource.category_id ?? ""
              }
              onChange={(event) => {
                const value =
                  event.target.value === ""
                    ? null
                    : parseInt(event.target.value, 10);
                setSelectedCategoryForResource(value);
                if (!isEditingResource) {
                  setNewResource({ ...newResource, category_id: value });
                }
              }}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">بدون فئة (موارد أخرى)</option>
              {categoriesList.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2 block space-y-2 text-sm text-slate-300">
            <span>رابط المورد</span>
            <input
              type="url"
              value={
                isEditingResource ? editingResource?.url || "" : newResource.url
              }
              onChange={(event) =>
                isEditingResource && editingResource
                  ? setEditingResource({
                      ...editingResource,
                      url: event.target.value,
                    })
                  : setNewResource({ ...newResource, url: event.target.value })
              }
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="https://example.com/resource"
            />
          </label>
        </div>
      </Modal>
    ) : null;

  return (
    <>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
          <ActionToolbar
            title="مصادر الدراسة"
            subtitle={`سورة ${camp.surah_name} • ${camp.name}`}
            meta={
              <div className="flex flex-wrap items-center gap-2">
                <ChipPill
                  variant="neutral"
                  className="border border-primary/40 bg-primary/15 text-primary-100"
                >
                  {totalResources.toLocaleString("ar-EG")} مورد
                </ChipPill>
                <ChipPill
                  variant="neutral"
                  className="border border-slate-700 bg-slate-900 text-slate-200"
                >
                  {totalCategories.toLocaleString("ar-EG")} فئة
                </ChipPill>
              </div>
            }
            primaryAction={
              <button
                onClick={() => openAddResourceForm()}
                className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-5 py-2 text-sm font-medium text-primary-100 transition hover:bg-primary/30"
              >
                <Plus className="h-4 w-4" />
                إضافة مورد
              </button>
            }
            secondaryActions={
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/quran-camps/${campId}/study-hall`}
                  className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-900/30 px-4 py-2 text-sm font-medium text-purple-100 transition hover:bg-purple-800/40"
                >
                  <BookOpen className="h-4 w-4" />
                  إدارة قاعة التدارس
                </Link>
                <button
                  onClick={openAddCategoryForm}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/25"
                >
                  <FolderPlus className="h-4 w-4" />
                  إضافة فئة
                </button>
              </div>
            }
            endSlot={
              latestResourceDate ? (
                <ChipPill
                  variant="neutral"
                  className="gap-2 border border-slate-700 bg-slate-900 text-slate-300"
                >
                  <Sparkles className="h-4 w-4 text-primary-100" />
                  آخر تحديث {formatDate(latestResourceDate.toISOString())}
                </ChipPill>
              ) : null
            }
          />

          {error ? (
            <div className="rounded-3xl border border-rose-900/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="عدد الفئات"
              value={totalCategories.toLocaleString("ar-EG")}
              description="تنظيم المحتوى حسب نوع المادة"
              icon={<Layers className="h-6 w-6 text-primary-100" />}
              delta={{
                value: `${
                  categoriesList.filter(
                    (category) => category.resource_count > 0
                  ).length
                } نشطة`,
                trend: totalCategories > 0 ? "up" : "neutral",
              }}
            />
            <StatCard
              label="إجمالي الموارد"
              value={totalResources.toLocaleString("ar-EG")}
              description="مواد تعليمية جاهزة للمشاركين"
              icon={<BookOpenCheck className="h-6 w-6 text-emerald-200" />}
              delta={{
                value: uncategorizedResources
                  ? `${uncategorizedResources} بدون فئة`
                  : "كلها منظمة",
                trend: uncategorizedResources ? "down" : "up",
              }}
            />
            <StatCard
              label="أكثر الفئات نشاطًا"
              value={topCategory ? topCategory.title : "—"}
              description={
                topCategory
                  ? `${topCategory.resource_count.toLocaleString("ar-EG")} مورد`
                  : "أضف فئات لتظهر هنا"
              }
              icon={<ListPlus className="h-6 w-6 text-amber-200" />}
            />
            <StatCard
              label="آخر تحديث"
              value={
                latestResourceDate
                  ? formatDate(latestResourceDate.toISOString())
                  : "لم يتم الإضافة بعد"
              }
              description="تابع المستجدات أولًا بأول"
              icon={<Sparkles className="h-6 w-6 text-cyan-200" />}
            />
          </section>

          <CampNavigation campId={campId as string} />

          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 px-8 py-16 text-center">
              <FileText className="h-12 w-12 text-slate-500" />
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-100">
                  لا توجد فئات أو موارد بعد
                </p>
                <p className="text-sm text-slate-400">
                  ابدأ بإضافة فئة ثم أضف الموارد التعليمية داخلها
                </p>
              </div>
              <button
                onClick={openAddCategoryForm}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-5 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/25"
              >
                <FolderPlus className="h-4 w-4" />
                إضافة أول فئة
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => {
                const resourceCount = category.resources?.length || 0;
                const displayTitle = category.id
                  ? category.title
                  : "موارد أخرى";

                return (
                  <section
                    key={category.id ?? "uncategorized"}
                    className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
                  >
                    <header className="flex flex-col gap-4 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-1 items-start gap-3">
                        <GripVertical className="mt-1 h-5 w-5 text-slate-500" />
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-slate-100">
                            {displayTitle}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {resourceCount
                              ? `${resourceCount.toLocaleString(
                                  "ar-EG"
                                )} مورد تعليمي`
                              : "لا توجد موارد في هذه الفئة بعد"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ChipPill
                          variant="neutral"
                          className="border border-slate-700 bg-slate-950/60 text-slate-300"
                        >
                          {resourceCount.toLocaleString("ar-EG")} مورد
                        </ChipPill>
                        {category.id ? (
                          <>
                            <button
                              onClick={() => {
                                const info = categoriesList.find(
                                  (item) => item.id === category.id
                                );
                                if (info) {
                                  setEditingCategory(info);
                                  setShowAddCategoryForm(false);
                                  setShowAddResourceForm(false);
                                }
                              }}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                            >
                              <Edit className="h-4 w-4" />
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id!)}
                              className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/20"
                            >
                              <Trash2 className="h-4 w-4" />
                              حذف
                            </button>
                          </>
                        ) : null}
                        <button
                          onClick={() => openAddResourceForm(category.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-4 py-2 text-sm text-primary-100 transition hover:bg-primary/30"
                        >
                          <Plus className="h-4 w-4" />
                          إضافة مورد
                        </button>
                      </div>
                    </header>

                    {resourceCount ? (
                      <div className="mt-4 space-y-3">
                        {category.resources.map((resource) => {
                          const Icon = getResourceIcon(resource.resource_type);
                          const hostname = extractHostname(resource.url);

                          return (
                            <article
                              key={resource.id}
                              className="group rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 transition hover:border-primary/40 hover:bg-slate-900/80"
                            >
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="flex flex-1 items-start gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-primary-100">
                                    <Icon className="h-5 w-5" />
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <h4 className="font-semibold text-slate-100">
                                      {resource.title}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      <ChipPill
                                        variant="neutral"
                                        className={cn(
                                          "border px-2.5 py-1",
                                          getResourceChipClass(
                                            resource.resource_type
                                          )
                                        )}
                                      >
                                        <Icon className="h-3.5 w-3.5" />
                                        {getResourceTypeText(
                                          resource.resource_type
                                        )}
                                      </ChipPill>
                                      {hostname ? (
                                        <ChipPill
                                          variant="neutral"
                                          className="border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-300"
                                        >
                                          <LinkIcon className="h-3.5 w-3.5" />
                                          {hostname}
                                        </ChipPill>
                                      ) : null}
                                      <span className="text-slate-400">
                                        أضيف في{" "}
                                        {formatDate(resource.created_at)}
                                      </span>
                                    </div>
                                    <a
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-primary-100 transition hover:text-primary-50"
                                    >
                                      <span className="truncate">
                                        {resource.url}
                                      </span>
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 self-end md:self-start">
                                  <button
                                    onClick={() =>
                                      startEditingResource(
                                        resource,
                                        category.id
                                      )
                                    }
                                    className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-primary-100"
                                    title="تعديل"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteResource(resource.id)
                                    }
                                    className="rounded-full border border-rose-500/40 p-2 text-rose-200 transition hover:bg-rose-500/20"
                                    title="حذف"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-10 text-center text-sm text-slate-400">
                        لا توجد موارد داخل هذه الفئة بعد
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>

      {categoryModal}
      {resourceModal}
    </>
  );
}
