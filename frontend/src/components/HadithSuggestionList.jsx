import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Loader2, Share2 } from "lucide-react";
import toast from "react-hot-toast";

// دالة لاستخراج نص الحديث فقط (بعد علامة <<)
const extractHadithText = (fullText) => {
  if (!fullText) return fullText;

  // البحث عن النص بعد علامة << (حتى نهاية النص أو حتى علامة >>)
  // يستخدم non-greedy match لالتقاط النص حتى >> أو نهاية النص
  const afterAngleBracketMatch = fullText.match(/<<(.+?)(?:>>|$)/);
  if (afterAngleBracketMatch && afterAngleBracketMatch[1]) {
    return afterAngleBracketMatch[1].trim();
  }

  // إذا لم يتم العثور على <<، نعيد النص الأصلي
  return fullText.trim();
};

// هذا المكون هو واجهة "قائمة الاقتراحات"
const HadithSuggestionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index) => {
    if (!props.items || !props.items[index]) return;
    const item = props.items[index];
    if (item && props.command) {
      props.command(item); // (تنفيذ الأمر عند الاختيار)
    }
  };

  const shareHadith = (e, item) => {
    e.stopPropagation(); // منع اختيار العنصر عند الضغط على زر الشير
    const hadithUrl = `https://hadith-shareef.com/hadiths/hadith/${item.id}`;

    // نسخ الرابط إلى الحافظة
    navigator.clipboard
      .writeText(hadithUrl)
      .then(() => {
        toast.success("تم نسخ رابط الحديث!");
      })
      .catch(() => {
        // Fallback: استخدام طريقة قديمة
        const textArea = document.createElement("textarea");
        textArea.value = hadithUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        toast.success("تم نسخ رابط الحديث!");
      });
  };

  const upHandler = () => {
    if (!props.items || props.items.length === 0) return;
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length
    );
  };

  const downHandler = () => {
    if (!props.items || props.items.length === 0) return;
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  // إذا كان في حالة loading
  if (props.isLoading) {
    return (
      <div className="z-[100] bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[300px]">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">جاري البحث عن الأحاديث...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="z-[100] bg-white rounded-lg shadow-xl border border-gray-200 p-2 overflow-y-auto max-h-48 min-w-[300px]">
      {props.items && props.items.length ? (
        props.items.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-start gap-2 w-full text-right p-2 rounded-md text-sm ${
              index === selectedIndex
                ? "bg-purple-100 text-purple-700"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <button
              className={`flex-1 text-right ${
                index === selectedIndex ? "text-purple-700" : "text-gray-700"
              }`}
              onClick={() => selectItem(index)}
            >
              {/* (اقتراح الحديث) */}
              <span className="font-semibold text-purple-600">حديث:</span>{" "}
              {extractHadithText(item.text).substring(0, 70)}
              {extractHadithText(item.text).length > 70 ? "..." : ""}
            </button>
            <button
              onClick={(e) => shareHadith(e, item)}
              className="p-1 rounded hover:bg-purple-200 transition-colors flex-shrink-0"
              title="نسخ رابط الحديث"
            >
              <Share2 className="w-4 h-4 text-purple-600" />
            </button>
          </div>
        ))
      ) : (
        <div className="p-2 text-gray-500 text-sm">
          لا توجد نتائج... (استمر في الكتابة)
        </div>
      )}
    </div>
  );
});

HadithSuggestionList.displayName = "HadithSuggestionList";

export default HadithSuggestionList;
