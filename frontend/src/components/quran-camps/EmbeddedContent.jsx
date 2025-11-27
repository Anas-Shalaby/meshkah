import React, { useState } from "react";
import { X, ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EmbeddedContent = ({ link, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  if (!link || !link.url) return null;

  // Determine content type
  const isPDF = link.url.toLowerCase().endsWith(".pdf") || link.type === "pdf";
  const isArticle = link.type === "article" || link.type === "مقال";
  const isBook = link.type === "book" || link.type === "كتاب";

  // Get iframe URL
  const getIframeUrl = () => {
    if (isPDF) {
      // For PDFs, use Google Docs viewer or direct PDF
      return `https://docs.google.com/viewer?url=${encodeURIComponent(
        link.url
      )}&embedded=true`;
    }
    // For articles/books, try to embed directly
    return link.url;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${
          isFullscreen ? "fixed inset-4 z-50 m-0 rounded-none" : "my-4 relative"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <h3 className="text-sm xs:text-base sm:text-lg font-semibold truncate">
              {link.title || "محتوى مضمّن"}
            </h3>
            {isArticle && (
              <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
                مقال
              </span>
            )}
            {isBook && (
              <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
                كتاب
              </span>
            )}
            {isPDF && (
              <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
                PDF
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:bg-white/20 rounded transition-colors"
              aria-label={isFullscreen ? "تصغير" : "تكبير"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-white/20 rounded transition-colors"
              aria-label="فتح في نافذة جديدة"
            >
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          className={`bg-gray-50 ${
            isFullscreen ? "h-[calc(100vh-8rem)]" : "h-[600px] sm:h-[700px]"
          }`}
        >
          {loadError ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                لا يمكن عرض المحتوى مباشرة. قد يكون الموقع لا يدعم العرض المضمن.
              </p>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <span>فتح في نافذة جديدة</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <>
              {isPDF ? (
                <iframe
                  src={getIframeUrl()}
                  className="w-full h-full border-0"
                  title={link.title || "محتوى PDF"}
                  allow="fullscreen"
                  onError={() => setLoadError(true)}
                />
              ) : (
                <iframe
                  src={link.url}
                  className="w-full h-full border-0"
                  title={link.title || "محتوى مضمّن"}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                  allow="fullscreen"
                  onError={() => setLoadError(true)}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-3 sm:px-4 py-2 flex items-center justify-between text-xs sm:text-sm text-gray-600">
          <span className="truncate flex-1 min-w-0">{link.url}</span>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium ml-2"
          >
            <span>فتح في نافذة جديدة</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmbeddedContent;
