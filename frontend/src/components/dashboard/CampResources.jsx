import React, { useState, useEffect } from "react";
import {
  Video,
  FileText,
  Link as LinkIcon,
  Mic,
  ExternalLink,
  BookOpen,
  Sparkles,
  X,
  Lightbulb,
  Info,
} from "lucide-react";
import CampTooltip from "../ui/CampTooltip";
import ResourcesGuide from "../quran-camps/ResourcesGuide";

const ResourceIcon = ({ type }) => {
  const iconClasses =
    "w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 flex-shrink-0";
  switch (type) {
    case "video":
      return (
        <div className="p-1 sm:p-1.5 lg:p-2 bg-red-100 dark:bg-red-900/30 rounded-md sm:rounded-lg lg:rounded-xl">
          <Video className={`${iconClasses} text-red-600 dark:text-red-400`} />
        </div>
      );
    case "pdf":
      return (
        <div className="p-1 sm:p-1.5 lg:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md sm:rounded-lg lg:rounded-xl">
          <FileText
            className={`${iconClasses} text-blue-600 dark:text-blue-400`}
          />
        </div>
      );
    case "audio":
      return (
        <div className="p-1 sm:p-1.5 lg:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-md sm:rounded-lg lg:rounded-xl">
          <Mic
            className={`${iconClasses} text-purple-600 dark:text-purple-400`}
          />
        </div>
      );
    default:
      return (
        <div className="p-1 sm:p-1.5 lg:p-2 bg-gray-100 dark:bg-gray-700 rounded-md sm:rounded-lg lg:rounded-xl">
          <LinkIcon
            className={`${iconClasses} text-gray-600 dark:text-gray-400`}
          />
        </div>
      );
  }
};

const CampResources = ({ resources, isLoading }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showResourcesGuide, setShowResourcesGuide] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner
    const bannerDismissed = localStorage.getItem(
      "camp-resources-banner-dismissed"
    );
    if (!bannerDismissed) {
      setShowBanner(true);
    }
  }, []);

  const handleDismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem("camp-resources-banner-dismissed", "true");
  };

  const getResourceTooltip = (resourceType) => {
    switch (resourceType) {
      case "video":
        return "فيديو تعليمي - شاهد الفيديو قبل البدء في المهمة أو للمراجعة";
      case "pdf":
        return "ملف PDF - حمّل واقرأ للتعمق والمراجعة";
      case "audio":
        return "ملف صوتي - استمع أثناء التنقل أو قبل النوم";
      default:
        return "رابط مفيد - زُر الموقع للحصول على معلومات إضافية";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 xl:p-10 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col items-center justify-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-[#7440E9]/20 border-t-[#7440E9] mb-3 sm:mb-4"></div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
            جاري تحميل الموارد...
          </p>
        </div>
      </div>
    );
  }

  // resources is now an array of categories with resources
  const categoriesWithResources = resources || [];

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-6 lg:p-8 shadow-lg border border-gray-100 dark:border-gray-700">
        {/* Banner توضيحي */}
        {showBanner && (
          <div className="mb-4 sm:mb-6 bg-gradient-to-br from-[#7440E9]/10 via-[#8b5cf6]/10 to-[#7440E9]/10 dark:from-[#7440E9]/20 dark:via-[#8b5cf6]/20 dark:to-[#7440E9]/20 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-[#7440E9]/20 dark:border-[#7440E9]/30 relative">
            <button
              onClick={handleDismissBanner}
              className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 p-1 hover:bg-white/20 dark:hover:bg-gray-700/20 rounded-lg transition-colors active:bg-white/30"
              aria-label="إغلاق"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex items-start gap-2 sm:gap-3 pr-6 sm:pr-8">
              <div className="p-1.5 sm:p-2 bg-[#7440E9] rounded-lg flex-shrink-0">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                  <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7440E9] flex-shrink-0" />
                  <span>ما هي الموارد التعليمية؟</span>
                </h4>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2 sm:mb-3 leading-relaxed">
                  الموارد التعليمية هي مصادر مختارة بعناية لمساعدتك في رحلتك.
                  تشمل فيديوهات تعليمية، كتب، ملفات صوتية، وروابط مفيدة.
                  استخدمها قبل المهمة للفهم، وأثناء التنقل للمراجعة، وبعد
                  الإكمال للتعمق.
                </p>
                <button
                  onClick={() => setShowResourcesGuide(true)}
                  className="text-xs sm:text-sm font-medium text-[#7440E9] hover:text-[#8b5cf6] transition-colors flex items-center gap-1 active:opacity-70"
                >
                  <span>تعرف على المزيد</span>
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header with Icon */}
        <div className="text-center mb-3 sm:mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-[#7440E9] to-[#8b5cf6] rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg mb-2 sm:mb-3 lg:mb-4">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
          </div>
          <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-[#7440E9] to-[#8b5cf6] bg-clip-text text-transparent">
            مصادر الدراسة
          </h3>
          <p className="text-[10px] sm:text-sm lg:text-base text-gray-500 dark:text-gray-400 px-2">
            موارد تعليمية متنوعة لدعم رحلتك في حفظ القرآن
          </p>
        </div>

        {categoriesWithResources.length > 0 ? (
          <div className="space-y-3 sm:space-y-6 lg:space-y-8">
            {categoriesWithResources.map((category, categoryIndex) => (
              <div
                key={category.id || "uncategorized"}
                className="group"
                style={{
                  animationDelay: `${categoryIndex * 100}ms`,
                }}
              >
                {/* Category Header */}
                <div className="mb-2 sm:mb-4 lg:mb-6">
                  <div className="flex items-center gap-1.5 sm:gap-3 mb-1.5 sm:mb-2 flex-wrap">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                      <div className="w-0.5 sm:w-1 h-5 sm:h-8 lg:h-10 bg-gradient-to-b from-[#7440E9] to-[#8b5cf6] rounded-full flex-shrink-0"></div>
                      <h4 className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white truncate">
                        {category.title}
                      </h4>
                    </div>
                    {category.resources && category.resources.length > 0 && (
                      <span className="px-1.5 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-[#7440E9]/10 to-[#8b5cf6]/10 dark:from-[#7440E9]/20 dark:to-[#8b5cf6]/20 text-[#7440E9] dark:text-[#a78bfa] text-[10px] sm:text-sm font-semibold rounded-full border border-[#7440E9]/20 dark:border-[#7440E9]/30 whitespace-nowrap">
                        {category.resources.length} مورد
                      </span>
                    )}
                  </div>
                </div>

                {/* Resources Grid */}
                {category.resources && category.resources.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4">
                    {category.resources.map((resource, resourceIndex) => (
                      <CampTooltip
                        key={resource.id}
                        content={getResourceTooltip(resource.resource_type)}
                        position="top"
                      >
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/resource relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg sm:rounded-xl lg:rounded-2xl p-2.5 sm:p-4 lg:p-5 border border-gray-200 dark:border-gray-700 active:border-[#7440E9]/50 dark:active:border-[#7440E9]/50 active:scale-[0.98] sm:hover:border-[#7440E9]/50 dark:sm:hover:border-[#7440E9]/50 shadow-sm sm:hover:shadow-xl transition-all duration-300 sm:transform sm:hover:-translate-y-1 sm:hover:scale-[1.02] block"
                          style={{
                            animationDelay: `${resourceIndex * 50}ms`,
                          }}
                        >
                          {/* Decorative Corner */}
                          <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-[#7440E9]/5 to-transparent rounded-bl-2xl sm:rounded-bl-3xl opacity-0 sm:group-hover/resource:opacity-100 transition-opacity duration-300"></div>

                          {/* Content */}
                          <div className="relative z-10">
                            <div className="flex items-start gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3">
                              <ResourceIcon type={resource.resource_type} />
                              <div className="flex-1 min-w-0">
                                <h5 className="text-xs sm:text-base lg:text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover/resource:text-[#7440E9] dark:group-hover/resource:text-[#a78bfa] transition-colors">
                                  {resource.title}
                                </h5>
                                <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2">
                                  <span className="text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md sm:rounded-lg font-medium">
                                    {(() => {
                                      switch (resource.resource_type) {
                                        case "video":
                                          return "فيديو";
                                        case "pdf":
                                          return "PDF";
                                        case "audio":
                                          return "صوتي";
                                        default:
                                          return "رابط";
                                      }
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
                              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                {new Date(
                                  resource.created_at
                                ).toLocaleDateString("ar-SA", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <div className="flex items-center gap-1 sm:gap-2 text-[#7440E9] dark:text-[#a78bfa] text-[10px] sm:text-xs lg:text-sm font-semibold sm:group-hover/resource:gap-3 transition-all">
                                <span className="hidden sm:inline">
                                  فتح المورد
                                </span>
                                <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 group-hover/resource:scale-110 transition-transform flex-shrink-0" />
                              </div>
                            </div>
                          </div>

                          {/* Hover Effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#7440E9]/0 to-[#8b5cf6]/0 sm:group-hover/resource:from-[#7440E9]/5 sm:group-hover/resource:to-[#8b5cf6]/5 rounded-lg sm:rounded-xl lg:rounded-2xl transition-all duration-300 pointer-events-none"></div>
                        </a>
                      </CampTooltip>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-8 lg:py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg sm:rounded-xl lg:rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 px-3 sm:px-4">
                    <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-1.5 sm:mb-3" />
                    <p className="text-[10px] sm:text-sm lg:text-base text-gray-500 dark:text-gray-400">
                      لا توجد موارد في هذه الفئة بعد
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-12 lg:py-16 px-3 sm:px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl mb-3 sm:mb-4 lg:mb-6">
              <FileText className="w-6 h-6 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h4 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
              لا توجد موارد متاحة حاليًا
            </h4>
            <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              سيتم إضافة الموارد التعليمية قريبًا. تحقق مرة أخرى لاحقًا!
            </p>
          </div>
        )}
      </div>

      {/* Resources Guide Modal */}
      {showResourcesGuide && (
        <ResourcesGuide onClose={() => setShowResourcesGuide(false)} />
      )}
    </>
  );
};

export default CampResources;
