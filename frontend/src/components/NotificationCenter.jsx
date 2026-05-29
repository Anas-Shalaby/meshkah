import React, { useState, useEffect, useRef } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationContext } from "../context/NotificationContext";
import { useTheme } from "../context/ThemeContext";

const ACCENT = "#7440E9";

const NotificationCenter = ({ isOpen, onClose, variant = "modal" }) => {
  const { isNight } = useTheme();
  const isDropdown = variant === "dropdown";
  const c = isNight
    ? {
        panel: "border-white/10 bg-[#212328]",
        headerBorder: "border-white/10",
        title: "text-zinc-100",
        sub: "text-zinc-400",
        closeBtn: "bg-white/5 hover:bg-white/10 text-zinc-300",
        item: "border-white/5 hover:bg-white/[0.04]",
        itemUnread: "bg-white/[0.04]",
        iconBox: "bg-white/5",
        itemTitle: "text-zinc-100",
        itemBody: "text-zinc-400",
        chip: "bg-white/5 text-zinc-400",
        emptyBox: "bg-white/5",
        emptyIcon: "text-zinc-500",
        emptyTitle: "text-zinc-300",
        emptySub: "text-zinc-500",
      }
    : {
        panel: "border-gray-100 bg-white",
        headerBorder: "border-gray-100",
        title: "text-gray-800",
        sub: "text-gray-600",
        closeBtn: "bg-gray-100 hover:bg-gray-200 text-gray-600",
        item: "border-gray-100 hover:bg-gray-50",
        itemUnread: "bg-gray-50",
        iconBox: "bg-gray-100",
        itemTitle: "text-gray-800",
        itemBody: "text-gray-600",
        chip: "bg-gray-100 text-gray-500",
        emptyBox: "bg-gray-100",
        emptyIcon: "text-gray-400",
        emptyTitle: "text-gray-600",
        emptySub: "text-gray-500",
      };
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
  const panelRef = useRef(null);

  // إغلاق القائمة المنسدلة عند الضغط خارجها (وضع الـ dropdown على سطح المكتب)
  useEffect(() => {
    if (!isDropdown || !isOpen) return;
    const handleOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isDropdown, isOpen, onClose]);

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

  // تحديث خفيف عند فتح المركز دون إعادة تحميل كامل للصفحة
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(true);
    }
  }, [isOpen, fetchNotifications]);

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
  const getNotificationIcon = (type, source) => {
    // إشعارات الختمات
    if (source === "journey") {
      switch (type) {
        case "friend_completed_day":
          return "📖";
        case "friend_finished_book":
          return "🎊";
        case "friend_started_book":
          return "🚀";
        case "reminder":
          return "⏰";
        default:
          return "📚";
      }
    }

    // إشعارات المخيمات
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
          {/* Backdrop — في وضع النافذة فقط (الجوال) */}
          {!isDropdown && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 font-cairo z-[1090] bg-black bg-opacity-50"
            />
          )}

          {/* Modal */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={
              isDropdown
                ? `absolute top-full mt-3 left-0 font-cairo w-96 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border z-[1100] max-h-[70vh] overflow-hidden ${c.panel}`
                : `fixed top-[71px] font-cairo right-2 left-2 sm:right-4 sm:left-auto w-auto sm:w-80 max-w-[calc(100vw-1rem)] sm:max-w-[90vw] rounded-2xl shadow-2xl border z-[1100] max-h-[70vh] overflow-hidden md:top-16 md:right-6 md:w-96 lg:right-[7.5rem] ${c.panel}`
            }
          >
            {/* الهيدر */}
            <div
              className={`flex items-center justify-between p-3 sm:p-4 border-b ${c.headerBorder}`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`font-bold text-base sm:text-lg truncate ${c.title}`}>
                    الإشعارات
                  </h3>
                  {unreadCount > 0 && (
                    <p className={`text-xs sm:text-sm truncate ${c.sub}`}>
                      {unreadCount} إشعار غير مقروء
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-2 py-1 sm:px-3 sm:py-1 text-white rounded-lg transition-opacity hover:opacity-90 font-medium text-xs sm:text-sm flex items-center space-x-1"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span className="hidden sm:inline">تحديد الكل</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors ${c.closeBtn}`}
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* قائمة الإشعارات */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-6 sm:p-8 text-center">
                  <div
                    className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-4 mx-auto mb-3 sm:mb-4"
                    style={{ borderColor: ACCENT }}
                  ></div>
                  <p className={`text-xs sm:text-sm ${c.sub}`}>جاري التحميل...</p>
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
                        <div
                          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 ${c.emptyBox}`}
                        >
                          <Bell
                            className={`w-6 h-6 sm:w-8 sm:h-8 ${c.emptyIcon}`}
                          />
                        </div>
                        <h4
                          className={`font-medium mb-2 text-sm sm:text-base ${c.emptyTitle}`}
                        >
                          لا توجد إشعارات غير مقروءة
                        </h4>
                        <p className={`text-xs sm:text-sm ${c.emptySub}`}>
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
                      className={`p-3 sm:p-4 border-b transition-all duration-200 ${c.item} ${
                        !notification.is_read
                          ? `${c.itemUnread} border-l-4`
                          : ""
                      }`}
                      style={
                        !notification.is_read
                          ? { borderLeftColor: ACCENT }
                          : undefined
                      }
                    >
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base sm:text-lg flex-shrink-0 ${c.iconBox}`}
                        >
                          {getNotificationIcon(
                            notification.type,
                            notification.source
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`font-semibold text-xs sm:text-sm leading-tight break-words ${c.itemTitle}`}
                              >
                                {notification.title}
                              </h4>
                              {!isExpanded(notification.id) ? (
                                <>
                                  <p
                                    className={`text-xs sm:text-sm mt-1 leading-relaxed line-clamp-2 break-words ${c.itemBody}`}
                                  >
                                    {notification.message}
                                  </p>
                                  {isClamped(notification.message) && (
                                    <button
                                      className="text-xs mt-1 underline focus:outline-none"
                                      style={{ color: ACCENT }}
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
                                  <p
                                    className={`text-xs sm:text-sm mt-1 leading-relaxed break-words ${c.itemBody}`}
                                  >
                                    {notification.message}
                                  </p>
                                  <button
                                    className="text-xs mt-1 underline focus:outline-none"
                                    style={{ color: ACCENT }}
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
                                <div
                                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                                  style={{ backgroundColor: ACCENT }}
                                ></div>
                              )}
                              {!notification.is_read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center transition-colors ${c.closeBtn}`}
                                >
                                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-2 sm:mt-3 flex-wrap">
                            <span
                              className={`text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap ${c.chip}`}
                            >
                              {formatDate(notification.sent_at)}
                            </span>
                            {notification.camp_name && (
                              <span
                                className={`text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg font-medium truncate max-w-[50%] sm:max-w-none ${c.chip}`}
                              >
                                {notification.camp_name}
                              </span>
                            )}
                            {notification.source === "journey" && (
                              <span
                                className="text-[10px] sm:text-xs text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg font-medium truncate max-w-[50%] sm:max-w-none"
                                style={{ backgroundColor: ACCENT }}
                              >
                                📚 ختمات الكتب
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
              <div className={`p-3 sm:p-4 border-t ${c.headerBorder}`}>
                <button
                  onClick={fetchNotifications}
                  className="w-full text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg transition-opacity hover:opacity-90 flex items-center justify-center space-x-2"
                  style={{ backgroundColor: ACCENT }}
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
