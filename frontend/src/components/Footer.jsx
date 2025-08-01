import {
  X,
  LucideFacebook,
  InstagramIcon,
  MessageCircleMore,
  Mail,
  MapPin,
  BookOpen,
  Users,
  Award,
  Heart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

const Footer = ({ className = "" }) => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      icon: X,
      href: "https://x.com/mishkahcom1",
      label: "تويتر",
      color: "hover:text-blue-400",
    },
    {
      icon: LucideFacebook,
      href: "https://www.facebook.com/mishkahcom1",
      label: "فيسبوك",
      color: "hover:text-blue-600",
    },
    {
      icon: InstagramIcon,
      href: "https://www.instagram.com/mishkahcom1",
      label: "إنستغرام",
      color: "hover:text-pink-500",
    },
    {
      icon: MessageCircleMore,
      href: "https://whatsapp.com/channel/0029VazdI4N84OmAWA8h4S2F",
      label: "واتساب",
      color: "hover:text-green-500",
    },
  ];

  const quickLinks = [
    { name: "الرئيسية", href: "/" },
    { name: "الأحاديث", href: "/hadiths" },
    { name: "حديث اليوم", href: "/daily-hadith" },
    { name: "البطاقات الدعوية", href: "/public-cards" },
    { name: "سياسة الخصوصية", href: "/privacy-policy" },
    { name: "اتصل بنا", href: "/contact" },
  ];

  const features = [
    { icon: BookOpen, name: "مكتبة شاملة", desc: "أكثر من 10,000 حديث" },
    { icon: Users, name: "مجتمع نشط", desc: "150+ مستخدم" },
    { icon: Award, name: "تحليل ذكي", desc: "100+ تحليل" },
    { icon: Heart, name: "مصدر موثوق", desc: "محتوى معتمد" },
  ];

  return (
    <footer
      className={`font-cairo w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden ${className}`}
      dir="rtl"
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-indigo-500 rounded-full opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Logo and Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.svg" alt="مشكاة" className="w-10 h-10" />
              <h3 className="text-2xl font-bold text-white">مشكاة</h3>
            </div>
            <p className="text-gray-300 leading-relaxed mb-6">
              منصة رقمية متكاملة لدراسة الأحاديث النبوية الشريفة مع تحليل ذكي
              وفوائد عملية
            </p>

            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((link, idx) => (
                <motion.a
                  key={idx}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all duration-300 ${link.color}`}
                  title={link.label}
                >
                  <link.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="text-xl font-bold text-white mb-6">روابط سريعة</h4>
            <div className="space-y-3">
              {quickLinks.map((link, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-purple-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <div className="w-1 h-1 bg-purple-400 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="text-xl font-bold text-white mb-6">المميزات</h4>
            <div className="space-y-4">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3"
                >
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <feature.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{feature.name}</div>
                    <div className="text-gray-400 text-sm">{feature.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="text-xl font-bold text-white mb-6">تواصل معنا</h4>
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="flex items-center gap-3"
              >
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-medium">
                    البريد الإلكتروني
                  </div>
                  <div className="text-gray-400 text-sm">
                    Meshkah@hadith-shareef.com
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
                className="flex items-center gap-3"
              >
                <div className="p-2 bg-purple-600 rounded-lg">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-medium">العنوان</div>
                  <div className="text-gray-400 text-sm">الشرق الأوسط</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="border-t border-gray-700 pt-8 text-center"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {currentYear} مشكاة الأحاديث. جميع الحقوق محفوظة
            </p>
            <div className="flex gap-6 text-sm">
              <Link
                to="/privacy-policy"
                className="text-gray-400 hover:text-purple-400 transition-colors"
              >
                سياسة الخصوصية
              </Link>
              <Link
                to="/contact"
                className="text-gray-400 hover:text-purple-400 transition-colors"
              >
                شروط الاستخدام
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

Footer.propTypes = {
  className: PropTypes.string,
};

export default Footer;
