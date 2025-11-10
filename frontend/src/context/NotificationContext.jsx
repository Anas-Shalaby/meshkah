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

  // جلب الإشعارات من السيرفر
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/quran-camps/notifications`,
        {
          headers: { "x-auth-token": token },
        }
      );
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
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
        // نداء للباك
        const token = localStorage.getItem("token");
        await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/quran-camps/notifications/${notificationId}/read`,
          {
            method: "PUT",
            headers: { "x-auth-token": token },
          }
        );
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

      // نداء للباك
      const token = localStorage.getItem("token");
      await fetch(
        `${import.meta.env.VITE_API_URL}/quran-camps/notifications/read-all`,
        {
          method: "PUT",
          headers: { "x-auth-token": token },
        }
      );

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
