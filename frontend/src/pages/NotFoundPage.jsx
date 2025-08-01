// /Users/shalbyyousef/Desktop/Meshkah/frontend/src/pages/NotFoundPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "antd";
import { HomeOutlined } from "@ant-design/icons";

const NotFoundPage = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f7f6fb] via-[#f3edff] to-[#e9e4f5] text-gray-900 px-4 text-right transition-colors duration-300 relative overflow-hidden"
      dir="rtl"
    >
      {/* زخرفة SVG */}
      <svg
        className="absolute top-0 right-0 opacity-10 z-0"
        width="220"
        height="220"
        viewBox="0 0 220 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="110"
          cy="110"
          r="100"
          stroke="#7440E9"
          strokeWidth="8"
          strokeDasharray="12 12"
        />
      </svg>
      <svg
        className="absolute bottom-0 left-0 opacity-10 z-0"
        width="180"
        height="180"
        viewBox="0 0 180 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="20"
          y="20"
          width="140"
          height="140"
          rx="40"
          stroke="#7440E9"
          strokeWidth="7"
          strokeDasharray="10 10"
        />
      </svg>
      <div className="max-w-md w-full text-center bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-[#e3d8fa] p-8 z-10">
        <h1 className="text-6xl font-extrabold text-[#7440E9] mb-4 drop-shadow">
          ٤٠٤
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          الصفحة غير موجودة
        </h2>
        <p className="text-gray-500 mb-6">
          يبدو أن الصفحة التي تبحث عنها قد تمت إزالتها أو تغيير اسمها أو غير
          متوفرة مؤقتًا.
        </p>
        <Link to="/">
          <button className="bg-[#7440E9] hover:bg-[#8f5cf7] text-white font-bold py-3 px-8 rounded-full shadow-lg transition-colors duration-300 flex items-center justify-center gap-2 text-lg mx-auto">
            <svg
              className="w-6 h-6 ml-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"
              />
            </svg>
            العودة إلى الصفحة الرئيسية
          </button>
        </Link>
        <div className="mt-8 text-sm mb-14 text-gray-600">
          <p>إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الدعم الفني.</p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
