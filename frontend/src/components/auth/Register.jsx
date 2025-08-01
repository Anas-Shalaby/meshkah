import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { UserPlus } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

// Validation Schema in Arabic
const registerSchema = yup.object().shape({
  username: yup
    .string()
    .min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
    .max(50, "اسم المستخدم يجب أن يكون 50 حرفًا كحد أقصى")
    .required("اسم المستخدم مطلوب"),
  email: yup
    .string()
    .email("البريد الإلكتروني غير صالح")
    .required("البريد الإلكتروني مطلوب"),
  password: yup
    .string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .required("كلمة المرور مطلوبة"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "كلمات المرور غير متطابقة")
    .required("تأكيد كلمة المرور مطلوب"),
});

const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser, googleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await registerUser(data.username, data.email, data.password);
    if (result.success) {
      toast.success("تم التسجيل بنجاح");
      navigate("/");
    } else {
      toast.error(result.message);
    }
    setIsLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      const result = await googleLogin(credentialResponse.credential);

      if (result.success) {
        toast.success("تم تسجيل الدخول بنجاح");
        navigate("/");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
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
        {/* Header with Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-[#F7F6FB] border-2 border-[#7440E9]">
            <img
              src="/assets/icons/512-512-01.png"
              alt=""
              className="w-12 h-12"
            />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-[#7440E9]">
            إنشاء حساب جديد
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            انضم إلينا وابدأ رحلتك مع مشكاة
          </p>
        </div>
        {/* Form Container */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-0 space-y-4"
          dir="rtl"
        >
          {/* Username Input */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-[#7440E9]"
            >
              اسم المستخدم
            </label>
            <div className="mt-1">
              <input
                {...register("username")}
                type="text"
                className={`appearance-none block w-full px-4 py-3 rounded-lg bg-[#F7F6FB] text-gray-900 border ${
                  errors.username ? "border-red-500" : "border-gray-300"
                } placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7440E9] focus:border-transparent transition duration-150 ease-in-out`}
                placeholder="أدخل اسم المستخدم"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.username.message}
                </p>
              )}
            </div>
          </div>
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#7440E9]"
            >
              البريد الالكتروني
            </label>
            <div className="mt-1">
              <input
                {...register("email")}
                type="email"
                className={`appearance-none block w-full px-4 py-3 rounded-lg bg-[#F7F6FB] text-gray-900 border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7440E9] focus:border-transparent transition duration-150 ease-in-out`}
                placeholder="أدخل البريد الالكتروني"
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
            <div className="mt-1">
              <input
                {...register("password")}
                type="password"
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
          {/* Confirm Password Input */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-[#7440E9]"
            >
              تأكيد كلمة المرور
            </label>
            <div className="mt-1">
              <input
                {...register("confirmPassword")}
                type="password"
                className={`appearance-none block w-full px-4 py-3 rounded-lg bg-[#F7F6FB] text-gray-900 border ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                } placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7440E9] focus:border-transparent transition duration-150 ease-in-out`}
                placeholder="أعد إدخال كلمة المرور"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
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
                جاري إنشاء الحساب...
              </span>
            ) : (
              <span className="flex items-center">
                إنشاء الحساب
                <UserPlus className="w-5 h-5 mr-2" />
              </span>
            )}
          </button>
          {/* Google Sign-In */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => {
                document
                  .querySelector('div[role="button"][tabindex="0"]')
                  ?.click();
              }}
              className="flex items-center gap-3 px-6 py-3 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-[#7440E9] transition-all duration-150 text-[#222] font-semibold text-base focus:outline-none focus:ring-2 focus:ring-[#7440E9]"
            >
              <img src="/assets/google.png" alt="Google" className="w-6 h-6" />
              <span>إنشاء حساب عبر جوجل</span>
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
        {/* زر العودة لتسجيل الدخول */}
        <div className="mt-4 text-center">
          <span className="text-gray-600 text-sm">لديك حساب بالفعل؟ </span>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="ml-2 text-[#7440E9] font-semibold hover:underline hover:text-[#8f5cf7] transition-colors duration-150"
          >
            سجّل دخولك الآن
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
