"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Calendar,
  BookOpen,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Users,
  Award,
  Mail,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { headers } from "next/headers";
import Cookies from "js-cookie";

interface JourneyDetails {
  journey: {
    id: number;
    user_id: number;
    book_slug: string;
    pace: number;
    start_date: string;
    current_position: number;
    status: "active" | "paused" | "completed";
    completed_at?: string;
    username: string;
    email: string;
    completed_hadiths: number;
    book_name: string;
  };
  progress: any[];
  participants?: any[];
}

export default function BookJourneyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const journeyId = params.id as string;

  const [journey, setJourney] = useState<JourneyDetails | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchJourneyDetails = async () => {
      try {
        const [journeyResponse, participantsResponse] = await Promise.all([
          fetch(`https://api.hadith-shareef.com/api/book-journeys/admin/${journeyId}`, {
            headers: {
              "x-auth-token": Cookies.get("token") || "",
            },
          }),
          fetch(
            `https://api.hadith-shareef.com/api/book-journeys/admin/${journeyId}/participants`,
            {
              headers: {
                "x-auth-token": Cookies.get("token") || "",
              },
            }
          ),
        ]);

        if (!journeyResponse.ok || !participantsResponse.ok) {
          throw new Error("Failed to fetch journey details");
        }

        const journeyData = await journeyResponse.json();
        const participantsData = await participantsResponse.json();

        setJourney(journeyData);
        setParticipants(participantsData.participants || []);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل تفاصيل الختمة");
        console.error("Error fetching journey details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (journeyId) {
      fetchJourneyDetails();
    }
  }, [journeyId]);

  const handleStatusUpdate = async (
    newStatus: "active" | "paused" | "completed"
  ) => {
    if (!journey) return;

    setUpdatingStatus(true);
    try {
      const response = await fetch(
        `https://api.hadith-shareef.com/api/book-journeys/admin/${journeyId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // تحديث البيانات محلياً
      setJourney((prev) =>
        prev
          ? {
              ...prev,
              journey: {
                ...prev.journey,
                status: newStatus,
                completed_at:
                  newStatus === "completed"
                    ? new Date().toISOString()
                    : prev.journey.completed_at,
              },
            }
          : null
      );

      // إعادة تحميل البيانات
      window.location.reload();
    } catch (err) {
      console.error("Error updating journey status:", err);
      alert("حدث خطأ في تحديث الحالة");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            نشط
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            متوقف
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            <Award className="w-4 h-4 mr-1" />
            مكتمل
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !journey) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-red-600 dark:text-red-400">
            {error || "لم يتم العثور على الختمة"}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { journey: journeyData } = journey;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              العودة
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                تفاصيل الختمة #{journeyId}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {journeyData.book_name} - {journeyData.username}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(journeyData.status)}
          </div>
        </div>

        {/* Journey Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  الكتاب
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {journeyData.book_name}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 dark:bg-green-900/50 rounded-lg">
                <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  السرعة
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {journeyData.pace} حديث يومياً
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  التقدم
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {journeyData.completed_hadiths} حديث
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/50 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  تاريخ البدء
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(journeyData.start_date).toLocaleDateString("ar-SA")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Update Actions */}
        {journeyData.status !== "completed" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              تحديث الحالة
            </h3>
            <div className="flex items-center space-x-4">
              {journeyData.status === "active" ? (
                <button
                  onClick={() => handleStatusUpdate("paused")}
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  إيقاف مؤقت
                </button>
              ) : (
                <button
                  onClick={() => handleStatusUpdate("active")}
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  تفعيل
                </button>
              )}
              <button
                onClick={() => handleStatusUpdate("completed")}
                disabled={updatingStatus}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                إكمال
              </button>
            </div>
          </div>
        )}

        {/* User Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            معلومات المستخدم
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-gray-900 dark:text-white">
                {journeyData.username}
              </span>
            </div>
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-gray-900 dark:text-white">
                {journeyData.email}
              </span>
            </div>
          </div>
        </div>

        {/* Participants (if there are friends) */}
        {participants.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                المشاركون ({participants.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      المستخدم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      البريد الإلكتروني
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      التقدم
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {participants.map((participant) => (
                    <tr key={participant.user_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {participant.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {participant.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(participant.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {participant.completed_hadiths} حديث
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Progress Timeline */}
        {journey.progress && journey.progress.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              تاريخ التقدم
            </h3>
            <div className="space-y-3">
              {journey.progress.slice(0, 10).map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      تم قراءة الحديث #{item.hadith_id}
                    </p>
                    {item.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(item.read_at).toLocaleDateString("ar-SA")}
                  </div>
                </div>
              ))}
              {journey.progress.length > 10 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  و {journey.progress.length - 10} أحداث أخرى...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
