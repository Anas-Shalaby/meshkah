import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Clock, 
  Info, 
  Hash,
  Home,
  Library,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { getTranslation } from "../utils/translations";

const IslamicChapterNavigation = ({ bookSlug, chapterNumber, book, language, onChapterChange }) => {
  const [navigation, setNavigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchNavigation();
  }, [bookSlug, chapterNumber, book]);

  const fetchNavigation = async () => {
    try {
      setLoading(true);
      
      if (book?.isLocal) {
        // For local books, use the local navigation endpoint
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/islamic-library/local-books/${bookSlug}/chapters/${chapterNumber}/navigation`
        );
        const data = await response.json();
        
        if (data.status === 200) {
          setNavigation(data.navigation);
        }
      } else {
        // For external books, use the external API navigation endpoint
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/islamic-library/books/${bookSlug}/chapters/${chapterNumber}/navigation`
        );
        const data = await response.json();
        
        if (data.status === 200) {
          setNavigation(data.navigation);
        } else {
          // Fallback to basic navigation if API fails
          const currentChapter = parseInt(chapterNumber);
          const totalChapters = book?.chapters_count || 1;
          
          setNavigation({
            current: {
              id: currentChapter,
              title: `Chapter ${currentChapter}`,
              titleEn: `Chapter ${currentChapter}`,
              hadithsCount: 0
            },
            previous: currentChapter > 1 ? {
              id: currentChapter - 1,
              title: `Chapter ${currentChapter - 1}`,
              titleEn: `Chapter ${currentChapter - 1}`
            } : null,
            next: currentChapter < totalChapters ? {
              id: currentChapter + 1,
              title: `Chapter ${currentChapter + 1}`,
              titleEn: `Chapter ${currentChapter + 1}`
            } : null,
            totalChapters: totalChapters,
            currentChapterIndex: currentChapter
          });
        }
      }
    } catch (error) {
      console.error("Error fetching navigation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterChange = (newChapterId) => {
    if (onChapterChange) {
      onChapterChange(newChapterId);
    } else {
      // Navigate to the new chapter based on book type
      if (book?.isLocal) {
        window.location.href = `/islamic-library/local-books/${bookSlug}/chapter/${newChapterId}`;
      } else {
        window.location.href = `/islamic-library/book/${bookSlug}/chapter/${newChapterId}`;
      }
    }
  };

  const getBookUrl = () => {
    if (book?.isLocal) {
      return `/islamic-library/local-books/${bookSlug}`;
    } else {
      return `/islamic-library/book/${bookSlug}`;
    }
  };
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-purple-200/50 shadow-xl"
      >
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 bg-purple-200 rounded-lg w-1/3"></div>
            <div className="h-8 bg-purple-200 rounded-lg w-1/3"></div>
          </div>
          <div className="flex justify-center">
            <div className="h-12 bg-purple-200 rounded-xl w-48"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!navigation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/90 backdrop-blur-xl rounded-3xl border border-purple-200/50 shadow-xl overflow-hidden"
    >
      {/* Mobile Header - Always Visible */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          {/* Current Chapter Info */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                book?.isLocal 
                  ? "bg-gradient-to-br from-purple-500 to-blue-600" 
                  : "bg-gradient-to-br from-green-500 to-emerald-600"
              }`}>
                {book?.isLocal ? (
                  <Hash className="w-6 h-6 text-white" />
                ) : (
                  <ExternalLink className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-xs font-bold text-white">
                  {navigation.currentChapterIndex}
                </span>
              </div>
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {language === "ar" ? navigation.current.title : navigation.current.titleEn}
              </h3>
              <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600">
                <div className="flex items-center space-x-1 space-x-reverse">
                  <Info className="w-4 h-4" />
                  <span>{navigation.current.hadithsCount} {getTranslation(language, "hadiths")}</span>
                </div>
                <div className="flex items-center space-x-1 space-x-reverse">
                  <Clock className="w-4 h-4" />
                  <span>{navigation.currentChapterIndex} / {navigation.totalChapters}</span>
                </div>
                
              </div>
            </div>
          </div>

          {/* Expand/Collapse Button for Mobile */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="sm:hidden p-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>{getTranslation(language, "progress")}</span>
            <span>{Math.round((navigation.currentChapterIndex / navigation.totalChapters) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(navigation.currentChapterIndex / navigation.totalChapters) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-3 rounded-full ${
                book?.isLocal 
                  ? "bg-gradient-to-r from-purple-500 to-blue-500"
                  : "bg-gradient-to-r from-green-500 to-emerald-500"
              }`}
            />
          </div>
        </div>

        {/* Desktop Navigation Controls - Always Visible */}
        <div className="hidden sm:flex items-center justify-between">
          {/* Previous Chapter */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigation.previous && handleChapterChange(navigation.previous.id)}
            disabled={!navigation.previous}
            className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-xl transition-all duration-300 ${
              navigation.previous
                ? "bg-purple-100 text-purple-700 hover:bg-purple-200 shadow-lg hover:shadow-xl"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
            <div className="text-right">
              <div className="text-xs text-gray-500">{getTranslation(language, "previous")}</div>
              <div className="text-sm font-medium truncate max-w-32">
                {navigation.previous ? (language === "ar" ? navigation.previous.title : navigation.previous.titleEn) : "-"}
              </div>
            </div>
          </motion.button>

          {/* Next Chapter */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigation.next && handleChapterChange(navigation.next.id)}
            disabled={!navigation.next}
            className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-xl transition-all duration-300 ${
              navigation.next
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200 shadow-lg hover:shadow-xl"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <div className="text-left">
              <div className="text-xs text-gray-500">{getTranslation(language, "next")}</div>
              <div className="text-sm font-medium truncate max-w-32">
                {navigation.next ? (language === "ar" ? navigation.next.title : navigation.next.titleEn) : "-"}
              </div>
            </div>
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation - Expandable */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="sm:hidden border-t border-purple-100"
          >
            <div className="p-4 space-y-4">
              {/* Mobile Navigation Controls */}
              <div className="flex items-center justify-between">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigation.previous && handleChapterChange(navigation.previous.id)}
                  disabled={!navigation.previous}
                  className={`flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg transition-all duration-200 ${
                    navigation.previous
                      ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-sm">{getTranslation(language, "previous")}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigation.next && handleChapterChange(navigation.next.id)}
                  disabled={!navigation.next}
                  className={`flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg transition-all duration-200 ${
                    navigation.next
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <span className="text-sm">{getTranslation(language, "next")}</span>
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = getBookUrl()}
                  className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span className="text-sm">{getTranslation(language, "backToBook")}</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = `/islamic-library`}
                  className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors"
                >
                  <Library className="w-4 h-4" />
                  <span className="text-sm">{getTranslation(language, "allBooks")}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Quick Actions */}
      <div className="hidden sm:block p-4 sm:p-6 pt-0 border-t border-purple-100">
        <div className="flex justify-center space-x-4 space-x-reverse">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = getBookUrl()}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">{getTranslation(language, "backToBook")}</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = `/islamic-library`}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors"
          >
            <Library className="w-4 h-4" />
            <span className="text-sm">{getTranslation(language, "allBooks")}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default IslamicChapterNavigation; 