"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TrendingUp, Loader2, MailCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const emailFromUrl = searchParams.get("email") || "";
  const tokenFromUrl = searchParams.get("token") || "";

  const [email] = useState(emailFromUrl);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [tokenVerifying, setTokenVerifying] = useState(!!tokenFromUrl);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-verify via the link token if present
  useEffect(() => {
    if (!tokenFromUrl) return;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenFromUrl }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Verification failed");
        if (data.token && data.user) {
          login(data.token, data.user);
          setSuccess(true);
          setTimeout(() => router.push("/dashboard"), 1200);
        } else if (data.alreadyVerified) {
          setSuccess(true);
          setTimeout(() => router.push("/login"), 1200);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setTokenVerifying(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleOtpChange = (idx: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[idx] = value.slice(-1);
    setOtp(next);
    if (value && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split("");
    while (next.length < 6) next.push("");
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Enter the full 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      if (data.token && data.user) {
        login(data.token, data.user);
      }
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setResendMsg("");
    setError("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend code");
      setResendMsg("A new code has been sent to your email.");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message);
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

        {tokenVerifying ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
            <p className="text-white/60 text-sm">Verifying your email...</p>
          </div>
        ) : success ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Email verified!</h1>
            <p className="text-white/40 text-sm">Redirecting you now...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <MailCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verify your email</h1>
              <p className="text-white/40 text-sm">
                We sent a 6-digit code{email ? <> to <span className="text-white/70">{email}</span></> : null}. Enter it below, or click the link in the email.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-sm text-red-400">
                {error}
              </div>
            )}
            {resendMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mb-4 text-sm text-emerald-300">
                {resendMsg}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 text-center text-xl font-bold rounded-lg bg-white/[0.04] border border-white/10 text-white focus:border-emerald-500/50 focus:outline-none"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center transition-colors"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                ) : (
                  "Verify email"
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-sm text-emerald-400 hover:text-emerald-300 disabled:text-white/30 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't get a code? Resend"}
              </button>
            </div>

            <p className="text-center text-sm text-white/40 mt-6">
              Wrong email?{" "}
              <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Start over
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
