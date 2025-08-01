"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { dashboardService } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Users,
  Calendar,
  BookOpen,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import PlanUsersModal from "@/components/PlanUsersModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MemorizationPlan {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  hadiths_per_day: number;
  created_at: string;
  user_count: number;
  status: string;
  total_hadiths: number;
  memorized_hadiths: number;
  hadiths: Array<{
    id: number;
    title_ar: string;
    order_in_plan: number;
    plan_status: string;
  }>;
  users: Array<{
    id: number;
    name: string;
    email: string;
    start_date: string;
    end_date: string;
  }>;
}

export default function PlanDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<MemorizationPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        const data = await dashboardService.getMemorizationPlan(
          Number(params.id)
        );
        setPlan(data.data.plan);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل تفاصيل الخطة");
        console.error("Error fetching plan details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanDetails();
  }, [params.id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !plan) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-red-600 dark:text-red-400">
            {error || "الخطة غير موجودة"}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const progress = (plan.memorized_hadiths / plan.total_hadiths) * 100;
  const daysRemaining = Math.ceil(
    (new Date(plan.end_date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const daysElapsed = Math.ceil(
    (new Date().getTime() - new Date(plan.start_date).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const totalDays = Math.ceil(
    (new Date(plan.end_date).getTime() - new Date(plan.start_date).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 " style={{ direction: "rtl" }}>
        <div className="flex items-center  justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {plan.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                تم الإنشاء في{" "}
                {new Date(plan.created_at).toLocaleDateString("ar-SA")}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className={getStatusColor(plan.status)}>
              {plan.status === "active"
                ? "نشط"
                : plan.status === "completed"
                ? "مكتمل"
                : "قيد الانتظار"}
            </Badge>
            <Button
              onClick={() => setShowUsersModal(true)}
              className="bg-[#7440E9] hover:bg-[#5f33c0] text-white"
            >
              <Users className="w-5 h-5 ml-2" />
              إدارة المستخدمين
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="hadiths">الأحاديث</TabsTrigger>
            <TabsTrigger value="users">المستخدمين</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Plan Description */}
            <Card>
              <CardHeader>
                <CardTitle>وصف الخطة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  {plan.description}
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-[#7440E9]" />
                    <span>التقدم</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">
                        الأحاديث المحفوظة
                      </span>
                      <span className="font-semibold">
                        {plan.memorized_hadiths} / {plan.total_hadiths}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="text-center text-sm text-gray-500">
                      {progress.toFixed(1)}% مكتمل
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Goal Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-[#7440E9]" />
                    <span>الهدف اليومي</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-3xl font-bold text-[#7440E9]">
                      {plan.hadiths_per_day}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">
                      حديث يومياً
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarDays className="w-5 h-5 text-[#7440E9]" />
                    <span>الجدول الزمني</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-[#7440E9]" />
                        <div>
                          <div className="text-sm text-gray-500">
                            تاريخ البدء
                          </div>
                          <div className="font-semibold">
                            {new Date(plan.start_date).toLocaleDateString(
                              "ar-SA"
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-[#7440E9]" />
                        <div>
                          <div className="text-sm text-gray-500">
                            تاريخ الانتهاء
                          </div>
                          <div className="font-semibold">
                            {new Date(plan.end_date).toLocaleDateString(
                              "ar-SA"
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        الأيام المنقضية: {daysElapsed}
                      </span>
                      <span className="text-gray-500">
                        الأيام المتبقية: {daysRemaining}
                      </span>
                    </div>
                    <Progress
                      value={(daysElapsed / totalDays) * 100}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Statistics Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-[#7440E9]" />
                    <span>الإحصائيات</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-[#7440E9]" />
                        <span className="text-gray-600 dark:text-gray-300">
                          عدد المستخدمين
                        </span>
                      </div>
                      <span className="font-semibold">{plan.user_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 text-[#7440E9]" />
                        <span className="text-gray-600 dark:text-gray-300">
                          إجمالي الأحاديث
                        </span>
                      </div>
                      <span className="font-semibold">
                        {plan.total_hadiths}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-[#7440E9]" />
                        <span className="text-gray-600 dark:text-gray-300">
                          الأحاديث المحفوظة
                        </span>
                      </div>
                      <span className="font-semibold">
                        {plan.memorized_hadiths}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="hadiths">
            <Card>
              <CardHeader>
                <CardTitle>الأحاديث في الخطة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plan.hadiths.map((hadith) => (
                    <div
                      key={hadith.id}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">
                          حديث #{hadith.order_in_plan}
                        </span>
                      </div>
                      <p className="text-gray-600 text-right dark:text-gray-300">
                        {hadith.title_ar}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>المستخدمين في الخطة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plan.users.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            تاريخ البدء:{" "}
                            {new Date(user.start_date).toLocaleDateString(
                              "ar-SA"
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            تاريخ الانتهاء:{" "}
                            {new Date(user.end_date).toLocaleDateString(
                              "ar-SA"
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>معدل الحفظ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        المعدل اليومي
                      </span>
                      <span className="font-semibold">
                        {((plan.memorized_hadiths / daysElapsed) * 1).toFixed(
                          1
                        )}{" "}
                        حديث
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        المعدل المطلوب
                      </span>
                      <span className="font-semibold">
                        {plan.hadiths_per_day} حديث
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        نسبة الإنجاز
                      </span>
                      <span className="font-semibold">
                        {(
                          (plan.memorized_hadiths /
                            (plan.hadiths_per_day * daysElapsed)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>التوقعات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        الأحاديث المتوقعة
                      </span>
                      <span className="font-semibold">
                        {Math.round(plan.hadiths_per_day * daysElapsed)} حديث
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        الأحاديث المحققة
                      </span>
                      <span className="font-semibold">
                        {plan.memorized_hadiths} حديث
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        الفارق
                      </span>
                      <span className="font-semibold">
                        {Math.round(plan.hadiths_per_day * daysElapsed) -
                          plan.memorized_hadiths}{" "}
                        حديث
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showUsersModal && (
        <PlanUsersModal
          planId={plan.id}
          planName={plan.name}
          onClose={() => setShowUsersModal(false)}
        />
      )}
    </DashboardLayout>
  );
}
