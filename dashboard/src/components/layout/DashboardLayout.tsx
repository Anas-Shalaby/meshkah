"use client";

// @ts-nocheck

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Printer,
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen,
  Bell,
  GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const menuItems = [
  {
    label: "لوحة التحكم",
    icon: LayoutDashboard,
    href: "/dashboard",
  },

  {
    label: "إدارة المستخدمين",
    icon: Users,
    href: "/dashboard/users",
  },
  {
    label: "طلبات الطباعة",
    icon: Printer,
    href: "/dashboard/print-requests",
  },
  {
    label: "الخطط الحفظية",
    icon: BookOpen,
    href: "/dashboard/memorization-plans",
  },
  {
    label: "المخيمات القرآنية",
    icon: GraduationCap,
    href: "/dashboard/quran-camps",
  },
  {
    label: "الإشعارات",
    icon: Bell,
    href: "/dashboard/notifications",
  },
  {
    label: "الإعدادات",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Mobile Header */}
      <div className="lg:hidden border-b border-slate-800 bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <h1 className="text-xl font-semibold">لوحة التحكم</h1>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed inset-y-0 right-0 w-64 border-l border-slate-800 bg-slate-900 shadow-xl"
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-slate-800" />
                  <div>
                    <p className="font-medium">Admin</p>
                    <p className="text-sm text-slate-400">مسؤول</p>
                  </div>
                </div>
                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-2 transition ${
                        pathname === item.href
                          ? "bg-slate-800 text-white shadow-lg"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      /* TODO: Implement logout */
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-rose-300 transition hover:bg-rose-900/40"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>تسجيل الخروج</span>
                  </button>
                </nav>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Main Content */}
      <main className="lg:hidden pt-0">
        <div className="p-4 text-slate-100">{children}</div>
      </main>

      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 right-0 w-64 border-l border-slate-800 bg-slate-900 shadow-xl transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-full bg-slate-800" />
              <div>
                <p className="font-medium">Admin</p>
                <p className="text-sm text-slate-400">مسؤول</p>
              </div>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2 transition ${
                    pathname === item.href
                      ? "bg-slate-800 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
              <button
                onClick={() => {
                  /* TODO: Implement logout */
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-rose-300 transition hover:bg-rose-900/40"
              >
                <LogOut className="w-5 h-5" />
                <span>تسجيل الخروج</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 bg-slate-950 transition-all duration-300 ${
            isSidebarOpen ? "mr-64" : "mr-0"
          }`}
        >
          <div className="p-8 text-slate-100">{children}</div>
        </main>
      </div>
    </div>
  );
}
