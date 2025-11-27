import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";

const EmbeddedVideoPlayer = ({ youtubeLink, taskId, onVideoWatched }) => {
  const [isFloating, setIsFloating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);

  // دالة استخراج ID من رابط YouTube
  const extractYouTubeId = React.useCallback((url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }, []);

  // نستخدم ID فريد للفيديو - يتغير عند تغيير الفيديو
  const uniqueVideoId = React.useMemo(() => {
    const vidId = youtubeLink ? extractYouTubeId(youtubeLink) : null;
    return `video-frame-${taskId || "default"}-${
      vidId || Math.random().toString(36).substr(2, 9)
    }`;
  }, [taskId, youtubeLink, extractYouTubeId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const videoId = React.useMemo(
    () => extractYouTubeId(youtubeLink),
    [youtubeLink, extractYouTubeId]
  );
  const embedUrl = React.useMemo(() => {
    if (!videoId) return null;
    return `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&controls=1&playsinline=1&enablejsapi=1&origin=${
      typeof window !== "undefined" ? window.location.origin : ""
    }`;
  }, [videoId]);

  useEffect(() => {
    if (typeof window === "undefined" || !taskId) return;
    const watched = window.localStorage.getItem(`video_watched_${taskId}`);
    if (watched === "true") setIsWatched(true);
  }, [taskId]);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    if (isMobile) {
      setIsFloating(false);
      return;
    }

    // تعطيل الوضع العائم على الديسكتوب - الفيديو يبقى ثابت في مكانه
    setIsFloating(false);
    setIsDismissed(false);
    setPosition({ x: 0, y: 0 });
  }, [isDismissed, isMobile]);

  const handleDismissFloating = () => {
    setIsDismissed(true);
    setIsFloating(false);
    setPosition({ x: 0, y: 0 });
    containerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      if (!clientX && !clientY) return;

      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;
      const newX = dragStartPosition.x + deltaX;
      const newY = dragStartPosition.y + deltaY;
      const maxDelta = 300;

      setPosition({
        x: Math.max(-maxDelta, Math.min(maxDelta, newX)),
        y: Math.max(-maxDelta, Math.min(maxDelta, newY)),
      });
    },
    [isDragging, dragStart, dragStartPosition]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const startDrag = useCallback(
    (clientX, clientY) => {
      setDragStart({ x: clientX, y: clientY });
      setDragStartPosition(position);
      setIsDragging(true);
    },
    [position]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (isMobile) return;
      const target = e.target;
      const isHeader =
        target.closest(".drag-handle") || target.closest(".video-header");
      if (!isHeader || target.closest("button") || target.closest("iframe"))
        return;

      e.preventDefault();
      e.stopPropagation();
      startDrag(e.clientX, e.clientY);
    },
    [startDrag, isMobile]
  );

  useEffect(() => {
    if (isDragging && !isMobile) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isMobile, handleMouseMove, handleMouseUp]);

  const handleVideoWatched = () => {
    setIsWatched(true);
    if (typeof window !== "undefined" && taskId) {
      window.localStorage.setItem(`video_watched_${taskId}`, "true");
    }
    if (onVideoWatched) onVideoWatched();
    toast.success("تم حفظ حالة المشاهدة");
  };

  // =========================================================
  //  تنظيف الفيديو عند تغيير المهمة
  // =========================================================
  useEffect(() => {
    const currentIframeRef = iframeRef.current;

    return () => {
      // تنظيف iframe بشكل آمن - لا نحاول إزالة العنصر من DOM
      // لأن React سيتولى ذلك تلقائيًا
      try {
        if (currentIframeRef) {
          // إيقاف الفيديو قبل إزالة iframe
          try {
            currentIframeRef.contentWindow?.postMessage(
              '{"event":"command","func":"stopVideo","args":""}',
              "*"
            );
          } catch (e) {
            // قد يفشل إذا كان iframe من domain مختلف
          }
          // تنظيف src
          currentIframeRef.src = "about:blank";
        }
      } catch (error) {
        // تجاهل الأخطاء في cleanup - قد يكون العنصر تم إزالته بالفعل
        console.debug("Video cleanup:", error);
      }
    };
  }, [youtubeLink, taskId, uniqueVideoId]); // يتم التنفيذ عند تغيير الفيديو أو المهمة

  if (!youtubeLink || !videoId) return null;

  const shouldFloat = isFloating && !isDismissed;

  const floatingStyles = shouldFloat
    ? {
        position: "fixed",
        bottom: isMobile ? "auto" : "80px",
        top: isMobile ? "16px" : "auto",
        right: "16px",
        width: isMobile ? "calc(100vw - 32px)" : "320px",
        maxWidth: isMobile ? "100%" : "360px",
        aspectRatio: "16 / 9",
        zIndex: 9999, // رفعنا الـ z-index عشان نتأكد من مكانه
        borderRadius: "12px",
        boxShadow: "0 15px 45px rgba(0,0,0,0.25)",
        transform:
          !isMobile && (position.x !== 0 || position.y !== 0)
            ? `translate(${position.x}px, ${position.y}px)`
            : "none",
        cursor: isMobile ? "default" : isDragging ? "grabbing" : "grab",
      }
    : {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        borderRadius: "16px",
      };

  return (
    <div className="w-full my-6 relative z-0">
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl bg-gray-100/50 dark:bg-gray-800/50"
        style={{ paddingBottom: "56.25%" }}
      >
        <motion.div
          ref={videoRef}
          // !!! هام جداً: قمنا بإزالة prop "layout" !!!
          // وجود layout={!isMobile} هو اللي كان بيخلي الفيديو يعلق لما التاسك يتقفل
          initial={false}
          animate={shouldFloat ? "floating" : "static"}
          style={{
            ...floatingStyles,
            pointerEvents: "auto",
          }}
          // تبسيط الحركة لمنع التعارض
          transition={{ duration: 0.2 }}
          className="bg-black overflow-hidden border border-gray-200 dark:border-gray-700 pointer-events-auto shadow-lg"
        >
          {shouldFloat && (
            <div
              className={`video-header absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/80 to-transparent z-20 flex items-center justify-between px-2 ${
                isMobile
                  ? "cursor-default"
                  : "cursor-grab active:cursor-grabbing"
              }`}
              onMouseDown={!isMobile ? handleMouseDown : undefined}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleDismissFloating}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-1 bg-black/50 rounded-full text-white hover:bg-red-500/80 transition-colors z-20"
              >
                <X size={14} />
              </button>
              {!isMobile && (
                <span className="drag-handle text-[10px] text-white/80 font-medium flex items-center gap-1 pointer-events-none flex-1 text-center">
                  <span className="text-xs">⋮⋮</span> اسحب للتحريك
                </span>
              )}
            </div>
          )}

          <iframe
            id={uniqueVideoId} // ربط الـ ID
            ref={iframeRef}
            src={embedUrl}
            key={`${taskId}-${youtubeLink}`} // Force Re-render on change
            className="size-full w-full h-full"
            style={{ border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title="Lesson Video"
            loading="lazy"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default EmbeddedVideoPlayer;
