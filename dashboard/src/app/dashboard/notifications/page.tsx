"use client";

import { useState, useEffect } from "react";
import { Bell, Send, Users, Target, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { notificationService } from "@/services/api";

type Topic = {
  id: string;
  name: string;
};

type NotificationForm = {
  title: string;
  body: string;
  topic: string;
};

export default function NotificationsPage() {
  const [formData, setFormData] = useState<NotificationForm>({
    title: "",
    body: "",
    topic: "update",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const data = await notificationService.getTopics();
      if (data.success) {
        setTopics(data.data);
      }
    } catch (err) {
      console.error("Error fetching topics:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    console.log(formData);
    try {
      const payload = {
        title: formData.title,
        body: formData.body,
        type: formData.topic,
        target: formData.topic,
        data: {
          timestamp: new Date().toISOString(),
          source: "admin_panel",
        },
      };

      const result = await notificationService.sendNotification(payload);

      if (result.success) {
        setSuccess("تم إرسال الإشعار بنجاح!");
        setFormData({
          title: "",
          body: "",
          topic: "update",
        });
      } else {
        setError(result.message || "حدث خطأ أثناء إرسال الإشعار");
      }
    } catch (err) {
      setError("حدث خطأ في الشبكة");
      console.error("Error sending notification:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                إدارة الإشعارات
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                أرسل إشعارات للمستخدمين عبر FCM
              </p>
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {success}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              إرسال إشعار جديد
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              املأ البيانات التالية لإرسال الإشعار
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Topic Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الفئة المستهدفة
              </label>
              <select
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                عنوان الإشعار *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="أدخل عنوان الإشعار"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                محتوى الإشعار *
              </label>
              <textarea
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                placeholder="أدخل محتوى الإشعار"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !formData.title || !formData.body}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري الإرسال...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>إرسال الإشعار</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information Panel */}
        <div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            كيفية عمل الإشعارات
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>
              • <strong>جميع المستخدمين:</strong> يرسل الإشعار لجميع المستخدمين
              الذين قاموا بتفعيل الإشعارات في التطبيق
            </p>
            <p>
              • <strong>المستخدمين المميزين:</strong> يرسل الإشعار للمستخدمين
              المميزين فقط
            </p>
            <p>
              • <strong>الميزات الجديدة:</strong> إشعارات عن الميزات والتحديثات
              الجديدة
            </p>
            <p>
              • <strong>الصيانة:</strong> إشعارات تقنية وصيانة النظام
            </p>
            <p>
              • <strong>العروض الترويجية:</strong> إشعارات العروض والخصومات
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
