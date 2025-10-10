import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Clock,
  Star,
  TrendingUp,
  Target,
  BarChart3,
  Calendar,
  Award,
} from "lucide-react";

const UserStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("يجب تسجيل الدخول أولاً");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/recommendations/user-stats`,
        {
          headers: {
            "x-auth-token": token,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في جلب الإحصائيات");
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    return new Date(dateString).toLocaleDateString("ar-SA");
  };

  const getInteractionStats = () => {
    if (!stats?.interactionStats) return [];

    return stats.interactionStats.map((stat) => ({
      type: stat.interaction_type,
      count: stat.count,
      avgDuration: Math.round(stat.avg_duration || 0),
      avgRating: Math.round((stat.avg_rating || 0) * 10) / 10,
      label: getInteractionLabel(stat.interaction_type),
    }));
  };

  const getInteractionLabel = (type) => {
    const labels = {
      view: "مشاهدات",
      read: "قراءات",
      bookmark: "إشارات مرجعية",
      memorize: "حفظ",
      share: "مشاركات",
      like: "إعجابات",
      analyze: "تحليلات",
    };
    return labels[type] || type;
  };

  const getRecommendationStats = () => {
    if (!stats?.recommendationStats) return [];

    return stats.recommendationStats.map((stat) => ({
      type: stat.recommendation_type,
      total: stat.total_recommendations,
      viewed: stat.viewed,
      clicked: stat.clicked,
      avgRating: Math.round((stat.avg_rating || 0) * 10) / 10,
      label: getRecommendationTypeLabel(stat.recommendation_type),
    }));
  };

  const getRecommendationTypeLabel = (type) => {
    const labels = {
      similar_content: "محتوى مشابه",
      trending: "شائع",
      personalized: "مخصص",
      completion: "إكمال",
      discovery: "استكشاف",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="user-stats bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          إحصائياتك
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-gray-100 rounded-lg p-4 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-stats bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          إحصائياتك
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchUserStats}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="user-stats bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          إحصائياتك
        </h3>
        <div className="text-center text-gray-500">
          <p>لا توجد إحصائيات متاحة</p>
        </div>
      </div>
    );
  }

  const generalStats = stats.generalStats || {};
  const interactionStats = getInteractionStats();
  const recommendationStats = getRecommendationStats();

  return (
    <div className="user-stats bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        إحصائياتك
      </h3>

      {/* الإحصائيات العامة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
          <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">
            {generalStats.unique_hadiths_read || 0}
          </div>
          <div className="text-blue-700 font-medium text-sm">
            أحاديث مختلفة قرأتها
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
          <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">
            {generalStats.total_interactions || 0}
          </div>
          <div className="text-green-700 font-medium text-sm">
            إجمالي التفاعلات
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
          <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-600">
            {recommendationStats.reduce((sum, stat) => sum + stat.total, 0)}
          </div>
          <div className="text-purple-700 font-medium text-sm">
            توصيات تلقيتها
          </div>
        </div>
      </div>

      {/* إحصائيات التفاعلات */}
      {interactionStats.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            تفاعلاتك مع الأحاديث
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interactionStats.map((stat, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">
                    {stat.label}
                  </span>
                  <span className="text-2xl font-bold text-gray-800">
                    {stat.count}
                  </span>
                </div>
                {stat.avgDuration > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>متوسط الوقت: {stat.avgDuration}ث</span>
                  </div>
                )}
                {stat.avgRating > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star className="w-4 h-4 fill-current text-yellow-400" />
                    <span>متوسط التقييم: {stat.avgRating}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* إحصائيات التوصيات */}
      {recommendationStats.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600" />
            تفاعلك مع التوصيات
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendationStats.map((stat, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">
                    {stat.label}
                  </span>
                  <span className="text-2xl font-bold text-gray-800">
                    {stat.total}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>عرضت:</span>
                    <span>{stat.viewed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>نقرت:</span>
                    <span>{stat.clicked}</span>
                  </div>
                  {stat.avgRating > 0 && (
                    <div className="flex items-center justify-between">
                      <span>متوسط التقييم:</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-current text-yellow-400" />
                        <span>{stat.avgRating}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* معلومات إضافية */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          معلومات إضافية
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">أول تفاعل:</span>
            <span className="mr-2">
              {formatDate(generalStats.first_interaction)}
            </span>
          </div>
          <div>
            <span className="font-medium">آخر تفاعل:</span>
            <span className="mr-2">
              {formatDate(generalStats.last_interaction)}
            </span>
          </div>
        </div>
      </div>

      {/* زر التحديث */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchUserStats}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          تحديث الإحصائيات
        </button>
      </div>
    </div>
  );
};

export default UserStats;
