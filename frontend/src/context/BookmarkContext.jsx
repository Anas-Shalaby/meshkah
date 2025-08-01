// src/context/BookmarkContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";
import moment from "moment-hijri";

// Create a custom axios instance with base configuration
const bookmarkApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}`, // Your backend base URL
  headers: {
    "Content-Type": "application/json",
  },
});

const BookmarkContext = createContext();

export const BookmarkProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [readingHistory, setReadingHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const token = localStorage.getItem("token");

  // Intercept requests to add token
  bookmarkApi.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers["x-auth-token"] = token;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  const fetchBookmarks = async () => {
    if (!isAuthenticated || !token) {
      setBookmarks([]);
      return [];
    }

    try {
      setLoading(true);
      const response = await bookmarkApi.get("/bookmarks");
      setBookmarks(response.data);
      setLoading(false);

      return response.data;
    } catch (error) {
      setLoading(false);

      console.error("Error fetching bookmarks", error);
      toast.error("حدث خطأ أثناء جلب الإشارات المرجعية");
      return [];
    }
  };

  const addBookmark = async (
    hadithId,
    collection = "Default",
    notes = "",
    hadithBook = ""
  ) => {
    if (!isAuthenticated) {
      toast.error("يرجى تسجيل الدخول أولاً");
      return null;
    }
    try {
      const response = await bookmarkApi.post("/bookmarks/add", {
        hadith_id: hadithId,
        collection,
        notes,
        hadith_book: hadithBook,
      });

      // Optimistically update the bookmarks
      const newBookmark = {
        id: response.data.bookmarkId,
        user_id: user.id,
        hadith_id: hadithId,
        collection,
        notes,
        hadith_book: hadithBook,
      };

      setBookmarks((prevBookmarks) => [...prevBookmarks, newBookmark]);

      toast.success("تمت إضافة الإشارة المرجعية بنجاح");
      return newBookmark;
    } catch (error) {
      console.error(
        "Error adding bookmark",
        error.response ? error.response.data : error.message
      );

      // Check for specific error messages
      if (error.response?.data?.message === "Hadith already bookmarked") {
        toast.error("هذا الحديث مضاف بالفعل إلى الإشارات المرجعية");
      } else {
        toast.error("حدث خطأ أثناء إضافة الإشارة المرجعية");
      }

      return null;
    }
  };

  const removeBookmark = async (hadithId) => {
    if (!isAuthenticated) {
      toast.error("يرجى تسجيل الدخول أولاً");
      return false;
    }

    try {
      await bookmarkApi.delete(`/bookmarks/remove/${hadithId}`);

      // Optimistically remove the bookmark
      setBookmarks((prevBookmarks) =>
        prevBookmarks.filter((bookmark) => bookmark.hadith_id !== hadithId)
      );

      toast.success("تمت إزالة الإشارة المرجعية بنجاح");
      return true;
    } catch (error) {
      console.error("Error removing bookmark", error);
      toast.error("حدث خطأ أثناء إزالة الإشارة المرجعية");
      return false;
    }
  };

  // Automatically fetch bookmarks when user logs in
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchBookmarks();
    } else {
      setBookmarks([]);
    }
  }, [isAuthenticated, token]);

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        addBookmark,
        removeBookmark,
        fetchBookmarks,
        loading,
        readingHistory,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error("useBookmarks must be used within a BookmarkProvider");
  }
  return context;
};
