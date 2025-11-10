import React from "react";

const Tip = ({ title, children }) => (
  <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-[#7440E9]/15 shadow-sm">
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7440E9] to-[#6B3AD1] text-white flex items-center justify-center text-sm">
      ✓
    </div>
    <div>
      <div className="font-semibold text-gray-900 mb-1">{title}</div>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </div>
  </div>
);

export default function CampOnboardingTips() {
  return (
    <div className="space-y-4">
      <div className="mb-1">
        <h3 className="text-lg font-bold text-gray-900">دليل سريع للبدء</h3>
        <p className="text-sm text-gray-500">
          خطوات بسيطة وواضحة متوافقة مع هويتنا البصرية.
        </p>
      </div>
      <Tip title="كيف تبدأ؟">
        افتح مهام اليوم الأول، اقرأ الوصف المختصر، ثم ابدأ بالمهمة الأولى.
      </Tip>
      <Tip title="تعليم المهمة كمكتملة">
        بعد إنهاء المهمة، اضغط زر الإكمال. يمكنك إضافة مذكرة قصيرة تحفظ لك
        تأملك.
      </Tip>
      <Tip title="خطة العمل">
        استخدم خطة العمل لتحديد ما ستطبّقه ومتى ستكرره. هذا يساعد على الثبات.
      </Tip>
    </div>
  );
}
