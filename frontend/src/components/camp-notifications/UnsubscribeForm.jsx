import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Mail, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

const UnsubscribeForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("رمز إلغاء الاشتراك غير صحيح");
    }
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) {
      setError("رمز إلغاء الاشتراك مطلوب");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${
          process.env.REACT_APP_API_URL || "https://api.hadith-shareef.com/api"
        }/camp-notifications/unsubscribe`,
        {
          token,
        }
      );

      if (response.data.success) {
        setSuccess(true);
        toast.success("تم إلغاء الاشتراك بنجاح");
        setTimeout(() => {
          navigate("/quran-camps");
        }, 3000);
      } else {
        setError(response.data.message || "حدث خطأ في إلغاء الاشتراك");
      }
    } catch (err) {
      console.error("Error unsubscribing:", err);
      setError(
        err.response?.data?.message ||
          "حدث خطأ في إلغاء الاشتراك. يرجى المحاولة لاحقاً"
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              تم إلغاء الاشتراك بنجاح
            </h2>
            <p className="text-gray-600 mb-6">
              لن تصلك إشعارات بعد الآن. شكراً لك على استخدامك لخدماتنا.
            </p>
            <button
              onClick={() => navigate("/quran-camps")}
              className="text-[#7440E9] hover:text-[#6338d1] font-medium"
            >
              العودة إلى صفحة المخيمات
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-red-200 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              رابط غير صحيح
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate("/quran-camps")}
              className="text-[#7440E9] hover:text-[#6338d1] font-medium"
            >
              العودة إلى صفحة المخيمات
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-10 h-10 text-[#7440E9]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            إلغاء الاشتراك
          </h2>
          <p className="text-gray-600">
            هل أنت متأكد من رغبتك في إلغاء الاشتراك من إشعارات المخيمات
            والأفواج؟
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleUnsubscribe}
            disabled={loading || !token}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "جاري الإلغاء..." : "نعم، ألغِ الاشتراك"}
          </button>
          <button
            onClick={() => navigate("/quran-camps")}
            className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsubscribeForm;
