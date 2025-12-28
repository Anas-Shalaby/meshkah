import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import axios from "axios";

const DailyTestModal = ({
  isOpen,
  onClose,
  campId,
  dayNumber,
  testId,
  attemptId,
}) => {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && testId) {
      fetchTest();
    }
  }, [isOpen, testId]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/quran-camps/${campId}/daily-tests/${dayNumber}`,
        {
          headers: { "x-auth-token": token },
        }
      );

      if (response.data.success) {
        const testData = response.data.data;
        setTest(testData);

        // Check if test is already submitted
        if (testData.has_attempted) {
          setError("تم حل هذا الاختبار مسبقاً. يمكنك مراجعته من صفحة اليوم.");
          return;
        }

        // Initialize responses only if not submitted
        const initialResponses = {};
        testData.questions?.forEach((q) => {
          initialResponses[q.id] = null;
        });
        setResponses(initialResponses);
      }
    } catch (err) {
      console.error("Error fetching test:", err);
      setError("حدث خطأ أثناء جلب الاختبار");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answerId) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleSubmit = async () => {
    // Validate all questions answered
    const unansweredQuestions = test.questions.filter((q) => !responses[q.id]);

    if (unansweredQuestions.length > 0) {
      setError(
        `يرجى الإجابة على جميع الأسئلة (${unansweredQuestions.length} سؤال غير مجاب)`
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const token = localStorage.getItem("token");
      const responseData = test.questions.map((q) => ({
        question_id: q.id,
        selected_answer_id: responses[q.id],
      }));

      // Use attempt_id from test data if available
      const currentAttemptId = test.attempt_id || attemptId;

      if (!currentAttemptId) {
        setError("خطأ: لم يتم العثور على معرف المحاولة");
        setSubmitting(false);
        return;
      }

      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL
        }/quran-camps/${campId}/daily-tests/${dayNumber}/submit`,
        { responses: responseData },
        {
          headers: { "x-auth-token": token },
        }
      );

      if (response.data.success) {
        // Fetch full test results after submission
        try {
          const resultsResponse = await axios.get(
            `${
              import.meta.env.VITE_API_URL
            }/quran-camps/${campId}/daily-tests/${dayNumber}/results`,
            {
              headers: { "x-auth-token": token },
            }
          );

          if (resultsResponse.data.success) {
            // Close modal and pass full results
            onClose(true, resultsResponse.data.data);
          } else {
            // Fallback to basic data if results fetch fails
            onClose(true, response.data.data);
          }
        } catch (err) {
          console.error("Error fetching test results:", err);
          // Fallback to basic data if results fetch fails
          onClose(true, response.data.data);
        }
      }
    } catch (err) {
      console.error("Error submitting test:", err);
      setError(err.response?.data?.message || "حدث خطأ أثناء إرسال الاختبار");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 top-[60px] flex items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-gradient-to-br from-white to-[#F7F6FB] rounded-none sm:rounded-2xl shadow-2xl shadow-[#7440E9]/20 max-w-4xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col border border-[#7440E9]/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-xl sm:text-2xl font-bold truncate">
                {test?.title || "اختبار اليوم"}
              </h2>
              {test?.description && (
                <p className="text-purple-100 mt-1 text-xs sm:text-sm line-clamp-2">
                  {test.description}
                </p>
              )}
            </div>
            <button
              onClick={() => onClose(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-[#7440E9] border-gray-200"></div>
              </div>
            ) : error && !test ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 text-lg">{error}</p>
              </div>
            ) : test ? (
              <div className="space-y-6">
                {test.questions?.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-white to-[#F7F6FB] rounded-xl p-4 sm:p-6 border-2 border-[#7440E9]/20 shadow-md hover:shadow-lg hover:shadow-[#7440E9]/20 hover:border-[#7440E9]/30 transition-all"
                  >
                    <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#7440E9] to-[#8B5CF6] text-white rounded-lg sm:rounded-xl flex items-center justify-center font-bold shadow-lg shadow-[#7440E9]/30 text-sm sm:text-base">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                          {question.question_text}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#7440E9]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="font-medium">
                              {question.points} نقطة
                            </span>
                          </span>
                          {question.question_type === "true_false" && (
                            <span className="px-2 py-1 bg-[#7440E9]/10 text-[#7440E9] rounded-lg text-xs font-medium border border-[#7440E9]/20">
                              صحيح/خطأ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
                      {question.answers?.map((answer) => (
                        <label
                          key={answer.id}
                          className={`flex items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            responses[question.id] === answer.id
                              ? "border-[#7440E9] bg-gradient-to-r from-[#7440E9]/10 via-[#8B5CF6]/10 to-[#7440E9]/10 shadow-md shadow-[#7440E9]/20"
                              : "border-[#7440E9]/20 hover:border-[#7440E9]/40 hover:bg-[#7440E9]/5 hover:shadow-[#7440E9]/10"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={answer.id}
                            checked={responses[question.id] === answer.id}
                            onChange={() =>
                              handleAnswerSelect(question.id, answer.id)
                            }
                            className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] focus:ring-[#7440E9] mt-0.5 sm:mt-0 flex-shrink-0"
                          />
                          <span
                            className={`flex-1 font-medium text-sm sm:text-base ${
                              responses[question.id] === answer.id
                                ? "text-[#7440E9]"
                                : "text-gray-700"
                            }`}
                          >
                            {answer.answer_text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-[#7440E9]/10 bg-gradient-to-r from-[#F7F6FB] to-white">
            {error && test && (
              <div className="mb-3 sm:mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                <p className="text-red-600 text-xs sm:text-sm font-medium">
                  {error}
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
              <div className="text-xs sm:text-sm font-medium text-[#7440E9]">
                {test?.questions && (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">
                      {
                        Object.values(responses).filter((r) => r !== null)
                          .length
                      }{" "}
                      / {test.questions.length} سؤال مجاب
                    </span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => onClose(false)}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-sm sm:text-base"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || loading}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-[#7440E9]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-sm sm:text-base"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-white border-transparent"></div>
                      <span className="hidden sm:inline">جاري الإرسال...</span>
                      <span className="sm:hidden">جاري...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>إرسال الاختبار</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DailyTestModal;
