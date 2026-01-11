/**
 * خدمة ختمات الكتب - Book Journeys Service
 * استدعاءات API للختمات ومشاركة التقدم مع الأصدقاء
 */

import axiosInstance from "../utils/axios";

const API_BASE = "/book-journeys";

// =====================================================
// APIs الأساسية
// =====================================================

/**
 * جلب قائمة الكتب المتاحة للختم
 */
export const getAvailableBooks = async () => {
  const response = await axiosInstance.get(`${API_BASE}/books`);
  return response.data;
};

/**
 * جلب ختماتي (نشطة + مكتملة)
 */
export const getMyJourneys = async () => {
  const response = await axiosInstance.get(`${API_BASE}/my-journeys`);
  return response.data;
};

/**
 * بدء ختمة جديدة
 * @param {string} bookSlug - معرف الكتاب
 * @param {number} pace - عدد الأحاديث يومياً
 * @param {string} pledge - التعهد (اختياري)
 */
export const startJourney = async (bookSlug, pace = 1, pledge = null) => {
  const response = await axiosInstance.post(`${API_BASE}/start`, {
    book_slug: bookSlug,
    pace,
    pledge,
  });
  return response.data;
};

/**
 * تحديث التعهد
 * @param {number} journeyId - معرف الختمة
 * @param {string} pledge - التعهد
 * @param {boolean} pledgeShared - هل التعهد مشارك
 */
export const updatePledge = async (journeyId, pledge, pledgeShared = false) => {
  const response = await axiosInstance.put(`${API_BASE}/${journeyId}/pledge`, {
    pledge,
    pledge_shared: pledgeShared,
  });
  return response.data;
};

// =====================================================
// APIs نظام الرفقة (Buddy System)
// =====================================================

/**
 * جلب معلومات الرفيق
 * @param {number} journeyId - معرف الختمة
 */
export const getBuddyInfo = async (journeyId) => {
  const response = await axiosInstance.get(`${API_BASE}/${journeyId}/buddy`);
  return response.data;
};

/**
 * طلب رفيق جديد
 * @param {number} journeyId - معرف الختمة
 * @param {number} targetUserId - معرف المستخدم المستهدف
 */
export const requestBuddy = async (journeyId, targetUserId) => {
  const response = await axiosInstance.post(
    `${API_BASE}/${journeyId}/buddy/request`,
    { target_user_id: targetUserId }
  );
  return response.data;
};

/**
 * قبول طلب الرفقة
 * @param {number} journeyId - معرف الختمة
 * @param {number} buddyRequestId - معرف طلب الرفقة
 */
export const acceptBuddyRequest = async (journeyId, buddyRequestId) => {
  const response = await axiosInstance.put(
    `${API_BASE}/${journeyId}/buddy/accept/${buddyRequestId}`
  );
  return response.data;
};

/**
 * رفض طلب الرفقة
 * @param {number} journeyId - معرف الختمة
 * @param {number} buddyRequestId - معرف طلب الرفقة
 */
export const declineBuddyRequest = async (journeyId, buddyRequestId) => {
  const response = await axiosInstance.put(
    `${API_BASE}/${journeyId}/buddy/decline/${buddyRequestId}`
  );
  return response.data;
};

/**
 * إرسال تشجيع للرفيق
 * @param {number} journeyId - معرف الختمة
 * @param {string} message - رسالة التشجيع
 */
export const sendBuddyEncouragement = async (journeyId, message) => {
  const response = await axiosInstance.post(
    `${API_BASE}/${journeyId}/buddy/encourage`,
    { message }
  );
  return response.data;
};

// =====================================================
// APIs التقويم
// =====================================================

/**
 * جلب بيانات التقويم الشهري
 * @param {number} journeyId - معرف الختمة
 * @param {number} month - الشهر (اختياري)
 * @param {number} year - السنة (اختياري)
 */
export const getProgressCalendar = async (journeyId, month = null, year = null) => {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (year) params.append('year', year);
  
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await axiosInstance.get(`${API_BASE}/${journeyId}/calendar${query}`);
  return response.data;
};

/**
 * جلب تفاصيل ختمة
 * @param {number} journeyId - معرف الختمة
 */
export const getJourneyDetails = async (journeyId) => {
  const response = await axiosInstance.get(`${API_BASE}/${journeyId}`);
  return response.data;
};

/**
 * جلب أحاديث اليوم
 * @param {number} journeyId - معرف الختمة
 */
export const getTodayHadiths = async (journeyId) => {
  const response = await axiosInstance.get(`${API_BASE}/${journeyId}/today`);
  return response.data;
};

/**
 * تأشير حديث كمقروء
 * @param {number} journeyId - معرف الختمة
 * @param {number} hadithId - معرف الحديث
 * @param {string} notes - ملاحظات (اختياري)
 */
export const markHadithAsRead = async (journeyId, hadithId, notes = null) => {
  const response = await axiosInstance.post(
    `${API_BASE}/${journeyId}/read/${hadithId}`,
    { notes }
  );
  return response.data;
};

/**
 * جلب التقدم والإحصائيات
 * @param {number} journeyId - معرف الختمة
 */
export const getJourneyProgress = async (journeyId) => {
  const response = await axiosInstance.get(`${API_BASE}/${journeyId}/progress`);
  return response.data;
};

/**
 * إيقاف مؤقت للختمة
 * @param {number} journeyId - معرف الختمة
 */
export const pauseJourney = async (journeyId) => {
  const response = await axiosInstance.put(`${API_BASE}/${journeyId}/pause`);
  return response.data;
};

/**
 * استئناف الختمة
 * @param {number} journeyId - معرف الختمة
 */
export const resumeJourney = async (journeyId) => {
  const response = await axiosInstance.put(`${API_BASE}/${journeyId}/resume`);
  return response.data;
};

/**
 * تغيير سرعة القراءة
 * @param {number} journeyId - معرف الختمة
 * @param {number} pace - السرعة الجديدة
 */
export const updatePace = async (journeyId, pace) => {
  const response = await axiosInstance.put(`${API_BASE}/${journeyId}/pace`, {
    pace,
  });
  return response.data;
};

/**
 * تحديث إعدادات الختمة (pace, pledge, وغيرها)
 * @param {number} journeyId - معرف الختمة
 * @param {object} settings - الإعدادات { pace?: number, pledge?: string, pledge_shared?: boolean }
 */
export const updateJourneySettings = async (journeyId, settings) => {
  const response = await axiosInstance.put(
    `${API_BASE}/${journeyId}/settings`,
    settings
  );
  return response.data;
};

/**
 * إعادة ضبط الختمة (حذف التقدم والبدء من جديد)
 * @param {number} journeyId - معرف الختمة
 */
export const resetJourneyProgress = async (journeyId) => {
  const response = await axiosInstance.post(`${API_BASE}/${journeyId}/reset`, {
    confirm: true,
  });
  return response.data;
};


// =====================================================
// APIs مشاركة التقدم مع الأصدقاء
// =====================================================

/**
 * جلب رابط دعوة للختمة
 * @param {number} journeyId - معرف الختمة
 */
export const getShareLink = async (journeyId) => {
  const response = await axiosInstance.get(
    `${API_BASE}/${journeyId}/share-link`
  );
  return response.data;
};

/**
 * الانضمام عبر رابط الدعوة
 * @param {string} shareCode - كود المشاركة
 */
export const joinViaShareCode = async (shareCode) => {
  const response = await axiosInstance.post(`${API_BASE}/join/${shareCode}`);
  return response.data;
};

/**
 * جلب قائمة الأصدقاء في الختمة مع تقدمهم
 * @param {number} journeyId - معرف الختمة
 */
export const getJourneyFriends = async (journeyId) => {
  const response = await axiosInstance.get(`${API_BASE}/${journeyId}/friends`);
  return response.data;
};

/**
 * جلب نشاط الأصدقاء
 */
export const getFriendsActivity = async () => {
  const response = await axiosInstance.get(`${API_BASE}/friends-activity`);
  return response.data;
};

/**
 * إلغاء متابعة صديق
 * @param {number} journeyId - معرف الختمة
 * @param {number} friendJourneyId - معرف ختمة الصديق
 */
export const unfollowFriend = async (journeyId, friendJourneyId) => {
  const response = await axiosInstance.delete(
    `${API_BASE}/${journeyId}/unfollow/${friendJourneyId}`
  );
  return response.data;
};

// =====================================================
// APIs الشهادات
// =====================================================

/**
 * التحقق من أهلية الشهادة
 * @param {number} journeyId - معرف الختمة
 */
export const checkCertificateEligibility = async (journeyId) => {
  const response = await axiosInstance.get(
    `${API_BASE}/${journeyId}/certificate/check`
  );
  return response.data;
};

/**
 * إنشاء الشهادة
 * @param {number} journeyId - معرف الختمة
 */
export const generateCertificate = async (journeyId) => {
  const response = await axiosInstance.post(
    `${API_BASE}/${journeyId}/certificate`
  );
  return response.data;
};

/**
 * جلب شهادة المستخدم
 * @param {number} journeyId - معرف الختمة
 */
export const getCertificate = async (journeyId) => {
  const response = await axiosInstance.get(
    `${API_BASE}/${journeyId}/certificate`
  );
  return response.data;
};

/**
 * تحميل شهادة المستخدم
 * @param {number} journeyId - معرف الختمة
 */
export const downloadCertificate = async (journeyId) => {
  const response = await axiosInstance.get(
    `${API_BASE}/${journeyId}/certificate/download`,
    {
      responseType: "blob", // مهم لتحميل الملفات
    }
  );

  // إنشاء رابط تحميل تلقائي
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `شهادة_ختم_${Date.now()}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  return { success: true };
};

/**
 * التحقق من صحة الشهادة (عام)
 * @param {string} code - كود التحقق
 */
export const verifyCertificate = async (code) => {
  const response = await axiosInstance.get(
    `${API_BASE}/verify-certificate/${code}`
  );
  return response.data;
};

export default {
  getAvailableBooks,
  getMyJourneys,
  startJourney,
  getJourneyDetails,
  getTodayHadiths,
  markHadithAsRead,
  getJourneyProgress,
  pauseJourney,
  resumeJourney,
  updatePace,
  // التعهد
  updatePledge,
  // الرفقة
  getBuddyInfo,
  requestBuddy,
  acceptBuddyRequest,
  declineBuddyRequest,
  sendBuddyEncouragement,
  // التقويم
  getProgressCalendar,
  // الأصدقاء
  getShareLink,
  joinViaShareCode,
  getJourneyFriends,
  getFriendsActivity,
  unfollowFriend,
  // الشهادات
  checkCertificateEligibility,
  generateCertificate,
  getCertificate,
  downloadCertificate,
  verifyCertificate,
  // إعدادات الختمة
  updateJourneySettings,
  resetJourneyProgress,
};


