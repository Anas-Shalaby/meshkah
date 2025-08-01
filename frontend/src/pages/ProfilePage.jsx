import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useBookmarks } from "../context/BookmarkContext";
import { Plus, Copy, Edit } from "lucide-react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { useHadithCategories } from "../hooks/useHadithCategories";
import { Dialog } from "@headlessui/react";
import EditCardModal from "../components/EditCardModal";

const useImageCache = (
  originalUrl,
  fallbackUrl = "https://hadith-shareef.com/default.jpg"
) => {
  const [cachedUrl, setCachedUrl] = useState(null);

  useEffect(() => {
    // Check if image is already cached in localStorage
    const cachedImage = localStorage.getItem(`image_cache_${originalUrl}`);

    if (cachedImage) {
      setCachedUrl(cachedImage);
      return;
    }

    // If not cached, attempt to fetch and cache the image
    const cacheImage = async () => {
      try {
        const response = await fetch(originalUrl, {
          method: "GET",
          mode: "cors",
          cache: "no-cache",
        });

        if (response.ok) {
          const blob = await response.blob();
          const reader = new FileReader();

          reader.onloadend = () => {
            const base64data = reader.result;
            localStorage.setItem(`image_cache_${originalUrl}`, base64data);
            setCachedUrl(base64data);
          };

          reader.readAsDataURL(blob);
        } else {
          // If fetch fails, use fallback
          setCachedUrl(fallbackUrl);
        }
      } catch (error) {
        console.error("Image caching error:", error);
        setCachedUrl(fallbackUrl);
      }
    };

    cacheImage();
  }, [originalUrl, fallbackUrl]);

  return cachedUrl || fallbackUrl;
};

const categoryColors = {
  الصدق: "bg-green-100 text-green-800",
  النية: "bg-yellow-100 text-yellow-800",
  النصيحة: "bg-blue-100 text-blue-800",
  الصبر: "bg-indigo-100 text-indigo-800",
  الشكر: "bg-orange-100 text-orange-800",
  التيسير: "bg-teal-100 text-teal-800",
};

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const { bookmarks, removeBookmark, fastingStatus } = useBookmarks();
  const [activeTab, setActiveTab] = useState("info");
  const [bookmarkedCards, setBookmarkedCards] = useState([]);
  // Consistent state hooks
  const [cards, setCards] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState("الكل");
  const { categories } = useHadithCategories();
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    type: null,
    id: null,
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.username || "");
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(
    user?.avatar_url || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCardEditModal, setShowCardEditModal] = useState(false);
  const [cardToEdit, setCardToEdit] = useState(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (["info", "bookmarks", "dawah-cards", "cards"].includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Always call image cache hook
  const getAvatarUrl = (user) => {
    if (!user) return "/default-avatar.png";
    if (user.avatar_url) {
      if (user.avatar_url.startsWith("http")) {
        return user.avatar_url;
      } else if (user.avatar_url.startsWith("/uploads/avatars")) {
        return `${import.meta.env.VITE_IMAGE_API}/api${user.avatar_url}`;
      }
    }
    return "/default-avatar.png";
  };
  const avatarUrl = getAvatarUrl(user);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Fasting data effect
  useEffect(() => {
    const fetchFastingData = async () => {
      if (!user) return;

      try {
        if (fastingStatus) {
          // No need to set fastingData, fastingStatus is already available
        }
      } catch {
        // ignore
      }
    };

    fetchFastingData();
  }, [user, fastingStatus]);

  const fetchUserCards = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/dawah-cards`,
        {
          headers: {
            "x-auth-token": token,
          },
        }
      );
      setCards(response.data);
    } catch {
      toast.error("تعذر جلب البطاقات الدعوية");
    }
  };

  useEffect(() => {
    fetchUserCards();
  }, []);
  // Memoize bookmarks fetching to prevent unnecessary re-renders
  const fetchBookmarkedHadithDetails = useCallback(async () => {
    if (!bookmarks || bookmarks.length === 0) return [];

    try {
      const hadithDetailsPromises = bookmarks.map(async (bookmark) => {
        try {
          // First, try Hadeeth Encyclopedia API if hadith_book is empty
          if (!bookmark.hadith_book) {
            const response = await axios.get(
              `${import.meta.env.VITE_API_URL}/hadith/${bookmark.hadith_id}`,
              {
                params: {
                  language: "ar",
                },
              }
            );

            return {
              ...response.data,
              bookmarkCollection: bookmark.collection || "الافتراضي",
              originalBookmarkId: bookmark.id,
            };
          }

          // If hadith_book is available, use Hadith Gading API
          const response = await axios.get(
            `https://api.hadith.gading.dev/books/${bookmark.hadith_book}/${bookmark.hadith_id}`
          );

          return {
            ...response.data.data,
            bookmarkCollection: bookmark.collection || "الافتراضي",
            originalBookmarkId: bookmark.id,
          };
        } catch (error) {
          console.error(
            `Error fetching hadith details for bookmark ${bookmark.id}:`,
            error
          );
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
      console.error("Error in fetchBookmarkedHadithDetails:");
      return [];
    }
  }, [bookmarks]);

  // State to store bookmarked hadiths
  const [bookmarkedHadiths, setBookmarkedHadiths] = useState([]);

  useEffect(() => {
    const fetchBookmarkedCards = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/bookmarked-cards`,
          { headers: { "x-auth-token": localStorage.getItem("token") } }
        );
        setBookmarkedCards(response.data);
      } catch {
        // ignore
      }
    };

    fetchBookmarkedCards();
  }, [activeTab]);
  // Effect to fetch bookmarked hadiths
  useEffect(() => {
    const fetchBookmarkedHadiths = async () => {
      if (!bookmarks || bookmarks.length === 0) return;

      try {
        const hadiths = await fetchBookmarkedHadithDetails();
        setBookmarkedHadiths(hadiths);
      } catch {
        // ignore
      }
    };

    fetchBookmarkedHadiths();
  }, [bookmarks, fetchBookmarkedHadithDetails]);

  // تحديث المعاينة عند اختيار صورة جديدة
  useEffect(() => {
    if (editImage) {
      const reader = new FileReader();
      reader.onloadend = () => setEditImagePreview(reader.result);
      reader.readAsDataURL(editImage);
    } else {
      setEditImagePreview(avatarUrl);
    }
  }, [editImage, avatarUrl]);

  // دالة لجلب اسم التصنيف من id
  const getCategoryName = (ids) => {
    if (!categories || !ids || !ids.length) return "غير معروف";
    const cat = categories.find((c) => String(c.id) === String(ids[0]));
    return cat ? cat.title : "غير معروف";
  };

  // دالة فتح المودال
  const openDeleteModal = (type, id) =>
    setDeleteModal({ open: true, type, id });
  const closeDeleteModal = () =>
    setDeleteModal({ open: false, type: null, id: null });
  const confirmDelete = () => {
    if (deleteModal.type === "hadith") {
      removeBookmark(deleteModal.id);
      window.location.reload();
    } else if (deleteModal.type === "card") {
      axios
        .delete(`${import.meta.env.VITE_API_URL}/cards/${deleteModal.id}`, {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        })
        .then(() => {
          toast.success("تم حذف البطاقة بنجاح");
          fetchUserCards();
        })
        .catch((error) => {
          console.error("Error deleting card:", error);
          toast.error("حدث خطأ في حذف البطاقة");
        });
    }
    closeDeleteModal();
  };

  const copyToClipboard = (card) => {
    navigator.clipboard.writeText(
      `${window.location.origin}/shared-card/${card.share_link}`
    );
    toast.success("تم نسخ الرابط!");
  };

  // 1. بناء قائمة المجموعات الفريدة مع خيار "الكل"
  const uniqueCollections = [
    "الكل",
    ...Array.from(
      new Set(bookmarkedHadiths.map((h) => h.bookmarkCollection || "الافتراضي"))
    ),
  ];

  // 2. فلترة الأحاديث حسب المجموعة المختارة
  const filteredHadiths =
    selectedCollection === "الكل"
      ? bookmarkedHadiths
      : bookmarkedHadiths.filter(
          (h) => h.bookmarkCollection === selectedCollection
        );

  // Early return if user is not loaded
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-300">
            يرجى تسجيل الدخول للوصول إلى الملف الشخصي
          </p>
        </div>
      </div>
    );
  }

  // Render main profile content
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white font-[Cairo,Amiri,sans-serif] text-right">
      {/* بانر علوي */}
      <section className="relative w-full flex flex-col items-center justify-center py-8 sm:py-12 mb-8 bg-gradient-to-br from-indigo-900/90 to-indigo-700/80 overflow-hidden">
        <img
          src={avatarUrl}
          alt="avatar"
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-indigo-300 shadow-lg z-10 mb-2 object-cover cursor-pointer transition-transform hover:scale-105"
          onClick={() => setShowAvatarModal(true)}
        />
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow mb-1 text-center">
          {user?.username}
        </h2>
        <p className="text-indigo-200 text-base sm:text-lg mb-2 text-center">
          {user?.motivation}
        </p>
        <div className="flex gap-6 mt-2 z-10 flex-wrap justify-center">
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-bold text-white">
              {bookmarks.length}
            </span>
            <span className="text-white text-xs">أحاديث محفوظة</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-bold text-white">
              {cards.length}
            </span>
            <span className="text-white text-xs">بطاقات دعوية</span>
          </div>
        </div>
      </section>
      {/* معلومات الحساب */}
      <section className="max-w-2xl mx-auto bg-white rounded-2xl shadow flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 px-4 sm:px-8 py-5 sm:py-6 mb-8 sm:mb-10 border border-gray-100">
        <div className="flex-1 flex flex-col gap-2 items-center md:items-start text-center md:text-right">
          <div className="text-base sm:text-lg font-bold text-indigo-900">
            {user?.username}
          </div>
          <div className="text-gray-500 text-sm sm:text-base">
            {user?.email}
          </div>
          <div className="text-gray-400 text-xs sm:text-sm">
            تاريخ التسجيل:{" "}
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString("ar-EG")
              : "تاريخ غير محدد"}
          </div>
        </div>
        <button
          className="px-4 sm:px-6 py-2 rounded bg-indigo-400 text-white font-bold hover:bg-indigo-500 transition flex items-center gap-2 shadow text-sm sm:text-base mt-3 md:mt-0"
          onClick={() => {
            setEditName(user?.username || "");
            setEditImage(null);
            setEditImagePreview(avatarUrl);
            setShowEditModal(true);
          }}
        >
          <Edit className="w-5 h-5" /> تعديل الحساب
        </button>
      </section>
      {/* الأحاديث المحفوظة
      {bookmarkedHadiths.length > 0 && (
        <section className="max-w-4xl mx-auto mb-10 sm:mb-12">
          <h3 className="text-lg sm:text-xl font-bold text-indigo-900 mb-3 sm:mb-4 text-center sm:text-right">
            الأحاديث المحفوظة
          </h3>
          <div className="mb-3 sm:mb-4 flex justify-end">
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="px-3 sm:px-4 py-2 rounded border border-gray-200 bg-white text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-transparent transition-all text-sm sm:text-base"
            >
              {uniqueCollections.map((col) => (
                <option key={col} value={col}>
                  {col === "الكل" || col === "Default" || col === "الافتراضي"
                    ? "كل المجموعات"
                    : col}
                </option>
              ))}
            </select>
          </div>
        
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {filteredHadiths.map((h) => (
              <div
                key={h.id}
                className={`rounded-xl shadow border border-gray-100 px-4 sm:px-5 py-3 sm:py-4 flex flex-col gap-2 ${
                  categoryColors[getCategoryName(h.categories)] ||
                  "bg-gray-50 text-gray-800"
                }`}
                style={{ fontFamily: "Amiri, Cairo, serif" }}
              >
                <div className="flex justify-between items-center mb-1 sm:mb-2">
                  <span className="text-md text-gray-600 sm:text-sm font-bold">
                    {getCategoryName(h.categories)}
                  </span>
                  <button
                    onClick={() => openDeleteModal("hadith", h.id)}
                    className="p-2 rounded-full bg-white/60 hover:bg-red-100 text-red-500 transition border border-gray-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Link
                  to={`/hadiths/hadith/${h.id}`}
                  className="text-lg sm:text-md leading-relaxed"
                >
                  {h.hadeeth}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )} */}
      {bookmarkedCards.length > 0 && (
        <section className="max-w-5xl mx-auto mb-10 sm:mb-12">
          <h3 className="text-lg sm:text-xl font-bold text-indigo-900 mb-3 sm:mb-4 text-center sm:text-right">
            البطاقات الدعوية المحفوظة
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2  md:grid-cols-3 gap-4 sm:gap-6">
            {bookmarkedCards.map((card) => (
              <div
                key={card.id}
                className="rounded-2xl shadow border border-gray-100 bg-white p-4 sm:p-5 flex flex-col gap-2"
              >
                <div className="font-bold text-indigo-900 text-base sm:text-lg">
                  {card.title}
                </div>
                <div className="text-gray-500 text-xs sm:text-sm mb-1">
                  {card.description}
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  عدد الأحاديث: {card.hadiths?.length || 0}
                </div>
                <div className="flex gap-2 mt-auto flex-wrap">
                  <button
                    onClick={() => copyToClipboard(card)}
                    className="px-3 py-1 rounded bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition flex items-center gap-1"
                  >
                    {" "}
                    <Copy className="w-4 h-4" /> نسخ الرابط
                  </button>
                  <button
                    onClick={() => openDeleteModal("card", card.id)}
                    className="px-3 py-1 rounded bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="max-w-5xl mx-auto mb-16 ">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
          <h3 className="text-lg sm:text-xl font-bold text-indigo-900 text-center sm:text-right">
            بطاقاتي الدعوية
          </h3>
          <Link
            to={`/create-card`}
            className="flex items-center gap-1 px-4 sm:px-4 py-2 sm:py-2 rounded bg-indigo-900 text-white  text-base shadow hover:bg-indigo-800 transition w-[50%] sm:w-auto justify-center"
          >
            <Plus className="w-6 h-6" /> إنشاء بطاقة جديدة
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((card) => (
            <div
              key={card.id}
              className="rounded-2xl shadow border border-gray-100 bg-white p-4 sm:p-5 flex flex-col gap-2"
            >
              <div className="font-bold text-indigo-900 text-base sm:text-lg">
                {card.title}
              </div>
              <div className="text-gray-500 text-xs sm:text-sm mb-1">
                {card.description}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                عدد الأحاديث: {card.hadiths?.length || 0}
              </div>
              <div className="flex gap-2 mt-auto flex-wrap">
                <button
                  onClick={() => openDeleteModal("card", card.id)}
                  className="px-3 py-1 rounded bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition"
                >
                  حذف
                </button>
                <button
                  onClick={() => {
                    setCardToEdit(card);
                    setShowCardEditModal(true);
                  }}
                  className="px-3 py-1 rounded bg-yellow-50 text-yellow-700 font-bold text-xs hover:bg-yellow-100 transition flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" /> تعديل
                </button>
                <Link
                  to={`/shared-card/${card.share_link}`}
                  className="px-3 py-1 rounded bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition"
                >
                  معاينة
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* Modal التأكيد */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 max-w-full text-center">
            <h3 className="text-lg font-bold mb-4 text-gray-800">
              تأكيد الحذف
            </h3>
            <p className="mb-6 text-gray-600">هل أنت متأكد أنك تريد الحذف؟</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={confirmDelete}
                className="px-5 py-2 rounded bg-red-500 text-white font-bold hover:bg-red-600 transition"
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
      {/* Modal تعديل الحساب */}
      <Dialog
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <Dialog.Panel className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto p-6 z-10 text-center">
            <Dialog.Title className="text-lg font-bold mb-4 text-indigo-700">
              تعديل الحساب
            </Dialog.Title>
            <div className="flex flex-col items-center gap-4 mb-4">
              <img
                src={editImagePreview}
                alt="avatar preview"
                className="w-24 h-24 rounded-full border-2 border-indigo-300 object-cover shadow"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditImage(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="اسم المستخدم الجديد"
              className="w-full mb-4 px-4 py-2 rounded-lg bg-white text-black border border-gray-200 focus:ring-2 focus:ring-indigo-200 text-xl"
            />
            <div className="flex gap-4 justify-center mt-2">
              <button
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    const formData = new FormData();
                    formData.append("username", editName);
                    if (editImage) formData.append("avatar", editImage);
                    const token = localStorage.getItem("token");
                    const response = await axios.put(
                      `${import.meta.env.VITE_API_URL}/auth/update-profile`,
                      formData,
                      {
                        headers: {
                          "x-auth-token": token,
                          "Content-Type": "multipart/form-data",
                        },
                      }
                    );
                    toast.success("تم تحديث الحساب بنجاح");
                    setShowEditModal(false);
                    setUser(response.data);
                  } catch (error) {
                    toast.error("حدث خطأ أثناء تحديث الحساب");
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving || !editName.trim()}
                className="px-6 py-2 rounded bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition disabled:opacity-60"
              >
                {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition"
              >
                إلغاء
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      {/* Modal تكبير الصورة */}
      <Dialog
        open={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4 bg-black/60">
          <Dialog.Panel className="relative bg-transparent shadow-none flex flex-col items-center justify-center">
            <button
              onClick={() => setShowAvatarModal(false)}
              className="absolute top-2 left-2 bg-white/80 text-gray-700 rounded-3xl px-2 py-2 shadow hover:bg-white z-20"
              title="إغلاق"
            >
              ×
            </button>
            <img
              src={avatarUrl}
              alt="avatar-large"
              className="max-w-[90vw] max-h-[80vh] rounded-2xl border-4 border-indigo-300 shadow-2xl bg-white"
              style={{ objectFit: "contain" }}
            />
          </Dialog.Panel>
        </div>
      </Dialog>
      {/* Modal تعديل البطاقة الدعوية */}
      <EditCardModal
        isOpen={showCardEditModal}
        onClose={() => setShowCardEditModal(false)}
        card={cardToEdit}
        onCardUpdated={(updatedCard) => {
          setCards((prev) =>
            prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
          );
          setShowCardEditModal(false);
        }}
      />
      <footer className="w-full min-h-[40px] bg-white" />
    </div>
  );
};

export default ProfilePage;
