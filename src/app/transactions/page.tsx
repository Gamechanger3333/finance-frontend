"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { Plus, Search, ArrowUpRight, ArrowDownRight, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

type TxForm = { type: "income" | "expense"; amount: string; description: string; categoryId: string; date: string; notes: string };
const EMPTY: TxForm = { type: "expense", amount: "", description: "", categoryId: "", date: new Date().toISOString().slice(0, 10), notes: "" };

export default function TransactionsPage() {
  const qc = useQueryClient();
  const { data: transactions = [], isLoading } = useQuery({ queryKey: ["transactions"], queryFn: () => apiGet("/api/transactions") });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => apiGet("/api/categories") });
  const createTx = useMutation({
    mutationFn: (data: any) => apiPost("/api/transactions", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["savings-rules"] });
      qc.invalidateQueries({ queryKey: ["savings-activity"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  const deleteTx = useMutation({ mutationFn: (id: number) => apiDelete(`/api/transactions/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }) });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TxForm>(EMPTY);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [toast, setToast] = useState("");

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const filtered = (transactions as any[]).filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (search && !(`${t.description} ${t.categoryName}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createTx.mutateAsync({ type: form.type, amount: Number(form.amount), description: form.description, categoryId: form.categoryId ? Number(form.categoryId) : 0, date: form.date, notes: form.notes || undefined });
      const applied = (result as any)?.savingsApplied as { ruleName: string; amount: number }[] | undefined;
      if (applied && applied.length > 0) {
        const total = applied.reduce((s, a) => s + a.amount, 0);
        showToast(`Transaction added! +${fmt(total)} auto-saved 🐷`);
      } else {
        showToast("Transaction added!");
      }
      setForm(EMPTY);
      setShowForm(false);
    } catch (err: any) { showToast(err.message); }
  };

  const totalIncome = (transactions as any[]).filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpense = (transactions as any[]).filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);

  return (
    <ProtectedLayout>
      <div className="min-h-full">
        {toast && <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}

        <div>
          <div className="px-6 pt-8 pb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
              <p className="text-foreground/60 text-sm mt-1">Manage and track all your transactions</p>
            </div>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium mt-1 transition-colors">
              <Plus className="w-4 h-4" /> Add Transaction
            </button>
          </div>
        </div>

        <div className="px-6 pb-8">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Income</p>
              <p className="text-lg font-bold text-emerald-400">{fmt(totalIncome)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
              <p className="text-lg font-bold text-red-400">{fmt(totalExpense)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Net Balance</p>
              <p className={cn("text-lg font-bold", totalIncome - totalExpense >= 0 ? "text-emerald-400" : "text-red-400")}>{fmt(totalIncome - totalExpense)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..."
                className="w-full pl-9 pr-3 h-9 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:border-emerald-500/40" />
            </div>
            <div className="flex gap-2">
              {(["all", "income", "expense"] as const).map((t) => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    filterType === t ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-card text-muted-foreground border border-border hover:text-foreground/60")}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card/70 border border-border rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border/70 text-xs text-muted-foreground/80 font-medium uppercase tracking-wider">
              <span>Type</span><span>Description</span><span>Category</span><span>Date</span><span>Amount</span>
            </div>
            {isLoading ? [...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/60">
                <div className="w-8 h-8 rounded-lg bg-accent animate-pulse" />
                <div className="flex-1 h-3 bg-accent rounded animate-pulse" />
                <div className="w-20 h-3 bg-accent rounded animate-pulse" />
              </div>
            )) : filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground/80 text-sm">
                {search || filterType !== "all" ? "No transactions match your filters." : "No transactions yet. Click 'Add Transaction' to get started."}
              </div>
            ) : filtered.map((t: any) => (
              <div key={t.id} className="grid md:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-3.5 border-b border-border/60 hover:bg-card/50 transition-colors group">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", t.type === "income" ? "bg-emerald-500/10" : "bg-red-500/10")}>
                  {t.type === "income" ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-red-400" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.description || "No description"}</p>
                  {t.notes && <p className="text-xs text-muted-foreground/80 truncate">{t.notes}</p>}
                </div>
                <span className="text-xs text-muted-foreground bg-card px-2 py-0.5 rounded-md">{t.categoryName || "—"}</span>
                <span className="text-xs text-muted-foreground/80">{new Date(t.date).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-semibold", t.type === "income" ? "text-emerald-400" : "text-foreground/80")}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </span>
                  <button onClick={() => deleteTx.mutate(t.id)} className="text-muted-foreground/60 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-foreground text-lg">Add Transaction</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground/80 hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div className="flex gap-2">
                  {(["expense", "income"] as const).map((type) => (
                    <button key={type} type="button" onClick={() => setForm((f) => ({ ...f, type }))}
                      className={cn("flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                        form.type === type
                          ? type === "income" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-red-500/20 border-red-500/40 text-red-400"
                          : "bg-card border-border text-muted-foreground hover:text-foreground/60")}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-foreground/70 text-sm mb-1.5 block">Amount ($)</label>
                  <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" required
                    className="w-full h-10 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-foreground/70 text-sm mb-1.5 block">Description</label>
                  <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What was this for?"
                    className="w-full h-10 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-foreground/70 text-sm mb-1.5 block">Category</label>
                    <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                      className="w-full h-10 rounded-lg bg-card border border-border text-foreground text-sm px-3 appearance-none">
                      <option value="">Select category</option>
                      {(categories as any[]).map((c: any) => <option key={c.id} value={c.id} className="bg-card">{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-foreground/70 text-sm mb-1.5 block">Date</label>
                    <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required
                      className="w-full h-10 rounded-lg bg-card border border-border text-foreground px-3 text-sm focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-foreground/70 text-sm mb-1.5 block">Notes (optional)</label>
                  <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Additional notes"
                    className="w-full h-10 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none" />
                </div>
                <button type="submit" disabled={createTx.isPending}
                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center transition-colors mt-2">
                  {createTx.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</> : "Add Transaction"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
