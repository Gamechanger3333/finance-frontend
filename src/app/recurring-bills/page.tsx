"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Plus, X, Loader2, Repeat, Trash2, CheckCircle2, Pause, Play, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

const FREQUENCIES = ["weekly", "monthly", "yearly"];

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  overdue: { label: "Overdue", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  due_soon: { label: "Due soon", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  upcoming: { label: "Upcoming", color: "text-foreground/60 bg-card border-border" },
  paused: { label: "Paused", color: "text-muted-foreground/80 bg-card/50 border-border" },
};

export default function RecurringBillsPage() {
  const qc = useQueryClient();
  const { data: bills = [], isLoading } = useQuery({ queryKey: ["recurring-bills"], queryFn: () => apiGet("/api/recurring-bills") });
  const { data: candidates = [], isLoading: loadingCandidates } = useQuery({
    queryKey: ["recurring-bills-detect"],
    queryFn: () => apiGet("/api/recurring-bills/detect"),
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => apiGet("/api/categories") });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["recurring-bills"] });
    qc.invalidateQueries({ queryKey: ["recurring-bills-detect"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const createBill = useMutation({ mutationFn: (data: any) => apiPost("/api/recurring-bills", data), onSuccess: invalidateAll });
  const updateBill = useMutation({ mutationFn: ({ id, data }: any) => apiPatch(`/api/recurring-bills/${id}`, data), onSuccess: invalidateAll });
  const deleteBill = useMutation({ mutationFn: (id: number) => apiDelete(`/api/recurring-bills/${id}`), onSuccess: invalidateAll });
  const markPaid = useMutation({
    mutationFn: (id: number) => apiPost(`/api/recurring-bills/${id}/mark-paid`, {}),
    onSuccess: () => {
      invalidateAll();
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", categoryId: "", frequency: "monthly", nextDueDate: new Date().toISOString().slice(0, 10) });
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBill.mutateAsync({
        name: form.name,
        amount: Number(form.amount),
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        frequency: form.frequency,
        nextDueDate: form.nextDueDate,
      });
      showToast("Bill added!");
      setForm({ name: "", amount: "", categoryId: "", frequency: "monthly", nextDueDate: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
    } catch (err: any) { showToast(err.message); }
  };

  const acceptCandidate = async (c: any) => {
    try {
      await createBill.mutateAsync({
        name: c.name,
        amount: c.amount,
        categoryId: c.categoryId ?? undefined,
        frequency: c.frequency,
        nextDueDate: c.nextDueDate,
        autoDetected: true,
      });
      showToast(`Now tracking "${c.name}"`);
    } catch (err: any) { showToast(err.message); }
  };

  const billsArr = bills as any[];
  const activeBills = billsArr.filter((b) => b.status !== "paused");
  const monthlyTotal = activeBills.reduce((s, b) => {
    if (b.frequency === "monthly") return s + b.amount;
    if (b.frequency === "weekly") return s + b.amount * 4.33;
    if (b.frequency === "yearly") return s + b.amount / 12;
    return s;
  }, 0);
  const dueSoonCount = billsArr.filter((b) => b.status === "due_soon" || b.status === "overdue").length;

  return (
    <ProtectedLayout>
      <div className="min-h-full">
        {toast && <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}

        <div>
          <div className="px-6 pt-8 pb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Recurring Bills</h1>
              <p className="text-foreground/60 text-sm mt-1">Track subscriptions and bills so nothing sneaks up on you</p>
            </div>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium mt-1 transition-colors">
              <Plus className="w-4 h-4" /> Add Bill
            </button>
          </div>
        </div>

        <div className="px-6 pb-8">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Est. Monthly Cost</p>
              <p className="text-xl font-bold text-foreground">{fmt(monthlyTotal)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Tracked Bills</p>
              <p className="text-xl font-bold text-emerald-400">{billsArr.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Due Soon / Overdue</p>
              <p className={cn("text-xl font-bold", dueSoonCount > 0 ? "text-red-400" : "text-foreground")}>{dueSoonCount}</p>
            </div>
          </div>

          {/* Auto-detected candidates */}
          {!loadingCandidates && (candidates as any[]).length > 0 && (
            <div className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h2 className="font-semibold text-foreground text-sm">Detected from your transactions</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {(candidates as any[]).map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-3 bg-card/70 border border-border rounded-lg px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{fmt(c.amount)} · {c.frequency} · seen {c.occurrences}x</p>
                    </div>
                    <button
                      onClick={() => acceptCandidate(c)}
                      disabled={createBill.isPending}
                      className="flex-shrink-0 text-xs bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      Track it
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-card/70 rounded-xl animate-pulse" />)}
            </div>
          ) : billsArr.length === 0 ? (
            <div className="bg-card/70 border border-border rounded-xl p-12 text-center">
              <Repeat className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No recurring bills tracked yet. Add one, or check the detected suggestions above.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {billsArr.map((b) => {
                const style = STATUS_STYLE[b.status] ?? STATUS_STYLE.upcoming;
                return (
                  <div key={b.id} className="bg-card border border-border rounded-xl p-5 group hover:border-emerald-500/20 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          {b.name}
                          {b.autoDetected && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                        </h3>
                        <span className="text-xs text-muted-foreground/80 capitalize">{b.frequency}{b.categoryName ? ` · ${b.categoryName}` : ""}</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => updateBill.mutate({ id: b.id, data: { isActive: !b.isActive } })} className="text-muted-foreground/80 hover:text-emerald-400 transition-colors" title={b.isActive ? "Pause" : "Resume"}>
                          {b.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button onClick={() => deleteBill.mutate(b.id)} className="text-muted-foreground/80 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-foreground">{fmt(b.amount)}</span>
                      <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border", style.color)}>{style.label}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {b.status === "overdue" && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                        Due {new Date(b.nextDueDate).toLocaleDateString()}
                        {b.status === "overdue"
                          ? ` (${Math.abs(b.daysUntilDue)}d overdue)`
                          : b.status !== "paused"
                          ? ` (in ${b.daysUntilDue}d)`
                          : ""}
                      </div>
                      {b.isActive && (
                        <button
                          onClick={() => markPaid.mutate(b.id)}
                          disabled={markPaid.isPending}
                          className="flex items-center gap-1.5 text-xs bg-accent hover:bg-emerald-500/15 text-foreground/60 hover:text-emerald-400 border border-border hover:border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark paid
                        </button>
                      )}
                    </div>
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
                <h2 className="font-bold text-foreground text-lg">Add Recurring Bill</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground/80 hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-foreground/70 text-sm mb-1.5 block">Bill Name</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Netflix" required
                    className="w-full h-10 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-foreground/70 text-sm mb-1.5 block">Amount ($)</label>
                    <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" required
                      className="w-full h-10 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-foreground/70 text-sm mb-1.5 block">Frequency</label>
                    <select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                      className="w-full h-10 rounded-lg bg-card border border-border text-foreground text-sm px-3 capitalize">
                      {FREQUENCIES.map((p) => <option key={p} value={p} className="bg-card capitalize">{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-foreground/70 text-sm mb-1.5 block">Next Due Date</label>
                    <input type="date" value={form.nextDueDate} onChange={(e) => setForm((f) => ({ ...f, nextDueDate: e.target.value }))} required
                      className="w-full h-10 rounded-lg bg-card border border-border text-foreground px-3 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-foreground/70 text-sm mb-1.5 block">Category (optional)</label>
                    <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                      className="w-full h-10 rounded-lg bg-card border border-border text-foreground text-sm px-3">
                      <option value="">None</option>
                      {(categories as any[]).filter((c: any) => c.type !== "income").map((c: any) => <option key={c.id} value={c.id} className="bg-card">{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={createBill.isPending}
                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center transition-colors mt-2">
                  {createBill.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</> : "Add Bill"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
