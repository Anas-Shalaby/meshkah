import { Dialog } from "@headlessui/react";
import { useForm, Controller } from "react-hook-form";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker-custom.css";
import { ar } from "date-fns/locale";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";

const repeatOptions = [
  { value: "once", label: "مرة واحدة" },
  { value: "daily", label: "يوميًا" },
  { value: "weekly", label: "أسبوعيًا" },
  { value: "monthly", label: "شهريًا" },
];

function toMysqlDatetime(date) {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0") +
    " " +
    String(date.getHours()).padStart(2, "0") +
    ":" +
    String(date.getMinutes()).padStart(2, "0") +
    ":" +
    String(date.getSeconds()).padStart(2, "0")
  );
}

const SunnahPlannerModal = ({
  isOpen,
  onClose,
  hadith,
  mode = "add",
  initialValues = {},
}) => {
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      startDate: initialValues.startDate
        ? new Date(initialValues.startDate)
        : (() => {
            const d = new Date();
            d.setHours(8, 0, 0, 0);
            return d;
          })(),
      repeatType: initialValues.repeatType || "once",
      note: initialValues.note || "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(null);
  const [checkingGoogle, setCheckingGoogle] = useState(false);

  useEffect(() => {
    if (isOpen && mode === "edit" && initialValues && initialValues.id) {
      if (initialValues.startDate)
        setValue("startDate", new Date(initialValues.startDate));
      if (initialValues.repeatType)
        setValue("repeatType", initialValues.repeatType);
      if (typeof initialValues.note === "string")
        setValue("note", initialValues.note);
    }
    if (!isOpen) {
      reset();
    }
    // eslint-disable-next-line
  }, [isOpen, initialValues?.id]);

  useEffect(() => {
    setCheckingGoogle(true);
    axios
      .get(`${import.meta.env.VITE_API_URL}/auth/google-status`, {
        headers: { "x-auth-token": localStorage.getItem("token") },
      })
      .then((res) => setGoogleConnected(res.data.connected))
      .catch(() => setGoogleConnected(false))
      .finally(() => setCheckingGoogle(false));
  }, []);

  const handleGoogleConnect = () => {
    const popup = window.open(
      "https://accounts.google.com/o/oauth2/v2/auth?" +
        new URLSearchParams({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          redirect_uri: window.location.origin + "/google-success",
          response_type: "code",
          scope:
            "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email",
          access_type: "offline",
          prompt: "consent",
        }),
      "google-oauth",
      "width=500,height=600"
    );
    const poll = setInterval(async () => {
      if (popup.closed) {
        clearInterval(poll);
        setCheckingGoogle(true);
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/auth/google-status`,
            {
              headers: { "x-auth-token": localStorage.getItem("token") },
            }
          );

          setGoogleConnected(res.data.connected);
          if (res.data.connected) {
            toast.success("تم ربط حسابك بجوجل بنجاح! يمكنك الآن إضافة السنّة.");
          }
        } catch {
          setGoogleConnected(false);
        } finally {
          setCheckingGoogle(false);
        }
      }
    }, 1000);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const values = watch();
      const startDate =
        values.startDate ||
        (() => {
          const d = new Date();
          d.setHours(8, 0, 0, 0);
          return d;
        })();
      const mysqlDate = startDate ? toMysqlDatetime(startDate) : null;
      let response;
      if (mode === "edit" && initialValues.id) {
        response = await axios.put(
          `${import.meta.env.VITE_API_URL}/sunnah/planner/${initialValues.id}`,
          {
            hadithId: initialValues.hadith_id,
            startDate: mysqlDate,
            repeatType: values.repeatType,
            note: values.note,
          },
          {
            headers: {
              "x-auth-token": localStorage.getItem("token"),
            },
          }
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/sunnah/planner`,
          {
            hadithId: hadith.id,
            startDate: mysqlDate,
            repeatType: values.repeatType,
            note: values.note,
          },
          {
            headers: {
              "x-auth-token": localStorage.getItem("token"),
            },
          }
        );
      }
      if (response.data.success) {
        if (response.data.googleEventId) {
          toast.success(
            mode === "edit"
              ? "تم تعديل السنّة وربطها بجوجل كالندر!"
              : "تم إضافة السنّة وربطها بجوجل كالندر بنجاح!"
          );
        } else {
          toast.success(
            mode === "edit" ? "تم تعديل السنّة!" : "تم إضافة السنّة بنجاح!"
          );
        }

        onClose();
      } else {
        toast.error(
          mode === "edit"
            ? "حدث خطأ أثناء تعديل السنّة"
            : "حدث خطأ أثناء إضافة السنّة"
        );
      }
    } catch (error) {
      console.error("Error saving sunnah:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(
          mode === "edit"
            ? "حدث خطأ أثناء تعديل السنّة"
            : "حدث خطأ أثناء إضافة السنّة"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-[9999] font-cairo text-black"
    >
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <Dialog.Panel
          as={motion.div}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-full max-w-full sm:max-w-lg rounded-2xl bg-white p-2 sm:p-6 shadow-xl flex flex-col gap-4"
        >
          <Dialog.Title className="text-xl font-bold text-center text-[#7440E9] mb-2 flex items-center justify-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#7440E9]" />
            <span>إضافة السنّة إلى مخططك</span>
          </Dialog.Title>
          <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-700 mb-2">
            <div className="font-semibold text-lg mb-1">
              {hadith?.title || hadith?.title_ar || "عنوان الحديث"}
            </div>
            <div className="text-sm text-gray-600 line-clamp-2">
              {hadith?.hadeeth || hadith?.hadith_text_ar || ""}
            </div>
          </div>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block mb-1 font-medium">
                تاريخ ووقت التطبيق
              </label>
              <Controller
                name="startDate"
                control={control}
                rules={{ required: "مطلوب" }}
                render={({ field }) => (
                  <div className="relative">
                    <DatePicker
                      {...field}
                      selected={field.value}
                      onChange={field.onChange}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="yyyy-MM-dd HH:mm"
                      locale={ar}
                      className="w-full px-4 py-2 pr-10 border rounded-xl focus:ring-2 focus:ring-[#7440E9] bg-white text-black text-right shadow"
                      calendarClassName="!rtl"
                      placeholderText="اختر التاريخ والوقت"
                      popperPlacement="bottom"
                      popperClassName="z-[15000]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7440E9] pointer-events-none">
                      <CalendarIcon className="w-5 h-5" />
                    </span>
                  </div>
                )}
              />
              {errors.startDate && (
                <div className="text-red-500 text-xs mt-1">
                  {errors.startDate.message}
                </div>
              )}
            </div>
            <div>
              <label className="block mb-1 font-medium">التكرار</label>
              <select
                {...register("repeatType", { required: "مطلوب" })}
                className="w-full px-4 py-2 border bg-white text-black rounded-lg focus:ring-2 focus:ring-[#7440E9]"
              >
                {repeatOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.repeatType && (
                <div className="text-red-500 text-xs mt-1">
                  {errors.repeatType.message}
                </div>
              )}
            </div>
            <div>
              <label className="block mb-1 font-medium">ملاحظة</label>
              <textarea
                {...register("note")}
                rows={2}
                className="w-full px-4 py-2 border bg-white text-black rounded-lg focus:ring-2 focus:ring-[#7440E9]"
                placeholder="اكتب ملاحظة حول تطبيق السنّة..."
              />
            </div>
            {checkingGoogle ? (
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-500 font-bold py-3 px-4 rounded-xl transition mt-2 shadow-md opacity-60 cursor-not-allowed"
              >
                <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-400 inline-block"></span>
                جاري التحقق من ربط جوجل...
              </button>
            ) : googleConnected === false ? (
              <>
                <button
                  type="button"
                  onClick={handleGoogleConnect}
                  className="w-full flex items-center justify-center gap-2 bg-[#4285F4] hover:bg-[#357ae8] text-white font-bold py-3 px-4 rounded-xl transition mt-2 shadow-md"
                >
                  <CalendarIcon className="w-5 h-5" />
                  ربط حسابك بجوجل لأول مرة
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-[#7440E9] font-bold py-2 px-4 rounded-xl transition mt-2 shadow-md border border-[#7440E9]/30"
                >
                  تحديث حالة الربط مع جوجل
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="w-full flex items-center justify-center mt-2"
                title={
                  mode === "edit" ? "تعديل السنّة" : "إضافة السنّة إلى المخطط"
                }
              >
                <span
                  className={`flex w-full  items-center justify-center rounded-full p-3 bg-gradient-to-r from-[#7440E9] to-[#a084f7] shadow-lg hover:from-[#5a2ebc] hover:to-[#7440E9] transition ${
                    loading ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <span className="animate-spin  rounded-full h-7 border-t-2 border-b-2 border-white inline-block"></span>
                  ) : (
                    <>
                      <CalendarIcon className="w-7 h-7 text-white mb-1" />
                      <span className="text-xs w-full text-white font-bold">
                        {mode === "edit" ? "تعديل السنّة" : "إضافة السنّة"}
                      </span>
                    </>
                  )}
                </span>
              </button>
            )}
            <div className="text-xs text-gray-500 text-center">
              سيتم ربط السنّة بجوجل كالندر تلقائيًا إذا كان حسابك مرتبط
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

SunnahPlannerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  hadith: PropTypes.object,
  mode: PropTypes.string,
  initialValues: PropTypes.object,
};

export default SunnahPlannerModal;
