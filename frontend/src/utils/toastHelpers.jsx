import toast from "react-hot-toast";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  RefreshCw,
} from "lucide-react";

/**
 * Enhanced toast notifications with icons and actions
 */

export const showSuccessToast = (message, options = {}) => {
  return toast.success(message, {
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    duration: options.duration || 3000,
    style: {
      borderRadius: "12px",
      background: "#f0fdf4",
      color: "#166534",
      border: "1px solid #86efac",
      padding: "12px 16px",
    },
    ...options,
  });
};

export const showErrorToast = (message, onRetry = null, options = {}) => {
  const toastId = toast.error(message, {
    icon: <XCircle className="w-5 h-5 text-red-600" />,
    duration: onRetry ? 5000 : options.duration || 4000,
    style: {
      borderRadius: "12px",
      background: "#fef2f2",
      color: "#991b1b",
      border: "1px solid #fca5a5",
      padding: "12px 16px",
    },
    ...(onRetry && {
      action: {
        label: "إعادة المحاولة",
        onClick: () => {
          toast.dismiss(toastId);
          onRetry();
        },
      },
    }),
    ...options,
  });

  return toastId;
};

export const showWarningToast = (message, options = {}) => {
  return toast(message, {
    icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    duration: options.duration || 4000,
    style: {
      borderRadius: "12px",
      background: "#fffbeb",
      color: "#92400e",
      border: "1px solid #fde047",
      padding: "12px 16px",
    },
    ...options,
  });
};

export const showInfoToast = (message, options = {}) => {
  return toast(message, {
    icon: <Info className="w-5 h-5 text-blue-600" />,
    duration: options.duration || 3000,
    style: {
      borderRadius: "12px",
      background: "#eff6ff",
      color: "#1e40af",
      border: "1px solid #93c5fd",
      padding: "12px 16px",
    },
    ...options,
  });
};

export const showLoadingToast = (message) => {
  return toast.loading(message, {
    style: {
      borderRadius: "12px",
      background: "#f9fafb",
      color: "#374151",
      border: "1px solid #e5e7eb",
      padding: "12px 16px",
    },
  });
};
