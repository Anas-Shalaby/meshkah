import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, BookOpen, Sparkles, Heart, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS_MOBILE = [
  { name: "الرئيسية", to: "/", icon: Sparkles },
  { name: "حديث اليوم", to: "/daily-hadith", icon: BookOpen },
  { name: "الأحاديث", to: "/hadiths", icon: BookOpen },
  { name: "المكتبة الإسلامية", to: "/islamic-library", icon: BookOpen },
  { name: "المحفوظات", to: "/saved", icon: Heart },
  { name: "البطاقات الدعوية", to: "/public-cards", icon: Shield },
  { name: "من نحن", to: "/about", icon: Shield },
  { name: "تواصل معنا", to: "/contact", icon: Shield },
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
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="font-cairo fixed top-0 right-0 left-0 z-[1000] bg-white/90 backdrop-blur-xl border-b border-purple-200/50 shadow-lg transition-all duration-300"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/"
              className="flex font-['MeshkahFont'] items-center gap-2 text-[#7440E9] text-2xl sm:text-3xl font-bold tracking-tight select-none"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              مشكاة
              <span className="text-sm text-gray-500">AA</span>
            </Link>
          </motion.div>

          {/* Centered Desktop Nav */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="flex items-center gap-1 lg:gap-2">
              {NAV_LINKS.map((link, index) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={link.to}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:text-[#7440E9] focus:outline-none focus:ring-2 focus:ring-[#7440E9] focus:ring-offset-2 ${
                      location.pathname === link.to
                        ? "bg-gradient-to-r from-purple-100 to-indigo-100 text-[#7440E9] font-bold shadow-md"
                        : "text-gray-700 hover:shadow-sm"
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="md:hidden flex items-center justify-center p-2 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#7440E9]"
              onClick={handleMobileToggle}
              aria-label="فتح القائمة"
            >
              {mobileOpen ? (
                <X className="w-6 h-6 text-[#7440E9]" />
              ) : (
                <Menu className="w-6 h-6 text-[#7440E9]" />
              )}
            </motion.button>
          </div>

          {/* Desktop User/Profile or CTA Button */}
          <div className="hidden md:flex items-center">
            {isAuthenticated && user ? (
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.02 }}
              >
                <button
                  className="flex items-center gap-3 p-2 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#7440E9]"
                  onClick={() => setDropdownOpen((v) => !v)}
                >
                  <motion.img
                    whileHover={{ scale: 1.1 }}
                    src={avatarUrl || "https://hadith-shareef.com/default.jpg"}
                    alt={user.username}
                    className="w-8 h-8 rounded-full border-2 border-[#7440E9] object-cover shadow-md"
                  />
                  <span className="font-semibold text-[#7440E9] text-sm">
                    {user.username}
                  </span>
                  <User className="w-4 h-4 text-[#7440E9]" />
                </button>
                
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 mt-2 w-48 bg-white/95 backdrop-blur-xl border border-purple-200/50 rounded-2xl shadow-2xl py-2 z-50 text-right"
                    >
                      <Link
                        to="/profile"
                        className="block px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:text-[#7440E9] transition-all duration-300"
                        onClick={() => setDropdownOpen(false)}
                      >
                        الملف الشخصي
                      </Link>
                      <Link
                        to="/saved"
                        className="block px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:text-[#7440E9] transition-all duration-300"
                        onClick={() => setDropdownOpen(false)}
                      >
                        محفوظاتي
                      </Link>
                      <div className="border-t border-purple-100 my-2"></div>
                      <button
                        onClick={() => {
                          logout();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-right px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
                      >
                        تسجيل الخروج
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Sparkles className="w-4 h-4" />
                  ابدأ الآن
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            onClick={closeMobile}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="absolute top-0 right-0 w-80 max-w-[85vw] h-full bg-white/95 backdrop-blur-xl shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-purple-200/50">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 text-[#7440E9] text-xl font-bold"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  مشكاة
                  <span className="text-sm text-gray-500">AA</span>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-all duration-300"
                  onClick={closeMobile}
                  aria-label="إغلاق القائمة"
                >
                  <X className="w-6 h-6 text-[#7440E9]" />
                </motion.button>
              </div>

              {/* User Profile Section */}
              {isAuthenticated && user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 border-b border-purple-200/50"
                >
                  <Link
                    to="/profile"
                    onClick={closeMobile}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-all duration-300"
                  >
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      src={avatarUrl}
                      alt={user.username}
                      className="w-12 h-12 rounded-full border-2 border-[#7440E9] object-cover shadow-lg"
                    />
                    <div>
                      <span className="font-bold text-lg text-gray-800">
                        {user.username}
                      </span>
                      <p className="text-sm text-gray-600">عضو نشط</p>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* Navigation Links */}
              <div className="flex-1 p-6 space-y-2">
                {NAV_LINKS_MOBILE.map((link, index) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={link.to}
                      onClick={closeMobile}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:text-[#7440E9] focus:outline-none focus:ring-2 focus:ring-[#7440E9] ${
                        location.pathname === link.to
                          ? "bg-gradient-to-r from-purple-100 to-indigo-100 text-[#7440E9] font-bold shadow-md"
                          : "text-gray-700"
                      }`}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-purple-200/50 space-y-4">
                <Link
                  to="/privacy-policy"
                  onClick={closeMobile}
                  className="block text-center text-sm text-gray-500 hover:text-[#7440E9] transition-colors duration-300"
                >
                  سياسة الخصوصية
                </Link>
                {isAuthenticated ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      logout();
                      closeMobile();
                    }}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-base font-semibold shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    تسجيل الخروج
                  </motion.button>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to="/login"
                      onClick={closeMobile}
                      className="inline-flex items-center gap-2 w-full justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-base font-semibold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300"
                    >
                      <Sparkles className="w-4 h-4" />
                      ابدأ الآن
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
