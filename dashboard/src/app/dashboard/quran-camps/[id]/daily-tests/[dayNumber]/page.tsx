// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Save,
  X,
  Plus,
  Trash2,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { CampNavigation } from "@/components/quran-camps/CampNavigation";
import { dashboardService } from "@/services/api";

export default function EditDailyTestPage() {
  const params = useParams();
  const router = useRouter();
  const campId = Array.isArray(params.id) ? params.id[0] : params.id;
  const dayNumber = Array.isArray(params.dayNumber)
    ? params.dayNumber[0]
    : params.dayNumber;

  const isNew = dayNumber === "new";
  const [dayNum, setDayNum] = useState<number | null>(
    isNew ? null : dayNumber ? parseInt(dayNumber) : null
  );

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [testData, setTestData] = useState({
    title: "",
    description: "",
    points: 0,
    is_active: true,
  });

  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (!isNew && dayNum) {
      fetchTest();
    }
  }, [campId, dayNum, isNew]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      if (!campId || !dayNum) return;

      const response = await dashboardService.getDailyTest(campId, dayNum);

      if (response.success) {
        const test = response.data;
        setTestData({
          title: test.title,
          description: test.description || "",
          points: test.points || 0,
          is_active: test.is_active !== undefined ? test.is_active : true,
        });
        setQuestions(
          test.questions?.map((q: any) => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            points: q.points || 1,
            answers:
              q.answers?.map((a: any) => ({
                id: a.id,
                answer_text: a.answer_text,
                is_correct: a.is_correct,
                explanation: a.explanation || "",
              })) || [],
          })) || []
        );
      } else {
        setError(response.message || "حدث خطأ في جلب الاختبار");
      }
    } catch (err: any) {
      console.error("Error fetching test:", err);
      setError(
        err.response?.data?.message || err.message || "حدث خطأ في جلب الاختبار"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!testData.title.trim()) {
      setError("العنوان مطلوب");
      return;
    }

    if (isNew && !dayNum) {
      setError("يجب تحديد رقم اليوم");
      return;
    }

    if (questions.length === 0) {
      setError("يجب إضافة سؤال واحد على الأقل");
      return;
    }

    // Validate questions
    for (const q of questions) {
      if (!q.question_text.trim()) {
        setError("يجب ملء نص السؤال");
        return;
      }
      if (q.answers.length < 2) {
        setError("يجب إضافة خيارين على الأقل لكل سؤال");
        return;
      }
      const hasCorrect = q.answers.some((a) => a.is_correct);
      if (!hasCorrect) {
        setError("يجب تحديد إجابة صحيحة واحدة على الأقل لكل سؤال");
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);

      if (isNew && !dayNum) {
        setError("يجب تحديد رقم اليوم");
        setSaving(false);
        return;
      }

      if (!campId) {
        setError("معرف المخيم غير موجود");
        setSaving(false);
        return;
      }

      const payload = {
        day_number: dayNum!,
        title: testData.title,
        description: testData.description,
        points: testData.points || 0,
        is_active: testData.is_active,
        questions: questions.map((q) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          points: q.points || 1,
          answers: q.answers.map((a) => ({
            answer_text: a.answer_text,
            is_correct: a.is_correct,
            explanation: a.explanation || "",
          })),
        })),
      };

      const response = await dashboardService.createDailyTest(campId, payload);

      if (response.success) {
        router.push(`/dashboard/quran-camps/${campId}/daily-tests`);
      } else {
        setError(response.message || "حدث خطأ في حفظ الاختبار");
      }
    } catch (err: any) {
      console.error("Error saving test:", err);
      setError(err.message || "حدث خطأ في حفظ الاختبار");
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        question_type: "multiple_choice",
        points: 1,
        answers: [
          { answer_text: "", is_correct: false, explanation: "" },
          { answer_text: "", is_correct: false, explanation: "" },
        ],
      },
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const deleteQuestion = (index: number) => {
    if (confirm("هل أنت متأكد من حذف هذا السؤال؟")) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const addAnswer = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].answers.push({
      answer_text: "",
      is_correct: false,
      explanation: "",
    });
    setQuestions(updated);
  };

  const updateAnswer = (
    questionIndex: number,
    answerIndex: number,
    field: string,
    value: any
  ) => {
    const updated = [...questions];
    updated[questionIndex].answers[answerIndex] = {
      ...updated[questionIndex].answers[answerIndex],
      [field]: value,
    };
    setQuestions(updated);
  };

  const deleteAnswer = (questionIndex: number, answerIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].answers = updated[questionIndex].answers.filter(
      (_, i) => i !== answerIndex
    );
    setQuestions(updated);
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

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-950">
        {/* Navigation */}
        <CampNavigation campId={campId} />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  {isNew ? "إضافة اختبار جديد" : `تعديل اختبار اليوم ${dayNum}`}
                </h1>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Test Info */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 mb-6 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">
              معلومات الاختبار
            </h2>
            <div className="space-y-4">
              {isNew && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    رقم اليوم *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dayNum || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        setDayNum(val);
                      } else {
                        setDayNum(null);
                      }
                    }}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder:text-slate-500"
                    placeholder="مثال: 1"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  عنوان الاختبار *
                </label>
                <input
                  type="text"
                  value={testData.title}
                  onChange={(e) =>
                    setTestData({ ...testData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder:text-slate-500"
                  placeholder="مثال: اختبار اليوم الأول"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  وصف الاختبار
                </label>
                <textarea
                  value={testData.description}
                  onChange={(e) =>
                    setTestData({ ...testData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder:text-slate-500 resize-none"
                  placeholder="وصف مختصر للاختبار..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    النقاط الإضافية
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={testData.points}
                    onChange={(e) =>
                      setTestData({
                        ...testData,
                        points: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 mt-8">
                    <input
                      type="checkbox"
                      checked={testData.is_active}
                      onChange={(e) =>
                        setTestData({
                          ...testData,
                          is_active: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-primary rounded focus:ring-primary bg-slate-800 border-slate-700"
                    />
                    <span className="text-sm font-medium text-slate-300">
                      تفعيل الاختبار
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 mb-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-100">الأسئلة</h2>
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سؤال</span>
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((question, qIndex) => (
                <motion.div
                  key={qIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-slate-700 rounded-xl p-6 bg-slate-800/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-100">
                      السؤال {qIndex + 1}
                    </h3>
                    <button
                      onClick={() => deleteQuestion(qIndex)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20 hover:border-red-500/40"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        نص السؤال *
                      </label>
                      <textarea
                        value={question.question_text}
                        onChange={(e) =>
                          updateQuestion(
                            qIndex,
                            "question_text",
                            e.target.value
                          )
                        }
                        rows={2}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder:text-slate-500 resize-none"
                        placeholder="اكتب السؤال هنا..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          نوع السؤال *
                        </label>
                        <select
                          value={question.question_type}
                          onChange={(e) =>
                            updateQuestion(
                              qIndex,
                              "question_type",
                              e.target.value as "multiple_choice" | "true_false"
                            )
                          }
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        >
                          <option value="multiple_choice">
                            اختيار من متعدد
                          </option>
                          <option value="true_false">صحيح/خطأ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          النقاط
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={question.points}
                          onChange={(e) =>
                            updateQuestion(
                              qIndex,
                              "points",
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        />
                      </div>
                    </div>

                    {/* Answers */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-slate-300">
                          خيارات الإجابة *
                        </label>
                        <button
                          onClick={() => addAnswer(qIndex)}
                          className="text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                          + إضافة خيار
                        </button>
                      </div>
                      <div className="space-y-3">
                        {question.answers.map((answer, aIndex) => (
                          <div
                            key={aIndex}
                            className={`rounded-lg p-4 border ${
                              answer.is_correct
                                ? "bg-emerald-500/10 border-emerald-500/30"
                                : "bg-slate-900 border-slate-700"
                            }`}
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={answer.is_correct}
                                onChange={() => {
                                  // Set all answers to false first
                                  const updated = [...questions];
                                  updated[qIndex].answers = updated[
                                    qIndex
                                  ].answers.map((a, i) => ({
                                    ...a,
                                    is_correct: i === aIndex,
                                  }));
                                  setQuestions(updated);
                                }}
                                className="mt-1 w-5 h-5 text-primary focus:ring-primary bg-slate-800 border-slate-700"
                              />
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={answer.answer_text}
                                  onChange={(e) =>
                                    updateAnswer(
                                      qIndex,
                                      aIndex,
                                      "answer_text",
                                      e.target.value
                                    )
                                  }
                                  placeholder="نص الإجابة..."
                                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors mb-2 placeholder:text-slate-500"
                                />
                                {answer.is_correct && (
                                  <textarea
                                    value={answer.explanation}
                                    onChange={(e) =>
                                      updateAnswer(
                                        qIndex,
                                        aIndex,
                                        "explanation",
                                        e.target.value
                                      )
                                    }
                                    placeholder="تفسير الإجابة الصحيحة (من المدير)..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-primary/30 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-primary/10 text-slate-100 placeholder:text-slate-400 resize-none"
                                  />
                                )}
                              </div>
                              {question.answers.length > 2 && (
                                <button
                                  onClick={() => deleteAnswer(qIndex, aIndex)}
                                  className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors border border-red-500/20 hover:border-red-500/40"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {answer.is_correct && (
                              <div className="mt-2 text-xs text-emerald-300 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                <span>هذه هي الإجابة الصحيحة</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {questions.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p>لا توجد أسئلة. اضغط "إضافة سؤال" لبدء الإضافة</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 hover:text-slate-100 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-primary text-white rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-white border-transparent"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>حفظ الاختبار</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
