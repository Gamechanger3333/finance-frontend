"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export default function NavAuthButtons() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="w-24 h-8 rounded-lg bg-accent animate-pulse" />;
  }

  if (user) {
    return (
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-sm bg-card border border-border hover:border-emerald-500/30 px-3 py-1.5 rounded-lg font-medium transition-colors"
      >
        <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {user.name?.[0]?.toUpperCase() ?? "U"}
        </span>
        {user.name?.split(" ")[0]}
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" className="text-sm text-foreground/70 hover:text-foreground px-3 py-1.5 rounded-lg transition-colors">Sign in</Link>
      <Link href="/register" className="text-sm bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-1.5 rounded-lg font-medium transition-colors">Get started</Link>
    </>
  );
}
