import { motion } from "framer-motion";
import {
  Share2,
  Copy,
  Bookmark,
  Eye,
  ChevronDown,
  ChevronUp,
  Hash,
  MessageSquare,
  Heart,
  BookOpen,
} from "lucide-react";
import PropTypes from "prop-types";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { getTranslation, getBookTranslation } from "../utils/translations";

const IslamicHadithCard = ({
  hadith,
  onSelect,
  isBookmarked = false,
  language = "ar",
  onBookmark,
}) => {
  const [isTextExpanded, setIsTextExpanded] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    let text = "";

    // Try local book structure first
    if (language === "ar" && hadith.arabic) {
      text += hadith.arabic;
    } else if (language === "en" && hadith.english?.text) {
      text += hadith.english.text;
    } else if (language === "ur" && hadith.urdu) {
      text += hadith.urdu;
    } else {
      // Try external book structure
      if (language === "ar" && hadith.hadithArabic) {
        text += hadith.hadithArabic;
      } else if (language === "en" && hadith.hadithEnglish) {
        text += hadith.hadithEnglish;
      } else if (language === "ur" && hadith.hadithUrdu) {
        text += hadith.hadithUrdu;
      } else {
        // Fallback to any available text
        text =
          hadith.arabic ||
          hadith.english?.text ||
          hadith.urdu ||
          hadith.hadithArabic ||
          hadith.hadithEnglish ||
          hadith.hadithUrdu ||
          "";
      }
    }

    navigator.clipboard.writeText(text);
    toast.success(getTranslation(language, "copied"));
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `${getTranslation(language, "hadith")} ${
          hadith.idInBook || hadith.hadithNumber
        }`,
        text:
          language === "ar"
            ? (hadith.arabic || hadith.hadithArabic)?.substring(0, 100)
            : language === "en"
            ? (hadith.english?.text || hadith.hadithEnglish)?.substring(0, 100)
            : (hadith.urdu || hadith.hadithUrdu)?.substring(0, 100) + "...",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(getTranslation(language, "linkCopied"));
    }
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    if (onBookmark) {
      onBookmark(hadith);
    } else {
      // Fallback to toast if no onBookmark handler provided
      toast.success(
        isBookmarked
          ? getTranslation(language, "removeBookmark")
          : getTranslation(language, "addBookmark")
      );
    }
  };

  const handleView = (e) => {
    e.stopPropagation();
    onSelect(hadith);
  };

  const toggleTextExpanded = (e) => {
    e.stopPropagation();
    setIsTextExpanded(!isTextExpanded);
  };

  // Get the appropriate text based on language
  const getHadithText = () => {
    // Try local book structure first
    if (language === "ar" && hadith.arabic) {
      return hadith.arabic;
    } else if (language === "en" && hadith.english?.text) {
      return hadith.english.text;
    } else if (language === "ur" && hadith.urdu) {
      return hadith.urdu;
    }

    // Try external book structure
    if (language === "ar" && hadith.hadithArabic) {
      return hadith.hadithArabic;
    } else if (language === "en" && hadith.hadithEnglish) {
      return hadith.hadithEnglish;
    } else if (language === "ur" && hadith.hadithUrdu) {
      return hadith.hadithUrdu;
    }

    // Fallback to any available text
    return (
      hadith.arabic ||
      hadith.english?.text ||
      hadith.urdu ||
      hadith.hadithArabic ||
      hadith.hadithEnglish ||
      hadith.hadithUrdu ||
      ""
    );
  };

  // Get the appropriate heading based on language
  const getHeadingText = () => {
    // Try external book structure for headings
    if (language === "ar" && hadith.headingArabic) {
      return hadith.headingArabic;
    } else if (language === "en" && hadith.headingEnglish) {
      return hadith.headingEnglish;
    } else if (language === "ur" && hadith.headingUrdu) {
      return hadith.headingUrdu;
    }
    // For local books, we don't have separate heading fields
    return "";
  };

  // Get the appropriate narrator based on language
  const getNarratorText = () => {
    // Try local book structure first
    if (language === "en" && hadith.english?.narrator) {
      return hadith.english.narrator;
    }
    // Try external book structure
    if (language === "en" && hadith.englishNarrator) {
      return hadith.englishNarrator;
    } else if (language === "ur" && hadith.urduNarrator) {
      return hadith.urduNarrator;
    }
    return "";
  };

  const hadithText = getHadithText();
  const headingText = getHeadingText();
  const narratorText = getNarratorText();

  // Check if text is long (more than 900 characters)
  const isTextLong = hadithText.length > 900;
  const shouldShowReadMore = isTextLong && !isTextExpanded;

  return (
    <motion.div className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-purple-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group">
      {/* Enhanced Hadith Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 sm:space-x-4 space-x-reverse">
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Hash className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
              <span className="text-xs font-bold text-white">
                {hadith.idInBook || hadith.hadithNumber}
              </span>
            </div>
          </div>
          <div>
            <h3 className="font-cairo font-bold text-gray-900 text-base sm:text-lg">
              {getTranslation(language, "hadith")}{" "}
              {hadith.idInBook || hadith.hadithNumber}
            </h3>
            <div className="flex flex-wrap items-center space-x-2 sm:space-x-3 space-x-reverse text-xs sm:text-sm text-gray-500">
              {hadith.volume && (
                <span className="flex items-center space-x-1 space-x-reverse">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>
                    {getTranslation(language, "volume")} {hadith.volume}
                  </span>
                </span>
              )}
              {hadith.status && (
                <span
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                    hadith.status === "Sahih"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : hadith.status === "Hasan"
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                  }`}
                >
                  {getTranslation(language, hadith.status.toLowerCase())}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse opacity-100 sm:opacity-0 sm:group-hover:opacity-100  ">
          <button
            onClick={handleView}
            className="p-2 sm:p-3 text-gray-400 hover:text-purple-600 transition-all hover:scale-110 bg-white/50 rounded-xl"
            title={getTranslation(language, "view")}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 sm:p-3 text-gray-400 hover:text-blue-600 transition-all hover:scale-110 bg-white/50 rounded-xl"
            title={getTranslation(language, "copy")}
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleBookmark}
            className={`p-2 sm:p-3 transition-all hover:scale-110 bg-white/50 rounded-xl ${
              isBookmarked
                ? "text-yellow-500"
                : "text-gray-400 hover:text-yellow-600"
            }`}
            title={
              isBookmarked
                ? getTranslation(language, "removeBookmark")
                : getTranslation(language, "addBookmark")
            }
          >
            <Bookmark
              className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`}
            />
          </button>
          <button
            onClick={handleShare}
            className="p-2 sm:p-3 text-gray-400 hover:text-blue-600 transition-all hover:scale-110 bg-white/50 rounded-xl"
            title={getTranslation(language, "share")}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Enhanced Expandable Content */}
      <div className="transition-all duration-300">
        {/* Enhanced Heading */}
        {headingText && (
          <div className="mb-4 sm:mb-6">
            <h4 className="font-cairo font-semibold text-gray-900 mb-2 sm:mb-3 text-sm flex items-center space-x-2 space-x-reverse">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span>{getTranslation(language, "heading")}</span>
            </h4>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-3 sm:p-4 border border-purple-200">
              <p className="font-cairo text-sm leading-relaxed text-gray-800">
                {headingText}
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Narrator */}
        {narratorText && (
          <div className="mb-4 sm:mb-6">
            <h4 className="font-cairo font-semibold text-gray-900 mb-2 sm:mb-3 text-sm flex items-center space-x-2 space-x-reverse">
              <Heart className="w-4 h-4 text-blue-600" />
              <span>{getTranslation(language, "narrator")}</span>
            </h4>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-3 sm:p-4 border border-blue-200">
              <p className="font-cairo text-sm leading-relaxed text-gray-800">
                {narratorText}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Hadith Text */}
      {hadithText && (
        <div className="mb-6">
          <h4 className="font-cairo font-semibold text-gray-900 mb-3 text-sm flex items-center space-x-2 space-x-reverse">
            <BookOpen className="w-4 h-4 text-green-600" />
            <span>{getTranslation(language, "hadithText")}</span>
          </h4>

          {language === "ar" ? (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-6 border border-gray-200">
              <p
                className={`text-base sm:text-xl leading-relaxed text-gray-800 amiri-regular ${
                  shouldShowReadMore ? "line-clamp-3" : ""
                }`}
                style={{ lineHeight: "2.5rem" }}
              >
                {hadithText}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(language === "en" && hadith.english?.text) ||
              hadith.hadithEnglish ? (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-6 border border-gray-200">
                  <p
                    className={`text-base sm:text-xl leading-relaxed text-gray-800 font-cairo ${
                      shouldShowReadMore ? "line-clamp-3" : ""
                    }`}
                    style={{ lineHeight: "2.5rem" }}
                  >
                    {hadithText}
                  </p>
                </div>
              ) : language === "ur" && hadith.urdu ? (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-6 border border-gray-200">
                  <p
                    className={`text-base sm:text-xl leading-relaxed text-gray-800 font-cairo ${
                      shouldShowReadMore ? "line-clamp-3" : ""
                    }`}
                    style={{ lineHeight: "2.5rem" }}
                  >
                    {hadithText}
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 text-xs">!</span>
                      </div>
                      <p className="text-sm font-medium text-yellow-800">
                        {getTranslation(
                          language,
                          "englishTranslationNotAvailable"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-6 border border-gray-200">
                    <p
                      className={`text-base sm:text-xl leading-relaxed text-gray-800 amiri-regular ${
                        shouldShowReadMore ? "line-clamp-3" : ""
                      }`}
                      style={{ lineHeight: "2.5rem" }}
                    >
                      {hadith.arabic || hadith.hadithArabic}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Enhanced Read More Button */}
          {isTextLong && (
            <button
              onClick={toggleTextExpanded}
              className="mt-4 flex items-center space-x-2 space-x-reverse text-purple-600 hover:text-purple-800 transition-all hover:scale-105 text-sm font-semibold bg-purple-50 px-3 sm:px-4 py-2 rounded-xl"
            >
              <span>
                {isTextExpanded
                  ? getTranslation(language, "showLess")
                  : getTranslation(language, "readMore")}
              </span>
              {isTextExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Enhanced Metadata */}
      <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
        {hadith.book && (
          <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-2 sm:px-3 py-1 sm:py-2 rounded-xl border border-blue-200 font-medium">
            {getBookTranslation(language, hadith.book.bookName)}
          </span>
        )}
        {hadith.chapter && (
          <span className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-2 sm:px-3 py-1 sm:py-2 rounded-xl border border-purple-200 font-medium">
            {language === "ar"
              ? hadith.chapter.chapterArabic
              : language === "en"
              ? hadith.chapter.chapterEnglish
              : hadith.chapter.chapterUrdu}
          </span>
        )}
        {hadith.grade && (
          <span className="bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 px-2 sm:px-3 py-1 sm:py-2 rounded-xl border border-orange-200 font-medium">
            {hadith.grade}
          </span>
        )}
      </div>
    </motion.div>
  );
};

IslamicHadithCard.propTypes = {
  hadith: PropTypes.shape({
    id: PropTypes.number.isRequired,
    idInBook: PropTypes.number,
    chapterId: PropTypes.number,
    bookId: PropTypes.number,
    arabic: PropTypes.string,
    english: PropTypes.shape({
      narrator: PropTypes.string,
      text: PropTypes.string,
    }),
    urdu: PropTypes.string,
    volume: PropTypes.string,
    status: PropTypes.string,
    grade: PropTypes.string,
    book: PropTypes.object,
    chapter: PropTypes.object,
    // Legacy fields for backward compatibility
    hadithNumber: PropTypes.string,
    hadithArabic: PropTypes.string,
    hadithEnglish: PropTypes.string,
    hadithUrdu: PropTypes.string,
    englishNarrator: PropTypes.string,
    urduNarrator: PropTypes.string,
    headingArabic: PropTypes.string,
    headingEnglish: PropTypes.string,
    headingUrdu: PropTypes.string,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  isBookmarked: PropTypes.bool,
  language: PropTypes.string,
  onBookmark: PropTypes.func,
};

export default IslamicHadithCard;
