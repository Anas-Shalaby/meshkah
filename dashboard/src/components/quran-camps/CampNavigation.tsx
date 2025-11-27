"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  variant?: "default" | "primary" | "purple" | "blue" | "azure";
}

interface CampNavigationProps {
  campId: string;
  className?: string;
}

export function CampNavigation({ campId, className = "" }: CampNavigationProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: `/dashboard/quran-camps/${campId}`,
      label: "نظرة عامة",
      icon: LayoutDashboard,
      variant: "default",
    },
    {
      href: `/dashboard/quran-camps/${campId}/tasks`,
      label: "المهام اليومية",
      icon: CheckSquare,
      variant: "default",
    },
    {
      href: `/dashboard/quran-camps/${campId}/resources`,
      label: "الموارد",
      icon: BookOpen,
      variant: "default",
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
    {
      href: `/dashboard/quran-camps/${campId}/participants`,
      label: "المشتركين",
      icon: Users,
      variant: "default",
    },
    {
      href: `/dashboard/quran-camps/${campId}/analytics`,
      label: "التحليلات",
      icon: BarChart3,
      variant: "default",
    },
    {
      href: `/dashboard/quran-camps/${campId}/settings`,
      label: "الإعدادات",
      icon: Settings,
      variant: "default",
    },
    {
      href: `/dashboard/quran-camps/${campId}/study-hall`,
      label: "إدارة قاعة التدارس",
      icon: GraduationCap,
      variant: "purple",
    },
    {
      href: `/dashboard/quran-camps/${campId}/messages`,
      label: "الرسائل اليومية",
      icon: Mail,
      variant: "azure",
    },
  ];

  const isActive = (href: string) => {
    if (href === `/dashboard/quran-camps/${campId}`) {
      return pathname === href || pathname?.endsWith(`/quran-camps/${campId}`);
    }
    return pathname?.includes(href);
  };

  const getVariantClasses = (variant: string, active: boolean) => {
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
    <div className={`rounded-3xl border border-slate-800 bg-slate-900 shadow-lg ${className}`}>
      <nav className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 overflow-x-auto scrollbar-hide">
        {navItems.map((item) => {
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
              {item.badge && (
                <span className="ml-1 rounded-full bg-primary/30 px-1.5 py-0.5 text-xs font-semibold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

