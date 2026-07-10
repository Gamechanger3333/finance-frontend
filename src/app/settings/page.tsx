"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut, apiPatch } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { User, Bell, Shield, TrendingUp, Loader2, CheckCircle2, CheckCheck, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { useRouter } from "next/navigation";

const BG = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: notifications = [] } = useQuery({ queryKey: ["notifications"], queryFn: () => apiGet("/api/notifications") });
  const updateProfile = useMutation({ mutationFn: (data: any) => apiPut("/api/auth/profile", data) });
  const markRead = useMutation({ mutationFn: (id: number) => apiPatch(`/api/notifications/${id}/read`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
  const markAllRead = useMutation({ mutationFn: () => apiPatch("/api/notifications/read-all", {}), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });

  const [tab, setTab] = useState<"profile" | "notifications" | "security">("profile");
  const [form, setForm] = useState({ name: user?.name ?? "", currency: user?.currency ?? "USD", monthlyIncomeGoal: String(user?.monthlyIncomeGoal ?? ""), currentBalance: String(user?.currentBalance ?? "") });
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        name: form.name,
        currency: form.currency,
        monthlyIncomeGoal: form.monthlyIncomeGoal ? Number(form.monthlyIncomeGoal) : undefined,
        currentBalance: form.currentBalance !== "" ? Number(form.currentBalance) : null,
      });
      showToast("Profile updated!");
    } catch (err: any) { showToast(err.message); }
  };

  const handleLogout = () => { logout(); router.push("/login"); };

  const TABS = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <ProtectedLayout>
      <div className="min-h-full">
        {toast && <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}

        <div className="relative h-40 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0d]/70 to-[#0a0f0d]" />
          <div className="relative z-10 px-6 pt-8">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-white/50 text-sm mt-1">Manage your account and preferences</p>
          </div>
        </div>

        <div className="px-6 pb-8 -mt-2">
          <div className="flex gap-1 mb-6 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  tab === t.id ? "bg-white/[0.07] text-white" : "text-white/40 hover:text-white/60")}>
                <t.icon className="w-4 h-4" />{t.label}
              </button>
            ))}
          </div>

          {tab === "profile" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                <h2 className="font-semibold text-white mb-5">Personal Information</h2>
                <form onSubmit={saveProfile} className="space-y-4">
                  <div>
                    <label className="text-white/70 text-sm mb-1.5 block">Full Name</label>
                    <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full h-10 rounded-lg bg-white/[0.04] border border-white/10 text-white px-3 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-white/70 text-sm mb-1.5 block">Email Address</label>
                    <input value={user?.email} disabled className="w-full h-10 rounded-lg bg-white/[0.02] border border-white/[0.05] text-white/40 px-3 text-sm" />
                    <p className="text-xs text-white/30 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="text-white/70 text-sm mb-1.5 block">Currency</label>
                    <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                      className="w-full h-10 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm px-3">
                      {["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR"].map((c) => (
                        <option key={c} value={c} className="bg-[#0d1510]">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/70 text-sm mb-1.5 block">Monthly Income Goal ($)</label>
                    <input type="number" value={form.monthlyIncomeGoal} onChange={(e) => setForm((f) => ({ ...f, monthlyIncomeGoal: e.target.value }))}
                      placeholder="e.g. 5000" className="w-full h-10 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 px-3 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-white/70 text-sm mb-1.5 block">Current Balance ($)</label>
                    <input type="number" step="0.01" value={form.currentBalance} onChange={(e) => setForm((f) => ({ ...f, currentBalance: e.target.value }))}
                      placeholder="e.g. 2500" className="w-full h-10 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 px-3 text-sm focus:outline-none" />
                    <p className="text-xs text-white/30 mt-1">Used as the starting point for your Cash-Flow Forecast. Leave blank to estimate it from your transaction history.</p>
                  </div>
                  <button type="submit" disabled={updateProfile.isPending}
                    className="h-10 px-6 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg font-medium flex items-center transition-colors">
                    {updateProfile.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <h2 className="font-semibold text-white">Financial Health Score</h2>
                  </div>
                  <div className="text-center py-4">
                    <div className="relative inline-flex items-center justify-center w-28 h-28">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="2.5"
                          strokeDasharray={`${(user?.financialHealthScore ?? 0)} 100`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute text-center">
                        <p className="text-2xl font-bold text-white">{user?.financialHealthScore ?? 0}</p>
                        <p className="text-xs text-white/30">/100</p>
                      </div>
                    </div>
                    <p className={cn("text-sm font-medium mt-3",
                      (user?.financialHealthScore ?? 0) >= 80 ? "text-emerald-400" : (user?.financialHealthScore ?? 0) >= 60 ? "text-yellow-400" : "text-red-400")}>
                      {(user?.financialHealthScore ?? 0) >= 80 ? "Excellent" : (user?.financialHealthScore ?? 0) >= 60 ? "Good" : "Needs Improvement"}
                    </p>
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                  <h2 className="font-semibold text-white mb-2">Account Type</h2>
                  <p className="text-white/40 text-sm capitalize">{user?.userType?.replace("_", " ") ?? "Free"} Plan</p>
                  <div className="mt-4">
                    <button onClick={handleLogout} className="px-4 py-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors">
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <h2 className="font-semibold text-white">All Notifications</h2>
                {(notifications as any[]).some((n: any) => !n.isRead) && (
                  <button onClick={() => markAllRead.mutate()} className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300">
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>
              {(notifications as any[]).length === 0 ? (
                <div className="py-12 text-center text-white/30 text-sm">No notifications</div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {(notifications as any[]).map((n: any) => (
                    <button key={n.id} onClick={() => !n.isRead && markRead.mutate(n.id)}
                      className={cn("w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-white/[0.02] transition-colors", !n.isRead && "bg-emerald-500/[0.03]")}>
                      <div className="flex-shrink-0 mt-0.5">
                        {n.type === "warning" ? <AlertTriangle className="w-4 h-4 text-yellow-400" /> : n.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Info className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        <p className="text-xs text-white/40 mt-0.5">{n.message}</p>
                        <p className="text-xs text-white/20 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                      {!n.isRead && <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "security" && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 max-w-lg">
              <h2 className="font-semibold text-white mb-5">Security Settings</h2>
              <div className="space-y-4">
                {[
                  { label: "Two-Factor Authentication", desc: "Add an extra layer of security", status: "Not enabled", action: "Enable 2FA" },
                  { label: "Login Notifications", desc: "Get notified of new sign-ins", status: "Enabled", action: "Disable" },
                  { label: "Session Timeout", desc: "Auto-logout after inactivity", status: "30 minutes", action: "Change" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0">
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-white/40">{item.desc}</p>
                      <p className="text-xs text-white/30 mt-0.5">{item.status}</p>
                    </div>
                    <button className="px-3 py-1.5 border border-white/10 text-white/60 hover:text-white hover:bg-white/5 rounded-lg text-xs transition-colors">
                      {item.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
