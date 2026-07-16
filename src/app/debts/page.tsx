"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import {
  Plus, X, Loader2, Trash2, CreditCard, GraduationCap, Car, Landmark, Home, Circle,
  Snowflake, Mountain, PiggyBank, DollarSign, Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const BG = "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=1400&q=80";

const DEBT_TYPES = [
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
  { value: "student_loan", label: "Student Loan", icon: GraduationCap },
  { value: "auto_loan", label: "Auto Loan", icon: Car },
  { value: "personal_loan", label: "Personal Loan", icon: Landmark },
  { value: "mortgage", label: "Mortgage", icon: Home },
  { value: "other", label: "Other", icon: Circle },
];
const typeIcon = (t: string) => DEBT_TYPES.find((d) => d.value === t)?.icon ?? Circle;
const typeLabel = (t: string) => DEBT_TYPES.find((d) => d.value === t)?.label ?? "Other";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmt2(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function DebtsPage() {
  const qc = useQueryClient();
  const { data: debts = [], isLoading } = useQuery({ queryKey: ["debts"], queryFn: () => apiGet("/api/debts") });
  const [extraMonthly, setExtraMonthly] = useState(100);
  const [strategy, setStrategy] = useState<"snowball" | "avalanche">("avalanche");
  const { data: plan, isLoading: loadingPlan } = useQuery({
    queryKey: ["debts-payoff-plan", extraMonthly],
    queryFn: () => apiGet(`/api/debts/payoff-plan?extraMonthly=${extraMonthly}`),
    enabled: (debts as any[]).length > 0,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["debts"] });
    qc.invalidateQueries({ queryKey: ["debts-payoff-plan"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createDebt = useMutation({ mutationFn: (data: any) => apiPost("/api/debts", data), onSuccess: invalidateAll });
  const deleteDebt = useMutation({ mutationFn: (id: number) => apiDelete(`/api/debts/${id}`), onSuccess: invalidateAll });
  const logPayment = useMutation({
    mutationFn: ({ id, amount }: any) => apiPost(`/api/debts/${id}/log-payment`, { amount }),
    onSuccess: () => { invalidateAll(); qc.invalidateQueries({ queryKey: ["transactions"] }); },
  });

  const [showForm, setShowForm] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [form, setForm] = useState({ name: "", debtType: "credit_card", balance: "", interestRate: "", minimumPayment: "" });
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDebt.mutateAsync({
        name: form.name,
        debtType: form.debtType,
        balance: Number(form.balance),
        interestRate: form.interestRate ? Number(form.interestRate) : 0,
        minimumPayment: Number(form.minimumPayment),
      });
      showToast("Debt added!");
      setForm({ name: "", debtType: "credit_card", balance: "", interestRate: "", minimumPayment: "" });
      setShowForm(false);
    } catch (err: any) { showToast(err.message); }
  };

  const submitPayment = async (id: number) => {
    try {
      await logPayment.mutateAsync({ id, amount: Number(payAmount) });
      showToast("Payment logged!");
      setPayingId(null);
      setPayAmount("");
    } catch (err: any) { showToast(err.message); }
  };

  const debtsArr = debts as any[];
  const activeDebts = debtsArr.filter((d) => !d.isPaidOff);
  const totalBalance = activeDebts.reduce((s, d) => s + d.balance, 0);
  const totalMinimum = activeDebts.reduce((s, d) => s + d.minimumPayment, 0);
  const avgRate = activeDebts.length > 0 ? activeDebts.reduce((s, d) => s + d.interestRate, 0) / activeDebts.length : 0;

  const p = plan as any;
  const chosen = p ? p[strategy] : null;
  const other = p ? p[strategy === "snowball" ? "avalanche" : "snowball"] : null;
  const interestSaved = chosen && other ? other.totalInterestPaid - chosen.totalInterestPaid : 0;

  const chartData = useMemo(() => {
    if (!p) return [];
    const maxMonths = Math.max(p.snowball.monthlySnapshots.length, p.avalanche.monthlySnapshots.length);
    const rows = [];
    for (let i = 0; i < maxMonths; i++) {
      rows.push({
        month: i + 1,
        snowball: p.snowball.monthlySnapshots[i]?.totalBalance ?? 0,
        avalanche: p.avalanche.monthlySnapshots[i]?.totalBalance ?? 0,
      });
    }
    // Sample down to keep the chart light if the payoff horizon is long.
    if (rows.length > 60) {
      const step = Math.ceil(rows.length / 60);
      return rows.filter((_, i) => i % step === 0 || i === rows.length - 1);
    }
    return rows;
  }, [p]);

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
              <h1 className="text-2xl font-bold text-foreground">Debt Payoff Planner</h1>
              <p className="text-foreground/60 text-sm mt-1">A concrete strategy and timeline to become debt-free</p>
            </div>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium mt-1 transition-colors">
              <Plus className="w-4 h-4" /> Add Debt
            </button>
          </div>
        </div>

        <div className="px-6 pb-8 -mt-2 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Debt</p>
              <p className="text-xl font-bold text-foreground">{fmt(totalBalance)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Monthly Minimums</p>
              <p className="text-xl font-bold text-foreground">{fmt(totalMinimum)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Avg. Interest Rate</p>
              <p className="text-xl font-bold text-foreground">{avgRate.toFixed(1)}%</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Active Debts</p>
              <p className="text-xl font-bold text-emerald-400">{activeDebts.length}</p>
            </div>
          </div>

          {/* Debt list */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <div key={i} className="h-28 bg-card/70 rounded-xl animate-pulse" />)}</div>
          ) : debtsArr.length === 0 ? (
            <div className="bg-card/70 border border-border rounded-xl p-12 text-center">
              <CreditCard className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No debts tracked yet. Add one to build your payoff plan.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {debtsArr.map((d) => {
                const Icon = typeIcon(d.debtType);
                return (
                  <div key={d.id} className={cn("bg-card border rounded-xl p-5 group transition-all",
                    d.isPaidOff ? "border-emerald-500/20 opacity-60" : "border-border hover:border-emerald-500/20")}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{d.name}</h3>
                          <span className="text-xs text-muted-foreground/80">{typeLabel(d.debtType)} · {d.interestRate}% APR</span>
                        </div>
                      </div>
                      <button onClick={() => deleteDebt.mutate(d.id)} className="text-muted-foreground/60 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-foreground">{fmt2(d.balance)}</span>
                      <span className="text-xs text-muted-foreground/80">Min. {fmt2(d.minimumPayment)}/mo</span>
                    </div>

                    {d.isPaidOff ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium"><Trophy className="w-3.5 h-3.5" /> Paid off!</div>
                    ) : payingId === d.id ? (
                      <div className="flex items-center gap-2">
                        <input autoFocus type="number" step="0.01" min="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                          placeholder="Amount" className="flex-1 h-9 rounded-lg bg-accent border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none" />
                        <button onClick={() => submitPayment(d.id)} disabled={logPayment.isPending}
                          className="h-9 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors">
                          {logPayment.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Log"}
                        </button>
                        <button onClick={() => setPayingId(null)} className="text-muted-foreground/80 hover:text-foreground"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setPayingId(d.id); setPayAmount(String(d.minimumPayment)); }}
                        className="w-full text-xs bg-accent hover:bg-emerald-500/15 text-foreground/60 hover:text-emerald-400 border border-border hover:border-emerald-500/30 px-3 py-2 rounded-lg transition-colors">
                        Log a payment
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Payoff planner */}
          {activeDebts.length > 0 && (
            <div className="bg-card/70 border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-emerald-400" />
                  <h2 className="font-semibold text-foreground text-sm">Payoff Strategy</h2>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Extra monthly payment</label>
                  <div className="flex items-center gap-1 bg-accent border border-border rounded-lg px-2.5 h-9">
                    <DollarSign className="w-3.5 h-3.5 text-muted-foreground/80" />
                    <input type="number" min="0" step="10" value={extraMonthly} onChange={(e) => setExtraMonthly(Math.max(0, Number(e.target.value) || 0))}
                      className="w-20 bg-transparent text-foreground text-sm focus:outline-none" />
                  </div>
                </div>
              </div>

              {loadingPlan ? (
                <div className="h-64 bg-card/70 rounded-lg animate-pulse" />
              ) : p ? (
                <>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {(["avalanche", "snowball"] as const).map((s) => {
                      const plan = p[s];
                      const isActive = strategy === s;
                      return (
                        <button key={s} onClick={() => setStrategy(s)}
                          className={cn("text-left rounded-xl border p-4 transition-all",
                            isActive ? "border-emerald-500/40 bg-emerald-500/[0.06]" : "border-border bg-card/50 hover:border-border")}>
                          <div className="flex items-center gap-2 mb-2">
                            {s === "snowball" ? <Snowflake className="w-4 h-4 text-blue-400" /> : <Mountain className="w-4 h-4 text-orange-400" />}
                            <span className="font-semibold text-foreground text-sm capitalize">{s}</span>
                            {isActive && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full ml-auto">Selected</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">
                            {s === "snowball" ? "Smallest balance first — quick wins for motivation" : "Highest interest rate first — saves the most money"}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground/80">Debt-free in</p>
                              <p className="text-foreground font-semibold">{plan.neverPaysOff ? "50+ yrs" : `${plan.months} mo`}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground/80">Total interest</p>
                              <p className="text-foreground font-semibold">{fmt(plan.totalInterestPaid)}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {interestSaved > 1 && (
                    <div className="mb-5 text-xs text-emerald-400 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-lg px-3 py-2">
                      {strategy === "avalanche" ? "Avalanche" : "Snowball"} saves you ~{fmt(Math.abs(interestSaved))} in interest compared to the other strategy.
                    </div>
                  )}

                  <div className="h-64 mb-5">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                          tickFormatter={(m) => `M${m}`} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} tickFormatter={(v) => fmt(v)} axisLine={false} tickLine={false} width={70} />
                        <Tooltip formatter={(v: any) => fmt(Number(v))} labelFormatter={(m) => `Month ${m}`}
                          contentStyle={{ background: "#0d1510", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="avalanche" name="Avalanche" stroke="#f97316" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="snowball" name="Snowball" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-foreground/60 mb-2 uppercase tracking-wide">Payoff order ({strategy})</h3>
                    <div className="space-y-1.5">
                      {chosen.payoffOrder.map((entry: any, i: number) => (
                        <div key={entry.id} className="flex items-center justify-between text-sm bg-card/50 rounded-lg px-3 py-2">
                          <span className="text-foreground/70">{i + 1}. {entry.name}</span>
                          <span className="text-muted-foreground text-xs">Paid off month {entry.payoffMonth}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-foreground text-lg">Add Debt</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground/80 hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-foreground/70 text-sm mb-1.5 block">Debt Name</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Chase Sapphire" required
                    className="w-full h-10 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-foreground/70 text-sm mb-1.5 block">Type</label>
                  <select value={form.debtType} onChange={(e) => setForm((f) => ({ ...f, debtType: e.target.value }))}
                    className="w-full h-10 rounded-lg bg-card border border-border text-foreground text-sm px-3">
                    {DEBT_TYPES.map((t) => <option key={t.value} value={t.value} className="bg-card">{t.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-foreground/70 text-sm mb-1.5 block">Balance ($)</label>
                    <input type="number" step="0.01" min="0" value={form.balance} onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))} placeholder="0.00" required
                      className="w-full h-10 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-foreground/70 text-sm mb-1.5 block">Interest Rate (%)</label>
                    <input type="number" step="0.01" min="0" value={form.interestRate} onChange={(e) => setForm((f) => ({ ...f, interestRate: e.target.value }))} placeholder="e.g. 19.99"
                      className="w-full h-10 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-foreground/70 text-sm mb-1.5 block">Minimum Payment ($/mo)</label>
                  <input type="number" step="0.01" min="0" value={form.minimumPayment} onChange={(e) => setForm((f) => ({ ...f, minimumPayment: e.target.value }))} placeholder="0.00" required
                    className="w-full h-10 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none" />
                </div>
                <button type="submit" disabled={createDebt.isPending}
                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center transition-colors mt-2">
                  {createDebt.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</> : "Add Debt"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
