import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { dashboardService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

interface Plan {
  id: number;
  name: string;
  description: string;
  hadiths_per_day: number;
  status: string;
  total_hadiths: number;
  memorized_hadiths: number;
  user_count: number;
  created_at: string;
  quiz_link?: string;
}

interface CreatePlanModalProps {
  onClose: () => void;
  onPlanCreated: () => void;
  editingPlan: Plan | null;
}

interface Hadith {
  id: number;
  title: string;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

export default function CreatePlanModal({
  onClose,
  onPlanCreated,
  editingPlan,
}: CreatePlanModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    daily_goal: 1,
    hadithsPerDay: 1,
    selectedHadiths: [] as number[],
    quiz_link: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hadithIdInput, setHadithIdInput] = useState("");
  const [selectedHadithsDetails, setSelectedHadithsDetails] = useState<
    Hadith[]
  >([]);

  useEffect(() => {
    if (editingPlan) {
      setFormData({
        name: editingPlan.name,
        description: editingPlan.description,
        daily_goal: editingPlan.hadiths_per_day,
        hadithsPerDay: editingPlan.hadiths_per_day,
        selectedHadiths: [], // We'll need to fetch the selected hadiths
        quiz_link: editingPlan.quiz_link || "",
      });
    }
  }, [editingPlan]);

  const handleAddHadith = async () => {
    if (!hadithIdInput.trim()) return;

    const hadithId = parseInt(hadithIdInput);
    if (isNaN(hadithId)) {
      setError("الرجاء إدخال رقم صحيح");
      return;
    }

    if (formData.selectedHadiths.includes(hadithId)) {
      setError("تم إضافة هذا الحديث مسبقاً");
      return;
    }

    try {
      const response = await dashboardService.getHadithById(hadithId);
      const hadith = response.data;

      const newHadith = {
        id: hadith.id,
        title: hadith.title_ar || hadith.title || "عنوان الحديث غير متوفر",
      };

      setSelectedHadithsDetails((prev) => {
        const updated = [...prev, newHadith];
        return updated;
      });

      setFormData((prev) => ({
        ...prev,
        selectedHadiths: [...prev.selectedHadiths, hadithId],
      }));
      setHadithIdInput("");
      setError(null);
    } catch (error) {
      setError("لم يتم العثور على الحديث");
      console.error("Failed to fetch hadith:", error);
    }
  };

  const handleRemoveHadith = (hadithId: number) => {
    setSelectedHadithsDetails((prev) => prev.filter((h) => h.id !== hadithId));
    setFormData((prev) => ({
      ...prev,
      selectedHadiths: prev.selectedHadiths.filter((id) => id !== hadithId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const planData = {
        ...formData,
        hadithsPerDay: formData.daily_goal,
        selectedHadiths: formData.selectedHadiths,
      };

      if (planData.selectedHadiths.length === 0) {
        throw new Error("الرجاء إضافة الأحاديث المراد حفظها");
      }

      if (editingPlan) {
        await dashboardService.updateMemorizationPlan(editingPlan.id, planData);
        toast({
          title: "تم تحديث الخطة بنجاح",
          description: "تم تحديث الخطة بنجاح",
          variant: "default",
        });
      } else {
        await dashboardService.createMemorizationPlan(planData);
        toast({
          title: "تم إنشاء الخطة بنجاح",
          description: "تم إنشاء الخطة بنجاح",
          variant: "default",
        });
      }

      onPlanCreated();
    } catch (error) {
      const apiError = error as ApiError;
      setError(
        apiError.response?.data?.error ||
          apiError.message ||
          "حدث خطأ أثناء إنشاء الخطة"
      );
      console.error("Failed to create/update plan:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-right">
              {editingPlan ? "تعديل الخطة" : "إنشاء خطة حفظ جديدة"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right"
              >
                اسم الخطة
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#7440E9] focus:border-transparent"
                required
                placeholder="مثال: حفظ الأربعون النووية"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right"
              >
                وصف الخطة
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#7440E9] focus:border-transparent"
                required
                placeholder="وصف مختصر للخطة"
              ></textarea>
            </div>

            <div>
              <label
                htmlFor="quiz_link"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right"
              >
                رابط الاختبار (اختياري)
              </label>
              <input
                type="url"
                id="quiz_link"
                value={formData.quiz_link}
                onChange={(e) =>
                  setFormData({ ...formData, quiz_link: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#7440E9] focus:border-transparent"
                placeholder="https://forms.google.com/..."
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-right">
                رابط اختبار Google Forms الذي سيتم إرساله للمستخدمين عند إكمال
                الخطة
              </p>
            </div>

            <div>
              <label
                htmlFor="hadithId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right"
              >
                إضافة أحاديث
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="hadithId"
                  value={hadithIdInput}
                  onChange={(e) => setHadithIdInput(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#7440E9] focus:border-transparent"
                  placeholder="أدخل رقم الحديث"
                />
                <button
                  type="button"
                  onClick={handleAddHadith}
                  className="px-4 py-2 bg-[#7440E9] text-white rounded-lg hover:bg-[#5f33c0] transition-colors"
                >
                  إضافة
                </button>
              </div>
              {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 text-right">
                  {error}
                </p>
              )}
            </div>

            {selectedHadithsDetails.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
                  الأحاديث المختارة
                </h3>
                <div className="space-y-2">
                  {selectedHadithsDetails.map((hadith) => (
                    <div
                      key={hadith.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveHadith(hadith.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-900 dark:text-white text-right">
                        {hadith.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#7440E9] text-white rounded-lg hover:bg-[#5f33c0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "جاري الحفظ..."
                  : editingPlan
                  ? "حفظ التغييرات"
                  : "إنشاء الخطة"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
