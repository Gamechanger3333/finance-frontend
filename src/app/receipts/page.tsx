"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { Camera, Upload, Loader2, ScanLine, Check, X, RotateCcw, ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedLayout from "@/components/layout/ProtectedLayout";


function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function parseReceiptText(text: string): { amount: number | null; merchant: string; date: string } {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const amountRegex = /\$?\s?(\d{1,5}(?:,\d{3})*\.\d{2})/g;
  const totalKeywords = /total|amount due|balance due|grand total/i;

  let bestAmount: number | null = null;
  for (const line of lines) {
    if (totalKeywords.test(line)) {
      const matches = Array.from(line.matchAll(amountRegex));
      if (matches.length) bestAmount = parseFloat(matches[matches.length - 1][1].replace(/,/g, ""));
    }
  }
  if (bestAmount === null) {
    const all = Array.from(text.matchAll(amountRegex)).map((m) => parseFloat(m[1].replace(/,/g, "")));
    if (all.length) bestAmount = Math.max(...all);
  }

  const merchant = lines.find((l) => l.length > 2 && l.length < 40 && !/^\d+$/.test(l) && !totalKeywords.test(l)) ?? "";

  let date = new Date().toISOString().slice(0, 10);
  const dm = text.match(/(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/);
  if (dm) {
    let [, m, d, y] = dm;
    if (y.length === 2) y = "20" + y;
    const candidate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    if (!Number.isNaN(new Date(candidate).getTime())) date = candidate;
  }

  return { amount: bestAmount, merchant, date };
}

export default function ReceiptsPage() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => apiGet("/api/categories") });
  const { data: transactions = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => apiGet("/api/transactions") });

  const createTx = useMutation({
    mutationFn: (data: any) => apiPost("/api/transactions", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState("");
  const [form, setForm] = useState<{ amount: string; description: string; categoryId: string; date: string } | null>(null);
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const expenseCategories = (categories as any[]).filter((c) => c.type === "expense" || c.type === "both");

  const handleFile = async (file: File) => {
    setImagePreview(URL.createObjectURL(file));
    setForm(null);
    setRawText("");
    setScanning(true);
    setProgress(0);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m: any) => { if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100)); },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();

      setRawText(data.text);
      const parsed = parseReceiptText(data.text);
      const defaultCat = expenseCategories.find((c: any) => c.name === "Shopping") ?? expenseCategories[0];
      setForm({
        amount: parsed.amount !== null ? String(parsed.amount) : "",
        description: parsed.merchant || "Scanned receipt",
        categoryId: defaultCat ? String(defaultCat.id) : "",
        date: parsed.date,
      });
    } catch (err: any) {
      showToast("Couldn't read that receipt — try a clearer photo or enter it manually.");
    } finally {
      setScanning(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setImagePreview(null);
    setForm(null);
    setRawText("");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirm = async () => {
    if (!form) return;
    try {
      await createTx.mutateAsync({
        type: "expense",
        amount: Number(form.amount),
        description: form.description,
        categoryId: Number(form.categoryId),
        date: form.date,
        source: "ocr",
        receiptText: rawText.slice(0, 4000),
      });
      showToast("Receipt logged!");
      reset();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const scannedTx = (transactions as any[]).filter((t) => t.source === "ocr").slice(0, 10);

  return (
    <ProtectedLayout>
      <div className="min-h-full">
        {toast && <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}

        <div>
          <div className="px-6 pt-8 pb-6">
            <h1 className="text-2xl font-bold text-foreground">Receipt Scanner</h1>
            <p className="text-foreground/60 text-sm mt-1">Snap a photo, we'll read the total and log it for you</p>
          </div>
        </div>

        <div className="px-6 pb-8 space-y-6 max-w-2xl">
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={onFileChange} className="hidden" id="receipt-upload" />

          {!imagePreview ? (
            <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center justify-center gap-3 bg-card/70 border-2 border-dashed border-border hover:border-emerald-500/30 rounded-xl p-12 text-center transition-colors">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Camera className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-foreground font-medium">Take or upload a photo</p>
                <p className="text-muted-foreground text-sm mt-1">We'll pull out the merchant, total, and date automatically</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                <Upload className="w-3.5 h-3.5" /> Choose a file
              </span>
            </label>
          ) : (
            <div className="bg-card/70 border border-border rounded-xl p-5">
              <div className="flex gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Receipt" className="w-28 h-36 object-cover rounded-lg border border-border flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {scanning ? (
                    <div className="flex flex-col items-start gap-2 h-full justify-center">
                      <div className="flex items-center gap-2 text-foreground/70 text-sm">
                        <ScanLine className="w-4 h-4 text-emerald-400 animate-pulse" /> Reading receipt... {progress}%
                      </div>
                      <div className="w-full h-1.5 bg-accent rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  ) : form ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-foreground/60 text-xs mb-1 block">Merchant</label>
                        <input value={form.description} onChange={(e) => setForm((f) => f && { ...f, description: e.target.value })}
                          className="w-full h-9 rounded-lg bg-accent border border-border text-foreground px-3 text-sm focus:outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-foreground/60 text-xs mb-1 block">Amount ($)</label>
                          <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => f && { ...f, amount: e.target.value })}
                            className="w-full h-9 rounded-lg bg-accent border border-border text-foreground px-3 text-sm focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-foreground/60 text-xs mb-1 block">Date</label>
                          <input type="date" value={form.date} onChange={(e) => setForm((f) => f && { ...f, date: e.target.value })}
                            className="w-full h-9 rounded-lg bg-accent border border-border text-foreground px-3 text-sm focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-foreground/60 text-xs mb-1 block">Category</label>
                        <select value={form.categoryId} onChange={(e) => setForm((f) => f && { ...f, categoryId: e.target.value })}
                          className="w-full h-9 rounded-lg bg-accent border border-border text-foreground text-sm px-3">
                          {expenseCategories.map((c: any) => <option key={c.id} value={c.id} className="bg-card">{c.name}</option>)}
                        </select>
                      </div>
                      {!form.amount && (
                        <p className="text-xs text-yellow-400/80">Couldn't confidently detect a total — double-check the amount before saving.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {!scanning && form && (
                <div className="flex gap-2 mt-4">
                  <button onClick={confirm} disabled={createTx.isPending || !form.amount || !form.categoryId}
                    className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors">
                    {createTx.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Log Expense
                  </button>
                  <button onClick={reset} className="h-10 px-4 bg-accent hover:bg-accent text-foreground/60 rounded-lg flex items-center gap-1.5 text-sm transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Retry
                  </button>
                </div>
              )}
              {!scanning && !form && (
                <button onClick={reset} className="mt-4 h-9 px-4 bg-accent hover:bg-accent text-foreground/60 rounded-lg flex items-center gap-1.5 text-sm transition-colors">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>
          )}

          <div className="bg-card/70 border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-emerald-400" />
              <h2 className="font-semibold text-foreground text-sm">Recently Scanned</h2>
            </div>
            {scannedTx.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground/80 text-sm">No scanned receipts yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {scannedTx.map((t: any) => (
                  <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground/70 truncate">{t.description || t.categoryName}</p>
                      <p className="text-xs text-muted-foreground/80">{t.date}</p>
                    </div>
                    <span className="text-sm font-medium text-foreground/80 flex-shrink-0 ml-3">{fmt(t.amount)}</span>
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
