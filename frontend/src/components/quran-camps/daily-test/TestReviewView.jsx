import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, BookOpen, Award } from "lucide-react";
import axios from "axios";

const TestReviewView = ({ campId, dayNumber, onClose }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [campId, dayNumber]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/quran-camps/${campId}/daily-tests/${dayNumber}/results`,
        {
          headers: { "x-auth-token": token },
        }
      );

      if (response.data.success) {
        setResults(response.data.data);
      } else {
        setError("لم يتم حل هذا الاختبار بعد");
      }
    } catch (err) {
      console.error("Error fetching test results:", err);
      setError(err.response?.data?.message || "حدث خطأ أثناء جلب النتائج");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-[#7440E9] border-gray-200"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 text-lg mb-4">{error}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#7440E9] text-white rounded-xl hover:shadow-lg transition-all"
          >
            إغلاق
          </button>
        )}
      </div>
    );
  }

  if (!results) return null;

  const { attempt, test, questions } = results;
  const percentage = parseFloat(attempt.percentage);
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Results Summary */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#7440E9] to-[#8B5CF6] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl shadow-[#7440E9]/30 text-white"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl sm:text-2xl font-bold mb-1">
              مراجعة الاختبار
            </h3>
            <p className="text-purple-100 text-xs sm:text-sm truncate">
              {test.title}
            </p>
            <p className="text-purple-200 text-xs mt-1">
              تم الإرسال في:{" "}
              {new Date(attempt.submitted_at).toLocaleDateString("ar-SA")}
            </p>
          </div>
          <div className="text-right sm:text-left flex-shrink-0">
            <div className="text-3xl sm:text-4xl font-bold">
              {percentage.toFixed(0)}%
            </div>
            <div className="text-xs sm:text-sm text-purple-100 mt-1">
              {attempt.score} / {attempt.total_points} نقطة
            </div>
          </div>
        </div>

        <div className="w-full bg-white/20 rounded-full h-3 sm:h-4 overflow-hidden backdrop-blur-sm border border-white/30">
          <div
            className={`h-full rounded-full shadow-lg ${
              percentage >= 70
                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                : percentage >= 50
                ? "bg-gradient-to-r from-white to-purple-100 border border-[#7440E9]/30"
                : "bg-gradient-to-r from-red-500 to-pink-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </motion.div>

      {/* Questions with Answers */}
      <div className="space-y-3 sm:space-y-4">
        {questions?.map((question, index) => {
          const userResponse = question.user_response;
          const selectedAnswer = question.answers?.find(
            (a) => a.id === userResponse?.selected_answer_id
          );
          const correctAnswer = question.answers?.find((a) => a.is_correct);
          const isCorrect = userResponse?.is_correct;

          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-white to-[#F7F6FB] rounded-xl p-4 sm:p-6 border-2 border-[#7440E9]/20 shadow-md"
            >
              {/* Question Header */}
              <div className="flex items-start gap-3 sm:gap-4 mb-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#7440E9] to-[#8B5CF6] text-white rounded-lg sm:rounded-xl flex items-center justify-center font-bold shadow-lg shadow-[#7440E9]/30 text-sm sm:text-base">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex-1">
                      {question.question_text}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-[#7440E9]/10 border border-[#7440E9]/20 rounded-lg">
                      <span className="text-xs sm:text-sm font-semibold text-[#7440E9]">
                        قيمة السؤال:
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#7440E9]">
                        {question.points} نقطة
                      </span>
                    </div>
                    {userResponse?.points_earned !== undefined &&
                      userResponse.points_earned > 0 && (
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-green-100 border border-green-300 rounded-lg">
                          <span className="text-xs sm:text-sm font-semibold text-green-700">
                            النقاط المحصلة:
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-green-700">
                            {userResponse.points_earned} نقطة
                          </span>
                        </div>
                      )}
                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                        isCorrect
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-red-100 text-red-700 border border-red-300"
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          صحيح
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          خطأ
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Answers */}
              <div className="space-y-2.5 sm:space-y-3">
                {question.answers?.map((answer) => {
                  const isSelected =
                    answer.id === userResponse?.selected_answer_id;
                  const isCorrectAnswer =
                    Boolean(answer.is_correct) || answer.is_correct === 1;
                  const showAsWrong = isSelected && !isCorrectAnswer;

                  return (
                    <div
                      key={answer.id}
                      className={`relative p-3.5 sm:p-4 rounded-xl border-2 transition-all ${
                        isCorrectAnswer
                          ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md shadow-green-200/40"
                          : showAsWrong
                          ? "border-red-500 bg-gradient-to-br from-red-50 to-pink-50 shadow-md shadow-red-200/40"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center ${
                            isCorrectAnswer
                              ? "bg-green-500 text-white"
                              : showAsWrong
                              ? "bg-red-500 text-white"
                              : "bg-gray-200"
                          }`}
                        >
                          {isCorrectAnswer ? (
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : showAsWrong ? (
                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-gray-400" />
                          )}
                        </div>

                        {/* Answer Text */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium text-sm sm:text-base leading-relaxed ${
                              isCorrectAnswer
                                ? "text-green-800"
                                : showAsWrong
                                ? "text-red-800"
                                : "text-gray-700"
                            }`}
                          >
                            {answer.answer_text &&
                            answer.answer_text !== 0 &&
                            answer.answer_text !== "0" &&
                            String(answer.answer_text).trim()
                              ? String(answer.answer_text)
                              : ""}
                          </p>

                          {/* Explanation */}
                        </div>
                      </div>
                      {isCorrectAnswer && answer.explanation && (
                        <div className="mt-3 p-3 sm:p-4 bg-gradient-to-br from-[#7440E9]/10 via-[#8B5CF6]/10 to-[#7440E9]/10 border-2 border-[#7440E9]/30 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs sm:text-sm font-semibold text-[#7440E9]">
                              التفسير:
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed pr-2">
                            {answer.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Final Message */}
      {percentage >= 70 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center shadow-2xl shadow-green-500/30"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            className="flex justify-center"
          >
            <Award className="w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-3" />
          </motion.div>
          <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
            ممتاز! 🎉
          </h3>
          <p className="text-sm sm:text-base text-green-50">
            لقد أتممت الاختبار بنجاح. استمر في التقدم!
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default TestReviewView;
