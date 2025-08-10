import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Check, X, Loader2, WifiOff } from "lucide-react";
import downloadManagerService from "../services/downloadManagerService";
import offlineStorageService from "../services/offlineStorageService";
import { getTranslation } from "../utils/translations";
import { toast } from "react-toastify";

const DownloadButton = ({ book, language = "ar", size = "sm" }) => {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    checkDownloadStatus();
    checkOnlineStatus();

    // Listen for online/offline events
    window.addEventListener("online", () => setIsOnline(true));
    window.addEventListener("offline", () => setIsOnline(false));

    return () => {
      window.removeEventListener("online", () => setIsOnline(true));
      window.removeEventListener("offline", () => setIsOnline(false));
    };
  }, [book.bookSlug]);

  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
  };

  const checkDownloadStatus = async () => {
    try {
      const downloaded = await downloadManagerService.isBookDownloaded(
        book.bookSlug
      );
      setIsDownloaded(downloaded);
    } catch (error) {
      console.error("Error checking download status:", error);
    }
  };

  const handleDownload = async (e) => {
    // Prevent event propagation to avoid triggering parent link
    e.stopPropagation();
    e.preventDefault();

    if (!isOnline) {
      toast.error(getTranslation(language, "needInternetToDownload"));
      return;
    }

    if (isDownloaded) {
      // Show options for downloaded book
      handleDownloadedBookOptions(e);
      return;
    }

    try {
      setIsDownloading(true);
      setProgress(0);

      await downloadManagerService.downloadBook(
        book.bookSlug,
        (progress) => {
          setProgress(progress);
        },
        (result) => {
          setIsDownloaded(true);
          setIsDownloading(false);
          setProgress(0);
          toast.success(
            getTranslation(language, "bookDownloadedSuccessfully")
              .replace("{book}", getTranslation(language, book.bookName))
              .replace("{hadiths}", result.totalHadiths)
          );
        },
        (error) => {
          setIsDownloading(false);
          setProgress(0);
          toast.error(
            getTranslation(language, "downloadFailed").replace(
              "{error}",
              error.message
            )
          );
        }
      );
    } catch (error) {
      setIsDownloading(false);
      setProgress(0);
      toast.error(
        getTranslation(language, "downloadFailed").replace(
          "{error}",
          error.message
        )
      );
    }
  };

  const handleDownloadedBookOptions = (e) => {
    // Prevent event propagation
    e.stopPropagation();
    e.preventDefault();

    // Show a modal or dropdown with options
    const options = [
      {
        label: getTranslation(language, "readOffline"),
        action: () => {
          // Navigate to offline reader
          window.location.href = "/offline-reader";
        },
      },
      {
        label: getTranslation(language, "deleteDownload"),
        action: () => handleDeleteDownload(),
      },
    ];

    // For now, just show a simple confirmation
    if (window.confirm(getTranslation(language, "bookAlreadyDownloaded"))) {
      window.location.href = "/offline-reader";
    }
  };

  const handleDeleteDownload = async () => {
    if (window.confirm(getTranslation(language, "confirmDeleteDownload"))) {
      try {
        await offlineStorageService.deleteBook(book.bookSlug);
        setIsDownloaded(false);
        toast.success(getTranslation(language, "downloadDeleted"));
      } catch (error) {
        console.error("Error deleting download:", error);
        toast.error(getTranslation(language, "errorDeletingDownload"));
      }
    }
  };

  const getButtonContent = () => {
    if (isDownloading) {
      return (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{Math.round(progress)}%</span>
        </div>
      );
    }

    if (isDownloaded) {
      return (
        <div className="flex items-center space-x-2">
          <Check className="h-4 w-4" />
          <span>{getTranslation(language, "downloaded")}</span>
        </div>
      );
    }

    if (!isOnline) {
      return (
        <div className="flex items-center space-x-2">
          <WifiOff className="h-4 w-4" />
          <span>{getTranslation(language, "offline")}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <Download className="h-4 w-4" />
        <span>{getTranslation(language, "download")}</span>
      </div>
    );
  };

  const getButtonClasses = () => {
    const baseClasses =
      "flex items-center justify-center px-3 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

    if (size === "lg") {
      return `${baseClasses} px-4 py-3 text-sm`;
    }

    return `${baseClasses} px-3 py-2 text-xs`;
  };

  const getButtonStyle = () => {
    if (isDownloading) {
      return "bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 focus:ring-blue-500";
    }

    if (isDownloaded) {
      return "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 focus:ring-green-500";
    }

    if (!isOnline) {
      return "bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed";
    }

    return "bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 focus:ring-emerald-500";
  };

  return (
    <motion.button
      onClick={handleDownload}
      disabled={isDownloading || !isOnline}
      className={`${getButtonClasses()} ${getButtonStyle()}`}
      whileHover={!isDownloading && isOnline ? { scale: 1.05 } : {}}
      whileTap={!isDownloading && isOnline ? { scale: 0.95 } : {}}
    >
      {getButtonContent()}
    </motion.button>
  );
};

export default DownloadButton;
