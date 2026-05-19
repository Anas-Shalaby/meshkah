import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from "framer-motion";
import { Player } from "@lottiefiles/react-lottie-player";

/** ضع رابط ملف JSON أو مساراً تحت public، مثال: /assets/login-hero.json */
const LOGIN_LOTTIE_SRC = import.meta.env.VITE_LOGIN_LOTTIE_URL || "";

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
  const [showPassword, setShowPassword] = useState(false);
  const googleLoginWrapRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const triggerGoogleWidgetClick = () => {
    const btn = googleLoginWrapRef.current?.querySelector('div[role="button"]');
    btn?.click();
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await login(data.email, data.password);
    if (result.success) {
      toast.success("تم تسجيل الدخول بنجاح");
      const redirectPath = localStorage.getItem("redirectPath");
      localStorage.removeItem("redirectPath");
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
        localStorage.removeItem("redirectPath");
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
      className="min-h-screen flex flex-col lg:flex-row bg-slate-50 font-cairo overflow-x-hidden"
      dir="rtl"
    >
      {/* لوحة النموذج — على اليسار في الشاشة الكبيرة، أعلى الصفحة في الجوال */}
      <section className="order-1 lg:order-2 w-full lg:w-[40%] lg:min-w-0 lg:shrink-0 min-h-[55vh] lg:min-h-screen flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-20 py-10 lg:py-14 bg-white lg:border-s border-slate-100 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md mx-auto lg:mx-0"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 shadow-lg shadow-indigo-500/25 flex items-center justify-center shrink-0">
              <img
                src="/assets/icons/512-512-01.png"
                alt=""
                className="w-8 h-8"
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                تسجيل الدخول
              </h1>
            </div>
          </div>
          <p className="text-slate-600 text-sm sm:text-base mb-8 leading-relaxed">
            مرحباً بك في مشكاة. سجّل دخولك للوصول إلى المحتوى والمخيمات والرحلات
            العلمية.
          </p>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-slate-500 font-medium">
                أو تابع بـ
              </span>
            </div>
          </div>

          <div className="relative mb-4">
            <button
              type="button"
              onClick={triggerGoogleWidgetClick}
              disabled={isLoading}
              className="group relative w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl text-sm font-semibold text-slate-800 bg-gradient-to-l from-white via-indigo-50/50 to-violet-50/40 border border-indigo-200/70 shadow-sm shadow-indigo-950/5 transition-all duration-200 hover:border-indigo-400 hover:from-indigo-50/90 hover:via-indigo-50/70 hover:to-violet-50/60 hover:shadow-md hover:shadow-indigo-500/15 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2 disabled:opacity-60 disabled:active:scale-100"
            >
              <img
                src="/assets/google.png"
                alt=""
                className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105"
              />
              تسجيل الدخول عبر Google
            </button>
            {/* يبقى في تدفق المستند ليعمل مكوّن Google؛ غير مرئي لكن قابل للنقر برمجياً */}
            <div
              ref={googleLoginWrapRef}
              className="absolute left-0 top-0 w-px h-px opacity-0 overflow-hidden pointer-events-none"
              aria-hidden
            >
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleFailure}
              />
            </div>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-800"
              >
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  {...register("email")}
                  type="email"
                  id="email"
                  autoComplete="email"
                  className={`block w-full pr-10 pl-4 py-3 rounded-xl border text-slate-900 placeholder:text-slate-400 transition-all duration-200 ${
                    errors.email
                      ? "border-red-300 bg-red-50/80 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-200 bg-slate-50/80 focus:border-indigo-500 focus:ring-indigo-500 focus:bg-white"
                  } focus:outline-none focus:ring-2 focus:ring-opacity-40`}
                  placeholder="البريد الإلكتروني"
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="text-sm text-red-600"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-800"
              >
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="current-password"
                  className={`block w-full pr-10 pl-12 py-3 rounded-xl border text-slate-900 placeholder:text-slate-400 transition-all duration-200 ${
                    errors.password
                      ? "border-red-300 bg-red-50/80 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-200 bg-slate-50/80 focus:border-indigo-500 focus:ring-indigo-500 focus:bg-white"
                  } focus:outline-none focus:ring-2 focus:ring-opacity-40`}
                  placeholder="كلمة المرور"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={
                    showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="text-sm text-red-600"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-300 ${
                isLoading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35"
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </motion.form>

          <p className="mt-8 text-center text-slate-600 text-sm">
            ليس لديك حساب؟{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
            >
              إنشاء حساب
            </button>
          </p>
        </motion.div>
      </section>

      {/* الجانب البصري — يمين الشاشة على سطح المكتب؛ أسفل النموذج على الجوال */}
      <section
        className="order-2 lg:order-1 w-full lg:w-[60%] lg:min-w-0 lg:shrink-0 min-h-[40vh] lg:min-h-screen relative flex items-center justify-center px-8 py-12 lg:py-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 text-white overflow-hidden"
        aria-hidden={false}
      >
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full bg-indigo-500 blur-[100px]" />
          <div className="absolute bottom-1/4 -left-16 w-80 h-80 rounded-full bg-violet-600 blur-[90px]" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_left,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:48px_48px] opacity-50" />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55 }}
          className="relative z-10 w-full max-w-lg flex flex-col items-center text-center"
        >
          {LOGIN_LOTTIE_SRC ? (
            <div className="w-full max-w-[min(100%,420px)] aspect-square flex items-center justify-center">
              <Player
                autoplay
                loop
                src={LOGIN_LOTTIE_SRC}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          ) : (
            <div className="w-full max-w-[min(100%,380px)] aspect-square rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-8">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-amber-200" />
              </div>
              <p className="text-white/90 text-lg font-semibold">
                مساحة الأنيميشن
              </p>
              <p className="text-white/60 text-sm leading-relaxed max-w-xs">
                عند جاهزية ملف Lottie، أضف المسار في ملف{" "}
                <code className="text-amber-200/90 text-xs bg-black/20 px-1.5 py-0.5 rounded">
                  .env
                </code>{" "}
                كـ{" "}
                <code className="text-amber-200/90 text-xs bg-black/20 px-1.5 py-0.5 rounded block mt-2">
                  VITE_LOGIN_LOTTIE_URL=/assets/your-animation.json
                </code>
              </p>
            </div>
          )}

          <h2 className="mt-8 text-xl sm:text-2xl font-bold text-white/95 max-w-md leading-snug">
            تعلّم بثبات، خطوة بعد خطوة
          </h2>
          <p className="mt-3 text-sm sm:text-base text-indigo-200/90 max-w-sm leading-relaxed">
            منصة موحّدة للمخيمات والمتابعة اليومية — بتجربة قريبة من أكاديميات
            التعلّم الحديثة.
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default Login;
