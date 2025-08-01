"use client";

import { useState } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

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
    label: "الإعدادات",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
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
            className="lg:hidden fixed inset-0 z-40"
          >
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed inset-y-0 right-0 w-64 bg-white dark:bg-gray-800 shadow-lg"
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div>
                    <p className="font-medium">Admin</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      مسؤول
                    </p>
                  </div>
                </div>
                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                        pathname === item.href
                          ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
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
                    className="flex items-center gap-3 px-4 py-2 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg"
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

      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 right-0 w-64 bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div>
                <p className="font-medium">Admin</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  مسؤول
                </p>
              </div>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                    pathname === item.href
                      ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
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
                className="flex items-center gap-3 px-4 py-2 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
                <span>تسجيل الخروج</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen ? "mr-64" : "mr-0"
          }`}
        >
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
