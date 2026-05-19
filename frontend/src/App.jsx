import { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BookmarkProvider } from "./context/BookmarkContext";
import { RamadanThemeProvider } from "./context/RamadanThemeContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./styles/night-theme.css";
import { trackPageView } from "./utils/analytics";
import { Toaster } from "react-hot-toast";
import "./styles/quran-camps.css";
import "./styles/ramadan-theme.css";
import "./styles/ramadan-patterns.css";
import "./styles/ramadan-override.css";

// Components
import Navbar, { NAV_RAIL_WIDTH_CLASS } from "./components/Navbar";
import SEO from "./components/SEO";
import PublicCards from "./components/PublicCards";
import SharedCard from "./components/SharedCard";
import HadithListWrapper from "./components/HadithListWrapper";
import { NotificationProvider } from "./context/NotificationContext";
import FullPageLoadingScreen from "./components/FullPageLoadingScreen";

// Import Lottie Player
import { Player } from "@lottiefiles/react-lottie-player";

// Loading Spinner Component with Lottie
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
    <div className="text-center">
      <Player
        autoplay
        loop
        src="/assets/LIghts.json"
        style={{
          width: "250px",
          height: "250px",
          margin: "0 auto",
        }}
      />
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
import { Anas } from "./pages/Anas";
const IslamicLibraryPage = lazy(() => import("./pages/IslamicLibraryPage"));
const IslamicBookPage = lazy(() => import("./pages/IslamicBookPage"));
const IslamicChapterPage = lazy(() => import("./pages/IslamicChapterPage"));
const IslamicHadithPage = lazy(() => import("./pages/IslamicHadithPage"));
const SmallBooksPage = lazy(() => import("./pages/SmallBooksPage"));
const SmallBookPage = lazy(() => import("./pages/SmallBookPage"));
const LocalBookPage = lazy(() => import("./pages/LocalBookPage"));
const IslamicBookmarksPage = lazy(() => import("./pages/IslamicBookmarksPage"));
const HelpSupportPage = lazy(() => import("./pages/HelpSupportPage"));

const HadithVerificationPage = lazy(
  () => import("./pages/HadithVerificationPage"),
);
const QuranCampsPage = lazy(() => import("./pages/QuranCampsPage"));
const QuranCampDetailsPage = lazy(() => import("./pages/QuranCampDetailsPage"));
const CampContentPage = lazy(() => import("./pages/CampContentPage"));
const MyCampJourneyPage = lazy(() => import("./pages/MyCampJourneyPage"));
const MyCampJournalPage = lazy(() => import("./pages/MyCampJournalPage"));
const CampSummaryPage = lazy(() => import("./pages/CampSummaryPage"));
const SharedReflectionPage = lazy(() => import("./pages/SharedReflectionPage"));

// Book Journeys Pages - ختمات الكتب
const BookJourneysPage = lazy(() => import("./pages/BookJourneysPage"));
const JourneyDetailsPage = lazy(() => import("./pages/JourneyDetailsPage"));
const JoinJourneyPage = lazy(() => import("./pages/JoinJourneyPage"));
const VerifyJourneyCertificatePage = lazy(
  () => import("./pages/VerifyJourneyCertificatePage"),
);

// Review System Pages - نظام المراجعة الذكية
const ReviewsPage = lazy(() => import("./pages/ReviewsPage"));
const ReviewStatsPage = lazy(() => import("./pages/ReviewStatsPage"));
const ReviewSettingsPage = lazy(() => import("./pages/ReviewSettingsPage"));

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

// Main App Content Component (to access AuthContext)
function AppContent() {
  const [language] = useState("ar");
  const location = useLocation();
  const { loading: authLoading } = useAuth();

  const hideLayoutChrome =
    location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Track page views
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return <FullPageLoadingScreen message="جاري التحميل..." />;
  }

  return (
    <BookmarkProvider>
      <NotificationProvider>
        <div className="app-shell-bg flex min-h-screen flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-[#1a1a1e] dark:via-[#1c1c20] dark:to-[#1a1a1e]">
          {/* SEO Component */}
          <SEO metadata={websiteMetadata} />

          {/* Navbar with Glass Effect — مخفي على صفحات تسجيل الدخول والتسجيل */}
          {!hideLayoutChrome && <Navbar />}

          {/* Main Content — مساحة للشريط العلوي (جوال) والشريط الأيمن (سطح المكتب) */}
          <main
            className={`flex-1 font-almarai ${
              hideLayoutChrome ? "" : `pt-14 lg:pt-0 ${NAV_RAIL_WIDTH_CLASS}`
            }`}
            style={{ direction: "rtl" }}
          >
            <div>
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

                {/* Hadith Verification Routes */}
                <Route
                  path="/hadith-verification"
                  element={<HadithVerificationPage />}
                />
                {/* Camps Routes (multi-type: quran, hadith) */}
                <Route path="/camps" element={<QuranCampsPage />} />
                <Route
                  path="/camps/:id"
                  element={<QuranCampDetailsPage />}
                />
                {/* Backwards-compatible legacy routes */}
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
                <Route path="/camp-content/:id" element={<CampContentPage />} />
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
                {/* Book Journeys Routes - ختمات الكتب */}
                <Route path="/book-journeys" element={<BookJourneysPage />} />
                <Route
                  path="/book-journeys/:id"
                  element={
                    <PrivateRoute>
                      <JourneyDetailsPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/book-journeys/join/:shareCode"
                  element={
                    <PrivateRoute>
                      <JoinJourneyPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/verify-journey/:code"
                  element={<VerifyJourneyCertificatePage />}
                />

                {/* Review System Routes - نظام المراجعة الذكية */}
                <Route
                  path="/reviews"
                  element={
                    <PrivateRoute>
                      <ReviewsPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/reviews/stats"
                  element={
                    <PrivateRoute>
                      <ReviewStatsPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/reviews/settings"
                  element={
                    <PrivateRoute>
                      <ReviewSettingsPage />
                    </PrivateRoute>
                  }
                />

                <Route path="/privacy-policy" element={<Anas />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </main>

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
  );
}

// Main App Wrapper
function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <RamadanThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </RamadanThemeProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
