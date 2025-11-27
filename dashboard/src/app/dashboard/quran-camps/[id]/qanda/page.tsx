// @ts-nocheck
"use client";

import { useState, useEffect, useMemo, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import {
  MessageSquare,
  Send,
  Trash2,
  CheckCircle2,
  User,
  X,
  Clock,
  AlertCircle,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { ChipPill } from "@/components/ui/chip-pill";
import { StatCard } from "@/components/ui/stat-card";

interface QandAItem {
  id: number;
  question: string;
  answer: string | null;
  is_answered: boolean;
  created_at: string;
  answered_at: string | null;
  author: string;
  avatar_url: string | null;
}

interface CampSummary {
  id: number;
  name: string;
  surah_name: string;
  duration_days?: number;
  updated_at?: string;
}

interface ModalProps {
  title?: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}

const Modal = ({
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
}: ModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleContentClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const maxWidth = size === "lg" ? "max-w-4xl" : "max-w-2xl";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl`}
        onClick={handleContentClick}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {title ? (
              <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          {children}
        </div>
        {footer ? (
          <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body
  );
};

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getAvatarUrl = (avatarUrl: string | null) => {
  if (!avatarUrl) return "/default-avatar.png";
  if (avatarUrl.startsWith("http")) return avatarUrl;
  return `/uploads/${avatarUrl}`;
};

export default function CampQandAPage() {
  const params = useParams();
  const campId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [camp, setCamp] = useState<CampSummary | null>(null);
  const [qanda, setQanda] = useState<QandAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answeringQuestionId, setAnsweringQuestionId] = useState<number | null>(
    null
  );
  const [answerText, setAnswerText] = useState("");
  const [showAnswerModal, setShowAnswerModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!campId) return;
      try {
        const [campResponse, qandaResponse] = await Promise.all([
          dashboardService.getQuranCampDetails(campId),
          dashboardService.getCampQandA(campId),
        ]);

        setCamp(campResponse.data?.data ?? null);
        setQanda(qandaResponse.data || []);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل البيانات");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (campId) {
      fetchData();
    }
  }, [campId]);

  const handleAnswerQuestion = async (questionId: number) => {
    if (!campId || !answerText.trim()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await dashboardService.answerCampQuestion(String(questionId), answerText);

      const qandaResponse = await dashboardService.getCampQandA(campId);
      setQanda(qandaResponse.data || []);

      setAnswerText("");
      setAnsweringQuestionId(null);
      setShowAnswerModal(false);
    } catch (err) {
      console.error("Error answering question:", err);
      setError("حدث خطأ في إضافة الإجابة");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!campId || !confirm("هل أنت متأكد من حذف هذا السؤال؟")) return;

    try {
      setSaving(true);
      setError(null);
      await dashboardService.deleteCampQuestion(String(questionId));
      const qandaResponse = await dashboardService.getCampQandA(campId);
      setQanda(qandaResponse.data || []);
    } catch (err) {
      console.error("Error deleting question:", err);
      setError("حدث خطأ في حذف السؤال");
    } finally {
      setSaving(false);
    }
  };

  const openAnswerModal = (questionId: number) => {
    setAnsweringQuestionId(questionId);
    setAnswerText("");
    setShowAnswerModal(true);
  };

  const closeAnswerModal = () => {
    setShowAnswerModal(false);
    setAnsweringQuestionId(null);
    setAnswerText("");
  };

  const unansweredQuestions = useMemo(
    () => qanda.filter((q) => !q.is_answered),
    [qanda]
  );
  const answeredQuestions = useMemo(
    () => qanda.filter((q) => q.is_answered),
    [qanda]
  );

  const latestQuestionDate = useMemo(() => {
    if (!qanda.length) return null;
    const timestamps = qanda.map((q) => new Date(q.created_at).getTime());
    return new Date(Math.max(...timestamps));
  }, [qanda]);

  const latestAnswerDate = useMemo(() => {
    const answered = qanda.filter((q) => q.answered_at);
    if (!answered.length) return null;
    const timestamps = answered.map((q) => new Date(q.answered_at!).getTime());
    return new Date(Math.max(...timestamps));
  }, [qanda]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-800 border-t-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!camp) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
          {error || "المخيم غير موجود"}
        </div>
      </DashboardLayout>
    );
  }

  const answerModal =
    showAnswerModal && answeringQuestionId ? (
      <Modal
        title="إضافة إجابة"
        description="اكتب إجابتك على السؤال المطروح"
        onClose={closeAnswerModal}
        size="lg"
        footer={
          <>
            <button
              onClick={closeAnswerModal}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              onClick={() => handleAnswerQuestion(answeringQuestionId)}
              disabled={saving || !answerText.trim()}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-4 py-2 text-sm font-medium text-primary-100 transition hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-100" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {saving ? "جاري الإرسال..." : "إرسال الإجابة"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {(() => {
            const question = qanda.find((q) => q.id === answeringQuestionId);
            if (!question) return null;
            return (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-200">
                    {question.author || "مشارك مجهول"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDate(question.created_at)}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{question.question}</p>
              </div>
            );
          })()}
          <label className="block space-y-2 text-sm text-slate-300">
            <span>نص الإجابة</span>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              rows={6}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="اكتب إجابتك هنا..."
            />
          </label>
        </div>
      </Modal>
    ) : null;

  const navigation = [
    { href: `/dashboard/quran-camps/${campId}`, label: "نظرة عامة" },
    { href: `/dashboard/quran-camps/${campId}/tasks`, label: "المهام اليومية" },
    { href: `/dashboard/quran-camps/${campId}/resources`, label: "الموارد" },
    {
      href: `/dashboard/quran-camps/${campId}/qanda`,
      label: "الأسئلة والأجوبة",
      active: true,
    },
    {
      href: `/dashboard/quran-camps/${campId}/participants`,
      label: "المشتركين",
    },
    { href: `/dashboard/quran-camps/${campId}/analytics`, label: "التحليلات" },
    { href: `/dashboard/quran-camps/${campId}/settings`, label: "الإعدادات" },
  ];

  return (
    <>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
          <ActionToolbar
            title="الأسئلة والأجوبة"
            subtitle={`سورة ${camp.surah_name} • ${camp.name}`}
            meta={
              <div className="flex flex-wrap items-center gap-2">
                <ChipPill
                  variant="neutral"
                  className="border border-amber-500/40 bg-amber-500/10 text-amber-200"
                >
                  {unansweredQuestions.length.toLocaleString("ar-EG")} بدون
                  إجابة
                </ChipPill>
                <ChipPill
                  variant="neutral"
                  className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                >
                  {answeredQuestions.length.toLocaleString("ar-EG")} تم الإجابة
                </ChipPill>
              </div>
            }
            secondaryActions={
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/quran-camps/${campId}`}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  العودة للتفاصيل
                </Link>
                <Link
                  href={`/dashboard/quran-camps/${campId}/study-hall`}
                  className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-900/30 px-4 py-2 text-sm font-medium text-purple-100 transition hover:bg-purple-800/40"
                >
                  <BookOpen className="h-4 w-4" />
                  إدارة قاعة التدارس
                </Link>
              </div>
            }
            endSlot={
              latestQuestionDate ? (
                <ChipPill
                  variant="neutral"
                  className="gap-2 border border-slate-700 bg-slate-900 text-slate-300"
                >
                  <Clock className="h-4 w-4 text-primary-100" />
                  آخر سؤال {formatDate(latestQuestionDate.toISOString())}
                </ChipPill>
              ) : null
            }
          />

          {error ? (
            <div className="rounded-3xl border border-rose-900/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="إجمالي الأسئلة"
              value={qanda.length.toLocaleString("ar-EG")}
              description="جميع الأسئلة المطروحة من المشاركين"
              icon={<MessageSquare className="h-6 w-6 text-primary-100" />}
              delta={{
                value: `${answeredQuestions.length} مجابة`,
                trend: answeredQuestions.length > 0 ? "up" : "neutral",
              }}
            />
            <StatCard
              label="بدون إجابة"
              value={unansweredQuestions.length.toLocaleString("ar-EG")}
              description="تحتاج إلى متابعة فورية"
              icon={<AlertCircle className="h-6 w-6 text-amber-200" />}
              variant="attention"
              delta={{
                value:
                  unansweredQuestions.length > 0
                    ? "يحتاج متابعة"
                    : "كلها مجابة",
                trend: unansweredQuestions.length > 0 ? "down" : "up",
              }}
            />
            <StatCard
              label="تم الإجابة"
              value={answeredQuestions.length.toLocaleString("ar-EG")}
              description="أسئلة تم الرد عليها"
              icon={<CheckCircle2 className="h-6 w-6 text-emerald-200" />}
              variant="positive"
              delta={{
                value: latestAnswerDate
                  ? formatDate(latestAnswerDate.toISOString())
                  : "—",
                trend: "up",
              }}
            />
            <StatCard
              label="معدل الإجابة"
              value={
                qanda.length > 0
                  ? `${Math.round(
                      (answeredQuestions.length / qanda.length) * 100
                    )}%`
                  : "—"
              }
              description="نسبة الأسئلة المجابة"
              icon={<CheckCircle2 className="h-6 w-6 text-cyan-200" />}
            />
          </section>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 shadow-lg">
            <nav className="flex flex-wrap items-center gap-3 px-6 py-4">
              {navigation.map((item) =>
                item.active ? (
                  <ChipPill
                    key={item.href}
                    variant="default"
                    className="border border-primary/40 bg-primary/20 text-primary-100"
                  >
                    {item.label}
                  </ChipPill>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>
          </div>

          {qanda.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 px-8 py-16 text-center">
              <MessageSquare className="h-12 w-12 text-slate-500" />
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-100">
                  لا توجد أسئلة حتى الآن
                </p>
                <p className="text-sm text-slate-400">
                  سيتم عرض الأسئلة هنا عندما يطرحها المستخدمون
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {unansweredQuestions.length > 0 && (
                <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                  <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-100">
                        الأسئلة بدون إجابة
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {unansweredQuestions.length.toLocaleString("ar-EG")}{" "}
                        سؤال يحتاج إلى متابعة
                      </p>
                    </div>
                    <ChipPill
                      variant="neutral"
                      className="border border-amber-500/40 bg-amber-500/10 text-amber-200"
                    >
                      {unansweredQuestions.length}
                    </ChipPill>
                  </header>
                  <div className="space-y-3">
                    {unansweredQuestions.map((item) => (
                      <article
                        key={item.id}
                        className="group rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-amber-500/40 hover:bg-slate-900/80"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {item.avatar_url ? (
                              <img
                                src={getAvatarUrl(item.avatar_url)}
                                alt={item.author}
                                className="h-10 w-10 rounded-full border border-slate-700"
                                onError={(e) => {
                                  e.currentTarget.src = "/default-avatar.png";
                                }}
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
                                <User className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-100">
                                {item.author || "مشارك مجهول"}
                              </span>
                              <span className="text-xs text-slate-500">
                                {formatDate(item.created_at)}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-300">
                              {item.question}
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openAnswerModal(item.id)}
                                className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-4 py-2 text-xs font-medium text-primary-100 transition hover:bg-primary/30"
                              >
                                <Send className="h-3.5 w-3.5" />
                                إجابة
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(item.id)}
                                className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                حذف
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {answeredQuestions.length > 0 && (
                <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                  <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-100">
                        الأسئلة المجابة
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {answeredQuestions.length.toLocaleString("ar-EG")} سؤال
                        تم الرد عليه
                      </p>
                    </div>
                    <ChipPill
                      variant="neutral"
                      className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    >
                      {answeredQuestions.length}
                    </ChipPill>
                  </header>
                  <div className="space-y-3">
                    {answeredQuestions.map((item) => (
                      <article
                        key={item.id}
                        className="group rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-emerald-500/40 hover:bg-slate-900/80"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {item.avatar_url ? (
                              <img
                                src={getAvatarUrl(item.avatar_url)}
                                alt={item.author}
                                className="h-10 w-10 rounded-full border border-slate-700"
                                onError={(e) => {
                                  e.currentTarget.src = "/default-avatar.png";
                                }}
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
                                <User className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-100">
                                {item.author || "مشارك مجهول"}
                              </span>
                              <span className="text-xs text-slate-500">
                                {formatDate(item.created_at)}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-300">
                              {item.question}
                            </p>
                            <div className="rounded-xl border-r-4 border-emerald-500/60 bg-emerald-500/5 p-4">
                              <div className="mb-2 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                <span className="text-xs font-medium text-emerald-200">
                                  إجابة المشرف
                                </span>
                                {item.answered_at ? (
                                  <span className="text-xs text-slate-500">
                                    • {formatDate(item.answered_at)}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-sm leading-relaxed text-slate-200">
                                {item.answer}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteQuestion(item.id)}
                              className="inline-flex items-center gap-2 text-xs text-rose-300 transition hover:text-rose-200"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              حذف السؤال
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>

      {answerModal}
    </>
  );
}
