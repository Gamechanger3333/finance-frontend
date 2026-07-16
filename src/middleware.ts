import { NextRequest, NextResponse } from "next/server";

const TOKEN_COOKIE = "finflow_token";

// Routes that require an authenticated session.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/budgets",
  "/goals",
  "/debts",
  "/analytics",
  "/reports",
  "/ai-assistant",
  "/bank-sync",
  "/receipts",
  "/recurring-bills",
  "/cashflow-forecast",
  "/savings-rules",
  "/household",
  "/settings",
];

// Auth pages a logged-in user shouldn't see again.
const AUTH_ONLY_PREFIXES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get(TOKEN_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAuthOnly = AUTH_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isProtected && !hasToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthOnly && hasToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/budgets/:path*",
    "/goals/:path*",
    "/debts/:path*",
    "/analytics/:path*",
    "/reports/:path*",
    "/ai-assistant/:path*",
    "/bank-sync/:path*",
    "/receipts/:path*",
    "/recurring-bills/:path*",
    "/cashflow-forecast/:path*",
    "/savings-rules/:path*",
    "/household/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
