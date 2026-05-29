import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, Search, UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import MyLearningPanel from "./home/MyLearningPanel";

const COLORS = {
  page: "#1a1c22",
  card: "#212328",
  text: "#e0e0e0",
  accent: "#9e98db",
  nightIcon: "#ffc107",
};

const LandingTopNavbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isNight, toggleTheme } = useTheme();
  const [learningPanelOpen, setLearningPanelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const theme = isNight
    ? {
        card: COLORS.card,
        text: COLORS.text,
        iconBg: "rgba(255,255,255,0.04)",
        iconHover: "hover:bg-white/[0.08]",
        inputBg: COLORS.page,
        inputBorder: "rgba(158,152,219,0.25)",
      }
    : {
        card: "#ffffff",
        text: "#24242c",
        iconBg: "rgba(116,64,233,0.08)",
        iconHover: "hover:bg-[#7440E9]/15",
        inputBg: "#ffffff",
        inputBorder: "rgba(116,64,233,0.22)",
      };

  const handleLearningPanelOpen = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setLearningPanelOpen(true);
  };

  const handleHeaderSearch = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/hadiths?search=${encodeURIComponent(query)}`);
  };

  const runSearchOrToggle = () => {
    if (searchOpen && searchQuery.trim()) {
      navigate(`/hadiths?search=${encodeURIComponent(searchQuery.trim())}`);
      return;
    }
    setSearchOpen((prev) => !prev);
  };

  return (
    <>
      <div className="fixed left-3 right-3 top-3 z-[1050] hidden lg:block lg:right-[7rem]">
      <header
        dir="rtl"
        className="relative mx-auto max-w-7xl font-almarai rounded-2xl px-4 py-3 shadow-[0_14px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl"
        style={{ backgroundColor: theme.card }}
      >
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight"
            style={{ color: theme.text }}
          >
            منصة مشكاة
          </Link>

          <div className="flex items-center gap-2" dir="ltr">
            <AnimatePresence initial={false}>
              {searchOpen && (
                <motion.form
                  key="global-search"
                  initial={{ width: 0, opacity: 0, x: 16 }}
                  animate={{ width: 260, opacity: 1, x: 0 }}
                  exit={{ width: 0, opacity: 0, x: 16 }}
                  transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  onSubmit={handleHeaderSearch}
                  className="hidden overflow-hidden sm:block"
                  dir="rtl"
                >
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    autoFocus
                    placeholder="ابحث في الأحاديث..."
                    className="h-10 w-full rounded-xl border px-4 text-sm outline-none transition focus:border-[#9e98db] focus:ring-2 focus:ring-[#9e98db]/20"
                    style={{
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.text,
                    }}
                  />
                </motion.form>
              )}
            </AnimatePresence>

            <HeaderIconButton
              label="بحث"
              theme={theme}
              onClick={runSearchOrToggle}
            >
              <Search className="h-5 w-5" />
            </HeaderIconButton>

            <HeaderIconButton
              label="تغيير الوضع الليلي"
              theme={theme}
              onClick={toggleTheme}
            >
              <Moon className="h-5 w-5" style={{ color: COLORS.nightIcon }} />
            </HeaderIconButton>

            <IconLink
              to={isAuthenticated ? "/profile" : "/login"}
              label="الملف الشخصي"
              theme={theme}
            >
              <UserCircle className="h-5 w-5" />
            </IconLink>

            <HeaderIconButton
              label="القائمة"
              theme={theme}
              onClick={handleLearningPanelOpen}
            >
              <Menu className="h-5 w-5" />
            </HeaderIconButton>
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.form
              key="global-mobile-search"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleHeaderSearch}
              className="absolute left-4 right-4 top-full z-30 mt-2 sm:hidden"
              dir="rtl"
            >
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoFocus
                placeholder="ابحث في الأحاديث..."
                className="h-12 w-full rounded-2xl border px-4 text-sm shadow-2xl outline-none transition focus:border-[#9e98db] focus:ring-2 focus:ring-[#9e98db]/20"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                }}
              />
            </motion.form>
          )}
        </AnimatePresence>
      </header>
      </div>

      <MyLearningPanel
        isOpen={learningPanelOpen}
        onClose={() => setLearningPanelOpen(false)}
      />
    </>
  );
};

function HeaderIconButton({ label, theme, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-xl text-[#9e98db] transition ${theme.iconHover}`}
      style={{ backgroundColor: theme.iconBg }}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function IconLink({ to, label, children, theme }) {
  return (
    <Link
      to={to}
      className={`flex h-10 w-10 items-center justify-center rounded-xl text-[#9e98db] transition ${theme.iconHover}`}
      style={{ backgroundColor: theme.iconBg }}
      aria-label={label}
      title={label}
    >
      {children}
    </Link>
  );
}

export default LandingTopNavbar;
