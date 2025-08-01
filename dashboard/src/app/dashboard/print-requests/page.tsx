"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, AlertCircle, CheckCircle2, XCircle, Eye } from "lucide-react";
import { dashboardService } from "@/services/api";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";

interface PrintRequest {
  id: number;
  card_id: number;
  card_title: string;
  quantity: number;
  status: string;
  created_at: string;
  requester_username: string;
  requester_email: string;
  user: {
    username: string;
    email: string;
  };
}

const statusConfig = {
  pending: {
    label: "قيد الانتظار",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: AlertCircle,
  },
  approved: {
    label: "تمت الموافقة",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    icon: CheckCircle2,
  },
  rejected: {
    label: "مرفوض",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    icon: XCircle,
  },
};

export default function PrintRequestsPage() {
  const [requests, setRequests] = useState<PrintRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await dashboardService.getPrintRequests();
        setRequests(data);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل طلبات الطباعة");
        console.error("Error fetching print requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await dashboardService.updatePrintRequestStatus(id, newStatus);
      setRequests((prev) =>
        prev.map((request) =>
          request.id === id ? { ...request, status: newStatus } : request
        )
      );
    } catch (err) {
      setError("حدث خطأ أثناء تحديث حالة الطلب");
      console.error(err);
    }
  };

  console.log(requests);
  const filteredRequests = requests?.filter(
    (request) =>
      request.card_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-red-600 dark:text-red-400">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              طلبات الطباعة
            </h1>
            <div className="flex items-center">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        المعرف
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        البطاقة
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        الكمية
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        المستخدم
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        الحالة
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        تاريخ الطلب
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredRequests.map((request) => {
                      const StatusIcon =
                        statusConfig[
                          request.status as keyof typeof statusConfig
                        ].icon;
                      return (
                        <tr
                          key={request.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {request.id}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {request.card_title}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {request.quantity}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div>
                              <p className="text-gray-900 dark:text-white">
                                {request.requester_username}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <StatusIcon
                                className={`w-5 h-5 ${
                                  statusConfig[
                                    request.status as keyof typeof statusConfig
                                  ].color
                                }`}
                              />
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  statusConfig[
                                    request.status as keyof typeof statusConfig
                                  ].color
                                } ${
                                  statusConfig[
                                    request.status as keyof typeof statusConfig
                                  ].bgColor
                                }`}
                              >
                                {
                                  statusConfig[
                                    request.status as keyof typeof statusConfig
                                  ].label
                                }
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {format(new Date(request.created_at), "PPP", {
                              locale: ar,
                            })}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-4 rtl:space-x-reverse">
                              <Link
                                href={`/dashboard/print-requests/${request.id}`}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              >
                                <div className="flex items-center">
                                  <Eye className="w-5 h-5 ml-1" />
                                  <span>عرض التفاصيل</span>
                                </div>
                              </Link>
                              {request.status === "pending" && (
                                <>
                                  <button
                                    className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                                    onClick={() =>
                                      handleStatusUpdate(request.id, "approved")
                                    }
                                  >
                                    <div className="flex items-center">
                                      <CheckCircle2 className="w-5 h-5 ml-1" />
                                      <span>موافقة</span>
                                    </div>
                                  </button>
                                  <button
                                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                    onClick={() =>
                                      handleStatusUpdate(request.id, "rejected")
                                    }
                                  >
                                    <div className="flex items-center">
                                      <XCircle className="w-5 h-5 ml-1" />
                                      <span>رفض</span>
                                    </div>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
