import React, { useState } from "react";
import { useHadithTracking } from "../hooks/useHadithTracking";
import {
  BookOpen,
  Star,
  Bookmark,
  Heart,
  Share2,
  Brain,
  Clock,
  MessageSquare,
} from "lucide-react";

const HadithInteractionTracker = ({ hadith, onInteraction }) => {
  const {
    isTracking,
    startReading,
    trackHadithRead,
    trackBookmark,
    trackMemorize,
    trackShare,
    trackLike,
    trackAnalyze,
  } = useHadithTracking();

  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleStartReading = () => {
    if (hadith?.id) {
      startReading(hadith.id);
      setShowRating(true);
    }
  };

  const handleFinishReading = () => {
    if (hadith?.id) {
      trackHadithRead(hadith.id, rating, notes);
      setShowRating(false);
      setRating(0);
      setNotes("");
      if (onInteraction) {
        onInteraction("read", { rating, notes });
      }
    }
  };

  const handleBookmark = async () => {
    if (hadith?.id) {
      await trackBookmark(hadith.id, "Default", notes);
      setIsBookmarked(!isBookmarked);
      if (onInteraction) {
        onInteraction("bookmark", { isBookmarked: !isBookmarked });
      }
    }
  };

  const handleMemorize = async () => {
    if (hadith?.id) {
      await trackMemorize(hadith.id, rating, notes);
      if (onInteraction) {
        onInteraction("memorize", { rating, notes });
      }
    }
  };

  const handleLike = async () => {
    if (hadith?.id) {
      await trackLike(hadith.id);
      setIsLiked(!isLiked);
      if (onInteraction) {
        onInteraction("like", { isLiked: !isLiked });
      }
    }
  };

  const handleShare = async (method = "link") => {
    if (hadith?.id) {
      await trackShare(hadith.id, method);
      if (onInteraction) {
        onInteraction("share", { method });
      }
    }
  };

  const handleAnalyze = async () => {
    if (hadith?.id) {
      await trackAnalyze(hadith.id, "general");
      if (onInteraction) {
        onInteraction("analyze", {});
      }
    }
  };

  const renderRatingStars = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`w-6 h-6 transition-colors ${
              star <= rating
                ? "text-yellow-400 fill-current"
                : "text-gray-300 hover:text-yellow-400"
            }`}
          >
            <Star className="w-full h-full" />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="hadith-interaction-tracker bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-blue-600" />
        تفاعل مع الحديث
      </h3>

      {/* حالة التتبع */}
      {isTracking && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              جاري تتبع وقت القراءة...
            </span>
          </div>
        </div>
      )}

      {/* أزرار التفاعل الأساسية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={handleStartReading}
          disabled={isTracking}
          className="flex flex-col items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <BookOpen className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">بدء القراءة</span>
        </button>

        <button
          onClick={handleBookmark}
          className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
            isBookmarked
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-50 hover:bg-gray-100 text-gray-700"
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-sm font-medium">
            {isBookmarked ? "محفوظ" : "حفظ"}
          </span>
        </button>

        <button
          onClick={handleLike}
          className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
            isLiked
              ? "bg-red-100 text-red-700"
              : "bg-gray-50 hover:bg-gray-100 text-gray-700"
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
          <span className="text-sm font-medium">
            {isLiked ? "معجب" : "إعجاب"}
          </span>
        </button>

        <button
          onClick={() => handleShare("link")}
          className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Share2 className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">مشاركة</span>
        </button>
      </div>

      {/* أزرار إضافية */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <button
          onClick={handleMemorize}
          className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
        >
          <Brain className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-700">حفظ</span>
        </button>

        <button
          onClick={handleAnalyze}
          className="flex items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
        >
          <Brain className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">تحليل</span>
        </button>

        <button
          onClick={() => setShowNotes(!showNotes)}
          className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">ملاحظات</span>
        </button>
      </div>

      {/* تقييم الحديث */}
      {showRating && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-3">
            كيف تقيم هذا الحديث؟
          </h4>
          <div className="flex items-center gap-4 mb-3">
            {renderRatingStars()}
            <span className="text-sm text-yellow-700">
              {rating > 0 ? `${rating} من 5` : "اختر التقييم"}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleFinishReading}
              disabled={rating === 0}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إنهاء القراءة
            </button>
            <button
              onClick={() => {
                setShowRating(false);
                setRating(0);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* ملاحظات */}
      {showNotes && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-800 mb-3">
            أضف ملاحظاتك
          </h4>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب ملاحظاتك عن هذا الحديث..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setShowNotes(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              حفظ الملاحظات
            </button>
            <button
              onClick={() => {
                setShowNotes(false);
                setNotes("");
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* معلومات إضافية */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p>💡 تتبع تفاعلك يساعدنا في تقديم توصيات أفضل لك في المستقبل</p>
      </div>
    </div>
  );
};

export default HadithInteractionTracker;
