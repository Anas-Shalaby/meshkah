import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  BookOpen,
  ChevronLeft,
  Save,
  Info,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "react-datepicker/dist/react-datepicker-cssmodules.css";

const CreatePlan = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [formData, setFormData] = useState({
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    hadithsPerDay: 1,
    reminderTime: "08:00",
    includeWeekends: true,
    study_time_preference: "morning",
    schedule: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    },
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/memorization/users/plans`,
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch plans");
      }

      const newResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/memorization/plans`,
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }
      );

      const usersPlans = await newResponse.json();

      const data = await response.json();
      const filteredPlans = data.filter(
        (plan) => !usersPlans.find((userPlan) => userPlan.id === plan.id)
      );
      setPlans(filteredPlans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("حدث خطأ أثناء تحميل الخطط");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setFormData((prev) => ({
      ...prev,
      startDate: start,
      endDate: end,
    }));
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setFormData((prev) => ({
      ...prev,
      hadithsPerDay: plan.hadiths_per_day,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error("الرجاء اختيار خطة");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/memorization/plans/${
          selectedPlan.id
        }/assign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": localStorage.getItem("token"),
          },
          body: JSON.stringify({
            ...formData,
            startDate: formData.startDate.toISOString().split("T")[0],
            endDate: formData.endDate.toISOString().split("T")[0],
            hadiths_per_day: formData.hadithsPerDay,
            study_time_preference: formData.study_time_preference,
            include_weekends: formData.includeWeekends,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to assign plan");
      }

      toast.success("تم اختيار الخطة بنجاح!");
      navigate("/memorization");
    } catch (error) {
      console.error("Error assigning plan:", error);
      toast.error("حدث خطأ أثناء اختيار الخطة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f7fa] via-[#e9e6f3] to-[#fbc2eb] dark:from-[#181c24] dark:via-[#23283a] dark:to-[#7440E9] pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/memorization")}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-[#7440E9] dark:hover:text-[#7440E9] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 ml-1" />
            العودة للوحة الحفظ
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            اختيار خطة حفظ
          </h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {/* Available Plans */}
          {plans.length > 0 ? (
            <div className="space-y-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-[#7440E9]" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  الخطط المتاحة
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.length > 0 &&
                  plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedPlan?.id === plan.id
                          ? "border-[#7440E9] bg-[#7440E9]/5"
                          : "border-gray-200 dark:border-gray-700 hover:border-[#7440E9]/50"
                      }`}
                    >
                      <div className="text-right">
                        <div className="flex justify-between items-start mb-2">
                          <button
                            onClick={() => setShowDetails(plan)}
                            className="text-[#7440E9] hover:text-[#5f33c0] transition-colors"
                          >
                            <Info className="w-5 h-5" />
                          </button>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {plan.name}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {plan.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <span>{plan.hadiths_per_day} حديث يومياً</span>
                          <span>{plan.total_hadiths} حديث</span>
                        </div>
                        <div className="flex mt-5 items-center justify-between flex-row-reverse">
                          <button
                            onClick={() => handlePlanSelect(plan)}
                            className="  bg-[#7440E9] text-white py-2 px-4 rounded-lg hover:bg-[#5f33c0] transition-colors"
                          >
                            اختيار الخطة
                          </button>
                          <button
                            onClick={() => navigate(`/plan/${plan.id}`)}
                            className="text-[#7440E9] bg-[#7440E9]/10 py-2 px-4 rounded-lg  hover:text-[#5f33c0] transition-colors"
                          >
                            <span className="">اطلع على التفاصيل</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="text-gray-600 dark:text-gray-400 text-center">
              لا يوجد خطط متاحة
            </div>
          )}

          {selectedPlan && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Schedule Settings */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-[#7440E9]" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    جدول الحفظ
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right mb-2">
                      تاريخ البداية والنهاية
                    </label>
                    <DatePicker
                      selected={formData.startDate}
                      onChange={handleDateChange}
                      startDate={formData.startDate}
                      endDate={formData.endDate}
                      selectsRange
                      className="w-full rounded-xl p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:border-[#7440E9] focus:ring-2 focus:ring-[#7440E9]/20 transition-all duration-200"
                      dateFormat="yyyy/MM/dd"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right mb-2">
                      وقت الدراسة المفضل
                    </label>
                    <select
                      name="study_time_preference"
                      value={formData.study_time_preference}
                      onChange={handleInputChange}
                      className="w-full rounded-xl p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:border-[#7440E9] focus:ring-2 focus:ring-[#7440E9]/20 transition-all duration-200"
                    >
                      <option value="morning">
                        صباحاً (6 صباحاً - 12 ظهراً)
                      </option>
                      <option value="afternoon">
                        ظهراً (12 ظهراً - 5 مساءً)
                      </option>
                      <option value="evening">
                        مساءً (5 مساءً - 10 مساءً)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right mb-2">
                      عدد الأحاديث يومياً
                    </label>
                    <input
                      type="number"
                      name="hadithsPerDay"
                      value={formData.hadithsPerDay}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                      className="w-full rounded-xl p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:border-[#7440E9] focus:ring-2 focus:ring-[#7440E9]/20 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      تضمين عطلة نهاية الأسبوع
                    </label>
                    <input
                      type="checkbox"
                      name="includeWeekends"
                      checked={formData.includeWeekends}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600 text-[#7440E9] focus:ring-2 focus:ring-[#7440E9]/20 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-between gap-2 bg-[#7440E9] text-white py-3 px-6 rounded-lg hover:bg-[#5f33c0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري الاختيار...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      اختيار الخطة
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Plan Details Modal */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl"
                >
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      تفاصيل الخطة
                    </h2>
                    <button
                      onClick={() => setShowDetails(null)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          عدد الأحاديث يومياً
                        </h3>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {showDetails.hadiths_per_day}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          إجمالي الأحاديث
                        </h3>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {showDetails.total_hadiths}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        وصف الخطة
                      </h3>
                      <p className="text-gray-900 dark:text-white">
                        {showDetails.description}
                      </p>
                    </div>

                    <div className="flex justify-end gap-4">
                      <button
                        onClick={() => {
                          handlePlanSelect(showDetails);
                          setShowDetails(null);
                        }}
                        className="bg-[#7440E9] text-white py-2 px-6 rounded-lg hover:bg-[#5f33c0] transition-colors"
                      >
                        اختيار الخطة
                      </button>
                      <button
                        onClick={() => setShowDetails(null)}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        إغلاق
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CreatePlan;
