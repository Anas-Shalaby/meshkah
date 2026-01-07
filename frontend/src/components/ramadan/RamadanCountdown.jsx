import { useState, useEffect } from "react";
import { Moon, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";

const RamadanCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isRamadan, setIsRamadan] = useState(false);
  const [ramadanStartDate, setRamadanStartDate] = useState(null);
  const [loading, setLoading] = useState(true);

  // جلب تاريخ رمضان من الـ API
  useEffect(() => {
    const fetchRamadanDate = async () => {
      try {
        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:4000/api";
        const response = await axios.get(`${API_URL}/admin/theme/ramadan-date`);
        if (response.data.success) {
          setRamadanStartDate(response.data.startDate);
        }
      } catch (error) {
        console.error("Error fetching Ramadan date:", error);
        // في حالة الخطأ، استخدم التاريخ الافتراضي
        setRamadanStartDate("2026-02-18");
      } finally {
        setLoading(false);
      }
    };

    fetchRamadanDate();
  }, []);

  useEffect(() => {
    if (!ramadanStartDate) return;

    // حساب الوقت المتبقي لرمضان
    const ramadanDate = new Date(`${ramadanStartDate}T00:00:00`);
    // افترض أن رمضان 29-30 يوم
    const ramadanEndDate = new Date(ramadanDate);
    ramadanEndDate.setDate(ramadanEndDate.getDate() + 30);
    ramadanEndDate.setHours(23, 59, 59);

    const calculateTimeLeft = () => {
      const now = new Date();

      // التحقق إذا كنا في رمضان
      if (now >= ramadanDate && now <= ramadanEndDate) {
        setIsRamadan(true);
        const difference = ramadanEndDate - now;

        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          });
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      } else {
        setIsRamadan(false);
        const difference = ramadanDate - now;

        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          });
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [ramadanStartDate]);

  // عرض loading أو لا شيء أثناء جلب التاريخ
  if (loading || !ramadanStartDate) {
    return null;
  }

  const timeUnits = [
    { value: timeLeft.days, label: "يوم" },
    { value: timeLeft.hours, label: "ساعة" },
    { value: timeLeft.minutes, label: "دقيقة" },
    { value: timeLeft.seconds, label: "ثانية" },
  ];

  return (
    <div className="fixed top-[60px] left-0 right-0 z-50 w-full bg-gradient-to-r from-purple-600/95 to-indigo-600/95 backdrop-blur-md py-3 px-4 shadow-lg border-b border-purple-400/30">
      <div className="max-w-7xl mx-auto">
        {/* Desktop Version */}
        <div className="hidden md:flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            >
              <Moon className="w-6 h-6 text-yellow-300" />
            </motion.div>
            <span className="text-white font-bold text-lg">
              {isRamadan ? "باقي على انتهاء رمضان:" : "باقي على رمضان المبارك:"}
            </span>
          </div>

          <div className="flex gap-3">
            {timeUnits.map((unit, index) => (
              <motion.div
                key={unit.label}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 min-w-[70px] border border-white/30 shadow-lg">
                  <motion.span
                    key={unit.value}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-3xl font-black text-white block"
                  >
                    {String(unit.value).padStart(2, "0")}
                  </motion.span>
                </div>
                <span className="text-xs text-yellow-200 font-semibold mt-1 block">
                  {unit.label}
                </span>
              </motion.div>
            ))}
          </div>

          {!isRamadan && ramadanStartDate && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2 bg-yellow-400/20 px-4 py-2 rounded-full border border-yellow-300/40"
            >
              <Calendar className="w-4 h-4 text-yellow-200" />
              <span className="text-yellow-100 text-sm font-semibold">
                {new Date(ramadanStartDate).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </motion.div>
          )}
        </div>

        {/* Mobile Version */}
        <div className="md:hidden">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-yellow-300" />
              <span className="text-white font-bold text-sm text-center">
                {isRamadan ? "باقي على انتهاء رمضان" : "باقي على رمضان المبارك"}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
              {timeUnits.map((unit, index) => (
                <div key={unit.label} className="text-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-2 border border-white/30 shadow-md">
                    <span className="text-xl font-black text-white block">
                      {String(unit.value).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="text-[10px] text-yellow-200 font-semibold mt-1 block">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RamadanCountdown;
