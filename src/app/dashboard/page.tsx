"use client";

import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, DollarSign, Target,
  ArrowUpRight, ArrowDownRight, Wallet, PieChart, Repeat, AlertTriangle, Activity, CreditCard, PiggyBank,
  ArrowLeftRight, ScanLine, Users, Landmark, FileText, Bot, BarChart3, Settings, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import Reveal from "@/components/ui/reveal";

const BG = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1400&q=80";

const FEATURES = [
  { label: "Transactions", desc: "Track every rupee in and out", icon: ArrowLeftRight, href: "/transactions" },
  { label: "Budgets", desc: "Set limits, stay on track", icon: PieChart, href: "/budgets" },
  { label: "Goals", desc: "Save toward what matters", icon: Target, href: "/goals" },
  { label: "Recurring Bills", desc: "Never miss a due date", icon: Repeat, href: "/recurring-bills" },
  { label: "Cash Flow Forecast", desc: "See what's coming next", icon: Activity, href: "/cashflow-forecast" },
  { label: "Debt Payoff", desc: "Plan your route to debt-free", icon: CreditCard, href: "/debts" },
  { label: "Auto-Save Rules", desc: "Save on autopilot", icon: PiggyBank, href: "/savings-rules" },
  { label: "Receipts", desc: "Scan and store receipts", icon: ScanLine, href: "/receipts" },
  { label: "Household", desc: "Split expenses with family", icon: Users, href: "/household" },
  { label: "Bank Sync", desc: "Connect your accounts", icon: Landmark, href: "/bank-sync" },
  { label: "Reports", desc: "Deep dive into your money", icon: FileText, href: "/reports" },
  { label: "AI Assistant", desc: "Ask your personal CFO", icon: Bot, href: "/ai-assistant" },
  { label: "Analytics", desc: "Spending trends at a glance", icon: BarChart3, href: "/analytics" },
  { label: "Settings", desc: "Tune your account & prefs", icon: Settings, href: "/settings" },
];

function StatCard({ label, value, change, icon: Icon, positive, className }: any) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-5 hover:border-emerald-500/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
          <Icon className="w-5 h-5 text-emerald-400" />
        </div>
        {change !== undefined && (
          <span className={cn("flex items-center gap-1 text-xs font-medium", positive ? "text-emerald-400" : "text-red-400")}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: dash, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiGet("/api/dashboard/summary"),
  });
  const { data: recentTx = [] } = useQuery({
    queryKey: ["dashboard-recent"],
    queryFn: () => apiGet("/api/dashboard/recent-transactions"),
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const budgetSummary = (dash as any)?.budgetSummary ?? [];
  const goalsSummary = (dash as any)?.goalsSummary ?? [];
  const totalBudget = budgetSummary.reduce((s: number, b: any) => s + (b.budget ?? b.amount ?? 0), 0);
  const totalSpent = budgetSummary.reduce((s: number, b: any) => s + (b.spent ?? 0), 0);
  const budgetPct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;
  const upcomingBills = (dash as any)?.upcomingBills ?? [];
  const cashflowGlance = (dash as any)?.cashflowGlance;
  const debtSummary = (dash as any)?.debtSummary;
  const savingsRulesSummary = (dash as any)?.savingsRulesSummary;
  const monthlyIncome = (dash as any)?.monthlyIncome ?? 0;
  const monthlyExpenses = (dash as any)?.monthlyExpenses ?? 0;
  const incomeChange = (dash as any)?.incomeChange ?? 0;
  const expenseChange = (dash as any)?.expenseChange ?? 0;

  return (
    <ProtectedLayout>
      <div className="min-h-full">
        <div className="relative h-48 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BG} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background" />
          <div className="relative z-10 px-6 pt-8">
            <h1 className="text-2xl font-bold text-foreground">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
              {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-foreground/60 text-sm mt-1">
              Here&apos;s your financial overview for{" "}
              {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="px-6 pb-8 -mt-2">
          {!isLoading && cashflowGlance?.overdraftDate && (
            <a href="/cashflow-forecast" className="mb-6 flex items-start gap-3 bg-red-500/[0.06] border border-red-500/20 rounded-xl p-4 hover:border-red-500/30 transition-colors">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Projected overdraft risk</p>
                <p className="text-xs text-foreground/60 mt-0.5">
                  Your balance may go negative around{" "}
                  {new Date(cashflowGlance.overdraftDate).toLocaleDateString(undefined, { month: "long", day: "numeric" })}. Tap to see the full forecast.
                </p>
              </div>
              <Activity className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
            </a>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-card/70 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Monthly Income" value={fmt(monthlyIncome)} icon={TrendingUp} positive={incomeChange >= 0} change={incomeChange} className="animate-fade-in-up stagger-1" />
              <StatCard label="Monthly Expenses" value={fmt(monthlyExpenses)} icon={TrendingDown} positive={expenseChange <= 0} change={expenseChange} className="animate-fade-in-up stagger-2" />
              <StatCard label="Net Savings" value={fmt(monthlyIncome - monthlyExpenses)} icon={DollarSign} positive={monthlyIncome - monthlyExpenses >= 0} className="animate-fade-in-up stagger-3" />
              <StatCard label="Financial Health" value={`${user?.financialHealthScore ?? 0}/100`} icon={Target} positive={(user?.financialHealthScore ?? 0) >= 60} className="animate-fade-in-up stagger-4" />
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent transactions */}
            <div className="lg:col-span-2 bg-card/70 border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Recent Transactions</h2>
                <a href="/transactions" className="text-xs text-emerald-400 hover:text-emerald-300">View all →</a>
              </div>
              <div className="divide-y divide-border">
                {isLoading
                  ? [...Array(5)].map((_, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-accent rounded animate-pulse w-1/2" />
                        <div className="h-2.5 bg-card/70 rounded animate-pulse w-1/3" />
                      </div>
                      <div className="h-4 bg-accent rounded animate-pulse w-16" />
                    </div>
                  ))
                  : (recentTx as any[]).slice(0, 8).map((t: any) => (
                    <div key={t.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-card/50 transition-colors">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                        t.type === "income" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                        {t.type === "income" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.description || t.categoryName || "Transaction"}</p>
                        <p className="text-xs text-muted-foreground/80">{t.categoryName} · {new Date(t.date).toLocaleDateString()}</p>
                      </div>
                      <span className={cn("text-sm font-semibold", t.type === "income" ? "text-emerald-400" : "text-foreground/70")}>
                        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                      </span>
                    </div>
                  ))}
                {!isLoading && (recentTx as any[]).length === 0 && (
                  <div className="px-5 py-8 text-center text-muted-foreground/80 text-sm">No transactions yet. Add your first one!</div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-card/70 border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-foreground text-sm">Budget Overview</h3>
                </div>
                {isLoading ? (
                  <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-card/70 rounded animate-pulse" />)}</div>
                ) : budgetSummary.slice(0, 4).map((b: any) => {
                  const budget = b.budget ?? b.amount ?? 0;
                  const spent = b.spent ?? 0;
                  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
                  return (
                    <div key={b.budgetId ?? b.id} className="mb-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-foreground/60 truncate">{b.name}</span>
                        <span className={cn("font-medium", pct > 90 ? "text-red-400" : pct > 70 ? "text-yellow-400" : "text-muted-foreground")}>
                          {fmt(spent)} / {fmt(budget)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-emerald-500")}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {!isLoading && budgetSummary.length === 0 && <p className="text-xs text-muted-foreground/80 text-center py-2">No budgets yet.</p>}
              </div>

              <div className="bg-card/70 border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-foreground text-sm">Financial Goals</h3>
                </div>
                {isLoading ? (
                  <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-14 bg-card/70 rounded animate-pulse" />)}</div>
                ) : goalsSummary.slice(0, 3).map((g: any) => {
                  const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
                  return (
                    <div key={g.id} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground/60 truncate">{g.name}</span>
                        <span className="text-emerald-400 font-medium">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground/80 mt-0.5">{fmt(g.currentAmount)} of {fmt(g.targetAmount)}</p>
                    </div>
                  );
                })}
                {!isLoading && goalsSummary.length === 0 && <p className="text-xs text-muted-foreground/80 text-center py-2">No goals yet.</p>}
              </div>

              <div className="bg-card/70 border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold text-foreground text-sm">Upcoming Bills</h3>
                  </div>
                  <a href="/recurring-bills" className="text-xs text-emerald-400 hover:text-emerald-300">Manage →</a>
                </div>
                {isLoading ? (
                  <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-card/70 rounded animate-pulse" />)}</div>
                ) : upcomingBills.length === 0 ? (
                  <p className="text-xs text-muted-foreground/80 text-center py-2">No bills tracked yet.</p>
                ) : (
                  upcomingBills.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground/70 truncate">{b.name}</p>
                        <p className={cn("text-xs flex items-center gap-1", b.daysUntilDue < 0 ? "text-red-400" : b.daysUntilDue <= 3 ? "text-yellow-400" : "text-muted-foreground/80")}>
                          {b.daysUntilDue < 0 && <AlertTriangle className="w-3 h-3" />}
                          {b.daysUntilDue < 0 ? `${Math.abs(b.daysUntilDue)}d overdue` : b.daysUntilDue === 0 ? "Due today" : `Due in ${b.daysUntilDue}d`}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-foreground/80 flex-shrink-0 ml-3">{fmt(b.amount)}</span>
                    </div>
                  ))
                )}
              </div>

              {debtSummary && debtSummary.debtCount > 0 && (
                <div className="bg-card/70 border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-semibold text-foreground text-sm">Debt Payoff</h3>
                    </div>
                    <a href="/debts" className="text-xs text-emerald-400 hover:text-emerald-300">Plan →</a>
                  </div>
                  <p className="text-xl font-bold text-foreground">{fmt(debtSummary.totalBalance)}</p>
                  <p className="text-xs text-muted-foreground/80 mt-0.5">across {debtSummary.debtCount} active debt{debtSummary.debtCount === 1 ? "" : "s"}</p>
                </div>
              )}

              {savingsRulesSummary && savingsRulesSummary.activeRuleCount > 0 && (
                <div className="bg-card/70 border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <PiggyBank className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-semibold text-foreground text-sm">Auto-Save</h3>
                    </div>
                    <a href="/savings-rules" className="text-xs text-emerald-400 hover:text-emerald-300">Manage →</a>
                  </div>
                  <p className="text-xl font-bold text-emerald-400">{fmt(savingsRulesSummary.totalSaved)}</p>
                  <p className="text-xs text-muted-foreground/80 mt-0.5">via {savingsRulesSummary.activeRuleCount} active rule{savingsRulesSummary.activeRuleCount === 1 ? "" : "s"}</p>
                </div>
              )}
            </div>
          </div>

          {/* Explore all features */}
          <Reveal className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Explore FinFlow</h2>
              <p className="text-xs text-muted-foreground">Everything you can do, all in one place</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {FEATURES.map((f, i) => (
                <Link
                  key={f.href}
                  href={f.href}
                  className={cn(
                    "group bg-card/70 border border-border rounded-xl p-4 flex items-start gap-3",
                    "hover:border-emerald-500/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5",
                    "transition-all duration-200 animate-fade-in-up"
                  )}
                  style={{ animationDelay: `${Math.min(i, 7) * 60}ms` }}
                >
                  <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/15 transition-colors">
                    <f.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{f.label}</p>
                    <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">{f.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 mt-1 group-hover:translate-x-0.5 group-hover:text-emerald-400 transition-all" />
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </ProtectedLayout>
  );
}
