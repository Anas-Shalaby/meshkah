import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  Users,
  Award,
  Bot,
  Star,
  Heart,
  Shield,
  Globe,
  Sparkles,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "هل المنصة مجانية؟",
    answer:
      "نعم، المنصة مجانية بالكامل. يمكنك الوصول لجميع المميزات دون أي رسوم. نحن نؤمن بأهمية نشر العلم الشرعي وتسهيل الوصول إليه لجميع المسلمين.",
  },
  {
    question: "كيف يمكنني البحث عن حديث معين؟",
    answer:
      "يمكنك البحث باستخدام كلمات مفتاحية، أو تصفح التصنيفات المختلفة مثل الأحاديث الصحيحة، الضعيفة، أو حسب الراوي. كما يمكنك استخدام خاصية البحث المتقدم للحصول على نتائج أكثر دقة.",
  },
  {
    question: "ما هو التحليل الذكي للأحاديث؟",
    answer:
      "التحليل الذكي يستخدم الذكاء الاصطناعي لتوضيح معنى الحديث، الفوائد العملية، وكيفية تطبيقه في الحياة اليومية. يساعدك على فهم أعمق للحديث وتطبيقه في حياتك.",
  },
  {
    question: "هل يمكنني حفظ الأحاديث المفضلة؟",
    answer:
      "نعم، يمكنك إنشاء مجموعات خاصة وحفظ الأحاديث المفضلة مع إضافة ملاحظات شخصية. يمكنك تنظيم الأحاديث حسب الموضوع أو الراوي أو أي تصنيف تفضله.",
  },
  {
    question: "كيف يمكنني مشاركة الأحاديث؟",
    answer:
      "يمكنك مشاركة الأحاديث على وسائل التواصل الاجتماعي أو إنشاء بطاقات دعوية جميلة للمشاركة. كما يمكنك مشاركة التحليلات والفوائد مع أصدقائك وعائلتك.",
  },
  {
    question: "هل المحتوى موثوق؟",
    answer:
      "نعم، جميع الأحاديث من مصادر موثوقة ومعتمدة في كتب الحديث المعروفة. نحن نحرص على التحقق من صحة كل حديث قبل نشره على المنصة.",
  },
  {
    question: "هل يمكنني استخدام المنصة على الموبايل؟",
    answer:
      "نعم، المنصة متوافقة تماماً مع جميع الأجهزة. يمكنك استخدامها على الهاتف المحمول أو الكمبيوتر أو التابلت بسهولة.",
  },
  {
    question: "كيف يمكنني التواصل مع الفريق؟",
    answer:
      "يمكنك التواصل معنا عبر صفحة 'اتصل بنا' أو عبر وسائل التواصل الاجتماعي. نحن متاحون دائماً للإجابة على استفساراتكم ومساعدتكم.",
  },
];

const features = [
  {
    icon: BookOpen,
    title: "أحاديث موثوقة",
    description: "جميع الأحاديث من مصادر معتمدة ومتحقق من صحتها",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-100",
    textColor: "text-purple-800",
  },
  {
    icon: Sparkles,
    title: "تحليل ذكي",
    description: "فهم أعمق للأحاديث مع تحليل ذكي وشرح مبسط",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
  },
  {
    icon: Heart,
    title: "حفظ مفضل",
    description: "احفظ أحاديثك المفضلة وأنشئ مجموعات خاصة",
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-100",
    textColor: "text-pink-800",
  },
  {
    icon: Shield,
    title: "محتوى آمن",
    description: "منصة آمنة ومحترمة تناسب جميع الأعمار",
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
  },
  {
    icon: Globe,
    title: "متوفر دائماً",
    description: "استخدم المنصة على أي جهاز وفي أي وقت",
    color: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-100",
    textColor: "text-indigo-800",
  },
  {
    icon: Star,
    title: "مجاني بالكامل",
    description: "جميع المميزات متاحة مجاناً دون أي رسوم",
    color: "from-yellow-500 to-yellow-600",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
  },
];

const stats = [
  {
    icon: BookOpen,
    number: "+10,000",
    label: "حديث نبوي",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    icon: Users,
    number: "+150",
    label: "مستخدم نشط",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    icon: Award,
    number: "+100",
    label: "تحليل ذكي",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
];

const CTASection = () => {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <section className="w-full py-20 px-4 bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-200 rounded-full opacity-15 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-indigo-200 rounded-full opacity-15 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-200 rounded-full opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-4xl sm:text-5xl font-bold text-[#7440E9] mb-6"
            >
              مميزات المنصة
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
            >
              اكتشف ما يجعل منصة مشكاة الخيار الأمثل لدراسة الأحاديث النبوية
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 h-full">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-[#7440E9] mb-6">
              الأسئلة الشائعة
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              إجابات على أكثر الأسئلة شيوعاً حول منصة مشكاة
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-4">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 overflow-hidden group"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-8 py-6 text-right flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 group"
                >
                  <span className="font-bold text-gray-800 text-lg sm:text-xl group-hover:text-purple-700 transition-colors duration-300">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ 
                      rotate: openFaq === idx ? 180 : 0
                    }}
                    transition={{ 
                      duration: 0.5, 
                      ease: [0.4, 0, 0.2, 1] 
                    }}
                    className="flex-shrink-0 ml-4 p-2 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-colors duration-300"
                  >
                    <ChevronDown className="w-5 h-5 text-purple-600" />
                  </motion.div>
                </button>
                
                <AnimatePresence initial={false}>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ 
                        opacity: 0,
                        height: 0,
                        scale: 0.95
                      }}
                      animate={{ 
                        opacity: 1,
                        height: "auto",
                        scale: 1
                      }}
                      exit={{ 
                        opacity: 0,
                        height: 0,
                        scale: 0.95
                      }}
                      transition={{ 
                        duration: 0.6,
                        ease: [0.4, 0, 0.2, 1],
                        opacity: { duration: 0.4 }
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-6">
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.4,
                            delay: 0.2,
                            ease: [0.4, 0, 0.2, 1]
                          }}
                          className="pt-4 border-t border-purple-100"
                        >
                          <p className="text-gray-700 leading-relaxed text-lg">
                            {faq.answer}
                          </p>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/20">
            <div className="text-center mb-12">
              <h3 className="text-3xl sm:text-4xl font-bold text-[#7440E9] mb-4">
                إحصائيات المنصة
              </h3>
              <p className="text-lg text-gray-600">
                أرقام تتحدث عن نجاح منصة مشكاة
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center group"
                >
                  <div className={`w-20 h-20 ${stat.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`w-10 h-10 ${stat.color}`} />
                  </div>
                  <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                    {stat.number}
                  </div>
                  <div className="text-gray-600 text-lg">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-xl rounded-3xl p-16 shadow-2xl border border-white/20 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-purple-200 rounded-full opacity-20"></div>
            <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-blue-200 rounded-full opacity-20"></div>

            <div className="relative z-10">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-4xl sm:text-5xl font-bold text-[#7440E9] mb-6"
              >
                ابدأ رحلتك الآن
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed"
              >
                انضم إلى آلاف المستخدمين الذين يدرسون الأحاديث النبوية بطريقة سهلة وممتعة
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to="/hadiths"
                    className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:from-purple-700 hover:to-indigo-700 group"
                  >
                    <BookOpen className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                    ابدأ الآن
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                  </Link>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-3 px-10 py-5 bg-white text-purple-600 font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 border-2 border-purple-200 hover:border-purple-300 group"
                  >
                    <Bot className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    انضم إلينا
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </motion.div>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="mt-12 flex flex-wrap justify-center items-center gap-6 text-gray-500"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-sm">آمن 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">متوفر 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <span className="text-sm">مجاني بالكامل</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
