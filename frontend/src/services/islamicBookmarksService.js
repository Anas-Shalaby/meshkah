import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Get auth token
const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Add Islamic bookmark
export const addIslamicBookmark = async (bookmarkData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.post(
      `${API_URL}/islamic-bookmarks/add`,
      bookmarkData,
      {
        headers: {
          "x-auth-token": token,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding Islamic bookmark:", error);
    throw error;
  }
};

// Remove Islamic bookmark
export const removeIslamicBookmark = async (bookmarkId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.delete(
      `${API_URL}/islamic-bookmarks/remove/${bookmarkId}`,
      {
        headers: {
          "x-auth-token": token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error removing Islamic bookmark:", error);
    throw error;
  }
};

// Get user's Islamic bookmarks
export const getUserIslamicBookmarks = async (params = {}) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const queryParams = new URLSearchParams(params);
    const response = await axios.get(
      `${API_URL}/islamic-bookmarks/user?${queryParams}`,
      {
        headers: {
          "x-auth-token": token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching Islamic bookmarks:", error);
    throw error;
  }
};

// Get user's collections
export const getUserCollections = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.get(
      `${API_URL}/islamic-bookmarks/collections`,
      {
        headers: {
          "x-auth-token": token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching collections:", error);
    throw error;
  }
};

// Update bookmark
export const updateIslamicBookmark = async (bookmarkId, updateData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.put(
      `${API_URL}/islamic-bookmarks/update/${bookmarkId}`,
      updateData,
      {
        headers: {
          "x-auth-token": token,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating Islamic bookmark:", error);
    throw error;
  }
};

// Check if item is bookmarked
export const checkIslamicBookmark = async (params) => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { isBookmarked: false, bookmark: null };
    }

    const queryParams = new URLSearchParams(params);
    const response = await axios.get(
      `${API_URL}/islamic-bookmarks/check?${queryParams}`,
      {
        headers: {
          "x-auth-token": token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error checking Islamic bookmark:", error);
    return { isBookmarked: false, bookmark: null };
  }
};

// Helper function to create bookmark data for books
export const createBookBookmarkData = (book) => {
  return {
    type: "book",
    bookSlug: book.bookSlug,
    bookName: book.bookName,
    bookNameEn: book.bookNameEn,
    bookNameUr: book.bookNameUr,
    collection: "Default",
    notes: "",
    isLocal: book.isLocal || false,
  };
};

// Helper function to create bookmark data for chapters
export const createChapterBookmarkData = (book, chapter, language) => {
  return {
    type: "chapter",
    bookSlug: book.bookSlug,
    bookName: book.bookName,
    bookNameEn: book.bookNameEn,
    bookNameUr: book.bookNameUr,
    chapterNumber: chapter.chapterNumber,
    chapterName:
      language === "ar"
        ? chapter.chapterArabic
        : language === "en"
        ? chapter.chapterEnglish
        : chapter.chapterUrdu,
    chapterNameEn: chapter.chapterEnglish,
    chapterNameUr: chapter.chapterUrdu,
    collection: "Default",
    notes: "",
    isLocal: book.isLocal || false,
  };
};

// Helper function to create bookmark data for hadiths
export const createHadithBookmarkData = (book, hadith, language) => {
  return {
    type: "hadith",
    bookSlug: book.bookSlug,
    bookName: book.bookName,
    bookNameEn: book.bookNameEn,
    bookNameUr: book.bookNameUr,
    hadithId: hadith.id || hadith.hadithId || hadith.hadithNumber,
    hadithNumber: hadith.hadithNumber || hadith.id || hadith.hadithId,
    hadithText:
      language === "ar"
        ? hadith.hadithArabic || hadith.arabic
        : language === "en"
        ? hadith.hadithEnglish || hadith.english?.text
        : hadith.hadithUrdu || hadith.english?.text,
    hadithTextEn: hadith.hadithEnglish || hadith.english?.text,
    hadithTextUr: hadith.hadithUrdu || hadith.english?.text,
    collection: "Default",
    notes: "",
    isLocal: book.isLocal || false,
  };
};
