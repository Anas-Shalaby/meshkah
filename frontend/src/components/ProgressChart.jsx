import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BookOpen, CheckCircle } from "lucide-react";

const ProgressChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/memorization/progress/chart`,
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        }
      );
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch progress data:", error);
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {label}
          </p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalMemorized = data.reduce(
    (sum, item) => sum + Number(item.memorized),
    0
  );
  const totalReviewed = data.reduce(
    (sum, item) => sum + Number(item.reviewed),
    0
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              تقدم الحفظ
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              آخر 7 أيام
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#7440E9]"></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              محفوظ
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              مراجعة
            </span>
          </div>
        </div>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            barGap={8}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#374151"
              opacity={0.1}
            />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              tick={{ fill: "#6B7280", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              stroke="#6B7280"
              tick={{ fill: "#6B7280", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="memorized"
              fill="#7440E9"
              radius={[4, 4, 0, 0]}
              name="محفوظ"
            />
            <Bar
              dataKey="reviewed"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              name="مراجعة"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              إجمالي المحفوظ
            </p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {totalMemorized}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              إجمالي المراجعات
            </p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {totalReviewed}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;
