"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  FolderOpen,
  Settings,
  Users,
  UserCheck,
  Shield,
  Bell,
  Mail,
  HelpCircle,
  BookOpen,
  MessageCircle,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  items?: SidebarItem[];
  href?: string;
  collapsible?: boolean;
};

type SidebarItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
};

interface CampSidebarProps {
  campId: string;
}

export function CampSidebar({ campId }: CampSidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "content",
    "participants",
    "communication",
  ]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isActive = (href: string) => {
    return pathname === href;
  };

  const sections: SidebarSection[] = [
    {
      id: "overview",
      title: "نظرة عامة",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: `/dashboard/quran-camps/${campId}`,
    },
    {
      id: "content",
      title: "إدارة المحتوى",
      icon: <FileText className="h-5 w-5" />,
      collapsible: true,
      items: [
        {
          title: "المهام اليومية",
          href: `/dashboard/quran-camps/${campId}/tasks`,
          icon: <FileText className="h-4 w-4" />,
          description: "إدارة المهام والتمارين",
        },
        {
          title: "الرسائل اليومية",
          href: `/dashboard/quran-camps/${campId}/messages`,
          icon: <MessageSquare className="h-4 w-4" />,
          description: "رسائل التحفيز",
        },
        {
          title: "الموارد",
          href: `/dashboard/quran-camps/${campId}/resources`,
          icon: <FolderOpen className="h-4 w-4" />,
          description: "ملفات ومواد المخيم",
        },
        {
          title: "الإعدادات",
          href: `/dashboard/quran-camps/${campId}/settings`,
          icon: <Settings className="h-4 w-4" />,
          description: "إعدادات المخيم",
        },
      ],
    },
    {
      id: "participants",
      title: "المشتركون والأفواج",
      icon: <Users className="h-5 w-5" />,
      collapsible: true,
      items: [
        {
          title: "الأفواج",
          href: `/dashboard/quran-camps/${campId}/cohorts`,
          icon: <UserCheck className="h-4 w-4" />,
          description: "إدارة الأفواج",
        },
        {
          title: "المشتركون",
          href: `/dashboard/quran-camps/${campId}/participants`,
          icon: <Users className="h-4 w-4" />,
          description: "قائمة المشتركين",
        },
        {
          title: "المشرفون",
          href: `/dashboard/quran-camps/${campId}/supervisors`,
          icon: <Shield className="h-4 w-4" />,
          description: "إدارة المشرفين",
        },
      ],
    },
    {
      id: "communication",
      title: "التواصل والتفاعل",
      icon: <Bell className="h-5 w-5" />,
      collapsible: true,
      items: [
        {
          title: "إرسال إشعارات",
          href: `/dashboard/quran-camps/${campId}/notifications`,
          icon: <Bell className="h-4 w-4" />,
          description: "مركز الإشعارات",
        },
        {
          title: "المشتركون في النشرة",
          href: `/dashboard/quran-camps/${campId}/email-subscribers`,
          icon: <Mail className="h-4 w-4" />,
          description: "قاعدة البريدية",
        },
        {
          title: "الأسئلة والأجوبة",
          href: `/dashboard/quran-camps/${campId}/qanda`,
          icon: <MessageCircle className="h-4 w-4" />,
          description: "Q&A المخيم",
        },
        {
          title: "قاعة الدراسة",
          href: `/dashboard/quran-camps/${campId}/study-hall`,
          icon: <BookOpen className="h-4 w-4" />,
          description: "Study Hall",
        },
        {
          title: "التفاعلات",
          href: `/dashboard/quran-camps/${campId}/interactions`,
          icon: <MessageSquare className="h-4 w-4" />,
          description: "تفاعلات المشتركين",
        },
        {
          title: "المساعدة",
          href: `/dashboard/quran-camps/${campId}/help`,
          icon: <HelpCircle className="h-4 w-4" />,
          description: "طلبات المساعدة",
        },
      ],
    },
    {
      id: "analytics",
      title: "التحليلات",
      icon: <BarChart3 className="h-5 w-5" />,
      href: `/dashboard/quran-camps/${campId}/analytics`,
    },
  ];

  return (
    <aside className="w-64 border-l border-slate-800 bg-slate-950 overflow-y-auto">
      <div className="p-4 space-y-1">
        {sections.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          const isSectionActive = section.href
            ? isActive(section.href)
            : section.items?.some((item) => isActive(item.href));

          if (!section.collapsible) {
            // Simple link without collapsible
            return (
              <Link
                key={section.id}
                href={section.href!}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(section.href!)
                    ? "bg-primary/20 text-primary-100"
                    : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                )}
              >
                {section.icon}
                <span>{section.title}</span>
              </Link>
            );
          }

          // Collapsible section
          return (
            <div key={section.id} className="space-y-1">
              <button
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isSectionActive
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                )}
              >
                <div className="flex items-center gap-3">
                  {section.icon}
                  <span>{section.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {isExpanded && section.items && (
                <div className="pr-2 space-y-0.5">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive(item.href)
                          ? "bg-primary/20 text-primary-100 font-medium"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      )}
                      title={item.description}
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
