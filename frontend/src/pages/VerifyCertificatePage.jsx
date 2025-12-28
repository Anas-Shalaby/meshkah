import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Award,
  Calendar,
  User,
  Book,
  Loader2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import SEO from '../components/SEO';

/**
 * Certificate Verification Page
 * Public page to verify certificate authenticity
 */
const VerifyCertificatePage = () => {
  const { verificationCode } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyCertificate();
  }, [verificationCode]);

  const verifyCertificate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/certificates/verify/${verificationCode}`
      );

      const data = await response.json();

      if (data.success) {
        setCertificate(data.certificate);
      } else {
        setError(data.message || 'الشهادة غير موجودة');
      }
    } catch (err) {
      console.error('Error verifying certificate:', err);
      setError('حدث خطأ في التحقق من الشهادة');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-[#7440E9] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">جاري التحقق من الشهادة...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <>
        <SEO
          title="التحقق من الشهادة - منصة مِشكاة"
          description="التحقق من صحة الشهادة الرقمية"
        />
        <div className="min-h-screen bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              الشهادة غير صحيحة
            </h2>

            <p className="text-gray-600 mb-6">{error}</p>

            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#7440E9] text-white rounded-xl hover:bg-[#5a2fc7] transition-colors font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              العودة للرئيسية
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  const stats = certificate.stats ? (typeof certificate.stats === 'string' ? JSON.parse(certificate.stats) : certificate.stats) : null;

  return (
    <>
      <SEO
        title={`شهادة ${stats?.username || 'المستخدم'} - ${certificate.camp_name}`}
        description={`شهادة إتمام مخيم ${certificate.camp_name} من منصة مِشكاة`}
      />

      <div className="min-h-screen bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] py-12 px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full mb-4">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">شهادة موثقة ومعتمدة</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              شهادة إتمام
            </h1>

            <p className="text-gray-600">
              رقم الشهادة: {certificate.certificate_number}
            </p>
          </motion.div>
        </div>

        {/* Certificate Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-[#7440E9]/20"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#7440E9] to-[#9F7AEA] p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <Award className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {certificate.camp_name}
              </h2>
              {certificate.surah_name && (
                <p className="text-white/90">سورة {certificate.surah_name}</p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {stats && (
              <>
                {/* User Info */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 text-gray-600 mb-2">
                    <User className="w-5 h-5" />
                    <span>اسم الحاصل على الشهادة</span>
                  </div>
                  <h3 className="text-3xl font-bold text-[#7440E9]">
                    {stats.username}
                  </h3>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <Calendar className="w-6 h-6 text-[#7440E9] mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.completedTasks || 0}
                    </p>
                    <p className="text-sm text-gray-600">مهمة مكتملة</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <Award className="w-6 h-6 text-[#7440E9] mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalPoints || 0}
                    </p>
                    <p className="text-sm text-gray-600">نقطة</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <Book className="w-6 h-6 text-[#7440E9] mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      الفوج {stats.cohortNumber || certificate.cohort_number}
                    </p>
                    <p className="text-sm text-gray-600">رقم الفوج</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <Calendar className="w-6 h-6 text-[#7440E9] mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.durationDays || '—'}
                    </p>
                    <p className="text-sm text-gray-600">يوم</p>
                  </div>
                </div>
              </>
            )}

            {/* Issue Date */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">تاريخ الإصدار</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(certificate.issue_date).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">كود التحقق</p>
                  <p className="font-mono font-semibold text-[#7440E9]">
                    {certificate.verification_code}
                  </p>
                </div>
              </div>
            </div>

            {/* Platform Badge */}
            <div className="mt-6 p-4 bg-gradient-to-r from-[#F7F6FB] to-[#F3EDFF] rounded-xl text-center">
              <p className="text-lg font-bold text-[#7440E9]">
                منصة مِشكاة للتدبر القرآني
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Platform for Quran Reflection & Study
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer Actions */}
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-[#7440E9] hover:underline font-semibold"
          >
            <ExternalLink className="w-5 h-5" />
            زيارة منصة مِشكاة
          </a>
        </div>
      </div>
    </>
  );
};

export default VerifyCertificatePage;
