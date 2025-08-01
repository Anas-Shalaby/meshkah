/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import SunnahPlannerModal from "../components/SunnahPlannerModal";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Dialog } from "@headlessui/react";
import Joyride from "react-joyride";

const TrashIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const EditIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const ShareIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
    />
  </svg>
);

const CalendarIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="2"
      className="stroke-[#7440E9]"
    />
    <path d="M16 3v4M8 3v4M3 9h18" className="stroke-[#7440E9]" />
  </svg>
);

const PlusIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
);

const EmptyIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 48 48"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <circle cx="24" cy="24" r="22" className="stroke-[#7440E9]" />
    <path d="M16 32c2-4 14-4 16 0" className="stroke-[#7440E9]" />
    <circle cx="18" cy="20" r="2" className="fill-[#7440E9]" />
    <circle cx="30" cy="20" r="2" className="fill-[#7440E9]" />
  </svg>
);

const HadithIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const NoteIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const ConfirmModal = ({ open, onClose, onConfirm, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center transform transition-all">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div className="text-2xl font-bold mb-3 text-gray-800">تأكيد الحذف</div>
        <div className="text-gray-600 mb-6 leading-relaxed">
          هل أنت متأكد من حذف هذه السنة؟ لا يمكن التراجع عن هذا الإجراء.
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold transition-colors flex-1"
            disabled={loading}
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 font-semibold transition-colors flex items-center justify-center flex-1 min-w-[100px]"
            disabled={loading}
          >
            {loading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
            ) : (
              "تأكيد الحذف"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const MAIN_CATEGORIES = [
  { id: "1", title: "القرآن الكريم وعلومه" },
  { id: "2", title: "الحديث وعلومه" },
  { id: "3", title: "العقيدة" },
  { id: "4", title: "الفقه وأصوله" },
  { id: "5", title: "الفضائل والآداب" },
  { id: "6", title: "الدعوة والحسبة" },
  { id: "7", title: "السيرة والتاريخ" },
];

const Planner = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const navigate = useNavigate();
  const [runTour, setRunTour] = useState(
    !localStorage.getItem("planner_tour_done")
  );
  const steps = [
    {
      target: ".add-sunnah-btn",
      content: "اضغط هنا لإضافة سنة جديدة إلى مخططك.",
      placement: "bottom",
    },
    {
      target: ".category-modal",
      content: "اختر التصنيف الرئيسي للسنة التي تريد تطبيقها.",
      placement: "top",
    },
    {
      target: ".sunnah-list-item",
      content: "هنا تظهر السنن التي أضفتها ويمكنك تتبعها أو تعديلها أو حذفها.",
      placement: "top",
    },
    {
      target: ".mark-done-btn",
      content: "عند تطبيق السنة، اضغط هنا لوضع علامة صح.",
      placement: "left",
    },
  ];

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/sunnah/planner`,
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);
      } else {
        setError("حدث خطأ أثناء جلب السنن");
      }
    } catch {
      setError("تعذر الاتصال بالخادم");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/sunnah/planner/${id}`,
        {
          method: "DELETE",
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
        toast.success("تم حذف السنّة بنجاح!");
      } else {
        toast.error("حدث خطأ أثناء الحذف");
      }
    } catch {
      toast.error("تعذر الاتصال بالخادم");
    }
    setDeletingId(null);
    setModalOpen(false);
    setPendingDeleteId(null);
  };

  const handleAddSunnah = () => {
    setCategoryModalOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getRepeatTypeText = (type) => {
    switch (type) {
      case "daily":
        return "يومي";
      case "weekly":
        return "أسبوعي";
      case "monthly":
        return "شهري";
      case "once":
        return "مرة واحدة";
      default:
        return type;
    }
  };

  const getRepeatTypeColor = (type) => {
    switch (type) {
      case "daily":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "weekly":
        return "bg-green-100 text-green-700 border-green-200";
      case "monthly":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "once":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-400";
      case "completed":
        return "bg-green-400";
      case "missed":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  const handleEdit = (plan) => {
    setPlanToEdit(plan);
    setEditModalOpen(true);
  };

  const handleMarkDone = async (id) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/sunnah/planner/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": localStorage.getItem("token"),
          },
          body: JSON.stringify({ status: "done" }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setPlans((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "done" } : p))
        );
        toast.success("تم إنجاز السنة!");
      } else {
        toast.error("حدث خطأ أثناء تحديث الحالة");
      }
    } catch {
      toast.error("تعذر الاتصال بالخادم");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f8f6ff] to-[#f3f3fa] flex justify-center items-center">
        <div className="text-center">
          <span className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7440E9] inline-block"></span>
          <div className="mt-4 text-gray-600 font-medium">
            جاري تحميل السنن...
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f8f6ff] to-[#f3f3fa] flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <div className="text-red-500 text-lg">{error}</div>
        </div>
      </div>
    );

  return (
    <>
      <Joyride
        steps={steps}
        run={runTour}
        continuous
        showSkipButton
        locale={{ next: "التالي", back: "السابق", last: "إنهاء", skip: "تخطي" }}
        callback={(data) => {
          if (data.status === "finished" || data.status === "skipped") {
            localStorage.setItem("planner_tour_done", "1");
            setRunTour(false);
          }
        }}
        styles={{ options: { zIndex: 99999 } }}
      />
      <div
        dir="rtl"
        className="min-h-screen bg-gradient-to-b from-[#f8f6ff] to-[#f3f3fa]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 py-4 md:py-6 mb-6 md:mb-8">
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-[#7440E9]/10 rounded-lg md:rounded-xl">
                <CalendarIcon className="w-6 h-6 md:w-8 md:h-8 text-[#7440E9]" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-[#7440E9] tracking-tight">
                  مخطط السنن
                </h1>
                <p className="text-gray-600 text-xs md:text-sm mt-0.5 md:mt-1 hidden sm:block">
                  نظم سننك واتبع هدي النبي ﷺ
                </p>
              </div>
            </div>
            <button
              onClick={handleAddSunnah}
              className="add-sunnah-btn bg-[#7440E9] text-white px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-semibold shadow-lg hover:bg-[#5a2ebc] transition-all duration-200 flex items-center gap-1.5 md:gap-2 hover:scale-105 text-sm md:text-base"
            >
              <PlusIcon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">إضافة سنة</span>
              <span className="sm:hidden">إضافة</span>
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pb-10">
          {plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20 md:mt-32 text-gray-500">
              <div className="p-6 md:p-8 bg-white/50 rounded-2xl md:rounded-3xl shadow-lg mb-4 md:mb-6">
                <EmptyIcon className="w-16 h-16 md:w-24 md:h-24" />
              </div>
              <div className="text-xl md:text-2xl font-bold mb-2 text-center">
                لا توجد سنن مضافة بعد
              </div>
              <div className="text-gray-600 mb-6 md:mb-8 text-center max-w-md px-4 text-sm md:text-base">
                ابدأ رحلتك في اتباع السنة النبوية بإضافة أول سنة إلى مخططك
              </div>
              <button
                onClick={handleAddSunnah}
                className="bg-[#7440E9] text-white px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-semibold shadow-xl hover:bg-[#5a2ebc] transition-all duration-200 flex items-center gap-2 md:gap-3 hover:scale-105 text-sm md:text-base"
              >
                <PlusIcon className="w-5 h-5 md:w-6 md:h-6" />
                أضف أول سنة الآن
              </button>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="sunnah-list-item group relative rounded-2xl md:rounded-3xl shadow-lg bg-white/80 backdrop-blur-sm p-4 md:p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] md:hover:scale-[1.02] overflow-hidden"
                >
                  {/* Status indicator */}
                  <div
                    className={`absolute right-0 top-0 h-full w-1 ${getStatusColor(
                      plan.status
                    )}`}
                  ></div>

                  {/* Repeat type badge */}
                  <div className="absolute left-3 md:left-6 top-3 md:top-6">
                    <span
                      className={`inline-flex items-center px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-bold border ${getRepeatTypeColor(
                        plan.repeat_type
                      )}`}
                    >
                      {getRepeatTypeText(plan.repeat_type)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-4 md:gap-6">
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 md:gap-3 mb-3 md:mb-4">
                        <div className="p-1.5 md:p-2 bg-[#7440E9]/10 rounded-lg flex-shrink-0">
                          <HadithIcon className="w-5 h-5 md:w-6 md:h-6 text-[#7440E9]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/hadiths/hadith/${plan.hadith_id}`}>
                            <h3 className="font-bold text-lg md:text-xl mb-2 text-[#7440E9] hover:text-[#5a2ebc] transition-colors line-clamp-2">
                              {plan.hadith_title || "سنة نبوية"}
                            </h3>
                          </Link>

                          {/* Hadith preview */}
                          {plan.hadith && (
                            <div className="text-gray-600 mb-3 text-sm leading-relaxed bg-gray-50 p-2 md:p-3 rounded-lg border-r-4 border-[#7440E9]/20">
                              <div className="line-clamp-2">
                                {plan.hadith.length > 100
                                  ? `${plan.hadith.slice(0, 100)}...`
                                  : plan.hadith}
                              </div>
                              {plan.hadith.length > 100 && (
                                <Link
                                  to={`/hadiths/hadith/${plan.hadith_id}`}
                                  className="text-[#7440E9] font-medium text-xs mt-2 inline-block hover:underline"
                                >
                                  قراءة الحديث كاملاً →
                                </Link>
                              )}
                            </div>
                          )}

                          {/* Note */}
                          {plan.note && (
                            <div className="flex items-start gap-2 mb-3">
                              <NoteIcon className="w-3 h-3 md:w-4 md:h-4 text-[#7440E9] mt-0.5 flex-shrink-0" />
                              <div className="text-gray-700 text-xs md:text-sm bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                                {plan.note}
                              </div>
                            </div>
                          )}

                          {/* Date and time */}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <ClockIcon className="w-3 h-3 md:w-4 md:h-4 text-[#7440E9]" />
                            <span className="text-xs md:text-xs">
                              {formatDate(plan.start_datetime)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-row gap-1.5 md:gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="p-2 md:p-3 rounded-lg md:rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group-hover:scale-105"
                        title="تعديل السنة"
                      >
                        <EditIcon className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                      </button>

                      <button
                        onClick={() => {
                          // TODO: Implement share functionality
                          toast.info("سيتم إضافة هذه الميزة قريباً");
                        }}
                        className="p-2 md:p-3 rounded-lg md:rounded-xl border border-gray-200 bg-white hover:bg-green-50 hover:border-green-300 transition-all duration-200 group-hover:scale-105"
                        title="مشاركة السنة"
                      >
                        <ShareIcon className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                      </button>

                      {plan.status === "pending" ? (
                        <button
                          onClick={() => handleMarkDone(plan.id)}
                          className="mark-done-btn p-2 md:p-3 rounded-lg md:rounded-xl border border-gray-200 bg-white hover:bg-green-50 hover:border-green-300 transition-all duration-200 group-hover:scale-105"
                          title="تم الإنجاز"
                        >
                          <CheckIcon className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                        </button>
                      ) : (
                        <span
                          className="p-2 md:p-3 rounded-lg md:rounded-xl border border-green-200 bg-green-50 flex items-center justify-center"
                          title="تم الإنجاز"
                        >
                          <CheckIcon className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setPendingDeleteId(plan.id);
                          setModalOpen(true);
                        }}
                        disabled={deletingId === plan.id}
                        className={`p-2 md:p-3 rounded-lg md:rounded-xl border transition-all duration-200 group-hover:scale-105 ${
                          deletingId === plan.id
                            ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                            : "border-gray-200 bg-white hover:bg-red-50 hover:border-red-300"
                        }`}
                        title="حذف السنة"
                      >
                        {deletingId === plan.id ? (
                          <span className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-t-2 border-b-2 border-red-500 inline-block"></span>
                        ) : (
                          <TrashIcon className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <ConfirmModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setPendingDeleteId(null);
          }}
          onConfirm={() => handleDelete(pendingDeleteId)}
          loading={!!deletingId}
        />

        <SunnahPlannerModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          mode="edit"
          initialValues={planToEdit || {}}
          hadith={
            planToEdit
              ? {
                  id: planToEdit.hadith_id,
                  title: planToEdit.hadith_title,
                  hadeeth: planToEdit.hadith,
                }
              : {}
          }
          onSubmit={() => {
            setEditModalOpen(false);
            setPlanToEdit(null);
            fetchPlans();
          }}
        />

        <Dialog
          open={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          className="category-modal fixed inset-0 z-[9999] font-cairo text-black"
        >
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
            <Dialog.Panel
              as="div"
              className="w-full max-w-full sm:max-w-md rounded-2xl bg-white p-2 sm:p-6 shadow-xl flex flex-col gap-4"
            >
              <Dialog.Title className="text-xl font-bold text-center text-[#7440E9] mb-2">
                اختر التصنيف الرئيسي للسنة
              </Dialog.Title>
              <div className="flex flex-col gap-3">
                {MAIN_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategoryModalOpen(false);
                      navigate(`/hadiths/${cat.id}/page/1`);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gray-50 hover:bg-[#7440E9]/10 border border-gray-200 text-[#7440E9] font-bold text-lg transition flex items-center justify-between gap-2"
                  >
                    <span>{cat.title}</span>
                    <span className="text-gray-400 text-sm">→</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="w-full mt-4 py-2 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold"
              >
                إلغاء
              </button>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </>
  );
};

export default Planner;
