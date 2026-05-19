import { motion } from "framer-motion";
import { Player } from "@lottiefiles/react-lottie-player";
import {
  Share2,
  ExternalLink,
  MessageCircle,
  Instagram,
  Facebook,
  Copy,
  Smartphone,
  Download,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";
import { getDashboardTheme } from "./dashboardTheme";
import { APP_URL, SOCIAL_LINKS, MOBILE_APP_PLAY_STORE_URL } from "./dashboardConstants";

const DASHBOARD_APP_LOTTIE_SRC =
  import.meta.env.VITE_DASHBOARD_APP_LOTTIE_URL ||
  import.meta.env.VITE_LOGIN_LOTTIE_URL ||
  "";

const XIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DashboardSocialColumn = () => {
  const { isNight } = useTheme();
  const t = getDashboardTheme(isNight);

  const handleShare = async () => {
    const text = "انضم إلى منصة مشكاة للتعلّم والمخيمات وختمات الكتب";
    try {
      if (navigator.share) {
        await navigator.share({ title: "مشكاة", text, url: APP_URL });
      } else {
        await navigator.clipboard.writeText(APP_URL);
        toast.success("تم نسخ رابط التطبيق");
      }
    } catch {
      /* cancelled */
    }
  };

  const copyAppLink = async () => {
    await navigator.clipboard.writeText(APP_URL);
    toast.success("تم نسخ الرابط");
  };

  const followLinks = [
    { href: SOCIAL_LINKS.whatsapp, label: "واتساب", icon: MessageCircle, color: "hover:bg-green-50 hover:text-green-600 hover:border-green-200" },
    { href: SOCIAL_LINKS.twitter, label: "X", icon: XIcon, color: "hover:bg-gray-50 hover:text-gray-900 hover:border-gray-200" },
    { href: SOCIAL_LINKS.instagram, label: "إنستغرام", icon: Instagram, color: "hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200" },
    { href: SOCIAL_LINKS.facebook, label: "فيسبوك", icon: Facebook, color: "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" },
  ];

  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-4"
    >
      {/* تطبيق الموبايل — Lottie ثم رابط Google Play */}
      <div className={t.socialCard}>
        <div className="mx-auto mb-4 flex aspect-square w-full max-w-[220px] items-center justify-center">
          {DASHBOARD_APP_LOTTIE_SRC ? (
            <Player
              autoplay
              loop
              src={DASHBOARD_APP_LOTTIE_SRC}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Smartphone className="h-7 w-7 text-[#7440E9]" />
              </div>
              <p className="text-xs leading-relaxed text-gray-500">
                ضع ملف Lottie في{" "}
                <code className="rounded bg-purple-100 px-1 text-[10px] text-[#7440E9]">
                  VITE_DASHBOARD_APP_LOTTIE_URL
                </code>
              </p>
            </div>
          )}
        </div>

        <h3 className={`mb-1 text-center text-base font-bold ${t.textHeading}`}>
          تطبيق مشكاة للموبايل
        </h3>
        <p className={`mb-4 text-center text-xs leading-relaxed ${t.textBody}`}>
          مكتبة أحاديث، مساعد سراج، بحث ذكي — حمّل التطبيق من Google Play
        </p>

        <a
          href={MOBILE_APP_PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={t.playStoreBtn}
        >
          <Download className="h-4 w-4 shrink-0" />
          <span>تحميل من Google Play</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
        </a>
      </div>

      <div className={t.socialCard}>
        <h3 className={`mb-4 flex items-center gap-2 text-lg font-bold ${t.textAccent}`}>
          <Share2 className="h-5 w-5" />
          شارك التطبيق
        </h3>
        <p className={`mb-4 text-sm leading-relaxed ${t.textBody}`}>
          ساعد غيرك على الوصول إلى محتوى مشكاة — المخيمات، الختمات، وحديث اليوم.
        </p>
        <button
          type="button"
          onClick={handleShare}
          className={`mb-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-md transition-shadow hover:shadow-lg ${isNight ? "bg-[#5b4d6f] hover:bg-[#6a5a7f]" : "bg-gradient-to-l from-[#7440E9] to-indigo-600"}`}
        >
          <Share2 className="h-4 w-4" />
          مشاركة الرابط
        </button>
        <div className={`flex items-center gap-2 rounded-xl border p-3 ${isNight ? "border-white/10 bg-[#2c2c31]" : "border-slate-200 bg-slate-50"}`}>
          <Smartphone className={`h-4 w-4 shrink-0 ${t.textAccent}`} />
          <span className={`flex-1 truncate text-xs ${t.textBody}`} dir="ltr">
            {APP_URL}
          </span>
          <button
            type="button"
            onClick={copyAppLink}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-white"
            title="نسخ"
          >
            <Copy className="h-4 w-4" />
          </button>
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-1.5 text-[#7440E9] hover:bg-white"
            title="فتح"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className={t.socialCard}>
        <h3 className={`mb-3 text-base font-bold ${t.textHeading}`}>تابعنا</h3>
        <div className="grid grid-cols-2 gap-2">
          {followLinks.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${isNight ? `${t.socialFollow} ${item.color}` : `border-slate-200 text-gray-700 ${item.color}`}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            );
          })}
        </div>
      </div>
    </motion.aside>
  );
};

export default DashboardSocialColumn;
