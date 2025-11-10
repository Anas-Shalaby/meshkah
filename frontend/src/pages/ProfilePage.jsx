import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useBookmarks } from "../context/BookmarkContext";
import {
  Plus,
  Copy,
  Edit,
  Trash2,
  User,
  Calendar,
  Mail,
  BookOpen,
  Share2,
  Heart,
  Settings,
  Award,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useHadithCategories } from "../hooks/useHadithCategories";
import { Dialog } from "@headlessui/react";
import EditCardModal from "../components/EditCardModal";

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 text-lg font-medium">
            يرجى تسجيل الدخول للوصول إلى الملف الشخصي
          </p>
        </motion.div>
      </div>
    );
  }

  // Render main profile content
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 font-[Cairo,Amiri,sans-serif] text-right">
      {/* Hero Section with Animated Background */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full flex flex-col items-center justify-center py-12 sm:py-16 mb-8 bg-gradient-to-br from-purple-900/90 via-indigo-800/90 to-blue-900/90 overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              rotate: -360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          />
        </div>

        {/* Profile Avatar */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="relative z-10"
        >
          <motion.img
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            src={avatarUrl}
            alt="avatar"
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white/30 shadow-2xl object-contain cursor-pointer transition-all duration-300 hover:border-purple-300"
            onClick={() => setShowAvatarModal(true)}
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full border-4 border-purple-400/50"
          />
        </motion.div>

        {/* User Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center z-10 mt-4"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg mb-2">
            {user?.username}
          </h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-purple-200 text-lg sm:text-xl mb-4 max-w-md mx-auto"
          >
            {user?.motivation || "مستخدم نشط في مجتمع الحديث الشريف"}
          </motion.p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-6 mt-6 z-10 flex-wrap justify-center"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              <BookOpen className="w-6 h-6 text-purple-300 mb-2" />
            </motion.div>
            <span className="text-2xl sm:text-3xl font-bold text-white">
              {bookmarks.length}
            </span>
            <span className="text-purple-200 text-sm">أحاديث محفوظة</span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
            >
              <Share2 className="w-6 h-6 text-blue-300 mb-2" />
            </motion.div>
            <span className="text-2xl sm:text-3xl font-bold text-white">
              {cards.length}
            </span>
            <span className="text-blue-200 text-sm">بطاقات دعوية</span>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Account Information Card */}
      <motion.section
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 mb-8"
      >
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-200/50 p-6 sm:p-8"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex-1 space-y-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex items-center space-x-3 space-x-reverse"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {user?.username}
                  </h3>
                  <p className="text-gray-600">اسم المستخدم</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="flex items-center space-x-3 space-x-reverse"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user?.email}
                  </h3>
                  <p className="text-gray-600">البريد الإلكتروني</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="flex items-center space-x-3 space-x-reverse"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString("ar-EG")
                      : "تاريخ غير محدد"}
                  </h3>
                  <p className="text-gray-600">تاريخ التسجيل</p>
                </div>
              </motion.div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditName(user?.username || "");
                setEditImage(null);
                setEditImagePreview(avatarUrl);
                setShowEditModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Settings className="w-5 h-5" />
              تعديل الحساب
            </motion.button>
          </div>
        </motion.div>
      </motion.section>

      {/* Bookmarked Cards Section */}
      {bookmarkedCards.length > 0 && (
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 mb-8"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center mb-6"
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              البطاقات الدعوية المحفوظة
            </h3>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-purple-200/50 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-xl text-gray-900 mb-2">
                      {card.title}
                    </h4>
                    <p className="text-gray-600 text-sm mb-3">
                      {card.description}
                    </p>
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
                      <BookOpen className="w-4 h-4" />
                      <span>{card.total_hadiths || 0} حديث</span>
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center"
                  >
                    <Heart className="w-6 h-6 text-white" />
                  </motion.div>
                </div>

                <div className="flex gap-2 mt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyToClipboard(card)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    نسخ الرابط
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openDeleteModal("card", card.id)}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* My Dawah Cards Section */}
      <motion.section
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="max-w-6xl mx-auto px-4 sm:px-6 mb-16"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 }}
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              بطاقاتي الدعوية
            </h3>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6 }}
          >
            <Link
              to={`/create-card`}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-6 h-6" />
              إنشاء بطاقة جديدة
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-purple-200/50 shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-bold text-xl text-gray-900 mb-2">
                    {card.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-3">
                    {card.description}
                  </p>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
                    <BookOpen className="w-4 h-4" />
                    <span>{card.total_hadiths || 0} حديث</span>
                  </div>
                </div>
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center"
                >
                  <Award className="w-6 h-6 text-white" />
                </motion.div>
              </div>

              <div className="flex gap-2 mt-4 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openDeleteModal("card", card.id)}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setCardToEdit(card);
                    setShowCardEditModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  تعديل
                </motion.button>
                <Link
                  to={`/shared-card/${card.share_link}`}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                >
                  معاينة
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {cards.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              لا توجد بطاقات دعوية بعد
            </h3>
            <p className="text-gray-600 mb-6">
              ابدأ بإنشاء بطاقة دعوية جديدة لمشاركة الأحاديث الشريفة
            </p>
            <Link
              to={`/create-card`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-6 h-6" />
              إنشاء أول بطاقة
            </Link>
          </motion.div>
        )}
      </motion.section>

      {/* Enhanced Modals */}
      <AnimatePresence>
        {deleteModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-8 w-96 max-w-full text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                تأكيد الحذف
              </h3>
              <p className="mb-8 text-gray-600">هل أنت متأكد أنك تريد الحذف؟</p>
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmDelete}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300"
                >
                  تأكيد
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeDeleteModal}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300"
                >
                  إلغاء
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Edit Account Modal */}
      <Dialog
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <Dialog.Panel className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-auto p-8 z-10 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Dialog.Title className="text-2xl font-bold mb-6 text-gray-900">
                تعديل الحساب
              </Dialog.Title>

              <div className="flex flex-col items-center gap-6 mb-6">
                <motion.div whileHover={{ scale: 1.05 }} className="relative">
                  <img
                    src={editImagePreview}
                    alt="avatar preview"
                    className="w-32 h-32 rounded-full border-4 border-purple-300 object-cover shadow-lg"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 rounded-full border-4 border-purple-400/50"
                  />
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditImage(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-500 file:to-blue-600 file:text-white hover:file:from-purple-600 hover:file:to-blue-700 transition-all duration-300"
                  />
                </motion.div>
              </div>

              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="اسم المستخدم الجديد"
                className="w-full mb-6 px-6 py-4 rounded-2xl bg-gray-50 text-gray-900 border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg transition-all duration-300"
              />

              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-60"
                >
                  {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEditModal(false)}
                  className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300"
                >
                  إلغاء
                </motion.button>
              </div>
            </motion.div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Enhanced Avatar Modal */}
      <Dialog
        open={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4 bg-black/60 backdrop-blur-sm">
          <Dialog.Panel className="relative bg-transparent shadow-none flex flex-col items-center justify-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAvatarModal(false)}
              className="absolute top-4 left-4 bg-white/90 text-gray-700 rounded-full p-3 shadow-lg hover:bg-white z-20"
              title="إغلاق"
            >
              ×
            </motion.button>
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={avatarUrl}
              alt="avatar-large"
              className="max-w-[90vw] max-h-[80vh] rounded-3xl border-4 border-purple-300 shadow-2xl bg-white"
              style={{ objectFit: "contain" }}
            />
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Edit Card Modal */}
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
