import { createContext, useContext, useState, useEffect } from "react";

const RamadanThemeContext = createContext();

export const RamadanThemeProvider = ({ children }) => {
  const [isRamadanTheme, setIsRamadanTheme] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // جلب حالة الثيم من API
    fetchThemeStatus();
  }, []);

  const fetchThemeStatus = async () => {
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:4000/api";

      const response = await fetch(`${apiUrl}/admin/theme/ramadan`);
      const data = await response.json();

      if (data.success) {
        setIsRamadanTheme(data.enabled);

        // تطبيق الثيم على HTML element
        if (data.enabled) {
          document.documentElement.classList.add("ramadan-theme");
        } else {
          document.documentElement.classList.remove("ramadan-theme");
        }
      }
    } catch (error) {
      console.error("❌ Error fetching Ramadan theme status:", error);
      // في حالة الخطأ، نستخدم القيمة الافتراضية (false)
      setIsRamadanTheme(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newValue = !isRamadanTheme;
    setIsRamadanTheme(newValue);

    if (newValue) {
      document.documentElement.classList.add("ramadan-theme");
    } else {
      document.documentElement.classList.remove("ramadan-theme");
    }
  };

  const value = {
    isRamadanTheme,
    loading,
    toggleTheme,
    refreshTheme: fetchThemeStatus,
  };

  return (
    <RamadanThemeContext.Provider value={value}>
      {children}
    </RamadanThemeContext.Provider>
  );
};

export const useRamadanTheme = () => {
  const context = useContext(RamadanThemeContext);
  if (context === undefined) {
    throw new Error(
      "useRamadanTheme must be used within a RamadanThemeProvider"
    );
  }
  return {
    isRamadanThemeActive: context.isRamadanTheme,
    ...context,
  };
};

export default RamadanThemeContext;
