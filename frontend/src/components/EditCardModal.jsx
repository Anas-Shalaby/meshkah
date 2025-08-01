import { useState, useEffect } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import ReactSwitch from "react-switch";

const EditCardModal = ({ isOpen, onClose, card, onCardUpdated }) => {
  const [editedCard, setEditedCard] = useState({
    title: "",
    description: "",
    is_public: false,
    tags: [],
  });
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/dawah-cards/${card.id}`,
          {
            headers: {
              "x-auth-token": localStorage.getItem("token"),
            },
          }
        );

        let parsedTags = [];
        try {
          parsedTags = response.data.tags
            ? typeof response.data.tags === "string"
              ? JSON.parse(response.data.tags)
              : response.data.tags
            : [];
        } catch (parseError) {
          console.error("Error parsing tags:", parseError);
        }

        setEditedCard({
          ...response.data,
          tags: parsedTags,
        });
      } catch {
        toast.error("حدث خطأ في جلب بيانات البطاقة");
        onClose();
      }
    };
    if (card) {
      fetchCard();
    }
  }, [card]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/dawah-cards/${card.id}`,
        {
          title: editedCard.title,
          description: editedCard.description,
          is_public: editedCard.is_public,
          tags: editedCard.tags,
        },
        {
          headers: {
            "x-auth-token": token,
          },
        }
      );

      const updatedCard = {
        ...response.data.card,
        id: card,
        title: editedCard.title,
        description: editedCard.description,
        is_public: editedCard.is_public,
        tags: editedCard.tags,
      };

      onCardUpdated(updatedCard);
      toast.success("تم تحديث البطاقة بنجاح");
      onClose();
    } catch {
      toast.error("حدث خطأ أثناء تحديث البطاقة");
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTag.trim() && !editedCard.tags.includes(newTag.trim())) {
      setEditedCard((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setEditedCard((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Update form input handlers
  const handleChange = (field, value) => {
    setEditedCard((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // In the form JSX, update the input handlers:
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <motion.div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative font-[Cairo,Amiri,sans-serif]"
            style={{ direction: "rtl" }}
          >
            {/* زخرفة ذهبية أعلى المودال */}
            <div className="w-full h-2 bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500 mb-2" />
            {/* زر إغلاق دائري */}
            <button
              onClick={onClose}
              className="absolute left-4 top-4 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 transition shadow"
              title="إغلاق"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-7 pt-3">
              <h2 className="text-2xl font-extrabold text-indigo-900 mb-6 text-center">
                تعديل البطاقة الدعوية
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block mb-2 text-indigo-900 font-bold">
                    العنوان
                  </label>
                  <input
                    type="text"
                    value={editedCard.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:ring-2 bg-white focus:ring-indigo-500 focus:border-indigo-500 text-right text-black placeholder-gray-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-indigo-900 font-bold">
                    الوصف
                  </label>
                  <textarea
                    value={editedCard.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right h-24 text-black placeholder-gray-500"
                  />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <label className="text-indigo-900 font-bold">
                    جعل البطاقة عامة
                  </label>
                  {/* <input
                    type="checkbox"
                    checked={editedCard.is_public}
                    onChange={(e) =>
                      handleChange("is_public", e.target.checked)
                    }
                    className="w-5 h-5 accent-indigo-500"
                  /> */}
                  <ReactSwitch
                    checked={editedCard.is_public}
                    onChange={(e) => handleChange("is_public", e)}
                    uncheckedIcon={false}
                    checkedIcon={false}
                    onColor="#7440E8"
                    width={38}
                    height={20}
                    // className="react-switch"
                    id="material-switch"
                  />
                  <span className="text-xs text-gray-500">
                    (إذا جعلتها عامة ستظهر للجميع في صفحة البطاقات الدعوية)
                  </span>
                </div>
                {/* التصنيفات كبادجات */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {editedCard.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm flex items-center gap-1 border border-yellow-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-yellow-600 hover:text-red-500 ml-1"
                        title="حذف التصنيف"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl border border-blue-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right text-black placeholder-gray-500"
                    placeholder="أضف تصنيفاً"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 rounded-xl bg-indigo-400 text-white font-bold hover:bg-indigo-500 transition"
                  >
                    إضافة
                  </button>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 rounded-xl bg-gray-100 text-indigo-900 font-bold hover:bg-gray-200 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditCardModal;
