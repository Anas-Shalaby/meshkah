import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Switch from "react-switch";
import {
  Loader,
  Search,
  Plus,
  Trash2,
  Eye,
  Share2,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  FileImage,
  Globe,
  Lock,
  Sparkles,
} from "lucide-react";

const steps = [
  "معلومات البطاقة",
  "اختيار الأحاديث",
  "تخصيص الأحاديث",
  "معاينة البطاقة",
  "مشاركة البطاقة",
];

const Stepper = ({ currentStep }) => (
  <div className="flex flex-col sm:flex-row justify-between items-center mb-8 rtl flex-row-reverse overflow-x-auto gap-4 sm:gap-0">
    {steps.map((step, idx) => (
      <motion.div
        key={step}
        className="flex-1 flex flex-col items-center min-w-[70px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.1 }}
      >
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-full border-2 text-lg font-bold transition-all duration-300 ${
            idx <= currentStep
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-lg"
              : "bg-white text-gray-400 border-gray-200"
          }`}
          style={{ fontFamily: "Cairo, Amiri, serif" }}
        >
          {idx + 1}
        </div>
        <span
          className={`mt-3 text-sm font-medium ${
            idx === currentStep ? "text-blue-600 font-bold" : "text-gray-500"
          }`}
          style={{ fontFamily: "Cairo, Amiri, serif" }}
        >
          {step}
        </span>
        {idx < steps.length - 1 && (
          <div
            className={`hidden sm:block w-full h-1 mt-4 transition-all duration-300 ${
              idx < currentStep
                ? "bg-gradient-to-r from-blue-600 to-purple-600"
                : "bg-gray-200"
            }`}
          />
        )}
      </motion.div>
    ))}
  </div>
);

Stepper.propTypes = {
  currentStep: PropTypes.number.isRequired,
};

const CreateCardPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState("");
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState("");

  // Step 2
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedHadiths, setSelectedHadiths] = useState([]);

  // Step 3: Customization state
  const [customHadiths, setCustomHadiths] = useState([]);
  const [shareLink, setShareLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");
  const [saveError, setSaveError] = useState("");
  const cardPreviewRef = useRef();

  // Navigation
  const nextStep = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  // Sync customHadiths with selectedHadiths when moving to step 2->3
  useEffect(() => {
    if (step === 2) {
      setCustomHadiths(
        selectedHadiths.map((h) => {
          const existing = customHadiths.find((c) => c.id === h.id);
          return existing || { ...h, explanation: "", youtube: "" };
        })
      );
    }
  }, [step, selectedHadiths]);

  // Hadith search handler
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError("");
    try {
      const formData = new FormData();
      formData.append("term", searchQuery);
      formData.append("trans", "ar");

      const res = await axios.post(
        "https://hadeethenc.com/en/ajax/search",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const html = res.data || "";
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
      const hadithDivs = Array.from(doc.querySelectorAll("div.rtl.text-right"));
      const ids = hadithDivs
        .map((div) => {
          const a = div.querySelector("a[href]");
          let id = null;
          if (a && a.getAttribute("href")) {
            const match = a.getAttribute("href").match(/\/hadith\/(\d+)/);
            if (match) id = match[1];
          }
          return id;
        })
        .filter(Boolean);
      const fetchHadithDetails = async (id) => {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/hadith/${id}`
          );
          return res.data;
        } catch {
          return null;
        }
      };
      const hadithDetailsList = await Promise.all(ids.map(fetchHadithDetails));

      const results = hadithDetailsList.filter(Boolean);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchError("حدث خطأ في البحث");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddHadith = (hadith) => {
    if (!selectedHadiths.some((h) => h.id === hadith.id)) {
      setSelectedHadiths([...selectedHadiths, hadith]);
    }
  };

  const handleRemoveHadith = (id) => {
    setSelectedHadiths(selectedHadiths.filter((h) => h.id !== id));
  };

  // حفظ البطاقة في قاعدة البيانات
  const handleSaveCard = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setCopyMsg("");
    setSaveError("");
    if (customHadiths.length === 0) {
      setSaveError("يجب إضافة حديث واحد على الأقل");
      setSaving(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("is_public", isPublic);

      formData.append(
        "hadiths",
        JSON.stringify(
          customHadiths.map((h) => ({
            hadith_id: h.id,
            text: h.hadeeth,
            grade: h.grade,
            notes: h.explanation,
            attribution: h.attribution,
            external_link: h.youtube,
          }))
        )
      );
      if (backgroundFile) {
        formData.append("background_image", backgroundFile);
      }
      if (selectedBackgroundColor) {
        formData.append("background_color", selectedBackgroundColor);
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/dawah-cards`,
        formData,
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (res.data && res.data.shareLink) {
        setShareLink(res.data.shareLink);
        setSaveSuccess(true);
        setCopyMsg("");
      } else {
        setSaveSuccess(false);
        setCopyMsg("حدث خطأ أثناء حفظ البطاقة");
      }
    } catch {
      setSaveSuccess(false);
      setCopyMsg("حدث خطأ أثناء حفظ البطاقة");
    } finally {
      setSaving(false);
    }
  };

  // نسخ الرابط
  const handleCopy = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/shared-card/${shareLink}`
    );
    setCopyMsg("تم نسخ الرابط!");
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* عنوان البطاقة */}
            <div className="space-y-3">
              <label className="block text-lg font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                عنوان البطاقة
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white text-right text-lg placeholder-gray-400 transition-all duration-300"
                placeholder="أدخل عنوان البطاقة..."
                style={{ fontFamily: "Cairo, Amiri, serif" }}
              />
            </div>

            {/* وصف البطاقة */}
            <div className="space-y-3">
              <label className="block text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileImage className="w-5 h-5 text-green-600" />
                وصف البطاقة
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border-2 border-gray-200 bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-right h-32 text-lg placeholder-gray-400 resize-none transition-all duration-300"
                placeholder="أدخل وصف البطاقة..."
                style={{ fontFamily: "Cairo, Amiri, serif" }}
              />
            </div>

            {/* إعدادات البطاقة */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isPublic ? (
                    <Globe className="w-5 h-5 text-green-600" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-600" />
                  )}
                  <div>
                    <label className="text-lg font-bold text-gray-800">
                      جعل البطاقة عامة
                    </label>
                    <p className="text-sm text-gray-600">
                      {isPublic
                        ? "ستظهر للجميع في صفحة البطاقات الدعوية"
                        : "ستكون خاصة بك فقط"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isPublic}
                  onChange={setIsPublic}
                  uncheckedIcon={false}
                  checkedIcon={false}
                  onColor="#10B981"
                  offColor="#D1D5DB"
                  width={50}
                  height={24}
                  className="react-switch"
                />
              </div>
            </div>

            {/* اختيار الخلفية */}
            <div className="space-y-4">
              <label className="block text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileImage className="w-5 h-5 text-purple-600" />
                خلفية البطاقة
              </label>

              {/* رفع صورة */}
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors duration-300">
                <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setBackgroundFile(file);
                    setBackgroundImage(URL.createObjectURL(file));
                    setSelectedBackgroundColor("");
                  }}
                  className="hidden"
                  id="background-upload"
                />
                <label
                  htmlFor="background-upload"
                  className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-300 font-bold"
                >
                  اختر صورة خلفية
                </label>
                <p className="text-sm text-gray-500 mt-2">PNG, JPG حتى 5MB</p>
              </div>

              {backgroundImage && (
                <motion.div
                  className="relative inline-block"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={backgroundImage}
                    alt="معاينة الخلفية"
                    className="rounded-2xl max-h-48 border-2 border-gray-200 shadow-lg"
                    style={{ objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBackgroundImage("");
                      setBackgroundFile(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors duration-300"
                    title="إزالة الصورة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                <Search className="w-6 h-6 text-blue-600" />
                ابحث عن الأحاديث وأضفها للبطاقة
              </h2>
              <p className="text-gray-600">
                ابحث عن الأحاديث المناسبة وأضفها لبطاقتك
              </p>
            </div>

            {/* الأحاديث المختارة */}
            {selectedHadiths.length > 0 && (
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Check className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-lg text-gray-800">
                    الأحاديث المختارة ({selectedHadiths.length})
                  </h3>
                </div>
                <div className="grid gap-3">
                  {selectedHadiths.map((h) => (
                    <motion.div
                      key={h.id}
                      className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 flex items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="text-gray-800 font-medium text-sm">
                        {h.title || h.hadeeth?.slice(0, 50) + "..."}
                      </span>
                      <button
                        onClick={() => handleRemoveHadith(h.id)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* نموذج البحث */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <form
                onSubmit={handleSearch}
                className="flex flex-col sm:flex-row gap-2 sm:gap-3"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-right text-lg placeholder-gray-400 transition-all duration-300 mb-2 sm:mb-0"
                  placeholder="ابحث بكلمة أو جملة من الحديث..."
                  style={{ fontFamily: "Cairo, Amiri, serif" }}
                />
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold border-0 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {searchLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  بحث
                </button>
              </form>
            </div>

            {/* نتائج البحث */}
            {searchError && (
              <div className="text-center text-red-500 bg-red-50 rounded-xl p-4">
                {searchError}
              </div>
            )}

            {!searchLoading && !searchError && searchResults.length > 0 && (
              <motion.div
                className="grid gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {searchResults.map((h) => (
                  <motion.div
                    key={h.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="font-bold text-gray-800 text-lg mb-3">
                      {h.title || h.hadeeth?.slice(0, 60) + "..."}
                    </div>
                    <div
                      className="text-gray-600 text-base mb-4"
                      style={{ lineHeight: 2 }}
                    >
                      {h.hadeeth}
                    </div>
                    <button
                      onClick={() => handleAddHadith(h)}
                      disabled={selectedHadiths.some((sel) => sel.id === h.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {selectedHadiths.some((sel) => sel.id === h.id) ? (
                        <>
                          <Check className="w-4 h-4" />
                          مضاف
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          إضافة
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                <Search className="w-6 h-6 text-purple-600" />
                تخصيص الأحاديث
              </h2>
              <p className="text-gray-600">أضف شرح أو رابط يوتيوب لكل حديث</p>
            </div>

            {customHadiths.length === 0 && selectedHadiths.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  لا توجد أحاديث مختارة
                </h3>
                <p className="text-gray-600">
                  ارجع للخطوة السابقة واختر بعض الأحاديث أولاً
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {(customHadiths.length > 0
                  ? customHadiths
                  : selectedHadiths.map((h) => ({
                      ...h,
                      explanation: "",
                      youtube: "",
                    }))
                ).map((hadith, index) => (
                  <motion.div
                    key={hadith.id}
                    className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* نص الحديث */}
                    <div className="mb-4">
                      <h4 className="font-bold text-gray-800 text-lg mb-2">
                        الحديث {index + 1}
                      </h4>
                      <div
                        className="text-gray-700 text-base leading-relaxed p-4 bg-gray-50 rounded-xl"
                        style={{ fontFamily: "Cairo, Amiri, serif" }}
                      >
                        {hadith.hadeeth}
                      </div>
                    </div>

                    {/* نموذج التخصيص */}
                    <div className="space-y-4">
                      {/* شرح الحديث */}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          شرح الحديث (اختياري)
                        </label>
                        <textarea
                          value={hadith.explanation || ""}
                          onChange={(e) => {
                            setCustomHadiths((prev) =>
                              prev.map((h) =>
                                h.id === hadith.id
                                  ? { ...h, explanation: e.target.value }
                                  : h
                              )
                            );
                          }}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-right text-base placeholder-gray-400 resize-none"
                          placeholder="أضف شرحاً للحديث..."
                          rows={3}
                          style={{ fontFamily: "Cairo, Amiri, serif" }}
                        />
                      </div>

                      {/* رابط يوتيوب */}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          رابط يوتيوب (اختياري)
                        </label>
                        <input
                          type="url"
                          value={hadith.youtube || ""}
                          onChange={(e) => {
                            setCustomHadiths((prev) =>
                              prev.map((h) =>
                                h.id === hadith.id
                                  ? { ...h, youtube: e.target.value }
                                  : h
                              )
                            );
                          }}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-right text-base placeholder-gray-400"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                <Eye className="w-6 h-6 text-blue-600" />
                معاينة البطاقة
              </h2>
              <p className="text-gray-600">شاهد كيف ستظهر بطاقتك النهائية</p>
            </div>

            <div className="flex justify-center">
              <motion.div
                ref={cardPreviewRef}
                className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-t-8 border-blue-500 p-8 flex flex-col gap-6"
                style={{
                  background: backgroundImage
                    ? backgroundImage.startsWith("blob:") ||
                      backgroundImage.startsWith("data:")
                      ? `url(${backgroundImage})`
                      : backgroundImage.startsWith("http")
                      ? `url(${backgroundImage})`
                      : `url(${
                          import.meta.env.VITE_API_URL
                        }/uploads/backgrounds/${backgroundImage})`
                    : selectedBackgroundColor ||
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* عنوان البطاقة */}
                <div className="text-center">
                  <h1
                    className="text-3xl font-bold mb-4 text-white"
                    style={{ fontFamily: "Cairo, Amiri, serif" }}
                  >
                    {title || "عنوان البطاقة"}
                  </h1>
                  <p
                    className="text-lg text-white/90 mb-6"
                    style={{ fontFamily: "Cairo, Amiri, serif" }}
                  >
                    {description || "وصف البطاقة"}
                  </p>
                </div>

                {/* الأحاديث */}
                <div className="space-y-4">
                  {customHadiths.map((h, index) => (
                    <motion.div
                      key={h.id}
                      className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div
                        className="text-gray-800 text-lg leading-relaxed"
                        style={{ fontFamily: "Cairo, Amiri, serif" }}
                      >
                        {h.hadeeth}
                      </div>
                      {h.explanation && (
                        <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                          {h.explanation}
                        </div>
                      )}
                      {h.youtube && (
                        <div className="mt-3 text-sm text-blue-600">
                          <a
                            href={h.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            📺 مشاهدة على يوتيوب
                          </a>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* حالة البطاقة */}
                <div className="text-center">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold">
                    {isPublic ? (
                      <>
                        <Globe className="w-4 h-4" />
                        بطاقة عامة
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        بطاقة خاصة
                      </>
                    )}
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                <Share2 className="w-6 h-6 text-green-600" />
                مشاركة البطاقة
              </h2>
              <p className="text-gray-600">احفظ بطاقتك وشاركها مع الآخرين</p>
            </div>

            {saveSuccess ? (
              <motion.div
                className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  تم إنشاء البطاقة بنجاح!
                </h3>
                <p className="text-gray-600 mb-6">
                  يمكنك الآن مشاركة البطاقة مع الآخرين
                </p>

                {/* رابط المشاركة */}
                <div className="bg-white rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={`${window.location.origin}/shared-card/${shareLink}`}
                      readOnly
                      className="flex-1 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600"
                    />
                    <button
                      onClick={handleCopy}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      نسخ
                    </button>
                  </div>
                  {copyMsg && (
                    <p className="text-green-600 text-sm mt-2">{copyMsg}</p>
                  )}
                </div>

                {/* أزرار إضافية */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => navigate("/public-cards")}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-300"
                  >
                    عرض جميع البطاقات
                  </button>
                  <button
                    onClick={() => {
                      setStep(0);
                      setTitle("");
                      setDescription("");
                      setSelectedHadiths([]);
                      setCustomHadiths([]);
                      setBackgroundImage("");
                      setBackgroundFile(null);
                      setShareLink("");
                      setSaveSuccess(false);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                  >
                    إنشاء بطاقة جديدة
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    حفظ البطاقة
                  </h3>
                  <p className="text-gray-600">
                    انقر على الزر أدناه لحفظ بطاقتك
                  </p>
                </div>

                {saveError && (
                  <div className="bg-red-50 text-red-600 rounded-xl p-4 mb-6">
                    {saveError}
                  </div>
                )}

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleSaveCard}
                    disabled={saving}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Share2 className="w-5 h-5" />
                    )}
                    {saving ? "جاري الحفظ..." : "حفظ البطاقة"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.h1
            className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2 sm:mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            إنشاء بطاقة دعوية
          </motion.h1>
          <motion.p
            className="text-gray-600 text-base sm:text-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            أنشئ بطاقة دعوية جميلة وشاركها مع الآخرين
          </motion.p>
        </div>

        {/* Stepper */}
        <div className="overflow-x-auto pb-2">
          <Stepper currentStep={step} />
        </div>

        {/* Form */}
        <motion.div
          className="max-w-full sm:max-w-4xl w-full mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-xl p-2 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 gap-2 sm:gap-0">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 0}
              className="flex items-center gap-2 w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-2 sm:mb-0"
            >
              <ArrowRight className="w-4 h-4" />
              السابق
            </button>

            <div className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-0">
              {step + 1} من {steps.length}
            </div>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 mb-2 sm:mb-0"
              >
                التالي
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateCardPage;
