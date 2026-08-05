"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { Plus, X, Loader2, Wallet, Trash2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

const PERIODS = ["daily", "weekly", "monthly", "yearly"];

export default function BudgetsPage() {
  const qc = useQueryClient();
  const { data: budgets = [], isLoading } = useQuery({ queryKey: ["budgets"], queryFn: () => apiGet("/api/budgets") });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => apiGet("/api/categories") });
  const createBudget = useMutation({ mutationFn: (data: any) => apiPost("/api/budgets", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }) });
  const deleteBudget = useMutation({ mutationFn: (id: number) => apiDelete(`/api/budgets/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }) });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", period: "monthly", categoryId: "", startDate: new Date().toISOString().slice(0, 10) });
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBudget.mutateAsync({ name: form.name, amount: Number(form.amount), period: form.period, categoryId: form.categoryId ? Number(form.categoryId) : 0 });
      showToast("Budget created!");
      setForm({ name: "", amount: "", period: "monthly", categoryId: "", startDate: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
    } catch (err: any) { showToast(err.message); }
  };

  const totalBudget = (budgets as any[]).reduce((s: number, b: any) => s + b.amount, 0);

  return (
    <ProtectedLayout>
      <div className="min-h-full">
        {toast && <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}

        <div>
          <div className="px-6 pt-8 pb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Budgets</h1>
              <p className="text-foreground/60 text-sm mt-1">Set spending limits and track your budget</p>
            </div>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium mt-1 transition-colors">
              <Plus className="w-4 h-4" /> New Budget
            </button>
          </div>
        </div>

        <div className="px-6 pb-8">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Budgeted</p>
              <p className="text-xl font-bold text-foreground">{fmt(totalBudget)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Active Budgets</p>
              <p className="text-xl font-bold text-emerald-400">{(budgets as any[]).length}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-card/70 rounded-xl animate-pulse" />)}
            </div>
          ) : (budgets as any[]).length === 0 ? (
            <div className="bg-card/70 border border-border rounded-xl p-12 text-center">
              <Wallet className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No budgets yet. Create your first budget to start tracking spending.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(budgets as any[]).map((b: any) => {
                const spent = b.spent ?? 0;
                const pct = b.amount > 0 ? Math.min(100, (spent / b.amount) * 100) : 0;
                const remaining = b.amount - spent;
                return (
                  <div key={b.id} className="bg-card border border-border rounded-xl p-5 group hover:border-emerald-500/20 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{b.name}</h3>
                        <span className="text-xs text-muted-foreground/80 capitalize">{b.period}</span>
                      </div>
                      <button onClick={() => deleteBudget.mutate(b.id)} className="text-muted-foreground/60 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-muted-foreground">Spent</span>
                        <span className={cn("font-medium", pct > 90 ? "text-red-400" : pct > 70 ? "text-yellow-400" : "text-foreground/60")}>
                          {fmt(spent)} / {fmt(b.amount)}
                        </span>
                      </div>
                      <div className="h-2 bg-accent rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-500", pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-emerald-500")}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground/80">Remaining</p>
                        <p className={cn("text-base font-bold", remaining >= 0 ? "text-emerald-400" : "text-red-400")}>{fmt(Math.abs(remaining))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground/80">Used</p>
                        <p className={cn("text-base font-bold", pct > 90 ? "text-red-400" : "text-foreground/70")}>{pct.toFixed(0)}%</p>
                      </div>
                    </div>
                    {pct > 100 && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-1.5">
                        <TrendingUp className="w-3 h-3" /> Over budget by {fmt(Math.abs(remaining))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-foreground text-lg">Create Budget</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground/80 hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-foreground/70 text-sm mb-1.5 block">Budget Name</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Groceries" required
                    className="w-full h-10 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-foreground/70 text-sm mb-1.5 block">Amount ($)</label>
                    <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" required
                      className="w-full h-10 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-foreground/70 text-sm mb-1.5 block">Period</label>
                    <select value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                      className="w-full h-10 rounded-lg bg-card border border-border text-foreground text-sm px-3 capitalize">
                      {PERIODS.map((p) => <option key={p} value={p} className="bg-card capitalize">{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-foreground/70 text-sm mb-1.5 block">Category (optional)</label>
                  <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                    className="w-full h-10 rounded-lg bg-card border border-border text-foreground text-sm px-3">
                    <option value="">All categories</option>
                    {(categories as any[]).map((c: any) => <option key={c.id} value={c.id} className="bg-card">{c.name}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={createBudget.isPending}
                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center transition-colors">
                  {createBudget.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Budget"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
