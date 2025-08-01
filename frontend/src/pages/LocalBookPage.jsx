import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  ChevronLeft,
  Hash,
  Bookmark,
  Share2,
  Copy,
  Eye,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import LanguageSelector from "../components/LanguageSelector";
import {
  getTranslation,
  getBookTranslation,
  getWriterTranslation,
} from "../utils/translations";
import toast from "react-hot-toast";
import {
  getUserCollections,
  checkIslamicBookmark,
} from "../services/islamicBookmarksService";
import BookmarkModal from "../components/BookmarkModal";

const LocalBookPage = () => {
  const { bookSlug } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHadiths, setTotalHadiths] = useState(0);
  const [resultsPerPage] = useState(20);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("islamicLibraryLanguage") || "ar";
  });

  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    fetchBookData();
  }, [bookSlug]);

  // Fetch hadiths when page changes
  useEffect(() => {
    if (bookSlug && currentPage > 1) {
      fetchHadithsForPage();
    }
  }, [currentPage, bookSlug]);

  const fetchBookData = async () => {
    try {
      setLoading(true);

      // Fetch book details
      const booksResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/islamic-library/books`
      );
      const booksData = await booksResponse.json();
      const currentBook = booksData.allBooks?.find(
        (b) => b.bookSlug === bookSlug
      );
      setBook(currentBook);

      // Fetch hadiths
      const hadithsResponse = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/islamic-library/local-books/${bookSlug}/hadiths?page=1&paginate=${resultsPerPage}`
      );
      const hadithsData = await hadithsResponse.json();
      if (hadithsData.status === 200) {
        // Sort hadiths by chapterId first, then by idInBook within each chapter
        const sortedHadiths = (hadithsData.hadiths.data || []).sort((a, b) => {
          // First sort by chapterId
          if (a.chapterId !== b.chapterId) {
            return a.chapterId - b.chapterId;
          }
          // Then sort by idInBook within the same chapter
          return a.idInBook - b.idInBook;
        });

        setHadiths(sortedHadiths);
        setTotalHadiths(hadithsData.hadiths.total);
        setTotalPages(hadithsData.hadiths.last_page);
      }
    } catch (error) {
      console.error("Error fetching book data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHadithsForPage = async () => {
    try {
      setLoading(true);
      const hadithsResponse = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/islamic-library/local-books/${bookSlug}/hadiths?page=${currentPage}&paginate=${resultsPerPage}`
      );
      const hadithsData = await hadithsResponse.json();
      if (hadithsData.status === 200) {
        // Sort hadiths by chapterId first, then by idInBook within each chapter
        const sortedHadiths = (hadithsData.hadiths.data || []).sort((a, b) => {
          // First sort by chapterId
          if (a.chapterId !== b.chapterId) {
            return a.chapterId - b.chapterId;
          }
          // Then sort by idInBook within the same chapter
          return a.idInBook - b.idInBook;
        });

        setHadiths(sortedHadiths);
        setTotalHadiths(hadithsData.hadiths.total);
        setTotalPages(hadithsData.hadiths.last_page);
      }
    } catch (error) {
      console.error("Error fetching hadiths for page:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem("islamicLibraryLanguage", newLanguage);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      const searchParams = new URLSearchParams();
      searchParams.append("search", searchTerm);
      searchParams.append("page", "1");
      searchParams.append("paginate", resultsPerPage.toString());

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/islamic-library/local-books/${bookSlug}/hadiths?${searchParams.toString()}`
      );
      const data = await response.json();

      if (data.status === 200) {
        // Sort hadiths by chapterId first, then by idInBook within each chapter
        const sortedHadiths = (data.hadiths.data || []).sort((a, b) => {
          // First sort by chapterId
          if (a.chapterId !== b.chapterId) {
            return a.chapterId - b.chapterId;
          }
          // Then sort by idInBook within the same chapter
          return a.idInBook - b.idInBook;
        });

        setHadiths(sortedHadiths);
        setTotalHadiths(data.hadiths.total);
        setTotalPages(data.hadiths.last_page);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error searching hadiths:", error);
    } finally {
      setLoading(false);
    }
  };

  // Updated pagination handlers to match IslamicChapterPage style
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSearchTerm(""); // Clear search when changing pages
  };

  const handleFirstPage = () => {
    handlePageChange(1);
  };

  const handleLastPage = () => {
    handlePageChange(totalPages);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Generate page numbers for pagination (same as IslamicChapterPage)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Reset page to 1 when search term changes
  useEffect(() => {
    if (searchTerm) {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  const handleCopyHadith = (hadith) => {
    const textToCopy =
      language === "ar" ? hadith.arabic : hadith.english?.text || hadith.arabic;
    navigator.clipboard.writeText(textToCopy);
    toast.success(getTranslation(language, "textCopied"));
  };

  const handleShareHadith = (hadith) => {
    const url = `${window.location.origin}/islamic-library/local-books/${bookSlug}/hadiths/${hadith.id}`;
    if (navigator.share) {
      navigator.share({
        title: `${getBookTranslation(
          language,
          book?.bookName
        )} - ${getTranslation(language, "hadith")} ${hadith.id}`,
        text:
          (language === "ar"
            ? hadith.arabic
            : hadith.english?.text || hadith.arabic
          ).substring(0, 100) + "...",
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success(getTranslation(language, "linkCopied"));
    }
  };

  const handleHadithClick = (hadith) => {
    // Navigate to individual hadith page
    navigate(`/islamic-library/local-books/${bookSlug}/hadith/${hadith.id}`);
  };

  // Bookmark functionality for hadiths
  const [bookmarkedHadiths, setBookmarkedHadiths] = useState(new Set());
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [bookmarkModalHadith, setBookmarkModalHadith] = useState(null);
  const [collections, setCollections] = useState([]);

  const openBookmarkModal = async (hadith) => {
    setBookmarkModalHadith(hadith);
    // Fetch collections from API
    try {
      const data = await getUserCollections();
      setCollections(data.collections?.map((c) => c.collection) || []);
    } catch {
      setCollections([]);
    }
    setIsBookmarkModalOpen(true);
  };

  const closeBookmarkModal = () => {
    setIsBookmarkModalOpen(false);
    setBookmarkModalHadith(null);
  };

  const handleBookmarkModalSubmit = async ({ collection, notes }) => {
    if (!bookmarkModalHadith) return;
    try {
      const res = await import("../services/islamicBookmarksService");
      const bookmarkData = res.createHadithBookmarkData(
        book,
        bookmarkModalHadith,
        language
      );
      bookmarkData.collection = collection;
      bookmarkData.notes = notes;
      await res.addIslamicBookmark(bookmarkData);
      toast.success(getTranslation(language, "bookmarkAdded"));
      // Optionally update UI state here
    } catch {
      toast.error(getTranslation(language, "bookmarkError"));
    } finally {
      closeBookmarkModal();
    }
  };

  const checkHadithBookmarkStatus = async (hadithId) => {
    try {
      const result = await checkIslamicBookmark({
        bookSlug: bookSlug,
        type: "hadith",
        hadithId: hadithId,
      });
      return result.isBookmarked;
    } catch (error) {
      console.error("Error checking hadith bookmark status:", error);
      return false;
    }
  };

  // Check bookmark status for all hadiths when they load
  useEffect(() => {
    const checkAllBookmarks = async () => {
      const newBookmarkedHadiths = new Set();

      for (const hadith of hadiths) {
        const isBookmarked = await checkHadithBookmarkStatus(hadith.id);
        if (isBookmarked) {
          newBookmarkedHadiths.add(hadith.id);
        }
      }

      setBookmarkedHadiths(newBookmarkedHadiths);
    };

    if (hadiths.length > 0) {
      checkAllBookmarks();
    }
  }, [hadiths, bookSlug]);

  const filteredHadiths = hadiths.filter((hadith) => {
    const searchText = searchTerm.toLowerCase();
    const hadithText =
      language === "ar" ? hadith.arabic : hadith.english?.text || hadith.arabic;
    return (
      hadithText?.toLowerCase().includes(searchText) ||
      hadith.english?.narrator?.toLowerCase().includes(searchText) ||
      hadith.id?.toString().includes(searchText)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {getTranslation(language, "loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-cairo font-semibold text-gray-600 mb-2">
              {getTranslation(language, "bookNotFound")}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-purple-200/50 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 space-x-reverse">
              <Link
                to="/islamic-library"
                className="flex items-center space-x-2 space-x-reverse text-purple-600 hover:text-purple-700 transition-all hover:scale-105"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-cairo font-semibold">
                  {getTranslation(language, "backToLibrary")}
                </span>
              </Link>
            </div>

            <LanguageSelector
              currentLanguage={language}
              onLanguageChange={handleLanguageChange}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Book Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-purple-200/50 shadow-xl"
        >
          <div className="flex flex-col gap-6 lg:flex-row items-start lg:items-center">
            <div className="relative">
              <div className="w-24 h-32 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                <img
                  src={`/assets/${book.bookSlug}.jpeg`}
                  alt={book.bookName}
                  className="w-full h-full object-cover rounded-2xl"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <BookOpen className="w-12 h-12 text-white hidden" />
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-cairo font-bold text-gray-900 mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {language === "ar"
                  ? getBookTranslation(language, book.bookName)
                  : book.bookNameEn
                  ? book.bookNameEn
                  : getBookTranslation(language, book.bookName)}
              </h2>
              <p className="text-gray-600 mb-4 text-lg">
                {language === "ar"
                  ? getBookTranslation(language, book.writerName)
                  : getWriterTranslation(language, book.writerName)}
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-800">
                    {totalHadiths}
                  </div>
                  <div className="text-sm text-purple-600">
                    {getTranslation(language, "hadiths")}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {totalPages}
                  </div>
                  <div className="text-sm text-blue-600">
                    {getTranslation(language, "page")}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-800">100%</div>
                  <div className="text-sm text-green-600">
                    {getTranslation(language, "available")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 mb-8 border border-purple-200/50 shadow-xl"
        >
          <form
            onSubmit={handleSearch}
            className="flex flex-col lg:flex-row gap-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={getTranslation(language, "searchPlaceholder")}
                className="w-full pl-12 pr-4 py-4 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-lg"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              {getTranslation(language, "search")}
            </button>
          </form>
        </motion.div>

        {/* Hadiths List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {filteredHadiths.map((hadith, index) => (
            <motion.div
              key={hadith.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-purple-200/50 shadow-xl hover:shadow-2xl transition-all cursor-pointer hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Hash className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-sm text-purple-600 font-semibold">
                      {getTranslation(language, "hadith")} #{hadith.idInBook}
                    </span>
                    {language === "ar" ? (
                      <p className="text-xs text-gray-500">
                        {hadith.arabic?.narrator}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {hadith.english?.narrator}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => handleHadithClick(hadith)}
                    className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                    title={getTranslation(language, "view")}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCopyHadith(hadith)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title={getTranslation(language, "copy")}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleShareHadith(hadith)}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title={getTranslation(language, "share")}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openBookmarkModal(hadith);
                    }}
                    className={`p-2 transition-colors ${
                      bookmarkedHadiths.has(hadith.id)
                        ? "text-purple-600 hover:text-purple-700"
                        : "text-gray-400 hover:text-purple-600"
                    }`}
                    title={getTranslation(language, "bookmark")}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        bookmarkedHadiths.has(hadith.id) ? "fill-current" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {language === "ar" ? (
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4">
                    <h4 className="text-sm font-semibold text-purple-700 mb-2">
                      {getTranslation(language, "hadithText")}
                    </h4>
                    <p className="text-xl amiri-regular leading-relaxed text-gray-900">
                      {hadith.arabic}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4">
                    <h4 className="text-sm font-semibold text-blue-700 mb-2">
                      {getTranslation(language, "hadithText")}
                    </h4>
                    {hadith.english?.text ? (
                      <p className="text-lg leading-relaxed text-gray-900">
                        {hadith.english.text}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                              <span className="text-yellow-600 text-xs">!</span>
                            </div>
                            <p className="text-sm font-medium text-yellow-800">
                              {getTranslation(
                                language,
                                "englishTranslationNotAvailable"
                              )}
                            </p>
                          </div>
                        </div>
                        <p className="text-lg leading-relaxed text-gray-900">
                          {hadith.arabic}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Pagination - Updated to match IslamicChapterPage style */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-purple-200/50 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Pagination Info */}
              <div className="text-center sm:text-right">
                <p className="text-sm text-gray-600">
                  {getTranslation(language, "showing")}{" "}
                  {(currentPage - 1) * resultsPerPage + 1} -{" "}
                  {Math.min(currentPage * resultsPerPage, totalHadiths)}{" "}
                  {getTranslation(language, "of")} {totalHadiths}{" "}
                  {getTranslation(language, "hadiths")}
                </p>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center space-x-2 space-x-reverse">
                {/* First Page */}
                <button
                  onClick={handleFirstPage}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-purple-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                  title={getTranslation(language, "firstPage")}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous Page */}
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-purple-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                  title={getTranslation(language, "previous")}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1 space-x-reverse">
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        typeof page === "number" ? handlePageChange(page) : null
                      }
                      disabled={page === "..."}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        page === currentPage
                          ? "bg-purple-600 text-white shadow-lg"
                          : page === "..."
                          ? "text-gray-400 cursor-default"
                          : "text-gray-600 hover:bg-purple-100 hover:text-purple-700"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Next Page */}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-purple-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                  title={getTranslation(language, "next")}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  onClick={handleLastPage}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-purple-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                  title={getTranslation(language, "lastPage")}
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* No Results */}
        {filteredHadiths.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-cairo font-bold text-gray-600 mb-4">
              {getTranslation(language, "noResults")}
            </h3>
            <p className="text-gray-500 text-lg">
              {getTranslation(language, "tryDifferentSearch")}
            </p>
          </motion.div>
        )}
      </div>

      <BookmarkModal
        isOpen={isBookmarkModalOpen}
        onClose={closeBookmarkModal}
        onSubmit={handleBookmarkModalSubmit}
        existingCollections={collections}
        hadith={bookmarkModalHadith}
      />
    </div>
  );
};

export default LocalBookPage;
