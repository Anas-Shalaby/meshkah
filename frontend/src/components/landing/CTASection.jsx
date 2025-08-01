import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  Users,
  Award,
  Bot,
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

const CTASection = () => {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <section className="w-full py-20 px-4 bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-200 rounded-full opacity-15 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-indigo-200 rounded-full opacity-15 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-16">
            <h2 className="text-5xl sm:text-6xl font-bold text-[#7440E9] mb-6">
              الأسئلة الشائعة
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              إجابات على أكثر الأسئلة شيوعاً حول منصة مشكاة
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-6">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.02 }}
                viewport={{ once: true }}
                className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 border border-white/20 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-8 py-6 text-right flex items-center justify-between hover:bg-gray-50 transition-all duration-200 group"
                >
                  <span className="font-bold text-gray-800 text-lg sm:text-xl group-hover:text-purple-700 transition-colors duration-200">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === idx ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 ml-4"
                  >
                    {openFaq === idx ? (
                      <ChevronUp className="w-6 h-6 text-purple-600" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-purple-600" />
                    )}
                  </motion.div>
                </button>
                {openFaq === idx && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="px-8 pb-6"
                  >
                    <div className="pt-6">
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Main CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-xl rounded-3xl p-16 shadow-2xl border border-white/20">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-5xl sm:text-6xl font-bold text-[#7440E9] mb-6"
            >
              ابدأ رحلتك الآن
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed"
            >
              انضم إلى آلاف المستخدمين الذين يدرسون الأحاديث النبوية بطريقة سهلة
              وممتعة
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12"
            >
              <div className="text-center">
                <BookOpen className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-[#7440E9]">+10,000</div>
                <div className="text-gray-600 text-lg">حديث نبوي</div>
              </div>
              <div className="text-center">
                <Users className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-[#7440E9]">+150</div>
                <div className="text-gray-600 text-lg">مستخدم نشط</div>
              </div>
              <div className="text-center">
                <Award className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-[#7440E9]">+100</div>
                <div className="text-gray-600 text-lg">تحليل ذكي</div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to="/hadiths"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-200 hover:from-purple-700 hover:to-indigo-700 transform hover:-translate-y-1"
                >
                  <BookOpen className="w-6 h-6" />
                  ابدأ الآن
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to="/register"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-white text-purple-600 font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-200 border-2 border-purple-200 hover:border-purple-300 transform hover:-translate-y-1"
                >
                  <Bot className="w-6 h-6" />
                  انضم إلينا
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
