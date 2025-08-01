import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { BookmarkProvider } from "./context/BookmarkContext";
import { trackPageView } from "./utils/analytics";
import { Toaster } from "react-hot-toast";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SEO from "./components/SEO";
import PublicCards from "./components/PublicCards";
import SharedCard from "./components/SharedCard";
import HadithListWrapper from "./components/HadithListWrapper";
// Pages
import LandingPage from "./components/LandingPage";
import AboutPage from "./pages/AboutPage";
import Contact from "./pages/contact";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import PrivateRoute from "./components/auth/PrivateRoute";
import ProfilePage from "./pages/ProfilePage";
import SavedPage from "./pages/SavedPage";
import DailyHadith from "./pages/DailyHadith";
import HadithPage from "./pages/HadithPage";
import HadithCategories from "./pages/HadithCategories";
import CategoryPage from "./pages/CategoryPage";
import CreateCardPage from "./pages/CreateCardPage";

import { Anas } from "./pages/Anas";
import GoogleSuccess from "./pages/GoogleSuccess";

// Islamic Library Pages
import IslamicLibraryPage from "./pages/IslamicLibraryPage";
import IslamicBookPage from "./pages/IslamicBookPage";
import IslamicChapterPage from "./pages/IslamicChapterPage";
import IslamicHadithPage from "./pages/IslamicHadithPage";
import SmallBooksPage from "./pages/SmallBooksPage";
import SmallBookPage from "./pages/SmallBookPage";
import LocalBookPage from "./pages/LocalBookPage";
import IslamicBookmarksPage from "./pages/IslamicBookmarksPage";
import HelpSupportPage from "./pages/HelpSupportPage";

const websiteMetadata = {
  title: "مشكاة الأحاديث - موسوعة الحديث الشريف",
  description:
    "منصة شاملة للأحاديث النبوية، سير الصحابة، والتراث الإسلامي. اكتشف معارف إسلامية غنية وموثوقة.",
  keywords: [
    "أحاديث نبوية",
    "سيرة النبي محمد",
    "الصحابة الكرام",
    "التراث الإسلامي",
    "علوم الحديث",
    "فقه إسلامي",
  ].join(", "),
  canonicalUrl: "https://hadith-shareef.com",
  socialMediaImage: "/assets/icons/icon-512x512.png",
};

function App() {
  const [language] = useState("ar");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  // Track page views
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSidebarOpen) {
        const interactiveElements = [
          "a",
          "button",
          "input",
          "select",
          "textarea",
        ];

        const isInteractiveElement = interactiveElements.some((selector) =>
          event.target.closest(selector)
        );

        if (!isInteractiveElement) {
          closeSidebar();
        }
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isSidebarOpen]);

  return (
    <AuthProvider>
      <BookmarkProvider>
        <GoogleOAuthProvider clientId="479373165372-d9vr3f1c1b2aodv4kjngi5ra1diug1v6.apps.googleusercontent.com">
          <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
            {/* SEO Component */}
            <SEO metadata={websiteMetadata} />

            {/* Navbar with Glass Effect */}
            <Navbar
              language={"ar"}
              isSidebarOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm sticky top-0 z-50"
            />

            {/* Main Content */}
            <main
              className="flex-1 mt-20 font-cairo"
              style={{ direction: "rtl" }}
            >
              <div className="relative">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/contact-page" element={<ContactPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/google-success" element={<GoogleSuccess />} />

                  {/* Protected Routes */}
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <ProfilePage />
                      </PrivateRoute>
                    }
                  />

                  <Route path="/daily-hadith" element={<DailyHadith />} />

                  <Route path="/hadiths" element={<HadithCategories />} />

                  <Route
                    path="/hadiths/hadith/:hadithId"
                    element={<HadithPage />}
                  />
                  <Route
                    path="/hadiths/category/:categoryId"
                    element={<CategoryPage />}
                  />
                  <Route
                    path="/hadiths/:categoryId/page/:pageNumber"
                    element={<HadithListWrapper />}
                  />
                  <Route
                    path="/category/:categoryId"
                    element={
                      <PrivateRoute>
                        <CategoryPage />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/public-cards" element={<PublicCards />} />
                  <Route
                    path="/shared-card/:shareLink"
                    element={<SharedCard />}
                  />
                  <Route path="/cards" element={<PublicCards />} />
                  <Route path="/create-card" element={<CreateCardPage />} />

                  <Route path="/anas" element={<Anas />} />

                  {/* Islamic Library Routes */}
                  <Route
                    path="/islamic-library"
                    element={<IslamicLibraryPage />}
                  />
                  <Route
                    path="/islamic-library/book/:bookSlug"
                    element={<IslamicBookPage />}
                  />
                  <Route
                    path="/islamic-library/book/:bookSlug/chapter/:chapterNumber"
                    element={<IslamicChapterPage />}
                  />
                  <Route
                    path="/islamic-library/book/:bookSlug/chapter/:chapterNumber/hadith/:hadithId"
                    element={<IslamicHadithPage />}
                  />
                  <Route
                    path="/islamic-library/hadith/:hadithId"
                    element={<IslamicHadithPage />}
                  />

                  {/* Small Books Routes */}
                  <Route
                    path="/islamic-library/small-books"
                    element={<SmallBooksPage />}
                  />
                  <Route
                    path="/islamic-library/small-books/:bookSlug"
                    element={<SmallBookPage />}
                  />
                  <Route
                    path="/islamic-library/small-books/:bookSlug/hadiths/:hadithId"
                    element={<IslamicHadithPage />}
                  />

                  {/* Local Books Routes */}
                  <Route
                    path="/islamic-library/local-books/:bookSlug"
                    element={<LocalBookPage />}
                  />
                  <Route
                    path="/islamic-library/local-books/:bookSlug/chapter/:chapterNumber"
                    element={<IslamicChapterPage />}
                  />
                  <Route
                    path="/islamic-library/local-books/:bookSlug/hadith/:hadithId"
                    element={<IslamicHadithPage />}
                  />
                  <Route
                    path="saved"
                    element={
                      <PrivateRoute>
                        <SavedPage />
                      </PrivateRoute>
                    }
                  />

                  {/* Islamic Bookmarks Routes */}
                  <Route
                    path="/islamic-bookmarks"
                    element={<IslamicBookmarksPage />}
                  />

                  {/* Help and Support Routes */}
                  <Route
                    path="/islamic-library/help-support"
                    element={<HelpSupportPage />}
                  />

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </div>
            </main>

            {/* Footer with Glass Effect */}
            <Footer
              language={"ar"}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50 shadow-sm"
            />
          </div>

          {/* Toaster for notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#4ade80",
                  secondary: "#fff",
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </GoogleOAuthProvider>
      </BookmarkProvider>
    </AuthProvider>
  );
}

export default App;
