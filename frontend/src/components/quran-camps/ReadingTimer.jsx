import React, { useState, useEffect, useRef } from "react";
import { Clock, Play, Pause, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

const ReadingTimer = ({ taskId, isTaskOpen, onTimeUpdate }) => {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const intervalRef = useRef(null);
  const lastSaveTimeRef = useRef(0);
  const accumulatedTimeRef = useRef(0);

  // Start timer when task is opened
  useEffect(() => {
    if (isTaskOpen && !isActive) {
      setIsActive(true);
    }
  }, [isTaskOpen]);

  // Timer logic
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          const newSeconds = prev + 1;
          accumulatedTimeRef.current = newSeconds;

          // Save every 30 seconds
          const timeSinceLastSave = newSeconds - lastSaveTimeRef.current;
          if (timeSinceLastSave >= 30) {
            saveReadingTime(30);
            lastSaveTimeRef.current = newSeconds;
          }

          return newSeconds;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  // Save accumulated time when component unmounts or task closes
  useEffect(() => {
    return () => {
      if (accumulatedTimeRef.current > 0) {
        saveReadingTime(accumulatedTimeRef.current - lastSaveTimeRef.current);
      }
    };
  }, []);

  const saveReadingTime = async (timeToSave) => {
    if (!taskId || timeToSave <= 0) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/quran-camps/tasks/${taskId}/track-reading-time`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({
            readingTimeSeconds: timeToSave,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTotalSeconds((prev) => prev + timeToSave);
          if (onTimeUpdate) {
            onTimeUpdate(totalSeconds + timeToSave);
          }
        }
      }
    } catch (error) {
      console.error("Error saving reading time:", error);
      // Don't show error toast to avoid annoying the user
    }
  };

  const toggleTimer = () => {
    if (isActive) {
      // Pause and save current accumulated time
      if (accumulatedTimeRef.current > lastSaveTimeRef.current) {
        const timeToSave = accumulatedTimeRef.current - lastSaveTimeRef.current;
        saveReadingTime(timeToSave);
        lastSaveTimeRef.current = accumulatedTimeRef.current;
      }
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSeconds(0);
    accumulatedTimeRef.current = 0;
    lastSaveTimeRef.current = 0;
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2 xs:gap-3 px-3 xs:px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <Clock className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs xs:text-sm font-semibold text-blue-900">
          وقت القراءة
        </div>
        <div className="text-xs xs:text-sm text-blue-700 font-mono">
          {formatTime(seconds)}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTimer}
          className="p-1.5 xs:p-2 hover:bg-blue-100 rounded-lg transition-colors active:scale-95"
          aria-label={isActive ? "إيقاف" : "تشغيل"}
        >
          {isActive ? (
            <Pause className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600" />
          ) : (
            <Play className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600" />
          )}
        </button>
        <button
          onClick={resetTimer}
          className="p-1.5 xs:p-2 hover:bg-blue-100 rounded-lg transition-colors active:scale-95"
          aria-label="إعادة تعيين"
        >
          <RotateCcw className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600" />
        </button>
      </div>
    </div>
  );
};

export default ReadingTimer;
