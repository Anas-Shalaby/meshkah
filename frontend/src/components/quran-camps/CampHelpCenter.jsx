import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  BookOpen,
  MessageCircle,
  Search,
  X,
  ChevronRight,
} from "lucide-react";
import CampUserGuide from "./CampUserGuide";
import ResourcesGuide from "./ResourcesGuide";

const CampHelpCenter = ({ campId, onClose }) => {
  const [activeTab, setActiveTab] = useState("guide");
  const [searchQuery, setSearchQuery] = useState("");
  const [showResourcesGuide, setShowResourcesGuide] = useState(false);

  const tabs = [
    {
      id: "guide",
      name: "دليل المستخدم",
      icon: BookOpen,
    },
    {
      id: "faq",
      name: "الأسئلة الشائعة",
      icon: HelpCircle,
    },
    {
      id: "contact",
      name: "دعم فني",
      icon: MessageCircle,
    },
  ];

  const faqItems = [
    {
      question: "كيف أبدأ في المخيم؟",
      answer:
        "ابدأ بمراجعة خريطة الرحلة لفهم أيام المخيم، ثم راجع الموارد التعليمية، وابدأ بمهمة اليوم الأولى. يمكنك استخدام دليل المستخدم للحصول على تفاصيل أكثر.",
    },
    {
      question: "ما هي الموارد التعليمية وكيف أستخدمها؟",
      answer:
        "الموارد التعليمية هي مصادر مختارة لمساعدتك في رحلتك. تشمل فيديوهات، كتب، ملفات صوتية، وروابط. استخدمها قبل المهمة للفهم، وأثناء التنقل للمراجعة، وبعد الإكمال للتعمق. انقر على 'دليل الموارد' للحصول على شرح تفصيلي.",
    },
    {
      question: "كيف أتابع تقدمي في المخيم؟",
      answer:
        "يمكنك متابعة تقدمك من خلال خريطة الرحلة التي تظهر أيام المخيم وحالة كل يوم. كما يمكنك رؤية إحصائياتك في قسم التقدم.",
    },
    {
      question: "ماذا أفعل إذا فاتني يوم؟",
      answer:
        "يمكنك العودة لأي يوم سابق وإكمال مهامه. المخيم مرن ويسمح لك بالعمل على وتيرتك الخاصة.",
    },
    {
      question: "كيف أضيف أصدقاء في المخيم؟",
      answer:
        "استخدم كود الصديق الخاص بك لإضافة مشاركين آخرين. يمكنك العثور على كودك في قسم الصحبة.",
    },
    {
      question: "هل يمكنني إخفاء هويتي؟",
      answer:
        "نعم، يمكنك إخفاء هويتك من إعدادات المخيم. بهذه الطريقة يمكنك المشاركة بشكل مجهول.",
    },
    {
      question: "كيف أشارك تدبري مع الآخرين؟",
      answer:
        "عند كتابة تدبرك، يمكنك اختيار مشاركته. سيظهر تدبرك في قاعة التدارس للمشاركين الآخرين.",
    },
    {
      question: "ما الفرق بين السجل الشخصي وقاعة التدارس؟",
      answer:
        "السجل الشخصي هو مكانك الخاص لتسجيل تدبرك. قاعة التدارس هي مساحة للتفاعل الجماعي ومشاركة التدبرات مع الآخرين.",
    },
  ];

  const filteredFaq = faqItems.filter(
    (item) =>
      item.question.includes(searchQuery) || item.answer.includes(searchQuery)
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "guide":
        return <CampUserGuide />;
      case "faq":
        return (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في الأسئلة الشائعة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-8 sm:pr-10 pl-3 sm:pl-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7440E9]"
                dir="rtl"
              />
            </div>

            {/* FAQ Items */}
            {filteredFaq.length > 0 ? (
              <div className="space-y-3">
                {filteredFaq.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-gray-200 dark:border-gray-700"
                  >
                    <h4 className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-1.5 sm:mb-2 flex items-start gap-1.5 sm:gap-2">
                      <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] mt-0.5 flex-shrink-0" />
                      <span>{item.question}</span>
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed pr-5 sm:pr-7">
                      {item.answer}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Search className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  لم يتم العثور على نتائج
                </p>
              </div>
            )}
          </div>
        );
      case "contact":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-br from-[#7440E9]/10 to-[#8b5cf6]/10 rounded-lg sm:rounded-xl p-3 sm:p-6 border border-[#7440E9]/20">
              <h4 className="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-200 mb-2 sm:mb-3">
                نحن هنا لمساعدتك
              </h4>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                إذا كان لديك أي سؤال أو تحتاج مساعدة، لا تتردد في التواصل معنا.
              </p>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-start gap-2 sm:gap-3">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                      الدعم الفني
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      يمكنك إرسال رسالة للمشرفين من خلال قسم "اسأل وأجب" في
                      تبويب الموارد
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                      الدليل الشامل
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      راجع دليل المستخدم والأسئلة الشائعة للحصول على إجابات
                      سريعة
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-gray-200 dark:border-gray-700">
              <h5 className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-2 sm:mb-3">
                نصائح للحصول على مساعدة أسرع
              </h5>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-1.5 sm:gap-2">
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7440E9] mt-0.5 flex-shrink-0" />
                  <span>راجع الأسئلة الشائعة أولاً</span>
                </li>
                <li className="flex items-start gap-1.5 sm:gap-2">
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7440E9] mt-0.5 flex-shrink-0" />
                  <span>استخدم البحث للعثور على إجابات سريعة</span>
                </li>
                <li className="flex items-start gap-1.5 sm:gap-2">
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7440E9] mt-0.5 flex-shrink-0" />
                  <span>راجع دليل المستخدم للتفاصيل الكاملة</span>
                </li>
              </ul>
            </div>
          </div>
        );
      default:
        return <CampUserGuide />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 top-[60px] z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-[#7440E9] to-[#8b5cf6] rounded-lg flex-shrink-0">
                <HelpCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-2xl font-bold text-gray-800 dark:text-gray-200 truncate">
                  مركز المساعدة
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                  دليل شامل لاستخدام نظام المخيمات
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 active:bg-gray-200"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2 p-2 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 overflow-x-auto scrollbar-hide">
            <div className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2 flex-1 sm:flex-initial sm:justify-between w-full sm:w-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchQuery("");
                  }}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-6 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0  flex-1 sm:flex-initial ${
                    activeTab === tab.id
                      ? "bg-[#7440E9] text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="whitespace-nowrap">{tab.name}</span>
                </button>
              ))}
            </div>
            {activeTab === "guide" && (
              <button
                onClick={() => setShowResourcesGuide(true)}
                className="w-full sm:w-auto px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:shadow-lg transition-all flex items-center justify-center gap-1 sm:gap-2 active:scale-95 flex-shrink-0 mt-1.5 sm:mt-0"
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="whitespace-nowrap">دليل الموارد</span>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Resources Guide Modal */}
      {showResourcesGuide && (
        <ResourcesGuide onClose={() => setShowResourcesGuide(false)} />
      )}
    </>
  );
};

export default CampHelpCenter;
