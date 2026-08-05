"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import {
  Activity, AlertTriangle, TrendingDown, Wallet, Loader2, CheckCircle2, CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";

const RANGE_OPTIONS = [
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-foreground/60 mb-1">{new Date(label).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
      <p className={cn("text-sm font-semibold", row.balance < 0 ? "text-red-400" : "text-foreground")}>{fmt(row.balance)}</p>
      {row.events?.length > 0 && (
        <div className="mt-1 pt-1 border-t border-border space-y-0.5">
          {row.events.map((e: any, i: number) => (
            <p key={i} className="text-xs text-yellow-400/80">{e.name} · {fmt(e.amount)}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CashflowForecastPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [days, setDays] = useState(30);
  const [showBalanceForm, setShowBalanceForm] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const { data: forecast, isLoading } = useQuery({
    queryKey: ["cashflow-forecast", days],
    queryFn: () => apiGet(`/api/cashflow-forecast?days=${days}`),
  });

  const updateProfile = useMutation({
    mutationFn: (currentBalance: number) => apiPut("/api/auth/profile", { currentBalance }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cashflow-forecast"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      showToast("Starting balance updated!");
      setShowBalanceForm(false);
    },
    onError: (err: any) => showToast(err.message),
  });

  const f = forecast as any;
  const chartData = (f?.days ?? []).map((d: any) => ({ ...d }));
  const hasOverdraft = !!f?.overdraftDate;
  const allEvents = (f?.days ?? [])
    .flatMap((d: any) => d.events.map((e: any) => ({ ...e, date: d.date })))
    .slice(0, 8);

  const submitBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(balanceInput);
    if (!Number.isFinite(val)) { showToast("Enter a valid number"); return; }
    updateProfile.mutate(val);
  };

  return (
    <ProtectedLayout>
      <div className="min-h-full">
        {toast && <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}

        <div>
          <div className="px-6 pt-8 pb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Cash-Flow Forecast</h1>
              <p className="text-foreground/60 text-sm mt-1">A look-ahead at your balance based on bills and spending habits</p>
            </div>
            <div className="flex gap-1 bg-card border border-border rounded-lg p-1 mt-1">
              {RANGE_OPTIONS.map((o) => (
                <button key={o.value} onClick={() => setDays(o.value)}
                  className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    days === o.value ? "bg-emerald-500 text-white" : "text-foreground/60 hover:text-foreground")}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-8 space-y-6">
          {hasOverdraft && (
            <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Projected overdraft risk</p>
                <p className="text-xs text-foreground/60 mt-0.5">
                  Based on your recent spending and upcoming bills, your balance may go negative around{" "}
                  <span className="text-red-400 font-medium">{new Date(f.overdraftDate).toLocaleDateString(undefined, { month: "long", day: "numeric" })}</span>.
                  Consider trimming discretionary spending or moving a bill payment.
                </p>
              </div>
            </div>
          )}

          {!isLoading && f?.startingBalanceIsEstimate && (
            <div className="bg-card/70 border border-border rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-foreground/60">
                <Wallet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                Your starting balance is estimated from your transaction history. Set your real balance for a more accurate forecast.
              </div>
              {!showBalanceForm ? (
                <button onClick={() => { setBalanceInput(String(Math.round(f.startingBalance))); setShowBalanceForm(true); }}
                  className="text-xs bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0">
                  Set balance
                </button>
              ) : (
                <form onSubmit={submitBalance} className="flex items-center gap-2 flex-shrink-0">
                  <input autoFocus type="number" step="0.01" value={balanceInput} onChange={(e) => setBalanceInput(e.target.value)}
                    className="h-9 w-32 rounded-lg bg-accent border border-border text-foreground px-3 text-sm focus:outline-none" />
                  <button type="submit" disabled={updateProfile.isPending}
                    className="h-9 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center transition-colors">
                    {updateProfile.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Starting Balance</p>
              <p className="text-xl font-bold text-foreground">{isLoading ? "—" : fmt(f.startingBalance)}</p>
              {f?.startingBalanceIsEstimate && <p className="text-[11px] text-muted-foreground/80 mt-0.5">Estimated</p>}
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5" /> Lowest Projected</p>
              <p className={cn("text-xl font-bold", f?.lowestPoint?.balance < 0 ? "text-red-400" : "text-foreground")}>
                {isLoading ? "—" : fmt(f.lowestPoint.balance)}
              </p>
              {!isLoading && <p className="text-[11px] text-muted-foreground/80 mt-0.5">{new Date(f.lowestPoint.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>}
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Overdraft Risk</p>
              <p className={cn("text-xl font-bold flex items-center gap-1.5", hasOverdraft ? "text-red-400" : "text-emerald-400")}>
                {isLoading ? "—" : hasOverdraft ? "At risk" : <>None <CheckCircle2 className="w-4 h-4" /></>}
              </p>
            </div>
          </div>

          <div className="bg-card/70 border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="font-semibold text-foreground text-sm">Projected Balance</h2>
            </div>
            {isLoading ? (
              <div className="h-72 bg-card/70 rounded-lg animate-pulse" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                      tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      interval={Math.floor(chartData.length / 6)} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                      tickFormatter={(v) => fmt(v)} axisLine={false} tickLine={false} width={70} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.6} />
                    <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} fill="url(#balanceFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-card/70 border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-emerald-400" />
              <h2 className="font-semibold text-foreground text-sm">Upcoming Bill Events</h2>
            </div>
            {isLoading ? (
              <div className="p-5 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-card/70 rounded animate-pulse" />)}</div>
            ) : allEvents.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground/80 text-sm">No recurring bills fall within this window.</div>
            ) : (
              <div className="divide-y divide-border">
                {allEvents.map((e: any, i: number) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between">
                    <span className="text-sm text-foreground/70">{e.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground/80">{new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                      <span className="text-sm font-medium text-foreground/80">{fmt(e.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
