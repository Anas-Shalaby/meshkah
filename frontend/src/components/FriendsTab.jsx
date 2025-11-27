import { useState, useEffect } from "react";
import {
  UserPlus,
  UserCheck,
  UserX,
  Trash2,
  Users,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Clipboard,
  Zap,
  Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import ActivityTimeline from "./ActivityTimeline";

const FriendsTab = ({ campId }) => {
  const { user: currentUser } = useAuth();

  // دالة لاسترجاع البيانات من localStorage
  const getStoredData = () => {
    try {
      const stored = localStorage.getItem(`camp-${campId}-friendsData`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error("Error parsing stored friends data:", err);
    }
    return null;
  };

  // دالة لحفظ البيانات في localStorage
  const saveDataToStorage = (data) => {
    try {
      localStorage.setItem(`camp-${campId}-friendsData`, JSON.stringify(data));
    } catch (err) {
      console.error("Error saving friends data to storage:", err);
    }
  };

  // استرجاع البيانات المحفوظة
  const storedData = getStoredData();

  // استرجاع التبويب الفرعي من localStorage إذا كان موجوداً
  const [activeSubTab, setActiveSubTab] = useState(() => {
    const savedSubTab = localStorage.getItem(`camp-${campId}-friendsSubTab`);
    return savedSubTab || "friends_activity";
  }); // 'friends_activity', 'manage_friends', 'camp_activity'
  const [friendsList, setFriendsList] = useState(storedData?.friendsList || []);
  const [pendingRequests, setPendingRequests] = useState(
    storedData?.pendingRequests || { sent: [], received: [] }
  );
  const [myFriendCode, setMyFriendCode] = useState(
    storedData?.myFriendCode || ""
  );
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [activityFeed, setActivityFeed] = useState(
    storedData?.activityFeed || []
  );
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(
    storedData?.activityPage || 1
  );
  const [activityPagination, setActivityPagination] = useState(
    storedData?.activityPagination || null
  );
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [loading, setLoading] = useState(!storedData); // لا نحتاج loading إذا كان هناك بيانات محفوظة
  const [error, setError] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  // دالة لجلب البيانات
  const fetchData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true); // شغّل الـ Spinner فقط في التحميل الأولي
      }
      setError(null);

      const [friendsResponse, requestsResponse, codeResponse] =
        await Promise.all([
          axiosInstance.get("/friends", { params: { campId } }),
          axiosInstance.get("/friends/requests/pending", {
            params: { campId },
          }),
          axiosInstance.get(`/quran-camps/${campId}/my-friend-code`),
        ]);

      const newFriendsList = friendsResponse.data.success
        ? friendsResponse.data.data.friends || []
        : friendsList;

      const newPendingRequests = requestsResponse.data.success
        ? {
            sent: requestsResponse.data.data.sent || [],
            received: requestsResponse.data.data.received || [],
          }
        : pendingRequests;

      const newMyFriendCode = codeResponse.data.success
        ? codeResponse.data.data.friend_code || ""
        : myFriendCode;

      // تحديث الحالة
      setFriendsList(newFriendsList);
      setPendingRequests(newPendingRequests);
      setMyFriendCode(newMyFriendCode);

      // حفظ البيانات في localStorage
      saveDataToStorage({
        friendsList: newFriendsList,
        pendingRequests: newPendingRequests,
        myFriendCode: newMyFriendCode,
        activityFeed,
        activityPage,
        activityPagination,
      });
    } catch (err) {
      console.error("Error fetching friends data:", err);
      setError(err.response?.data?.message || "حدث خطأ في جلب البيانات");
      if (isInitialLoad) {
        toast.error("حدث خطأ في جلب البيانات");
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false); // أوقف الـ Spinner فقط في التحميل الأولي
      }
    }
  };

  // حفظ التبويب الفرعي في localStorage عند تغييره
  useEffect(() => {
    localStorage.setItem(`camp-${campId}-friendsSubTab`, activeSubTab);
  }, [activeSubTab, campId]);

  // جلب البيانات عند تحميل المكون
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchData(true); // تحميل البيانات الأساسية
      await fetchActivityFeed(1, true); // تحميل أول صفحة من النشاط
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campId]);

  // دالة لجلب النشاط فقط (للتحديث بعد الإجراءات)
  const fetchActivityFeed = async (page = 1, isInitialLoad = false) => {
    if (isFetchingMore && !isInitialLoad) return; // منع الطلبات المتعددة

    setIsFetchingMore(true);
    if (isInitialLoad) {
      setActivityLoading(true);
    }

    try {
      const response = await axiosInstance.get("/friends/activity-feed", {
        params: { limit: 5, page: page, campId },
      });

      if (response.data.success) {
        const { activities, pagination } = response.data.data;

        let newActivityFeed;
        if (isInitialLoad) {
          newActivityFeed = activities; // استبدال
          setActivityFeed(newActivityFeed);
        } else {
          newActivityFeed = [...activityFeed, ...activities]; // إضافة
          setActivityFeed(newActivityFeed);
        }

        setActivityPagination(pagination);
        setActivityPage(page);

        // حفظ البيانات المحدثة في localStorage
        saveDataToStorage({
          friendsList,
          pendingRequests,
          myFriendCode,
          activityFeed: newActivityFeed,
          activityPage: page,
          activityPagination: pagination,
        });
      }
    } catch (err) {
      console.error("Error fetching activity feed:", err);
      if (isInitialLoad) {
        toast.error("حدث خطأ في جلب النشاط");
      }
    } finally {
      setIsFetchingMore(false);
      if (isInitialLoad) {
        setActivityLoading(false);
      }
    }
  };

  // إرسال طلب صداقة باستخدام كود الصحبة
  const handleSendRequestByCode = async (e) => {
    e.preventDefault();

    if (friendCodeInput.trim() === "") {
      toast.error("يرجى إدخال كود الصحبة");
      return;
    }

    try {
      setSendingRequest(true);
      const response = await axiosInstance.post("/friends/request", {
        friendCode: friendCodeInput.trim(),
        campId: campId,
      });

      if (response.data.success) {
        toast.success(response.data.message || "تم إرسال طلب الصداقة بنجاح");
        setFriendCodeInput(""); // تفريغ الحقل
        fetchData(); // تحديث قائمة الطلبات المرسلة
        fetchActivityFeed(1, true); // إعادة جلب أول صفحة من النشاط
      }
    } catch (err) {
      console.error("Error sending friend request:", err);
      const errorMessage =
        err.response?.data?.message || "فشل إرسال الطلب، تأكد من الكود";
      toast.error(errorMessage);
    } finally {
      setSendingRequest(false);
    }
  };

  // نسخ كود الصحبة
  const handleCopyFriendCode = async () => {
    if (!myFriendCode) {
      toast.error("لا يوجد كود صحبة للنسخ");
      return;
    }

    try {
      await navigator.clipboard.writeText(myFriendCode);
      toast.success("تم نسخ كود الصحبة!");
    } catch (err) {
      // Fallback للأنظمة القديمة
      const textArea = document.createElement("textarea");
      textArea.value = myFriendCode;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success("تم نسخ كود الصحبة!");
      } catch (fallbackErr) {
        toast.error("فشل نسخ كود الصحبة");
      }
      document.body.removeChild(textArea);
    }
  };

  // الرد على طلب صداقة (قبول أو رفض)
  const handleRespondToRequest = async (requestId, action) => {
    try {
      const response = await axiosInstance.put(
        `/friends/request/${requestId}`,
        {
          action,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchData(); // إعادة جلب البيانات
        fetchActivityFeed(1, true); // إعادة جلب أول صفحة من النشاط
      }
    } catch (err) {
      console.error("Error responding to friend request:", err);
      const errorMessage =
        err.response?.data?.message || "حدث خطأ في معالجة طلب الصداقة";
      toast.error(errorMessage);
    }
  };

  // إزالة صديق
  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm("هل أنت متأكد من إزالة هذا الصديق من هذا المخيم؟")) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/friends/${friendId}`, {
        params: { campId },
      });

      if (response.data.success) {
        toast.success(response.data.message || "تم إزالة الصديق بنجاح");
        fetchData(); // إعادة جلب البيانات
        fetchActivityFeed(1, true); // إعادة جلب أول صفحة من النشاط
      }
    } catch (err) {
      console.error("Error removing friend:", err);
      const errorMessage =
        err.response?.data?.message || "حدث خطأ في إزالة الصديق";
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7440E9]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchData(true)}
            className="px-6 py-2 bg-[#7440E9] text-white rounded-lg hover:bg-[#5a2fc7] transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* التبويبات الفرعية */}
        <div className="flex w-full justify-center mb-4 sm:mb-8">
          <div
            className="flex justify-center items-center gap-1 sm:gap-2 p-1 sm:p-1.5 bg-purple-100 rounded-full overflow-x-auto scrollbar-hide w-full sm:w-auto"
            dir="rtl"
          >
            {/* التبويب 1: نشاط صحبتي */}
            <button
              onClick={() => setActiveSubTab("friends_activity")}
              className={`relative px-2 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm md:text-base font-semibold transition-colors whitespace-nowrap flex-shrink-0 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 ${
                activeSubTab === "friends_activity"
                  ? "text-purple-700"
                  : "text-gray-600 hover:text-purple-600"
              }`}
            >
              {activeSubTab === "friends_activity" && (
                <motion.div
                  layoutId="subTabPill"
                  className="absolute inset-0 bg-white border border-purple-200 rounded-full shadow-md"
                  style={{ zIndex: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1 sm:gap-2">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">نشاط الصحبة</span>
                <span className="sm:hidden">النشاط</span>
              </span>
            </button>

            {/* التبويب 2: إدارة الأصدقاء */}
            <button
              onClick={() => setActiveSubTab("manage_friends")}
              className={`relative px-2 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm md:text-base font-semibold transition-colors whitespace-nowrap flex-shrink-0 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 ${
                activeSubTab === "manage_friends"
                  ? "text-purple-700"
                  : "text-gray-600 hover:text-purple-600"
              }`}
            >
              {activeSubTab === "manage_friends" && (
                <motion.div
                  layoutId="subTabPill"
                  className="absolute inset-0 bg-white rounded-full shadow-md"
                  style={{ zIndex: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1 sm:gap-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">إدارة الأصدقاء</span>
                <span className="sm:hidden">الأصدقاء</span>
              </span>
            </button>
          </div>
        </div>

        {/* محتوى التبويبات */}
        <AnimatePresence mode="wait">
          {/* التبويب 1: نشاط صحبتي */}
          {activeSubTab === "friends_activity" && (
            <motion.div
              key="friends_activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3 sm:space-y-4"
            >
              {activityLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7440E9]"></div>
                </div>
              )}

              {!activityLoading && friendsList.length === 0 && (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 text-sm sm:text-base mb-4">
                    لم تقم بإضافة أي أصدقاء بعد.
                  </p>
                  <button
                    onClick={() => setActiveSubTab("manage_friends")}
                    className="text-[#7440E9] font-semibold hover:text-[#5a2fc7] transition-colors"
                  >
                    اذهب لإدارة الأصدقاء →
                  </button>
                </div>
              )}

              {!activityLoading &&
                friendsList.length > 0 &&
                activityFeed.length === 0 && (
                  <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200">
                    <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 text-sm sm:text-base">
                      لا يوجد نشاط جديد من صحبتك حتى الآن.
                    </p>
                  </div>
                )}

              {!activityLoading && activityFeed.length > 0 && (
                <div className="mt-6">
                  <ActivityTimeline
                    activities={activityFeed}
                    currentUser={currentUser}
                    onPledgeSuccess={() => {
                      // إعادة جلب النشاط بعد الالتزام
                      fetchActivityFeed(activityPage, false);
                    }}
                  />
                </div>
              )}

              {/* زر تحميل المزيد */}
              {!activityLoading &&
                activityPagination &&
                activityPagination.currentPage <
                  activityPagination.totalPages && (
                  <div className="mt-4 sm:mt-6 text-center">
                    <button
                      onClick={() => fetchActivityFeed(activityPage + 1)}
                      disabled={isFetchingMore}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-100 text-purple-700 font-semibold rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto text-sm sm:text-base"
                    >
                      {isFetchingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700"></div>
                          <span className="hidden sm:inline">
                            جاري التحميل...
                          </span>
                          <span className="sm:hidden">جاري التحميل</span>
                        </>
                      ) : (
                        <>
                          <Activity className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            تحميل المزيد من الأنشطة
                          </span>
                          <span className="sm:hidden">تحميل المزيد</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
            </motion.div>
          )}

          {/* التبويب 2: إدارة الأصدقاء */}
          {activeSubTab === "manage_friends" && (
            <motion.div
              key="manage_friends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Empty State - عندما لا يوجد أصدقاء أو طلبات */}
              {friendsList.length === 0 &&
              pendingRequests.sent.length === 0 &&
              pendingRequests.received.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] rounded-2xl p-6 sm:p-8 md:p-12 border-2 border-[#7440E9]/20 shadow-lg"
                >
                  <div className="text-center space-y-6 sm:space-y-8">
                    {/* الأيقونة */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.2,
                        type: "spring",
                        stiffness: 200,
                      }}
                      className="flex justify-center"
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gradient-to-br from-[#7440E9] to-[#8b5cf6] rounded-full flex items-center justify-center shadow-xl">
                        <Users className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" />
                      </div>
                    </motion.div>

                    {/* العنوان */}
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800"
                    >
                      لم تقم بإضافة صُحبة بعد.
                    </motion.h2>

                    {/* النص التوضيحي */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
                    >
                      رحلة القرآن أجمل مع الصُحبة. ادعُ أصحابك الآن لمشاركة
                      الإنجازات والتدبرات.
                    </motion.p>

                    {/* عرض كود الصحبة */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-3 sm:space-y-4"
                    >
                      <p className="text-sm sm:text-base text-gray-700 font-medium">
                        هذا هو كود الصحبة الخاص بك في هذا المخيم:
                      </p>
                      <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 border-2 border-[#7440E9]/30 shadow-md">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                          <code className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#7440E9] font-mono bg-[#F7F6FB] px-4 py-3 rounded-lg border border-[#7440E9]/20 flex-1 text-center break-all sm:break-normal">
                            {myFriendCode || "..."}
                          </code>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCopyFriendCode}
                            className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#7440E9] to-[#8b5cf6] text-white rounded-xl hover:from-[#5a2fc7] hover:to-[#7c3aed] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 font-semibold text-sm sm:text-base md:text-lg"
                          >
                            <Clipboard className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span>نسخ الكود</span>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>

                    {/* الفاصل */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="flex items-center gap-4 my-4 sm:my-6"
                    >
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-gray-300"></div>
                      <span className="text-gray-500 font-semibold text-sm sm:text-base">
                        أو
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-300 to-gray-300"></div>
                    </motion.div>

                    {/* إدخال كود صديق */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="space-y-3 sm:space-y-4"
                    >
                      <p className="text-sm sm:text-base text-gray-700 font-medium">
                        أدخل كود صديقك لإرسال طلب صداقة:
                      </p>
                      <form
                        onSubmit={handleSendRequestByCode}
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto"
                      >
                        <input
                          type="text"
                          value={friendCodeInput}
                          onChange={(e) => setFriendCodeInput(e.target.value)}
                          placeholder="أدخل كود الصحبة..."
                          className="flex-1 px-4 sm:px-5 py-3 sm:py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7440E9] focus:border-[#7440E9] transition-all text-base sm:text-lg shadow-sm"
                        />
                        <motion.button
                          type="submit"
                          disabled={
                            sendingRequest || friendCodeInput.trim() === ""
                          }
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#7440E9] to-[#8b5cf6] text-white rounded-xl hover:from-[#5a2fc7] hover:to-[#7c3aed] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 font-semibold text-sm sm:text-base md:text-lg shadow-lg hover:shadow-xl"
                        >
                          {sendingRequest ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>جاري الإرسال...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                              <span>إرسال طلب</span>
                            </>
                          )}
                        </motion.button>
                      </form>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* قسم كود الصحبة الخاص بي */}
                  <div className="bg-gradient-to-r from-[#F7F6FB] to-[#F3EDFF] rounded-xl p-3 sm:p-4 md:p-5 border border-[#7440E9]/20">
                    <label className="block text-xs text-gray-600 mb-2">
                      شارك هذا الكود مع صديقك ليضيفك:
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <strong className="text-[#7440E9] font-semibold text-sm sm:text-base md:text-lg bg-white px-2 sm:px-3 md:px-4 py-2 rounded-md border border-[#7440E9]/20 flex-1 text-center font-mono break-all sm:break-normal">
                        {myFriendCode || "..."}
                      </strong>
                      <button
                        onClick={handleCopyFriendCode}
                        className="p-2 sm:p-2.5 md:p-3 rounded-lg bg-[#7440E9] text-white hover:bg-[#5a2fc7] transition-colors flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto"
                        title="نسخ كود الصحبة"
                      >
                        <Clipboard className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-xs sm:text-sm font-medium">
                          نسخ
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* قسم إضافة صديق بالكود */}
                  <div className="bg-gradient-to-r from-[#F7F6FB] to-[#F3EDFF] rounded-xl p-3 sm:p-4 md:p-6 border border-[#7440E9]/20">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />
                      إضافة صديق جديد
                    </h3>
                    <form
                      onSubmit={handleSendRequestByCode}
                      className="flex flex-col sm:flex-row gap-2"
                    >
                      <input
                        type="text"
                        value={friendCodeInput}
                        onChange={(e) => setFriendCodeInput(e.target.value)}
                        placeholder="أدخل كود الصحبة..."
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7440E9] focus:border-transparent text-sm"
                      />
                      <button
                        type="submit"
                        disabled={
                          sendingRequest || friendCodeInput.trim() === ""
                        }
                        className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#7440E9] text-white rounded-lg hover:bg-[#5a2fc7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
                      >
                        {sendingRequest ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span className="hidden sm:inline">
                              جاري الإرسال...
                            </span>
                            <span className="sm:hidden">جاري الإرسال</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">إرسال طلب</span>
                            <span className="sm:hidden">إرسال</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </>
              )}

              {/* قسم طلبات معلقة */}
              {(pendingRequests.received.length > 0 ||
                pendingRequests.sent.length > 0) && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />
                    طلبات معلقة
                  </h3>

                  {/* الطلبات الواردة */}
                  {pendingRequests.received.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-3 sm:p-4 md:p-5 border border-blue-200">
                      <h4 className="text-sm sm:text-base font-semibold text-blue-900 mb-2 sm:mb-3">
                        الطلبات الواردة ({pendingRequests.received.length})
                      </h4>
                      <div className="space-y-3">
                        {pendingRequests.received.map((request) => (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm border border-blue-100"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full  flex items-center justify-center text-white font-bold text-sm sm:text-base overflow-hidden flex-shrink-0">
                                {request.sender?.profile_picture ? (
                                  <img
                                    src={request.sender.profile_picture}
                                    alt={request.sender.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  request.sender?.username
                                    ?.charAt(0)
                                    ?.toUpperCase() || "?"
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 text-sm sm:text-base truncate">
                                  {request.sender?.username || "مستخدم"}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  طلب صداقة
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <button
                                onClick={() =>
                                  handleRespondToRequest(request.id, "accept")
                                }
                                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                              >
                                <UserCheck className="w-4 h-4" />
                                قبول
                              </button>
                              <button
                                onClick={() =>
                                  handleRespondToRequest(request.id, "reject")
                                }
                                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                              >
                                <UserX className="w-4 h-4" />
                                رفض
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* الطلبات المرسلة */}
                  {pendingRequests.sent.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-3 sm:p-4 md:p-5 border border-gray-200">
                      <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
                        الطلبات المرسلة ({pendingRequests.sent.length})
                      </h4>
                      <div className="space-y-3">
                        {pendingRequests.sent.map((request) => (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3 shadow-sm border border-gray-100"
                          >
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold text-sm sm:text-base overflow-hidden flex-shrink-0">
                              {request.receiver?.profile_picture ? (
                                <img
                                  src={request.receiver.profile_picture}
                                  alt={request.receiver.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                request.receiver?.username
                                  ?.charAt(0)
                                  ?.toUpperCase() || "?"
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 text-sm sm:text-base truncate">
                                {request.receiver?.username || "مستخدم"}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                قيد الانتظار
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* قسم قائمة الأصدقاء */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />
                  أصدقاؤك ({friendsList.length})
                </h3>

                {friendsList.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-6 sm:p-8 text-center border border-gray-200">
                    <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
                    <p className="text-gray-600 text-xs sm:text-sm md:text-base">
                      لا يوجد أصدقاء حتى الآن. ابدأ بإرسال طلبات صداقة!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    {friendsList.map((friend) => (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg p-2.5 sm:p-3 md:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full  bg-purple-400  flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                              {friend.profile_picture ? (
                                <img
                                  src={friend.profile_picture}
                                  alt={friend.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                friend.username?.charAt(0)?.toUpperCase() || "?"
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 text-sm sm:text-base truncate">
                                {friend.username || "مستخدم"}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">
                                صديق منذ{" "}
                                {new Date(
                                  friend.friendship_created_at
                                ).toLocaleDateString("ar-SA")}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFriend(friend.id)}
                            className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            title="إزالة صديق"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default FriendsTab;
