import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Users, Gift, Sparkles, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import SocialShareModal from "./SocialShareModal";

const InviteFriendsModal = ({
  isOpen,
  onClose,
  campCode,
  campId,
  campName,
  cohortNumber,
}) => {
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [referralsList, setReferralsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchReferralData = async () => {
      try {
        setLoading(true);

        const [linkResponse, statsResponse, listResponse] = await Promise.all([
          fetch(
            `${import.meta.env.VITE_API_URL}/quran-camps/referral/my-link/${campId}/${campCode}/${cohortNumber}`,
            {
              headers: {
                "x-auth-token": localStorage.getItem("token"),
              },
            }
          ),
          fetch(
            `${import.meta.env.VITE_API_URL}/quran-camps/referral/my-stats/${campId}/${cohortNumber}`,
            {
              headers: {
                "x-auth-token": localStorage.getItem("token"),
              },
            }
          ),
          fetch(
            `${import.meta.env.VITE_API_URL}/quran-camps/referral/my-referrals/${campId}/${cohortNumber}`,
            {
              headers: {
                "x-auth-token": localStorage.getItem("token"),
              },
            }
          ),
        ]);

        const linkData = await linkResponse.json();
        const statsData = await statsResponse.json();
        const listData = await listResponse.json();

        if (linkData.success && statsData.success) {
          setReferralData({
            referralLink: linkData.referralLink,
            referralCode: linkData.referralCode,
            stats: statsData.stats,
          });
        }

        if (listData.success) {
          setReferralsList(listData.referrals || []);
        }
      } catch (error) {
        console.error("Error fetching referral data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, [isOpen, campId, campCode, cohortNumber]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralData.referralLink);
      setCopied(true);
      toast.success("تم نسخ الرابط!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("فشل نسخ الرابط");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed top-[65px] inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] p-5 sm:p-6 text-white flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold">ادعُ أصدقاءك للمخيم</h3>
                      <p className="text-white/90 text-xs sm:text-sm mt-0.5">
                        احصل على نقاط قبل بدء الفوج
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-[#7440E9] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : referralData ? (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-gradient-to-br from-[#F7F6FB] to-white rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-2 text-[#7440E9]">
                          <Users className="w-4 h-4" />
                          <span className="font-semibold text-xs sm:text-sm">
                            دعوات ناجحة
                          </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                          {referralData.stats.successfulReferrals || 0}
                        </p>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-[#F7F6FB] to-white rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-2 text-[#7440E9]">
                          <Sparkles className="w-4 h-4" />
                          <span className="font-semibold text-xs sm:text-sm">
                            نقاط مكتسبة
                          </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                          {referralData.stats.referralPoints || 0}
                        </p>
                      </div>
                    </div>

                    {/* Referral Code */}
                    <div className="p-4 bg-gradient-to-br from-[#F7F6FB] to-white rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-600 mb-2 text-center">
                        كود الإحالة الخاص بك
                      </p>
                      <p className="text-xl sm:text-2xl font-bold font-mono text-[#7440E9] tracking-wider text-center">
                        {referralData.referralCode}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleCopyLink}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>تم النسخ!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>نسخ الرابط</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setShowShareModal(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#7440E9] border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 text-sm sm:text-base"
                      >
                        <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>مشاركة</span>
                      </button>
                    </div>

                    {/* Link Display */}
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">
                        رابط الدعوة:
                      </p>
                      <p className="text-xs sm:text-sm font-mono text-[#7440E9] break-all">
                        {referralData.referralLink}
                      </p>
                    </div>

                    {/* Info Note */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">ℹ</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm text-blue-900 leading-relaxed">
                            <strong>كيف تعمل الدعوة؟</strong>
                            <br />
                            شارك رابط الدعوة مع أصدقائك. عندما ينضم أحدهم للمخيم باستخدام رابطك <strong>قبل بدء الفوج</strong>، ستحصل على نقطة إضافية! 🎉
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Referrals List */}
                    {referralsList && referralsList.length > 0 && (
                      <div className="mt-6 border-t border-gray-200 pt-6">
                        <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5 text-[#7440E9]" />
                          الأصدقاء الذين انضموا ({referralsList.length})
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {referralsList.map((referral, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-[#F7F6FB] to-white rounded-lg border border-gray-200"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#7440E9] to-[#9F7AEA] rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {referral.referred_username?.charAt(0) || "?"}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {referral.referred_username || "مستخدم"}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(referral.created_at).toLocaleDateString("ar-SA", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {referral.status === "completed" ? (
                                  <>
                                    <Check className="w-4 h-4 text-green-600" />
                                    <span className="text-xs font-semibold text-green-600">
                                      مكتمل
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs font-semibold text-amber-600">
                                    قيد الانتظار
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">حدث خطأ في جلب البيانات</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Social Share Modal */}
      <SocialShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        campName={campName}
        shareUrl={referralData?.referralLink}
      />
    </>
  );
};

export default InviteFriendsModal;
