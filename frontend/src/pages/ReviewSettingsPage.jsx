import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Settings,
  Bell,
  Clock,
  Calendar,
  Layers,
  Save,
  Moon,
  Target,
  Sun
} from "lucide-react";
import toast from "react-hot-toast";
import { getReviewSettings, updateReviewSettings } from "../services/reviewService";
import SEO from "../components/SEO";

// Custom Toggle Component
const Toggle = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
      enabled ? "bg-purple-600" : "bg-gray-200"
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
        enabled ? "translate-x-1" : "translate-x-6"
      }`}
    />
  </button>
);

const SettingSection = ({ title, icon: Icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6"
  >
    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
      <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    </div>
    <div className="space-y-6">
      {children}
    </div>
  </motion.div>
);

const ReviewSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    daily_new_cards: 10,
    daily_review_cards: 50,
    preferred_time: "20:00",
    notifications_enabled: true,
    rest_days: []
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getReviewSettings();
      if (data.success && data.settings) {
        // Format time if needed to HH:MM
        let time = data.settings.preferred_time;
        if (time && time.length > 5) time = time.substring(0, 5);

        setSettings({
            ...data.settings,
            preferred_time: time,
            rest_days: typeof data.settings.rest_days === 'string' 
              ? JSON.parse(data.settings.rest_days || '[]')
              : data.settings.rest_days || []
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("فشل تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateReviewSettings(settings);
      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const toggleRestDay = (day) => {
    setSettings(prev => {
      const currentDays = prev.rest_days || [];
      if (currentDays.includes(day)) {
        return { ...prev, rest_days: currentDays.filter(d => d !== day) };
      } else {
        return { ...prev, rest_days: [...currentDays, day] };
      }
    });
  };

  const daysOfWeek = [
    { id: 'fri', label: 'الجمعة' },
    { id: 'sat', label: 'السبت' },
    { id: 'sun', label: 'الأحد' },
    { id: 'mon', label: 'الاثنين' },
    { id: 'tue', label: 'الثلاثاء' },
    { id: 'wed', label: 'الأربعاء' },
    { id: 'thu', label: 'الخميس' },
  ];

  if (loading) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <SEO title="إعدادات المراجعة | مشكاة" />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate('/reviews')}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">إعدادات المراجعة</h1>
            </div>
            <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-2.5 bg-[#7440e9] text-white rounded-xl font-medium transition-all hover:bg-[#6d28d9] hover:shadow-lg hover:shadow-purple-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
            >
                {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <Save className="w-4 h-4" />
                        <span>حفظ</span>
                    </>
                )}
            </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Daily Goals Section */}
        <SettingSection title="الأهداف اليومية" icon={Target}>
            <div>
                <label className="block text-gray-700 font-medium mb-2">بطاقات جديدة في اليوم</label>
                <div className="flex items-center gap-4">
                    <input 
                        type="range" 
                        min="0" 
                        max="50" 
                        step="5"
                        value={settings.daily_new_cards}
                        onChange={(e) => setSettings({...settings, daily_new_cards: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <span className="w-12 text-center font-bold text-purple-600 bg-purple-50 py-1 rounded-lg">
                        {settings.daily_new_cards}
                    </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">عدد الأحاديث الجديدة التي تريد حفظها يومياً</p>
            </div>

            <div>
                <label className="block text-gray-700 font-medium mb-2">الحد الأقصى للمراجعات</label>
                <div className="flex items-center gap-4">
                    <input 
                        type="range" 
                        min="10" 
                        max="200" 
                        step="10"
                        value={settings.daily_review_cards}
                        onChange={(e) => setSettings({...settings, daily_review_cards: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <span className="w-12 text-center font-bold text-purple-600 bg-purple-50 py-1 rounded-lg">
                        {settings.daily_review_cards}
                    </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">الحد الأقصى لبطاقات المراجعة اليومية لتجنب الإرهاق</p>
            </div>
        </SettingSection>

        {/* Notifications Section */}
        <SettingSection title="التنبيهات والأوقات" icon={Bell}>
            <div className="flex items-center justify-between">
                <div>
                    <label className="block text-gray-800 font-medium">تفعيل التنبيهات</label>
                    <p className="text-sm text-gray-500">استلام تذكير يومي عبر البريد الإلكتروني</p>
                </div>
                <Toggle 
                    enabled={settings.notifications_enabled} 
                    onChange={(val) => setSettings({...settings, notifications_enabled: val})}
                />
            </div>

            {settings.notifications_enabled && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="pt-4 border-t border-gray-50 mt-4"
                >
                    <label className="block text-gray-700 font-medium mb-2">وقت التذكير المفضل</label>
                    <div className="relative">
                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                            type="time" 
                            value={settings.preferred_time}
                            onChange={(e) => setSettings({...settings, preferred_time: e.target.value})}
                            className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        />
                    </div>
                </motion.div>
            )}
        </SettingSection>

        {/* Rest Days Section */}
        <SettingSection title="أيام الراحة" icon={Calendar}>
             <p className="text-sm text-gray-600 mb-4">حدد الأيام التي لا تريد استلام مراجعات جديدة فيها (اختياري)</p>
             <div className="flex flex-wrap gap-3">
                {daysOfWeek.map((day) => {
                    const isSelected = settings.rest_days?.includes(day.id);
                    return (
                        <button
                            key={day.id}
                            onClick={() => toggleRestDay(day.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                isSelected 
                                ? "bg-purple-600 text-white shadow-lg shadow-purple-200" 
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {day.label}
                        </button>
                    )
                })}
             </div>
        </SettingSection>

      </div>
    </div>
  );
};

export default ReviewSettingsPage;
