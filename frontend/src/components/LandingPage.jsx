import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Player } from "@lottiefiles/react-lottie-player";
import { BookOpen, FileText, Globe2, Users } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import DailyHadithWidget from "./DailyHadithWidget";
import SEO from "./SEO";

const COLORS = {
  page: "#1a1c22",
  card: "#212328",
  text: "#e0e0e0",
  accent: "#9e98db",
  nightIcon: "#ffc107",
};

const HERO_LOTTIE_SRC = "/assets/4aa33c4a-fbe0-11ee-a1e8-f7b63d90ff94.json";

const stats = [
  {
    id: "users",
    icon: Users,
    number: null,
    label: "مستخدم مسجل",
  },
  {
    id: "beneficiaries",
    icon: BookOpen,
    number: "١٠٠٠٠",
    label: "مستفيد",
  },
  {
    id: "countries",
    icon: Globe2,
    number: "١٩٥",
    label: "دولة",
  },
  {
    id: "pages",
    icon: FileText,
    number: "٢٠٠",
    label: "صفحة تعليمية",
  },
];

const features = [
  {
    title: "دورات تفاعلية وشاملة",
    description:
      "محتوى تعليمي منظم يجمع بين المعرفة الشرعية والتجربة الرقمية الواضحة.",
    Illustration: LaptopGlobeIllustration,
  },
  {
    title: "تتبع دقيق للتقدم والتقييم",
    description:
      "تابع رحلتك اليومية، إنجازاتك، ومواعيدك التعليمية من لوحة واحدة.",
    Illustration: MobileProgressIllustration,
  },
  {
    title: "شهادات معتمدة وموثقة",
    description:
      "أنهِ مساراتك التعليمية واحصل على شهادة واضحة قابلة للتحقق والمشاركة.",
    Illustration: CertificateIllustration,
  },
];

const LandingPage = () => {
  const { isNight } = useTheme();
  const [registeredUsers, setRegisteredUsers] = useState(null);

  const theme = isNight
    ? {
        page: COLORS.page,
        card: COLORS.card,
        text: COLORS.text,
        textSoft: "rgba(224, 224, 224, 0.88)",
        iconBg: "rgba(255,255,255,0.04)",
        iconHover: "hover:bg-white/[0.08]",
        softButton: "rgba(255,255,255,0.06)",
        softButtonHover: "hover:bg-white/[0.1]",
        inputBg: "#1a1c22",
        inputBorder: "rgba(158,152,219,0.25)",
      }
    : {
        page: "#f7f6fb",
        card: "#ffffff",
        text: "#24242c",
        textSoft: "rgba(36, 36, 44, 0.72)",
        iconBg: "rgba(116,64,233,0.08)",
        iconHover: "hover:bg-[#7440E9]/15",
        softButton: "rgba(116,64,233,0.08)",
        softButtonHover: "hover:bg-[#7440E9]/15",
        inputBg: "#ffffff",
        inputBorder: "rgba(116,64,233,0.22)",
      };
  const dailyHadithTheme = {
    card: isNight
      ? "rounded-[1.5rem] border border-white/10 bg-[#1a1c22]/70 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.22)]"
      : "rounded-[1.5rem] border border-[#7440E9]/10 bg-[#f7f6fb] p-5 shadow-[0_18px_45px_rgba(116,64,233,0.1)]",
    textAccent: isNight ? "text-[#9e98db]" : "text-[#7440E9]",
    textBody: isNight ? "text-zinc-300" : "text-gray-600",
    textMuted: isNight ? "text-zinc-500" : "text-gray-500",
    link: isNight
      ? "text-[#9e98db] hover:text-[#e0e0e0]"
      : "text-[#7440E9] hover:text-[#5a2fc7]",
  };

  useEffect(() => {
    let cancelled = false;

    const fetchPublicStats = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/public-stats`,
        );
        const data = await response.json();
        if (!cancelled && data?.success) {
          setRegisteredUsers(data.totalUsers);
        }
      } catch {
        if (!cancelled) {
          setRegisteredUsers(null);
        }
      }
    };

    fetchPublicStats();

    return () => {
      cancelled = true;
    };
  }, []);
  const websiteMetadata = {
    title: "مشكاة الأحاديث - موسوعة الحديث الشريف",
    description:
      "منصة شاملة للأحاديث النبوية، سير الصحابة، والتراث الإسلامي. اكتشف معارف إسلامية غنية وموثوقة.",
    keywords: [
      "أحاديث نبوية",
      "سيرة النبي محمد",
      "الصحابة الكرام",
      "التراث الإسلامي",
      "علوم الحديث",
      "فقه إسلامي",
    ].join(", "),
    canonicalUrl: "https://hadith-shareef.com",
    socialMediaImage: "/assets/icons/icon-512x512.png",
  };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "مشكاة الأحاديث",
    alternateName: "Meshkah",
    url: "https://hadith-shareef.com",
    logo: "https://hadith-shareef.com/assets/icons/icon-512x512.png",
  };

  return (
    <>
      <SEO websiteMetadata={websiteMetadata} />
      <main
        dir="rtl"
        className="min-h-screen px-4 py-4 font-almarai transition-colors duration-300 sm:px-6 lg:px-8"
        style={{ backgroundColor: theme.page, color: theme.text }}
      >
        <div className="mx-auto max-w-7xl">
          <section
            className="grid items-center gap-8 rounded-[2rem] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8 lg:grid-cols-2 lg:p-10"
            style={{ backgroundColor: theme.card }}
          >
            <div className="order-2 space-y-5 text-right lg:order-1">
              <p
                className="text-sm font-semibold"
                style={{ color: COLORS.accent }}
              >
                منصة تعليمية إسلامية حديثة
              </p>
              <h1
                className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
                style={{ color: theme.text }}
              >
                أهلاً بك في منصة مشكاة
              </h1>
              <p
                className="max-w-2xl text-base leading-9 sm:text-lg"
                style={{ color: theme.textSoft }}
              >
                تسعى منصة مشكاة لتقديم تجربة تعليمية إسلامية حديثة تجمع بين جمال
                العلم الشرعي وسهولة التقنية، وتوفر دورات ومخيمات تعليمية وختمات
                للكتب ومسارات متابعة تساعدك على التعلم المنتظم وبناء عادة معرفية
                راسخة.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/quran-camps"
                  className="rounded-2xl px-5 py-3 text-sm font-bold text-[#1a1c22] transition hover:opacity-90"
                  style={{ backgroundColor: COLORS.accent }}
                >
                  ابدأ رحلتك التعليمية
                </Link>
                <Link
                  to="/islamic-library"
                  className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${theme.softButtonHover}`}
                  style={{
                    backgroundColor: theme.softButton,
                    color: theme.text,
                  }}
                >
                  تصفح المكتبة
                </Link>
              </div>
            </div>

            <div className="order-1 flex justify-center lg:order-2">
              <HeroLottie />
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const number =
                stat.id === "users"
                  ? registeredUsers == null
                    ? "—"
                    : new Intl.NumberFormat("ar-EG").format(registeredUsers)
                  : stat.number;

              return (
                <article
                  key={stat.id}
                  className="flex min-h-[150px] flex-col items-center justify-center rounded-[1.75rem] p-5 text-center shadow-[0_18px_50px_rgba(0,0,0,0.2)]"
                  style={{ backgroundColor: theme.card }}
                >
                  <Icon
                    className="mb-4 h-8 w-8"
                    style={{ color: COLORS.accent }}
                  />
                  <div
                    className="text-3xl font-extrabold"
                    style={{ color: COLORS.accent }}
                  >
                    {number}
                  </div>
                  <p
                    className="mt-2 text-sm font-medium"
                    style={{ color: theme.text }}
                  >
                    {stat.label}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {features.map(({ title, description, Illustration }) => (
              <article
                key={title}
                className="rounded-[1.75rem] p-6 text-center shadow-[0_20px_55px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,0,0,0.32)]"
                style={{ backgroundColor: theme.card }}
              >
                <div className="mb-5 flex justify-center">
                  <Illustration />
                </div>
                <h2
                  className="mb-3 text-xl font-bold"
                  style={{ color: theme.text }}
                >
                  {title}
                </h2>
                <p
                  className="text-sm leading-7"
                  style={{ color: theme.textSoft }}
                >
                  {description}
                </p>
              </article>
            ))}
          </section>

          <section
            className="mt-6 grid items-center gap-6 rounded-[2rem] p-6 shadow-[0_22px_65px_rgba(0,0,0,0.24)] sm:p-8 lg:grid-cols-[0.85fr_1.15fr]"
            style={{ backgroundColor: theme.card }}
          >
            <div className="space-y-4 text-right">
              <p
                className="text-sm font-semibold"
                style={{ color: COLORS.accent }}
              >
                زاد يومي متجدد
              </p>
              <h2
                className="text-2xl font-bold leading-tight sm:text-3xl"
                style={{ color: theme.text }}
              >
                حديث اليوم
              </h2>
              <p
                className="max-w-xl text-sm leading-8 sm:text-base"
                style={{ color: theme.textSoft }}
              >
                ابدأ يومك بحديث نبوي مختار، واحفظه أو شاركه أو انتقل إلى صفحة
                الحديث الكاملة لقراءة المزيد من الشرح والفوائد.
              </p>
              <Link
                to="/daily-hadith"
                className={`inline-flex rounded-2xl px-5 py-3 text-sm font-bold transition ${theme.softButtonHover}`}
                style={{ backgroundColor: theme.softButton, color: theme.text }}
              >
                عرض صفحة حديث اليوم
              </Link>
            </div>

            <DailyHadithWidget themeOverride={dailyHadithTheme} />
          </section>
        </div>
      </main>
    </>
  );
};

function HeroLottie() {
  return (
    <div
      className="relative flex min-h-[320px] w-full max-w-[520px] items-center justify-center overflow-hidden rounded-[2rem]"
      aria-label="رسم تعليمي متحرك"
    >
      <div className="absolute inset-x-10 bottom-8 h-12 rounded-full bg-black/30 blur-2xl" />
      <Player
        autoplay
        loop
        src={HERO_LOTTIE_SRC}
        className="relative z-10 drop-shadow-[0_24px_45px_rgba(0,0,0,0.35)]"
        style={{ width: "100%", maxWidth: "520px", height: "auto" }}
      />
    </div>
  );
}

function LaptopGlobeIllustration() {
  return (
    <svg
      viewBox="0 0 260 180"
      className="h-44 w-full max-w-[260px]"
      aria-hidden
    >
      <rect x="44" y="50" width="172" height="100" rx="14" fill="#17191f" />
      <rect x="56" y="62" width="148" height="76" rx="8" fill="#2b2f3b" />
      <path d="M32 152h196l-14 16H46z" fill="#30333c" />
      <circle
        cx="130"
        cy="100"
        r="32"
        fill="none"
        stroke="#9e98db"
        strokeWidth="5"
      />
      <path
        d="M98 100h64M130 68c12 14 12 50 0 64M130 68c-12 14-12 50 0 64"
        stroke="#9e98db"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="70" cy="42" r="8" fill="#ffc107" opacity="0.8" />
      <circle cx="206" cy="42" r="6" fill="#9e98db" opacity="0.65" />
    </svg>
  );
}

function MobileProgressIllustration() {
  return (
    <svg
      viewBox="0 0 260 180"
      className="h-44 w-full max-w-[260px]"
      aria-hidden
    >
      <rect x="78" y="22" width="96" height="140" rx="20" fill="#17191f" />
      <rect x="90" y="40" width="72" height="104" rx="12" fill="#2b2f3b" />
      <rect x="104" y="58" width="44" height="8" rx="4" fill="#9e98db" />
      <rect
        x="104"
        y="80"
        width="18"
        height="42"
        rx="6"
        fill="#9e98db"
        opacity="0.9"
      />
      <rect
        x="130"
        y="94"
        width="18"
        height="28"
        rx="6"
        fill="#ffc107"
        opacity="0.9"
      />
      <circle cx="188" cy="58" r="26" fill="#30333c" />
      <path
        d="M176 58h24M188 46v24"
        stroke="#9e98db"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M58 132c20-22 39-20 58-4 23 19 46 22 75-9"
        fill="none"
        stroke="#9e98db"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CertificateIllustration() {
  return (
    <svg
      viewBox="0 0 260 180"
      className="h-44 w-full max-w-[260px]"
      aria-hidden
    >
      <rect x="54" y="58" width="152" height="94" rx="16" fill="#f3efe3" />
      <path
        d="M72 82h80M72 106h116M72 126h66"
        stroke="#212328"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="176" cy="122" r="20" fill="#9e98db" />
      <path
        d="M166 122l7 7 15-17"
        stroke="#e0e0e0"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M78 56l52-24 52 24-52 24z" fill="#9e98db" />
      <path d="M98 74v20c17 12 47 12 64 0V74" fill="#6f69b4" />
      <path
        d="M182 56v34"
        stroke="#ffc107"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="182" cy="96" r="7" fill="#ffc107" />
    </svg>
  );
}

export default LandingPage;
