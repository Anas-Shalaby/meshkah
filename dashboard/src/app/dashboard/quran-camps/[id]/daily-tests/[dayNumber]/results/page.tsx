// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  BarChart3,
  Eye,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { CampNavigation } from "@/components/quran-camps/CampNavigation";

export default function TestResultsPage() {
  const params = useParams();
  const router = useRouter();
  const campId = Array.isArray(params.id) ? params.id[0] : params.id;
  const dayNumber = parseInt(
    Array.isArray(params.dayNumber) ? params.dayNumber[0] : params.dayNumber
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [attemptDetails, setAttemptDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, [campId, dayNumber]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      if (!campId || !dayNumber) return;
      const response = await dashboardService.getTestStatistics(
        campId,
        dayNumber
      );
      if (response.success) {
        setStatistics(response.data);
      } else {
        setError(response.message || "حدث خطأ في جلب الإحصائيات");
      }
    } catch (err: any) {
      console.error("Error fetching statistics:", err);
      setError(err.message || "حدث خطأ في جلب الإحصائيات");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttemptDetails = async (attemptId: number) => {
    try {
      setLoadingDetails(true);
      const response = await dashboardService.getUserAttemptDetails(attemptId);
      if (response.success) {
        setAttemptDetails(response.data);
        setSelectedAttempt(attemptId);
      } else {
        alert(response.message || "حدث خطأ في جلب تفاصيل المحاولة");
      }
    } catch (err: any) {
      console.error("Error fetching attempt details:", err);
      alert(err.message || "حدث خطأ في جلب تفاصيل المحاولة");
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-primary border-slate-700"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-slate-950">
          <CampNavigation campId={campId} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!statistics) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-slate-950">
          <CampNavigation campId={campId} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center">
              <p className="text-slate-400">لا توجد بيانات</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-950">
        <CampNavigation campId={campId} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Link
                href={`/dashboard/quran-camps/${campId}/daily-tests`}
                className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
                  نتائج الاختبار - اليوم {dayNumber}
                </h1>
                <p className="text-slate-400">{statistics.test.title}</p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">إجمالي المحاولات</div>
                  <div className="text-2xl font-bold text-slate-100">
                    {statistics.statistics.total_attempts}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">متوسط النتيجة</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {statistics.statistics.average_score}%
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">نجح</div>
                  <div className="text-2xl font-bold text-green-400">
                    {statistics.statistics.passed_count}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">نسبة النجاح</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {statistics.statistics.pass_rate}%
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Attempts List */}
          {statistics.attempts && statistics.attempts.length > 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-semibold text-slate-100">
                  قائمة من حلوا الاختبار
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        المستخدم
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        الفوج
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        النتيجة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        النسبة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        التاريخ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {statistics.attempts.map((attempt: any, index: number) => (
                      <motion.tr
                        key={attempt.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-100">
                            {attempt.username}
                          </div>
                          <div className="text-xs text-slate-400">
                            {attempt.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          الفوج {attempt.cohort_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {attempt.score} / {attempt.total_points}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              Number(attempt.percentage || 0) >= 70
                                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                : Number(attempt.percentage || 0) >= 50
                                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                                : "bg-red-500/20 text-red-300 border border-red-500/30"
                            }`}
                          >
                            {Number(attempt.percentage || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {new Date(attempt.submitted_at).toLocaleDateString(
                            "ar-EG",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => fetchAttemptDetails(attempt.id)}
                            disabled={loadingDetails}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#7440E9]/20 text-[#7440E9] border border-[#7440E9]/30 rounded-lg hover:bg-[#7440E9]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Eye className="w-4 h-4" />
                            <span>عرض التفاصيل</span>
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-200 mb-2">
                لا توجد محاولات
              </h3>
              <p className="text-slate-400">
                لم يقم أي مستخدم بحل هذا الاختبار بعد
              </p>
            </div>
          )}

          {/* Attempt Details Modal */}
          {selectedAttempt && attemptDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 rounded-2xl border border-slate-800 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-100 mb-1">
                      تفاصيل إجابات المستخدم
                    </h2>
                    <p className="text-sm text-slate-400">
                      {attemptDetails.test?.title ||
                        "اختبار اليوم " + dayNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAttempt(null);
                      setAttemptDetails(null);
                    }}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Summary */}
                  <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">
                          النتيجة
                        </div>
                        <div className="text-lg font-bold text-slate-100">
                          {attemptDetails.attempt?.score || 0} /{" "}
                          {attemptDetails.attempt?.total_points || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">
                          النسبة
                        </div>
                        <div className="text-lg font-bold text-[#7440E9]">
                          {attemptDetails.attempt?.percentage != null
                            ? Number(attemptDetails.attempt.percentage).toFixed(
                                1
                              )
                            : 0}
                          %
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">
                          تاريخ الإرسال
                        </div>
                        <div className="text-sm text-slate-300">
                          {attemptDetails.attempt?.submitted_at
                            ? new Date(
                                attemptDetails.attempt.submitted_at
                              ).toLocaleDateString("ar-EG", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="space-y-4">
                    {attemptDetails.questions?.map(
                      (question: any, index: number) => {
                        const userResponse = question.user_response;
                        const selectedAnswer = question.answers?.find(
                          (a: any) => a.id === userResponse?.selected_answer_id
                        );
                        const correctAnswer = question.answers?.find(
                          (a: any) => a.is_correct
                        );
                        const isCorrect = userResponse?.is_correct;

                        return (
                          <div
                            key={question.id}
                            className={`p-5 rounded-xl border-2 ${
                              isCorrect
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-red-500/10 border-red-500/30"
                            }`}
                          >
                            <div className="flex items-start gap-3 mb-4">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                  isCorrect
                                    ? "bg-green-500/20 text-green-300"
                                    : "bg-red-500/20 text-red-300"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-base font-semibold text-slate-100 mb-2">
                                  {question.question_text}
                                </h3>
                                <div className="flex items-center gap-3 mb-3">
                                  <span className="text-xs text-slate-400">
                                    {question.points} نقطة
                                  </span>
                                  {userResponse?.points_earned > 0 && (
                                    <span className="text-xs text-green-400">
                                      حصل على {userResponse.points_earned} نقطة
                                    </span>
                                  )}
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      isCorrect
                                        ? "bg-green-500/20 text-green-300"
                                        : "bg-red-500/20 text-red-300"
                                    }`}
                                  >
                                    {isCorrect ? "صحيح" : "خطأ"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Answers */}
                            <div className="space-y-2 mt-4">
                              {question.answers?.map((answer: any) => {
                                const isSelected =
                                  answer.id ===
                                  userResponse?.selected_answer_id;
                                const isCorrectAnswer = answer.is_correct;

                                return (
                                  <div
                                    key={answer.id}
                                    className={`p-3 rounded-lg border ${
                                      isSelected && isCorrectAnswer
                                        ? "bg-green-500/20 border-green-500/50"
                                        : isSelected && !isCorrectAnswer
                                        ? "bg-red-500/20 border-red-500/50"
                                        : isCorrectAnswer
                                        ? "bg-emerald-500/10 border-emerald-500/30"
                                        : "bg-slate-800/50 border-slate-700"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      {isSelected && (
                                        <span
                                          className={`text-xs font-medium ${
                                            isCorrectAnswer
                                              ? "text-green-300"
                                              : "text-red-300"
                                          }`}
                                        >
                                          ✓ إجابتك
                                        </span>
                                      )}
                                      {isCorrectAnswer && !isSelected && (
                                        <span className="text-xs font-medium text-emerald-300">
                                          ✓ الإجابة الصحيحة
                                        </span>
                                      )}
                                      <span className="text-sm text-slate-200 flex-1">
                                        {answer.answer_text}
                                      </span>
                                    </div>
                                    {isCorrectAnswer && answer.explanation && (
                                      <div className="mt-2 p-2 bg-[#7440E9]/10 border border-[#7440E9]/30 rounded-lg text-right">
                                        <div className="text-xs font-semibold text-[#7440E9] mb-1">
                                          التفسير:
                                        </div>
                                        <div className="text-xs text-slate-300">
                                          {answer.explanation}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
