import React, { createContext, useContext, useState, useRef } from "react";

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [videoState, setVideoState] = useState({
    url: null,
    isPlaying: false,
    isFloating: false, // هل هو عائم الآن؟
  });

  // مرجع للمكان الذي يجب أن يظهر فيه الفيديو داخل الدرس
  const containerRef = useRef(null);

  const playVideo = (url) => {
    setVideoState({ url, isPlaying: true, isFloating: false });
  };

  const closeVideo = () => {
    setVideoState({ url: null, isPlaying: false, isFloating: false });
  };

  const toggleFloating = (floating) => {
    setVideoState((prev) => ({ ...prev, isFloating: floating }));
  };

  // دالة لتسجيل مكان الفيديو داخل الدرس
  const registerContainer = (ref) => {
    containerRef.current = ref;
  };

  return (
    <VideoContext.Provider
      value={{
        videoState,
        playVideo,
        closeVideo,
        toggleFloating,
        registerContainer,
        containerRef,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => useContext(VideoContext);
