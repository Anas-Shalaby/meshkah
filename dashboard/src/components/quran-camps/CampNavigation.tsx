"use client";

// @ts-nocheck
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Users,
  BarChart3,
  Settings,
  GraduationCap,
  Mail,
  Shield,
} from "lucide-react";
import { CohortSelector } from "./CohortSelector";
import { dashboardService } from "@/services/api";

// @ts-ignore
export function CampNavigation(props) {
  const {
    campId,
    className = "",
    selectedCohortNumber,
    onSelectCohort,
  } = props;
  const pathname = usePathname();
  // @ts-ignore
  const [internalCohortNumber, setInternalCohortNumber] = useState(null);

  useEffect(() => {
    // If no cohort is selected, try to get the current cohort
    if (!selectedCohortNumber && !internalCohortNumber) {
      const loadCurrentCohort = async () => {
        try {
          const response = await dashboardService.getCampDetailsForAdmin(
            campId
          );
          if (response.success && response.data?.camp?.current_cohort_number) {
            setInternalCohortNumber(response.data.camp.current_cohort_number);
          }
        } catch (err) {
          console.error("Error loading current cohort:", err);
        }
      };
      loadCurrentCohort();
    }
  }, [campId, selectedCohortNumber, internalCohortNumber]);

  // @ts-ignore
  const currentCohortNumber = selectedCohortNumber ?? internalCohortNumber;

  // @ts-ignore
  const handleCohortChange = (cohortNumber) => {
    if (onSelectCohort) {
      onSelectCohort(cohortNumber);
    } else {
      // @ts-ignore
      setInternalCohortNumber(cohortNumber);
    }
  };

  // Navigation items organized by category
  // @ts-ignore
  const navGroups = [
    {
      name: "overview",
      items: [
        {
          href: `/dashboard/quran-camps/${campId}`,
          label: "نظرة عامة",
          icon: LayoutDashboard,
          variant: "default",
        },
        {
          href: `/dashboard/quran-camps/${campId}/analytics`,
          label: "التحليلات",
          icon: BarChart3,
          variant: "default",
        },
      ],
    },
    {
      name: "participants",
      items: [
        {
          href: `/dashboard/quran-camps/${campId}/cohorts`,
          label: "الأفواج",
          icon: GraduationCap,
          variant: "purple",
        },
        {
          href: `/dashboard/quran-camps/${campId}/participants`,
          label: "المشتركين",
          icon: Users,
          variant: "default",
        },
        {
          href: `/dashboard/quran-camps/${campId}/supervisors`,
          label: "المشرفون",
          icon: Shield,
          variant: "default",
        },
      ],
    },
    {
      name: "content",
      items: [
        {
          href: `/dashboard/quran-camps/${campId}/tasks`,
          label: "المهام اليومية",
          icon: CheckSquare,
          variant: "default",
        },
        {
          href: `/dashboard/quran-camps/${campId}/messages`,
          label: "الرسائل اليومية",
          icon: Mail,
          variant: "azure",
        },
        {
          href: `/dashboard/quran-camps/${campId}/resources`,
          label: "الموارد",
          icon: BookOpen,
          variant: "default",
        },
      ],
    },
    {
      name: "engagement",
      items: [
        {
          href: `/dashboard/quran-camps/${campId}/study-hall`,
          label: "قاعة التدارس",
          icon: GraduationCap,
          variant: "purple",
        },
        {
          href: `/dashboard/quran-camps/${campId}/qanda`,
          label: "الأسئلة والأجوبة",
          icon: MessageSquare,
          variant: "default",
        },
        {
          href: `/dashboard/quran-camps/${campId}/help`,
          label: "محتوى المساعدة",
          icon: HelpCircle,
          variant: "blue",
        },
      ],
    },
    {
      name: "settings",
      items: [
        {
          href: `/dashboard/quran-camps/${campId}/settings`,
          label: "الإعدادات",
          icon: Settings,
          variant: "default",
        },
      ],
    },
    {
      name: "daily-tests",
      items: [
        {
          href: `/dashboard/quran-camps/${campId}/daily-tests`,
          label: "الاختبارات اليومية",
          icon: BarChart3,
          variant: "default",
        },
      ],
    },
  ];

  // @ts-ignore
  const isActive = (href) => {
    if (href === `/dashboard/quran-camps/${campId}`) {
      return pathname === href || pathname?.endsWith(`/quran-camps/${campId}`);
    }
    return pathname?.includes(href);
  };

  // @ts-ignore
  const getVariantClasses = (variant, active) => {
    if (active) {
      switch (variant) {
        case "blue":
          return "border-blue-500/60 bg-blue-500/20 text-blue-100 shadow-lg shadow-blue-500/20";
        case "purple":
          return "border-purple-500/60 bg-purple-500/20 text-purple-100 shadow-lg shadow-purple-500/20";
        case "azure":
          return "border-cyan-500/60 bg-cyan-500/20 text-cyan-100 shadow-lg shadow-cyan-500/20";
        default:
          return "border-primary/60 bg-primary/20 text-primary-100 shadow-lg shadow-primary/20";
      }
    } else {
      switch (variant) {
        case "blue":
          return "border-blue-500/40 bg-blue-900/30 text-blue-100 hover:bg-blue-800";
        case "purple":
          return "border-purple-500/40 bg-purple-900/30 text-purple-100 hover:bg-purple-800";
        case "azure":
          return "border-cyan-500/40 bg-cyan-900/30 text-cyan-100 hover:bg-cyan-800";
        default:
          return "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600";
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Cohort Selector */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 shadow-lg p-4">
        <CohortSelector
          campId={campId}
          selectedCohortNumber={currentCohortNumber}
          onSelectCohort={handleCohortChange}
          compact={true}
          showLabel={true}
        />
      </div>

      {/* Navigation */}
      <div
        className={`rounded-3xl border border-slate-800 bg-slate-900 shadow-lg`}
      >
        <nav className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 overflow-x-auto scrollbar-hide">
          {navGroups.map((group, groupIndex) => (
            <div key={group.name} className="flex items-center gap-2 sm:gap-3">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full border px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                      active
                        ? getVariantClasses(item.variant || "default", true)
                        : getVariantClasses(item.variant || "default", false)
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                    {/* @ts-ignore */}
                    {item.badge && (
                      <span className="ml-1 rounded-full bg-primary/30 px-1.5 py-0.5 text-xs font-semibold">
                        {/* @ts-ignore */}
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Separator between groups */}
              {groupIndex < navGroups.length - 1 && (
                <div className="h-6 w-px bg-slate-700 mx-1 flex-shrink-0" />
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
