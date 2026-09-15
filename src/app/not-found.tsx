import Link from "next/link";
import { TrendingUp, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="font-bold text-lg">FinFlow</span>
        </div>

        <p className="text-7xl font-bold tracking-tight text-foreground/10 select-none mb-2">404</p>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Page not found</h1>
        <p className="text-sm text-foreground/60 mb-8">
          The page you're looking for doesn't exist or may have moved. Let's get you back on track.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/landing"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground/80 text-sm font-medium hover:bg-card/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
