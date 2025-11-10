import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Calendar,
  Clock,
  Heart,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

const NotesModal = ({ campId, onClose }) => {
  const [allNotes, setAllNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [notesPerPage] = useState(5);
  const hasFetchedForThisOpen = useRef(false);
  const isFetchingRef = useRef(false);

  // جلب البيانات عند فتح المودال مرة واحدة فقط
  useEffect(() => {
    const fetchAllNotes = async () => {
      if (!campId || hasFetchedForThisOpen.current || isFetchingRef.current) {
        return;
      }

      try {
        setLoadingNotes(true);
        hasFetchedForThisOpen.current = true;
        isFetchingRef.current = true;

        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/notes-export/camp/${campId}/notes/all`,
          {
            headers: {
              "x-auth-token": localStorage.getItem("token"),
            },
          }
        );

        if (!response.ok) {
          throw new Error("فشل في جلب الملاحظات");
        }

        const data = await response.json();
        const newNotes = data.data || [];
        setAllNotes(newNotes);
      } catch (error) {
        console.error("Error fetching notes:", error);
        toast.error("حدث خطأ أثناء جلب الملاحظات");
        onClose();
      } finally {
        setLoadingNotes(false);
        isFetchingRef.current = false;
      }
    };

    if (campId) {
      // إعادة تعيين الحالة عند فتح المودال
      hasFetchedForThisOpen.current = false;
      isFetchingRef.current = false;
      fetchAllNotes();
    }
  }, [campId, onClose]);

  // إعادة تعيين عند الإغلاق
  const handleClose = useCallback(() => {
    hasFetchedForThisOpen.current = false;
    setCurrentPage(1);
    onClose();
  }, [onClose]);

  // حساب عدد الملاحظات
  const notesCount = allNotes?.length || 0;

  // حساب الملاحظات المعروضة في الصفحة الحالية
  const paginatedNotes = useMemo(() => {
    if (!allNotes || allNotes.length === 0) return [];
    const startIndex = (currentPage - 1) * notesPerPage;
    const endIndex = startIndex + notesPerPage;
    return allNotes.slice(startIndex, endIndex);
  }, [allNotes, currentPage, notesPerPage]);

  // حساب إجمالي عدد الصفحات
  const totalPages = allNotes?.length
    ? Math.ceil(allNotes.length / notesPerPage)
    : 0;

  // دوال التنقل بين الصفحات
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  // استخدام Portal لمنع تأثير المودال على باقي الصفحة
  const modalContent = (
    <AnimatePresence mode="wait">
      {allNotes && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 font-cairo bg-black/50 flex items-start justify-center z-50 p-4 pt-16 overflow-y-auto"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-4xl w-full max-h-[calc(100vh-8rem)] overflow-y-auto my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                    جميع ملاحظاتك
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {notesCount} ملاحظة
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            {loadingNotes ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm">جاري التحميل...</p>
              </div>
            ) : notesCount === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-gray-600 font-medium mb-2">
                  لا توجد ملاحظات
                </h4>
                <p className="text-gray-500 text-sm">
                  ابدأ بإكمال المهام لكتابة ملاحظاتك
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {paginatedNotes.map((note, index) => (
                  <div
                    key={note.id || index}
                    className="bg-gray-50 rounded-xl p-6 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-lg mb-2">
                          {note.task_title || "مهمة بدون عنوان"}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            اليوم {note.day_number}
                          </span>
                          {note.completed_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(note.completed_at).toLocaleDateString(
                                "ar-SA"
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {note.reflection && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            التدبر
                          </h5>
                          <p
                            dangerouslySetInnerHTML={{
                              __html: note.reflection,
                            }}
                            className="text-gray-600 leading-relaxed bg-white p-4 rounded-lg border border-gray-100"
                          ></p>
                        </div>
                      )}

                      {note.benefits && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            الفوائد المستفادة
                          </h5>
                          <p dangerouslySetInnerHTML={{ __html: note.benefits }} className="text-gray-600 leading-relaxed bg-white p-4 rounded-lg border border-gray-100">
                            
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {notesCount > 0 && totalPages > 1 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronRight className="w-4 h-4" />
                      السابق
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      التالي
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-sm text-gray-500">
                    صفحة {currentPage} من {totalPages}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // استخدام Portal لإضافة المودال مباشرة إلى body
  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};

export default NotesModal;
