import { useState, useEffect, useCallback } from "react";

export const useHadithTracking = () => {
  const [startTime, setStartTime] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  // تتبع عرض الحديث
  const trackHadithView = useCallback(async (hadithId) => {
    if (!hadithId) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(
        `${import.meta.env.VITE_API_URL}/recommendations/track-interaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
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
        }
      );
    } catch (error) {
      console.error("Error tracking hadith view:", error);
    }
  }, []);

  // تتبع بدء قراءة الحديث
  const startReading = (hadithId) => {
    setStartTime(Date.now());
    setIsTracking(true);
    trackHadithView(hadithId);
  };

  // تتبع انتهاء قراءة الحديث
  const trackHadithRead = useCallback(
    async (hadithId, rating = null, notes = null) => {
      if (!hadithId) return;

      const endTime = Date.now();
      const duration = startTime
        ? Math.floor((endTime - startTime) / 1000)
        : null;

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        await fetch(
          `${import.meta.env.VITE_API_URL}/recommendations/track-interaction`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token,
            },
            body: JSON.stringify({
              hadithId,
              interactionType: "read",
              metadata: {
                duration_seconds: duration,
                rating,
                notes,
                source_page: window.location.pathname,
                device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent)
                  ? "mobile"
                  : "desktop",
              },
            }),
          }
        );

        // إعادة تعيين التتبع
        setStartTime(null);
        setIsTracking(false);
      } catch (error) {
        console.error("Error tracking hadith read:", error);
      }
    },
    [startTime]
  );

  // تتبع الإشارة المرجعية
  const trackBookmark = async (
    hadithId,
    collection = "Default",
    notes = ""
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(
        `${import.meta.env.VITE_API_URL}/recommendations/track-interaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({
            hadithId,
            interactionType: "bookmark",
            metadata: {
              notes,
              collection,
              source_page: window.location.pathname,
              device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent)
                ? "mobile"
                : "desktop",
            },
          }),
        }
      );
    } catch (error) {
      console.error("Error tracking bookmark:", error);
    }
  };

  // تتبع الحفظ
  const trackMemorize = async (hadithId, confidenceLevel = 3, notes = "") => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(
        `${import.meta.env.VITE_API_URL}/recommendations/track-interaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({
            hadithId,
            interactionType: "memorize",
            metadata: {
              confidence_level: confidenceLevel,
              notes,
              source_page: window.location.pathname,
              device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent)
                ? "mobile"
                : "desktop",
            },
          }),
        }
      );
    } catch (error) {
      console.error("Error tracking memorize:", error);
    }
  };

  // تتبع المشاركة
  const trackShare = async (hadithId, shareMethod = "link") => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(
        `${import.meta.env.VITE_API_URL}/recommendations/track-interaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({
            hadithId,
            interactionType: "share",
            metadata: {
              share_method: shareMethod,
              source_page: window.location.pathname,
              device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent)
                ? "mobile"
                : "desktop",
            },
          }),
        }
      );
    } catch (error) {
      console.error("Error tracking share:", error);
    }
  };

  // تتبع الإعجاب
  const trackLike = async (hadithId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(
        `${import.meta.env.VITE_API_URL}/recommendations/track-interaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({
            hadithId,
            interactionType: "like",
            metadata: {
              source_page: window.location.pathname,
              device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent)
                ? "mobile"
                : "desktop",
            },
          }),
        }
      );
    } catch (error) {
      console.error("Error tracking like:", error);
    }
  };

  // تتبع التحليل
  const trackAnalyze = async (hadithId, analysisType = "general") => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(
        `${import.meta.env.VITE_API_URL}/recommendations/track-interaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({
            hadithId,
            interactionType: "analyze",
            metadata: {
              analysis_type: analysisType,
              source_page: window.location.pathname,
              device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent)
                ? "mobile"
                : "desktop",
            },
          }),
        }
      );
    } catch (error) {
      console.error("Error tracking analyze:", error);
    }
  };

  return {
    isTracking,
    trackHadithView,
    startReading,
    trackHadithRead,
    trackBookmark,
    trackMemorize,
    trackShare,
    trackLike,
    trackAnalyze,
  };
};
