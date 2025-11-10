import React from "react";
import {
  Video,
  FileText,
  Link as LinkIcon,
  Mic,
  ExternalLink,
  BookOpen,
  Sparkles,
} from "lucide-react";

const ResourceIcon = ({ type }) => {
  const iconClasses = "w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex-shrink-0";
  switch (type) {
    case "video":
      return (
        <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg sm:rounded-xl">
          <Video className={`${iconClasses} text-red-600 dark:text-red-400`} />
        </div>
      );
    case "pdf":
      return (
        <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl">
          <FileText
            className={`${iconClasses} text-blue-600 dark:text-blue-400`}
          />
        </div>
      );
    case "audio":
      return (
        <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg sm:rounded-xl">
          <Mic
            className={`${iconClasses} text-purple-600 dark:text-purple-400`}
          />
        </div>
      );
    default:
      return (
        <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-700 rounded-lg sm:rounded-xl">
          <LinkIcon
            className={`${iconClasses} text-gray-600 dark:text-gray-400`}
          />
        </div>
      );
  }
};

const CampResources = ({ resources, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#7440E9]/20 border-t-[#7440E9] mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            جاري تحميل الموارد...
          </p>
        </div>
      </div>
    );
  }

  // resources is now an array of categories with resources
  const categoriesWithResources = resources || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100 dark:border-gray-700">
      {/* Header with Icon */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-[#7440E9] to-[#8b5cf6] rounded-xl sm:rounded-2xl shadow-lg mb-3 sm:mb-4">
          <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
        </div>
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-[#7440E9] to-[#8b5cf6] bg-clip-text text-transparent">
          مصادر الدراسة
        </h3>
        <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400 px-2">
          موارد تعليمية متنوعة لدعم رحلتك في حفظ القرآن
        </p>
      </div>

      {categoriesWithResources.length > 0 ? (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {categoriesWithResources.map((category, categoryIndex) => (
            <div
              key={category.id || "uncategorized"}
              className="group"
              style={{
                animationDelay: `${categoryIndex * 100}ms`,
              }}
            >
              {/* Category Header */}
              <div className="mb-3 sm:mb-4 lg:mb-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-0.5 sm:w-1 h-6 sm:h-8 lg:h-10 bg-gradient-to-b from-[#7440E9] to-[#8b5cf6] rounded-full flex-shrink-0"></div>
                    <h4 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white truncate">
                      {category.title}
                    </h4>
                  </div>
                  {category.resources && category.resources.length > 0 && (
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-[#7440E9]/10 to-[#8b5cf6]/10 dark:from-[#7440E9]/20 dark:to-[#8b5cf6]/20 text-[#7440E9] dark:text-[#a78bfa] text-xs sm:text-sm font-semibold rounded-full border border-[#7440E9]/20 dark:border-[#7440E9]/30 whitespace-nowrap">
                      {category.resources.length} مورد
                    </span>
                  )}
                </div>
              </div>

              {/* Resources Grid */}
              {category.resources && category.resources.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                  {category.resources.map((resource, resourceIndex) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/resource relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-5 border border-gray-200 dark:border-gray-700 active:border-[#7440E9]/50 dark:active:border-[#7440E9]/50 sm:hover:border-[#7440E9]/50 dark:sm:hover:border-[#7440E9]/50 shadow-sm sm:hover:shadow-xl transition-all duration-300 sm:transform sm:hover:-translate-y-1 sm:hover:scale-[1.02]"
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
                            <h5 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover/resource:text-[#7440E9] dark:group-hover/resource:text-[#a78bfa] transition-colors">
                              {resource.title}
                            </h5>
                            <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                              <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md sm:rounded-lg font-medium">
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
                        <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(resource.created_at).toLocaleDateString(
                              "ar-SA",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                          <div className="flex items-center gap-1.5 sm:gap-2 text-[#7440E9] dark:text-[#a78bfa] text-xs sm:text-sm font-semibold sm:group-hover/resource:gap-3 transition-all">
                            <span className="hidden sm:inline">فتح المورد</span>
                            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/resource:scale-110 transition-transform flex-shrink-0" />
                          </div>
                        </div>
                      </div>

                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#7440E9]/0 to-[#8b5cf6]/0 sm:group-hover/resource:from-[#7440E9]/5 sm:group-hover/resource:to-[#8b5cf6]/5 rounded-lg sm:rounded-xl lg:rounded-2xl transition-all duration-300 pointer-events-none"></div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 lg:py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg sm:rounded-xl lg:rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 px-4">
                  <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400">
                    لا توجد موارد في هذه الفئة بعد
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12 lg:py-16 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h4 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
            لا توجد موارد متاحة حاليًا
          </h4>
          <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            سيتم إضافة الموارد التعليمية قريبًا. تحقق مرة أخرى لاحقًا!
          </p>
        </div>
      )}
    </div>
  );
};

export default CampResources;
