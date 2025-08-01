import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { LogIn } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

// Validation Schema in Arabic
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email("البريد الإلكتروني غير صالح")
    .required("البريد الإلكتروني مطلوب"),
  password: yup
    .string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .required("كلمة المرور مطلوبة"),
});

const Login = () => {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await login(data.email, data.password);
    if (result.success) {
      toast.success("تم تسجيل الدخول بنجاح");
      const redirectPath = localStorage.getItem("redirectPath");
      localStorage.removeItem("redirectPath"); // Clean up
      navigate(redirectPath || "/");
    } else {
      toast.error(result.message);
    }
    setIsLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      if (!credentialResponse.credential) {
        throw new Error("No credential received from Google");
      }
      const result = await googleLogin(credentialResponse.credential);
      if (result.success) {
        toast.success("تم تسجيل الدخول بنجاح");
        const redirectPath = localStorage.getItem("redirectPath");
        localStorage.removeItem("redirectPath"); // Clean up
        navigate(redirectPath || "/");
      } else {
        toast.error(result.message || "فشل تسجيل الدخول");
      }
    } catch (error) {
      console.error("Detailed Google login error:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      toast.error("فشل تسجيل الدخول عبر جوجل");
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleFailure = () => {
    toast.error("فشل تسجيل الدخول عبر جوجل");
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-white via-[#f8f7fa] to-[#f3edff] py-12 px-4 font-cairo"
      dir="rtl"
    >
      <div className="max-w-xl mx-auto w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-[#F7F6FB] border-2 border-[#7440E9]">
            <img
              src="/assets/icons/512-512-01.png"
              alt="website logo"
              className="w-12 h-12"
            />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-[#7440E9]">مرحباً بك</h2>
          <p className="mt-2 text-sm text-gray-600">
            سجل دخولك للوصول إلى حسابك
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 space-y-6"
          dir="rtl"
        >
          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#7440E9]"
              >
                البريد الإلكتروني
              </label>
              <div className="mt-1 relative">
                <input
                  {...register("email")}
                  type="email"
                  id="email"
                  className={`appearance-none block w-full px-4 py-3 rounded-lg bg-[#F7F6FB] text-gray-900 border ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7440E9] focus:border-transparent transition duration-150 ease-in-out`}
                  placeholder="أدخل بريدك الإلكتروني"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>
            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#7440E9]"
              >
                كلمة المرور
              </label>
              <div className="mt-1 relative">
                <input
                  {...register("password")}
                  type="password"
                  id="password"
                  className={`appearance-none block w-full px-4 py-3 rounded-lg bg-[#F7F6FB] text-gray-900 border ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7440E9] focus:border-transparent transition duration-150 ease-in-out`}
                  placeholder="أدخل كلمة المرور"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`group relative w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-[#7440E9] hover:bg-[#8f5cf7] ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7440E9] transition duration-150 ease-in-out`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                جاري تسجيل الدخول...
              </span>
            ) : (
              <span className="flex items-center">
                تسجيل الدخول
                <LogIn className="w-5 h-5 mr-2" />
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">أو</span>
            </div>
          </div>

          {/* Google Sign-In */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => {
                // Trigger Google login (simulate click)
                document
                  .querySelector('div[role="button"][tabindex="0"]')
                  ?.click();
              }}
              className="flex items-center gap-3 px-6 py-3 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-[#7440E9] transition-all duration-150 text-[#222] font-semibold text-base focus:outline-none focus:ring-2 focus:ring-[#7440E9]"
            >
              <img src="/assets/google.png" alt="Google" className="w-6 h-6" />
              <span>تسجيل الدخول عبر جوجل</span>
            </button>
            {/* GoogleLogin component (hidden) */}
            <div style={{ display: "none" }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleFailure}
              />
            </div>
          </div>
        </form>
        {/* زر الانتقال إلى صفحة إنشاء حساب */}
        <div className="mt-4 text-center">
          <span className="text-gray-600 text-sm">ليس لديك حساب؟ </span>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="ml-2 text-[#7440E9] font-semibold hover:underline hover:text-[#8f5cf7] transition-colors duration-150"
          >
            أنشئ حساب جديد
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
