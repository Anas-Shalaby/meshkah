import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { MessageSquare, Send, CheckCircle2, User } from "lucide-react";
import toast from "react-hot-toast";
import * as campService from "../../services/campService";

const CampQandA = ({ campId, qanda, isLoading, onQuestionAsked }) => {
  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) {
      toast.error("لا يمكن إرسال سؤال فارغ.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await campService.askCampQuestion(campId, newQuestion);
      if (result.success) {
        toast.success("تم إرسال سؤالك بنجاح!");
        setNewQuestion("");
        onQuestionAsked && onQuestionAsked();
      } else {
        toast.error(result.message || "حدث خطأ أثناء إرسال السؤال.");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إرسال السؤال.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvatarUrl = (user) => {
    if (!user) return "/default-avatar.png";
    if (user.avatar_url) {
      if (user.avatar_url.startsWith("http")) {
        return user.avatar_url;
      } else if (user.avatar_url.startsWith("/uploads/avatars")) {
        return `${import.meta.env.VITE_IMAGE_API}/api${user.avatar_url}`;
      }
    }
    return "/default-avatar.png";
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col items-center justify-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-[#7440E9]/20 border-t-[#7440E9] mb-3 sm:mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-center text-sm sm:text-base">
            جاري تحميل الأسئلة والأجوبة...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-[#7440E9] to-[#8b5cf6] rounded-xl sm:rounded-2xl shadow-lg mb-3 sm:mb-4">
          <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
        </div>
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-[#7440E9] to-[#8b5cf6] bg-clip-text text-transparent">
          اسأل وأجب
        </h3>
        <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400 px-2">
          اطرح أسئلتك واحصل على إجابات من المشرفين
        </p>
      </div>

      {/* Form to ask a new question */}
      {user && (
        <form
          onSubmit={handleSubmitQuestion}
          className="mb-4 sm:mb-6 lg:mb-8 bg-gradient-to-br from-[#F7F6FB] to-[#F3EDFF] dark:from-gray-800 dark:to-gray-900 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-5 border border-[#7440E9]/10 dark:border-gray-700"
        >
          <textarea
            className="w-full p-3 sm:p-4 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[#7440E9] focus:border-transparent resize-y text-right text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            rows="3"
            placeholder="اكتب سؤالك هنا..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            disabled={!user || isSubmitting}
          ></textarea>
          <button
            type="submit"
            className="mt-2 sm:mt-3 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[#7440E9] to-[#8b5cf6] text-white rounded-lg sm:rounded-xl hover:from-[#5d2fb8] hover:to-[#7440E9] transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-sm sm:text-base shadow-md hover:shadow-lg active:scale-95 sm:active:scale-100"
            disabled={isSubmitting || !user}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>جار الإرسال...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">أرسل سؤالك</span>
                <span className="sm:hidden">إرسال</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* List of existing questions and answers */}
      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
        {qanda && qanda.length > 0 ? (
          qanda.map((item) => (
            <div
              key={item.id}
              className="group bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-5 border border-gray-200 dark:border-gray-700 hover:border-[#7440E9]/30 dark:hover:border-[#7440E9]/30 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {item.avatar_url ? (
                    <img
                      src={getAvatarUrl(item)}
                      alt={item.author}
                      className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full object-cover border-2 border-[#7440E9]/30 shadow-sm"
                      onError={(e) => {
                        e.target.src = "/default-avatar.png";
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-[#F7F6FB] to-[#F3EDFF] dark:from-gray-700 dark:to-gray-800 flex items-center justify-center border-2 border-[#7440E9]/30 shadow-sm">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#7440E9] dark:text-[#a78bfa]" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Question */}
                  <div className="mb-2 sm:mb-3">
                    <div className="flex items-start gap-2 mb-1.5 sm:mb-2">
                      <span className="text-xs sm:text-sm font-bold text-[#7440E9] dark:text-[#a78bfa] bg-[#7440E9]/10 dark:bg-[#7440E9]/20 px-2 py-0.5 rounded-full">
                        س
                      </span>
                      <p className="flex-1 font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base lg:text-lg break-words leading-relaxed">
                        {item.question}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-right flex items-center gap-1 justify-end">
                      <span>طرحه:</span>
                      <span className="font-medium">
                        {item.author || "مشارك مجهول"}
                      </span>
                    </p>
                  </div>

                  {/* Answer */}
                  {item.is_answered ? (
                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-br from-[#7440E9]/5 to-[#8b5cf6]/5 dark:from-[#7440E9]/10 dark:to-[#8b5cf6]/10 rounded-lg sm:rounded-xl border-r-3 sm:border-r-4 border-[#7440E9] shadow-sm">
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <p className="font-semibold text-[#7440E9] dark:text-[#a78bfa] text-xs sm:text-sm lg:text-base">
                          إجابة المشرف
                        </p>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-right text-sm sm:text-base lg:text-lg break-words leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic text-right flex items-center gap-1 justify-end">
                        <span>⏳</span>
                        <span>لم تتم الإجابة على هذا السؤال بعد.</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 sm:py-12 lg:py-16 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-[#7440E9]/10 to-[#8b5cf6]/10 rounded-full mb-4 sm:mb-6">
              <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#7440E9]" />
            </div>
            <h4 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3">
              لا توجد أسئلة حتى الآن
            </h4>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
              كن أول من يطرح سؤالاً! استخدم النموذج أعلاه لطرح سؤالك وسيقوم
              المشرفون بالرد عليه.
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                💡 نصيحة: اطرح أسئلة واضحة ومحددة
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampQandA;
