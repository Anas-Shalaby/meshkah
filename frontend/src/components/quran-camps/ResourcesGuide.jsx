import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Video,
  FileText,
  Mic,
  Link as LinkIcon,
  Lightbulb,
  Clock,
  Target,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const ResourcesGuide = ({ onClose }) => {
  const [expandedSections, setExpandedSections] = useState(
    new Set(["what-are"])
  );

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const resourceTypes = [
    {
      type: "video",
      icon: Video,
      title: "الفيديوهات",
      description: "مقاطع فيديو تعليمية وشرح تفصيلي",
      color: "text-red-600 bg-red-100 dark:bg-red-900/30",
      when: "قبل البدء في المهمة أو للمراجعة",
      how: "شاهد الفيديو لفهم المفهوم ثم ابدأ المهمة",
    },
    {
      type: "pdf",
      icon: FileText,
      title: "الملفات PDF",
      description: "كتب ومراجع قابلة للتحميل",
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
      when: "للقراءة المتعمقة والمراجعة",
      how: "حمّل الملف واقرأه بتركيز أثناء الدراسة",
    },
    {
      type: "audio",
      icon: Mic,
      title: "الملفات الصوتية",
      description: "تسجيلات صوتية وشرح مسموع",
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
      when: "أثناء التنقل أو قبل النوم",
      how: "استمع للملف أثناء أداء أنشطة أخرى",
    },
    {
      type: "link",
      icon: LinkIcon,
      title: "الروابط",
      description: "مواقع ومصادر إضافية على الإنترنت",
      color: "text-gray-600 bg-gray-100 dark:bg-gray-700",
      when: "للحصول على معلومات إضافية",
      how: "انقر على الرابط لزيارة المصدر",
    },
  ];

  const sections = [
    {
      id: "what-are",
      title: "ما هي الموارد التعليمية؟",
      icon: BookOpen,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            الموارد التعليمية هي مجموعة من المصادر المختارة بعناية لمساعدتك في
            رحلتك في حفظ وتدبر القرآن الكريم. تشمل هذه الموارد:
          </p>
          <ul className="space-y-2 sm:space-y-3 list-none">
            <li className="flex items-start gap-2 sm:gap-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <strong>فيديوهات تعليمية:</strong> شرح تفصيلي للمفاهيم والأحكام
              </span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <strong>كتب ومراجع:</strong> مصادر للقراءة المتعمقة
              </span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <strong>تسجيلات صوتية:</strong> للاستماع أثناء التنقل
              </span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <strong>روابط مفيدة:</strong> مواقع ومصادر إضافية
              </span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "how-to-use",
      title: "كيفية استخدام الموارد",
      icon: Target,
      content: (
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h4 className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] flex-shrink-0" />
              <span>متى تستخدم الموارد؟</span>
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="text-[#7440E9]">•</span>
                <span>قبل البدء في المهمة لفهم المطلوب</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="text-[#7440E9]">•</span>
                <span>أثناء تنفيذ المهمة للمراجعة والاستيضاح</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="text-[#7440E9]">•</span>
                <span>بعد إكمال المهمة للتعمق والمراجعة</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="text-[#7440E9]">•</span>
                <span>للمراجعة العامة والاستذكار</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] flex-shrink-0" />
              <span>نصائح للاستفادة القصوى</span>
            </h4>
            <div className="bg-gradient-to-br from-[#7440E9]/10 to-[#8b5cf6]/10 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#7440E9] text-white flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  اقرأ عنوان المورد ووصفه قبل فتحه لتعرف ما إذا كان مناسباً لك
                </p>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#7440E9] text-white flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  استخدم الموارد بشكل منتظم وليس فقط عند الحاجة
                </p>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#7440E9] text-white flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  خصص وقتاً يومياً لاستعراض الموارد الجديدة
                </p>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#7440E9] text-white flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 mt-0.5">
                  4
                </div>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  استخدم الموارد الصوتية أثناء التنقل أو قبل النوم
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "resource-types",
      title: "أنواع الموارد",
      icon: FileText,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
            كل نوع من الموارد له استخدامه الخاص:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {resourceTypes.map((resource) => (
              <motion.div
                key={resource.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div
                    className={`p-1.5 sm:p-2 rounded-lg ${resource.color} flex-shrink-0`}
                  >
                    <resource.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                      {resource.title}
                    </h5>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {resource.description}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      متى:
                    </span>{" "}
                    <span className="text-gray-600 dark:text-gray-400">
                      {resource.when}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      كيف:
                    </span>{" "}
                    <span className="text-gray-600 dark:text-gray-400">
                      {resource.how}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "examples",
      title: "أمثلة عملية",
      icon: Lightbulb,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-emerald-200 dark:border-emerald-800">
            <h5 className="font-semibold text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 mb-1.5 sm:mb-2">
              مثال 1: قبل المهمة
            </h5>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              إذا كانت مهمة اليوم تتعلق بتفسير آية معينة، يمكنك:
            </p>
            <ul className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <li>• مشاهدة فيديو يشرح الآية</li>
              <li>• قراءة تفسير مختصر من ملف PDF</li>
              <li>• ثم البدء في كتابة تدبرك</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-blue-200 dark:border-blue-800">
            <h5 className="font-semibold text-xs sm:text-sm text-blue-800 dark:text-blue-300 mb-1.5 sm:mb-2">
              مثال 2: أثناء التنقل
            </h5>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              استخدم الملفات الصوتية عندما تكون في الطريق:
            </p>
            <ul className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <li>• استمع لتسجيل صوتي عن السورة</li>
              <li>• راجع ما حفظته من خلال الاستماع</li>
              <li>• استفد من وقت التنقل في التعلم</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-purple-200 dark:border-purple-800">
            <h5 className="font-semibold text-xs sm:text-sm text-purple-800 dark:text-purple-300 mb-1.5 sm:mb-2">
              مثال 3: للمراجعة
            </h5>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              في نهاية الأسبوع، راجع ما درسته:
            </p>
            <ul className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <li>• اقرأ ملخصات من ملفات PDF</li>
              <li>• شاهد فيديوهات للمراجعة</li>
              <li>• زُر روابط مفيدة للمعلومات الإضافية</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
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
              <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-2xl font-bold text-gray-800 dark:text-gray-200 truncate">
                دليل الموارد التعليمية
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                كل ما تحتاج معرفته عن استخدام الموارد
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {sections.map((section) => {
              const isExpanded = expandedSections.has(section.id);
              return (
                <div
                  key={section.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors active:bg-gray-100"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <section.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] flex-shrink-0" />
                      <h3 className="text-sm sm:text-lg font-semibold text-gray-800 dark:text-gray-200 text-right truncate">
                        {section.title}
                      </h3>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 sm:p-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                        {section.content}
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-right">
              💡 نصيحة: استخدم الموارد بانتظام لتحقيق أقصى استفادة
            </p>
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-[#7440E9] to-[#8b5cf6] text-white rounded-lg text-sm sm:text-base font-medium hover:shadow-lg transition-all active:scale-95 w-full sm:w-auto"
            >
              فهمت، شكراً
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResourcesGuide;
