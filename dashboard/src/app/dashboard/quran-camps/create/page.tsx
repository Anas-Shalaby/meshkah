// @ts-nocheck
"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Save,
  Calendar,
  Clock,
  Plus,
  Folder,
  FolderPlus,
  Trash2,
  BookOpen,
  Sparkles,
  X,
  Edit,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { SURAH_LIST } from "@/constants/surah-list";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { ChipPill } from "@/components/ui/chip-pill";

interface DailyTask {
  id?: string;
  day_number: number;
  task_type: string;
  title: string;
  description: string;
  verses_from?: number;
  verses_to?: number;
  tafseer_link?: string;
  youtube_link?: string;
  order_in_day: number;
  is_optional: boolean;
  points: number;
  group_id?: number | null;
  order_in_group?: number | null;
}

interface TaskGroup {
  id?: number;
  title: string;
  description: string;
  parent_group_id?: number | null;
  order_in_camp: number;
}

const TASK_TYPES = [
  { value: "reading", label: "قراءة" },
  { value: "memorization", label: "حفظ" },
  { value: "prayer", label: "صلاة" },
  { value: "tafseer_tabari", label: "تفسير الطبري" },
  { value: "tafseer_kathir", label: "تفسير ابن كثير" },
  { value: "youtube", label: "فيديو يوتيوب" },
  { value: "journal", label: "يوميات" },
];

const SURAH_LIST = [
  { number: 1, name: "الفاتحة" },
  { number: 2, name: "البقرة" },
  { number: 3, name: "آل عمران" },
  { number: 4, name: "النساء" },
  { number: 5, name: "المائدة" },
  { number: 6, name: "الأنعام" },
  { number: 7, name: "الأعراف" },
  { number: 8, name: "الأنفال" },
  { number: 9, name: "التوبة" },
  { number: 10, name: "يونس" },
  { number: 11, name: "هود" },
  { number: 12, name: "يوسف" },
  { number: 13, name: "الرعد" },
  { number: 14, name: "إبراهيم" },
  { number: 15, name: "الحجر" },
  { number: 16, name: "النحل" },
  { number: 17, name: "الإسراء" },
  { number: 18, name: "الكهف" },
  { number: 19, name: "مريم" },
  { number: 20, name: "طه" },
  { number: 21, name: "الأنبياء" },
  { number: 22, name: "الحج" },
  { number: 23, name: "المؤمنون" },
  { number: 24, name: "النور" },
  { number: 25, name: "الفرقان" },
  { number: 26, name: "الشعراء" },
  { number: 27, name: "النمل" },
  { number: 28, name: "القصص" },
  { number: 29, name: "العنكبوت" },
  { number: 30, name: "الروم" },
  { number: 31, name: "لقمان" },
  { number: 32, name: "السجدة" },
  { number: 33, name: "الأحزاب" },
  { number: 34, name: "سبأ" },
  { number: 35, name: "فاطر" },
  { number: 36, name: "يس" },
  { number: 37, name: "الصافات" },
  { number: 38, name: "ص" },
  { number: 39, name: "الزمر" },
  { number: 40, name: "غافر" },
  { number: 41, name: "فصلت" },
  { number: 42, name: "الشورى" },
  { number: 43, name: "الزخرف" },
  { number: 44, name: "الدخان" },
  { number: 45, name: "الجاثية" },
  { number: 46, name: "الأحقاف" },
  { number: 47, name: "محمد" },
  { number: 48, name: "الفتح" },
  { number: 49, name: "الحجرات" },
  { number: 50, name: "ق" },
  { number: 51, name: "الذاريات" },
  { number: 52, name: "الطور" },
  { number: 53, name: "النجم" },
  { number: 54, name: "القمر" },
  { number: 55, name: "الرحمن" },
  { number: 56, name: "الواقعة" },
  { number: 57, name: "الحديد" },
  { number: 58, name: "المجادلة" },
  { number: 59, name: "الحشر" },
  { number: 60, name: "الممتحنة" },
  { number: 61, name: "الصف" },
  { number: 62, name: "الجمعة" },
  { number: 63, name: "المنافقون" },
  { number: 64, name: "التغابن" },
  { number: 65, name: "الطلاق" },
  { number: 66, name: "التحريم" },
  { number: 67, name: "الملك" },
  { number: 68, name: "القلم" },
  { number: 69, name: "الحاقة" },
  { number: 70, name: "المعارج" },
  { number: 71, name: "نوح" },
  { number: 72, name: "الجن" },
  { number: 73, name: "المزمل" },
  { number: 74, name: "المدثر" },
  { number: 75, name: "القيامة" },
  { number: 76, name: "الإنسان" },
  { number: 77, name: "المرسلات" },
  { number: 78, name: "النبأ" },
  { number: 79, name: "النازعات" },
  { number: 80, name: "عبس" },
  { number: 81, name: "التكوير" },
  { number: 82, name: "الإنفطار" },
  { number: 83, name: "المطففين" },
  { number: 84, name: "الإنشقاق" },
  { number: 85, name: "البروج" },
  { number: 86, name: "الطارق" },
  { number: 87, name: "الأعلى" },
  { number: 88, name: "الغاشية" },
  { number: 89, name: "الفجر" },
  { number: 90, name: "البلد" },
  { number: 91, name: "الشمس" },
  { number: 92, name: "الليل" },
  { number: 93, name: "الضحى" },
  { number: 94, name: "الشرح" },
  { number: 95, name: "التين" },
  { number: 96, name: "العلق" },
  { number: 97, name: "القدر" },
  { number: 98, name: "البينة" },
  { number: 99, name: "الزلزلة" },
  { number: 100, name: "العاديات" },
  { number: 101, name: "القارعة" },
  { number: 102, name: "التكاثر" },
  { number: 103, name: "العصر" },
  { number: 104, name: "الهمزة" },
  { number: 105, name: "الفيل" },
  { number: 106, name: "قريش" },
  { number: 107, name: "الماعون" },
  { number: 108, name: "الكوثر" },
  { number: 109, name: "الكافرون" },
  { number: 110, name: "النصر" },
  { number: 111, name: "المسد" },
  { number: 112, name: "الإخلاص" },
  { number: 113, name: "الفلق" },
  { number: 114, name: "الناس" },
];

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

  const handleContentClick = (event) => {
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
            <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
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

export default function CreateQuranCampPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"choose" | "fromScratch" | "fromTemplate">(
    "choose"
  );
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  );
  const [newCampNameFromTemplate, setNewCampNameFromTemplate] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [campData, setCampData] = useState({
    name: "",
    description: "",
    tags: "",
    surah_number: 20,
    surah_name: "طه",
    start_date: "",
    duration_days: 7,
    banner_image: "",
    opening_surah_number: undefined as number | undefined,
    opening_surah_name: undefined as string | undefined,
    opening_youtube_url: undefined as string | undefined,
  });

  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(
    null
  );
  const [newTask, setNewTask] = useState<DailyTask>({
    day_number: 1,
    task_type: "reading",
    title: "",
    description: "",
    order_in_day: 1,
    is_optional: false,
    points: 3,
  });
  const [newGroup, setNewGroup] = useState<TaskGroup>({
    title: "",
    description: "",
    parent_group_id: null,
    order_in_camp: 0,
  });

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

  const handleOpeningSurahChange = (surahNumber: number) => {
    const surah = SURAH_LIST.find((s) => s.number === surahNumber);
    setCampData((prev) => ({
      ...prev,
      opening_surah_number: surahNumber,
      opening_surah_name: surah?.name || "",
    }));
  };

  const openGroupModal = (
    group: TaskGroup | null = null,
    index: number | null = null
  ) => {
    if (group && index !== null) {
      setEditingGroup(group);
      setEditingGroupIndex(index);
      setNewGroup({ ...group });
    } else {
      setEditingGroup(null);
      setEditingGroupIndex(null);
      setNewGroup({
        title: "",
        description: "",
        parent_group_id: null,
        order_in_camp: taskGroups.length,
      });
    }
    setShowGroupModal(true);
  };

  const closeGroupModal = () => {
    setShowGroupModal(false);
    setEditingGroup(null);
    setEditingGroupIndex(null);
    setNewGroup({
      title: "",
      description: "",
      parent_group_id: null,
      order_in_camp: 0,
    });
  };

  const handleSaveGroup = () => {
    if (!newGroup.title.trim()) return;

    if (editingGroupIndex !== null) {
      setTaskGroups((prev) =>
        prev.map((group, i) =>
          i === editingGroupIndex
            ? { ...newGroup, order_in_camp: group.order_in_camp }
            : group
        )
      );
    } else {
      setTaskGroups((prev) => [
        ...prev,
        { ...newGroup, order_in_camp: prev.length },
      ]);
    }
    closeGroupModal();
  };

  const removeTaskGroup = (index: number) => {
    if (confirm("هل أنت متأكد من حذف هذه المجموعة؟")) {
      setTaskGroups((prev) => prev.filter((_, i) => i !== index));
      // Remove group_id from tasks that reference this group
      setDailyTasks((prev) =>
        prev.map((task) =>
          task.group_id === index ? { ...task, group_id: null } : task
        )
      );
    }
  };

  const openTaskModal = (
    task: DailyTask | null = null,
    index: number | null = null,
    dayNumber?: number
  ) => {
    if (task && index !== null) {
      setEditingTask(task);
      setEditingTaskIndex(index);
      setNewTask({ ...task });
    } else {
      setEditingTask(null);
      setEditingTaskIndex(null);
      const day = dayNumber || 1;
      setNewTask({
        day_number: day,
        task_type: "reading",
        title: "",
        description: "",
        order_in_day: dailyTasks.filter((t) => t.day_number === day).length + 1,
        is_optional: false,
        points: 3,
      });
    }
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    setEditingTaskIndex(null);
    setNewTask({
      day_number: 1,
      task_type: "reading",
      title: "",
      description: "",
      order_in_day: 1,
      is_optional: false,
      points: 3,
    });
  };

  const handleSaveTask = () => {
    if (!newTask.title.trim()) return;

    if (editingTaskIndex !== null) {
      setDailyTasks((prev) =>
        prev.map((task, i) => (i === editingTaskIndex ? newTask : task))
      );
    } else {
      setDailyTasks((prev) => [...prev, newTask]);
    }
    closeTaskModal();
  };

  const removeDailyTask = (index: number) => {
    if (confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
      setDailyTasks((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const getTaskTypeText = (taskType: string) => {
    const type = TASK_TYPES.find((t) => t.value === taskType);
    return type?.label || taskType;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Create camp
      const campResponse = await dashboardService.createQuranCamp(campData);
      const campId = campResponse.data.campId;

      // Create task groups first
      for (const group of taskGroups) {
        if (group.title.trim()) {
          await dashboardService.createTaskGroup(campId, group);
        }
      }

      // Fetch created groups to get their IDs
      const groupsResponse = await dashboardService.getCampTaskGroups(campId);
      const createdGroups = groupsResponse.data || [];

      // Map tasks to groups - convert group index to actual group ID
      const tasksWithGroups = dailyTasks.map((task) => {
        if (task.group_id !== null && task.group_id !== undefined) {
          // task.group_id is the index in taskGroups array
          const groupIndex = task.group_id as number;
          if (groupIndex >= 0 && groupIndex < createdGroups.length) {
            return {
              ...task,
              group_id: createdGroups[groupIndex].id,
            };
          }
        }
        return {
          ...task,
          group_id: null,
        };
      });

      // Add daily tasks if any
      if (tasksWithGroups.length > 0) {
        await dashboardService.addDailyTasks(campId, tasksWithGroups);
      }

      router.push("/dashboard/quran-camps");
    } catch (error) {
      console.error("Error creating camp:", error);
      alert("حدث خطأ في إنشاء المخيم");
    } finally {
      setLoading(false);
    }
  };

  const generateDays = () => {
    return Array.from({ length: campData.duration_days }, (_, i) => i + 1);
  };

  // Load templates when switching to fromTemplate
  useEffect(() => {
    const load = async () => {
      if (mode !== "fromTemplate") return;
      try {
        setTemplatesLoading(true);
        const res = await dashboardService.getCampTemplates();
        setTemplates(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setTemplatesLoading(false);
      }
    };
    load();
  }, [mode]);

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplateId || !newCampNameFromTemplate.trim()) return;
    try {
      setLoading(true);
      const res = await dashboardService.createCampFromTemplate(
        selectedTemplateId,
        newCampNameFromTemplate.trim()
      );
      const newId = res.newCampId;
      router.push(`/dashboard/quran-camps/${newId}`);
    } catch (e) {
      console.error(e);
      alert("فشل إنشاء المخيم من القالب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <ActionToolbar
          title="إنشاء مخيم قرآني جديد"
          subtitle={
            mode === "fromScratch"
              ? `خطوة ${currentStep} من 2`
              : mode === "fromTemplate"
              ? "اختر قالباً لبدء المخيم"
              : "اختر طريقة الإنشاء"
          }
          secondaryActions={
            mode !== "choose" ? (
              <Link
                href="/dashboard/quran-camps"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                العودة
              </Link>
            ) : null
          }
          endSlot={
            mode === "fromScratch" ? (
              <ChipPill
                variant="neutral"
                className="gap-2 border border-slate-700 bg-slate-900 text-slate-300"
              >
                <Sparkles className="h-4 w-4 text-primary-100" />
                خطوة {currentStep} من 2
              </ChipPill>
            ) : null
          }
        />

        {/* Mode chooser */}
        {mode === "choose" && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
            <header className="mb-6">
              <h2 className="text-lg font-semibold text-slate-100">
                كيف تود أن تبدأ؟
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                اختر طريقة إنشاء المخيم
              </p>
            </header>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <button
                onClick={() => setMode("fromScratch")}
                className="group rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-right transition hover:border-primary/40 hover:bg-slate-900/80"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary-100 group-hover:bg-primary/20">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-slate-100">
                    البدء من الصفر
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  إنشاء مخيم جديد وملء التفاصيل والمهام يدويًا.
                </p>
              </button>
              <button
                onClick={() => setMode("fromTemplate")}
                className="group rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-right transition hover:border-primary/40 hover:bg-slate-900/80"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 group-hover:bg-emerald-500/20">
                    <Folder className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-slate-100">
                    البدء من قالب
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  اختر قالبًا لنسخ بنية الأيام والمجموعات والمهام.
                </p>
              </button>
            </div>
          </section>
        )}

        {/* Progress Bar */}
        {mode === "fromScratch" && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span>خطوة {currentStep} من 2</span>
              <span>{Math.round((currentStep / 2) * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-300"
                style={{ width: `${(currentStep / 2) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* From Template UI */}
        {mode === "fromTemplate" && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  اختر قالبًا
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  اختر قالباً لنسخ بنية المخيم
                </p>
              </div>
              <button
                onClick={() => setMode("choose")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                رجوع
              </button>
            </header>
            {templatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-800 border-t-primary"></div>
              </div>
            ) : templates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-12 text-center text-slate-400">
                لا توجد قوالب حالياً.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`group rounded-2xl border p-4 text-right transition ${
                      selectedTemplateId === t.id
                        ? "border-primary/60 bg-primary/10"
                        : "border-slate-800 bg-slate-950/60 hover:border-primary/40 hover:bg-slate-900/80"
                    }`}
                  >
                    <div className="mb-2 font-semibold text-slate-100">
                      {t.name}
                    </div>
                    <div className="space-y-1 text-xs text-slate-400">
                      <div>السورة: {t.surah_name || t.surah_number || "-"}</div>
                      <div>مدة: {t.duration_days} يوم</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">
                  اسم المخيم الجديد
                </span>
                <input
                  type="text"
                  value={newCampNameFromTemplate}
                  onChange={(e) => setNewCampNameFromTemplate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="مثال: مخيم سورة طه (نسخة)"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCreateFromTemplate}
                disabled={
                  loading ||
                  !selectedTemplateId ||
                  !newCampNameFromTemplate.trim()
                }
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-5 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-emerald-100" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {loading ? "جارٍ الإنشاء..." : "إنشاء المخيم"}
              </button>
            </div>
          </section>
        )}

        {/* Step 1: Camp Information */}
        {mode === "fromScratch" && currentStep === 1 && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  معلومات المخيم
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  أدخل البيانات الأساسية للمخيم
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

              <label className="md:col-span-2 block space-y-2">
                <span className="text-sm font-medium text-slate-300">
                  رابط صورة البانر (اختياري)
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

              {/* Opening Section */}
              <div className="md:col-span-2 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
                <h3 className="text-md font-semibold text-slate-100">
                  الافتتاحية (اختياري)
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-300">
                      سورة الافتتاحية
                    </span>
                    <select
                      value={campData.opening_surah_number || ""}
                      onChange={(e) =>
                        handleOpeningSurahChange(
                          e.target.value ? parseInt(e.target.value) : 0
                        )
                      }
                      className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">اختر سورة...</option>
                      {SURAH_LIST.map((surah) => (
                        <option key={surah.number} value={surah.number}>
                          {surah.number}. {surah.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="md:col-span-2 block space-y-2">
                    <span className="text-sm font-medium text-slate-300">
                      رابط فيديو الافتتاحية (يوتيوب)
                    </span>
                    <input
                      type="url"
                      value={campData.opening_youtube_url || ""}
                      onChange={(e) =>
                        handleCampDataChange(
                          "opening_youtube_url",
                          e.target.value
                        )
                      }
                      className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-slate-400">
                      سيتم عرض الفيديو في اليوم الأول بدون هوية يوتيوب
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!campData.name || !campData.start_date}
                className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-5 py-2 text-sm font-medium text-primary-100 transition hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                التالي
              </button>
            </div>
          </section>
        )}

        {/* Step 2: Daily Tasks */}
        {mode === "fromScratch" && currentStep === 2 && (
          <div className="space-y-6">
            {/* Task Groups Management */}
            {taskGroups.length > 0 && (
              <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">
                      المجموعات ({taskGroups.length})
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      مجموعات المهام المنظمة
                    </p>
                  </div>
                </header>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {taskGroups.map((group, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Folder className="w-5 h-5 text-purple-300" />
                          <h3 className="font-semibold text-slate-100">
                            {group.title}
                          </h3>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openGroupModal(group, index)}
                            className="rounded-full p-1 text-azure-300 transition hover:bg-slate-800 hover:text-azure-100"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeTaskGroup(index)}
                            className="rounded-full p-1 text-rose-300 transition hover:bg-slate-900 hover:text-rose-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {group.description && (
                        <p className="mb-2 text-sm text-slate-400">
                          {group.description}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        {dailyTasks.filter((t) => t.group_id === index).length}{" "}
                        مهمة
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    مجموعات المهام (اختياري)
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    نظم المهام في مجموعات لتسهيل إدارتها
                  </p>
                </div>
                <button
                  onClick={() => openGroupModal(null, null)}
                  className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-900/40 px-4 py-2 text-sm font-medium text-purple-100 transition hover:bg-purple-800/40"
                >
                  <FolderPlus className="h-4 w-4" />
                  إضافة مجموعة
                </button>
              </header>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    المهام اليومية
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    أضف المهام لكل يوم من أيام المخيم
                  </p>
                </div>
                <ChipPill variant="neutral" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {campData.duration_days} أيام
                </ChipPill>
              </header>

              <div className="space-y-6">
                {dailyTasks.length === 0 ? (
                  <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
                    <p>لم يتم إضافة مهام بعد لهذا المخيم.</p>
                    <button
                      onClick={() => openTaskModal(null, null, 1)}
                      className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-4 py-2 text-sm font-medium text-primary-100 transition hover:bg-primary/30"
                    >
                      <Plus className="h-4 w-4" />
                      إضافة أول مهمة
                    </button>
                  </div>
                ) : (
                  Object.entries(
                    dailyTasks.reduce((acc, task) => {
                      const day = task.day_number;
                      if (!acc[day]) acc[day] = [];
                      acc[day].push(task);
                      return acc;
                    }, {})
                  )
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([day, dayTasks]: [string, DailyTask[]]) => (
                      <div
                        key={day}
                        className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-100">
                            اليوم {day}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">
                              {dayTasks.length} مهمة
                            </span>
                            <button
                              onClick={() =>
                                openTaskModal(null, null, Number(day))
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-4 py-2 text-sm font-medium text-primary-100 transition hover:bg-primary/30"
                            >
                              <Plus className="h-4 w-4" />
                              إضافة مهمة
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {dayTasks
                            .sort((a, b) => a.order_in_day - b.order_in_day)
                            .map((task, index) => {
                              const taskIndex = dailyTasks.findIndex(
                                (t) => t === task
                              );
                              return (
                                <div
                                  key={index}
                                  className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="mb-2 flex items-center gap-3">
                                        <ChipPill
                                          variant="neutral"
                                          className="border border-azure-500/40 bg-azure-900/30 px-3 py-1 text-xs text-azure-200"
                                        >
                                          {getTaskTypeText(task.task_type)}
                                        </ChipPill>
                                        <span className="text-sm text-slate-400">
                                          ترتيب {task.order_in_day}
                                        </span>
                                        {task.is_optional ? (
                                          <ChipPill
                                            variant="warning"
                                            className="border border-amber-500/40 bg-amber-900/30 px-3 py-1 text-xs text-amber-200"
                                          >
                                            اختياري
                                          </ChipPill>
                                        ) : (
                                          <ChipPill
                                            variant="default"
                                            className="border border-slate-500/40 bg-slate-900/30 px-3 py-1 text-xs text-slate-200"
                                          >
                                            مطلوب
                                          </ChipPill>
                                        )}
                                      </div>

                                      <h4 className="mb-1 font-medium text-slate-100">
                                        {task.title}
                                      </h4>

                                      {task.description && (
                                        <p className="mb-2 text-sm text-slate-400">
                                          {task.description}
                                        </p>
                                      )}

                                      {task.verses_from && task.verses_to && (
                                        <p className="mb-2 text-xs text-azure-200">
                                          الآيات {task.verses_from} -{" "}
                                          {task.verses_to}
                                        </p>
                                      )}

                                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                        {task.tafseer_link && (
                                          <a
                                            href={task.tafseer_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-azure-300 transition hover:text-azure-100"
                                          >
                                            رابط التفسير
                                          </a>
                                        )}
                                        {task.youtube_link && (
                                          <a
                                            href={task.youtube_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-rose-300 transition hover:text-rose-200"
                                          >
                                            رابط اليوتيوب
                                          </a>
                                        )}
                                        <span>{task.points} نقطة</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() =>
                                          openTaskModal(task, taskIndex)
                                        }
                                        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-primary-100"
                                        title="تعديل"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          removeDailyTask(taskIndex)
                                        }
                                        className="rounded-full p-2 text-rose-300 transition hover:bg-slate-900 hover:text-rose-200"
                                        title="حذف"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </section>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                السابق
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-5 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-emerald-100" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? "جاري الإنشاء..." : "إنشاء المخيم"}
              </button>
            </div>
          </div>
        )}

        {/* Group Modal */}
        {showGroupModal && (
          <Modal
            title={editingGroup ? "تعديل المجموعة" : "إضافة مجموعة جديدة"}
            description="نظم المهام في مجموعات لتسهيل إدارتها"
            onClose={closeGroupModal}
            footer={
              <>
                <button
                  onClick={closeGroupModal}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveGroup}
                  disabled={!newGroup.title.trim()}
                  className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-900/40 px-4 py-2 text-sm font-medium text-purple-100 transition hover:bg-purple-800/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editingGroup ? "حفظ التعديلات" : "إضافة المجموعة"}
                </button>
              </>
            }
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  عنوان المجموعة *
                </label>
                <input
                  type="text"
                  value={newGroup.title}
                  onChange={(e) =>
                    setNewGroup((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="مثال: تفسير الطبري"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  المجموعة الأم (اختياري)
                </label>
                <select
                  value={newGroup.parent_group_id ?? ""}
                  onChange={(e) =>
                    setNewGroup((prev) => ({
                      ...prev,
                      parent_group_id: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="">لا يوجد (مجموعة رئيسية)</option>
                  {taskGroups
                    .filter(
                      (group, i) =>
                        !editingGroupIndex || i !== editingGroupIndex
                    )
                    .map((group, i) => (
                      <option key={i} value={i}>
                        {group.title || `مجموعة ${i + 1}`}
                      </option>
                    ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  تفاصيل إضافية
                </label>
                <textarea
                  value={newGroup.description || ""}
                  onChange={(e) =>
                    setNewGroup((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="أضف تفاصيل عن هذه المجموعة"
                />
              </div>
            </div>
          </Modal>
        )}

        {/* Task Modal */}
        {showTaskModal && (
          <Modal
            size="lg"
            title={editingTask ? "تعديل المهمة" : "إضافة مهمة جديدة"}
            description="اضبط تفاصيل المهمة ووزّعها على اليوم المناسب"
            onClose={closeTaskModal}
            footer={
              <>
                <button
                  onClick={closeTaskModal}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveTask}
                  disabled={!newTask.title.trim()}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/25 px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/35 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editingTask ? "حفظ التعديلات" : "إضافة المهمة"}
                </button>
              </>
            }
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  اليوم
                </label>
                <input
                  type="number"
                  min="1"
                  max={campData.duration_days || 7}
                  value={newTask.day_number}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      day_number: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  نوع المهمة
                </label>
                <select
                  value={newTask.task_type}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      task_type: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {TASK_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  المجموعة (اختياري)
                </label>
                <select
                  value={newTask.group_id ?? ""}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      group_id: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">لا يوجد (مهمة مستقلة)</option>
                  {taskGroups.map((group, groupIndex) => (
                    <option key={groupIndex} value={groupIndex}>
                      {group.title || `مجموعة ${groupIndex + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  العنوان *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="مثال: حفظ الآيات 1-10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  ترتيب المهمة في اليوم
                </label>
                <input
                  type="number"
                  min="1"
                  value={newTask.order_in_day}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      order_in_day: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  من آية
                </label>
                <input
                  type="number"
                  value={newTask.verses_from ?? ""}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      verses_from: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  إلى آية
                </label>
                <input
                  type="number"
                  value={newTask.verses_to ?? ""}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      verses_to: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  رابط التفسير
                </label>
                <input
                  type="url"
                  value={newTask.tafseer_link || ""}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      tafseer_link: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://example.com/tafseer"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  رابط اليوتيوب
                </label>
                <input
                  type="url"
                  value={newTask.youtube_link || ""}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      youtube_link: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://youtu.be/..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  الوصف
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="أدخل تفاصيل المهمة"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(newTask.is_optional)}
                    onChange={(e) =>
                      setNewTask((prev) => ({
                        ...prev,
                        is_optional: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-primary focus:ring-primary"
                  />
                  مهمة اختيارية
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  النقاط المخصصة
                </label>
                <input
                  type="number"
                  value={newTask.points}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      points: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
