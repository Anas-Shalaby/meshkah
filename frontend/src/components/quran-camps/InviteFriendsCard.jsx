import React, { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Users, Copy, Check, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import SocialShareModal from "./SocialShareModal";

const InviteFriendsCard = ({
  campId,
  campShareLink,
  campName,
  summaryData,
}) => {
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const shareUrl = `${window.location.origin}/quran-camps/${campShareLink}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("تم نسخ الرابط!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("فشل نسخ الرابط");
    }
  };

  const handleShare = () => {
    // فتح مودال المشاركة على السوشيال ميديا
    setShowShareModal(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5 }}
      className="bg-white rounded-2xl border border-[#E8E2FF] shadow-lg p-6 mb-8"
    >
      <div className="relative">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-4 bg-[#F4F0FF] rounded-xl shadow">
            <Users className="w-8 h-8 text-[#7440E9]" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2 text-[#2F1C65]">
              شارك إنجازك مع الأصدقاء! 🎉
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              دع أصدقاءك ينضموا لهذه الرحلة القرآنية المباركة واستمتعوا معاً في
              التعلم والنمو
            </p>
          </div>
        </div>

        {/* Share stats */}
        {summaryData?.totalParticipants &&
          summaryData.totalParticipants > 0 && (
            <div className="mb-6 p-4 bg-[#F8F6FF] rounded-xl border border-[#ECE3FF]">
              <div className="flex items-center gap-2 mb-2 text-[#7440E9]">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">عدد المشاركين</span>
              </div>
              <p className="text-2xl font-bold text-[#2F1C65]">
                {summaryData.totalParticipants} مشارك
              </p>
            </div>
          )}

        {/* Share buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7440E9] to-[#5a2fc7] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Share2 className="w-5 h-5" />
            <span>مشاركة الإنجاز</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#7440E9] border-2 border-[#ECE3FF] rounded-xl font-semibold hover:bg-[#F7F3FF] transition-all duration-300"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                <span>تم النسخ!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>نسخ الرابط</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Share URL display */}
        <div className="mt-4 p-3 bg-[#F8F6FF] rounded-lg border border-[#ECE3FF]">
          <p className="text-xs text-gray-500 mb-1">رابط المشاركة:</p>
          <p className="text-sm font-mono text-[#7440E9] break-all">
            {shareUrl}
          </p>
        </div>
      </div>

      {/* Social Share Modal */}
      <SocialShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        campName={campName}
        shareUrl={shareUrl}
      />
    </motion.div>
  );
};

export default InviteFriendsCard;
