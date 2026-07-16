"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TrendingUp, Loader2, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/ui/theme-toggle";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenFromUrl = searchParams.get("token") || "";
  const emailFromUrl = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const usingToken = !!tokenFromUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(newPassword)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = { newPassword };
      if (usingToken) {
        body.token = tokenFromUrl;
      } else {
        body.email = email;
        body.otp = otp;
      }

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-bold text-foreground">FinFlow</span>
        </div>

        {success ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Password reset!</h1>
            <p className="text-muted-foreground text-sm">Taking you to login...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Reset your password</h1>
              <p className="text-muted-foreground text-sm">
                {usingToken
                  ? "Choose a new password for your account."
                  : "Enter the code we emailed you and choose a new password."}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!usingToken && (
                <>
                  <div>
                    <label htmlFor="email" className="text-foreground/70 text-sm mb-1.5 block">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full h-11 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500/50 focus:outline-none px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="otp" className="text-foreground/70 text-sm mb-1.5 block">6-digit code</label>
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      required
                      className="w-full h-11 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500/50 focus:outline-none px-3 text-sm tracking-[0.3em] text-center"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="newPassword" className="text-foreground/70 text-sm mb-1.5 block">New password</label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    className="w-full h-11 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500/50 focus:outline-none px-3 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground/60"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-muted-foreground/80 text-xs mt-1.5">
                  Must include uppercase, lowercase, a number, and a special character.
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="text-foreground/70 text-sm mb-1.5 block">Confirm new password</label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  minLength={8}
                  className="w-full h-11 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500/50 focus:outline-none px-3 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center transition-colors"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Resetting...</>
                ) : (
                  "Reset password"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Remembered it?{" "}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
