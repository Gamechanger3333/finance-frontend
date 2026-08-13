"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "@/components/ui/theme-toggle";
import NavAuthButtons from "@/components/landing/NavAuthButtons";
import { useTheme } from "@/hooks/use-theme";

const navItems = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Reviews", href: "#testimonials" },
];

/**
 * Scoped, reusable "inverted" theme for the navbar only.
 *
 * The navbar is intentionally the visual inverse of the site theme:
 *   - Site in Dark mode  -> Navbar is pure white with pure black text
 *   - Site in Light mode -> Navbar is pure black with pure white text
 *
 * Rather than hand-coding every child element's colors, we override the same
 * CSS custom properties the rest of the app already reads (--background,
 * --foreground, --card, --card-foreground, --border) on this subtree only.
 * Everything inside — including shared components like ThemeToggle and
 * NavAuthButtons, which use bg-card / text-foreground / border-border --
 * automatically inherits the correct inverted colors with zero per-component
 * changes. Toggling the theme just swaps this one variable map, and the
 * `transition-colors` utilities below animate the change smoothly.
 */
function getNavThemeVars(theme: "light" | "dark"): CSSProperties {
  const vars =
    theme === "dark"
      ? {
          // Dark site theme -> white navbar, black content
          "--background": "0 0% 100%",
          "--foreground": "0 0% 0%",
          "--card": "0 0% 100%",
          "--card-foreground": "0 0% 0%",
          "--border": "0 0% 87%",
        }
      : {
          // Light site theme -> black navbar, white content
          "--background": "0 0% 0%",
          "--foreground": "0 0% 100%",
          "--card": "0 0% 0%",
          "--card-foreground": "0 0% 100%",
          "--border": "0 0% 24%",
        };
  return vars as CSSProperties;
}

export default function Navigation() {
  const { theme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navThemeVars = getNavThemeVars(theme);

  // Lock body scroll while the mobile side panel is open, and let only the
  // panel itself scroll internally if its content overflows.
  useEffect(() => {
    if (isMobileMenuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isMobileMenuOpen]);

  // Close the mobile panel if the viewport grows past the mobile breakpoint
  // while it's open, so it never gets left open behind the desktop nav.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={navThemeVars}
      className="fixed top-0 left-0 right-0 z-50 w-full bg-background transition-colors duration-500 ease-in-out"
    >
      {/* Full-width, edge-to-edge bar — no rounded corners, no shadow, just a
          hairline bottom border for separation from the page content. */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between h-16 border-b border-border transition-colors duration-500 ease-in-out">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-base lg:text-lg font-bold tracking-tight whitespace-nowrap text-foreground transition-colors duration-500 ease-in-out">
            FinFlow
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-9" aria-label="Main navigation">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="relative text-sm font-medium text-foreground/75 hover:text-emerald-500 transition-colors duration-200"
            >
              {item.name}
            </a>
          ))}

          <div className="flex items-center gap-3 ml-2">
            <ThemeToggle />
            <NavAuthButtons />
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden relative z-[70] flex h-9 w-9 cursor-pointer flex-col items-center justify-center gap-[6px] group"
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          <span className="h-px w-6 rounded-full bg-foreground/80 transition-all duration-300 ease-out" />
          <span className="h-px w-6 rounded-full bg-foreground/80 transition-all duration-300 ease-out group-hover:w-4" />
          <span className="h-px w-6 rounded-full bg-foreground/80 transition-all duration-300 ease-out" />
        </button>
      </div>

      {/* Mobile Menu — fixed side panel with the rest of the page visible
          and dimmed behind it. Inherits the same inverted nav theme vars
          from the header above, so it always matches the top bar. */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="md:hidden fixed inset-0 z-[55] bg-black/50 backdrop-blur-md"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden fixed inset-0 z-[58] bg-black/40 pointer-events-none"
              aria-hidden="true"
            />

            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-[60] flex w-[75%] max-w-[320px] flex-col overflow-y-auto bg-background transition-colors duration-500 ease-in-out [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Mobile navigation"
            >
              <div className="flex items-center justify-between px-6 h-16 border-b border-border transition-colors duration-500 ease-in-out">
                <Link
                  href="/"
                  className="flex items-center gap-2.5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-base font-bold tracking-tight text-foreground whitespace-nowrap transition-colors duration-500 ease-in-out">
                    FinFlow
                  </span>
                </Link>
                <button
                  className="cursor-pointer text-foreground/60 transition-colors hover:text-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col px-6 pt-3">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="relative py-2.5"
                  >
                    <a
                      href={item.href}
                      className="text-sm font-medium text-foreground transition-colors hover:text-emerald-500"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </a>
                    <div className="absolute inset-x-0 bottom-0 h-px bg-border/60 transition-colors duration-500 ease-in-out" />
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + navItems.length * 0.06, duration: 0.3 }}
                className="flex items-center justify-between gap-3 px-6 pt-5 mt-2 border-t border-border transition-colors duration-500 ease-in-out"
              >
                <div onClick={() => setIsMobileMenuOpen(false)}>
                  <NavAuthButtons />
                </div>
                <ThemeToggle />
              </motion.div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}