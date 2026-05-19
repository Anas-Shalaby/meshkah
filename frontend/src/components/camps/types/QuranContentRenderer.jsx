import { BookOpen } from "lucide-react";

/**
 * QuranContentRenderer
 * --------------------------------------------------------
 * يعرض محتوى مهمة قرآنية: السورة + مدى الآيات (verse range).
 * يتوقع `task` يحتوي على verses_from, verses_to, surah_name, surah_number.
 */
const QuranContentRenderer = ({ task }) => {
  if (!task) return null;
  const hasVerseRange =
    task.verses_from !== null &&
    task.verses_from !== undefined &&
    task.verses_to !== null &&
    task.verses_to !== undefined;

  return (
    <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 text-right">
      <div className="flex items-center gap-2 mb-2 text-purple-700 font-bold">
        <BookOpen className="w-4 h-4" />
        <span>
          {task.surah_name ? `سورة ${task.surah_name}` : "محتوى قرآني"}
        </span>
      </div>
      {hasVerseRange && (
        <div className="text-sm text-gray-700">
          الآيات من <span className="font-bold">{task.verses_from}</span> إلى{" "}
          <span className="font-bold">{task.verses_to}</span>
        </div>
      )}
      {task.description && (
        <p className="mt-3 text-gray-700 leading-relaxed text-sm whitespace-pre-line">
          {task.description}
        </p>
      )}
    </div>
  );
};

export default QuranContentRenderer;
