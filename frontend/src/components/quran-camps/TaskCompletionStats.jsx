import React from "react";
import { UserCheck, Users } from "lucide-react";

// مكون مساعد لعرض إحصائيات إكمال المهام من الأصدقاء
const TaskCompletionStats = ({ friendsWhoCompleted, totalCount }) => {
  const friendsCount = friendsWhoCompleted?.length || 0;

  // لا تعرض شيئًا إذا لم يكملها أحد
  if (totalCount === 0) {
    return null;
  }

  // الحالة 1: أصدقاؤك فقط هم من أكملوها
  if (friendsCount > 0 && friendsCount === totalCount) {
    let text = "";
    if (friendsCount === 1) {
      text = `${friendsWhoCompleted[0]?.username || "صديق"} أتمها`;
    } else if (friendsCount === 2) {
      text = `${friendsWhoCompleted[0]?.username || "صديق"} و ${
        friendsWhoCompleted[1]?.username || "صديق"
      } أتموها`;
    } else {
      text = `${friendsWhoCompleted[0]?.username || "صديق"} و ${
        friendsCount - 1
      } أصدقاء آخرين أتموها`;
    }
    return (
      <span
        className="flex items-center text-xs sm:text-sm text-purple-600 font-semibold ml-2 sm:ml-3 flex-shrink-0"
        title={text}
      >
        <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
        <span>{text}</span>
      </span>
    );
  }

  // الحالة 2: أصدقاؤك + آخرون
  if (friendsCount > 0) {
    const otherCount = totalCount - friendsCount;
    let text = "";
    if (friendsCount === 1) {
      text = `${friendsWhoCompleted[0]?.username || "صديق"}`;
    } else {
      text = `${friendsWhoCompleted[0]?.username || "صديق"} و ${
        friendsCount - 1
      } أصدقاء`;
    }

    if (otherCount > 0) {
      text += ` و ${otherCount} آخرين أتموها`;
    } else {
      text += ` أتموها`;
    }

    return (
      <span
        className="flex items-center text-xs sm:text-sm text-purple-600 font-semibold ml-2 sm:ml-3 flex-shrink-0"
        title={text}
      >
        <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
        <span>{text}</span>
      </span>
    );
  }

  // الحالة 3: آخرون فقط، لا يوجد أصدقاء
  return (
    <span
      className="flex items-center text-xs sm:text-sm text-gray-500 font-medium ml-2 sm:ml-3 flex-shrink-0"
      title={`${totalCount} شخص أتموا هذه المهمة`}
    >
      <Users className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
      <span>{totalCount} أتموا</span>
    </span>
  );
};

export default TaskCompletionStats;
