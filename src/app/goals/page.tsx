"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete, apiPut } from "@/lib/api";
import { Plus, X, Loader2, Target, Trash2, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

const BG = "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=1400&q=80";
const GOAL_TYPES = ["savings", "debt_payoff", "investment", "emergency_fund", "vacation", "purchase", "education", "other"];
const GOAL_EMOJIS: Record<string, string> = { savings: "💰", debt_payoff: "💳", investment: "📈", emergency_fund: "🛡️", vacation: "✈️", purchase: "🛒", education: "🎓", other: "🎯" };

export default function GoalsPage() {
  const qc = useQueryClient();
  const { data: goals = [], isLoading } = useQuery({ queryKey: ["goals"], queryFn: () => apiGet("/api/goals") });
  const createGoal = useMutation({ mutationFn: (data: any) => apiPost("/api/goals", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }) });
  const deleteGoal = useMutation({ mutationFn: (id: number) => apiDelete(`/api/goals/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }) });
  const updateGoal = useMutation({ mutationFn: ({ id, data }: any) => apiPut(`/api/goals/${id}`, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }) });

  const [showForm, setShowForm] = useState(false);
  const [addFundsId, setAddFundsId] = useState<number | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [form, setForm] = useState({ name: "", targetAmount: "", currentAmount: "0", type: "savings", targetDate: "", description: "" });
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGoal.mutateAsync({ name: form.name, targetAmount: Number(form.targetAmount), currentAmount: Number(form.currentAmount) || undefined, type: form.type, deadline: form.targetDate || new Date().toISOString().slice(0, 10), notes: form.description || undefined });
      showToast("Goal created!");
      setForm({ name: "", targetAmount: "", currentAmount: "0", type: "savings", targetDate: "", description: "" });
      setShowForm(false);
    } catch (err: any) { showToast(err.message); }
  };

  const handleAddFunds = async (goal: any) => {
    if (!addAmount || isNaN(Number(addAmount))) return;
    try {
      await updateGoal.mutateAsync({ id: goal.id, data: { currentAmount: Math.min(goal.targetAmount, goal.currentAmount + Number(addAmount)) } });
      showToast("Funds added!");
      setAddFundsId(null);
      setAddAmount("");
    } catch (err: any) { showToast(err.message); }
  };

  const totalTarget = (goals as any[]).reduce((s: number, g: any) => s + g.targetAmount, 0);
  const totalSaved = (goals as any[]).reduce((s: number, g: any) => s + g.currentAmount, 0);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <ProtectedLayout>
      <div className="min-h-full">
        {toast && <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}

        <div className="relative h-40 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0d]/70 to-[#0a0f0d]" />
          <div className="relative z-10 px-6 pt-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Financial Goals</h1>
              <p className="text-white/50 text-sm mt-1">Track your savings targets and milestones</p>
            </div>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium mt-1 transition-colors">
              <Plus className="w-4 h-4" /> New Goal
            </button>
          </div>
        </div>

        <div className="px-6 pb-8 -mt-2">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Total Target</p>
              <p className="text-lg font-bold text-white">{fmt(totalTarget)}</p>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Total Saved</p>
              <p className="text-lg font-bold text-emerald-400">{fmt(totalSaved)}</p>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Overall Progress</p>
              <p className="text-lg font-bold text-white">{overallPct.toFixed(0)}%</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-white/[0.03] rounded-xl animate-pulse" />)}
            </div>
          ) : (goals as any[]).length === 0 ? (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-12 text-center">
              <Target className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No goals yet. Create your first financial goal to start saving with purpose.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {(goals as any[]).map((g: any) => {
                const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
                const completed = pct >= 100;
                return (
                  <div key={g.id} className={cn("border rounded-xl p-5 group transition-all", completed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/[0.04] border-white/[0.06] hover:border-emerald-500/20")}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{GOAL_EMOJIS[g.type] || "🎯"}</span>
                        <div>
                          <h3 className="font-semibold text-white">{g.name}</h3>
                          <span className="text-xs text-white/30 capitalize">{g.type.replace("_", " ")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setAddFundsId(g.id); setAddAmount(""); }} className="text-white/30 hover:text-emerald-400 transition-colors">
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteGoal.mutate(g.id)} className="text-white/30 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-white/40">{fmt(g.currentAmount)} saved</span>
                        <span className={cn("font-semibold", completed ? "text-emerald-400" : "text-white/60")}>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-700", completed ? "bg-emerald-400" : "bg-emerald-500")} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-xs mt-1.5">
                        <span className="text-white/30">Target: {fmt(g.targetAmount)}</span>
                        {g.deadline && <span className="text-white/30">By {new Date(g.deadline).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    {completed ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-1.5">
                        🎉 Goal achieved! Congratulations!
                      </div>
                    ) : (
                      <p className="text-xs text-white/30">{fmt(g.targetAmount - g.currentAmount)} remaining to reach your goal</p>
                    )}
                    {addFundsId === g.id && (
                      <div className="mt-3 flex gap-2">
                        <input type="number" step="0.01" min="0" value={addAmount} onChange={(e) => setAddAmount(e.target.value)}
                          placeholder="Amount to add" className="flex-1 h-9 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 px-3 text-sm focus:outline-none" />
                        <button onClick={() => handleAddFunds(g)} disabled={updateGoal.isPending}
                          className="h-9 px-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-medium">Add</button>
                        <button onClick={() => setAddFundsId(null)} className="h-9 px-3 text-white/40 hover:text-white text-sm">Cancel</button>
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
            <div className="bg-[#0d1510] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-white text-lg">Create Financial Goal</h2>
                <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-white/70 text-sm mb-1.5 block">Goal Name</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Emergency Fund" required
                    className="w-full h-10 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 px-3 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-1.5 block">Goal Type</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full h-10 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm px-3">
                    {GOAL_TYPES.map((t) => <option key={t} value={t} className="bg-[#0d1510] capitalize">{GOAL_EMOJIS[t]} {t.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/70 text-sm mb-1.5 block">Target Amount ($)</label>
                    <input type="number" step="0.01" min="0" value={form.targetAmount} onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))} placeholder="0.00" required
                      className="w-full h-10 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 px-3 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-white/70 text-sm mb-1.5 block">Already Saved ($)</label>
                    <input type="number" step="0.01" min="0" value={form.currentAmount} onChange={(e) => setForm((f) => ({ ...f, currentAmount: e.target.value }))} placeholder="0.00"
                      className="w-full h-10 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 px-3 text-sm focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-1.5 block">Target Date (optional)</label>
                  <input type="date" value={form.targetDate} onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                    className="w-full h-10 rounded-lg bg-white/[0.04] border border-white/10 text-white px-3 text-sm focus:outline-none" />
                </div>
                <button type="submit" disabled={createGoal.isPending}
                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center transition-colors">
                  {createGoal.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Goal"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
