import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import { dashboardService } from "@/services/api";

interface SelectPlanModalProps {
  onClose: () => void;
  onPlanSelected: () => void;
}

interface Plan {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  hadiths_per_day: number;
  created_at: string;
  user_count: number;
}

export default function SelectPlanModal({
  onClose,
  onPlanSelected,
}: SelectPlanModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await dashboardService.getMemorizationPlans();
        setPlans(response.data.plans);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        setError("فشل في تحميل خطط الحفظ المتاحة");
      }
    };

    fetchPlans();
  }, []);

  // const handlePlanSelection = async (planId: number) => {
  //   setLoading(true);
  //   setError(null);

  //   try {
  //     await dashboardService.assignPlanToUser(planId);
  //     onPlanSelected();
  //   } catch (error: any) {
  //     setError(
  //       error.response?.data?.error ||
  //         error.message ||
  //         "حدث خطأ أثناء اختيار الخطة"
  //     );
  //     console.error("Failed to select plan:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const filteredPlans = plans.filter(
    (plan) =>
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              اختيار خطة حفظ
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في خطط الحفظ..."
                className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#7440E9] focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-4">
              {filteredPlans.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  لا توجد خطط تطابق البحث
                </p>
              ) : (
                filteredPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white text-right">
                          {plan.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-right">
                          {plan.description}
                        </p>
                        <div className="mt-2 flex items-center justify-end space-x-4 space-x-reverse text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            عدد الأحاديث اليومية: {plan.hadiths_per_day}
                          </span>
                          <span>عدد المستخدمين: {plan.user_count}</span>
                        </div>
                      </div>
                      {/* <button
                        onClick={() => handlePlanSelection(plan.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-[#7440E9] text-white rounded-lg hover:bg-[#5f33c0] transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        {loading ? "جاري الاختيار..." : "اختيار الخطة"}
                      </button> */}
                    </div>
                  </div>
                ))
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 text-right">
                {error}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
