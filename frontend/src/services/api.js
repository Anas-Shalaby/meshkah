import axios from "axios";
import { formatApiError } from "../utils/errorHandling";

const API_BASE_URL = "https://hadeethenc.com/api/v1";
const HADITH_API_BASE_URL = "https://api.hadith.gading.dev";

// Hadith API Configuration
const HADITH_API_BASE_URL_NEW = "https://hadithapi.com/api";
const HADITH_API_KEY =
  "$2y$10$skZv03NLUYXxtYAfGkDxnOuGyYG5BvLk443nXbMMm2OIM88zp73Qy";

/**
 * Fetches all hadith categories/books
 * @param {string} lang - Language code (en, ar, etc.)
 * @returns {Promise<Array>} List of hadith categories
 */
export const fetchHadithBooks = async (lang = "en") => {
  try {
    const response = await axios.get(`${API_BASE_URL}/categories/list/`, {
      params: { language: lang },
    });
    return response.data;
  } catch (error) {
    throw formatApiError(error);
  }
};

export const fetchMainCategories = async () => {
  try {
    // Hardcoded main categories based on the provided JSON
    const mainCategories = [
      {
        id: "1",
        title: "القرآن الكريم وعلومه",
        hadeeths_count: "197",
        parent_id: null,
      },
      {
        id: "2",
        title: "الحديث وعلومه",
        hadeeths_count: "15",
        parent_id: null,
      },
      {
        id: "3",
        title: "العقيدة",
        hadeeths_count: "711",
        parent_id: null,
      },
      {
        id: "4",
        title: "الفقه وأصوله",
        hadeeths_count: "1811",
        parent_id: null,
      },
      {
        id: "5",
        title: "الفضائل والآداب",
        hadeeths_count: "1009",
        parent_id: null,
      },
      {
        id: "6",
        title: "الدعوة والحسبة",
        hadeeths_count: "137",
        parent_id: null,
      },
      {
        id: "7",
        title: "السيرة والتاريخ",
        hadeeths_count: "353",
        parent_id: null,
      },
    ];
  } catch (error) {
    throw formatApiError(error);
  }
};

/**
 * Fetches hadiths by category
 * @param {number} categoryId - Category/Book ID
 * @param {string} lang - Language code
 * @param {number} page - Page number for pagination
 * @returns {Promise<Object>} Paginated hadiths data
 */
export const fetchHadithsByBook = async (
  categoryId,
  lang = "ar",
  page = 1,
  per_page
) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/hadeeths/list/`, {
      params: {
        language: lang,
        category_id: categoryId,
        page,
        per_page: per_page,
      },
    });

    // Manually calculate total pages if not provided
    const totalHadiths = response.data.pagination?.total || 711; // Use the known total if API doesn't provide
    const perPage = 20;
    const totalPages = Math.ceil(totalHadiths / perPage);

    return {
      ...response.data,
      pagination: {
        ...response.data.pagination,
        current_page: page,
        total_pages: totalPages,
        total: totalHadiths,
      },
    };
  } catch (error) {
    throw formatApiError(error);
  }
};

/**
 * Searches for hadiths across all categories
 * @param {string} query - Search query
 * @param {string} lang - Language code (default: 'ar')
 * @returns {Promise<Object>} Search results
 */
// Update the searchHadiths function
export const searchHadiths = async (query) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/search`, {
      params: { query },
      timeout: 10000, // 10 second timeout
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    return response.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("Search request timed out. Please try again.");
    }
    throw error;
  }
};

export const fetchHadithBooksGading = async () => {
  try {
    const response = await axios.get(`${HADITH_API_BASE_URL}/books`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching hadith books from Gading API:", error);
    throw error;
  }
};

export const fetchHadithsByBookGading = async (
  bookName,
  startRange = 1,
  endRange = 50
) => {
  try {
    const response = await axios.get(
      `${HADITH_API_BASE_URL}/books/${bookName}`,
      {
        params: {
          range: `${startRange}-${endRange}`,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error(
      `Error fetching hadiths for book ${bookName} from Gading API:`,
      error
    );
    throw error;
  }
};

export const fetchHadithBooksNew = async () => {
  try {
    const response = await axios.get(`${HADITH_API_BASE_URL_NEW}/books`, {
      params: { apiKey: HADITH_API_KEY },
    });
    return response.data.books;
  } catch (error) {
    console.error("Error fetching hadith books:", error);
    throw error;
  }
};

export const fetchBookChaptersNew = async (bookId) => {
  try {
    const response = await axios.get(
      `${HADITH_API_BASE_URL_NEW}/books/${bookId}/chapters`,
      {
        params: { apiKey: HADITH_API_KEY },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching chapters for book ${bookId}:`, error);
    throw error;
  }
};

export const fetchChapterHadithsNew = async (chapterId) => {
  try {
    const response = await axios.get(
      `${HADITH_API_BASE_URL_NEW}/chapters/${chapterId}/hadiths`,
      {
        params: { apiKey: HADITH_API_KEY },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching hadiths for chapter ${chapterId}:`, error);
    throw error;
  }
};

export const fetchBookChapters = async (bookSlug) => {
  try {
    const response = await axios.get(
      `https://hadithapi.com/api/${bookSlug}/chapters`,
      {
        params: { apiKey: HADITH_API_KEY },
      }
    );
    return response.data.chapters;
  } catch (error) {
    console.error(`Error fetching chapters for book ${bookSlug}:`, error);
    throw error;
  }
};

export const fetchChapterHadiths = async (bookSlug, chapterId) => {
  try {
    const response = await axios.get(
      `https://hadithapi.com/api/${bookSlug}/hadiths`,
      {
        params: {
          apiKey: HADITH_API_KEY,
        },
      }
    );
    console.log(response);
    return response.data.hadiths.data;
  } catch (error) {
    console.error(
      `Error fetching hadiths for chapter ${chapterId} in book ${bookSlug}:`,
      error
    );
    throw error;
  }
};

export const fetchHadithsByChapter = async (
  bookSlug,
  chapterId,
  page = 1,
  limit = 20
) => {
  try {
    const response = await axios.get(
      "https://hadithapi.com/public/api/hadiths",
      {
        params: {
          apiKey: HADITH_API_KEY,
        },
      }
    );
    console.log(response);
    return {
      hadiths: response.data.hadiths,
      total: response.data.total,
      currentPage: response.data.currentPage,
      totalPages: response.data.totalPages,
    };
  } catch (error) {
    console.error(
      `Error fetching hadiths for book ${bookSlug} and chapter ${chapterId}:`,
      error
    );
    throw error;
  }
};
export const fetchCategories = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/categories`);
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch categories");
  }
};

export const fetchSubCategories = async (categoryId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/categories/${categoryId}/subcategories`
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch subcategories");
  }
};

/**
 * Enhanced Islamic Library Search (unified local + API)
 * @param {Object} params - Search parameters (q, book, category, narrator, status, chapter, sort, order, paginate, page, includeLocal, includeAPI)
 * @returns {Promise<Object>} Search results
 */
export const searchIslamicLibrary = async (params) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/islamic-library/search`, {
      params,
      timeout: 15000,
      headers: { "Cache-Control": "no-cache" },
    });
    return response.data;
  } catch (error) {
    throw formatApiError(error);
  }
};

/**
 * Get search suggestions for Islamic Library
 * @param {Object} params - Suggestion parameters (q, type)
 * @returns {Promise<Object>} Suggestions
 */
export const getIslamicLibrarySuggestions = async (params) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/islamic-library/suggestions`, {
      params,
      timeout: 8000,
      headers: { "Cache-Control": "no-cache" },
    });
    return response.data;
  } catch (error) {
    throw formatApiError(error);
  }
};

/**
 * Get search statistics for Islamic Library
 * @returns {Promise<Object>} Stats
 */
export const getIslamicLibrarySearchStats = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/islamic-library/search-stats`, {
      timeout: 8000,
      headers: { "Cache-Control": "no-cache" },
    });
    return response.data;
  } catch (error) {
    throw formatApiError(error);
  }
};
