"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import {
  Plus, X, Loader2, Trash2, PiggyBank, Coins, Percent, CalendarClock, Pause, Play, Sparkles, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

const BG = "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=1400&q=80";

const RULE_TYPES = [
  { value: "round_up", label: "Round-Up Savings", icon: Coins, desc: "Round every purchase up to the nearest amount and save the difference." },
  { value: "percent_of_income", label: "% of Income", icon: Percent, desc: "Automatically save a percentage of every paycheck." },
  { value: "fixed_recurring", label: "Fixed Recurring", icon: CalendarClock, desc: "Move a fixed amount into savings on a schedule, like a bill to yourself." },
];
const FREQUENCIES = ["weekly", "monthly"];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function ruleSummary(r: any): string {
  if (r.type === "round_up") return `Rounds up to nearest ${fmt(r.roundUpTo)} → ${r.goalName}`;
  if (r.type === "percent_of_income") return `${r.percentage}% of every income deposit → ${r.goalName}`;
  if (r.type === "fixed_recurring") return `${fmt(r.fixedAmount)} every ${r.frequency === "weekly" ? "week" : "month"} → ${r.goalName}`;
  return "";
}

export default function SavingsRulesPage() {
  const qc = useQueryClient();
  const { data: rules = [], isLoading } = useQuery({ queryKey: ["savings-rules"], queryFn: () => apiGet("/api/savings-rules") });
  const { data: activity = [], isLoading: loadingActivity } = useQuery({ queryKey: ["savings-activity"], queryFn: () => apiGet("/api/savings-rules/activity") });
  const { data: goals = [] } = useQuery({ queryKey: ["goals"], queryFn: () => apiGet("/api/goals") });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["savings-rules"] });
    qc.invalidateQueries({ queryKey: ["savings-activity"] });
    qc.invalidateQueries({ queryKey: ["goals"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createRule = useMutation({ mutationFn: (data: any) => apiPost("/api/savings-rules", data), onSuccess: invalidateAll });
  const updateRule = useMutation({ mutationFn: ({ id, data }: any) => apiPatch(`/api/savings-rules/${id}`, data), onSuccess: invalidateAll });
  const deleteRule = useMutation({ mutationFn: (id: number) => apiDelete(`/api/savings-rules/${id}`), onSuccess: invalidateAll });

  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const [form, setForm] = useState({
    name: "", type: "round_up", goalId: "",
    roundUpTo: "1", percentage: "10", fixedAmount: "50", frequency: "monthly",
    nextRunDate: new Date().toISOString().slice(0, 10),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { name: form.name, type: form.type, goalId: Number(form.goalId) };
      if (form.type === "round_up") payload.roundUpTo = Number(form.roundUpTo);
      if (form.type === "percent_of_income") payload.percentage = Number(form.percentage);
      if (form.type === "fixed_recurring") {
        payload.fixedAmount = Number(form.fixedAmount);
        payload.frequency = form.frequency;
        payload.nextRunDate = form.nextRunDate;
      }
      await createRule.mutateAsync(payload);
      showToast("Savings rule created!");
      setForm({ name: "", type: "round_up", goalId: "", roundUpTo: "1", percentage: "10", fixedAmount: "50", frequency: "monthly", nextRunDate: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
    } catch (err: any) { showToast(err.message); }
  };

  const rulesArr = rules as any[];
  const goalsArr = (goals as any[]).filter((g: any) => !g.isCompleted);
  const totalSaved = rulesArr.reduce((s, r) => s + r.totalSaved, 0);
  const activeCount = rulesArr.filter((r) => r.isActive).length;

  return (
    <ProtectedLayout>
      <div className="min-h-full">
        {toast && <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}

        <div className="relative h-40 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 to-background" />
          <div className="relative z-10 px-6 pt-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Automated Savings</h1>
              <p className="text-foreground/60 text-sm mt-1">Save on autopilot — no willpower required</p>
            </div>
            <button onClick={() => setShowForm(true)} disabled={goalsArr.length === 0}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium mt-1 transition-colors">
              <Plus className="w-4 h-4" /> New Rule
            </button>
          </div>
        </div>

        <div className="px-6 pb-8 -mt-2 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Auto-Saved</p>
              <p className="text-xl font-bold text-emerald-400">{fmt(totalSaved)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Active Rules</p>
              <p className="text-xl font-bold text-foreground">{activeCount}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Rules</p>
              <p className="text-xl font-bold text-foreground">{rulesArr.length}</p>
            </div>
          </div>

          {!isLoading && goalsArr.length === 0 && (
            <div className="bg-yellow-500/[0.06] border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
              <Target className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <p className="text-sm text-foreground/60">You need at least one active goal before creating a savings rule. <a href="/goals" className="text-yellow-400 hover:text-yellow-300 underline">Create one →</a></p>
            </div>
          )}

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <div key={i} className="h-28 bg-card/70 rounded-xl animate-pulse" />)}</div>
          ) : rulesArr.length === 0 ? (
            <div className="bg-card/70 border border-border rounded-xl p-12 text-center">
              <PiggyBank className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No savings rules yet. Set one up and start saving without thinking about it.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {rulesArr.map((r) => {
                const typeInfo = RULE_TYPES.find((t) => t.value === r.type)!;
                const Icon = typeInfo.icon;
                return (
                  <div key={r.id} className={cn("bg-card border rounded-xl p-5 group transition-all",
                    r.isActive ? "border-border hover:border-emerald-500/20" : "border-border/60 opacity-60")}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{r.name}</h3>
                          <span className="text-xs text-muted-foreground/80">{typeInfo.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => updateRule.mutate({ id: r.id, data: { isActive: !r.isActive } })} className="text-muted-foreground/80 hover:text-emerald-400 transition-colors" title={r.isActive ? "Pause" : "Resume"}>
                          {r.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button onClick={() => deleteRule.mutate(r.id)} className="text-muted-foreground/80 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/60 mb-3">{ruleSummary(r)}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground/80">Saved so far</span>
                      <span className="text-lg font-bold text-emerald-400">{fmt(r.totalSaved)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Activity feed */}
          <div className="bg-card/70 border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h2 className="font-semibold text-foreground text-sm">Recent Savings Activity</h2>
            </div>
            {loadingActivity ? (
              <div className="p-5 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-card/70 rounded animate-pulse" />)}</div>
            ) : (activity as any[]).length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground/80 text-sm">No contributions yet — they'll show up here as your rules fire.</div>
            ) : (
              <div className="divide-y divide-border">
                {(activity as any[]).map((a: any) => (
                  <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground/70 truncate">{a.ruleName} <span className="text-muted-foreground/80">→ {a.goalName}</span></p>
                      <p className="text-xs text-muted-foreground/80">{new Date(a.createdAt).toLocaleDateString()} · {a.note}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-400 flex-shrink-0 ml-3">+{fmt(a.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-foreground text-lg">New Savings Rule</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground/80 hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-foreground/70 text-sm mb-1.5 block">Rule Name</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Spare Change Saver" required
                    className="w-full h-10 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none" />
                </div>

                <div>
                  <label className="text-foreground/70 text-sm mb-1.5 block">Type</label>
                  <div className="grid grid-cols-1 gap-2">
                    {RULE_TYPES.map((t) => (
                      <button key={t.value} type="button" onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                        className={cn("text-left rounded-lg border p-3 transition-colors",
                          form.type === t.value ? "border-emerald-500/40 bg-emerald-500/[0.06]" : "border-border bg-card/50 hover:border-border")}>
                        <div className="flex items-center gap-2 mb-1">
                          <t.icon className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm font-medium text-foreground">{t.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-foreground/70 text-sm mb-1.5 block">Savings Goal</label>
                  <select value={form.goalId} onChange={(e) => setForm((f) => ({ ...f, goalId: e.target.value }))} required
                    className="w-full h-10 rounded-lg bg-card border border-border text-foreground text-sm px-3">
                    <option value="" className="bg-card">Select a goal</option>
                    {goalsArr.map((g: any) => <option key={g.id} value={g.id} className="bg-card">{g.name}</option>)}
                  </select>
                </div>

                {form.type === "round_up" && (
                  <div>
                    <label className="text-foreground/70 text-sm mb-1.5 block">Round Up To Nearest ($)</label>
                    <select value={form.roundUpTo} onChange={(e) => setForm((f) => ({ ...f, roundUpTo: e.target.value }))}
                      className="w-full h-10 rounded-lg bg-card border border-border text-foreground text-sm px-3">
                      {["1", "5", "10"].map((v) => <option key={v} value={v} className="bg-card">${v}</option>)}
                    </select>
                  </div>
                )}

                {form.type === "percent_of_income" && (
                  <div>
                    <label className="text-foreground/70 text-sm mb-1.5 block">Percentage of Income (%)</label>
                    <input type="number" min="1" max="100" step="1" value={form.percentage} onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))} required
                      className="w-full h-10 rounded-lg bg-card border border-border text-foreground px-3 text-sm focus:outline-none" />
                  </div>
                )}

                {form.type === "fixed_recurring" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-foreground/70 text-sm mb-1.5 block">Amount ($)</label>
                      <input type="number" step="0.01" min="0" value={form.fixedAmount} onChange={(e) => setForm((f) => ({ ...f, fixedAmount: e.target.value }))} required
                        className="w-full h-10 rounded-lg bg-card border border-border text-foreground px-3 text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-foreground/70 text-sm mb-1.5 block">Frequency</label>
                      <select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                        className="w-full h-10 rounded-lg bg-card border border-border text-foreground text-sm px-3 capitalize">
                        {FREQUENCIES.map((f) => <option key={f} value={f} className="bg-card capitalize">{f}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-foreground/70 text-sm mb-1.5 block">First Run Date</label>
                      <input type="date" value={form.nextRunDate} onChange={(e) => setForm((f) => ({ ...f, nextRunDate: e.target.value }))} required
                        className="w-full h-10 rounded-lg bg-card border border-border text-foreground px-3 text-sm focus:outline-none" />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={createRule.isPending}
                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center transition-colors mt-2">
                  {createRule.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Rule"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
