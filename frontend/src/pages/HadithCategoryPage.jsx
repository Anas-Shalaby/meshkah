import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchHadithsByBook, fetchMainCategories } from "../services/api";
import HadithCard from "../components/HadithCard";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";

const HadithCategoryPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  const [hadiths, setHadiths] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState([]);
  const resultsPerPage = 20;

  // Fetch main categories and hadiths
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesResponse = await fetchMainCategories();
        setMainCategories(categoriesResponse);

        if (subcategoryId) {
          const hadithsResponse = await fetchHadithsByBook(
            subcategoryId,
            "ar",
            1,
            1000
          );
          setHadiths(hadithsResponse.data);
          setResults(hadithsResponse.data);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [subcategoryId]);

  // Search functionality
  useEffect(() => {
    if (query) {
      const filteredResults = hadiths.filter((hadith) =>
        hadith.title.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filteredResults);
      setCurrentPage(1);
    } else {
      setResults(hadiths);
    }
  }, [query, hadiths]);

  // Pagination
  const totalPages = Math.ceil(results.length / resultsPerPage);
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = results.slice(indexOfFirstResult, indexOfLastResult);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Find subcategory title
  const subcategoryTitle =
    mainCategories
      .flatMap((cat) => cat.subcategories || [])
      .find((subcat) => subcat.id === subcategoryId)?.title || "التصنيف الفرعي";

  // Go back to main categories
  const goBackToMainCategories = () => {
    navigate("/hadiths");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#7440E9]/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-[#7440E9] rounded-full absolute top-0 left-0 animate-spin border-t-transparent"></div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              جاري التحميل
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              يرجى الانتظار قليلاً...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-black text-red-500">
        خطأ: {error}
      </div>
    );

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8"
      dir="rtl"
    >
      <Helmet>
        <title>{`${subcategoryTitle} | مشكاة`}</title>
      </Helmet>

      <div className="max-w-6xl mx-auto">
        {/* Back Button and Subcategory Title */}
        <div className="flex items-center justify-between mb-8 bg-gray-800/50 backdrop-blur-lg p-4 rounded-xl">
          <button
            onClick={goBackToMainCategories}
            className="flex items-center space-x-2 space-x-reverse text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>العودة للتصنيفات الرئيسية</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-200">
            {subcategoryTitle}
          </h2>
        </div>

        {/* Search Input */}
        <div className="mb-8 relative">
          <input
            type="text"
            placeholder="ابحث في الأحاديث..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="
              w-full p-3 pl-10 
              bg-gray-800/50 backdrop-blur-lg 
              border border-gray-700/50 
              rounded-full 
              text-white 
              placeholder-gray-400 
              focus:ring-2 focus:ring-blue-500 
              focus:outline-none 
              text-right
            "
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        {/* Hadith Results */}
        {currentResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {currentResults.map((hadith) => (
              <HadithCard key={hadith.id} hadith={hadith} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 bg-gray-800/50 backdrop-blur-lg p-8 rounded-lg">
            <BookOpen className="mx-auto w-16 h-16 text-blue-300 mb-4" />
            <p className="text-xl text-gray-300">
              لا توجد أحاديث في هذا التصنيف
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-8 bg-gray-800/50 backdrop-blur-lg p-4 rounded-xl">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="
                px-4 py-2 
                bg-blue-500 
                text-white 
                rounded-full 
                disabled:opacity-50 
                flex items-center 
                space-x-2 
                space-x-reverse
                hover:bg-blue-600
                transition-colors
              "
            >
              <ChevronRight />
              <span>السابق</span>
            </button>
            <span className="text-gray-300">
              صفحة {currentPage} من {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="
                px-4 py-2 
                bg-blue-500 
                text-white 
                rounded-full 
                disabled:opacity-50 
                flex items-center 
                space-x-2 
                space-x-reverse
                hover:bg-blue-600
                transition-colors
              "
            >
              <span>التالي</span>
              <ChevronLeft />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HadithCategoryPage;
