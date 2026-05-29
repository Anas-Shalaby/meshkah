import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  BookOpen,
  Sparkles,
  Heart,
  Shield,
  GraduationCap,
  Brain,
  Moon,
  Sun,
  Search,
  Home,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
export const NAV_RAIL_WIDTH_CLASS = "lg:pr-24";
const RAIL_TOOLTIP_RIGHT = "6.35rem";

const NAV_SECTIONS = [
  {
    title: "الرئيسية",
    links: [
      { name: "الرئيسية", to: "/", icon: Sparkles },
      { name: "حديث اليوم", to: "/daily-hadith", icon: BookOpen },
    ],
  },
  {
    title: "التعلم",
    links: [
      { name: "المكتبة الإسلامية", to: "/islamic-library", icon: BookOpen },
    ],
  },
  {
    title: "الميزات",
    links: [
      { name: "المخيمات ", to: "/quran-camps", icon: GraduationCap },
      { name: "ختمات الكتب", to: "/book-journeys", icon: BookOpen },
      { name: "المراجعة الذكية", to: "/reviews", icon: Brain },
      { name: "المحفوظات", to: "/saved", icon: Heart },
    ],
  },
];

const BOTTOM_NAV = [
  { name: "الرئيسية", to: "/", icon: Home },
  { name: "المكتبة", to: "/islamic-library", icon: BookOpen },
  { name: "المخيمات", to: "/quran-camps", icon: GraduationCap },
  { name: "المحفوظات", to: "/saved", icon: Heart },
];

function flattenNavLinks(sections) {
  const seen = new Set();
  const out = [];
  for (const sec of sections) {
    for (const link of sec.links) {
      if (seen.has(link.to)) continue;
      seen.add(link.to);
      out.push(link);
    }
  }
  return out;
}

const RailNavLink = ({ link, pathname, onShowTip, onHideTip, isNight }) => {
  const Icon = link.icon;
  const active =
    link.to === "/"
      ? pathname === "/"
      : pathname === link.to || pathname.startsWith(`${link.to}/`);

  return (
    <Link
      to={link.to}
      onMouseEnter={(e) => onShowTip(link.name, e)}
      onMouseLeave={onHideTip}
      className={`group relative flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 outline-none focus-visible:ring-offset-2 ${
        isNight
          ? "focus-visible:ring-offset-[#1a1a1e]"
          : "focus-visible:ring-offset-white"
      } ${
        active
          ? isNight
            ? "bg-[#34343a] text-zinc-100 shadow-inner"
            : " text-[#7440E9] shadow-inner"
          : isNight
            ? "text-zinc-500 hover:bg-[#2c2c31] hover:text-zinc-200"
            : "text-gray-600 hover:bg-gradient-to-l hover:from-purple-50/90 hover:to-indigo-50/80 hover:text-[#7440E9]"
      }`}
      aria-label={link.name}
    >
      <Icon
        className={`h-[17px] w-[17px] shrink-0 transition-transform duration-200 
        }`}
        aria-hidden
      />
      <span
        className={`max-w-full text-center text-[10px] font-semibold leading-tight line-clamp-2 transition-colors duration-200 ${
          active
            ? isNight
              ? "text-zinc-100"
              : "text-[#7440E9]"
            : isNight
              ? "text-zinc-500 group-hover:text-zinc-200"
              : "text-gray-500 group-hover:text-[#7440E9]"
        }`}
      >
        {link.name.trim()}
      </span>
    </Link>
  );
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [railHoverTip, setRailHoverTip] = useState(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const railTipClearTimer = useRef(null);

  const isActive = (to) =>
    to === "/"
      ? location.pathname === "/"
      : location.pathname === to || location.pathname.startsWith(`${to}/`);

  const submitMobileSearch = (e) => {
    e.preventDefault();
    const q = mobileSearchQuery.trim();
    if (!q) return;
    navigate(`/hadiths?search=${encodeURIComponent(q)}`);
    setMobileSearchOpen(false);
    setMobileSearchQuery("");
  };

  const showRailTip = (label, e) => {
    if (railTipClearTimer.current) {
      clearTimeout(railTipClearTimer.current);
      railTipClearTimer.current = null;
    }
    const r = e.currentTarget.getBoundingClientRect();
    setRailHoverTip({ label, top: r.top + r.height / 2 });
  };

  const scheduleHideRailTip = () => {
    if (railTipClearTimer.current) clearTimeout(railTipClearTimer.current);
    railTipClearTimer.current = window.setTimeout(() => {
      setRailHoverTip(null);
      railTipClearTimer.current = null;
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (railTipClearTimer.current) clearTimeout(railTipClearTimer.current);
    };
  }, []);

  const flatRailLinks = useMemo(() => flattenNavLinks(NAV_SECTIONS), []);

  useEffect(() => {
    setRailHoverTip(null);
    setMobileSearchOpen(false);
  }, [location.pathname]);

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

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setDropdownOpen(false);
        setRailHoverTip(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownOpen && !e.target.closest("[data-user-rail-menu]")) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleMobileToggle = () => setMobileOpen((open) => !open);
  const closeMobile = () => setMobileOpen(false);

  const getAvatarUrl = (u) => {
    if (!u) return "/default-avatar.png";
    if (u.avatar_url) {
      if (u.avatar_url.startsWith("http")) {
        return u.avatar_url;
      }
      if (u.avatar_url.startsWith("/uploads/avatars")) {
        return `${import.meta.env.VITE_IMAGE_API}/api${u.avatar_url}`;
      }
    }
    return "/default-avatar.png";
  };
  const avatarUrl = getAvatarUrl(user);
  const { isNight, toggleTheme } = useTheme();

  const ThemeToggleBtn = ({ className = "" }) => (
    <button
      type="button"
      onClick={toggleTheme}
      className={className}
      aria-label={isNight ? "الوضع النهاري" : "الوضع الليلي"}
      title={isNight ? "الوضع النهاري" : "الوضع الليلي"}
    >
      {isNight ? (
        <Sun className="h-5 w-5 text-amber-300" />
      ) : (
        <Moon
          className={`h-5 w-5 ${isNight ? "text-zinc-300" : "text-indigo-600"}`}
        />
      )}
    </button>
  );

  return (
    <>
      {/* ——— سطح المكتب: شريط جانبي أيمن (أيقونات + تلميح عند المرور) ——— */}
      <motion.nav
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className={`font-almarai fixed inset-y-0 right-0 z-[1000] hidden w-24 flex-col gap-10 backdrop-blur-xl lg:flex ${isNight ? "nav-rail-night border-l" : "border-l border-purple-200/50 bg-white/95 shadow-[0_0_24px_rgba(116,64,233,0.08)]"}`}
        dir="rtl"
        aria-label="التنقل الرئيسي"
      >
        <motion.div
          className={`flex shrink-0 flex-col items-center gap-1 px-1 py-1 ${isNight ? "border-white/10" : "border-purple-100/80"}`}
        >
          <Link
            to="/"
            onMouseEnter={(e) => showRailTip("مشكاة — الرئيسية", e)}
            onMouseLeave={scheduleHideRailTip}
            className={`group flex w-full mt-4 flex-col items-center gap-1 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7440E9] ${isNight ? "hover:bg-[#2c2c31]" : "hover:bg-purple-50"}`}
            aria-label="الرئيسية"
          >
            <img
              src="assets/icons/512-512-01.png"
              alt=""
              className="h-10 w-10 object-contain transition-transform duration-200"
            />
          </Link>
        </motion.div>

        <motion.div className="min-h-0 flex-1 overflow-y-auto px-1 py-3 scrollbar-thin">
          <motion.div className="flex flex-col gap-1">
            {flatRailLinks.map((link) => (
              <RailNavLink
                key={link.to}
                link={link}
                pathname={location.pathname}
                onShowTip={showRailTip}
                onHideTip={scheduleHideRailTip}
                isNight={isNight}
              />
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className={`flex shrink-0 flex-col items-center gap-2 border-t px-1.5 py-3 font-cairo ${isNight ? "border-white/10" : "border-purple-100/80"}`}
        >
          {isAuthenticated && user ? (
            <div className="relative w-full" data-user-rail-menu>
              <button
                type="button"
                className={`group relative mx-auto flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 ring-2 ring-transparent transition-all focus:outline-none focus-visible:ring-2 ${isNight ? "hover:ring-white/20 focus-visible:ring-zinc-400" : "hover:ring-[#7440E9]/30 focus-visible:ring-[#7440E9]"}`}
                onClick={() => setDropdownOpen((v) => !v)}
                onMouseEnter={(e) => showRailTip(user.username, e)}
                onMouseLeave={scheduleHideRailTip}
                aria-label={user.username}
              >
                <img
                  src={avatarUrl || "https://hadith-shareef.com/default.jpg"}
                  alt=""
                  className={`h-9 w-9 rounded-full border-2 object-cover shadow-md transition-transform duration-200 group-hover:scale-105 ${isNight ? "border-white/25" : "border-[#7440E9]"}`}
                />
                <span
                  className={`max-w-full truncate px-0.5 text-center text-[10px] font-semibold leading-tight transition-colors ${isNight ? "text-zinc-500 group-hover:text-zinc-200" : "text-gray-600 group-hover:text-[#7440E9]"}`}
                >
                  {user.username}
                </span>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute bottom-0 right-full z-[1200] mr-2 w-48 overflow-hidden rounded-2xl border py-2 text-right shadow-2xl backdrop-blur-xl ${isNight ? "border-white/10 bg-[#242428]/98" : "border-purple-200/50 bg-white/98"}`}
                  >
                    <Link
                      to="/profile"
                      className={`block px-4 py-3 text-sm transition ${isNight ? "text-zinc-300 hover:bg-[#2c2c31] hover:text-zinc-100" : "text-gray-700 hover:bg-gradient-to-l hover:from-purple-50 hover:to-indigo-50 hover:text-[#7440E9]"}`}
                      onClick={() => setDropdownOpen(false)}
                    >
                      الملف الشخصي
                    </Link>
                    <Link
                      to="/saved"
                      className={`block px-4 py-3 text-sm transition ${isNight ? "text-zinc-300 hover:bg-[#2c2c31] hover:text-zinc-100" : "text-gray-700 hover:bg-gradient-to-l hover:from-purple-50 hover:to-indigo-50 hover:text-[#7440E9]"}`}
                      onClick={() => setDropdownOpen(false)}
                    >
                      محفوظاتي
                    </Link>
                    <div
                      className={`my-2 border-t ${isNight ? "border-white/10" : "border-purple-100"}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-right text-sm transition ${isNight ? "text-zinc-300 hover:bg-red-500/10 hover:text-red-300" : "text-gray-700 hover:bg-red-50 hover:text-red-600"}`}
                    >
                      تسجيل الخروج
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              onMouseEnter={(e) => showRailTip("تسجيل الدخول", e)}
              onMouseLeave={scheduleHideRailTip}
              className="group relative flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 bg-gradient-to-l from-purple-600 to-indigo-600 text-white shadow-md transition hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7440E9] focus-visible:ring-offset-2"
              aria-label="تسجيل الدخول"
            >
              <Sparkles className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-[10px] font-semibold leading-tight text-white/95">
                دخول
              </span>
            </Link>
          )}
        </motion.div>
      </motion.nav>

      <AnimatePresence>
        {railHoverTip && (
          <motion.div
            key={railHoverTip.label}
            role="tooltip"
            initial={{ opacity: 0, x: 14, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.92 }}
            transition={{
              type: "spring",
              stiffness: 480,
              damping: 28,
              mass: 0.55,
            }}
            className="pointer-events-none fixed z-[1200] hidden -translate-y-1/2 lg:block"
            style={{ top: railHoverTip.top, right: RAIL_TOOLTIP_RIGHT }}
          >
            <motion.div
              className={`relative overflow-hidden rounded-xl px-3.5 py-2 text-sm font-semibold ring-1 ${isNight ? "rail-tooltip-night text-zinc-100 ring-white/10" : "bg-gradient-to-l from-[#7440E9] to-indigo-600 text-white shadow-[0_10px_36px_rgba(116,64,233,0.38)] ring-white/20"}`}
            >
              <span
                className={`absolute -right-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 ${isNight ? "bg-[#2c2c31]" : "bg-indigo-600"}`}
                aria-hidden
              />
              <span className="relative whitespace-nowrap">
                {railHoverTip.label}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ——— الجوال: شريط علوي — صورة المستخدم | اللوجو | بحث + ثيم + قائمة ——— */}
      <nav
        className={`font-almarai fixed top-0 right-0 left-0 z-[1000] flex h-14 items-center justify-between gap-2 border-b px-3 lg:hidden ${isNight ? "nav-mobile-night" : "border-purple-200 bg-white shadow-[0_2px_12px_rgba(116,64,233,0.08)]"}`}
        dir="ltr"
      >
        {/* صورة المستخدم / تسجيل الدخول */}
        <div className="flex w-10 shrink-0 items-center">
          {isAuthenticated && user ? (
            <Link
              to="/profile"
              className="block rounded-full ring-2 ring-[#7440E9]/25 transition-transform active:scale-95"
              aria-label="الملف الشخصي"
            >
              <img
                src={avatarUrl}
                alt=""
                className="h-9 w-9 rounded-full border-2 border-[#7440E9] object-cover"
              />
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-purple-200 bg-purple-50 text-[#7440E9] transition-colors hover:bg-purple-100"
              aria-label="تسجيل الدخول"
            >
              <img
                src="/default-avatar.png"
                alt=""
                className="h-7 w-7 rounded-full object-cover opacity-70"
              />
            </Link>
          )}
        </div>

        {/* اللوجو في المنتصف */}
        <Link
          to="/"
          className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center"
          aria-label="مشكاة — الرئيسية"
        >
          <img
            src="/assets/icons/512-512-01.png"
            alt="مشكاة"
            className="h-10 w-10 object-fit"
          />
        </Link>

        {/* الإجراءات — بحث + ثيم + قائمة */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label="بحث"
            aria-expanded={mobileSearchOpen}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors active:scale-95 ${
              mobileSearchOpen
                ? isNight
                  ? "bg-[#34343a] text-zinc-100"
                  : "bg-purple-100 text-[#7440E9]"
                : isNight
                  ? "bg-[#2c2c31] text-zinc-300 hover:bg-[#34343a]"
                  : "bg-purple-50 text-[#7440E9] hover:bg-purple-100"
            }`}
          >
            <Search className="h-[18px] w-[18px]" />
          </button>

          <ThemeToggleBtn
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors active:scale-95 ${isNight ? "bg-[#2c2c31] hover:bg-[#34343a]" : "bg-purple-50 hover:bg-purple-100"}`}
          />

          <button
            type="button"
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${isNight ? "bg-[#2c2c31] text-zinc-300 hover:bg-[#34343a]" : "bg-purple-50 text-[#7440E9] hover:bg-purple-100"}`}
            onClick={handleMobileToggle}
            aria-expanded={mobileOpen}
            aria-label="القائمة"
          >
            {mobileOpen ? (
              <X className="h-[22px] w-[22px]" />
            ) : (
              <Menu className="h-[22px] w-[22px]" />
            )}
          </button>
        </div>
      </nav>

      {/* ——— الجوال: حقل البحث المنبثق أسفل الشريط العلوي ——— */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.form
            key="mobile-search"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onSubmit={submitMobileSearch}
            dir="rtl"
            className={`fixed top-14 right-0 left-0 z-[999] flex items-center gap-2 border-b px-3 py-2.5 lg:hidden ${isNight ? "nav-mobile-night" : "border-purple-200 bg-white shadow-[0_8px_20px_rgba(116,64,233,0.10)]"}`}
          >
            <div className="relative flex-1">
              <Search
                className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isNight ? "text-zinc-500" : "text-gray-400"}`}
              />
              <input
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                autoFocus
                placeholder="ابحث في الأحاديث..."
                className={`h-11 w-full rounded-xl border pr-10 pl-3 text-sm outline-none transition focus:ring-2 focus:ring-[#7440E9]/25 ${isNight ? "border-white/10 bg-[#2c2c31] text-zinc-100 placeholder:text-zinc-500" : "border-purple-200 bg-purple-50/50 text-gray-800 placeholder:text-gray-400"}`}
              />
            </div>
            <button
              type="submit"
              className="flex h-11 shrink-0 items-center rounded-xl bg-[#7440E9] px-4 text-sm font-semibold text-white transition active:scale-95"
            >
              بحث
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed font-almarai inset-0 z-[1001] bg-black/50 lg:hidden"
            onClick={closeMobile}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className={`absolute top-0 right-0 flex h-full w-[min(20rem,88vw)] flex-col border-l shadow-2xl ${isNight ? "nav-drawer-night" : "border-purple-100 bg-white"}`}
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              <div
                className={`flex items-center justify-between border-b p-4 ${isNight ? "border-white/10" : "border-purple-200/50"}`}
              >
                <span
                  className={`font-['MeshkahFont'] text-lg font-bold ${isNight ? "text-zinc-100" : "text-[#7440E9]"}`}
                >
                  القائمة
                </span>
                <button
                  type="button"
                  className={`rounded-xl p-2 transition ${isNight ? "text-zinc-300 hover:bg-[#2c2c31]" : "text-[#7440E9] hover:bg-purple-50"}`}
                  onClick={closeMobile}
                  aria-label="إغلاق"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {isAuthenticated && user && (
                <div
                  className={`border-b p-4 ${isNight ? "border-white/10" : "border-purple-200/50"}`}
                >
                  <Link
                    to="/profile"
                    onClick={closeMobile}
                    className={`flex items-center gap-3 rounded-2xl p-3 ${isNight ? "bg-[#2c2c31]" : "bg-gradient-to-l from-purple-50 to-indigo-50"}`}
                  >
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-11 w-11 rounded-full border-2 border-[#7440E9] object-cover"
                    />
                    <span
                      className={`font-bold ${isNight ? "text-zinc-100" : "text-gray-800"}`}
                    >
                      {user.username}
                    </span>
                  </Link>
                </div>
              )}

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                {NAV_SECTIONS.map((section) => (
                  <div key={section.title} className="space-y-2">
                    <h3
                      className={`px-1 text-xs font-bold uppercase tracking-wide ${isNight ? "text-zinc-400" : "text-[#7440E9]"}`}
                    >
                      {section.title}
                    </h3>
                    {section.links.map((link) => {
                      const Icon = link.icon;
                      const active =
                        link.to === "/"
                          ? location.pathname === "/"
                          : location.pathname === link.to ||
                            location.pathname.startsWith(`${link.to}/`);
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={closeMobile}
                          className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition active:scale-[0.98] ${
                            active
                              ? isNight
                                ? "bg-[#34343a] font-bold text-zinc-100 shadow-sm"
                                : "bg-gradient-to-l from-purple-100 to-indigo-100 font-bold text-[#7440E9] shadow-sm"
                              : isNight
                                ? "text-zinc-300 hover:bg-[#2c2c31] hover:text-zinc-100"
                                : "text-gray-700 hover:bg-purple-50/80 hover:text-[#7440E9]"
                          }`}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          {link.name}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div
                className={`space-y-3 border-t p-4 ${isNight ? "border-white/10" : "border-purple-200/50"}`}
              >
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${isNight ? "bg-[#2c2c31] text-zinc-200 hover:bg-[#34343a]" : "bg-purple-50 text-gray-700 hover:bg-purple-100"}`}
                >
                  <span className="flex items-center gap-2">
                    {isNight ? (
                      <Sun className="h-5 w-5 text-amber-300" />
                    ) : (
                      <Moon className="h-5 w-5 text-indigo-600" />
                    )}
                    {isNight ? "الوضع النهاري" : "الوضع الليلي"}
                  </span>
                </button>
                <Link
                  to="/privacy-policy"
                  onClick={closeMobile}
                  className={`block text-center text-sm transition ${isNight ? "text-zinc-500 hover:text-zinc-200" : "text-gray-500 hover:text-[#7440E9]"}`}
                >
                  سياسة الخصوصية
                </Link>
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      closeMobile();
                    }}
                    className="w-full rounded-xl bg-gradient-to-l from-red-500 to-red-600 py-3 text-sm font-semibold text-white shadow-md hover:from-red-600 hover:to-red-700"
                  >
                    تسجيل الخروج
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={closeMobile}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md"
                  >
                    <Sparkles className="h-4 w-4" />
                    ابدأ الآن
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ——— الجوال: شريط تنقّل سفلي للوصول السريع ——— */}
      <nav
        className={`font-cairo fixed bottom-0 right-0 left-0 z-[1000] grid grid-cols-5 border-t pb-[env(safe-area-inset-bottom)] lg:hidden ${isNight ? "nav-mobile-night" : "border-purple-200 bg-white shadow-[0_-2px_12px_rgba(116,64,233,0.08)]"}`}
        dir="rtl"
        aria-label="التنقل السريع"
      >
        {BOTTOM_NAV.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              aria-label={link.name}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-2 transition-colors active:scale-95 ${
                active
                  ? isNight
                    ? "text-zinc-100"
                    : "text-[#7440E9]"
                  : isNight
                    ? "text-zinc-500"
                    : "text-gray-500"
              }`}
            >
              {active && (
                <span
                  className={`absolute top-0 h-0.5 w-8 rounded-full ${isNight ? "bg-zinc-100" : "bg-[#7440E9]"}`}
                  aria-hidden
                />
              )}
              <Icon
                className="h-[22px] w-[22px] shrink-0"
                strokeWidth={active ? 2.4 : 1.9}
              />
              <span className="text-[10px] font-semibold leading-tight">
                {link.name}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleMobileToggle}
          aria-label="القائمة"
          aria-expanded={mobileOpen}
          className={`relative flex flex-col items-center justify-center gap-0.5 py-2 transition-colors active:scale-95 ${
            mobileOpen
              ? isNight
                ? "text-zinc-100"
                : "text-[#7440E9]"
              : isNight
                ? "text-zinc-500"
                : "text-gray-500"
          }`}
        >
          <Menu className="h-[22px] w-[22px] shrink-0" strokeWidth={1.9} />
          <span className="text-[10px] font-semibold leading-tight">
            القائمة
          </span>
        </button>
      </nav>
    </>
  );
};

export default Navbar;
