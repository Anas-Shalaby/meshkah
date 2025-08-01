import React from "react";

export const Anas = () => {
  return (
    <div
      className="max-w-3xl mx-auto p-8 bg-white dark:bg-[#1a202c] rounded-lg shadow mt-10 mb-10"
      dir="rtl"
    >
      <h1 className="text-3xl font-bold mb-6 text-[#7440E9]">سياسة الخصوصية</h1>
      <p className="mb-4">
        نرحب بكم في تطبيق مشكاة. نحن ملتزمون بحماية خصوصيتكم وضمان سرية بياناتكم
        الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية بيانات المستخدمين
        عند استخدامكم للتطبيق، خاصة فيما يتعلق بخدمات Google OAuth Workspace
        APIs وGoogle Photos API.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">
        ١. تعريف بالتطبيق واستخدام البيانات
      </h2>
      <p className="mb-4">
        تطبيق مشكاة هو منصة تهدف إلى تقديم خدمات تعليمية وتفاعلية للمستخدمين.
        عند تسجيل الدخول باستخدام حساب Google، نقوم بجمع بعض المعلومات الضرورية
        لتقديم وتحسين خدماتنا، مثل الاسم، البريد الإلكتروني، وصورة الملف الشخصي.
        كما قد نستخدم Google Photos API للوصول إلى الصور بعد الحصول على إذن صريح
        من المستخدم، وذلك فقط للأغراض التي تخدم تجربة المستخدم داخل التطبيق.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">
        ٢. أنواع البيانات التي نجمعها
      </h2>
      <ul className="list-disc pr-6 mb-4">
        <li>معلومات الحساب: الاسم، البريد الإلكتروني، صورة الملف الشخصي.</li>
        <li>
          بيانات الاستخدام: الصفحات التي تزورها، الإجراءات التي تقوم بها داخل
          التطبيق.
        </li>
        <li>
          الصور: فقط بعد موافقتك الصريحة، وللاستخدامات المحددة داخل التطبيق.
        </li>
        <li>أي معلومات أخرى تقدمها لنا طوعًا عبر التطبيق أو الدعم.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">
        ٣. كيفية معالجة واستخدام البيانات
      </h2>
      <ul className="list-disc pr-6 mb-4">
        <li>تقديم وتحسين الخدمات والميزات داخل التطبيق.</li>
        <li>تخصيص تجربة المستخدم.</li>
        <li>التواصل معك بشأن التحديثات أو الدعم الفني.</li>
        <li>حماية أمان المستخدمين والتطبيق.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">
        ٤. الالتزام بسياسة Limited Use
      </h2>
      <p className="mb-4">
        نحن ملتزمون باستخدام المعلومات المستلمة من Google Workspace API وGoogle
        Photos API وفقًا لسياسة بيانات مستخدمي خدمات Google API، بما في ذلك
        متطلبات الاستخدام المحدود (Limited Use). لا نقوم باستخدام هذه البيانات
        إلا لتقديم وتحسين خدماتنا، ولا نشاركها مع أي أطراف خارجية إلا في نطاق
        الغرض الأساسي للخدمة وبعد الحصول على موافقتك.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">
        ٥. الإفصاح حول سياسة الاستخدام المحدود
      </h2>
      <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <p>
          نؤكد أن استخدامنا للبيانات يتوافق مع متطلبات سياسة الاستخدام المحدود
          لـ Google Workspace API وPhotos API. يمكنكم الإطلاع على السياسات من
          خلال الروابط التالية:
        </p>
        <ul className="list-disc pr-6 mt-2">
          <li>
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7440E9] underline"
            >
              سياسة استخدام بيانات Workspace API
            </a>
          </li>
          <li>
            <a
              href="https://developers.google.com/photos/library/guides/terms-of-service#limited_use_requirements"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7440E9] underline"
            >
              سياسة استخدام بيانات Photos API
            </a>
          </li>
        </ul>
      </div>
      <h2 className="text-xl font-semibold mt-6 mb-2">٦. حماية المعلومات</h2>
      <p className="mb-4">
        نستخدم إجراءات أمان تقنية وتنظيمية مناسبة لحماية بياناتك من الوصول أو
        الاستخدام أو التعديل أو الإفصاح غير المصرح به. يتم تخزين البيانات بشكل
        آمن ولا يتم الاحتفاظ بها إلا للمدة اللازمة لتحقيق الأغراض المذكورة.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">٧. حقوق المستخدم</h2>
      <ul className="list-disc pr-6 mb-4">
        <li>
          يحق لك الوصول إلى بياناتك الشخصية أو تعديلها أو حذفها في أي وقت.
        </li>
        <li>
          يحق لك سحب موافقتك على معالجة بياناتك في أي وقت دون التأثير على
          قانونية المعالجة السابقة.
        </li>
        <li>يمكنك التواصل معنا لأي استفسار أو طلب متعلق ببياناتك.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">٨. مشاركة المعلومات</h2>
      <p className="mb-4">
        لا نشارك معلوماتك الشخصية مع أي طرف ثالث إلا في الحالات التي يفرضها
        القانون أو لتحسين الخدمة وبعد الحصول على موافقتك الصريحة.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">
        ٩. التعديلات على السياسة
      </h2>
      <p className="mb-4">
        قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سيتم إشعارك بأي تغييرات هامة
        عبر التطبيق أو البريد الإلكتروني.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">١٠. التواصل معنا</h2>
      <p>
        إذا كان لديك أي أسئلة أو استفسارات حول سياسة الخصوصية أو كيفية معالجة
        بياناتك، يرجى التواصل معنا عبر صفحة التواصل داخل التطبيق أو عبر البريد
        الإلكتروني المخصص للدعم.
      </p>
    </div>
  );
};
