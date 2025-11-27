import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";

const ShareableSummaryCard = ({
  summaryData,
  campId,
  onDownload,
  shareUrl,
}) => {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      setDownloading(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        quality: 1,
      });

      if (onDownload) {
        onDownload(dataUrl);
      } else {
        const link = document.createElement("a");
        link.download = `ملخص-${summaryData?.campName || "مخيم"}-${campId}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setDownloading(false);
    }
  };

  if (!summaryData) return null;

  const completionPercentage = summaryData.totalCampDays
    ? Math.round((summaryData.daysCompleted / summaryData.totalCampDays) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.6 }}
      className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-purple-200/50 shadow-xl p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            بطاقة إنجازك للمشاركة
          </h3>
          <p className="text-sm text-gray-600">
            قم بتحميل بطاقة إنجازك الجميلة للمشاركة
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7440E9] to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          <span>{downloading ? "جاري التحميل..." : "تحميل البطاقة"}</span>
        </motion.button>
      </div>

      {/* Shareable Card Preview */}
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] rounded-xl p-8 border-4 border-purple-300 shadow-2xl"
        style={{ minHeight: "400px" }}
      >
        <div className="text-center mb-6">
          <div className="inline-block mb-4">
            <div className="text-6xl">🏆</div>
          </div>
          <h2 className="text-3xl font-bold text-[#7440E9] mb-2">
            مبارك! {summaryData.userName}
          </h2>
          <p className="text-xl text-gray-700 mb-4">
            أكملت مخيم "{summaryData.campName}"
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/80 rounded-lg p-4 text-center shadow-md">
            <div className="text-3xl font-bold text-[#7440E9] mb-1">
              {summaryData.totalPoints || 0}
            </div>
            <div className="text-sm text-gray-600">نقطة</div>
          </div>
          <div className="bg-white/80 rounded-lg p-4 text-center shadow-md">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {summaryData.daysCompleted}/{summaryData.totalCampDays || 0}
            </div>
            <div className="text-sm text-gray-600">يوم</div>
          </div>
          <div className="bg-white/80 rounded-lg p-4 text-center shadow-md">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {summaryData.totalTasks || 0}
            </div>
            <div className="text-sm text-gray-600">مهمة</div>
          </div>
          <div className="bg-white/80 rounded-lg p-4 text-center shadow-md">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {completionPercentage}%
            </div>
            <div className="text-sm text-gray-600">إتمام</div>
          </div>
        </div>

        {/* URL Display */}
        {shareUrl && (
          <div className="pt-4 border-t-2 border-purple-200">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">شارك هذه البطاقة</p>
              <p className="text-xs font-mono text-[#7440E9] break-all max-w-xs mx-auto">
                {shareUrl}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ShareableSummaryCard;
