import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import {
  Heart,
  Share2,
  Trash,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Lightbulb,
  Bookmark,
  Eye,
  Copy,
  ExternalLinkIcon,
  BarChart3,
} from "lucide-react";
import { Dialog } from "@headlessui/react";
import QRCode from "react-qr-code";

// Add these imports at the top
import { showToast } from "../utils/toast";
import toast from "react-hot-toast";

const HadithItem = ({ hadith, index, card, handleDeleteHadith }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Calculate if the hadith is long enough to need expansion
  const isLongHadith = true;

  const saveToBookmark = async (hadithId) => {
    try {
      if (isBookmarked) {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/bookmarks/remove/${hadithId}`,
          {
            headers: {
              "x-auth-token": localStorage.getItem("token"),
            },
          }
        );
        toast.success("تم إزالة الحديث من المحفوظات بنجاح");
        setIsBookmarked(false);
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/bookmarks/add`,
          {
            hadith_id: hadithId,
          },
          {
            headers: {
              "x-auth-token": localStorage.getItem("token"),
            },
          }
        );
        toast.success("تم حفظ الحديث في المحفوظات بنجاح");
        setIsBookmarked(true);
      }
      getAllBookMarkedHadiths();
    } catch (error) {
      console.error("Error managing bookmark:", error);
      showToast("error", "حدث خطأ أثناء حفظ الحديث");
    }
  };

  const getAllBookMarkedHadiths = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/bookmarks`,
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }
      );
      // Check if current hadith is bookmarked
      const isHadithBookmarked = response.data.some(
        (bookmarked) => bookmarked.hadith_id == hadith.hadith_id
      );
      setIsBookmarked(isHadithBookmarked);
    } catch (error) {
      console.error("Error fetching bookmarked hadiths:", error);
    }
  };

  useEffect(() => {
    getAllBookMarkedHadiths();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700"
    >
      <div className="p-6">
        {/* Hadith Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
              {index + 1}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                حديث {index + 1}
              </h3>
              {hadith.grade && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {hadith.grade}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => saveToBookmark(hadith.hadith_id)}
              className={`p-2 rounded-full transition-colors ${
                isBookmarked
                  ? "bg-[#7440E9] text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              }`}
            >
              <Bookmark
                className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`}
              />
            </motion.button>
          </div>
        </div>

        {/* Hadith Content */}
        <div className="relative">
          <motion.div
            initial={false}
            animate={{ height: isExpanded ? "auto" : "80px" }}
            className="overflow-hidden"
          >
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                {hadith.text}
              </p>
              {hadith.attribution && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {hadith.attribution}
                </p>
              )}
            </div>
          </motion.div>

          {/* Gradient Overlay */}
          {!isExpanded && isLongHadith && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-800 to-transparent" />
          )}
        </div>

        {/* Expand/Collapse Button */}
        {isLongHadith && (
          <div className="flex justify-center mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-full transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>تصغير</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>قراءة المزيد</span>
                </>
              )}
            </motion.button>
          </div>
        )}

        {/* Explanation Section */}
        {hadith.notes && (
          <motion.div
            initial={false}
            animate={{ height: showExplanation ? "auto" : "0" }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                شرح الحديث
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {hadith.notes}
              </p>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              <span>شرح الحديث</span>
            </button>

            <Link
              to={`/hadiths/hadith/${hadith.hadith_id}`}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>المصدر</span>
            </Link>
          </div>
          {card?.card?.is_owner && (
            <button
              onClick={() => handleDeleteHadith(hadith.id)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

HadithItem.propTypes = {
  hadith: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    attribution: PropTypes.string,
    grade: PropTypes.string,
    notes: PropTypes.string,
    external_link: PropTypes.string,
    created_at: PropTypes.string,
    hadith_id: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  card: PropTypes.shape({
    card: PropTypes.shape({
      is_owner: PropTypes.bool,
    }),
  }),
  handleDeleteHadith: PropTypes.func.isRequired,
};

const SharedCard = () => {
  const { shareLink } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);

  const [copied, setCopied] = useState(false);
  const [showLikedUsersModal, setShowLikedUsersModal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    type: null,
    id: null,
    commentId: null,
  });
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [comments, setComments] = useState([]);
  const [metrics, setMetrics] = useState({
    views: 0,
    shares: 0,
    likes: 0,
  });
  const [hasLiked, setHasLiked] = useState(false);
  const [likedUsers, setLikedUsers] = useState([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    likes: [],
    views: [],
    shares: [],
    summary: {
      views: { unique: 0, total: 0 },
      likes: { unique: 0, total: 0 },
      shares: { unique: 0, total: 0 },
    },
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // 3. All useEffect hooks
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/cards/shared/${shareLink}`,
          { headers: { "x-auth-token": token } }
        );
        setCard(response.data.data);
        setLoading(false);

        const metrics = await axios.get(
          `${import.meta.env.VITE_API_URL}/cards/${card?.card?.id}/metrics`
        );
        setMetrics(metrics.data);
      } catch (error) {
        console.error("Error fetching shared card:", error);
        setLoading(false);
      }
    };
    fetchCard();
  }, [shareLink]);
  useEffect(() => {
    const trackView = async () => {
      if (card?.card?.id) {
        try {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/cards/${card.card.id}/track/view`,
            {},
            { headers: { "x-auth-token": localStorage.getItem("token") } }
          );
          fetchMetrics();
        } catch (error) {
          console.error("Error tracking view:", error);
        }
      }
    };

    trackView();
  }, [card?.card?.id]);
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (user && card?.card?.id) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/cards/${card.card.id}/bookmark`,
            { headers: { "x-auth-token": localStorage.getItem("token") } }
          );
          setIsBookmarked(response.data.isBookmarked);
        } catch (error) {
          console.error("Error checking bookmark status:", error);
        }
      }
    };
    checkBookmarkStatus();
  }, [user, card?.card?.id]);

  useEffect(() => {
    if (card?.card?.id) {
      fetchComments();
      fetchMetrics();
    }
  }, [card?.card?.id]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchLikedUsers = async () => {
      if (card?.card?.id) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/cards/${card.card.id}/likes`,
            { headers: { "x-auth-token": token } }
          );
          setLikedUsers(response.data);
          // Check if current user has liked
          const hasUserLiked = response.data.some(
            (likedUser) => likedUser.id === user?.id
          );
          setHasLiked(hasUserLiked);
        } catch (error) {
          console.error("Error fetching liked users:", error);
        }
      }
    };
    fetchLikedUsers();
  }, [card?.card?.id, user?.id]);

  const handleBookmark = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    try {
      if (isBookmarked) {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/cards/${card.card.id}/bookmark`,
          { headers: { "x-auth-token": localStorage.getItem("token") } }
        );
        setIsBookmarked(false);
        toast.success("تم إزالة البطاقة من المحفوظات");
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/cards/${card.card.id}/bookmark`,
          {},
          { headers: { "x-auth-token": localStorage.getItem("token") } }
        );
        setIsBookmarked(true);
        toast.success("تم حفظ البطاقة في المحفوظات");
      }
    } catch (error) {
      console.error("Error bookmarking card:", error);
      toast.error("حدث خطأ أثناء حفظ البطاقة");
    }
  };

  useEffect(() => {
    if (card?.card?.id) {
      fetchComments();
    }
  }, [card?.card?.id]);

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/cards/${
          card.card.id
        }/comments/${commentId}`,
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );
      setDeleteModal({ open: false, type: null, id: null, commentId: null });
      fetchComments();
      toast.success("تم حذف التعليق بنجاح");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("حدث خطأ أثناء حذف التعليق");
    }
  };

  const fetchMetrics = async () => {
    if (card?.card?.id) {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/cards/${card.card.id}/metrics`
        );
        setMetrics(response.data);
      } catch (error) {
        console.error("Error fetching metrics:", error);
      }
    }
  };

  const handleShare = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/cards/${card.card.id}/track/share`,
        {},
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }
      );
      // send notification
      await axios.post(
        `
        ${import.meta.env.VITE_API_URL}/notifications`,
        {
          user_id: card.metadata.created_by.id,
          message: `قام ${user.username} بمشاركة  بطاقتك "${card.card.title}"`,
          type: "share",
          card_id: card.card.id,
          sender_id: user.id,
        },
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }
      );
      fetchMetrics();
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      handleUnauthenticatedAction();
      return;
    }
    if (!hasLiked) {
      try {
        setHasLiked(true);
        setMetrics((prev) => ({ ...prev, likes: prev.likes + 1 }));
        await axios.post(
          `${import.meta.env.VITE_API_URL}/cards/${card.card.id}/track/like`,
          {},
          { headers: { "x-auth-token": localStorage.getItem("token") } }
        );
        await axios.post(
          `${import.meta.env.VITE_API_URL}/notifications`,
          {
            user_id: card.metadata.created_by.id,
            message: `قام ${user.username} بالإعجاب ببطاقتك "${card.card.title}"`,
            type: "like",
            card_id: card.card.id,
            sender_id: user.id,
          },
          { headers: { "x-auth-token": localStorage.getItem("token") } }
        );
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/cards/${card.card.id}/likes`,
          { headers: { "x-auth-token": localStorage.getItem("token") } }
        );
        setLikedUsers(response.data);
      } catch (error) {
        console.error("Error liking:", error);
        setHasLiked(false);
        setMetrics((prev) => ({ ...prev, likes: prev.likes - 1 }));
        toast.error("حدث خطأ أثناء الإعجاب بالبطاقة");
      }
    } else {
      try {
        setHasLiked(false);
        setMetrics((prev) => ({ ...prev, likes: prev.likes - 1 }));
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/cards/${card.card.id}/track/like`,
          { headers: { "x-auth-token": localStorage.getItem("token") } }
        );
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/cards/${card.card.id}/likes`,
          { headers: { "x-auth-token": localStorage.getItem("token") } }
        );
        setLikedUsers(response.data);
      } catch (error) {
        console.error("Error unliking:", error);
        setHasLiked(true);
        setMetrics((prev) => ({ ...prev, likes: prev.likes + 1 }));
        toast.error("حدث خطأ أثناء إلغاء الإعجاب");
      }
    }
  };

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

  const fetchComments = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/cards/${card.card.id}/comments`,
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );

      // send notification
      await axios.post(
        `
        ${import.meta.env.VITE_API_URL}/notifications`,
        {
          user_id: card.metadata.created_by.id,
          message: `قام ${user.username} بالتعليق على بطاقتك "${card.card.title}"`,
          type: "comment",
          card_id: card.card.id,
          sender_id: user.id,
        },
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }
      );
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      handleUnauthenticatedAction();
      return;
    }
    if (!newComment.trim()) return;

    try {
      const commentPromise = axios.post(
        `${import.meta.env.VITE_API_URL}/cards/${card.card.id}/comments`,
        { content: newComment },
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );

      toast.promise(commentPromise, {
        pending: "جاري تسجيل التعليق...",
        success: "تم التعليق بنجاح",
        error: "حدث خطأ أثناء التعليق",
      });

      await commentPromise;

      await axios.post(
        `${import.meta.env.VITE_API_URL}/notifications`,
        {
          user_id: card.metadata.created_by.id,
          message: `قام ${user.username} بالتعليق على بطاقتك "${card.card.title}"`,
          type: "comment",
          card_id: card.card.id,
          sender_id: user.id,
        },
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );

      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Add function to handle unauthenticated actions
  const handleUnauthenticatedAction = () => {
    setShowLoginPrompt(true);
  };

  // Function to fetch analytics details
  const fetchAnalyticsDetails = async () => {
    if (!user || !card?.card?.id || card?.card?.user_id !== user.id) {
      return;
    }

    setAnalyticsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/cards/${
          card.card.id
        }/analytics-details`,
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );

      // Remove duplicate viewers based on user_id or user_ip
      const uniqueViews = response.data.views.reduce((acc, view) => {
        const key = view.id || view.user_ip;
        if (!acc.find((v) => (v.id || v.user_ip) === key)) {
          acc.push(view);
        }
        return acc;
      }, []);

      setAnalyticsData({
        ...response.data,
        views: uniqueViews,
      });
    } catch (error) {
      console.error("Error fetching analytics details:", error);
      toast.error("حدث خطأ أثناء جلب تفاصيل التحليلات");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Function to open analytics modal
  const handleOpenAnalytics = () => {
    if (!user) {
      handleUnauthenticatedAction();
      return;
    }

    if (card?.card?.user_id !== user.id) {
      toast.error("يمكن فقط لصاحب البطاقة عرض التفاصيل");
      return;
    }

    setShowAnalyticsModal(true);
    fetchAnalyticsDetails();
  };

  // احصل على رابط البطاقة الحالي
  const cardUrl = `${window.location.origin}/shared-card/${
    card?.card?.share_link || card?.card?.id
  }`;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#7440E9]/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-[#7440E9] rounded-full absolute top-0 left-0 animate-spin border-t-transparent"></div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              جاري التحميل
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              يرجى الانتظار قليلاً...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] py-8 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* زخارف إسلامية SVG في الخلفية */}
      <svg
        className="absolute top-0 right-0 opacity-10 z-0 pointer-events-none"
        width="220"
        height="220"
        viewBox="0 0 220 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="110"
          cy="110"
          r="100"
          stroke="#7440E9"
          strokeWidth="8"
          strokeDasharray="12 12"
        />
      </svg>
      <svg
        className="absolute bottom-0 left-0 opacity-10 z-0 pointer-events-none"
        width="180"
        height="180"
        viewBox="0 0 180 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="20"
          y="20"
          width="140"
          height="140"
          rx="40"
          stroke="#7440E9"
          strokeWidth="7"
          strokeDasharray="10 10"
        />
      </svg>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Card Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 80 }}
          className="bg-white/80 backdrop-blur-xl border-2 border-[#e3d8fa] rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center transition-all duration-300 min-h-[420px] overflow-hidden mb-12"
        >
          {/* صورة الخلفية */}
          {card?.card?.background_url && (
            <div className="h-48 w-full relative rounded-2xl mb-8 overflow-hidden">
              <img
                src={
                  card.card.background_url.startsWith("http")
                    ? card.card.background_url
                    : card.card.background_url.startsWith("/uploads") ||
                      card.card.background_url.startsWith("/api/uploads")
                    ? `${import.meta.env.VITE_IMAGE_API}/api/${
                        card.card.background_url
                      }`
                    : `${import.meta.env.VITE_API_URL}/uploads/backgrounds/${
                        card.card.background_url
                      }`
                }
                alt={card.card.title}
                loading="lazy"
                className="w-full h-full object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60 rounded-2xl" />
            </div>
          )}

          {/* العنوان */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#7440E9] mb-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#7440E9] to-[#8B5CF6] rounded-2xl flex items-center justify-center shadow-lg">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
              </svg>
            </div>
            {card?.card?.title}
          </h1>

          {/* الوصف */}
          {card?.card?.description && (
            <p className="text-gray-700 text-lg mb-6 max-w-2xl mx-auto leading-relaxed">
              {card.card.description}
            </p>
          )}

          {/* الوسوم */}
          {card?.card?.tags && card.card.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              {card.card.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 text-sm rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 font-semibold"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* معلومات المنشئ */}
          {card?.metadata?.created_by && (
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <img
                  src={getAvatarUrl(card?.metadata?.created_by)}
                  alt={card.metadata.created_by.avatar_url}
                  className="w-20 h-20 rounded-full border-4 border-[#e3d8fa] object-cover shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-[#7440E9] to-[#8B5CF6] rounded-full flex items-center justify-center">
                  <svg width="12" height="12" fill="white" viewBox="0 0 12 12">
                    <path d="M6 0C2.69 0 0 2.69 0 6s2.69 6 6 6 6-2.69 6-6S9.31 0 6 0zm3 8.5L5.5 6.5 4 8l3 3 5-5-1.5-1.5L9 8.5z" />
                  </svg>
                </div>
              </div>
              <span className="text-[#7440E9] font-bold text-lg mt-2">
                {card.metadata.created_by.username}
              </span>
              <span className="text-gray-500 text-sm">
                {new Date(card?.card?.created_at).toLocaleDateString("ar-EG")}
              </span>
            </div>
          )}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center justify-center gap-2 sm:gap-4 lg:gap-6 mb-8 flex-wrap"
        >
          <button className="p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-white/80 border border-[#e3d8fa] shadow-lg transition-all hover:bg-[#f3edff] hover:scale-105 flex items-center gap-2 sm:gap-3 lg:gap-4">
            <Eye className="w-5 h-5 sm:w-6 h-6 lg:w-8 h-8 text-[#7440E9]" />
            <div className="text-center">
              <div className="font-bold text-sm sm:text-lg lg:text-xl text-[#7440E9]">
                {metrics.views}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">مشاهدات</div>
            </div>
          </button>

          <button
            onClick={handleLike}
            className={`p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-white/80 border border-[#e3d8fa] shadow-lg transition-all hover:bg-[#f3edff] hover:scale-105 flex items-center gap-2 sm:gap-3 lg:gap-4 ${
              hasLiked ? "text-red-500 border-red-200" : ""
            }`}
          >
            <Heart
              className={`w-5 h-5 sm:w-6 h-6 lg:w-8 h-8 ${
                hasLiked ? "fill-current" : ""
              }`}
            />
            <div className="text-center">
              <div className="font-bold text-sm sm:text-lg lg:text-xl">
                {metrics.likes}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">إعجابات</div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowShareDialog(true), handleShare();
            }}
            className="p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-white/80 border border-[#e3d8fa] shadow-lg transition-all hover:bg-[#f3edff] hover:scale-105 flex items-center gap-2 sm:gap-3 lg:gap-4"
          >
            <Share2 className="w-5 h-5 sm:w-6 h-6 lg:w-8 h-8 text-[#7440E9]" />
            <div className="text-center">
              <div className="font-bold text-sm sm:text-lg lg:text-xl text-[#7440E9]">
                {metrics?.shares}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">مشاركات</div>
            </div>
          </button>

          <button
            onClick={handleBookmark}
            className={`p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-white/80 border border-[#e3d8fa] shadow-lg transition-all hover:bg-[#f3edff] hover:scale-105 flex items-center gap-2 sm:gap-3 lg:gap-4 ${
              isBookmarked ? "text-[#7440E9] border-[#7440E9]" : ""
            }`}
          >
            <Bookmark
              className={`w-5 h-5 sm:w-6 h-6 lg:w-8 h-8 ${
                isBookmarked ? "fill-current" : ""
              }`}
            />
            <div className="text-center">
              <div className="font-bold text-sm sm:text-lg lg:text-xl">
                {isBookmarked ? "محفوظة" : "حفظ"}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">البطاقة</div>
            </div>
          </button>

          {/* Analytics Button for Card Owner */}
          {user && card?.card?.user_id === user.id && (
            <button
              onClick={handleOpenAnalytics}
              className="p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white shadow-lg transition-all hover:scale-105 flex items-center gap-2 sm:gap-3 lg:gap-4"
            >
              <BarChart3 className="w-5 h-5 sm:w-6 lg:w-8 " />
              <div className="text-center">
                <div className="font-bold text-sm sm:text-md lg:text-md">
                  تفاصيل
                </div>
                <div className="text-xs sm:text-sm text-white/80">
                  التحليلات
                </div>
              </div>
            </button>
          )}
        </motion.div>

        {/* Hadiths Section */}
        {card?.hadiths && card.hadiths.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#7440E9] mb-2">
                الأحاديث في هذه البطاقة
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {card?.hadiths.map((hadith, idx) => (
                <motion.div
                  key={hadith.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg border border-[#e3d8fa] p-8 text-right relative overflow-hidden"
                >
                  {/* Background Pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                    <svg viewBox="0 0 100 100" fill="none">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#7440E9"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#7440E9] to-[#8B5CF6] rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#7440E9]">
                          حديث {idx + 1}
                        </h3>
                        {hadith.grade && (
                          <span className="text-sm text-gray-500">
                            {hadith.grade}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-6 text-gray-800 leading-relaxed text-lg">
                      {hadith.text}
                    </div>

                    {hadith.attribution && (
                      <div className="text-sm text-gray-500 mb-4 p-3 bg-gray-50 rounded-xl">
                        {hadith.attribution}
                      </div>
                    )}

                    {hadith.grade && (
                      <span className="inline-block px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold text-sm mb-4">
                        {hadith.grade}
                      </span>
                    )}

                    {hadith.notes && (
                      <div className="mt-6 p-6 bg-gradient-to-r from-[#7440E9]/5 to-[#8B5CF6]/5 border border-[#e3d8fa] rounded-2xl">
                        <h4 className="font-bold text-[#7440E9] mb-3 flex items-center gap-2">
                          <Lightbulb className="w-5 h-5" />
                          شرح الحديث
                        </h4>
                        <div className="text-gray-700 leading-relaxed">
                          {hadith.notes}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-start gap-4 mt-6 pt-6 border-t border-[#e3d8fa]">
                      {hadith.external_link && (
                        <a
                          href={hadith.external_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all shadow-lg"
                        >
                          <ExternalLinkIcon className="w-4 h-4" />
                          مشاهدة على يوتيوب
                        </a>
                      )}
                      <Link
                        to={`/hadiths/hadith/${hadith.hadith_id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white font-bold text-sm hover:from-[#6D28D9] hover:to-[#7C3AED] transition-all shadow-lg"
                      >
                        <span>شاهد شرح الحديث</span>
                        <ExternalLinkIcon className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg border border-[#e3d8fa] p-8 relative z-10"
        >
          <h3 className="text-2xl font-bold mb-6 text-[#7440E9] text-center">
            التعليقات
          </h3>

          {/* عرض التعليقات */}
          {comments.length === 0 ? (
            <div className="text-center text-gray-500 mb-6 py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <p>لا توجد تعليقات بعد.</p>
            </div>
          ) : (
            <div className="space-y-6 mb-8">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex items-start gap-4 bg-white/80 rounded-2xl p-6 border border-gray-100 shadow-sm"
                >
                  <img
                    src={getAvatarUrl(comment.user)}
                    alt={comment.user.username}
                    className="w-12 h-12 object-cover rounded-full border-2 border-[#7440E9] shadow-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-800">
                        {comment.user.username}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleString("ar-EG")}
                      </span>
                    </div>
                    <div className="text-gray-700 text-base leading-relaxed">
                      {comment.content}
                    </div>
                  </div>
                  {user &&
                    (user.id === comment.user.id ||
                      user.id === card?.card?.user_id) && (
                      <button
                        onClick={() =>
                          setDeleteModal({
                            open: true,
                            type: "comment",
                            id: comment.id,
                            commentId: comment.id,
                          })
                        }
                        className="text-red-500 hover:text-red-700 bg-white/70 rounded-full p-2 shadow transition-colors"
                        title="حذف التعليق"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                </div>
              ))}
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="أضف تعليقًا..."
                className="flex-1 p-4 rounded-2xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#7440E9] focus:border-transparent text-base shadow-lg"
              />
              <button
                onClick={handleAddComment}
                className="bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white p-4 rounded-2xl hover:from-[#6D28D9] hover:to-[#7C3AED] transition-all shadow-lg flex items-center gap-2 font-bold"
              >
                <span>إرسال</span>
                <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                  <path
                    d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-6">
              <p>يجب تسجيل الدخول لإضافة تعليق.</p>
            </div>
          )}
        </motion.div>
      </div>
      <Dialog
        open={showLikedUsersModal}
        onClose={() => setShowLikedUsersModal(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4 font-cairo">
          <Dialog.Panel className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto p-6 z-10">
            <Dialog.Title className="text-lg font-bold mb-4 text-[#7440E9]">
              المعجبون بالبطاقة
            </Dialog.Title>
            <button
              onClick={() => setShowLikedUsersModal(false)}
              className="absolute top-3 left-3 text-gray-400 hover:text-gray-700"
            >
              ✕
            </button>
            {likedUsers.length === 0 ? (
              <div className="text-center text-gray-500">
                لا يوجد معجبون بعد.
              </div>
            ) : (
              <ul className="space-y-3">
                {likedUsers.map((u) => (
                  <li key={u.id} className="flex items-center gap-3">
                    <img
                      src={getAvatarUrl(u)}
                      className="w-9 h-9 rounded-full border object-cover"
                      alt={u.username}
                    />
                    <span className="font-semibold text-gray-800">
                      {u.username}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
      {/* Dialog المشاركة */}
      <Dialog
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4 font-cairo">
          <Dialog.Panel className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto p-6 z-10 text-center">
            <Dialog.Title className="text-lg font-bold mb-4 text-[#7440E9]">
              مشاركة البطاقة
            </Dialog.Title>
            <button
              onClick={() => setShowShareDialog(false)}
              className="absolute top-3 left-3 text-gray-400 hover:text-gray-700"
            >
              ✕
            </button>
            <div className="flex flex-col items-center gap-4">
              <QRCode
                value={cardUrl}
                size={140}
                className="mx-auto rounded-lg border border-[#e3d8fa] bg-white p-2"
              />
              <div className="flex items-center gap-2 w-full justify-center mt-2">
                <input
                  type="text"
                  value={cardUrl}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-[#e3d8fa] bg-gray-50 text-gray-700 text-sm text-center font-mono select-all"
                  style={{ direction: "ltr" }}
                />
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(cardUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="p-2 rounded-full bg-[#f3edff] text-[#7440E9] hover:bg-[#e3d8fa] transition"
                  title="نسخ الرابط"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              {copied && (
                <div className="text-green-600 font-semibold mt-2 animate-pulse">
                  تم النسخ!
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      {/* Analytics Modal */}
      <Dialog
        open={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 font-cairo pt-16 sm:pt-20">
          <Dialog.Panel className="relative bg-white rounded-xl sm:rounded-2xl shadow-xl max-w-sm sm:max-w-2xl lg:max-w-4xl w-full mx-auto p-3 sm:p-4 z-10 max-h-[80vh] overflow-y-auto">
            <Dialog.Title className="text-base sm:text-lg font-bold mb-3 text-[#7440E9] text-center pt-4">
              تفاصيل تحليلات البطاقة
            </Dialog.Title>

            {/* Close and Back Buttons */}
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex justify-between items-center">
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="text-gray-400 hover:text-gray-700 text-lg sm:text-xl bg-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shadow-md"
              >
                ✕
              </button>
            </div>

            {analyticsLoading ? (
              <div className="flex items-center justify-center py-6 mt-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7440E9]"></div>
                <span className="mr-2 text-gray-600 text-xs">
                  جاري التحميل...
                </span>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6 mt-12">
                {/* Header with Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 mb-1">
                      {analyticsData.summary.views.unique}
                    </div>
                    <div className="text-blue-700 font-semibold text-xs sm:text-sm">
                      مشاهد
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 mb-1">
                      {analyticsData.summary.likes.unique}
                    </div>
                    <div className="text-red-700 font-semibold text-xs sm:text-sm">
                      معجب
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 mb-1">
                      {analyticsData.summary.shares.unique}
                    </div>
                    <div className="text-green-700 font-semibold text-xs sm:text-sm">
                      مشارك
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Likes Section */}
                  <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-5 shadow-sm">
                    <h3 className="text-base sm:text-lg font-bold text-[#7440E9] mb-3 sm:mb-4 flex items-center gap-2">
                      <Heart className="w-4 h-4 sm:w-5 h-5 text-red-500" />
                      المعجبون ({analyticsData.likes.length})
                    </h3>
                    {analyticsData.likes.length === 0 ? (
                      <div className="text-center text-gray-500 py-4 sm:py-6">
                        لا يوجد معجبون بعد
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3 max-h-32 sm:max-h-48 overflow-y-auto">
                        {analyticsData.likes.map((like, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 sm:gap-3 bg-gray-50 rounded-lg p-2 sm:p-3"
                          >
                            <img
                              src={getAvatarUrl(like)}
                              alt={like.username}
                              className="w-6 h-6 sm:w-8 h-8 rounded-full border border-[#7440E9] object-cover"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 text-sm sm:text-base">
                                {like.username}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(like.liked_at).toLocaleString(
                                  "ar-EG"
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Views Section */}
                  <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-5 shadow-sm">
                    <h3 className="text-base sm:text-lg font-bold text-[#7440E9] mb-3 sm:mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4 sm:w-5 h-5 text-blue-500" />
                      المشاهدون ({analyticsData.views.length})
                    </h3>
                    <p className="text-xs text-gray-600 mb-2 sm:mb-3 bg-blue-50 p-2 rounded-lg">
                      كل مشاهد مرة واحدة فقط
                    </p>
                    {analyticsData.views.length === 0 ? (
                      <div className="text-center text-gray-500 py-4 sm:py-6">
                        لا يوجد مشاهدون بعد
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3 max-h-32 sm:max-h-48 overflow-y-auto">
                        {analyticsData.views.map((view, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 sm:gap-3 bg-gray-50 rounded-lg p-2 sm:p-3"
                          >
                            {view.id ? (
                              <img
                                src={getAvatarUrl(view)}
                                alt={view.username}
                                className="w-6 h-6 sm:w-8 h-8 rounded-full border border-[#7440E9] object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 sm:w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                                <svg
                                  width="10"
                                  height="10"
                                  fill="gray"
                                  viewBox="0 0 20 20"
                                  className="sm:w-3 sm:h-3"
                                >
                                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM3 15a2 2 0 012-2h10a2 2 0 012 2v1H3v-1z" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 text-sm sm:text-base">
                                {view.id ? view.username : "مستخدم مجهول"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(view.viewed_at).toLocaleString(
                                  "ar-EG"
                                )}
                              </div>
                              {!view.id && (
                                <div className="text-xs text-gray-400 mt-1">
                                  <span className="bg-gray-200 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs">
                                    IP: {view.user_ip?.substring(0, 8)}...
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Shares Section - Full Width */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-5 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold text-[#7440E9] mb-3 sm:mb-4 flex items-center gap-2">
                    <Share2 className="w-4 h-4 sm:w-5 h-5 text-green-500" />
                    المشاركون ({analyticsData.shares.length})
                  </h3>
                  {analyticsData.shares.length === 0 ? (
                    <div className="text-center text-gray-500 py-4 sm:py-6">
                      لا يوجد مشاركون بعد
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-h-32 sm:max-h-48 overflow-y-auto">
                      {analyticsData.shares.map((share, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 sm:gap-3 bg-gray-50 rounded-lg p-2 sm:p-3"
                        >
                          <img
                            src={getAvatarUrl(share)}
                            alt={share.username}
                            className="w-6 h-6 sm:w-8 h-8 rounded-full border border-[#7440E9] object-cover"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800 text-sm sm:text-base">
                              {share.username}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(share.shared_at).toLocaleString(
                                "ar-EG"
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Dialog تسجيل الدخول */}
      <Dialog
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4 font-cairo">
          <Dialog.Panel className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto p-6 z-10 text-center">
            <Dialog.Title className="text-lg font-bold mb-4 text-[#7440E9]">
              يجب تسجيل الدخول أولاً
            </Dialog.Title>
            <p className="mb-6 text-gray-700">
              يرجى تسجيل الدخول للقيام بهذا الإجراء. بعد تسجيل الدخول ستعود
              تلقائياً لنفس البطاقة.
            </p>
            <button
              onClick={() => {
                localStorage.setItem(
                  "redirectPath",
                  window.location.pathname + window.location.search
                );
                setShowLoginPrompt(false);
                navigate("/login");
              }}
              className="w-full py-3 rounded-xl bg-[#7440E9] text-white font-bold text-base hover:bg-[#8f5cf7] transition mb-2"
            >
              الذهاب لتسجيل الدخول
            </button>
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="w-full py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold text-base hover:bg-gray-200 transition"
            >
              إلغاء
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Dialog تأكيد حذف التعليق */}
      <Dialog
        open={deleteModal.open}
        onClose={() =>
          setDeleteModal({ open: false, type: null, id: null, commentId: null })
        }
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4 font-cairo">
          <Dialog.Panel className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto p-6 z-10 text-center">
            <Dialog.Title className="text-lg font-bold mb-4 text-[#7440E9]">
              تأكيد حذف التعليق
            </Dialog.Title>
            <p className="mb-6 text-gray-700">
              هل أنت متأكد أنك تريد حذف هذا التعليق؟ لا يمكن التراجع عن هذا
              الإجراء.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() =>
                  setDeleteModal({
                    open: false,
                    type: null,
                    id: null,
                    commentId: null,
                  })
                }
                className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDeleteComment(deleteModal.commentId)}
                className="px-6 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 font-semibold transition-colors"
              >
                تأكيد الحذف
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default SharedCard;
