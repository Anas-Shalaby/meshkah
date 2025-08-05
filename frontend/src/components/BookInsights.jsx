import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  BarChart3,
  Clock,
  Target,
  TrendingUp,
  Users,
  Calendar,
  BookMarked,
  FileText,
  Layers,
  Star,
  Award,
} from "lucide-react";
import { getTranslation } from "../utils/translations";

const BookInsights = ({ bookSlug, language }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, [bookSlug]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/islamic-library/local-books/${bookSlug}/insights`
      );
      const data = await response.json();
      
      if (data.status === 200) {
        setInsights(data);
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200/50 shadow-lg">
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

  if (!insights) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200/50 shadow-lg"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
        >
          <BarChart3 className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          {getTranslation(language, "bookInsights")}
        </h2>
        <p className="text-gray-600 text-sm md:text-base">
          {getTranslation(language, "comprehensiveBookAnalysis")}
        </p>
      </div>

      {/* Book Info */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6 border border-purple-200/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {language === "ar" 
                ? insights.book.bookName 
                : insights.book.bookNameEn}
            </h3>
            <p className="text-sm text-gray-600">
              {insights.book.writerName} • {insights.book.hadiths_count} {getTranslation(language, "hadiths")}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>{getTranslation(language, "localBook")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200"
        >
          <div className="flex items-center space-x-3 space-x-reverse mb-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">
              {getTranslation(language, "totalChapters")}
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {insights.insights.totalChapters}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200"
        >
          <div className="flex items-center space-x-3 space-x-reverse mb-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              {getTranslation(language, "totalHadiths")}
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {insights.insights.totalHadiths.toLocaleString()}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200"
        >
          <div className="flex items-center space-x-3 space-x-reverse mb-2">
            <Clock className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {getTranslation(language, "readingTime")}
            </span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {insights.insights.estimatedTotalReadingTime}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200"
        >
          <div className="flex items-center space-x-3 space-x-reverse mb-2">
            <Target className="w-6 h-6 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">
              {getTranslation(language, "avgPerChapter")}
            </span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {insights.insights.averageHadithsPerChapter}
          </div>
        </motion.div>
      </div>

      {/* Book Structure */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-6 border border-indigo-200">
        <div className="flex items-center space-x-3 space-x-reverse mb-3">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h4 className="font-semibold text-gray-900">
            {getTranslation(language, "bookStructure")}
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">
              {getTranslation(language, "organization")}:
            </span>
            <span className="text-gray-600 ml-2">
              {insights.insights.bookStructure.organization}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">
              {getTranslation(language, "chapterType")}:
            </span>
            <span className="text-gray-600 ml-2">
              {insights.insights.bookStructure.chapterTypes}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">
              {getTranslation(language, "multipleChapters")}:
            </span>
            <span className="text-gray-600 ml-2">
              {insights.insights.bookStructure.hasMultipleChapters ? getTranslation(language, "yes") : getTranslation(language, "no")}
            </span>
          </div>
        </div>
      </div>

      {/* Chapter Analysis */}
      {insights.insights.longestChapter && insights.insights.shortestChapter && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200"
          >
            <div className="flex items-center space-x-3 space-x-reverse mb-3">
              <Award className="w-5 h-5 text-green-600" />
              <h5 className="font-semibold text-gray-900">
                {getTranslation(language, "longestChapter")}
              </h5>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600 mb-1">
                {language === "ar" 
                  ? insights.insights.longestChapter.title 
                  : insights.insights.longestChapter.titleEn}
              </div>
              <div className="text-sm text-gray-600">
                {insights.insights.longestChapter.hadithsCount} {getTranslation(language, "hadiths")}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200"
          >
            <div className="flex items-center space-x-3 space-x-reverse mb-3">
              <BookMarked className="w-5 h-5 text-blue-600" />
              <h5 className="font-semibold text-gray-900">
                {getTranslation(language, "shortestChapter")}
              </h5>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600 mb-1">
                {language === "ar" 
                  ? insights.insights.shortestChapter.title 
                  : insights.insights.shortestChapter.titleEn}
              </div>
              <div className="text-sm text-gray-600">
                {insights.insights.shortestChapter.hadithsCount} {getTranslation(language, "hadiths")}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reading Recommendations */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
        <div className="flex items-center space-x-3 space-x-reverse mb-3">
          <TrendingUp className="w-5 h-5 text-yellow-600" />
          <h4 className="font-semibold text-gray-900">
            {getTranslation(language, "readingRecommendations")}
          </h4>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-700">
              {getTranslation(language, "recommendation1")}
            </span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-700">
              {getTranslation(language, "recommendation2")}
            </span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-700">
              {getTranslation(language, "recommendation3")}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookInsights; 