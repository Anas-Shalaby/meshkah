"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  HelpCircle,
  BookOpen,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { ChipPill } from "@/components/ui/chip-pill";
import { CampNavigation } from "@/components/quran-camps/CampNavigation";

interface CampSummary {
  id: number;
  name: string;
  surah_name: string;
}

interface HelpArticle {
  id: number;
  camp_id: number;
  title: string;
  content: string;
  section_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface HelpFAQ {
  id: number;
  camp_id: number;
  question: string;
  answer: string;
  category: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const SECTION_OPTIONS = [
  { value: "getting-started", label: "البدء في المخيم" },
  { value: "journey-map", label: "خريطة الرحلة" },
  { value: "resources", label: "الموارد التعليمية" },
  { value: "journal", label: "السجل الشخصي" },
  { value: "friends", label: "نظام الصحبة" },
  { value: "study-hall", label: "قاعة التدارس" },
  { value: "general", label: "عام" },
];

export default function CampHelpManagementPage() {
  const params = useParams();
  const router = useRouter();
  const campId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [camp, setCamp] = useState<CampSummary | null>(null);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [faqs, setFaqs] = useState<HelpFAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"articles" | "faq">("articles");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  // Modal states
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(
    null
  );
  const [editingFAQ, setEditingFAQ] = useState<HelpFAQ | null>(null);

  // Form states
  const [articleForm, setArticleForm] = useState({
    title: "",
    content: "",
    section_id: "general",
    display_order: 0,
  });
  const [faqForm, setFaqForm] = useState({
    question: "",
    answer: "",
    category: "",
    display_order: 0,
  });

  useEffect(() => {
    fetchData();
  }, [campId]);

  const fetchData = async () => {
    if (!campId) return;
    try {
      setLoading(true);
      const [campResponse, articlesResponse, faqResponse] = await Promise.all([
        dashboardService.getQuranCampDetails(campId),
        dashboardService.getCampHelpArticles(campId),
        dashboardService.getCampHelpFAQ(campId),
      ]);

      setCamp(campResponse.data ?? null);
      setArticles(articlesResponse.data || []);
      setFaqs(faqResponse.data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArticle = async () => {
    if (!campId) return;
    if (!articleForm.title.trim() || !articleForm.content.trim()) {
      alert("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      if (editingArticle) {
        await dashboardService.updateCampHelpArticle(
          campId,
          editingArticle.id.toString(),
          articleForm
        );
      } else {
        await dashboardService.createCampHelpArticle(campId, articleForm);
      }
      await fetchData();
      setShowArticleModal(false);
      resetArticleForm();
    } catch (error: any) {
      console.error("Error saving article:", error);
      alert("حدث خطأ أثناء حفظ المقال");
    }
  };

  const handleSaveFAQ = async () => {
    if (!campId) return;
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      alert("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      if (editingFAQ) {
        await dashboardService.updateCampHelpFAQ(
          campId,
          editingFAQ.id.toString(),
          faqForm
        );
      } else {
        await dashboardService.createCampHelpFAQ(campId, faqForm);
      }
      await fetchData();
      setShowFAQModal(false);
      resetFAQForm();
    } catch (error: any) {
      console.error("Error saving FAQ:", error);
      alert("حدث خطأ أثناء حفظ السؤال");
    }
  };

  const handleDeleteArticle = async (articleId: number) => {
    if (!campId) return;
    if (!confirm("هل أنت متأكد من حذف هذا المقال؟")) return;

    try {
      await dashboardService.deleteCampHelpArticle(
        campId,
        articleId.toString()
      );
      await fetchData();
    } catch (error: any) {
      console.error("Error deleting article:", error);
      alert("حدث خطأ أثناء حذف المقال");
    }
  };

  const handleDeleteFAQ = async (faqId: number) => {
    if (!campId) return;
    if (!confirm("هل أنت متأكد من حذف هذا السؤال؟")) return;

    try {
      await dashboardService.deleteCampHelpFAQ(campId, faqId.toString());
      await fetchData();
    } catch (error: any) {
      console.error("Error deleting FAQ:", error);
      alert("حدث خطأ أثناء حذف السؤال");
    }
  };

  const resetArticleForm = () => {
    setArticleForm({
      title: "",
      content: "",
      section_id: "general",
      display_order: 0,
    });
    setEditingArticle(null);
  };

  const resetFAQForm = () => {
    setFaqForm({
      question: "",
      answer: "",
      category: "",
      display_order: 0,
    });
    setEditingFAQ(null);
  };

  const openArticleModal = (article?: HelpArticle) => {
    if (article) {
      setEditingArticle(article);
      setArticleForm({
        title: article.title,
        content: article.content,
        section_id: article.section_id || "general",
        display_order: article.display_order,
      });
    } else {
      resetArticleForm();
    }
    setShowArticleModal(true);
  };

  const openFAQModal = (faq?: HelpFAQ) => {
    if (faq) {
      setEditingFAQ(faq);
      setFaqForm({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || "",
        display_order: faq.display_order,
      });
    } else {
      resetFAQForm();
    }
    setShowFAQModal(true);
  };

  // Group articles by section
  const articlesBySection = articles.reduce((acc, article) => {
    const section = article.section_id || "general";
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(article);
    return acc;
  }, {} as Record<string, HelpArticle[]>);

  // Group FAQs by category
  const faqsByCategory = faqs.reduce((acc, faq) => {
    const category = faq.category || "عام";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, HelpFAQ[]>);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-slate-400">جاري التحميل...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/quran-camps/${campId}`}
              className="p-2 hover:bg-slate-800 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                إدارة محتوى المساعدة
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {camp?.name || "المخيم"}
              </p>
            </div>
          </div>
        </div>

        <CampNavigation campId={campId as string} />

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("articles")}
            className={`px-4 py-2 font-medium transition ${
              activeTab === "articles"
                ? "text-primary-100 border-b-2 border-primary-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              مقالات المساعدة
            </div>
          </button>
          <button
            onClick={() => setActiveTab("faq")}
            className={`px-4 py-2 font-medium transition ${
              activeTab === "faq"
                ? "text-primary-100 border-b-2 border-primary-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              الأسئلة الشائعة
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === "articles" ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-100">
                  مقالات المساعدة ({articles.length})
                </h2>
                <button
                  onClick={() => openArticleModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                >
                  <Plus className="w-4 h-4" />
                  إضافة مقال جديد
                </button>
              </div>

              {Object.keys(articlesBySection).length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  لا توجد مقالات بعد. ابدأ بإضافة مقال جديد.
                </div>
              ) : (
                <div className="space-y-4">
                  {SECTION_OPTIONS.map((section) => {
                    const sectionArticles =
                      articlesBySection[section.value] || [];
                    if (sectionArticles.length === 0) return null;

                    const isExpanded = expandedSections.has(section.value);

                    return (
                      <div
                        key={section.value}
                        className="border border-slate-800 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedSections);
                            if (newExpanded.has(section.value)) {
                              newExpanded.delete(section.value);
                            } else {
                              newExpanded.add(section.value);
                            }
                            setExpandedSections(newExpanded);
                          }}
                          className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-100">
                              {section.label}
                            </span>
                            <ChipPill className="bg-primary/20 text-primary-100">
                              {sectionArticles.length}
                            </ChipPill>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="p-4 space-y-3">
                            {sectionArticles
                              .sort((a, b) => a.display_order - b.display_order)
                              .map((article) => (
                                <div
                                  key={article.id}
                                  className="flex items-start justify-between p-4 bg-slate-900 rounded-lg border border-slate-800"
                                >
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-slate-100 mb-1">
                                      {article.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 line-clamp-2">
                                      {article.content}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    <button
                                      onClick={() => openArticleModal(article)}
                                      className="p-2 hover:bg-slate-800 rounded-lg transition"
                                    >
                                      <Edit className="w-4 h-4 text-slate-400" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteArticle(article.id)
                                      }
                                      className="p-2 hover:bg-red-500/20 rounded-lg transition"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-100">
                  الأسئلة الشائعة ({faqs.length})
                </h2>
                <button
                  onClick={() => openFAQModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                >
                  <Plus className="w-4 h-4" />
                  إضافة سؤال جديد
                </button>
              </div>

              {faqs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  لا توجد أسئلة شائعة بعد. ابدأ بإضافة سؤال جديد.
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(faqsByCategory).map(
                    ([category, categoryFaqs]) => {
                      const isExpanded = expandedSections.has(category);

                      return (
                        <div
                          key={category}
                          className="border border-slate-800 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedSections);
                              if (newExpanded.has(category)) {
                                newExpanded.delete(category);
                              } else {
                                newExpanded.add(category);
                              }
                              setExpandedSections(newExpanded);
                            }}
                            className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-slate-100">
                                {category}
                              </span>
                              <ChipPill className="bg-primary/20 text-primary-100">
                                {categoryFaqs.length}
                              </ChipPill>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="p-4 space-y-3">
                              {categoryFaqs
                                .sort(
                                  (a, b) => a.display_order - b.display_order
                                )
                                .map((faq) => (
                                  <div
                                    key={faq.id}
                                    className="p-4 bg-slate-900 rounded-lg border border-slate-800"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <h3 className="font-semibold text-slate-100 flex-1">
                                        {faq.question}
                                      </h3>
                                      <div className="flex items-center gap-2 ml-4">
                                        <button
                                          onClick={() => openFAQModal(faq)}
                                          className="p-2 hover:bg-slate-800 rounded-lg transition"
                                        >
                                          <Edit className="w-4 h-4 text-slate-400" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteFAQ(faq.id)
                                          }
                                          className="p-2 hover:bg-red-500/20 rounded-lg transition"
                                        >
                                          <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                      </div>
                                    </div>
                                    <p className="text-sm text-slate-400">
                                      {faq.answer}
                                    </p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Article Modal */}
        {showArticleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-800">
              <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <h2 className="text-xl font-bold text-slate-100">
                  {editingArticle ? "تعديل المقال" : "إضافة مقال جديد"}
                </h2>
                <button
                  onClick={() => {
                    setShowArticleModal(false);
                    resetArticleForm();
                  }}
                  className="p-2 hover:bg-slate-800 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    العنوان *
                  </label>
                  <input
                    type="text"
                    value={articleForm.title}
                    onChange={(e) =>
                      setArticleForm({ ...articleForm, title: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="عنوان المقال"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    القسم
                  </label>
                  <select
                    value={articleForm.section_id}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        section_id: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {SECTION_OPTIONS.map((section) => (
                      <option key={section.value} value={section.value}>
                        {section.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    المحتوى *
                  </label>
                  <textarea
                    value={articleForm.content}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        content: e.target.value,
                      })
                    }
                    rows={10}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="محتوى المقال..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    ترتيب العرض
                  </label>
                  <input
                    type="number"
                    value={articleForm.display_order}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        display_order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowArticleModal(false);
                    resetArticleForm();
                  }}
                  className="px-4 py-2 text-slate-300 hover:text-slate-100 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveArticle}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  حفظ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Modal */}
        {showFAQModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-800">
              <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <h2 className="text-xl font-bold text-slate-100">
                  {editingFAQ ? "تعديل السؤال" : "إضافة سؤال جديد"}
                </h2>
                <button
                  onClick={() => {
                    setShowFAQModal(false);
                    resetFAQForm();
                  }}
                  className="p-2 hover:bg-slate-800 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    السؤال *
                  </label>
                  <input
                    type="text"
                    value={faqForm.question}
                    onChange={(e) =>
                      setFaqForm({ ...faqForm, question: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="السؤال..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    الإجابة *
                  </label>
                  <textarea
                    value={faqForm.answer}
                    onChange={(e) =>
                      setFaqForm({ ...faqForm, answer: e.target.value })
                    }
                    rows={6}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="الإجابة..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    التصنيف
                  </label>
                  <input
                    type="text"
                    value={faqForm.category}
                    onChange={(e) =>
                      setFaqForm({ ...faqForm, category: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="مثال: التسجيل، المهام، إلخ..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    ترتيب العرض
                  </label>
                  <input
                    type="number"
                    value={faqForm.display_order}
                    onChange={(e) =>
                      setFaqForm({
                        ...faqForm,
                        display_order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowFAQModal(false);
                    resetFAQForm();
                  }}
                  className="px-4 py-2 text-slate-300 hover:text-slate-100 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveFAQ}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  حفظ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
