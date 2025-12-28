"use client";

// @ts-nocheck
import { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { dashboardService } from "@/services/api";
import { ChipPill } from "@/components/ui/chip-pill";

export function CohortSelector({
  campId,
  selectedCohortNumber,
  onSelectCohort,
  className = "",
  showLabel = true,
  compact = false,
}: any) {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchCohorts = async () => {
      if (!campId) return;
      try {
        setLoading(true);
        const response = await dashboardService.getCampCohorts(campId);
        if (response.success) {
          const cohortsData = response.data || [];
          setCohorts(cohortsData);

          // Auto-select current cohort if not selected
          if (!selectedCohortNumber && cohortsData.length > 0) {
            const activeCohort =
              cohortsData.find(
                (c: any) => c.is_open === 1 || c.status === "active"
              ) || cohortsData[0];
            if (activeCohort) {
              onSelectCohort(activeCohort.cohort_number);
            }
          }
        } else {
          setError(response.message || "حدث خطأ في جلب الأفواج");
        }
      } catch (err: any) {
        console.error("Error fetching cohorts:", err);
        setError("حدث خطأ في الاتصال");
      } finally {
        setLoading(false);
      }
    };

    fetchCohorts();
  }, [campId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "غير محدد";
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (cohort: any) => {
    if (cohort.is_open === 1) {
      return (
        <ChipPill variant="success" className="text-xs">
          مفتوح
        </ChipPill>
      );
    }
    if (cohort.status === "active") {
      return (
        <ChipPill variant="success" className="text-xs">
          نشط
        </ChipPill>
      );
    }
    if (cohort.status === "early_registration") {
      return (
        <ChipPill variant="warning" className="text-xs">
          التسجيل المبكر
        </ChipPill>
      );
    }
    if (cohort.status === "completed") {
      return (
        <ChipPill variant="default" className="text-xs">
          مكتمل
        </ChipPill>
      );
    }
    if (cohort.status === "cancelled") {
      return (
        <ChipPill variant="warning" className="text-xs">
          ملغي
        </ChipPill>
      );
    }
    return (
      <ChipPill variant="default" className="text-xs">
        {cohort.status_ar || "مجدول"}
      </ChipPill>
    );
  };

  const selectedCohort = cohorts.find(
    (c: any) => c.cohort_number === selectedCohortNumber
  );

  if (loading) {
    return (
      <div
        className={`rounded-xl border border-slate-800 bg-slate-900 p-4 ${className}`}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-slate-700 rounded w-1/3"></div>
          <div className="h-10 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-xl border border-red-500/30 bg-red-900/20 p-4 ${className}`}
      >
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (cohorts.length === 0) {
    return (
      <div
        className={`rounded-xl border border-slate-800 bg-slate-900 p-4 ${className}`}
      >
        <p className="text-slate-400 text-center text-sm">
          لا توجد أفواج متاحة
        </p>
      </div>
    );
  }

  // Compact mode - dropdown
  if (compact) {
    return (
      <div className={`relative ${className}`}>
        {showLabel && (
          <label className="block text-sm font-medium text-slate-300 mb-2">
            الفوج
          </label>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="font-medium">
              {selectedCohort
                ? `الفوج ${selectedCohort.cohort_number}${
                    selectedCohort.name ? ` - ${selectedCohort.name}` : ""
                  }`
                : "اختر الفوج"}
            </span>
            {selectedCohort && getStatusBadge(selectedCohort)}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div
              style={{ zIndex: "10000" }}
              className="absolute top-full mt-2 left-0 right-0 z-20 rounded-xl border border-slate-700 bg-slate-900 shadow-xl max-h-96 overflow-y-auto"
            >
              {cohorts.map((cohort: any) => {
                const isSelected =
                  selectedCohortNumber === cohort.cohort_number;
                return (
                  <button
                    key={cohort.cohort_number}
                    onClick={() => {
                      onSelectCohort(cohort.cohort_number);
                      setIsOpen(false);
                    }}
                    className={`w-full text-right px-4 py-3 border-b border-slate-800 last:border-b-0 transition-all ${
                      isSelected
                        ? "bg-purple-500/20 border-purple-500/30"
                        : "hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-200">
                            الفوج {cohort.cohort_number}
                            {cohort.name && (
                              <span className="text-slate-400 font-normal mr-2">
                                - {cohort.name}
                              </span>
                            )}
                          </span>
                          {getStatusBadge(cohort)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(cohort.start_date)}
                          </span>
                          {cohort.participants_count !== undefined && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {cohort.participants_count}
                              {cohort.max_participants &&
                                ` / ${cohort.max_participants}`}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Full mode - cards
  return (
    <div className={`space-y-4 ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-slate-200">اختر الفوج</h3>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cohorts.map((cohort: any) => {
          const isSelected = selectedCohortNumber === cohort.cohort_number;

          return (
            <button
              key={cohort.cohort_number}
              onClick={() => onSelectCohort(cohort.cohort_number)}
              className={`rounded-xl border-2 p-4 text-right transition-all ${
                isSelected
                  ? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20"
                  : "border-slate-700 bg-slate-900 hover:border-slate-600 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-semibold text-slate-200">
                      الفوج {cohort.cohort_number}
                      {cohort.name && (
                        <span className="text-slate-400 font-normal mr-2">
                          - {cohort.name}
                        </span>
                      )}
                    </h4>
                    {getStatusBadge(cohort)}
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                )}
              </div>

              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>
                    <span className="font-medium text-slate-300">
                      تاريخ البدء:
                    </span>{" "}
                    {formatDate(cohort.start_date)}
                  </span>
                </div>
                {cohort.end_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>
                      <span className="font-medium text-slate-300">
                        تاريخ الانتهاء:
                      </span>{" "}
                      {formatDate(cohort.end_date)}
                    </span>
                  </div>
                )}
                {cohort.participants_count !== undefined && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>
                      <span className="font-medium text-slate-300">
                        المشتركين:
                      </span>{" "}
                      {cohort.participants_count}
                      {cohort.max_participants &&
                        ` / ${cohort.max_participants}`}
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedCohortNumber && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300">
            تم اختيار الفوج {selectedCohortNumber}
            {selectedCohort?.name && ` - ${selectedCohort.name}`}
          </p>
        </div>
      )}
    </div>
  );
}
