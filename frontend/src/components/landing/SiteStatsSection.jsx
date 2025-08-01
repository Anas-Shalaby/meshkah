import { motion } from "framer-motion";
import { Users, BookOpen, Award, Clock, Heart, Share2 } from "lucide-react";

const stats = [
  {
    icon: BookOpen,
    number: "10,000+",
    label: "حديث نبوي",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Users,
    number: "150+",
    label: "مستخدم نشط",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: Award,
    number: "100+",
    label: "تحليل ذكي",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Clock,
    number: "24/7",
    label: "متاح دائماً",
    color: "from-pink-500 to-purple-500",
  },
  {
    icon: Heart,
    number: "95%",
    label: "رضا المستخدمين",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Share2,
    number: "1M+",
    label: "مشاركة",
    color: "from-indigo-500 to-purple-500",
  },
];

const SiteStatsSection = () => {
  return (
    <section className="w-full py-20 px-4 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-100 rounded-full opacity-30"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-indigo-100 rounded-full opacity-30"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-purple-200 rounded-full opacity-20"></div>
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
            إحصائيات المنصة
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            أرقام تتحدث عن نجاح منصة مشكاة في خدمة المجتمع الإسلامي
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.map((stat, idx) => (
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
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 text-center">
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg"
                >
                  <stat.icon className="w-8 h-8" />
                </motion.div>

                {/* Number */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 + 0.2 }}
                  className="text-4xl font-bold text-[#7440E9] mb-3"
                >
                  {stat.number}
                </motion.div>

                {/* Label */}
                <div className="text-gray-600 font-medium text-lg">
                  {stat.label}
                </div>

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

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-8 shadow-lg border border-purple-100">
            <h3 className="text-2xl font-bold text-[#7440E9] mb-4">
              منصة موثوقة ومفيدة
            </h3>
            <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto">
              منصة مشكاة هي منصة رقمية متكاملة تهدف إلى تسهيل دراسة الأحاديث
              النبوية الشريفة وتقديمها بطريقة عصرية ومفيدة. نحن نؤمن بأهمية نشر
              العلم الشرعي وتسهيل الوصول إليه لجميع المسلمين في جميع أنحاء
              العالم.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SiteStatsSection;
