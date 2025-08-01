import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, User } from "lucide-react";
import { dashboardService } from "@/services/api";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface PlanUsersModalProps {
  planId: number;
  planName: string;
  onClose: () => void;
}

interface PlanUser {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  progress: number;
  status: "active" | "completed" | "paused";
  points: number;
  level: number;
  username: string;
  email: string;
  user: {
    username: string;
    email: string;
  };
}

export default function PlanUsersModal({
  planId,
  planName,
  onClose,
}: PlanUsersModalProps) {
  const [users, setUsers] = useState<PlanUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlanUsers = async () => {
      try {
        const response = await dashboardService.getPlanUsers(planId);
        setUsers(response.data);

        if (response.data.length === 0) {
          toast({
            title: "لا يوجد مستخدمين",
            description: "لا يوجد مستخدمين مشتركين في هذه الخطة",
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Failed to fetch plan users:", error);
        setError("فشل في تحميل المستخدمين");
        toast({
          title: "خطأ",
          description: "فشل في تحميل المستخدمين",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlanUsers();
  }, [planId, toast]);

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 dark:text-green-400";
      case "completed":
        return "text-blue-600 dark:text-blue-400";
      case "paused":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "نشط";
      case "completed":
        return "مكتمل";
      case "paused":
        return "متوقف مؤقتاً";
      default:
        return status;
    }
  };
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-right">
              المستخدمين في خطة &ldquo;{planName}&rdquo;
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في المستخدمين..."
                className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#7440E9] focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7440E9]"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-4">{error}</div>
            ) : users.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                لا يوجد مستخدمين في هذه الخطة
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-right border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        المستخدم
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        الحالة
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        التقدم
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                              <User className="w-4 h-4 text-[#7440E9]" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              user.status
                            )}`}
                          >
                            {getStatusText(user.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-[#7440E9] h-2 rounded-full"
                              style={{ width: `${user.progress}%` }}
                            ></div>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {user.progress}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
