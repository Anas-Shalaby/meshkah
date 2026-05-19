import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, GraduationCap, BookOpen, ChevronLeft, Loader2 } from "lucide-react";
import { getMyJourneys } from "../../services/bookJourneysService";

const MyLearningPanel = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState("camps");
  const [camps, setCamps] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const [campsRes, journeysData] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/quran-camps`, {
            headers: token ? { "x-auth-token": token } : {},
          }),
          getMyJourneys().catch(() => ({ journeys: [] })),
        ]);

        const campsJson = await campsRes.json();
        const enrolled = (campsJson.data || []).filter((c) => c.is_enrolled);

        const withProgress = await Promise.all(
          enrolled.slice(0, 15).map(async (camp) => {
            try {
              const pr = await fetch(
                `${import.meta.env.VITE_API_URL}/quran-camps/${camp.id}/my-progress`,
                { headers: { "x-auth-token": token } },
              );
              const pd = await pr.json();
              return {
                ...camp,
                progress: pd.success ? pd.data?.progress : null,
              };
            } catch {
              return { ...camp, progress: null };
            }
          }),
        );

        setCamps(withProgress);
        setJourneys(
          (journeysData.journeys || []).filter((j) => j.status === "active"),
        );
      } catch {
        setCamps([]);
        setJourneys([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen]);

  const renderCamps = () => {
    if (camps.length === 0) {
      return (
        <p className="py-8 text-center text-sm text-gray-500">
          لا مخيمات ملتحق بها.{" "}
          <Link
            to="/quran-camps"
            onClick={onClose}
            className="font-semibold text-[#7440E9]"
          >
            استكشف المخيمات
          </Link>
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {camps.map((camp) => {
          const pct = camp.progress?.progressPercentage ?? 0;
          const done = camp.progress?.completedTasks ?? 0;
          const total = camp.progress?.totalTasks ?? 0;
          return (
            <Link
              key={camp.id}
              to={`/quran-camps/${camp.id}`}
              onClick={onClose}
              className="flex gap-3 rounded-xl border border-purple-100 p-3 transition-all hover:border-[#7440E9]/40 hover:shadow-md"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-purple-100">
                {camp.banner_image ? (
                  <img
                    src={camp.banner_image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-purple-50">
                    <GraduationCap className="h-6 w-6 text-[#7440E9]" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                  {camp.title || camp.name}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-purple-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-[#7440E9] to-indigo-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {pct}% — {done}/{total} مهمة
                </p>
              </div>
              <ChevronLeft className="mt-1 h-4 w-4 shrink-0 text-[#7440E9]" />
            </Link>
          );
        })}
      </div>
    );
  };

  const renderJourneys = () => {
    if (journeys.length === 0) {
      return (
        <p className="py-8 text-center text-sm text-gray-500">
          لا ختمات نشطة.{" "}
          <Link
            to="/book-journeys"
            onClick={onClose}
            className="font-semibold text-[#7440E9]"
          >
            ابدأ ختمة
          </Link>
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {journeys.map((j) => (
          <Link
            key={j.id}
            to={`/book-journeys/${j.id}`}
            onClick={onClose}
            className="flex gap-3 rounded-xl border border-purple-100 p-3 transition-all hover:border-[#7440E9]/40 hover:shadow-md"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100">
              <BookOpen className="h-6 w-6 text-[#7440E9]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                {j.book_name}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-purple-100">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-violet-600 to-indigo-500"
                  style={{ width: `${j.progress_percent || 0}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {Math.round(j.progress_percent || 0)}% مكتمل
              </p>
            </div>
            <ChevronLeft className="mt-1 h-4 w-4 shrink-0 text-[#7440E9]" />
          </Link>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-black/40 backdrop-blur-sm lg:left-0 lg:right-24"
            onClick={onClose}
          />
          <motion.aside
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed left-4 top-4 bottom-4 z-[1101] flex w-[min(100%,24rem)] flex-col overflow-hidden rounded-2xl border border-purple-200/60 bg-white shadow-2xl"
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-purple-100 bg-gradient-to-l from-purple-50 to-indigo-50 px-4 py-3">
              <h2 className="font-bold text-[#7440E9]">تعلّمي</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 hover:bg-white/80"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-1 border-b border-purple-100 p-1">
              {[
                { id: "camps", label: "المخيمات", icon: GraduationCap },
                { id: "journeys", label: "ختمات الكتب", icon: BookOpen },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-colors ${
                    tab === id
                      ? "bg-[#7440E9] text-white shadow-sm"
                      : "text-gray-600 hover:bg-purple-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex flex-col items-center py-12 text-gray-500">
                  <Loader2 className="mb-2 h-8 w-8 animate-spin text-[#7440E9]" />
                  جاري التحميل...
                </div>
              ) : tab === "camps" ? (
                renderCamps()
              ) : (
                renderJourneys()
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default MyLearningPanel;
