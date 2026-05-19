/* eslint-disable */
// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import {
  Moon,
  Palette,
  Check,
  X,
  Loader,
  Sparkles,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Cookies from "js-cookie";
import { apiService } from "@/services/api";

export default function ThemePage() {
  const [ramadanEnabled, setRamadanEnabled] = useState(false);
  const [ramadanDate, setRamadanDate] = useState("");
  const [newRamadanDate, setNewRamadanDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updatingDate, setUpdatingDate] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchThemeStatus();
    fetchRamadanDate();
  }, []);

  const api = apiService.getApi();

  async function fetchThemeStatus() {
    try {
      const response = await fetch(`${api}/admin/theme/ramadan`);
      const data = await response.json();

      if (data.success) {
        setRamadanEnabled(data.enabled);
      }
    } catch (error) {
      console.error("Error fetching theme status:", error);
      showMessage("error", "حدث خطأ في جلب حالة الثيم");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRamadanDate() {
    try {
      const response = await fetch(`${api}/admin/theme/ramadan-date`);
      const data = await response.json();

      if (data.success) {
        setRamadanDate(data.startDate);
        setNewRamadanDate(data.startDate);
      }
    } catch (error) {
      console.error("Error fetching Ramadan date:", error);
    }
  }

  async function handleUpdateRamadanDate() {
    if (!newRamadanDate) {
      showMessage("error", "يرجى إدخال تاريخ صحيح");
      return;
    }

    setUpdatingDate(true);
    try {
      const token = Cookies.get("token");
      const response = await fetch(`${api}/admin/theme/ramadan-date`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token || "",
        },
        body: JSON.stringify({ startDate: newRamadanDate }),
      });

      const data = await response.json();

      if (data.success) {
        setRamadanDate(data.startDate);
        showMessage("success", data.message);
      } else {
        showMessage("error", data.message || "حدث خطأ في تحديث التاريخ");
      }
    } catch (error) {
      console.error("Error updating Ramadan date:", error);
      showMessage("error", "حدث خطأ في تحديث التاريخ");
    } finally {
      setUpdatingDate(false);
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  async function handleToggleTheme() {
    setUpdating(true);
    try {
      const token = Cookies.get("token");
      const response = await fetch(`${api}/admin/theme/ramadan`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token || "",
        },
        body: JSON.stringify({ enabled: !ramadanEnabled }),
      });

      const data = await response.json();

      if (data.success) {
        setRamadanEnabled(!ramadanEnabled);
        showMessage("success", data.message);

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showMessage("error", data.message || "حدث خطأ في تحديث الثيم");
      }
    } catch (error) {
      console.error("Error updating theme:", error);
      showMessage("error", "حدث خطأ في تحديث الثيم");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Palette className="w-8 h-8 text-purple-600" />
            إعدادات الثيم
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            إدارة مظهر الموقع والثيمات الموسمية
          </p>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-xl border ${
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                  : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
              }`}
            >
              <div className="flex items-center gap-2">
                {message.type === "success" ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4 flex-1">
                <motion.div
                  animate={{
                    rotate: ramadanEnabled ? [0, 10, -10, 0] : 0,
                    scale: ramadanEnabled ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: 2,
                    repeat: ramadanEnabled ? Infinity : 0,
                    repeatDelay: 1,
                  }}
                  className={`p-3 rounded-xl ${
                    ramadanEnabled
                      ? "bg-gradient-to-br from-purple-500 to-indigo-600"
                      : "bg-gray-100 dark:bg-gray-700"
                  }`}
                >
                  <Moon
                    className={`w-8 h-8 ${
                      ramadanEnabled
                        ? "text-yellow-300"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  />
                </motion.div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    الثيم الرمضاني
                    {ramadanEnabled && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      >
                        <Check className="w-3 h-3 ml-1" />
                        مفعّل
                      </motion.span>
                    )}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    تفعيل الثيم الرمضاني للموقع مع الزخارف الإسلامية والألوان
                    المناسبة. سيظهر عداد تنازلي لرمضان وزخارف خاصة في صفحات
                    المخيمات والصفحة الرئيسية.
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleTheme}
                disabled={updating}
                className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl min-w-[140px] flex items-center justify-center gap-2
                  ${
                    ramadanEnabled
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                      : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white dark:from-gray-600 dark:to-gray-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {updating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : ramadanEnabled ? (
                  <>
                    <X className="w-5 h-5" />
                    إلغاء التفعيل
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    تفعيل
                  </>
                )}
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {ramadanEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-t border-purple-100 dark:border-purple-800"
              >
                <div className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                      <Check className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-1">
                        الثيم الرمضاني مفعّل حالياً
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-400">
                        يتم عرض عداد تنازلي لرمضان مع زخارف إسلامية على:
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-purple-700 dark:text-purple-400">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-600 dark:bg-purple-400 rounded-full"></div>
                          صفحة المخيمات القرآنية
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-600 dark:bg-purple-400 rounded-full"></div>
                          صفحة تفاصيل المخيم
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-600 dark:bg-purple-400 rounded-full"></div>
                          الصفحة الرئيسية
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Ramadan Date Settings */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  تاريخ بداية رمضان
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  حدد تاريخ بداية شهر رمضان المبارك. سيتم استخدام هذا التاريخ في
                  العداد التنازلي المعروض في الموقع.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  التاريخ الحالي:{" "}
                  {ramadanDate &&
                    new Date(ramadanDate).toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                </label>
                <input
                  type="date"
                  value={newRamadanDate}
                  onChange={(e) => setNewRamadanDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUpdateRamadanDate}
                disabled={updatingDate || newRamadanDate === ramadanDate}
                className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl min-w-[140px] flex items-center justify-center gap-2
                  bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {updatingDate ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    حفظ التاريخ
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                معلومات عن الثيم الرمضاني
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                تم تصميم الثيم الرمضاني بألوان بنفسجية مع لمسات ذهبية، ويتضمن
                زخارف إسلامية خفيفة لا تؤثر على تجربة المستخدم. يمكنك تفعيله أو
                إلغاؤه في أي وقت.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
