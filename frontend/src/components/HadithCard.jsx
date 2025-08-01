import { Bookmark } from "lucide-react";
import PropTypes from "prop-types";
import { useState } from "react";
import { useBookmarks } from "../context/BookmarkContext";
import BookmarkModal from "./BookmarkModal";
import { Link } from "react-router-dom";

const HadithCard = ({ hadith, isBookmarked, onBookmarkToggle, highlight }) => {
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
    <div className="bg-white/80 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-purple-100/80 shadow-md transition-all hover:shadow-lg hover:border-purple-200/80 flex flex-col gap-3 sm:flex-row sm:gap-6 items-stretch sm:items-start text-right">
      {/* Right side: Text and link */}
      <div className="flex-grow flex flex-col gap-2">
        <div className="flex gap-3 sm:gap-5 items-center">
          <div className="w-10 sm:flex  h-10 sm:w-12 sm:h-12 hidden items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold border-2 border-purple-200 text-base sm:text-lg">
            {hadith.id}
          </div>
          <p
            className="text-base sm:text-base text-gray-800 font-cairo leading-relaxed sm:leading-loose mb-2 sm:mb-4"
            dangerouslySetInnerHTML={{
              __html: highlight ? highlight(hadith.title) : hadith.title,
            }}
          />
        </div>
        {/* grade and attribution */}
        <div className="flex items-center justify-start gap-2 sm:gap-4 text-xs mb-2 sm:mb-4 flex-wrap">
          {hadith.attribution && (
            <span className="text-gray-500">{hadith.attribution}</span>
          )}
          {hadith.grade && (
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-semibold">
              {hadith.grade}
            </span>
          )}
        </div>
        <div className="flex justify-start">
          <Link
            to={`/hadiths/hadith/${hadith.id}`}
            className="text-xs sm:text-sm text-purple-600 hover:text-purple-800 hover:underline"
          >
            عرض الشرح والتفاصيل
          </Link>
        </div>
      </div>

      {/* Left side: Number and actions */}
      <div className="flex flex-row sm:flex-col-reverse items-center gap-2 sm:gap-4 flex-shrink-0 mt-2 sm:mt-0">
        <button
          onClick={handleBookmarkClick}
          className={`p-2 rounded-full transition-colors ${
            isBookmarked
              ? "text-yellow-500 bg-yellow-100"
              : "text-gray-400 hover:bg-gray-100"
          }`}
          title={isBookmarked ? "إزالة من المحفوظات" : "حفظ الحديث"}
        >
          <Bookmark
            className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`}
          />
        </button>
      </div>
      {/* مودال الحفظ */}
      <BookmarkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleBookmarkSubmit}
        existingCollections={existingCollections}
      />
    </div>
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
};

export default HadithCard;
