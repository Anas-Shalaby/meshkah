import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Star,
  Heart,
  Shield,
  Globe,
  Search,
  Filter,
} from "lucide-react";

const HeroSection = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] font-[Cairo,Amiri,sans-serif]">
      {/* Hero Section with Clean Background */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full flex flex-col items-center justify-center  mb-8 bg-white/80 backdrop-blur-sm overflow-hidden"
      >
        {/* Purple Dots Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large Purple Dots */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-20 right-20 w-32 h-32 bg-[#7440E9]/20 rounded-full blur-xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute bottom-20 left-20 w-40 h-40 bg-[#7440E9]/15 rounded-full blur-2xl"
          />

          {/* Multiple Small Purple Dots */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-[#7440E9]/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.8, 0.2],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Medium Purple Dots */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`medium-${i}`}
              className="absolute w-6 h-6 bg-[#7440E9]/25 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.7, 0.3],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Main Content - Split Layout */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 mb-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center min-h-[70vh] lg:min-h-[80vh]">
            {/* Right Side - Text Content */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-center lg:text-right space-y-8"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="mb-8"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative inline-block"
                >
                  <motion.img
                    src="/logo.svg"
                    alt="مشكاة"
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white/30 shadow-2xl object-contain"
                  />
                  <motion.div className="absolute inset-0 rounded-full border-4 border-purple-400/50" />
                </motion.div>
              </motion.div>

              {/* Title and Subtitle */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="space-y-4"
              >
                <motion.h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#7440E9] drop-shadow-sm"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
                >
                  مشكاة
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="text-gray-700 text-xl sm:text-2xl font-semibold"
                >
                  منصة الأحاديث النبوية الشريفة
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-gray-600 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0"
                >
                  منصة رقمية متكاملة لدراسة الأحاديث النبوية الشريفة مع تحليل
                  ذكي وفوائد عملية
                </motion.p>{" "}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-8"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <a
                    href="https://play.google.com/store/apps/details?id=com.mishkat_almasabih.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-1 bg-[#7440E9] text-white font-bold text-md rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[#6B3CD6] group"
                  >
                    حمل التطبيق
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                  </a>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to="/hadiths"
                    className="inline-flex items-center gap-3 px-8 py-1 bg-white text-[#7440E9] font-bold text-md rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-[#7440E9] hover:bg-[#7440E9] hover:text-white group"
                  >
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    ابدأ الآن
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to="/daily-hadith"
                    className="inline-flex items-center gap-3 px-8 py-1 bg-gray-100 text-gray-700 font-bold text-md rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-200 group"
                  >
                    <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    حديث اليوم
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Left Side - App Image */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex justify-center lg:justify-start"
            >
              <motion.div
                initial={{ scale: 0.8, rotateY: -15 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{
                  delay: 0.8,
                  duration: 1,
                  type: "spring",
                  stiffness: 100,
                }}
                className="relative"
              >
                {/* Simple Background Elements */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-4 -left-4 w-8 h-8 bg-[#7440E9]/20 rounded-full"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="absolute -bottom-4 -right-4 w-6 h-6 bg-[#7440E9]/15 rounded-full"
                />

                {/* Main App Image */}
                <motion.div whileHover={{ scale: 1.05 }} className="relative">
                  <motion.img
                    src="/assets/hero_image.png"
                    alt="تطبيق مشكاة"
                    className="w-64 sm:w-[100%] h-auto max-w-full object-contain drop-shadow-2xl"
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  {/* Simple Shadow */}
                  <div className="absolute inset-0 bg-[#7440E9]/10 rounded-3xl blur-lg -z-10"></div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Stats Cards - Moved Below */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="flex gap-6 mt-16 z-10 flex-wrap justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#7440E9]/20 shadow-lg"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                <BookOpen className="w-8 h-8 text-[#7440E9] mb-3" />
              </motion.div>
              <span className="text-3xl sm:text-4xl font-bold text-[#7440E9] mb-1">
                +10,000
              </span>
              <span className="text-gray-600 text-sm">حديث نبوي</span>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#7440E9]/20 shadow-lg"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
              >
                <Users className="w-8 h-8 text-[#7440E9] mb-3" />
              </motion.div>
              <span className="text-3xl sm:text-4xl font-bold text-[#7440E9] mb-1">
                +150
              </span>
              <span className="text-gray-600 text-sm">مستخدم نشط</span>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#7440E9]/20 shadow-lg"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 2 }}
              >
                <Award className="w-8 h-8 text-[#7440E9] mb-3" />
              </motion.div>
              <span className="text-3xl sm:text-4xl font-bold text-[#7440E9] mb-1">
                +100
              </span>
              <span className="text-gray-600 text-sm">تحليل ذكي</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Search Feature Card */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-200/50 p-6 sm:p-8"
          >
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  البحث المتقدم
                </h3>
                <p className="text-gray-600 text-sm">ابحث في آلاف الأحاديث</p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">
              ابحث عن الأحاديث باستخدام كلمات مفتاحية أو تصفح التصنيفات المختلفة
            </p>
          </motion.div>

          {/* Analysis Feature Card */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-200/50 p-6 sm:p-8"
          >
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  التحليل الذكي
                </h3>
                <p className="text-gray-600 text-sm">فهم أعمق للأحاديث</p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">
              تحليل ذكي للأحاديث مع شرح مبسط وفوائد عملية للتطبيق
            </p>
          </motion.div>

          {/* Bookmarks Feature Card */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-200/50 p-6 sm:p-8"
          >
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">المفضلة</h3>
                <p className="text-gray-600 text-sm">احفظ أحاديثك المفضلة</p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">
              احفظ الأحاديث المفضلة وأنشئ مجموعات خاصة لتنظيمها
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Trust Indicators */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12"
      >
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-200/50 p-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center">
              <Shield className="w-8 h-8 text-green-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">
                آمن 100%
              </span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Globe className="w-8 h-8 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">
                متوفر 24/7
              </span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Star className="w-8 h-8 text-yellow-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">
                محتوى موثوق
              </span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Heart className="w-8 h-8 text-pink-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">
                مجاني بالكامل
              </span>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
};

export default HeroSection;
