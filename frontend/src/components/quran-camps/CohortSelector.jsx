import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { getAvailableCohorts } from "../../services/campService";

const CohortSelector = ({
  campId,
  onSelectCohort,
  selectedCohortNumber,
  isEnrolled,
  onJoinClick, // دالة للانضمام بعد اختيار الفوج
}) => {
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        setLoading(true);
        const response = await getAvailableCohorts(campId);
        if (response.success) {
          const cohortsData = response.data || [];
          setCohorts(cohortsData);

          // Auto-select the first available cohort (should be the active/open one)
          if (cohortsData.length > 0 && !selectedCohortNumber) {
            const activeCohort =
              cohortsData.find(
                (c) => c.is_open === 1 || c.status === "active"
              ) || cohortsData[0];
            if (activeCohort && onSelectCohort) {
              onSelectCohort(activeCohort.cohort_number);
            }
          }
        } else {
          setError(response.message || "حدث خطأ في جلب الأفواج");
        }
      } catch (err) {
        console.error("Error fetching cohorts:", err);
        setError("حدث خطأ في الاتصال");
      } finally {
        setLoading(false);
      }
    };

    if (campId) {
      fetchCohorts();
    }
  }, [campId]);

  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (cohort) => {
    if (cohort.is_open === 1) {
      return (
        <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-green-100 to-emerald-50 text-green-800 border border-green-300 shadow-sm">
          مفتوح للتسجيل
        </span>
      );
    }
    if (cohort.status === "active") {
      return (
        <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-blue-100 to-cyan-50 text-blue-800 border border-blue-300 shadow-sm">
          نشط
        </span>
      );
    }
    if (cohort.status === "early_registration") {
      return (
        <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-purple-100 to-indigo-50 text-purple-800 border border-purple-300 shadow-sm">
          التسجيل المبكر
        </span>
      );
    }
    return (
      <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-gray-100 to-slate-50 text-gray-800 border border-gray-300 shadow-sm">
        {cohort.status_ar || "غير محدد"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (cohorts.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <p className="text-gray-600 text-center">لا توجد أفواج متاحة حالياً</p>
      </div>
    );
  }

  // If there's only one cohort available, auto-select it and don't show selector
  if (cohorts.length === 1 && !selectedCohortNumber) {
    const singleCohort = cohorts[0];
    if (onSelectCohort && !singleCohort.is_enrolled) {
      onSelectCohort(singleCohort.cohort_number);
    }
    return null; // Don't show selector if only one cohort
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/30 rounded-2xl p-6 sm:p-8 shadow-lg border-2 border-purple-100">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-[#7440E9] to-purple-600 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">اختر الفوج</h3>
              <p className="text-sm text-gray-600 mt-1">
                اختر الفوج الذي تريد الانضمام إليه
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {cohorts.map((cohort) => {
            const isSelected = selectedCohortNumber === cohort.cohort_number;
            const isUserEnrolled = cohort.is_enrolled;

            return (
              <motion.div
                key={cohort.cohort_number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`group relative border-2 rounded-xl p-5 sm:p-6 transition-all duration-300 cursor-pointer overflow-hidden ${
                  isSelected
                    ? "border-[#7440E9] bg-gradient-to-br from-purple-50 via-indigo-50/50 to-purple-50 shadow-lg shadow-purple-200/50 scale-[1.02]"
                    : "border-gray-200 hover:border-purple-300 bg-white hover:bg-purple-50/30 hover:shadow-md"
                } ${isUserEnrolled ? "opacity-75 cursor-not-allowed" : ""}`}
                onClick={() =>
                  !isUserEnrolled && onSelectCohort(cohort.cohort_number)
                }
              >
                {/* Background decoration */}
                {isSelected && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7440E9]/10 to-purple-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                )}

                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-md ${
                            isSelected
                              ? "bg-gradient-to-br from-[#7440E9] to-purple-600 text-white"
                              : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700"
                          }`}
                        >
                          {cohort.cohort_number}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">
                            الفوج {cohort.cohort_number}
                            {cohort.name && (
                              <span className="text-gray-600 font-normal mr-2 text-base">
                                - {cohort.name}
                              </span>
                            )}
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(cohort)}
                        {isUserEnrolled && (
                          <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 shadow-sm">
                            <CheckCircle className="w-3.5 h-3.5" />
                            مسجل
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      <div className="flex items-center gap-2.5 text-sm bg-white/60 rounded-lg p-2.5 border border-gray-100">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <Calendar className="w-4 h-4 text-[#7440E9]" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">
                            تاريخ البدء
                          </span>
                          <span className="font-semibold text-gray-900">
                            {formatDate(cohort.start_date)}
                          </span>
                        </div>
                      </div>
                      {cohort.end_date && (
                        <div className="flex items-center gap-2.5 text-sm bg-white/60 rounded-lg p-2.5 border border-gray-100">
                          <div className="p-1.5 bg-purple-100 rounded-lg">
                            <Calendar className="w-4 h-4 text-[#7440E9]" />
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">
                              تاريخ الانتهاء
                            </span>
                            <span className="font-semibold text-gray-900">
                              {formatDate(cohort.end_date)}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5 text-sm bg-white/60 rounded-lg p-2.5 border border-gray-100">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <Users className="w-4 h-4 text-[#7440E9]" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">
                            المشتركين
                          </span>
                          <span className="font-semibold text-gray-900">
                            {cohort.participants_count || 0}
                            {cohort.max_participants &&
                              ` / ${cohort.max_participants}`}
                          </span>
                        </div>
                      </div>
                      {cohort.status === "early_registration" && (
                        <div className="flex items-center gap-2.5 text-sm bg-yellow-50 rounded-lg p-2.5 border border-yellow-200">
                          <div className="p-1.5 bg-yellow-100 rounded-lg">
                            <Clock className="w-4 h-4 text-yellow-600" />
                          </div>
                          <div>
                            <span className="text-xs text-yellow-600 block">
                              حالة التسجيل
                            </span>
                            <span className="font-semibold text-yellow-700">
                              التسجيل مفتوح قبل البدء
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && !isUserEnrolled && (
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7440E9] to-purple-600 flex items-center justify-center shadow-lg shadow-purple-300/50 animate-pulse">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {selectedCohortNumber && !isEnrolled && onJoinClick && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    تم اختيار الفوج {selectedCohortNumber}
                  </p>
                  <p className="text-xs text-blue-700">
                    اضغط على زر الانضمام للمتابعة
                  </p>
                </div>
              </div>
              <button
                onClick={onJoinClick}
                className="px-6 py-3  bg-purple-600  text-white rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 font-bold flex items-center gap-2 whitespace-nowrap"
              >
                <CheckCircle className="w-5 h-5" />
                <span>انضم الآن</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CohortSelector;
