import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Download, 
  Share2, 
  CheckCircle2, 
  Loader2,
  X,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Certificate Card Component
 * Displays certificate status and provides download/generate functionality
 */
const CertificateCard = ({ campId, campName, cohortNumber, enrollment }) => {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [eligible, setEligible] = useState(null);

  useEffect(() => {
    checkCertificate();
  }, [campId, cohortNumber]);

  const checkCertificate = async () => {
    try {
      setLoading(true);

      // Check if certificate exists
      const certResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/certificates/my/${campId}/${cohortNumber}`,
        {
          headers: {
            'x-auth-token': localStorage.getItem('token'),
          },
        }
      );

      const certData = await certResponse.json();

      if (certData.success) {
        setCertificate(certData.certificate);
      } else {
        // Check eligibility if no certificate
        const eligResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/certificates/eligibility/${campId}/${cohortNumber}`,
          {
            headers: {
              'x-auth-token': localStorage.getItem('token'),
            },
          }
        );

        const eligData = await eligResponse.json();
        setEligible(eligData);
      }
    } catch (error) {
      console.error('Error checking certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      setGenerating(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/certificates/generate/${campId}/${cohortNumber}`,
        {
          method: 'POST',
          headers: {
            'x-auth-token': localStorage.getItem('token'),
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setCertificate(data.certificate);
        toast.success('تم إنشاء الشهادة بنجاح! 🎉');
      } else {
        toast.error(data.message || 'فشل إنشاء الشهادة');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('حدث خطأ في إنشاء الشهادة');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/certificates/download/${certificate.id}`,
        {
          headers: {
            'x-auth-token': localStorage.getItem('token'),
          },
        }
      );

      if (!response.ok) {
        toast.error('فشل تحميل الشهادة');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificate.certificate_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('تم تحميل الشهادة! 📄');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('حدث خطأ في تحميل الشهادة');
    }
  };

  const handleShare = async () => {
    const verificationUrl = `${window.location.origin}/verify-certificate/${certificate.verification_code}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `شهادة إتمام ${campName}`,
          text: `حصلت على شهادة إتمام مخيم ${campName}! 🎓`,
          url: verificationUrl,
        });
      } else {
        await navigator.clipboard.writeText(verificationUrl);
        toast.success('تم نسخ رابط التحقق! 🔗');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-[#7440E9] animate-spin" />
        </div>
      </div>
    );
  }

  // If certificate exists
  if (certificate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#7440E9] to-[#9F7AEA] rounded-2xl p-6 shadow-2xl border-2 border-[#7440E9]/30 relative overflow-hidden"
      >
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">شهادة التخرج</h3>
              <p className="text-white/80 text-sm">
                رقم الشهادة: {certificate.certificate_number}
              </p>
            </div>
          </div>

          {/* Certificate info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2 text-white">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">شهادة موثقة ومعتمدة</span>
            </div>
            <p className="text-white/80 text-sm">
              تاريخ الإصدار:{' '}
              {new Date(certificate.issue_date).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#7440E9] rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg"
            >
              <Download className="w-5 h-5" />
              <span>تحميل PDF</span>
            </button>

            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 border-2 border-white/30"
            >
              <Share2 className="w-5 h-5" />
              <span>مشاركة</span>
            </button>
          </div>

          {/* Verification link */}
          <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
            <p className="text-xs text-white/70 mb-1">رابط التحقق:</p>
            <a
              href={`${window.location.origin}/verify-certificate/${certificate.verification_code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white font-mono break-all hover:underline flex items-center gap-1"
            >
              /verify-certificate/{certificate.verification_code}
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>
        </div>
      </motion.div>
    );
  }

  // If eligible but not generated
  if (eligible?.eligible) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg border-2 border-[#7440E9]/20"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7440E9] to-[#9F7AEA] rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            مبروك! أنت مؤهل للحصول على الشهادة 🎉
          </h3>

          <p className="text-gray-600 mb-6">
            لقد أكملت جميع مهام المخيم بنجاح. يمكنك الآن إنشاء شهادتك الرقمية!
          </p>

          <button
            onClick={handleGenerateCertificate}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7440E9] to-[#9F7AEA] text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري الإنشاء...</span>
              </>
            ) : (
              <>
                <Award className="w-5 h-5" />
                <span>إنشاء الشهادة</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    );
  }

  // Not eligible
  if (eligible && !eligible.eligible) {
    return (
      <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-gray-400" />
          </div>

          <h3 className="text-lg font-bold text-gray-700 mb-2">
            لم تكتمل متطلبات الشهادة بعد
          </h3>

          <p className="text-gray-600 text-sm">
            {eligible.reason}
          </p>

          {eligible.progress && (
            <div className="mt-4 p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-700">
                التقدم: {eligible.progress.completedTasks} من{' '}
                {eligible.progress.totalTasks} مهمة (
                {Math.round(eligible.progress.completionPercentage)}%)
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default CertificateCard;
