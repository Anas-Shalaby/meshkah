"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import PlanCard from "@/components/memorization/PlanCard";
import PlanAnalytics from "@/components/memorization/PlanAnalytics";
import CreatePlanModal from "@/components/CreatePlanModal";
import { dashboardService } from "@/services/api";
import { useRouter } from "next/navigation";

interface Plan {
  id: number;
  name: string;
  description: string;
  hadiths_per_day: number;
  status: string;
  total_hadiths: number;
  memorized_hadiths: number;
  user_count: number;
  created_at: string;
}

interface MemorizationPlansClientProps {
  initialPlans: Plan[];
}

export default function MemorizationPlansClient({
  initialPlans,
}: MemorizationPlansClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const router = useRouter();

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setShowCreateModal(true);
  };

  const handleDelete = async (planId: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الخطة؟")) {
      try {
        await dashboardService.deleteMemorizationPlan(planId);
        setPlans(plans.filter((plan) => plan.id !== planId));
        router.refresh();
      } catch (error) {
        console.error("Failed to delete plan:", error);
        router.refresh();
      }
    }
  };

  const handlePlanCreated = () => {
    setShowCreateModal(false);
    setEditingPlan(null);
    router.refresh();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          خطط الحفظ
        </h1>
        <button
          onClick={() => {
            setEditingPlan(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#7440E9] text-white rounded-lg hover:bg-[#5f33c0] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>إنشاء خطة جديدة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="space-y-4">
            <PlanCard
              plan={plan}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRefresh={() => router.refresh()}
            />
            {selectedPlanId === plan.id && <PlanAnalytics planId={plan.id} />}
            <button
              onClick={() =>
                setSelectedPlanId(selectedPlanId === plan.id ? null : plan.id)
              }
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {selectedPlanId === plan.id
                ? "إخفاء الإحصائيات"
                : "عرض الإحصائيات"}
            </button>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <CreatePlanModal
          onClose={() => {
            setShowCreateModal(false);
            setEditingPlan(null);
          }}
          onPlanCreated={handlePlanCreated}
          editingPlan={editingPlan}
        />
      )}
    </div>
  );
}
