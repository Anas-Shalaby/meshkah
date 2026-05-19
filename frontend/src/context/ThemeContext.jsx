import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "mishkah_theme";

const ThemeContext = createContext(null);

function readStoredTheme() {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem(STORAGE_KEY) === "night" ? "night" : "light";
}

function applyThemeToDocument(theme) {
  const root = document.documentElement;
  const isNight = theme === "night";
  root.classList.toggle("dark", isNight);
  root.classList.toggle("night-theme", isNight);
  root.style.colorScheme = isNight ? "dark" : "light";
}

if (typeof document !== "undefined") {
  applyThemeToDocument(readStoredTheme());
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    applyThemeToDocument(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "night" ? "light" : "night"));
  }, []);

  const setNightTheme = useCallback((enabled) => {
    setTheme(enabled ? "night" : "light");
  }, []);

  const value = {
    theme,
    isNight: theme === "night",
    toggleTheme,
    setNightTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

export default ThemeContext;
