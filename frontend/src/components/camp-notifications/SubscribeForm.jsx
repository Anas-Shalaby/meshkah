import React, { useState } from "react";
import { Mail, CheckCircle, Bell, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { motion } from "framer-motion";

const SubscribeForm = () => {
  const [email, setEmail] = useState("");
  const [subscriptionType, setSubscriptionType] = useState("both");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL || "https://api.hadith-shareef.com/api"
        }/camp-notifications/subscribe`,
        {
          email,
          subscription_type: subscriptionType,
        }
      );

      if (response.data.success) {
        setSubmitted(true);
        toast.success(
          "تم الاشتراك بنجاح! ستصلك إشعارات عند فتح مخيمات أو أفواج جديدة"
        );
        setEmail("");
      } else {
        toast.error(response.data.message || "حدث خطأ في الاشتراك");
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      toast.error(
        error.response?.data?.message ||
          "حدث خطأ في الاشتراك. يرجى المحاولة لاحقاً"
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 sm:p-8 shadow-lg"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-900 mb-2">
              تم الاشتراك بنجاح! 🎉
            </h3>
            <p className="text-green-800 text-sm leading-relaxed">
              ستصلك إشعارات بريدية فورية عند فتح مخيمات أو أفواج جديدة للتسجيل
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xl border border-white/20"
      >
        <div className="space-y-4">
          {/* Email Input and Submit - Inline on larger screens */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Mail className="w-4 h-4 text-[#7440E9]/40" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pr-10 pl-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7440E9] focus:border-[#7440E9] transition-all outline-none text-gray-900 placeholder-gray-400"
                  placeholder="أدخل بريدك الإلكتروني"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#7440E9] to-purple-600 text-white py-2.5 px-6 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري الاشتراك...</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>اشترك</span>
                </>
              )}
            </button>
          </div>

          {/* Subscription Type - Compact */}
          <div>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { value: "both", label: "الكل" },
                { value: "camps", label: "مخيمات فقط" },
                { value: "cohorts", label: "أفواج فقط" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 cursor-pointer transition-all text-xs sm:text-sm ${
                    subscriptionType === option.value
                      ? "border-[#7440E9] bg-purple-50 text-[#7440E9] font-semibold"
                      : "border-gray-200 hover:border-purple-200 hover:bg-purple-50/50 text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="subscriptionType"
                    value={option.value}
                    checked={subscriptionType === option.value}
                    onChange={(e) => setSubscriptionType(e.target.value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all ${
                      subscriptionType === option.value
                        ? "border-[#7440E9] bg-[#7440E9]"
                        : "border-gray-300"
                    }`}
                  >
                    {subscriptionType === option.value && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default SubscribeForm;
