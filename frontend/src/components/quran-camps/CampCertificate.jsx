import { forwardRef } from "react";
import { Award, CheckCircle, Star, Calendar, Shield } from "lucide-react";

const CampCertificate = forwardRef(
  ({ certificate, campName, userName }, ref) => {
    const currentDate = new Date(
      certificate?.issued_at || new Date()
    ).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const certificateData = certificate?.certificate_data || {};

    return (
      <div
        ref={ref}
        className="relative w-full bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8 md:p-12"
        style={{
          aspectRatio: "1.414/1",
          maxWidth: "842px",
          margin: "0 auto",
          minHeight: "595px",
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="cert-pattern"
                x="0"
                y="0"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="50" cy="50" r="2" fill="#7440E9" />
                <circle cx="0" cy="0" r="2" fill="#7440E9" />
                <circle cx="100" cy="100" r="2" fill="#7440E9" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cert-pattern)" />
          </svg>
        </div>

        {/* Decorative Border */}
        <div className="absolute inset-4 border-4 border-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 rounded-2xl"></div>
        <div className="absolute inset-6 border-2 border-purple-300 rounded-xl"></div>

        {/* Corner Decorations */}
        <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-[#7440E9] rounded-tl-2xl"></div>
        <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-[#7440E9] rounded-tr-2xl"></div>
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-[#7440E9] rounded-bl-2xl"></div>
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-[#7440E9] rounded-br-2xl"></div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-between py-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-[#7440E9] to-[#9F7AEA] rounded-full flex items-center justify-center shadow-lg">
                <Award className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-gradient-to-r from-[#7440E9] to-[#9F7AEA] bg-clip-text mb-2">
              شهادة إتمام
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-[#7440E9] to-transparent mx-auto"></div>
          </div>

          {/* Main Content */}
          <div className="text-center space-y-4 max-w-2xl">
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
              تشهد{" "}
              <span className="font-bold text-[#7440E9]">مشكاة الأحاديث</span>{" "}
              بأن
            </p>

            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-black text-[#7440E9] mb-2">
                {userName || certificate?.username || "المشارك الكريم"}
              </h2>
              <div className="h-1 bg-gradient-to-r from-transparent via-[#7440E9] to-transparent"></div>
            </div>

            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
              قد أتم بنجاح مخيم
            </p>

            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 md:p-6 border-2 border-[#7440E9]/30">
              <h3 className="text-2xl md:text-3xl font-bold text-[#7440E9]">
                {campName || certificate?.camp_name || "المخيم القرآني"}
              </h3>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-[#7440E9]">
                  {certificateData?.days_completed ||
                    certificate?.total_days ||
                    0}
                </p>
                <p className="text-xs md:text-sm text-gray-600">يوم مكتمل</p>
              </div>

              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-[#7440E9] to-[#9F7AEA] rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-[#7440E9]">
                  {certificateData?.total_points ||
                    certificate?.total_points ||
                    0}
                </p>
                <p className="text-xs md:text-sm text-gray-600">نقطة</p>
              </div>

              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-[#7440E9]">
                  {certificateData?.longest_streak ||
                    certificate?.longest_streak ||
                    0}
                </p>
                <p className="text-xs md:text-sm text-gray-600">أطول سلسلة</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <p className="text-base md:text-lg">
                تاريخ الإتمام: {currentDate}
              </p>
            </div>

            {certificate?.verification_code && (
              <div className="flex items-center justify-center gap-2 bg-purple-50 px-4 py-2 rounded-lg">
                <Shield className="w-4 h-4 text-[#7440E9]" />
                <p className="text-sm text-gray-600">
                  كود التحقق:{" "}
                  <span className="font-mono font-bold text-[#7440E9]">
                    {certificate.verification_code}
                  </span>
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-8 pt-4">
              <div className="text-center">
                <div className="w-40 h-0.5 bg-[#7440E9] mb-2"></div>
                <p className="text-sm text-gray-600 font-semibold">
                  منصة مشكاة الأحاديث
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 pt-2">
              رحلة قرآنية مباركة • hadith-shareef.com
            </p>
          </div>
        </div>

        {/* Watermark */}
        <div className="absolute bottom-4 left-4 opacity-20">
          <div className="w-16 h-16 border-4 border-[#7440E9] rounded-full flex items-center justify-center">
            <Award className="w-8 h-8 text-[#7440E9]" />
          </div>
        </div>
      </div>
    );
  }
);

CampCertificate.displayName = "CampCertificate";

export default CampCertificate;
