"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating scroll-navigation button.
 *
 * Behaves like a single toggling control: near the top of the page it shows
 * a down-arrow (scrolls one viewport down); once scrolled past `threshold`
 * it swaps to an up-arrow (scrolls back to top). Only one is ever visible
 * at a time.
 *
 * By default it listens on `window` scroll. If the scrollable element is a
 * different container (e.g. the <main> in AppShell, which owns its own
 * overflow-y-auto), pass a ref to that container via `targetRef`.
 */
export default function ScrollToTop({
  targetRef,
  threshold = 120,
  className,
  corner = "bottom-right",
  offset = 24,
}: {
  targetRef?: React.RefObject<HTMLElement>;
  threshold?: number;
  className?: string;
  /** Which corner to pin the button to. Use "bottom-left" to avoid clashing
   * with other bottom-right floating widgets (e.g. an AI assistant button). */
  corner?: "bottom-right" | "bottom-left";
  /** Distance in px from the edges. */
  offset?: number;
}) {
  const [pastThreshold, setPastThreshold] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el: HTMLElement | Window = targetRef?.current ?? window;

    const getScrollTop = () =>
      targetRef?.current ? targetRef.current.scrollTop : window.scrollY;

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        setPastThreshold(getScrollTop() > threshold);
        rafRef.current = null;
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      el.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetRef, threshold]);

  const scrollToTop = () => {
    if (targetRef?.current) {
      targetRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollDown = () => {
    const amount = (targetRef?.current?.clientHeight ?? window.innerHeight) * 0.9;
    if (targetRef?.current) {
      targetRef.current.scrollBy({ top: amount, behavior: "smooth" });
    } else {
      window.scrollBy({ top: amount, behavior: "smooth" });
    }
  };

  return (
    <button
      type="button"
      onClick={pastThreshold ? scrollToTop : scrollDown}
      aria-label={pastThreshold ? "Scroll to top" : "Scroll down"}
      title={pastThreshold ? "Scroll to top" : "Scroll down"}
      style={{
        position: "fixed",
        bottom: offset,
        ...(corner === "bottom-left" ? { left: offset } : { right: offset }),
      }}
      className={cn(
        "z-40 w-11 h-11 rounded-full flex items-center justify-center",
        "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400",
        "transition-all duration-200 opacity-100 pointer-events-auto",
        className
      )}
    >
      {pastThreshold ? (
        <ArrowUp className="w-5 h-5" />
      ) : (
        <ArrowDown className="w-5 h-5" />
      )}
    </button>
  );
}
