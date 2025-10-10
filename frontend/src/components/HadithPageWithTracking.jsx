import React, { useState, useEffect } from "react";
import { useHadithTracking } from "../hooks/useHadithTracking";
import HadithInteractionTracker from "./HadithInteractionTracker";
import SmartRecommendations from "./SmartRecommendations";
import {
  BookOpen,
  Star,
  Clock,
  TrendingUp,
  Share2,
  Heart,
  Bookmark,
} from "lucide-react";

// مثال على كيفية دمج نظام التوصيات مع صفحة الحديث الموجودة
const HadithPageWithTracking = ({ hadith, onHadithUpdate }) => {
  const {
    isTracking,
    startReading,
    trackHadithRead,
    trackBookmark,
    trackMemorize,
    trackShare,
    trackLike,
  } = useHadithTracking();

  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showInteractionTracker, setShowInteractionTracker] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [readingTime, setReadingTime] = useState(0);

  // تتبع وقت القراءة
  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => {
        setReadingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setReadingTime(0);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  // تتبع عرض الحديث عند تحميل الصفحة
  useEffect(() => {
    if (hadith?.id) {
      // سيتم تتبع العرض تلقائياً عند بدء القراءة
    }
  }, [hadith?.id]);

  const handleStartReading = () => {
    if (hadith?.id) {
      startReading(hadith.id);
      setShowInteractionTracker(true);
    }
  };

  const handleFinishReading = (rating, notes) => {
    if (hadith?.id) {
      trackHadithRead(hadith.id, rating, notes);
      setUserRating(rating);
      setShowRecommendations(true);
      if (onHadithUpdate) {
        onHadithUpdate("read", { rating, notes, readingTime });
      }
    }
  };

  const handleBookmark = async () => {
    if (hadith?.id) {
      await trackBookmark(hadith.id, "Default", "");
      setIsBookmarked(!isBookmarked);
      if (onHadithUpdate) {
        onHadithUpdate("bookmark", { isBookmarked: !isBookmarked });
      }
    }
  };

  const handleLike = async () => {
    if (hadith?.id) {
      await trackLike(hadith.id);
      setIsLiked(!isLiked);
      if (onHadithUpdate) {
        onHadithUpdate("like", { isLiked: !isLiked });
      }
    }
  };

  const handleShare = async (method = "link") => {
    if (hadith?.id) {
      await trackShare(hadith.id, method);
      if (onHadithUpdate) {
        onHadithUpdate("share", { method });
      }
    }
  };

  const handleMemorize = async (confidenceLevel, notes) => {
    if (hadith?.id) {
      await trackMemorize(hadith.id, confidenceLevel, notes);
      if (onHadithUpdate) {
        onHadithUpdate("memorize", { confidenceLevel, notes });
      }
    }
  };

  if (!hadith) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">لا يوجد حديث للعرض</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">الحديث الشريف</h1>
          <div className="flex items-center gap-2">
            {isTracking && (
              <div className="flex items-center gap-2 text-blue-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {Math.floor(readingTime / 60)}:
                  {(readingTime % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* الحديث */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="prose prose-lg max-w-none">
          <div className="text-2xl leading-relaxed text-gray-800 mb-6 text-center">
            "{hadith.hadeeth}"
          </div>

          {hadith.attribution && (
            <div className="text-lg text-gray-600 mb-4 text-center">
              <span className="font-semibold">الراوي:</span>{" "}
              {hadith.attribution}
            </div>
          )}

          {hadith.source && (
            <div className="text-lg text-gray-600 mb-4 text-center">
              <span className="font-semibold">المصدر:</span> {hadith.source}
            </div>
          )}

          {hadith.grade_ar && (
            <div className="text-lg text-gray-600 mb-6 text-center">
              <span className="font-semibold">الدرجة:</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm mr-2">
                {hadith.grade_ar}
              </span>
            </div>
          )}
        </div>

        {/* أزرار التفاعل السريع */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={handleStartReading}
            disabled={isTracking}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <BookOpen className="w-5 h-5" />
            {isTracking ? "جاري القراءة..." : "بدء القراءة"}
          </button>

          <button
            onClick={handleBookmark}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              isBookmarked
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Bookmark className="w-5 h-5" />
            {isBookmarked ? "محفوظ" : "حفظ"}
          </button>

          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              isLiked
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            {isLiked ? "معجب" : "إعجاب"}
          </button>

          <button
            onClick={() => handleShare("link")}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            مشاركة
          </button>
        </div>
      </div>

      {/* تتبع التفاعل المتقدم */}
      {showInteractionTracker && (
        <div className="mb-8">
          <HadithInteractionTracker
            hadith={hadith}
            onInteraction={(type, data) => {
              if (type === "read") {
                handleFinishReading(data.rating, data.notes);
              } else if (type === "bookmark") {
                handleBookmark();
              } else if (type === "like") {
                handleLike();
              } else if (type === "share") {
                handleShare(data.method);
              } else if (type === "memorize") {
                handleMemorize(data.confidenceLevel, data.notes);
              }
            }}
          />
        </div>
      )}

      {/* التوصيات الذكية */}
      {showRecommendations && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              قد يعجبك أيضاً
            </h2>
            <button
              onClick={() => setShowRecommendations(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              إخفاء
            </button>
          </div>
          <SmartRecommendations limit={6} showTitle={false} />
        </div>
      )}

      {/* معلومات إضافية */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          💡 نصائح للقراءة
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• اقرأ الحديث بتمعن وفهم معانيه</li>
          <li>• فكر في كيفية تطبيق الحديث في حياتك</li>
          <li>• احفظ الحديث إذا أمكن</li>
          <li>• شارك الحديث مع الآخرين لنشر الخير</li>
          <li>• ارجع للحديث بين الحين والآخر للمراجعة</li>
        </ul>
      </div>
    </div>
  );
};

export default HadithPageWithTracking;
