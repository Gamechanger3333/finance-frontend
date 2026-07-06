"use client";

import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import {
  TrendingUp, TrendingDown, DollarSign, Target,
  ArrowUpRight, ArrowDownRight, Wallet, PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

const BG = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1400&q=80";

function StatCard({ label, value, change, icon: Icon, positive }: any) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-5 hover:border-emerald-500/20 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center">
          <Icon className="w-5 h-5 text-emerald-400" />
        </div>
        {change !== undefined && (
          <span className={cn("flex items-center gap-1 text-xs font-medium", positive ? "text-emerald-400" : "text-red-400")}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-white/40">{label}</p>
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
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0d]/60 to-[#0a0f0d]" />
          <div className="relative z-10 px-6 pt-8">
            <h1 className="text-2xl font-bold text-white">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
              {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Here&apos;s your financial overview for{" "}
              {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="px-6 pb-8 -mt-2">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Monthly Income" value={fmt(monthlyIncome)} icon={TrendingUp} positive={incomeChange >= 0} change={incomeChange} />
              <StatCard label="Monthly Expenses" value={fmt(monthlyExpenses)} icon={TrendingDown} positive={expenseChange <= 0} change={expenseChange} />
              <StatCard label="Net Savings" value={fmt(monthlyIncome - monthlyExpenses)} icon={DollarSign} positive={monthlyIncome - monthlyExpenses >= 0} />
              <StatCard label="Financial Health" value={`${user?.financialHealthScore ?? 0}/100`} icon={Target} positive={(user?.financialHealthScore ?? 0) >= 60} />
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent transactions */}
            <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <h2 className="font-semibold text-white">Recent Transactions</h2>
                <a href="/transactions" className="text-xs text-emerald-400 hover:text-emerald-300">View all →</a>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {isLoading
                  ? [...Array(5)].map((_, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.05] animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-white/[0.05] rounded animate-pulse w-1/2" />
                        <div className="h-2.5 bg-white/[0.03] rounded animate-pulse w-1/3" />
                      </div>
                      <div className="h-4 bg-white/[0.05] rounded animate-pulse w-16" />
                    </div>
                  ))
                  : (recentTx as any[]).slice(0, 8).map((t: any) => (
                    <div key={t.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                        t.type === "income" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                        {t.type === "income" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{t.description || t.categoryName || "Transaction"}</p>
                        <p className="text-xs text-white/30">{t.categoryName} · {new Date(t.date).toLocaleDateString()}</p>
                      </div>
                      <span className={cn("text-sm font-semibold", t.type === "income" ? "text-emerald-400" : "text-white/70")}>
                        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                      </span>
                    </div>
                  ))}
                {!isLoading && (recentTx as any[]).length === 0 && (
                  <div className="px-5 py-8 text-center text-white/30 text-sm">No transactions yet. Add your first one!</div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-white text-sm">Budget Overview</h3>
                </div>
                {isLoading ? (
                  <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-white/[0.03] rounded animate-pulse" />)}</div>
                ) : budgetSummary.slice(0, 4).map((b: any) => {
                  const budget = b.budget ?? b.amount ?? 0;
                  const spent = b.spent ?? 0;
                  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
                  return (
                    <div key={b.budgetId ?? b.id} className="mb-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-white/60 truncate">{b.name}</span>
                        <span className={cn("font-medium", pct > 90 ? "text-red-400" : pct > 70 ? "text-yellow-400" : "text-white/40")}>
                          {fmt(spent)} / {fmt(budget)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-emerald-500")}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {!isLoading && budgetSummary.length === 0 && <p className="text-xs text-white/30 text-center py-2">No budgets yet.</p>}
              </div>

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-white text-sm">Financial Goals</h3>
                </div>
                {isLoading ? (
                  <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-14 bg-white/[0.03] rounded animate-pulse" />)}</div>
                ) : goalsSummary.slice(0, 3).map((g: any) => {
                  const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
                  return (
                    <div key={g.id} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/60 truncate">{g.name}</span>
                        <span className="text-emerald-400 font-medium">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-white/30 mt-0.5">{fmt(g.currentAmount)} of {fmt(g.targetAmount)}</p>
                    </div>
                  );
                })}
                {!isLoading && goalsSummary.length === 0 && <p className="text-xs text-white/30 text-center py-2">No goals yet.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
