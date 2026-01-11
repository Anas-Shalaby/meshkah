/**
 * مكون تقويم التقدم - Progress Calendar Component
 * يعرض تقويم شهري ملون حسب إنجاز القراءة اليومية
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  Target,
  Flame,
} from "lucide-react";
import { getProgressCalendar } from "../../services/bookJourneysService";

const ProgressCalendar = ({ journeyId }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [calendarData, setCalendarData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // أسماء الأشهر بالعربية
  const arabicMonths = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  // أسماء الأيام بالعربية
  const arabicDays = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

  useEffect(() => {
    loadCalendarData();
  }, [journeyId, currentMonth, currentYear]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const response = await getProgressCalendar(journeyId, currentMonth, currentYear);
      setCalendarData(response.calendar);
      setStats(response.stats);
    } catch (error) {
      console.error("Error loading calendar:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // توليد أيام الشهر
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // أيام فارغة في بداية الشهر
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, isEmpty: true });
    }
    
    // أيام الشهر
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const progress = calendarData?.progress?.[dateStr];
      
      days.push({
        day,
        dateStr,
        progress,
        isToday: isToday(dateStr),
        isFuture: isFutureDate(dateStr),
      });
    }
    
    return days;
  };

  const isToday = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const isFutureDate = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    return date > today;
  };

  const getDayClass = (dayData) => {
    if (dayData.isEmpty || dayData.isFuture) return "bg-gray-50 text-gray-300";
    
    if (dayData.progress?.completed) {
      return "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-sm";
    }
    if (dayData.progress?.partial) {
      return "bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-sm";
    }
    if (dayData.isToday) {
      return "bg-purple-100 text-purple-700 ring-2 ring-purple-400";
    }
    return "bg-gray-100 text-gray-500";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-40 mx-auto mb-6"></div>
        <div className="grid grid-cols-7 gap-2">
          {Array(35).fill(null).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm"
    >
      {/* الهيدر */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        
        <h3 className="text-lg font-bold text-gray-800 arabic-text flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-purple-600" />
          {arabicMonths[currentMonth - 1]} {currentYear}
        </h3>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* أسماء الأيام */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {arabicDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2 arabic-text"
          >
            {day}
          </div>
        ))}
      </div>

      {/* أيام التقويم */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayData, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.01 }}
            className={`
              relative h-10 flex flex-col items-center justify-center rounded-lg text-sm font-medium
              transition-all cursor-default
              ${getDayClass(dayData)}
            `}
            title={dayData.progress ? `${dayData.progress.count} حديث` : ""}
          >
            {dayData.day}
            {dayData.progress?.count > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[10px] font-bold text-purple-600 rounded-full flex items-center justify-center shadow">
                {dayData.progress.count}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* دليل الألوان */}
      <div className="flex items-center justify-center gap-4 mt-6 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded"></div>
          <span className="text-gray-600 arabic-text">أكمل الورد</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gradient-to-br from-amber-300 to-orange-400 rounded"></div>
          <span className="text-gray-600 arabic-text">جزئي</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span className="text-gray-600 arabic-text">لا قراءة</span>
        </div>
      </div>

      {/* الإحصائيات */}
      {stats && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-xl text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed_days}</div>
            <div className="text-xs text-gray-500 arabic-text">يوم مكتمل</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-3 rounded-xl text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.total_hadiths_read}</div>
            <div className="text-xs text-gray-500 arabic-text">حديث مقروء</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-xl text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.average_per_day}</div>
            <div className="text-xs text-gray-500 arabic-text">متوسط يومي</div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProgressCalendar;
