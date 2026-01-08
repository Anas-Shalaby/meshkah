import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle,
  XCircle,
  BookOpen,
  Calendar,
  User,
  Clock,
  Book,
  Sparkles,
} from "lucide-react";
import { useRamadanTheme } from "../context/RamadanThemeContext";
import { verifyCertificate } from "../services/bookJourneysService";
import SEO from "../components/SEO";
import RamadanCountdown from "../components/ramadan/RamadanCountdown";
import RamadanFloatingElements from "../components/ramadan/RamadanFloatingElements";
import "../styles/book-journeys.css";

const VerifyJourneyCertificatePage = () => {
  const { code } = useParams();
  const { isRamadanThemeActive } = useRamadanTheme();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (code) {
      handleVerify();
    }
  }, [code]);

  const handleVerify = async () => {
    try {
      setLoading(true);
      const response = await verifyCertificate(code);
      setResult(response);
    } catch (error) {
      console.error("Error verifying certificate:", error);
      setResult({ valid: false, message: "حدث خطأ في التحقق من الشهادة" });
    } finally {
      setLoading(false);
    }
  };

  const bgClass = isRamadanThemeActive
    ? "ramadan-bg-gradient"
    : "bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50";

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${bgClass}`}
      >
        <SEO
          title="التحقق من شهادة ختم كتاب | مشكاة"
          description="تحقق من صحة شهادة إتمام ختم كتاب من كتب الحديث الشريف"
          keywords="شهادة، تحقق، ختمة كتاب، أحاديث"
        />
        {isRamadanThemeActive && <RamadanCountdown />}
        {isRamadanThemeActive && <RamadanFloatingElements />}
        <div className="text-center">
          <div className="journey-spinner w-16 h-16 mx-auto mb-4" />
          <p className="text-gray-600 arabic-text">جاري التحقق من الشهادة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-12 px-4 ${bgClass}`}>
      <SEO
        title={
          result?.valid
            ? `شهادة ${result?.certificate?.book_name} | مشكاة`
            : "التحقق من شهادة | مشكاة"
        }
        description={
          result?.valid
            ? `شهادة إتمام ختمة ${result?.certificate?.book_name} - ${result?.certificate?.username}`
            : "التحقق من صحة شهادة ختم كتاب"
        }
        keywords="شهادة، تحقق، ختمة كتاب"
      />
      {isRamadanThemeActive && <RamadanCountdown />}
      {isRamadanThemeActive && <RamadanFloatingElements />}

      <div
        className={`max-w-lg mx-auto ${
          isRamadanThemeActive ? "pt-20 md:pt-16" : ""
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {result?.valid ? (
            <>
              {/* شهادة صالحة */}
              <div className="journey-header p-6 text-white text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                </motion.div>
                <h1 className="text-2xl font-bold mb-2 arabic-text">
                  شهادة صالحة ✓
                </h1>
                <p className="text-purple-200 arabic-text">
                  تم التحقق من صحة هذه الشهادة
                </p>
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  <Award className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                  <h2 className="text-xl font-bold text-gray-800 arabic-text">
                    شهادة ختم كتاب
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                    <Book className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500 arabic-text">
                        الكتاب
                      </p>
                      <p className="font-bold text-gray-800 arabic-text">
                        {result.certificate.book_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                    <User className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500 arabic-text">
                        صاحب الشهادة
                      </p>
                      <p className="font-bold text-gray-800 arabic-text">
                        {result.certificate.username}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-500 arabic-text">
                          تاريخ الإصدار
                        </p>
                        <p className="font-bold text-gray-800">
                          {new Date(
                            result.certificate.issue_date
                          ).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-500 arabic-text">
                          مدة الختمة
                        </p>
                        <p className="font-bold text-gray-800">
                          {result.certificate.total_days} يوم
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center p-4 journey-certificate-preview rounded-xl">
                    <p className="text-sm text-gray-600 arabic-text">
                      رقم الشهادة
                    </p>
                    <p className="font-mono font-bold text-purple-600">
                      {result.certificate.certificate_number}
                    </p>
                  </div>

                  <div className="text-center text-sm text-gray-500 arabic-text">
                    <p>عدد الأحاديث: {result.certificate.total_hadiths} حديث</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* شهادة غير صالحة */}
              <div className="bg-gradient-to-l from-red-500 to-rose-600 p-6 text-white text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <XCircle className="w-16 h-16 mx-auto mb-4" />
                </motion.div>
                <h1 className="text-2xl font-bold mb-2 arabic-text">
                  شهادة غير صالحة
                </h1>
                <p className="text-red-100 arabic-text">
                  {result?.message || "لم نتمكن من التحقق من هذه الشهادة"}
                </p>
              </div>

              <div className="p-6 text-center">
                <p className="text-gray-600 mb-4 arabic-text">
                  كود التحقق المستخدم:{" "}
                  <span className="font-mono font-bold">{code}</span>
                </p>
                <p className="text-sm text-gray-500 arabic-text">
                  إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الدعم الفني.
                </p>
              </div>
            </>
          )}

          {/* رابط العودة */}
          <div className="px-6 pb-6">
            <Link
              to="/book-journeys"
              className="block w-full journey-btn-primary text-center"
            >
              تصفح ختمات الكتب
            </Link>
          </div>
        </motion.div>

        {/* العلامة التجارية */}
        <p className="text-center text-gray-400 text-sm mt-6 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          مشكاة - منصة المعرفة الإسلامية
        </p>
      </div>
    </div>
  );
};

export default VerifyJourneyCertificatePage;
