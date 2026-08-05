"use client";

import { useRef, useState, useEffect } from "react";
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
  ChevronsLeft,
  ChevronsRight,
  Repeat,
  Activity,
  CreditCard,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  Info,
  CheckCheck,
  ScanLine,
  Users,
  FileText,
  Landmark,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api";
import ThemeToggle from "@/components/ui/theme-toggle";
import ScrollToTop from "@/components/ui/scroll-to-top";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Transactions", icon: ArrowLeftRight, href: "/transactions" },
  { label: "Recurring Bills", icon: Repeat, href: "/recurring-bills" },
  { label: "Cash Flow", icon: Activity, href: "/cashflow-forecast" },
  { label: "Debt Payoff", icon: CreditCard, href: "/debts" },
  { label: "Auto-Save", icon: PiggyBank, href: "/savings-rules" },
  { label: "Receipts", icon: ScanLine, href: "/receipts" },
  { label: "Household", icon: Users, href: "/household" },
  { label: "Bank Sync", icon: Landmark, href: "/bank-sync" },
  { label: "Reports", icon: FileText, href: "/reports" },
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
  const qc = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("finflow_sidebar_collapsed");
    if (saved === "true") setSidebarCollapsed(true);
  }, []);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      localStorage.setItem("finflow_sidebar_collapsed", String(!prev));
      return !prev;
    });
  };

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiGet("/api/notifications"),
    refetchInterval: 30000, // near-real-time without a socket connection
  });

  const markRead = useMutation({
    mutationFn: (id: number) => apiPatch(`/api/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAllRead = useMutation({
    mutationFn: () => apiPatch("/api/notifications/read-all", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifList = (notifications as any[]) ?? [];
  const unread = notifList.filter((n: any) => !n.isRead).length;
  const initials = user?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() ?? "??";

  const notifIcon = (type: string) => {
    if (type === "warning") return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    if (type === "success") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    return <Info className="w-4 h-4 text-blue-400" />;
  };

  const timeAgo = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
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
          "fixed lg:relative inset-y-0 left-0 z-30 flex flex-col bg-card border-r border-border transition-all duration-200",
          "w-64",
          sidebarCollapsed ? "lg:w-20" : "lg:w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Collapse/expand toggle — floats on the sidebar's edge so it's always reachable regardless of width */}
        <button
          className="hidden lg:flex absolute -right-3 top-[3.75rem] w-6 h-6 rounded-full bg-card border border-border items-center justify-center text-foreground/50 hover:text-foreground hover:border-emerald-500/40 transition-colors z-10"
          onClick={toggleSidebarCollapsed}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronsRight className="w-3.5 h-3.5" /> : <ChevronsLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Logo */}
        <div className={cn("flex items-center gap-3 h-16 border-b border-border", sidebarCollapsed ? "lg:px-0 lg:justify-center px-6" : "px-6")}>
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className={cn("text-lg font-bold text-foreground tracking-tight", sidebarCollapsed && "lg:hidden")}>FinFlow</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4 text-foreground/60" />
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
                title={sidebarCollapsed ? item.label : undefined}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150",
                    sidebarCollapsed && "lg:justify-center lg:px-0",
                    active
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : "text-foreground/60 hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon
                    className={cn("w-4 h-4 flex-shrink-0", active ? "text-emerald-400" : "")}
                  />
                  <span className={cn("flex-1", sidebarCollapsed && "lg:hidden")}>{item.label}</span>
                  {active && <ChevronRight className={cn("w-3 h-3 opacity-60", sidebarCollapsed && "lg:hidden")} />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border">
          <div className={cn("flex items-center gap-3 px-3 py-2 rounded-lg bg-accent", sidebarCollapsed && "lg:justify-center lg:px-0")}>
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className={cn("flex-1 min-w-0", sidebarCollapsed && "lg:hidden")}>
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {user?.userType?.replace("_", " ")}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className={cn("text-muted-foreground/80 hover:text-red-400 transition-colors", sidebarCollapsed && "lg:hidden")}
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          {sidebarCollapsed && (
            <button
              onClick={handleLogout}
              title="Log out"
              className="hidden lg:flex w-full justify-center mt-2 text-muted-foreground/80 hover:text-red-400 transition-colors py-1.5"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="relative z-50 h-16 flex items-center gap-4 px-6 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0">
          <button
            className="lg:hidden text-foreground/60 hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <ThemeToggle className="mr-1" />
          <div className="relative">
            <button onClick={() => setNotifOpen((o) => !o)} className="relative cursor-pointer">
              <Bell className="w-5 h-5 text-foreground/60 hover:text-foreground transition-colors" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-9 z-40 w-80 max-h-[28rem] overflow-hidden flex flex-col bg-card border border-border rounded-xl shadow-2xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                    <span className="text-sm font-semibold text-foreground">Notifications</span>
                    {unread > 0 && (
                      <button onClick={() => markAllRead.mutate()} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {notifList.length === 0 ? (
                      <div className="py-10 text-center text-muted-foreground/80 text-sm">You're all caught up.</div>
                    ) : (
                      notifList.slice(0, 15).map((n: any) => (
                        <button key={n.id} onClick={() => !n.isRead && markRead.mutate(n.id)}
                          className={cn("w-full text-left flex items-start gap-2.5 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-accent/60 transition-colors",
                            !n.isRead && "bg-emerald-500/[0.03]")}>
                          <div className="flex-shrink-0 mt-0.5">{notifIcon(n.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground leading-snug">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[11px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.isRead && <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />}
                        </button>
                      ))
                    )}
                  </div>
                  <Link href="/settings" onClick={() => setNotifOpen(false)}
                    className="block text-center text-xs text-muted-foreground hover:text-foreground py-2.5 border-t border-border flex-shrink-0">
                    View all in Settings
                  </Link>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto relative">
          <div key={pathname} className="animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>

      <ScrollToTop targetRef={mainRef} />

      {/* Floating AI Assistant badge — visible on every dashboard page, bottom-right, above the scroll button, with enough margin to never overlap card content */}
      <Link
        href="/ai-assistant"
        title="AI Assistant"
        className="fixed right-6 bottom-24 z-40 w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-colors"
      >
        <Bot className="w-5 h-5" />
      </Link>
    </div>
  );
}
