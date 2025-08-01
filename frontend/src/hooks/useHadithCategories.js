// src/hooks/useHadithCategories.js
import { useState, useEffect } from "react";
import { fetchHadithBooks } from "../services/api";

export const useHadithCategories = (language = "ar") => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const fetchedCategories = await fetchHadithBooks(language);

        // Handle cases where the API returns 200 OK but with no valid data
        if (
          !fetchedCategories ||
          (typeof fetchedCategories === "object" &&
            Object.keys(fetchedCategories).length === 0) ||
          (Array.isArray(fetchedCategories) && fetchedCategories.length === 0)
        ) {
          setError(
            "عذراً، لم يتم العثور على أي تصنيفات للأحاديث. يرجى المحاولة لاحقاً"
          );
          setCategories([]);
          return;
        }

        // Validate the structure of the response
        if (!Array.isArray(fetchedCategories)) {
          console.error("Invalid response format:", fetchedCategories);
          setError("عذراً، حدث خطأ في تنسيق البيانات. يرجى المحاولة لاحقاً");
          setCategories([]);
          return;
        }

        // Ensure categories have the expected structure
        const processedCategories = fetchedCategories.map((cat, index) => ({
          id: cat.id || index + 1, // Fallback to index if no ID
          title: cat.title || `Book ${index + 1}`,
          ...cat,
        }));

        setCategories(processedCategories);
      } catch (err) {
        console.error("Error fetching hadith categories:", err);
        // Handle different types of errors
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (err.response.status === 404) {
            setError("لم يتم العثور على تصنيفات الأحاديث");
          } else if (err.response.status === 503) {
            setError("خدمة الأحاديث غير متوفرة حالياً. يرجى المحاولة لاحقاً");
          } else {
            setError("حدث خطأ في تحميل تصنيفات الأحاديث");
          }
        } else if (err.request) {
          // The request was made but no response was received
          setError(
            "لا يمكن الاتصال بخدمة الأحاديث. يرجى التحقق من اتصالك بالإنترنت"
          );
        } else {
          // Something happened in setting up the request that triggered an Error
          setError(err.message || "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى");
        }
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [language]);

  return {
    categories,
    loading,
    error: error, // Ensure we always return a meaningful error message
  };
};
