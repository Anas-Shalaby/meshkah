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
  Filter
} from "lucide-react";

const HeroSection = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 font-[Cairo,Amiri,sans-serif]">
      {/* Hero Section with Animated Background */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full flex flex-col items-center justify-center py-16 sm:py-20 mb-8 bg-gradient-to-br from-purple-900/90 via-indigo-800/90 to-blue-900/90 overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              rotate: -360,
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Logo and Title */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
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
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-full border-4 border-purple-400/50"
              />
            </motion.div>
          </motion.div>

          {/* Title and Subtitle */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-lg mb-4">
              مشكاة
            </h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-purple-200 text-xl sm:text-2xl mb-6 max-w-2xl mx-auto"
            >
              منصة الأحاديث النبوية الشريفة
            </motion.p>
            <p className="text-purple-100 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
              منصة رقمية متكاملة لدراسة الأحاديث النبوية الشريفة مع تحليل ذكي وفوائد عملية
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-6 mt-8 z-10 flex-wrap justify-center"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                <BookOpen className="w-8 h-8 text-purple-300 mb-3" />
              </motion.div>
              <span className="text-3xl sm:text-4xl font-bold text-white mb-1">
                +10,000
              </span>
              <span className="text-purple-200 text-sm">حديث نبوي</span>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
              >
                <Users className="w-8 h-8 text-blue-300 mb-3" />
              </motion.div>
              <span className="text-3xl sm:text-4xl font-bold text-white mb-1">
                +150
              </span>
              <span className="text-blue-200 text-sm">مستخدم نشط</span>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 2 }}
              >
                <Award className="w-8 h-8 text-green-300 mb-3" />
              </motion.div>
              <span className="text-3xl sm:text-4xl font-bold text-white mb-1">
                +100
              </span>
              <span className="text-green-200 text-sm">تحليل ذكي</span>
            </motion.div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                to="/hadiths"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:from-purple-700 hover:to-indigo-700 group"
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
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/20 backdrop-blur-md text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 border border-white/30 hover:bg-white/30 group"
              >
                <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                حديث اليوم
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
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
                <h3 className="text-xl font-bold text-gray-900">البحث المتقدم</h3>
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
                <h3 className="text-xl font-bold text-gray-900">التحليل الذكي</h3>
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
              <span className="text-sm font-medium text-gray-700">آمن 100%</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Globe className="w-8 h-8 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">متوفر 24/7</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Star className="w-8 h-8 text-yellow-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">محتوى موثوق</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Heart className="w-8 h-8 text-pink-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">مجاني بالكامل</span>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
};

export default HeroSection;
