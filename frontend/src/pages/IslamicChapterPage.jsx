import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  ChevronLeft,
  Hash,
  Share2,
  Bookmark,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Brain,
} from "lucide-react";
import IslamicHadithCard from "../components/IslamicHadithCard";
import LanguageSelector from "../components/LanguageSelector";
import BookmarkModal from "../components/BookmarkModal";
import IslamicChapterNavigation from "../components/IslamicChapterNavigation";
import SEO from "../components/SEO";
import {
  getTranslation,
  getBookTranslation,
  getWriterTranslation,
} from "../utils/translations";
import {
  addIslamicBookmark,
  checkIslamicBookmark,
  createChapterBookmarkData,
  removeIslamicBookmark,
} from "../services/islamicBookmarksService";
import toast from "react-hot-toast";

const IslamicChapterPage = () => {
  const { bookSlug, chapterNumber } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [bookmarkId, setBookmarkId] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("islamicLibraryLanguage") || "ar";
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHadiths, setTotalHadiths] = useState(0);
  const [hadithsPerPage] = useState(10);

  // Bookmark modal states
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [bookmarkModalHadith, setBookmarkModalHadith] = useState(null);
  const [collections, setCollections] = useState([]);
  const [bookmarkedHadiths, setBookmarkedHadiths] = useState(new Set());

  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    fetchChapterData();
  }, [bookSlug, chapterNumber]);

  const fetchChapterData = async () => {
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

      // Check if it's a local book
      const isLocalBook = currentBook?.isLocal || false;

      if (isLocalBook) {
        // For local books, fetch hadiths for the specific chapter
        // For single chapter books, use chapterId 0
        const actualChapterId =
          book?.chapters_count === "1" ? "0" : chapterNumber;
        const url = `${
          import.meta.env.VITE_API_URL
        }/islamic-library/local-books/${bookSlug}/chapters/${actualChapterId}/hadiths?page=${currentPage}&paginate=${hadithsPerPage}`;

        const hadithsResponse = await fetch(url);
        const hadithsData = await hadithsResponse.json();

        if (hadithsData.status === 200) {
          // Sort hadiths by idInBook within the chapter
          const sortedHadiths = (hadithsData.hadiths?.data || []).sort(
            (a, b) => a.idInBook - b.idInBook
          );

          setHadiths(sortedHadiths);
          setTotalHadiths(hadithsData.hadiths?.total || 0);
          setTotalPages(
            Math.ceil((hadithsData.hadiths?.total || 0) / hadithsPerPage)
          );
        }

        // For local books, fetch chapter details
        const chaptersResponse = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/islamic-library/books/${bookSlug}/chapters`
        );
        const chaptersData = await chaptersResponse.json();
        if (chaptersData.status === 200) {
          const currentChapter = chaptersData.chapters?.find(
            (c) => c.chapterNumber.toString() == chapterNumber
          );
          setChapter(currentChapter);
        }
      } else {
        // For external books, fetch chapters and hadiths
        const chaptersResponse = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/islamic-library/books/${bookSlug}/chapters`
        );
        const chaptersData = await chaptersResponse.json();
        if (chaptersData.status === 200) {
          const currentChapter = chaptersData.chapters?.find(
            (c) => c.chapterNumber === chapterNumber
          );
          setChapter(currentChapter);
        }

        // Fetch hadiths for this chapter with pagination
        const hadithsResponse = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/islamic-library/hadiths?book=${bookSlug}&chapter=${chapterNumber}&page=${currentPage}&paginate=${hadithsPerPage}`
        );
        const hadithsData = await hadithsResponse.json();
        if (hadithsData.status === 200) {
          setHadiths(hadithsData.hadiths?.data || []);
          setTotalHadiths(hadithsData.hadiths?.total || 0);
          setTotalPages(
            Math.ceil((hadithsData.hadiths?.total || 0) / hadithsPerPage)
          );
        }
      }
    } catch (error) {
      console.error("Error fetching chapter data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const result = await checkIslamicBookmark({
          bookSlug: bookSlug,
          chapterId: chapter?.chapterId,
          type: "chapter",
        });
        setIsBookmarked(result.isBookmarked);

        setBookmarkId(result.bookmark?.id || null);
      } catch (error) {
        console.error("Error checking bookmark status:", error);
      }
    };

    checkBookmarkStatus();
  }, [chapter?.chapterId]);

  // Fetch hadiths when page changes
  useEffect(() => {
    if (bookSlug && chapterNumber) {
      fetchHadithsForPage();
    }
  }, [currentPage, bookSlug, chapterNumber]);

  const fetchHadithsForPage = async () => {
    try {
      // Check if it's a local book
      const isLocalBook = book?.isLocal || false;

      if (isLocalBook) {
        // For local books, fetch hadiths for the specific chapter
        // For single chapter books, use chapterId 0
        const actualChapterId =
          book?.chapters_count === "1" ? "0" : chapterNumber;
        const hadithsResponse = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/islamic-library/local-books/${bookSlug}/chapters/${actualChapterId}/hadiths?page=${currentPage}&paginate=${hadithsPerPage}`
        );
        const hadithsData = await hadithsResponse.json();
        if (hadithsData.status === 200) {
          // Sort hadiths by idInBook within the chapter
          const sortedHadiths = (hadithsData.hadiths?.data || []).sort(
            (a, b) => a.idInBook - b.idInBook
          );

          setHadiths(sortedHadiths);
          setTotalHadiths(hadithsData.hadiths?.total || 0);
          setTotalPages(
            Math.ceil((hadithsData.hadiths?.total || 0) / hadithsPerPage)
          );
        }
      } else {
        // For external books, fetch hadiths for specific chapter
        const hadithsResponse = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/islamic-library/hadiths?book=${bookSlug}&chapter=${chapterNumber}&page=${currentPage}&paginate=${hadithsPerPage}`
        );
        const hadithsData = await hadithsResponse.json();
        if (hadithsData.status === 200) {
          // Sort hadiths by chapterId first, then by idInBook within each chapter
          const sortedHadiths = (hadithsData.hadiths?.data || []).sort(
            (a, b) => {
              // First sort by chapterId
              if (a.chapterId !== b.chapterId) {
                return a.chapterId - b.chapterId;
              }
              // Then sort by idInBook within the same chapter
              return a.idInBook - b.idInBook;
            }
          );

          setHadiths(sortedHadiths);
          setTotalHadiths(hadithsData.hadiths?.total || 0);
          setTotalPages(
            Math.ceil((hadithsData.hadiths?.total || 0) / hadithsPerPage)
          );
        }
      }
    } catch (error) {
      console.error("Error fetching hadiths for page:", error);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem("islamicLibraryLanguage", newLanguage);
  };

  // Reset page to 1 when search term changes
  useEffect(() => {
    if (searchTerm) {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  const filteredHadiths = hadiths.filter((hadith) => {
    const searchText = searchTerm.toLowerCase();
    return (
      // Local book structure
      hadith.arabic?.toLowerCase().includes(searchText) ||
      hadith.english?.text?.toLowerCase().includes(searchText) ||
      hadith.english?.narrator?.toLowerCase().includes(searchText) ||
      hadith.idInBook?.toString().includes(searchText) ||
      // External book structure
      hadith.hadithArabic?.toLowerCase().includes(searchText) ||
      hadith.hadithEnglish?.toLowerCase().includes(searchText) ||
      hadith.hadithUrdu?.toLowerCase().includes(searchText) ||
      hadith.hadithNumber?.toLowerCase().includes(searchText) ||
      hadith.englishNarrator?.toLowerCase().includes(searchText) ||
      hadith.urduNarrator?.toLowerCase().includes(searchText) ||
      hadith.headingArabic?.toLowerCase().includes(searchText) ||
      hadith.headingEnglish?.toLowerCase().includes(searchText) ||
      hadith.headingUrdu?.toLowerCase().includes(searchText)
    );
  });

  const handleHadithSelect = (hadith) => {
    // Check if it's a local book
    const isLocalBook = book?.isLocal || false;

    if (isLocalBook) {
      // For local books, navigate to local hadith page
      navigate(`/islamic-library/local-books/${bookSlug}/hadith/${hadith.id}`);
    } else {
      // For external books, navigate to regular hadith page
      navigate(
        `/islamic-library/book/${bookSlug}/chapter/${chapterNumber}/hadith/${hadith.hadithNumber}`
      );
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/islamic-library/book/${bookSlug}/chapter/${chapterNumber}`;
    if (navigator.share) {
      navigator.share({
        title: `${getBookTranslation(language, book?.bookName)} - ${
          language === "ar"
            ? chapter?.chapterArabic
            : language === "en"
            ? chapter?.chapterEnglish
            : chapter?.chapterUrdu
        }`,
        text: `${getTranslation(language, "chapter")} ${chapterNumber}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  // Pagination handlers
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

  // Generate page numbers for pagination
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

  // Bookmark modal functions
  const openBookmarkModal = async (hadith) => {
    setBookmarkModalHadith(hadith);
    // Fetch collections from API
    try {
      const res = await import("../services/islamicBookmarksService");
      const data = await res.getUserCollections();
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
      // Update bookmark status
      setBookmarkedHadiths(
        (prev) => new Set([...prev, bookmarkModalHadith.id])
      );
    } catch (error) {
      console.error("Error adding bookmark:", error);
    } finally {
      closeBookmarkModal();
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!chapter || !chapter.chapterNumber || !chapter.chapterArabic) {
      toast.error(getTranslation(language, "chapterDataMissing"));
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (isBookmarked) {
        await removeIslamicBookmark(bookmarkId);
        setIsBookmarked(false);
        setBookmarkId(null);
        toast.success(getTranslation(language, "bookmarkRemoved"));
      } else {
        const bookmarkData = createChapterBookmarkData(book, chapter, language);
        const result = await addIslamicBookmark(bookmarkData);
        setIsBookmarked(true);
        setBookmarkId(result.bookmarkId);
        toast.success(getTranslation(language, "bookmarkAdded"));
      }
    } catch (error) {
      toast.error(getTranslation(language, "bookmarkError"));
      console.error("Error toggling bookmark:", error);
    } finally {
      setIsLoading(false);
    }
  };
  // Check bookmark status for a hadith
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 sm:py-20">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-sm sm:text-base">
              {getTranslation(language, "loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!book || !chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 sm:py-20">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-cairo font-semibold text-gray-600 mb-2">
              {getTranslation(language, "chapterNotFound")}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  // SEO Metadata
  const seoData = {
    title:
      language === "ar"
        ? `${chapter?.chapterArabic || `الباب ${chapterNumber}`} - ${
            getBookTranslation(language, book?.bookName) || book?.bookName
          } | مشكاة`
        : `${
            chapter?.chapterEnglish ||
            chapter?.chapterUrdu ||
            `Chapter ${chapterNumber}`
          } - ${
            book?.bookNameEn ||
            getBookTranslation(language, book?.bookName) ||
            book?.bookName
          } | Meshkah`,
    description:
      language === "ar"
        ? `اقرأ الباب ${chapterNumber} من كتاب ${
            getBookTranslation(language, book?.bookName) || book?.bookName
          } للكاتب ${
            getBookTranslation(language, book?.writerName) || book?.writerName
          } في مشكاة. يحتوي على ${totalHadiths} حديث.`
        : `Read Chapter ${chapterNumber} from ${
            book?.bookNameEn ||
            getBookTranslation(language, book?.bookName) ||
            book?.bookName
          } by ${
            book?.writerNameEn ||
            getBookTranslation(language, book?.writerName) ||
            book?.writerName
          } on Meshkah. Contains ${totalHadiths} hadiths.`,
    keywords:
      language === "ar"
        ? `${chapter?.chapterArabic || `الباب ${chapterNumber}`}, ${
            getBookTranslation(language, book?.bookName) || book?.bookName
          }, ${
            getBookTranslation(language, book?.writerName) || book?.writerName
          }, حديث نبوي, مشكاة, مكتبة إسلامية`
        : `${
            chapter?.chapterEnglish ||
            chapter?.chapterUrdu ||
            `Chapter ${chapterNumber}`
          }, ${
            book?.bookNameEn ||
            getBookTranslation(language, book?.bookName) ||
            book?.bookName
          }, ${
            book?.writerNameEn ||
            getBookTranslation(language, book?.writerName) ||
            book?.writerName
          }, Hadith, Meshkah, Islamic library`,
    canonicalUrl: `${window.location.origin}/islamic-library/book/${bookSlug}/chapter/${chapterNumber}`,
    ogImage: "https://hadith-shareef.com/logo.svg",
    alternateLanguages: [
      {
        hrefLang: "ar",
        href: `${window.location.origin}/islamic-library/book/${bookSlug}/chapter/${chapterNumber}?lang=ar`,
      },
      {
        hrefLang: "en",
        href: `${window.location.origin}/islamic-library/book/${bookSlug}/chapter/${chapterNumber}?lang=en`,
      },
      {
        hrefLang: "x-default",
        href: `${window.location.origin}/islamic-library/book/${bookSlug}/chapter/${chapterNumber}`,
      },
    ],
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Chapter",
      name:
        language === "ar"
          ? chapter?.chapterArabic || `الباب ${chapterNumber}`
          : chapter?.chapterEnglish ||
            chapter?.chapterUrdu ||
            `Chapter ${chapterNumber}`,
      isPartOf: {
        "@type": "Book",
        name:
          language === "ar"
            ? getBookTranslation(language, book?.bookName) || book?.bookName
            : book?.bookNameEn ||
              getBookTranslation(language, book?.bookName) ||
              book?.bookName,
        author: {
          "@type": "Person",
          name:
            language === "ar"
              ? getBookTranslation(language, book?.writerName) ||
                book?.writerName
              : book?.writerNameEn ||
                getBookTranslation(language, book?.writerName) ||
                book?.writerName,
        },
      },
      description:
        language === "ar"
          ? `الباب ${chapterNumber} من كتاب ${
              getBookTranslation(language, book?.bookName) || book?.bookName
            }`
          : `Chapter ${chapterNumber} from ${
              book?.bookNameEn ||
              getBookTranslation(language, book?.bookName) ||
              book?.bookName
            }`,
      position: parseInt(chapterNumber),
      numberOfItems: totalHadiths,
    },
  };

  return (
    <>
      <SEO {...seoData} />
      <div
        className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 "
        style={{ direction: language === "ar" ? "rtl" : "ltr" }}
      >
        {/* Enhanced Header with Glass Effect */}
        <div className="bg-white/90 backdrop-blur-xl border-b border-purple-200/50 sticky top-0 z-10 shadow-lg">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center justify-between sm:justify-start space-x-3 sm:space-x-6 space-x-reverse">
                <Link
                  to={`/islamic-library/book/${bookSlug}`}
                  className="flex items-center space-x-2 space-x-reverse text-purple-600 hover:text-purple-700 transition-all hover:scale-105"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-cairo font-medium text-sm sm:text-base">
                    {getTranslation(language, "back")}
                  </span>
                </Link>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-2 sm:space-x-4 space-x-reverse"
                >
                  <div className="relative">
                    <div className="w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Hash className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {chapterNumber}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-lg sm:text-2xl lg:text-3xl font-cairo font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {language === "ar"
                        ? chapter.chapterArabic
                        : language === "en"
                        ? chapter.chapterEnglish
                        : chapter.chapterUrdu}
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center space-x-2 space-x-reverse">
                      <span className="truncate">
                        {language === "ar"
                          ? getBookTranslation(language, book.bookName)
                          : book.bookNameEn
                          ? book.bookNameEn
                          : getBookTranslation(language, book.bookName)}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="truncate">
                        {language === "ar"
                          ? getBookTranslation(language, book.writerName)
                          : book.writerNameEn
                          ? book.writerNameEn
                          : getWriterTranslation(language, book.writerName)}
                      </span>
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="flex items-center space-x-1 space-x-reverse">
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors bg-white/50 rounded-xl"
                  title={getTranslation(language, "share")}
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleBookmark}
                  className={`p-2 text-gray-400 hover:text-purple-600 transition-colors  rounded-xl ${
                    isBookmarked ? "bg-purple-600 text-white" : "bg-white/50"
                  }`}
                  title={getTranslation(language, "bookmark")}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <div className="relative">
                  <LanguageSelector
                    currentLanguage={language}
                    onLanguageChange={handleLanguageChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Enhanced Chapter Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 sm:p-8 mb-6 sm:mb-8 border border-purple-200/50 shadow-xl"
          >
            <div className="flex flex-col lg:flex-row items-center space-y-4 sm:space-y-6 lg:space-y-0 lg:space-x-8 lg:space-x-reverse">
              <div className="relative">
                <div className="w-16 h-16 m-5  sm:w-24 sm:h-32 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <img
                    src={`/assets/${bookSlug}.jpeg`}
                    alt={book.bookName}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {chapterNumber}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-cairo font-bold text-gray-900 mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {language === "ar"
                    ? chapter.chapterArabic
                    : language === "en"
                    ? chapter.chapterEnglish
                    : chapter.chapterUrdu}
                </h2>
                <p className="text-gray-600 mb-4 text-sm sm:text-lg">
                  {language === "ar"
                    ? getBookTranslation(language, book.bookName)
                    : book.bookNameEn
                    ? book.bookNameEn
                    : getBookTranslation(language, book.bookName)}
                  -{" "}
                  {language === "ar"
                    ? getBookTranslation(language, book.writerName)
                    : book.writerNameEn
                    ? book.writerNameEn
                    : getWriterTranslation(language, book.writerName)}
                </p>

                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-purple-800">
                      {totalHadiths}
                    </div>
                    <div className="text-xs sm:text-sm text-purple-600">
                      {getTranslation(language, "hadiths")}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-blue-800">
                      {currentPage}
                    </div>
                    <div className="text-xs sm:text-sm text-blue-600">
                      {getTranslation(language, "page")}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-green-800">
                      {totalPages}
                    </div>
                    <div className="text-xs sm:text-sm text-green-600">
                      {getTranslation(language, "numberOfPages")}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-orange-800">
                      {filteredHadiths.length}
                    </div>
                    <div className="text-xs sm:text-sm text-orange-600">
                      {getTranslation(language, "showing")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chapter Navigation for All Books */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <IslamicChapterNavigation
              bookSlug={bookSlug}
              chapterNumber={chapterNumber}
              book={book}
              language={language}
              onChapterChange={(newChapterId) => {
                // Navigate to the new chapter based on book type
                if (book?.isLocal) {
                  window.location.href = `/islamic-library/local-books/${bookSlug}/chapter/${newChapterId}`;
                } else {
                  window.location.href = `/islamic-library/book/${bookSlug}/chapter/${newChapterId}`;
                }
              }}
            />
          </motion.div>

          {/* Enhanced Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 border border-purple-200/50 shadow-xl"
          >
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={getTranslation(language, "searchPlaceholder")}
                className="w-full pl-9 sm:pl-12 pr-4 py-3 sm:py-4 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-lg"
              />
            </div>
          </motion.div>

          {/* Enhanced Hadiths List */}
          <motion.div className="space-y-4 sm:space-y-6">
            {filteredHadiths.map((hadith) => (
              <motion.div key={hadith.id}>
                <IslamicHadithCard
                  hadith={hadith}
                  onSelect={handleHadithSelect}
                  language={language}
                  onBookmark={openBookmarkModal}
                  isBookmarked={bookmarkedHadiths.has(hadith.id)}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-purple-200/50 shadow-xl"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Pagination Info */}
                <div className="text-center sm:text-right">
                  <p className="text-sm text-gray-600">
                    {getTranslation(language, "showing")}{" "}
                    {(currentPage - 1) * hadithsPerPage + 1} -{" "}
                    {Math.min(currentPage * hadithsPerPage, totalHadiths)}{" "}
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
                          typeof page === "number"
                            ? handlePageChange(page)
                            : null
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

          {/* Enhanced No Results */}
          {filteredHadiths.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 sm:py-20"
            >
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-2xl font-cairo font-bold text-gray-600 mb-4">
                {getTranslation(language, "noHadiths")}
              </h3>
              <p className="text-gray-500 text-sm sm:text-lg">
                {getTranslation(language, "tryDifferentSearch")}
              </p>
            </motion.div>
          )}
        </div>

        {/* Bookmark Modal */}
        <BookmarkModal
          isOpen={isBookmarkModalOpen}
          onClose={closeBookmarkModal}
          onSubmit={handleBookmarkModalSubmit}
          existingCollections={collections}
          language={language}
          itemType="chapter"
          itemTitle={
            language === "ar"
              ? bookmarkModalHadith?.hadithArabic
              : bookmarkModalHadith?.hadithEnglish
          }
        />
      </div>
    </>
  );
};

export default IslamicChapterPage;
