/**
 * مكون عرض وتحرير التعهد - PledgeCard Component
 * يعرض التعهد الشخصي للمستخدم ويتيح تحريره
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Edit3, 
  Save, 
  X, 
  Quote,
  Sparkles 
} from "lucide-react";
import toast from "react-hot-toast";
import { updatePledge } from "../../services/bookJourneysService";

const PledgeCard = ({ pledge, journeyId, isOwner, onPledgeUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPledge, setEditedPledge] = useState(pledge || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editedPledge.trim()) {
      toast.error("التعهد لا يمكن أن يكون فارغاً");
      return;
    }

    try {
      setSaving(true);
      await updatePledge(journeyId, editedPledge.trim());
      toast.success("تم حفظ التعهد! 📝");
      setIsEditing(false);
      onPledgeUpdated?.(editedPledge.trim());
    } catch (error) {
      toast.error(error.response?.data?.message || "حدث خطأ في حفظ التعهد");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedPledge(pledge || "");
    setIsEditing(false);
  };

  // إذا لم يكن هناك تعهد وليس المالك
  if (!pledge && !isOwner) {
    return null;
  }

  // نموذج إضافة التعهد للمالك
  if (!pledge && isOwner) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-5 rounded-2xl border border-amber-200"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 arabic-text">اكتب تعهدك</h3>
            <p className="text-sm text-gray-500 arabic-text">ما هي نيتك من هذه الختمة؟</p>
          </div>
        </div>

        <textarea
          value={editedPledge}
          onChange={(e) => setEditedPledge(e.target.value)}
          placeholder="مثال: أتعهد بإتمام هذا الكتاب تقرباً إلى الله..."
          className="w-full p-4 border border-amber-200 rounded-xl resize-none h-24 focus:ring-2 focus:ring-amber-300 focus:border-amber-500 outline-none arabic-text bg-white/70"
          dir="rtl"
        />

        <button
          onClick={handleSave}
          disabled={saving || !editedPledge.trim()}
          className="mt-3 w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <span>جاري الحفظ...</span>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>حفظ التعهد</span>
            </>
          )}
        </button>
      </motion.div>
    );
  }

  // عرض التعهد الموجود
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 p-5 rounded-2xl border border-purple-100 relative overflow-hidden"
    >
      {/* زخرفة */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 arabic-text">تعهدي</h3>
          </div>
          
          {isOwner && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
              title="تعديل التعهد"
            >
              <Edit3 className="w-5 h-5 text-purple-600" />
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <textarea
                value={editedPledge}
                onChange={(e) => setEditedPledge(e.target.value)}
                className="w-full p-4 border border-purple-200 rounded-xl resize-none h-24 focus:ring-2 focus:ring-purple-300 focus:border-purple-500 outline-none arabic-text bg-white"
                dir="rtl"
                autoFocus
              />
              
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !editedPledge.trim()}
                  className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? "جاري الحفظ..." : "حفظ"}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="viewing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white/60 p-4 rounded-xl"
            >
              <div className="flex gap-3">
                <Quote className="w-6 h-6 text-purple-300 flex-shrink-0 rotate-180" />
                <p className="text-gray-700 arabic-text leading-relaxed">
                  {pledge}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PledgeCard;
