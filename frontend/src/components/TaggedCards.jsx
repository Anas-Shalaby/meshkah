import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Clock, Eye, Heart, Book } from "lucide-react";

const TaggedCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const { tag } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const fetchTaggedCards = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/cards/tags/${encodeURIComponent(
            tag
          )}`
        );
        setCards(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tagged cards:", error);
        setLoading(false);
      }
    };

    fetchTaggedCards();
  }, [tag]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 ">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }
  return (
    <div
      className="min-h-screen relative py-8 px-4 sm:px-6 lg:px-8 overflow-x-hidden"
      style={{
        background:
          "linear-gradient(135deg, #f7f6fb 0%, #f3edff 60%, #e9e4f5 100%)",
      }}
    >
      {/* نقش إسلامي في الخلفية */}
      <img
        src="/assets/arabic-pattern-classic.svg"
        alt="نقش إسلامي"
        className="pointer-events-none select-none fixed top-0 left-0 w-full h-full object-cover opacity-10 z-0"
        style={{ mixBlendMode: "multiply" }}
      />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900  mb-4">
            البطاقات المتعلقة بـ: {tag}
          </h1>
          <button
            onClick={() => navigate("/public-cards")}
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            العودة إلى جميع البطاقات
          </button>
        </div>

        <div className="space-y-4">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{
                scale: 1.025,
                boxShadow: "0 8px 32px 0 #bba6f7, 0 2px 16px 0 #e3d8fa inset",
              }}
              transition={{ duration: 0.2 }}
              className="relative group overflow-hidden rounded-3xl border-2 border-[#e3d8fa] shadow-2xl p-0 flex flex-col items-center text-center transition-all duration-300 cursor-pointer bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5]"
              style={{ fontFamily: "Amiri, Cairo, serif" }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-full flex justify-center pointer-events-none select-none">
                <svg
                  width="120"
                  height="32"
                  viewBox="0 0 120 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 32 Q60 0 120 32"
                    stroke="#7440E9"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.13"
                  />
                  <circle cx="60" cy="16" r="6" fill="#e3d8fa" opacity="0.18" />
                </svg>
              </div>
              <Link
                to={`/shared-card/${card.share_link}`}
                className="w-full flex flex-col items-center"
              >
                <div className="w-full flex flex-col items-center gap-2 pt-8 pb-2 px-6">
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={
                        card.creator.avatar_url ||
                        "https://hadith-shareef.com/default.jpg"
                      }
                      alt={card.creator.username}
                      className="w-10 h-10 rounded-full border-2 border-[#e3d8fa] shadow"
                    />
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-gray-500">
                        {card.creator.username}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(card.created_at).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                  </div>
                  <h3
                    className="text-xl sm:text-2xl font-extrabold text-[#7440E9] mb-1 tracking-tight drop-shadow-sm"
                    style={{ fontFamily: "Amiri, Cairo, serif" }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="text-gray-700 text-base mb-2 line-clamp-3"
                    style={{ fontFamily: "Cairo, Amiri, serif" }}
                  >
                    {card.description}
                  </p>
                  <div className="flex items-end justify-center gap-6 mb-2 mt-1">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <Eye className="w-5 h-5 text-gray-400" />
                        <span className="font-bold text-base text-gray-700">
                          {card.views ?? 0}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        مشاهدات
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <Heart className="w-5 h-5 text-gray-400" />
                        <span className="font-bold text-base text-gray-700">
                          {card.likes ?? 0}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        إعجابات
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <Book className="w-5 h-5 text-gray-400" />
                        <span className="font-bold text-base text-gray-700">
                          {card.total_hadiths ?? 0}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        أحاديث
                      </span>
                    </div>
                  </div>
                  {card.tags && card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 justify-center">
                      {card.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 text-xs rounded-full bg-indigo-50 text-indigo-600 cursor-pointer hover:bg-indigo-100 border border-indigo-200 transition-colors duration-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-1">
                    <Clock className="w-4 h-4" />
                    {card.reading_time || "0"} دقيقة قراءة
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}

          {cards.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              لا توجد بطاقات متعلقة بهذا الوسم
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaggedCards;
