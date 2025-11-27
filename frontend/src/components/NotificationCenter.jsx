import React, { useState, useEffect, useMemo } from "react";
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
      case "daily_message":
        return "💬";
      case "achievement":
        return "🏆";
      case "milestone":
        return "⭐";
      case "general":
      case "admin_message":
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
            className="fixed top-[71px] font-cairo right-2 left-2 sm:right-4 sm:left-auto w-auto sm:w-80 max-w-[calc(100vw-1rem)] sm:max-w-[90vw] bg-white rounded-2xl shadow-lg border border-gray-100 z-50 max-h-[70vh] overflow-hidden md:top-16 md:right-6 md:w-96"
          >
            {/* الهيدر */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#7440E9] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-800 text-base sm:text-lg truncate">
                    الإشعارات
                  </h3>
                  {unreadCount > 0 && (
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {unreadCount} إشعار غير مقروء
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-2 py-1 sm:px-3 sm:py-1 bg-[#7440E9] text-white rounded-lg hover:bg-[#5a2fc7] transition-colors font-medium text-xs sm:text-sm flex items-center space-x-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span className="hidden sm:inline">تحديد الكل</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* قائمة الإشعارات */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-6 sm:p-8 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-4 border-[#7440E9] mx-auto mb-3 sm:mb-4"></div>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    جاري التحميل...
                  </p>
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
                      <div className="p-6 sm:p-8 text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                        </div>
                        <h4 className="text-gray-600 font-medium mb-2 text-sm sm:text-base">
                          لا توجد إشعارات غير مقروءة
                        </h4>
                        <p className="text-gray-500 text-xs sm:text-sm">
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
                      className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 ${
                        !notification.is_read
                          ? "bg-gray-50 border-l-4 border-l-[#7440E9]"
                          : ""
                      }`}
                    >
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-xl flex items-center justify-center text-base sm:text-lg flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-800 text-xs sm:text-sm leading-tight break-words">
                                {notification.title}
                              </h4>
                              {!isExpanded(notification.id) ? (
                                <>
                                  <p className="text-gray-600 text-xs sm:text-sm mt-1 leading-relaxed line-clamp-2 break-words">
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
                                  <p className="text-gray-600 text-xs sm:text-sm mt-1 leading-relaxed break-words">
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
                            <div className="flex items-center space-x-1 sm:space-x-2 ml-1 sm:ml-2 flex-shrink-0">
                              {!notification.is_read && (
                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#7440E9] rounded-full"></div>
                              )}
                              {!notification.is_read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                                >
                                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-600" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-2 sm:mt-3 flex-wrap">
                            <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                              {formatDate(notification.sent_at)}
                            </span>
                            {notification.camp_name && (
                              <span className="text-[10px] sm:text-xs text-gray-600 bg-gray-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg font-medium truncate max-w-[50%] sm:max-w-none">
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
              <div className="p-3 sm:p-4 border-t border-gray-100">
                <button
                  onClick={fetchNotifications}
                  className="w-full bg-[#7440E9] hover:bg-[#5a2fc7] text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
