import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import { BookOpen, ChevronRight, ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const CategoryPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [currentLevel, setCurrentLevel] = useState([]); // لتتبع المستويات الحالية

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);

        // جلب جميع التصنيفات
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/sub-categories`
        );
        const allCategories = response.data.data || [];

        // البحث عن التصنيف الحالي
        const currentCategory = allCategories.find(
          (cat) => cat.id == categoryId
        );

        if (!currentCategory) {
          setError("التصنيف غير موجود");
          setLoading(false);
          return;
        }

        setCategory(currentCategory);

        // جلب الـ sub-categories من القائمة الكاملة
        const subCats = allCategories.filter(
          (cat) => cat.parent_id == categoryId
        );

        setSubCategories(subCats);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching category data:", error);
        setError("حدث خطأ أثناء تحميل البيانات");
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [categoryId]);

  // دالة للتنقل للمستوى التالي
  const navigateToSubCategory = (subCategoryId) => {
    // حفظ المستوى الحالي في التاريخ
    const newLevel = {
      id: categoryId,
      title: category.title,
      path: `/hadiths/category/${categoryId}`,
    };

    setCurrentLevel((prev) => [...prev, newLevel]);

    // التنقل للمستوى التالي
    navigate(`/hadiths/category/${subCategoryId}`);
  };

  // دالة للعودة للمستوى السابق
  const goBackToLevel = (levelIndex) => {
    if (levelIndex >= 0 && levelIndex < currentLevel.length) {
      const targetLevel = currentLevel[levelIndex];
      setCurrentLevel((prev) => prev.slice(0, levelIndex + 1));
      navigate(targetLevel.path);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] font-cairo"
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 border-4 border-[#7440E9]/20 rounded-full animate-spin border-t-transparent border-b-transparent" />
          <h2 className="text-2xl font-bold text-[#7440E9] mt-4">
            جاري تحميل التصنيف...
          </h2>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] font-cairo"
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
          <button
            onClick={() => navigate("/hadiths")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white font-bold"
          >
            العودة للتصنيفات
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] py-16 px-4 font-cairo"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        {currentLevel.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigate("/hadiths/categories")}
                className="px-4 py-2 rounded-lg bg-white/80 text-[#7440E9] font-medium hover:bg-[#7440E9] hover:text-white transition-all duration-200"
              >
                التصنيفات الرئيسية
              </button>

              {currentLevel.map((level, index) => (
                <div key={level.id} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <button
                    onClick={() => goBackToLevel(index)}
                    className="px-4 py-2 rounded-lg bg-white/80 text-[#7440E9] font-medium hover:bg-[#7440E9] hover:text-white transition-all duration-200"
                  >
                    {level.title}
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="px-4 py-2 rounded-lg bg-[#7440E9] text-white font-medium">
                  {category.title}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate("/hadiths")}
            className="mb-8 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة للتصنيفات
          </motion.button>

          {/* Category Header */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#7440E9] to-[#8B5CF6] rounded-3xl flex items-center justify-center shadow-xl">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#7440E9] mb-4">
              {category.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-6">
              استكشف الأحاديث النبوية الشريفة في هذا التصنيف
            </p>

            {/* Category Stats */}
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#7440E9]">
                  {category.hadeeths_count || 0}
                </div>
                <div className="text-gray-600">حديث</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#7440E9]">
                  {category.subCategories.length}
                </div>
                <div className="text-gray-600">تصنيف فرعي</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Direct Access to Hadiths */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-[#7440E9] mb-4">
                عرض جميع الأحاديث
              </h2>
              <p className="text-gray-600 mb-6">
                يمكنك عرض جميع الأحاديث في هذا التصنيف مباشرة
              </p>
              <button
                onClick={() => navigate(`/hadiths/${categoryId}/page/1`)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#7440E9] to-[#8B5CF6] text-white font-bold text-lg hover:from-[#6D28D9] hover:to-[#7C3AED] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <BookOpen className="w-6 h-6" />
                عرض جميع الأحاديث
              </button>
            </div>
          </motion.div>

          {/* Sub Categories */}
          {category?.subCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-[#7440E9] mb-4">
                  التصنيفات الفرعية
                </h2>
                <p className="text-gray-600 text-lg">
                  استكشف التصنيفات الفرعية للحصول على تنظيم أفضل
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {category?.subCategories.map((subCat, idx) => (
                  <motion.div
                    key={subCat.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 + idx * 0.1 }}
                    className="relative bg-white/90 backdrop-blur-xl border border-white/20 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group p-8 text-center"
                    style={{ minHeight: 280 }}
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#7440E9]/5 to-[#8B5CF6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative z-10">
                      <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#7440E9] to-[#8B5CF6] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>

                      <h3 className="font-bold text-2xl text-[#7440E9] mb-4 group-hover:text-[#6D28D9] transition-colors duration-300">
                        {subCat.title}
                      </h3>

                      <div className="inline-block mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-[#7440E9]/10 to-[#8B5CF6]/10 text-[#7440E9] font-semibold text-sm border border-[#7440E9]/20">
                        {subCat.hadeeths_count || 0} حديث
                      </div>

                      {/* أزرار التفاعل */}
                      <div className="space-y-3">
                        {/* زر الذهاب للأحاديث مباشرة */}
                        <button
                          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#7440E9] font-bold border-2 border-[#7440E9] hover:bg-[#7440E9] hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl group-hover:scale-105"
                          onClick={() =>
                            navigate(`/hadiths/${subCat.id}/page/1`)
                          }
                        >
                          <BookOpen className="w-5 h-5" />
                          عرض الأحاديث
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* No Sub Categories Message */}
          {category?.subCategories.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-center"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg p-8">
                <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  لا توجد تصنيفات فرعية
                </h3>
                <p className="text-gray-600">
                  هذا التصنيف لا يحتوي على تصنيفات فرعية. يمكنك عرض جميع
                  الأحاديث مباشرة.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CategoryPage;
