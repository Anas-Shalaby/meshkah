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
import { useTheme } from "../context/ThemeContext";

const BookCard = ({ book, isSelected = false, language = "ar" }) => {
  const { isNight } = useTheme();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef(null);

  // ——— Flat theme tokens (matches IslamicLibraryPage) ———
  const ACCENT = isNight ? "#9e98db" : "#7440E9";
  const GOLD = "#ffc107";
  const c = isNight
    ? {
        card: "bg-[#212328] border-white/5",
        cardActive: "border-[#9e98db]",
        strong: "text-[#e0e0e0]",
        title: "text-[#e0e0e0] group-hover:text-[#9e98db]",
        muted: "text-white/55",
        faint: "text-white/40",
        innerBox: "bg-[#1a1c22]",
        footer: "border-white/10",
        track: "bg-white/10",
        coverFallback: "bg-[#1a1c22]",
      }
    : {
        card: "bg-white border-black/5",
        cardActive: "border-[#7440E9]",
        strong: "text-gray-900",
        title: "text-gray-900 group-hover:text-[#7440E9]",
        muted: "text-gray-500",
        faint: "text-gray-400",
        innerBox: "bg-[#f6f6fa]",
        footer: "border-gray-100",
        track: "bg-gray-200",
        coverFallback: "bg-[#f1f1f5]",
      };

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
    <Link to={`/islamic-library/book/${book.bookSlug}`} className="block h-full">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className={`group flex h-full cursor-pointer flex-col rounded-2xl border p-5 transition-colors ${
          c.card
        } ${isSelected ? c.cardActive : ""}`}
      >
        {/* Book Header */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div
              className={`flex h-28 w-20 items-center justify-center overflow-hidden rounded-xl ${c.coverFallback}`}
            >
              {/* Loading Placeholder */}
              {!imageLoaded && (
                <div className="flex h-full w-full animate-pulse items-center justify-center">
                  <BookOpen className="h-8 w-8" style={{ color: ACCENT }} />
                </div>
              )}

              {/* Optimized Image */}
              <img
                ref={imageRef}
                src={optimizedImageUrl}
                alt={getBookTranslation(language, book.bookName)}
                className={`book-card-image h-full w-full object-cover transition-opacity duration-300 ${
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
                <div
                  className={`absolute inset-0 flex items-center justify-center ${c.coverFallback}`}
                >
                  <BookOpen className="h-10 w-10" style={{ color: ACCENT }} />
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className={`mb-1.5 font-cairo text-lg font-bold leading-snug line-clamp-2 transition-colors ${c.title}`}
            >
              {language === "ar"
                ? getBookTranslation(language, book.bookName)
                : book.bookNameEn
                ? book.bookNameEn
                : getBookTranslation(language, book.bookName)}
            </h3>
            <p className={`mb-3 text-sm font-medium ${c.muted}`}>
              {language === "ar"
                ? getBookTranslation(language, book.writerName)
                : book.writerNameEn
                ? book.writerNameEn
                : getWriterTranslation(language, book.writerName)}
            </p>

            {/* Stats */}
            <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${c.faint}`}>
              <span className="flex items-center gap-1.5 font-semibold">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: ACCENT }}
                />
                {book.hadiths_count} {getTranslation(language, "hadithsCount")}
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: GOLD }}
                />
                {book.chapters_count} {getTranslation(language, "chaptersCount")}
              </span>
            </div>
          </div>
        </div>

        {/* Book Description */}
        {book.aboutWriter && (
          <div className={`mt-4 rounded-xl p-3 ${c.innerBox}`}>
            <p className={`text-sm leading-relaxed line-clamp-2 ${c.muted}`}>
              {book.aboutWriter}
            </p>
          </div>
        )}

        {/* Book Metadata */}
        <div
          className={`mt-auto flex items-center justify-between border-t pt-4 ${c.footer}`}
        >
          <div className="flex items-center gap-3">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${ACCENT}1f`, color: ACCENT }}
            >
              {getTranslation(language, "available")}
            </span>
            {book.writerDeath && (
              <span className={`text-xs font-medium ${c.faint}`}>
                {book.writerDeath} {book.writerDeath.includes("ھ") ? "" : "ھ"}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleBookmark(e);
              }}
              className="rounded-lg p-2 transition-transform hover:scale-110"
              title={getTranslation(language, "bookmark")}
              disabled={isLoading}
            >
              <Bookmark
                className="h-4 w-4"
                style={{
                  color: isBookmarked ? GOLD : ACCENT,
                  fill: isBookmarked ? GOLD : "transparent",
                }}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleShare(e);
              }}
              className={`rounded-lg p-2 transition-transform hover:scale-110 ${c.faint}`}
              title={getTranslation(language, "share")}
            >
              <Share2 className="h-4 w-4" />
            </button>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full transition-transform group-hover:scale-110"
              style={{ backgroundColor: ACCENT }}
            >
              <ChevronRight
                className="h-4 w-4 rtl:rotate-180"
                style={{ color: isNight ? "#1a1c22" : "#ffffff" }}
              />
            </div>
          </div>
        </div>

        {/* Progress Bar (if available) */}
        {book.progress && (
          <div className="mt-4">
            <div className={`mb-1 flex items-center justify-between text-xs ${c.muted}`}>
              <span>{getTranslation(language, "progress")}</span>
              <span>{Math.round(book.progress)}%</span>
            </div>
            <div className={`h-2 w-full rounded-full ${c.track}`}>
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: `${book.progress}%`, backgroundColor: ACCENT }}
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
