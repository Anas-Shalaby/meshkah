import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "أحمد محمد",
    role: "طالب علم",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    content:
      "منصة رائعة! ساعدتني كثيراً في فهم الأحاديث النبوية بطريقة سهلة وممتعة. التحليل الذكي ممتاز.",
    rating: 5,
  },
  {
    name: "فاطمة علي",
    role: "معلمة",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    content:
      "أستخدم المنصة في تدريس التربية الإسلامية. الطلاب يحبون التصميم والتحليل الذكي للأحاديث.",
    rating: 5,
  },
  {
    name: "عمر خالد",
    role: "إمام مسجد",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    content:
      "مصدر موثوق ومفيد جداً. أحب خاصية حديث اليوم والتحليل العميق للأحاديث.",
    rating: 5,
  },
  {
    name: "سارة أحمد",
    role: "طالبة جامعية",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    content:
      "التصميم جميل والمنصة سهلة الاستخدام. ساعدتني كثيراً في دراستي للحديث.",
    rating: 5,
  },
  {
    name: "محمد حسن",
    role: "باحث إسلامي",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    content:
      "مصدر ممتاز للباحثين. المكتبة شاملة والتحليل الذكي مفيد جداً للفهم العميق.",
    rating: 5,
  },
  {
    name: "نور الدين",
    role: "مدرس",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    content: "منصة احترافية ومفيدة جداً. أحب التنظيم والتصنيف الجيد للأحاديث.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="w-full py-20 px-4 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-32 h-32 bg-purple-100 rounded-full opacity-30"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-indigo-100 rounded-full opacity-30"></div>
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
            آراء المستخدمين
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            اكتشف ما يقوله المستخدمون عن تجربتهم مع منصة مشكاة
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
              whileHover={{
                scale: 1.02,
                y: -5,
                transition: { duration: 0.3 },
              }}
              className="group relative"
            >
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                {/* Quote Icon */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 + 0.2 }}
                  className="absolute top-6 right-6 text-purple-200 group-hover:text-purple-300 transition-colors"
                >
                  <Quote className="w-8 h-8" />
                </motion.div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.3,
                        delay: idx * 0.1 + 0.3 + i * 0.1,
                      }}
                    >
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    </motion.div>
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-700 leading-relaxed mb-6 text-right">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <motion.img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div>
                    <h4 className="font-bold text-gray-800">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
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
              href="/register"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:from-purple-700 hover:to-indigo-700 transform hover:-translate-y-2"
            >
              انضم إلينا الآن
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
