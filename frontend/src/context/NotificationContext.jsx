import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

// إنشاء السياق
const NotificationContext = createContext();

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // جلب الإشعارات من السيرفر (المخيمات + الختمات)
  const fetchNotifications = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const token = localStorage.getItem("token");

      // جلب إشعارات المخيمات وإشعارات الختمات بالتوازي
      const [campResponse, journeyResponse] = await Promise.all([
        fetch(
          `${import.meta.env.VITE_API_URL}/camp-notifications?limit=50&page=1`,
          { headers: { "x-auth-token": token } }
        ),
        fetch(
          `${
            import.meta.env.VITE_API_URL
          }/book-journeys/notifications?limit=50&page=1`,
          { headers: { "x-auth-token": token } }
        ).catch(() => null), // في حالة فشل جلب إشعارات الختمات لا نوقف الباقي
      ]);

      const campData = await campResponse.json();
      const journeyData = journeyResponse ? await journeyResponse.json() : null;

      let allNotifications = [];
      let totalUnread = 0;

      // إضافة إشعارات المخيمات
      if (campData.success) {
        const campNotifications = (campData.data.notifications || []).map(
          (n) => ({
            ...n,
            source: "camp",
          })
        );
        allNotifications = [...allNotifications, ...campNotifications];
        totalUnread += campData.data.unreadCount || 0;
      }

      // إضافة إشعارات الختمات
      if (journeyData?.success) {
        const journeyNotifications = journeyData.data.notifications || [];
        allNotifications = [...allNotifications, ...journeyNotifications];
        totalUnread += journeyData.data.unreadCount || 0;
      }

      // ترتيب حسب التاريخ (الأحدث أولاً)
      allNotifications.sort(
        (a, b) => new Date(b.sent_at) - new Date(a.sent_at)
      );

      setNotifications(allNotifications);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // تحديث عداد الإشعارات المحلي مباشرة بعد التعليم كمقروء
  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        // تحديث أمامي سريع
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));

        // تحديد نوع الإشعار (ختمة أو مخيم)
        const token = localStorage.getItem("token");
        const isJourneyNotification =
          typeof notificationId === "string" &&
          notificationId.startsWith("journey_");

        const endpoint = isJourneyNotification
          ? `${
              import.meta.env.VITE_API_URL
            }/book-journeys/notifications/${notificationId}/read`
          : `${
              import.meta.env.VITE_API_URL
            }/camp-notifications/${notificationId}/read`;

        const response = await fetch(endpoint, {
          method: "PUT",
          headers: { "x-auth-token": token },
        });
        if (!response.ok) {
          throw new Error("Failed to mark notification as read");
        }
        // جلب الإشعارات لضمان التزامن مع الداتابيز
        fetchNotifications();
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [fetchNotifications]
  );

  // تحديد جميع الإشعارات كمقروءة
  const markAllAsRead = useCallback(async () => {
    try {
      // تحديث أمامي سريع
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

      // نداء للباك - لكلا النوعين بالتوازي
      const token = localStorage.getItem("token");
      await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/camp-notifications/read-all`, {
          method: "PUT",
          headers: { "x-auth-token": token },
        }),
        fetch(
          `${
            import.meta.env.VITE_API_URL
          }/book-journeys/notifications/read-all`,
          {
            method: "PUT",
            headers: { "x-auth-token": token },
          }
        ).catch(() => null), // تجاهل الخطأ إذا لم تكن الخدمة متاحة
      ]);

      // جلب الإشعارات لضمان التزامن مع الداتابيز
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      // في حالة الخطأ، نعيد جلب الإشعارات لإعادة الحالة الأصلية
      fetchNotifications();
    }
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        setNotifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
