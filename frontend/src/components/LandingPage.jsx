import HeroSection from "./landing/HeroSection";
import FeaturesSection from "./landing/FeaturesSection";
import HowItWorksSection from "./landing/HowItWorksSection";
import CTASection from "./landing/CTASection";
import DailyHadithWidget from "./DailyHadithWidget";
import React, { Suspense } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
// import SiteStatsSection from "./landing/SiteStatsSection";
const SiteStatsSection = React.lazy(() => import("./landing/SiteStatsSection"));

const LandingPage = ({ language = "ar" }) => {
  return (
    <div
      className="min-h-screen relative overflow-x-hidden font-cairo"
      style={{ direction: "rtl" }}
    >
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] dark:from-[#1B1333] dark:via-[#2D1A4A] dark:to-[#181024]" />

        {/* Reduced Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-300 rounded-full opacity-15"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.15, 0.4, 0.15],
              }}
              transition={{
                duration: 5 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <HeroSection language={"ar"} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <Suspense
            fallback={
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-2 text-gray-600">جاري تحميل الإحصائيات...</p>
              </div>
            }
          >
            <SiteStatsSection />
          </Suspense>
        </motion.div>

        {/* Daily Hadith Widget */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <section className="w-full py-16 px-4 bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5] relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute top-10 right-10 w-24 h-24 bg-purple-200 rounded-full opacity-15 animate-pulse"></div>
              <div className="absolute bottom-10 left-10 w-20 h-20 bg-indigo-200 rounded-full opacity-15 animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-[#7440E9] mb-4">
                  حديث اليوم
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  حديث مختار خصيصاً لك كل يوم مع تحليل ذكي وفوائد عملية
                </p>
              </motion.div>

              <DailyHadithWidget />
            </div>
          </section>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <FeaturesSection language={"ar"} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <HowItWorksSection language={"ar"} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <CTASection language={"ar"} />
        </motion.div>
      </div>
    </div>
  );
};

LandingPage.propTypes = {
  language: PropTypes.string,
};

export default LandingPage;
