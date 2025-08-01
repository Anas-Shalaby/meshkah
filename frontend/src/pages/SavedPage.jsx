import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useBookmarks } from "../context/BookmarkContext";
import axios from "axios";
import { Bookmark, BookOpen, Share2, ArrowUp } from "lucide-react";
import HadithCard from "../components/HadithCard";
import { Loading3QuartersOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";

const gradientBg =
  "bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5]";

const patterns = [
  "/assets/arabic-pattern-classic.svg",
  "/assets/manuscript-texture.svg",
  "/assets/arabic-pattern-classic.svg",
];
const quotes = [
  "خيركم من تعلم القرآن وعلمه.",
  "الدال على الخير كفاعله.",
  "من سلك طريقًا يلتمس فيه علمًا سهل الله له به طريقًا إلى الجنة.",
  "الكلمة الطيبة صدقة.",
  "إنما الأعمال بالنيات.",
  "تبسمك في وجه أخيك صدقة.",
];

const SavedPage = () => {
  const { user } = useAuth();
  const { bookmarks, removeBookmark, loading } = useBookmarks();
  const [selectedCollection, setSelectedCollection] = useState("الكل");
  const [bookmarkedHadiths, setBookmarkedHadiths] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [modalHadith, setModalHadith] = useState(null);
  const [readingMode, setReadingMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [patternIdx] = useState(() =>
    Math.floor(Math.random() * patterns.length)
  );
  const [quote] = useState(
    () => quotes[Math.floor(Math.random() * quotes.length)]
  );

  // جلب تفاصيل الأحاديث المحفوظة
  const fetchBookmarkedHadithDetails = useCallback(async () => {
    if (!bookmarks || bookmarks.length === 0) return [];
    try {
      const hadithDetailsPromises = bookmarks.map(async (bookmark) => {
        try {
          if (!bookmark.hadith_book) {
            const response = await axios.get(
              `${import.meta.env.VITE_API_URL}/hadith/${bookmark.hadith_id}`,
              { params: { language: "ar" } }
            );
            return {
              ...response.data,
              bookmarkCollection: bookmark.collection || "الافتراضي",
              originalBookmarkId: bookmark.id,
            };
          }
          const response = await axios.get(
            `https://api.hadith.gading.dev/books/${bookmark.hadith_book}/${bookmark.hadith_id}`
          );
          return {
            ...response.data.data,
            bookmarkCollection: bookmark.collection || "الافتراضي",
            originalBookmarkId: bookmark.id,
          };
        } catch {
          return {
            id: bookmark.hadith_id,
            hadeeth: "تعذر جلب تفاصيل الحديث",
            bookmarkCollection: bookmark.collection || "الافتراضي",
            originalBookmarkId: bookmark.id,
          };
        }
      });
      return await Promise.all(hadithDetailsPromises);
    } catch {
      return [];
    }
  }, [bookmarks]);

  useEffect(() => {
    const fetchBookmarkedHadiths = async () => {
      if (!bookmarks || bookmarks.length === 0) return;
      try {
        const hadiths = await fetchBookmarkedHadithDetails();
        setBookmarkedHadiths(hadiths);
      } catch {
        // تم تجاهل الخطأ
      }
    };
    fetchBookmarkedHadiths();
  }, [bookmarks, fetchBookmarkedHadithDetails]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // بناء قائمة المجموعات الفريدة مع خيار "الكل"
  const uniqueCollections = [
    "الكل",
    ...Array.from(
      new Set(bookmarkedHadiths.map((h) => h.bookmarkCollection || "الافتراضي"))
    ),
  ];

  // فلترة الأحاديث حسب المجموعة المختارة
  const filteredHadiths =
    selectedCollection === "الكل"
      ? bookmarkedHadiths
      : bookmarkedHadiths.filter(
          (h) => h.bookmarkCollection === selectedCollection
        );

  // دالة لإزالة التشكيل
  function removeTashkeel(str) {
    return str.replace(/[\u064B-\u0652]/g, "");
  }

  // فلترة حسب البحث مع تجاهل التشكيل
  const normalizedSearch = removeTashkeel(searchTerm).toLowerCase();
  const searchedHadiths = searchTerm.trim()
    ? filteredHadiths.filter((h) => {
        const hay = [h.hadeeth, h.attribution, h.grade, h.bookmarkCollection]
          .filter(Boolean)
          .map((x) => removeTashkeel(x).toLowerCase())
          .join(" ");
        return hay.includes(normalizedSearch);
      })
    : filteredHadiths;

  // حذف مع تأكيد
  const openDeleteModal = (id) => setDeleteModal({ open: true, id });
  const closeDeleteModal = () => setDeleteModal({ open: false, id: null });
  const confirmDelete = () => {
    removeBookmark(deleteModal.id);
    setBookmarkedHadiths((prev) =>
      prev.filter((h) => h.originalBookmarkId !== deleteModal.id)
    );
    closeDeleteModal();
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-300">
            يرجى تسجيل الدخول للوصول إلى المحفوظات
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex justify-center  ">
        <Loading3QuartersOutlined className="text-6xl text-center text-[#7440E9]  mx-auto  animate-spin" />
      </div>
    );
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-300">
            لا يوجد أحاديث محفوظة
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${gradientBg} relative`}>
      {/* خلفية زخرفية متغيرة */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `url(${patterns[patternIdx]}) center/cover repeat`,
          opacity: 0.1,
        }}
      />
      {/* اقتباس عشوائي */}
      <div className="relative z-10 max-w-2xl mx-auto text-center py-4 mb-2">
        <span className="inline-block text-lg sm:text-xl text-[#7440E9] bg-[#f3edff] rounded-full px-6 py-2 shadow font-bold border border-[#e3d8fa]">
          {quote}
        </span>
      </div>
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-[#7440E9] tracking-tight">
            <Bookmark className="inline w-7 h-7 mb-1 mr-2 text-[#7440E9]" />
            الأحاديث المحفوظة
          </h1>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f3edff] text-[#7440E9] hover:bg-[#e9e4f5] transition"
            onClick={() => setReadingMode((v) => !v)}
          >
            <BookOpen className="w-5 h-5" />
            وضع القراءة
          </button>
        </div>
        {/* مربع البحث */}
        <div className="mb-2 flex justify-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث في الأحاديث المحفوظة..."
            className="w-full max-w-md px-4 py-3 rounded-xl border border-[#e3d8fa] bg-white text-[#7440E9] placeholder-[#b9aee0] shadow focus:ring-2 focus:ring-[#7440E9] focus:outline-none text-right"
          />
        </div>
        {/* تلميح البحث */}
        <div className="text-xs text-gray-500 text-center mb-4">
          يمكنك البحث باسم الراوي أو نص الحديث أو التصنيف أو الدرجة، بدون الحاجة
          للتشكيل.
        </div>
        {/* عداد النتائج */}
        <div className="text-sm text-[#7440E9] text-center mb-2">
          عدد النتائج: {searchedHadiths.length}
        </div>
        {/* فلتر المجموعات */}
        <div className="flex flex-wrap gap-2 justify-center mt-2 mb-6">
          {uniqueCollections.map((col) => (
            <button
              key={col}
              className={`px-3 py-1 rounded-full border ${
                selectedCollection === col
                  ? "bg-[#7440E9] text-white border-[#7440E9]"
                  : "bg-white text-[#7440E9] border-[#e3d8fa]"
              } transition`}
              onClick={() => setSelectedCollection(col)}
            >
              {col === "الكل" || col === "Default" || col === "الافتراضي"
                ? "كل المجموعات"
                : col}
            </button>
          ))}
        </div>
        {!readingMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
            {searchedHadiths.length === 0 && (
              <div className="col-span-full text-center text-gray-400 py-12 flex flex-col items-center gap-4">
                <span className="text-6xl">
                  <Bookmark />
                </span>
                <span className="text-lg">
                  لا توجد نتائج مطابقة لبحثك أو الفلتر الحالي.
                </span>
              </div>
            )}
            <AnimatePresence>
              {searchedHadiths.map((hadith) => (
                <motion.div
                  key={hadith.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-2xl shadow bg-white border border-[#e3d8fa] hover:shadow-lg transition p-5 flex flex-col gap-3"
                >
                  <HadithCard
                    hadith={hadith}
                    onRead={() => setModalHadith(hadith)}
                    onRemove={() => openDeleteModal(hadith.id)}
                  />
                  {/* زر مشاركة */}
                  <div className="flex gap-2 mt-2">
                    <button
                      className="flex items-center gap-1 px-3 py-1 rounded bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100 transition"
                      onClick={() =>
                        window.open(
                          `https://wa.me/?text=${encodeURIComponent(
                            hadith.hadeeth
                          )}`,
                          "_blank"
                        )
                      }
                    >
                      <Share2 className="w-4 h-4" /> واتساب
                    </button>
                    <button
                      className="flex items-center gap-1 px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition"
                      onClick={() =>
                        window.open(
                          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                            hadith.hadeeth
                          )}`,
                          "_blank"
                        )
                      }
                    >
                      <Share2 className="w-4 h-4" /> تويتر
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white/80 rounded-2xl p-6 mt-6 shadow max-w-2xl mx-auto">
            {searchedHadiths.map((h) => (
              <div key={h.id} className="mb-10 last:mb-0">
                <div className="text-2xl font-[Amiri,serif] text-gray-800 leading-loose text-center mb-2 bg-[#f3edff] rounded-xl p-4 border border-[#e3d8fa] shadow-sm">
                  {h.hadeeth}
                </div>
                <div className="flex justify-center gap-2">
                  {h.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="bg-[#e3d8fa] text-[#7440E9] px-2 py-0.5 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal التأكيد */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 max-w-full text-center">
            <h3 className="text-lg font-bold mb-4 text-[#7440E9]">
              تأكيد الحذف
            </h3>
            <p className="mb-6 text-gray-600">
              هل أنت متأكد أنك تريد حذف هذا الحديث من المحفوظات؟
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={confirmDelete}
                className="px-5 py-2 rounded bg-[#7440E9] text-white font-bold hover:bg-[#5a2fc2] transition"
              >
                تأكيد
              </button>
              <button
                onClick={closeDeleteModal}
                className="px-5 py-2 rounded bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* زر العودة للأعلى */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 left-8 z-50 bg-[#7440E9] text-white p-3 rounded-full shadow-lg hover:bg-[#5a2fc2] transition"
          title="العودة للأعلى"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default SavedPage;
