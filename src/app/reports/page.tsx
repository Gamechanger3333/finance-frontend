"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiDownload } from "@/lib/api";
import { FileText, Download, FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedLayout from "@/components/layout/ProtectedLayout";


function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getPresetRange(preset: string): { startDate: string; endDate: string } {
  const now = new Date();
  if (preset === "this_month") {
    return { startDate: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), endDate: isoDate(now) };
  }
  if (preset === "this_quarter") {
    const q = Math.floor(now.getMonth() / 3);
    return { startDate: isoDate(new Date(now.getFullYear(), q * 3, 1)), endDate: isoDate(now) };
  }
  if (preset === "this_year") {
    return { startDate: `${now.getFullYear()}-01-01`, endDate: isoDate(now) };
  }
  if (preset === "last_year") {
    return { startDate: `${now.getFullYear() - 1}-01-01`, endDate: `${now.getFullYear() - 1}-12-31` };
  }
  return { startDate: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), endDate: isoDate(now) };
}

const PRESETS = [
  { value: "this_month", label: "This Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "this_year", label: "This Year" },
  { value: "last_year", label: "Last Year" },
  { value: "custom", label: "Custom" },
];

export default function ReportsPage() {
  const [preset, setPreset] = useState("this_year");
  const [customRange, setCustomRange] = useState(getPresetRange("this_year"));
  const range = preset === "custom" ? customRange : getPresetRange(preset);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["reports-summary", range.startDate, range.endDate],
    queryFn: () => apiGet(`/api/reports/summary?startDate=${range.startDate}&endDate=${range.endDate}`),
  });

  const [downloading, setDownloading] = useState<"csv" | "pdf" | null>(null);
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const exportFile = async (format: "csv" | "pdf") => {
    setDownloading(format);
    try {
      const ext = format === "csv" ? "csv" : "pdf";
      await apiDownload(`/api/reports/export.${ext}?startDate=${range.startDate}&endDate=${range.endDate}`, `finflow_${range.startDate}_to_${range.endDate}.${ext}`);
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setDownloading(null);
    }
  };

  const s = summary as any;
  const incomeCats = (s?.byCategory ?? []).filter((c: any) => c.type === "income");
  const expenseCats = (s?.byCategory ?? []).filter((c: any) => c.type === "expense");

  return (
    <ProtectedLayout>
      <div className="min-h-full">
        {toast && <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}

        <div>
          <div className="px-6 pt-8 pb-6">
            <h1 className="text-2xl font-bold text-foreground">Reports & Tax Export</h1>
            <p className="text-foreground/60 text-sm mt-1">Income/expense statements ready for your accountant or tax software</p>
          </div>
        </div>

        <div className="px-6 pb-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
              {PRESETS.map((p) => (
                <button key={p.value} onClick={() => setPreset(p.value)}
                  className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", preset === p.value ? "bg-emerald-500 text-white" : "text-foreground/60 hover:text-foreground")}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => exportFile("csv")} disabled={downloading !== null}
                className="flex items-center gap-1.5 bg-accent hover:bg-accent disabled:opacity-50 text-foreground/70 hover:text-foreground px-3 py-2 rounded-lg text-sm transition-colors">
                {downloading === "csv" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />} CSV
              </button>
              <button onClick={() => exportFile("pdf")} disabled={downloading !== null}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                {downloading === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF Statement
              </button>
            </div>
          </div>

          {preset === "custom" && (
            <div className="flex items-center gap-3">
              <input type="date" value={customRange.startDate} onChange={(e) => setCustomRange((r) => ({ ...r, startDate: e.target.value }))}
                className="h-9 rounded-lg bg-card border border-border text-foreground px-3 text-sm focus:outline-none" />
              <span className="text-muted-foreground/80 text-sm">to</span>
              <input type="date" value={customRange.endDate} onChange={(e) => setCustomRange((r) => ({ ...r, endDate: e.target.value }))}
                className="h-9 rounded-lg bg-card border border-border text-foreground px-3 text-sm focus:outline-none" />
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Total Income</p>
              <p className="text-xl font-bold text-emerald-400">{isLoading ? "—" : fmt(s?.totalIncome ?? 0)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5" /> Total Expenses</p>
              <p className="text-xl font-bold text-red-400">{isLoading ? "—" : fmt(s?.totalExpenses ?? 0)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Net Income</p>
              <p className={cn("text-xl font-bold", (s?.netIncome ?? 0) >= 0 ? "text-foreground" : "text-red-400")}>{isLoading ? "—" : fmt(s?.netIncome ?? 0)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Transactions</p>
              <p className="text-xl font-bold text-foreground">{isLoading ? "—" : s?.transactionCount ?? 0}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card/70 border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground text-sm">Income by Category</h2>
              </div>
              {isLoading ? (
                <div className="p-5 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-6 bg-card/70 rounded animate-pulse" />)}</div>
              ) : incomeCats.length === 0 ? (
                <div className="px-5 py-8 text-center text-muted-foreground/80 text-sm">No income in this range.</div>
              ) : (
                <div className="divide-y divide-border">
                  {incomeCats.map((c: any) => (
                    <div key={c.name} className="px-5 py-3 flex items-center justify-between">
                      <span className="text-sm text-foreground/70">{c.name} <span className="text-muted-foreground/80">({c.count})</span></span>
                      <span className="text-sm font-medium text-emerald-400">{fmt(c.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card/70 border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground text-sm">Expenses by Category</h2>
              </div>
              {isLoading ? (
                <div className="p-5 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-6 bg-card/70 rounded animate-pulse" />)}</div>
              ) : expenseCats.length === 0 ? (
                <div className="px-5 py-8 text-center text-muted-foreground/80 text-sm">No expenses in this range.</div>
              ) : (
                <div className="divide-y divide-border">
                  {expenseCats.map((c: any) => (
                    <div key={c.name} className="px-5 py-3 flex items-center justify-between">
                      <span className="text-sm text-foreground/70">{c.name} <span className="text-muted-foreground/80">({c.count})</span></span>
                      <span className="text-sm font-medium text-red-400">{fmt(c.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground/70">This report is generated from your recorded transactions for informational purposes and isn't a substitute for professional tax advice.</p>
        </div>
      </div>
    </ProtectedLayout>
  );
}
