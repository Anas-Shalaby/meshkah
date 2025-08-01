import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const NOTIF_TYPES = [
  { label: "الكل", value: "all" },
  { label: "إعجابات", value: "like" },
  { label: "مشاركات", value: "share" },
  { label: "تعليقات", value: "comment" },
];

const getNotifIcon = (type) => {
  if (type === "like") return <span className="text-lg">👍</span>;
  if (type === "share") return <span className="text-lg">🔄</span>;
  if (type === "comment") return <span className="text-lg">💬</span>;
  return <span className="text-lg">🔔</span>;
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNotifClickItem = async (notif) => {
    if (!notif.is_read && notif.id) {
      try {
        await fetch(
          `${import.meta.env.VITE_API_URL}/notifications/${notif.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": localStorage.getItem("token"),
            },
          }
        );
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      } catch {
        // يمكن تجاهل الخطأ أو عرض رسالة
      }
    }
    if (notif.cardId) navigate(`/shared-card/${notif.shareLink}`);
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/notifications`,
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );

      const newNotifications = response.data.notifications;
      setNotifications(newNotifications);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filtered =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.type === filter);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="w-6 h-6 text-indigo-500 animate-spin" />
        <span className="mr-3 text-gray-600 dark:text-gray-400">
          جاري التحميل...
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              يرجى تسجيل الدخول
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              لعرض الإشعارات الخاصة بك، يجب عليك تسجيل الدخول أولاً
            </p>
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 bg-[#7440E9] text-white rounded-lg hover:bg-[#5E35B7] transition-colors"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-2 sm:px-4 min-h-screen" dir="rtl">
      <h1 className="text-3xl font-bold text-[#7440E9] mb-6 text-center">
        كل الإشعارات
      </h1>
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {NOTIF_TYPES.map((t) => (
          <button
            key={t.value}
            className={`px-4 py-2 rounded-full border font-bold text-sm transition ${
              filter === t.value
                ? "bg-[#7440E9] text-white border-[#7440E9]"
                : "bg-white text-[#7440E9] border-[#7440E9] hover:bg-indigo-50"
            }`}
            onClick={() => setFilter(t.value)}
          >
            {t.label}
          </button>
        ))}
        <button
          className="ml-auto px-4 py-2 rounded-full bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition"
          onClick={async () => {
            try {
              await fetch(
                `${import.meta.env.VITE_API_URL}/notifications/read-all`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    "x-auth-token": localStorage.getItem("token"),
                  },
                }
              );
              setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: true }))
              );
            } catch {
              // يمكن تجاهل الخطأ أو عرض رسالة
            }
          }}
        >
          تمييز الكل كمقروء
        </button>
      </div>
      {filtered.length === 0 ? (
        <div className="text-gray-400 text-lg text-center py-16">
          لا توجد إشعارات هنا بعد 🎉
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((notif) => {
            const isUnread = notif.is_read === false || notif.is_read === 0;
            const iconBg =
              notif.type === "like"
                ? "bg-green-100 text-green-600"
                : notif.type === "share"
                ? "bg-blue-100 text-blue-600"
                : notif.type === "comment"
                ? "bg-yellow-100 text-yellow-600"
                : "bg-indigo-100 text-indigo-600";
            return (
              <div
                key={notif.id}
                className={`flex items-center gap-4 rounded-2xl shadow border px-5 py-4 bg-white hover:bg-indigo-50 transition cursor-pointer ${
                  isUnread ? "ring-2 ring-indigo-200" : ""
                }`}
                onClick={() =>
                  notif.cardId && navigate(`/public-cards/${notif.cardId}`)
                }
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shadow-sm ${iconBg}`}
                >
                  {getNotifIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#7440E9] truncate mb-1">
                    {notif.message}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    {notif.fromUser?.name && <span>{notif.fromUser.name}</span>}
                    <span>
                      {notif.created_at
                        ? formatDistanceToNow(new Date(notif.created_at), {
                            addSuffix: true,
                            locale: ar,
                          })
                        : "الآن"}
                    </span>
                  </div>
                </div>
                {!notif.is_read && (
                  <button
                    className="ml-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold hover:bg-indigo-200 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotifClickItem(notif);
                      setNotifications((prev) =>
                        prev.map((n) =>
                          n.id === notif.id ? { ...n, is_read: true } : n
                        )
                      );
                    }}
                  >
                    تمييز كمقروء
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
