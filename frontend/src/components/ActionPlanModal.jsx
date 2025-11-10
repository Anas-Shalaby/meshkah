import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle,
  Award,
  Sparkles,
  Trophy,
  BookOpen,
  CheckCheck,
  BookHeart,
  Bookmark,
  ArrowUp,
  Star,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import Confetti from "react-confetti";
import { toPng } from "html-to-image";

const ActionPlanModal = ({
  campId,
  onClose,
  onNavigateToJournal,
  onCompletionSuccess, // الدالة الجديدة التي تستدعى عند النجاح
  initialView = null,
  editMode = false, // إذا كان true، يعرض النموذج للتعديل ويغلق بعد الحفظ بدون فتح الملخص
}) => {
  const [actionPlan, setActionPlan] = useState({
    what: "",
    when: "",
    measure: "",
  });
  const [loading, setLoading] = useState(true); // (لجلب الخطة القديمة)
  const [saving, setSaving] = useState(false); // (لحالة الحفظ)
  const [view, setView] = useState(initialView || "form"); // 'form', 'loading_summary', 'success_summary'
  const [summaryData, setSummaryData] = useState(null);
  const summaryCardRef = useRef(null); // (هذا لـ تحميل الصورة)
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // تحديث حجم النافذة عند تغيير الحجم
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handler لتحديث actionPlan
  const handlePlanChange = (field, value) => {
    setActionPlan((prev) => ({ ...prev, [field]: value }));
  };

  // 1. جلب الخطة القديمة (إن وُجدت) عند فتح المودال
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/quran-camps/${campId}/my-action-plan`,
          {
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token,
            },
          }
        );
        const data = await response.json();
        if (data.success && data.data) {
          // دعم النمط الجديد (action_details) والنمط القديم (action_text)
          let hasActionPlan = false;

          if (
            data.data.action_details &&
            data.data.action_details.what &&
            data.data.action_details.what.trim() !== ""
          ) {
            // النمط الجديد: البيانات المهيكلة
            const details = data.data.action_details;
            setActionPlan({
              what: details.what || "",
              when: details.when || "",
              measure: details.measure || "",
            });
            hasActionPlan = true;
          } else if (
            data.data.action_text &&
            data.data.action_text.trim() !== ""
          ) {
            // النمط القديم: تحويل النص إلى هيكل
            setActionPlan({
              what: data.data.action_text,
              when: "",
              measure: "",
            });
            hasActionPlan = true;
          }

          // إذا كان في وضع التعديل، اعرض النموذج فقط
          if (editMode) {
            setView("form");
          } else if (hasActionPlan) {
            // إذا لم يكن في وضع التعديل وكانت هناك خطة عمل، افتح مباشرة على الملخص
            setView("loading_summary");

            // جلب بيانات الملخص مباشرة
            try {
              const summaryResponse = await fetch(
                `${
                  import.meta.env.VITE_API_URL
                }/quran-camps/${campId}/my-summary`,
                {
                  headers: {
                    "x-auth-token": token,
                  },
                }
              );
              const summaryData = await summaryResponse.json();
              if (summaryData.success) {
                setSummaryData(summaryData.data);
                setView("success_summary");
              } else {
                // إذا فشل جلب الملخص، اعرض النموذج
                setView("form");
              }
            } catch (error) {
              console.error("Failed to load summary:", error);
              // إذا فشل جلب الملخص، اعرض النموذج
              setView("form");
            }
          } else {
            // لا توجد خطة عمل، اعرض النموذج
            setView("form");
          }
        } else {
          // لا توجد خطة عمل، اعرض النموذج
          setView("form");
        }
      } catch (error) {
        console.error("Failed to fetch action plan:", error);
        toast.error("حدث خطأ أثناء جلب خطة العمل");
        setView("form");
      } finally {
        setLoading(false);
      }
    };
    if (campId) {
      // إعادة تعيين الحالة عند فتح المودال
      setView(initialView || "form");
      setSummaryData(null);
      fetchPlan();
    }
  }, [campId, initialView, editMode]);

  // 2. دالة الحفظ (عند ضغط الزر)
  const handleSavePlan = async () => {
    if (
      saving ||
      actionPlan.what.trim() === "" ||
      actionPlan.when.trim() === ""
    )
      return;
    setSaving(true); // (يُستخدم في 'form' view)

    try {
      // الخطوة 1: حفظ خطة العمل المهيكلة
      const token = localStorage.getItem("token");
      const postResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/quran-camps/${campId}/my-action-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({
            what: actionPlan.what.trim(),
            when: actionPlan.when.trim(),
            measure: actionPlan.measure.trim(),
          }),
        }
      );
      const postData = await postResponse.json();

      if (!postData.success) {
        throw new Error("Failed to save action plan.");
      }

      // إذا كان في وضع التعديل، أغلق المودال مباشرة بعد الحفظ
      if (editMode) {
        toast.success("تم تحديث خطة العمل بنجاح!");
        onClose();
        return;
      }

      // إذا كان onCompletionSuccess موجود، اعرض التهنئة البسيطة ثم استدع الدالة
      if (onCompletionSuccess) {
        setSaving(false);
        setView("success_celebration");
        return;
      }

      // السلوك القديم (للتوافق مع النسخ القديمة)
      // الخطوة 2: الدخول في "وضع تحميل الملخص" (فقط عند الحفظ الأول)
      setView("loading_summary");

      // الخطوة 3: جلب بيانات الملخص
      const summaryResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/quran-camps/${campId}/my-summary`,
        {
          headers: {
            "x-auth-token": token,
          },
        }
      );
      const summaryData = await summaryResponse.json();

      if (summaryData.success) {
        setSummaryData(summaryData.data);
        setView("success_summary"); // اعرض الملخص!
      } else {
        throw new Error("Failed to load summary.");
      }
    } catch (error) {
      console.error("Failed to save or load summary:", error);
      toast.error("حدث خطأ، حاول الإغلاق والفتح مرة أخرى.");
      setSaving(false);
      setView("form"); // أرجع المستخدم للـ form إذا فشل
    }
    // (لا نضع finally لـ setSaving(false) لأننا ننتقل لواجهة أخرى)
  };

  // دالة تحميل الصورة
  const handleDownloadImage = () => {
    if (summaryCardRef.current === null) {
      return;
    }
    toPng(summaryCardRef.current, {
      cacheBust: true,
      backgroundColor: "#ffffff", // خلفية بيضاء
      pixelRatio: 2, // جودة أعلى
      width: summaryCardRef.current.offsetWidth,
      height: summaryCardRef.current.offsetHeight,
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "my-camp-summary.png";
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.log(err);
        toast.error("حدث خطأ أثناء تحميل الصورة");
      });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 top-[50px] bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose} // السماح بالإغلاق بالضغط خارج المودال في جميع الحالات
      >
        {/* تفعيل الاحتفال في الخلفية */}
        {(view === "success_summary" || view === "success_celebration") && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
          />
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            {/* ----- الحالة 1: نموذج خطة العمل (Form) ----- */}
            {view === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    حصاد المخيم: خطة العمل
                  </h3>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                  </button>
                </div>

                <div className="text-center mb-4">
                  <h4 className="text-lg sm:text-xl font-semibold text-gray-700 mt-2">
                    "إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ..."
                  </h4>
                  <p className="text-gray-600 mt-2 text-base sm:text-lg">
                    العلم يُقصد به العمل. بعد هذه الرحلة، ما هو "الالتزام
                    العملي" الذي ستأخذه على عاتقك؟
                  </p>
                </div>

                {loading ? (
                  <div className="text-center p-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : (
                  <>
                    {/* ----- بداية الحقول المهيكلة لخطة العمل ----- */}
                    <div className="space-y-6">
                      {/* --- 1. حقل "ماذا؟" (إجباري) --- */}
                      <div>
                        <label
                          htmlFor="actionWhat"
                          className="block text-lg font-semibold text-gray-800 mb-2"
                        >
                          ما هو العمل المحدد الذي ستلتزم به؟ *
                        </label>
                        <input
                          type="text"
                          id="actionWhat"
                          value={actionPlan.what}
                          onChange={(e) =>
                            handlePlanChange("what", e.target.value)
                          }
                          placeholder="مثال: قراءة وردي اليومي، حفظ آيتين جديدتين..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-lg"
                          required
                        />
                      </div>

                      {/* --- 2. حقل "متى/كم مرة؟" (إجباري) --- */}
                      <div>
                        <label
                          htmlFor="actionWhen"
                          className="block text-lg font-semibold text-gray-800 mb-2"
                        >
                          متى أو كم مرة ستقوم به؟ *
                        </label>
                        <input
                          type="text"
                          id="actionWhen"
                          value={actionPlan.when}
                          onChange={(e) =>
                            handlePlanChange("when", e.target.value)
                          }
                          placeholder="مثال: يوميًا بعد صلاة الفجر، كل جمعة، مرتين أسبوعيًا..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-lg"
                          required
                        />
                      </div>

                      {/* --- 3. حقل "كيف أقيس؟" (اختياري) --- */}
                      <div>
                        <label
                          htmlFor="actionMeasure"
                          className="block text-lg font-semibold text-gray-800 mb-2"
                        >
                          كيف ستعرف أنك تنجح؟ (اختياري)
                        </label>
                        <input
                          type="text"
                          id="actionMeasure"
                          value={actionPlan.measure}
                          onChange={(e) =>
                            handlePlanChange("measure", e.target.value)
                          }
                          placeholder="مثال: تسجيل الإنجاز في تطبيق، علامة في التقويم..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-lg"
                        />
                      </div>
                    </div>
                    {/* ----- نهاية الحقول المهيكلة ----- */}
                  </>
                )}

                <button
                  onClick={handleSavePlan}
                  disabled={
                    saving ||
                    loading ||
                    actionPlan.what.trim() === "" ||
                    actionPlan.when.trim() === ""
                  }
                  className="w-full mt-4 px-5 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold flex items-center justify-center gap-2 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      حفظ الالتزام
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* ----- الحالة 2: جاري تحميل الملخص ----- */}
            {view === "loading_summary" && (
              <motion.div
                key="loading_summary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 px-4"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-base sm:text-lg text-gray-700 font-semibold">
                  جاري تجميع حصادك... لحظات!
                </p>
              </motion.div>
            )}

            {/* ----- الحالة 2.5: التهنئة البسيطة (عند وجود onCompletionSuccess) ----- */}
            {view === "success_celebration" && (
              <motion.div
                key="success_celebration"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center p-8"
              >
                <Trophy className="w-24 h-24 text-yellow-500 mx-auto animate-bounce" />
                <h3 className="text-3xl font-bold text-gray-900 mt-6 mb-4">
                  مبارك عليك إتمام المخيم!
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  لقد أكملت رحلتك بنجاح. اضغط أدناه لعرض حصادك النهائي.
                </p>

                {/* الزر الذي سيُظهر "واجهة المخيم المكتمل" */}
                <button
                  onClick={onCompletionSuccess}
                  className="w-full px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center gap-2 text-lg"
                >
                  <BookOpen className="w-5 h-5" />
                  اعرض حصاد رحلتي
                </button>
              </motion.div>
            )}

            {/* ----- الحالة 3: عرض الملخص والتهنئة (للتوافق مع النسخ القديمة) ----- */}
            {view === "success_summary" && summaryData && (
              <motion.div
                key="success_summary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center relative"
              >
                {/* زر الإغلاق */}
                <button
                  onClick={onClose}
                  className="absolute top-0 left-0 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                </button>

                {/* المحتوى الكامل للتنزيل كصورة */}
                <div
                  ref={summaryCardRef}
                  className="text-center bg-white rounded-xl p-4"
                >
                  <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-500 mx-auto" />
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-4 mb-3">
                    مبارك يا {summaryData.userName}!
                  </h3>
                  <p className="text-base sm:text-lg text-gray-600 mb-5">
                    هذا هو حصادك العظيم من "{summaryData.campName}"
                  </p>

                  {/* بطاقة الإحصائيات */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 sm:p-6 border border-purple-100 text-right">
                    <div className="grid grid-cols-2 gap-3 text-gray-700">
                      <StatItem
                        icon={<CheckCheck className="text-green-500 w-6 h-6" />}
                        value={summaryData.totalTasks}
                        label="مهمة مكتملة"
                      />
                      <StatItem
                        icon={<Star className="text-yellow-500 w-6 h-6" />}
                        value={summaryData.totalPoints}
                        label="نقطة مكتسبة"
                      />
                      <StatItem
                        icon={<BookHeart className="text-purple-500 w-6 h-6" />}
                        value={summaryData.reflectionsWritten}
                        label="فائدة كتبتها"
                      />
                      <StatItem
                        icon={<Bookmark className="text-blue-500 w-6 h-6" />}
                        value={summaryData.reflectionsSaved}
                        label="فائدة حفظتها"
                      />
                      <StatItem
                        icon={<ArrowUp className="text-pink-500 w-6 h-6" />}
                        value={summaryData.upvotesReceived}
                        label="'مفيد' تلقيتها"
                      />
                      <StatItem
                        icon={<Award className="text-indigo-500 w-6 h-6" />}
                        value={summaryData.daysCompleted}
                        label="يوم مكتمل"
                      />
                    </div>
                    <div className="border-t border-purple-200 mt-3 pt-3">
                      <p className="text-xs sm:text-sm font-semibold text-gray-500 mb-2">
                        التزامك:
                      </p>
                      {summaryData.actionPlan &&
                      typeof summaryData.actionPlan === "object" ? (
                        <div className="text-sm sm:text-md text-purple-800 space-y-2">
                          <p className="font-bold">
                            <span className="text-gray-600">ماذا:</span>{" "}
                            {summaryData.actionPlan.what}
                          </p>
                          <p>
                            <span className="text-gray-600">متى:</span>{" "}
                            {summaryData.actionPlan.when}
                          </p>
                          {summaryData.actionPlan.measure && (
                            <p>
                              <span className="text-gray-600">كيف أقيس:</span>{" "}
                              {summaryData.actionPlan.measure}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm sm:text-md font-bold text-purple-800">
                          "{summaryData.actionPlan || ""}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* أزرار الإجراءات (خارج الـ ref لأنها غير مطلوبة في الصورة) */}
                <div className="mt-5 flex flex-col sm:flex-row gap-2">
                  {onNavigateToJournal && (
                    <button
                      onClick={onNavigateToJournal}
                      className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                      اذهب إلى سجلي (للتفاصيل)
                    </button>
                  )}
                  <button
                    onClick={handleDownloadImage}
                    className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    تحميل الملخص (صورة)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// (مكون مساعد لعرض الإحصائيات)
const StatItem = ({ icon, value, label }) => (
  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
    <div className="flex-shrink-0">{icon}</div>
    <div className="text-right">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  </div>
);

export default ActionPlanModal;
