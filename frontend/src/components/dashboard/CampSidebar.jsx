import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  FileText,
  Trophy,
  BookOpen,
  Settings,
  X,
  Target,
  TrendingUp,
  Award,
  Clock,
  Users,
} from "lucide-react";

const CampSidebar = ({ isOpen, onClose, campData, progressData, isMobile }) => {
  const location = useLocation();

  const navigationItems = [
    {
      name: "نظرة عامة",
      href: `/my-camp-journey/${campData?.id}`,
      icon: LayoutDashboard,
      description: "لوحة التحكم الرئيسية",
    },
    {
      name: "المهام اليومية",
      href: `/my-camp-journey/${campData?.id}#tasks`,
      icon: Calendar,
      description: "مهام اليوم والتقدم",
    },
    {
      name: "التقدم والإحصائيات",
      href: `/my-camp-journey/${campData?.id}#progress`,
      icon: BarChart3,
      description: "مخططات وإحصائيات",
    },
    {
      name: "يومياتي",
      href: `/my-camp-journal/${campData?.id}`,
      icon: FileText,
      description: "يوميات وتدبر",
    },
    {
      name: "مكتبة السورة",
      href: `/my-camp-journey/${campData?.id}#library`,
      icon: BookOpen,
      description: "مواد السورة",
    },
    {
      name: "الإعدادات",
      href: `/my-camp-journey/${campData?.id}#settings`,
      icon: Settings,
      description: "إعدادات الحساب",
    },
  ];

  const isActive = (href) => {
    if (href.includes("#")) {
      return location.pathname === href.split("#")[0];
    }
    return location.pathname === href;
  };

  // Calculate quick stats
  const daysSinceStart = campData
    ? Math.floor(
        (new Date() - new Date(campData.start_date)) / (1000 * 60 * 60 * 24)
      )
    : 0;
  const totalDays = campData?.duration_days || 0;
  const daysRemaining = Math.max(0, totalDays - daysSinceStart);
  const progressPercentage = progressData
    ? Math.round(
        (progressData.progress.completedTasks /
          progressData.progress.totalTasks) *
          100
      )
    : 0;

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 text-white shadow-2xl transform transition-transform duration-300 z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } ${isMobile ? "lg:hidden" : ""}`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-purple-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-600 rounded-2xl mr-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">لوحة التحكم</h1>
                <p className="text-purple-200 text-sm">المخيمات القرآنية</p>
              </div>
            </div>
            {isMobile && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Camp Info */}
          {campData && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <h2 className="text-lg font-bold mb-2">{campData.name}</h2>
              <p className="text-purple-200 text-sm">
                سورة {campData.surah_name}
              </p>
              <div className="flex items-center mt-2 text-xs text-purple-300">
                <Clock className="w-4 h-4 mr-1" />
                <span>
                  اليوم {daysSinceStart + 1} من {totalDays}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="p-6">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={isMobile ? onClose : undefined}
                  className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                    active
                      ? "bg-purple-600 text-white shadow-lg"
                      : "text-purple-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Stats */}
        {progressData && (
          <div className="p-6 border-t border-purple-700">
            <h3 className="text-lg font-bold mb-4">إحصائيات سريعة</h3>
            <div className="space-y-4">
              {/* Days Remaining */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-200">
                    الأيام المتبقية
                  </span>
                  <span className="text-2xl font-bold text-orange-400">
                    {daysRemaining}
                  </span>
                </div>
                <div className="w-full bg-purple-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(
                        0,
                        (daysRemaining / totalDays) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Progress */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-200">التقدم</span>
                  <span className="text-2xl font-bold text-green-400">
                    {progressPercentage}%
                  </span>
                </div>
                <div className="w-full bg-purple-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Points */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-200">النقاط</span>
                  <span className="text-2xl font-bold text-yellow-400">
                    {progressData.enrollment?.total_points || 0}
                  </span>
                </div>
                <div className="flex items-center text-xs text-purple-300">
                  <Award className="w-3 h-3 mr-1" />
                  <span>ترتيبك: #{progressData.progress?.rank || "-"}</span>
                </div>
              </div>

              {/* Streak */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-200">
                    سلسلة الالتزام
                  </span>
                  <span className="text-2xl font-bold text-blue-400">
                    {Math.min(daysSinceStart + 1, totalDays)}
                  </span>
                </div>
                {/* <div className="flex space-x-1">
                  {[...Array(Math.min(daysSinceStart + 1, 7))].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-blue-400 rounded-full"
                    ></div>
                  ))}
                </div> */}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:hidden">
          <div className="flex items-center justify-around py-2">
            {navigationItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                    active
                      ? "text-purple-600 bg-purple-50"
                      : "text-gray-600 hover:text-purple-600"
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default CampSidebar;
