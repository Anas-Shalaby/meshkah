import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const DailyPlan = () => {
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/memorization/today`,
          {
            headers: {
              "x-auth-token": localStorage.getItem("token"),
            },
          }
        );
        setPlans(response.data);
      } catch (error) {
        console.error("خطأ في جلب الخطط:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPlans();
    }
  }, [user]);

  const handlePlanClick = (planId) => {
    navigate(`/plan/${planId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Empty state when there are no plans
  if (Object.keys(plans).length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              خطتي اليومية
            </h2>
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {new Date().toLocaleDateString("ar-SA", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-primary dark:text-primary-light"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                لا توجد خطط لهذا اليوم
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                لم يتم تعيين أي خطط حفظ للأحاديث لهذا اليوم. يمكنك العودة لاحقاً
                للتحقق من خططك اليومية.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  العودة للرئيسية
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  تحديث الصفحة
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            خطتي اليومية
          </h2>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {new Date().toLocaleDateString("ar-SA", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(plans).map(([date, tasks]) => (
            <div
              key={date}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 px-6 py-4">
                <h3 className="text-lg font-semibold text-primary dark:text-primary-light">
                  {new Date(date).toLocaleDateString("ar-SA", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
              </div>

              {/* Mobile View */}
              <div className="md:hidden">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <button
                        onClick={() => handlePlanClick(task.plan_id)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 text-primary dark:text-primary-light font-medium rounded-lg hover:from-primary/20 hover:to-primary/10 dark:hover:from-primary/30 dark:hover:to-primary/20 transition-all duration-300 shadow-sm"
                      >
                        {task.plan_name}
                      </button>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          task.is_completed
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                            : "bg-indigo-100 text-yellow-800 dark:bg-indigo-500 dark:text-yellow-200"
                        }`}
                      >
                        {task.is_completed ? "مكتمل" : "قيد التنفيذ"}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-white text-sm">
                      {task.title_ar}
                    </p>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        الخطة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        الحديث
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        الحالة
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {tasks.map((task) => (
                      <tr
                        key={task.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          <button
                            onClick={() => handlePlanClick(task.plan_id)}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 text-primary dark:text-primary-light font-medium rounded-lg hover:from-primary/20 hover:to-primary/10 dark:hover:from-primary/30 dark:hover:to-primary/20 transition-all duration-300 shadow-sm"
                          >
                            {task.plan_name}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {task.title_ar}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              task.is_completed
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                                : "bg-indigo-100 text-yellow-800 dark:bg-indigo-500 dark:text-yellow-200"
                            }`}
                          >
                            {task.is_completed ? "مكتمل" : "قيد التنفيذ"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyPlan;
