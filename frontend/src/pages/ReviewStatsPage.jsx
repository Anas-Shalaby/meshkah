import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronRight,
  BarChart3,
  TrendingUp,
  Brain,
  Clock,
  Calendar,
  Zap,
  Award,
  Target,
  Activity
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getReviewStats, getReviewHistory } from "../services/reviewService";
import SEO from "../components/SEO";

const StatCard = ({ title, value, label, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-3xl shadow-lg border border-purple-50 relative overflow-hidden group"
  >
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color.text}`}>
      <Icon className="w-24 h-24" />
    </div>
    
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color.bg} ${color.text}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-3xl font-bold text-gray-800 mb-1 font-['Noto_Naskh_Arabic']">
        {value}
      </h3>
      <p className="text-gray-500 font-medium text-sm">{title}</p>
      {label && (
        <p className="text-xs mt-2 text-gray-400">{label}</p>
      )}
    </div>
  </motion.div>
);

const ProgressBar = ({ label, value, total, color, percentage }) => (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-2">
      <span className="text-gray-700 font-medium text-sm">{label}</span>
      <span className="text-gray-500 text-xs">{value} من {total}</span>
    </div>
    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  </div>
);

const ReviewStatsPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, historyData] = await Promise.all([
          getReviewStats(),
          getReviewHistory(30) // Last 30 days
        ]);
        setStats(statsData.stats);
        setHistory(historyData.history || []);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Calculate percentages
  const totalCards = stats?.total_cards || 0;
  const masteredPercent = totalCards ? (stats.mastered_cards / totalCards) * 100 : 0;
  const learningPercent = totalCards ? (stats.learning_cards / totalCards) * 100 : 0;
  const reviewingPercent = totalCards ? (stats.reviewing_cards / totalCards) * 100 : 0;

  console.log(history)
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <SEO title="إحصائيات المراجعة | مشكاة" />
      
      {/* Header */}
      <div className="bg-[#7440e9] text-white pb-32 pt-8 px-4 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate('/reviews')}
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">إحصائيات الأداء</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
              <Activity className="w-8 h-8 text-purple-200" />
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">مستوى الأداء العام</p>
              <h2 className="text-3xl font-bold font-['Noto_Naskh_Arabic']">
                {stats?.overall_quality ? Number(stats.overall_quality).toFixed(1) : '0.0'} 
                <span className="text-lg text-purple-300 font-normal mr-2">/ 5.0</span>
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-24">
        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="إجمالي البطاقات"
            value={stats?.total_cards || 0}
            icon={Brain}
            color={{ bg: "bg-purple-100", text: "text-purple-600" }}
            delay={0.1}
          />
          <StatCard
            title="أيام متتالية"
            value={stats?.review_streak || 0}
            label="يوم"
            icon={Zap}
            color={{ bg: "bg-amber-100", text: "text-amber-600" }}
            delay={0.2}
          />
          <StatCard
            title="بطاقات متقنة"
            value={stats?.mastered_cards || 0}
            icon={Award}
            color={{ bg: "bg-green-100", text: "text-green-600" }}
            delay={0.3}
          />
          <StatCard
            title="قيد المراجعة"
            value={stats?.reviewing_cards || 0}
            icon={Target}
            color={{ bg: "bg-blue-100", text: "text-blue-600" }}
            delay={0.4}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Progress Breakdown */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-lg border border-purple-50"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">توزيع البطاقات</h3>
            </div>

            <div className="space-y-6">
              <ProgressBar 
                label="متقن (Mastered)" 
                value={stats?.mastered_cards || 0} 
                total={totalCards}
                percentage={masteredPercent}
                color="bg-gradient-to-r from-green-500 to-emerald-500"
              />
              <ProgressBar 
                label="قيد المراجعة (Reviewing)" 
                value={stats?.reviewing_cards || 0} 
                total={totalCards} 
                percentage={reviewingPercent}
                color="bg-gradient-to-r from-blue-500 to-indigo-500"
              />
              <ProgressBar 
                label="في مرحلة التعلم (Learning)" 
                value={stats?.learning_cards || 0} 
                total={totalCards} 
                percentage={learningPercent}
                color="bg-gradient-to-r from-amber-500 to-orange-500"
              />
            </div>
          </motion.div>

          {/* Recommendations / Insights */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-purple-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/10 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">توصيات ذكية</h3>
              </div>

              <div className="space-y-4">
               {stats?.recommendations && stats.recommendations.length > 0 ? (
                 stats.recommendations.map((rec, index) => (
                   <div key={index} className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                     <p className="text-purple-100 text-sm leading-relaxed">
                       {rec.message}
                     </p>
                   </div>
                 ))
               ) : (
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                    <p className="text-purple-100 text-sm leading-relaxed">
                      استمر في المراجعة اليومية للحصول على توصيات مخصصة لأدائك.
                    </p>
                  </div>
               )}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-xs text-purple-300 mb-2">الوقت المتوقع للإتقان</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">{stats?.estimated_completion_days || 0}</span>
                  <span className="text-sm pb-1">يوم</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Activity Chart (SVG Area) */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
           className="bg-white p-8 rounded-3xl shadow-lg border border-purple-50"
        >
           <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">نشاط المراجعة (30 يوم)</h3>
             </div>
             {/* Legend */}
             <div className="flex items-center gap-2 text-sm text-gray-500">
               <span className="w-2 h-2 rounded-full bg-purple-500"></span>
               <span>عدد المراجعات</span>
             </div>
           </div>
           
           <div className="h-64 w-full relative">
              {(() => {
                // 1. Prepare Data
                const days = [];
                for (let i = 29; i >= 0; i--) {
                  const d = new Date();
                  d.setDate(d.getDate() - i);
                  const dateStr = d.toISOString().split('T')[0];
                  const dayData = history.find(h => h.date.split('T')[0] === dateStr);
                  days.push({
                    date: d,
                    label: d.getDate(),
                    fullDate: dateStr,
                    count: dayData ? dayData.reviews_count : 0
                  });
                }

                if (days.every(d => d.count === 0)) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <BarChart3 className="w-12 h-12 mb-2 opacity-20" />
                      <p>لا يوجد نشاط مسجل في آخر 30 يوم</p>
                    </div>
                  );
                }

                // 2. Calculate Dimensions & Max
                const maxVal = Math.max(...days.map(d => d.count), 5); // Minimum max of 5 for scale
                const width = 100; // viewBox width units
                const height = 100; // viewBox height units
                const stepX = width / (days.length - 1);
                
                // 3. Generate Path
                let pathD = `M 0,${height} `; // Start bottom-left
                const points = days.map((day, idx) => {
                  const x = idx * stepX;
                  const y = height - (day.count / maxVal) * height * 0.8; // Use 80% height max
                  return { x, y, ...day };
                });

                // Create smooth curve or straight lines
                points.forEach((p, i) => {
                   pathD += `L ${p.x},${p.y} `;
                });

                pathD += `L ${width},${height} Z`; // Close path to bottom-right

                return (
                  <div className="relative w-full h-full">
                    {/* The Chart */}
                    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines (Optional - Horizontal) */}
                      <line x1="0" y1="25" x2="100" y2="25" stroke="#f3f4f6" strokeWidth="0.5" />
                      <line x1="0" y1="50" x2="100" y2="50" stroke="#f3f4f6" strokeWidth="0.5" />
                      <line x1="0" y1="75" x2="100" y2="75" stroke="#f3f4f6" strokeWidth="0.5" />

                      {/* Area */}
                      <path d={pathD} fill="url(#chartGradient)" />
                      
                      {/* Line */}
                      <path 
                        d={pathD.replace(/L \d+,100 Z$/, '')} // Remove closing part for the line stroke
                        fill="none" 
                        stroke="#7440e9" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />

                      {/* Data Points (Interactive) */}
                      {points.map((p, i) => (
                         <circle 
                           key={i} 
                           cx={p.x} 
                           cy={p.y} 
                           r="2" // larger hit area visually handled by group hover ? No SVG layering is tricky. 
                           className="fill-white stroke-purple-600 stroke-2 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                         >
                           <title>{`${new Date(p.date).toLocaleDateString('ar-EG')}: ${p.count} مراجعة`}</title>
                         </circle>
                      ))}
                    </svg>

                    {/* Simple X-Axis Labels (Every 5 days) */}
                    <div className="absolute bottom-0 left-0 w-full flex justify-between text-[10px] text-gray-400 pointer-events-none translate-y-6">
                      {points.filter((_, i) => i % 5 === 0).map((p, i) => (
                        <span key={i} className="text-center w-8 -ml-4">{p.label}</span>
                      ))}
                    </div>
                  </div>
                );
              })()}
           </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReviewStatsPage;
