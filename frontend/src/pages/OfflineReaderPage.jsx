import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OfflineReader from "../components/OfflineReader";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { getTranslation } from "../utils/translations";

const OfflineReaderPage = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("islamicLibraryLanguage") || "ar";
  });

  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem("islamicLibraryLanguage", newLanguage);
  };

  // SEO metadata for offline reader
  const seoData = {
    title:
      getTranslation(language, "offlineReader") +
      " - " +
      getTranslation(language, "islamicLibrary"),
    description: getTranslation(language, "offlineReaderDescription"),
    keywords: [
      getTranslation(language, "offlineReader"),
      getTranslation(language, "islamicBooks"),
      getTranslation(language, "hadiths"),
      getTranslation(language, "offlineReading"),
      getTranslation(language, "downloadBooks"),
    ].join(", "),
    canonicalUrl: window.location.href,
    socialMediaImage: "/assets/icons/icon-512x512.png",
  };

  return (
    <>
      <SEO {...seoData} />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <Navbar
          language={language}
          onLanguageChange={handleLanguageChange}
          showOfflineReader={true}
        />
        <OfflineReader language={language} />
        <Footer language={language} />
      </div>
    </>
  );
};

export default OfflineReaderPage;
