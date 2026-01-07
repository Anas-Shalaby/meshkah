import React from "react";
import { CheckCircle, Clock3, Trophy } from "lucide-react";

// ثوابت الأيام العربية
export const ARABIC_DAY_ORDINALS = {
  1: "الأول",
  2: "الثاني",
  3: "الثالث",
  4: "الرابع",
  5: "الخامس",
  6: "السادس",
  7: "السابع",
  8: "الثامن",
  9: "التاسع",
  10: "العاشر",
  11: "الحادي عشر",
  12: "الثاني عشر",
  13: "الثالث عشر",
  14: "الرابع عشر",
  15: "الخامس عشر",
  16: "السادس عشر",
  17: "السابع عشر",
  18: "الثامن عشر",
  19: "التاسع عشر",
  20: "العشرون",
  21: "الحادي والعشرون",
  22: "الثاني والعشرون",
  23: "الثالث والعشرون",
  24: "الرابع والعشرون",
  25: "الخامس والعشرون",
  26: "السادس والعشرون",
  27: "السابع والعشرون",
  28: "الثامن والعشرون",
  29: "التاسع والعشرون",
  30: "الثلاثون",
};

// دالة للحصول على نص الحالة
export const getStatusText = (status) => {
  switch (status) {
    case "active":
      return "نشط الآن";
    case "early_registration":
      return "قريباً";
    case "completed":
      return "منتهي";
    default:
      return "غير محدد";
  }
};

// دالة للحصول على لون الحالة
export const getStatusColor = (status) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "early_registration":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "completed":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// دالة للحصول على أيقونة الحالة
export const getStatusIcon = (status) => {
  switch (status) {
    case "active":
      return <CheckCircle className="w-4 h-4" />;
    case "early_registration":
      return <Clock3 className="w-4 h-4" />;
    case "completed":
      return <Trophy className="w-4 h-4" />;
    default:
      return <Clock3 className="w-4 h-4" />;
  }
};

// دالة لتجميع المهام حسب اليوم
export const groupTasksByDay = (tasks) => {
  if (!tasks || !Array.isArray(tasks)) return {};

  return tasks.reduce((groups, task) => {
    const day = task.day_number;
    if (!groups[day]) {
      groups[day] = [];
    }
    groups[day].push(task);
    return groups;
  }, {});
};

// دالة لقطع HTML مع الحفاظ على الـ tags المفتوحة
export const truncateHTML = (html, maxLength) => {
  if (!html) return "";

  const textContent = html.replace(/<[^>]*>/g, "");
  if (textContent.length <= maxLength) {
    return html;
  }

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const TEXT_NODE = 3;
  const ELEMENT_NODE = 1;

  const truncateNode = (node, remainingLength) => {
    if (remainingLength <= 0) {
      return "";
    }

    if (node.nodeType === TEXT_NODE) {
      const text = node.textContent || "";
      if (text.length <= remainingLength) {
        return text;
      }
      return text.substring(0, remainingLength) + "...";
    }

    if (node.nodeType === ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      const attributes = Array.from(node.attributes)
        .map((attr) => `${attr.name}="${attr.value}"`)
        .join(" ");

      let html = `<${tagName}${attributes ? " " + attributes : ""}>`;
      let remaining = remainingLength;

      for (const child of Array.from(node.childNodes)) {
        const childHtml = truncateNode(child, remaining);
        if (!childHtml) break;
        html += childHtml;
        const childTextLength = (child.textContent || "").length;
        remaining -= childTextLength;
        if (remaining <= 0) break;
      }

      if (!["br", "hr", "img", "input"].includes(tagName)) {
        html += `</${tagName}>`;
      }

      return html;
    }

    return "";
  };

  let result = "";
  let remaining = maxLength;

  for (const child of Array.from(tempDiv.childNodes)) {
    const childHtml = truncateNode(child, remaining);
    if (!childHtml) break;
    result += childHtml;
    const textLength = (child.textContent || "").length;
    remaining -= textLength;
    if (remaining <= 0) break;
  }

  return result || html.substring(0, maxLength) + "...";
};

// دالة لتمييز الكلمات المبحوث عنها مع الأمان - للـ HTML
export const highlightSearchTermHTML = (html, searchTerm) => {
  if (!searchTerm || !html) return html;

  const cleanSearchTerm = searchTerm.replace(/[<>"'&]/g, "");
  if (!cleanSearchTerm) return html;

  const regex = new RegExp(
    `(${cleanSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );

  const tagRegex = /<[^>]*>/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      const textBeforeTag = html.substring(lastIndex, match.index);
      parts.push({ type: "text", content: textBeforeTag });
    }
    parts.push({ type: "tag", content: match[0] });
    lastIndex = tagRegex.lastIndex;
  }

  if (lastIndex < html.length) {
    parts.push({ type: "text", content: html.substring(lastIndex) });
  }

  return parts
    .map((part) => {
      if (part.type === "tag") {
        return part.content;
      } else {
        return part.content.replace(regex, (match) => {
          return `<mark class="bg-yellow-200 px-1 rounded">${match}</mark>`;
        });
      }
    })
    .join("");
};

// دالة لتمييز الكلمات المبحوث عنها مع الأمان - للـ JSX
export const highlightSearchTerm = (text, searchTerm) => {
  if (!searchTerm || !text) return text;

  const cleanSearchTerm = searchTerm.replace(/[<>"'&]/g, "");
  if (!cleanSearchTerm) return text;

  const regex = new RegExp(
    `(${cleanSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  return text.split(regex).map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 px-1 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

// دالة لتنسيق تسمية اليوم
export const formatDayLabel = (dayNumber) => {
  const numericDay = Number(dayNumber);
  if (!Number.isFinite(numericDay) || numericDay <= 0)
    return `اليوم ${dayNumber}`;
  const ordinal = ARABIC_DAY_ORDINALS[numericDay];
  return ordinal ? `اليوم ${ordinal}` : `اليوم ${numericDay}`;
};

// دالة لتنسيق تسمية تحدي اليوم
export const formatChallengeDayLabel = (dayNumber) =>
  `تحدي ${formatDayLabel(dayNumber)}`;

// دالة لتنسيق التاريخ
export const formatDate = (dateString) => {
  // For browsers that support Islamic calendar (like Chrome)
  try {
    return new Date(dateString).toLocaleDateString("ar-SA-u-ca-islamic", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    // Fallback to Gregorian if not supported
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};

// دالة لحساب اليوم الحالي للمخيم
export const getCurrentDay = (camp) => {
  if (!camp || !camp.start_date) return 1;
  // إذا كان المخيم في حالة التسجيل المبكر ولم يبدأ من الإدارة، ثبّت اليوم على 1
  if (camp.status === "early_registration") return 1;

  const startDate = new Date(camp.start_date);
  startDate.setHours(0, 0, 0, 0); // تأكد من إزالة الوقت

  const today = new Date();
  today.setHours(0, 0, 0, 0); // تأكد من إزالة الوقت

  const diffTime = today - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // اليوم الأول = 1، محدود بعدد أيام المخيم
  return Math.max(1, Math.min(diffDays, camp.duration_days || 1));
};
