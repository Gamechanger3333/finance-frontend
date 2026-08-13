import type { Metadata } from "next";
import { Kumbh_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const kumbhSans = Kumbh_Sans({ subsets: ["latin"], variable: "--font-kumbh" });

export const metadata: Metadata = {
  title: "FinFlow – AI-Powered Finance Management",
  description: "Take control of your financial future with smart budgeting, real-time analytics, and AI-powered advice.",
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