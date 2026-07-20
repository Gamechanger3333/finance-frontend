"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, X, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Contextual nudges keyed by section id. When a visitor scrolls a section
// into view (and the chat isn't already open), we surface a small tooltip
// suggesting a relevant question — this is the "suggests things as you
// scroll" behavior.
const SECTION_HINTS: Record<string, string> = {
  hero: "Curious how FinFlow's AI advisor works? Ask me anything.",
  features: "Want a quick rundown of what's included in each plan?",
  pricing: "Not sure which plan fits you? I can help you decide.",
  testimonials: "Wondering if FinFlow is right for your situation? Ask away.",
  cta: "Ready to get started? I can walk you through signing up.",
};

const DEFAULT_SUGGESTIONS = [
  "What does FinFlow cost?",
  "How does the AI advisor work?",
  "Is my data secure?",
];

export default function LandingAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm the FinFlow assistant. Ask me about features, pricing, or how to get started." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [hint, setHint] = useState<string | null>(null);
  const seenSections = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hintTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Watch each landing-page section and surface a one-time contextual hint
  // the first time it scrolls into view, as long as the chat panel is closed.
  useEffect(() => {
    const ids = Object.keys(SECTION_HINTS);
    const sections = ids
      .map((id) => (id === "hero" ? document.querySelector("section") : document.getElementById(id)))
      .filter(Boolean) as Element[];

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id || "hero";
          if (seenSections.current.has(id) || open) continue;
          seenSections.current.add(id);
          const text = SECTION_HINTS[id];
          if (!text) continue;
          setHint(text);
          if (hintTimeout.current) clearTimeout(hintTimeout.current);
          hintTimeout.current = setTimeout(() => setHint(null), 6000);
          break;
        }
      },
      { threshold: 0.4 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const openChat = (prefill?: string) => {
    setHint(null);
    setOpen(true);
    if (prefill) send(prefill);
  };

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/ai/landing-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "Sorry, I didn't catch that — could you rephrase?" }]);
      if (data.suggestions?.length) setSuggestions(data.suggestions);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I'm having trouble responding right now. Please try again in a moment." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[60] flex flex-col items-end gap-3">
      {/* Scroll-triggered contextual suggestion bubble */}
      <AnimatePresence>
        {hint && !open && (
          <motion.button
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            onClick={() => openChat(hint)}
            className="hidden sm:block max-w-[240px] text-left bg-card border border-emerald-500/30 rounded-2xl rounded-br-sm px-4 py-3 text-sm text-foreground/80 shadow-2xl hover:border-emerald-500/50 transition-colors"
          >
            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
              <Sparkles className="w-3 h-3" /> FinFlow Assistant
            </span>
            {hint}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="w-[340px] sm:w-[380px] h-[480px] flex flex-col bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 h-14 border-b border-border flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">FinFlow Assistant</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Ask about features or pricing</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground/80 hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-emerald-400" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed",
                      msg.role === "user" ? "bg-emerald-500/20 text-foreground rounded-br-sm" : "bg-accent text-foreground/80 rounded-bl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="bg-accent rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                    <div className="flex gap-1">
                      {[0, 150, 300].map((d) => (
                        <div key={d} className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-3 py-2 border-t border-border/70 flex-shrink-0">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {suggestions.slice(0, 4).map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={sending}
                    className="flex-shrink-0 text-[11px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 rounded-full px-2.5 py-1 hover:bg-emerald-500/15 transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="p-3 border-t border-border flex gap-2 flex-shrink-0"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={sending}
                className="flex-1 h-9 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="h-9 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-colors"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => (open ? setOpen(false) : openChat())}
        whileTap={{ scale: 0.94 }}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-2xl flex items-center justify-center transition-colors relative"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ opacity: 0, rotate: -45 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }}>
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span key="bot" initial={{ opacity: 0, rotate: 45 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }}>
              <Bot className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && hint && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-background" />
        )}
      </motion.button>
    </div>
  );
}