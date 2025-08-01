import { useState, useEffect, useMemo } from "react";
import Fuse from "fuse.js";
import { fetchHadithsByBook } from "../services/api";
import { debounce } from "lodash";
import { useNavigate, useParams } from "react-router-dom";
import HadithCard from "../components/HadithCard";
import PropTypes from "prop-types";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useBookmarks } from "../context/BookmarkContext";
import axios from "axios";

const HadithList = ({ categories = [], className = "" }) => {
  const [hadiths, setHadiths] = useState([]); // Stores fetched Hadiths
  const [query, setQuery] = useState(""); // Search query
  const [results, setResults] = useState([]); // Search results
  const [loading, setLoading] = useState(true); // Loading state
  const [currentPage, setCurrentPage] = useState(1); // Current page number
  const resultsPerPage = 20; // Number of results per page
  const [showTashkeel] = useState(true);
  const { categoryId, page } = useParams();
  const [showFullHadith] = useState(true);
  const [fontSize] = useState(20); // Default font size in pixels
  const [errorState, setErrorState] = useState(null);
  const [totalHadiths, setTotalHadiths] = useState(0); // New state for total hadiths

  const navigate = useNavigate();

  const { bookmarks, removeBookmark } = useBookmarks();

  const bookmarkedHadithIds = useMemo(() => {
    if (!bookmarks || !hadiths) return [];
    return hadiths
      .filter((hadith) =>
        bookmarks.some((bookmark) => bookmark.hadith_id == hadith.id)
      )
      .map((hadith) => hadith.id);
  }, [bookmarks, hadiths]);

  const initialSelectedCategory = useMemo(() => {
    if (categoryId) {
      const urlCategory = categories.find(
        (cat) => cat.id === Number(categoryId)
      );
      return urlCategory || categories[0] || null;
    }
    return categories[0] || null;
  }, [categories, categoryId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentPage(Number(page) || 1);
  }, [categoryId, page]);

  const [selectedCategory, setSelectedCategory] = useState(
    initialSelectedCategory
  );
  useEffect(() => {
    const urlCategory = categories.find((cat) => cat.id == categoryId);
    if (urlCategory) return setSelectedCategory(urlCategory);
  }, [selectedCategory, categoryId, categories]);

  // تحميل الأحاديث للصفحة الحالية فقط
  useEffect(() => {
    const loadHadiths = async () => {
      setLoading(true);
      try {
        const response = await fetchHadithsByBook(
          categoryId,
          "ar",
          currentPage,
          resultsPerPage
        );

        setHadiths(response.data || []);
        setResults(response.data || []);

        setTotalHadiths(response.pagination?.total || 0);
      } catch {
        setErrorState("حدث خطأ أثناء تحميل الأحاديث.");
      } finally {
        setLoading(false);
      }
    };
    if (categoryId) {
      loadHadiths();
    }
  }, [categoryId, currentPage]);

  // البحث فقط في الأحاديث المحملة حالياً (الصفحة الحالية)
  const performSearch = debounce((searchQuery) => {
    if (!searchQuery) {
      setResults(hadiths);
      setCurrentPage(Number(page) || 1);
      return;
    }
    const normalizedQuery = removeTashkeel(searchQuery);
    const normalizedHadiths = hadiths.map((hadith) => ({
      ...hadith,
      normalizedText: removeTashkeel(hadith?.hadeeth),
    }));
    const fuse = new Fuse(normalizedHadiths, {
      keys: ["normalizedText"],
      threshold: 0.3,
      ignoreLocation: true,
    });
    const searchResults = fuse.search(normalizedQuery);
    setResults(searchResults.map((result) => result.item));
    setCurrentPage(1);
  }, 300);

  useEffect(() => {
    performSearch(query);
  }, [query, hadiths]);

  // Add new state for view mode and filters
  const [filters] = useState({
    bookmarkedOnly: false,
    lengthFilter: null, // 'short', 'medium', 'long'
  });

  // Filter hadiths based on additional criteria
  const filteredResults = useMemo(() => {
    let filtered = results;

    // Filter bookmarked hadiths
    if (filters.bookmarkedOnly) {
      filtered = filtered.filter((hadith) =>
        bookmarks.some((bookmark) => bookmark.hadith_id == hadith.id)
      );
    }

    // Filter by hadith length
    if (filters.lengthFilter) {
      filtered = filtered.filter((hadith) => {
        const length = hadith.hadeeth.length;
        switch (filters.lengthFilter) {
          case "short":
            return length < 50;
          case "medium":
            return length >= 50 && length < 200;
          case "long":
            return length >= 200;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [results, filters, bookmarks]);

  // Function to remove Tashkeel (diacritics) from Arabic text
  const removeTashkeel = (text) => {
    return text
      .replace(/[\u064B-\u065F]/g, "") // Remove Arabic diacritics (Fatha, Damma, Kasra, etc.)
      .replace(/[إأآ]/g, "ا") // Normalize Alef variations
      .replace(/[ى]/g, "ي") // Normalize Ya variations
      .replace(/[ة]/g, "ه") // Normalize Ta Marbuta
      .replace(/[^\u0600-\u06FF\s]/g, ""); // Remove non-Arabic characters
  };

  // Highlight search matches in the results
  const highlightText = (text, query) => {
    if (!query) return text;

    const normalizedText = removeTashkeel(text);
    const normalizedQuery = removeTashkeel(query);
    const regex = new RegExp(`(${normalizedQuery})`, "gi");
    return normalizedText.replace(
      regex,
      '<mark class="bg-yellow-200 text-black">$1</mark>'
    );
  };

  // Pagination logic
  const totalPages = Math.ceil(totalHadiths / resultsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      navigate(`/hadiths/${selectedCategory?.id}/page/${currentPage + 1}`);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      navigate(`/hadiths/${selectedCategory?.id}/page/${currentPage - 1}`);
    }
  };

  // Modify the bookmark toggle function
  const handleBookmarkToggle = (hadith) => {
    if (bookmarks.some((bookmark) => bookmark.hadith_id == hadith.id)) {
      removeBookmark(hadith.id);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] flex justify-center items-center">
        <div className="w-16 h-16 border-4 border-t-4 border-t-purple-500 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render error state
  if (errorState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] flex justify-center items-center text-center p-4">
        <h2 className="text-2xl font-bold text-red-600">{errorState}</h2>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] py-4 px-2 sm:py-8 sm:px-4 md:px-6 lg:px-8 ${className}`}
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-12 px-2">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#7440E9] drop-shadow-md">
            {selectedCategory?.title || "الأحاديث"}
          </h1>
          <p className="mt-2 sm:mt-4 text-base sm:text-lg text-gray-600">
            تصفح الأحاديث النبوية الشريفة في هذا القسم
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 sm:mb-8 p-2 sm:p-4 bg-white/60 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-lg border border-purple-100/80 flex flex-col gap-3 sm:gap-4 md:flex-row items-stretch md:items-center">
          <div className="relative w-full md:flex-grow">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في أحاديث القسم..."
              className="w-full pl-10 pr-3 py-2 sm:pl-12 sm:pr-4 sm:py-3 rounded-full bg-white border-2 border-purple-200 text-black focus:ring-2 focus:ring-purple-400 focus:outline-none transition text-sm sm:text-base"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 sm:left-4 sm:w-6 sm:h-6 text-gray-400" />
          </div>
          {/* Add filter buttons here if needed */}
        </div>

        {/* Hadith List */}
        <div className="space-y-4 sm:space-y-6">
          {filteredResults.map((hadith) => (
            <HadithCard
              key={hadith.id}
              hadith={hadith}
              isBookmarked={bookmarkedHadithIds.includes(hadith.id)}
              onBookmarkToggle={() => handleBookmarkToggle(hadith)}
              highlight={query ? (text) => highlightText(text, query) : null}
              showTashkeel={showTashkeel}
              showFullHadith={showFullHadith}
              fontSize={fontSize}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-center items-center mt-8 sm:mt-12 gap-2 sm:gap-4 w-full">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="w-full sm:w-auto mb-2 sm:mb-0 px-3 py-2 sm:px-4 sm:py-2 rounded-full bg-white/80 backdrop-blur-md shadow-lg border border-purple-100/80 text-[#7440E9] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-transform hover:scale-105 text-sm sm:text-base"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>السابق</span>
            </button>
            <span className="font-bold text-gray-700 text-sm sm:text-base">
              صفحة {currentPage} من {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2 rounded-full bg-white/80 backdrop-blur-md shadow-lg border border-purple-100/80 text-[#7440E9] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-transform hover:scale-105 text-sm sm:text-base"
            >
              <span>التالي</span>
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

HadithList.propTypes = {
  categories: PropTypes.array,
  className: PropTypes.string,
};

export default HadithList;
