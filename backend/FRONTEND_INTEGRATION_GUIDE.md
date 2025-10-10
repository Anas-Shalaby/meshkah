# دليل دمج نظام التوصيات الذكية مع الفرونت إند

## 🎯 الهدف

دمج نظام التوصيات الذكية مع الفرونت إند الموجود لتحسين تجربة المستخدم

## 📱 المكونات المطلوبة في الفرونت إند

### 1. **صفحة التوصيات الذكية**

```jsx
// components/SmartRecommendations.jsx
import React, { useState, useEffect } from "react";

const SmartRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(
        "/api/recommendations/smart-recommendations?limit=10",
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }
      );
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const trackRecommendationClick = async (recommendationId) => {
    try {
      await fetch("/api/recommendations/track-recommendation-interaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({
          recommendationId,
          interactionType: "click",
        }),
      });
    } catch (error) {
      console.error("Error tracking recommendation click:", error);
    }
  };

  if (loading) return <div>جاري تحميل التوصيات...</div>;

  return (
    <div className="smart-recommendations">
      <h2>🎯 التوصيات الذكية لك</h2>
      <div className="recommendations-grid">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="recommendation-card"
            onClick={() => trackRecommendationClick(rec.id)}
          >
            <div className="recommendation-type">
              {rec.recommendation_type === "similar_content" &&
                "🔗 محتوى مشابه"}
              {rec.recommendation_type === "trending" && "🔥 شائع"}
              {rec.recommendation_type === "personalized" && "⭐ مخصص لك"}
            </div>
            <div className="hadith-content">
              <p>{rec.hadeeth}</p>
              <small>{rec.attribution}</small>
            </div>
            <div className="recommendation-reason">
              <small>{rec.reason}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartRecommendations;
```

### 2. **تتبع تفاعل المستخدم مع الأحاديث**

```jsx
// hooks/useHadithTracking.js
import { useState } from "react";

export const useHadithTracking = () => {
  const [startTime, setStartTime] = useState(null);

  const trackHadithView = async (hadithId) => {
    try {
      await fetch("/api/recommendations/track-interaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({
          hadithId,
          interactionType: "view",
          metadata: {
            source_page: window.location.pathname,
            device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent)
              ? "mobile"
              : "desktop",
          },
        }),
      });
    } catch (error) {
      console.error("Error tracking hadith view:", error);
    }
  };

  const trackHadithRead = async (hadithId, rating = null) => {
    const endTime = Date.now();
    const duration = startTime
      ? Math.floor((endTime - startTime) / 1000)
      : null;

    try {
      await fetch("/api/recommendations/track-interaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({
          hadithId,
          interactionType: "read",
          metadata: {
            duration_seconds: duration,
            rating,
            source_page: window.location.pathname,
            device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent)
              ? "mobile"
              : "desktop",
          },
        }),
      });
    } catch (error) {
      console.error("Error tracking hadith read:", error);
    }
  };

  const startReading = () => {
    setStartTime(Date.now());
  };

  return {
    trackHadithView,
    trackHadithRead,
    startReading,
  };
};
```

### 3. **تحديث صفحة الحديث الموجود**

```jsx
// في صفحة الحديث الموجودة، أضف:
import { useHadithTracking } from "../hooks/useHadithTracking";

const HadithPage = ({ hadith }) => {
  const { trackHadithView, trackHadithRead, startReading } =
    useHadithTracking();

  useEffect(() => {
    // تتبع عرض الحديث
    if (hadith?.id) {
      trackHadithView(hadith.id);
    }
  }, [hadith?.id]);

  const handleStartReading = () => {
    startReading();
  };

  const handleFinishReading = (rating) => {
    trackHadithRead(hadith.id, rating);
  };

  return (
    <div className="hadith-page">
      {/* المحتوى الموجود */}

      {/* أضف أزرار التتبع */}
      <div className="tracking-buttons">
        <button onClick={handleStartReading}>بدء القراءة</button>
        <div className="rating-section">
          <label>تقييم الحديث:</label>
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => handleFinishReading(star)}>
              ⭐
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### 4. **إضافة التوصيات للصفحة الرئيسية**

```jsx
// في الصفحة الرئيسية، أضف:
import SmartRecommendations from "../components/SmartRecommendations";

const HomePage = () => {
  return (
    <div className="home-page">
      {/* المحتوى الموجود */}

      {/* أضف التوصيات الذكية */}
      <section className="recommendations-section">
        <SmartRecommendations />
      </section>
    </div>
  );
};
```

## 🎨 **تصميم بسيط للتوصيات**

```css
/* styles/smart-recommendations.css */
.smart-recommendations {
  margin: 20px 0;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  color: white;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.recommendation-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.3s ease;
  backdrop-filter: blur(10px);
}

.recommendation-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.2);
}

.recommendation-type {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 14px;
}

.hadith-content p {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 10px;
}

.hadith-content small {
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
}

.recommendation-reason {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}
```

## 📊 **إضافة إحصائيات المستخدم**

```jsx
// components/UserStats.jsx
import React, { useState, useEffect } from "react";

const UserStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await fetch("/api/recommendations/user-stats", {
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  if (!stats) return <div>جاري تحميل الإحصائيات...</div>;

  return (
    <div className="user-stats">
      <h3>📊 إحصائياتك</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <h4>{stats.generalStats.unique_hadiths_read || 0}</h4>
          <p>أحاديث مختلفة قرأتها</p>
        </div>
        <div className="stat-card">
          <h4>{stats.generalStats.total_interactions || 0}</h4>
          <p>إجمالي التفاعلات</p>
        </div>
        <div className="stat-card">
          <h4>{stats.recommendationStats.length || 0}</h4>
          <p>توصيات تلقيتها</p>
        </div>
      </div>
    </div>
  );
};

export default UserStats;
```

## 🚀 **خطوات التنفيذ**

### **المرحلة الأولى: التتبع الأساسي**

1. أضف `useHadithTracking` hook
2. تتبع عرض وقراءة الأحاديث
3. تتبع الإشارات المرجعية والحفظ

### **المرحلة الثانية: التوصيات**

1. أضف صفحة التوصيات الذكية
2. أضف التوصيات للصفحة الرئيسية
3. تتبع تفاعل المستخدم مع التوصيات

### **المرحلة الثالثة: التحسين**

1. أضف إحصائيات المستخدم
2. أضف أنماط القراءة
3. حسّن واجهة التوصيات

## 💡 **نصائح للتنفيذ**

1. **ابدأ بسيط**: تتبع التفاعلات الأساسية أولاً
2. **اختبر مع مستخدمين حقيقيين**: شوف إيه اللي بيشتغل
3. **حسّن تدريجياً**: أضف مميزات جديدة كل فترة
4. **راقب الأداء**: تأكد إن النظام مش بيبطئ الموقع

## 🎯 **النتيجة المتوقعة**

بعد التنفيذ، المستخدمين هيشوفوا:

- ✅ توصيات ذكية تناسبهم
- ✅ تجربة شخصية أفضل
- ✅ محتوى أكثر تنوعاً
- ✅ وقت أطول على الموقع
