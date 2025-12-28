import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { getAvailableCohorts } from "../services/campService";
import SEO from "../components/SEO";
import toast from "react-hot-toast";

const SelectCohortPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCohortNumber, setSelectedCohortNumber] = useState(null);
  const [camp, setCamp] = useState(null);

  // Get return path from location state or default to camp details page
  const returnPath = location.state?.returnPath || `/quran-camps/${id}`;
  const openCommitmentModal = location.state?.openCommitmentModal || false;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch camp details
        const campResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/quran-camps/${id}`
        );
        const campData = await campResponse.json();
        if (campData.data) {
          setCamp(campData.data);
        }

        // Fetch cohorts
        const response = await getAvailableCohorts(id);
        if (response.success) {
          const cohortsData = response.data || [];
          setCohorts(cohortsData);

          // Auto-select the first available cohort if none selected
          if (cohortsData.length > 0 && !selectedCohortNumber) {
            const activeCohort =
              cohortsData.find(
                (c) => c.is_open === 1 || c.status === "active"
              ) || cohortsData[0];
            if (activeCohort) {
              setSelectedCohortNumber(activeCohort.cohort_number);
            }
          }
        } else {
          setError(response.message || "حدث خطأ في جلب الأفواج");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("حدث خطأ في الاتصال");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

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

  const handleSelectCohort = (cohortNumber) => {
    setSelectedCohortNumber(cohortNumber);
  };

  const handleConfirm = () => {
    if (!selectedCohortNumber) {
      toast.error("يرجى اختيار فوج أولاً");
      return;
    }

    // Navigate back with the selected cohort number
    // Note: We don't pass callback functions in state as they can't be cloned
    navigate(returnPath, {
      state: {
        selectedCohortNumber,
        openCommitmentModal, // تمرير هذه القيمة للعودة
      },
      replace: false,
    });
  };

  if (loading) {
    return (
      <>
        <SEO
          title="جاري التحميل - اختيار الفوج"
          description="جاري تحميل الأفواج المتاحة..."
        />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
            <p className="text-xl font-bold text-gray-700">جاري التحميل...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SEO
          title="حدث خطأ - اختيار الفوج"
          description="حدث خطأ أثناء تحميل الأفواج"
        />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-2 border-red-200 max-w-md mx-auto"
          >
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-red-900 mb-4">حدث خطأ</h3>
            <p className="text-red-700 mb-8">{error}</p>
            <button
              onClick={() => navigate(returnPath)}
              className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
            >
              العودة
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  if (cohorts.length === 0) {
    return (
      <>
        <SEO
          title="لا توجد أفواج - اختيار الفوج"
          description="لا توجد أفواج متاحة حالياً"
        />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-2 border-gray-200 max-w-md mx-auto"
          >
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              لا توجد أفواج متاحة
            </h3>
            <p className="text-gray-600 mb-8">
              لا توجد أفواج متاحة حالياً للتسجيل
            </p>
            <button
              onClick={() => navigate(returnPath)}
              className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
            >
              العودة
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <SEO
        title={`اختيار الفوج - ${camp?.name || "المخيم"}`}
        description="اختر الفوج الذي تريد الانضمام إليه"
      />

      {/* Hero Section */}
      <div className="relative py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-blue-100/20 to-indigo-100/30"></div>
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>

        {/* Camp Banner Image if available */}
        {camp?.banner_image && (
          <div className="absolute inset-0 opacity-10">
            <img
              src={camp.banner_image}
              alt={camp.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="max-w-7xl mx-auto relative">
          {/* Back Button */}
          <div className="mb-6 sm:mb-8">
            <button
              onClick={() => navigate(returnPath)}
              className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-all duration-300 group"
            >
              <div className="p-2 bg-white/80 backdrop-blur-sm rounded-xl group-hover:bg-purple-50 transition-all duration-300 shadow-md border border-gray-200/50">
                <ArrowRight className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg">العودة</span>
            </button>
          </div>

          {/* Hero Content */}
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ lineHeight: "1.2" }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 sm:mb-6"
            >
              {camp?.name || "اختيار الفوج"}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 mb-4 max-w-4xl mx-auto leading-relaxed"
            >
              اختر الفوج الذي تريد الانضمام إليه
              {camp?.surah_name && (
                <span className="text-purple-600 font-semibold">
                  {" "}
                  - سورة {camp.surah_name}
                </span>
              )}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            اختر الفوج المناسب لك
          </h2>
          <p className="text-gray-600 text-lg">
            اختر الفوج الذي يناسب وقتك والتزامك
          </p>
        </div>

        {/* Cohorts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {cohorts.map((cohort, index) => {
            const isSelected = selectedCohortNumber === cohort.cohort_number;
            const isUserEnrolled = cohort.is_enrolled;

            return (
              <motion.div
                key={cohort.cohort_number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`relative bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all duration-300 cursor-pointer shadow-xl border ${
                  isSelected
                    ? "border-purple-500 shadow-2xl shadow-purple-500/30 ring-2 ring-purple-200"
                    : "border-gray-200/50 hover:border-purple-300 hover:shadow-2xl"
                } ${isUserEnrolled ? "opacity-75 cursor-not-allowed" : ""}`}
                onClick={() =>
                  !isUserEnrolled && handleSelectCohort(cohort.cohort_number)
                }
              >
                <div className="relative">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg transition-all duration-300 ${
                            isSelected
                              ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white"
                              : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700"
                          }`}
                        >
                          {cohort.cohort_number}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-xl mb-1">
                            الفوج {cohort.cohort_number}
                          </h3>
                          {cohort.name && (
                            <p className="text-gray-600 text-sm">
                              {cohort.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-6">
                        {getStatusBadge(cohort)}
                        {isUserEnrolled && (
                          <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" />
                            مسجل
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && !isUserEnrolled && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="flex-shrink-0"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2.5 text-sm bg-white/60 rounded-lg p-3 border border-gray-100">
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <Calendar className="w-4 h-4 text-purple-600" />
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
                      <div className="flex items-center gap-2.5 text-sm bg-white/60 rounded-lg p-3 border border-gray-100">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Calendar className="w-4 h-4 text-blue-600" />
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
                    <div className="flex items-center gap-2.5 text-sm bg-white/60 rounded-lg p-3 border border-gray-100">
                      <div className="p-1.5 bg-indigo-100 rounded-lg">
                        <Users className="w-4 h-4 text-indigo-600" />
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
                      <div className="flex items-center gap-2.5 text-sm bg-yellow-50 rounded-lg p-3 border border-yellow-200">
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
              </motion.div>
            );
          })}
        </div>

        {/* Confirmation Section */}
        {selectedCohortNumber && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200/50 mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                  تم اختيار الفوج {selectedCohortNumber}
                </p>
                <p className="text-gray-600 text-sm">
                  جاهز للمتابعة والتسجيل في المخيم
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 font-bold text-lg flex items-center justify-center gap-2"
            >
              <span>تأكيد الاختيار</span>
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SelectCohortPage;
