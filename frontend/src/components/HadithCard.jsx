import { Bookmark, Eye, Users, Shield, ArrowLeft, Share2, MessageCircle } from "lucide-react";
import PropTypes from "prop-types";
import { useState } from "react";
import { useBookmarks } from "../context/BookmarkContext";
import BookmarkModal from "./BookmarkModal";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HadithCard = ({ hadith, isBookmarked, onBookmarkToggle, highlight, onRead, onRemove, showDeleteButton = false }) => {
  const { addBookmark, bookmarks } = useBookmarks();
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group h-full"
    >
      {/* Header with ID and Bookmark */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
            {hadith.id}
          </div>
          {hadith.grade && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
              <Shield className="w-3 h-3" />
              {hadith.grade}
            </span>
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleBookmarkClick}
          className={`p-2 rounded-xl transition-all duration-300 ${
            isBookmarked
              ? "text-yellow-600 bg-yellow-50 border border-yellow-200"
              : "text-gray-400 hover:text-purple-600 hover:bg-purple-50 border border-transparent hover:border-purple-200"
          }`}
          title={isBookmarked ? "إزالة من المحفوظات" : "حفظ الحديث"}
        >
          <Bookmark
            className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`}
          />
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-4 flex-1 flex flex-col">
        {/* Hadith Text */}
        <div className="mb-4 flex-1">
          <p
            className="text-gray-800 font-medium leading-relaxed text-right line-clamp-4  transition-all duration-300"
            dangerouslySetInnerHTML={{
              __html: highlight ? highlight(hadith.hadeeth || hadith.title) : (hadith.hadeeth || hadith.title),
            }}
          />
        </div>

        {/* Attribution */}
        {hadith.attribution && (
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{hadith.attribution}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 mt-auto">
          <div className="flex items-center gap-2">
            {/* Delete Button - Only show in Saved page */}
            {showDeleteButton && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRemove}
                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
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
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
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
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
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
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors duration-200 group/link"
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
