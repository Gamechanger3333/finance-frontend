"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Users, Plus, Copy, Check, LogOut, Loader2, X, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

const BG = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1400&q=80";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function HouseholdPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: household, isLoading } = useQuery({ queryKey: ["household"], queryFn: () => apiGet("/api/household") });
  const { data: expenses = [] } = useQuery({ queryKey: ["household-expenses"], queryFn: () => apiGet("/api/household/expenses"), enabled: !!household });
  const { data: balances } = useQuery({ queryKey: ["household-balances"], queryFn: () => apiGet("/api/household/balances"), enabled: !!household });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["household"] });
    qc.invalidateQueries({ queryKey: ["household-expenses"] });
    qc.invalidateQueries({ queryKey: ["household-balances"] });
  };

  const createHousehold = useMutation({ mutationFn: (name: string) => apiPost("/api/household", { name }), onSuccess: invalidateAll });
  const joinHousehold = useMutation({ mutationFn: (inviteCode: string) => apiPost("/api/household/join", { inviteCode }), onSuccess: invalidateAll });
  const leaveHousehold = useMutation({ mutationFn: () => apiPost("/api/household/leave", {}), onSuccess: invalidateAll });
  const addExpense = useMutation({ mutationFn: (data: any) => apiPost("/api/household/expenses", data), onSuccess: invalidateAll });
  const settleSplit = useMutation({
    mutationFn: ({ expenseId, splitId }: any) => apiPost(`/api/household/expenses/${expenseId}/splits/${splitId}/settle`, {}),
    onSuccess: invalidateAll,
  });

  const [mode, setMode] = useState<"create" | "join">("create");
  const [nameInput, setNameInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [splitMethod, setSplitMethod] = useState<"equal" | "custom">("equal");
  const [expForm, setExpForm] = useState({ description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
  const [customAmounts, setCustomAmounts] = useState<Record<number, string>>({});
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const submitSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "create") await createHousehold.mutateAsync(nameInput);
      else await joinHousehold.mutateAsync(codeInput);
      showToast(mode === "create" ? "Household created!" : "Joined household!");
      setNameInput(""); setCodeInput("");
    } catch (err: any) { showToast(err.message); }
  };

  const copyCode = () => {
    if (household?.inviteCode) {
      navigator.clipboard.writeText(household.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { description: expForm.description, amount: Number(expForm.amount), date: expForm.date, splitMethod };
      if (splitMethod === "custom") {
        payload.customSplits = (household?.members ?? []).map((m: any) => ({ userId: m.userId, amount: Number(customAmounts[m.userId] || 0) }));
      }
      await addExpense.mutateAsync(payload);
      showToast("Shared expense logged!");
      setExpForm({ description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
      setCustomAmounts({});
      setShowExpenseForm(false);
    } catch (err: any) { showToast(err.message); }
  };

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="p-6"><div className="h-40 bg-card/70 rounded-xl animate-pulse" /></div>
      </ProtectedLayout>
    );
  }

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
              <h1 className="text-2xl font-bold text-foreground">Household</h1>
              <p className="text-foreground/60 text-sm mt-1">Split shared expenses with people you live with</p>
            </div>
            {household && (
              <button onClick={() => setShowExpenseForm(true)} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium mt-1 transition-colors">
                <Plus className="w-4 h-4" /> Shared Expense
              </button>
            )}
          </div>
        </div>

        <div className="px-6 pb-8 -mt-2 space-y-6">
          {!household ? (
            <div className="max-w-md bg-card/70 border border-border rounded-xl p-6">
              <div className="flex gap-1 bg-card border border-border rounded-lg p-1 mb-5 w-fit">
                {(["create", "join"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)}
                    className={cn("px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors", mode === m ? "bg-emerald-500 text-white" : "text-foreground/60 hover:text-foreground")}>
                    {m} household
                  </button>
                ))}
              </div>
              <form onSubmit={submitSetup} className="space-y-4">
                {mode === "create" ? (
                  <div>
                    <label className="text-foreground/70 text-sm mb-1.5 block">Household Name</label>
                    <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="e.g. The Smiths" required
                      className="w-full h-10 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none" />
                  </div>
                ) : (
                  <div>
                    <label className="text-foreground/70 text-sm mb-1.5 block">Invite Code</label>
                    <input value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} placeholder="e.g. A1B2C3D4" required
                      className="w-full h-10 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none uppercase" />
                  </div>
                )}
                <button type="submit" disabled={createHousehold.isPending || joinHousehold.isPending}
                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center transition-colors">
                  {(createHousehold.isPending || joinHousehold.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "create" ? "Create Household" : "Join Household"}
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Owed to You</p>
                  <p className="text-xl font-bold text-emerald-400">{fmt(balances?.owedToMe ?? 0)}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">You Owe</p>
                  <p className="text-xl font-bold text-red-400">{fmt(balances?.iOwe ?? 0)}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Invite Code</p>
                    <p className="text-sm font-mono text-foreground">{household.inviteCode}</p>
                  </div>
                  <button onClick={copyCode} className="text-muted-foreground hover:text-emerald-400 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-card/70 border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <h2 className="font-semibold text-foreground text-sm">{household.name} · {household.members.length} member{household.members.length === 1 ? "" : "s"}</h2>
                  </div>
                  <button onClick={() => leaveHousehold.mutate()} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors">
                    <LogOut className="w-3.5 h-3.5" /> Leave
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {household.members.map((m: any) => (
                    <div key={m.userId} className="flex items-center gap-2 bg-card rounded-lg px-3 py-1.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">
                        {m.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm text-foreground/70">{m.name}{m.userId === user?.id ? " (you)" : ""}</span>
                      {m.role === "owner" && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Owner</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card/70 border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <h2 className="font-semibold text-foreground text-sm">Shared Expenses</h2>
                </div>
                {(expenses as any[]).length === 0 ? (
                  <div className="px-5 py-8 text-center text-muted-foreground/80 text-sm">No shared expenses yet.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {(expenses as any[]).map((e: any) => (
                      <div key={e.id} className="px-5 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">{e.description}</p>
                            <p className="text-xs text-muted-foreground/80">{e.date} · Paid by {e.paidByUserId === user?.id ? "you" : e.paidByName}</p>
                          </div>
                          <span className="text-sm font-semibold text-foreground">{fmt(e.amount)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {e.splits.map((s: any) => (
                            <span key={s.id} className={cn("text-xs px-2 py-1 rounded-full flex items-center gap-1",
                              s.isSettled ? "bg-card/70 text-muted-foreground/80" : "bg-yellow-500/10 text-yellow-400/80")}>
                              {s.userName === user?.name ? "You" : s.userName} owes {fmt(s.amountOwed)}
                              {!s.isSettled && s.userId === user?.id && (
                                <button onClick={() => settleSplit.mutate({ expenseId: e.id, splitId: s.id })} className="ml-1 underline hover:text-yellow-300">settle</button>
                              )}
                              {s.isSettled && <Check className="w-3 h-3" />}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {showExpenseForm && household && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-foreground text-lg">Add Shared Expense</h2>
                <button onClick={() => setShowExpenseForm(false)} className="text-muted-foreground/80 hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={submitExpense} className="space-y-4">
                <div>
                  <label className="text-foreground/70 text-sm mb-1.5 block">Description</label>
                  <input value={expForm.description} onChange={(e) => setExpForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. Groceries" required
                    className="w-full h-10 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-foreground/70 text-sm mb-1.5 block">Amount ($)</label>
                    <input type="number" step="0.01" min="0" value={expForm.amount} onChange={(e) => setExpForm((f) => ({ ...f, amount: e.target.value }))} required
                      className="w-full h-10 rounded-lg bg-card border border-border text-foreground px-3 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-foreground/70 text-sm mb-1.5 block">Date</label>
                    <input type="date" value={expForm.date} onChange={(e) => setExpForm((f) => ({ ...f, date: e.target.value }))} required
                      className="w-full h-10 rounded-lg bg-card border border-border text-foreground px-3 text-sm focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-foreground/70 text-sm mb-1.5 block">Split</label>
                  <div className="flex gap-1 bg-card border border-border rounded-lg p-1 w-fit mb-3">
                    {(["equal", "custom"] as const).map((s) => (
                      <button key={s} type="button" onClick={() => setSplitMethod(s)}
                        className={cn("px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors", splitMethod === s ? "bg-emerald-500 text-white" : "text-foreground/60 hover:text-foreground")}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {splitMethod === "custom" && (
                    <div className="space-y-2">
                      {household.members.map((m: any) => (
                        <div key={m.userId} className="flex items-center justify-between gap-3">
                          <span className="text-sm text-foreground/60">{m.name}</span>
                          <input type="number" step="0.01" min="0" value={customAmounts[m.userId] ?? ""} onChange={(e) => setCustomAmounts((c) => ({ ...c, [m.userId]: e.target.value }))}
                            placeholder="0.00" className="w-28 h-9 rounded-lg bg-card border border-border text-foreground px-3 text-sm focus:outline-none" />
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground/80">Amounts must add up to the total.</p>
                    </div>
                  )}
                </div>
                <button type="submit" disabled={addExpense.isPending}
                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center transition-colors mt-2">
                  {addExpense.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Expense"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
