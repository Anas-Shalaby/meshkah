import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Download,
  Share2,
  X,
  CheckCircle,
  Calendar,
  BookOpen,
  Clock,
  ExternalLink,
  Book,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  checkCertificateEligibility,
  generateCertificate,
  getCertificate,
  downloadCertificate,
} from "../../services/bookJourneysService";
import "../../styles/book-journeys.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const JourneyCertificate = ({
  journeyId,
  journeyStatus,
  bookName,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [certificate, setCertificate] = useState(null);

  useEffect(() => {
    loadCertificateData();
  }, [journeyId]);

  const loadCertificateData = async () => {
    try {
      setLoading(true);

      try {
        const certResult = await getCertificate(journeyId);
        if (certResult.success && certResult.certificate) {
          setCertificate(certResult.certificate);
          setLoading(false);
          return;
        }
      } catch (err) {
        // الشهادة غير موجودة
      }

      const eligibilityResult = await checkCertificateEligibility(journeyId);
      setEligibility(eligibilityResult);
    } catch (error) {
      console.error("Error loading certificate data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      setGenerating(true);
      const result = await generateCertificate(journeyId);

      if (result.success) {
        setCertificate(result.certificate);
        toast.success("تم إنشاء الشهادة بنجاح! 🎉");
      } else {
        toast.error(result.reason || "فشل إنشاء الشهادة");
      }
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.error(error.response?.data?.message || "حدث خطأ");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadCertificate(journeyId);
      toast.success("تم تحميل الشهادة بنجاح!");
    } catch (error) {
      console.error("Error downloading certificate:", error);
      toast.error("فشل تحميل الشهادة");
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/verify-journey/${certificate.verification_code}`;
    const shareText = `أكملت قراءة ${bookName}! تحقق من شهادتي:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `شهادة ختم ${bookName}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // المستخدم ألغى المشاركة
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast.success("تم نسخ الرابط!");
      } catch (err) {
        toast.error("فشل نسخ الرابط");
      }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 journey-modal-overlay z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="journey-modal-content p-8 text-center"
        >
          <div className="journey-spinner w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-600 arabic-text">جاري التحميل...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 top-[60px] journey-modal-overlay z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="journey-modal-content p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس النافذة */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 arabic-text">
            <Award className="w-6 h-6 text-purple-500" />
            شهادة الختمة
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* الشهادة موجودة */}
        {certificate ? (
          <div className="text-center">
            {/* معاينة الشهادة */}
            <div className="journey-certificate-preview rounded-xl p-6 mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <Award className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              </motion.div>

              <h4 className="text-lg font-bold text-purple-700 mb-2 arabic-text">
                شهادة ختم كتاب
              </h4>
              <p className="text-2xl font-bold text-gray-800 mb-4 arabic-text">
                {bookName}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-gray-500 arabic-text">رقم الشهادة</p>
                  <p className="font-bold text-gray-800">
                    {certificate.certificate_number}
                  </p>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-gray-500 arabic-text">تاريخ الإصدار</p>
                  <p className="font-bold text-gray-800">
                    {new Date(certificate.issue_date).toLocaleDateString(
                      "ar-EG"
                    )}
                  </p>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-gray-500 arabic-text">عدد الأحاديث</p>
                  <p className="font-bold text-gray-800">
                    {certificate.total_hadiths} حديث
                  </p>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-gray-500 arabic-text">مدة الختمة</p>
                  <p className="font-bold text-gray-800">
                    {certificate.total_days} يوم
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                كود التحقق: {certificate.verification_code}
              </p>
            </div>

            {/* أزرار */}
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 journey-btn-primary"
              >
                <Download className="w-5 h-5 ml-2" />
                تحميل PDF
              </button>
              <button
                onClick={handleShare}
                className="flex-1 journey-btn-secondary"
              >
                <Share2 className="w-5 h-5 ml-2" />
                مشاركة
              </button>
            </div>
          </div>
        ) : eligibility?.eligible ? (
          // مؤهل للشهادة
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              <CheckCircle className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            </motion.div>

            <h4 className="text-xl font-bold text-gray-800 mb-2 arabic-text">
              مبارك! 🎉
            </h4>
            <p className="text-gray-600 mb-6 arabic-text">
              لقد أكملت قراءة{" "}
              <span className="font-bold text-purple-600">{bookName}</span>!
              <br />
              يمكنك الآن الحصول على شهادة ختم الكتاب.
            </p>

            <button
              onClick={handleGenerateCertificate}
              disabled={generating}
              className="w-full journey-btn-primary"
            >
              {generating ? (
                <>
                  <div className="journey-spinner w-5 h-5 ml-2" />
                  جاري إنشاء الشهادة...
                </>
              ) : (
                <>
                  <Award className="w-5 h-5 ml-2" />
                  احصل على الشهادة
                </>
              )}
            </button>
          </div>
        ) : (
          // غير مؤهل للشهادة
          <div className="text-center">
            <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />

            <h4 className="text-lg font-bold text-gray-800 mb-2 arabic-text">
              لم تكتمل الختمة بعد
            </h4>
            <p className="text-gray-600 mb-4 arabic-text">
              {eligibility?.reason ||
                "يجب إكمال قراءة جميع الأحاديث للحصول على الشهادة"}
            </p>

            {eligibility?.progress && (
              <div className="bg-purple-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 arabic-text">التقدم</span>
                  <span className="font-bold text-purple-600">
                    {eligibility.progress.percent}%
                  </span>
                </div>
                <div className="journey-progress-bar h-2">
                  <div
                    className="journey-progress-bar-fill h-full"
                    style={{ width: `${eligibility.progress.percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 arabic-text">
                  {eligibility.progress.read} / {eligibility.progress.total}{" "}
                  حديث
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors arabic-text"
            >
              متابعة القراءة
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default JourneyCertificate;
