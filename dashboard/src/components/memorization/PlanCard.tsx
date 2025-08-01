"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Edit, Trash2, Users, BookOpen, Calendar, Delete } from "lucide-react";
import { dashboardService } from "@/services/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Archive, Copy } from "lucide-react";

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

interface PlanCardProps {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onDelete: (planId: number) => void;
  onRefresh: () => void;
}

export default function PlanCard({
  plan,
  onEdit,
  onDelete,
  onRefresh,
}: PlanCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: "active" | "archived") => {
    if (plan.status === newStatus) return;

    setLoading(true);
    try {
      await dashboardService.updatePlanStatus(plan.id, newStatus);
      onRefresh();
    } catch (error) {
      console.error("Failed to update plan status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await dashboardService.deleteMemorizationPlan(plan.id);
      onDelete(plan.id);
    } catch (error) {
      console.error("Failed to delete plan:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push(`/dashboard/memorization-plans/${plan.id}`)}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {plan.name}
          </h3>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              plan.status === "active"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {plan.status === "active" ? "نشطة" : "مؤرشفة"}
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {plan.description}
        </p>

        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Users className="w-4 h-4 ml-1" />
              {plan.user_count} مستخدم
            </div>
            <div className="text-gray-600 dark:text-gray-300">
              {plan.hadiths_per_day} حديث يومياً
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
        <div className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(plan);
            }}
            className="text-gray-600 dark:text-gray-300 hover:text-[#7440E9] dark:hover:text-[#7440E9]"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(
                plan.status === "active" ? "archived" : "active"
              );
            }}
            className="text-gray-600 dark:text-gray-300 hover:text-[#7440E9] dark:hover:text-[#7440E9]"
          >
            <Archive className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="text-gray-600 dark:text-gray-300 "
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
