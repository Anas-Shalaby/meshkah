import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { UserPlus, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, User, Shield } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from "framer-motion";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 font-cairo relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-green-200 to-blue-200 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Enhanced Card Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-200/50 p-6 sm:p-8"
          >
            {/* Enhanced Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center mb-8"
            >
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                  <img
                    src="/assets/icons/512-512-01.png"
                    alt="مشكاة"
                    className="w-12 h-12 sm:w-14 sm:h-14"
                  />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              </div>
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-2xl sm:text-3xl font-bold text-gray-800"
              >
                انضم إلى مشكاة
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-2 text-sm text-gray-600"
              >
                أنشئ حسابك وابدأ رحلتك مع الأحاديث والعلوم الإسلامية
              </motion.p>
            </motion.div>

            {/* Enhanced Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              dir="rtl"
            >
              {/* Username Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                  اسم المستخدم
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register("username")}
                    type="text"
                    id="username"
                    className={`block w-full pr-10 pl-4 py-3 rounded-xl border transition-all duration-200 ${
                      errors.username
                        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-200 bg-gray-50 focus:border-purple-500 focus:ring-purple-500 focus:bg-white"
                    } placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    placeholder="أدخل اسم المستخدم"
                  />
                </div>
                <AnimatePresence>
                  {errors.username && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-red-500 flex items-center gap-1"
                    >
                      {errors.username.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Email Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register("email")}
                    type="email"
                    id="email"
                    className={`block w-full pr-10 pl-4 py-3 rounded-xl border transition-all duration-200 ${
                      errors.email
                        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-200 bg-gray-50 focus:border-purple-500 focus:ring-purple-500 focus:bg-white"
                    } placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    placeholder="أدخل بريدك الإلكتروني"
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-red-500 flex items-center gap-1"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Password Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-2"
              >
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  كلمة المرور
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className={`block w-full pr-10 pl-12 py-3 rounded-xl border transition-all duration-200 ${
                      errors.password
                        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-200 bg-gray-50 focus:border-purple-500 focus:ring-purple-500 focus:bg-white"
                    } placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    placeholder="أدخل كلمة المرور"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-red-500 flex items-center gap-1"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Confirm Password Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-2"
              >
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    className={`block w-full pr-10 pl-12 py-3 rounded-xl border transition-all duration-200 ${
                      errors.confirmPassword
                        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-200 bg-gray-50 focus:border-purple-500 focus:ring-purple-500 focus:bg-white"
                    } placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    placeholder="أعد إدخال كلمة المرور"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-red-500 flex items-center gap-1"
                    >
                      {errors.confirmPassword.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Enhanced Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-300 ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
              >
                {isLoading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري إنشاء الحساب...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <span>إنشاء الحساب</span>
                    <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </motion.div>
                )}
              </motion.button>

              {/* Enhanced Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="relative my-6"
              >
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">أو</span>
                </div>
              </motion.div>

              {/* Enhanced Google Sign-In */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="flex justify-center"
              >
                <button
                  type="button"
                  onClick={() => {
                    document.querySelector('div[role="button"][tabindex="0"]')?.click();
                  }}
                  className="flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300 text-gray-700 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 group"
                >
                  <img src="/assets/google.png" alt="Google" className="w-5 h-5" />
                  <span>التسجيل عبر جوجل</span>
                </button>
                <div style={{ display: "none" }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleFailure}
                  />
                </div>
              </motion.div>
            </motion.form>

            {/* Enhanced Navigation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-6 text-center"
            >
              <span className="text-gray-600 text-sm">لديك حساب بالفعل؟ </span>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-purple-600 font-semibold hover:text-purple-700 transition-colors duration-200 flex items-center gap-1 mx-auto mt-2 group"
              >
                <span>تسجيل الدخول</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
