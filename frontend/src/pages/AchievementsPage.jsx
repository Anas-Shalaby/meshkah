import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Award, Star, Share2, Bot, Share } from "lucide-react";

const iconMap = {
  star: <Star className="w-8 h-8 text-yellow-400" />,
  award: <Award className="w-8 h-8 text-purple-500" />,
  share: <Share className="w-8 h-8 text-blue-500" />,
  "share-2": <Share2 className="w-8 h-8 text-blue-500" />,
  bot: <Bot className="w-8 h-8 text-green-500" />,
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/achievements/user`, {
        headers: { "x-auth-token": localStorage.getItem("token") },
      })
      .then((res) => {
        setAchievements(res.data.achievements);
        setLoading(false);
      })
      .catch(() => {
        toast.error("تعذر تحميل الإنجازات");
        setLoading(false);
      });
  }, []);

  const handleShare = async (achievement) => {
    try {
      // تحديث حالة المشاركة في الباك اند
      await axios.patch(
        "/api/achievements/user/share",
        { achievement_id: achievement.id, shared: true },
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );
      toast.success("تم مشاركة الإنجاز!");
      // مشاركة الإنجاز عبر Web Share API إذا متاح
      if (navigator.share) {
        navigator.share({
          title: achievement.name_ar,
          text: achievement.description_ar,
          url: window.location.origin + "/profile",
        });
      } else {
        // fallback: نسخ نص الإنجاز
        navigator.clipboard.writeText(
          `${achievement.name_ar}\n${achievement.description_ar}\n${window.location.origin}/profile`
        );
        toast("تم نسخ الإنجاز! يمكنك لصقه في أي مكان.");
      }
      setAchievements((prev) =>
        prev.map((a) => (a.id === achievement.id ? { ...a, shared: true } : a))
      );
    } catch {
      toast.error("حدث خطأ أثناء المشاركة");
    }
  };

  if (loading) {
    return <div className="text-center py-12">جاري تحميل الإنجازات...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-purple-800">
        إنجازاتي وشاراتي
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className={`rounded-2xl border shadow-lg p-6 flex flex-col items-center gap-3 transition-all duration-200 ${
              ach.achieved
                ? "bg-gradient-to-br from-purple-50 to-white border-purple-200"
                : "bg-gray-50 border-gray-200 opacity-60"
            }`}
          >
            <div>
              {iconMap[ach.icon] || <Award className="w-8 h-8 text-gray-400" />}
            </div>
            <div className="text-xl font-bold text-purple-900 text-center">
              {ach.name_ar}
            </div>
            <div className="text-gray-700 text-center mb-2">
              {ach.description_ar}
            </div>
            {ach.achieved && (
              <>
                <div className="text-green-600 font-semibold text-sm">
                  تم تحقيق الإنجاز{" "}
                  {ach.achieved_at && `بتاريخ ${ach.achieved_at.slice(0, 10)}`}
                </div>
                <button
                  onClick={() => handleShare(ach)}
                  disabled={ach.shared}
                  className={`mt-2 px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-all ${
                    ach.shared
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  <Share2 className="w-5 h-5" />
                  {ach.shared ? "تمت المشاركة" : "مشاركة الإنجاز"}
                </button>
              </>
            )}
            {!ach.achieved && (
              <div className="text-gray-400 text-xs mt-2">
                لم تحقق هذا الإنجاز بعد
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
