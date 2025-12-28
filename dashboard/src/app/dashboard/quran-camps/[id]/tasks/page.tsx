// @ts-nocheck
"use client";

import { useState, useEffect, ReactNode } from "react";
import { useParams } from "next/navigation";
import { createPortal } from "react-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Calendar,
  BookOpen,
  Clock,
  Edit,
  FolderPlus,
  Folder,
  X,
  GripVertical,
  Download,
  Upload,
  FileText,
  ArrowRight,
  Copy,
  Eye,
  CheckSquare,
  Square,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { ChipPill } from "@/components/ui/chip-pill";
import { CampNavigation } from "@/components/quran-camps/CampNavigation";

const TASK_TYPES = [
  { value: "reading", label: "قراءة" },
  { value: "memorization", label: "حفظ" },
  { value: "prayer", label: "صلاة" },
  { value: "tafseer_tabari", label: "تفسير الطبري" },
  { value: "tafseer_kathir", label: "تفسير ابن كثير" },
  { value: "youtube", label: "فيديو يوتيوب" },
  { value: "journal", label: "يوميات" },
];

// Sortable Task Component
function SortableTask({
  task,
  onEdit,
  onDelete,
  getTaskTypeText,
  bulkDeleteMode,
  isSelected,
  onToggleSelect,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-950/60 p-3 sm:p-4 ${
        isDragging ? "shadow-2xl ring-2 ring-primary" : ""
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
          {bulkDeleteMode ? (
            <button
              onClick={() => onToggleSelect(task.id)}
              className="mt-1 text-slate-400 hover:text-slate-200 transition p-1 rounded flex-shrink-0"
              title={isSelected ? "إلغاء الاختيار" : "اختر للحذف"}
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              ) : (
                <Square className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          ) : (
            <button
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition p-1 rounded flex-shrink-0"
              title="اسحب لإعادة الترتيب"
            >
              <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
              <ChipPill
                variant="neutral"
                className="border border-azure-500/40 bg-azure-900/30 px-2 sm:px-3 py-0.5 sm:py-1 text-xs text-azure-200"
              >
                {getTaskTypeText(task.task_type)}
              </ChipPill>
              <span className="text-xs sm:text-sm text-slate-400">
                ترتيب {task.order_in_day}
              </span>
              {task.is_optional ? (
                <ChipPill
                  variant="warning"
                  className="border border-amber-500/40 bg-amber-900/30 px-2 sm:px-3 py-0.5 sm:py-1 text-xs text-amber-200"
                >
                  اختياري
                </ChipPill>
              ) : (
                <ChipPill
                  variant="default"
                  className="border border-slate-500/40 bg-slate-900/30 px-2 sm:px-3 py-0.5 sm:py-1 text-xs text-slate-200"
                >
                  مطلوب
                </ChipPill>
              )}
            </div>

            <h4 className="mb-1 text-sm sm:text-base font-medium text-slate-100 break-words">
              {task.title}
            </h4>

            <p className="mb-2 text-xs sm:text-sm text-slate-400 break-words">
              {task.description}
            </p>

            {task.verses_from && task.verses_to && (
              <p className="mb-2 text-xs text-azure-200">
                الآيات {task.verses_from} - {task.verses_to}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-400">
              {task.estimated_time && (
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {task.estimated_time}
                </span>
              )}
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
              {(() => {
                let links = task.additional_links;
                if (typeof links === "string" && links) {
                  try {
                    links = JSON.parse(links);
                  } catch (e) {
                    links = null;
                  }
                }
                return Array.isArray(links) && links.length > 0 ? (
                  <span className="text-emerald-300">
                    {links.length} رابط إضافي
                  </span>
                ) : null;
              })()}
              {(() => {
                let attachments = task.attachments;
                if (typeof attachments === "string" && attachments) {
                  try {
                    attachments = JSON.parse(attachments);
                  } catch (e) {
                    attachments = null;
                  }
                }
                return Array.isArray(attachments) && attachments.length > 0 ? (
                  <span className="text-amber-300">
                    {attachments.length} مرفق
                  </span>
                ) : null;
              })()}
              <span>{task.points} نقطة</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 self-start sm:self-auto flex-shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="rounded-full p-1.5 sm:p-2 text-slate-400 transition hover:bg-slate-800 hover:text-primary-100"
            title="تعديل"
          >
            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="rounded-full p-1.5 sm:p-2 text-slate-400 transition hover:bg-slate-900 hover:text-rose-300"
            title="حذف"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

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
  duration_days: number;
}

interface CampTask {
  id: number;
  day_number: number;
  task_type: string;
  title: string;
  description: string;
  verses_from?: number | null;
  verses_to?: number | null;
  tafseer_link?: string;
  youtube_link?: string;
  additional_links?:
    | string
    | Array<{
        title: string;
        url: string;
        type?: string;
        embed?: boolean;
        display_mode?: string;
      }>
    | null;
  attachments?:
    | string
    | Array<{ filename: string; url: string; type?: string; size?: number }>
    | null;
  order_in_day: number;
  is_optional: boolean;
  points: number;
  estimated_time?: number | null;
  group_id?: number | null;
  order_in_group?: number | null;
}

interface DayChallenge {
  day_number: number;
  title: string;
  description: string;
}

interface TaskGroup {
  id: number;
  title: string;
  description?: string | null;
  parent_group_id?: number | null;
  order_in_camp?: number;
  tasks_count?: number;
}

type NewTaskPayload = {
  day_number: number;
  task_type: string;
  title: string;
  description: string;
  verses_from: number | null;
  verses_to: number | null;
  tafseer_link: string;
  youtube_link: string;
  additional_links?: Array<{
    title: string;
    url: string;
    type?: string;
    embed?: boolean;
    display_mode?: string;
  }> | null;
  attachments?: Array<{
    filename: string;
    url: string;
    type?: string;
    size?: number;
  }> | null;
  order_in_day: number;
  is_optional: boolean;
  points: number;
  estimated_time: number | null;
  group_id: number | null;
  order_in_group: number | null;
};

type NewGroupPayload = {
  title: string;
  description: string;
  parent_group_id: number | null;
  order_in_camp: number;
};

const initialTaskState: NewTaskPayload = {
  day_number: 1,
  task_type: "reading",
  title: "",
  description: "",
  verses_from: null,
  verses_to: null,
  tafseer_link: "",
  youtube_link: "",
  additional_links: null,
  attachments: null,
  order_in_day: 1,
  is_optional: false,
  points: 3,
  estimated_time: 30,
  group_id: null,
  order_in_group: null,
};

const initialGroupState: NewGroupPayload = {
  title: "",
  description: "",
  parent_group_id: null,
  order_in_camp: 0,
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

  const handleContentClick = (event: React.MouseEvent) => {
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
        className={`relative w-full mx-4 sm:mx-0 ${maxWidth} max-h-[90vh] overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-2xl`}
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

export default function CampTasksPage() {
  const params = useParams();
  const campId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [camp, setCamp] = useState<CampSummary | null>(null);
  const [tasks, setTasks] = useState<CampTask[]>([]);
  const [dayChallenges, setDayChallenges] = useState<
    Record<number, { title: string; description: string }>
  >({});
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingTask, setEditingTask] = useState<CampTask | null>(null);
  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<CampTask | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [importData, setImportData] = useState<string>("");
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<any[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [challengeEditor, setChallengeEditor] = useState<{
    day: number | null;
    title: string;
    description: string;
  }>({
    day: null,
    title: "",
    description: "",
  });
  const [challengeSaving, setChallengeSaving] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [showTaskPreview, setShowTaskPreview] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedCohortNumber, setSelectedCohortNumber] = useState<
    number | null
  >(null);

  const applyTasksPayload = (tasksResponse: any) => {
    const payload = tasksResponse?.data ?? tasksResponse ?? {};
    setTasks(payload.data || []);
    setDayChallenges(payload.dayChallenges || {});
  };

  const openChallengeEditor = (dayNumber: number) => {
    const challenge = dayChallenges?.[dayNumber];
    setChallengeEditor({
      day: dayNumber,
      title: challenge?.title || "",
      description: challenge?.description || "",
    });
    setChallengeError(null);
  };

  const closeChallengeEditor = () => {
    setChallengeEditor({
      day: null,
      title: "",
      description: "",
    });
    setChallengeError(null);
  };

  const handleSaveChallenge = async () => {
    if (!campId || !challengeEditor.day) return;
    const trimmedTitle = challengeEditor.title.trim();
    const trimmedDescription = challengeEditor.description.trim();

    if (!trimmedTitle || !trimmedDescription) {
      setChallengeError("عنوان التحدي ووصفه مطلوبان");
      return;
    }

    try {
      setChallengeSaving(true);
      setChallengeError(null);
      await dashboardService.saveCampDayChallenge(campId, {
        day_number: challengeEditor.day,
        title: trimmedTitle,
        description: trimmedDescription,
      });
      const tasksResponse = await dashboardService.getCampDailyTasks(
        campId,
        selectedCohortNumber || undefined
      );
      applyTasksPayload(tasksResponse);
      closeChallengeEditor();
    } catch (error) {
      console.error("Error saving day challenge:", error);
      setChallengeError("حدث خطأ أثناء حفظ التحدي");
    } finally {
      setChallengeSaving(false);
    }
  };

  const handleDeleteChallenge = async (dayNumber: number) => {
    if (!campId) return;
    const shouldDelete = window.confirm("هل أنت متأكد من حذف تحدي هذا اليوم؟");
    if (!shouldDelete) return;

    try {
      setChallengeSaving(true);
      setChallengeError(null);
      await dashboardService.deleteCampDayChallenge(campId, dayNumber);
      const tasksResponse = await dashboardService.getCampDailyTasks(
        campId,
        selectedCohortNumber || undefined
      );
      applyTasksPayload(tasksResponse);
      if (challengeEditor.day === dayNumber) {
        closeChallengeEditor();
      }
    } catch (error) {
      console.error("Error deleting day challenge:", error);
      setChallengeError("حدث خطأ أثناء حذف التحدي");
    } finally {
      setChallengeSaving(false);
    }
  };

  const [newTask, setNewTask] = useState<NewTaskPayload>({
    ...initialTaskState,
  });

  const [newGroup, setNewGroup] = useState<NewGroupPayload>({
    ...initialGroupState,
  });

  const handleImportData = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      const tasks = parsed.tasks || parsed; // Support both formats

      if (!Array.isArray(tasks)) {
        setImportPreview([]);
        setImportErrors([
          {
            index: 0,
            task: "Invalid format",
            errors: ["يجب أن تكون البيانات مصفوفة من المهام"],
          },
        ]);
        return;
      }

      // Validate tasks
      const validTasks: any[] = [];
      const errors: any[] = [];
      const validTaskTypes = [
        "reading",
        "memorization",
        "prayer",
        "tafseer_tabari",
        "tafseer_kathir",
        "youtube",
        "journal",
      ];

      tasks.forEach((task: any, index: number) => {
        const taskErrors: string[] = [];

        if (!task.day_number || task.day_number < 1) {
          taskErrors.push("day_number مطلوب ويجب أن يكون >= 1");
        }
        if (camp && task.day_number > camp.duration_days) {
          taskErrors.push(
            `day_number (${task.day_number}) يتجاوز مدة المخيم (${camp.duration_days})`
          );
        }
        if (!task.task_type || !validTaskTypes.includes(task.task_type)) {
          taskErrors.push(
            `task_type مطلوب ويجب أن يكون: ${validTaskTypes.join(", ")}`
          );
        }
        if (!task.title || !task.title.trim()) {
          taskErrors.push("title مطلوب");
        }

        if (taskErrors.length > 0) {
          errors.push({
            index: index + 1,
            task: task.title || `Task #${index + 1}`,
            errors: taskErrors,
          });
        } else {
          validTasks.push(task);
        }
      });

      setImportPreview(validTasks);
      setImportErrors(errors);
    } catch (err: any) {
      setImportPreview([]);
      setImportErrors([
        {
          index: 0,
          task: "Parse Error",
          errors: [err.message || "خطأ في قراءة JSON"],
        },
      ]);
    }
  };

  const closeAddTaskModal = () => {
    setShowAddForm(false);
    setNewTask({ ...initialTaskState });
  };

  const openAddTaskModal = () => {
    setEditingTask(null);
    setNewTask({ ...initialTaskState });
    setShowAddForm(true);
  };

  const openEditTaskModal = (task: CampTask) => {
    setShowAddForm(false);
    setEditingTask(task);
    setShowTaskPreview(false);
  };

  // دالة نسخ المهمة إلى يوم آخر
  const handleCopyTask = async (task: CampTask, targetDay: number) => {
    if (!campId) return;

    try {
      setSaving(true);
      const taskPayload: NewTaskPayload = {
        day_number: targetDay,
        task_type: task.task_type,
        title: `${task.title} (نسخة)`,
        description: task.description,
        verses_from: task.verses_from ?? null,
        verses_to: task.verses_to ?? null,
        tafseer_link: task.tafseer_link || "",
        youtube_link: task.youtube_link || "",
        order_in_day: 1, // سيتم تحديثه تلقائياً
        is_optional: task.is_optional,
        points: task.points,
        estimated_time: task.estimated_time ?? null,
        group_id: task.group_id ?? null,
        order_in_group: task.order_in_group ?? null,
      };

      await dashboardService.addDailyTasks(campId, { tasks: [taskPayload] });
      await loadTasks();
      alert("تم نسخ المهمة بنجاح!");
    } catch (error) {
      console.error("Error copying task:", error);
      setError("حدث خطأ أثناء نسخ المهمة");
    } finally {
      setSaving(false);
    }
  };

  // دالة الحذف الجماعي
  const handleBulkDelete = async () => {
    if (!campId || selectedTasks.size === 0) return;

    if (!confirm(`هل أنت متأكد من حذف ${selectedTasks.size} مهمة؟`)) return;

    try {
      setSaving(true);
      const deletePromises = Array.from(selectedTasks).map((taskId) =>
        dashboardService.deleteDailyTask(String(taskId))
      );
      await Promise.all(deletePromises);
      await loadTasks();
      setSelectedTasks(new Set());
      setBulkDeleteMode(false);
      alert(`تم حذف ${selectedTasks.size} مهمة بنجاح!`);
    } catch (error) {
      console.error("Error bulk deleting tasks:", error);
      setError("حدث خطأ أثناء حذف المهام");
    } finally {
      setSaving(false);
    }
  };

  // تبديل اختيار مهمة
  const toggleTaskSelection = (taskId: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const closeEditTaskModal = () => {
    setEditingTask(null);
  };

  const openGroupModal = (group: TaskGroup | null = null) => {
    if (group) {
      setEditingGroup(group);
    } else {
      setEditingGroup(null);
      setNewGroup({ ...initialGroupState });
    }
    setShowGroupForm(true);
  };

  const closeGroupModal = () => {
    setShowGroupForm(false);
    setEditingGroup(null);
    setNewGroup({ ...initialGroupState });
  };

  const updateGroupField = (field: keyof NewGroupPayload, value: any) => {
    if (editingGroup) {
      setEditingGroup((prev) => (prev ? { ...prev, [field]: value } : prev));
    } else {
      setNewGroup((prev) => ({ ...prev, [field]: value }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!campId) return;
      try {
        const [campResponse, tasksResponse, groupsResponse] = await Promise.all(
          [
            dashboardService.getQuranCampDetails(campId),
            dashboardService.getCampDailyTasks(
              campId,
              selectedCohortNumber || undefined
            ),
            dashboardService.getCampTaskGroups(campId),
          ]
        );

        const campData = campResponse.data?.data ?? null;
        setCamp(campData);

        // Set default cohort number
        if (campData?.current_cohort_number && !selectedCohortNumber) {
          setSelectedCohortNumber(campData.current_cohort_number);
        }

        applyTasksPayload(tasksResponse);
        setTaskGroups(groupsResponse.data || []);
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

  const handleAddTask = async () => {
    if (!campId) return;
    try {
      setSaving(true);
      setError(null);

      await dashboardService.addDailyTasks(campId, [newTask]);

      // Refresh tasks
      const tasksResponse = await dashboardService.getCampDailyTasks(
        campId,
        selectedCohortNumber || undefined
      );
      applyTasksPayload(tasksResponse);

      closeAddTaskModal();
    } catch (error) {
      console.error("Error adding task:", error);
      setError("حدث خطأ في إضافة المهمة");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!campId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete || !campId) return;

    try {
      setSaving(true);
      setError(null);
      await dashboardService.deleteDailyTask(String(taskToDelete.id));
      const tasksResponse = await dashboardService.getCampDailyTasks(
        campId,
        selectedCohortNumber || undefined
      );
      applyTasksPayload(tasksResponse);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("حدث خطأ في حذف المهمة");
    } finally {
      setSaving(false);
    }
  };

  // Drag & Drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !campId) return;

    const activeTask = tasks.find((t) => t.id === Number(active.id));
    const overTask = tasks.find((t) => t.id === Number(over.id));

    if (!activeTask || !overTask) return;

    // Only allow reordering within the same day
    if (activeTask.day_number !== overTask.day_number) return;

    const dayTasks = tasks
      .filter((t) => t.day_number === activeTask.day_number)
      .sort((a, b) => a.order_in_day - b.order_in_day);

    const oldIndex = dayTasks.findIndex((t) => t.id === activeTask.id);
    const newIndex = dayTasks.findIndex((t) => t.id === overTask.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedTasks = arrayMove(dayTasks, oldIndex, newIndex);

    // Update order_in_day for all tasks in the day
    try {
      setSaving(true);
      const updates = reorderedTasks.map((task, index) => ({
        taskId: task.id,
        order_in_day: index + 1,
      }));

      // Update all tasks in batch
      await Promise.all(
        updates.map((update) =>
          dashboardService.updateDailyTask(String(update.taskId), {
            order_in_day: update.order_in_day,
          })
        )
      );

      // Refresh tasks
      const tasksResponse = await dashboardService.getCampDailyTasks(campId);
      applyTasksPayload(tasksResponse);
    } catch (error) {
      console.error("Error reordering tasks:", error);
      setError("حدث خطأ في إعادة ترتيب المهام");
    } finally {
      setSaving(false);
    }
  };

  const getTaskTypeText = (taskType: string) => {
    const type = TASK_TYPES.find((t) => t.value === taskType);
    return type?.label || taskType;
  };

  const handleUpdateTask = async (taskId: number, data: NewTaskPayload) => {
    if (!campId) return;
    try {
      setSaving(true);
      setError(null);
      await dashboardService.updateDailyTask(taskId.toString(), data);

      // Update the task in the local state
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, ...data } : task))
      );

      // Refresh tasks to ensure data consistency
      const tasksResponse = await dashboardService.getCampDailyTasks(campId);
      applyTasksPayload(tasksResponse);

      closeEditTaskModal();
    } catch (error) {
      console.error("Error updating task:", error);
      setError("حدث خطأ أثناء تحديث المهمة");
    } finally {
      setSaving(false);
    }
  };

  const handleAddGroup = async () => {
    if (!campId) return;
    try {
      setSaving(true);
      setError(null);

      // Remove parent_group_id if it's null or undefined
      const groupData: any = { ...newGroup };
      if (
        groupData.parent_group_id === null ||
        groupData.parent_group_id === undefined
      ) {
        delete groupData.parent_group_id;
      }

      await dashboardService.createTaskGroup(campId, groupData);

      const groupsResponse = await dashboardService.getCampTaskGroups(campId);
      setTaskGroups(groupsResponse.data?.data || []);

      closeGroupModal();
    } catch (error) {
      console.error("Error adding group:", error);
      setError("حدث خطأ في إضافة المجموعة");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateGroup = async (groupId: number, data: NewGroupPayload) => {
    if (!campId) return;
    try {
      setSaving(true);
      setError(null);

      // Remove parent_group_id if it's null or undefined
      const groupData: any = { ...data };
      if (
        groupData.parent_group_id === null ||
        groupData.parent_group_id === undefined
      ) {
        delete groupData.parent_group_id;
      }

      await dashboardService.updateTaskGroup(String(groupId), groupData);

      const groupsResponse = await dashboardService.getCampTaskGroups(campId);
      setTaskGroups(groupsResponse.data?.data || []);
      closeGroupModal();
    } catch (error) {
      console.error("Error updating group:", error);
      setError("حدث خطأ في تحديث المجموعة");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId: number | string) => {
    if (
      !confirm(
        "هل أنت متأكد من حذف هذه المجموعة؟ سيتم إزالة ربط المهام بهذه المجموعة."
      )
    )
      return;
    if (!campId) return;

    try {
      setSaving(true);
      setError(null);
      await dashboardService.deleteTaskGroup(String(groupId));

      const [tasksResponse, groupsResponse] = await Promise.all([
        dashboardService.getCampDailyTasks(campId),
        dashboardService.getCampTaskGroups(campId),
      ]);

      applyTasksPayload(tasksResponse);
      setTaskGroups(groupsResponse.data || []);
    } catch (error) {
      console.error("Error deleting group:", error);
      setError("حدث خطأ في حذف المجموعة");
    } finally {
      setSaving(false);
    }
  };

  const groupTasksByDay = (taskList: CampTask[]) => {
    return taskList.reduce((groups: Record<string, CampTask[]>, task) => {
      const dayKey = String(task.day_number);
      if (!groups[dayKey]) {
        groups[dayKey] = [];
      }
      groups[dayKey].push(task);
      return groups;
    }, {});
  };

  const groupModal =
    showGroupForm || editingGroup ? (
      <Modal
        title={editingGroup ? "تعديل المجموعة" : "إضافة مجموعة جديدة"}
        description="نظم المهام في مجموعات لتسهيل إدارتها"
        onClose={closeGroupModal}
        footer={
          <>
            <button
              onClick={closeGroupModal}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-300 transition hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              onClick={() =>
                editingGroup
                  ? handleUpdateGroup(editingGroup.id, editingGroup)
                  : handleAddGroup()
              }
              disabled={saving || !(editingGroup?.title || newGroup.title)}
              className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-900/40 px-4 py-2 text-sm font-medium text-purple-100 transition hover:bg-purple-800/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "جاري الحفظ..."
                : editingGroup
                ? "حفظ التعديلات"
                : "إضافة المجموعة"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              عنوان المجموعة *
            </label>
            <input
              type="text"
              value={editingGroup ? editingGroup.title : newGroup.title}
              onChange={(e) => updateGroupField("title", e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="مثال: تفسير الطبري"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              المجموعة الأم (اختياري)
            </label>
            <select
              value={
                editingGroup?.parent_group_id ?? newGroup.parent_group_id ?? ""
              }
              onChange={(e) =>
                updateGroupField(
                  "parent_group_id",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">لا يوجد (مجموعة رئيسية)</option>
              {taskGroups
                .filter(
                  (group) => !editingGroup || group.id !== editingGroup.id
                )
                .map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.title}
                  </option>
                ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              تفاصيل إضافية
            </label>
            <textarea
              value={
                editingGroup
                  ? editingGroup.description || ""
                  : newGroup.description
              }
              onChange={(e) => updateGroupField("description", e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="أضف تفاصيل عن هذه المجموعة"
            />
          </div>
        </div>
      </Modal>
    ) : null;

  const addTaskModal = showAddForm ? (
    <Modal
      size="lg"
      title="إضافة مهمة جديدة"
      description="اضبط تفاصيل المهمة ووزّعها على اليوم المناسب"
      onClose={closeAddTaskModal}
      footer={
        <>
          <button
            onClick={closeAddTaskModal}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-300 transition hover:bg-slate-800"
          >
            إلغاء
          </button>
          <button
            onClick={handleAddTask}
            disabled={saving || !newTask.title}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-primary/50 bg-primary/25 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary-foreground transition hover:bg-primary/35 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "جاري الحفظ..." : "إضافة المهمة"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            اليوم
          </label>
          <input
            type="number"
            min="1"
            max={camp?.duration_days || 7}
            value={newTask.day_number}
            onChange={(e) =>
              setNewTask((prev) => ({
                ...prev,
                day_number: Number(e.target.value),
              }))
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">لا يوجد (مهمة مستقلة)</option>
            {taskGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            العنوان
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
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            الوقت المقدر (بالدقائق)
          </label>
          <input
            type="number"
            value={newTask.estimated_time ?? ""}
            onChange={(e) =>
              setNewTask((prev) => ({
                ...prev,
                estimated_time: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="مثال: 30"
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
                verses_from: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            رابط التفسير
          </label>
          <input
            type="url"
            value={newTask.tafseer_link}
            onChange={(e) =>
              setNewTask((prev) => ({
                ...prev,
                tafseer_link: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://example.com/tafseer"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            رابط اليوتيوب
          </label>
          <input
            type="url"
            value={newTask.youtube_link}
            onChange={(e) =>
              setNewTask((prev) => ({
                ...prev,
                youtube_link: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://youtu.be/..."
          />
        </div>

        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-300">
              روابط إضافية
            </label>
            <button
              type="button"
              onClick={() => {
                const currentLinks = newTask.additional_links || [];
                setNewTask((prev) => ({
                  ...prev,
                  additional_links: [
                    ...currentLinks,
                    { title: "", url: "", type: "link", embed: false },
                  ],
                }));
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
            >
              <Plus className="h-3 w-3" />
              إضافة رابط
            </button>
          </div>
          <div className="space-y-2">
            {(newTask.additional_links || []).map((link, index) => (
              <div
                key={index}
                className="flex gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3"
              >
                <input
                  type="text"
                  value={link.title || ""}
                  onChange={(e) => {
                    const updated = [...(newTask.additional_links || [])];
                    updated[index] = { ...link, title: e.target.value };
                    setNewTask((prev) => ({
                      ...prev,
                      additional_links: updated,
                    }));
                  }}
                  placeholder="اسم الرابط"
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="url"
                  value={link.url || ""}
                  onChange={(e) => {
                    const updated = [...(newTask.additional_links || [])];
                    updated[index] = { ...link, url: e.target.value };
                    setNewTask((prev) => ({
                      ...prev,
                      additional_links: updated,
                    }));
                  }}
                  placeholder="https://example.com"
                  className="flex-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={link.type || "link"}
                  onChange={(e) => {
                    const updated = [...(newTask.additional_links || [])];
                    updated[index] = { ...link, type: e.target.value };
                    setNewTask((prev) => ({
                      ...prev,
                      additional_links: updated,
                    }));
                  }}
                  className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="link">رابط</option>
                  <option value="article">مقال</option>
                  <option value="book">كتاب</option>
                  <option value="pdf">PDF</option>
                  <option value="youtube">يوتيوب</option>
                </select>
                <label className="flex items-center gap-1.5 px-2 py-2 rounded-lg border border-slate-600 bg-slate-900 text-xs text-slate-200 cursor-pointer hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={
                      link.embed === true || link.display_mode === "embed"
                    }
                    onChange={(e) => {
                      const updated = [...(newTask.additional_links || [])];
                      updated[index] = {
                        ...link,
                        embed: e.target.checked,
                        display_mode: e.target.checked ? "embed" : undefined,
                      };
                      setNewTask((prev) => ({
                        ...prev,
                        additional_links: updated,
                      }));
                    }}
                    className="w-3.5 h-3.5 rounded border-slate-500 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="whitespace-nowrap">عرض مضمّن</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const updated = (newTask.additional_links || []).filter(
                      (_, i) => i !== index
                    );
                    setNewTask((prev) => ({
                      ...prev,
                      additional_links: updated.length > 0 ? updated : null,
                    }));
                  }}
                  className="rounded-lg border border-rose-600 bg-rose-900/30 p-2 text-rose-300 transition hover:bg-rose-900/50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {(!newTask.additional_links ||
              newTask.additional_links.length === 0) && (
              <p className="text-xs text-slate-500">
                لا توجد روابط إضافية. اضغط على "إضافة رابط" لإضافة رابط جديد.
              </p>
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-300">
              المرفقات
            </label>
            <button
              type="button"
              onClick={() => {
                const currentAttachments = newTask.attachments || [];
                setNewTask((prev) => ({
                  ...prev,
                  attachments: [
                    ...currentAttachments,
                    { filename: "", url: "", type: "file" },
                  ],
                }));
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
            >
              <Plus className="h-3 w-3" />
              إضافة مرفق
            </button>
          </div>
          <div className="space-y-2">
            {(newTask.attachments || []).map((attachment, index) => (
              <div
                key={index}
                className="flex gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3"
              >
                <input
                  type="text"
                  value={attachment.filename || attachment.name || ""}
                  onChange={(e) => {
                    const updated = [...(newTask.attachments || [])];
                    updated[index] = {
                      ...attachment,
                      filename: e.target.value,
                      name: e.target.value,
                    };
                    setNewTask((prev) => ({
                      ...prev,
                      attachments: updated,
                    }));
                  }}
                  placeholder="اسم الملف"
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="url"
                  value={attachment.url || ""}
                  onChange={(e) => {
                    const updated = [...(newTask.attachments || [])];
                    updated[index] = { ...attachment, url: e.target.value };
                    setNewTask((prev) => ({
                      ...prev,
                      attachments: updated,
                    }));
                  }}
                  placeholder="/api/uploads/... أو رابط مباشر"
                  className="flex-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = (newTask.attachments || []).filter(
                      (_, i) => i !== index
                    );
                    setNewTask((prev) => ({
                      ...prev,
                      attachments: updated.length > 0 ? updated : null,
                    }));
                  }}
                  className="rounded-lg border border-rose-600 bg-rose-900/30 p-2 text-rose-300 transition hover:bg-rose-900/50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {(!newTask.attachments || newTask.attachments.length === 0) && (
              <p className="text-xs text-slate-500">
                لا توجد مرفقات. اضغط على "إضافة مرفق" لإضافة مرفق جديد.
              </p>
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
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
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
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

        <div className="sm:col-span-2">
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
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </Modal>
  ) : null;

  const editTaskModal = editingTask ? (
    <Modal
      size="lg"
      title="تعديل المهمة"
      description="حدث تفاصيل المهمة لضمان دقة خطة المخيم"
      onClose={closeEditTaskModal}
      footer={
        <>
          <button
            onClick={closeEditTaskModal}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-300 transition hover:bg-slate-800"
          >
            إلغاء
          </button>
          <button
            onClick={() => {
              if (editingTask) {
                // Parse additional_links and attachments if they are strings
                let additionalLinks = editingTask.additional_links;
                if (typeof additionalLinks === "string" && additionalLinks) {
                  try {
                    additionalLinks = JSON.parse(additionalLinks);
                  } catch (e) {
                    additionalLinks = null;
                  }
                }

                let attachments = editingTask.attachments;
                if (typeof attachments === "string" && attachments) {
                  try {
                    attachments = JSON.parse(attachments);
                  } catch (e) {
                    attachments = null;
                  }
                }

                const taskPayload: NewTaskPayload = {
                  day_number: editingTask.day_number,
                  task_type: editingTask.task_type,
                  title: editingTask.title,
                  description: editingTask.description,
                  verses_from: editingTask.verses_from ?? null,
                  verses_to: editingTask.verses_to ?? null,
                  tafseer_link: editingTask.tafseer_link || "",
                  youtube_link: editingTask.youtube_link || "",
                  additional_links: Array.isArray(additionalLinks)
                    ? additionalLinks
                    : null,
                  attachments: Array.isArray(attachments) ? attachments : null,
                  order_in_day: editingTask.order_in_day,
                  is_optional: editingTask.is_optional,
                  points: editingTask.points,
                  estimated_time: editingTask.estimated_time ?? null,
                  group_id: editingTask.group_id ?? null,
                  order_in_group: editingTask.order_in_group ?? null,
                };
                handleUpdateTask(editingTask.id, taskPayload);
              }
            }}
            disabled={saving || !editingTask.title}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-primary/50 bg-primary/25 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary-foreground transition hover:bg-primary/35 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            اليوم
          </label>
          <input
            type="number"
            min="1"
            max={camp?.duration_days || 7}
            value={editingTask.day_number}
            onChange={(e) =>
              setEditingTask((prev) =>
                prev ? { ...prev, day_number: Number(e.target.value) } : prev
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            نوع المهمة
          </label>
          <select
            value={editingTask.task_type}
            onChange={(e) =>
              setEditingTask((prev) =>
                prev
                  ? { ...prev, task_type: e.target.value as TaskTypeValue }
                  : prev
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
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
            value={editingTask.group_id ?? ""}
            onChange={(e) =>
              setEditingTask((prev) =>
                prev
                  ? {
                      ...prev,
                      group_id: e.target.value ? Number(e.target.value) : null,
                    }
                  : prev
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">لا يوجد (مهمة مستقلة)</option>
            {taskGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            العنوان
          </label>
          <input
            type="text"
            value={editingTask.title}
            onChange={(e) =>
              setEditingTask((prev) =>
                prev ? { ...prev, title: e.target.value } : prev
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            ترتيب المهمة في اليوم
          </label>
          <input
            type="number"
            min="1"
            value={editingTask.order_in_day}
            onChange={(e) =>
              setEditingTask((prev) =>
                prev ? { ...prev, order_in_day: Number(e.target.value) } : prev
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            الوقت المقدر (بالدقائق)
          </label>
          <input
            type="number"
            value={editingTask.estimated_time ?? ""}
            onChange={(e) =>
              setEditingTask((prev) =>
                prev
                  ? {
                      ...prev,
                      estimated_time: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }
                  : prev
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            من آية
          </label>
          <input
            type="number"
            value={editingTask.verses_from ?? ""}
            onChange={(e) =>
              setEditingTask((prev) =>
                prev
                  ? {
                      ...prev,
                      verses_from: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }
                  : prev
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            إلى آية
          </label>
          <input
            type="number"
            value={editingTask.verses_to ?? ""}
            onChange={(e) =>
              setEditingTask((prev) =>
                prev
                  ? {
                      ...prev,
                      verses_to: e.target.value ? Number(e.target.value) : null,
                    }
                  : prev
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            رابط التفسير
          </label>
          <input
            type="url"
            value={editingTask.tafseer_link ?? ""}
            onChange={(e) =>
              setEditingTask((prev) =>
                prev ? { ...prev, tafseer_link: e.target.value } : prev
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            رابط اليوتيوب
          </label>
          <input
            type="url"
            value={editingTask.youtube_link ?? ""}
            onChange={(e) =>
              setEditingTask((prev) =>
                prev ? { ...prev, youtube_link: e.target.value } : prev
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-300">
              روابط إضافية
            </label>
            <button
              type="button"
              onClick={() => {
                let currentLinks = editingTask.additional_links;
                if (typeof currentLinks === "string" && currentLinks) {
                  try {
                    currentLinks = JSON.parse(currentLinks);
                  } catch (e) {
                    currentLinks = [];
                  }
                }
                const links = Array.isArray(currentLinks) ? currentLinks : [];
                setEditingTask((prev) =>
                  prev
                    ? {
                        ...prev,
                        additional_links: [
                          ...links,
                          { title: "", url: "", type: "link", embed: false },
                        ],
                      }
                    : prev
                );
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
            >
              <Plus className="h-3 w-3" />
              إضافة رابط
            </button>
          </div>
          <div className="space-y-2">
            {(() => {
              let links = editingTask.additional_links;
              if (typeof links === "string" && links) {
                try {
                  links = JSON.parse(links);
                } catch (e) {
                  links = [];
                }
              }
              return Array.isArray(links) ? links : [];
            })().map((link, index) => (
              <div
                key={index}
                className="flex gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3"
              >
                <input
                  type="text"
                  value={link.title || ""}
                  onChange={(e) => {
                    let currentLinks = editingTask.additional_links;
                    if (typeof currentLinks === "string" && currentLinks) {
                      try {
                        currentLinks = JSON.parse(currentLinks);
                      } catch (err) {
                        currentLinks = [];
                      }
                    }
                    const updated = [
                      ...(Array.isArray(currentLinks) ? currentLinks : []),
                    ];
                    updated[index] = { ...link, title: e.target.value };
                    setEditingTask((prev) =>
                      prev
                        ? {
                            ...prev,
                            additional_links: updated,
                          }
                        : prev
                    );
                  }}
                  placeholder="اسم الرابط"
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="url"
                  value={link.url || ""}
                  onChange={(e) => {
                    let currentLinks = editingTask.additional_links;
                    if (typeof currentLinks === "string" && currentLinks) {
                      try {
                        currentLinks = JSON.parse(currentLinks);
                      } catch (err) {
                        currentLinks = [];
                      }
                    }
                    const updated = [
                      ...(Array.isArray(currentLinks) ? currentLinks : []),
                    ];
                    updated[index] = { ...link, url: e.target.value };
                    setEditingTask((prev) =>
                      prev
                        ? {
                            ...prev,
                            additional_links: updated,
                          }
                        : prev
                    );
                  }}
                  placeholder="https://example.com"
                  className="flex-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={link.type || "link"}
                  onChange={(e) => {
                    let currentLinks = editingTask.additional_links;
                    if (typeof currentLinks === "string" && currentLinks) {
                      try {
                        currentLinks = JSON.parse(currentLinks);
                      } catch (err) {
                        currentLinks = [];
                      }
                    }
                    const updated = [
                      ...(Array.isArray(currentLinks) ? currentLinks : []),
                    ];
                    updated[index] = { ...link, type: e.target.value };
                    setEditingTask((prev) =>
                      prev
                        ? {
                            ...prev,
                            additional_links: updated,
                          }
                        : prev
                    );
                  }}
                  className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="link">رابط</option>
                  <option value="article">مقال</option>
                  <option value="book">كتاب</option>
                  <option value="pdf">PDF</option>
                  <option value="youtube">يوتيوب</option>
                </select>
                <label className="flex items-center gap-1.5 px-2 py-2 rounded-lg border border-slate-600 bg-slate-900 text-xs text-slate-200 cursor-pointer hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={
                      link.embed === true || link.display_mode === "embed"
                    }
                    onChange={(e) => {
                      let currentLinks = editingTask.additional_links;
                      if (typeof currentLinks === "string" && currentLinks) {
                        try {
                          currentLinks = JSON.parse(currentLinks);
                        } catch (err) {
                          currentLinks = [];
                        }
                      }
                      const updated = [
                        ...(Array.isArray(currentLinks) ? currentLinks : []),
                      ];
                      updated[index] = {
                        ...link,
                        embed: e.target.checked,
                        display_mode: e.target.checked ? "embed" : undefined,
                      };
                      setEditingTask((prev) =>
                        prev
                          ? {
                              ...prev,
                              additional_links: updated,
                            }
                          : prev
                      );
                    }}
                    className="w-3.5 h-3.5 rounded border-slate-500 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="whitespace-nowrap">عرض مضمّن</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    let currentLinks = editingTask.additional_links;
                    if (typeof currentLinks === "string" && currentLinks) {
                      try {
                        currentLinks = JSON.parse(currentLinks);
                      } catch (err) {
                        currentLinks = [];
                      }
                    }
                    const updated = (
                      Array.isArray(currentLinks) ? currentLinks : []
                    ).filter((_, i) => i !== index);
                    setEditingTask((prev) =>
                      prev
                        ? {
                            ...prev,
                            additional_links:
                              updated.length > 0 ? updated : null,
                          }
                        : prev
                    );
                  }}
                  className="rounded-lg border border-rose-600 bg-rose-900/30 p-2 text-rose-300 transition hover:bg-rose-900/50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {(() => {
              let links = editingTask.additional_links;
              if (typeof links === "string" && links) {
                try {
                  links = JSON.parse(links);
                } catch (e) {
                  links = [];
                }
              }
              return !Array.isArray(links) || links.length === 0;
            })() && (
              <p className="text-xs text-slate-500">
                لا توجد روابط إضافية. اضغط على "إضافة رابط" لإضافة رابط جديد.
              </p>
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-300">
              المرفقات
            </label>
            <button
              type="button"
              onClick={() => {
                let currentAttachments = editingTask.attachments;
                if (
                  typeof currentAttachments === "string" &&
                  currentAttachments
                ) {
                  try {
                    currentAttachments = JSON.parse(currentAttachments);
                  } catch (e) {
                    currentAttachments = [];
                  }
                }
                const attachments = Array.isArray(currentAttachments)
                  ? currentAttachments
                  : [];
                setEditingTask((prev) =>
                  prev
                    ? {
                        ...prev,
                        attachments: [
                          ...attachments,
                          { filename: "", url: "", type: "file" },
                        ],
                      }
                    : prev
                );
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
            >
              <Plus className="h-3 w-3" />
              إضافة مرفق
            </button>
          </div>
          <div className="space-y-2">
            {(() => {
              let attachments = editingTask.attachments;
              if (typeof attachments === "string" && attachments) {
                try {
                  attachments = JSON.parse(attachments);
                } catch (e) {
                  attachments = [];
                }
              }
              return Array.isArray(attachments) ? attachments : [];
            })().map((attachment, index) => (
              <div
                key={index}
                className="flex gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3"
              >
                <input
                  type="text"
                  value={attachment.filename || attachment.name || ""}
                  onChange={(e) => {
                    let currentAttachments = editingTask.attachments;
                    if (
                      typeof currentAttachments === "string" &&
                      currentAttachments
                    ) {
                      try {
                        currentAttachments = JSON.parse(currentAttachments);
                      } catch (err) {
                        currentAttachments = [];
                      }
                    }
                    const updated = [
                      ...(Array.isArray(currentAttachments)
                        ? currentAttachments
                        : []),
                    ];
                    updated[index] = {
                      ...attachment,
                      filename: e.target.value,
                      name: e.target.value,
                    };
                    setEditingTask((prev) =>
                      prev
                        ? {
                            ...prev,
                            attachments: updated,
                          }
                        : prev
                    );
                  }}
                  placeholder="اسم الملف"
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="url"
                  value={attachment.url || ""}
                  onChange={(e) => {
                    let currentAttachments = editingTask.attachments;
                    if (
                      typeof currentAttachments === "string" &&
                      currentAttachments
                    ) {
                      try {
                        currentAttachments = JSON.parse(currentAttachments);
                      } catch (err) {
                        currentAttachments = [];
                      }
                    }
                    const updated = [
                      ...(Array.isArray(currentAttachments)
                        ? currentAttachments
                        : []),
                    ];
                    updated[index] = { ...attachment, url: e.target.value };
                    setEditingTask((prev) =>
                      prev
                        ? {
                            ...prev,
                            attachments: updated,
                          }
                        : prev
                    );
                  }}
                  placeholder="/api/uploads/... أو رابط مباشر"
                  className="flex-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    let currentAttachments = editingTask.attachments;
                    if (
                      typeof currentAttachments === "string" &&
                      currentAttachments
                    ) {
                      try {
                        currentAttachments = JSON.parse(currentAttachments);
                      } catch (err) {
                        currentAttachments = [];
                      }
                    }
                    const updated = (
                      Array.isArray(currentAttachments)
                        ? currentAttachments
                        : []
                    ).filter((_, i) => i !== index);
                    setEditingTask((prev) =>
                      prev
                        ? {
                            ...prev,
                            attachments: updated.length > 0 ? updated : null,
                          }
                        : prev
                    );
                  }}
                  className="rounded-lg border border-rose-600 bg-rose-900/30 p-2 text-rose-300 transition hover:bg-rose-900/50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {(() => {
              let attachments = editingTask.attachments;
              if (typeof attachments === "string" && attachments) {
                try {
                  attachments = JSON.parse(attachments);
                } catch (e) {
                  attachments = [];
                }
              }
              return !Array.isArray(attachments) || attachments.length === 0;
            })() && (
              <p className="text-xs text-slate-500">
                لا توجد مرفقات. اضغط على "إضافة مرفق" لإضافة مرفق جديد.
              </p>
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            الوصف
          </label>
          <textarea
            value={editingTask.description ?? ""}
            onChange={(e) =>
              setEditingTask((prev) =>
                prev ? { ...prev, description: e.target.value } : prev
              )
            }
            rows={3}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={Boolean(editingTask.is_optional)}
              onChange={(e) =>
                setEditingTask((prev) =>
                  prev ? { ...prev, is_optional: e.target.checked } : prev
                )
              }
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-primary focus:ring-primary"
            />
            مهمة اختيارية
          </label>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            النقاط المخصصة
          </label>
          <input
            type="number"
            value={editingTask.points}
            onChange={(e) =>
              setEditingTask((prev) =>
                prev ? { ...prev, points: Number(e.target.value) || 0 } : prev
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </Modal>
  ) : null;

  if (!campId) {
    return (
      <>
        <DashboardLayout>
          <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
            المعرف غير موجود
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <DashboardLayout>
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
        {groupModal}
        {addTaskModal}
        {editTaskModal}
      </>
    );
  }

  if (error) {
    return (
      <>
        <DashboardLayout>
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="rounded-3xl border border-rose-900/40 bg-rose-950/30 px-6 py-4 text-rose-200">
              {error}
            </div>
          </div>
        </DashboardLayout>
        {groupModal}
        {addTaskModal}
        {editTaskModal}
      </>
    );
  }

  if (!camp) {
    return (
      <>
        <DashboardLayout>
          <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
            المخيم غير موجود
          </div>
        </DashboardLayout>
        {groupModal}
        {addTaskModal}
        {editTaskModal}
      </>
    );
  }

  const tasksByDay = groupTasksByDay(tasks);
  return (
    <>
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 pb-8 sm:pb-12">
          <ActionToolbar
            title="إدارة المهام اليومية"
            subtitle={
              camp
                ? `سورة ${camp?.surah_name || ""} • ${
                    camp?.duration_days || 0
                  } يوم`
                : undefined
            }
            secondaryActions={
              <div className="flex flex-wrap items-center gap-2">
                {bulkDeleteMode ? (
                  <>
                    <button
                      onClick={() => {
                        setBulkDeleteMode(false);
                        setSelectedTasks(new Set());
                      }}
                      className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-300 transition hover:bg-slate-800"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={selectedTasks.size === 0 || saving}
                      className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-rose-500/40 bg-rose-900/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-rose-100 transition hover:bg-rose-800/40 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      حذف{" "}
                      {selectedTasks.size > 0 ? `(${selectedTasks.size})` : ""}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setBulkDeleteMode(true)}
                      className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-300 transition hover:bg-slate-800"
                    >
                      <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">حذف جماعي</span>
                    </button>
                    <Link
                      href={`/dashboard/quran-camps/${campId}/study-hall`}
                      className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-purple-500/40 bg-purple-900/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-purple-100 transition hover:bg-purple-800/40"
                    >
                      <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">
                        إدارة قاعة التدارس
                      </span>
                      <span className="sm:hidden">قاعة التدارس</span>
                    </Link>
                  </>
                )}
              </div>
            }
            primaryAction={
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <div className="relative">
                  <Link
                    href={`/dashboard/quran-camps/${campId}`}
                    className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-300 transition hover:bg-slate-800"
                  >
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">العودة للتفاصيل</span>
                    <span className="sm:hidden">رجوع</span>
                  </Link>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-emerald-500/40 bg-emerald-900/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-emerald-100 transition hover:bg-emerald-800/40"
                  >
                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">تصدير</span>
                    <span className="sm:hidden">تصدير</span>
                  </button>
                  {showExportMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowExportMenu(false)}
                      />
                      <div className="absolute top-full left-0 mt-2 z-20 rounded-xl border border-slate-700 bg-slate-900 shadow-lg overflow-hidden">
                        <button
                          onClick={async () => {
                            try {
                              const data =
                                await dashboardService.exportCampTasks(
                                  campId!,
                                  "json"
                                );
                              const blob = new Blob(
                                [JSON.stringify(data.data, null, 2)],
                                {
                                  type: "application/json",
                                }
                              );
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `camp-${campId}-tasks-${
                                new Date().toISOString().split("T")[0]
                              }.json`;
                              document.body.appendChild(link);
                              link.click();
                              link.remove();
                              window.URL.revokeObjectURL(url);
                              setShowExportMenu(false);
                              alert("✅ تم تصدير المهام بنجاح");
                            } catch (err: any) {
                              console.error("Error exporting tasks:", err);
                              alert(
                                err.response?.data?.message ||
                                  "❌ حدث خطأ أثناء التصدير"
                              );
                            }
                          }}
                          className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 text-right flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          تصدير كـ JSON
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await dashboardService.exportCampTasks(
                                campId!,
                                "csv"
                              );
                              setShowExportMenu(false);
                            } catch (err: any) {
                              console.error("Error exporting tasks:", err);
                              alert(
                                err.response?.data?.message ||
                                  "❌ حدث خطأ أثناء التصدير"
                              );
                            }
                          }}
                          className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 text-right flex items-center gap-2 border-t border-slate-700"
                        >
                          <FileText className="h-4 w-4" />
                          تصدير كـ CSV
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    setImportData("");
                    setImportPreview([]);
                    setImportErrors([]);
                    setReplaceExisting(false);
                    setShowImportModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-azure-500/40 bg-azure-900/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-azure-100 transition hover:bg-azure-800/40"
                >
                  <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">استيراد</span>
                  <span className="sm:hidden">استيراد</span>
                </button>
                <button
                  onClick={() => openGroupModal()}
                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-purple-500/40 bg-purple-900/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-purple-100 transition hover:bg-purple-800/40"
                >
                  <FolderPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">
                    {showGroupForm ? "إغلاق النموذج" : "إضافة مجموعة"}
                  </span>
                  <span className="sm:hidden">مجموعة</span>
                </button>
                <button
                  onClick={() => openAddTaskModal()}
                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-primary/40 bg-primary/20 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary-100 transition hover:bg-primary/30"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">
                    {showAddForm ? "إغلاق النموذج" : "إضافة مهمة"}
                  </span>
                  <span className="sm:hidden">مهمة</span>
                </button>
              </div>
            }
            endSlot={
              camp ? (
                <ChipPill variant="neutral" className="border border-slate-700">
                  {camp?.name || "المخيم"}
                </ChipPill>
              ) : null
            }
          />
          <CampNavigation campId={campId} />

          {/* Error Message */}
          {error && (
            <div className="rounded-3xl border border-rose-700/40 bg-rose-900/30 p-4 text-sm text-rose-100">
              <p>{error}</p>
            </div>
          )}

          {/* Groups List */}
          {taskGroups.length > 0 && (
            <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-lg">
              <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-slate-100">
                المجموعات ({taskGroups.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {taskGroups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-950/60 p-3 sm:p-4"
                  >
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Folder className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300 flex-shrink-0" />
                        <h3 className="font-semibold text-sm sm:text-base text-slate-100 truncate">
                          {group.title}
                        </h3>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => openGroupModal(group)}
                          className="rounded-full p-1 text-azure-300 transition hover:bg-slate-800 hover:text-azure-100"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
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
                      {group.tasks_count || 0} مهمة
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-4 sm:space-y-6">
            {Object.keys(tasksByDay).length === 0 ? (
              <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 text-center text-slate-400">
                <p className="text-sm sm:text-base">
                  لم يتم إضافة مهام بعد لهذا المخيم.
                </p>
              </div>
            ) : (
              Object.entries(tasksByDay)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([day, dayTasks]) => (
                  <div
                    key={day}
                    className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-lg space-y-3 sm:space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-100">
                        اليوم {day}
                      </h3>
                      <span className="text-xs sm:text-sm text-slate-400">
                        {dayTasks?.length} مهمة
                      </span>
                    </div>

                    {(() => {
                      const dayNumber = Number(day);
                      const challenge = dayChallenges?.[dayNumber];
                      const isEditing = challengeEditor.day === dayNumber;
                      return (
                        <div className="rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-emerald-900/20 p-3 sm:p-4 space-y-2 sm:space-y-3">
                          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs uppercase tracking-wider text-emerald-300 mb-1">
                                تحدي اليوم
                              </p>
                              {challenge ? (
                                <>
                                  <h4 className="text-sm sm:text-base font-semibold text-emerald-100 break-words">
                                    {challenge.title}
                                  </h4>
                                  <p className="mt-1 text-xs sm:text-sm text-emerald-200 whitespace-pre-line break-words">
                                    {challenge.description}
                                  </p>
                                </>
                              ) : (
                                <p className="text-xs sm:text-sm text-emerald-200">
                                  لا يوجد تحدي لهذا اليوم. أضف تحديًا بسيطًا
                                  يشجع المشاركين.
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => openChallengeEditor(dayNumber)}
                              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20 whitespace-nowrap self-start sm:self-auto"
                            >
                              {challenge ? "تعديل التحدي" : "إضافة تحدي"}
                            </button>
                          </div>

                          {isEditing && (
                            <div className="space-y-3 border-t border-emerald-500/20 pt-3">
                              <div>
                                <label className="mb-2 block text-sm font-medium text-emerald-100">
                                  عنوان التحدي
                                </label>
                                <input
                                  type="text"
                                  value={challengeEditor.title}
                                  onChange={(e) =>
                                    setChallengeEditor((prev) =>
                                      prev
                                        ? { ...prev, title: e.target.value }
                                        : prev
                                    )
                                  }
                                  className="w-full rounded-xl border border-emerald-500/40 bg-slate-950/60 px-3 py-2 text-sm text-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                                  placeholder="مثال: شارك أفضل فائدة خرجت بها اليوم"
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-sm font-medium text-emerald-100">
                                  وصف التحدي
                                </label>
                                <textarea
                                  rows={3}
                                  value={challengeEditor.description}
                                  onChange={(e) =>
                                    setChallengeEditor((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            description: e.target.value,
                                          }
                                        : prev
                                    )
                                  }
                                  className="w-full rounded-xl border border-emerald-500/40 bg-slate-950/60 px-3 py-2 text-sm text-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                                  placeholder="اشرح التحدي للمشاركين بطريقة تحفيزية ومختصرة"
                                />
                              </div>
                              {challengeError && (
                                <p className="text-sm text-rose-300">
                                  {challengeError}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 sm:gap-3">
                                <button
                                  onClick={handleSaveChallenge}
                                  disabled={
                                    challengeSaving ||
                                    !challengeEditor.title.trim() ||
                                    !challengeEditor.description.trim()
                                  }
                                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-emerald-500/40 bg-emerald-600/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-emerald-50 transition hover:bg-emerald-600/40 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {challengeSaving
                                    ? "جاري الحفظ..."
                                    : "حفظ التحدي"}
                                </button>
                                <button
                                  onClick={closeChallengeEditor}
                                  className="rounded-full border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-200 transition hover:bg-slate-800"
                                >
                                  إلغاء
                                </button>
                                {challenge && (
                                  <button
                                    onClick={() =>
                                      handleDeleteChallenge(dayNumber)
                                    }
                                    className="rounded-full border border-rose-500/40 bg-rose-900/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-rose-100 transition hover:bg-rose-800/40"
                                  >
                                    حذف التحدي
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={
                          dayTasks
                            ?.sort((a, b) => a.order_in_day - b.order_in_day)
                            .map((t) => t.id) || []
                        }
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {dayTasks
                            ?.sort((a, b) => a.order_in_day - b.order_in_day)
                            .map((task) => (
                              <SortableTask
                                key={task.id}
                                task={task}
                                onEdit={openEditTaskModal}
                                onDelete={handleDeleteTask}
                                getTaskTypeText={getTaskTypeText}
                                bulkDeleteMode={bulkDeleteMode}
                                isSelected={selectedTasks.has(task.id)}
                                onToggleSelect={toggleTaskSelection}
                              />
                            ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                ))
            )}
          </div>
          {editingTask && (
            <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-lg">
              <div className="mb-4 sm:mb-6 flex items-center justify-between gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-slate-100">
                  تعديل المهمة
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTaskPreview(!showTaskPreview)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
                    title="معاينة المهمة"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {showTaskPreview ? "إخفاء المعاينة" : "معاينة"}
                  </button>
                  <button
                    onClick={() => setEditingTask(null)}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                    title="إغلاق"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* معاينة المهمة */}
              {showTaskPreview && (
                <div className="mb-6 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-200">
                    معاينة المهمة
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-400">العنوان:</span>{" "}
                      <span className="text-slate-100">
                        {editingTask.title || "(بدون عنوان)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">النوع:</span>{" "}
                      <span className="text-slate-100">
                        {getTaskTypeText(editingTask.task_type)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">اليوم:</span>{" "}
                      <span className="text-slate-100">
                        {editingTask.day_number}
                      </span>
                    </div>
                    {editingTask.description && (
                      <div>
                        <span className="text-slate-400">الوصف:</span>
                        <p className="mt-1 text-slate-200 whitespace-pre-wrap">
                          {editingTask.description}
                        </p>
                      </div>
                    )}
                    {editingTask.verses_from && editingTask.verses_to && (
                      <div>
                        <span className="text-slate-400">الآيات:</span>{" "}
                        <span className="text-slate-100">
                          {editingTask.verses_from} - {editingTask.verses_to}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400">النقاط:</span>{" "}
                      <span className="text-slate-100">
                        {editingTask.points || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">الحالة:</span>{" "}
                      <span className="text-slate-100">
                        {editingTask.is_optional ? "اختيارية" : "مطلوبة"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    اليوم
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={camp?.duration_days || 7}
                    value={editingTask?.day_number || 1}
                    onChange={(e) =>
                      setEditingTask((prev) =>
                        prev
                          ? {
                              ...prev,
                              day_number: Number(e.target.value),
                            }
                          : prev
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    نوع المهمة
                  </label>
                  <select
                    value={editingTask?.task_type}
                    onChange={(e) =>
                      setEditingTask((prev) =>
                        prev
                          ? {
                              ...prev,
                              task_type: e.target.value,
                            }
                          : prev
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
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
                    value={editingTask?.group_id || ""}
                    onChange={(e) =>
                      setEditingTask((prev) =>
                        prev
                          ? {
                              ...prev,
                              group_id: e.target.value
                                ? Number(e.target.value)
                                : null,
                            }
                          : prev
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">لا يوجد (مهمة مستقلة)</option>
                    {taskGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    العنوان
                  </label>
                  <input
                    type="text"
                    value={editingTask?.title || ""}
                    onChange={(e) =>
                      setEditingTask((prev) =>
                        prev
                          ? {
                              ...prev,
                              title: e.target.value,
                            }
                          : prev
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
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
                    value={editingTask?.order_in_day || 1}
                    onChange={(e) =>
                      setEditingTask((prev) =>
                        prev
                          ? {
                              ...prev,
                              order_in_day: Number(e.target.value),
                            }
                          : prev
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    الوقت المقدر
                  </label>
                  <input
                    type="number"
                    value={editingTask?.estimated_time ?? 0}
                    onChange={(e) =>
                      setEditingTask((prev) =>
                        prev
                          ? {
                              ...prev,
                              estimated_time: Number(e.target.value) || 0,
                            }
                          : prev
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="مثال: 30 "
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    من آية
                  </label>
                  <input
                    type="number"
                    value={editingTask?.verses_from || ""}
                    onChange={(e) =>
                      setEditingTask((prev) =>
                        prev
                          ? {
                              ...prev,
                              verses_from: e.target.value
                                ? Number(e.target.value)
                                : null,
                            }
                          : prev
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    إلى آية
                  </label>
                  <input
                    type="number"
                    value={editingTask?.verses_to || ""}
                    onChange={(e) =>
                      setEditingTask((prev) =>
                        prev
                          ? {
                              ...prev,
                              verses_to: e.target.value
                                ? Number(e.target.value)
                                : null,
                            }
                          : prev
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    رابط التفسير
                  </label>
                  <input
                    type="url"
                    value={editingTask?.tafseer_link || ""}
                    onChange={(e) =>
                      setEditingTask((prev) =>
                        prev ? { ...prev, tafseer_link: e.target.value } : prev
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://example.com/tafseer"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    رابط اليوتيوب
                  </label>
                  <input
                    type="url"
                    value={editingTask?.youtube_link || ""}
                    onChange={(e) =>
                      setEditingTask((prev) =>
                        prev ? { ...prev, youtube_link: e.target.value } : prev
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    الوصف
                  </label>
                  <textarea
                    value={editingTask?.description || ""}
                    onChange={(e) =>
                      setEditingTask((prev) =>
                        prev
                          ? {
                              ...prev,
                              description: e.target.value,
                            }
                          : prev
                      )
                    }
                    rows={3}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="وصف المهمة..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    النقاط
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingTask?.points || 3}
                    onChange={(e) =>
                      setEditingTask((prev) =>
                        prev
                          ? {
                              ...prev,
                              points: Number(e.target.value) || 0,
                            }
                          : prev
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingTask?.is_optional || false}
                      onChange={(e) =>
                        setEditingTask((prev) =>
                          prev
                            ? { ...prev, is_optional: e.target.checked }
                            : prev
                        )
                      }
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-primary focus:ring-primary"
                    />
                    مهمة اختيارية
                  </label>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const targetDay = prompt(
                        `انسخ المهمة إلى أي يوم؟ (1-${
                          camp?.duration_days || 7
                        })`,
                        String(editingTask.day_number)
                      );
                      if (targetDay) {
                        const dayNum = parseInt(targetDay);
                        if (
                          dayNum >= 1 &&
                          dayNum <= (camp?.duration_days || 7)
                        ) {
                          handleCopyTask(editingTask, dayNum);
                        } else {
                          alert("الرجاء إدخال رقم يوم صحيح");
                        }
                      }
                    }}
                    className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-200 transition hover:bg-slate-800"
                    title="نسخ المهمة إلى يوم آخر"
                  >
                    <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    نسخ إلى يوم آخر
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingTask(null)}
                    className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-300 transition hover:bg-slate-800"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      if (editingTask?.id) {
                        const taskPayload: NewTaskPayload = {
                          day_number: editingTask.day_number,
                          task_type: editingTask.task_type,
                          title: editingTask.title,
                          description: editingTask.description,
                          verses_from: editingTask.verses_from ?? null,
                          verses_to: editingTask.verses_to ?? null,
                          tafseer_link: editingTask.tafseer_link || "",
                          youtube_link: editingTask.youtube_link || "",
                          order_in_day: editingTask.order_in_day,
                          is_optional: editingTask.is_optional,
                          points: editingTask.points,
                          estimated_time: editingTask.estimated_time ?? null,
                          group_id: editingTask.group_id ?? null,
                          order_in_group: editingTask.order_in_group ?? null,
                        };
                        handleUpdateTask(editingTask.id, taskPayload);
                        setEditingTask(null);
                        setShowTaskPreview(false);
                      }
                    }}
                    disabled={saving || !editingTask?.title}
                    className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-primary/50 bg-primary/25 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary-foreground transition hover:bg-primary/35 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saving ? "جاري الحفظ..." : "تحديث المهمة"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
      {groupModal}
      {addTaskModal}
      {editTaskModal}
      {taskToDelete && (
        <Modal
          title="تأكيد الحذف"
          description={`هل أنت متأكد من حذف المهمة "${taskToDelete.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          onClose={() => setTaskToDelete(null)}
          footer={
            <>
              <button
                onClick={() => setTaskToDelete(null)}
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-300 transition hover:bg-slate-800"
                disabled={saving}
              >
                إلغاء
              </button>
              <button
                onClick={confirmDeleteTask}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full border border-rose-500/50 bg-rose-900/30 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-800/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-rose-200" />
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    حذف المهمة
                  </>
                )}
              </button>
            </>
          }
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <Modal
          size="lg"
          title="استيراد المهام"
          description="قم بتحميل ملف JSON أو لصق البيانات مباشرة"
          onClose={() => {
            setShowImportModal(false);
            setImportData("");
            setImportPreview([]);
            setImportErrors([]);
          }}
          footer={
            <>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData("");
                  setImportPreview([]);
                  setImportErrors([]);
                }}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
              >
                إلغاء
              </button>
              {importPreview.length > 0 && (
                <button
                  onClick={async () => {
                    try {
                      setImporting(true);
                      const response = await dashboardService.importCampTasks(
                        campId!,
                        importPreview,
                        replaceExisting
                      );
                      alert(`✅ ${response.message}`);
                      setShowImportModal(false);
                      setImportData("");
                      setImportPreview([]);
                      setImportErrors([]);
                      // Refresh tasks
                      const [tasksResponse, groupsResponse] = await Promise.all(
                        [
                          dashboardService.getCampDailyTasks(campId!),
                          dashboardService.getCampTaskGroups(campId!),
                        ]
                      );
                      applyTasksPayload(tasksResponse);
                      setTaskGroups(groupsResponse.data || []);
                    } catch (err: any) {
                      console.error("Error importing tasks:", err);
                      if (err.response?.data?.errors) {
                        setImportErrors(err.response.data.errors);
                      } else {
                        alert(
                          err.response?.data?.message ||
                            "❌ حدث خطأ أثناء الاستيراد"
                        );
                      }
                    } finally {
                      setImporting(false);
                    }
                  }}
                  disabled={importing || importPreview.length === 0}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-4 py-2 text-sm text-primary-100 transition hover:bg-primary/30 disabled:opacity-50"
                >
                  {importing
                    ? "جاري الاستيراد..."
                    : `استيراد ${importPreview.length} مهمة`}
                </button>
              )}
            </>
          }
        >
          <div className="space-y-6">
            {/* Templates */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-200">
                قوالب جاهزة:
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => {
                    const template = {
                      tasks: [
                        {
                          day_number: 1,
                          task_type: "reading",
                          title: "قراءة الآيات",
                          description: "",
                          verses_from: null,
                          verses_to: null,
                          order_in_day: 1,
                          is_optional: false,
                          points: 3,
                          estimated_time: 30,
                        },
                      ],
                    };
                    const jsonStr = JSON.stringify(template, null, 2);
                    setImportData(jsonStr);
                    handleImportData(jsonStr);
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-right transition hover:bg-slate-800 text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">قالب أساسي</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    const template = {
                      tasks: Array.from(
                        { length: camp?.duration_days || 7 },
                        (_, i) => ({
                          day_number: i + 1,
                          task_type: "reading",
                          title: `قراءة اليوم ${i + 1}`,
                          description: "",
                          verses_from: null,
                          verses_to: null,
                          order_in_day: 1,
                          is_optional: false,
                          points: 3,
                          estimated_time: 30,
                        })
                      ),
                    };
                    const jsonStr = JSON.stringify(template, null, 2);
                    setImportData(jsonStr);
                    handleImportData(jsonStr);
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-right transition hover:bg-slate-800 text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      قالب لجميع الأيام
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                تحميل ملف JSON/CSV/XLSX:
              </label>
              <input
                type="file"
                accept=".json,.csv,.xlsx,.xls"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const fileName = file.name.toLowerCase();
                    const isJSON = fileName.endsWith(".json");
                    const isCSV = fileName.endsWith(".csv");
                    const isXLSX =
                      fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

                    if (isJSON) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const text = event.target?.result as string;
                        setImportData(text);
                        handleImportData(text);
                      };
                      reader.readAsText(file);
                    } else if (isCSV || isXLSX) {
                      // For CSV/XLSX, send directly to backend
                      try {
                        setImporting(true);
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("replace", replaceExisting.toString());

                        // Use api instance from dashboardService
                        const response =
                          await dashboardService.importCampTasksFile(
                            campId!,
                            formData
                          );

                        if (response.success) {
                          alert(`✅ ${response.message}`);
                          setShowImportModal(false);
                          setImportData("");
                          setImportPreview([]);
                          setImportErrors([]);
                          // Refresh tasks
                          const [tasksResponse, groupsResponse] =
                            await Promise.all([
                              dashboardService.getCampDailyTasks(campId!),
                              dashboardService.getCampTaskGroups(campId!),
                            ]);
                          applyTasksPayload(tasksResponse);
                          setTaskGroups(groupsResponse.data || []);
                        } else {
                          if (response.errors) {
                            setImportErrors(response.errors);
                            // Parse tasks for preview if available
                            if (response.data?.valid_tasks) {
                              setImportPreview(response.data.valid_tasks);
                            }
                          } else {
                            alert(
                              response.message || "❌ حدث خطأ أثناء الاستيراد"
                            );
                          }
                        }
                      } catch (err: any) {
                        console.error("Error importing file:", err);
                        const errorMessage =
                          err.response?.data?.message ||
                          err.message ||
                          "❌ حدث خطأ أثناء الاستيراد";
                        alert(errorMessage);
                        if (err.response?.data?.errors) {
                          setImportErrors(err.response.data.errors);
                        }
                      } finally {
                        setImporting(false);
                      }
                    }
                  }
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Text Area - Only for JSON */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                أو لصق البيانات JSON (للملفات CSV/XLSX استخدم زر التحميل أعلاه):
              </label>
              <textarea
                value={importData}
                onChange={(e) => {
                  setImportData(e.target.value);
                  handleImportData(e.target.value);
                }}
                placeholder='{"tasks": [...]}'
                rows={12}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Preview */}
            {importPreview.length > 0 && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                <p className="mb-2 text-sm font-semibold text-emerald-200">
                  ✅ معاينة: {importPreview.length} مهمة صالحة
                </p>
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {importPreview.slice(0, 5).map((task, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-2 text-xs text-emerald-100"
                    >
                      اليوم {task.day_number}: {task.title} ({task.task_type})
                    </div>
                  ))}
                  {importPreview.length > 5 && (
                    <p className="text-xs text-emerald-300">
                      و {importPreview.length - 5} مهمة أخرى...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Errors */}
            {importErrors.length > 0 && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4">
                <p className="mb-2 text-sm font-semibold text-rose-200">
                  ❌ أخطاء: {importErrors.length} خطأ
                </p>
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {importErrors.map((error, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-rose-500/30 bg-rose-950/40 p-2 text-xs text-rose-100"
                    >
                      <p className="font-semibold">
                        المهمة #{error.index}: {error.task}
                      </p>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        {error.errors.map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Replace Option */}
            {importPreview.length > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    استبدال المهام الموجودة
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    سيتم حذف جميع المهام الحالية واستبدالها بالمهام المستوردة
                  </p>
                </div>
                <button
                  onClick={() => setReplaceExisting(!replaceExisting)}
                  className={`relative h-6 w-11 rounded-full transition ${
                    replaceExisting ? "bg-rose-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${
                      replaceExisting ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
