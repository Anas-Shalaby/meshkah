import { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { BookmarkProvider } from "./context/BookmarkContext";
import { trackPageView } from "./utils/analytics";
import { Toaster } from "react-hot-toast";
import "./styles/quran-camps.css";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SEO from "./components/SEO";
import PublicCards from "./components/PublicCards";
import SharedCard from "./components/SharedCard";
import HadithListWrapper from "./components/HadithListWrapper";
import { NotificationProvider } from "./context/NotificationContext";

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
      <p className="text-xl font-bold text-gray-700 mb-2">جاري التحميل...</p>
      <p className="text-gray-600">استعد لرحلة رائعة مع القرآن الكريم</p>
    </div>
  </div>
);

// Lazy loaded pages for better performance
const LandingPage = lazy(() => import("./components/LandingPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const Contact = lazy(() => import("./pages/contact"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const Login = lazy(() => import("./components/auth/Login"));
const Register = lazy(() => import("./components/auth/Register"));
const PrivateRoute = lazy(() => import("./components/auth/PrivateRoute"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SavedPage = lazy(() => import("./pages/SavedPage"));
const DailyHadith = lazy(() => import("./pages/DailyHadith"));
const HadithPage = lazy(() => import("./pages/HadithPage"));
const HadithCategories = lazy(() => import("./pages/HadithCategories"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const CreateCardPage = lazy(() => import("./pages/CreateCardPage"));

// Islamic Library Pages - Lazy loaded
const Anas = lazy(() => import("./pages/Anas"));
const IslamicLibraryPage = lazy(() => import("./pages/IslamicLibraryPage"));
const IslamicBookPage = lazy(() => import("./pages/IslamicBookPage"));
const IslamicChapterPage = lazy(() => import("./pages/IslamicChapterPage"));
const IslamicHadithPage = lazy(() => import("./pages/IslamicHadithPage"));
const SmallBooksPage = lazy(() => import("./pages/SmallBooksPage"));
const SmallBookPage = lazy(() => import("./pages/SmallBookPage"));
const LocalBookPage = lazy(() => import("./pages/LocalBookPage"));
const IslamicBookmarksPage = lazy(() => import("./pages/IslamicBookmarksPage"));
const HelpSupportPage = lazy(() => import("./pages/HelpSupportPage"));

const HadithVerificationPage = lazy(() =>
  import("./pages/HadithVerificationPage")
);
const QuranCampsPage = lazy(() => import("./pages/QuranCampsPage"));
const QuranCampDetailsPage = lazy(() => import("./pages/QuranCampDetailsPage"));
const CampContentPage = lazy(() => import("./pages/CampContentPage"));
const MyCampJourneyPage = lazy(() => import("./pages/MyCampJourneyPage"));
const MyCampJournalPage = lazy(() => import("./pages/MyCampJournalPage"));
const CampSummaryPage = lazy(() => import("./pages/CampSummaryPage"));
const SharedReflectionPage = lazy(() => import("./pages/SharedReflectionPage"));

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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BookmarkProvider>
          <NotificationProvider>
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
                className="flex-1  font-cairo"
                style={{ direction: "rtl", marginTop: "4.1rem" }}
              >
                <div className="relative">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
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
                    /> */}
                    {/* Hadith Verification Routes */}
                    <Route
                      path="/hadith-verification"
                      element={<HadithVerificationPage />}
                    />
                    {/* Quran Camps Routes */}
                    <Route path="/quran-camps" element={<QuranCampsPage />} />
                    <Route
                      path="/quran-camps/:id"
                      element={<QuranCampDetailsPage />}
                    />
                    {/* Shared Reflection - Public Route */}
                    <Route
                      path="/shared-reflection/:shareLink"
                      element={<SharedReflectionPage />}
                    />
                    <Route
                      path="/camp-summary/:id"
                      element={
                        <PrivateRoute>
                          <CampSummaryPage />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/camp-content/:id"
                      element={<CampContentPage />}
                    />
                    <Route
                      path="/my-camp-journey/:id"
                      element={
                        <PrivateRoute>
                          <MyCampJourneyPage />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/my-camp-journal/:id"
                      element={
                        <PrivateRoute>
                          <MyCampJournalPage />
                        </PrivateRoute>
                      }
                    />
                    <Route path="/privacy-policy" element={<Anas />} />
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
          </NotificationProvider>
        </BookmarkProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
