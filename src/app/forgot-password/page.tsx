"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, Loader2, KeyRound, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060a08] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-bold text-white">FinFlow</span>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Check your email</h1>
            <p className="text-white/40 text-sm mb-8">
              If an account exists for <span className="text-white/70">{email}</span>, we&apos;ve sent a password reset code and link. It expires in 15 minutes.
            </p>
            <Link
              href={`/reset-password?email=${encodeURIComponent(email)}`}
              className="inline-flex h-11 px-6 items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg font-medium transition-colors"
            >
              Enter reset code
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-6 h-6 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Forgot password?</h1>
              <p className="text-white/40 text-sm">No worries, we&apos;ll send you a reset code.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="text-white/70 text-sm mb-1.5 block">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full h-11 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none px-3 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center transition-colors"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  "Send reset code"
                )}
              </button>
            </form>
          </>
        )}

        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 mt-8 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Back to login
        </button>
      </div>
    </div>
  );
}
