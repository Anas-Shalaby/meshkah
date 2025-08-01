"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, Plus, Archive, Activity } from "lucide-react";
import { dashboardService } from "@/services/api";
import CreatePlanModal from "@/components/CreatePlanModal";
import PlanUsersModal from "@/components/PlanUsersModal";
import PlanCard from "@/components/memorization/PlanCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
}

export default function MemorizationPlansPage() {
  const [plans, setPlans] = useState<MemorizationPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("active");

  const fetchPlans = async () => {
    try {
      const data = await dashboardService.getMemorizationPlans();
      setPlans(data.data.plans);
    } catch (err) {
      setError("حدث خطأ أثناء تحميل خطط الحفظ");
      console.error("Error fetching plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDeletePlan = async (planId: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الخطة؟")) {
      try {
        await dashboardService.deleteMemorizationPlan(planId);
        setPlans(plans.filter((plan) => plan.id !== planId));
      } catch (err) {
        console.error("Error deleting plan:", err);
        alert("حدث خطأ أثناء حذف الخطة");
      }
    }
  };

  const filteredPlans = plans.filter(
    (plan) =>
      (plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (activeTab === "all" || plan.status === activeTab)
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            خطط الحفظ
          </h1>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#7440E9] hover:bg-[#5f33c0] text-white"
          >
            <Plus className="w-5 h-5 ml-2" />
            إنشاء خطة جديدة
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative w-64">
            <Input
              type="text"
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active" onClick={() => setActiveTab("active")}>
              <Activity className="w-4 h-4 ml-2" />
              النشطة
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              onClick={() => setActiveTab("archived")}
            >
              <Archive className="w-4 h-4 ml-2" />
              المؤرشفة
            </TabsTrigger>
            <TabsTrigger value="all" onClick={() => setActiveTab("all")}>
              الكل
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              style={{ direction: "rtl" }}
            >
              {filteredPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={(plan) => {
                    setSelectedPlan({ id: plan.id, name: plan.name });
                    setShowCreateModal(true);
                  }}
                  onDelete={handleDeletePlan}
                  onRefresh={fetchPlans}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showUsersModal && selectedPlan && (
        <PlanUsersModal
          planId={selectedPlan.id}
          planName={selectedPlan.name}
          onClose={() => setShowUsersModal(false)}
        />
      )}

      {showCreateModal && (
        <CreatePlanModal
          onClose={() => setShowCreateModal(false)}
          onPlanCreated={() => {
            setShowCreateModal(false);
            fetchPlans();
          }}
          editingPlan={
            selectedPlan
              ? plans.find((p) => p.id === selectedPlan.id) || null
              : null
          }
        />
      )}
    </DashboardLayout>
  );
}
