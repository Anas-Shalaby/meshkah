import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Target,
  ArrowLeft,
  Sparkles,
  Users,
  TrendingUp,
  Heart,
  Share2,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import SEO from "../components/SEO";

const SharedReflectionPage = () => {
  const { shareLink } = useParams();
  const [reflection, setReflection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSharedReflection = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/quran-camps/shared/${shareLink}`
        );

        const data = await response.json();

        if (data.success) {
          setReflection(data.data);
        } else {
          setError(data.message || "لم يتم العثور على التدبر");
        }
      } catch (err) {
        console.error("Error fetching shared reflection:", err);
        setError("حدث خطأ في تحميل التدبر");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedReflection();
  }, [shareLink]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `✨ تدبر قرآني مميز من مخيم "${reflection.camp.name}" 📖\n\n💎 كتبت تدبراً في كلام الله وأحببت أن أشارككم إياه!\n🌟 فوائد قيمة من رحلتي في التدبر والتأمل\n\n🤲 أسأل الله أن ينفعكم به\n💫 من منصة مِشكاة - رحلتك في تدبر القرآن الكريم\n\n${shareUrl}`;
    await navigator.clipboard.writeText(shareText);
    toast.success("تم نسخ الرابط والنص! 🎉");

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#7440E9] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !reflection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            عذراً، التدبر غير متاح
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/quran-camps"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#7440E9] text-white rounded-lg hover:bg-[#5a2fc7] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            تصفح المخيمات القرآنية
          </Link>
        </div>
      </div>
    );
  }

  const getAvatarUrl = (user) => {
    if (!user) return "/default-avatar.png";
    if (user.author.avatar) {
      if (user.author.avatar.startsWith("http")) {
        return user.author.avatar;
      } else if (user.author.avatar.startsWith("/uploads/avatars")) {
        return `${import.meta.env.VITE_IMAGE_API}/api${user.author.avatar}`;
      }
    }
    return "/default-avatar.png";
  };

  return (
    <>
      <SEO
        title={`${reflection.task.title} - ${reflection.camp.name}`}
        description={`تدبر قرآني من مخيم ${reflection.camp.name}`}
        keywords="تدبر, قرآن, مخيمات قرآنية, تفسير, فوائد قرآنية"
      />

      <div className="min-h-screen bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] relative overflow-hidden">
        {/* Animated Background Decorations */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* Floating Sparkles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-[#7440E9]" />
            </motion.div>
          ))}

          {/* Floating Geometric Shapes */}
          <motion.div
            className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-[#7440E9]/10 to-[#5a2fc7]/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-72 h-72 bg-gradient-to-br from-purple-300/20 to-blue-300/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#7440E9] to-[#5a2fc7] text-white py-8 relative overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                backgroundSize: "50px 50px",
              }}
            />
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {/* Logo مشكاة */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30"
                >
                  <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </motion.div>
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-2"
                  >
                    تدبر قرآني مميز
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    ></motion.span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-purple-100 text-sm sm:text-base"
                  >
                    من مخيم{" "}
                    <span className="font-bold">{reflection.camp.name}</span> •
                    منصة مِشكاة
                  </motion.p>
                </div>
              </div>
              {copied ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex font-bold items-center gap-2 px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    <Check className="w-5 h-5" />
                  </motion.div>
                  <span className="hidden sm:inline">تم النسخ!</span>
                </motion.div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="flex font-bold items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="hidden sm:inline">مشاركة</span>
                </motion.button>
              )}
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="space-y-6">
            {/* Reflection Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
              whileHover={{
                y: -5,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
              className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 relative overflow-hidden"
            >
              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#7440E9]/5 to-transparent rounded-bl-full" />

              {/* Header with Author */}
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100 relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#F7F6FB] to-[#F3EDFF] flex items-center justify-center border-2 border-[#7440E9]/30 flex-shrink-0"
                >
                  <img
                    src={getAvatarUrl(reflection)}
                    alt={reflection.author.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                    {reflection.author.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    من مخيم {reflection.camp.name}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(
                        reflection.reflection.completed_at
                      ).toLocaleDateString("ar-SA", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* التدبر والفوائد */}
              <div className="mb-6">
                <div
                  className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: reflection.reflection.content,
                  }}
                />
              </div>

              {/* الخطوة العملية المقترحة */}
              {reflection.reflection.proposed_step && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ x: 5 }}
                  className="p-4 bg-gradient-to-r from-[#F7F6FB] to-[#F3EDFF] border-r-4 border-[#7440E9] rounded-lg relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-[#7440E9]/5 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="flex items-start gap-3 relative z-10">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Target className="w-5 h-5 text-[#7440E9] flex-shrink-0 mt-0.5" />
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-[#7440E9] mb-2">
                        الخطوة العملية المقترحة:
                      </h4>
                      <p className="text-base text-gray-700 leading-relaxed">
                        {reflection.reflection.proposed_step}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Stats Footer */}
              <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-100">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
                >
                  <motion.div
                    whileHover={{ rotate: [0, 10, -10, 0] }}
                    className="p-1.5 bg-purple-100 rounded-lg"
                  >
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </motion.div>
                  <span>{reflection.reflection.upvote_count || 0} إعجاب</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
                >
                  <motion.div
                    whileHover={{ scale: [1, 1.2, 1] }}
                    className="p-1.5 bg-blue-100 rounded-lg"
                  >
                    <Heart className="w-4 h-4 text-blue-600" />
                  </motion.div>
                  <span>{reflection.reflection.save_count || 0} حفظ</span>
                </motion.div>
              </div>
            </motion.div>

            {/* CTA Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gradient-to-r from-[#7440E9] to-[#5a2fc7] rounded-2xl shadow-xl p-8 text-center text-white relative overflow-hidden"
            >
              {/* Animated Background */}
              <motion.div
                className="absolute inset-0 opacity-20"
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
              />

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.3 }}
                className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10"
              >
                <motion.div>
                  <BookOpen className="w-8 h-8 text-white" />
                </motion.div>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold mb-3 relative z-10"
              >
                انضم لمخيماتنا القرآنية
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-purple-100 mb-6 leading-relaxed relative z-10"
              >
                ابدأ رحلتك في تدبر القرآن الكريم مع مجتمع من المتدبرين
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="relative z-10"
              >
                <Link
                  to="/quran-camps"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-[#7440E9] rounded-xl hover:bg-purple-50 transition-all font-bold shadow-lg hover:shadow-xl"
                >
                  <BookOpen className="w-5 h-5" />
                  تصفح المخيمات
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="bg-gradient-to-r from-[#7440E9] to-[#5a2fc7] py-12 mt-12 relative overflow-hidden">
          {/* Animated Background Pattern */}
          <motion.div
            className="absolute inset-0 opacity-10"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              backgroundImage: `radial-gradient(circle, white 2px, transparent 2px)`,
              backgroundSize: "60px 60px",
            }}
          />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-white mb-4"
            >
              ابدأ رحلتك في تدبر القرآن
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-purple-100 mb-8"
            >
              انضم إلى آلاف المتدبرين في مخيماتنا القرآنية
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#7440E9] rounded-xl hover:bg-purple-50 transition-all font-bold text-lg shadow-xl hover:shadow-2xl"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-6 h-6" />
                  </motion.div>
                  سجل الآن مجاناً
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SharedReflectionPage;
