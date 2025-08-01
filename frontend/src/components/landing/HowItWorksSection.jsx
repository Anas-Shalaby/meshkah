import { motion } from "framer-motion";
import { Search, BookOpen, Brain, Share2, Heart, Users } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "اكتشف الأحاديث",
    description:
      "تصفح مكتبة شاملة من الأحاديث النبوية المصنفة حسب الموضوع والراوي",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: BookOpen,
    title: "اقرأ وتحلل",
    description:
      "اقرأ الحديث مع التحليل الذكي الذي يوضح المعنى والفائدة العملية",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: Brain,
    title: "افهم وتعلم",
    description:
      "احصل على فهم عميق للحديث مع الفوائد العملية والتطبيق في الحياة",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Heart,
    title: "احفظ وشارك",
    description: "احفظ الأحاديث المفضلة في مجموعاتك وشاركها مع الآخرين",
    color: "from-pink-500 to-purple-500",
  },
  {
    icon: Share2,
    title: "انشر المعرفة",
    description:
      "شارك الأحاديث والتحليلات مع أصدقائك على وسائل التواصل الاجتماعي",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Users,
    title: "انضم للمجتمع",
    description: "تواصل مع مجتمع من طلاب العلم وشارك في النقاشات المفيدة",
    color: "from-indigo-500 to-purple-500",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="w-full py-20 px-4 bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-indigo-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-purple-300 rounded-full opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-[#7440E9] mb-6">
            كيف تعمل المنصة؟
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            خطوات بسيطة لبدء رحلتك في دراسة الأحاديث النبوية
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
              whileHover={{
                scale: 1.05,
                y: -10,
                transition: { duration: 0.3 },
              }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl shadow-lg group-hover:shadow-2xl transition-all duration-300 border border-white/20"></div>
              <div className="relative p-8 rounded-3xl text-center h-full">
                {/* Step Number */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 + 0.2 }}
                  className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-sm"
                >
                  {idx + 1}
                </motion.div>

                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg"
                >
                  <step.icon className="w-8 h-8" />
                </motion.div>

                <h3 className="text-xl font-bold text-[#7440E9] mb-4 group-hover:text-purple-700 transition-colors">
                  {step.title}
                </h3>

                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                  {step.description}
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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <a
              href="/hadiths"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:from-purple-700 hover:to-indigo-700 transform hover:-translate-y-2"
            >
              <BookOpen className="w-5 h-5" />
              ابدأ رحلتك الآن
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
