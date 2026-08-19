import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://finance-frontend-kappa-liard.vercel.app";

// Public marketing pages are crawlable; every authenticated in-app route
// (dashboard, transactions, settings, etc.) and the API proxy are blocked —
// there's nothing for a search engine to index behind login, and letting
// bots hit those paths just wastes crawl budget.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/landing", "/login", "/register"],
        disallow: [
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
          "/verify-email",
          "/reset-password",
          "/forgot-password",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
