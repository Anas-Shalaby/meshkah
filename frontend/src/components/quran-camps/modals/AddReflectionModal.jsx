import React from "react";
import { X, CheckCircle, Users } from "lucide-react";
import RichTadabburEditor from "../../RichTadabburEditor";
import toast from "react-hot-toast";

const AddReflectionModal = ({
  isOpen,
  onClose,
  userProgress,
  selectedTask,
  setSelectedTask,
  reflectionText,
  setReflectionText,
  reflectionJson,
  setReflectionJson,
  benefitsText,
  proposedStep,
  setProposedStep,
  shareInStudyHall,
  setShareInStudyHall,
  updateTaskBenefits,
  fetchStudyHallContent,
  studyHallSelectedDay,
  studyHallSort,
}) => {
  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (selectedTask && (reflectionText || benefitsText)) {
      try {
        // إضافة التدبر والفوائد
        if (reflectionText || benefitsText) {
          await updateTaskBenefits(
            selectedTask.id,
            reflectionText,
            benefitsText,
            !shareInStudyHall, // is_private
            reflectionJson,
            proposedStep || null // proposed_step
          );
        }

        // إعادة جلب بيانات قاعة التدارس
        await fetchStudyHallContent(
          studyHallSelectedDay,
          studyHallSort,
          1,
          20,
          true
        );

        // إعادة تعيين النموذج
        setSelectedTask(null);
        setReflectionText("");
        setReflectionJson(null);
        setProposedStep("");
        setShareInStudyHall(false);
        onClose();

        // إشعار النجاح
        toast.success("تم إضافة التدبر بنجاح! 🎉", {
          duration: 3000,
          position: "top-center",
        });
      } catch (error) {
        toast.error("حدث خطأ أثناء إضافة التدبر", {
          duration: 3000,
          position: "top-center",
        });
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">أضف تدبر جديد</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختر المهمة المكتملة
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {userProgress?.tasks?.filter((task) => task.completed)?.length >
              0 ? (
                userProgress.tasks
                  .filter((task) => task.completed)
                  .map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`w-full text-right p-3 rounded-lg border transition-all ${
                        selectedTask?.id === task.id
                          ? "border-[#7440E9] bg-[#F7F6FB]"
                          : "border-gray-200 hover:border-[#7440E9]/30"
                      }`}
                    >
                      <div className="font-medium text-gray-800">
                        {task.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        اليوم {task.day_number}
                      </div>
                    </button>
                  ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">لا توجد مهام مكتملة بعد</p>
                  <p className="text-xs text-gray-400 mt-1">
                    اكمل بعض المهام أولاً لإضافة تدبرك
                  </p>
                </div>
              )}
            </div>
          </div>

          {selectedTask && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اكتب مذكرتك (خاص بك) 📝
                </label>
                <p className="text-xs text-gray-600 mb-2">
                  للحصول على اقتراحات الأحاديث، اكتب{" "}
                  <span className="font-bold text-purple-600">/حديث</span> ثم
                  كلمة البحث (مثال:{" "}
                  <span className="font-bold text-purple-600">/حديث الصبر</span>
                  ).
                </p>
                <RichTadabburEditor
                  initialContent={reflectionText}
                  onChange={(htmlContent) => setReflectionText(htmlContent)}
                  onJSONChange={(jsonContent) => setReflectionJson(jsonContent)}
                  placeholder="ابدأ كتابة تدبرك هنا..."
                  taskId={selectedTask?.id}
                />
              </div>

              {/* الجسر الذكي - مشاركة في قاعة التدارس */}
              <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareInStudyHall}
                    onChange={(e) => setShareInStudyHall(e.target.checked)}
                    className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500 ml-3"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-purple-800 text-sm flex items-center">
                      <Users className="w-4 h-4 ml-1" />
                      مشاركة في قاعة التدارس
                    </span>
                    <p className="text-xs text-purple-600">
                      سيتم نشر هذه المذكرة ليراها ويستفيد منها باقي المشاركين
                    </p>
                  </div>
                </label>
              </div>

              {/* الخطوة العملية المقترحة (اختياري) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الخطوة العملية المقترحة (اختياري)
                </label>
                <textarea
                  value={proposedStep}
                  onChange={(e) => setProposedStep(e.target.value)}
                  placeholder="مثال: سأقوم بإهداء كتاب ديني لصديق هذا الأسبوع..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7440E9] focus:border-[#7440E9] resize-none text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  اقترح خطوة عملية يمكن للآخرين الالتزام بها معك
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedTask || (!reflectionText && !benefitsText)}
            className="flex-1 px-4 py-2 bg-[#7440E9] text-white rounded-lg hover:bg-[#5a2fc7] disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
          >
            إضافة التدبر
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddReflectionModal;
