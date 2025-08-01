import { toast as hotToast } from "react-hot-toast";

const useToast = () => {
  const toast = ({ title, description, variant = "default" }) => {
    const options = {
      duration: 4000,
      position: "top-center",
      style: {
        background: variant === "destructive" ? "#ef4444" : "#7440E9",
        color: "#fff",
        padding: "16px",
        borderRadius: "8px",
        maxWidth: "400px",
        textAlign: "right",
      },
    };

    const content = (
      <div className="flex flex-col gap-1">
        {title && <div className="font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
    );

    if (variant === "destructive") {
      hotToast.error(content, options);
    } else {
      hotToast.success(content, options);
    }
  };

  return { toast };
};
export default useToast;
