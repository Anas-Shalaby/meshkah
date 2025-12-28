import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Search, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

/**
 * Certificate Verification Input Page
 * Page where users can enter verification code to check certificate
 */
const CertificateVerificationInputPage = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      setError('الرجاء إدخال كود التحقق');
      return;
    }

    // Navigate to verification page
    navigate(`/verify-certificate/${verificationCode.trim().toUpperCase()}`);
  };

  return (
    <>
      <SEO
        title="التحقق من الشهادة - منصة مِشكاة"
        description="تحقق من صحة الشهادة الرقمية باستخدام كود التحقق"
      />

      <div className="min-h-screen bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-20 h-20 bg-gradient-to-br from-[#7440E9] to-[#9F7AEA] rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl"
            >
              <Shield className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-3"
            >
              التحقق من الشهادة
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 text-lg"
            >
              أدخل كود التحقق للتأكد من صحة الشهادة
            </motion.p>
          </div>

          {/* Verification Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-[#7440E9]/20"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Input Field */}
              <div>
                <label
                  htmlFor="verificationCode"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  كود التحقق
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value.toUpperCase());
                      setError('');
                    }}
                    placeholder="مثال: ABC12XYZ"
                    className={`w-full px-4 py-4 pr-12 text-center text-xl font-mono tracking-wider border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7440E9] transition-all ${
                      error
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                    maxLength={20}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-600 text-sm mt-2"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">ℹ</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-900">
                      <strong>أين أجد كود التحقق؟</strong>
                      <br />
                      كود التحقق موجود في الشهادة الرقمية (PDF) أو يمكنك مسح QR Code
                      الموجود على الشهادة.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-[#7440E9] to-[#9F7AEA] text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                التحقق من الشهادة
              </button>
            </form>

            {/* Back Button */}
            <button
              onClick={() => navigate('/')}
              className="w-full mt-4 py-3 text-gray-600 hover:text-[#7440E9] transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              العودة للرئيسية
            </button>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center space-y-4"
          >
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3">
                لماذا نظام التحقق؟
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-600 text-xl">✓</span>
                  </div>
                  <p className="font-semibold text-gray-700 mb-1">الأصالة</p>
                  <p>التأكد من صحة الشهادة</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 text-xl">🔒</span>
                  </div>
                  <p className="font-semibold text-gray-700 mb-1">الأمان</p>
                  <p>حماية من التزوير</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-600 text-xl">⚡</span>
                  </div>
                  <p className="font-semibold text-gray-700 mb-1">السرعة</p>
                  <p>تحقق فوري</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default CertificateVerificationInputPage;
