import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Download,
  Trash2,
  Database,
  Wifi,
  WifiOff,
  Bookmark,
  HelpCircle,
  Settings,
  ArrowLeft,
  ArrowRight,
  Grid,
  List,
} from "lucide-react";
import { Link } from "react-router-dom";
import LanguageSelector from "./LanguageSelector";
import { getTranslation } from "../utils/translations";
import { toast } from "react-toastify";
import offlineStorageService from "../services/offlineStorageService";
import downloadManagerService from "../services/downloadManagerService";

const OfflineReader = ({ language = "ar" }) => {
  const [downloadedBooks, setDownloadedBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingHadiths, setIsLoadingHadiths] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterChapter, setFilterChapter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hadithsPerPage] = useState(10);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storageInfo, setStorageInfo] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    loadDownloadedBooks();
    checkOnlineStatus();
    window.addEventListener("online", checkOnlineStatus);
    window.addEventListener("offline", checkOnlineStatus);
    return () => {
      window.removeEventListener("online", checkOnlineStatus);
      window.removeEventListener("offline", checkOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (selectedBook) {
      loadChapters(selectedBook.bookSlug);
    }
  }, [selectedBook?.bookSlug]);

  useEffect(() => {
    console.log(
      "useEffect triggered - selectedBook:",
      selectedBook?.bookSlug,
      "selectedChapter:",
      selectedChapter?.id
    );

    // Only load hadiths if we have both book and chapter, and the book has chapters
    if (selectedBook && selectedChapter && selectedBook.chapters) {
      console.log("Loading hadiths for specific chapter:", selectedChapter.id);
      loadHadiths(selectedBook.bookSlug, selectedChapter.id);
    }
    // Don't load all hadiths when book is selected - wait for chapter selection
  }, [selectedChapter?.id, selectedBook?.bookSlug, selectedBook?.chapters]);

  // Debug useEffect to monitor hadiths state
  useEffect(() => {
    console.log("Hadiths state changed:", hadiths.length, "hadiths");
    if (hadiths.length > 0) {
      console.log("First hadith:", hadiths[0]);
    }
  }, [hadiths]);

  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
  };

  const loadDownloadedBooks = async () => {
    try {
      setLoading(true);
      const books = await offlineStorageService.getAllBooks();
      setDownloadedBooks(books.filter((book) => book.isDownloaded));

      // Load storage info
      const info = await downloadManagerService.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error("Error loading downloaded books:", error);
      toast.error(getTranslation(language, "errorLoadingBooks"));
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async (bookSlug) => {
    try {
      console.log("Loading chapters for book:", bookSlug);
      const book = await offlineStorageService.getBook(bookSlug);
      console.log("Book data:", book);

      if (book && book.chapters && book.chapters.length > 0) {
        console.log("Found chapters in book data:", book.chapters.length);
        // Update the selectedBook with chapters
        setSelectedBook({ ...selectedBook, chapters: book.chapters });
        setSelectedChapter(book.chapters[0]);
        return;
      }

      const chapters = await offlineStorageService.getChapters(bookSlug);
      console.log("Chapters from separate storage:", chapters);
      console.log("Sample chapter:", chapters[0]);

      if (chapters.length > 0) {
        // Update the selectedBook with chapters
        setSelectedBook({ ...selectedBook, chapters: chapters });
        setSelectedChapter(chapters[0]);
      } else {
        console.log("No chapters found for book:", bookSlug);
      }
    } catch (error) {
      console.error("Error loading chapters:", error);
    }
  };

  const loadHadiths = async (bookSlug, chapterId) => {
    if (isLoadingHadiths) return;

    try {
      setIsLoadingHadiths(true);
      console.log("Loading hadiths for book:", bookSlug, "chapter:", chapterId);

      const hadiths = await offlineStorageService.getHadiths(
        bookSlug,
        chapterId
      );
      console.log("Loaded hadiths:", hadiths.length);
      console.log("Sample hadith:", hadiths[0]);

      console.log("Setting hadiths state with:", hadiths.length, "hadiths");
      setHadiths(hadiths);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error loading hadiths:", error);
    } finally {
      setIsLoadingHadiths(false);
    }
  };

  const handleBookSelect = async (book) => {
    console.log("Book selected:", book.bookSlug);
    setSelectedBook(book);
    setSelectedChapter(null);
    setHadiths([]);
    setSearchTerm("");
    setFilterChapter("");
    setShowSearchResults(false);

    // Try to migrate data for this book if needed
    try {
      console.log("Starting migration for book:", book.bookSlug);
      await offlineStorageService.migrateChapterIds();
      console.log("Migration completed for book:", book.bookSlug);

      // After migration, reload the book data to get updated chapters
      const updatedBook = await offlineStorageService.getBook(book.bookSlug);
      if (
        updatedBook &&
        updatedBook.chapters &&
        updatedBook.chapters.length > 0
      ) {
        console.log("Found updated chapters:", updatedBook.chapters.length);
        setSelectedBook({ ...book, chapters: updatedBook.chapters });
        // Don't auto-select first chapter - let user choose
      }
    } catch (error) {
      console.error("Migration failed:", error);
    }
  };

  const handleChapterSelect = (chapter) => {
    console.log("Selected chapter:", chapter);
    setSelectedChapter(chapter);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSearchResults(true);
  };

  const handleDeleteBook = async (bookSlug) => {
    if (window.confirm(getTranslation(language, "confirmDeleteBook"))) {
      try {
        await offlineStorageService.deleteBook(bookSlug);
        await loadDownloadedBooks();
        if (selectedBook?.bookSlug === bookSlug) {
          setSelectedBook(null);
          setSelectedChapter(null);
          setHadiths([]);
        }
        toast.success(getTranslation(language, "bookDeleted"));
      } catch (error) {
        console.error("Error deleting book:", error);
        toast.error(getTranslation(language, "errorDeletingBook"));
      }
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm(getTranslation(language, "confirmClearAllData"))) {
      try {
        await offlineStorageService.clearAllData();
        setDownloadedBooks([]);
        setSelectedBook(null);
        setSelectedChapter(null);
        setHadiths([]);
        toast.success(getTranslation(language, "allDataCleared"));
      } catch (error) {
        console.error("Error clearing data:", error);
        toast.error(getTranslation(language, "errorClearingData"));
      }
    }
  };

  const handleMigrateData = async () => {
    try {
      toast.info(getTranslation(language, "migratingData"));
      const success = await offlineStorageService.migrateChapterIds();
      if (success) {
        toast.success(getTranslation(language, "migrationCompleted"));
        if (selectedBook) {
          await loadChapters(selectedBook.bookSlug);
        }
      } else {
        toast.error(getTranslation(language, "migrationFailed"));
      }
    } catch (error) {
      console.error("Error during migration:", error);
      toast.error(getTranslation(language, "migrationFailed"));
    }
  };

  const filteredHadiths = hadiths.filter((hadith) => {
    const matchesSearch =
      searchTerm === "" ||
      hadith.arabic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hadith.hadithArabic?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterChapter === "" || hadith.chapterId?.toString() === filterChapter;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredHadiths.length / hadithsPerPage);
  const startIndex = (currentPage - 1) * hadithsPerPage;
  const paginatedHadiths = filteredHadiths.slice(
    startIndex,
    startIndex + hadithsPerPage
  );

  const handleLanguageChange = (newLanguage) => {
    // This would be handled by the parent component
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {getTranslation(language, "loading")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-purple-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Title Section */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link
                to="/islamic-library"
                className="flex items-center space-x-2 space-x-reverse text-purple-600 hover:text-purple-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {getTranslation(language, "backToLibrary")}
                </span>
              </Link>
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-cairo font-bold text-gray-900">
                    {getTranslation(language, "offlineReader")}
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {getTranslation(language, "readOffline")}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex items-center space-x-3 sm:space-x-4 space-x-reverse">
              {/* Online Status */}
              <div className="flex items-center space-x-2 space-x-reverse">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {isOnline
                    ? getTranslation(language, "online")
                    : getTranslation(language, "offline")}
                </span>
              </div>

              {/* Storage Info */}
              {storageInfo && (
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                  <Database className="w-4 h-4" />
                  <span>
                    {storageInfo.used} / {storageInfo.total}
                  </span>
                </div>
              )}

              <LanguageSelector
                currentLanguage={language}
                onLanguageChange={handleLanguageChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-purple-200/50 shadow-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-800">
                  {downloadedBooks.length}
                </div>
                <div className="text-sm text-purple-600 font-semibold">
                  {getTranslation(language, "downloadedBooks")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-800">
                  {hadiths.length}
                </div>
                <div className="text-sm text-blue-600 font-semibold">
                  {getTranslation(language, "totalHadiths")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-800">
                  {selectedChapter ? 1 : 0}
                </div>
                <div className="text-sm text-green-600 font-semibold">
                  {getTranslation(language, "selectedChapter")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-orange-800">
                  {filteredHadiths.length}
                </div>
                <div className="text-sm text-orange-600 font-semibold">
                  {getTranslation(language, "filteredHadiths")}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        {!selectedBook ? (
          // Books Grid View (like Islamic Library)
          <div className="space-y-6 sm:space-y-8">
            {/* Books Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-cairo font-bold text-gray-900 mb-2">
                  {getTranslation(language, "downloadedBooks")}
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  {downloadedBooks.length}{" "}
                  {getTranslation(language, "booksFound")}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 space-x-reverse">
                <button
                  onClick={handleMigrateData}
                  className="flex items-center space-x-2 space-x-reverse px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  title={getTranslation(language, "migrateData")}
                >
                  <Database className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {getTranslation(language, "migrateData")}
                  </span>
                </button>
                <button
                  onClick={handleClearAllData}
                  className="flex items-center space-x-2 space-x-reverse px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  title={getTranslation(language, "clearAllData")}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {getTranslation(language, "clearAllData")}
                  </span>
                </button>
              </div>
            </div>

            {/* Books Grid */}
            {downloadedBooks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-8 sm:p-12 border border-purple-200/50 shadow-lg text-center"
              >
                <Download className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl sm:text-2xl font-cairo font-bold text-gray-900 mb-4">
                  {getTranslation(language, "noDownloadedBooks")}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base mb-6">
                  {getTranslation(language, "downloadBooksToReadOffline")}
                </p>
                <Link
                  to="/islamic-library"
                  className="inline-flex items-center space-x-2 space-x-reverse px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Download className="w-4 h-4" />
                  <span>{getTranslation(language, "downloadBooks")}</span>
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {downloadedBooks.map((book, index) => (
                  <motion.div
                    key={book.bookSlug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white/80 backdrop-blur-md rounded-2xl border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => handleBookSelect(book)}
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBook(book.bookSlug);
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-cairo font-bold text-gray-900 text-lg">
                          {language === "ar" ? book.bookName : book.bookNameEn}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {book.writerName}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Download className="w-3 h-3 mr-1" />
                            {getTranslation(language, "downloaded")}
                          </span>
                          <span className="text-sm text-gray-500">
                            {book.hadiths_count || 0}{" "}
                            {getTranslation(language, "hadiths")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : !selectedChapter ? (
          // Chapters View
          <div className="space-y-6 sm:space-y-8">
            {/* Book Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-purple-200/50 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-cairo font-bold text-gray-900 mb-2">
                      {language === "ar"
                        ? selectedBook.bookName
                        : selectedBook.bookNameEn}
                    </h2>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {selectedBook.writerName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Download className="w-3 h-3 mr-1" />
                    {getTranslation(language, "downloaded")}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Chapters Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-cairo font-bold text-gray-900">
                  {getTranslation(language, "chapters")}
                </h3>
                <span className="text-sm text-gray-500">
                  {selectedBook.chapters?.length || 0}{" "}
                  {getTranslation(language, "chapters")}
                </span>
              </div>

              {selectedBook.chapters && selectedBook.chapters.length > 0 ? (
                <div>
                  <div className="mb-4 p-2 bg-blue-50 rounded text-sm">
                    Debug: Found {selectedBook.chapters.length} chapters
                    <br />
                    First chapter:{" "}
                    {selectedBook.chapters[0]?.chapterArabic ||
                      selectedBook.chapters[0]?.chapterEnglish}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {selectedBook.chapters.map((chapter, index) => (
                      <motion.div
                        key={chapter.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white/80 backdrop-blur-md rounded-xl border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer p-4"
                        onClick={() => handleChapterSelect(chapter)}
                      >
                        <div className="space-y-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-sm">
                              {chapter.chapterNumber}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-cairo font-semibold text-gray-900 text-sm">
                              {language === "ar"
                                ? chapter.chapterArabic
                                : chapter.chapterEnglish}
                            </h4>
                            <p className="text-gray-500 text-xs mt-1">
                              {language === "ar"
                                ? chapter.chapterEnglish
                                : chapter.chapterArabic}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">
                    {getTranslation(language, "noChaptersFound")}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Hadiths View
          <div className="space-y-6 sm:space-y-8">
            {/* Chapter Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-purple-200/50 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <button
                    onClick={() => setSelectedChapter(null)}
                    className="text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-cairo font-bold text-gray-900 mb-2">
                      {language === "ar"
                        ? selectedChapter.chapterArabic
                        : selectedChapter.chapterEnglish}
                    </h2>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {language === "ar"
                        ? selectedChapter.chapterEnglish
                        : selectedChapter.chapterArabic}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {filteredHadiths.length} {getTranslation(language, "hadiths")}
                </div>
              </div>
            </motion.div>

            {/* Search and Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-purple-200/50 shadow-lg"
            >
              <form onSubmit={handleSearch} className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث في الأحاديث العربية..."
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                  />
                </div>
              </form>
            </motion.div>

            {/* Hadiths List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-purple-200/50 shadow-lg"
            >
              {isLoadingHadiths ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">
                    {getTranslation(language, "loadingHadiths")}
                  </p>
                </div>
              ) : filteredHadiths.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    {getTranslation(language, "noHadithsFound")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedHadiths.map((hadith) => (
                    <motion.div
                      key={hadith.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="mb-3">
                        <span className="inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded">
                          {getTranslation(language, "hadith")} #
                          {hadith.idInBook}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="text-right">
                          <p className="text-lg leading-relaxed text-gray-900">
                            {hadith.arabic || hadith.hadithArabic || ""}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-2 space-x-reverse mt-6">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-600">
                        {getTranslation(language, "page")} {currentPage}{" "}
                        {getTranslation(language, "of")} {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineReader;
