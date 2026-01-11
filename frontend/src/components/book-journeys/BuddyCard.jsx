/**
 * مكون بطاقة الرفيق - Buddy Card Component
 * يعرض معلومات رفيق الختمة وإمكانية التفاعل معه
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Heart,
  Send,
  CheckCircle,
  Clock,
  Flame,
  UserPlus,
  X,
  MessageCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  sendBuddyEncouragement,
  acceptBuddyRequest,
  declineBuddyRequest,
} from "../../services/bookJourneysService";

// مكون بطاقة الرفيق الرئيسية
const BuddyCard = ({ buddy, pendingRequests, journeyId, onRefresh }) => {
  const [showEncourageModal, setShowEncourageModal] = useState(false);
  const [encourageMessage, setEncourageMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendEncouragement = async () => {
    if (!encourageMessage.trim()) {
      toast.error("اكتب رسالة تشجيع أولاً");
      return;
    }

    try {
      setSending(true);
      await sendBuddyEncouragement(journeyId, encourageMessage.trim());
      toast.success("تم إرسال التشجيع! 💪");
      setEncourageMessage("");
      setShowEncourageModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "حدث خطأ");
    } finally {
      setSending(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptBuddyRequest(journeyId, requestId);
      toast.success("تم قبول طلب الرفقة! 🎉");
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "حدث خطأ");
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await declineBuddyRequest(journeyId, requestId);
      toast.success("تم رفض الطلب");
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "حدث خطأ");
    }
  };

  // عرض طلبات الرفقة المعلقة
  if (pendingRequests && pendingRequests.length > 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800 arabic-text flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-purple-600" />
          طلبات الرفقة
        </h3>
        {pendingRequests.map((request) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {request.username?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800 arabic-text">
                  {request.username}
                </p>
                <p className="text-sm text-gray-500 arabic-text">
                  يريد أن يكون رفيقك في هذه الختمة
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleAcceptRequest(request.id)}
                className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                قبول
              </button>
              <button
                onClick={() => handleDeclineRequest(request.id)}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                رفض
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // إذا لم يكن هناك رفيق
  if (!buddy) {
    return (
      <div className="text-center py-8 px-4 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-600 arabic-text mb-2">
          ليس لديك رفيق بعد
        </h3>
        <p className="text-sm text-gray-400 arabic-text">
          شارك رابط الختمة مع صديق ليكون رفيقك في رحلة القراءة!
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 p-5 rounded-2xl border border-purple-100 shadow-sm"
      >
        {/* معلومات الرفيق */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {buddy.username?.charAt(0)?.toUpperCase() || "?"}
            </div>
            {buddy.completed_today && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 text-lg arabic-text">
              {buddy.username}
            </h3>
            <p className="text-sm text-gray-500 arabic-text">
              رفيقك في الختمة 
            </p>
          </div>
          <button
            onClick={() => setShowEncourageModal(true)}
            className="p-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all"
            title="أرسل تشجيعاً"
          >
            <Heart className="w-5 h-5" />
          </button>
        </div>

        {/* تقدم الرفيق */}
        <div className="bg-white/60 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 arabic-text">التقدم</span>
            <span className="text-sm font-bold text-purple-600">
              {buddy.progress_percent}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${buddy.progress_percent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-purple-500 to-violet-600 rounded-full"
            />
          </div>
          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-1 text-gray-500">
              <span className="arabic-text">
                {buddy.current_position} / {buddy.total_hadiths} حديث
              </span>
            </div>
            {buddy.streak_count > 0 && (
              <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                <Flame className="w-4 h-4" />
                <span className="font-bold">{buddy.streak_count}</span>
              </div>
            )}
          </div>
        </div>

        {/* حالة اليوم */}
        <div className="mt-3 flex items-center gap-2">
          {buddy.completed_today ? (
            <div className="flex-1 flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm">
              <CheckCircle className="w-4 h-4" />
              <span className="arabic-text">أكمل ورده اليوم 🎉</span>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-2 rounded-lg text-sm">
              <Clock className="w-4 h-4" />
              <span className="arabic-text">لم يكمل ورده بعد</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal إرسال التشجيع */}
      <AnimatePresence>
        {showEncourageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
            onClick={() => setShowEncourageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 arabic-text flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                  أرسل تشجيعاً لـ {buddy.username}
                </h3>
                <button
                  onClick={() => setShowEncourageModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <textarea
                value={encourageMessage}
                onChange={(e) => setEncourageMessage(e.target.value)}
                placeholder="اكتب رسالة تشجيع لرفيقك..."
                className="w-full p-4 border border-gray-200 rounded-xl resize-none h-32 focus:ring-2 focus:ring-purple-300 focus:border-purple-500 outline-none arabic-text"
                dir="rtl"
              />

              {/* رسائل سريعة */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  "استمر! أنت رائع 💪",
                  "حماسك يلهمني 🌟",
                  "معاً نكمل الختمة 📚",
                ].map((msg) => (
                  <button
                    key={msg}
                    onClick={() => setEncourageMessage(msg)}
                    className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-sm hover:bg-purple-100 transition-colors arabic-text"
                  >
                    {msg}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSendEncouragement}
                disabled={sending || !encourageMessage.trim()}
                className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <span>جاري الإرسال...</span>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>أرسل التشجيع</span>
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BuddyCard;
