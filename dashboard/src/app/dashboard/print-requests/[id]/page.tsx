"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { dashboardService } from "@/services/api";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  FileText,
  Clock,
  User,
  Mail,
  Hash,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  MessageSquare,
} from "lucide-react";

interface PrintRequest {
  id: number;
  card_id: number;
  user_id: number;
  status: string;
  quantity: number;
  delivery_address: string;
  contact_phone: string;
  special_instructions: string;
  created_at: string;
  updated_at: string;
  requester_username: string;
  requester_email: string;
  card_title: string;
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

export default function PrintRequestDetailsPage() {
  const params = useParams();
  const [printRequest, setPrintRequest] = useState<PrintRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPrintRequest = async () => {
      try {
        const data = await dashboardService.getPrintRequest(
          params.id as string
        );
        setPrintRequest(data);
      } catch (err) {
        setError("حدث خطأ أثناء جلب بيانات الطلب");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrintRequest();
  }, [params.id]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await dashboardService.updatePrintRequestStatus(
        printRequest!.id,
        newStatus
      );
      setPrintRequest((prev) => ({
        ...prev!,
        status: newStatus,
      }));
    } catch (err) {
      setError("حدث خطأ أثناء تحديث حالة الطلب");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
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

  if (!printRequest) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-600 dark:text-gray-400">
            لم يتم العثور على الطلب
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const StatusIcon =
    statusConfig[printRequest.status as keyof typeof statusConfig].icon;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            تفاصيل طلب الطباعة
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            عرض كافة تفاصيل طلب الطباعة
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <StatusIcon
                  className={`w-6 h-6 ${
                    statusConfig[
                      printRequest.status as keyof typeof statusConfig
                    ].color
                  }`}
                />
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statusConfig[
                      printRequest.status as keyof typeof statusConfig
                    ].color
                  } ${
                    statusConfig[
                      printRequest.status as keyof typeof statusConfig
                    ].bgColor
                  }`}
                >
                  {
                    statusConfig[
                      printRequest.status as keyof typeof statusConfig
                    ].label
                  }
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(printRequest.created_at), "PPP", {
                  locale: ar,
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      عنوان البطاقة
                    </div>
                    <div className="font-medium">{printRequest.card_title}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Hash className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      الكمية
                    </div>
                    <div className="font-medium">
                      {printRequest.quantity} نسخة
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      اسم المستخدم
                    </div>
                    <div className="font-medium">
                      {printRequest.requester_username}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      البريد الإلكتروني
                    </div>
                    <div className="font-medium">
                      {printRequest.requester_email}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      عنوان التوصيل
                    </div>
                    <div className="font-medium">
                      {printRequest.delivery_address}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      رقم الهاتف
                    </div>
                    <div className="font-medium">
                      {printRequest.contact_phone}
                    </div>
                  </div>
                </div>

                {printRequest.special_instructions && (
                  <div className="flex items-start space-x-3 rtl:space-x-reverse">
                    <MessageSquare className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        تعليمات خاصة
                      </div>
                      <div className="font-medium">
                        {printRequest.special_instructions}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      آخر تحديث
                    </div>
                    <div className="font-medium">
                      {format(new Date(printRequest.updated_at), "PPP", {
                        locale: ar,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {printRequest.status === "pending" && (
              <div className="mt-8 flex space-x-4 rtl:space-x-reverse">
                <button
                  onClick={() => handleStatusUpdate("approved")}
                  className="btn btn-primary"
                >
                  <CheckCircle2 className="w-5 h-5 ml-2" />
                  الموافقة
                </button>
                <button
                  onClick={() => handleStatusUpdate("rejected")}
                  className="btn btn-secondary"
                >
                  <XCircle className="w-5 h-5 ml-2" />
                  رفض
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
