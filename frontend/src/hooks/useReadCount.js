import { useState, useEffect, useCallback } from "react";

export const useReadCount = () => {
  const [readCount, setReadCount] = useState(0);
  const [minReads, setMinReads] = useState(3);
  const [needsMoreReads, setNeedsMoreReads] = useState(true);
  const [remainingReads, setRemainingReads] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // جلب عدد القراءات
  const fetchReadCount = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setReadCount(0);
        setNeedsMoreReads(true);
        setRemainingReads(3);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/recommendations/read-count`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في جلب عدد القراءات");
      }

      const data = await response.json();

      if (data.success) {
        setReadCount(data.readCount);
        setMinReads(data.minReads);
        setNeedsMoreReads(data.needsMoreReads);
        setRemainingReads(data.remainingReads);
      }
    } catch (error) {
      console.error("Error fetching read count:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // تحديث عدد القراءات
  const updateReadCount = useCallback(() => {
    fetchReadCount();
  }, [fetchReadCount]);

  // جلب عدد القراءات عند تحميل الـ hook
  useEffect(() => {
    fetchReadCount();
  }, [fetchReadCount]);

  return {
    readCount,
    minReads,
    needsMoreReads,
    remainingReads,
    isLoading,
    error,
    fetchReadCount,
    updateReadCount,
  };
};
