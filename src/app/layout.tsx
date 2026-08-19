import type { Metadata } from "next";
import { Kumbh_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const kumbhSans = Kumbh_Sans({ subsets: ["latin"], variable: "--font-kumbh" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://finance-frontend-kappa-liard.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FinFlow – AI-Powered Personal Finance & Budgeting App",
    template: "%s | FinFlow",
  },
  description:
    "Take control of your financial future with FinFlow: smart budgeting, real-time analytics, debt payoff planning, and an AI financial advisor grounded in your own data.",
  keywords: [
    "personal finance app",
    "budgeting app",
    "AI financial advisor",
    "expense tracker",
    "debt payoff planner",
    "cash flow forecast",
    "money management software",
  ],
  authors: [{ name: "FinFlow" }],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "FinFlow",
    title: "FinFlow – AI-Powered Personal Finance & Budgeting App",
    description:
      "Smart budgeting, real-time analytics, debt payoff planning, and an AI financial advisor grounded in your own data.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FinFlow — AI-powered personal finance" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinFlow – AI-Powered Personal Finance & Budgeting App",
    description:
      "Smart budgeting, real-time analytics, debt payoff planning, and an AI financial advisor grounded in your own data.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Runs before paint so the correct theme class is applied with no flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem("finflow_theme");
                  var theme = stored === "light" || stored === "dark"
                    ? stored
                    : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
                  document.documentElement.classList.toggle("dark", theme === "dark");
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${kumbhSans.className} ${kumbhSans.variable}`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}