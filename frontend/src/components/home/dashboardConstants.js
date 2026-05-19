export const APP_URL = "https://hadith-shareef.com";

export const MOBILE_APP_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.mishkat_almasabih.app";

export const SOCIAL_LINKS = {
  whatsapp: "https://whatsapp.com/channel/0029VazdI4N84OmAWA8h4S2F",
  twitter: "https://x.com/mishkahcom1",
  facebook: "https://www.facebook.com/mishkahcom1",
  instagram: "https://www.instagram.com/mishkahcom1",
};

export const PLATFORM_STATS = [
  { label: "حديث نبوي", value: "10,000+" },
  { label: "مخيمات تعليمية", value: "متعددة" },
  { label: "ختمات كتب", value: "نشطة" },
  { label: "متاح دائماً", value: "24/7" },
];

export function getArabicDate() {
  return new Intl.DateTimeFormat("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    calendar: "gregory",
  }).format(new Date());
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "صباح الخير";
  if (hour < 17) return "مساء الخير";
  return "مساء الخير";
}

export function getAvatarUrl(user) {
  if (!user) return "/default-avatar.png";
  if (user.avatar_url) {
    if (user.avatar_url.startsWith("http")) return user.avatar_url;
    if (user.avatar_url.startsWith("/uploads/avatars")) {
      return `${import.meta.env.VITE_IMAGE_API}/api${user.avatar_url}`;
    }
  }
  return "/default-avatar.png";
}
