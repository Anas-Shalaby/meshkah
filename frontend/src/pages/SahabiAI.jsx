import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  UserCircle2,
  Search,
  Sparkles,
  Share2,
  Facebook,
  Twitter,
  MessageCircle,
  Copy,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

export default function SahabiAI() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shared, setShared] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // عند تحميل الصفحة: إذا وجد query في URL نفذ البحث تلقائياً
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("query");
    if (q && q.trim()) {
      setQuery(q);
      handleSearch(null, q);
    }
    // eslint-disable-next-line
  }, []);

  const handleSearch = async (e, customQuery) => {
    if (e) e.preventDefault();
    const searchText = customQuery !== undefined ? customQuery : query;
    if (!searchText.trim()) return toast.error("اكتب اسم الصحابي أو سؤالك!");
    setLoading(true);
    setResult(null);
    setShared(false);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/ai/sahabi`,
        { query: searchText },
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );
      setResult(data.result);
      // إذا لم يكن من URL، حدث الرابط
      if (!customQuery) {
        navigate(`/sahabi-ai?query=${encodeURIComponent(searchText)}`, {
          replace: true,
        });
      }
    } catch (err) {
      toast.error("تعذر جلب السيرة. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const shareOptions = [
    {
      name: "واتساب",
      icon: <MessageCircle className="w-5 h-5 text-green-500" />,
      url: query
        ? `https://api.whatsapp.com/send?text=${encodeURIComponent(
            window.location.origin + "/sahabi-ai?query=" + query
          )}`
        : "#",
    },
    {
      name: "تويتر",
      icon: <Twitter className="w-5 h-5 text-blue-400" />,
      url: query
        ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            window.location.origin + "/sahabi-ai?query=" + query
          )}`
        : "#",
    },
    {
      name: "فيسبوك",
      icon: <Facebook className="w-5 h-5 text-blue-600" />,
      url: query
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            window.location.origin + "/sahabi-ai?query=" + query
          )}`
        : "#",
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(
      window.location.origin + `/sahabi-ai?query=${encodeURIComponent(query)}`
    );
    toast.success("تم نسخ رابط البحث! يمكنك لصقه في أي مكان.");
    setShowShareMenu(false);
  };

  // استخراج اسم الصحابي من الاستعلام (بسيط)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] flex flex-col items-center py-12 px-4 relative overflow-x-hidden">
      {/* خلفية مزخرفة */}
      <img
        src="/assets/arabic-pattern-classic.svg"
        alt="pattern"
        className="absolute top-0 left-0 w-full opacity-10 pointer-events-none select-none"
        style={{ zIndex: 0 }}
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-800 mb-8 flex items-center gap-3 z-10">
        <Sparkles className="w-8 h-8 text-yellow-400 animate-bounce" /> سيرتهم
        العطرة (AI)
      </h1>
      <form
        onSubmit={handleSearch}
        className="w-full max-w-xl flex gap-2 mb-8 z-10"
      >
        <input
          type="text"
          className="flex-1 px-5 py-3 rounded-full border-2 border-purple-200 focus:border-purple-500 outline-none text-lg bg-white shadow transition-all duration-200 hover:shadow-lg"
          placeholder="اكتب اسم الصحابي أو اسأل عن موقف أو سيرة..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          dir="rtl"
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-lg shadow hover:from-purple-600 hover:to-indigo-600 transition flex items-center gap-2"
          disabled={loading}
        >
          <Search className="w-5 h-5" /> بحث
        </button>
      </form>
      {/* Spinner أثناء التحميل */}
      {loading && (
        <div className="flex flex-col items-center py-12 z-10">
          <div className="w-16 h-16 border-4 border-t-4 border-t-purple-500 border-gray-200 rounded-full animate-spin mb-4"></div>
          <div className="text-lg text-purple-700 font-bold">
            جاري البحث عن السيرة...
          </div>
        </div>
      )}
      {/* النتيجة مع Animation وصورة */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 text-right text-lg leading-loose border border-purple-100 animate-fadeIn relative z-10 group"
            style={{ boxShadow: "0 8px 32px #7440e91a" }}
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="font-bold text-xl text-purple-800">
                سيرة الصحابي
              </span>
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowShareMenu((v) => !v)}
                  className={`px-4 py-2 rounded-full flex items-center gap-2 font-bold text-white bg-gradient-to-r from-yellow-400 to-yellow-500 shadow hover:from-yellow-500 hover:to-yellow-600 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-300 active:scale-95 ${
                    shared ? "scale-110" : ""
                  }`}
                  style={{ outline: "none" }}
                >
                  <Share2 className="w-5 h-5" />
                  مشاركة
                </button>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 top-12 bg-white border border-gray-200 rounded-xl shadow-lg p-3 flex flex-col gap-2 z-50 min-w-[180px]"
                    style={{ minWidth: 180 }}
                  >
                    {shareOptions.map((opt) => (
                      <a
                        key={opt.name}
                        href={opt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-gray-700 font-bold"
                        onClick={() => setShowShareMenu(false)}
                      >
                        {opt.icon}
                        {opt.name}
                      </a>
                    ))}
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-gray-700 font-bold w-full"
                    >
                      <Copy className="w-5 h-5 text-purple-400" /> نسخ النص
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
            <div
              className="text-gray-800 whitespace-pre-line"
              style={{ minHeight: 120 }}
            >
              {result}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
