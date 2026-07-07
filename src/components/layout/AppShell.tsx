"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  Bot,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  TrendingUp,
  ChevronRight,
  Repeat,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Transactions", icon: ArrowLeftRight, href: "/transactions" },
  { label: "Recurring Bills", icon: Repeat, href: "/recurring-bills" },
  { label: "Budgets", icon: PieChart, href: "/budgets" },
  { label: "Goals", icon: Target, href: "/goals" },
  { label: "AI Assistant", icon: Bot, href: "/ai-assistant" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiGet("/api/notifications"),
  });

  const unread = ((notifications as any[]) ?? []).filter((n: any) => !n.isRead).length;
  const initials = user?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() ?? "??";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-[#0a0f0d] text-white overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col bg-[#0d1510] border-r border-white/5 transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">FinFlow</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150",
                    active
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon
                    className={cn("w-4 h-4 flex-shrink-0", active ? "text-emerald-400" : "")}
                  />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="w-3 h-3 opacity-60" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/40 truncate capitalize">
                {user?.userType?.replace("_", " ")}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/30 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center gap-4 px-6 border-b border-white/5 bg-[#0a0f0d]/80 backdrop-blur-sm flex-shrink-0">
          <button
            className="lg:hidden text-white/50 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <Link href="/settings">
            <div className="relative cursor-pointer">
              <Bell className="w-5 h-5 text-white/50 hover:text-white transition-colors" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
