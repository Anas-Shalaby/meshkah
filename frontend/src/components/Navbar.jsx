import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS_MOBILE = [
  { name: "الرئيسية", to: "/" },
  { name: "حديث اليوم", to: "/daily-hadith" },
  { name: "الأحاديث", to: "/hadiths" },
  { name: "المكتبة الإسلامية", to: "/islamic-library" },
  { name: "المحفوظات", to: "/saved" },
  { name: "البطاقات الدعوية", to: "/public-cards" },
  { name: "من نحن", to: "/about" },
  { name: "تواصل معنا", to: "/contact" },
];
const NAV_LINKS = [
  { name: "الرئيسية", to: "/" },
  { name: "حديث اليوم", to: "/daily-hadith" },
  { name: "الأحاديث", to: "/hadiths" },
  { name: "المكتبة الإسلامية", to: "/islamic-library" },
  { name: "البطاقات الدعوية", to: "/public-cards" },
  { name: "من نحن", to: "/about" },
  { name: "تواصل معنا", to: "/contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close mobile menu on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    if (mobileOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [mobileOpen]);

  // جلب الإشعارات من الـ API عند فتح القائمة أو عند تحميل الصفحة
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    // عند تحميل الصفحة لأول مرة
    fetchNotifications();
  }, [isAuthenticated, user]);

  // عند فتح قائمة الإشعارات (notifOpen)
  useEffect(() => {
    if (notifOpen && isAuthenticated && user) {
      fetchNotifications();
    }
  }, [notifOpen, isAuthenticated, user]);

  async function fetchNotifications() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/notifications`,
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }
      );
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch {
      // يمكن عرض رسالة خطأ أو تجاهلها
    }
  }

  const handleMobileToggle = () => setMobileOpen((open) => !open);
  const closeMobile = () => setMobileOpen(false);
  const getAvatarUrl = (user) => {
    if (!user) return "/default-avatar.png";
    if (user.avatar_url) {
      if (user.avatar_url.startsWith("http")) {
        return user.avatar_url;
      } else if (user.avatar_url.startsWith("/uploads/avatars")) {
        return `${import.meta.env.VITE_IMAGE_API}/api${user.avatar_url}`;
      }
    }
    return "/default-avatar.png";
  };
  const avatarUrl = getAvatarUrl(user);

  return (
    <>
      <nav
        className="font-cairo fixed top-0 right-0 left-0 z-[1000] bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur border-b border-[#e5e7eb] dark:border-[#23283a] shadow-sm transition-all duration-200"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex font-['MeshkahFont'] items-center gap-2 text-[#7440E9] text-3xl font-bold tracking-tight select-none"
          >
            مشكاة
            <span className="text-xs">AA</span>
          </Link>
          {/* Centered Desktop Nav */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="flex items-center gap-2 lg:gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 hover:bg-[#f3f0fa] hover:text-[#7440E9] dark:hover:bg-[#23283a] dark:hover:text-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#7440E9] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0f172a] ${
                    location.pathname === link.to
                      ? "bg-[#f3f0fa] text-[#7440E9] font-bold dark:bg-[#23283a] dark:text-[#FFD700]"
                      : "text-[#0f172a] dark:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          {/* الجرس + زر القائمة (الهامبرجر) */}
          <div className="flex items-center gap-2">
            <button
              className="md:hidden flex items-center justify-center p-3 rounded focus:outline-none focus:ring-2 focus:ring-[#7440E9]"
              onClick={handleMobileToggle}
              aria-label="فتح القائمة"
            >
              {mobileOpen ? (
                <X className="w-7 h-7 text-[#7440E9]" />
              ) : (
                <Menu className="w-7 h-7 text-[#7440E9]" />
              )}
            </button>
          </div>
          {/* Desktop User/Profile or CTA Button */}
          <div className="hidden md:flex items-center">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  className="flex items-center gap-2 focus:outline-none"
                  onClick={() => setDropdownOpen((v) => !v)}
                >
                  <img
                    src={avatarUrl || "https://hadith-shareef.com/default.jpg"}
                    alt={user.username}
                    className="w-10 h-10 rounded-full border-2 border-[#7440E9] object-cover shadow"
                  />
                  <span className="font-semibold text-[#7440E9]">
                    {user.username}
                  </span>
                  <User className="w-5 h-5 text-[#7440E9]" />
                </button>
                {dropdownOpen && (
                  <div className="absolute left-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50 text-right">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-[#f3f0fa] hover:text-[#7440E9] transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      الملف الشخصي
                    </Link>
                    <Link
                      to="/saved"
                      className="block px-4 py-2 text-gray-700 hover:bg-[#f3f0fa] hover:text-[#7440E9] transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      محفوظاتي
                    </Link>

                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-right px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-block  px-4 py-2 rounded bg-indigo-600 text-white font-bold text-md hover:bg-indigo-700 transition"
              >
                ابدأ الآن
              </Link>
            )}
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-[9999] bg-black/40"
          onClick={closeMobile}
        >
          <div
            className="absolute top-0 right-0 w-72 max-w-full h-full bg-white dark:bg-[#1a202c] shadow-lg flex flex-col gap-2 py-8 px-6 transition-all  animate-fade-in-item"
            style={{
              fontFamily: "'Cairo', 'Amiri', 'Tajawal', sans-serif",
              transition: "transform 0.3s cubic-bezier(.4,0,.2,1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="self-end mb-4 p-3 rounded focus:outline-none focus:ring-2 focus:ring-[#7440E9]"
              onClick={closeMobile}
              aria-label="إغلاق القائمة"
            >
              <X className="w-7 h-7 text-[#7440E9]" />
            </button>
            {isAuthenticated && user && (
              <Link
                to="/profile"
                onClick={closeMobile}
                className="flex flex-col items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-6 mb-4"
              >
                <img
                  src={avatarUrl}
                  alt={user.username}
                  className="w-16 h-16 rounded-full border-2 border-[#7440E9] object-cover shadow-lg"
                />
                <span className="font-bold text-lg text-gray-800 dark:text-white">
                  {user.username}
                </span>
              </Link>
            )}
            {NAV_LINKS_MOBILE.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMobile}
                className={`block px-4 py-3 rounded-md text-lg font-medium transition-colors duration-200 hover:bg-[#f3f0fa] hover:text-[#7440E9] dark:hover:bg-[#23283a] dark:hover:text-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#7440E9] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0f172a] ${
                  location.pathname === link.to
                    ? "bg-[#f3f0fa] text-[#7440E9] font-bold dark:bg-[#23283a] dark:text-[#FFD700]"
                    : "text-[#0f172a] dark:text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/privacy-policy"
                onClick={closeMobile}
                className="block text-center text-sm text-gray-500 hover:text-[#7440E9] mb-4"
              >
                سياسة الخصوصية
              </Link>
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    closeMobile();
                  }}
                  className="w-full text-center px-5 py-3 rounded-full bg-red-500 text-white text-lg font-semibold shadow transition-all duration-200 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  تسجيل الخروج
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="inline-block px-4 py-2 rounded bg-indigo-600 text-white font-bold text-base   hover:bg-indigo-700 transition"
                >
                  ابدأ الآن
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
