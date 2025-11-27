import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Share2 } from "lucide-react";
import toast from "react-hot-toast";

const SocialShareModal = ({ isOpen, onClose, campName, shareUrl }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // نص المشاركة الجميل
  const shareText = `🎉 الحمد لله! أكملت رحلة "${campName}" بنجاح! ✨

📖 رحلة ممتعة من التدبر والتأمل في كلام الله عز وجل
💫 استفدت كثيراً واكتسبت فوائد قيمة

🤲 أدعوكم للانضمام لهذه التجربة المباركة
🌟 انضم إلي في هذه الرحلة القرآنية الرائعة!

${shareUrl}

#مخيمات_قرآنية #تدبر_القرآن #رحلة_إيمانية`;

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  // روابط المشاركة على المنصات المختلفة
  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodedText}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(
      `🎉 الحمد لله! أكملت رحلة "${campName}" بنجاح! ✨\n\n📖 رحلة ممتعة من التدبر والتأمل في كلام الله عز وجل\n💫 استفدت كثيراً واكتسبت فوائد قيمة\n\n🤲 أدعوكم للانضمام لهذه التجربة المباركة\n🌟 انضم إلي في هذه الرحلة القرآنية الرائعة!\n\n#مخيمات_قرآنية #تدبر_القرآن #رحلة_إيمانية`
    )}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(
      `🎉 الحمد لله! أكملت رحلة "${campName}" بنجاح! ✨`
    )}`,
  };

  const handleShare = (platform) => {
    if (platform === "copy") {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("تم نسخ النص!");
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 2000);
      return;
    }

    if (shareLinks[platform]) {
      window.open(shareLinks[platform], "_blank", "width=600,height=400");
      onClose();
    }
  };

  const socialPlatforms = [
    {
      id: "whatsapp",
      name: "واتساب",
      icon: (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      ),
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      id: "telegram",
      name: "تيليجرام",
      icon: (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
      color: "bg-blue-400 hover:bg-blue-500",
    },
    {
      id: "twitter",
      name: "تويتر",
      icon: (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      ),
      color: "bg-sky-500 hover:bg-sky-600",
    },
    {
      id: "facebook",
      name: "فيسبوك",
      icon: (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      color: "bg-blue-600 hover:bg-blue-700",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E8E2FF]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F4F0FF] rounded-lg">
                    <Share2 className="w-5 h-5 text-[#7440E9]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#2F1C65]">
                      مشاركة الإنجاز
                    </h3>
                    <p className="text-sm text-gray-600">
                      شارك إنجازك على وسائل التواصل
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Social Media Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {socialPlatforms.map((platform) => (
                  <motion.button
                    key={platform.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleShare(platform.id)}
                    className={`${platform.color} text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-300 shadow-lg`}
                  >
                    {platform.icon}
                    <span className="text-sm font-semibold">
                      {platform.name}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Copy Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleShare("copy")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-300"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 text-green-600" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>نسخ النص</span>
                  </>
                )}
              </motion.button>

              {/* Preview Text */}
              <div className="mt-4 p-3 bg-[#F8F6FF] rounded-lg border border-[#ECE3FF]">
                <p className="text-xs text-gray-500 mb-2">معاينة النص:</p>
                <p className="text-xs text-gray-700 leading-relaxed line-clamp-4">
                  {shareText}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SocialShareModal;
