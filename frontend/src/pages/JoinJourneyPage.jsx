import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  Check,
  ArrowLeft,
  Book,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useRamadanTheme } from "../context/RamadanThemeContext";
import { joinViaShareCode } from "../services/bookJourneysService";
import SEO from "../components/SEO";
import RamadanCountdown from "../components/ramadan/RamadanCountdown";
import RamadanFloatingElements from "../components/ramadan/RamadanFloatingElements";
import "../styles/book-journeys.css";

const JoinJourneyPage = () => {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isRamadanThemeActive } = useRamadanTheme();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (shareCode && user) {
      handleJoin();
    }
  }, [shareCode, user]);

  const handleJoin = async () => {
    try {
      setLoading(true);
      setJoining(true);
      const response = await joinViaShareCode(shareCode);
      setResult(response);
      toast.success(response.message || "تم الانضمام بنجاح!");
    } catch (err) {
      console.error("Error joining journey:", err);
      setError(err.response?.data?.message || "حدث خطأ في الانضمام");
      toast.error(err.response?.data?.message || "حدث خطأ في الانضمام");
    } finally {
      setLoading(false);
      setJoining(false);
    }
  };

  const bgClass = isRamadanThemeActive
    ? "ramadan-bg-gradient"
    : "bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50";

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${bgClass}`}
      >
        <SEO
          title="انضمام لختمة كتاب | مشكاة"
          description="انضم لصديقك في ختمة كتاب من كتب الحديث الشريف وتابعوا التقدم معاً"
          keywords="ختمة، انضمام، أصدقاء، قراءة جماعية"
        />
        {isRamadanThemeActive && <RamadanCountdown />}
        {isRamadanThemeActive && <RamadanFloatingElements />}
        <div className="text-center">
          <div className="journey-spinner w-16 h-16 mx-auto mb-4" />
          <p className="text-gray-600 arabic-text">جاري الانضمام للختمة...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${bgClass}`}
      >
        {isRamadanThemeActive && <RamadanCountdown />}
        {isRamadanThemeActive && <RamadanFloatingElements />}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Book className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2 arabic-text">
            حدث خطأ
          </h2>
          <p className="text-gray-600 mb-6 arabic-text">{error}</p>
          <button
            onClick={() => navigate("/book-journeys")}
            className="journey-btn-primary w-full"
          >
            تصفح الكتب المتاحة
          </button>
        </motion.div>
      </div>
    );
  }

  if (result) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${bgClass}`}
      >
        {isRamadanThemeActive && <RamadanCountdown />}
        {isRamadanThemeActive && <RamadanFloatingElements />}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check className="w-10 h-10 text-purple-600" />
          </motion.div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2 arabic-text">
            {result.is_new ? "تم الانضمام بنجاح!" : "أنت مشترك بالفعل!"}
          </h2>

          <p className="text-gray-600 mb-6 arabic-text">
            {result.is_new ? (
              <>
                انضممت لقراءة الكتاب مع{" "}
                <span className="font-bold text-purple-600">
                  {result.inviter}
                </span>
              </>
            ) : (
              "لديك ختمة نشطة لهذا الكتاب"
            )}
          </p>

          <div className="flex items-center justify-center gap-2 mb-6 text-purple-600">
            <Users className="w-5 h-5" />
            <span className="arabic-text">أصبحتما أصدقاء في هذه الختمة!</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/book-journeys")}
              className="flex-1 journey-btn-secondary"
            >
              جميع الختمات
            </button>
            <button
              onClick={() => navigate(`/book-journeys/${result.journey_id}`)}
              className="flex-1 journey-btn-primary flex items-center justify-center gap-2"
            >
              ابدأ القراءة
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default JoinJourneyPage;
