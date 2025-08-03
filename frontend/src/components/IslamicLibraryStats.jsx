import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, BookMarked, FileText, TrendingUp, Users, Clock } from "lucide-react";
import { getTranslation } from "../utils/translations";

const IslamicLibraryStats = ({ language }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/islamic-library/statistics`
      );
      const data = await response.json();
      
      if (data.status === 200) {
        setStats(data.statistics);
      } else {
        setError("Failed to fetch statistics");
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setError("Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-purple-200/50 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-purple-200 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-purple-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200/50 shadow-lg">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            {getTranslation(language, "errorLoadingStats")}
          </h3>
          <p className="text-red-600 text-sm">
            {getTranslation(language, "tryAgainLater")}
          </p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      icon: BookOpen,
      title: getTranslation(language, "totalBooks"),
      value: stats.totalBooks,
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      icon: FileText,
      title: getTranslation(language, "totalHadiths"),
      value: stats.totalHadiths.toLocaleString(),
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: BookMarked,
      title: getTranslation(language, "totalChapters"),
      value: stats.totalChapters,
      color: "green",
      gradient: "from-green-500 to-green-600",
    },
    {
      icon: TrendingUp,
      title: getTranslation(language, "categories"),
      value: Object.keys(stats.booksByCategory).length,
      color: "orange",
      gradient: "from-orange-500 to-orange-600",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-purple-200/50 shadow-xl"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
        >
          <BookOpen className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          {getTranslation(language, "libraryStatistics")}
        </h2>
        <p className="text-gray-600 text-sm md:text-base">
          {getTranslation(language, "comprehensiveIslamicLibrary")}
        </p>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            variants={cardVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  {stat.title}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Category Statistics */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
          {getTranslation(language, "booksByCategory")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stats.booksByCategory).map(([categoryId, category], index) => (
            <motion.div
              key={categoryId}
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-purple-200/50 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {language === "ar" ? category.name : language === "en" ? category.nameEn : category.nameUr}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {category.count} {getTranslation(language, "books")}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-600">
                    {category.hadiths.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getTranslation(language, "hadiths")}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    

      {/* Last Updated */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center space-x-2 space-x-reverse text-gray-500 text-xs">
          <Clock className="w-4 h-4" />
          <span>
            {getTranslation(language, "lastUpdated")}: {new Date(stats.lastUpdated).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default IslamicLibraryStats; 