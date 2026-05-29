import { Bookmark, Users, Shield, ArrowLeft, Share2, MessageCircle } from "lucide-react";
import PropTypes from "prop-types";
import { useState } from "react";
import { useBookmarks } from "../context/BookmarkContext";
import BookmarkModal from "./BookmarkModal";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

const HadithCard = ({ hadith, isBookmarked, onBookmarkToggle, highlight, onRead, onRemove, showDeleteButton = false }) => {
  const { isNight } = useTheme();
  const { addBookmark, bookmarks } = useBookmarks();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const ACCENT = isNight ? "#9e98db" : "#7440E9";
  const GOLD = "#ffc107";
  const c = isNight
    ? {
        cardBg: "#212328",
        innerBg: "#1a1c22",
        borderClass: "border border-[#2a2d35] hover:border-[#9e98db]/50",
        strong: "#e0e0e0",
        sub: "#a0a0a0",
        idText: "#1a1c22",
        grade: "bg-green-900/30 text-green-400 border border-green-900/50",
        wa: "bg-green-900/20 text-green-400 hover:bg-green-900/30",
        tw: "bg-blue-900/20 text-blue-400 hover:bg-blue-900/30",
        del: "text-red-400 hover:bg-red-900/20",
        bookmarkActive: "bg-[#ffc107]/15 border border-[#ffc107]/40",
        bookmarkIdle:
          "text-[#a0a0a0] hover:text-[#9e98db] border border-transparent hover:border-[#9e98db]/40 hover:bg-[#9e98db]/10",
      }
    : {
        cardBg: "#ffffff",
        innerBg: "#f4f4f7",
        borderClass: "border border-gray-200 hover:border-[#7440E9]/40",
        strong: "#1f2937",
        sub: "#6b7280",
        idText: "#ffffff",
        grade: "bg-green-50 text-green-700 border border-green-200",
        wa: "bg-green-50 text-green-700 hover:bg-green-100",
        tw: "bg-blue-50 text-blue-700 hover:bg-blue-100",
        del: "text-red-500 hover:text-red-600 hover:bg-red-50",
        bookmarkActive: "bg-[#ffc107]/15 border border-[#ffc107]/50",
        bookmarkIdle:
          "text-gray-400 hover:text-[#7440E9] border border-transparent hover:border-purple-200 hover:bg-purple-50",
      };

  const handleBookmarkSubmit = async ({ collection, notes }) => {
    await addBookmark(hadith.id, collection, notes);
    setIsModalOpen(false);
  };

  const [existingCollections, setExistingCollections] = useState([]);

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isBookmarked) {
      onBookmarkToggle();
    } else {
      // جلب المجموعات الموجودة
      const collections = Array.from(
        new Set(bookmarks.map((b) => b.collection))
      );
      setExistingCollections(collections);
      setIsModalOpen(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl transition-colors duration-300 ${c.borderClass}`}
      style={{ backgroundColor: c.cardBg }}
    >
      {/* Header with ID and Bookmark */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: ACCENT, color: c.idText }}
          >
            {hadith.id}
          </div>
          {hadith.grade && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${c.grade}`}
            >
              <Shield className="w-3 h-3" />
              {hadith.grade}
            </span>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleBookmarkClick}
          className={`rounded-xl p-2 transition-all duration-300 ${
            isBookmarked ? c.bookmarkActive : c.bookmarkIdle
          }`}
          title={isBookmarked ? "إزالة من المحفوظات" : "حفظ الحديث"}
        >
          <Bookmark
            className="w-5 h-5"
            style={isBookmarked ? { color: GOLD, fill: GOLD } : undefined}
          />
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col px-4 pb-4">
        {/* Hadith Text */}
        <div className="mb-4 flex-1">
          <p
            className="text-right font-medium leading-relaxed line-clamp-4 transition-all duration-300"
            style={{ color: c.strong }}
            dangerouslySetInnerHTML={{
              __html: highlight ? highlight(hadith.hadeeth || hadith.title) : (hadith.hadeeth || hadith.title),
            }}
          />
        </div>

        {/* Attribution */}
        {hadith.attribution && (
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="text-sm" style={{ color: c.sub }}>
              {hadith.attribution}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div
          className="mt-auto flex items-center justify-between border-t pt-3"
          style={{ borderColor: isNight ? "#2a2d35" : "#f1f1f5" }}
        >
          <div className="flex items-center gap-2">
            {/* Delete Button - Only show in Saved page */}
            {showDeleteButton && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRemove}
                className={`rounded-lg p-2 transition-colors duration-200 ${c.del}`}
                title="حذف من المحفوظات"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </motion.button>
            )}

            {/* Share Buttons */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${c.wa}`}
              onClick={() =>
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(hadith.hadeeth || hadith.title)}`,
                  "_blank"
                )
              }
              title="مشاركة عبر واتساب"
            >
              <MessageCircle className="w-3 h-3" />
              <span className="hidden sm:inline">واتساب</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${c.tw}`}
              onClick={() =>
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(hadith.hadeeth || hadith.title)}`,
                  "_blank"
                )
              }
              title="مشاركة عبر تويتر"
            >
              <Share2 className="w-3 h-3" />
              <span className="hidden sm:inline">تويتر</span>
            </motion.button>
          </div>

          <Link
            to={`/hadiths/hadith/${hadith.id}`}
            className="group/link flex items-center gap-2 text-sm font-medium transition-colors duration-200"
            style={{ color: ACCENT }}
          >
            <span>عرض الشرح والتفاصيل</span>
            <ArrowLeft className="w-4 h-4 group-hover/link:-translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
      </div>

      {/* Bookmark Modal */}
      <BookmarkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleBookmarkSubmit}
        existingCollections={existingCollections}
      />
    </motion.div>
  );
};

HadithCard.propTypes = {
  hadith: PropTypes.shape({
    id: PropTypes.string.isRequired,
    hadeeth: PropTypes.string,
    attribution: PropTypes.string,
    grade: PropTypes.string,
    tags: PropTypes.array,
    title: PropTypes.string,
  }).isRequired,
  isBookmarked: PropTypes.bool,
  onBookmarkToggle: PropTypes.func,
  highlight: PropTypes.func,
  onRead: PropTypes.func,
  onRemove: PropTypes.func,
  showDeleteButton: PropTypes.bool,
};

export default HadithCard;
