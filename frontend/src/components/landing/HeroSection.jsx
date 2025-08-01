import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, BookOpen, Award, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden mb-5">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5]">
        {/* Reduced Particles */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-300 rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 sm:space-y-8"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 sm:mb-12"
          >
            <motion.img
              src="/logo.svg"
              alt="مشكاة"
              className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mx-auto"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#7440E9] leading-tight"
          >
            مشكاة
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="block text-2xl sm:text-3xl lg:text-4xl text-gray-600 font-normal mt-2"
            >
              منصة الأحاديث النبوية
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg sm:text-xl lg:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed"
          >
            منصة رقمية متكاملة لدراسة الأحاديث النبوية الشريفة
            <br className="hidden sm:block" />
            مع تحليل ذكي وفوائد عملية
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto"
          >
            اكتشف كنوز السنة النبوية بطريقة سهلة وممتعة
            <br className="hidden sm:block" />
            مع أدوات ذكية تساعدك على الفهم والتطبيق
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4 sm:pt-8"
          >
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={`/hadiths`}
                className="inline-block px-8 py-4 sm:px-10 sm:py-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg sm:text-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
              >
                <Sparkles className="inline-block w-5 h-5 mr-2" />
                ابدأ الآن
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={`/daily-hadith`}
                className="inline-block px-8 py-4 sm:px-10 sm:py-5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-lg sm:text-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
              >
                <BookOpen className="inline-block w-5 h-5 mr-2" />
                حديث اليوم
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 sm:mt-16 max-w-4xl mx-auto"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-center mb-3">
                <BookOpen className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-[#7440E9] mb-2">
                +10,000
              </div>
              <div className="text-gray-600 text-sm">حديث نبوي</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-[#7440E9] mb-2">+150</div>
              <div className="text-gray-600 text-sm">مستخدم نشط</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-center mb-3">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-[#7440E9] mb-2">+100</div>
              <div className="text-gray-600 text-sm">تحليل ذكي</div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Reduced Floating Elements */}
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 left-10 w-16 h-16 bg-purple-200 rounded-full opacity-15"
      />
      <motion.div
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-20 right-10 w-24 h-24 bg-indigo-200 rounded-full opacity-15"
      />
    </section>
  );
};

export default HeroSection;
