import React from "react";

// بانرات الحالة (انضمام متأخر / قراءة فقط)
const CampBanners = ({
  joinedLate,
  isReadOnly,
  missedDaysCount,
  userProgress,
}) => {
  return (
    <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4">
      {joinedLate && !isReadOnly && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-800 px-4 py-3 flex items-center justify-between">
          <div className="text-sm sm:text-base font-medium">
            لقد انضممت متأخرًا. لديك {missedDaysCount} يوم/أيام فائتة من المخيم
            إستعن بالله.
          </div>
        </div>
      )}
      {isReadOnly &&
        !(
          userProgress?.tasks?.length > 0 &&
          userProgress.tasks.every((t) => t.completed)
        ) && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 text-gray-800 px-4 py-3 text-sm sm:text-base">
            هذا المخيم منتهي. يمكنك إكمال المهام للتتبع الشخصي فقط بدون نقاط أو
            تفاعل اجتماعي.
          </div>
        )}
    </div>
  );
};

export default CampBanners;
