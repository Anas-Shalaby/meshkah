"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Book,
  Printer,
  Palette,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
  BookOpen,
  Library,
} from "lucide-react";

interface MenuItem {
  title: string;
  icon: LucideIcon;
  path: string;
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    {
      title: "لوحة التحكم",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      title: "المستخدمين",
      icon: Users,
      path: "/dashboard/users",
    },
    {
      title: "خطط الحفظ",
      icon: Book,
      path: "/dashboard/memorization",
    },
    {
      title: "ختمات الكتب",
      icon: BookOpen,
      path: "/dashboard/book-journeys",
    },
    {
      title: "المخيمات",
      icon: Library,
      path: "/dashboard/camps",
    },
    {
      title: "طلبات الطباعة",
      icon: Printer,
      path: "/dashboard/print-requests",
    },
    {
      title: "الثيم الرمضاني",
      icon: Palette,
      path: "/dashboard/theme",
    },
  ];

  return (
    <div
      className={`bg-white dark:bg-gray-800 h-screen border-l border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 flex items-center justify-between">
          {!collapsed && (
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              مشكاة
            </h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.path
                    ? "bg-[#7440E9] text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <IconComponent className="w-5 h-5" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
