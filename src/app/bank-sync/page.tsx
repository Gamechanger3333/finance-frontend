"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { Landmark, Plus, RefreshCw, Trash2, X, Loader2, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedLayout from "@/components/layout/ProtectedLayout";


export default function BankSyncPage() {
  const qc = useQueryClient();
  const { data: connections = [], isLoading } = useQuery({ queryKey: ["bank-connections"], queryFn: () => apiGet("/api/bank-sync/connections") });
  const { data: institutions = [] } = useQuery({ queryKey: ["bank-institutions"], queryFn: () => apiGet("/api/bank-sync/institutions") });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["bank-connections"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const connect = useMutation({ mutationFn: (institutionName: string) => apiPost("/api/bank-sync/connect", { institutionName }), onSuccess: invalidateAll });
  const sync = useMutation({ mutationFn: (id: number) => apiPost(`/api/bank-sync/${id}/sync`, {}), onSuccess: invalidateAll });
  const disconnect = useMutation({ mutationFn: (id: number) => apiDelete(`/api/bank-sync/${id}`), onSuccess: invalidateAll });

  const [showPicker, setShowPicker] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const handleConnect = async (institutionName: string) => {
    try {
      await connect.mutateAsync(institutionName);
      showToast(`Connected to ${institutionName}!`);
      setShowPicker(false);
    } catch (err: any) { showToast(err.message); }
  };

  const handleSync = async (id: number, name: string) => {
    try {
      const result = await sync.mutateAsync(id);
      showToast(result.imported > 0 ? `Imported ${result.imported} new transaction${result.imported === 1 ? "" : "s"} from ${name}.` : `No new transactions from ${name}.`);
    } catch (err: any) { showToast(err.message); }
  };

  const connArr = connections as any[];

  return (
    <ProtectedLayout>
      <div className="min-h-full">
        {toast && <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg max-w-xs">{toast}</div>}

        <div>
          <div className="px-6 pt-8 pb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Bank Sync</h1>
              <p className="text-foreground/60 text-sm mt-1">Auto-import transactions instead of typing them in</p>
            </div>
            <button onClick={() => setShowPicker(true)} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium mt-1 transition-colors">
              <Plus className="w-4 h-4" /> Connect a Bank
            </button>
          </div>
        </div>

        <div className="px-6 pb-8 space-y-6">
          <div className="bg-blue-500/[0.06] border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/60">
              <span className="text-blue-400 font-medium">Demo mode.</span> This environment has no live Plaid credentials, so "connecting" links a
              simulated account and "syncing" imports realistic sample transactions — built on the same route shape a real Plaid integration
              (Link token → access token → transactions/sync) would use, so it's a drop-in swap once real API keys are configured.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <div key={i} className="h-32 bg-card/70 rounded-xl animate-pulse" />)}</div>
          ) : connArr.length === 0 ? (
            <div className="bg-card/70 border border-border rounded-xl p-12 text-center">
              <Landmark className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No banks connected yet. Connect one to start auto-importing transactions.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {connArr.map((c: any) => (
                <div key={c.id} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                        <Landmark className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{c.institutionName}</h3>
                        <span className="text-xs text-muted-foreground/80">{c.accountName} ···· {c.accountMask}</span>
                      </div>
                    </div>
                    <button onClick={() => disconnect.mutate(c.id)} className="text-muted-foreground/60 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {c.lastSyncedAt ? `Last synced ${new Date(c.lastSyncedAt).toLocaleString()}` : "Never synced"}
                    </div>
                    <button onClick={() => handleSync(c.id, c.institutionName)} disabled={sync.isPending}
                      className="flex items-center gap-1.5 text-xs bg-accent hover:bg-emerald-500/15 text-foreground/60 hover:text-emerald-400 border border-border hover:border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      {sync.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Sync now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showPicker && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-foreground text-lg">Choose Your Bank</h2>
                <button onClick={() => setShowPicker(false)} className="text-muted-foreground/80 hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2">
                {(institutions as string[]).map((name) => (
                  <button key={name} onClick={() => handleConnect(name)} disabled={connect.isPending}
                    className="w-full flex items-center gap-3 bg-card/70 hover:bg-accent border border-border hover:border-emerald-500/30 rounded-lg p-3 transition-colors disabled:opacity-50">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                      <Landmark className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-sm text-foreground">{name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-4 text-center">Demo mode — no real credentials required or transmitted.</p>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
