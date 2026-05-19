import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, GraduationCap, ChevronLeft, Loader2 } from "lucide-react";

const MyCampsPanel = ({ isOpen, onClose }) => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/quran-camps`, {
          headers: token ? { "x-auth-token": token } : {},
        });
        const data = await res.json();
        const enrolled = (data.data || []).filter((c) => c.is_enrolled);

        const withProgress = await Promise.all(
          enrolled.slice(0, 12).map(async (camp) => {
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
      } catch {
        setCamps([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen]);

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
            className="fixed left-4 top-4 bottom-4 z-[1101] w-[min(100%,22rem)] overflow-hidden rounded-2xl border border-purple-200/60 bg-white shadow-2xl flex flex-col"
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-purple-100 px-4 py-3 bg-gradient-to-l from-purple-50 to-indigo-50">
              <h2 className="font-bold text-[#7440E9] flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                مخيماتي
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/80 text-gray-500"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin text-[#7440E9] mb-2" />
                  جاري التحميل...
                </div>
              ) : camps.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-8">
                  لم تنضم إلى أي مخيم بعد.{" "}
                  <Link to="/quran-camps" onClick={onClose} className="text-[#7440E9] font-semibold">
                    استكشف المخيمات
                  </Link>
                </p>
              ) : (
                camps.map((camp) => {
                  const pct = camp.progress?.progressPercentage ?? 0;
                  const done = camp.progress?.completedTasks ?? 0;
                  const total = camp.progress?.totalTasks ?? 0;
                  return (
                    <Link
                      key={camp.id}
                      to={`/my-camp-journey/${camp.id}`}
                      onClick={onClose}
                      className="block rounded-xl border border-purple-100 bg-white p-3 hover:border-[#7440E9]/40 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-2">
                          {camp.title || camp.name}
                        </p>
                        <ChevronLeft className="w-4 h-4 text-[#7440E9] shrink-0 mt-0.5" />
                      </div>
                      <div className="h-2 rounded-full bg-purple-100 overflow-hidden mb-1">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-l from-[#7440E9] to-indigo-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {pct}% — {done} من {total} مهمة
                      </p>
                    </Link>
                  );
                })
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default MyCampsPanel;
