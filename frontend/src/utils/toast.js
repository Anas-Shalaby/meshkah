import { toast } from "react-toastify";

// Detect dark mode
function isDarkMode() {
  if (typeof window !== "undefined") {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }
  return false;
}

const baseStyle = {
  fontFamily: "Cairo, sans-serif",
  fontSize: "14px",
  fontWeight: 500,
  borderRadius: "12px",
  padding: "12px 16px",
  margin: "8px",
  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
  direction: "rtl",
  maxWidth: "90vw",
  width: "auto",
};

const lightStyle = {
  ...baseStyle,
  background: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  color: "#2d3748",
  border: "1px solid rgba(255, 255, 255, 0.2)",
};
const darkStyle = {
  ...baseStyle,
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#ffffff",
  border: "1px solid rgba(255, 255, 255, 0.2)",
};

export function showToast(type, message, options = {}) {
  const style = isDarkMode() ? darkStyle : lightStyle;
  const config = {
    style,
    position: "bottom-center",
    rtl: true,
    icon:
      type === "success"
        ? "✅"
        : type === "error"
        ? "❌"
        : type === "info"
        ? "ℹ️"
        : "⏳",
    ...options,
  };
  switch (type) {
    case "success":
      toast.success(message, config);
      break;
    case "error":
      toast.error(message, config);
      break;
    case "info":
      toast.info(message, config);
      break;
    case "loading":
      toast.loading(message, config);
      break;
    default:
      toast(message, config);
  }
}
