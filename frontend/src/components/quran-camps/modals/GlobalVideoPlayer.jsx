import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useVideo } from "../context/VideoContext"; // تأكد من المسار
import { X, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GlobalVideoPlayer = () => {
  const { videoState, closeVideo, toggleFloating, containerRef } = useVideo();
  const [isHovered, setIsHovered] = useState(false);

  // استخراج ID الفيديو
  const getVideoId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getVideoId(videoState.url);

  if (!videoId || !videoState.isPlaying) return null;

  // تحديد مكان العرض: هل نعرضه في مكانه المخصص داخل الدرس؟ أم عائم؟
  // الشرط: إذا لم يكن عائمًا + ويوجد مكان مخصص (Container) -> اعرضه هناك
  const shouldRenderInContainer =
    !videoState.isFloating && containerRef.current;

  const PlayerContent = (
    <motion.div
      layoutId="video-player"
      className={`relative bg-black overflow-hidden shadow-2xl 
        ${
          !shouldRenderInContainer
            ? "fixed bottom-5 right-5 z-[9999] w-80 sm:w-96 rounded-xl border border-gray-700"
            : "w-full h-full rounded-none"
        }`}
      // هنا نضمن الحجم الصغير عند الوضع العائم عبر كلاسات ثابتة
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* شريط التحكم العلوي يظهر فقط في الوضع العائم */}
      {!shouldRenderInContainer && (
        <div
          className={`absolute top-0 left-0 right-0 p-2 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10 transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={() => toggleFloating(false)}
            className="text-white hover:text-blue-400"
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={closeVideo}
            className="text-white hover:text-red-500"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Iframe */}
      <div
        className={`relative w-full ${
          !shouldRenderInContainer ? "aspect-video" : "h-full"
        }`}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&showinfo=0`}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </motion.div>
  );

  // السحر هنا: Portal
  // إذا كان يجب أن يكون داخل الدرس، نرسله إلى containerRef
  // وإلا (عائم أو الدرس مغلق)، نعرضه في الـ body مباشرة
  if (shouldRenderInContainer) {
    return ReactDOM.createPortal(PlayerContent, containerRef.current);
  }

  return PlayerContent; // يعرض في الـ Root بشكل افتراضي (عائم)
};

export default GlobalVideoPlayer;
