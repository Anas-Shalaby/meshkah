import { BookOpen, Users, Library, Award, Bot, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Calendar,
    title: "حديث اليوم",
    description: "حديث مختار خصيصاً لك كل يوم مع تحليل ذكي ومشاركة سهلة",
    color: "text-[#7440E9]",
    gradient: "from-purple-500 to-indigo-500",
  },
  {
    icon: BookOpen,
    title: "مجموعة الأحاديث",
    description: "مكتبة شاملة من الأحاديث النبوية المصنفة والموثقة",
    color: "text-[#7440E9]",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: Users,
    title: "سير الصحابة",
    description: "قصص ملهمة وسير عطرة للصحابة الكرام",
    color: "text-[#7440E9]",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Library,
    title: "كتب الحديث",
    description: "مصادر موثوقة من كتب الحديث المعتمدة",
    color: "text-[#7440E9]",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    icon: Award,
    title: "إنجازات",
    description: "نظام تحفيزي لتتبع تقدمك في دراسة السيرة",
    color: "text-[#7440E9]",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Bot,
    title: "سراج - المساعد الذكي للأحاديث",
    description:
      "أول روبوت ذكي لتحليل وشرح الأحاديث والإجابة على أسئلتك مباشرة باستخدام الذكاء الاصطناعي. ميزة حصرية لموقعنا!",
    color: "text-[#7440E9]",
    gradient: "from-green-500 to-teal-500",
  },
];

const FeaturesSection = () => (
  <section className="w-full py-20 px-4 bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] text-[#2D3748] font-cairo relative overflow-hidden">
    {/* Background Elements */}
    <div className="absolute inset-0">
      <div className="absolute top-10 right-10 w-24 h-24 bg-purple-200 rounded-full opacity-15 animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-20 h-20 bg-indigo-200 rounded-full opacity-15 animate-pulse delay-1000"></div>
    </div>

    <div className="relative z-10 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl sm:text-5xl font-bold text-[#7440E9] mb-6">
          المميزات الرئيسية
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          اكتشف مجموعة متكاملة من الأدوات والخدمات المصممة خصيصاً لدراسة
          الأحاديث النبوية
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            viewport={{ once: true }}
            whileHover={{
              scale: 1.02,
              y: -5,
              transition: { duration: 0.2 },
            }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl shadow-lg group-hover:shadow-2xl transition-all duration-300 border border-white/20"></div>
            <div className="relative p-8 rounded-3xl text-center h-full">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg"
              >
                <feature.icon className="w-8 h-8" />
              </motion.div>

              <h3 className="text-xl font-bold text-[#7440E9] mb-4 group-hover:text-purple-700 transition-colors">
                {feature.title}
              </h3>

              <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                {feature.description}
              </p>

              {/* Hover Effect */}
              <motion.div
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        viewport={{ once: true }}
        className="text-center mt-16"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-block"
        >
          <a
            href="/hadiths"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:from-purple-700 hover:to-indigo-700 transform hover:-translate-y-1"
          >
            <BookOpen className="w-5 h-5" />
            استكشف جميع المميزات
          </a>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

export default FeaturesSection;
