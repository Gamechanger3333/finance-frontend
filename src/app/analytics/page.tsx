"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { BarChart3, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function AnalyticsPage() {
  const { data: transactions = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => apiGet("/api/transactions") });

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  const txArr = transactions as any[];

  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthTx = txArr.filter((t) => t.date?.startsWith(monthStr));
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { label: MONTHS[d.getMonth()], income, expense, savings: income - expense };
  });

  const maxVal = Math.max(...monthlyData.flatMap((m) => [m.income, m.expense]), 1);

  const expenseTx = txArr.filter((t) => t.type === "expense");
  const catMap: Record<string, number> = {};
  expenseTx.forEach((t) => { const cat = t.categoryName || "Uncategorized"; catMap[cat] = (catMap[cat] || 0) + t.amount; });
  const catData = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const totalExpenses = catData.reduce((s, [, v]) => s + v, 0);

  const thisMonth = monthlyData[5];
  const lastMonth = monthlyData[4];
  const expenseChange = lastMonth.expense > 0 ? ((thisMonth.expense - lastMonth.expense) / lastMonth.expense) * 100 : 0;
  const incomeChange = lastMonth.income > 0 ? ((thisMonth.income - lastMonth.income) / lastMonth.income) * 100 : 0;
  const savingsRate = thisMonth.income > 0 ? ((thisMonth.income - thisMonth.expense) / thisMonth.income) * 100 : 0;

  return (
    <ProtectedLayout>
      <div className="min-h-full">
        <div>
          <div className="px-6 pt-8 pb-6">
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-foreground/60 text-sm mt-1">Deep insights into your financial patterns</p>
          </div>
        </div>

        <div className="px-6 pb-8 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "This Month Income", value: fmt(thisMonth.income), sub: `${incomeChange >= 0 ? "+" : ""}${incomeChange.toFixed(1)}% vs last month`, up: incomeChange >= 0 },
              { label: "This Month Expenses", value: fmt(thisMonth.expense), sub: `${expenseChange >= 0 ? "+" : ""}${expenseChange.toFixed(1)}% vs last month`, up: expenseChange < 0 },
              { label: "Net Savings", value: fmt(thisMonth.savings), sub: "This month", up: thisMonth.savings >= 0 },
              { label: "Savings Rate", value: `${savingsRate.toFixed(1)}%`, sub: "Of total income", up: savingsRate >= 20 },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2">{kpi.label}</p>
                <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                <p className={cn("text-xs mt-1 flex items-center gap-1", kpi.up ? "text-emerald-400" : "text-red-400")}>
                  {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.sub}
                </p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-card/70 border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h2 className="font-semibold text-foreground text-sm">Income vs Expenses (6 months)</h2>
              </div>
              <div className="flex items-end gap-3 h-48">
                {monthlyData.map((m) => (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end gap-0.5 h-40">
                      <div className="flex-1 rounded-t-sm bg-emerald-500/70 hover:bg-emerald-500 transition-colors"
                        style={{ height: `${(m.income / maxVal) * 100}%`, minHeight: m.income > 0 ? "2px" : "0" }} />
                      <div className="flex-1 rounded-t-sm bg-red-500/50 hover:bg-red-500/70 transition-colors"
                        style={{ height: `${(m.expense / maxVal) * 100}%`, minHeight: m.expense > 0 ? "2px" : "0" }} />
                    </div>
                    <span className="text-xs text-muted-foreground/80">{m.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm bg-emerald-500/70" />Income</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm bg-red-500/50" />Expenses</div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-card/70 border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <h2 className="font-semibold text-foreground text-sm">Spending by Category</h2>
              </div>
              {catData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground/80 text-sm">No expense data yet</div>
              ) : (
                <div className="space-y-2.5">
                  {catData.map(([cat, amount], idx) => {
                    const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="text-foreground/60 truncate max-w-[100px]">{cat}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                            <span className="text-foreground/60 font-medium">{fmt(amount)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-card/70 border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="font-semibold text-foreground text-sm">Savings Trend</h2>
            </div>
            <div className="flex items-end gap-3 h-32">
              {monthlyData.map((m) => {
                const maxS = Math.max(...monthlyData.map((x) => Math.abs(x.savings)), 1);
                const pct = (Math.abs(m.savings) / maxS) * 100;
                return (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex justify-center h-24 items-end">
                      <div className={cn("w-full rounded-t-md", m.savings >= 0 ? "bg-emerald-500/60 hover:bg-emerald-500" : "bg-red-500/60 hover:bg-red-500")}
                        style={{ height: `${pct}%`, minHeight: "2px" }} />
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground/80 block">{m.label}</span>
                      <span className={cn("text-[10px] font-medium", m.savings >= 0 ? "text-emerald-400" : "text-red-400")}>{fmt(m.savings)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
