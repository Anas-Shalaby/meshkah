import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Share2, Bookmark } from "lucide-react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  getTranslation,
  getBookTranslation,
  getWriterTranslation,
} from "../utils/translations";
import {
  addIslamicBookmark,
  removeIslamicBookmark,
  checkIslamicBookmark,
  createBookBookmarkData,
} from "../services/islamicBookmarksService";
import {
  getOptimizedImageUrl,
  optimizeImageLoading,
} from "../utils/imageOptimization";

const BookCard = ({ book, isSelected = false, language = "ar" }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef(null);

  // Check if book is bookmarked on component mount
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const result = await checkIslamicBookmark({
          bookSlug: book.bookSlug,
          type: "book",
        });
        setIsBookmarked(result.isBookmarked);
        setBookmarkId(result.bookmark?.id || null);
      } catch (error) {
        console.error("Error checking bookmark status:", error);
      }
    };

    checkBookmarkStatus();
  }, [book.bookSlug]);

  const handleShare = (e) => {
    e.stopPropagation();
    // Share functionality
    if (navigator.share) {
      navigator.share({
        title: getBookTranslation(language, book.bookName),
        text: `${getTranslation(language, "discoverBook")} ${getBookTranslation(
          language,
          book.bookName
        )} ${getTranslation(language, "inLibrary")}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isBookmarked) {
        // Remove bookmark
        await removeIslamicBookmark(bookmarkId);
        setIsBookmarked(false);
        setBookmarkId(null);
      } else {
        // Add bookmark
        const bookmarkData = createBookBookmarkData(book);
        const result = await addIslamicBookmark(bookmarkData);
        setIsBookmarked(true);
        setBookmarkId(result.bookmarkId);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  // Get optimized image URL
  const optimizedImageUrl = getOptimizedImageUrl(
    `/assets/${book.bookSlug}.jpeg`
  );

  // Setup intersection observer for lazy loading
  useEffect(() => {
    if (imageRef.current) {
      optimizeImageLoading(imageRef.current, optimizedImageUrl);
    }
  }, [optimizedImageUrl]);

  return (
    <Link to={`/islamic-library/book/${book.bookSlug}`}>
      <motion.div
        className={`relative bg-white/90 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border-2  cursor-pointer group overflow-hidden ${
          isSelected
            ? "border-purple-500 shadow-xl shadow-purple-500/30"
            : "border-purple-200/50 shadow-lg hover:shadow-2xl hover:border-purple-300/70"
        }`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-blue-50/50 "></div>

        {/* Book Header */}
        <div className="relative flex items-start space-x-4 space-x-reverse mb-6">
          <div className="relative">
            <div className="w-20 h-28 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden">
              {/* Loading Placeholder */}
              {!imageLoaded && (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 animate-pulse flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-white/70" />
                </div>
              )}

              {/* Optimized Image */}
              <img
                ref={imageRef}
                src={optimizedImageUrl}
                alt={getBookTranslation(language, book.bookName)}
                className={`w-full h-full object-cover transition-opacity duration-300 book-card-image ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                loading="lazy"
                decoding="async"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{
                  imageRendering: "auto",
                }}
              />

              {/* Fallback Icon */}
              {imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
              )}
            </div>
            {/* Status Badge */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-cairo font-bold text-xl text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-700 transition-colors">
              {language === "ar"
                ? getBookTranslation(language, book.bookName)
                : book.bookNameEn
                ? book.bookNameEn
                : getBookTranslation(language, book.bookName)}
            </h3>
            <p className="text-sm text-gray-600 mb-3 font-medium">
              {language === "ar"
                ? getBookTranslation(language, book.writerName)
                : book.writerNameEn
                ? book.writerNameEn
                : getWriterTranslation(language, book.writerName)}
            </p>

            {/* Stats */}
            <div className="flex items-center space-x-3 space-x-reverse text-xs text-gray-500">
              <div className="flex items-center space-x-1 space-x-reverse">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="font-semibold">
                  {book.hadiths_count}{" "}
                  {getTranslation(language, "hadithsCount")}
                </span>
              </div>
              <div className="flex items-center space-x-1 space-x-reverse">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-semibold">
                  {book.chapters_count}{" "}
                  {getTranslation(language, "chaptersCount")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Book Description */}
        {book.aboutWriter && (
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
            <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
              {book.aboutWriter}
            </p>
          </div>
        )}

        {/* Book Metadata */}
        <div className="flex items-center justify-between pt-4 border-t border-purple-100">
          <div className="flex items-center space-x-3 space-x-reverse">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200">
              {getTranslation(language, "available")}
            </span>
            {book.writerDeath && (
              <span className="text-xs text-gray-500 font-medium">
                {book.writerDeath} {book.writerDeath.includes("ھ") ? "" : "ھ"}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 space-x-reverse opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleBookmark(e);
              }}
              className={`p-2 transition-colors hover:scale-110 ${
                isBookmarked
                  ? "text-purple-600 hover:text-purple-700"
                  : "text-gray-400 hover:text-purple-600"
              }`}
              title={getTranslation(language, "bookmark")}
              disabled={isLoading}
            >
              <Bookmark
                className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleShare(e);
              }}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors hover:scale-110"
              title={getTranslation(language, "share")}
            >
              <Share2 className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Progress Bar (if available) */}
        {book.progress && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>{getTranslation(language, "progress")}</span>
              <span>{Math.round(book.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${book.progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </motion.div>
    </Link>
  );
};

BookCard.propTypes = {
  book: PropTypes.shape({
    id: PropTypes.number.isRequired,
    bookName: PropTypes.string.isRequired,
    bookNameAr: PropTypes.string,
    bookNameUr: PropTypes.string,
    writerName: PropTypes.string.isRequired,
    writerNameAr: PropTypes.string,
    writerNameUr: PropTypes.string,
    aboutWriter: PropTypes.string,
    aboutWriterAr: PropTypes.string,
    aboutWriterUr: PropTypes.string,
    writerDeath: PropTypes.string,
    bookSlug: PropTypes.string.isRequired,
    hadiths_count: PropTypes.string,
    chapters_count: PropTypes.string,
    bookCoverUrl: PropTypes.string,
    bookDescription: PropTypes.string,
    bookDescriptionAr: PropTypes.string,
    bookDescriptionUr: PropTypes.string,
    status: PropTypes.string,
    progress: PropTypes.number,
  }).isRequired,
  onSelect: PropTypes.func,
  isSelected: PropTypes.bool,
  language: PropTypes.string,
};

export default BookCard;
