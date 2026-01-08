/**
 * Review Service
 * خدمات نظام المراجعة الذكية
 */

import axiosInstance from "../utils/axios";

const API_URL = '/reviews';

/**
 * جلب البطاقات المستحقة للمراجعة اليوم
 */
export const getDueReviews = async (limit = 50) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/due`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting due reviews:', error);
    throw error;
  }
};

/**
 * تسجيل مراجعة بطاقة
 * @param {number} cardId - معرف البطاقة
 * @param {number} quality - جودة الإجابة (0-5)
 * @param {number} timeTaken - الوقت المستغرق بالثواني
 */
export const submitReview = async (cardId, quality, timeTaken = null) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/${cardId}/submit`, {
      quality,
      timeTaken
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};

/**
 * جلب إحصائيات المراجعة
 */
export const getReviewStats = async () => {
  try {
    const response = await axiosInstance.get(`${API_URL}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error getting review stats:', error);
    throw error;
  }
};

/**
 * جلب إعدادات المراجعة
 */
export const getReviewSettings = async () => {
  try {
    const response = await axiosInstance.get(`${API_URL}/settings`);
    return response.data;
  } catch (error) {
    console.error('Error getting review settings:', error);
    throw error;
  }
};

/**
 * تحديث إعدادات المراجعة
 */
export const updateReviewSettings = async (settings) => {
  try {
    const response = await axiosInstance.put(`${API_URL}/settings`, settings);
    return response.data;
  } catch (error) {
    console.error('Error updating review settings:', error);
    throw error;
  }
};

/**
 * جلب سجل المراجعات
 * @param {number} days - عدد الأيام (افتراضي: 30)
 */
export const getReviewHistory = async (days = 30) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/history`, {
      params: { days }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting review history:', error);
    throw error;
  }
};

export default {
  getDueReviews,
  submitReview,
  getReviewStats,
  getReviewSettings,
  updateReviewSettings,
  getReviewHistory
};
