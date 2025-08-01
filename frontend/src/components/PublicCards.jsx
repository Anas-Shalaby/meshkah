import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Eye, Loader, Plus, Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LikeOutlined, ShareAltOutlined } from "@ant-design/icons";

const SkeletonCard = () => (
  <div className="relative min-h-[480px] rounded-3xl border-2 border-[#e3d8fa] shadow-2xl bg-white/90 backdrop-blur-xl flex flex-col animate-pulse">
    <div className="h-40 w-full rounded-t-3xl mb-6 bg-gray-200" />
    <div className="px-4 flex-1 flex flex-col justify-center items-center">
      <div className="h-6 w-2/3 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-1/2 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-1/3 bg-gray-200 rounded mb-6" />
      <div className="flex gap-4 w-full justify-center mb-4">
        <div className="h-4 w-8 bg-gray-200 rounded" />
        <div className="h-4 w-8 bg-gray-200 rounded" />
        <div className="h-4 w-8 bg-gray-200 rounded" />
      </div>
      <div className="h-8 w-24 bg-gray-200 rounded-full mt-auto mb-4" />
    </div>
  </div>
);

const PublicCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [inputValue, setInputValue] = useState(""); // قيمة الحقل المنفصلة عن searchQuery
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tagFilter = searchParams.get("tag");
  const CARDS_PER_PAGE = 9;
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observer = useRef();
  const lastCardRef = useCallback(
    (node) => {
      if (loading || isFetchingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new window.IntersectionObserver((entries) => {
        if (
          entries[0].isIntersecting &&
          currentPage < totalPages &&
          !isFetchingMore
        ) {
          setIsFetchingMore(true);
          setCurrentPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, isFetchingMore, currentPage, totalPages]
  );

  const fetchPublicCards = useCallback(async () => {
    if (currentPage === 1) {
      setLoading(true);
    }
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/cards/public`,
        {
          params: {
            page: currentPage,
            limit: CARDS_PER_PAGE,
            search: searchQuery,
            tag: tagFilter,
          },
        }
      );

      if (currentPage === 1) {
        // للصفحة الأولى، استبدل البطاقات
        setCards(response.data.cards);
      } else {
        // للصفحات التالية، أضف البطاقات الجديدة
        setCards((prevCards) => [...prevCards, ...response.data.cards]);
      }

      setTotalPages(response.data.totalPages);
      setLoading(false);
      setSearchLoading(false);
    } catch (error) {
      console.error("Error fetching cards:", error);
      setLoading(false);
      setSearchLoading(false);
    }
  }, [currentPage, searchQuery, tagFilter]);

  useEffect(() => {
    fetchPublicCards();

    // تنظيف الـ observer عند unmount
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [fetchPublicCards]);

  useEffect(() => {
    if (isFetchingMore && currentPage > 1) {
      fetchPublicCards().then(() => {
        setIsFetchingMore(false);
      });
    }
  }, [isFetchingMore, fetchPublicCards, currentPage]);

  // إيقاف spinner عند انتهاء التحميل
  useEffect(() => {
    if (!loading) {
      setSearchLoading(false);
    }
  }, [loading]);

  // عند تغيير البحث أو الفلتر، أعد الصفحة للأولى
  useEffect(() => {
    setCurrentPage(1);
    setIsFetchingMore(false);
  }, [searchQuery, tagFilter]);

  const handleTagClick = (tag, e) => {
    e.preventDefault(); // Prevent the parent Link from triggering
    setIsFetchingMore(false);
    navigate(`/cards/tags/${encodeURIComponent(tag)}`);
  };

  // البحث عند الضغط على Enter
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      setSearchQuery(inputValue);
      setCurrentPage(1);
      setIsFetchingMore(false);
      setSearchLoading(true);
    }
  };

  // البحث عند فقدان التركيز
  const handleSearchBlur = () => {
    if (inputValue !== searchQuery) {
      setSearchQuery(inputValue);
      setCurrentPage(1);
      setIsFetchingMore(false);
      setSearchLoading(true);
    }
  };

  // تحديث قيمة الحقل
  const handleSearchChange = (e) => {
    setInputValue(e.target.value);
  };

  // البحث عند الضغط على زر البحث
  const handleSearchClick = () => {
    setSearchQuery(inputValue);
    setCurrentPage(1);
    setIsFetchingMore(false);
    setSearchLoading(true);
  };

  if (loading && currentPage === 1) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-6 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] py-8 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* زخارف إسلامية SVG في الخلفية */}
      <svg
        className="absolute top-0 right-0 opacity-10 z-0"
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
        className="absolute bottom-0 left-0 opacity-10 z-0"
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
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#7440E9] to-[#8B5CF6] rounded-3xl flex items-center justify-center shadow-xl">
              <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  stroke="white"
                  strokeWidth="3"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#7440E9]">
              البطاقات الدعوية
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
            اكتشف مجموعة من البطاقات الدعوية المميزة التي يشاركها المستخدمون من
            جميع أنحاء العالم
          </p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={handleSearchChange}
              onKeyPress={handleSearchKeyPress}
              onBlur={handleSearchBlur}
              placeholder="ابحث عن البطاقات..."
              className="w-full px-6 py-4 pr-12 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-[#7440E9] focus:border-transparent transition-all duration-200 text-lg bg-white/80 text-black shadow-lg"
            />
            {searchLoading && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Loader className="h-5 w-5 text-[#7440E9] animate-spin" />
              </div>
            )}
            {/* زر البحث */}
            <button
              onClick={handleSearchClick}
              className="absolute inset-y-0 left-0 pl-3 flex items-center hover:bg-[#7440E9]/10 rounded-l-2xl transition-colors duration-200"
              disabled={searchLoading}
            >
              <Search className="h-5 w-5 text-[#7440E9] hover:text-[#6D28D9]" />
            </button>
          </div>
        </motion.div>

        {/* Tags Section */}
        {cards &&
          cards.length > 0 &&
          Array.from(new Set(cards.flatMap((card) => card.tags || []))).length >
            0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mb-8"
            >
              <h3 className="text-lg font-semibold text-[#7440E9] mb-4 text-center">
                التصنيفات الشائعة
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 px-2 scrollbar-thin scrollbar-thumb-[#e3d8fa] scrollbar-track-transparent justify-center">
                {Array.from(
                  new Set(cards.flatMap((card) => card.tags || []))
                ).map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      navigate(`/cards/tags/${encodeURIComponent(tag)}`)
                    }
                    className="px-4 py-2 rounded-full border-2 border-[#7440E9]/30 bg-white/80 text-[#7440E9] font-semibold text-sm shadow hover:bg-[#f3edff] transition-all duration-200 whitespace-nowrap hover:scale-105"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

        {/* رسالة عدم وجود نتائج */}
        {!loading && cards.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center py-12"
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg p-8 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                لا توجد نتائج
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? `لم نجد بطاقات تطابق "${searchQuery}"`
                  : "لا توجد بطاقات متاحة حالياً"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-6 mt-8"
        >
          {cards?.map((card, index) => {
            if (index === cards.length - 1) {
              return (
                <div ref={lastCardRef} key={card.id}>
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                    whileHover={{
                      scale: 1.05,
                      y: -10,
                      transition: { duration: 0.3 },
                    }}
                    className="relative group min-h-[480px] overflow-hidden rounded-3xl border-2 border-[#e3d8fa] shadow-2xl p-0 flex flex-col items-center text-center transition-all duration-300 cursor-pointer bg-white/90 backdrop-blur-xl"
                    style={{
                      minHeight: 480,
                      fontFamily: "Amiri, Cairo, serif",
                      background:
                        "linear-gradient(135deg, #f7f6fb 0%, #f3edff 60%, #e9e4f5 100%)",
                      boxShadow:
                        "0 2px 16px 0 rgba(116,64,233,0.08) inset, 0 8px 24px 0 rgba(116,64,233,0.10)",
                    }}
                  >
                    {/* زخرفة إسلامية أعلى البطاقة */}
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
                        <circle
                          cx="60"
                          cy="16"
                          r="6"
                          fill="#e3d8fa"
                          opacity="0.18"
                        />
                      </svg>
                    </div>

                    {/* خلفية مزخرفة */}
                    <div
                      className="h-40 w-full relative rounded-t-3xl mb-6 overflow-hidden"
                      style={{
                        backgroundImage: `url(${
                          card.background_url
                            ? card.background_url.startsWith("http")
                              ? card.background_url
                              : card.background_url.startsWith("/uploads") ||
                                card.background_url.startsWith("/api/uploads")
                              ? `${import.meta.env.VITE_IMAGE_API}${
                                  card.background_url
                                }`
                              : `${
                                  import.meta.env.VITE_API_URL
                                }/uploads/backgrounds/${card.background_url}`
                            : `${
                                import.meta.env.VITE_API_URL
                              }/uploads/backgrounds/bg-1738754798981-583756667.png`
                        }), url('/assets/arabic-pattern-classic.svg')`,
                        backgroundSize: "cover, 120px",
                        backgroundPosition: "center, top right",
                        backgroundRepeat: "no-repeat, repeat",
                        borderBottom: "1px solid #e3d8fa",
                      }}
                    >
                      <img
                        src={`${import.meta.env.VITE_IMAGE_API}${
                          card.background_url ||
                          "/uploads/backgrounds/bg-1738754798981-583756667.png"
                        }`}
                        alt={card.title}
                        loading="lazy"
                        className="w-0 h-0 opacity-0"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/10 to-[#f3edff]/60 rounded-t-3xl" />
                    </div>

                    {/* العنوان */}
                    <h3
                      className="text-2xl sm:text-3xl font-extrabold text-[#7440E9] mb-4 flex items-center gap-2 tracking-tight drop-shadow-sm px-4"
                      style={{ fontFamily: "Amiri, Cairo, serif" }}
                    >
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          stroke="#7440E9"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                        />
                      </svg>
                      {card.title}
                    </h3>

                    {/* الوصف */}
                    <p
                      className="text-gray-700 text-base mb-4 line-clamp-3 px-4 leading-relaxed"
                      style={{ fontFamily: "Cairo, Amiri, serif" }}
                    >
                      {card.description}
                    </p>

                    {/* صف إحصائيات هادئ وصغير */}
                    <div className="flex items-end justify-center gap-6 mb-4 mt-2">
                      {/* Views */}
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
                      {/* Likes */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <LikeOutlined className="w-5 h-5 text-gray-400" />
                          <span className="font-bold text-base text-gray-700">
                            {card.likes ?? 0}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          إعجابات
                        </span>
                      </div>
                      {/* Shares */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <ShareAltOutlined className="w-5 h-5 text-gray-400" />
                          <span className="font-bold text-base text-gray-700">
                            {card.shares ?? 0}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          مشاركات
                        </span>
                      </div>
                    </div>

                    {/* الوسوم */}
                    {card.tags && card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4 justify-center px-4">
                        {card.tags.map((tag) => (
                          <span
                            key={tag}
                            onClick={(e) => handleTagClick(tag, e)}
                            className="px-3 py-1 text-xs rounded-full bg-indigo-50 text-indigo-600 cursor-pointer hover:bg-indigo-100 border border-indigo-200 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Badge عدد الأحاديث */}
                    <div className="flex items-center justify-center w-full mt-auto pt-4 border-t border-[#e3d8fa]">
                      <span className="flex items-center gap-1 text-base font-bold text-[#7440E9]">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#f3edff] shadow-inner border-2 border-[#e3d8fa] text-lg font-extrabold mr-1">
                          {card.total_hadiths}
                        </span>
                        <span className="text-xs font-semibold text-[#7440E9]">
                          أحاديث
                        </span>
                      </span>
                    </div>

                    {/* زر عرض البطاقة يظهر عند hover */}
                    <Link
                      to={`/shared-card/${card.share_link}`}
                      className="absolute left-1/2 -translate-x-1/2 bottom-6 opacity-0 group-hover:opacity-100 transition-all duration-300 px-8 py-3 rounded-full bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white font-bold text-base shadow-lg hover:from-[#6D28D9] hover:to-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7440E9] z-30"
                      style={{ pointerEvents: "auto" }}
                    >
                      عرض البطاقة
                    </Link>
                  </motion.div>
                </div>
              );
            }
            return (
              <div key={card.id}>
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                  whileHover={{
                    scale: 1.05,
                    y: -10,
                    transition: { duration: 0.3 },
                  }}
                  className="relative group min-h-[480px] overflow-hidden rounded-3xl border-2 border-[#e3d8fa] shadow-2xl p-0 flex flex-col items-center text-center transition-all duration-300 cursor-pointer bg-white/90 backdrop-blur-xl"
                  style={{
                    minHeight: 480,
                    fontFamily: "Amiri, Cairo, serif",
                    background:
                      "linear-gradient(135deg, #f7f6fb 0%, #f3edff 60%, #e9e4f5 100%)",
                    boxShadow:
                      "0 2px 16px 0 rgba(116,64,233,0.08) inset, 0 8px 24px 0 rgba(116,64,233,0.10)",
                  }}
                >
                  {/* زخرفة إسلامية أعلى البطاقة */}
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
                      <circle
                        cx="60"
                        cy="16"
                        r="6"
                        fill="#e3d8fa"
                        opacity="0.18"
                      />
                    </svg>
                  </div>

                  {/* خلفية مزخرفة */}
                  <div
                    className="h-40 w-full relative rounded-t-3xl mb-6 overflow-hidden"
                    style={{
                      backgroundImage: `url(${
                        card.background_url
                          ? card.background_url.startsWith("http")
                            ? card.background_url
                            : card.background_url.startsWith("/uploads") ||
                              card.background_url.startsWith("/api/uploads")
                            ? `${import.meta.env.VITE_IMAGE_API}/api/${
                                card.background_url
                              }`
                            : `${
                                import.meta.env.VITE_API_URL
                              }/uploads/backgrounds/${card.background_url}`
                          : `${
                              import.meta.env.VITE_API_URL
                            }/uploads/backgrounds/bg-1738754798981-583756667.png`
                      }), url('/assets/arabic-pattern-classic.svg')`,
                      backgroundSize: "cover, 120px",
                      backgroundPosition: "center, top right",
                      backgroundRepeat: "no-repeat, repeat",
                      borderBottom: "1px solid #e3d8fa",
                    }}
                  >
                    <img
                      src={`${import.meta.env.VITE_IMAGE_API}${
                        card.background_url ||
                        "/uploads/backgrounds/bg-1738754798981-583756667.png"
                      }`}
                      alt={card.title}
                      loading="lazy"
                      className="w-0 h-0 opacity-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/10 to-[#f3edff]/60 rounded-t-3xl" />
                  </div>

                  {/* العنوان */}
                  <h3
                    className="text-2xl sm:text-3xl font-extrabold text-[#7440E9] mb-4 flex items-center gap-2 tracking-tight drop-shadow-sm px-4"
                    style={{ fontFamily: "Amiri, Cairo, serif" }}
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                      <circle
                        cx="10"
                        cy="10"
                        r="8"
                        stroke="#7440E9"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                      />
                    </svg>
                    {card.title}
                  </h3>

                  {/* الوصف */}
                  <p
                    className="text-gray-700 text-base mb-4 line-clamp-3 px-4 leading-relaxed"
                    style={{ fontFamily: "Cairo, Amiri, serif" }}
                  >
                    {card.description}
                  </p>

                  {/* صف إحصائيات هادئ وصغير */}
                  <div className="flex items-end justify-center gap-6 mb-4 mt-2">
                    {/* Views */}
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
                    {/* Likes */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <LikeOutlined className="w-5 h-5 text-gray-400" />
                        <span className="font-bold text-base text-gray-700">
                          {card.likes ?? 0}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        إعجابات
                      </span>
                    </div>
                    {/* Shares */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <ShareAltOutlined className="w-5 h-5 text-gray-400" />
                        <span className="font-bold text-base text-gray-700">
                          {card.shares ?? 0}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        مشاركات
                      </span>
                    </div>
                  </div>

                  {/* الوسوم */}
                  {card.tags && card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 justify-center px-4">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          onClick={(e) => handleTagClick(tag, e)}
                          className="px-3 py-1 text-xs rounded-full bg-indigo-50 text-indigo-600 cursor-pointer hover:bg-indigo-100 border border-indigo-200 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Badge عدد الأحاديث */}
                  <div className="flex items-center justify-center w-full mt-auto pt-4 border-t border-[#e3d8fa]">
                    <span className="flex items-center gap-1 text-base font-bold text-[#7440E9]">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#f3edff] shadow-inner border-2 border-[#e3d8fa] text-lg font-extrabold mr-1">
                        {card.total_hadiths}
                      </span>
                      <span className="text-xs font-semibold text-[#7440E9]">
                        أحاديث
                      </span>
                    </span>
                  </div>

                  {/* زر عرض البطاقة يظهر عند hover */}
                  <Link
                    to={`/shared-card/${card.share_link}`}
                    className="absolute left-1/2 -translate-x-1/2 bottom-6 opacity-0 group-hover:opacity-100 transition-all duration-300 px-8 py-3 rounded-full bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white font-bold text-base shadow-lg hover:from-[#6D28D9] hover:to-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7440E9] z-30"
                    style={{ pointerEvents: "auto" }}
                  >
                    عرض البطاقة
                  </Link>
                </motion.div>
              </div>
            );
          })}
          {isFetchingMore &&
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </motion.div>
        {/* زر عائم لإضافة بطاقة دعوية */}
        <Link
          to="/create-card"
          className="fixed z-50 bottom-8 right-8 w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-[#7440E9] to-[#8B5CF6] text-white text-4xl shadow-2xl hover:scale-110 hover:shadow-indigo-300/40 transition-all duration-200 border-4 border-white/40 focus:outline-none focus:ring-4 focus:ring-[#7440E9]"
          style={{ boxShadow: "0 8px 24px 0 rgba(116,64,233,0.15)" }}
          aria-label="إضافة بطاقة دعوية"
        >
          <Plus className="w-6 h-6" />
        </Link>
      </div>
    </div>
  );
};

export default PublicCards;
