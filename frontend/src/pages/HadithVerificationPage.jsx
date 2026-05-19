import React, { useState } from "react";
import {
  Search,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import "../styles/animations.css";
import SEO from "../components/SEO";
import { useTheme } from "../context/ThemeContext";
import { getDashboardTheme } from "../components/home/dashboardTheme";

const HadithVerificationPage = () => {
  const { isNight } = useTheme();
  const t = getDashboardTheme(isNight);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("search");
  const [showEducationalPath, setShowEducationalPath] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [flippedCard, setFlippedCard] = useState(null);

  // Educational steps data
  const educationalSteps = [
    {
      id: 0,
      title: "ما هو علم الحديث؟",
      icon: "🎯",
      content:
        "علم الحديث هو العلم الذي يبحث في سند الحديث ومتنه لمعرفة المقبول من المردود. وهو من أهم العلوم الشرعية لأنه يتعلق بصحة الأحاديث النبوية.",
      color: "blue",
    },
    {
      id: 1,
      title: "صحيح",
      icon: "✅",
      content:
        "الحديث الصحيح هو الحديث الذي اتصل سنده بنقل العدل الضابط عن مثله إلى منتهاه، من غير شذوذ ولا علة. يمكن الاستدلال به في الأحكام الشرعية.",
      color: "green",
    },
    {
      id: 2,
      title: "حسن",
      icon: "🔵",
      content:
        "الحديث الحسن هو الحديث الذي اتصل سنده بنقل العدل خفيف الضبط عن مثله إلى منتهاه، من غير شذوذ ولا علة. يمكن الاستدلال به مع بعض التحفظات.",
      color: "blue",
    },
    {
      id: 3,
      title: "ضعيف",
      icon: "⚠️",
      content:
        "الحديث الضعيف هو الحديث الذي لم يجمع صفة الحسن، أي لم تتوفر فيه شروط الحديث الصحيح أو الحسن. لا يُستدل به في الأحكام الشرعية.",
      color: "yellow",
    },
    {
      id: 4,
      title: "موضوع",
      icon: "🚫",
      content:
        "الحديث الموضوع هو الحديث المكذوب المنسوب إلى النبي صلى الله عليه وسلم، وهو أشد أنواع الأحاديث ضعفاً. لا يجوز الاستدلال به إطلاقاً.",
      color: "red",
    },
    {
      id: 5,
      title: "أشهر الكتب",
      icon: "📚",
      content:
        "أشهر كتب الحديث: صحيح البخاري (أصح كتاب بعد القرآن)، صحيح مسلم (ثاني أصح كتاب)، سنن الترمذي والنسائي (من السنن الأربعة).",
      color: "purple",
    },
  ];

  // Navigation functions
  const nextStep = () => {
    if (currentStep < educationalSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setFlippedCard(null);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setFlippedCard(null);
    }
  };

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
    setFlippedCard(null);
  };

  const resetEducationalPath = () => {
    setCurrentStep(0);
    setFlippedCard(null);
    setShowEducationalPath(false);
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/hadith-verification/search?text=${encodeURIComponent(
          searchText,
        )}&source=dorar`,
      );
      const data = await response.json();

      if (data.success) {
        // الباك إند الجديد يرجع البيانات مباشرة تحت data
        setResults({ data: data.data });
      } else {
        setError(data.message || "حدث خطأ أثناء البحث");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!searchText.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/hadith-verification/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: searchText }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // الباك إند الجديد يرجع البيانات مباشرة تحت data
        setResults({ data: data.data });
        setActiveTab("verify");
      } else {
        setError(data.message || "حدث خطأ أثناء التحقق");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeIcon = (grade) => {
    const gradeLower = grade.toLowerCase();
    if (gradeLower.includes("صحيح")) {
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    } else if (gradeLower.includes("حسن")) {
      return <CheckCircle className="w-6 h-6 text-blue-600" />;
    } else if (gradeLower.includes("ضعيف")) {
      return <AlertCircle className="w-6 h-6 text-yellow-600" />;
    } else if (gradeLower.includes("موضوع") || gradeLower.includes("مكذوب")) {
      return <XCircle className="w-6 h-6 text-red-600" />;
    } else if (gradeLower.includes("واه") || gradeLower.includes("واهي")) {
      return <XCircle className="w-6 h-6 text-red-600" />;
    } else if (gradeLower.includes("قوي")) {
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    } else {
      return <AlertCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getGradeColor = (grade) => {
    const gradeLower = grade.toLowerCase();
    if (gradeLower.includes("صحيح")) {
      return "bg-green-100 text-green-800 border-green-300";
    } else if (gradeLower.includes("حسن")) {
      return "bg-blue-100 text-blue-800 border-blue-300";
    } else if (gradeLower.includes("ضعيف")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    } else if (gradeLower.includes("موضوع") || gradeLower.includes("مكذوب")) {
      return "bg-red-100 text-red-800 border-red-300";
    } else if (gradeLower.includes("واه") || gradeLower.includes("واهي")) {
      return "bg-red-100 text-red-800 border-red-300";
    } else if (gradeLower.includes("قوي")) {
      return "bg-green-100 text-green-800 border-green-300";
    } else {
      return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getGradeBadge = (grade, confidence) => {
    const gradeLower = grade.toLowerCase();
    let badgeClass = "";
    let badgeText = grade;

    if (gradeLower.includes("صحيح")) {
      badgeClass =
        "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg";
    } else if (gradeLower.includes("حسن")) {
      badgeClass =
        "bg-gradient-to-r from-[#7440E9] to-[#B794F6] text-white shadow-lg";
    } else if (gradeLower.includes("ضعيف")) {
      badgeClass =
        "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg";
    } else if (gradeLower.includes("موضوع") || gradeLower.includes("مكذوب")) {
      badgeClass =
        "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg";
    } else if (gradeLower.includes("واه") || gradeLower.includes("واهي")) {
      badgeClass =
        "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg";
    } else if (gradeLower.includes("قوي")) {
      badgeClass =
        "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg";
    } else {
      badgeClass =
        "bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg";
    }

    return (
      <div
        className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-2xl font-bold ${badgeClass} transform hover:scale-105 transition-all duration-300`}
      >
        <div className="text-3xl"></div>
        <span>{badgeText}</span>
        {confidence === "high" && (
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-sm">✓</span>
          </div>
        )}
      </div>
    );
  };

  // Get grade colors for primary grade badge
  const getGradeColors = (grade) => {
    const gradeLower = grade.toLowerCase();

    if (gradeLower.includes("صحيح")) {
      return "bg-gradient-to-r from-green-500 to-emerald-600";
    } else if (gradeLower.includes("حسن")) {
      return "bg-gradient-to-r from-blue-500 to-indigo-600";
    } else if (gradeLower.includes("ضعيف")) {
      return "bg-gradient-to-r from-yellow-500 to-orange-500";
    } else if (gradeLower.includes("موضوع") || gradeLower.includes("مكذوب")) {
      return "bg-gradient-to-r from-red-500 to-pink-600";
    } else if (gradeLower.includes("واه") || gradeLower.includes("واهي")) {
      return "bg-gradient-to-r from-red-500 to-pink-600";
    } else if (gradeLower.includes("قوي")) {
      return "bg-gradient-to-r from-green-500 to-emerald-600";
    } else {
      return "bg-gradient-to-r from-gray-500 to-slate-600";
    }
  };

  return (
    <div className={`min-h-screen font-[Cairo,Amiri,sans-serif] ${t.page}`}>
      <SEO
        title="التحقق من صحة الأحاديث - مشكاة الأحاديث"
        description="تحقق من صحة الأحاديث النبوية الشريفة ومعرفة درجتها (صحيح، حسن، ضعيف، موضوع)"
        keywords="تحقق من الحديث, صحة الحديث, علم الحديث, حديث صحيح, حديث حسن, حديث ضعيف, حديث موضوع"
        canonicalUrl={`${window.location.origin}/hadith-verification`}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div
            className={`mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl shadow-2xl sm:h-24 sm:w-24 ${t.iconBox}`}
          >
            <CheckCircle className="h-10 w-10 text-white sm:h-12 sm:w-12" />
          </div>
          <h1
            className={`mb-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl ${t.textHeading}`}
          >
            فاحص الأحاديث
          </h1>
          <p
            className={`mx-auto max-w-3xl text-lg leading-relaxed sm:text-xl ${t.textBody}`}
          >
            أدخل نص الحديث وسنحدد لك درجته بدقة من خلال مصادر موثوقة ومعتمدة
          </p>
        </div>

        {/* Search Form */}
        <div className={`mb-8 sm:mb-12 ${t.panel}`}>
          <div className="space-y-6">
            <div className="mb-6 text-center">
              <h2
                className={`mb-2 text-2xl font-bold sm:text-3xl ${t.textHeading}`}
              >
                ابدأ رحلة الاكتشاف
              </h2>
              <p className={t.textBody}>
                انسخ الحديث من أي مصدر واتركنا نكشف لك الحقيقة
              </p>
            </div>
            <div className="relative">
              <textarea
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="📝 أدخل نص الحديث هنا... مثال: قال رسول الله صلى الله عليه وسلم..."
                className={t.textarea}
                rows="4"
                onKeyPress={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleVerify()
                }
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {searchText.length}/500
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleVerify}
                disabled={isLoading || !searchText.trim()}
                className={`group relative flex w-full items-center justify-center gap-3 rounded-2xl px-8 py-4 text-lg font-bold shadow-lg transition-all duration-300 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none sm:w-auto transform hover:scale-105 ${t.primaryBtn}`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري التحقق...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    تحقق من الحديث
                  </div>
                )}
              </button>
              {searchText.trim() && (
                <button
                  onClick={() => setSearchText("")}
                  className={`px-4 py-2 text-sm transition-colors ${t.textMuted} ${isNight ? "hover:text-zinc-200" : "hover:text-gray-700"}`}
                >
                  مسح النص
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 text-center">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            {error}
          </div>
        )}

        {results?.data?.verificationSummary && (
          <div className="space-y-8">
            {/* Primary Grade Result - Clean and Simple */}
            {results.data.verificationSummary.primaryGrade && (
              <motion.div className={`text-center ${t.panel}`}>
                <div className="mb-6">
                  <div
                    className={`mb-6 flex items-center justify-center gap-3 text-2xl font-bold sm:text-3xl ${t.textHeading}`}
                  >
                    <span className="text-3xl">🎯</span>
                    حكم الحديث
                  </div>

                  {/* Primary Grade Badge */}
                  <div className="transform hover:scale-105 transition-transform duration-300 mb-6">
                    <div
                      className={`inline-flex items-center gap-3 ${getGradeColors(
                        results.data.verificationSummary.primaryGrade,
                      )} text-white px-8 py-4 rounded-2xl text-2xl font-bold shadow-lg`}
                    >
                      {results.data.verificationSummary.primaryGrade}
                    </div>
                  </div>

                  {/* Source and Rawi Info */}
                  {results?.data?.dorar?.data?.length > 0 && (
                    <div className={t.innerPanel}>
                      <div className="space-y-3">
                        {results.data.dorar.data[0].book && (
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-sm font-bold ${t.textAccent}`}
                            >
                              الكتاب:
                            </span>
                            <span
                              className={`text-sm font-medium ${t.textBody}`}
                            >
                              {results.data.dorar.data[0].book}
                            </span>
                          </div>
                        )}
                        {results.data.dorar.data[0].rawi && (
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-sm font-bold ${t.textAccent}`}
                            >
                              الراوي:
                            </span>
                            <span
                              className={`text-sm font-medium ${t.textBody}`}
                            >
                              {results.data.dorar.data[0].rawi}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Show results directly from Dorar data */}
            {results?.data?.dorar?.data?.length > 0 && (
              <div className={t.panel}>
                <div
                  className={`mb-6 flex items-center justify-center gap-3 text-center text-2xl font-bold sm:text-3xl ${t.textHeading}`}
                >
                  <span className="text-3xl">📚</span>
                  تفاصيل النتائج
                </div>

                {/* Show multiple results */}
                {results.data.dorar.data.slice(0, 3).map((hadith, index) => (
                  <div key={index} className={`mb-6 ${t.innerPanel}`}>
                    {/* Result Header */}
                    <div className="text-center mb-4">
                      <div
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white ${isNight ? "bg-[#5b4d6f]" : "bg-[#7440E9]"}`}
                      >
                        <span>📖</span>
                        النتيجة {index + 1}
                      </div>
                    </div>

                    {/* Hadith Text */}
                    <div className="mb-6 text-center">
                      {/* Rawi Name */}
                      {hadith.rawi && (
                        <div className="mb-4">
                          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold border border-green-200">
                            <span>👤</span>
                            الراوي: {hadith.rawi}
                          </div>
                        </div>
                      )}

                      {/* Hadith Text */}
                      <p
                        className={`text-lg font-bold leading-relaxed sm:text-xl lg:text-2xl ${t.textHeading}`}
                        style={{ fontFamily: "Amiri, serif" }}
                      >
                        {hadith.hadith}
                      </p>
                    </div>

                    {/* Quick Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {hadith.muhaddith && (
                        <div
                          className={`rounded-xl border p-4 ${isNight ? "border-white/10 bg-[#34343a]" : "border-gray-200 bg-white"}`}
                        >
                          <div
                            className={`mb-2 text-sm font-bold ${t.textAccent}`}
                          >
                            المحدث:
                          </div>
                          <div className={`font-medium ${t.textBody}`}>
                            {hadith.muhaddith}
                          </div>
                        </div>
                      )}
                      {hadith.book && (
                        <div
                          className={`rounded-xl border p-4 ${isNight ? "border-white/10 bg-[#34343a]" : "border-gray-200 bg-white"}`}
                        >
                          <div
                            className={`mb-2 text-sm font-bold ${t.textAccent}`}
                          >
                            المصدر:
                          </div>
                          <div className={`font-medium ${t.textBody}`}>
                            {hadith.book}
                          </div>
                        </div>
                      )}
                      {hadith.grade && (
                        <div
                          className={`rounded-xl border p-4 sm:col-span-2 ${isNight ? "border-white/10 bg-[#34343a]" : "border-gray-200 bg-white"}`}
                        >
                          <div
                            className={`mb-2 text-sm font-bold ${t.textAccent}`}
                          >
                            الحكم:
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`rounded-full px-4 py-2 font-bold text-white ${isNight ? "bg-[#5b4d6f]" : "bg-gradient-to-r from-[#7440E9] to-[#B794F6]"}`}
                            >
                              {hadith.grade}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* خلاصة حكم المحدث */}
                    {hadith.explainGrade && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-300 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">⚖️</span>
                          <div className="text-base font-bold text-blue-800">
                            خلاصة حكم المحدث:
                          </div>
                        </div>
                        <div className="bg-white/80 rounded-lg p-3 border border-blue-200">
                          <div className="text-blue-700 text-sm leading-relaxed font-medium">
                            {hadith.explainGrade}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Show message if no results found */}
            {(!results?.data?.dorar?.data ||
              results.data.dorar.data.length === 0) && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 text-center">
                <div className="text-6xl mb-4">❓</div>
                <div className="text-2xl font-bold text-orange-700 mb-4">
                  لم يتم العثور على الحديث
                </div>
                <div className="text-orange-600 text-lg">
                  لم يتم العثور على الحديث في المصادر المتاحة
                </div>
                <div className="text-orange-500 mt-2">
                  يُنصح بالتحقق من النص أو البحث في مصادر أخرى
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Educational Button */}
        <button
          onClick={() => setShowEducationalPath(!showEducationalPath)}
          className={`fixed bottom-6 right-6 z-50 rounded-full p-4 text-white shadow-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-3xl ${t.primaryBtn}`}
        >
          <BookOpen className="w-6 h-6" />
        </button>

        {/* Educational Path Modal */}
        {showEducationalPath && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className={`max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-3xl ${isNight ? "bg-[#242428] border border-white/10" : "bg-white"}`}
            >
              <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h2
                    className={`flex items-center gap-2 text-xl font-bold sm:text-2xl ${t.textHeading}`}
                  >
                    📚 طريق تعليمي
                  </h2>
                  <button
                    onClick={resetEducationalPath}
                    className="text-gray-500 hover:text-gray-700 text-xl"
                  >
                    ×
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>
                      الخطوة {currentStep + 1} من {educationalSteps.length}
                    </span>
                    <span>
                      {Math.round(
                        ((currentStep + 1) / educationalSteps.length) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#7440E9] to-[#B794F6] h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          ((currentStep + 1) / educationalSteps.length) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Current Step Content */}
                <div className="mb-6">
                  {/* Flip Card for Current Step */}
                  <div className="perspective-1000">
                    <div
                      className={`relative w-full h-64 cursor-pointer transition-transform duration-700 transform-style-preserve-3d ${
                        flippedCard === currentStep ? "rotate-y-180" : ""
                      }`}
                      onClick={() =>
                        setFlippedCard(
                          flippedCard === currentStep ? null : currentStep,
                        )
                      }
                    >
                      {/* Front of Card */}
                      <div className="absolute inset-0 backface-hidden">
                        <div
                          className={`bg-gradient-to-br ${
                            educationalSteps[currentStep].color === "green"
                              ? "from-green-100 to-green-200"
                              : educationalSteps[currentStep].color === "blue"
                                ? "from-blue-100 to-blue-200"
                                : educationalSteps[currentStep].color ===
                                    "yellow"
                                  ? "from-yellow-100 to-yellow-200"
                                  : educationalSteps[currentStep].color ===
                                      "red"
                                    ? "from-red-100 to-red-200"
                                    : "from-purple-100 to-purple-200"
                          } border-2 ${
                            educationalSteps[currentStep].color === "green"
                              ? "border-green-300"
                              : educationalSteps[currentStep].color === "blue"
                                ? "border-blue-300"
                                : educationalSteps[currentStep].color ===
                                    "yellow"
                                  ? "border-yellow-300"
                                  : educationalSteps[currentStep].color ===
                                      "red"
                                    ? "border-red-300"
                                    : "border-purple-300"
                          } rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center`}
                        >
                          <div className="text-6xl mb-4">
                            {educationalSteps[currentStep].icon}
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            {educationalSteps[currentStep].title}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            اضغط لمعرفة التفاصيل
                          </p>
                        </div>
                      </div>

                      {/* Back of Card */}
                      <div className="absolute inset-0 rotate-y-180 backface-hidden">
                        <div
                          className={`bg-gradient-to-br ${
                            educationalSteps[currentStep].color === "green"
                              ? "from-green-50 to-green-100"
                              : educationalSteps[currentStep].color === "blue"
                                ? "from-blue-50 to-blue-100"
                                : educationalSteps[currentStep].color ===
                                    "yellow"
                                  ? "from-yellow-50 to-yellow-100"
                                  : educationalSteps[currentStep].color ===
                                      "red"
                                    ? "from-red-50 to-red-100"
                                    : "from-purple-50 to-purple-100"
                          } border-2 ${
                            educationalSteps[currentStep].color === "green"
                              ? "border-green-300"
                              : educationalSteps[currentStep].color === "blue"
                                ? "border-blue-300"
                                : educationalSteps[currentStep].color ===
                                    "yellow"
                                  ? "border-yellow-300"
                                  : educationalSteps[currentStep].color ===
                                      "red"
                                    ? "border-red-300"
                                    : "border-purple-300"
                          } rounded-2xl p-6 h-full flex flex-col justify-center`}
                        >
                          <div className="text-center mb-4">
                            <div className="text-4xl mb-2">
                              {educationalSteps[currentStep].icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">
                              {educationalSteps[currentStep].title}
                            </h3>
                          </div>
                          <p className="text-gray-700 leading-relaxed text-sm">
                            {educationalSteps[currentStep].content}
                          </p>
                          <p className="text-gray-500 text-xs mt-4 text-center">
                            اضغط لإخفاء التفاصيل
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      currentStep === 0
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    السابق
                  </button>

                  <div className="flex gap-2">
                    {educationalSteps.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToStep(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentStep
                            ? "bg-[#7440E9] scale-125"
                            : index < currentStep
                              ? "bg-green-400"
                              : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextStep}
                    disabled={currentStep === educationalSteps.length - 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      currentStep === educationalSteps.length - 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-[#7440E9] text-white hover:bg-[#6B3AD1]"
                    }`}
                  >
                    {currentStep === educationalSteps.length - 1
                      ? "انتهى"
                      : "التالي "}
                  </button>
                </div>

                {/* Close Button */}
                <div className="flex justify-center mt-6">
                  <button
                    onClick={resetEducationalPath}
                    className="bg-gradient-to-r from-[#7440E9] to-[#B794F6] text-white px-6 py-2 rounded-xl font-medium hover:from-[#6B3AD1] hover:to-[#A67FF0] transition-all duration-300 text-sm"
                  >
                    إغلاق الطريق التعليمي
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HadithVerificationPage;
