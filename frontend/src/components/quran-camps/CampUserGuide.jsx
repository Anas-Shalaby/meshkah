import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  BookOpen,
  FolderOpen,
  FileText,
  Users,
  PlayCircle,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const CampUserGuide = () => {
  const [expandedSections, setExpandedSections] = useState(
    new Set(["getting-started"])
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

  const sections = [
    {
      id: "getting-started",
      title: "البدء في المخيم",
      icon: PlayCircle,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-gradient-to-br from-[#7440E9]/10 to-[#8b5cf6]/10 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-[#7440E9]/20">
            <h4 className="font-semibold text-xs sm:text-base text-gray-800 dark:text-gray-200 mb-2 sm:mb-3">
              خطوات البدء
            </h4>
            <ol className="space-y-2 sm:space-y-3 list-none">
              <li className="flex items-start gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#7440E9] text-white flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium">
                    استكشف خريطة الرحلة
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                    تعرف على أيام المخيم والمهام المطلوبة منك
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#7440E9] text-white flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium">
                    راجع الموارد التعليمية
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                    استكشف الفيديوهات والكتب والملفات المتاحة
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#7440E9] text-white flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium">
                    ابدأ بمهمة اليوم
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                    انقر على مهمة اليوم وابدأ في تنفيذها
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#7440E9] text-white flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 mt-0.5">
                  4
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium">
                    اكتب تدبرك
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                    سجل أفكارك وتدبرك في السجل الشخصي
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: "journey-map",
      title: "فهم خريطة الرحلة",
      icon: MapPin,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            خريطة الرحلة هي دليلك الشامل لجميع أيام المخيم. من خلالها يمكنك:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
              <h5 className="font-semibold text-xs sm:text-sm text-blue-800 dark:text-blue-300 mb-1 sm:mb-2">
                رؤية التقدم
              </h5>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                تتبع أيام المخيم والمهام المكتملة والمتبقية
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200 dark:border-green-800">
              <h5 className="font-semibold text-xs sm:text-sm text-green-800 dark:text-green-300 mb-1 sm:mb-2">
                التنقل السريع
              </h5>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                انقر على أي يوم للانتقال مباشرة إلى مهامه
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-200 dark:border-purple-800">
              <h5 className="font-semibold text-xs sm:text-sm text-purple-800 dark:text-purple-300 mb-1 sm:mb-2">
                فهم السياق
              </h5>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                رؤية الصورة الكاملة لرحلتك في المخيم
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-200 dark:border-orange-800">
              <h5 className="font-semibold text-xs sm:text-sm text-orange-800 dark:text-orange-300 mb-1 sm:mb-2">
                التخطيط
              </h5>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                خطط للمهام القادمة بناءً على ما تراه
              </p>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
            <h5 className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] flex-shrink-0" />
              <span>نصائح للاستخدام</span>
            </h5>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-1.5 sm:gap-2">
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7440E9] mt-0.5 flex-shrink-0" />
                <span>راجع خريطة الرحلة يومياً لتعرف مهام اليوم</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7440E9] mt-0.5 flex-shrink-0" />
                <span>استخدم الألوان لفهم حالة كل يوم (مكتمل، جاري، قادم)</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7440E9] mt-0.5 flex-shrink-0" />
                <span>انقر على أي يوم للانتقال مباشرة إلى مهامه</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "study-hall",
      title: "استخدام قاعة التدارس",
      icon: BookOpen,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            قاعة التدارس هي مساحة للتعلم الجماعي والتفاعل مع المشاركين الآخرين.
          </p>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#7440E9]/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-0.5 sm:mb-1">
                  التفاعل مع الآخرين
                </h5>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  شارك تدبرك واقرأ تدبرات الآخرين
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#7440E9]/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-0.5 sm:mb-1">
                  المحتوى التعليمي
                </h5>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  اطلع على المحتوى المخصص من المشرفين
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "resources",
      title: "فهم نظام الموارد",
      icon: FolderOpen,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            الموارد التعليمية هي مصادر مختارة بعناية لمساعدتك في رحلتك. تشمل:
          </p>
          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-1.5 sm:gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] mt-0.5 flex-shrink-0" />
              <span>فيديوهات تعليمية وشرح تفصيلي</span>
            </li>
            <li className="flex items-start gap-1.5 sm:gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] mt-0.5 flex-shrink-0" />
              <span>كتب ومراجع قابلة للتحميل</span>
            </li>
            <li className="flex items-start gap-1.5 sm:gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] mt-0.5 flex-shrink-0" />
              <span>تسجيلات صوتية للاستماع</span>
            </li>
            <li className="flex items-start gap-1.5 sm:gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9] mt-0.5 flex-shrink-0" />
              <span>روابط لمواقع ومصادر إضافية</span>
            </li>
          </ul>
          <div className="bg-gradient-to-br from-[#7440E9]/10 to-[#8b5cf6]/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[#7440E9]/20">
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              <strong>نصيحة:</strong> استخدم الموارد قبل البدء في المهمة لفهم
              أفضل، وأثناء التنقل للمراجعة، وبعد الإكمال للتعمق.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "journal",
      title: "استخدام السجل الشخصي",
      icon: FileText,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            السجل الشخصي هو مكانك الخاص لتسجيل تدبرك وأفكارك.
          </p>
          <div className="space-y-2 sm:space-y-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <h5 className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-1.5 sm:mb-2">
                ما يمكنك فعله:
              </h5>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-1.5 sm:gap-2">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7440E9] mt-0.5 flex-shrink-0" />
                  <span>سجل تدبرك لكل مهمة</span>
                </li>
                <li className="flex items-start gap-1.5 sm:gap-2">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7440E9] mt-0.5 flex-shrink-0" />
                  <span>احفظ أفكارك وملاحظاتك</span>
                </li>
                <li className="flex items-start gap-1.5 sm:gap-2">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7440E9] mt-0.5 flex-shrink-0" />
                  <span>راجع ما كتبته سابقاً</span>
                </li>
                <li className="flex items-start gap-1.5 sm:gap-2">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7440E9] mt-0.5 flex-shrink-0" />
                  <span>شارك تدبرك مع الآخرين (اختياري)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "friends",
      title: "نظام الصحبة والأصدقاء",
      icon: Users,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            نظام الصحبة يسمح لك بالتفاعل مع المشاركين الآخرين في المخيم.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <h5 className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-1 sm:mb-2">
                إضافة أصدقاء
              </h5>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                استخدم كود الصديق لإضافة مشاركين آخرين كأصدقاء
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <h5 className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-1 sm:mb-2">
                التفاعل
              </h5>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                اقرأ تدبرات أصدقائك وشاركهم تدبرك
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <h5 className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-1 sm:mb-2">
                الدعم المتبادل
              </h5>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                شجع أصدقاءك وشاركهم رحلتك في المخيم
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <h5 className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-1 sm:mb-2">
                الخصوصية
              </h5>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                يمكنك إخفاء هويتك إذا رغبت في ذلك
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        return (
          <div
            key={section.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl overflow-hidden bg-white dark:bg-gray-800"
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
  );
};

export default CampUserGuide;
