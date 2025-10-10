import React, { useState, useEffect } from "react";
import {
  BookOpen,
  TrendingUp,
  Star,
  Clock,
  Heart,
  Share2,
  X,
  Trash2,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReadCount } from "../hooks/useReadCount";
const SmartRecommendations = ({
  limit = 10,
  showTitle = true,
  filterType = "all",
}) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const {
    readCount,
    minReads,
    needsMoreReads,
    remainingReads,
    updateReadCount,
  } = useReadCount();

  useEffect(() => {
    fetchRecommendations();
  }, [limit, filterType]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("يجب تسجيل الدخول أولاً");
        return;
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/recommendations/smart-recommendations?limit=${limit}&type=${filterType}`,
        {
          headers: {
            "x-auth-token": token,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في جلب التوصيات");
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);

      // تحديث عدد القراءات
      updateReadCount();
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const trackRecommendationClick = async (recommendationId, hadithId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/recommendations/track-recommendation-interaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({
            recommendationId,
            interactionType: "click",
          }),
        }
      );
      navigate(`/hadiths/hadith/${hadithId}`);
    } catch (error) {
      console.error("Error tracking recommendation click:", error);
    }
  };

  const deleteRecommendation = async (recommendationId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/recommendations/delete-recommendation`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({
            recommendationId,
          }),
        }
      );

      if (response.ok) {
        // إزالة التوصية من القائمة المحلية
        setRecommendations((prev) =>
          prev.filter((rec) => rec.id !== recommendationId)
        );
      }
    } catch (error) {
      console.error("Error deleting recommendation:", error);
    }
  };

  const trackRecommendationView = async (recommendationId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/recommendations/track-recommendation-interaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({
            recommendationId,
            interactionType: "view",
          }),
        }
      );
    } catch (error) {
      console.error("Error tracking recommendation view:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecommendations();
    setRefreshing(false);
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case "similar_content":
        return <BookOpen className="w-4 h-4" />;
      case "trending":
        return <TrendingUp className="w-4 h-4" />;
      case "personalized":
        return <Star className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getRecommendationTypeText = (type) => {
    switch (type) {
      case "similar_content":
        return "محتوى مشابه";
      case "trending":
        return "شائع";
      case "personalized":
        return "مخصص لك";
      default:
        return "توصية";
    }
  };

  const getRecommendationTypeColor = (type) => {
    switch (type) {
      case "similar_content":
        return "bg-blue-100 text-blue-800";
      case "trending":
        return "bg-orange-100 text-orange-800";
      case "personalized":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="smart-recommendations">
        {showTitle && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Star className="w-6 h-6 text-purple-600" />
              التوصيات الذكية لك
            </h2>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // عرض رسالة تشجيعية إذا لم يصل المستخدم للحد الأدنى
  if (needsMoreReads && recommendations.length === 0) {
    return (
      <div className="smart-recommendations">
        {showTitle && (
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Star className="w-6 h-6 text-purple-600" />
            التوصيات الذكية
          </h2>
        )}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 text-center">
          <Target className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-blue-800 mb-3">
            اقترب من الحصول على توصيات ذكية! 🎯
          </h3>
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="text-3xl font-bold text-blue-600">
                {readCount}
              </div>
              <div className="text-gray-500">من</div>
              <div className="text-3xl font-bold text-purple-600">
                {minReads}
              </div>
            </div>
            <p className="text-gray-600 mb-3">
              قرأت{" "}
              <span className="font-semibold text-blue-600">{readCount}</span>{" "}
              حديث
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((readCount / minReads) * 100, 100)}%`,
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {remainingReads > 0
                ? `تحتاج لقراءة ${remainingReads} حديث${
                    remainingReads > 1 ? "ات" : ""
                  } أخرى`
                : "ممتاز! التوصيات ستظهر قريباً"}
            </p>
          </div>
          <div className="space-y-2 text-sm text-blue-700">
            <p>✨ اقرأ المزيد من الأحاديث لتحصل على توصيات مخصصة</p>
            <p>📚 كل حديث تقرأه يساعد في تحسين التوصيات</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="smart-recommendations">
        {showTitle && (
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Star className="w-6 h-6 text-purple-600" />
            التوصيات الذكية لك
          </h2>
        )}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="smart-recommendations">
        {showTitle && (
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Star className="w-6 h-6 text-purple-600" />
            التوصيات الذكية لك
          </h2>
        )}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            لا توجد توصيات متاحة حالياً. اقرأ المزيد من الأحاديث للحصول على
            توصيات مخصصة!
          </p>
          <button
            onClick={handleRefresh}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            تحديث التوصيات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="smart-recommendations">
      {showTitle && (
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            التوصيات الذكية
          </h2>
          <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
            أحاديث مخصصة لك بناءً على قراءاتك وأنماطك الشخصية
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl font-bold"
          >
            {refreshing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            )}
            تحديث التوصيات
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden transform hover:-translate-y-2 hover:scale-105"
            onMouseEnter={() => trackRecommendationView(rec.id)}
          >
            <div className="p-6">
              {/* نوع التوصية */}
              <div className="flex items-center justify-between mb-6">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${getRecommendationTypeColor(
                    rec.recommendation_type
                  )} shadow-sm`}
                >
                  {getRecommendationIcon(rec.recommendation_type)}
                  {getRecommendationTypeText(rec.recommendation_type)}
                </span>
                <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-2 rounded-xl shadow-sm">
                  <Star className="w-4 h-4 text-white fill-current" />
                  <span className="text-sm font-bold text-white">
                    {Math.round(rec.confidence_score * 100)}%
                  </span>
                </div>
              </div>

              {/* نص الحديث */}
              <div className="mb-6">
                <div className="relative bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm">📖</span>
                  </div>
                  <p className="text-gray-800 leading-relaxed text-base font-medium line-clamp-4 pr-2">
                    {rec.hadeeth}
                  </p>
                </div>
              </div>

              {/* معلومات الحديث */}
              <div className="mb-6 space-y-3">
                {rec.attribution && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-100">
                    <span className="font-bold text-blue-600">الراوي:</span>
                    <span className="truncate font-medium">
                      {rec.attribution}
                    </span>
                  </div>
                )}
                {rec.source && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl border border-green-100">
                    <span className="font-bold text-green-600">المصدر:</span>
                    <span className="truncate font-medium">{rec.source}</span>
                  </div>
                )}
                {rec.grade_ar && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-xl border border-purple-100">
                    <span className="font-bold text-purple-600">الدرجة:</span>
                    <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full text-sm font-bold shadow-sm">
                      {rec.grade_ar}
                    </span>
                  </div>
                )}
              </div>

              {/* سبب التوصية */}
              <div className="mb-6">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border-l-4 border-amber-400 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white text-sm">💡</span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">
                      {rec.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* أزرار التفاعل */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() =>
                    trackRecommendationClick(rec.id, rec.hadith_id)
                  }
                  className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl text-sm font-bold transform hover:scale-105"
                >
                  <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  اقرأ الحديث
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteRecommendation(rec.id)}
                    className="p-3 text-gray-400 hover:text-red-600 transition-all duration-300 hover:bg-red-50 rounded-xl hover:shadow-md group"
                    title="حذف التوصية"
                  >
                    <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* معلومات إضافية */}
      <div className="mt-8 text-center">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
          <p className="text-sm text-gray-600 font-medium">
            التوصيات تُحدث تلقائياً بناءً على قراءاتك واهتماماتك الشخصية
          </p>
        </div>
      </div>
    </div>
  );
};

export default SmartRecommendations;
