"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating "scroll to top" button.
 *
 * By default it listens on `window` scroll. If the scrollable element is a
 * different container (e.g. the <main> in AppShell, which owns its own
 * overflow-y-auto), pass a ref to that container via `targetRef`.
 */
export default function ScrollToTop({
  targetRef,
  threshold = 120,
  className,
}: {
  targetRef?: React.RefObject<HTMLElement>;
  threshold?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el: HTMLElement | Window = targetRef?.current ?? window;

    const getScrollTop = () =>
      targetRef?.current ? targetRef.current.scrollTop : window.scrollY;

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        setVisible(getScrollTop() > threshold);
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

  const handleClick = () => {
    if (targetRef?.current) {
      targetRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Scroll to top"
      title="Scroll to top"
      className={cn(
        "fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full flex items-center justify-center",
        "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400",
        "transition-all duration-200",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none",
        className
      )}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
