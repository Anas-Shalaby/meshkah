import React, { useState, useEffect } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationContext } from "../context/NotificationContext";

const NotificationCenter = ({ isOpen, onClose }) => {
  // أزل كل state & logic المحلي القديم:
  // const [notifications, setNotifications] = useState([]);
  // const [unreadCount, setUnreadCount] = useState(0);
  // const [loading, setLoading] = useState(false);

  const {
    notifications,
    unreadCount,
    markAsRead,
    loading,
    fetchNotifications,
    markAllAsRead,
  } = useNotificationContext();
  // جديد: إدارة الإشعارات الموسعة
  const [expandedIds, setExpandedIds] = useState([]);

  // جلب الإشعارات
  // const fetchNotifications = async () => {
  //   try {
  //     setLoading(true);
  //     const token = localStorage.getItem("token");
  //     const response = await fetch(
  //       `${import.meta.env.VITE_API_URL}/quran-camps/notifications`,
  //       {
  //         headers: {
  //           "x-auth-token": token,
  //         },
  //       }
  //     );
  //     const data = await response.json();

  //     if (data.success) {
  //       setNotifications(data.data.notifications || []);
  //       setUnreadCount(data.data.unreadCount || 0);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching notifications:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // تحديد إشعار كمقروء
  // const markAsRead = async (notificationId) => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     await fetch(
  //       `${
  //         import.meta.env.VITE_API_URL
  //       }/quran-camps/notifications/${notificationId}/read`,
  //       {
  //         method: "PUT",
  //         headers: {
  //           "x-auth-token": token,
  //         },
  //       }
  //     );

  //     // تحديث الحالة محلياً
  //     setNotifications((prev) =>
  //       prev.map((notif) =>
  //         notif.id === notificationId ? { ...notif, is_read: true } : notif
  //       )
  //     );
  //     setUnreadCount((prev) => Math.max(0, prev - 1));
  //   } catch (error) {
  //     console.error("Error marking notification as read:", error);
  //   }
  // };

  // تحديد جميع الإشعارات كمقروءة
  // const markAllAsRead = async () => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     await fetch(
  //       `${import.meta.env.VITE_API_URL}/quran-camps/notifications/read-all`,
  //       {
  //         method: "PUT",
  //         headers: {
  //           "x-auth-token": token,
  //         },
  //       }
  //     );

  //     // تحديث الحالة محلياً
  //     setNotifications((prev) =>
  //       prev.map((notif) => ({ ...notif, is_read: true }))
  //     );
  //     setUnreadCount(0);
  //   } catch (error) {
  //     console.error("Error marking all notifications as read:", error);
  //   }
  // };

  // جلب الإشعارات عند فتح المركز
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // جلب الإشعارات عند تحميل الصفحة
  useEffect(() => {
    fetchNotifications();
  }, []);

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return "الآن";
    } else if (diffInHours < 24) {
      return `منذ ${diffInHours} ساعة`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `منذ ${diffInDays} يوم`;
    }
  };

  // الحصول على أيقونة نوع الإشعار
  const getNotificationIcon = (type) => {
    switch (type) {
      case "welcome":
        return "🎉";
      case "daily_reminder":
        return "📅";
      case "achievement":
        return "🏆";
      case "milestone":
        return "⭐";
      case "general":
        return "📢";
      default:
        return "🔔";
    }
  };

  // تحقق من الطول (مثلاً > 100 حرف)، أو اجعل الزر يظهر دومًا إذا يريد المستخدم
  const isClamped = (text = "") => text && text.length > 20;
  const isExpanded = (id) => expandedIds.includes(id);
  const handleExpand = (id) => setExpandedIds((prev) => [...prev, id]);
  const handleCollapse = (id) =>
    setExpandedIds((prev) => prev.filter((x) => x !== id));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 font-cairo bg-black bg-opacity-50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-[71px] font-cairo right-4 w-80 max-w-[90vw] bg-white rounded-2xl shadow-lg border border-gray-100 z-50 max-h-[70vh] overflow-hidden md:top-16 md:right-6 md:w-96"
          >
            {/* الهيدر */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#7440E9] rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">الإشعارات</h3>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-600">
                      {unreadCount} إشعار غير مقروء
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-3 py-1 bg-[#7440E9] text-white rounded-lg hover:bg-[#5a2fc7] transition-colors font-medium text-sm flex items-center space-x-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>تحديد الكل</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* قائمة الإشعارات */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[#7440E9] mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm">جاري التحميل...</p>
                </div>
              ) : (
                (() => {
                  // تصفية الإشعارات لإظهار فقط غير المقروءة (is_read === 0 أو false)
                  const unreadNotifications = notifications.filter(
                    (notif) =>
                      !notif.is_read ||
                      notif.is_read === 0 ||
                      notif.is_read === false
                  );

                  if (unreadNotifications.length === 0) {
                    return (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <h4 className="text-gray-600 font-medium mb-2">
                          لا توجد إشعارات غير مقروءة
                        </h4>
                        <p className="text-gray-500 text-sm">
                          جميع إشعاراتك مقروءة
                        </p>
                      </div>
                    );
                  }

                  return unreadNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 ${
                        !notification.is_read
                          ? "bg-gray-50 border-l-4 border-l-[#7440E9]"
                          : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800 text-sm leading-tight">
                                {notification.title}
                              </h4>
                              {!isExpanded(notification.id) ? (
                                <>
                                  <p className="text-gray-600 text-sm mt-1 leading-relaxed line-clamp-2">
                                    {notification.message}
                                  </p>
                                  {isClamped(notification.message) && (
                                    <button
                                      className="text-xs text-primary mt-1 underline focus:outline-none"
                                      onClick={() =>
                                        handleExpand(notification.id)
                                      }
                                    >
                                      المزيد
                                    </button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                                    {notification.message}
                                  </p>
                                  <button
                                    className="text-xs text-primary mt-1 underline focus:outline-none"
                                    onClick={() =>
                                      handleCollapse(notification.id)
                                    }
                                  >
                                    عرض أقل
                                  </button>
                                </>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-2">
                              {!notification.is_read && (
                                <div className="w-3 h-3 bg-[#7440E9] rounded-full"></div>
                              )}
                              {!notification.is_read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                                >
                                  <Check className="w-3 h-3 text-gray-600" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {formatDate(notification.sent_at)}
                            </span>
                            {notification.camp_name && (
                              <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-lg font-medium">
                                {notification.camp_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ));
                })()
              )}
            </div>

            {/* الفوتر */}
            {(() => {
              const unreadNotifications = notifications.filter(
                (notif) =>
                  !notif.is_read ||
                  notif.is_read === 0 ||
                  notif.is_read === false
              );
              return unreadNotifications.length > 0;
            })() && (
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={fetchNotifications}
                  className="w-full bg-[#7440E9] hover:bg-[#5a2fc7] text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Bell className="w-4 h-4" />
                  <span>تحديث الإشعارات</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
