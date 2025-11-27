import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  Facebook,
  Twitter,
  Circle,
  Link as LinkIcon,
} from "lucide-react";
import toast from "react-hot-toast";

const ShareModal = ({ isOpen, onClose, camp }) => {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("تم نسخ الرابط!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url
    )}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      url
    )}&text=${encodeURIComponent(camp?.name || "")}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(
      `${camp?.name || ""} - ${url}`
    )}`,
  };

  const handleShare = (platform) => {
    window.open(shareLinks[platform], "_blank", "width=600,height=400");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">مشاركة المخيم</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <input
                type="text"
                value={url}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="p-2 bg-gradient-to-br from-[#7440E9] to-[#5a2fc7] text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleShare("facebook")}
                className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <Facebook className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  فيسبوك
                </span>
              </button>
              <button
                onClick={() => handleShare("twitter")}
                className="flex flex-col items-center gap-2 p-4 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors"
              >
                <Twitter className="w-6 h-6 text-sky-600" />
                <span className="text-sm font-medium text-gray-700">تويتر</span>
              </button>
              <button
                onClick={() => handleShare("whatsapp")}
                className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
              >
                <Circle className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  واتساب
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareModal;
